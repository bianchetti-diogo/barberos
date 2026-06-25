'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const MODULOS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '⬡', rota: '/gestao',                  ativo: true },
  { id: 'barbeiros',     label: 'Barbeiros',      icon: '✂', rota: '/gestao/barbeiros',         ativo: true },
  { id: 'servicos',      label: 'Serviços',       icon: '◈', rota: '/gestao/servicos',          ativo: true },
  { id: 'produtos',      label: 'Produtos',       icon: '◉', rota: '/gestao/produtos',          ativo: true },
  { id: 'clientes',      label: 'Clientes',       icon: '◎', rota: '/gestao/clientes',          ativo: true },
  { id: 'agenda',        label: 'Agenda',         icon: '▦', rota: '/gestao/agenda',            ativo: false },
  { id: 'financeiro',    label: 'Financeiro',     icon: '▣', rota: '/gestao/financeiro',        ativo: false },
  { id: 'relatorios',    label: 'Relatórios',     icon: '▤', rota: '/gestao/relatorios',        ativo: false },
  { id: 'configuracoes', label: 'Configurações',  icon: '◌', rota: '/gestao/configuracoes',     ativo: true },
]

export default function Sidebar({ onFixadaChange }: { onFixadaChange?: (f: boolean) => void }) {
  const [fixada, setFixada] = useState(false)
  const [aberta, setAberta] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const logoSalva = localStorage.getItem('barberos_logo')
    if (logoSalva) setLogo(logoSalva)
  }, [])

  const expandida = fixada || aberta

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

  function toggleFixar() {
    const novo = !fixada
    setFixada(novo)
    setAberta(false)
    onFixadaChange?.(novo)
  }

  return (
    <>
      {aberta && !fixada && (
        <div onClick={() => setAberta(false)} style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(26,26,34,0.15)', backdropFilter: 'blur(2px)',
        }} />
      )}

      <aside
        onMouseEnter={() => !fixada && setAberta(true)}
        onMouseLeave={() => !fixada && setAberta(false)}
        style={{
          position: fixada ? 'relative' : 'fixed',
          top: 0, left: 0, height: '100vh',
          width: expandida ? 220 : 56,
          background: '#FFFFFF',
          borderRight: '1px solid #E4E2DC',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden', zIndex: 50, flexShrink: 0,
          boxShadow: expandida && !fixada ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {/* LOGO */}
        <div style={{
          padding: expandida ? '16px 14px' : '14px 8px',
          borderBottom: '1px solid #E4E2DC',
          display: 'flex', alignItems: 'center', gap: 10,
          minHeight: 64, overflow: 'hidden',
          transition: 'padding 0.22s',
        }}>
          <div
            onClick={() => fileRef.current?.click()}
            title="Clique para trocar a logo"
            style={{
              width: 36, height: 36, borderRadius: 4, flexShrink: 0,
              background: logo ? 'transparent' : '#F4F2ED',
              border: `1px solid ${logo ? 'transparent' : '#E4E2DC'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden',
            }}
          >
            {logo
              ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 16, color: '#B8860B' }}>✦</span>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />

          {expandida && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#B8860B', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                BARBEROS
              </div>
              <div style={{ fontSize: 10, color: '#9A9890', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
                Gestão
              </div>
            </div>
          )}
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {MODULOS.map(mod => {
            const ativo = pathname === mod.rota || (mod.rota !== '/gestao' && pathname.startsWith(mod.rota))
            return (
              <button
                key={mod.id}
                onClick={() => mod.ativo && router.push(mod.rota)}
                title={mod.label}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: expandida ? '10px 14px' : '10px 0',
                  justifyContent: expandida ? 'flex-start' : 'center',
                  background: ativo ? 'rgba(184,134,11,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${ativo ? '#B8860B' : 'transparent'}`,
                  color: ativo ? '#8A6200' : mod.ativo ? '#4A4840' : '#C0BEB8',
                  cursor: mod.ativo ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', textAlign: 'left',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  fontSize: 15,
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, width: expandida ? 'auto' : 20, textAlign: 'center' }}>
                  {mod.icon}
                </span>
                {expandida && (
                  <span style={{ fontSize: 12, fontWeight: ativo ? 600 : 400 }}>
                    {mod.label}
                    {!mod.ativo && <span style={{ fontSize: 8, color: '#C0BEB8', marginLeft: 5, letterSpacing: '0.05em' }}>EM BREVE</span>}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div style={{ padding: '8px 0', borderTop: '1px solid #E4E2DC' }}>
          <button
            onClick={toggleFixar}
            title={fixada ? 'Soltar painel' : 'Fixar painel'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: expandida ? '9px 14px' : '9px 0',
              justifyContent: expandida ? 'flex-start' : 'center',
              background: 'transparent', border: 'none',
              color: fixada ? '#B8860B' : '#9A9890',
              cursor: 'pointer', transition: 'color 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 12, flexShrink: 0, width: expandida ? 'auto' : 20, textAlign: 'center' }}>
              {fixada ? '◀' : '▶'}
            </span>
            {expandida && <span style={{ fontSize: 11 }}>{fixada ? 'Soltar painel' : 'Fixar painel'}</span>}
          </button>

          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: expandida ? '9px 14px' : '9px 0',
              justifyContent: expandida ? 'flex-start' : 'center',
              background: 'transparent', border: 'none',
              color: '#9A9890', cursor: 'pointer', transition: 'color 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 12, flexShrink: 0, width: expandida ? 'auto' : 20, textAlign: 'center' }}>⎋</span>
            {expandida && <span style={{ fontSize: 11 }}>Sair</span>}
          </button>
        </div>
      </aside>

      {fixada && <div style={{ width: 220, flexShrink: 0 }} />}
    </>
  )
}
