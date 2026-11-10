'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Atendimento {
  id: string
  data_hora: string
  status: string
  valor_total: number | null
  valor_final: number | null
  barbeiro_id: string | null
  cliente: { nome: string } | null
  barbeiro: { nome: string } | null
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const valorDe = (a: Atendimento) => Number(a.valor_final ?? a.valor_total ?? 0)

export default function FinanceiroPage() {
  const supabase = useMemo(() => createClient(), [])
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [lista, setLista] = useState<Atendimento[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true
    async function carregar() {
      setCarregando(true)
      const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
      const { data } = await supabase
        .from('agendamentos')
        .select('id, data_hora, status, valor_total, valor_final, barbeiro_id, cliente:clientes(nome), barbeiro:barbeiros(nome)')
        .gte('data_hora', mes.toISOString())
        .lt('data_hora', fim.toISOString())
        .order('data_hora', { ascending: false })
      if (!vivo) return
      setLista((data || []) as unknown as Atendimento[])
      setCarregando(false)
    }
    carregar()
    return () => { vivo = false }
  }, [mes, supabase])

  const concluidos = lista.filter(a => a.status === 'concluido')
  const previstos = lista.filter(a => a.status === 'pendente' || a.status === 'confirmado' || a.status === 'em_atendimento')
  const perdidos = lista.filter(a => a.status === 'cancelado' || a.status === 'faltou')
  const faturado = concluidos.reduce((s, a) => s + valorDe(a), 0)
  const previsto = previstos.reduce((s, a) => s + valorDe(a), 0)
  const ticket = concluidos.length ? faturado / concluidos.length : 0

  const porBarbeiro = useMemo(() => {
    const mapa: Record<string, { nome: string; total: number; qtd: number }> = {}
    concluidos.forEach(a => {
      const chave = a.barbeiro_id || 'sem'
      if (!mapa[chave]) mapa[chave] = { nome: a.barbeiro?.nome || 'Sem barbeiro', total: 0, qtd: 0 }
      mapa[chave].total += valorDe(a)
      mapa[chave].qtd += 1
    })
    return Object.values(mapa).sort((a, b) => b.total - a.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista])

  const maior = porBarbeiro[0]?.total || 1
  const tituloMes = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">Financeiro</div>
          <h1 className="page-title">Faturamento</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
          <span style={{ minWidth: 140, textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 12, textTransform: 'capitalize' }}>{tituloMes}</span>
          <button className="btn btn-sm" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">Faturado</div><div className="stat-value" style={{ fontSize: 22, color: '#16A34A' }}>{brl(faturado)}</div></div>
          <div className="stat-card"><div className="stat-label">Previsto</div><div className="stat-value" style={{ fontSize: 22, color: '#B8860B' }}>{brl(previsto)}</div></div>
          <div className="stat-card"><div className="stat-label">Atendimentos</div><div className="stat-value">{concluidos.length}</div></div>
          <div className="stat-card"><div className="stat-label">Ticket médio</div><div className="stat-value" style={{ fontSize: 22 }}>{brl(ticket)}</div></div>
          <div className="stat-card"><div className="stat-label">Cancelados / faltas</div><div className="stat-value">{perdidos.length}</div></div>
        </div>

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><span className="spin" /></div>
        ) : (
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Por barbeiro</div>
              {porBarbeiro.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9A9890' }}>Nenhum atendimento concluído neste mês.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {porBarbeiro.map(b => (
                    <div key={b.nome}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{b.nome}</span>
                        <span style={{ fontFamily: "'Space Mono', monospace", color: '#6A6860' }}>{brl(b.total)} · {b.qtd}</span>
                      </div>
                      <div style={{ height: 5, background: '#F0EEE8', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(b.total / maior) * 100}%`, height: '100%', background: '#B8860B' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Atendimentos concluídos</div>
              {concluidos.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9A9890' }}>Nada por aqui ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 440, overflowY: 'auto' }}>
                  {concluidos.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #F0EEE8' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9A9890', width: 78 }}>
                        {new Date(a.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.cliente?.nome || 'Cliente'}</div>
                        <div style={{ fontSize: 11, color: '#9A9890' }}>✂ {a.barbeiro?.nome || '—'}</div>
                      </div>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{brl(valorDe(a))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
