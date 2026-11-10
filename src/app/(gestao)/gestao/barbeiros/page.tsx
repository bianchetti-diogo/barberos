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

  const inputS: React.CSSProperties = {
    padding: '8px 12px', background: '#FAFAF7', border: '1px solid #E0DED8',
    borderRadius: 3, color: '#1A1A22', fontSize: 13, outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif", width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>Administração</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>Barbeiros</h1>
        </div>
        <button onClick={() => router.push('/gestao/barbeiros/novo')} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}>
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
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1A1A22', lineHeight: 1 }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* BUSCA */}
        <div style={{ marginBottom: 16 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome..." style={{ ...inputS, width: 300 }} />
        </div>

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9890', fontSize: 13 }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, color: '#E4E2DC', marginBottom: 12 }}>✂</div>
            <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 20 }}>{busca ? 'Nenhum barbeiro encontrado.' : 'Nenhum barbeiro cadastrado ainda.'}</p>
            {!busca && (
              <button onClick={() => router.push('/gestao/barbeiros/novo')} style={{ padding: '9px 20px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
                + CADASTRAR PRIMEIRO BARBEIRO
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrados.map(b => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                {/* FOTO */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F4F2ED', border: '1px solid #E4E2DC', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {b.foto_url
                    ? <img src={b.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18, color: '#C0BEB8' }}>✂</span>
                  }
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A22' }}>{b.nome}</div>
                  {b.especialidades?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#9A9890', marginTop: 2 }}>
                      {b.especialidades.slice(0, 3).join(' · ')}{b.especialidades.length > 3 ? ` +${b.especialidades.length - 3}` : ''}
                    </div>
                  )}
                </div>

                {/* STATUS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: b.ativo ? '#16A34A' : '#9A9890', background: b.ativo ? 'rgba(22,163,74,0.08)' : '#F4F2ED', border: `1px solid ${b.ativo ? 'rgba(22,163,74,0.2)' : '#E4E2DC'}`, borderRadius: 2, padding: '3px 8px' }}>
                    {b.ativo ? 'ATIVO' : 'INATIVO'}
                  </span>
                  <button onClick={() => toggleAtivo(b.id, b.ativo)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #E4E2DC', borderRadius: 2, color: '#6A6860', fontSize: 11, cursor: 'pointer' }}>
                    {b.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => router.push(`/gestao/barbeiros/${b.id}`)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #E4E2DC', borderRadius: 2, color: '#6A6860', fontSize: 11, cursor: 'pointer' }}>
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
