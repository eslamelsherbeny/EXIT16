import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getProxySessionSecret(): string {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (secret) return secret
  if (process.env.NODE_ENV === 'production') return ''
  return 'dualdealz-local-dev-only-secret-change-in-prod'
}

async function verifySessionCookieSignature(
  rawCookie: string | undefined
): Promise<boolean> {
  if (!rawCookie) return false
  try {
    const clean = decodeURIComponent(rawCookie.trim())
    if (!clean || clean.includes('[object')) return false
    const parts = clean.split('.')
    if (parts.length !== 3) return false

    const [userId, pwdFp, sig] = parts.map((p) => p.trim())
    if (
      !userId ||
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        userId
      ) ||
      pwdFp.length !== 12 ||
      sig.length !== 24
    ) {
      return false
    }

    const secret = getProxySessionSecret()
    if (!secret) return false

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuf = await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(`${userId}.${pwdFp}`)
    )

    const expectedHex = Array.from(new Uint8Array(signatureBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 24)

    if (sig.length !== expectedHex.length) return false

    // مقارنة زمنية ثابتة لمنع هجمات التوقيت
    let diff = 0
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedHex.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const sessionCookie = request.cookies.get('user_session')?.value
  const hasValidSession = await verifySessionCookieSignature(sessionCookie)

  if (
    pathname === '/login' &&
    ((sessionCookie && !hasValidSession) ||
      searchParams.get('expired') === '1')
  ) {
    const res = NextResponse.next()
    res.cookies.delete('user_session')
    res.cookies.delete('session_hint')
    return res
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/account')) {
    if (!hasValidSession) {
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