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
  const { dict, dir } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.auth || {}
  return { t, dir }
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
    process.env.EMAIL_PASS ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'darak-enterprise-secret-key-2026'
  )
}

function sanitizeInput(val: unknown, maxLength = 250): string {
  if (typeof val !== 'string') return ''
  return val
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .slice(0, maxLength)
}

async function verifyTurnstileOnServer(token?: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secretKey) return true
  if (!token || token === 'dev-bypass-token') return false

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

  if (digits.startsWith('+')) {
    const stripped = digits.slice(1)
    return Array.from(new Set([digits, stripped, `0${stripped}`]))
  }

  const stripped = digits.replace(/^0+/, '')
  return Array.from(
    new Set([
      digits,
      `+${stripped}`,
      `0${stripped}`,
      `+995${stripped}`,
      `+20${stripped}`,
      `+966${stripped}`,
      `+971${stripped}`,
    ])
  )
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = sanitizeInput(rawPhone, 30)
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return ''

  if (digits.startsWith('+')) {
    return digits
  }

  const stripped = digits.replace(/^0+/, '')
  if (
    stripped.startsWith('995') ||
    stripped.startsWith('20') ||
    stripped.startsWith('966') ||
    stripped.startsWith('971')
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

  try {
    if (cleanStored.startsWith('scrypt$')) {
      const [, salt, expected] = cleanStored.split('$')
      if (!salt || !expected) return false
      const actual1 = scryptSync(password, salt, 64).toString('hex')
      if (
        actual1.length === expected.length &&
        timingSafeEqual(Buffer.from(actual1), Buffer.from(expected))
      ) {
        return true
      }
      const actual2 = scryptSync(cleanPass, salt, 64).toString('hex')
      return (
        actual2.length === expected.length &&
        timingSafeEqual(Buffer.from(actual2), Buffer.from(expected))
      )
    }

    const sha1 = createHash('sha256').update(password).digest('hex')
    if (
      sha1.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(sha1), Buffer.from(cleanStored))
    ) {
      return true
    }
    const sha2 = createHash('sha256').update(cleanPass).digest('hex')
    if (
      sha2.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(sha2), Buffer.from(cleanStored))
    ) {
      return true
    }

    return cleanStored === password || cleanStored === cleanPass
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

export type AuthResult = { success: boolean; error?: string }

export async function loginAction(
  formData: FormData
): Promise<AuthResult & { redirectTo?: string }> {
  const { t: msg, dir } = await getAuthDict()
  const turnstileToken = formData.get('cf_turnstile_response') as string | null
  const isHuman = await verifyTurnstileOnServer(turnstileToken)
  if (!isHuman) {
    return {
      success: false,
      error: msg.turnstile,
    }
  }

  const rawInput = sanitizeInput(formData.get('emailOrPhone'), 160)
  const password = String(formData.get('password') || '').slice(0, 128)
  const nextUrl = sanitizeInput(formData.get('nextUrl'), 120)

  if (!rawInput || !password) {
    return {
      success: false,
      error: msg.missingLogin,
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
  }

  if (candidates.length === 0) {
    return {
      success: false,
      error: msg.notRegistered,
    }
  }

  const matchedUser = candidates.find((u) =>
    verifyPassword(password, u.password_hash)
  )

  if (!matchedUser) {
    return {
      success: false,
      error: msg.wrongPassword,
    }
  }

  const cleanStatus = String(matchedUser.status || 'active')
    .trim()
    .toLowerCase()
  if (cleanStatus === 'suspended') {
    return {
      success: false,
      error: msg.suspended,
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
      error: msg.noAdminAccess,
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
      error: msg.turnstile,
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
      error: msg.fillAllRegister,
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
      error: msg.emailExists,
    }
  }
  if ((existingPhones?.length || 0) > 0) {
    return {
      success: false,
      error: msg.phoneExists,
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
    return {
      success: false,
      error: msg.registerFailed,
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

  await sendEmail({
    to: email,
    senderName: msg.emailSenderName,
    subject: msg.welcomeEmailSubject,
    html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #101A2B;">${msg.welcomeEmailGreeting} ${name} 🏠</h2>
            <p>${msg.welcomeEmailBody}</p>
            <div style="margin: 20px 0;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                ${msg.welcomeEmailBtn}
              </a>
            </div>
           </div>`,
  })

  revalidatePath('/', 'layout')
  revalidatePath('/account', 'layout')
  return { success: true }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthDict()
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
    subject: msg.otpEmailSubject,
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

  if (user.otp_code && String(user.otp_code).trim() === cleanOtp) {
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
  if (!cleanEmail) return { success: false, error: msg.invalidLink }

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

  if (user.otp_code && cleanToken && String(user.otp_code).trim() !== cleanToken) {
    return { success: false, error: msg.invalidLink }
  }

  await supabase
    .from('users')
    .update({ is_verified: true, otp_code: null, status: 'active' })
    .eq('id', user.id)

  revalidatePath('/admin/users')
  return { success: true }
}

export async function getSessionUserAction() {
  try {
    const cookieStore = await cookies()
    const rawSession = cookieStore.get('user_session')?.value
    const candidateUserId = extractUserIdFromCookie(rawSession)

    if (!rawSession || !candidateUserId) {
      cookieStore.delete('user_session')
      cookieStore.delete('session_hint')
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role, status, password_hash')
      .eq('id', candidateUserId)
      .maybeSingle()

    if (!user) {
      cookieStore.delete('user_session')
      cookieStore.delete('session_hint')
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
    const status = String(user.status || 'active').trim().toLowerCase()

    if (!check.valid || status === 'suspended') {
      cookieStore.delete('user_session')
      cookieStore.delete('session_hint')
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