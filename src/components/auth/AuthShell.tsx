import Link from 'next/link'
import LogoBarberOS from '@/components/brand/LogoBarberOS'

interface Props {
  titulo: string
  subtitulo: string
  children: React.ReactNode
  rodape?: { texto: string; linkTexto: string; href: string }
}

/** Moldura visual compartilhada pelas telas de login e cadastro. */
export default function AuthShell({ titulo, subtitulo, children, rodape }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <LogoBarberOS tamanho={64} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.14em' }}>
            BARBEROS
          </div>
        </div>

        <div className="card" style={{ padding: '32px 32px 28px', background: 'var(--surface)', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>{titulo}</h1>
          <p style={{ color: 'var(--faint)', fontSize: 13, margin: '4px 0 24px' }}>{subtitulo}</p>
          {children}
        </div>

        {rodape && (
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
            {rodape.texto}{' '}
            <Link href={rodape.href} style={{ color: 'var(--gold)', fontWeight: 600 }}>{rodape.linkTexto}</Link>
          </p>
        )}
      </div>
    </div>
  )
}
