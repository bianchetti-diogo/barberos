'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const DIAS = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

export default function ConfiguracoesPage() {
  const [barbearia, setBarbearia] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: bid } = await supabase.rpc('minha_barbearia')
    const { data: b } = await supabase.from('barbearias').select('*').eq('id', bid).single()
    const { data: c } = await supabase.from('configuracoes').select('*').eq('barbearia_id', b?.id).single()
    setBarbearia(b || {})
    setConfig(c || { horario_abertura: '08:00', horario_fechamento: '20:00', intervalo_agendamento: 30, dias_funcionamento: ['seg','ter','qua','qui','sex','sab'], prazo_cancelamento_horas: 2 })
    const logoSalva = localStorage.getItem('barberos_logo')
    if (logoSalva) setLogo(logoSalva)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setLogo(url)
      localStorage.setItem('barberos_logo', url)
    }
    reader.readAsDataURL(file)
  }

  function toggleDia(dia: string) {
    const dias = config.dias_funcionamento || []
    setConfig((p: any) => ({
      ...p,
      dias_funcionamento: dias.includes(dia) ? dias.filter((d: string) => d !== dia) : [...dias, dia]
    }))
  }

  async function salvar() {
    setSalvando(true)
    await supabase.from('barbearias').update({ nome: barbearia.nome, telefone: barbearia.telefone, email: barbearia.email, endereco: barbearia.endereco, cidade: barbearia.cidade, estado: barbearia.estado }).eq('id', barbearia.id)
    if (config.id) {
      await supabase.from('configuracoes').update(config).eq('id', config.id)
    } else {
      await supabase.from('configuracoes').insert({ ...config, barbearia_id: barbearia.id })
    }
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  const inputS: React.CSSProperties = {
    padding: '9px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-strong)',
    borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }
  const labelS: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: 5,
  }
  const cardS: React.CSSProperties = {
    padding: '24px', marginBottom: 16,
  }
  const cardTitle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
    color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 20,
  }

  if (!barbearia) return <div style={{ padding: 40, color: 'var(--faint)', fontSize: 13 }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">Administração</div>
          <h1 className="page-title">Configurações</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {salvo && <span style={{ fontSize: 12, color: 'var(--ok)' }}>✓ Salvo</span>}
          <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 760 }}>

        {/* IDENTIDADE */}
        <div className="card" style={cardS}>
          <div style={cardTitle}>Identidade Visual</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: 8, background: logo ? 'transparent' : 'var(--bg)', border: '2px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
              {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, color: 'var(--faint)' }}>+</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            <div style={{ flex: 1 }}>
              <label style={labelS}>Nome da Barbearia</label>
              <input style={inputS} value={barbearia.nome || ''} onChange={e => setBarbearia((p: any) => ({...p, nome: e.target.value}))} placeholder="Nome da sua barbearia" />
              <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>Clique na imagem para trocar a logo. Aparece na sidebar.</p>
            </div>
          </div>
        </div>

        {/* CONTATO */}
        <div className="card" style={cardS}>
          <div style={cardTitle}>Contato & Endereço</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelS}>Telefone</label>
              <input style={inputS} value={barbearia.telefone || ''} onChange={e => setBarbearia((p: any) => ({...p, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label style={labelS}>E-mail</label>
              <input style={inputS} type="email" value={barbearia.email || ''} onChange={e => setBarbearia((p: any) => ({...p, email: e.target.value}))} placeholder="contato@barbearia.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelS}>Endereço</label>
              <input style={inputS} value={barbearia.endereco || ''} onChange={e => setBarbearia((p: any) => ({...p, endereco: e.target.value}))} placeholder="Rua, número, complemento" />
            </div>
            <div>
              <label style={labelS}>Cidade</label>
              <input style={inputS} value={barbearia.cidade || ''} onChange={e => setBarbearia((p: any) => ({...p, cidade: e.target.value}))} />
            </div>
            <div>
              <label style={labelS}>Estado</label>
              <input style={inputS} value={barbearia.estado || ''} onChange={e => setBarbearia((p: any) => ({...p, estado: e.target.value}))} placeholder="SP" maxLength={2} />
            </div>
          </div>
        </div>

        {/* HORÁRIOS */}
        <div className="card" style={cardS}>
          <div style={cardTitle}>Horários de Funcionamento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={labelS}>Abertura</label>
              <input style={inputS} type="time" value={config?.horario_abertura || '08:00'} onChange={e => setConfig((p: any) => ({...p, horario_abertura: e.target.value}))} />
            </div>
            <div>
              <label style={labelS}>Fechamento</label>
              <input style={inputS} type="time" value={config?.horario_fechamento || '20:00'} onChange={e => setConfig((p: any) => ({...p, horario_fechamento: e.target.value}))} />
            </div>
            <div>
              <label style={labelS}>Intervalo (min)</label>
              <select style={inputS} value={config?.intervalo_agendamento || 30} onChange={e => setConfig((p: any) => ({...p, intervalo_agendamento: Number(e.target.value)}))}>
                {[15,20,30,45,60].map(v => <option key={v} value={v}>{v} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelS}>Dias de Funcionamento</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {DIAS.map(d => {
                const ativo = (config?.dias_funcionamento || []).includes(d.key)
                return (
                  <button key={d.key} onClick={() => toggleDia(d.key)} style={{ padding: '7px 14px', background: ativo ? 'var(--gold-soft)' : 'var(--bg)', border: `1px solid ${ativo ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', color: ativo ? 'var(--gold)' : 'var(--muted)', fontSize: 12, transition: 'all 0.15s' }}>
                    {ativo ? '✓ ' : ''}{d.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* REGRAS */}
        <div className="card" style={cardS}>
          <div style={cardTitle}>Regras de Agendamento</div>
          <div style={{ maxWidth: 300 }}>
            <label style={labelS}>Prazo mínimo para cancelamento</label>
            <select style={inputS} value={config?.prazo_cancelamento_horas || 2} onChange={e => setConfig((p: any) => ({...p, prazo_cancelamento_horas: Number(e.target.value)}))}>
              {[1,2,4,6,12,24,48].map(v => <option key={v} value={v}>{v}h antes</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
