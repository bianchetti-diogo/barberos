'use client'

import { Component, Suspense, lazy, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { buscarModulo } from '@/modules/registry'
import type { Papel } from '@/modules/types'
import { BarberOSProvider, useBarberOS } from '@/lib/modulos/contexto'
import ModuloExterno from './ModuloExterno'

/** Se um módulo quebrar, só ele cai: o resto do sistema continua funcionando. */
class LimiteDeErro extends Component<{ nome: string; children: ReactNode }, { erro: Error | null }> {
  state: { erro: Error | null } = { erro: null }

  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="empty-state" style={{ margin: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>O módulo “{this.props.nome}” encontrou um problema.</p>
          <p style={{ fontSize: 12 }}>O restante do sistema segue normal. Detalhe: {this.state.erro.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

function Carregando() {
  return <div style={{ textAlign: 'center', padding: '80px 0' }}><span className="spin" /></div>
}

function Aviso({ icone, titulo, texto, voltar }: { icone: string; titulo: string; texto: string; voltar: string }) {
  return (
    <div className="empty-state" style={{ margin: 24 }}>
      <div style={{ fontSize: 30, marginBottom: 8, color: 'var(--border-strong)' }}>{icone}</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>{titulo}</p>
      <p style={{ fontSize: 12, marginBottom: 16 }}>{texto}</p>
      <Link href={voltar} className="btn">← Voltar</Link>
    </div>
  )
}

function Conteudo({ papel }: { papel: Papel }) {
  const params = useParams<{ modulo: string; caminho?: string[] }>()
  const { usuario, carregando } = useBarberOS()
  const modulo = buscarModulo(params.modulo)
  const caminho = params.caminho ?? []
  const inicio = papel === 'gestao' ? '/gestao' : '/barbeiro'

  // O componente do módulo só é carregado quando a página dele é aberta
  const Pagina = useMemo(
    () => (modulo && modulo.tipo === 'interno' ? lazy(modulo.carregar) : null),
    [modulo]
  )

  if (carregando) return <Carregando />

  if (!modulo) {
    return <Aviso icone="◌" titulo="Módulo não encontrado." texto="Esse módulo não está instalado neste sistema." voltar={inicio} />
  }

  const permitido =
    modulo.papeis.includes(papel) && !!usuario && (usuario.role === papel || usuario.role === 'gestao')
  if (!permitido) {
    return <Aviso icone="⛔" titulo="Sem acesso a este módulo." texto="Seu perfil não tem permissão para abri-lo." voltar={inicio} />
  }

  if (modulo.status === 'em_breve') {
    return <Aviso icone={modulo.icone} titulo={`${modulo.nome} — em breve`} texto={modulo.descricao} voltar={inicio} />
  }

  if (modulo.tipo === 'externo') {
    // Descontos: topo do painel do barbeiro (58px + respiro) ou área inteira da gestão
    const altura = papel === 'gestao' ? '100dvh' : 'calc(100dvh - 58px)'
    return <ModuloExterno modulo={modulo} altura={altura} />
  }

  return (
    <LimiteDeErro nome={modulo.nome}>
      <Suspense fallback={<Carregando />}>{Pagina && <Pagina caminho={caminho} />}</Suspense>
    </LimiteDeErro>
  )
}

/** Página-hospedeira usada pelas rotas /gestao/m/<modulo> e /barbeiro/m/<modulo>. */
export default function ModuloHost({ papel }: { papel: Papel }) {
  return (
    <BarberOSProvider>
      <Conteudo papel={papel} />
    </BarberOSProvider>
  )
}
