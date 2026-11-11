import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getAdmin } from '@/lib/supabase-admin'

/** Criar uma nova barbearia (só o super admin). Já nasce com grupos, permissões padrão e cargos. */
export async function POST(request: NextRequest) {
  const sessao = await createServerSupabase()
  const { data: { user } } = await sessao.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: ehSuper } = await sessao.rpc('sou_super_admin')
  if (ehSuper !== true) return NextResponse.json({ error: 'Apenas o super admin.' }, { status: 403 })

  const corpo = await request.json().catch(() => null) as { nome?: string; slug?: string } | null
  const nome = corpo?.nome?.trim()
  const slug = corpo?.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!nome || !slug) return NextResponse.json({ error: 'Informe nome e endereço (slug).' }, { status: 400 })

  const admin = getAdmin()
  const { data: existente } = await admin.from('barbearias').select('id').eq('slug', slug).maybeSingle()
  if (existente) return NextResponse.json({ error: 'Já existe uma barbearia com esse endereço.' }, { status: 400 })

  const { data: nova, error } = await admin.from('barbearias').insert({ nome, slug, ativo: true }).select('id').single()
  if (error || !nova) return NextResponse.json({ error: error?.message || 'Erro ao criar.' }, { status: 500 })

  const { error: erroSemente } = await admin.rpc('semear_grupos_barbearia', { p_barbearia: nova.id })
  if (erroSemente) {
    await admin.from('barbearias').delete().eq('id', nova.id)
    return NextResponse.json({ error: erroSemente.message }, { status: 500 })
  }

  await admin.from('auditoria').insert({
    barbearia_id: nova.id, usuario_id: user.id, acao: 'super_admin.criar_barbearia', entidade: 'barbearias', detalhe: { nome, slug },
  })
  return NextResponse.json({ success: true, id: nova.id })
}
