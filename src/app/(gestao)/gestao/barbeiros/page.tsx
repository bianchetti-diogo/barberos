'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ESPECIALIDADES_SUGERIDAS = [
  'Corte Masculino', 'Barba', 'Degradê', 'Navalhado',
  'Coloração', 'Relaxamento', 'Tranças', 'Sobrancelha',
]

export default function NovoBarbeiroPage() {
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', bio: '',
    especialidades: [] as string[],
  })
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function toggleEspecialidade(esp: string) {
    setForm(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(esp)
        ? prev.especialidades.filter(e => e !== esp)
        : [...prev.especialidades, esp],
    }))
  }

  async function salvar() {
    if (!form.nome || !form.email) {
      setErro('Nome e e-mail são obrigatórios.')
      return
    }
    setSalvando(true)
    setErro('')

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin
        ? await (supabase as any).auth.admin.createUser({
            email: form.email,
            password: Math.random().toString(36).slice(-10) + 'B1!',
            email_confirm: true,
          })
        : { data: null, error: { message: 'Admin API não disponível no client' } }

      // Como não temos admin API no client, usamos signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: Math.random().toString(36).slice(-10) + 'B1!',
        options: { data: { nome: form.nome } }
      })

      if (signUpError) throw new Error(signUpError.message)
      const userId = signUpData.user?.id
      if (!userId) throw new Error('Erro ao criar usuário')

      // 2. Criar perfil
      const barbearia = await supabase.from('barbearias').select('id').single()
      await supabase.from('perfis').insert({
        id: userId,
        nome: form.nome,
        telefone: form.telefone,
        role: 'barbeiro',
        barbearia_id: barbearia.data?.id,
        ativo: true,
      })

      // 3. Upload de foto
      let foto_url = null
      if (foto) {
        const ext = foto.name.split('.').pop()
        const { data: uploadData } = await supabase.storage
          .from('midias')
          .upload(`barbeiros/${userId}.${ext}`, foto, { upsert: true })
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('midias')
            .getPublicUrl(uploadData.path)
          foto_url = urlData.publicUrl
        }
      }

      // 4. Criar barbeiro
      await supabase.from('barbeiros').insert({
        perfil_id: userId,
        barbearia_id: barbearia.data?.id,
        nome: form.nome,
        foto_url,
        bio: form.bio || null,
        especialidades: form.especialidades,
        ativo: true,
      })

      router.push('/gestao/barbeiros')
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar barbeiro.')
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#fff', border: '1px solid #E0DED8',
    borderRadius: 3, color: '#1A1A22', fontSize: 13,
    outline: 'none', fontFamily: "'Space Grotesk', sans-serif",
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 10,
    letterSpacing: '0.15em', color: '#9A9890',
    textTransform: 'uppercase', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid #E0DED8',
        background: '#FAFAF7', display: 'flex',
        alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent', border: '1px solid #E0DED8',
            borderRadius: 3, padding: '7px 12px',
            color: '#6A6860', fontSize: 12, cursor: 'pointer',
          }}
        >← Voltar</button>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>
            Admin · Barbeiros
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>
            Novo Barbeiro
          </h1>
        </div>
      </div>

      <div style={{ padding: '28px', maxWidth: 720 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* FOTO */}
          <div style={{
            background: '#fff', border: '1px solid #E4E2DC',
            borderRadius: 4, padding: '24px',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 16 }}>
              Foto do Barbeiro
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: 4,
                  background: fotoPreview ? 'transparent' : '#F4F2ED',
                  border: '2px dashed #E0DED8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                }}
              >
                {fotoPreview
                  ? <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24, color: '#C0BEB8' }}>+</span>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
              <div>
                <button onClick={() => fileRef.current?.click()} style={{
                  padding: '8px 16px', background: '#fff',
                  border: '1px solid #E0DED8', borderRadius: 3,
                  color: '#4A4840', fontSize: 12, cursor: 'pointer',
                }}>
                  Escolher foto
                </button>
                <p style={{ fontSize: 11, color: '#9A9890', marginTop: 6 }}>
                  JPG ou PNG, máx. 2MB
                </p>
              </div>
            </div>
          </div>

          {/* DADOS PESSOAIS */}
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '24px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 20 }}>
              Dados Pessoais
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nome completo *</label>
                <input style={inputStyle} value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: João Silva" />
              </div>
              <div>
                <label style={labelStyle}>E-mail *</label>
                <input style={inputStyle} type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="joao@email.com" />
              </div>
              <div>
                <label style={labelStyle}>Telefone / WhatsApp</label>
                <input style={inputStyle} value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Bio / Apresentação</label>
                <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Breve descrição do barbeiro..." />
              </div>
            </div>
          </div>

          {/* ESPECIALIDADES */}
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '24px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 16 }}>
              Especialidades
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ESPECIALIDADES_SUGERIDAS.map(esp => {
                const selecionado = form.especialidades.includes(esp)
                return (
                  <button key={esp} onClick={() => toggleEspecialidade(esp)} style={{
                    padding: '7px 14px',
                    background: selecionado ? 'rgba(184,134,11,0.1)' : '#F4F2ED',
                    border: `1px solid ${selecionado ? '#B8860B' : '#E4E2DC'}`,
                    borderRadius: 3, cursor: 'pointer',
                    color: selecionado ? '#8A6200' : '#4A4840',
                    fontSize: 12, transition: 'all 0.15s',
                  }}>
                    {selecionado ? '✓ ' : ''}{esp}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ERRO */}
          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 3, padding: '12px 16px',
              fontSize: 13, color: '#DC2626',
            }}>{erro}</div>
          )}

          {/* AÇÕES */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 40 }}>
            <button onClick={() => router.back()} style={{
              padding: '10px 20px', background: '#fff',
              border: '1px solid #E0DED8', borderRadius: 3,
              color: '#6A6860', fontSize: 12, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} style={{
              padding: '10px 28px', background: salvando ? '#C0BEB8' : '#B8860B',
              color: '#fff', border: 'none', borderRadius: 3,
              fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
              letterSpacing: '0.08em', cursor: salvando ? 'not-allowed' : 'pointer',
            }}>
              {salvando ? 'SALVANDO...' : 'SALVAR BARBEIRO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
 
