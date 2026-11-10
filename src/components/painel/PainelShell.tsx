'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface NavItem { href: string; label: string }

interface Props {
  rotulo: string
  nav: NavItem[]
  children: React.ReactNode
}

/** Estrutura das áreas do barbeiro e do cliente: barra superior escura + conteúdo centralizado. */
export default function PainelShell({ rotulo, nav, children }: Props) {
  const [nome, setNome] = useState('')
  const [role, setRole] = useState('')
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, role')
        .eq('id', user.id)
        .maybeSingle()
      if (perfil) {
        setNome(perfil.nome)
        setRole(perfil.role)
      }
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F2ED', fontFamily: "'Space Grotesk', sans-serif" }}>
      <header className="painel-topbar">
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 6, background: '#1A1A1E', border: '1px solid #2A2A30', color: '#B8860B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✂</div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#B8860B', letterSpacing: '0.12em' }}>BARBEROS</div>
              <div style={{ fontSize: 9, color: '#55555F', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{rotulo}</div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            {nav.map(item => {
              const ativo = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  padding: '6px 12px', borderRadius: 4, fontSize: 12,
                  color: ativo ? '#D4A017' : '#9A9AA5',
                  background: ativo ? 'rgba(184,134,11,0.12)' : 'transparent',
                  fontWeight: ativo ? 600 : 400,
                }}>{item.label}</Link>
              )
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role === 'gestao' && (
              <Link href="/gestao" style={{ fontSize: 11, color: '#9A9AA5', border: '1px solid #2A2A30', borderRadius: 4, padding: '5px 10px' }}>← Gestão</Link>
            )}
            {nome && <span style={{ fontSize: 12, color: '#C8C8D0', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>}
            <button onClick={sair} style={{ background: 'transparent', border: '1px solid #2A2A30', color: '#9A9AA5', borderRadius: 4, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="painel-container">{children}</main>
    </div>
  )
}
