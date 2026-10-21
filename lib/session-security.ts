import { createHash, createHmac } from 'node:crypto'

function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.EMAIL_PASS ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'darak-enterprise-secret-key-2026'
  )
}

export function getPasswordFingerprint(passwordHash: string | null | undefined) {
  return createHash('sha256')
    .update(String(passwordHash || 'no-pass'))
    .digest('hex')
    .slice(0, 12)
}

export function createSignedSessionToken(
  userId: string,
  passwordHash: string | null | undefined
): string {
  const pwdFp = getPasswordFingerprint(passwordHash)
  const payload = `${userId}.${pwdFp}`
  const sig = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 24)
  return `${payload}.${sig}`
}

// دالة تستخرج الـ ID الصافي للمستخدم سواء كانت الكوكي قديمة أو مشفرة جديدة
export function extractUserIdFromCookie(rawCookie: string | undefined | null): string | null {
  if (!rawCookie) return null
  const clean = rawCookie.trim()
  if (!clean || clean.includes('[object')) return null
  return clean.split('.')[0] || null
}

export function parseAndVerifySessionCookie(
  rawCookie: string | undefined,
  currentDbPasswordHash: string | null | undefined
): { valid: boolean; userId: string | null } {
  if (!rawCookie || rawCookie.includes('[object')) {
    return { valid: false, userId: null }
  }

  const parts = rawCookie.split('.')
  if (parts.length === 3) {
    const [userId, cookiePwdFp, sig] = parts
    const expectedSig = createHmac('sha256', getSessionSecret())
      .update(`${userId}.${cookiePwdFp}`)
      .digest('hex')
      .slice(0, 24)

    if (sig !== expectedSig) {
      return { valid: false, userId: null }
    }

    const dbPwdFp = getPasswordFingerprint(currentDbPasswordHash)
    if (cookiePwdFp !== dbPwdFp) {
      return { valid: false, userId: null }
    }

    return { valid: true, userId }
  }

  return { valid: true, userId: rawCookie }
}
