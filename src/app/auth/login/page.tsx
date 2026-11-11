'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import AuthShell from '@/components/auth/AuthShell'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !senha) {
      setErro('Informe e-mail e senha.')
      return
    }
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    // Recarrega por completo para o proxy ler os cookies e levar ao ambiente certo
    window.location.href = '/'
  }

  return (
    <AuthShell
      titulo="Bem-vindo de volta"
      subtitulo="Acesse sua conta para continuar"
      rodape={{ texto: 'Ainda não tem conta?', linkTexto: 'Criar conta de cliente', href: '/auth/cadastro' }}
    >
      <form onSubmit={handleLogin} noValidate>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label" htmlFor="email">E-mail</label>
          <input
            id="email" type="email" autoComplete="email" autoFocus
            className="field" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="field-label" htmlFor="senha">Senha</label>
          <div style={{ position: 'relative' }}>
            <input
              id="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password"
              className="field" style={{ paddingRight: 64 }}
              value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Sua senha"
            />
            <button
              type="button" onClick={() => setMostrarSenha(v => !v)}
              style={{ position: 'absolute', right: 6, top: 6, bottom: 6, padding: '0 10px', background: 'transparent', border: 'none', color: 'var(--faint)', fontSize: 11, cursor: 'pointer' }}
            >
              {mostrarSenha ? 'OCULTAR' : 'VER'}
            </button>
          </div>
        </div>

        {erro && (
          <div role="alert" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 12, padding: '9px 12px', marginBottom: 16 }}>
            {erro}
          </div>
        )}

        <button type="submit" disabled={carregando} className="btn btn-primary" style={{ width: '100%', padding: 13, fontSize: 12 }}>
          {carregando ? 'ENTRANDO...' : 'ENTRAR'}
        </button>
      </form>
    </AuthShell>
  )
}
