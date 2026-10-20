'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

// ==========================================
// 1. إعدادات الـ Supabase و الـ Email
// ==========================================

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

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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
      from: `"دارك للعقارات" <${user}>`,
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

// ==========================================
// 2. دوال المساعدة والتنسيق والتشفير
// ==========================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase()
}

function getPhoneVariants(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return []

  if (digits.startsWith('+') && !digits.startsWith('+20')) {
    const stripped = digits.replace('+', '')
    return Array.from(new Set([digits, stripped, `0${stripped}`]))
  }

  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  const local = `0${stripped}`
  const intl = `+20${stripped}`
  return Array.from(new Set([digits, local, intl]))
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return ''

  if (digits.startsWith('+') && !digits.startsWith('+20')) {
    return digits
  }

  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return `+20${stripped}`
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
      // فحص الباسورد كما هو أو بدون مسافات زائدة
      const actual1 = scryptSync(password, salt, 64).toString('hex')
      if (actual1.length === expected.length && timingSafeEqual(Buffer.from(actual1), Buffer.from(expected))) {
        return true
      }
      const actual2 = scryptSync(cleanPass, salt, 64).toString('hex')
      return actual2.length === expected.length && timingSafeEqual(Buffer.from(actual2), Buffer.from(expected))
    }

    // فحص SHA-256
    const sha1 = createHash('sha256').update(password).digest('hex')
    if (sha1.length === cleanStored.length && timingSafeEqual(Buffer.from(sha1), Buffer.from(cleanStored))) {
      return true
    }
    const sha2 = createHash('sha256').update(cleanPass).digest('hex')
    if (sha2.length === cleanStored.length && timingSafeEqual(Buffer.from(sha2), Buffer.from(cleanStored))) {
      return true
    }

    // دعم النص المباشر في حال تم تعديل الباسورد يدوياً من داخل جدول Supabase
    return cleanStored === password || cleanStored === cleanPass
  } catch {
    return false
  }
}

function signOtpToken(email: string, otp: string, expiresAt: number) {
  const secret = process.env.EMAIL_PASS || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'darak-secret-key'
  const data = `${normalizeEmail(email)}:${otp.trim()}:${expiresAt}`
  const signature = createHmac('sha256', secret).update(data).digest('hex')
  return `${expiresAt}.${signature}`
}

function verifySignedOtpToken(email: string, otp: string, tokenValue: string | undefined) {
  if (!tokenValue || !tokenValue.includes('.')) return { valid: false, expired: false }
  const [expiresStr, signature] = tokenValue.split('.')
  const expiresAt = Number(expiresStr)

  if (!expiresAt || Number.isNaN(expiresAt)) return { valid: false, expired: false }
  if (Date.now() > expiresAt) return { valid: false, expired: true }

  const expectedToken = signOtpToken(email, otp, expiresAt)
  const expectedSig = expectedToken.split('.')[1]

  if (signature.length !== expectedSig.length) return { valid: false, expired: false }
  const isMatch = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  return { valid: isMatch, expired: false }
}

async function setUserSession(userId: string) {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === 'production'

  cookieStore.set('user_session', userId, {
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

export type AuthResult = { success: boolean; error?: string }

// ==========================================
// 3. تسجيل الدخول الذكي (يفحص كل الصفوف ويوضح السبب بدقة)
// ==========================================

export async function loginAction(formData: FormData): Promise<AuthResult & { redirectTo?: string }> {
  const rawInput = (formData.get('emailOrPhone') as string) || ''
  const password = (formData.get('password') as string) || ''

  const cleanInput = rawInput.trim()

  if (!cleanInput || !password) {
    return { success: false, error: 'يرجى إدخال البريد الإلكتروني/الهاتف وكلمة المرور.' }
  }

  const supabase = await getSupabase()
  let candidates: any[] = []

  if (cleanInput.includes('@')) {
    const cleanEmail = normalizeEmail(cleanInput)
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash, status, role')
      .ilike('email', `%${cleanEmail}%`)
      .order('created_at', { ascending: false })
    candidates = data || []
  } else {
    const phoneVariants = getPhoneVariants(cleanInput)
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
      error: 'هذا البريد الإلكتروني أو رقم الموبايل غير مسجل لدينا. يمكنك إنشاء حساب جديد.',
    }
  }

  const matchedUser = candidates.find((u) => verifyPassword(password, u.password_hash))

  if (!matchedUser) {
    return {
      success: false,
      error: 'كلمة السر غير مطابقة لهذا الحساب. اضغط على "نسيت كلمة السر؟" لتعيين كلمة جديدة.',
    }
  }

  const cleanStatus = String(matchedUser.status || 'active').trim().toLowerCase()
  if (cleanStatus === 'suspended') {
    return {
      success: false,
      error: 'تم إيقاف هذا الحساب مؤقتاً من قِبل إدارة المنصة.',
    }
  }

  await setUserSession(matchedUser.id)

  if (matchedUser.email) {
    // إرسال الإيميل بدون تعطيل عملية الدخول لو تأخر SMTP
    sendEmail({
      to: matchedUser.email.trim(),
      subject: 'تنبيه أمني: تم تسجيل الدخول لحسابك في دارك',
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
              <h2 style="color: #101A2B;">أهلاً بك مجدداً يا ${matchedUser.name || 'مستخدمنا العزيز'} 👋</h2>
              <p>تم تسجيل الدخول إلى حسابك في <strong>منصة دارك</strong> بنجاح.</p>
             </div>`,
    }).catch(() => {})
  }

  return {
    success: true,
    redirectTo: '/',
  }
}
// ==========================================
// 4. إنشاء حساب جديد + حفظ دولة المستخدم + إرسال رابط التوثيق المباشر
// ==========================================

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const name = ((formData.get('name') as string) || (formData.get('full-name') as string) || '').trim()
  const rawEmail = (formData.get('email') as string) || ''
  const rawPhone = (formData.get('phone') as string) || ''
  const password = (formData.get('password') as string) || ''
  const country = (((formData.get('country') as string) || 'EG').trim()).toUpperCase()

  const email = normalizeEmail(rawEmail)
  const formattedPhone = formatPrimaryPhone(rawPhone)
  const phoneVariants = getPhoneVariants(rawPhone)

  if (!name || !email || !formattedPhone || !password || password.length < 8) {
    return { success: false, error: 'يرجى ملء جميع الحقول وكلمة سر لا تقل عن 8 أحرف.' }
  }

  const supabase = await getSupabase()

  const [{ data: existingEmails }, { data: existingPhones }] = await Promise.all([
    supabase.from('users').select('id').ilike('email', email).limit(1),
    supabase.from('users').select('id').in('phone', phoneVariants).limit(1),
  ])

  if ((existingEmails?.length || 0) > 0) {
    return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' }
  }
  if ((existingPhones?.length || 0) > 0) {
    return { success: false, error: 'رقم الموبايل هذا مسجل بالفعل. يرجى تسجيل الدخول.' }
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
    })
    .select('id')
    .single()

  if (error || !newUser) {
    return { success: false, error: 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً.' }
  }

  try {
    await supabase
      .from('users')
      .update({ otp_code: verifyToken, is_verified: false, status: 'active', country })
      .eq('id', newUser.id)
  } catch {}

  await setUserSession(newUser.id)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://next-js-rtl-platform-structure.vercel.app'
  const verifyLink = `${siteUrl}/login?verified=1&email=${encodeURIComponent(email)}&token=${verifyToken}`

  await sendEmail({
    to: email,
    subject: 'أهلاً بك في منصة دارك — تأكيد حسابك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
            <h2 style="color: #101A2B;">مرحباً بك يا ${name} في عائلة دارك! 🏠</h2>
            <p>تم إنشاء حسابك بنجاح. لتأكيد بريدك الإلكتروني وتوثيق حسابك رسمياً، اضغط على الزر التالي:</p>
            <div style="margin: 20px 0;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                تأكيد وتوثيق الحساب الآن
              </a>
            </div>
           </div>`,
  })

  revalidatePath('/', 'layout')
  revalidatePath('/account', 'layout')
  return { success: true }
}

// ==========================================
// 5. استرجاع كلمة المرور
// ==========================================

export async function forgotPasswordAction(formData: FormData): Promise<AuthResult> {
  const rawEmail = (formData.get('email') as string) || ''
  const email = normalizeEmail(rawEmail)

  if (!email) {
    return { success: false, error: 'يرجى إدخال البريد الإلكتروني.' }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .ilike('email', `%${email}%`)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return { success: false, error: 'هذا البريد الإلكتروني غير مسجل لدينا.' }
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
    await supabase.from('users').update({ otp_code: otp, otp_expiry: expiryIso }).eq('id', user.id)
  } catch {}

  const emailSent = await sendEmail({
    to: user.email || email,
    subject: 'رمز استرجاع كلمة المرور - دارك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
            <h2 style="color: #101A2B;">أهلاً ${user.name || 'مستخدمنا العزيز'}</h2>
            <p>استخدم كود التحقق التالي لتعيين كلمة مرور جديدة لحسابك:</p>
            <div style="background: #f4f6f8; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <h1 style="color: #105C50; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
            </div>
           </div>`,
  })

  if (!emailSent) {
    return { success: false, error: 'تعذر إرسال البريد الإلكتروني حالياً.' }
  }

  return { success: true }
}

// ==========================================
// 6. التحقق من الـ OTP وتحديث كلمة السر في كل الصفوف المطابقة
// ==========================================

export async function verifyOtpAction(email: string, otp: string): Promise<AuthResult> {
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = (otp || '').trim()

  if (!cleanEmail || !cleanOtp) {
    return { success: false, error: 'يرجى إدخال الكود بشكل صحيح.' }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .ilike('email', `%${cleanEmail}%`)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return { success: false, error: 'لم يتم العثور على حساب بهذا البريد الإلكتروني.' }
  }

  const cookieStore = await cookies()
  const otpCookie = cookieStore.get('reset_otp_session')?.value
  const cookieCheck = verifySignedOtpToken(cleanEmail, cleanOtp, otpCookie)

  if (cookieCheck.expired) {
    return { success: false, error: 'الكود منتهي الصلاحية، يرجى طلب كود جديد.' }
  }

  if (cookieCheck.valid) return { success: true }

  if (user.otp_code && String(user.otp_code).trim() === cleanOtp) {
    if (user.otp_expiry && new Date(user.otp_expiry) < new Date()) {
      return { success: false, error: 'الكود منتهي الصلاحية، يرجى طلب كود جديد.' }
    }
    return { success: true }
  }

  return { success: false, error: 'كود التحقق غير صحيح.' }
}

export async function resetPasswordAction(email: string, otp: string, newPassword: string): Promise<AuthResult> {
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = (otp || '').trim()

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل.' }
  }

  const otpVerification = await verifyOtpAction(cleanEmail, cleanOtp)
  if (!otpVerification.success) return otpVerification

  const supabase = await getSupabase()
  const newHash = hashPassword(newPassword)

  // تحديث كل الصفوف التي تحمل هذا الإيميل والتأكد من نجاح التحديث فعلياً
  const { data: updatedRows, error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .ilike('email', `%${cleanEmail}%`)
    .select('id')

  if (error || !updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: 'تعذر تحديث كلمة المرور في قاعدة البيانات (تأكد من تعطيل RLS على جدول users).',
    }
  }

  try {
    await supabase
      .from('users')
      .update({ otp_code: null, otp_expiry: null, is_verified: true })
      .ilike('email', `%${cleanEmail}%`)
  } catch {}

  const cookieStore = await cookies()
  cookieStore.delete('reset_otp_session')

  return { success: true }
}

// ==========================================
// 7. توثيق الحساب فور الضغط على الرابط في الإيميل
// ==========================================
export async function verifyAccountAction(email: string, token?: string): Promise<AuthResult> {
  const cleanEmail = normalizeEmail(email)
  if (!cleanEmail) return { success: false, error: 'رابط غير صالح.' }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('id, otp_code')
    .ilike('email', `%${cleanEmail}%`)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) return { success: false, error: 'الحساب غير موجود.' }

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
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { isLoggedIn: false, isAdmin: false, name: null, role: null }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) return { isLoggedIn: false, isAdmin: false, name: null, role: null }

    const role = String(user.role || 'user').replace(/[\r\n\s]+/g, '').toLowerCase()
    const isAdmin = role === 'admin' || role === 'moderator'

    return { isLoggedIn: true, isAdmin, name: user.name || null, role }
  } catch {
    return { isLoggedIn: false, isAdmin: false, name: null, role: null }
  }
}