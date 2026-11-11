'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { modulosDoPapel, rotaDoModulo } from '@/modules/registry'
import LogoBarberOS from '@/components/brand/LogoBarberOS'
import Icon from '@/components/ui/Icon'
import BotaoTema from '@/components/ui/BotaoTema'
import { usePermissoes } from '@/lib/permissoes'

// `perm`: ação do catálogo que libera o item. `soSuper`: só o super admin vê.
interface ItemMenu { id: string; label: string; icon: string; rota: string; ativo: boolean; perm?: string; soSuper?: boolean }
interface GrupoMenu { label: string; itens: ItemMenu[] }

const GRUPOS: GrupoMenu[] = [
  {
    label: 'Cadastros',
    itens: [
      { id: 'dashboard',     label: 'Dashboard',     icon: 'painel',        rota: '/gestao',               ativo: true, perm: 'dashboard.ver' },
      { id: 'barbeiros',     label: 'Barbeiros',     icon: 'barbeiros',     rota: '/gestao/barbeiros',     ativo: true, perm: 'barbeiros.ver' },
      { id: 'servicos',      label: 'Serviços',      icon: 'servicos',      rota: '/gestao/servicos',      ativo: true, perm: 'servicos.ver' },
      { id: 'produtos',      label: 'Produtos',      icon: 'produtos',      rota: '/gestao/produtos',      ativo: true, perm: 'produtos.ver' },
      { id: 'clientes',      label: 'Clientes',      icon: 'clientes',      rota: '/gestao/clientes',      ativo: true, perm: 'clientes.ver' },
      { id: 'configuracoes', label: 'Configurações', icon: 'configuracoes', rota: '/gestao/configuracoes', ativo: true, perm: 'configuracoes.ver' },
    ],
  },
  {
    label: 'Operação',
    itens: [
      { id: 'agenda', label: 'Agenda', icon: 'agenda', rota: '/gestao/agenda', ativo: true, perm: 'agenda.ver' },
    ],
  },
  {
    label: 'Financeiro',
    itens: [
      { id: 'financeiro', label: 'Faturamento', icon: 'financeiro', rota: '/gestao/financeiro', ativo: true, perm: 'financeiro.ver' },
      { id: 'relatorios', label: 'Relatórios',  icon: 'relatorios', rota: '/gestao/relatorios', ativo: false, perm: 'financeiro.ver' },
    ],
  },
  {
    label: 'Administração',
    itens: [
      { id: 'adm-usuarios',   label: 'Usuários',              icon: 'usuarios',   rota: '/gestao/administracao/usuarios',   ativo: true, perm: 'admin.usuarios' },
      { id: 'adm-grupos',     label: 'Grupos e permissões',   icon: 'seguranca',  rota: '/gestao/administracao/grupos',     ativo: true, perm: 'admin.grupos' },
      { id: 'adm-cargos',     label: 'Cargos',                icon: 'cargos',     rota: '/gestao/administracao/cargos',     ativo: true, perm: 'admin.cargos' },
      { id: 'adm-auditoria',  label: 'Histórico',             icon: 'historico',  rota: '/gestao/administracao/auditoria',  ativo: true, perm: 'admin.auditoria' },
      { id: 'adm-barbearias', label: 'Barbearias',            icon: 'barbearias', rota: '/gestao/administracao/barbearias', ativo: true, soSuper: true },
    ],
  },
]

const CHAVE_MENU = 'barberos_menu_recolhido'

export default function Sidebar() {
  const [recolhida, setRecolhida] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [nome, setNome] = useState('Barbearia')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { pode, superAdmin, carregando, barbeariaId } = usePermissoes()

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE_MENU) === '1') setRecolhida(true)
      const logoSalva = localStorage.getItem('barberos_logo')
      if (logoSalva) setLogo(logoSalva)
    } catch { /* sem armazenamento */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // O nome é o da barbearia ativa (para o super admin, a que ele escolheu)
  useEffect(() => {
    if (!barbeariaId) return
    supabase.from('barbearias').select('nome').eq('id', barbeariaId).maybeSingle().then(({ data }) => {
      if (data?.nome) setNome(String(data.nome))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeariaId])

  function alternarRecolhida() {
    const novo = !recolhida
    setRecolhida(novo)
    try { localStorage.setItem(CHAVE_MENU, novo ? '1' : '0') } catch { /* ignora */ }
  }

  // Provisório: o logo da barbearia vai para o Storage nas Configurações (roadmap F2-11)
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setLogo(url)
      try { localStorage.setItem('barberos_logo', url) } catch { /* ignora */ }
    }
    reader.readAsDataURL(file)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Módulos instalados (src/modules/registry.ts) entram no menu sozinhos, em grupos próprios
  const gruposModulos: GrupoMenu[] = []
  modulosDoPapel('gestao').forEach(m => {
    const nomeGrupo = m.grupo || 'Módulos'
    let grupo = gruposModulos.find(g => g.label === nomeGrupo)
    if (!grupo) {
      grupo = { label: nomeGrupo, itens: [] }
      gruposModulos.push(grupo)
    }
    grupo.itens.push({
      id: `modulo-${m.id}`,
      label: m.nome,
      icon: m.icone,
      rota: rotaDoModulo('gestao', m.id),
      ativo: m.status !== 'em_breve',
    })
  })
  // Cada pessoa vê só o que o grupo dela permite (o banco barra o resto de verdade)
  const visivel = (item: ItemMenu) => {
    if (item.soSuper) return superAdmin
    if (!item.perm) return true
    return !carregando && pode(item.perm)
  }
  const todosGrupos = [...GRUPOS, ...gruposModulos]
    .map(g => ({ ...g, itens: g.itens.filter(visivel) }))
    .filter(g => g.itens.length > 0)

  return (
    <aside className={`sidebar${recolhida ? ' recolhida' : ''}`}>
      <div className="sidebar-topo">
        <LogoBarberOS tamanho={34} />
        {!recolhida && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>BarberOS</div>
            <div style={{ fontSize: 11, color: 'var(--faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</div>
          </div>
        )}
        {!recolhida && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              data-tip="Logo da barbearia (clique para trocar)"
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', cursor: 'pointer', overflow: 'hidden', padding: 0, color: 'var(--faint)', fontSize: 11, flexShrink: 0 }}
            >
              {logo ? <img src={logo} alt="Logo da barbearia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '+'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {todosGrupos.map(grupo => (
          <div key={grupo.label}>
            <div className="sidebar-grupo">{grupo.label}</div>
            {grupo.itens.map(item => {
              const isAtivo = pathname === item.rota || (item.rota !== '/gestao' && pathname.startsWith(item.rota))
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item${isAtivo ? ' ativo' : ''}${item.ativo ? '' : ' desativado'}`}
                  onClick={() => item.ativo && router.push(item.rota)}
                  title={recolhida ? item.label : undefined}
                >
                  <span className="ic"><Icon nome={item.icon} /></span>
                  <span className="sidebar-texto">
                    {item.label}
                    {!item.ativo && <span style={{ fontSize: 9, color: 'var(--faint)', marginLeft: 6, letterSpacing: '0.08em' }}>EM BREVE</span>}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-rodape">
        <button type="button" className="sidebar-item sidebar-recolher" onClick={alternarRecolhida} title={recolhida ? 'Expandir menu' : 'Recolher menu'}>
          <span className="ic"><Icon nome="recolher" /></span>
          <span className="sidebar-texto">{recolhida ? 'Expandir' : 'Recolher'}</span>
        </button>
        <BotaoTema />
        <button type="button" className="sidebar-item" onClick={handleLogout} title="Sair">
          <span className="ic"><Icon nome="sair" /></span>
          <span className="sidebar-texto">Sair</span>
        </button>
      </div>
    </aside>
  )
}
