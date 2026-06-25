'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  estoque: number
  ativo_loja: boolean
  foto_url: string | null
  categoria: string | null
}

const CATEGORIAS = ['Cabelo', 'Barba', 'Skincare', 'Perfumaria', 'Acessórios', 'Outros']

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoAberto, setNovoAberto] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState({ nome: '', descricao: '', preco: 0, estoque: 0, categoria: 'Cabelo' })
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase.from('produtos').select('*').order('nome')
    setProdutos(data || [])
    setCarregando(false)
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function salvarNovo() {
    if (!form.nome) return
    setSalvando(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)))
      if (foto) formData.append('foto', foto)
      const res = await fetch('/api/produtos/criar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm({ nome: '', descricao: '', preco: 0, estoque: 0, categoria: 'Cabelo' })
      setFoto(null); setFotoPreview(null)
      setNovoAberto(false)
      carregar()
    } catch (e: any) {
      alert(e.message)
    }
    setSalvando(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('produtos').update({ ativo_loja: !ativo }).eq('id', id)
    carregar()
  }

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

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
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>Produtos</h1>
        </div>
        <button onClick={() => setNovoAberto(true)} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>+ NOVO PRODUTO</button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', valor: produtos.length },
            { label: 'Na loja', valor: produtos.filter(p => p.ativo_loja).length },
            { label: 'Estoque baixo', valor: produtos.filter(p => p.estoque <= 3).length },
            { label: 'Sem estoque', valor: produtos.filter(p => p.estoque === 0).length },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1A1A22', lineHeight: 1 }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* BUSCA */}
        <div style={{ marginBottom: 16 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." style={{ ...inputS, width: 280 }} />
        </div>

        {/* FORM NOVO */}
        {novoAberto && (
          <div style={{ background: '#fff', border: '1px solid #B8860B', borderRadius: 4, padding: '20px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#B8860B', textTransform: 'uppercase', marginBottom: 16 }}>Novo Produto</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 4, background: fotoPreview ? 'transparent' : '#F4F2ED', border: '2px dashed #E0DED8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                {fotoPreview ? <img src={fotoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, color: '#C0BEB8' }}>+</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Nome *</div>
                  <input style={inputS} value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} placeholder="Nome do produto" />
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Preço</div>
                  <input style={inputS} type="number" step="0.01" value={form.preco} onChange={e => setForm(p => ({...p, preco: Number(e.target.value)}))} />
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Estoque</div>
                  <input style={inputS} type="number" value={form.estoque} onChange={e => setForm(p => ({...p, estoque: Number(e.target.value)}))} />
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Categoria</div>
                  <select style={inputS} value={form.categoria} onChange={e => setForm(p => ({...p, categoria: e.target.value}))}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Descrição</div>
              <input style={inputS} value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} placeholder="Opcional" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={salvarNovo} disabled={salvando} style={{ padding: '8px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>{salvando ? 'SALVANDO...' : 'SALVAR'}</button>
              <button onClick={() => setNovoAberto(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E0DED8', borderRadius: 3, color: '#6A6860', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9890', fontSize: 13 }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#E4E2DC', marginBottom: 12 }}>◉</div>
            <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 20 }}>{busca ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</p>
            {!busca && <button onClick={() => setNovoAberto(true)} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>+ CADASTRAR PRIMEIRO PRODUTO</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 120px 80px 100px 80px', gap: 16, padding: '10px 20px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase' }}>
              <div></div><div>Nome</div><div>Categoria</div><div>Preço</div><div>Estoque</div><div>Status</div><div>Ações</div>
            </div>
            {filtrados.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 120px 80px 100px 80px', gap: 16, padding: '12px 20px', background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 3, background: p.foto_url ? 'transparent' : '#F4F2ED', border: '1px solid #E4E2DC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.foto_url ? <img src={p.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: '#C0BEB8' }}>◉</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A22' }}>{p.nome}</div>
                  {p.descricao && <div style={{ fontSize: 11, color: '#9A9890', marginTop: 1 }}>{p.descricao}</div>}
                </div>
                <div style={{ fontSize: 11, color: '#6A6860' }}>{p.categoria || '—'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#1A1A22' }}>R$ {Number(p.preco).toFixed(2)}</div>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: p.estoque === 0 ? '#DC2626' : p.estoque <= 3 ? '#D97706' : '#16A34A' }}>{p.estoque}</span>
                  <span style={{ fontSize: 10, color: '#9A9890', marginLeft: 3 }}>un</span>
                </div>
                <div>
                  <span style={{ display: 'inline-block', background: p.ativo_loja ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${p.ativo_loja ? 'rgba(46,204,113,0.3)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 2, padding: '3px 8px', fontSize: 10, fontFamily: 'monospace', color: p.ativo_loja ? '#16A34A' : '#DC2626' }}>
                    {p.ativo_loja ? 'Na loja' : 'Oculto'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button title="Editar" style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #E4E2DC', borderRadius: 2, color: '#6A6860', fontSize: 11, cursor: 'pointer' }}>✎</button>
                  <button onClick={() => toggleAtivo(p.id, p.ativo_loja)} title={p.ativo_loja ? 'Ocultar' : 'Publicar'} style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${p.ativo_loja ? 'rgba(239,68,68,0.3)' : 'rgba(46,204,113,0.3)'}`, borderRadius: 2, color: p.ativo_loja ? '#DC2626' : '#16A34A', fontSize: 11, cursor: 'pointer' }}>{p.ativo_loja ? '○' : '●'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
