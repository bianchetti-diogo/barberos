import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getAdmin()
    const formData = await request.formData()
    const nome = formData.get('nome') as string
    const descricao = formData.get('descricao') as string
    const preco = Number(formData.get('preco'))
    const estoque = Number(formData.get('estoque'))
    const categoria = formData.get('categoria') as string
    const foto = formData.get('foto') as File | null

    if (!nome) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })

    // A barbearia é a de quem está logado (nunca "a primeira do banco")
    const sessao = await createServerSupabase()
    const { data: barbeariaId } = await sessao.rpc('minha_barbearia')
    if (!barbeariaId) return NextResponse.json({ error: 'Barbearia não encontrada.' }, { status: 400 })
    const barbearia = { id: barbeariaId as string }

    let foto_url: string | null = null
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

    const { error } = await supabaseAdmin.from('produtos').insert({
      nome, descricao: descricao || null, preco, estoque,
      categoria: categoria || null, foto_url,
      barbearia_id: barbearia?.id, ativo_loja: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
