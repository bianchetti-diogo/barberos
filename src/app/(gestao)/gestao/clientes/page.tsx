'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Cliente {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  pontos: number
  criado_em: string
  perfil: { nome: string; telefone: string } | null
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
      .select('*, perfil:perfil_id(nome, telefone)')
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
    padding: '8px 12px', background: '#FAFAF7', border: '1px solid #E0DED8',
    borderRadius: 3, color: '#1A1A22', fontSize: 13, outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif", width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #E0DED8', background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>Administração</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>Clientes</h1>
        </div>
        <button onClick={() => setNovoAberto(true)} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>+ NOVO CLIENTE</button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', valor: clientes.length },
            { label: 'Este mês', valor: clientes.filter(c => new Date(c.criado_em).getMonth() === new Date().getMonth()).length },
            { label: 'Com pontos', valor: clientes.filter(c => c.pontos > 0).length },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1A1A22', lineHeight: 1 }}>{s.valor}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..." style={{ ...inputS, width: 300 }} />
        </div>

        {novoAberto && (
          <div style={{ background: '#fff', border: '1px solid #B8860B', borderRadius: 4, padding: '20px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#B8860B', textTransform: 'uppercase', marginBottom: 16 }}>Novo Cliente</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Nome *</div>
                <input style={inputS} value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>E-mail *</div>
                <input style={inputS} type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Telefone</div>
                <input style={inputS} value={form.telefone} onChange={e => setForm(p => ({...p, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Data de Nascimento</div>
                <input style={inputS} type="date" value={form.data_nascimento} onChange={e => setForm(p => ({...p, data_nascimento: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={salvarNovo} disabled={salvando} style={{ padding: '8px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>{salvando ? 'SALVANDO...' : 'SALVAR'}</button>
              <button onClick={() => setNovoAberto(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E0DED8', borderRadius: 3, color: '#6A6860', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9890', fontSize: 13 }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#E4E2DC', marginBottom: 12 }}>◎</div>
            <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 20 }}>{busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
            {!busca && <button onClick={() => setNovoAberto(true)} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>+ CADASTRAR PRIMEIRO CLIENTE</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 60px', gap: 16, padding: '10px 20px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase' }}>
              <div>Nome</div><div>Telefone</div><div>Cadastro</div><div>Pontos</div><div>Ver</div>
            </div>
            {filtrados.map(c => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 60px', gap: 16, padding: '14px 20px', background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A22' }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: '#9A9890', marginTop: 1 }}>{c.email || '—'}</div>
                </div>
                <div style={{ fontSize: 12, color: '#4A4840', fontFamily: 'monospace' }}>{c.telefone || '—'}</div>
                <div style={{ fontSize: 11, color: '#6A6860' }}>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: c.pontos > 0 ? '#B8860B' : '#C0BEB8' }}>{c.pontos}</div>
                <div>
                  <button style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #E4E2DC', borderRadius: 2, color: '#6A6860', fontSize: 11, cursor: 'pointer' }}>→</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
