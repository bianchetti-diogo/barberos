'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Status = 'pendente' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'faltou'

interface Agendamento {
  id: string
  data_hora: string
  duracao_min: number
  status: Status
  valor_total: number | null
  valor_final: number | null
  tem_desconto: boolean | null
  observacoes: string | null
  servicos_ids: string[] | null
  servico_id: string | null
  cliente: { nome: string; telefone: string | null } | null
}

const STATUS: Record<Status, { label: string; cor: string; bg: string }> = {
  pendente:       { label: 'Pendente',       cor: 'var(--warn)',   bg: 'var(--warn-bg)' },
  confirmado:     { label: 'Confirmado',     cor: 'var(--info)',   bg: 'var(--info-bg)' },
  em_atendimento: { label: 'Em atendimento', cor: 'var(--gold)',   bg: 'var(--gold-soft)' },
  concluido:      { label: 'Concluído',      cor: 'var(--ok)',     bg: 'var(--ok-bg)' },
  cancelado:      { label: 'Cancelado',      cor: 'var(--danger)', bg: 'var(--danger-bg)' },
  faltou:         { label: 'Faltou',         cor: 'var(--danger)', bg: 'var(--danger-bg)' },
}

// Próximas ações possíveis a partir de cada status
const ACOES: Record<Status, { para: Status; label: string; primaria?: boolean; perigo?: boolean }[]> = {
  pendente:       [{ para: 'confirmado', label: 'Confirmar', primaria: true }, { para: 'cancelado', label: 'Cancelar', perigo: true }],
  confirmado:     [{ para: 'em_atendimento', label: 'Iniciar atendimento', primaria: true }, { para: 'faltou', label: 'Faltou', perigo: true }, { para: 'cancelado', label: 'Cancelar', perigo: true }],
  em_atendimento: [{ para: 'concluido', label: 'Concluir', primaria: true }],
  concluido:      [],
  cancelado:      [{ para: 'confirmado', label: 'Reabrir' }],
  faltou:         [{ para: 'confirmado', label: 'Reabrir' }],
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const valorDe = (a: Agendamento) => Number(a.valor_final ?? a.valor_total ?? 0)

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDias(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function inicioSemana(d: Date) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  r.setDate(r.getDate() - r.getDay())
  return r
}

export default function BarbeiroPage() {
  const supabase = useMemo(() => createClient(), [])
  const [barbeiro, setBarbeiro] = useState<{ id: string; nome: string } | null>(null)
  const [semBarbeiro, setSemBarbeiro] = useState(false)
  const [servicosMap, setServicosMap] = useState<Record<string, string>>({})
  const [dia, setDia] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [agenda, setAgenda] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  const semanaInicio = inicioSemana(dia)
  const chaveSemana = iso(semanaInicio)

  // Identifica o barbeiro logado e carrega o catálogo de serviços
  useEffect(() => {
    async function iniciar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: b }, { data: servs }] = await Promise.all([
        supabase.from('barbeiros').select('id, nome').eq('perfil_id', user.id).maybeSingle(),
        supabase.from('servicos').select('id, nome'),
      ])
      if (!b) { setSemBarbeiro(true); setCarregando(false); return }
      setBarbeiro(b)
      const mapa: Record<string, string> = {}
      ;(servs || []).forEach((s: any) => { mapa[s.id] = s.nome })
      setServicosMap(mapa)
    }
    iniciar()
  }, [supabase])

  const carregarSemana = useCallback(async () => {
    if (!barbeiro) return
    setCarregando(true)
    const ini = new Date(chaveSemana + 'T00:00:00')
    const fim = addDias(ini, 7)
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, data_hora, duracao_min, status, valor_total, valor_final, tem_desconto, observacoes, servicos_ids, servico_id, cliente:clientes(nome, telefone)')
      .eq('barbeiro_id', barbeiro.id)
      .gte('data_hora', ini.toISOString())
      .lt('data_hora', fim.toISOString())
      .order('data_hora')
    if (error) setErro('Não foi possível carregar a agenda.')
    else setErro('')
    setAgenda((data || []) as unknown as Agendamento[])
    setCarregando(false)
  }, [barbeiro, chaveSemana, supabase])

  useEffect(() => { carregarSemana() }, [carregarSemana])

  async function mudarStatus(ag: Agendamento, para: Status) {
    if (!barbeiro) return
    if (para === 'cancelado' && !window.confirm(`Cancelar o atendimento de ${ag.cliente?.nome || 'cliente'}?`)) return
    setAtualizando(ag.id)
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: para })
      .eq('id', ag.id)
      .eq('barbeiro_id', barbeiro.id)
    if (error) setErro('Não foi possível atualizar o status.')
    else await carregarSemana()
    setAtualizando(null)
  }

  const diaChave = iso(dia)
  const hojeChave = iso(new Date())
  const doDia = agenda.filter(a => iso(new Date(a.data_hora)) === diaChave)
  const ativos = doDia.filter(a => a.status !== 'cancelado' && a.status !== 'faltou')
  const concluidos = ativos.filter(a => a.status === 'concluido')
  const faturado = concluidos.reduce((s, a) => s + valorDe(a), 0)
  const aReceber = ativos.filter(a => a.status !== 'concluido').reduce((s, a) => s + valorDe(a), 0)
  const agora = Date.now()
  const proximo = diaChave === hojeChave
    ? ativos.find(a => a.status !== 'concluido' && new Date(a.data_hora).getTime() + a.duracao_min * 60000 >= agora)
    : undefined

  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = addDias(semanaInicio, i)
    const chave = iso(d)
    const qtd = agenda.filter(a => iso(new Date(a.data_hora)) === chave && a.status !== 'cancelado' && a.status !== 'faltou').length
    return { d, chave, qtd }
  })

  function nomesServicos(a: Agendamento) {
    const ids = a.servicos_ids && a.servicos_ids.length > 0 ? a.servicos_ids : a.servico_id ? [a.servico_id] : []
    const nomes = ids.map(id => servicosMap[id]).filter(Boolean)
    return nomes.length ? nomes.join(' + ') : 'Serviço não informado'
  }

  if (semBarbeiro) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 32, marginBottom: 10 }}>✂</div>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 6 }}>Seu usuário ainda não está vinculado a um barbeiro.</p>
        <p style={{ fontSize: 12 }}>Peça à gestão para cadastrar você em Barbeiros, ou volte para o <Link href="/gestao" style={{ color: 'var(--gold)', fontWeight: 600 }}>painel de gestão</Link>.</p>
      </div>
    )
  }

  return (
    <div>
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="eyebrow">{dia.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="page-title">Olá{barbeiro ? `, ${barbeiro.nome.split(' ')[0]}` : ''}</h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => setDia(addDias(dia, -7))}>‹ Semana</button>
          <button className="btn btn-sm" onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setDia(d) }}>Hoje</button>
          <button className="btn btn-sm" onClick={() => setDia(addDias(dia, 7))}>Semana ›</button>
        </div>
      </div>

      {/* TIRA DA SEMANA */}
      <div className="day-strip" style={{ marginBottom: 20 }}>
        {semana.map(s => {
          const sel = s.chave === diaChave
          const ehHoje = s.chave === hojeChave
          return (
            <button key={s.chave} onClick={() => setDia(s.d)} style={{
              padding: '10px 4px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
              background: sel ? 'var(--gold-soft)' : 'var(--surface)',
              border: `1px solid ${sel || ehHoje ? 'var(--gold)' : 'var(--border)'}`,
              color: 'var(--text)',
            }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: sel ? 'var(--gold)' : 'var(--faint)' }}>
                {s.d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{s.d.getDate()}</div>
              <div style={{ fontSize: 10, color: sel ? 'var(--muted)' : s.qtd > 0 ? 'var(--gold)' : 'var(--faint)' }}>
                {s.qtd > 0 ? `${s.qtd} cliente${s.qtd === 1 ? '' : 's'}` : '—'}
              </div>
            </button>
          )
        })}
      </div>

      {/* RESUMO */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Atendimentos</div><div className="stat-value">{ativos.length}</div></div>
        <div className="stat-card"><div className="stat-label">Concluídos</div><div className="stat-value">{concluidos.length}</div></div>
        <div className="stat-card"><div className="stat-label">Faturado</div><div className="stat-value" style={{ fontSize: 20, color: 'var(--ok)' }}>{brl(faturado)}</div></div>
        <div className="stat-card"><div className="stat-label">A receber</div><div className="stat-value" style={{ fontSize: 20, color: 'var(--gold)' }}>{brl(aReceber)}</div></div>
      </div>

      {erro && (
        <div role="alert" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 12, padding: '9px 12px', marginBottom: 16 }}>{erro}</div>
      )}

      {/* LISTA DO DIA */}
      {carregando ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}><span className="spin" /></div>
      ) : doDia.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 10, color: 'var(--border-strong)' }}>▦</div>
          <p style={{ fontSize: 13 }}>Nenhum atendimento neste dia.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {doDia.map(a => {
            const st = STATUS[a.status]
            const inicio = new Date(a.data_hora)
            const fim = new Date(inicio.getTime() + a.duracao_min * 60000)
            const ehProximo = proximo?.id === a.id
            return (
              <div key={a.id} className="card" style={{
                borderLeft: `4px solid ${st.cor}`,
                padding: '14px 18px',
                opacity: a.status === 'cancelado' || a.status === 'faltou' ? 0.65 : 1,
                boxShadow: ehProximo ? '0 0 0 1px var(--gold), 0 0 0 4px var(--gold-soft)' : undefined,
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 64 }}>
                    <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                      {inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--faint)' }}>até {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{a.cliente?.nome || 'Cliente'}</span>
                      <span className="badge" style={{ color: st.cor, background: st.bg }}>{st.label.toUpperCase()}</span>
                      {ehProximo && <span className="badge" style={{ color: 'var(--on-gold)', background: 'var(--gold)' }}>PRÓXIMO</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{nomesServicos(a)}</div>
                    {a.cliente?.telefone && <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{a.cliente.telefone}</div>}
                    {a.observacoes && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px' }}>{a.observacoes}</div>}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 15, fontWeight: 700, color: a.status === 'concluido' ? 'var(--ok)' : 'var(--text)' }}>{brl(valorDe(a))}</div>
                    <div style={{ fontSize: 10, color: 'var(--faint)' }}>{a.duracao_min} min{a.tem_desconto ? ' · desconto' : ''}</div>
                  </div>
                </div>

                {ACOES[a.status].length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    {ACOES[a.status].map(ac => (
                      <button
                        key={ac.para}
                        disabled={atualizando === a.id}
                        onClick={() => mudarStatus(a, ac.para)}
                        className={`btn btn-sm ${ac.primaria ? 'btn-primary' : ac.perigo ? 'btn-danger' : ''}`}
                      >
                        {ac.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
