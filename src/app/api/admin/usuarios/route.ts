import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getAdmin } from '@/lib/supabase-admin'

/**
 * Alterar grupo, cargo e situação (ativo) de um usuário da equipe.
 * Regras:
 *  - quem chama precisa da permissão `admin.usuarios`;
 *  - o alvo e o grupo/cargo escolhidos precisam ser da MESMA barbearia de quem chama;
 *  - só um administrador pode colocar alguém num grupo administrador;
 *  - ninguém altera o próprio grupo nem se desativa (evita trancar a barbearia).
 */
export async function PATCH(request: NextRequest) {
  const sessao = await createServerSupabase()
  const { data: { user } } = await sessao.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: pode } = await sessao.rpc('pode', { p_acao: 'admin.usuarios' })
  if (pode !== true) return NextResponse.json({ error: 'Sem permissão para gerenciar usuários.' }, { status: 403 })

  const corpo = await request.json().catch(() => null) as { id?: string; grupo_id?: string | null; cargo_id?: string | null; ativo?: boolean } | null
  if (!corpo?.id) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

  const { data: barbeariaId } = await sessao.rpc('minha_barbearia')
  const { data: souAdmin } = await sessao.rpc('sou_admin')
  const admin = getAdmin()

  const { data: alvo } = await admin.from('perfis').select('id, barbearia_id, role').eq('id', corpo.id).maybeSingle()
  if (!alvo || alvo.barbearia_id !== barbeariaId) {
    return NextResponse.json({ error: 'Usuário não encontrado nesta barbearia.' }, { status: 404 })
  }
  if (alvo.role === 'cliente') {
    return NextResponse.json({ error: 'Clientes não fazem parte da equipe.' }, { status: 400 })
  }
  if (corpo.id === user.id && (corpo.grupo_id !== undefined || corpo.ativo === false)) {
    return NextResponse.json({ error: 'Você não pode alterar o próprio grupo nem se desativar.' }, { status: 400 })
  }

  const atualizacaoPerfil: Record<string, unknown> = {}
  const detalhe: Record<string, unknown> = { usuario_id: corpo.id }

  if (corpo.grupo_id !== undefined) {
    if (corpo.grupo_id !== null) {
      const { data: grupo } = await admin.from('grupos').select('id, barbearia_id, administrador, ativo, nome').eq('id', corpo.grupo_id).maybeSingle()
      if (!grupo || grupo.barbearia_id !== barbeariaId || !grupo.ativo) {
        return NextResponse.json({ error: 'Grupo inválido.' }, { status: 400 })
      }
      if (grupo.administrador && souAdmin !== true) {
        return NextResponse.json({ error: 'Só um administrador pode colocar alguém no grupo Administrador.' }, { status: 403 })
      }
      detalhe.grupo = grupo.nome
    }
    atualizacaoPerfil.grupo_id = corpo.grupo_id
  }
  if (corpo.ativo !== undefined) {
    atualizacaoPerfil.ativo = corpo.ativo
    detalhe.ativo = corpo.ativo
  }
  if (Object.keys(atualizacaoPerfil).length) {
    const { error } = await admin.from('perfis').update(atualizacaoPerfil).eq('id', corpo.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (corpo.cargo_id !== undefined) {
    if (corpo.cargo_id !== null) {
      const { data: cargo } = await admin.from('cargos').select('id, barbearia_id, nome').eq('id', corpo.cargo_id).maybeSingle()
      if (!cargo || cargo.barbearia_id !== barbeariaId) return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 })
      detalhe.cargo = cargo.nome
    }
    const { error } = await admin.from('barbeiros').update({ cargo_id: corpo.cargo_id }).eq('perfil_id', corpo.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sessao.rpc('registrar_auditoria', { p_acao: 'usuario.alterar', p_entidade: 'perfis', p_detalhe: detalhe })
  return NextResponse.json({ success: true })
}
