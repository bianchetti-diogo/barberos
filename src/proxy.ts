import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que não exigem login
const ROTAS_PUBLICAS = ['/auth/login', '/auth/cadastro', '/api/auth/cadastro']

// Página inicial de cada perfil
const HOME: Record<string, string> = {
  gestao: '/gestao',
  barbeiro: '/barbeiro',
  cliente: '/cliente',
}

function dentro(path: string, base: string) {
  return path === base || path.startsWith(base + '/')
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Redireciona preservando os cookies de sessão renovados
  function redirecionar(destino: string) {
    const resposta = NextResponse.redirect(new URL(destino, request.url))
    supabaseResponse.cookies.getAll().forEach(c => resposta.cookies.set(c))
    return resposta
  }

  function negar(status: 401 | 403, mensagem: string) {
    const resposta = NextResponse.json({ error: mensagem }, { status })
    supabaseResponse.cookies.getAll().forEach(c => resposta.cookies.set(c))
    return resposta
  }

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const ehApi = path.startsWith('/api/')

  // ── Rotas públicas ──────────────────────────────────────────
  if (ROTAS_PUBLICAS.includes(path)) {
    // Quem já está logado não precisa ver login/cadastro
    if (user && path.startsWith('/auth/')) {
      const { data: perfil } = await supabase
        .from('perfis')
        .select('role, ativo')
        .eq('id', user.id)
        .single()
      if (perfil?.ativo !== false && perfil?.role && HOME[perfil.role]) {
        return redirecionar(HOME[perfil.role])
      }
    }
    return supabaseResponse
  }

  // ── Sem sessão ──────────────────────────────────────────────
  if (!user) {
    return ehApi ? negar(401, 'Não autenticado.') : redirecionar('/auth/login')
  }

  // ── Perfil e papel (role) ───────────────────────────────────
  const { data: perfil } = await supabase
    .from('perfis')
    .select('role, ativo')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.ativo === false) {
    return ehApi ? negar(403, 'Perfil inexistente ou inativo.') : redirecionar('/auth/login')
  }

  const role: string = perfil.role
  const home = HOME[role] ?? '/auth/login'

  // Raiz: manda para o ambiente do perfil
  if (path === '/') return redirecionar(home)

  // ── Proteção das áreas por papel ────────────────────────────
  if (dentro(path, '/gestao') && role !== 'gestao') return redirecionar(home)
  if (dentro(path, '/barbeiro') && role !== 'barbeiro' && role !== 'gestao') return redirecionar(home)
  if (dentro(path, '/cliente') && role !== 'cliente' && role !== 'gestao') return redirecionar(home)

  // ── Proteção das rotas de API por papel ─────────────────────
  if (
    (dentro(path, '/api/barbeiros') || dentro(path, '/api/clientes') || dentro(path, '/api/produtos')) &&
    role !== 'gestao'
  ) {
    return negar(403, 'Acesso restrito à gestão.')
  }
  // Rotas de API dos módulos (src/app/api/m/<modulo>/...): equipe interna apenas
  if (dentro(path, '/api/m') && role !== 'gestao' && role !== 'barbeiro') {
    return negar(403, 'Acesso restrito à equipe.')
  }
  if (dentro(path, '/api/cliente') && role !== 'cliente') {
    return negar(403, 'Acesso restrito a clientes.')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
