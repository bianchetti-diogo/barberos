'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Estado {
  carregando: boolean
  acoes: string[]
  superAdmin: boolean
  barbeariaId: string | null
}

const VAZIO: Estado = { carregando: true, acoes: [], superAdmin: false, barbeariaId: null }

/**
 * Permissões de quem está logado, vindas do banco (grupo da pessoa).
 * Esconder na tela é só conforto: quem barra de verdade é o banco (RLS) e as rotas de API.
 *   const { pode, carregando } = usePermissoes()
 *   if (pode('agenda.editar')) ...
 */
export function usePermissoes() {
  const [estado, setEstado] = useState<Estado>(VAZIO)

  useEffect(() => {
    let vivo = true
    const supabase = createClient()
    Promise.all([
      supabase.rpc('minhas_permissoes'),
      supabase.rpc('sou_super_admin'),
      supabase.rpc('minha_barbearia'),
    ]).then(([perm, sup, barb]) => {
      if (!vivo) return
      setEstado({
        carregando: false,
        acoes: Array.isArray(perm.data) ? (perm.data as string[]) : [],
        superAdmin: sup.data === true,
        barbeariaId: (barb.data as string | null) ?? null,
      })
    })
    return () => { vivo = false }
  }, [])

  const pode = (acao?: string) => !acao || estado.acoes.includes(acao)
  return { ...estado, pode }
}
