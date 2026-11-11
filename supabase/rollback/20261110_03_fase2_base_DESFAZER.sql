-- Desfaz a migração 20261110_03_fase2_base.sql (use só se algo der errado)
drop policy if exists barbearias_super on public.barbearias;

-- volta a função da barbearia para a versão simples
create or replace function public.minha_barbearia() returns uuid
language sql stable security definer set search_path = public as $$
  select barbearia_id from public.perfis where id = auth.uid()
$$;

alter table public.barbeiros drop column if exists cargo_id;
alter table public.perfis    drop column if exists grupo_id;

drop table if exists public.auditoria;
drop table if exists public.super_admin_contexto;
drop table if exists public.super_admins;
drop table if exists public.cargos;
drop table if exists public.grupo_permissoes;
drop table if exists public.grupos;
drop table if exists public.permissoes_catalogo;

drop function if exists public.semear_grupos_barbearia(uuid);
drop function if exists public.definir_barbearia_ativa(uuid);
drop function if exists public.registrar_auditoria(text, text, jsonb);
drop function if exists public.minhas_permissoes();
drop function if exists public.pode(text);
drop function if exists public.sou_admin();
drop function if exists public.sou_super_admin();
