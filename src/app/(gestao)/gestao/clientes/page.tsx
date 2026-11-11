'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Cliente {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  pontos: number
  criado_em: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', data_nascimento: '' })
  const supabase = createClient()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('criado_em', { ascending: false })
    setClientes(data || [])
    setCarregando(false)
  }

  async function salvarNovo() {
    if (!form.nome || !form.email) return
    setSalvando(true)
    try {
      const res = await fetch('/api/clientes/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm({ nome: '', email: '', telefone: '', data_nascimento: '' })
      setNovoAberto(false)
      carregar()
    } catch (e: any) {
      alert(e.message)
    }
    setSalvando(false)
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || '').includes(busca)
  )

  const inputS: React.CSSProperties = {
    padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-strong)',
    borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  const labelS: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 5 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">Administração</div>
          <h1 className="page-title">Clientes</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setNovoAberto(true)}>+ Novo cliente</button>
      </div>

      <div className="page-body">
        <div className="stat-grid">
          {[
            { label: 'Total', valor: clientes.length },
            { label: 'Este mês', valor: clientes.filter(c => { const d = new Date(c.criado_em), h = new Date(); return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear() }).length },
            { label: 'Com pontos', valor: clientes.filter(c => c.pontos > 0).length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.valor}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..." style={{ ...inputS, width: 300 }} />
        </div>

        {novoAberto && (
          <div className="card" style={{ borderColor: 'var(--gold)', padding: '20px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16 }}>Novo Cliente</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={labelS}>Nome *</div>
                <input style={inputS} value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} />
              </div>
              <div>
                <div style={labelS}>E-mail *</div>
                <input style={inputS} type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div>
                <div style={labelS}>Telefone</div>
                <input style={inputS} value={form.telefone} onChange={e => setForm(p => ({...p, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <div style={labelS}>Data de Nascimento</div>
                <input style={inputS} type="date" value={form.data_nascimento} onChange={e => setForm(p => ({...p, data_nascimento: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={salvarNovo} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button className="btn" onClick={() => setNovoAberto(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--faint)', fontSize: 13 }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, color: 'var(--border-strong)', marginBottom: 12 }}>◎</div>
            <p style={{ color: 'var(--faint)', fontSize: 13, marginBottom: 20 }}>{busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
            {!busca && <button className="btn btn-primary" onClick={() => setNovoAberto(true)}>+ Cadastrar primeiro cliente</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 60px', gap: 16, padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--faint)', textTransform: 'uppercase' }}>
              <div>Nome</div><div>Telefone</div><div>Cadastro</div><div>Pontos</div><div>Contato</div>
            </div>
            {filtrados.map(c => (
              <div key={c.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 60px', gap: 16, padding: '14px 20px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{c.email || '—'}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{c.telefone || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</div>
                <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700, color: c.pontos > 0 ? 'var(--gold)' : 'var(--faint)' }}>{c.pontos}</div>
                <div>
                  {c.telefone ? (
                    <a href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="Chamar no WhatsApp" style={{ display: 'inline-block', padding: '5px 10px', border: '1px solid var(--ok)', borderRadius: 6, color: 'var(--ok)', fontSize: 11 }}>WhatsApp</a>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
