-- ============================================================================
-- PROPOSTA — NÃO APLICADA. Revisar e testar antes de rodar em produção.
-- ============================================================================
-- Problemas encontrados nas policies atuais (RLS):
--   1. perfis: policy "perfis_acesso" tem USING (true) para o papel "public"
--      => qualquer pessoa (inclusive sem login) consegue LER e APAGAR perfis.
--   2. tags / cliente_tags: USING (true) para "public" => qualquer um altera.
--   3. agendamentos e clientes: "agendamentos_barbearia" e "clientes_gestao"
--      liberam ALL para QUALQUER usuário logado da barbearia. Ou seja, um usuário
--      com perfil "cliente" consegue ler e alterar os dados de todos os clientes
--      (e-mail, telefone, CPF) e todos os agendamentos.
--
-- O app já foi ajustado para funcionar com estas regras mais restritas:
--   * cliente lê apenas os próprios agendamentos; criação e cancelamento passam
--     pelas rotas /api/cliente/* (servidor, com verificação de dono e disponibilidade);
--   * barbeiro lê/atualiza apenas os próprios agendamentos;
--   * gestão continua com acesso total à própria barbearia.
-- ============================================================================

-- Funções auxiliares (SECURITY DEFINER evita recursão de RLS ao consultar "perfis")
create or replace function public.meu_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.perfis where id = auth.uid()
$$;

create or replace function public.minha_barbearia() returns uuid
language sql stable security definer set search_path = public as $$
  select barbearia_id from public.perfis where id = auth.uid()
$$;

create or replace function public.meu_barbeiro_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.barbeiros where perfil_id = auth.uid() limit 1
$$;

create or replace function public.meu_cliente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.clientes where perfil_id = auth.uid() limit 1
$$;

-- 1. perfis ------------------------------------------------------------------
drop policy if exists "perfis_acesso" on public.perfis;

create policy "perfis_leitura" on public.perfis for select to authenticated
  using (id = auth.uid() or (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia())
         or barbearia_id = public.minha_barbearia());

create policy "perfis_escrita_gestao" on public.perfis for all to authenticated
  using (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia())
  with check (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia());

create policy "perfis_atualiza_proprio" on public.perfis for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.meu_role()); -- não permite trocar o próprio papel

-- 2. tags --------------------------------------------------------------------
drop policy if exists "Permitir tudo em tags" on public.tags;
drop policy if exists "Permitir tudo em cliente_tags" on public.cliente_tags;

create policy "tags_gestao" on public.tags for all to authenticated
  using (public.meu_role() = 'gestao') with check (public.meu_role() = 'gestao');
create policy "cliente_tags_gestao" on public.cliente_tags for all to authenticated
  using (public.meu_role() = 'gestao') with check (public.meu_role() = 'gestao');

-- 3. agendamentos ------------------------------------------------------------
drop policy if exists "agendamentos_barbearia" on public.agendamentos;

create policy "agendamentos_gestao" on public.agendamentos for all to authenticated
  using (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia())
  with check (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia());

create policy "agendamentos_barbeiro" on public.agendamentos for select to authenticated
  using (barbeiro_id = public.meu_barbeiro_id());
create policy "agendamentos_barbeiro_atualiza" on public.agendamentos for update to authenticated
  using (barbeiro_id = public.meu_barbeiro_id())
  with check (barbeiro_id = public.meu_barbeiro_id());

create policy "agendamentos_cliente" on public.agendamentos for select to authenticated
  using (cliente_id = public.meu_cliente_id());

-- 4. clientes ----------------------------------------------------------------
drop policy if exists "clientes_gestao" on public.clientes;

create policy "clientes_gestao" on public.clientes for all to authenticated
  using (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia())
  with check (public.meu_role() = 'gestao' and barbearia_id = public.minha_barbearia());

create policy "clientes_proprio" on public.clientes for select to authenticated
  using (perfil_id = auth.uid());

create policy "clientes_do_barbeiro" on public.clientes for select to authenticated
  using (id in (select a.cliente_id from public.agendamentos a where a.barbeiro_id = public.meu_barbeiro_id()));

-- 5. histórico e descontos dos agendamentos (somente gestão e barbeiro dono) -----
drop policy if exists "hist_barbearia" on public.agendamento_historico;
drop policy if exists "desc_barbearia" on public.agendamento_descontos;

create policy "hist_gestao" on public.agendamento_historico for all to authenticated
  using (public.meu_role() = 'gestao') with check (public.meu_role() = 'gestao');
create policy "desc_gestao" on public.agendamento_descontos for all to authenticated
  using (public.meu_role() = 'gestao') with check (public.meu_role() = 'gestao');
