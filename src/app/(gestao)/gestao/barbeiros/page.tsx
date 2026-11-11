'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Barbeiro {
  id: string
  nome: string
  foto_url: string | null
  bio: string | null
  especialidades: string[]
  ativo: boolean
  criado_em: string
  perfil_id: string | null
}

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase
      .from('barbeiros')
      .select('*')
      .order('criado_em', { ascending: false })
    setBarbeiros(data || [])
    setCarregando(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('barbeiros').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  const filtrados = barbeiros.filter(b =>
    b.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">Administração</div>
          <h1 className="page-title">Barbeiros</h1>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/gestao/barbeiros/novo')}>
          + NOVO BARBEIRO
        </button>
      </div>

      {/* CONTEÚDO */}
      <div className="page-body">

        {/* STATS */}
        <div className="stat-grid">
          {[
            { label: 'Total', valor: barbeiros.length },
            { label: 'Ativos', valor: barbeiros.filter(b => b.ativo).length },
            { label: 'Inativos', valor: barbeiros.filter(b => !b.ativo).length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.valor}</div>
            </div>
          ))}
        </div>

        {/* BUSCA */}
        <div style={{ marginBottom: 16 }}>
          <input className="field" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..." style={{ width: 300, maxWidth: '100%' }} />
        </div>

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--faint)', fontSize: 13 }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, color: 'var(--border-strong)', marginBottom: 12 }}>✂</div>
            <p style={{ color: 'var(--faint)', fontSize: 13, marginBottom: 20 }}>{busca ? 'Nenhum barbeiro encontrado.' : 'Nenhum barbeiro cadastrado ainda.'}</p>
            {!busca && (
              <button className="btn btn-primary" onClick={() => router.push('/gestao/barbeiros/novo')}>
                + CADASTRAR PRIMEIRO BARBEIRO
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrados.map(b => (
              <div key={b.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* FOTO */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {b.foto_url
                    ? <img src={b.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18, color: 'var(--faint)' }}>✂</span>
                  }
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.nome}</div>
                  {b.especialidades?.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
                      {b.especialidades.slice(0, 3).join(' · ')}{b.especialidades.length > 3 ? ` +${b.especialidades.length - 3}` : ''}
                    </div>
                  )}
                </div>

                {/* STATUS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${b.ativo ? 'tag-ok' : 'tag-neutro'}`}>
                    {b.ativo ? 'ATIVO' : 'INATIVO'}
                  </span>
                  <button className="btn btn-sm" onClick={() => toggleAtivo(b.id, b.ativo)}>
                    {b.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="btn btn-sm" onClick={() => router.push(`/gestao/barbeiros/${b.id}`)}>
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
