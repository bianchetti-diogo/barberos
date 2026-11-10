import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabase-admin'
import { getUsuarioAtual } from '@/lib/supabase-server'
import { calcularSlots, dataHoraISO } from '@/lib/disponibilidade'

// POST /api/cliente/agendar  { servicos_ids, barbeiro_id?, data, hora, observacoes? }
export async function POST(request: NextRequest) {
  try {
    const usuario = await getUsuarioAtual()
    if (!usuario?.barbearia_id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = getAdmin()
    const body = await request.json()
    const servicosIds: string[] = Array.isArray(body.servicos_ids) ? body.servicos_ids : []
    const barbeiroPedido: string | null = body.barbeiro_id || null
    const data = String(body.data || '')
    const hora = String(body.hora || '')
    const observacoes = String(body.observacoes || '').trim().slice(0, 500)

    if (servicosIds.length === 0) return NextResponse.json({ error: 'Escolha ao menos um serviço.' }, { status: 400 })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
      return NextResponse.json({ error: 'Data ou horário inválido.' }, { status: 400 })
    }

    // Cliente vinculado ao usuário logado
    const { data: cliente } = await admin
      .from('clientes')
      .select('id')
      .eq('perfil_id', usuario.userId)
      .maybeSingle()
    if (!cliente) return NextResponse.json({ error: 'Cadastro de cliente não encontrado.' }, { status: 404 })

    // Serviços válidos (preço e duração vêm do banco, nunca do navegador)
    const { data: servicos } = await admin
      .from('servicos')
      .select('id, duracao_min, preco')
      .eq('barbearia_id', usuario.barbearia_id)
      .eq('ativo', true)
      .in('id', servicosIds)
    if (!servicos || servicos.length !== servicosIds.length) {
      return NextResponse.json({ error: 'Um dos serviços escolhidos não está mais disponível.' }, { status: 400 })
    }
    const duracao = servicos.reduce((s: number, x: any) => s + Number(x.duracao_min), 0)
    const valor = servicos.reduce((s: number, x: any) => s + Number(x.preco || 0), 0)

    // Reconfere a disponibilidade no momento de gravar (evita dois clientes no mesmo horário)
    const slots = await calcularSlots(admin, {
      barbeariaId: usuario.barbearia_id,
      data,
      duracaoMin: duracao,
      barbeiroId: barbeiroPedido,
    })
    const slot = slots.find(s => s.hora === hora)
    if (!slot) {
      return NextResponse.json({ error: 'Esse horário acabou de ser ocupado. Escolha outro.' }, { status: 409 })
    }
    const barbeiroId = barbeiroPedido || slot.barbeiroIds[0]

    const { data: criado, error } = await admin
      .from('agendamentos')
      .insert({
        barbearia_id: usuario.barbearia_id,
        cliente_id: cliente.id,
        barbeiro_id: barbeiroId,
        servico_id: servicosIds[0],
        servicos_ids: servicosIds,
        data_hora: dataHoraISO(data, hora),
        duracao_min: duracao,
        valor_total: valor,
        status: 'pendente',
        criado_por: 'cliente',
        tipo_cliente: 'cadastrado',
        observacoes: observacoes || null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, id: criado.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro interno.' }, { status: 500 })
  }
}
