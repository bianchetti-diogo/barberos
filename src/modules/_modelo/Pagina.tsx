'use client'

import { useEffect, useState } from 'react'
import { useBarberOS } from '@/lib/modulos/contexto'
import type { PropsModulo } from '../types'
import { PageHeader, PageBody, StatGrid, StatCard, EmptyState, Carregando } from '@/components/ui'

/**
 * Página principal do módulo modelo. Mostra como:
 *  - pegar usuário, barbearia e banco com useBarberOS();
 *  - ler dados do núcleo (aqui, os atendimentos concluídos do mês);
 *  - reaproveitar o visual do sistema (PageHeader, StatCard, EmptyState).
 */
export default function Pagina({ caminho }: PropsModulo) {
  const { supabase, usuario, barbearia, barbeiroId } = useBarberOS()
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    async function carregar() {
      const d = new Date()
      const ini = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
      let consulta = supabase
        .from('agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'concluido')
        .gte('data_hora', ini)
      // Barbeiro vê só os dele (o banco já impede o resto); gestão vê tudo
      if (usuario?.role === 'barbeiro' && barbeiroId) consulta = consulta.eq('barbeiro_id', barbeiroId)
      const { count } = await consulta
      setTotal(count ?? 0)
    }
    carregar()
  }, [supabase, usuario, barbeiroId])

  return (
    <div>
      <PageHeader eyebrow={barbearia?.nome || 'BarberOS'} titulo="Módulo Modelo" />
      <PageBody>
        <p style={{ fontSize: 12, color: '#9A9890', marginBottom: 16 }}>
          Subrota recebida: {caminho.length ? caminho.join(' / ') : '(raiz do módulo)'}
        </p>
        {total === null ? (
          <Carregando />
        ) : (
          <StatGrid>
            <StatCard rotulo="Atendimentos concluídos no mês" valor={total} />
            <StatCard rotulo="Logado como" valor={usuario?.nome.split(' ')[0] || '—'} />
          </StatGrid>
        )}
        <EmptyState icone="◈" texto="Substitua este conteúdo pelo seu módulo." />
      </PageBody>
    </div>
  )
}
