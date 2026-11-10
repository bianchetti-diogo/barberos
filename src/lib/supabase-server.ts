import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cliente Supabase do servidor, usando a sessão (cookies) de quem fez a requisição. */
export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Em Server Components não é possível gravar cookies; o proxy já renova a sessão.
          }
        },
      },
    }
  )
}

export interface UsuarioAtual {
  userId: string
  nome: string
  role: string
  barbearia_id: string | null
}

/** Retorna o usuário logado com o perfil, ou null se não houver sessão válida. */
export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, role, barbearia_id, ativo')
    .eq('id', user.id)
    .single()
  if (!perfil || perfil.ativo === false) return null
  return { userId: user.id, nome: perfil.nome, role: perfil.role, barbearia_id: perfil.barbearia_id }
}
