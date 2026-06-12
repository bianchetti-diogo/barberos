'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
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

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#17191C',
        border: '1px solid #252830',
        borderRadius: '4px',
        padding: '48px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '32px',
          color: '#C9A84C',
          marginBottom: '8px',
          letterSpacing: '0.08em'
        }}>BARBEROS</h1>
        <p style={{ color: '#7A7F8A', fontSize: '14px', marginBottom: '40px' }}>
          Acesse sua conta
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#7A7F8A', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '8px' }}>
            E-MAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#0A0A0A',
              border: '1px solid #252830',
              borderRadius: '2px',
              color: '#F0EDE8',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', color: '#7A7F8A', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '8px' }}>
            SENHA
          </label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#0A0A0A',
              border: '1px solid #252830',
              borderRadius: '2px',
              color: '#F0EDE8',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {erro && (
          <p style={{ color: '#E05252', fontSize: '13px', marginBottom: '20px' }}>{erro}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={carregando}
          style={{
            width: '100%',
            padding: '14px',
            background: carregando ? '#7A7F8A' : '#C9A84C',
            border: 'none',
            borderRadius: '2px',
            color: '#0A0A0A',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.1em',
            cursor: carregando ? 'not-allowed' : 'pointer'
          }}
        >
          {carregando ? 'ENTRANDO...' : 'ENTRAR'}
        </button>
      </div>
    </div>
  )
}