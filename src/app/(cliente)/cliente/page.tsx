'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Status = 'pendente' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'faltou'

interface Servico { id: string; nome: string; duracao_min: number; preco: number; ativo: boolean }
interface Barbeiro { id: string; nome: string; foto_url: string | null }
interface Agendamento {
  id: string
  data_hora: string
  duracao_min: number
  status: Status
  valor_total: number | null
  valor_final: number | null
  servicos_ids: string[] | null
  servico_id: string | null
  barbeiro: { nome: string } | null
}

const STATUS: Record<Status, { label: string; cor: string; bg: string }> = {
  pendente:       { label: 'Aguardando confirmação', cor: 'var(--warn)',   bg: 'var(--warn-bg)' },
  confirmado:     { label: 'Confirmado',             cor: 'var(--info)',   bg: 'var(--info-bg)' },
  em_atendimento: { label: 'Em atendimento',         cor: 'var(--gold)',   bg: 'var(--gold-soft)' },
  concluido:      { label: 'Concluído',              cor: 'var(--ok)',     bg: 'var(--ok-bg)' },
  cancelado:      { label: 'Cancelado',              cor: 'var(--danger)', bg: 'var(--danger-bg)' },
  faltou:         { label: 'Não compareceu',         cor: 'var(--danger)', bg: 'var(--danger-bg)' },
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const FORM_VAZIO = { servicos: [] as string[], barbeiro: '', data: '', hora: '', observacoes: '' }

export default function ClientePage() {
  const supabase = useMemo(() => createClient(), [])
  const [cliente, setCliente] = useState<{ id: string; nome: string } | null>(null)
  const [semCadastro, setSemCadastro] = useState(false)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(true)

  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [horarios, setHorarios] = useState<string[]>([])
  const [buscandoHorarios, setBuscandoHorarios] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregarAgendamentos = useCallback(async (clienteId: string) => {
    const { data } = await supabase
      .from('agendamentos')
      .select('id, data_hora, duracao_min, status, valor_total, valor_final, servicos_ids, servico_id, barbeiro:barbeiros(nome)')
      .eq('cliente_id', clienteId)
      .order('data_hora', { ascending: false })
    setAgendamentos((data || []) as unknown as Agendamento[])
  }, [supabase])

  useEffect(() => {
    async function iniciar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: c } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('perfil_id', user.id)
        .maybeSingle()
      if (!c) { setSemCadastro(true); setCarregando(false); return }
      setCliente(c)

      const [{ data: servs }, { data: barbs }] = await Promise.all([
        supabase.from('servicos').select('id, nome, duracao_min, preco, ativo').order('nome'),
        supabase.from('barbeiros').select('id, nome, foto_url').eq('ativo', true).order('nome'),
      ])
      setServicos((servs || []) as Servico[])
      setBarbeiros((barbs || []) as Barbeiro[])
      await carregarAgendamentos(c.id)
      setCarregando(false)
    }
    iniciar()
  }, [supabase, carregarAgendamentos])

  const servicosAtivos = servicos.filter(s => s.ativo)
  const servicosSel = servicosAtivos.filter(s => form.servicos.includes(s.id))
  const duracaoTotal = servicosSel.reduce((s, x) => s + x.duracao_min, 0)
  const valorTotal = servicosSel.reduce((s, x) => s + Number(x.preco || 0), 0)

  // Busca os horários livres sempre que serviço, barbeiro ou data mudam
  useEffect(() => {
    if (!aberto || !form.data || duracaoTotal === 0) { setHorarios([]); return }
    let vivo = true
    setBuscandoHorarios(true)
    const params = new URLSearchParams({ data: form.data, duracao: String(duracaoTotal) })
    if (form.barbeiro) params.set('barbeiro_id', form.barbeiro)
    fetch(`/api/cliente/disponibilidade?${params.toString()}`)
      .then(r => r.json())
      .then(r => {
        if (!vivo) return
        setHorarios(r.horarios || [])
        setForm(p => (p.hora && !(r.horarios || []).includes(p.hora) ? { ...p, hora: '' } : p))
        setBuscandoHorarios(false)
      })
      .catch(() => { if (vivo) { setHorarios([]); setBuscandoHorarios(false) } })
    return () => { vivo = false }
  }, [aberto, form.data, form.barbeiro, duracaoTotal])

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setHorarios([])
    setErro('')
    setAberto(true)
  }

  function toggleServico(id: string) {
    setForm(p => ({
      ...p,
      hora: '',
      servicos: p.servicos.includes(id) ? p.servicos.filter(s => s !== id) : [...p.servicos, id],
    }))
  }

  async function agendar() {
    setErro('')
    if (form.servicos.length === 0) return setErro('Escolha ao menos um serviço.')
    if (!form.data) return setErro('Escolha uma data.')
    if (!form.hora) return setErro('Escolha um horário.')
    setSalvando(true)
    try {
      const res = await fetch('/api/cliente/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicos_ids: form.servicos,
          barbeiro_id: form.barbeiro || null,
          data: form.data,
          hora: form.hora,
          observacoes: form.observacoes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível agendar.')
      setAberto(false)
      setAviso('Horário solicitado! A barbearia vai confirmar em breve.')
      setTimeout(() => setAviso(''), 6000)
      if (cliente) await carregarAgendamentos(cliente.id)
    } catch (e: any) {
      setErro(e.message || 'Erro ao agendar.')
    }
    setSalvando(false)
  }

  async function cancelar(ag: Agendamento) {
    if (!window.confirm('Deseja cancelar este agendamento?')) return
    setAviso('')
    const res = await fetch('/api/cliente/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ag.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      window.alert(data.error || 'Não foi possível cancelar.')
      return
    }
    if (cliente) await carregarAgendamentos(cliente.id)
  }

  function nomesServicos(a: Agendamento) {
    const ids = a.servicos_ids && a.servicos_ids.length > 0 ? a.servicos_ids : a.servico_id ? [a.servico_id] : []
    const nomes = ids.map(id => servicos.find(s => s.id === id)?.nome).filter(Boolean)
    return nomes.length ? nomes.join(' + ') : 'Serviço'
  }

  const agora = Date.now()
  const futuros = agendamentos
    .filter(a => (a.status === 'pendente' || a.status === 'confirmado' || a.status === 'em_atendimento') && new Date(a.data_hora).getTime() + a.duracao_min * 60000 >= agora)
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
  const historico = agendamentos.filter(a => !futuros.includes(a))
  const proximo = futuros[0]

  const hoje = new Date()
  const maxData = new Date(); maxData.setDate(maxData.getDate() + 60)

  if (carregando) {
    return <div style={{ textAlign: 'center', padding: '80px 0' }}><span className="spin" /></div>
  }

  if (semCadastro) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 32, marginBottom: 10 }}>◎</div>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Não encontramos seu cadastro de cliente.</p>
        <p style={{ fontSize: 12, marginTop: 4 }}>Fale com a barbearia para vincular sua conta.</p>
      </div>
    )
  }

  const linhaAgendamento = (a: Agendamento, permiteCancelar: boolean) => {
    const st = STATUS[a.status]
    const dt = new Date(a.data_hora)
    return (
      <div key={a.id} className="card" style={{ padding: '14px 18px', borderLeft: `4px solid ${st.cor}`, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 92 }}>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{nomesServicos(a)}</div>
          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
            {a.barbeiro?.nome ? `✂ ${a.barbeiro.nome} · ` : ''}{a.duracao_min} min · {brl(Number(a.valor_final ?? a.valor_total ?? 0))}
          </div>
        </div>
        <span className="badge" style={{ color: st.cor, background: st.bg }}>{st.label.toUpperCase()}</span>
        {permiteCancelar && (a.status === 'pendente' || a.status === 'confirmado') && (
          <button className="btn btn-sm btn-danger" onClick={() => cancelar(a)}>Cancelar</button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Minha área</div>
          <h1 className="page-title">Olá, {cliente?.nome.split(' ')[0]}</h1>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}>+ AGENDAR HORÁRIO</button>
      </div>

      {aviso && (
        <div role="status" style={{ background: 'var(--ok-bg)', border: '1px solid var(--ok)', color: 'var(--ok)', borderRadius: 8, fontSize: 13, padding: '10px 14px', marginBottom: 16 }}>
          ✓ {aviso}
        </div>
      )}

      {/* PRÓXIMO HORÁRIO EM DESTAQUE */}
      {proximo ? (
        <div className="card" style={{ borderColor: 'var(--gold)', color: 'var(--text)', padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 6 }}>Seu próximo horário</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {new Date(proximo.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {new Date(proximo.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {nomesServicos(proximo)}{proximo.barbeiro?.nome ? ` · com ${proximo.barbeiro.nome}` : ''}
            </div>
          </div>
          <span className="badge" style={{ color: STATUS[proximo.status].cor, background: STATUS[proximo.status].bg }}>
            {STATUS[proximo.status].label.toUpperCase()}
          </span>
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 30, marginBottom: 8, color: 'var(--border-strong)' }}>✂</div>
          <p style={{ fontSize: 13, marginBottom: 14 }}>Você não tem horários marcados.</p>
          <button className="btn btn-primary" onClick={abrirNovo}>+ AGENDAR AGORA</button>
        </div>
      )}

      {futuros.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Próximos agendamentos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{futuros.map(a => linhaAgendamento(a, true))}</div>
        </section>
      )}

      {historico.length > 0 && (
        <section>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Histórico</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{historico.slice(0, 20).map(a => linhaAgendamento(a, false))}</div>
        </section>
      )}

      {/* MODAL DE AGENDAMENTO */}
      {aberto && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setAberto(false) }}
        >
          <div className="modal" style={{ maxWidth: 560, maxHeight: '92vh', padding: 0 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="eyebrow">Novo agendamento</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Escolha serviço, dia e horário</div>
              </div>
              <button onClick={() => setAberto(false)} aria-label="Fechar" style={{ background: 'transparent', border: 'none', fontSize: 22, color: 'var(--faint)', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Serviços */}
              <div>
                <label className="field-label">1. Serviços</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {servicosAtivos.length === 0 && <div style={{ fontSize: 12, color: 'var(--faint)' }}>Nenhum serviço disponível.</div>}
                  {servicosAtivos.map(s => {
                    const sel = form.servicos.includes(s.id)
                    return (
                      <div key={s.id} onClick={() => toggleServico(s.id)} role="checkbox" aria-checked={sel} tabIndex={0}
                        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleServico(s.id) } }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: sel ? 'var(--gold-soft)' : 'var(--surface-2)', border: `1px solid ${sel ? 'var(--gold)' : 'var(--border)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${sel ? 'var(--gold)' : 'var(--border-strong)'}`, background: sel ? 'var(--gold)' : 'transparent', color: 'var(--on-gold)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel ? '✓' : ''}</div>
                          <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400 }}>{s.nome}</span>
                        </div>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--muted)' }}>{s.duracao_min} min · {brl(Number(s.preco))}</span>
                      </div>
                    )
                  })}
                </div>
                {servicosSel.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', background: 'var(--gold-soft)', border: '1px solid var(--gold-dark)', borderRadius: 8, padding: '8px 12px' }}>
                    <span>{servicosSel.length} serviço{servicosSel.length > 1 ? 's' : ''} · <strong>{duracaoTotal} min</strong></span>
                    <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--gold)' }}>{brl(valorTotal)}</strong>
                  </div>
                )}
              </div>

              {/* Barbeiro */}
              <div>
                <label className="field-label" htmlFor="barbeiro">2. Barbeiro</label>
                <select id="barbeiro" className="field" value={form.barbeiro} onChange={e => setForm(p => ({ ...p, barbeiro: e.target.value, hora: '' }))}>
                  <option value="">Qualquer barbeiro disponível</option>
                  {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="field-label" htmlFor="data">3. Data</label>
                <input id="data" type="date" className="field" min={iso(hoje)} max={iso(maxData)} value={form.data}
                  onChange={e => setForm(p => ({ ...p, data: e.target.value, hora: '' }))} />
              </div>

              {/* Horários */}
              <div>
                <label className="field-label">4. Horário</label>
                {duracaoTotal === 0 || !form.data ? (
                  <div style={{ fontSize: 12, color: 'var(--faint)' }}>Escolha o serviço e a data para ver os horários livres.</div>
                ) : buscandoHorarios ? (
                  <div style={{ padding: '10px 0' }}><span className="spin" /></div>
                ) : horarios.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--warn)', background: 'var(--warn-bg)', border: '1px solid var(--warn)', borderRadius: 8, padding: '8px 12px' }}>
                    Nenhum horário livre neste dia. Tente outra data ou outro barbeiro.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 6 }}>
                    {horarios.map(h => (
                      <button key={h} onClick={() => setForm(p => ({ ...p, hora: h }))} style={{
                        padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontVariantNumeric: 'tabular-nums', fontSize: 12,
                        background: form.hora === h ? 'var(--gold)' : 'var(--surface-2)', color: form.hora === h ? 'var(--on-gold)' : 'var(--text)',
                        border: `1px solid ${form.hora === h ? 'var(--gold)' : 'var(--border)'}`, fontWeight: form.hora === h ? 700 : 400,
                      }}>{h}</button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="field-label" htmlFor="obs">Observações (opcional)</label>
                <textarea id="obs" className="field" style={{ height: 60, resize: 'vertical' }} maxLength={500}
                  value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Algum pedido ou detalhe?" />
              </div>

              {erro && (
                <div role="alert" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 12, padding: '9px 12px' }}>{erro}</div>
              )}
            </div>

            <div style={{ padding: '12px 22px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
              <button className="btn" onClick={() => setAberto(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={agendar} disabled={salvando || !form.hora || form.servicos.length === 0}>
                {salvando ? 'ENVIANDO...' : 'CONFIRMAR HORÁRIO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
