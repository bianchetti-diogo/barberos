'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  duracao_min: number
  preco: number
  ativo: boolean
  categoria: 'base' | 'extra' | 'marketing' | 'outro'
  reofertavel: boolean
  dias_urgencia: number | null
}

const CATEGORIAS = [
  { value: 'base',      label: 'Base',      cor: '#0369A1', bg: 'rgba(3,105,161,0.08)',   border: 'rgba(3,105,161,0.2)' },
  { value: 'extra',     label: 'Extra',     cor: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.2)' },
  { value: 'marketing', label: 'Marketing', cor: '#B8860B', bg: 'rgba(184,134,11,0.08)',  border: 'rgba(184,134,11,0.2)' },
  { value: 'outro',     label: 'Outro',     cor: '#6A6860', bg: 'rgba(106,104,96,0.08)',  border: 'rgba(106,104,96,0.2)' },
]

function CatBadge({ cat }: { cat: string }) {
  const c = CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[3]
  return (
    <span style={{ display: 'inline-block', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 2, padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', color: c.cor, letterSpacing: '0.08em' }}>
      {c.label.toUpperCase()}
    </span>
  )
}

const FORM_VAZIO: {
  nome: string
  descricao: string
  duracao_min: number
  preco: number
  categoria: Servico['categoria']
  reofertavel: boolean
  dias_urgencia: number
} = { nome: '', descricao: '', duracao_min: 30, preco: 0, categoria: 'base', reofertavel: false, dias_urgencia: 30 }

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ...FORM_VAZIO })
  const [novoAberto, setNovoAberto] = useState(false)
  const [form, setForm] = useState({ ...FORM_VAZIO })
  const [salvando, setSalvando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const supabase = createClient()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase.from('servicos').select('*').order('categoria').order('nome')
    setServicos(data || [])
    setCarregando(false)
  }

  function abrirEdicao(s: Servico) {
    setEditando(s.id)
    setEditForm({
      nome: s.nome,
      descricao: s.descricao || '',
      duracao_min: s.duracao_min,
      preco: Number(s.preco),
      categoria: s.categoria || 'base',
      reofertavel: s.reofertavel || false,
      dias_urgencia: s.dias_urgencia || 30,
    })
  }

  function fecharEdicao() {
    setEditando(null)
    setEditForm({ ...FORM_VAZIO })
  }

  async function salvarEdicao(id: string) {
    if (!editForm.nome) return
    setSalvando(true)
    await supabase.from('servicos').update({
      nome: editForm.nome,
      descricao: editForm.descricao || null,
      duracao_min: editForm.duracao_min,
      preco: editForm.preco,
      categoria: editForm.categoria,
      reofertavel: editForm.reofertavel,
      dias_urgencia: editForm.reofertavel ? editForm.dias_urgencia : null,
    }).eq('id', id)
    setSalvando(false)
    fecharEdicao()
    carregar()
  }

  async function salvarNovo() {
    if (!form.nome) return
    setSalvando(true)
    const { data: barbearia } = await supabase.from('barbearias').select('id').single()
    await supabase.from('servicos').insert({
      nome: form.nome,
      descricao: form.descricao || null,
      duracao_min: form.duracao_min,
      preco: form.preco,
      categoria: form.categoria,
      reofertavel: form.reofertavel,
      dias_urgencia: form.reofertavel ? form.dias_urgencia : null,
      barbearia_id: barbearia?.id,
      ativo: true,
    })
    setForm({ ...FORM_VAZIO })
    setNovoAberto(false)
    setSalvando(false)
    carregar()
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('servicos').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  const servicosFiltrados = filtroCategoria === 'todas'
    ? servicos
    : servicos.filter(s => s.categoria === filtroCategoria)

  const inputS: React.CSSProperties = {
    padding: '8px 12px', background: '#FAFAF7',
    border: '1px solid #E0DED8', borderRadius: 3,
    color: '#1A1A22', fontSize: 13, outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif", width: '100%', boxSizing: 'border-box',
  }
  const labelS: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 9, color: '#9A9890',
    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5, display: 'block',
  }

  function FormServico({ f, setF, onSalvar, onCancelar, titulo }: any) {
    return (
      <div style={{ background: '#fff', border: '1px solid #B8860B', borderRadius: 4, padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', color: '#B8860B', textTransform: 'uppercase', marginBottom: 16 }}>{titulo}</div>

        {/* Linha 1: Nome + Duração + Preço */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelS}>Nome *</label>
            <input style={inputS} value={f.nome} onChange={e => setF((p: any) => ({ ...p, nome: e.target.value }))} placeholder="Ex: Barboterapia" />
          </div>
          <div>
            <label style={labelS}>Duração (min)</label>
            <input style={inputS} type="number" min="5" step="5" value={f.duracao_min} onChange={e => setF((p: any) => ({ ...p, duracao_min: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelS}>Preço (R$)</label>
            <input style={inputS} type="number" step="0.01" min="0" value={f.preco} onChange={e => setF((p: any) => ({ ...p, preco: Number(e.target.value) }))} />
          </div>
        </div>

        {/* Linha 2: Descrição */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelS}>Descrição</label>
          <input style={inputS} value={f.descricao} onChange={e => setF((p: any) => ({ ...p, descricao: e.target.value }))} placeholder="Opcional" />
        </div>

        {/* Linha 3: Categoria */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelS}>Categoria</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIAS.map(c => (
              <button key={c.value} onClick={() => setF((p: any) => ({ ...p, categoria: c.value }))} style={{
                padding: '7px 16px', borderRadius: 3, cursor: 'pointer', fontSize: 12,
                fontFamily: 'monospace', fontWeight: f.categoria === c.value ? 700 : 400,
                background: f.categoria === c.value ? c.bg : '#F4F2ED',
                border: `1px solid ${f.categoria === c.value ? c.cor : '#E4E2DC'}`,
                color: f.categoria === c.value ? c.cor : '#6A6860',
                transition: 'all 0.15s',
              }}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Linha 4: Reoferta */}
        <div style={{ background: '#FAFAF7', border: '1px solid #E4E2DC', borderRadius: 3, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: f.reofertavel ? 12 : 0 }}>
            <div onClick={() => setF((p: any) => ({ ...p, reofertavel: !p.reofertavel }))} style={{
              width: 36, height: 20, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s',
              background: f.reofertavel ? '#B8860B' : '#D0CEC8', position: 'relative', flexShrink: 0,
            }}>
              <div style={{ position: 'absolute', top: 2, left: f.reofertavel ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A22' }}>Elegível para reoferta</div>
              <div style={{ fontSize: 11, color: '#9A9890', marginTop: 1 }}>Histórico aparece no card do agendamento para o barbeiro</div>
            </div>
          </div>

          {f.reofertavel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid #E4E2DC' }}>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Urgência de reoferta (dias)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input style={{ ...inputS, width: 80 }} type="number" min="1" max="365" value={f.dias_urgencia} onChange={e => setF((p: any) => ({ ...p, dias_urgencia: Number(e.target.value) }))} />
                  <span style={{ fontSize: 12, color: '#6A6860' }}>dias sem fazer = alerta de urgência</span>
                </div>
              </div>
              <div style={{ background: f.dias_urgencia <= 15 ? 'rgba(220,38,38,0.08)' : f.dias_urgencia <= 30 ? 'rgba(184,134,11,0.08)' : 'rgba(22,163,74,0.08)', border: `1px solid ${f.dias_urgencia <= 15 ? 'rgba(220,38,38,0.2)' : f.dias_urgencia <= 30 ? 'rgba(184,134,11,0.2)' : 'rgba(22,163,74,0.2)'}`, borderRadius: 3, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: f.dias_urgencia <= 15 ? '#DC2626' : f.dias_urgencia <= 30 ? '#B8860B' : '#16A34A' }}>{f.dias_urgencia}d</div>
                <div style={{ fontSize: 9, color: '#9A9890', letterSpacing: '0.1em', textTransform: 'uppercase' }}>urgência</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onSalvar} disabled={salvando} style={{ padding: '8px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
            {salvando ? 'SALVANDO...' : 'SALVAR'}
          </button>
          <button onClick={onCancelar} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #E0DED8', borderRadius: 3, color: '#6A6860', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #E0DED8', background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>Administração</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>Serviços</h1>
        </div>
        <button onClick={() => { setNovoAberto(true); setEditando(null) }} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>
          + NOVO SERVIÇO
        </button>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto' }}>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', valor: servicos.length },
            { label: 'Ativos', valor: servicos.filter(s => s.ativo).length },
            { label: 'Reofertáveis', valor: servicos.filter(s => s.reofertavel).length },
            { label: 'Ticket médio', valor: `R$ ${servicos.length ? (servicos.reduce((a, s) => a + Number(s.preco), 0) / servicos.length).toFixed(0) : 0}` },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#1A1A22', lineHeight: 1 }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* FILTRO CATEGORIAS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setFiltroCategoria('todas')} style={{ padding: '6px 14px', borderRadius: 3, border: `1px solid ${filtroCategoria === 'todas' ? '#1A1A22' : '#E4E2DC'}`, background: filtroCategoria === 'todas' ? '#1A1A22' : '#fff', color: filtroCategoria === 'todas' ? '#fff' : '#6A6860', fontSize: 11, fontFamily: 'monospace', cursor: 'pointer' }}>
            TODAS ({servicos.length})
          </button>
          {CATEGORIAS.map(c => {
            const count = servicos.filter(s => s.categoria === c.value).length
            const ativo = filtroCategoria === c.value
            return (
              <button key={c.value} onClick={() => setFiltroCategoria(c.value)} style={{ padding: '6px 14px', borderRadius: 3, border: `1px solid ${ativo ? c.cor : '#E4E2DC'}`, background: ativo ? c.bg : '#fff', color: ativo ? c.cor : '#6A6860', fontSize: 11, fontFamily: 'monospace', fontWeight: ativo ? 700 : 400, cursor: 'pointer' }}>
                {c.label.toUpperCase()} ({count})
              </button>
            )
          })}
        </div>

        {/* FORM NOVO */}
        {novoAberto && (
          <FormServico f={form} setF={setForm} onSalvar={salvarNovo} onCancelar={() => setNovoAberto(false)} titulo="Novo Serviço" />
        )}

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9890', fontSize: 13 }}>Carregando...</div>
        ) : servicosFiltrados.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#E4E2DC', marginBottom: 12 }}>◈</div>
            <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 20 }}>Nenhum serviço encontrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 90px 110px 90px', gap: 12, padding: '8px 20px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase' }}>
              <div>Nome</div><div>Categoria</div><div>Duração</div><div>Preço</div><div>Reoferta</div><div>Ações</div>
            </div>

            {servicosFiltrados.map(s => (
              <div key={s.id}>
                {editando !== s.id && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 90px 110px 90px', gap: 12, padding: '14px 20px', background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A22' }}>{s.nome}</div>
                      {s.descricao && <div style={{ fontSize: 11, color: '#9A9890', marginTop: 2 }}>{s.descricao}</div>}
                    </div>
                    <div><CatBadge cat={s.categoria || 'base'} /></div>
                    <div style={{ fontSize: 13, color: '#4A4840', fontFamily: 'monospace' }}>{s.duracao_min} min</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A22', fontFamily: 'monospace' }}>R$ {Number(s.preco).toFixed(2)}</div>
                    <div>
                      {s.reofertavel ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: s.dias_urgencia && s.dias_urgencia <= 15 ? '#DC2626' : s.dias_urgencia && s.dias_urgencia <= 30 ? '#B8860B' : '#16A34A' }}>●</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4A4840' }}>{s.dias_urgencia}d</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#C0BEB8' }}>—</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => abrirEdicao(s)} title="Editar" style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #E4E2DC', borderRadius: 2, color: '#6A6860', fontSize: 11, cursor: 'pointer' }}>✎</button>
                      <button onClick={() => toggleAtivo(s.id, s.ativo)} title={s.ativo ? 'Desativar' : 'Ativar'} style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${s.ativo ? 'rgba(239,68,68,0.3)' : 'rgba(22,163,74,0.3)'}`, borderRadius: 2, color: s.ativo ? '#DC2626' : '#16A34A', fontSize: 11, cursor: 'pointer' }}>{s.ativo ? '○' : '●'}</button>
                    </div>
                  </div>
                )}

                {editando === s.id && (
                  <FormServico f={editForm} setF={setEditForm} onSalvar={() => salvarEdicao(s.id)} onCancelar={fecharEdicao} titulo={`Editando: ${s.nome}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
