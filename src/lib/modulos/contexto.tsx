'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

type ClienteSupabase = ReturnType<typeof createClient>

export interface ContextoBarberOS {
  /** Cliente Supabase já autenticado com a sessão de quem está usando o sistema. */
  supabase: ClienteSupabase
  carregando: boolean
  usuario: { id: string; nome: string; role: string; email: string | null } | null
  barbearia: { id: string; nome: string } | null
  /** Preenchido quando o usuário logado é um barbeiro. */
  barbeiroId: string | null
}

const Contexto = createContext<ContextoBarberOS | null>(null)

/**
 * Entrega aos módulos quem está logado, de qual barbearia e o cliente do banco,
 * para que nenhum módulo precise refazer login ou buscar essas informações.
 */
export function BarberOSProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [estado, setEstado] = useState<Omit<ContextoBarberOS, 'supabase'>>({
    carregando: true,
    usuario: null,
    barbearia: null,
    barbeiroId: null,
  })

  useEffect(() => {
    let vivo = true
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (vivo) setEstado(e => ({ ...e, carregando: false }))
        return
      }
      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, role, barbearia_id')
        .eq('id', user.id)
        .maybeSingle()

      // Barbearia ativa (para o super admin, a que ele escolheu; para os demais, a do perfil)
      const { data: barbeariaAtiva } = await supabase.rpc('minha_barbearia')
      const barbeariaId = (barbeariaAtiva as string | null) ?? perfil?.barbearia_id ?? null

      const [{ data: barbearia }, { data: barbeiro }] = await Promise.all([
        barbeariaId
          ? supabase.from('barbearias').select('id, nome').eq('id', barbeariaId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('barbeiros').select('id').eq('perfil_id', user.id).maybeSingle(),
      ])

      if (!vivo) return
      setEstado({
        carregando: false,
        usuario: perfil ? { id: user.id, nome: perfil.nome, role: perfil.role, email: user.email ?? null } : null,
        barbearia: barbearia ? { id: barbearia.id, nome: barbearia.nome } : null,
        barbeiroId: barbeiro?.id ?? null,
      })
    }
    carregar()
    return () => { vivo = false }
  }, [supabase])

  return <Contexto.Provider value={{ supabase, ...estado }}>{children}</Contexto.Provider>
}

/** Use dentro de qualquer módulo: const { supabase, usuario, barbearia } = useBarberOS() */
export function useBarberOS(): ContextoBarberOS {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useBarberOS só pode ser usado dentro de um módulo do BarberOS.')
  return ctx
}
