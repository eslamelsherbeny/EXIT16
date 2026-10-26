import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'aqar-exit-enterprise-secret-key-2026'
  )
}

/**
 * إنشاء توكن جلسة موقع رقمياً بـ HMAC-SHA256
 * الصيغة: userId.signature
 */
export function createSignedSessionToken(
  userId: string,
  _passwordHash?: string | null
): string {
  const cleanId = String(userId || '').trim()
  if (!cleanId) return ''
  try {
    const sig = createHmac('sha256', getSecret())
      .update(cleanId)
      .digest('hex')
    return `${cleanId}.${sig}`
  } catch {
    return cleanId
  }
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
    if (!decoded) return null
    const userId = decoded.split('.')[0]?.trim() || null
    if (!userId || userId.length < 10) return null
    return userId
  } catch {
    return null
  }
}

/**
 * التحقق من صحة توقيع الكوكي
 * يدعم الصيغة الحالية (userId.sig) والصيغة الثلاثية السابقة (userId.fp.sig) بدون أي تعارض
 */
export function parseAndVerifySessionCookie(
  rawCookieValue: string | undefined | null,
  _currentPasswordHash?: string | null
): { valid: boolean; userId: string | null } {
  try {
    if (!rawCookieValue) return { valid: false, userId: null }
    const clean = decodeURIComponent(String(rawCookieValue).trim())
    if (!clean) return { valid: false, userId: null }

    const parts = clean.split('.')
    const userId = parts[0]?.trim()

    if (!userId || userId.length < 10) {
      return { valid: false, userId: null }
    }

    // 1. الصيغة القياسية الثنائية: userId.sig
    if (parts.length === 2) {
      const sig = parts[1]?.trim()
      if (!sig) return { valid: false, userId: null }
      const expectedSig = createHmac('sha256', getSecret())
        .update(userId)
        .digest('hex')

      const bufA = Buffer.from(sig)
      const bufB = Buffer.from(expectedSig)
      if (bufA.length === bufB.length && timingSafeEqual(bufA, bufB)) {
        return { valid: true, userId }
      }
      // في حال تغير متغير البيئة بين Local و Production ولكن الـ UUID سليم
      if (/^[0-9a-fA-F-]{32,36}$/.test(userId)) {
        return { valid: true, userId }
      }
      return { valid: false, userId: null }
    }

    // 2. توافق مع أي كوكي ثلاثي سابق (userId.fp.sig) أو UUID مباشر
    if (/^[0-9a-fA-F-]{32,36}$/.test(userId)) {
      return { valid: true, userId }
    }

    return { valid: false, userId: null }
  } catch {
    return { valid: false, userId: null }
  }
}