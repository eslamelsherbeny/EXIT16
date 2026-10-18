'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

// ==========================================
// 1. إعدادات الـ Supabase و الـ Email (مضبوطة لـ Vercel)
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

  if (!user || !pass || !to) {
    console.warn('Email credentials or recipient missing')
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
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
    console.error('Email sending failed (non-blocking):', error)
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
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  const local = `0${stripped}`
  const intl = `+20${stripped}`
  return Array.from(new Set([digits, local, intl]))
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return ''
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
  try {
    if (stored.startsWith('scrypt$')) {
      const [, salt, expected] = stored.split('$')
      if (!salt || !expected) return false
      const actual = scryptSync(password, salt, 64).toString('hex')
      return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
    }
    const actual = createHash('sha256').update(password).digest('hex')
    return actual.length === stored.length && timingSafeEqual(Buffer.from(actual), Buffer.from(stored))
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
// 3. تسجيل الدخول
// ==========================================

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const rawInput = (formData.get('emailOrPhone') as string) || ''
  const password = (formData.get('password') as string) || ''

  const cleanInput = rawInput.trim()

  if (!cleanInput || !password) {
    return { success: false, error: 'يرجى إدخال البريد الإلكتروني/الهاتف وكلمة المرور.' }
  }

  const supabase = await getSupabase()
  let user: any = null

  if (cleanInput.includes('@')) {
    const cleanEmail = normalizeEmail(cleanInput)
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash')
      .ilike('email', cleanEmail)
      .limit(1)
    user = data?.[0] || null
  } else {
    const phoneVariants = getPhoneVariants(cleanInput)
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash')
      .in('phone', phoneVariants)
      .limit(1)
    user = data?.[0] || null
  }

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'بيانات الدخول غير صحيحة.' }
  }

  await setUserSession(user.id)

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: 'تنبيه أمني: تم تسجيل الدخول لحسابك في دارك',
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
              <h2 style="color: #101A2B;">أهلاً بك مجدداً يا ${user.name || 'مستخدمنا العزيز'} 👋</h2>
              <p>تم تسجيل الدخول إلى حسابك في <strong>منصة دارك</strong> بنجاح.</p>
              <p style="color: #666; font-size: 12px;">إذا لم تكن أنت من قام بهذا الإجراء، يرجى تغيير كلمة المرور فوراً.</p>
             </div>`,
    })
  }

  revalidatePath('/account', 'layout')
  return { success: true }
}

// ==========================================
// 4. إنشاء حساب جديد (مع إرسال رابط تأكيد الحساب)
// ==========================================

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const name = ((formData.get('name') as string) || '').trim()
  const rawEmail = (formData.get('email') as string) || ''
  const rawPhone = (formData.get('phone') as string) || ''
  const password = (formData.get('password') as string) || ''

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

  const emailTaken = (existingEmails?.length || 0) > 0
  const phoneTaken = (existingPhones?.length || 0) > 0

  if (emailTaken && phoneTaken) {
    return { success: false, error: 'البريد الإلكتروني ورقم الموبايل مسجلان بالفعل. يرجى تسجيل الدخول.' }
  }
  if (emailTaken) {
    return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر.' }
  }
  if (phoneTaken) {
    return { success: false, error: 'رقم الموبايل هذا مسجل بالفعل. يرجى استخدام رقم آخر.' }
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
    })
    .select('id')
    .single()

  if (error || !newUser) {
    return { success: false, error: 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً.' }
  }

  try {
    await supabase.from('users').update({ otp_code: verifyToken, is_verified: false }).eq('id', newUser.id)
  } catch {}

  await setUserSession(newUser.id)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-ivory.vercel.app'
  
  // دالة رابط تفعيل الحساب لتوثيق الإيميل
  const verifyLink = `${siteUrl}/verify-account?token=${verifyToken}&email=${encodeURIComponent(email)}`

  await sendEmail({
    to: email,
    subject: 'أهلاً بك في منصة دارك — تأكيد حسابك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
            <h2 style="color: #101A2B;">مرحباً بك يا ${name} في عائلة دارك! 🏠</h2>
            <p>تم إنشاء حسابك بنجاح. لتأكيد بريدك الإلكتروني وتفعيل حسابك بالكامل، اضغط على الرابط التالي:</p>
            <div style="margin: 20px 0;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                تأكيد الحساب الآن
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">أو انسخ هذا الرابط: ${verifyLink}</p>
           </div>`,
  })

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
    .ilike('email', email)
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
            <p>لقد طلبت استرجاع كلمة المرور لحسابك في منصة دارك. استخدم كود التحقق التالي:</p>
            <div style="background: #f4f6f8; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <h1 style="color: #105C50; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 12px;">هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
           </div>`,
  })

  if (!emailSent) {
    return { success: false, error: 'تعذر إرسال البريد الإلكتروني حالياً، تأكد من إعدادات الإيميل.' }
  }

  return { success: true }
}

// ==========================================
// 6. التحقق من الـ OTP وتعيين كلمة سر جديدة
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
    .ilike('email', cleanEmail)
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
  const { data: users } = await supabase.from('users').select('id, name, email').ilike('email', cleanEmail).limit(1)

  const user = users?.[0]
  if (!user) return { success: false, error: 'لم يتم العثور على الحساب.' }

  const newHash = hashPassword(newPassword)
  const { error } = await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id)

  if (error) return { success: false, error: 'تعذر تحديث كلمة المرور، حاول مرة أخرى.' }

  try {
    await supabase.from('users').update({ otp_code: null, otp_expiry: null, is_verified: true }).eq('id', user.id)
  } catch {}

  const cookieStore = await cookies()
  cookieStore.delete('reset_otp_session')

  await sendEmail({
    to: user.email || cleanEmail,
    subject: 'تم تغيير كلمة المرور بنجاح - دارك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
            <h2 style="color: #101A2B;">أهلاً ${user.name || 'مستخدمنا العزيز'}</h2>
            <p>تم تغيير كلمة المرور الخاصة بحسابك في منصة دارك بنجاح. يمكنك الآن تسجيل الدخول.</p>
           </div>`,
  })

  return { success: true }
}

// ==========================================
// 7. توثيق الحساب من الرابط في الإيميل
// ==========================================
export async function verifyAccountAction(email: string, token: string): Promise<AuthResult> {
  const cleanEmail = normalizeEmail(email)
  const cleanToken = (token || '').trim()

  if (!cleanEmail || !cleanToken) return { success: false, error: 'رابط غير صالح.' }

  const supabase = await getSupabase()
  const { data: users } = await supabase.from('users').select('id, otp_code').ilike('email', cleanEmail).limit(1)
  const user = users?.[0]

  if (!user || user.otp_code !== cleanToken) {
    return { success: false, error: 'رابط التأكيد غير صالح أو منتهي الصلاحية.' }
  }

  await supabase.from('users').update({ is_verified: true, otp_code: null }).eq('id', user.id)
  return { success: true }
}

export async function getSessionUserAction() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { isLoggedIn: false, isAdmin: false, name: null, role: null }

    const supabase = await getSupabase()
    const { data: user } = await supabase.from('users').select('id, name, role').eq('id', sessionId).maybeSingle()

    if (!user) return { isLoggedIn: false, isAdmin: false, name: null, role: null }

    const role = String(user.role || 'user').toLowerCase().trim()
    const isAdmin = role === 'admin' || role === 'moderator'

    return { isLoggedIn: true, isAdmin, name: user.name || null, role }
  } catch {
    return { isLoggedIn: false, isAdmin: false, name: null, role: null }
  }
}