'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Barbeiro {
  id: string
  nome: string
  foto_url: string | null
  especialidades: string[] | null
  ativo: boolean
  criado_em: string
  perfil: { email?: string; telefone?: string } | null
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
      .select('*, perfil:perfil_id(telefone)')
      .order('nome')
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
    <div style={{ minHeight: '100vh', background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid #E0DED8',
        background: '#FAFAF7', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 2 }}>
            Admin
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>
            Barbeiros
          </h1>
        </div>
        <button
          onClick={() => router.push('/gestao/barbeiros/novo')}
          style={{
            padding: '9px 20px', background: '#B8860B', color: '#fff',
            border: 'none', borderRadius: 3, fontSize: 12,
            fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: '0.08em', cursor: 'pointer',
          }}
        >
          + NOVO BARBEIRO
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* BUSCA */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar barbeiro..."
            style={{
              padding: '10px 14px', background: '#fff',
              border: '1px solid #E0DED8', borderRadius: 3,
              color: '#1A1A22', fontSize: 13, outline: 'none',
              width: 280, fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', valor: barbeiros.length },
            { label: 'Ativos', valor: barbeiros.filter(b => b.ativo).length },
            { label: 'Inativos', valor: barbeiros.filter(b => !b.ativo).length },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1px solid #E4E2DC',
              borderRadius: 4, padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: '#9A9890', textTransform: 'uppercase', marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1A1A22', lineHeight: 1 }}>
                {s.valor}
              </div>
            </div>
          ))}
        </div>

        {/* LISTA */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9A9890', fontSize: 13 }}>
            Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #E4E2DC', borderRadius: 4,
            padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, color: '#E4E2DC', marginBottom: 12 }}>✂</div>
            <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 20 }}>
              {busca ? 'Nenhum barbeiro encontrado.' : 'Nenhum barbeiro cadastrado ainda.'}
            </p>
            {!busca && (
              <button
                onClick={() => router.push('/gestao/barbeiros/novo')}
                style={{
                  padding: '9px 20px', background: '#B8860B', color: '#fff',
                  border: 'none', borderRadius: 3, fontSize: 12,
                  fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer',
                }}
              >+ CADASTRAR PRIMEIRO BARBEIRO</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* HEADER DA TABELA */}
            <div style={{
              display: 'grid', gridTemplateColumns: '48px 1fr 180px 140px 100px 80px',
              gap: 16, padding: '10px 20px',
              fontFamily: 'monospace', fontSize: 9,
              letterSpacing: '0.15em', color: '#9A9890', textTransform: 'uppercase',
            }}>
              <div></div>
              <div>Nome</div>
              <div>Especialidades</div>
              <div>Telefone</div>
              <div>Status</div>
              <div>Ações</div>
            </div>

            {filtrados.map(b => (
              <div
                key={b.id}
                style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr 180px 140px 100px 80px',
                  gap: 16, padding: '14px 20px',
                  background: '#fff', border: '1px solid #E4E2DC',
                  borderRadius: 4, alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#D0CEC8')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E4E2DC')}
              >
                {/* FOTO */}
                <div style={{
                  width: 40, height: 40, borderRadius: 4,
                  background: b.foto_url ? 'transparent' : '#F4F2ED',
                  border: '1px solid #E4E2DC',
                  overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 16, color: '#C0BEB8' }}>✂</span>
                  }
                </div>

                {/* NOME */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A22' }}>{b.nome}</div>
                </div>

                {/* ESPECIALIDADES */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(b.especialidades || []).slice(0, 2).map(e => (
                    <span key={e} style={{
                      background: '#F4F2ED', border: '1px solid #E4E2DC',
                      borderRadius: 2, padding: '2px 8px',
                      fontSize: 10, color: '#6A6860',
                    }}>{e}</span>
                  ))}
                  {(b.especialidades || []).length > 2 && (
                    <span style={{ fontSize: 10, color: '#9A9890' }}>+{(b.especialidades || []).length - 2}</span>
                  )}
                </div>

                {/* TELEFONE */}
                <div style={{ fontSize: 12, color: '#6A6860', fontFamily: 'monospace' }}>
                  {b.perfil?.telefone || '—'}
                </div>

                {/* STATUS */}
                <div>
                  <span style={{
                    display: 'inline-block',
                    background: b.ativo ? 'rgba(46,204,113,0.1)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${b.ativo ? 'rgba(46,204,113,0.3)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 2, padding: '3px 10px',
                    fontSize: 10, fontFamily: 'monospace',
                    color: b.ativo ? '#16A34A' : '#DC2626',
                    letterSpacing: '0.05em',
                  }}>
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* AÇÕES */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => router.push(`/gestao/barbeiros/${b.id}`)}
                    title="Editar"
                    style={{
                      padding: '5px 10px', background: 'transparent',
                      border: '1px solid #E4E2DC', borderRadius: 2,
                      color: '#6A6860', fontSize: 11, cursor: 'pointer',
                    }}
                  >✎</button>
                  <button
                    onClick={() => toggleAtivo(b.id, b.ativo)}
                    title={b.ativo ? 'Desativar' : 'Ativar'}
                    style={{
                      padding: '5px 10px', background: 'transparent',
                      border: `1px solid ${b.ativo ? 'rgba(239,68,68,0.3)' : 'rgba(46,204,113,0.3)'}`,
                      borderRadius: 2,
                      color: b.ativo ? '#DC2626' : '#16A34A',
                      fontSize: 11, cursor: 'pointer',
                    }}
                  >{b.ativo ? '○' : '●'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
