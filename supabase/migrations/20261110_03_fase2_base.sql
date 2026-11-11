-- ============================================================================
-- FASE 2 — Base multi-barbearia, grupos/permissões editáveis, cargos,
-- super admin e auditoria.  (docs/FASE2_DESENHO.md)
-- MIGRAÇÃO ADITIVA: não remove nem altera regras (RLS) existentes.
-- Desfazer: supabase/rollback/20261110_03_fase2_base_DESFAZER.sql
-- ============================================================================

-- ── 1. Barbearia ────────────────────────────────────────────────────────────
alter table public.barbearias add column if not exists logo_url text;
alter table public.barbearias add column if not exists plano text not null default 'teste';
alter table public.barbearias add column if not exists fuso text not null default 'America/Sao_Paulo';
alter table public.barbearias add column if not exists modulos_habilitados jsonb not null default '{}'::jsonb;
alter table public.barbearias add column if not exists config jsonb not null default '{}'::jsonb;
create unique index if not exists barbearias_slug_uniq on public.barbearias (slug) where slug is not null;

-- ── 2. Tabelas novas ────────────────────────────────────────────────────────
create table if not exists public.permissoes_catalogo (
  acao      text primary key,
  modulo    text not null,
  rotulo    text not null,
  descricao text,
  ordem     int not null default 0
);

create table if not exists public.grupos (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  nome          text not null,
  descricao     text,
  administrador boolean not null default false,
  sistema       boolean not null default false,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  unique (barbearia_id, nome)
);

create table if not exists public.grupo_permissoes (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  acao     text not null references public.permissoes_catalogo(acao) on delete cascade,
  primary key (grupo_id, acao)
);

create table if not exists public.cargos (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  nome          text not null,
  descricao     text,
  ordem         int not null default 0,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  unique (barbearia_id, nome)
);

create table if not exists public.super_admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

create table if not exists public.super_admin_contexto (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  barbearia_id   uuid not null references public.barbearias(id) on delete cascade,
  atualizado_em  timestamptz not null default now()
);

create table if not exists public.auditoria (
  id            bigserial primary key,
  barbearia_id  uuid references public.barbearias(id) on delete set null,
  usuario_id    uuid,
  acao          text not null,
  entidade      text,
  detalhe       jsonb,
  criado_em     timestamptz not null default now()
);
create index if not exists auditoria_barbearia_idx on public.auditoria (barbearia_id, criado_em desc);

alter table public.perfis    add column if not exists grupo_id uuid references public.grupos(id) on delete set null;
alter table public.barbeiros add column if not exists cargo_id uuid references public.cargos(id) on delete set null;

-- ── 3. Funções ──────────────────────────────────────────────────────────────
create or replace function public.sou_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.super_admins where user_id = auth.uid())
$$;

-- Super admin enxerga a barbearia que escolheu; os demais, a do próprio perfil.
-- Sem escolha feita, o comportamento é idêntico ao anterior.
create or replace function public.minha_barbearia() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select c.barbearia_id from public.super_admin_contexto c
      where c.user_id = auth.uid()
        and exists (select 1 from public.super_admins s where s.user_id = auth.uid())),
    (select barbearia_id from public.perfis where id = auth.uid())
  )
$$;

create or replace function public.sou_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_super_admin() or exists (
    select 1 from public.perfis p
    left join public.grupos g on g.id = p.grupo_id and g.ativo
    where p.id = auth.uid() and p.ativo
      and (coalesce(g.administrador, false) or (p.grupo_id is null and p.role = 'gestao'))
  )
$$;

create or replace function public.pode(p_acao text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_admin() or exists (
    select 1 from public.perfis p
    join public.grupos g on g.id = p.grupo_id and g.ativo
    join public.grupo_permissoes gp on gp.grupo_id = g.id
    where p.id = auth.uid() and p.ativo and gp.acao = p_acao
  )
$$;

create or replace function public.minhas_permissoes() returns text[]
language sql stable security definer set search_path = public as $$
  select case
    when public.sou_admin() then (select coalesce(array_agg(acao order by ordem), '{}') from public.permissoes_catalogo)
    else coalesce((
      select array_agg(gp.acao)
      from public.perfis p
      join public.grupos g on g.id = p.grupo_id and g.ativo
      join public.grupo_permissoes gp on gp.grupo_id = g.id
      where p.id = auth.uid() and p.ativo
    ), '{}')
  end
$$;

create or replace function public.registrar_auditoria(p_acao text, p_entidade text, p_detalhe jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.auditoria (barbearia_id, usuario_id, acao, entidade, detalhe)
  values (public.minha_barbearia(), auth.uid(), p_acao, p_entidade, p_detalhe)
$$;

create or replace function public.definir_barbearia_ativa(p_barbearia uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_super_admin() then
    raise exception 'Apenas o super admin pode trocar de barbearia.';
  end if;
  insert into public.super_admin_contexto (user_id, barbearia_id) values (auth.uid(), p_barbearia)
  on conflict (user_id) do update set barbearia_id = excluded.barbearia_id, atualizado_em = now();
  insert into public.auditoria (barbearia_id, usuario_id, acao, entidade, detalhe)
  values (p_barbearia, auth.uid(), 'super_admin.trocar_barbearia', 'barbearias', jsonb_build_object('barbearia_id', p_barbearia));
end $$;

-- Cria os grupos, permissões padrão e cargos de uma barbearia (só insere o que não existe).
create or replace function public.semear_grupos_barbearia(p_barbearia uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  g_admin uuid; g_ger uuid; g_coord uuid; g_lider uuid; g_proc uuid; g_barb uuid;
begin
  insert into public.grupos (barbearia_id, nome, descricao, administrador, sistema)
    values (p_barbearia, 'Administrador', 'Acesso total ao sistema da barbearia.', true, true)
    on conflict (barbearia_id, nome) do nothing returning id into g_admin;

  insert into public.grupos (barbearia_id, nome, descricao)
    values (p_barbearia, 'Gerente', 'Gestão do dia a dia, sem administrar usuários e grupos.')
    on conflict (barbearia_id, nome) do nothing returning id into g_ger;
  if g_ger is not null then
    insert into public.grupo_permissoes (grupo_id, acao)
      select g_ger, acao from public.permissoes_catalogo where acao not like 'admin.%' on conflict do nothing;
  end if;

  insert into public.grupos (barbearia_id, nome, descricao)
    values (p_barbearia, 'Coordenador', 'Liderança: acompanha equipe e agenda.')
    on conflict (barbearia_id, nome) do nothing returning id into g_coord;
  insert into public.grupos (barbearia_id, nome, descricao)
    values (p_barbearia, 'Líder de equipe', 'Liderança: acompanha a equipe.')
    on conflict (barbearia_id, nome) do nothing returning id into g_lider;
  insert into public.grupos (barbearia_id, nome, descricao)
    values (p_barbearia, 'Líder de processos', 'Liderança: processos e qualidade.')
    on conflict (barbearia_id, nome) do nothing returning id into g_proc;
  insert into public.grupo_permissoes (grupo_id, acao)
    select t.g, p.a from (values (g_coord), (g_lider), (g_proc)) as t(g)
    cross join (values ('area.gestao'), ('area.barbeiro'), ('dashboard.ver'), ('agenda.ver'), ('agenda.editar'),
                       ('barbeiros.ver'), ('clientes.ver'), ('servicos.ver'), ('produtos.ver')) as p(a)
    where t.g is not null
    on conflict do nothing;

  insert into public.grupos (barbearia_id, nome, descricao, sistema)
    values (p_barbearia, 'Barbeiro', 'Atende na cadeira e vê a própria agenda.', true)
    on conflict (barbearia_id, nome) do nothing returning id into g_barb;
  if g_barb is not null then
    insert into public.grupo_permissoes (grupo_id, acao) values (g_barb, 'area.barbeiro') on conflict do nothing;
  end if;

  insert into public.cargos (barbearia_id, nome, descricao, ordem) values
    (p_barbearia, 'Barbeiro', 'Barbeiro de cadeira.', 1),
    (p_barbearia, 'Líder de processos', 'Responsável por processos e qualidade.', 2),
    (p_barbearia, 'Líder de equipe', 'Responsável por acompanhar a equipe.', 3),
    (p_barbearia, 'Coordenador', 'Coordena a operação.', 4)
  on conflict (barbearia_id, nome) do nothing;
end $$;
revoke all on function public.semear_grupos_barbearia(uuid) from public, anon, authenticated;

-- ── 4. Catálogo de permissões (cada módulo novo acrescenta as suas) ─────────
insert into public.permissoes_catalogo (acao, modulo, rotulo, descricao, ordem) values
  ('area.gestao',        'Acesso',         'Entrar na área de gestão',        'Abre o painel de gestão.', 10),
  ('area.barbeiro',      'Acesso',         'Entrar na área do barbeiro',      'Abre o painel do barbeiro.', 11),
  ('dashboard.ver',      'Dashboard',      'Ver o dashboard',                 'Cartões e indicadores da página inicial.', 20),
  ('agenda.ver',         'Agenda',         'Ver a agenda',                    'Visualizar agendamentos.', 30),
  ('agenda.editar',      'Agenda',         'Criar e alterar agendamentos',    'Agendar, remarcar, cancelar, confirmar.', 31),
  ('barbeiros.ver',      'Barbeiros',      'Ver barbeiros',                   'Lista e perfil dos barbeiros.', 40),
  ('barbeiros.editar',   'Barbeiros',      'Cadastrar e alterar barbeiros',   'Criar, editar, ativar e desativar.', 41),
  ('servicos.ver',       'Serviços',       'Ver serviços',                    'Tabela de serviços e preços.', 50),
  ('servicos.editar',    'Serviços',       'Cadastrar e alterar serviços',    'Criar, editar, preço e categoria.', 51),
  ('produtos.ver',       'Produtos',       'Ver produtos',                    'Lista de produtos.', 60),
  ('produtos.editar',    'Produtos',       'Cadastrar e alterar produtos',    'Criar, editar, estoque e preço.', 61),
  ('clientes.ver',       'Clientes',       'Ver clientes',                    'Lista e ficha dos clientes.', 70),
  ('clientes.editar',    'Clientes',       'Cadastrar e alterar clientes',    'Criar e editar clientes.', 71),
  ('financeiro.ver',     'Financeiro',     'Ver o financeiro',                'Faturamento e resultados.', 80),
  ('configuracoes.ver',  'Configurações',  'Ver as configurações',            'Abrir as configurações da barbearia.', 90),
  ('configuracoes.editar','Configurações', 'Alterar as configurações',        'Horários, dados e aparência.', 91),
  ('admin.usuarios',     'Administração',  'Gerenciar usuários',              'Criar usuários, escolher grupo, ativar/desativar.', 100),
  ('admin.grupos',       'Administração',  'Gerenciar grupos e permissões',   'Criar grupos e marcar o que cada um pode.', 101),
  ('admin.cargos',       'Administração',  'Gerenciar cargos',                'Cadastro de cargos/níveis.', 102),
  ('admin.auditoria',    'Administração',  'Ver o histórico de alterações',   'Auditoria de ações sensíveis.', 103)
on conflict (acao) do update set modulo = excluded.modulo, rotulo = excluded.rotulo, descricao = excluded.descricao, ordem = excluded.ordem;

-- ── 5. Segurança (RLS) das tabelas novas ────────────────────────────────────
alter table public.permissoes_catalogo  enable row level security;
alter table public.grupos               enable row level security;
alter table public.grupo_permissoes     enable row level security;
alter table public.cargos               enable row level security;
alter table public.super_admins         enable row level security;
alter table public.super_admin_contexto enable row level security;
alter table public.auditoria            enable row level security;

drop policy if exists catalogo_leitura on public.permissoes_catalogo;
create policy catalogo_leitura on public.permissoes_catalogo for select to authenticated using (true);

drop policy if exists grupos_leitura on public.grupos;
create policy grupos_leitura on public.grupos for select to authenticated
  using (barbearia_id = public.minha_barbearia());
drop policy if exists grupos_escrita on public.grupos;
create policy grupos_escrita on public.grupos for insert to authenticated
  with check (barbearia_id = public.minha_barbearia() and public.pode('admin.grupos') and administrador = false);
drop policy if exists grupos_edicao on public.grupos;
create policy grupos_edicao on public.grupos for update to authenticated
  using (barbearia_id = public.minha_barbearia() and public.pode('admin.grupos'))
  with check (barbearia_id = public.minha_barbearia() and public.pode('admin.grupos'));
drop policy if exists grupos_remocao on public.grupos;
create policy grupos_remocao on public.grupos for delete to authenticated
  using (barbearia_id = public.minha_barbearia() and public.pode('admin.grupos') and sistema = false);

drop policy if exists gperm_leitura on public.grupo_permissoes;
create policy gperm_leitura on public.grupo_permissoes for select to authenticated
  using (exists (select 1 from public.grupos g where g.id = grupo_id and g.barbearia_id = public.minha_barbearia()));
drop policy if exists gperm_escrita on public.grupo_permissoes;
create policy gperm_escrita on public.grupo_permissoes for all to authenticated
  using (public.pode('admin.grupos') and exists (select 1 from public.grupos g where g.id = grupo_id and g.barbearia_id = public.minha_barbearia() and g.administrador = false))
  with check (public.pode('admin.grupos') and exists (select 1 from public.grupos g where g.id = grupo_id and g.barbearia_id = public.minha_barbearia() and g.administrador = false));

drop policy if exists cargos_leitura on public.cargos;
create policy cargos_leitura on public.cargos for select to authenticated
  using (barbearia_id = public.minha_barbearia());
drop policy if exists cargos_escrita on public.cargos;
create policy cargos_escrita on public.cargos for all to authenticated
  using (barbearia_id = public.minha_barbearia() and public.pode('admin.cargos'))
  with check (barbearia_id = public.minha_barbearia() and public.pode('admin.cargos'));

drop policy if exists super_admins_proprio on public.super_admins;
create policy super_admins_proprio on public.super_admins for select to authenticated using (user_id = auth.uid());
drop policy if exists super_contexto_proprio on public.super_admin_contexto;
create policy super_contexto_proprio on public.super_admin_contexto for select to authenticated using (user_id = auth.uid());

drop policy if exists auditoria_leitura on public.auditoria;
create policy auditoria_leitura on public.auditoria for select to authenticated
  using ((barbearia_id = public.minha_barbearia() and public.pode('admin.auditoria')) or public.sou_super_admin());

-- Super admin lê e administra todas as barbearias
drop policy if exists barbearias_super on public.barbearias;
create policy barbearias_super on public.barbearias for all to authenticated
  using (public.sou_super_admin()) with check (public.sou_super_admin());

-- ── 6. Dados iniciais da Don Jhones ─────────────────────────────────────────
select public.semear_grupos_barbearia(id) from public.barbearias;

-- Quem já existe entra no grupo certo (a coluna role continua valendo como área de entrada)
update public.perfis p set grupo_id = g.id
  from public.grupos g
 where p.grupo_id is null and g.barbearia_id = p.barbearia_id
   and ((p.role = 'gestao' and g.nome = 'Administrador') or (p.role = 'barbeiro' and g.nome = 'Barbeiro'));

update public.barbeiros b set cargo_id = c.id
  from public.cargos c
 where b.cargo_id is null and c.barbearia_id = b.barbearia_id and c.nome = 'Barbeiro';

-- O dono do sistema (Diogo) vira super admin
insert into public.super_admins (user_id) values ('47c58d14-144c-4ac9-a114-d41df6dc0bf1') on conflict do nothing;
