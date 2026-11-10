-- Permite que a tela de Configurações funcione.
-- Antes: "configuracoes" tinha RLS ativado e NENHUMA policy (nada era lido nem salvo),
-- e "barbearias" só tinha policy de leitura (o UPDATE do nome/endereço era ignorado em silêncio).
-- Esta migração é apenas aditiva: não remove nem altera nenhuma policy existente.

create policy "configuracoes_leitura"
  on public.configuracoes
  for select
  to authenticated
  using (
    barbearia_id in (select p.barbearia_id from public.perfis p where p.id = auth.uid())
  );

create policy "configuracoes_gestao"
  on public.configuracoes
  for all
  to authenticated
  using (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.role = 'gestao' and p.barbearia_id = configuracoes.barbearia_id
    )
  )
  with check (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.role = 'gestao' and p.barbearia_id = configuracoes.barbearia_id
    )
  );

create policy "barbearias_gestao_update"
  on public.barbearias
  for update
  to authenticated
  using (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.role = 'gestao' and p.barbearia_id = barbearias.id
    )
  )
  with check (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.role = 'gestao' and p.barbearia_id = barbearias.id
    )
  );
