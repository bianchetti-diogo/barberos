import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, data_nascimento } = await request.json()
    if (!nome || !email) return NextResponse.json({ error: 'Nome e e-mail obrigatórios.' }, { status: 400 })

    const { data: barbearia, error: barbeariaError } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .single()

    if (barbeariaError || !barbearia) {
      return NextResponse.json({ error: 'Barbearia não encontrada.' }, { status: 400 })
    }

    // Verifica se já existe cliente com esse email nesta barbearia
    const { data: existing } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('email', email)
      .eq('barbearia_id', barbearia.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Já existe um cliente com este e-mail.' }, { status: 400 })
    }

    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .insert({
        barbearia_id: barbearia.id,
        nome,
        email,
        telefone: telefone || null,
        data_nascimento: data_nascimento || null,
        pontos: 0,
      })
      .select()
      .single()

    if (clienteError) {
      return NextResponse.json({ error: clienteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, cliente })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}