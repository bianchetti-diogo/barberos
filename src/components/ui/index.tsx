import type { ReactNode } from 'react'

/**
 * Peças visuais compartilhadas. Módulos internos devem usá-las para manter
 * o mesmo visual do núcleo (cabeçalho fixo, cartões, estados vazios).
 * As classes CSS (.card, .btn, .field, .badge etc.) ficam em src/app/globals.css.
 */

export function PageHeader({ eyebrow, titulo, acoes }: { eyebrow?: string; titulo: string; acoes?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{titulo}</h1>
      </div>
      {acoes && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{acoes}</div>}
    </div>
  )
}

export function PageBody({ children, larguraMax }: { children: ReactNode; larguraMax?: number }) {
  return <div className="page-body" style={larguraMax ? { maxWidth: larguraMax } : undefined}>{children}</div>
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stat-grid">{children}</div>
}

export function StatCard({ rotulo, valor, cor }: { rotulo: string; valor: ReactNode; cor?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{rotulo}</div>
      <div className="stat-value" style={cor ? { color: cor } : undefined}>{valor}</div>
    </div>
  )
}

export function EmptyState({ icone = '◌', texto, acao }: { icone?: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 32, marginBottom: 10, color: 'var(--border-strong)' }}>{icone}</div>
      <p style={{ fontSize: 13, marginBottom: acao ? 16 : 0 }}>{texto}</p>
      {acao}
    </div>
  )
}

export function Carregando() {
  return <div style={{ textAlign: 'center', padding: '60px 0' }}><span className="spin" /></div>
}
