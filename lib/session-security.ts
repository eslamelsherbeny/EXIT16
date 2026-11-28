import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_MAX_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 يوماً كحد أقصى لصلاحية التوكن على السيرفر
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function getSessionSecret(): string {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: SESSION_SECRET is not configured in production')
  }
  return 'dualdealz-local-dev-only-secret-change-in-prod'
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function getPasswordFingerprint(
  passwordHash: string | null | undefined
): string {
  return createHash('sha256')
    .update(String(passwordHash || 'no-pass').trim())
    .digest('hex')
    .slice(0, 12)
}

export function createSignedSessionToken(
  userId: string,
  passwordHash?: string | null,
  ttlMs: number = SESSION_MAX_TTL_MS
): string {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) return ''
  const pwdFp = getPasswordFingerprint(passwordHash)
  const exp = Date.now() + Math.max(60 * 1000, ttlMs)
  const payload = `${cleanUserId}.${pwdFp}.${exp}`
  const sig = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 32)
  return `${payload}.${sig}`
}

export function extractUserIdFromCookie(
  rawCookieValue?: string | null
): string | null {
  try {
    if (!rawCookieValue) return null
    const decoded = decodeURIComponent(String(rawCookieValue).trim())
    if (!decoded || decoded.includes('[object')) return null
    const parts = decoded.split('.')
    if (parts.length !== 4) return null
    const candidate = parts[0]?.trim() || null
    if (!candidate || !UUID_REGEX.test(candidate)) {
      return null
    }
    return candidate
  } catch {
    return null
  }
}

export function parseAndVerifySessionCookie(
  rawCookieValue: string | undefined | null,
  currentDbPasswordHash?: string | null
): { valid: boolean; userId: string | null } {
  try {
    if (!rawCookieValue) return { valid: false, userId: null }
    const clean = decodeURIComponent(String(rawCookieValue).trim())
    if (!clean || clean.includes('[object')) {
      return { valid: false, userId: null }
    }

    const parts = clean.split('.')
    if (parts.length !== 4) {
      return { valid: false, userId: null }
    }

    const [userId, cookiePwdFp, expStr, sig] = parts.map((p) => p?.trim() || '')
    const exp = Number(expStr)

    if (
      !userId ||
      !UUID_REGEX.test(userId) ||
      cookiePwdFp.length !== 12 ||
      !Number.isFinite(exp) ||
      Date.now() > exp ||
      sig.length !== 32
    ) {
      return { valid: false, userId: null }
    }

    const expectedSig = createHmac('sha256', getSessionSecret())
      .update(`${userId}.${cookiePwdFp}.${exp}`)
      .digest('hex')
      .slice(0, 32)

    if (!safeCompare(sig, expectedSig)) {
      return { valid: false, userId: null }
    }

    if (currentDbPasswordHash !== undefined) {
      const dbPwdFp = getPasswordFingerprint(currentDbPasswordHash)
      if (!safeCompare(cookiePwdFp, dbPwdFp)) {
        return { valid: false, userId: null }
      }
    }

    return { valid: true, userId }
  } catch {
    return { valid: false, userId: null }
  }
}