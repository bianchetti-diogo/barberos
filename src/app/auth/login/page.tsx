'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    // Força reload completo para o middleware pegar os cookies
    window.location.href = '/'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F2ED',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #E4E2DC',
        borderRadius: 6,
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: 22,
          fontWeight: 700,
          color: '#B8860B',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}>BARBEROS</div>
        <p style={{ color: '#9A9890', fontSize: 13, marginBottom: 36 }}>
          Acesse sua conta
        </p>

        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: 'block', fontFamily: 'monospace',
            fontSize: 10, letterSpacing: '0.15em',
            color: '#9A9890', textTransform: 'uppercase', marginBottom: 6,
          }}>E-MAIL</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              background: '#FAFAF7', border: '1px solid #E0DED8',
              borderRadius: 3, color: '#1A1A22', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: 'block', fontFamily: 'monospace',
            fontSize: 10, letterSpacing: '0.15em',
            color: '#9A9890', textTransform: 'uppercase', marginBottom: 6,
          }}>SENHA</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 14px',
              background: '#FAFAF7', border: '1px solid #E0DED8',
              borderRadius: 3, color: '#1A1A22', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          />
        </div>

        {erro && (
          <p style={{
            color: '#DC2626', fontSize: 12,
            marginBottom: 16, fontFamily: 'monospace',
          }}>{erro}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={carregando}
          style={{
            width: '100%', padding: '12px',
            background: carregando ? '#C0BEB8' : '#B8860B',
            border: 'none', borderRadius: 3,
            color: '#fff', fontSize: 12,
            fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: '0.12em', cursor: carregando ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {carregando ? 'ENTRANDO...' : 'ENTRAR'}
        </button>
      </div>
    </div>
  )
}
