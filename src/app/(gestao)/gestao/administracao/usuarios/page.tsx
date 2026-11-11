'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePermissoes } from '@/lib/permissoes'
import { PageHeader, PageBody, EmptyState, Carregando } from '@/components/ui'

interface Usuario { id: string; nome: string; role: string; ativo: boolean; grupo_id: string | null; cargo_id: string | null; temBarbeiro: boolean }
interface Opcao { id: string; nome: string; ativo?: boolean }

export default function UsuariosPage() {
  const supabase = useMemo(() => createClient(), [])
  const { pode, carregando: carregandoPerm } = usePermissoes()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [grupos, setGrupos] = useState<Opcao[]>([])
  const [cargos, setCargos] = useState<Opcao[]>([])
  const [meuId, setMeuId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setMeuId(user?.id || '')
    const [p, b, g, c] = await Promise.all([
      supabase.from('perfis').select('id, nome, role, ativo, grupo_id').in('role', ['gestao', 'barbeiro']).order('nome'),
      supabase.from('barbeiros').select('perfil_id, cargo_id'),
      supabase.from('grupos').select('id, nome, ativo').order('nome'),
      supabase.from('cargos').select('id, nome, ativo').order('ordem'),
    ])
    const cargoPorPerfil: Record<string, string | null> = {}
    ;(b.data || []).forEach((r: { perfil_id: string; cargo_id: string | null }) => { cargoPorPerfil[r.perfil_id] = r.cargo_id })
    setUsuarios((p.data || []).map((u: { id: string; nome: string; role: string; ativo: boolean; grupo_id: string | null }) => ({
      ...u, cargo_id: cargoPorPerfil[u.id] ?? null, temBarbeiro: u.id in cargoPorPerfil,
    })))
    setGrupos((g.data || []) as Opcao[])
    setCargos((c.data || []) as Opcao[])
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  async function alterar(id: string, campos: { grupo_id?: string | null; cargo_id?: string | null; ativo?: boolean }) {
    setSalvando(id); setErro('')
    const r = await fetch('/api/admin/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...campos }) })
    const j = await r.json().catch(() => ({}))
    setSalvando(null)
    if (!r.ok) { setErro(j.error || 'Não foi possível salvar.'); return }
    setAviso('Salvo.')
    setTimeout(() => setAviso(''), 2000)
    carregar()
  }

  if (carregando || carregandoPerm) return <><PageHeader eyebrow="Administração" titulo="Usuários" /><PageBody><Carregando /></PageBody></>
  if (!pode('admin.usuarios')) {
    return <><PageHeader eyebrow="Administração" titulo="Usuários" /><PageBody><EmptyState icone="◌" texto="Você não tem permissão para gerenciar usuários." /></PageBody></>
  }

  return (
    <div>
      <PageHeader eyebrow="Administração" titulo="Usuários da equipe" />
      <PageBody>
        <p className="section-desc" style={{ marginBottom: 16 }}>
          O <strong>grupo</strong> define o que a pessoa vê e faz. O <strong>cargo</strong> define o nível de premiação (as regras de comissão usam o cargo).
          Para cadastrar um barbeiro novo, use a tela Barbeiros.
        </p>
        {erro && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{erro}</div>}
        {aviso && <div className="toast">{aviso}</div>}
        <div className="section table-scroll" style={{ padding: 0 }}>
          <div className="table-inner">
            <table className="tbl">
              <thead>
                <tr><th>Nome</th><th>Área</th><th>Grupo</th><th>Cargo</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const eu = u.id === meuId
                  return (
                    <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.55 }}>
                      <td>{u.nome}{eu && <span className="tag tag-neutro" style={{ marginLeft: 8 }}>você</span>}</td>
                      <td>{u.role === 'gestao' ? 'Gestão' : 'Barbeiro'}</td>
                      <td>
                        <select className="field" value={u.grupo_id || ''} disabled={eu || salvando === u.id}
                          onChange={e => alterar(u.id, { grupo_id: e.target.value || null })}>
                          <option value="">(sem grupo)</option>
                          {grupos.filter(g => g.ativo !== false).map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                        </select>
                      </td>
                      <td>
                        {u.temBarbeiro ? (
                          <select className="field" value={u.cargo_id || ''} disabled={salvando === u.id}
                            onChange={e => alterar(u.id, { cargo_id: e.target.value || null })}>
                            <option value="">(sem cargo)</option>
                            {cargos.filter(c => c.ativo !== false).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                        ) : <span style={{ color: 'var(--faint)' }}>—</span>}
                      </td>
                      <td>
                        <button type="button" className={`btn btn-sm${u.ativo ? '' : ' btn-primary'}`} disabled={eu || salvando === u.id}
                          onClick={() => alterar(u.id, { ativo: !u.ativo })}>
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </div>
  )
}
