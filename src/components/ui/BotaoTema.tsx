'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

type Tema = 'dark' | 'light'
const CHAVE = 'barberos_tema'

/** Aplica o tema escolhido no <html>. O padrão (sem escolha) é o escuro. */
export function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute('data-theme', tema)
  try { localStorage.setItem(CHAVE, tema) } catch { /* sem armazenamento: só vale nesta aba */ }
}

/** Botão que alterna entre tom escuro e claro. Fica no rodapé do menu, perto do "Sair". */
export default function BotaoTema({ rotulo = true }: { rotulo?: boolean }) {
  const [tema, setTema] = useState<Tema>('dark')

  useEffect(() => {
    setTema(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  }, [])

  function alternar() {
    const novo: Tema = tema === 'dark' ? 'light' : 'dark'
    setTema(novo)
    aplicarTema(novo)
  }

  const paraClaro = tema === 'dark'
  return (
    <button type="button" className="sidebar-item" onClick={alternar} title={paraClaro ? 'Mudar para tom claro' : 'Mudar para tom escuro'}>
      <span className="ic"><Icon nome={paraClaro ? 'sol' : 'lua'} /></span>
      {rotulo && <span className="sidebar-texto">{paraClaro ? 'Tom claro' : 'Tom escuro'}</span>}
    </button>
  )
}
