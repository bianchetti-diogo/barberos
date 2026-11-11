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
  { value: 'base',      label: 'Base',      cor: 'var(--teal)',  bg: 'var(--teal-bg)',   border: 'var(--teal)' },
  { value: 'extra',     label: 'Extra',     cor: 'var(--gold)',  bg: 'var(--gold-soft)', border: 'var(--gold)' },
  { value: 'marketing', label: 'Marketing', cor: 'var(--combo)', bg: 'var(--combo-bg)',  border: 'var(--combo)' },
  { value: 'outro',     label: 'Outro',     cor: 'var(--muted)', bg: 'var(--surface-2)', border: 'var(--border-strong)' },
]

function CatBadge({ cat }: { cat: string }) {
  const c = CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[3]
  return (
    <span style={{ display: 'inline-block', background: c.bg, border: '1px solid transparent', borderRadius: 999, padding: '2px 9px', fontSize: 10, fontWeight: 600, color: c.cor, letterSpacing: '0.06em' }}>
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
    const { data: barbeariaId } = await supabase.rpc('minha_barbearia')
    const barbearia = { id: barbeariaId as string | null }
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
    padding: '8px 12px', background: 'var(--input-bg)',
    border: '1px solid var(--border-strong)', borderRadius: 8,
    color: 'var(--text)', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }
  const labelS: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'var(--muted)',
    marginBottom: 5, display: 'block',
  }

  function FormServico({ f, setF, onSalvar, onCancelar, titulo }: any) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--gold)', borderRadius: 'var(--radius-card)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16 }}>{titulo}</div>

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
                padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                fontWeight: f.categoria === c.value ? 700 : 400,
                background: f.categoria === c.value ? c.bg : 'var(--bg)',
                border: `1px solid ${f.categoria === c.value ? c.cor : 'var(--border)'}`,
                color: f.categoria === c.value ? c.cor : 'var(--muted)',
                transition: 'all 0.15s',
              }}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Linha 4: Reoferta */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: f.reofertavel ? 12 : 0 }}>
            <div onClick={() => setF((p: any) => ({ ...p, reofertavel: !p.reofertavel }))} style={{
              width: 36, height: 20, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s',
              background: f.reofertavel ? 'var(--gold)' : 'var(--border-strong)', position: 'relative', flexShrink: 0,
            }}>
              <div style={{ position: 'absolute', top: 2, left: f.reofertavel ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--on-gold)', transition: 'left 0.2s' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Elegível para reoferta</div>
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>Histórico aparece no card do agendamento para o barbeiro</div>
            </div>
          </div>

          {f.reofertavel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Urgência de reoferta (dias)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input style={{ ...inputS, width: 80 }} type="number" min="1" max="365" value={f.dias_urgencia} onChange={e => setF((p: any) => ({ ...p, dias_urgencia: Number(e.target.value) }))} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>dias sem fazer = alerta de urgência</span>
                </div>
              </div>
              <div style={{ background: f.dias_urgencia <= 15 ? 'var(--danger-bg)' : f.dias_urgencia <= 30 ? 'var(--warn-bg)' : 'var(--ok-bg)', border: `1px solid ${f.dias_urgencia <= 15 ? 'var(--danger)' : f.dias_urgencia <= 30 ? 'var(--warn)' : 'var(--ok)'}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: f.dias_urgencia <= 15 ? 'var(--danger)' : f.dias_urgencia <= 30 ? 'var(--warn)' : 'var(--ok)' }}>{f.dias_urgencia}d</div>
                <div style={{ fontSize: 9, color: 'var(--faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>urgência</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={onSalvar} disabled={salvando}>
            {salvando ? 'SALVANDO...' : 'SALVAR'}
          </button>
          <button className="btn" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Administração</div>
          <h1 className="page-title">Serviços</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setNovoAberto(true); setEditando(null) }}>
          + NOVO SERVIÇO
        </button>
      </div>

      <div className="page-body">

        {/* STATS */}
        <div className="stat-grid">
          {[
            { label: 'Total', valor: servicos.length },
            { label: 'Ativos', valor: servicos.filter(s => s.ativo).length },
            { label: 'Reofertáveis', valor: servicos.filter(s => s.reofertavel).length },
            { label: 'Ticket médio', valor: `R$ ${servicos.length ? (servicos.reduce((a, s) => a + Number(s.preco), 0) / servicos.length).toFixed(0) : 0}` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.valor}</div>
            </div>
          ))}
        </div>

        {/* FILTRO CATEGORIAS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className={`chip${filtroCategoria === 'todas' ? ' ligado' : ''}`} onClick={() => setFiltroCategoria('todas')}>
            TODAS ({servicos.length})
          </button>
          {CATEGORIAS.map(c => {
            const count = servicos.filter(s => s.categoria === c.value).length
            const ativo = filtroCategoria === c.value
            return (
              <button key={c.value} onClick={() => setFiltroCategoria(c.value)} style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${ativo ? c.cor : 'var(--border-strong)'}`, background: ativo ? c.bg : 'transparent', color: ativo ? c.cor : 'var(--muted)', fontSize: 12, fontWeight: ativo ? 700 : 400, cursor: 'pointer' }}>
                {c.label.toUpperCase()} ({count})
              </button>
            )
          })}
        </div>

        {/* FORM NOVO */}
        {novoAberto && (
          FormServico({ f: form, setF: setForm, onSalvar: salvarNovo, onCancelar: () => setNovoAberto(false), titulo: 'Novo Serviço' })
        )}

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--faint)', fontSize: 13 }}>Carregando...</div>
        ) : servicosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, color: 'var(--border-strong)', marginBottom: 12 }}>◈</div>
            <p style={{ color: 'var(--faint)', fontSize: 13, marginBottom: 20 }}>Nenhum serviço encontrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 90px 110px 90px', gap: 12, padding: '8px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--faint)', textTransform: 'uppercase' }}>
              <div>Nome</div><div>Categoria</div><div>Duração</div><div>Preço</div><div>Reoferta</div><div>Ações</div>
            </div>

            {servicosFiltrados.map(s => (
              <div key={s.id}>
                {editando !== s.id && (
                  <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px 90px 110px 90px', gap: 12, padding: '14px 20px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.nome}</div>
                      {s.descricao && <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{s.descricao}</div>}
                    </div>
                    <div><CatBadge cat={s.categoria || 'base'} /></div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{s.duracao_min} min</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>R$ {Number(s.preco).toFixed(2)}</div>
                    <div>
                      {s.reofertavel ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: s.dias_urgencia && s.dias_urgencia <= 15 ? 'var(--danger)' : s.dias_urgencia && s.dias_urgencia <= 30 ? 'var(--warn)' : 'var(--ok)' }}>●</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{s.dias_urgencia}d</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--faint)' }}>—</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => abrirEdicao(s)} title="Editar" style={{ background: 'transparent' }}>✎</button>
                      <button className="btn btn-sm" onClick={() => toggleAtivo(s.id, s.ativo)} title={s.ativo ? 'Desativar' : 'Ativar'} style={{ background: 'transparent', border: `1px solid ${s.ativo ? 'var(--danger)' : 'var(--ok)'}`, color: s.ativo ? 'var(--danger)' : 'var(--ok)' }}>{s.ativo ? '○' : '●'}</button>
                    </div>
                  </div>
                )}

                {editando === s.id && (
                  FormServico({ f: editForm, setF: setEditForm, onSalvar: () => salvarEdicao(s.id), onCancelar: fecharEdicao, titulo: `Editando: ${s.nome}` })
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
