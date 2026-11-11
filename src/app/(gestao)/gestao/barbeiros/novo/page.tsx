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
      const formData = new FormData()
      formData.append('nome', form.nome)
      formData.append('email', form.email)
      formData.append('telefone', form.telefone)
      formData.append('bio', form.bio)
      formData.append('especialidades', JSON.stringify(form.especialidades))
      if (foto) formData.append('foto', foto)

      const res = await fetch('/api/barbeiros/criar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar barbeiro.')
      }

      router.push('/gestao/barbeiros')
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar barbeiro.')
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {}

  const labelStyle: React.CSSProperties = {}

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-card)', padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const cardTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 16,
  }

  return (
    <div>

      {/* HEADER */}
      <div className="page-header" style={{ justifyContent: 'flex-start', gap: 16 }}>
        <button className="btn btn-sm" onClick={() => router.back()}>← Voltar</button>
        <div>
          <div className="eyebrow">
            Admin · Barbeiros
          </div>
          <h1 className="page-title">
            Novo Barbeiro
          </h1>
        </div>
      </div>

      {/* CONTEÚDO CENTRALIZADO */}
      <div style={{ padding: '24px 28px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* FOTO */}
          <div style={cardStyle}>
            <div style={cardTitle}>Foto do Barbeiro</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div onClick={() => fileRef.current?.click()} style={{
                width: 80, height: 80, borderRadius: 4,
                background: fotoPreview ? 'transparent' : 'var(--bg)',
                border: '2px dashed var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
              }}>
                {fotoPreview
                  ? <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24, color: 'var(--faint)' }}>+</span>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
              <div>
                <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>Escolher foto</button>
                <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>JPG ou PNG, máx. 2MB</p>
              </div>
            </div>
          </div>

          {/* DADOS */}
          <div style={cardStyle}>
            <div style={{ ...cardTitle, marginBottom: 20 }}>Dados Pessoais</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label" style={labelStyle}>Nome completo *</label>
                <input className="field" style={inputStyle} value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="field-label" style={labelStyle}>E-mail *</label>
                <input className="field" style={inputStyle} type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="joao@email.com" />
              </div>
              <div>
                <label className="field-label" style={labelStyle}>Telefone / WhatsApp</label>
                <input className="field" style={inputStyle} value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label" style={labelStyle}>Bio / Apresentação</label>
                <textarea className="field" style={{ ...inputStyle, height: 80, resize: 'vertical' } as React.CSSProperties}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Breve descrição do barbeiro..." />
              </div>
            </div>
          </div>

          {/* ESPECIALIDADES */}
          <div style={cardStyle}>
            <div style={cardTitle}>Especialidades</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ESPECIALIDADES_SUGERIDAS.map(esp => {
                const selecionado = form.especialidades.includes(esp)
                return (
                  <button key={esp} onClick={() => toggleEspecialidade(esp)} style={{
                    padding: '7px 14px',
                    background: selecionado ? 'var(--gold-soft)' : 'var(--bg)',
                    border: `1px solid ${selecionado ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 8, cursor: 'pointer',
                    color: selecionado ? 'var(--gold)' : 'var(--muted)',
                    fontSize: 12, transition: 'all 0.15s',
                  }}>
                    {selecionado ? '✓ ' : ''}{esp}
                  </button>
                )
              })}
            </div>
          </div>

          {erro && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid var(--danger)',
              borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--danger)',
            }}>{erro}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 40 }}>
            <button className="btn" onClick={() => router.back()}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{
              padding: '10px 28px',
              cursor: salvando ? 'not-allowed' : 'pointer',
            }}>
              {salvando ? 'SALVANDO...' : 'SALVAR BARBEIRO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
