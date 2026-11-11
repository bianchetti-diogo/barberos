'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePermissoes } from '@/lib/permissoes'
import { PageHeader, PageBody, EmptyState, Carregando } from '@/components/ui'

interface Grupo { id: string; nome: string; descricao: string | null; administrador: boolean; sistema: boolean; ativo: boolean }
interface Acao { acao: string; modulo: string; rotulo: string; descricao: string | null; ordem: number }

export default function GruposPage() {
  const supabase = useMemo(() => createClient(), [])
  const { pode, carregando: carregandoPerm } = usePermissoes()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [catalogo, setCatalogo] = useState<Acao[]>([])
  const [marcadas, setMarcadas] = useState<Record<string, Set<string>>>({})
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async () => {
    const [g, c, gp] = await Promise.all([
      supabase.from('grupos').select('*').order('administrador', { ascending: false }).order('nome'),
      supabase.from('permissoes_catalogo').select('*').order('ordem'),
      supabase.from('grupo_permissoes').select('grupo_id, acao'),
    ])
    const mapa: Record<string, Set<string>> = {}
    ;(gp.data || []).forEach((r: { grupo_id: string; acao: string }) => {
      if (!mapa[r.grupo_id]) mapa[r.grupo_id] = new Set()
      mapa[r.grupo_id].add(r.acao)
    })
    setGrupos((g.data || []) as Grupo[])
    setCatalogo((c.data || []) as Acao[])
    setMarcadas(mapa)
    setSelecionado(atual => atual ?? (g.data && g.data[0] ? g.data[0].id : null))
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  function mostrarAviso(texto: string) {
    setAviso(texto)
    setTimeout(() => setAviso(''), 2500)
  }

  const grupo = grupos.find(g => g.id === selecionado) || null
  const podeEditar = pode('admin.grupos')

  async function alternar(acao: string) {
    if (!grupo || !podeEditar || grupo.administrador) return
    setErro('')
    const tem = marcadas[grupo.id]?.has(acao)
    // atualiza na tela primeiro; se o banco recusar, desfaz
    setMarcadas(m => {
      const novo = new Set(m[grupo.id] || [])
      if (tem) novo.delete(acao); else novo.add(acao)
      return { ...m, [grupo.id]: novo }
    })
    const { error } = tem
      ? await supabase.from('grupo_permissoes').delete().eq('grupo_id', grupo.id).eq('acao', acao)
      : await supabase.from('grupo_permissoes').insert({ grupo_id: grupo.id, acao })
    if (error) {
      setErro(error.message)
      carregar()
      return
    }
    await supabase.rpc('registrar_auditoria', { p_acao: tem ? 'permissao.remover' : 'permissao.adicionar', p_entidade: 'grupos', p_detalhe: { grupo: grupo.nome, acao } })
  }

  async function alternarModulo(modulo: string) {
    if (!grupo || !podeEditar || grupo.administrador) return
    const acoes = catalogo.filter(a => a.modulo === modulo).map(a => a.acao)
    const todas = acoes.every(a => marcadas[grupo.id]?.has(a))
    setErro('')
    if (todas) {
      const { error } = await supabase.from('grupo_permissoes').delete().eq('grupo_id', grupo.id).in('acao', acoes)
      if (error) setErro(error.message)
    } else {
      const { error } = await supabase.from('grupo_permissoes').upsert(acoes.map(a => ({ grupo_id: grupo.id, acao: a })), { onConflict: 'grupo_id,acao' })
      if (error) setErro(error.message)
    }
    await supabase.rpc('registrar_auditoria', { p_acao: todas ? 'permissao.remover_modulo' : 'permissao.adicionar_modulo', p_entidade: 'grupos', p_detalhe: { grupo: grupo.nome, modulo } })
    carregar()
  }

  async function criarGrupo() {
    const nome = novoNome.trim()
    if (!nome) return
    setErro('')
    const { data: bid } = await supabase.rpc('minha_barbearia')
    const { data, error } = await supabase.from('grupos').insert({ barbearia_id: bid, nome }).select('id').single()
    if (error) { setErro(error.code === '23505' ? 'Já existe um grupo com esse nome.' : error.message); return }
    await supabase.rpc('registrar_auditoria', { p_acao: 'grupo.criar', p_entidade: 'grupos', p_detalhe: { nome } })
    setNovoNome('')
    setSelecionado(data.id)
    mostrarAviso('Grupo criado.')
    carregar()
  }

  async function salvarDados(campos: Partial<Grupo>) {
    if (!grupo) return
    const { error } = await supabase.from('grupos').update(campos).eq('id', grupo.id)
    if (error) { setErro(error.code === '23505' ? 'Já existe um grupo com esse nome.' : error.message); return }
    await supabase.rpc('registrar_auditoria', { p_acao: 'grupo.alterar', p_entidade: 'grupos', p_detalhe: { grupo: grupo.nome, ...campos } })
    mostrarAviso('Salvo.')
    carregar()
  }

  async function excluirGrupo() {
    if (!grupo || grupo.sistema) return
    if (!confirm(`Excluir o grupo "${grupo.nome}"? Quem está nele ficará sem grupo.`)) return
    const { error } = await supabase.from('grupos').delete().eq('id', grupo.id)
    if (error) { setErro(error.message); return }
    await supabase.rpc('registrar_auditoria', { p_acao: 'grupo.excluir', p_entidade: 'grupos', p_detalhe: { nome: grupo.nome } })
    setSelecionado(null)
    mostrarAviso('Grupo excluído.')
    carregar()
  }

  const modulos = useMemo(() => {
    const ordem: string[] = []
    catalogo.forEach(a => { if (!ordem.includes(a.modulo)) ordem.push(a.modulo) })
    return ordem
  }, [catalogo])

  if (carregando || carregandoPerm) return <><PageHeader eyebrow="Administração" titulo="Grupos e permissões" /><PageBody><Carregando /></PageBody></>

  if (!pode('admin.grupos')) {
    return <><PageHeader eyebrow="Administração" titulo="Grupos e permissões" /><PageBody><EmptyState icone="◌" texto="Você não tem permissão para gerenciar grupos." /></PageBody></>
  }

  return (
    <div>
      <PageHeader eyebrow="Administração" titulo="Grupos e permissões" />
      <PageBody>
        <p className="section-desc" style={{ marginBottom: 16 }}>
          Cada grupo define o que as pessoas veem e fazem. Marque as caixinhas e a mudança vale na hora. O grupo Administrador sempre tem acesso total.
        </p>
        {erro && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{erro}</div>}
        {aviso && <div className="toast">{aviso}</div>}

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <div className="section" style={{ padding: 14, marginBottom: 0 }}>
            <div className="field-label">Grupos</div>
            {grupos.map(g => (
              <button key={g.id} type="button" onClick={() => setSelecionado(g.id)}
                className={`sidebar-item${g.id === selecionado ? ' ativo' : ''}`} style={{ justifyContent: 'space-between' }}>
                <span>{g.nome}</span>
                {g.administrador && <span className="tag tag-ouro">total</span>}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <input className="field" placeholder="Novo grupo" value={novoNome} onChange={e => setNovoNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && criarGrupo()} />
              <button type="button" className="btn btn-primary btn-sm" onClick={criarGrupo}>Criar</button>
            </div>
          </div>

          {grupo ? (
            <div>
              <div className="section">
                <div className="section-head" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label className="field-label">Nome do grupo</label>
                    <input className="field" key={grupo.id + '-n'} defaultValue={grupo.nome} disabled={grupo.sistema}
                      onBlur={e => e.target.value.trim() && e.target.value.trim() !== grupo.nome && salvarDados({ nome: e.target.value.trim() })} />
                  </div>
                  <div style={{ flex: 2, minWidth: 220 }}>
                    <label className="field-label">Descrição</label>
                    <input className="field" key={grupo.id + '-d'} defaultValue={grupo.descricao || ''}
                      onBlur={e => e.target.value !== (grupo.descricao || '') && salvarDados({ descricao: e.target.value })} />
                  </div>
                  {!grupo.sistema && <button type="button" className="btn btn-danger btn-sm" onClick={excluirGrupo}>Excluir grupo</button>}
                </div>
                {grupo.administrador && <p className="section-desc">Este grupo tem acesso total e não pode ser limitado.</p>}
                {grupo.sistema && !grupo.administrador && <p className="section-desc">Grupo padrão do sistema: pode mudar as permissões, mas não pode ser excluído nem renomeado.</p>}
              </div>

              {modulos.map(modulo => {
                const acoes = catalogo.filter(a => a.modulo === modulo)
                const todas = acoes.every(a => grupo.administrador || marcadas[grupo.id]?.has(a.acao))
                return (
                  <div className="section" key={modulo} style={{ padding: '14px 20px' }}>
                    <div className="section-title" style={{ justifyContent: 'space-between' }}>
                      <span>{modulo}</span>
                      {!grupo.administrador && (
                        <button type="button" className="chip" onClick={() => alternarModulo(modulo)}>{todas ? 'Desmarcar tudo' : 'Marcar tudo'}</button>
                      )}
                    </div>
                    {acoes.map(a => {
                      const ligado = grupo.administrador || marcadas[grupo.id]?.has(a.acao)
                      return (
                        <label key={a.acao} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)', cursor: grupo.administrador ? 'default' : 'pointer' }}>
                          <input type="checkbox" checked={!!ligado} disabled={grupo.administrador} onChange={() => alternar(a.acao)}
                            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--gold)' }} />
                          <span>
                            <span style={{ fontSize: 13, color: 'var(--text)' }}>{a.rotulo}</span>
                            {a.descricao && <span style={{ display: 'block', fontSize: 12, color: 'var(--faint)' }}>{a.descricao}</span>}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ) : <EmptyState icone="◌" texto="Escolha um grupo ao lado." />}
        </div>
      </PageBody>
    </div>
  )
}
