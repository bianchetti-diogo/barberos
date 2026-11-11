'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePermissoes } from '@/lib/permissoes'
import { PageHeader, PageBody, EmptyState, Carregando } from '@/components/ui'

interface Registro { id: number; usuario_id: string | null; acao: string; entidade: string | null; detalhe: Record<string, unknown> | null; criado_em: string }

const ROTULOS: Record<string, string> = {
  'permissao.adicionar': 'Liberou uma permissão',
  'permissao.remover': 'Retirou uma permissão',
  'permissao.adicionar_modulo': 'Liberou um módulo inteiro',
  'permissao.remover_modulo': 'Retirou um módulo inteiro',
  'grupo.criar': 'Criou um grupo',
  'grupo.alterar': 'Alterou um grupo',
  'grupo.excluir': 'Excluiu um grupo',
  'cargo.criar': 'Criou um cargo',
  'cargo.alterar': 'Alterou um cargo',
  'cargo.excluir': 'Excluiu um cargo',
  'usuario.alterar': 'Alterou um usuário',
  'super_admin.trocar_barbearia': 'Super admin trocou de barbearia',
  'super_admin.criar_barbearia': 'Super admin criou uma barbearia',
}

export default function AuditoriaPage() {
  const supabase = useMemo(() => createClient(), [])
  const { pode, carregando: carregandoPerm } = usePermissoes()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('auditoria').select('*').order('criado_em', { ascending: false }).limit(300)
      const lista = (data || []) as Registro[]
      setRegistros(lista)
      const ids = Array.from(new Set(lista.map(r => r.usuario_id).filter(Boolean))) as string[]
      if (ids.length) {
        const { data: perfis } = await supabase.from('perfis').select('id, nome').in('id', ids)
        const mapa: Record<string, string> = {}
        ;(perfis || []).forEach((p: { id: string; nome: string }) => { mapa[p.id] = p.nome })
        setNomes(mapa)
      }
      setCarregando(false)
    }
    carregar()
  }, [supabase])

  if (carregando || carregandoPerm) return <><PageHeader eyebrow="Administração" titulo="Histórico" /><PageBody><Carregando /></PageBody></>
  if (!pode('admin.auditoria')) {
    return <><PageHeader eyebrow="Administração" titulo="Histórico" /><PageBody><EmptyState icone="◌" texto="Você não tem permissão para ver o histórico." /></PageBody></>
  }

  return (
    <div>
      <PageHeader eyebrow="Administração" titulo="Histórico de alterações" />
      <PageBody>
        <p className="section-desc" style={{ marginBottom: 16 }}>Registro das mudanças sensíveis: permissões, grupos, cargos, usuários e ações do super admin. Mostra as últimas 300.</p>
        <div className="section table-scroll" style={{ padding: 0 }}>
          {registros.length === 0 ? <EmptyState icone="◌" texto="Nada registrado ainda." /> : (
            <div className="table-inner">
              <table className="tbl">
                <thead><tr><th>Quando</th><th>Quem</th><th>O que</th><th>Detalhe</th></tr></thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.criado_em).toLocaleString('pt-BR')}</td>
                      <td>{(r.usuario_id && nomes[r.usuario_id]) || '—'}</td>
                      <td>{ROTULOS[r.acao] || r.acao}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.detalhe ? Object.entries(r.detalhe).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>
    </div>
  )
}
