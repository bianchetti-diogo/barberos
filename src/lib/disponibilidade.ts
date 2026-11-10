import type { SupabaseClient } from '@supabase/supabase-js'

// Horário de Brasília (o sistema inteiro grava os horários com este deslocamento)
const TZ = '-03:00'
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

export interface SlotDisponivel {
  hora: string // "HH:MM"
  barbeiroIds: string[] // barbeiros livres nesse horário
}

interface Opcoes {
  barbeariaId: string
  data: string // "YYYY-MM-DD"
  duracaoMin: number
  barbeiroId?: string | null
}

function minutos(h: string | null | undefined, padrao: number) {
  if (!h) return padrao
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + (mm || 0)
}

function hhmm(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Calcula os horários livres de um dia, respeitando: dias e horário de funcionamento,
 * disponibilidade individual de cada barbeiro, agendamentos já marcados e a duração do serviço.
 * Use sempre com o cliente admin (servidor): o cliente final não pode ler a agenda dos outros.
 */
export async function calcularSlots(admin: SupabaseClient, opcoes: Opcoes): Promise<SlotDisponivel[]> {
  const { barbeariaId, data, duracaoMin, barbeiroId } = opcoes

  const { data: cfgs } = await admin
    .from('configuracoes')
    .select('horario_abertura, horario_fechamento, intervalo_agendamento, dias_funcionamento')
    .eq('barbearia_id', barbeariaId)
    .limit(1)
  const cfg = cfgs?.[0]

  const abre = minutos(cfg?.horario_abertura, 8 * 60)
  const fecha = minutos(cfg?.horario_fechamento, 20 * 60)
  const intervalo = Number(cfg?.intervalo_agendamento) || 30
  const diasFuncionamento: string[] = cfg?.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex', 'sab']

  const dia = DIAS_SEMANA[new Date(`${data}T12:00:00${TZ}`).getUTCDay()]
  if (!diasFuncionamento.includes(dia)) return []

  let consultaBarbeiros = admin
    .from('barbeiros')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
  if (barbeiroId) consultaBarbeiros = consultaBarbeiros.eq('id', barbeiroId)
  const { data: barbeiros } = await consultaBarbeiros
  const ids: string[] = (barbeiros || []).map((b: any) => b.id)
  if (ids.length === 0) return []

  const [{ data: disponibilidade }, { data: agendamentos }] = await Promise.all([
    admin
      .from('disponibilidade_barbeiro')
      .select('barbeiro_id, hora_inicio, hora_fim')
      .in('barbeiro_id', ids)
      .eq('dia_semana', dia)
      .eq('ativo', true),
    admin
      .from('agendamentos')
      .select('barbeiro_id, data_hora, duracao_min')
      .in('barbeiro_id', ids)
      .gte('data_hora', `${data}T00:00:00${TZ}`)
      .lte('data_hora', `${data}T23:59:59${TZ}`)
      .not('status', 'in', '(cancelado,faltou)'),
  ])

  // Janelas de trabalho de cada barbeiro: a configurada individualmente ou a da barbearia
  const janelas: Record<string, { ini: number; fim: number }[]> = {}
  ids.forEach(id => { janelas[id] = [] })
  ;(disponibilidade || []).forEach((d: any) => {
    janelas[d.barbeiro_id]?.push({ ini: minutos(d.hora_inicio, abre), fim: minutos(d.hora_fim, fecha) })
  })
  ids.forEach(id => { if (janelas[id].length === 0) janelas[id] = [{ ini: abre, fim: fecha }] })

  const ocupados: Record<string, { ini: number; fim: number }[]> = {}
  ids.forEach(id => { ocupados[id] = [] })
  ;(agendamentos || []).forEach((a: any) => {
    const ini = new Date(a.data_hora).getTime()
    ocupados[a.barbeiro_id]?.push({ ini, fim: ini + Number(a.duracao_min || 30) * 60000 })
  })

  const limiteAgora = Date.now() + 15 * 60000 // não oferece horários que já passaram
  const slots: SlotDisponivel[] = []

  for (let t = abre; t + duracaoMin <= fecha; t += intervalo) {
    const inicioMs = new Date(`${data}T${hhmm(t)}:00${TZ}`).getTime()
    if (inicioMs < limiteAgora) continue
    const fimMs = inicioMs + duracaoMin * 60000

    const livres = ids.filter(id => {
      const dentroDaJanela = janelas[id].some(j => t >= j.ini && t + duracaoMin <= j.fim)
      if (!dentroDaJanela) return false
      return !ocupados[id].some(o => inicioMs < o.fim && fimMs > o.ini)
    })

    if (livres.length > 0) slots.push({ hora: hhmm(t), barbeiroIds: livres })
  }

  return slots
}

/** Converte "YYYY-MM-DD" + "HH:MM" para o instante ISO (horário de Brasília). */
export function dataHoraISO(data: string, hora: string) {
  return `${data}T${hora}:00${TZ}`
}
