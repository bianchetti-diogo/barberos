import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabase-admin'
import { getUsuarioAtual } from '@/lib/supabase-server'
import { calcularSlots } from '@/lib/disponibilidade'

// GET /api/cliente/disponibilidade?data=YYYY-MM-DD&duracao=60&barbeiro_id=...
export async function GET(request: NextRequest) {
  try {
    const usuario = await getUsuarioAtual()
    if (!usuario?.barbearia_id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const params = request.nextUrl.searchParams
    const data = params.get('data') || ''
    const duracao = Number(params.get('duracao'))
    const barbeiroId = params.get('barbeiro_id') || null

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
    if (!Number.isFinite(duracao) || duracao < 5 || duracao > 600) return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 })

    const slots = await calcularSlots(getAdmin(), {
      barbeariaId: usuario.barbearia_id,
      data,
      duracaoMin: duracao,
      barbeiroId,
    })

    // O cliente só precisa saber os horários livres, nunca quem está ocupado
    return NextResponse.json({ horarios: slots.map(s => s.hora) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro interno.' }, { status: 500 })
  }
}
