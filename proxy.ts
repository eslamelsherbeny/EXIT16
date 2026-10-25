import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isWellFormedSessionToken(rawCookie: string | undefined): boolean {
  if (!rawCookie || rawCookie.includes('[object')) return false
  const parts = rawCookie.trim().split('.')
  if (parts.length !== 3) return false
  const [userId, pwdFp, sig] = parts
  return Boolean(
    userId &&
      userId.length >= 8 &&
      pwdFp &&
      pwdFp.length === 12 &&
      sig &&
      sig.length === 24
  )
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const sessionCookie = request.cookies.get('user_session')?.value
  const hasValidFormat = isWellFormedSessionToken(sessionCookie)

  // إذا تم تحويل المستخدم إلى /login بسبب انتهاء الجلسة أو فساد الكوكي، نمسح الكوكي التالفة فوراً
  if (pathname === '/login' && sessionCookie && !hasValidFormat) {
    const res = NextResponse.next()
    res.cookies.delete('user_session')
    res.cookies.delete('session_hint')
    return res
  }

  if (pathname === '/login' && searchParams.get('expired') === '1') {
    const res = NextResponse.next()
    res.cookies.delete('user_session')
    res.cookies.delete('session_hint')
    return res
  }

  // 1. حماية مسارات لوحة الإدارة (/admin)
  if (pathname.startsWith('/admin')) {
    if (!hasValidFormat) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete('user_session')
      res.cookies.delete('session_hint')
      return res
    }
  }

  // 2. حماية مسارات صفحة الحساب (/account)
  if (pathname.startsWith('/account')) {
    if (!hasValidFormat) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete('user_session')
      res.cookies.delete('session_hint')
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/login'],
}