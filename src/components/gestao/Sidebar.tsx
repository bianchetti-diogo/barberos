'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { modulosDoPapel, rotaDoModulo } from '@/modules/registry'
import LogoBarberOS from '@/components/brand/LogoBarberOS'
import Icon from '@/components/ui/Icon'
import BotaoTema from '@/components/ui/BotaoTema'

interface ItemMenu { id: string; label: string; icon: string; rota: string; ativo: boolean }
interface GrupoMenu { label: string; itens: ItemMenu[] }

const GRUPOS: GrupoMenu[] = [
  {
    label: 'Administração',
    itens: [
      { id: 'dashboard',     label: 'Dashboard',     icon: 'painel',        rota: '/gestao',               ativo: true },
      { id: 'barbeiros',     label: 'Barbeiros',     icon: 'barbeiros',     rota: '/gestao/barbeiros',     ativo: true },
      { id: 'servicos',      label: 'Serviços',      icon: 'servicos',      rota: '/gestao/servicos',      ativo: true },
      { id: 'produtos',      label: 'Produtos',      icon: 'produtos',      rota: '/gestao/produtos',      ativo: true },
      { id: 'clientes',      label: 'Clientes',      icon: 'clientes',      rota: '/gestao/clientes',      ativo: true },
      { id: 'configuracoes', label: 'Configurações', icon: 'configuracoes', rota: '/gestao/configuracoes', ativo: true },
    ],
  },
  {
    label: 'Operação',
    itens: [
      { id: 'agenda', label: 'Agenda', icon: 'agenda', rota: '/gestao/agenda', ativo: true },
    ],
  },
  {
    label: 'Financeiro',
    itens: [
      { id: 'financeiro', label: 'Faturamento', icon: 'financeiro', rota: '/gestao/financeiro', ativo: true },
      { id: 'relatorios', label: 'Relatórios',  icon: 'relatorios', rota: '/gestao/relatorios', ativo: false },
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

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE_MENU) === '1') setRecolhida(true)
      const logoSalva = localStorage.getItem('barberos_logo')
      if (logoSalva) setLogo(logoSalva)
    } catch { /* sem armazenamento */ }
    // O nome da barbearia vem do banco, assim todos os usuários veem o mesmo
    supabase.from('barbearias').select('nome').limit(1).maybeSingle().then(({ data }) => {
      if (data?.nome) setNome(String(data.nome))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const todosGrupos = [...GRUPOS, ...gruposModulos]

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
