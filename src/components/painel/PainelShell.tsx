'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import LogoBarberOS from '@/components/brand/LogoBarberOS'
import BotaoTema from '@/components/ui/BotaoTema'

interface NavItem { href: string; label: string }

interface Props {
  rotulo: string
  nav: NavItem[]
  children: React.ReactNode
}

/** Estrutura das áreas do barbeiro e do cliente: barra superior + conteúdo centralizado. */
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="painel-topbar">
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoBarberOS tamanho={34} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.12em' }}>BARBEROS</div>
              <div style={{ fontSize: 9, color: 'var(--faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{rotulo}</div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            {nav.map(item => {
              const ativo = pathname === item.href || (item.href.includes('/m/') && pathname.startsWith(item.href + '/'))
              return (
                <Link key={item.href} href={item.href} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  color: ativo ? 'var(--gold)' : 'var(--muted)',
                  background: ativo ? 'var(--gold-soft)' : 'transparent',
                  fontWeight: ativo ? 600 : 400,
                }}>{item.label}</Link>
              )
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role === 'gestao' && (
              <Link href="/gestao" className="btn btn-sm">← Gestão</Link>
            )}
            {nome && <span style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>}
            <div style={{ width: 36 }}><BotaoTema rotulo={false} /></div>
            <button onClick={sair} className="btn btn-sm">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="painel-container">{children}</main>
    </div>
  )
}
