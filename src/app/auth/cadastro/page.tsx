'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import AuthShell from '@/components/auth/AuthShell'

export default function Cadastro() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const supabase = createClient()

  function set(campo: keyof typeof form, valor: string) {
    setForm(p => ({ ...p, [campo]: valor }))
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (form.nome.trim().length < 2) return setErro('Informe seu nome completo.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setErro('Informe um e-mail válido.')
    if (form.senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (form.senha !== form.confirmar) return setErro('As senhas não conferem.')

    setCarregando(true)
    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          senha: form.senha,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível criar a conta.')

      // Já entra automaticamente com a conta recém-criada
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.senha,
      })
      if (error) {
        window.location.href = '/auth/login'
        return
      }
      window.location.href = '/'
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar conta.')
      setCarregando(false)
    }
  }

  return (
    <AuthShell
      titulo="Criar conta"
      subtitulo="Cadastre-se para agendar seus horários"
      rodape={{ texto: 'Já tem conta?', linkTexto: 'Entrar', href: '/auth/login' }}
    >
      <form onSubmit={handleCadastro} noValidate>
        <div style={{ marginBottom: 14 }}>
          <label className="field-label" htmlFor="nome">Nome completo</label>
          <input id="nome" className="field" autoComplete="name" autoFocus value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="field-label" htmlFor="email">E-mail</label>
          <input id="email" type="email" className="field" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@email.com" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="field-label" htmlFor="telefone">Telefone / WhatsApp</label>
          <input id="telefone" className="field" autoComplete="tel" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
        </div>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label className="field-label" htmlFor="senha">Senha</label>
            <input id="senha" type="password" className="field" autoComplete="new-password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="Mín. 8 caracteres" />
          </div>
          <div>
            <label className="field-label" htmlFor="confirmar">Confirmar senha</label>
            <input id="confirmar" type="password" className="field" autoComplete="new-password" value={form.confirmar} onChange={e => set('confirmar', e.target.value)} placeholder="Repita a senha" />
          </div>
        </div>

        {erro && (
          <div role="alert" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 4, color: '#DC2626', fontSize: 12, padding: '9px 12px', marginBottom: 16 }}>
            {erro}
          </div>
        )}

        <button type="submit" disabled={carregando} className="btn btn-primary" style={{ width: '100%', padding: 13, fontSize: 12 }}>
          {carregando ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
        </button>
      </form>
    </AuthShell>
  )
}
