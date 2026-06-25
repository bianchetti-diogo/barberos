 import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Usa service role para criar usuários sem afetar a sessão atual
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const nome = formData.get('nome') as string
    const email = formData.get('email') as string
    const telefone = formData.get('telefone') as string
    const bio = formData.get('bio') as string
    const especialidades = JSON.parse(formData.get('especialidades') as string || '[]')
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

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Buscar barbearia
    const { data: barbearia } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .single()

    // 3. Criar perfil
    await supabaseAdmin.from('perfis').insert({
      id: userId,
      nome,
      telefone: telefone || null,
      role: 'barbeiro',
      barbearia_id: barbearia?.id || null,
      ativo: true,
    })

    // 4. Upload de foto
    let foto_url = null
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
    await supabaseAdmin.from('barbeiros').insert({
      perfil_id: userId,
      barbearia_id: barbearia?.id || null,
      nome,
      foto_url,
      bio: bio || null,
      especialidades,
      ativo: true,
    })

    return NextResponse.json({ success: true, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro interno.' }, { status: 500 })
  }
}
