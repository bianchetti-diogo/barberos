import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabase-admin'

/**
 * Cadastro público de clientes.
 * Cria o usuário de autenticação, o perfil (role "cliente") e o registro em "clientes".
 * Se a gestão já cadastrou esse e-mail como cliente, o registro existente é vinculado à nova conta.
 */
export async function POST(request: NextRequest) {
  let supabaseAdmin: ReturnType<typeof getAdmin>
  try {
    supabaseAdmin = getAdmin()
  } catch (e: any) {
    return NextResponse.json({ error: 'Servidor não configurado.' }, { status: 500 })
  }
  let userIdCriado: string | null = null

  try {
    const body = await request.json()
    const nome = String(body.nome || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const telefone = String(body.telefone || '').trim()
    const senha = String(body.senha || '')

    if (nome.length < 2) return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    if (senha.length < 8) return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })

    const { data: barbearia } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .order('criado_em', { ascending: true })
      .limit(1)
      .single()

    if (!barbearia) return NextResponse.json({ error: 'Barbearia não encontrada.' }, { status: 400 })

    // 1. Usuário de autenticação
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    })

    if (authError || !authData.user) {
      const jaExiste = /already|registered|exists/i.test(authError?.message || '')
      return NextResponse.json(
        { error: jaExiste ? 'Já existe uma conta com este e-mail.' : authError?.message || 'Erro ao criar conta.' },
        { status: jaExiste ? 409 : 400 }
      )
    }

    const userId = authData.user.id
    userIdCriado = userId

    // 2. Perfil
    const { error: perfilError } = await supabaseAdmin.from('perfis').insert({
      id: userId,
      nome,
      telefone: telefone || null,
      role: 'cliente',
      barbearia_id: barbearia.id,
      ativo: true,
    })
    if (perfilError) throw new Error(perfilError.message)

    // 3. Cliente: vincula um cadastro já existente (feito pela gestão) ou cria um novo
    const { data: existente } = await supabaseAdmin
      .from('clientes')
      .select('id, perfil_id')
      .eq('barbearia_id', barbearia.id)
      .eq('email', email)
      .maybeSingle()

    if (existente && !existente.perfil_id) {
      const { error } = await supabaseAdmin
        .from('clientes')
        .update({ perfil_id: userId, telefone: telefone || undefined })
        .eq('id', existente.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabaseAdmin.from('clientes').insert({
        perfil_id: userId,
        barbearia_id: barbearia.id,
        nome,
        email,
        telefone: telefone || null,
        pontos: 0,
      })
      if (error) throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    // Desfaz o que foi criado para não deixar cadastro pela metade
    if (userIdCriado) {
      await supabaseAdmin.from('perfis').delete().eq('id', userIdCriado)
      await supabaseAdmin.auth.admin.deleteUser(userIdCriado)
    }
    return NextResponse.json({ error: e.message || 'Erro interno.' }, { status: 500 })
  }
}
