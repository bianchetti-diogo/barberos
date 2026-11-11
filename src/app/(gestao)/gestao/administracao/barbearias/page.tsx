'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePermissoes } from '@/lib/permissoes'
import { PageHeader, PageBody, EmptyState, Carregando } from '@/components/ui'

interface Barbearia { id: string; nome: string; slug: string | null; ativo: boolean; plano: string | null; criado_em: string }

export default function BarbeariasPage() {
  const supabase = useMemo(() => createClient(), [])
  const { superAdmin, carregando: carregandoPerm, barbeariaId } = usePermissoes()
  const [lista, setLista] = useState<Barbearia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('barbearias').select('id, nome, slug, ativo, plano, criado_em').order('criado_em')
    setLista((data || []) as Barbearia[])
    setCarregando(false)
  }, [supabase])
  useEffect(() => { carregar() }, [carregar])

  async function entrar(id: string) {
    setOcupado(true); setErro('')
    const { error } = await supabase.rpc('definir_barbearia_ativa', { p_barbearia: id })
    if (error) { setErro(error.message); setOcupado(false); return }
    // recarrega tudo: menu, permissões e telas passam a mostrar a barbearia escolhida
    window.location.href = '/gestao'
  }

  async function criar() {
    if (!nome.trim() || !slug.trim()) return
    setOcupado(true); setErro('')
    const r = await fetch('/api/super/barbearias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, slug }) })
    const j = await r.json().catch(() => ({}))
    setOcupado(false)
    if (!r.ok) { setErro(j.error || 'Não foi possível criar.'); return }
    setNome(''); setSlug('')
    carregar()
  }

  if (carregando || carregandoPerm) return <><PageHeader eyebrow="Super admin" titulo="Barbearias" /><PageBody><Carregando /></PageBody></>
  if (!superAdmin) {
    return <><PageHeader eyebrow="Super admin" titulo="Barbearias" /><PageBody><EmptyState icone="◌" texto="Área exclusiva do super admin." /></PageBody></>
  }

  return (
    <div>
      <PageHeader eyebrow="Super admin" titulo="Barbearias" />
      <PageBody larguraMax={900}>
        <p className="section-desc" style={{ marginBottom: 16 }}>
          Você vê e administra todas as barbearias. Ao entrar em uma, o menu e as telas passam a mostrar os dados dela. Tudo o que você faz fica registrado no histórico.
        </p>
        {erro && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{erro}</div>}

        <div className="section" style={{ padding: 0 }}>
          <table className="tbl">
            <thead><tr><th>Barbearia</th><th>Endereço (slug)</th><th>Plano</th><th /></tr></thead>
            <tbody>
              {lista.map(b => (
                <tr key={b.id}>
                  <td>{b.nome} {b.id === barbeariaId && <span className="tag tag-ouro" style={{ marginLeft: 8 }}>em uso</span>}</td>
                  <td style={{ color: 'var(--muted)' }}>{b.slug || '—'}</td>
                  <td>{b.plano || '—'}</td>
                  <td className="num">
                    {b.id !== barbeariaId && <button type="button" className="btn btn-sm btn-primary" disabled={ocupado} onClick={() => entrar(b.id)}>Entrar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title">Nova barbearia</div>
          <p className="section-desc" style={{ marginBottom: 12 }}>Nasce com os grupos, permissões e cargos padrão. O endereço (slug) vira o subdomínio no futuro.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label className="field-label">Nome</label>
              <input className="field" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field-label">Endereço (slug)</label>
              <input className="field" placeholder="ex.: dompedro" value={slug} onChange={e => setSlug(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" disabled={ocupado} onClick={criar}>Criar barbearia</button>
          </div>
        </div>
      </PageBody>
    </div>
  )
}
