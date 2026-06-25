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

    const senhaTemp = Math.random().toString(36).slice(-8) + 'C1!'
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password: senhaTemp, email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const userId = authData.user.id
    const { data: barbearia } = await supabaseAdmin.from('barbearias').select('id').single()

    await supabaseAdmin.from('perfis').insert({
      id: userId, nome, telefone: telefone || null,
      role: 'cliente', barbearia_id: barbearia?.id, ativo: true,
    })

    await supabaseAdmin.from('clientes').insert({
      perfil_id: userId, barbearia_id: barbearia?.id,
      nome, email, telefone: telefone || null,
      data_nascimento: data_nascimento || null, pontos: 0,
    })

    return NextResponse.json({ success: true, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}