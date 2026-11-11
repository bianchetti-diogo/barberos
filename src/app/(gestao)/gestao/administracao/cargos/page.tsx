'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePermissoes } from '@/lib/permissoes'
import { PageHeader, PageBody, EmptyState, Carregando } from '@/components/ui'

interface Cargo { id: string; nome: string; descricao: string | null; ordem: number; ativo: boolean }

export default function CargosPage() {
  const supabase = useMemo(() => createClient(), [])
  const { pode, carregando: carregandoPerm } = usePermissoes()
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('cargos').select('*').order('ordem').order('nome')
    setCargos((data || []) as Cargo[])
    setCarregando(false)
  }, [supabase])
  useEffect(() => { carregar() }, [carregar])

  async function criar() {
    if (!nome.trim()) return
    setErro('')
    const { data: bid } = await supabase.rpc('minha_barbearia')
    const proxima = cargos.reduce((m, c) => Math.max(m, c.ordem), 0) + 1
    const { error } = await supabase.from('cargos').insert({ barbearia_id: bid, nome: nome.trim(), descricao: descricao.trim() || null, ordem: proxima })
    if (error) { setErro(error.code === '23505' ? 'Já existe um cargo com esse nome.' : error.message); return }
    await supabase.rpc('registrar_auditoria', { p_acao: 'cargo.criar', p_entidade: 'cargos', p_detalhe: { nome: nome.trim() } })
    setNome(''); setDescricao('')
    carregar()
  }

  async function salvar(c: Cargo, campos: Partial<Cargo>) {
    setErro('')
    const { error } = await supabase.from('cargos').update(campos).eq('id', c.id)
    if (error) { setErro(error.code === '23505' ? 'Já existe um cargo com esse nome.' : error.message); return }
    await supabase.rpc('registrar_auditoria', { p_acao: 'cargo.alterar', p_entidade: 'cargos', p_detalhe: { cargo: c.nome, ...campos } })
    carregar()
  }

  async function excluir(c: Cargo) {
    if (!confirm(`Excluir o cargo "${c.nome}"? Quem está nele ficará sem cargo.`)) return
    const { error } = await supabase.from('cargos').delete().eq('id', c.id)
    if (error) { setErro(error.message); return }
    await supabase.rpc('registrar_auditoria', { p_acao: 'cargo.excluir', p_entidade: 'cargos', p_detalhe: { nome: c.nome } })
    carregar()
  }

  if (carregando || carregandoPerm) return <><PageHeader eyebrow="Administração" titulo="Cargos" /><PageBody><Carregando /></PageBody></>
  if (!pode('admin.cargos')) {
    return <><PageHeader eyebrow="Administração" titulo="Cargos" /><PageBody><EmptyState icone="◌" texto="Você não tem permissão para gerenciar cargos." /></PageBody></>
  }

  return (
    <div>
      <PageHeader eyebrow="Administração" titulo="Cargos e níveis" />
      <PageBody larguraMax={900}>
        <p className="section-desc" style={{ marginBottom: 16 }}>
          O cargo é o nível do profissional na premiação (por exemplo, Barbeiro, Líder, Coordenador). Os percentuais e bonificações de cada cargo serão definidos nas regras de comissão. O cargo é separado do grupo de permissões.
        </p>
        {erro && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{erro}</div>}

        <div className="section">
          <div className="section-title">Novo cargo</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="field-label">Nome</label>
              <input className="field" value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && criar()} />
            </div>
            <div style={{ flex: 2, minWidth: 220 }}>
              <label className="field-label">Descrição</label>
              <input className="field" value={descricao} onChange={e => setDescricao(e.target.value)} onKeyDown={e => e.key === 'Enter' && criar()} />
            </div>
            <button type="button" className="btn btn-primary" onClick={criar}>Adicionar</button>
          </div>
        </div>

        <div className="section" style={{ padding: 0 }}>
          {cargos.length === 0 ? <EmptyState icone="◌" texto="Nenhum cargo cadastrado." /> : (
            <table className="tbl">
              <thead><tr><th>Nome</th><th>Descrição</th><th>Situação</th><th /></tr></thead>
              <tbody>
                {cargos.map(c => (
                  <tr key={c.id} style={{ opacity: c.ativo ? 1 : 0.55 }}>
                    <td><input className="field" defaultValue={c.nome} onBlur={e => e.target.value.trim() && e.target.value.trim() !== c.nome && salvar(c, { nome: e.target.value.trim() })} /></td>
                    <td><input className="field" defaultValue={c.descricao || ''} onBlur={e => e.target.value !== (c.descricao || '') && salvar(c, { descricao: e.target.value })} /></td>
                    <td><button type="button" className="btn btn-sm" onClick={() => salvar(c, { ativo: !c.ativo })}>{c.ativo ? 'Ativo' : 'Inativo'}</button></td>
                    <td className="num"><button type="button" className="btn btn-danger btn-sm" onClick={() => excluir(c)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageBody>
    </div>
  )
}
