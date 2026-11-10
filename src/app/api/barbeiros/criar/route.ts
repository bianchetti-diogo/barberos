import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const supabaseAdmin = getAdmin()
  let userIdCriado: string | null = null

  try {
    const formData = await request.formData()
    const nome = (formData.get('nome') as string | null)?.trim()
    const email = (formData.get('email') as string | null)?.trim().toLowerCase()
    const telefone = formData.get('telefone') as string | null
    const bio = formData.get('bio') as string | null
    const especialidades = JSON.parse((formData.get('especialidades') as string | null) || '[]')
    const foto = formData.get('foto') as File | null

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 })
    }

    // 1. Criar usuário com senha temporária
    const senhaTemp = Math.random().toString(36).slice(-8) + 'B1!'
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaTemp,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      const jaExiste = /already|registered|exists/i.test(authError?.message || '')
      return NextResponse.json(
        { error: jaExiste ? 'Já existe um usuário com este e-mail.' : authError?.message || 'Erro ao criar usuário.' },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    userIdCriado = userId

    // 2. Buscar barbearia
    const { data: barbearia } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .order('criado_em', { ascending: true })
      .limit(1)
      .single()

    // 3. Criar perfil
    const { error: perfilError } = await supabaseAdmin.from('perfis').insert({
      id: userId,
      nome,
      telefone: telefone || null,
      role: 'barbeiro',
      barbearia_id: barbearia?.id || null,
      ativo: true,
    })
    if (perfilError) throw new Error(perfilError.message)

    // 4. Upload de foto
    let foto_url: string | null = null
    if (foto && foto.size > 0) {
      const bytes = await foto.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = foto.name.split('.').pop() || 'jpg'
      const { data: uploadData } = await supabaseAdmin.storage
        .from('midias')
        .upload(`barbeiros/${userId}.${ext}`, buffer, {
          contentType: foto.type,
          upsert: true,
        })
      if (uploadData) {
        const { data: urlData } = supabaseAdmin.storage
          .from('midias')
          .getPublicUrl(uploadData.path)
        foto_url = urlData.publicUrl
      }
    }

    // 5. Criar barbeiro
    const { error: barbeiroError } = await supabaseAdmin.from('barbeiros').insert({
      perfil_id: userId,
      barbearia_id: barbearia?.id || null,
      nome,
      foto_url,
      bio: bio || null,
      especialidades,
      ativo: true,
    })
    if (barbeiroError) throw new Error(barbeiroError.message)

    return NextResponse.json({ success: true, userId })
  } catch (e: any) {
    // Desfaz o usuário criado para não deixar cadastro pela metade
    if (userIdCriado) {
      await supabaseAdmin.from('perfis').delete().eq('id', userIdCriado)
      await supabaseAdmin.auth.admin.deleteUser(userIdCriado)
    }
    return NextResponse.json({ error: e.message || 'Erro interno.' }, { status: 500 })
  }
}
