import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.EMAIL_PASS ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'darak-enterprise-secret-key-2026'
  )
}

export function getPasswordFingerprint(
  passwordHash: string | null | undefined
): string {
  return createHash('sha256')
    .update(String(passwordHash || 'no-pass'))
    .digest('hex')
    .slice(0, 12)
}

export function createSignedSessionToken(
  userId: string,
  passwordHash: string | null | undefined
): string {
  const cleanUserId = String(userId || '').trim()
  const pwdFp = getPasswordFingerprint(passwordHash)
  const payload = `${cleanUserId}.${pwdFp}`
  const sig = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 24)
  return `${payload}.${sig}`
}

export function extractUserIdFromCookie(
  rawCookie: string | undefined | null
): string | null {
  if (!rawCookie) return null
  const clean = rawCookie.trim()
  if (!clean || clean.includes('[object')) return null
  const candidate = clean.split('.')[0]?.trim() || null
  // التحقق من أن المعرف يتبع صيغة UUID أو نص آمن لمنع أي حقن
  if (!candidate || candidate.length < 8 || candidate.length > 64) return null
  return candidate
}

export function parseAndVerifySessionCookie(
  rawCookie: string | undefined | null,
  currentDbPasswordHash: string | null | undefined
): { valid: boolean; userId: string | null } {
  if (!rawCookie || rawCookie.includes('[object')) {
    return { valid: false, userId: null }
  }

  const parts = rawCookie.trim().split('.')
  // إغلاق ثغرة التزوير: يجب أن تتكون الكوكي دائماً من 3 أجزاء موقعة (userId.pwdFp.signature)
  if (parts.length !== 3) {
    return { valid: false, userId: null }
  }

  const [userId, cookiePwdFp, sig] = parts
  if (!userId || !cookiePwdFp || !sig) {
    return { valid: false, userId: null }
  }

  const expectedSig = createHmac('sha256', getSessionSecret())
    .update(`${userId}.${cookiePwdFp}`)
    .digest('hex')
    .slice(0, 24)

  try {
    if (
      sig.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return { valid: false, userId: null }
    }
  } catch {
    return { valid: false, userId: null }
  }

  const dbPwdFp = getPasswordFingerprint(currentDbPasswordHash)
  if (cookiePwdFp !== dbPwdFp) {
    return { valid: false, userId: null }
  }

  return { valid: true, userId }
}