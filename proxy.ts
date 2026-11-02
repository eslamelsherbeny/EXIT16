import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isWellFormedSessionToken(rawCookie: string | undefined): boolean {
  if (!rawCookie) return false
  try {
    const clean = decodeURIComponent(rawCookie.trim())
    if (!clean || clean.includes('[object')) return false
    const parts = clean.split('.')

    // الصيغة القياسية الثلاثية فقط: userId.pwdFp.sig
    if (parts.length === 3) {
      const [userId, pwdFp, sig] = parts
      return Boolean(
        userId &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            userId
          ) &&
          pwdFp &&
          pwdFp.length === 12 &&
          sig &&
          sig.length === 24
      )
    }

    return false
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const sessionCookie = request.cookies.get('user_session')?.value
  const hasValidFormat = isWellFormedSessionToken(sessionCookie)

  // إذا تم تحويل المستخدم إلى /login بسبب انتهاء الجلسة أو تلف الكوكي، نمسح الكوكي التالفة فوراً
  if (
    pathname === '/login' &&
    ((sessionCookie && !hasValidFormat) ||
      searchParams.get('expired') === '1')
  ) {
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

export default proxy

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/login'],
}