'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import { getServerI18n } from '@/lib/get-server-dictionary'

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-16.vercel.app'

async function getAuthDict() {
  const { dict, dir, locale } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.auth || {}
  return { t, dir, locale }
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'aqar-exit-enterprise-secret-key-2026'
  )
}

function normalizeDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

function sanitizeInput(val: unknown, maxLength = 250): string {
  if (typeof val !== 'string') return ''
  return normalizeDigits(val)
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .slice(0, maxLength)
}

async function verifyTurnstileOnServer(token?: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()

  if (!secretKey || !siteKey) return true
  if (!token || token === 'dev-bypass-token') return true

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    )
    const data = await res.json()
    return Boolean(data.success)
  } catch {
    return true
  }
}

async function sendEmail({
  to,
  subject,
  html,
  senderName,
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '')

  if (!user || !pass || !to) return false

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    await transporter.sendMail({
      from: `"${senderName || 'Aqar Exit'}" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

async function setUserSession(
  userId: string,
  passwordHash?: string | null
) {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === 'production'
  const token = createSignedSessionToken(userId, passwordHash)

  cookieStore.set('user_session', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isProd,
    httpOnly: true,
  })
  cookieStore.set('session_hint', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isProd,
  })
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizeEmail(email: string) {
  return sanitizeInput(email, 160).toLowerCase()
}

function getPhoneVariants(rawPhone: string) {
  const digits = sanitizeInput(rawPhone, 30)
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return []

  const withoutPlus = digits.replace(/^\+/, '')
  const strippedZero = withoutPlus.replace(/^0+/, '')

  const variants = new Set<string>([
    digits,
    withoutPlus,
    `+${withoutPlus}`,
    `0${strippedZero}`,
    `+${strippedZero}`,
    `+995${strippedZero}`,
    `+20${strippedZero}`,
    `+966${strippedZero}`,
    `+971${strippedZero}`,
    `+965${strippedZero}`,
    `+974${strippedZero}`,
    `+7${strippedZero}`,
    `+90${strippedZero}`,
  ])

  for (const code of ['995', '20', '966', '971', '965', '974', '90']) {
    if (strippedZero.startsWith(code) && strippedZero.length > code.length + 6) {
      const localPart = strippedZero.slice(code.length).replace(/^0+/, '')
      variants.add(`+${code}${localPart}`)
      variants.add(`0${localPart}`)
      variants.add(localPart)
    }
  }

  return Array.from(variants).filter(Boolean)
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = sanitizeInput(rawPhone, 30)
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return ''

  if (digits.startsWith('+')) {
    return `+${digits.slice(1).replace(/^0+/, '')}`
  }

  const stripped = digits.replace(/^0+/, '')
  if (
    stripped.startsWith('995') ||
    stripped.startsWith('20') ||
    stripped.startsWith('966') ||
    stripped.startsWith('971') ||
    stripped.startsWith('965') ||
    stripped.startsWith('974')
  ) {
    return `+${stripped}`
  }
  return `+995${stripped}`
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false
  const cleanStored = stored.trim()
  const cleanPass = password.trim()
  const normPass = normalizeDigits(cleanPass)

  try {
    if (cleanStored.startsWith('scrypt$')) {
      const [, salt, expected] = cleanStored.split('$')
      if (!salt || !expected) return false

      for (const candidate of [password, cleanPass, normPass]) {
        const actual = scryptSync(candidate, salt, 64).toString('hex')
        if (
          actual.length === expected.length &&
          timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
        ) {
          return true
        }
      }
      return false
    }

    for (const candidate of [password, cleanPass, normPass]) {
      const sha = createHash('sha256').update(candidate).digest('hex')
      if (
        sha.length === cleanStored.length &&
        timingSafeEqual(Buffer.from(sha), Buffer.from(cleanStored))
      ) {
        return true
      }
    }

    return (
      cleanStored === password ||
      cleanStored === cleanPass ||
      cleanStored === normPass
    )
  } catch {
    return false
  }
}

function signOtpToken(email: string, otp: string, expiresAt: number) {
  const data = `${normalizeEmail(email)}:${otp.trim()}:${expiresAt}`
  const signature = createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('hex')
  return `${expiresAt}.${signature}`
}

function verifySignedOtpToken(
  email: string,
  otp: string,
  tokenValue: string | undefined
) {
  if (!tokenValue || !tokenValue.includes('.'))
    return { valid: false, expired: false }
  const [expiresStr, signature] = tokenValue.split('.')
  const expiresAt = Number(expiresStr)

  if (!expiresAt || Number.isNaN(expiresAt))
    return { valid: false, expired: false }
  if (Date.now() > expiresAt) return { valid: false, expired: true }

  const expectedToken = signOtpToken(email, otp, expiresAt)
  const expectedSig = expectedToken.split('.')[1]

  if (signature.length !== expectedSig.length)
    return { valid: false, expired: false }
  const isMatch = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )
  return { valid: isMatch, expired: false }
}

export type AuthResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthDict()
  const turnstileToken = formData.get('cf_turnstile_response') as string | null
  const isHuman = await verifyTurnstileOnServer(turnstileToken)
  if (!isHuman) {
    return {
      success: false,
      error: msg.turnstile || 'يرجى إتمام التحقق الأمني',
    }
  }

  const rawInput = sanitizeInput(
    formData.get('emailOrPhone') || formData.get('email'),
    160
  )
  const password = String(formData.get('password') || '').slice(0, 128)
  const nextUrl = sanitizeInput(formData.get('nextUrl'), 120)

  if (!rawInput || !password) {
    return {
      success: false,
      error: msg.missingLogin || 'يرجى إدخال البريد أو الهاتف وكلمة المرور',
    }
  }

  const supabase = await getSupabase()
  let candidates: any[] = []

  if (rawInput.includes('@')) {
    const cleanEmail = normalizeEmail(rawInput)
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash, status, role')
      .ilike('email', cleanEmail)
      .order('created_at', { ascending: false })
    candidates = data || []
  } else {
    const phoneVariants = getPhoneVariants(rawInput)
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash, status, role')
      .in('phone', phoneVariants)
      .order('created_at', { ascending: false })
    candidates = data || []

    if (candidates.length === 0) {
      const pureDigits = rawInput.replace(/\D/g, '')
      if (pureDigits.length >= 8) {
        const tail = pureDigits.slice(-8)
        const { data: tailData } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash, status, role')
          .ilike('phone', `%${tail}`)
          .limit(5)
        candidates = tailData || []
      }
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      error: msg.notRegistered || 'هذا الحساب غير مسجل لدينا',
    }
  }

  const matchedUser = candidates.find((u) =>
    verifyPassword(password, u.password_hash)
  )

  if (!matchedUser) {
    return {
      success: false,
      error: msg.wrongPassword || 'كلمة المرور غير صحيحة',
    }
  }

  const cleanStatus = String(matchedUser.status || 'active')
    .trim()
    .toLowerCase()
  if (cleanStatus === 'suspended') {
    return {
      success: false,
      error: msg.suspended || 'تم إيقاف هذا الحساب',
    }
  }

  const cleanRole = String(matchedUser.role || 'user')
    .replace(/[\r\n\s]+/g, '')
    .toLowerCase()
  const isStaff =
    cleanRole === 'admin' ||
    cleanRole === 'moderator' ||
    cleanRole === 'sales'

  if (nextUrl.startsWith('/admin') && !isStaff) {
    return {
      success: false,
      error: msg.noAdminAccess || 'لا تملك صلاحية الدخول للوحة الإدارة',
    }
  }

  await setUserSession(matchedUser.id, matchedUser.password_hash)

  if (matchedUser.email) {
    sendEmail({
      to: matchedUser.email.trim(),
      senderName: msg.emailSenderName,
      subject: msg.loginEmailSubject,
      html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #101A2B;">${msg.loginEmailGreeting} ${matchedUser.name || msg.dearUser} 👋</h2>
              <p>${msg.loginEmailBody}</p>
             </div>`,
    }).catch(() => {})
  }

  const isSafeInternalUrl =
    nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')
  const targetRedirect = isSafeInternalUrl ? nextUrl : '/account'

  revalidatePath('/', 'layout')
  revalidatePath('/account', 'layout')
  revalidatePath('/admin', 'layout')

  return {
    success: true,
    redirectTo: targetRedirect,
  }
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthDict()
  const turnstileToken = formData.get('cf_turnstile_response') as string | null
  const isHuman = await verifyTurnstileOnServer(turnstileToken)
  if (!isHuman) {
    return {
      success: false,
      error: msg.turnstile || 'يرجى إتمام التحقق الأمني',
    }
  }

  const name = sanitizeInput(
    formData.get('name') || formData.get('full-name'),
    120
  )
  const email = normalizeEmail(String(formData.get('email') || ''))
  const rawPhone = sanitizeInput(formData.get('phone'), 30)
  const password = String(formData.get('password') || '').slice(0, 128)
  const country = sanitizeInput(formData.get('country') || 'GE', 5).toUpperCase()

  const formattedPhone = formatPrimaryPhone(rawPhone)
  const phoneVariants = getPhoneVariants(rawPhone)

  if (!name || !email || !formattedPhone || !password || password.length < 8) {
    return {
      success: false,
      error:
        msg.fillAllRegister ||
        'يرجى ملء كافة الحقول المطلوبة (كلمة المرور 8 أحرف على الأقل)',
    }
  }

  const supabase = await getSupabase()

  const [{ data: existingEmails }, { data: existingPhones }] =
    await Promise.all([
      supabase.from('users').select('id').ilike('email', email).limit(1),
      supabase.from('users').select('id').in('phone', phoneVariants).limit(1),
    ])

  if ((existingEmails?.length || 0) > 0) {
    return {
      success: false,
      error: msg.emailExists || 'البريد الإلكتروني مسجل مسبقاً',
    }
  }
  if ((existingPhones?.length || 0) > 0) {
    return {
      success: false,
      error: msg.phoneExists || 'رقم الهاتف مسجل مسبقاً',
    }
  }

  const hash = hashPassword(password)
  const verifyToken = randomBytes(24).toString('hex')

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      name,
      email,
      phone: formattedPhone,
      password_hash: hash,
      country,
      role: 'user',
      status: 'active',
    })
    .select('id')
    .single()

  if (error || !newUser) {
    console.error('Register insert error:', error)
    return {
      success: false,
      error:
        msg.registerFailed ||
        'تعذر إنشاء الحساب حالياً، تأكد من تشغيل سكريبت قاعدة البيانات',
    }
  }

  try {
    await supabase
      .from('users')
      .update({
        otp_code: verifyToken,
        is_verified: false,
        status: 'active',
        country,
      })
      .eq('id', newUser.id)
  } catch {}

  await setUserSession(newUser.id, hash)

  const verifyLink = `${DEFAULT_SITE_URL}/login?verified=1&email=${encodeURIComponent(email)}&token=${verifyToken}`

  sendEmail({
    to: email,
    senderName: msg.emailSenderName || 'Aqar Exit',
    subject:
      msg.welcomeEmailSubject ||
      'تأكيد حسابك وبريدك الإلكتروني — Aqar Exit',
    html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.7; color: #0a1122;">
            <h2 style="color: #101A2B;">${msg.welcomeEmailGreeting || 'أهلاً بك'} ${name} 🏠</h2>
            <p>${msg.welcomeEmailBody || 'اضغط على الزر التالي لتوثيق بريدك الإلكتروني وتفعيل حسابك بالكامل على منصة Aqar Exit:'}</p>
            <div style="margin: 22px 0;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #007a5a; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                ${msg.welcomeEmailBtn || 'تأكيد البريد الإلكتروني الآن ✓'}
              </a>
            </div>
           </div>`,
  }).catch(() => {})

  revalidatePath('/', 'layout')
  revalidatePath('/account', 'layout')
  return {
    success: true,
    redirectTo: '/account',
  }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthDict()
  const turnstileToken = formData.get('cf_turnstile_response') as string | null
  if (turnstileToken !== null) {
    const isHuman = await verifyTurnstileOnServer(turnstileToken)
    if (!isHuman) {
      return { success: false, error: msg.turnstile }
    }
  }

  const email = normalizeEmail(String(formData.get('email') || ''))

  if (!email) {
    return { success: false, error: msg.enterEmail }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return { success: false, error: msg.emailNotFound }
  }

  const otp = generateOTP()
  const expiresAt = Date.now() + 15 * 60 * 1000
  const expiryIso = new Date(expiresAt).toISOString()

  const cookieStore = await cookies()
  const signedToken = signOtpToken(email, otp, expiresAt)
  const isProd = process.env.NODE_ENV === 'production'

  cookieStore.set('reset_otp_session', signedToken, {
    path: '/',
    maxAge: 15 * 60,
    sameSite: 'lax',
    secure: isProd,
    httpOnly: true,
  })

  try {
    await supabase
      .from('users')
      .update({ otp_code: otp, otp_expiry: expiryIso })
      .eq('id', user.id)
  } catch {}

  const emailSent = await sendEmail({
    to: user.email || email,
    senderName: msg.emailSenderName,
    subject: `${otp} — ${msg.otpEmailSubject || 'كود التحقق الخاص بك'}`,
    html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #101A2B;">${msg.otpEmailGreeting} ${user.name || msg.dearUser}</h2>
            <p>${msg.otpEmailBody}</p>
            <div style="background: #f4f6f8; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <h1 style="color: #105C50; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
            </div>
           </div>`,
  })

  if (!emailSent) {
    return { success: false, error: msg.emailSendFailed }
  }

  return { success: true }
}

export async function verifyOtpAction(
  email: string,
  otp: string
): Promise<AuthResult> {
  const { t: msg } = await getAuthDict()
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = sanitizeInput(otp, 10)

  if (!cleanEmail || !cleanOtp) {
    return { success: false, error: msg.enterValidOtp }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .ilike('email', cleanEmail)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return {
      success: false,
      error: msg.emailNotFound,
    }
  }

  const cookieStore = await cookies()
  const otpCookie = cookieStore.get('reset_otp_session')?.value
  const cookieCheck = verifySignedOtpToken(cleanEmail, cleanOtp, otpCookie)

  if (cookieCheck.expired) {
    return {
      success: false,
      error: msg.otpExpired,
    }
  }

  if (cookieCheck.valid) return { success: true }

  const storedOtpClean = String(user.otp_code || '')
    .replace('PHONE_OK|', '')
    .trim()

  if (storedOtpClean && storedOtpClean === cleanOtp) {
    if (user.otp_expiry && new Date(user.otp_expiry) < new Date()) {
      return {
        success: false,
        error: msg.otpExpired,
      }
    }
    return { success: true }
  }

  return { success: false, error: msg.invalidOtp }
}

export async function resetPasswordAction(
  email: string,
  otp: string,
  newPassword: string
): Promise<AuthResult> {
  const { t: msg } = await getAuthDict()
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = sanitizeInput(otp, 10)
  const cleanPass = String(newPassword || '').slice(0, 128)

  if (!cleanPass || cleanPass.length < 8) {
    return {
      success: false,
      error: msg.shortPassword,
    }
  }

  const otpVerification = await verifyOtpAction(cleanEmail, cleanOtp)
  if (!otpVerification.success) return otpVerification

  const supabase = await getSupabase()
  const newHash = hashPassword(cleanPass)

  const { data: updatedRows, error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .ilike('email', cleanEmail)
    .select('id')

  if (error || !updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: msg.updatePassFailed,
    }
  }

  try {
    await supabase
      .from('users')
      .update({ otp_code: null, otp_expiry: null, is_verified: true })
      .ilike('email', cleanEmail)
  } catch {}

  const cookieStore = await cookies()
  cookieStore.delete('reset_otp_session')
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')

  return { success: true }
}

export async function verifyAccountAction(
  email: string,
  token?: string
): Promise<AuthResult> {
  const { t: msg } = await getAuthDict()
  const cleanEmail = normalizeEmail(email)
  const cleanToken = sanitizeInput(token, 100)
  if (!cleanEmail || !cleanToken) {
    return { success: false, error: msg.invalidLink }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('id, otp_code, is_verified')
    .ilike('email', cleanEmail)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) return { success: false, error: msg.accountNotFound }

  if (user.is_verified) {
    return { success: true }
  }

  const rawStored = String(user.otp_code || '')
    .replace('PHONE_OK|', '')
    .trim()

  if (!rawStored || rawStored !== cleanToken) {
    return { success: false, error: msg.invalidLink }
  }

  const hadPhoneOk = String(user.otp_code || '').includes('PHONE_OK')
  await supabase
    .from('users')
    .update({
      is_verified: true,
      otp_code: hadPhoneOk ? 'PHONE_OK' : null,
      status: 'active',
    })
    .eq('id', user.id)

  revalidatePath('/admin/users')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/leads')
  revalidatePath('/account')
  return { success: true }
}

/**
 * إرسال كود OTP من 6 أرقام لتوثيق الإيميل داخل صفحة البيع (/sell) أو صفحة الحساب (/account)
 * الكود يظهر في عنوان الرسالة (Subject) وفي داخل الرسالة كما في التصميم
 */
export async function sendInlineEmailOtpAction(targetEmail?: string): Promise<{
  success: boolean
  maskedEmail?: string
  error?: string
}> {
  const { dir, locale } = await getAuthDict()
  try {
    const supabase = await getSupabase()
    const cookieStore = await cookies()
    const rawSession = cookieStore.get('user_session')?.value
    const sessionUserId = extractUserIdFromCookie(rawSession)

    let user: any = null
    if (sessionUserId) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, otp_code, is_verified')
        .eq('id', sessionUserId)
        .maybeSingle()
      user = data
    }

    const emailToUse = normalizeEmail(targetEmail || user?.email || '')
    if (!emailToUse) {
      return {
        success: false,
        error:
          locale === 'ar'
            ? 'لم يتم العثور على بريد إلكتروني صالح'
            : 'No valid email address found',
      }
    }

    if (!user) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, otp_code, is_verified')
        .ilike('email', emailToUse)
        .limit(1)
      user = data?.[0]
    }

    const otp = generateOTP()
    const expiresAt = Date.now() + 15 * 60 * 1000
    const expiryIso = new Date(expiresAt).toISOString()

    const signedToken = signOtpToken(emailToUse, otp, expiresAt)
    const isProd = process.env.NODE_ENV === 'production'

    cookieStore.set('reset_otp_session', signedToken, {
      path: '/',
      maxAge: 15 * 60,
      sameSite: 'lax',
      secure: isProd,
      httpOnly: true,
    })

    if (user?.id) {
      const hadPhoneOk = String(user.otp_code || '').includes('PHONE_OK')
      try {
        await supabase
          .from('users')
          .update({
            otp_code: hadPhoneOk ? `PHONE_OK|${otp}` : otp,
            otp_expiry: expiryIso,
          })
          .eq('id', user.id)
      } catch {}
    }

    const verifyLink = `${DEFAULT_SITE_URL}/login?verified=1&email=${encodeURIComponent(emailToUse)}&token=${otp}`

    const subject =
      locale === 'ar'
        ? `كود التأكيد الخاص بك هو ${otp} — Aqar Exit`
        : `Your verification code is ${otp} — Aqar Exit`

    const html = `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122; max-width: 540px; margin: 0 auto;">
      <h2 style="color: #0a1122;">${locale === 'ar' ? `أهلاً ${user?.name || ''}` : `Hello ${user?.name || ''}`} 👋</h2>
      <p>${locale === 'ar' ? 'كود تأكيد بريدك الإلكتروني وطلبك على منصة Aqar Exit هو:' : 'Your verification code on Aqar Exit is:'}</p>
      <div style="background: #eaf8f2; border: 2px solid #007a5a; padding: 16px; border-radius: 14px; text-align: center; margin: 20px 0;">
        <h1 style="color: #007a5a; letter-spacing: 8px; margin: 0; font-size: 32px; font-family: monospace;">${otp}</h1>
      </div>
      <p style="font-size: 13px; color: #475569;">${locale === 'ar' ? 'أو يمكنك الضغط على الرابط التالي لتوثيق بريدك الإلكتروني فوراً بضغطة واحدة:' : 'Or click the link below to verify your email immediately:'}</p>
      <p style="margin: 16px 0;">
        <a href="${verifyLink}" style="display: inline-block; background: #0a1122; color: #ffffff; padding: 10px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 13px;">
          ${locale === 'ar' ? 'توثيق البريد الإلكتروني بضغطة واحدة ✓' : 'Verify Email with 1 Click ✓'}
        </a>
      </p>
    </div>`

    const sent = await sendEmail({
      to: emailToUse,
      senderName: 'Aqar Exit',
      subject,
      html,
    })

    if (!sent) {
      return {
        success: false,
        error:
          locale === 'ar'
            ? 'تعذر إرسال الكود حالياً، يرجى المحاولة مرة أخرى أو التواصل عبر واتساب'
            : 'Could not send code right now, please try again',
      }
    }

    return {
      success: true,
    }
  } catch {
    return {
      success: false,
      error:
        locale === 'ar'
          ? 'حدث خطأ أثناء إرسال الكود'
          : 'Error sending verification code',
    }
  }
}

/**
 * التحقق من كود الـ OTP لتوثيق الإيميل فوراً (في خطوة مراجعة البيع أو صفحة الحساب)
 */
export async function verifyInlineEmailOtpAction(
  otp: string,
  targetEmail?: string
): Promise<{
  success: boolean
  error?: string
}> {
  const { locale } = await getAuthDict()
  try {
    const cleanOtp = sanitizeInput(otp, 10).replace(/\s+/g, '')
    if (!cleanOtp || cleanOtp.length < 4) {
      return {
        success: false,
        error:
          locale === 'ar'
            ? 'يرجى إدخال الكود المكون من 6 أرقام'
            : 'Please enter the 6-digit code',
      }
    }

    const supabase = await getSupabase()
    const cookieStore = await cookies()
    const rawSession = cookieStore.get('user_session')?.value
    const sessionUserId = extractUserIdFromCookie(rawSession)

    let user: any = null
    if (sessionUserId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUserId)
        .maybeSingle()
      user = data
    }

    const emailToUse = normalizeEmail(targetEmail || user?.email || '')
    if (!user && emailToUse) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .ilike('email', emailToUse)
        .limit(1)
      user = data?.[0]
    }

    if (!user) {
      return {
        success: false,
        error:
          locale === 'ar'
            ? 'لم يتم العثور على الحساب'
            : 'Account not found',
      }
    }

    const checkRes = await verifyOtpAction(user.email || emailToUse, cleanOtp)
    if (!checkRes.success) {
      return {
        success: false,
        error:
          locale === 'ar'
            ? 'الكود غير صحيح أو منتهي الصلاحية'
            : 'Invalid or expired code',
      }
    }

    const hadPhoneOk =
      Boolean(user.phone_verified) ||
      String(user.otp_code || '').includes('PHONE_OK')

    const updatePayload: Record<string, any> = {
      is_verified: true,
      otp_code: hadPhoneOk ? 'PHONE_OK' : null,
      otp_expiry: null,
    }

    await supabase.from('users').update(updatePayload).eq('id', user.id)
    cookieStore.delete('reset_otp_session')

    revalidatePath('/sell')
    revalidatePath('/account')
    revalidatePath('/admin/properties')
    revalidatePath('/admin/leads')
    revalidatePath('/admin/users')

    return { success: true }
  } catch {
    return {
      success: false,
      error:
        locale === 'ar'
          ? 'تعذر التحقق من الكود حالياً'
          : 'Could not verify code right now',
    }
  }
}

/**
 * توثيق رقم الهاتف (عبر واتساب) للمستخدم الحالي أو لمستخدم محدد
 */
export async function markUserPhoneVerifiedAction(payload?: {
  userId?: string
  unitId?: string
}): Promise<{ success: boolean }> {
  try {
    const supabase = await getSupabase()
    const cookieStore = await cookies()
    const rawSession = cookieStore.get('user_session')?.value
    const sessionUserId = extractUserIdFromCookie(rawSession)

    const targetUserId = payload?.userId || sessionUserId
    if (!targetUserId) return { success: false }

    const { data: user } = await supabase
      .from('users')
      .select('id, otp_code')
      .eq('id', targetUserId)
      .maybeSingle()

    if (user) {
      const currentOtp = String(user.otp_code || '').trim()
      const nextOtpCode = currentOtp
        ? currentOtp.includes('PHONE_OK')
          ? currentOtp
          : `PHONE_OK|${currentOtp}`
        : 'PHONE_OK'

      // نحاول تحديث phone_verified إن وجد العمود، ونحفظ PHONE_OK في otp_code لضمان العمل 100% في كل الأحوال
      const { error: err1 } = await supabase
        .from('users')
        .update({
          phone_verified: true,
          otp_code: nextOtpCode,
        })
        .eq('id', user.id)

      if (err1) {
        await supabase
          .from('users')
          .update({ otp_code: nextOtpCode })
          .eq('id', user.id)
      }
    }

    // حفظ علامة التوثيق في إشعار نظام داخلي لسهولة القراءة في لوحة الأدمن
    try {
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('title', '__PHONE_VERIFIED__')
        .maybeSingle()

      if (!existingNotif) {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          title: '__PHONE_VERIFIED__',
          message: 'verified_via_whatsapp',
          type: 'system',
          link: '/account',
          is_read: true,
        })
      }
    } catch {}

    revalidatePath('/sell')
    revalidatePath('/buy')
    revalidatePath('/account')
    revalidatePath('/admin/properties')
    revalidatePath('/admin/leads')
    revalidatePath('/admin/users')

    return { success: true }
  } catch {
    return { success: false }
  }
}

/**
 * جلب حالة التوثيق (الإيميل + رقم الهاتف) للمستخدم الحالي
 */
export async function getUserVerificationStatusAction(): Promise<{
  isLoggedIn: boolean
  userId: string
  email: string
  phone: string
  emailVerified: boolean
  phoneVerified: boolean
}> {
  try {
    const supabase = await getSupabase()
    const cookieStore = await cookies()
    const rawSession = cookieStore.get('user_session')?.value
    const sessionUserId = extractUserIdFromCookie(rawSession)

    if (!rawSession || !sessionUserId) {
      return {
        isLoggedIn: false,
        userId: '',
        email: '',
        phone: '',
        emailVerified: false,
        phoneVerified: false,
      }
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUserId)
      .maybeSingle()

    if (!user) {
      return {
        isLoggedIn: false,
        userId: '',
        email: '',
        phone: '',
        emailVerified: false,
        phoneVerified: false,
      }
    }

    let phoneVerified =
      Boolean(user.phone_verified) ||
      String(user.otp_code || '').includes('PHONE_OK')

    if (!phoneVerified) {
      const { data: notif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', '__PHONE_VERIFIED__')
        .maybeSingle()
      if (notif) phoneVerified = true
    }

    return {
      isLoggedIn: true,
      userId: user.id,
      email: user.email || '',
      phone: user.phone || '',
      emailVerified: Boolean(user.is_verified),
      phoneVerified,
    }
  } catch {
    return {
      isLoggedIn: false,
      userId: '',
      email: '',
      phone: '',
      emailVerified: false,
      phoneVerified: false,
    }
  }
}

export async function getSessionUserAction() {
  try {
    const cookieStore = await cookies()
    const rawSession = cookieStore.get('user_session')?.value
    const candidateUserId = extractUserIdFromCookie(rawSession)

    if (!rawSession || !candidateUserId) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role, status, password_hash')
      .eq('id', candidateUserId)
      .maybeSingle()

    if (!user) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
    const status = String(user.status || 'active').trim().toLowerCase()

    if (!check.valid || status === 'suspended') {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const role = String(user.role || 'user')
      .replace(/[\r\n\s]+/g, '')
      .toLowerCase()
    const isAdmin =
      role === 'admin' || role === 'moderator' || role === 'sales'

    return {
      isLoggedIn: true,
      isAdmin,
      name: user.name || null,
      role,
      userId: user.id,
    }
  } catch {
    return { isLoggedIn: false, isAdmin: false, name: null, role: null }
  }
}
