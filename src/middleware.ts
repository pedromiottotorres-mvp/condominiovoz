import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Renova o token — DEVE ser chamado antes de qualquer lógica de rota
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas — nunca redirecionar
  const publicRoutes = ['/', '/login', '/aguardando-aprovacao']
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))

  // Usuário logado tentando acessar /login → redirecionar conforme status
  if (pathname === '/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'pendente') {
      return NextResponse.redirect(new URL('/aguardando-aprovacao', request.url))
    }
    if (profile?.status === 'rejeitado') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (profile?.role === 'sindico') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/demandas', request.url))
  }

  // Rotas internas — exigem autenticação
  if (!isPublic) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    // Usuário pendente → página de espera
    if (profile?.status === 'pendente') {
      if (pathname !== '/aguardando-aprovacao') {
        return NextResponse.redirect(new URL('/aguardando-aprovacao', request.url))
      }
      return supabaseResponse
    }

    // Usuário rejeitado → logout e login
    if (profile?.status === 'rejeitado') {
      await supabase.auth.signOut()
      const url = new URL('/login', request.url)
      url.searchParams.set('erro', 'acesso-negado')
      return NextResponse.redirect(url)
    }

    // Morador tentando acessar /dashboard → redirecionar para /demandas
    if (pathname.startsWith('/dashboard') && profile?.role !== 'sindico') {
      return NextResponse.redirect(new URL('/demandas', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
