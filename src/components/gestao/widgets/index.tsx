'use client'

import { useRouter } from 'next/navigation'
import { WidgetId } from '@/lib/dashboard-config'

const bg = '#FFFFFF'
const bgHover = '#FAFAF7'
const border = '1px solid #E4E2DC'

function Card({ rota, acento, children }: { rota: string; acento?: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(rota)}
      onMouseEnter={e => { e.currentTarget.style.background = bgHover; e.currentTarget.style.borderColor = '#D0CEC8' }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = '#E4E2DC' }}
      style={{
        background: bg, border, borderRadius: 4,
        padding: '18px 20px', cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', position: 'relative',
        overflow: 'hidden', boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {acento && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: acento }} />}
      {children}
    </div>
  )
}

function LargeCard({ rota, acento, children }: { rota: string; acento?: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(rota)}
      onMouseEnter={e => { e.currentTarget.style.background = bgHover }}
      onMouseLeave={e => { e.currentTarget.style.background = bg }}
      style={{
        background: bg, border, borderRadius: 4,
        padding: '18px 20px', cursor: 'pointer',
        transition: 'background 0.15s',
        height: '100%', display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {acento && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: acento }} />}
      {children}
    </div>
  )
}

const eyebrow: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 9,
  letterSpacing: '0.2em', textTransform: 'uppercase',
  color: '#9A9890', marginBottom: 10,
}
const bigNum: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 32, fontWeight: 700,
  color: '#1A1A22', lineHeight: 1, letterSpacing: '-0.03em',
}
const medNum: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 26, fontWeight: 700,
  color: '#1A1A22', lineHeight: 1, letterSpacing: '-0.03em',
}
const sub: React.CSSProperties = { fontSize: 11, color: '#8A8880', marginTop: 6 }
const link: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 9,
  letterSpacing: '0.15em', color: '#B0AEA8', textTransform: 'uppercase',
}
const ghost: React.CSSProperties = {
  position: 'absolute', bottom: 12, right: 14,
  fontSize: 36, color: '#F0EEE8', fontFamily: 'monospace',
  lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
}

export function WidgetFaturamentoMes() {
  return (
    <Card rota="/gestao/financeiro" acento="#B8860B">
      <div>
        <div style={eyebrow}>Faturamento do Mês</div>
        <div style={bigNum}>R$ 0</div>
        <div style={sub}>Nenhum atendimento registrado</div>
      </div>
      <div style={link}>→ Ver financeiro</div>
      <div style={ghost}>◈</div>
    </Card>
  )
}

export function WidgetAtendimentosHoje() {
  return (
    <Card rota="/gestao/agenda" acento="#B8860B">
      <div>
        <div style={eyebrow}>Atendimentos Hoje</div>
        <div style={medNum}>0</div>
        <div style={sub}>Agenda vazia</div>
      </div>
      <div style={link}>→ Ver agenda</div>
      <div style={ghost}>▦</div>
    </Card>
  )
}

export function WidgetTicketMedio() {
  return (
    <Card rota="/gestao/financeiro" acento="#3B82F6">
      <div>
        <div style={eyebrow}>Ticket Médio</div>
        <div style={medNum}>R$ 0</div>
        <div style={sub}>Sem dados ainda</div>
      </div>
      <div style={link}>→ Ver financeiro</div>
      <div style={ghost}>◉</div>
    </Card>
  )
}

export function WidgetTaxaOcupacao() {
  return (
    <Card rota="/gestao/agenda" acento="#2ECC71">
      <div>
        <div style={eyebrow}>Ocupação</div>
        <div style={medNum}>0%</div>
        <div style={sub}>Sem horários</div>
      </div>
      <div style={link}>→ Agenda</div>
      <div style={ghost}>◎</div>
    </Card>
  )
}

export function WidgetProximosAgendamentos() {
  const router = useRouter()
  return (
    <LargeCard rota="/gestao/agenda" acento="#8B5CF6">
      <div style={eyebrow}>Próximos Agendamentos</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 28, color: '#E4E2DC' }}>▦</span>
        <span style={{ fontSize: 12, color: '#8A8880', textAlign: 'center', lineHeight: 1.6 }}>
          Nenhum agendamento cadastrado.<br />Configure a agenda para começar.
        </span>
      </div>
      <div style={link}>→ Ver agenda</div>
    </LargeCard>
  )
}

export function WidgetTopBarbeiros() {
  const router = useRouter()
  return (
    <LargeCard rota="/gestao/barbeiros" acento="#B8860B">
      <div style={eyebrow}>Top Barbeiros</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 28, color: '#E4E2DC' }}>✂</span>
        <span style={{ fontSize: 12, color: '#8A8880', textAlign: 'center' }}>
          Nenhum barbeiro cadastrado ainda.
        </span>
      </div>
      <div style={link}>→ Cadastrar barbeiros</div>
    </LargeCard>
  )
}

export function WidgetNovosClientes() {
  return (
    <Card rota="/gestao/clientes" acento="#06B6D4">
      <div>
        <div style={eyebrow}>Novos Clientes</div>
        <div style={medNum}>0</div>
        <div style={sub}>Neste mês</div>
      </div>
      <div style={link}>→ Ver clientes</div>
      <div style={ghost}>◎</div>
    </Card>
  )
}

export function WidgetAlertas() {
  const router = useRouter()
  return (
    <LargeCard rota="/gestao/configuracoes" acento="#EF4444">
      <div style={eyebrow}>Alertas do Sistema</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <span style={{
          background: 'rgba(46,204,113,0.08)',
          border: '1px solid rgba(46,204,113,0.25)',
          borderRadius: 3, padding: '5px 10px',
          fontSize: 11, color: '#16A34A', fontFamily: 'monospace',
        }}>✓ Sistema operacional</span>
      </div>
      <div style={link}>→ Configurações</div>
    </LargeCard>
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
