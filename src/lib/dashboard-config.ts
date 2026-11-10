// Widgets nativos: faturamento_mes, atendimentos_hoje, ticket_medio, taxa_ocupacao,
// proximos_agendamentos, top_barbeiros, alertas, novos_clientes.
// Módulos instalados podem acrescentar os seus (ver src/modules/types.ts), por isso é string.
export type WidgetId = string

export type WidgetSize = '1x1' | '2x1' | '1x2' | '2x2'

export interface WidgetConfig {
  id: WidgetId
  label: string
  descricao: string
  tamanho: WidgetSize
  rota: string
  categoria: 'financeiro' | 'operacional' | 'clientes' | 'sistema'
  icone: string
}

export interface PerfilDashboard {
  id: string
  nome: string
  widgets: WidgetId[]
  criadoEm: string
}

export const WIDGETS_DISPONIVEIS: WidgetConfig[] = [
  {
    id: 'faturamento_mes',
    label: 'Faturamento do Mês',
    descricao: 'Receita bruta acumulada no mês atual',
    tamanho: '2x1',
    rota: '/gestao/financeiro',
    categoria: 'financeiro',
    icone: '◈',
  },
  {
    id: 'atendimentos_hoje',
    label: 'Atendimentos Hoje',
    descricao: 'Total de atendimentos realizados hoje',
    tamanho: '1x1',
    rota: '/gestao/agenda',
    categoria: 'operacional',
    icone: '▦',
  },
  {
    id: 'ticket_medio',
    label: 'Ticket Médio',
    descricao: 'Valor médio por atendimento no mês',
    tamanho: '1x1',
    rota: '/gestao/financeiro',
    categoria: 'financeiro',
    icone: '◉',
  },
  {
    id: 'taxa_ocupacao',
    label: 'Taxa de Ocupação',
    descricao: 'Percentual de horários ocupados hoje',
    tamanho: '1x1',
    rota: '/gestao/agenda',
    categoria: 'operacional',
    icone: '◎',
  },
  {
    id: 'proximos_agendamentos',
    label: 'Próximos Agendamentos',
    descricao: 'Lista dos próximos atendimentos do dia',
    tamanho: '2x2',
    rota: '/gestao/agenda',
    categoria: 'operacional',
    icone: '▤',
  },
  {
    id: 'top_barbeiros',
    label: 'Top Barbeiros',
    descricao: 'Ranking de faturamento dos barbeiros',
    tamanho: '2x1',
    rota: '/gestao/barbeiros',
    categoria: 'operacional',
    icone: '✂',
  },
  {
    id: 'novos_clientes',
    label: 'Novos Clientes',
    descricao: 'Clientes cadastrados no mês atual',
    tamanho: '1x1',
    rota: '/gestao/clientes',
    categoria: 'clientes',
    icone: '◎',
  },
  {
    id: 'alertas',
    label: 'Alertas do Sistema',
    descricao: 'Estoque baixo, cancelamentos e avisos',
    tamanho: '2x1',
    rota: '/gestao/configuracoes',
    categoria: 'sistema',
    icone: '◌',
  },
]

export const PERFIL_PADRAO: PerfilDashboard = {
  id: 'padrao',
  nome: 'Padrão',
  widgets: ['faturamento_mes', 'atendimentos_hoje', 'ticket_medio', 'taxa_ocupacao', 'proximos_agendamentos', 'top_barbeiros'],
  criadoEm: new Date().toISOString(),
}

export function carregarPerfis(): PerfilDashboard[] {
  if (typeof window === 'undefined') return [PERFIL_PADRAO]
  const salvo = localStorage.getItem('barberos_perfis_dashboard')
  if (!salvo) return [PERFIL_PADRAO]
  try {
    return JSON.parse(salvo)
  } catch {
    return [PERFIL_PADRAO]
  }
}

export function salvarPerfis(perfis: PerfilDashboard[]) {
  localStorage.setItem('barberos_perfis_dashboard', JSON.stringify(perfis))
}

export function carregarPerfilAtivo(): string {
  if (typeof window === 'undefined') return 'padrao'
  return localStorage.getItem('barberos_perfil_ativo') || 'padrao'
}

export function salvarPerfilAtivo(id: string) {
  localStorage.setItem('barberos_perfil_ativo', id)
}