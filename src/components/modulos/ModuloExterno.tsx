'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useBarberOS } from '@/lib/modulos/contexto'
import type { ModuloExterno as ModuloExternoTipo } from '@/modules/types'

/**
 * Abre um app independente dentro do BarberOS (iframe) e entrega a ele o contexto
 * de quem está logado por postMessage, sempre endereçado SÓ à origem do módulo.
 *
 * Protocolo para o app externo:
 *   - ao carregar, ele envia  window.parent.postMessage({ tipo: 'barberos:pronto' }, '*')
 *   - o BarberOS responde     { tipo: 'barberos:contexto', usuario, barbearia, barbeiroId, accessToken }
 *   - o accessToken é o JWT do Supabase: com ele o app consulta o mesmo banco respeitando as regras (RLS).
 */
export default function ModuloExterno({ modulo, altura }: { modulo: ModuloExternoTipo; altura: string }) {
  const { supabase, usuario, barbearia, barbeiroId } = useBarberOS()
  const ref = useRef<HTMLIFrameElement>(null)

  let origem = ''
  try { origem = new URL(modulo.url).origin } catch { origem = '' }

  const enviarContexto = useCallback(async () => {
    if (!origem || !ref.current?.contentWindow) return
    const { data: { session } } = await supabase.auth.getSession()
    ref.current.contentWindow.postMessage(
      {
        tipo: 'barberos:contexto',
        usuario,
        barbearia,
        barbeiroId,
        accessToken: session?.access_token ?? null,
      },
      origem
    )
  }, [origem, supabase, usuario, barbearia, barbeiroId])

  useEffect(() => {
    function aoReceber(e: MessageEvent) {
      if (e.origin !== origem) return
      if (e.data?.tipo === 'barberos:pronto') enviarContexto()
    }
    window.addEventListener('message', aoReceber)
    return () => window.removeEventListener('message', aoReceber)
  }, [origem, enviarContexto])

  if (!origem) {
    return (
      <div className="empty-state" style={{ margin: 24 }}>
        <p style={{ fontSize: 13 }}>O endereço configurado para este módulo é inválido.</p>
      </div>
    )
  }

  return (
    <iframe
      ref={ref}
      src={modulo.url}
      title={modulo.nome}
      onLoad={enviarContexto}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      style={{ width: '100%', height: altura, border: 'none', display: 'block', background: 'var(--surface)' }}
    />
  )
}
