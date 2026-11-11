import type { ReactNode } from 'react'

/** Ícones de traço (24x24, traço 2, sem preenchimento). Usados no menu e nos blocos. */
const ICONES: Record<string, ReactNode> = {
  painel: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>),
  agenda: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  clientes: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
  barbeiros: (<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></>),
  servicos: (<><path d="m12 2-10 5 10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5M2 12l10 5 10-5" /></>),
  produtos: (<><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="m3 8 9 5 9-5M12 13v8" /></>),
  configuracoes: (<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></>),
  financeiro: (<><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" /></>),
  relatorios: (<><path d="M18 20V10M12 20V4M6 20v-6" /></>),
  mensagens: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>),
  sair: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>),
  sol: (<><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>),
  lua: (<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>),
  recolher: (<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>),
  filtro: (<><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></>),
  grafico: (<><path d="M3 3v18h18" /><path d="m7 14 4-4 4 4 5-6" /></>),
}

export function temIcone(nome: string): boolean {
  return nome in ICONES
}

export default function Icon({ nome, tamanho = 18 }: { nome: string; tamanho?: number }) {
  const conteudo = ICONES[nome]
  // Módulos de terceiros podem informar um caractere/emoji em vez de um nome de ícone
  if (!conteudo) return <span style={{ fontSize: tamanho - 2, lineHeight: 1 }}>{nome}</span>
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {conteudo}
    </svg>
  )
}
