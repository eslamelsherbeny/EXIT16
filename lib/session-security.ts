import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.EMAIL_PASS ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'darak-enterprise-secret-key-2026'
  )
}

function getPassFingerprint(passwordHash?: string | null): string {
  try {
    if (!passwordHash) return 'nohash'
    return createHmac('sha256', getSecret())
      .update(String(passwordHash).trim())
      .digest('hex')
      .slice(0, 16)
  } catch {
    return 'nohash'
  }
}

export function createSignedSessionToken(
  userId: string,
  passwordHash?: string | null
): string {
  try {
    const cleanId = String(userId || '').trim()
    const pwdFp = getPassFingerprint(passwordHash)
    const payload = `${cleanId}.${pwdFp}`
    const sig = createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex')
    return `${payload}.${sig}`
  } catch {
    return String(userId || '').trim()
  }
}

export function extractUserIdFromCookie(
  rawCookieValue?: string | null
): string | null {
  try {
    if (!rawCookieValue) return null
    const decoded = decodeURIComponent(String(rawCookieValue).trim())
    if (!decoded) return null
    const firstPart = decoded.split('.')[0]?.trim() || null
    if (!firstPart || firstPart.length < 10) return null
    return firstPart
  } catch {
    return null
  }
}

export function parseAndVerifySessionCookie(
  rawCookieValue: string | undefined | null,
  currentPasswordHash?: string | null
): { valid: boolean; userId: string | null } {
  try {
    if (!rawCookieValue) return { valid: false, userId: null }
    const clean = decodeURIComponent(String(rawCookieValue).trim())
    if (!clean) return { valid: false, userId: null }

    const parts = clean.split('.')

    // دعم انتقال الكوكيز القديمة (UUID فقط) بدون التسبب في Crash للسيرفر
    if (parts.length === 1) {
      const legacyId = parts[0].trim()
      const isUuidLike = /^[0-9a-fA-F-]{20,40}$/.test(legacyId)
      return isUuidLike
        ? { valid: true, userId: legacyId }
        : { valid: false, userId: null }
    }

    if (parts.length === 2) {
      const [userId, sig] = parts
      if (!userId || !sig) return { valid: false, userId: null }
      const expectedSig = createHmac('sha256', getSecret())
        .update(userId)
        .digest('hex')
      const bufA = Buffer.from(sig)
      const bufB = Buffer.from(expectedSig)
      if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
        return { valid: false, userId: null }
      }
      return { valid: true, userId }
    }

    if (parts.length === 3) {
      const [userId, cookiePwdFp, sig] = parts
      if (!userId || !cookiePwdFp || !sig) {
        return { valid: false, userId: null }
      }

      const payload = `${userId}.${cookiePwdFp}`
      const expectedSig = createHmac('sha256', getSecret())
        .update(payload)
        .digest('hex')

      const bufA = Buffer.from(sig)
      const bufB = Buffer.from(expectedSig)
      if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
        return { valid: false, userId: null }
      }

      if (currentPasswordHash !== undefined) {
        const expectedPwdFp = getPassFingerprint(currentPasswordHash)
        if (cookiePwdFp !== expectedPwdFp) {
          return { valid: false, userId: null }
        }
      }

      return { valid: true, userId }
    }

    return { valid: false, userId: null }
  } catch {
    return { valid: false, userId: null }
  }
}