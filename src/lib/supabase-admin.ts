import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null

/**
 * Cliente com a service role, só para uso em rotas de API (servidor).
 * É criado sob demanda para o build não quebrar quando as variáveis
 * de ambiente ainda não existem na fase de coleta de páginas.
 */
export function getAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Variáveis do Supabase (URL e SERVICE_ROLE_KEY) não configuradas no servidor.')
    }
    admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return admin
}
