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
const FORM_VAZIO = { nome: '', descricao: '', preco: 0, estoque: 0, categoria: 'Cabelo' }
const GRID = '48px minmax(180px,1fr) 100px 110px 80px 90px 90px'

const inputS: React.CSSProperties = {
  padding: '8px 12px', background: '#FAFAF7', border: '1px solid #E0DED8',
  borderRadius: 3, color: '#1A1A22', fontSize: 13, outline: 'none',
  fontFamily: "'Space Grotesk', sans-serif", width: '100%', boxSizing: 'border-box',
}
const labelS: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#9A9890',
  letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5, display: 'block',
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoAberto, setNovoAberto] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState({ ...FORM_VAZIO })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ...FORM_VAZIO })
  const [erro, setErro] = useState('')
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
    if (!form.nome.trim()) { setErro('Informe o nome do produto.'); return }
    setSalvando(true)
    setErro('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)))
      if (foto) formData.append('foto', foto)
      const res = await fetch('/api/produtos/criar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm({ ...FORM_VAZIO })
      setFoto(null); setFotoPreview(null)
      setNovoAberto(false)
      carregar()
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar o produto.')
    }
    setSalvando(false)
  }

  function abrirEdicao(p: Produto) {
    setNovoAberto(false)
    setEditandoId(p.id)
    setErro('')
    setEditForm({
      nome: p.nome,
      descricao: p.descricao || '',
      preco: Number(p.preco),
      estoque: p.estoque,
      categoria: p.categoria || 'Outros',
    })
  }

  async function salvarEdicao() {
    if (!editandoId || !editForm.nome.trim()) { setErro('Informe o nome do produto.'); return }
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('produtos').update({
      nome: editForm.nome.trim(),
      descricao: editForm.descricao || null,
      preco: editForm.preco,
      estoque: editForm.estoque,
      categoria: editForm.categoria,
    }).eq('id', editandoId)
    setSalvando(false)
    if (error) { setErro('Não foi possível salvar: ' + error.message); return }
    setEditandoId(null)
    carregar()
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('produtos').update({ ativo_loja: !ativo }).eq('id', id)
    carregar()
  }

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  function FormProduto({ f, setF, titulo, onSalvar, onCancelar, comFoto }: {
    f: typeof FORM_VAZIO
    setF: React.Dispatch<React.SetStateAction<typeof FORM_VAZIO>>
    titulo: string
    onSalvar: () => void
    onCancelar: () => void
    comFoto?: boolean
  }) {
    return (
      <div style={{ background: '#fff', border: '1px solid #B8860B', borderRadius: 6, padding: 20, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.15em', color: '#B8860B', textTransform: 'uppercase', marginBottom: 16 }}>{titulo}</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {comFoto && (
            <>
              <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 6, background: fotoPreview ? 'transparent' : '#F4F2ED', border: '2px dashed #E0DED8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                {fotoPreview ? <img src={fotoPreview} alt="Prévia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, color: '#C0BEB8' }}>+</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
            </>
          )}
          <div style={{ flex: 1, minWidth: 260, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelS}>Nome *</label>
              <input style={inputS} value={f.nome} onChange={e => setF(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do produto" />
            </div>
            <div>
              <label style={labelS}>Preço (R$)</label>
              <input style={inputS} type="number" step="0.01" min="0" value={f.preco} onChange={e => setF(p => ({ ...p, preco: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelS}>Estoque</label>
              <input style={inputS} type="number" min="0" value={f.estoque} onChange={e => setF(p => ({ ...p, estoque: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelS}>Categoria</label>
              <select style={inputS} value={f.categoria} onChange={e => setF(p => ({ ...p, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelS}>Descrição</label>
          <input style={inputS} value={f.descricao} onChange={e => setF(p => ({ ...p, descricao: e.target.value }))} placeholder="Opcional" />
        </div>
        {erro && <div role="alert" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 4, color: '#DC2626', fontSize: 12, padding: '8px 12px', marginBottom: 12 }}>{erro}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onSalvar} disabled={salvando} className="btn btn-primary">{salvando ? 'SALVANDO...' : 'SALVAR'}</button>
          <button onClick={onCancelar} className="btn">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">Administração</div>
          <h1 className="page-title">Produtos</h1>
        </div>
        <button onClick={() => { setNovoAberto(true); setEditandoId(null); setErro('') }} className="btn btn-primary">+ NOVO PRODUTO</button>
      </div>

      <div className="page-body">
        {/* STATS */}
        <div className="stat-grid">
          {[
            { label: 'Total', valor: produtos.length },
            { label: 'Na loja', valor: produtos.filter(p => p.ativo_loja).length },
            { label: 'Estoque baixo', valor: produtos.filter(p => p.estoque > 0 && p.estoque <= 3).length },
            { label: 'Sem estoque', valor: produtos.filter(p => p.estoque === 0).length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.valor}</div>
            </div>
          ))}
        </div>

        {/* BUSCA */}
        <div style={{ marginBottom: 16 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." style={{ ...inputS, maxWidth: 320 }} />
        </div>

        {/* FORM NOVO */}
        {novoAberto && FormProduto({
          f: form, setF: setForm, titulo: 'Novo Produto', comFoto: true,
          onSalvar: salvarNovo,
          onCancelar: () => { setNovoAberto(false); setErro('') },
        })}

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><span className="spin" /></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, color: '#D8D6D0', marginBottom: 12 }}>◉</div>
            <p style={{ fontSize: 13, marginBottom: 20 }}>{busca ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</p>
            {!busca && <button onClick={() => setNovoAberto(true)} className="btn btn-primary">+ CADASTRAR PRIMEIRO PRODUTO</button>}
          </div>
        ) : (
          <div className="table-scroll">
            <div style={{ minWidth: 760, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '8px 20px', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase' }}>
                <div></div><div>Nome</div><div>Categoria</div><div>Preço</div><div>Estoque</div><div>Status</div><div>Ações</div>
              </div>
              {filtrados.map(p => (
                <div key={p.id}>
                  {editandoId === p.id ? (
                    FormProduto({
                      f: editForm, setF: setEditForm, titulo: `Editando: ${p.nome}`,
                      onSalvar: salvarEdicao,
                      onCancelar: () => { setEditandoId(null); setErro('') },
                    })
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '12px 20px', background: '#fff', border: '1px solid #E4E2DC', borderRadius: 6, alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: p.foto_url ? 'transparent' : '#F4F2ED', border: '1px solid #E4E2DC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.foto_url ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: '#C0BEB8' }}>◉</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A22' }}>{p.nome}</div>
                        {p.descricao && <div style={{ fontSize: 11, color: '#9A9890', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descricao}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: '#6A6860' }}>{p.categoria || '—'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: '#1A1A22' }}>R$ {Number(p.preco).toFixed(2)}</div>
                      <div>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: p.estoque === 0 ? '#DC2626' : p.estoque <= 3 ? '#D97706' : '#16A34A' }}>{p.estoque}</span>
                        <span style={{ fontSize: 10, color: '#9A9890', marginLeft: 3 }}>un</span>
                      </div>
                      <div>
                        <span style={{ display: 'inline-block', background: p.ativo_loja ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${p.ativo_loja ? 'rgba(46,204,113,0.3)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 3, padding: '3px 8px', fontSize: 10, fontFamily: "'Space Mono', monospace", color: p.ativo_loja ? '#16A34A' : '#DC2626' }}>
                          {p.ativo_loja ? 'Na loja' : 'Oculto'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => abrirEdicao(p)} title="Editar" className="btn btn-sm">✎</button>
                        <button onClick={() => toggleAtivo(p.id, p.ativo_loja)} title={p.ativo_loja ? 'Ocultar da loja' : 'Publicar na loja'} className="btn btn-sm" style={{ color: p.ativo_loja ? '#DC2626' : '#16A34A', borderColor: p.ativo_loja ? 'rgba(239,68,68,0.3)' : 'rgba(46,204,113,0.3)' }}>{p.ativo_loja ? '○' : '●'}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
