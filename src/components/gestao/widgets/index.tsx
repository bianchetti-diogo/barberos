'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { WidgetId } from '@/lib/dashboard-config'

/* ───────────────────────── utilidades ───────────────────────── */

type Supabase = ReturnType<typeof createClient>

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const valorAg = (a: any) => Number(a.valor_final ?? a.valor_total ?? 0)
const INATIVOS = ['cancelado', 'faltou']

function inicioMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function inicioProximoMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}
function inicioDia() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function fimDia() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}
function minutosDoHorario(h?: string | null, padrao = 0) {
  if (!h) return padrao
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + (mm || 0)
}

function useDados<T>(carregar: (sb: Supabase) => Promise<T>, inicial: T) {
  const [dados, setDados] = useState<T>(inicial)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    carregar(createClient())
      .then(r => { if (vivo) { setDados(r); setCarregando(false) } })
      .catch(() => { if (vivo) { setErro(true); setCarregando(false) } })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { dados, carregando, erro }
}

/* ───────────────────────── blocos visuais ───────────────────────── */

const bg = '#FFFFFF'
const bgHover = '#FAFAF7'

function Card({ rota, acento, children }: { rota: string; acento?: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(rota)}
      onKeyDown={e => { if (e.key === 'Enter') router.push(rota) }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHover; e.currentTarget.style.borderColor = '#D0CEC8' }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = '#E4E2DC' }}
      style={{
        background: bg, border: '1px solid #E4E2DC', borderRadius: 6,
        padding: '18px 20px', cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', position: 'relative',
        overflow: 'hidden', boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {acento && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: acento }} />}
      {children}
    </div>
  )
}

const eyebrow: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace", fontSize: 9,
  letterSpacing: '0.2em', textTransform: 'uppercase',
  color: '#9A9890', marginBottom: 10,
}
const bigNum: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace", fontSize: 30, fontWeight: 700,
  color: '#1A1A22', lineHeight: 1, letterSpacing: '-0.03em',
}
const medNum: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700,
  color: '#1A1A22', lineHeight: 1, letterSpacing: '-0.03em',
}
const sub: React.CSSProperties = { fontSize: 11, color: '#8A8880', marginTop: 8 }
const link: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace", fontSize: 9,
  letterSpacing: '0.15em', color: '#B0AEA8', textTransform: 'uppercase', marginTop: 10,
}
const ghost: React.CSSProperties = {
  position: 'absolute', bottom: 12, right: 14,
  fontSize: 36, color: '#F0EEE8', fontFamily: 'monospace',
  lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
}

function Vazio({ icone, texto }: { icone: string; texto: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
      <span style={{ fontSize: 28, color: '#E4E2DC' }}>{icone}</span>
      <span style={{ fontSize: 12, color: '#8A8880', textAlign: 'center', lineHeight: 1.6 }}>{texto}</span>
    </div>
  )
}

function Carregando() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spin" />
    </div>
  )
}

const STATUS_COR: Record<string, string> = {
  pendente: '#B8860B', confirmado: '#0369A1', em_atendimento: '#7C3AED',
  concluido: '#16A34A', cancelado: '#9A9890', faltou: '#DC2626',
}

/* ───────────────────────── widgets ───────────────────────── */

export function WidgetFaturamentoMes() {
  const { dados, carregando } = useDados(async sb => {
    const { data } = await sb
      .from('agendamentos')
      .select('valor_total, valor_final, status')
      .gte('data_hora', inicioMes().toISOString())
      .lt('data_hora', inicioProximoMes().toISOString())
    const lista = (data || []).filter((a: any) => !INATIVOS.includes(a.status))
    const concluidos = lista.filter((a: any) => a.status === 'concluido')
    return {
      realizado: concluidos.reduce((s: number, a: any) => s + valorAg(a), 0),
      previsto: lista.filter((a: any) => a.status !== 'concluido').reduce((s: number, a: any) => s + valorAg(a), 0),
      qtd: concluidos.length,
    }
  }, { realizado: 0, previsto: 0, qtd: 0 })

  return (
    <Card rota="/gestao/financeiro" acento="#B8860B">
      <div>
        <div style={eyebrow}>Faturamento do Mês</div>
        <div style={bigNum}>{carregando ? '—' : brl(dados.realizado)}</div>
        <div style={sub}>
          {carregando ? 'Carregando...' : `${dados.qtd} atendimento${dados.qtd === 1 ? '' : 's'} concluído${dados.qtd === 1 ? '' : 's'}${dados.previsto > 0 ? ` · ${brl(dados.previsto)} previstos` : ''}`}
        </div>
      </div>
      <div style={link}>→ Ver faturamento</div>
      <div style={ghost}>◈</div>
    </Card>
  )
}

export function WidgetAtendimentosHoje() {
  const { dados, carregando } = useDados(async sb => {
    const { data } = await sb
      .from('agendamentos')
      .select('status')
      .gte('data_hora', inicioDia().toISOString())
      .lte('data_hora', fimDia().toISOString())
    const lista = (data || []).filter((a: any) => !INATIVOS.includes(a.status))
    const feitos = lista.filter((a: any) => a.status === 'concluido').length
    return { total: lista.length, feitos }
  }, { total: 0, feitos: 0 })

  return (
    <Card rota="/gestao/agenda" acento="#B8860B">
      <div>
        <div style={eyebrow}>Atendimentos Hoje</div>
        <div style={medNum}>{carregando ? '—' : dados.total}</div>
        <div style={sub}>
          {carregando ? 'Carregando...' : dados.total === 0 ? 'Agenda livre hoje' : `${dados.feitos} concluído${dados.feitos === 1 ? '' : 's'} · ${dados.total - dados.feitos} restante${dados.total - dados.feitos === 1 ? '' : 's'}`}
        </div>
      </div>
      <div style={link}>→ Ver agenda</div>
      <div style={ghost}>▦</div>
    </Card>
  )
}

export function WidgetTicketMedio() {
  const { dados, carregando } = useDados(async sb => {
    const { data } = await sb
      .from('agendamentos')
      .select('valor_total, valor_final')
      .eq('status', 'concluido')
      .gte('data_hora', inicioMes().toISOString())
      .lt('data_hora', inicioProximoMes().toISOString())
    const lista = data || []
    const total = lista.reduce((s: number, a: any) => s + valorAg(a), 0)
    return { media: lista.length ? total / lista.length : 0, qtd: lista.length }
  }, { media: 0, qtd: 0 })

  return (
    <Card rota="/gestao/financeiro" acento="#3B82F6">
      <div>
        <div style={eyebrow}>Ticket Médio</div>
        <div style={medNum}>{carregando ? '—' : brl(dados.media)}</div>
        <div style={sub}>{carregando ? 'Carregando...' : dados.qtd === 0 ? 'Sem atendimentos concluídos' : `Base: ${dados.qtd} atendimentos`}</div>
      </div>
      <div style={link}>→ Ver faturamento</div>
      <div style={ghost}>◉</div>
    </Card>
  )
}

export function WidgetTaxaOcupacao() {
  const { dados, carregando } = useDados(async sb => {
    const [{ data: ags }, { data: barbs }, { data: cfg }] = await Promise.all([
      sb.from('agendamentos').select('duracao_min, status')
        .gte('data_hora', inicioDia().toISOString()).lte('data_hora', fimDia().toISOString()),
      sb.from('barbeiros').select('id').eq('ativo', true),
      sb.from('configuracoes').select('horario_abertura, horario_fechamento').limit(1),
    ])
    const abre = minutosDoHorario(cfg?.[0]?.horario_abertura, 8 * 60)
    const fecha = minutosDoHorario(cfg?.[0]?.horario_fechamento, 20 * 60)
    const capacidade = (barbs?.length || 0) * Math.max(fecha - abre, 0)
    const ocupado = (ags || [])
      .filter((a: any) => !INATIVOS.includes(a.status))
      .reduce((s: number, a: any) => s + Number(a.duracao_min || 0), 0)
    return { pct: capacidade > 0 ? Math.min(100, Math.round((ocupado / capacidade) * 100)) : 0, barbeiros: barbs?.length || 0 }
  }, { pct: 0, barbeiros: 0 })

  return (
    <Card rota="/gestao/agenda" acento="#2ECC71">
      <div>
        <div style={eyebrow}>Ocupação Hoje</div>
        <div style={medNum}>{carregando ? '—' : `${dados.pct}%`}</div>
        <div style={{ height: 5, background: '#F0EEE8', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
          <div style={{ width: `${dados.pct}%`, height: '100%', background: dados.pct >= 80 ? '#16A34A' : dados.pct >= 40 ? '#B8860B' : '#9A9890', transition: 'width 0.4s' }} />
        </div>
      </div>
      <div style={link}>→ Agenda</div>
    </Card>
  )
}

export function WidgetProximosAgendamentos() {
  const { dados, carregando } = useDados(async sb => {
    const { data } = await sb
      .from('agendamentos')
      .select('id, data_hora, status, duracao_min, cliente:clientes(nome), barbeiro:barbeiros(nome), servico:servicos(nome)')
      .gte('data_hora', new Date().toISOString())
      .lte('data_hora', fimDia().toISOString())
      .not('status', 'in', '(cancelado,faltou,concluido)')
      .order('data_hora')
      .limit(6)
    return (data || []) as any[]
  }, [] as any[])

  return (
    <Card rota="/gestao/agenda" acento="#8B5CF6">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={eyebrow}>Próximos Agendamentos</div>
        {carregando ? <Carregando /> : dados.length === 0 ? (
          <Vazio icone="▦" texto="Nenhum agendamento pendente para o resto do dia." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dados.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#FAFAF7', border: '1px solid #EEECE6', borderLeft: `3px solid ${STATUS_COR[a.status] || '#9A9890'}`, borderRadius: 4 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1A1A22', width: 44 }}>
                  {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.cliente?.nome || 'Cliente'}</div>
                  <div style={{ fontSize: 10, color: '#9A9890', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.servico?.nome || '—'}</div>
                </div>
                <span style={{ fontSize: 10, color: '#6A6860' }}>✂ {a.barbeiro?.nome || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={link}>→ Ver agenda</div>
    </Card>
  )
}

export function WidgetTopBarbeiros() {
  const { dados, carregando } = useDados(async sb => {
    const { data } = await sb
      .from('agendamentos')
      .select('barbeiro_id, valor_total, valor_final, barbeiro:barbeiros(nome)')
      .eq('status', 'concluido')
      .gte('data_hora', inicioMes().toISOString())
      .lt('data_hora', inicioProximoMes().toISOString())
    const mapa: Record<string, { nome: string; total: number; qtd: number }> = {}
    for (const a of (data || []) as any[]) {
      if (!a.barbeiro_id) continue
      const nome = a.barbeiro?.nome || 'Barbeiro'
      if (!mapa[a.barbeiro_id]) mapa[a.barbeiro_id] = { nome, total: 0, qtd: 0 }
      mapa[a.barbeiro_id].total += valorAg(a)
      mapa[a.barbeiro_id].qtd += 1
    }
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [] as { nome: string; total: number; qtd: number }[])

  const maior = dados[0]?.total || 1

  return (
    <Card rota="/gestao/financeiro" acento="#B8860B">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={eyebrow}>Top Barbeiros · Mês</div>
        {carregando ? <Carregando /> : dados.length === 0 ? (
          <Vazio icone="✂" texto="Nenhum atendimento concluído neste mês ainda." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dados.map((b, i) => (
              <div key={b.nome + i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: '#1A1A22' }}>{i + 1}. {b.nome}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", color: '#6A6860' }}>{brl(b.total)} · {b.qtd}</span>
                </div>
                <div style={{ height: 4, background: '#F0EEE8', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(b.total / maior) * 100}%`, height: '100%', background: '#B8860B' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={link}>→ Ver faturamento</div>
    </Card>
  )
}

export function WidgetNovosClientes() {
  const { dados, carregando } = useDados(async sb => {
    const { count } = await sb
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .gte('criado_em', inicioMes().toISOString())
    return count || 0
  }, 0)

  return (
    <Card rota="/gestao/clientes" acento="#06B6D4">
      <div>
        <div style={eyebrow}>Novos Clientes</div>
        <div style={medNum}>{carregando ? '—' : dados}</div>
        <div style={sub}>Cadastrados neste mês</div>
      </div>
      <div style={link}>→ Ver clientes</div>
      <div style={ghost}>◎</div>
    </Card>
  )
}

export function WidgetAlertas() {
  const { dados, carregando } = useDados(async sb => {
    const [{ data: produtos }, { data: pendentes }] = await Promise.all([
      sb.from('produtos').select('nome, estoque').lte('estoque', 3).order('estoque').limit(4),
      sb.from('agendamentos').select('id')
        .eq('status', 'pendente')
        .gte('data_hora', inicioDia().toISOString()).lte('data_hora', fimDia().toISOString()),
    ])
    return { produtos: (produtos || []) as { nome: string; estoque: number }[], pendentes: pendentes?.length || 0 }
  }, { produtos: [] as { nome: string; estoque: number }[], pendentes: 0 })

  const alertas: { cor: string; texto: string }[] = []
  if (dados.pendentes > 0) alertas.push({ cor: '#B8860B', texto: `${dados.pendentes} agendamento${dados.pendentes === 1 ? '' : 's'} de hoje aguardando confirmação` })
  dados.produtos.forEach(p => alertas.push({
    cor: p.estoque === 0 ? '#DC2626' : '#D97706',
    texto: p.estoque === 0 ? `${p.nome}: sem estoque` : `${p.nome}: estoque baixo (${p.estoque} un)`,
  }))

  return (
    <Card rota="/gestao/produtos" acento="#EF4444">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={eyebrow}>Alertas</div>
        {carregando ? <Carregando /> : alertas.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <span style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: 3, padding: '5px 10px', fontSize: 11, color: '#16A34A', fontFamily: "'Space Mono', monospace" }}>✓ Tudo em ordem</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertas.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4A4840' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: a.cor, flexShrink: 0 }} />
                {a.texto}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={link}>→ Ver produtos</div>
    </Card>
  )
}

export const WIDGET_MAP: Record<WidgetId, React.ComponentType> = {
  faturamento_mes: WidgetFaturamentoMes,
  atendimentos_hoje: WidgetAtendimentosHoje,
  ticket_medio: WidgetTicketMedio,
  taxa_ocupacao: WidgetTaxaOcupacao,
  proximos_agendamentos: WidgetProximosAgendamentos,
  top_barbeiros: WidgetTopBarbeiros,
  novos_clientes: WidgetNovosClientes,
  alertas: WidgetAlertas,
}
