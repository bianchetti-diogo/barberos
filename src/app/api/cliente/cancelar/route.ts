import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabase-admin'
import { getUsuarioAtual } from '@/lib/supabase-server'

// POST /api/cliente/cancelar  { id }
export async function POST(request: NextRequest) {
  try {
    const usuario = await getUsuarioAtual()
    if (!usuario?.barbearia_id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = getAdmin()
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Agendamento não informado.' }, { status: 400 })

    const { data: cliente } = await admin
      .from('clientes')
      .select('id')
      .eq('perfil_id', usuario.userId)
      .maybeSingle()
    if (!cliente) return NextResponse.json({ error: 'Cadastro de cliente não encontrado.' }, { status: 404 })

    // Só é possível cancelar os próprios agendamentos
    const { data: ag } = await admin
      .from('agendamentos')
      .select('id, status, data_hora')
      .eq('id', id)
      .eq('cliente_id', cliente.id)
      .maybeSingle()
    if (!ag) return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
    if (ag.status !== 'pendente' && ag.status !== 'confirmado') {
      return NextResponse.json({ error: 'Este agendamento não pode mais ser cancelado.' }, { status: 400 })
    }

    // Respeita o prazo mínimo de cancelamento configurado pela barbearia
    const { data: cfgs } = await admin
      .from('configuracoes')
      .select('prazo_cancelamento_horas')
      .eq('barbearia_id', usuario.barbearia_id)
      .limit(1)
    const prazoHoras = Number(cfgs?.[0]?.prazo_cancelamento_horas ?? 2)
    const faltamMs = new Date(ag.data_hora).getTime() - Date.now()
    if (faltamMs < prazoHoras * 3600000) {
      return NextResponse.json(
        { error: `O cancelamento precisa ser feito com ${prazoHoras}h de antecedência. Fale com a barbearia.` },
        { status: 400 }
      )
    }

    const { error } = await admin.from('agendamentos').update({ status: 'cancelado' }).eq('id', ag.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await admin.from('agendamento_historico').insert({
      agendamento_id: ag.id,
      campo_alterado: 'status',
      valor_anterior: ag.status,
      valor_novo: 'cancelado',
      motivo: 'Cancelado pelo cliente',
      alterado_por: usuario.userId,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro interno.' }, { status: 500 })
  }
}
