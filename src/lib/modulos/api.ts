import { NextResponse } from 'next/server'
import { getUsuarioAtual, type UsuarioAtual } from '@/lib/supabase-server'

/**
 * Atalho para rotas de API de módulos (src/app/api/m/<modulo>/...).
 * Uso:
 *   const auth = await exigirUsuario(['gestao'])
 *   if (auth.erro) return auth.erro
 *   const { usuario } = auth   // usuario.barbearia_id, usuario.role...
 */
export async function exigirUsuario(
  papeis: string[] = ['gestao', 'barbeiro']
): Promise<{ erro: NextResponse; usuario?: undefined } | { erro?: undefined; usuario: UsuarioAtual }> {
  const usuario = await getUsuarioAtual()
  if (!usuario) return { erro: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  if (!papeis.includes(usuario.role)) {
    return { erro: NextResponse.json({ error: 'Sem permissão.' }, { status: 403 }) }
  }
  return { usuario }
}
