'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ESPECIALIDADES_SUGERIDAS = [
  'Corte Masculino', 'Barba', 'Degradê', 'Navalhado',
  'Coloração', 'Relaxamento', 'Tranças', 'Sobrancelha',
]

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function BarbeiroDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', telefone: '', bio: '', especialidades: [] as string[], ativo: true })
  const [resumo, setResumo] = useState({ qtd: 0, faturado: 0, futuros: 0 })

  useEffect(() => {
    async function carregar() {
      const { data: b } = await supabase
        .from('barbeiros')
        .select('*, perfil:perfil_id(telefone)')
        .eq('id', id)
        .maybeSingle()

      if (!b) { setNaoEncontrado(true); setCarregando(false); return }

      setPerfilId(b.perfil_id)
      setFotoUrl(b.foto_url)
      setForm({
        nome: b.nome || '',
        telefone: b.perfil?.telefone || '',
        bio: b.bio || '',
        especialidades: b.especialidades || [],
        ativo: b.ativo !== false,
      })

      const d = new Date()
      const ini = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
      const [{ data: concluidos }, { count: futuros }] = await Promise.all([
        supabase.from('agendamentos').select('valor_total, valor_final')
          .eq('barbeiro_id', id).eq('status', 'concluido').gte('data_hora', ini).lt('data_hora', fim),
        supabase.from('agendamentos').select('id', { count: 'exact', head: true })
          .eq('barbeiro_id', id).in('status', ['pendente', 'confirmado']).gte('data_hora', new Date().toISOString()),
      ])
      setResumo({
        qtd: concluidos?.length || 0,
        faturado: (concluidos || []).reduce((s: number, a: any) => s + Number(a.valor_final ?? a.valor_total ?? 0), 0),
        futuros: futuros || 0,
      })
      setCarregando(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function toggleEspecialidade(esp: string) {
    setForm(p => ({
      ...p,
      especialidades: p.especialidades.includes(esp) ? p.especialidades.filter(e => e !== esp) : [...p.especialidades, esp],
    }))
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Informe o nome do barbeiro.'); return }
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('barbeiros').update({
      nome: form.nome.trim(),
      bio: form.bio || null,
      especialidades: form.especialidades,
      ativo: form.ativo,
    }).eq('id', id)

    if (error) {
      setErro('Não foi possível salvar: ' + error.message)
      setSalvando(false)
      return
    }
    if (perfilId) {
      await supabase.from('perfis').update({ nome: form.nome.trim(), telefone: form.telefone || null }).eq('id', perfilId)
    }
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  const cardS: React.CSSProperties = { background: '#fff', border: '1px solid #E4E2DC', borderRadius: 6, padding: 24 }

  if (carregando) {
    return <div style={{ textAlign: 'center', padding: '80px 0' }}><span className="spin" /></div>
  }

  if (naoEncontrado) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <p style={{ fontSize: 14, marginBottom: 16 }}>Barbeiro não encontrado.</p>
          <button className="btn btn-primary" onClick={() => router.push('/gestao/barbeiros')}>← VOLTAR PARA BARBEIROS</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-sm" onClick={() => router.push('/gestao/barbeiros')}>← Voltar</button>
          <div>
            <div className="eyebrow">Administração · Barbeiros</div>
            <h1 className="page-title">{form.nome || 'Barbeiro'}</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {salvo && <span style={{ fontSize: 12, color: '#16A34A', fontFamily: "'Space Mono', monospace" }}>✓ Salvo</span>}
          <button className="btn btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 760 }}>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">Atendimentos no mês</div><div className="stat-value">{resumo.qtd}</div></div>
          <div className="stat-card"><div className="stat-label">Faturado no mês</div><div className="stat-value" style={{ fontSize: 20 }}>{brl(resumo.faturado)}</div></div>
          <div className="stat-card"><div className="stat-label">Próximos horários</div><div className="stat-value">{resumo.futuros}</div></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardS}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Dados do barbeiro</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, borderRadius: 8, background: '#F4F2ED', border: '1px solid #E4E2DC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {fotoUrl ? <img src={fotoUrl} alt={form.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#C0BEB8' }}>✂</span>}
              </div>
              <div className="grid-2" style={{ flex: 1, minWidth: 260, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Nome</label>
                  <input className="field" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Telefone / WhatsApp</label>
                  <input className="field" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="field-label">Situação</label>
                  <select className="field" value={form.ativo ? '1' : '0'} onChange={e => setForm(p => ({ ...p, ativo: e.target.value === '1' }))}>
                    <option value="1">Ativo (aparece na agenda)</option>
                    <option value="0">Inativo</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Bio / Apresentação</label>
                  <textarea className="field" style={{ height: 80, resize: 'vertical' }} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div style={cardS}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Especialidades</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from(new Set([...ESPECIALIDADES_SUGERIDAS, ...form.especialidades])).map(esp => {
                const sel = form.especialidades.includes(esp)
                return (
                  <button key={esp} onClick={() => toggleEspecialidade(esp)} style={{
                    padding: '7px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
                    background: sel ? 'rgba(184,134,11,0.1)' : '#F4F2ED',
                    border: `1px solid ${sel ? '#B8860B' : '#E4E2DC'}`,
                    color: sel ? '#8A6200' : '#4A4840',
                  }}>{sel ? '✓ ' : ''}{esp}</button>
                )
              })}
            </div>
          </div>

          {erro && (
            <div role="alert" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 4, color: '#DC2626', fontSize: 13, padding: '10px 14px' }}>{erro}</div>
          )}
        </div>
      </div>
    </div>
  )
}
