'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  duracao_min: number
  preco: number
  ativo: boolean
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [novoAberto, setNovoAberto] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', duracao_min: 30, preco: 0 })
  const [salvando, setSalvando] = useState(false)
  const supabase = createClient()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase.from('servicos').select('*').order('nome')
    setServicos(data || [])
    setCarregando(false)
  }

  async function salvarNovo() {
    if (!form.nome) return
    setSalvando(true)
    const { data: barbearia } = await supabase.from('barbearias').select('id').single()
    await supabase.from('servicos').insert({
      ...form, barbearia_id: barbearia?.id, ativo: true,
    })
    setForm({ nome: '', descricao: '', duracao_min: 30, preco: 0 })
    setNovoAberto(false)
    setSalvando(false)
    carregar()
  }

  async function salvarEdicao(id: string, dados: Partial<Servico>) {
    await supabase.from('servicos').update(dados).eq('id', id)
    setEditando(null)
    carregar()
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('servicos').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  const inputS: React.CSSProperties = {
    padding: '8px 12px', background: '#FAFAF7',
    border: '1px solid #E0DED8', borderRadius: 3,
    color: '#1A1A22', fontSize: 13, outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif", width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid #E0DED8', background: '#FAFAF7',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>Administração</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>Serviços</h1>
        </div>
        <button onClick={() => setNovoAberto(true)} style={{
          padding: '9px 20px', background: '#B8860B', color: '#fff',
          border: 'none', borderRadius: 3, fontSize: 12,
          fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
        }}>+ NOVO SERVIÇO</button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', valor: servicos.length },
            { label: 'Ativos', valor: servicos.filter(s => s.ativo).length },
            { label: 'Ticket médio', valor: `R$ ${servicos.length ? (servicos.reduce((a,s) => a+Number(s.preco),0)/servicos.length).toFixed(0) : 0}` },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1A1A22', lineHeight: 1 }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* FORM NOVO */}
        {novoAberto && (
          <div style={{ background: '#fff', border: '1px solid #B8860B', borderRadius: 4, padding: '20px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#B8860B', textTransform: 'uppercase', marginBottom: 16 }}>Novo Serviço</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Nome *</div>
                <input style={inputS} value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} placeholder="Ex: Corte + Barba" />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Duração (min)</div>
                <input style={inputS} type="number" value={form.duracao_min} onChange={e => setForm(p => ({...p, duracao_min: Number(e.target.value)}))} />
              </div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Preço (R$)</div>
                <input style={inputS} type="number" step="0.01" value={form.preco} onChange={e => setForm(p => ({...p, preco: Number(e.target.value)}))} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A9890', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>Descrição</div>
              <input style={inputS} value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} placeholder="Opcional" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={salvarNovo} disabled={salvando} style={{ padding: '8px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
                {salvando ? 'SALVANDO...' : 'SALVAR'}
              </button>
              <button onClick={() => setNovoAberto(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E0DED8', borderRadius: 3, color: '#6A6860', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9890', fontSize: 13 }}>Carregando...</div>
        ) : servicos.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#E4E2DC', marginBottom: 12 }}>◈</div>
            <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 20 }}>Nenhum serviço cadastrado ainda.</p>
            <button onClick={() => setNovoAberto(true)} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>+ CADASTRAR PRIMEIRO SERVIÇO</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', gap: 16, padding: '10px 20px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase' }}>
              <div>Nome</div><div>Duração</div><div>Preço</div><div>Status</div><div>Ações</div>
            </div>
            {servicos.map(s => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', gap: 16, padding: '14px 20px', background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A22' }}>{s.nome}</div>
                  {s.descricao && <div style={{ fontSize: 11, color: '#9A9890', marginTop: 2 }}>{s.descricao}</div>}
                </div>
                <div style={{ fontSize: 13, color: '#4A4840', fontFamily: 'monospace' }}>{s.duracao_min} min</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A22', fontFamily: 'monospace' }}>R$ {Number(s.preco).toFixed(2)}</div>
                <div>
                  <span style={{ display: 'inline-block', background: s.ativo ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${s.ativo ? 'rgba(46,204,113,0.3)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 2, padding: '3px 10px', fontSize: 10, fontFamily: 'monospace', color: s.ativo ? '#16A34A' : '#DC2626' }}>
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditando(s.id)} title="Editar" style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #E4E2DC', borderRadius: 2, color: '#6A6860', fontSize: 11, cursor: 'pointer' }}>✎</button>
                  <button onClick={() => toggleAtivo(s.id, s.ativo)} title={s.ativo ? 'Desativar' : 'Ativar'} style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${s.ativo ? 'rgba(239,68,68,0.3)' : 'rgba(46,204,113,0.3)'}`, borderRadius: 2, color: s.ativo ? '#DC2626' : '#16A34A', fontSize: 11, cursor: 'pointer' }}>{s.ativo ? '○' : '●'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
