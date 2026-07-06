'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GRUPOS = [
  {
    label: 'Administração',
    itens: [
      { id: 'dashboard',     label: 'Dashboard',    icon: '⬡', rota: '/gestao',               ativo: true },
      { id: 'barbeiros',     label: 'Barbeiros',    icon: '✂', rota: '/gestao/barbeiros',      ativo: true },
      { id: 'servicos',      label: 'Serviços',     icon: '◈', rota: '/gestao/servicos',       ativo: true },
      { id: 'produtos',      label: 'Produtos',     icon: '◉', rota: '/gestao/produtos',       ativo: true },
      { id: 'clientes',      label: 'Clientes',     icon: '◎', rota: '/gestao/clientes',       ativo: true },
      { id: 'configuracoes', label: 'Configurações',icon: '◌', rota: '/gestao/configuracoes',  ativo: true },
    ],
  },
  {
    label: 'Operação',
    itens: [
      { id: 'agenda',    label: 'Agenda',    icon: '▦', rota: '/gestao/agenda',    ativo: true },
    ],
  },
  {
    label: 'Financeiro',
    itens: [
      { id: 'financeiro', label: 'Faturamento', icon: '◈', rota: '/gestao/financeiro', ativo: false },
      { id: 'relatorios', label: 'Relatórios',  icon: '▤', rota: '/gestao/relatorios', ativo: false },
    ],
  },
]

interface Props { onFixadaChange?: (fixada: boolean) => void }

export default function Sidebar({ onFixadaChange }: Props) {
  const [fixada, setFixada] = useState(false)
  const [aberta, setAberta] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [nome, setNome] = useState('BARBEROS')
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

  function toggleFixada() {
    const novo = !fixada
    setFixada(novo)
    setAberta(false)
    onFixadaChange?.(novo)
  }

  const largura = (fixada || aberta) ? 240 : 56

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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const expandido = fixada || aberta

  return (
    <>
      {aberta && !fixada && (
        <div onClick={() => setAberta(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      )}

      <aside
        onMouseEnter={() => !fixada && setAberta(true)}
        onMouseLeave={() => !fixada && setAberta(false)}
        style={{
          position: fixada ? 'relative' : 'fixed',
          top: 0, left: 0, height: '100vh',
          width: largura,
          background: '#0A0A0C',
          borderRight: '1px solid #1E1E24',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* LOGO */}
        <div style={{ padding: '18px 10px 14px', borderBottom: '1px solid #1E1E24', display: 'flex', alignItems: 'center', gap: 10, minHeight: 68, overflow: 'hidden' }}>
          <div onClick={() => fileRef.current?.click()} title="Trocar logo" style={{ width: 36, height: 36, borderRadius: 4, background: logo ? 'transparent' : '#1A1A1E', border: `1px solid ${logo ? 'transparent' : '#2A2A30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}>
            {logo ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, color: '#B8860B' }}>✦</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          {expandido && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#B8860B', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{nome}</div>
              <div style={{ fontSize: 9, color: '#55555F', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 1 }}>Gestão</div>
            </div>
          )}
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {GRUPOS.map((grupo, gi) => (
            <div key={gi}>
              {expandido && (
                <div style={{ padding: '12px 14px 4px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', color: '#3A3A42', textTransform: 'uppercase' }}>{grupo.label}</div>
              )}
              {!expandido && gi > 0 && <div style={{ height: 1, background: '#1E1E24', margin: '6px 10px' }} />}
              {grupo.itens.map(mod => {
                const isAtivo = pathname === mod.rota || (mod.rota !== '/gestao' && pathname.startsWith(mod.rota))
                return (
                  <button
                    key={mod.id}
                    onClick={() => mod.ativo && router.push(mod.rota)}
                    title={!expandido ? mod.label : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 10, padding: expandido ? '10px 16px' : '10px 0',
                      justifyContent: expandido ? 'flex-start' : 'center',
                      background: isAtivo ? 'rgba(184,134,11,0.12)' : 'transparent',
                      border: 'none', borderLeft: expandido ? `2px solid ${isAtivo ? '#B8860B' : 'transparent'}` : 'none',
                      color: isAtivo ? '#D4A017' : mod.ativo ? '#7A7A85' : '#3A3A42',
                      cursor: mod.ativo ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s', textAlign: 'left',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                    }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0, width: expandido ? 18 : 'auto', textAlign: 'center' }}>{mod.icon}</span>
                    {expandido && (
                      <span style={{ fontSize: 12, fontWeight: isAtivo ? 600 : 400, letterSpacing: '0.01em' }}>
                        {mod.label}
                        {!mod.ativo && <span style={{ fontSize: 8, color: '#3A3A42', marginLeft: 6, letterSpacing: '0.1em' }}>EM BREVE</span>}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* FOOTER */}
        <div style={{ padding: '8px 0', borderTop: '1px solid #1E1E24' }}>
          <button onClick={toggleFixada} title={fixada ? 'Soltar sidebar' : 'Fixar sidebar'} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: expandido ? '9px 16px' : '9px 0', justifyContent: expandido ? 'flex-start' : 'center', background: 'transparent', border: 'none', color: fixada ? '#B8860B' : '#55555F', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: 14, flexShrink: 0, width: expandido ? 18 : 'auto', textAlign: 'center' }}>{fixada ? '◀' : '▶'}</span>
            {expandido && <span style={{ fontSize: 11, letterSpacing: '0.05em' }}>{fixada ? 'Soltar painel' : 'Fixar painel'}</span>}
          </button>
          <button onClick={handleLogout} title="Sair" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: expandido ? '9px 16px' : '9px 0', justifyContent: expandido ? 'flex-start' : 'center', background: 'transparent', border: 'none', color: '#55555F', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: 14, flexShrink: 0, width: expandido ? 18 : 'auto', textAlign: 'center' }}>⎋</span>
            {expandido && <span style={{ fontSize: 11, letterSpacing: '0.05em' }}>Sair</span>}
          </button>
        </div>
      </aside>

      {fixada && <div style={{ width: 240, flexShrink: 0 }} />}
    </>
  )
}
