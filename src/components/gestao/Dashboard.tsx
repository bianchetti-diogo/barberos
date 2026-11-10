'use client'

import { useState, useEffect } from 'react'
import {
  WIDGETS_DISPONIVEIS, WidgetId, PerfilDashboard,
  carregarPerfis, salvarPerfis, carregarPerfilAtivo, salvarPerfilAtivo, PERFIL_PADRAO
} from '@/lib/dashboard-config'
import { WIDGET_MAP } from '@/components/gestao/widgets'

// Posição de cada widget na grade de 12 colunas (em telas menores a grade vira 2 ou 1 coluna via CSS)
const LAYOUT: Record<WidgetId, React.CSSProperties> = {
  faturamento_mes:       { gridColumn: '1 / 5',  gridRow: '1 / 2' },
  atendimentos_hoje:     { gridColumn: '5 / 8',  gridRow: '1 / 2' },
  ticket_medio:          { gridColumn: '8 / 11', gridRow: '1 / 2' },
  taxa_ocupacao:         { gridColumn: '11 / 13',gridRow: '1 / 2' },
  proximos_agendamentos: { gridColumn: '1 / 7',  gridRow: '2 / 4' },
  top_barbeiros:         { gridColumn: '7 / 13', gridRow: '2 / 4' },
  novos_clientes:        { gridColumn: '1 / 4',  gridRow: '4 / 5' },
  alertas:               { gridColumn: '4 / 13', gridRow: '4 / 5' },
}

export default function Dashboard() {
  const [perfis, setPerfis] = useState<PerfilDashboard[]>([PERFIL_PADRAO])
  const [perfilAtivoId, setPerfilAtivoId] = useState('padrao')
  const [editando, setEditando] = useState(false)
  const [widgetsSelecionados, setWidgetsSelecionados] = useState<WidgetId[]>(PERFIL_PADRAO.widgets)
  const [novoNome, setNovoNome] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)
  const [hora, setHora] = useState('')

  useEffect(() => {
    const p = carregarPerfis()
    const id = carregarPerfilAtivo()
    setPerfis(p)
    setPerfilAtivoId(id)
    const perfil = p.find(x => x.id === id) || p[0]
    setWidgetsSelecionados(perfil.widgets)
    const tick = () => setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const interval = setInterval(tick, 15000)
    return () => clearInterval(interval)
  }, [])

  const perfilAtivo = perfis.find(p => p.id === perfilAtivoId) || perfis[0]
  const widgetsExibidos = editando ? widgetsSelecionados : (perfilAtivo?.widgets || [])

  function trocarPerfil(id: string) {
    const p = perfis.find(x => x.id === id)
    if (!p) return
    setPerfilAtivoId(id)
    salvarPerfilAtivo(id)
    setWidgetsSelecionados(p.widgets)
  }

  function toggleWidget(id: WidgetId) {
    setWidgetsSelecionados(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    )
  }

  function salvarPerfilAtual() {
    const atualizados = perfis.map(p =>
      p.id === perfilAtivoId ? { ...p, widgets: widgetsSelecionados } : p
    )
    setPerfis(atualizados)
    salvarPerfis(atualizados)
    setEditando(false)
  }

  function criarNovoPerfil() {
    if (!novoNome.trim()) return
    const novo: PerfilDashboard = {
      id: Date.now().toString(),
      nome: novoNome.trim(),
      widgets: widgetsSelecionados,
      criadoEm: new Date().toISOString(),
    }
    const atualizados = [...perfis, novo]
    setPerfis(atualizados)
    salvarPerfis(atualizados)
    setPerfilAtivoId(novo.id)
    salvarPerfilAtivo(novo.id)
    setNovoNome('')
    setSalvandoNovo(false)
    setEditando(false)
  }

  function excluirPerfil(id: string) {
    if (id === 'padrao') return
    const atualizados = perfis.filter(p => p.id !== id)
    setPerfis(atualizados)
    salvarPerfis(atualizados)
    trocarPerfil('padrao')
  }

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ color: '#1A1A22', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">{hoje}</div>
          <h1 className="page-title">Dashboard</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: '#B8860B', letterSpacing: '0.05em', marginRight: 4 }}>
            {hora}
          </div>

          {perfis.map(p => (
            <button key={p.id} onClick={() => trocarPerfil(p.id)} style={{
              padding: '5px 12px',
              background: perfilAtivoId === p.id ? 'rgba(184,134,11,0.1)' : 'transparent',
              border: `1px solid ${perfilAtivoId === p.id ? '#B8860B' : '#D8D6D0'}`,
              borderRadius: 3, cursor: 'pointer',
              color: perfilAtivoId === p.id ? '#8A6200' : '#6A6860',
              fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {p.nome}
              {p.id !== 'padrao' && (
                <span onClick={e => { e.stopPropagation(); excluirPerfil(p.id) }}
                  style={{ color: '#B0AEA8', fontSize: 9 }}>✕</span>
              )}
            </button>
          ))}

          <button onClick={() => setEditando(!editando)} style={{
            padding: '6px 14px',
            background: editando ? 'rgba(184,134,11,0.1)' : '#FFFFFF',
            border: `1px solid ${editando ? '#B8860B' : '#D8D6D0'}`,
            borderRadius: 3, cursor: 'pointer',
            color: editando ? '#8A6200' : '#4A4840',
            fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em',
          }}>
            {editando ? '✕ FECHAR' : '◈ PERSONALIZAR'}
          </button>
        </div>
      </div>

      {/* PAINEL EDIÇÃO */}
      {editando && (
        <div style={{ background: '#FAFAF7', borderBottom: '1px solid #E0DED8', padding: '20px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Selecione os widgets — clique para ativar/desativar
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {WIDGETS_DISPONIVEIS.map(w => {
              const ativo = widgetsSelecionados.includes(w.id)
              return (
                <button key={w.id} onClick={() => toggleWidget(w.id)} style={{
                  padding: '8px 14px',
                  background: ativo ? 'rgba(184,134,11,0.08)' : '#FFFFFF',
                  border: `1px solid ${ativo ? '#B8860B' : '#D8D6D0'}`,
                  borderRadius: 4, cursor: 'pointer',
                  color: ativo ? '#8A6200' : '#6A6860',
                  fontSize: 11,
                  display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
                }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>{ativo ? '◉' : '○'} {w.label}</span>
                  <span style={{ fontSize: 10, color: ativo ? '#A08040' : '#9A9890' }}>{w.descricao}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={salvarPerfilAtual} className="btn btn-primary" style={{ fontSize: 11 }}>
              SALVAR &quot;{perfilAtivo?.nome?.toUpperCase()}&quot;
            </button>
            {!salvandoNovo ? (
              <button onClick={() => setSalvandoNovo(true)} className="btn" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                + NOVO PERFIL
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input autoFocus value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && criarNovoPerfil()}
                  placeholder="Nome do perfil..."
                  className="field"
                  style={{ width: 200, padding: '8px 12px', fontSize: 12 }} />
                <button onClick={criarNovoPerfil} className="btn btn-primary" style={{ fontSize: 11 }}>CRIAR</button>
                <button onClick={() => setSalvandoNovo(false)} className="btn" style={{ fontSize: 11 }}>✕</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRID */}
      <div style={{ padding: '20px 28px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {widgetsExibidos.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <span style={{ fontSize: 40, color: '#D8D6D0' }}>⬡</span>
            <p style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>
              Nenhum widget selecionado.<br />Clique em Personalizar para adicionar.
            </p>
            <button onClick={() => setEditando(true)} className="btn btn-primary">◈ PERSONALIZAR DASHBOARD</button>
          </div>
        ) : (
          <div className="dash-grid">
            {widgetsExibidos.map(id => {
              const WidgetComp = WIDGET_MAP[id]
              if (!WidgetComp) return null
              return (
                <div key={id} style={LAYOUT[id] || { gridColumn: 'span 3' }}>
                  <WidgetComp />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
