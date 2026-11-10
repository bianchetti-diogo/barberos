import Link from 'next/link'

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
      background: 'radial-gradient(circle at 20% 0%, rgba(184,134,11,0.12), transparent 45%), radial-gradient(circle at 100% 100%, rgba(10,10,12,0.08), transparent 40%), #F4F2ED',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 12px', borderRadius: 10,
            background: '#0A0A0C', color: '#B8860B', fontSize: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(10,10,12,0.25)',
          }}>✂</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: '#B8860B', letterSpacing: '0.14em' }}>
            BARBEROS
          </div>
        </div>

        <div className="card" style={{ padding: '32px 32px 28px', boxShadow: '0 12px 40px rgba(26,26,34,0.08)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A22' }}>{titulo}</h1>
          <p style={{ color: '#9A9890', fontSize: 13, margin: '4px 0 24px' }}>{subtitulo}</p>
          {children}
        </div>

        {rodape && (
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#6A6860' }}>
            {rodape.texto}{' '}
            <Link href={rodape.href} style={{ color: '#B8860B', fontWeight: 600 }}>{rodape.linkTexto}</Link>
          </p>
        )}
      </div>
    </div>
  )
}
