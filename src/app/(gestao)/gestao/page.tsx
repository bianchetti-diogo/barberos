'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Gestao() {
  const [nome, setNome] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome')
        .eq('id', user.id)
        .single()

      if (perfil) setNome(perfil.nome)
    }
    carregarPerfil()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      color: '#F0EDE8',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #252830',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          color: '#C9A84C',
          letterSpacing: '0.08em'
        }}>BARBEROS</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#7A7F8A', fontSize: '14px' }}>Olá, {nome}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              border: '1px solid #252830',
              borderRadius: '2px',
              color: '#7A7F8A',
              fontSize: '12px',
              letterSpacing: '0.1em',
              cursor: 'pointer'
            }}
          >SAIR</button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '60px 40px' }}>
        <p style={{ color: '#7A7F8A', fontSize: '12px', letterSpacing: '0.2em', marginBottom: '12px' }}>
          PAINEL DE GESTÃO
        </p>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '48px',
          color: '#F0EDE8',
          marginBottom: '48px'
        }}>Bem-vindo, {nome.split(' ')[0]}.</h1>

        {/* Cards dos módulos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2px'
        }}>
          {[
            { titulo: 'Agendamentos', desc: 'Gerencie a agenda da barbearia', cor: '#4ECDA4', status: 'Em breve' },
            { titulo: 'Barbeiros', desc: 'Cadastros e comissões', cor: '#C9A84C', status: 'Em breve' },
            { titulo: 'Financeiro', desc: 'Faturamento e relatórios', cor: '#4A90E2', status: 'Em breve' },
            { titulo: 'Produtos', desc: 'Estoque e loja', cor: '#E05252', status: 'Em breve' },
          ].map((card) => (
            <div key={card.titulo} style={{
              background: '#17191C',
              border: '1px solid #252830',
              borderTop: `3px solid ${card.cor}`,
              padding: '32px 28px',
            }}>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{card.titulo}</h3>
              <p style={{ color: '#7A7F8A', fontSize: '13px', marginBottom: '20px' }}>{card.desc}</p>
              <span style={{
                fontSize: '11px',
                color: card.cor,
                letterSpacing: '0.1em',
                fontFamily: 'monospace'
              }}>{card.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}