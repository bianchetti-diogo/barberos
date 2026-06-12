import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rotas públicas — não precisa de login
  const publicRoutes = ['/auth/login', '/auth/cadastro']
  if (publicRoutes.includes(path)) {
    return supabaseResponse
  }

  // Sem sessão → vai para login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Busca o perfil para saber o role
  const { data: perfil } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!perfil) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redireciona para o ambiente correto se estiver na raiz
  if (path === '/') {
    if (perfil.role === 'gestao') return NextResponse.redirect(new URL('/gestao', request.url))
    if (perfil.role === 'barbeiro') return NextResponse.redirect(new URL('/barbeiro', request.url))
    if (perfil.role === 'cliente') return NextResponse.redirect(new URL('/cliente', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}