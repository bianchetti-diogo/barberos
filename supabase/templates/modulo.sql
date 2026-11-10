-- ============================================================================
-- MODELO DE TABELA PARA MÓDULOS
-- Troque "mod_modelo_registros" pelo nome do seu módulo (sempre com prefixo mod_<id>_).
-- Rode no Supabase (SQL Editor) ou crie uma migração em supabase/migrations/.
-- ============================================================================

create table if not exists public.mod_modelo_registros (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  -- campos do módulo:
  descricao     text not null,
  valor         numeric not null default 0,
  barbeiro_id   uuid references public.barbeiros(id) on delete set null,
  criado_em     timestamptz not null default now()
);

create index if not exists mod_modelo_registros_barbearia_idx
  on public.mod_modelo_registros (barbearia_id);

-- SEMPRE ativar RLS. Sem policy, ninguém lê nem grava.
alter table public.mod_modelo_registros enable row level security;

-- Funções auxiliares já existentes no banco:
--   public.meu_role()          -> 'gestao' | 'barbeiro' | 'cliente'
--   public.minha_barbearia()   -> barbearia do usuário logado
--   public.meu_barbeiro_id()   -> id do barbeiro logado (ou null)

-- Gestão: acesso total aos registros da própria barbearia
create policy "mod_modelo_gestao" on public.mod_modelo_registros
  for all to authenticated
  using (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia())
  with check (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia());

-- Barbeiro: lê e cria apenas os próprios registros (remova se o módulo for só da gestão)
create policy "mod_modelo_barbeiro_leitura" on public.mod_modelo_registros
  for select to authenticated
  using (public.meu_role() = 'barbeiro' and barbeiro_id = public.meu_barbeiro_id());

create policy "mod_modelo_barbeiro_insere" on public.mod_modelo_registros
  for insert to authenticated
  with check (
    public.meu_role() = 'barbeiro'
    and barbearia_id = public.minha_barbearia()
    and barbeiro_id = public.meu_barbeiro_id()
  );
