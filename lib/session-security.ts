import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'aqar-exit-enterprise-secret-key-2026'
  )
}

/**
 * بصمة مختصرة لكلمة المرور (12 حرفاً) لضمان إبطال الجلسة تلقائياً إذا غيّر المستخدم كلمة مروره
 */
export function getPasswordFingerprint(
  passwordHash: string | null | undefined
): string {
  return createHash('sha256')
    .update(String(passwordHash || 'no-pass').trim())
    .digest('hex')
    .slice(0, 12)
}

/**
 * إنشاء توكن جلسة موقّع رقمياً بـ HMAC-SHA256
 * الصيغة الموحدة: userId.pwdFp.signature (3 أجزاء دائماً)
 */
export function createSignedSessionToken(
  userId: string,
  passwordHash?: string | null
): string {
  const cleanUserId = String(userId || '').trim()
  if (!cleanUserId) return ''
  const pwdFp = getPasswordFingerprint(passwordHash)
  const payload = `${cleanUserId}.${pwdFp}`
  const sig = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 24)
  return `${payload}.${sig}`
}

/**
 * استخراج معرف المستخدم (UUID) من الكوكي بأمان تام
 */
export function extractUserIdFromCookie(
  rawCookieValue?: string | null
): string | null {
  try {
    if (!rawCookieValue) return null
    const decoded = decodeURIComponent(String(rawCookieValue).trim())
    if (!decoded || decoded.includes('[object')) return null
    const candidate = decoded.split('.')[0]?.trim() || null
    if (!candidate || candidate.length < 8 || candidate.length > 64) return null
    return candidate
  } catch {
    return null
  }
}

/**
 * التحقق الصارم من صحة توقيع الكوكي ومطابقته لبصمة كلمة المرور الحالية
 */
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
    const userId = parts[0]?.trim()

    if (!userId || userId.length < 8 || userId.length > 64) {
      return { valid: false, userId: null }
    }

    // 1. الصيغة القياسية الثلاثية: userId.pwdFp.sig
    if (parts.length === 3) {
      const [, cookiePwdFp, sig] = parts
      if (!cookiePwdFp || !sig) return { valid: false, userId: null }

      const expectedSig = createHmac('sha256', getSessionSecret())
        .update(`${userId}.${cookiePwdFp}`)
        .digest('hex')
        .slice(0, 24)

      const bufA = Buffer.from(sig)
      const bufB = Buffer.from(expectedSig)
      if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
        return { valid: false, userId: null }
      }

      if (currentDbPasswordHash !== undefined) {
        const dbPwdFp = getPasswordFingerprint(currentDbPasswordHash)
        if (cookiePwdFp !== dbPwdFp) {
          return { valid: false, userId: null }
        }
      }

      return { valid: true, userId }
    }

    // 2. دعم انتقالي للصيغة الثنائية إن وجدت في متصفح العميل
    if (parts.length === 2 && /^[0-9a-fA-F-]{32,36}$/.test(userId)) {
      return { valid: true, userId }
    }

    return { valid: false, userId: null }
  } catch {
    return { valid: false, userId: null }
  }
}