'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const MODULOS = [
  { id: 'dashboard',     label: 'Dashboard',      icon: '⬡', rota: '/gestao',                    ativo: true },
  { id: 'barbeiros',     label: 'Barbeiros',       icon: '✂', rota: '/gestao/barbeiros',           ativo: true },
  { id: 'servicos',      label: 'Serviços',        icon: '◈', rota: '/gestao/servicos',            ativo: true },
  { id: 'produtos',      label: 'Produtos',        icon: '◉', rota: '/gestao/produtos',            ativo: true },
  { id: 'clientes',      label: 'Clientes',        icon: '◎', rota: '/gestao/clientes',            ativo: true },
  { id: 'agenda',        label: 'Agenda',          icon: '▦', rota: '/gestao/agenda',              ativo: false },
  { id: 'financeiro',    label: 'Financeiro',      icon: '◈', rota: '/gestao/financeiro',          ativo: false },
  { id: 'relatorios',    label: 'Relatórios',      icon: '▤', rota: '/gestao/relatorios',          ativo: false },
  { id: 'configuracoes', label: 'Configurações',   icon: '◌', rota: '/gestao/configuracoes',       ativo: true },
]

export default function Sidebar() {
  const [fixada, setFixada] = useState(false)
  const [aberta, setAberta] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [nome, setNome] = useState('BarberOS')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const logoSalva = localStorage.getItem('barberos_logo')
    const nomeSalvo = localStorage.getItem('barberos_nome')
    if (logoSalva) setLogo(logoSalva)
    if (nomeSalvo) setNome(nomeSalvo)
  }, [])

  const largura = (fixada || aberta) ? 240 : 64

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setLogo(url)
      localStorage.setItem('barberos_logo', url)
    }
    reader.readAsDataURL(file)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Overlay quando não fixada e aberta */}
      {aberta && !fixada && (
        <div
          onClick={() => setAberta(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)'
          }}
        />
      )}

      <aside
        onMouseEnter={() => !fixada && setAberta(true)}
        onMouseLeave={() => !fixada && setAberta(false)}
        style={{
          position: fixada ? 'relative' : 'fixed',
          top: 0, left: 0, height: '100vh',
          width: `${largura}px`,
          background: '#0A0A0C',
          borderRight: '1px solid #1E1E24',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* LOGO AREA */}
        <div style={{
          padding: '20px 12px 16px',
          borderBottom: '1px solid #1E1E24',
          display: 'flex', alignItems: 'center', gap: 12,
          minHeight: 72, overflow: 'hidden'
        }}>
          <div
            onClick={() => fileRef.current?.click()}
            title="Clique para trocar a logo"
            style={{
              width: 40, height: 40, borderRadius: 4,
              background: logo ? 'transparent' : '#1A1A1E',
              border: `1px solid ${logo ? 'transparent' : '#2A2A30'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {logo
              ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 18, color: '#B8860B' }}>✦</span>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />

          {(fixada || aberta) && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                color: '#B8860B', letterSpacing: '0.08em', whiteSpace: 'nowrap'
              }}>{nome}</div>
              <div style={{ fontSize: 10, color: '#55555F', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
                Gestão
              </div>
            </div>
          )}
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {MODULOS.map(mod => {
            const ativo = pathname === mod.rota || (mod.rota !== '/gestao' && pathname.startsWith(mod.rota))
            return (
              <button
                key={mod.id}
                onClick={() => mod.ativo && router.push(mod.rota)}
                title={mod.label}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 12, padding: '11px 20px',
                  background: ativo ? 'rgba(184,134,11,0.12)' : 'transparent',
                  border: 'none', borderLeft: `2px solid ${ativo ? '#B8860B' : 'transparent'}`,
                  color: ativo ? '#D4A017' : mod.ativo ? '#7A7A85' : '#3A3A42',
                  cursor: mod.ativo ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', textAlign: 'left',
                  fontSize: 18, letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{mod.icon}</span>
                {(fixada || aberta) && (
                  <span style={{ fontSize: 13, fontWeight: ativo ? 600 : 400, letterSpacing: '0.01em' }}>
                    {mod.label}
                    {!mod.ativo && <span style={{ fontSize: 9, color: '#3A3A42', marginLeft: 6 }}>EM BREVE</span>}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div style={{ padding: '12px 0', borderTop: '1px solid #1E1E24' }}>
          {/* Botão fixar/soltar */}
          <button
            onClick={() => { setFixada(!fixada); setAberta(false) }}
            title={fixada ? 'Soltar sidebar' : 'Fixar sidebar'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 12, padding: '10px 20px',
              background: 'transparent', border: 'none',
              color: fixada ? '#B8860B' : '#55555F',
              cursor: 'pointer', transition: 'color 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>
              {fixada ? '◀' : '▶'}
            </span>
            {(fixada || aberta) && (
              <span style={{ fontSize: 12, letterSpacing: '0.05em' }}>
                {fixada ? 'Soltar painel' : 'Fixar painel'}
              </span>
            )}
          </button>

          {/* Sair */}
          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 12, padding: '10px 20px',
              background: 'transparent', border: 'none',
              color: '#55555F', cursor: 'pointer',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>⎋</span>
            {(fixada || aberta) && (
              <span style={{ fontSize: 12, letterSpacing: '0.05em' }}>Sair</span>
            )}
          </button>
        </div>
      </aside>

      {/* Espaço reservado quando fixada */}
      {fixada && <div style={{ width: 240, flexShrink: 0 }} />}
    </>
  )
}