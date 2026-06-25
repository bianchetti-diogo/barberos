'use client'

import { useState, useEffect } from 'react'
import {
  WIDGETS_DISPONIVEIS, WidgetId, PerfilDashboard,
  carregarPerfis, salvarPerfis, carregarPerfilAtivo, salvarPerfilAtivo, PERFIL_PADRAO
} from '@/lib/dashboard-config'
import { WIDGET_MAP } from '@/components/gestao/widgets'

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
    const interval = setInterval(tick, 1000)
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
    <div style={{ minHeight: '100vh', background: '#F4F2ED', color: '#1A1A22', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        padding: '20px 28px',
        borderBottom: '1px solid #E0DED8',
        background: '#FAFAF7',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>
            {hoje}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22', lineHeight: 1.2 }}>
            Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#B8860B', letterSpacing: '0.05em', marginRight: 4 }}>
            {hora}
          </div>

          {perfis.map(p => (
            <button key={p.id} onClick={() => trocarPerfil(p.id)} style={{
              padding: '5px 12px',
              background: perfilAtivoId === p.id ? 'rgba(184,134,11,0.1)' : 'transparent',
              border: `1px solid ${perfilAtivoId === p.id ? '#B8860B' : '#D8D6D0'}`,
              borderRadius: 3, cursor: 'pointer',
              color: perfilAtivoId === p.id ? '#8A6200' : '#6A6860',
              fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.05em',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
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
            fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.08em', transition: 'all 0.15s',
          }}>
            {editando ? '✕ FECHAR' : '◈ PERSONALIZAR'}
          </button>
        </div>
      </div>

      {/* PAINEL EDIÇÃO */}
      {editando && (
        <div style={{ background: '#FAFAF7', borderBottom: '1px solid #E0DED8', padding: '20px 28px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 14 }}>
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
                  borderRadius: 3, cursor: 'pointer',
                  color: ativo ? '#8A6200' : '#6A6860',
                  fontSize: 11, transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
                }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ativo ? '◉' : '○'} {w.label}</span>
                  <span style={{ fontSize: 10, color: ativo ? '#A08040' : '#9A9890' }}>{w.descricao}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={salvarPerfilAtual} style={{
              padding: '8px 18px', background: '#B8860B', color: '#FFF',
              border: 'none', borderRadius: 3, fontSize: 11,
              fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
            }}>
              SALVAR "{perfilAtivo?.nome?.toUpperCase()}"
            </button>
            {!salvandoNovo ? (
              <button onClick={() => setSalvandoNovo(true)} style={{
                padding: '8px 14px', background: '#FFFFFF',
                border: '1px solid #D8D6D0', borderRadius: 3,
                color: '#6A6860', fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
              }}>+ NOVO PERFIL</button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input autoFocus value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && criarNovoPerfil()}
                  placeholder="Nome do perfil..."
                  style={{
                    padding: '8px 12px', background: '#FFF',
                    border: '1px solid #D8D6D0', borderRadius: 3,
                    color: '#1A1A22', fontSize: 11, fontFamily: 'monospace',
                    outline: 'none', width: 180,
                  }} />
                <button onClick={criarNovoPerfil} style={{ padding: '8px 12px', background: '#B8860B', color: '#FFF', border: 'none', borderRadius: 3, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>CRIAR</button>
                <button onClick={() => setSalvandoNovo(false)} style={{ padding: '8px 10px', background: '#FFF', border: '1px solid #D8D6D0', borderRadius: 3, color: '#9A9890', fontSize: 11, cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRID */}
      <div style={{ padding: '20px 24px' }}>
        {widgetsExibidos.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
            <span style={{ fontSize: 40, color: '#D8D6D0' }}>⬡</span>
            <p style={{ color: '#9A9890', fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>
              Nenhum widget selecionado.<br />Clique em Personalizar para adicionar.
            </p>
            <button onClick={() => setEditando(true)} style={{
              padding: '9px 22px', background: '#B8860B', color: '#FFF',
              border: 'none', borderRadius: 3, fontSize: 11,
              fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em',
            }}>◈ PERSONALIZAR DASHBOARD</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            gridAutoRows: '140px',
            gap: 10,
          }}>
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
