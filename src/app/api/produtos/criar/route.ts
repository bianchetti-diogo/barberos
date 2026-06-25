import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const nome = formData.get('nome') as string
    const descricao = formData.get('descricao') as string
    const preco = Number(formData.get('preco'))
    const estoque = Number(formData.get('estoque'))
    const categoria = formData.get('categoria') as string
    const foto = formData.get('foto') as File | null

    if (!nome) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })

    const { data: barbearia } = await supabaseAdmin.from('barbearias').select('id').single()

    let foto_url = null
    if (foto && foto.size > 0) {
      const bytes = await foto.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = foto.name.split('.').pop() || 'jpg'
      const fileName = `produtos/${Date.now()}.${ext}`
      const { data: uploadData } = await supabaseAdmin.storage.from('midias').upload(fileName, buffer, { contentType: foto.type, upsert: true })
      if (uploadData) {
        const { data: urlData } = supabaseAdmin.storage.from('midias').getPublicUrl(uploadData.path)
        foto_url = urlData.publicUrl
      }
    }

    await supabaseAdmin.from('produtos').insert({
      nome, descricao: descricao || null, preco, estoque,
      categoria: categoria || null, foto_url,
      barbearia_id: barbearia?.id, ativo_loja: true,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}