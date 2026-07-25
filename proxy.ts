import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login", "/signup"] as const

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number])
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/")
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options)
  })
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 未ログイン: 公開ページと API 以外は /login へ
  if (!user && !isPublicRoute(pathname) && !isApiRoute(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    const redirectResponse = NextResponse.redirect(loginUrl)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  // ログイン済み: /login, /signup からは / へ
  if (user && isPublicRoute(pathname)) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/"
    const redirectResponse = NextResponse.redirect(homeUrl)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 静的ファイル以外のリクエストで middleware を実行
     * _next/static, 画像, favicon などは除外
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
