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
import { normalizeLocale, type LocaleCode } from '@/lib/i18n-config'

const AUTH_MESSAGES: Record<LocaleCode, Record<string, string>> = {
  ar: {
    turnstile: 'يرجى إتمام التحقق الأمني (Cloudflare) والمحاولة مرة أخرى.',
    missingLogin: 'يرجى إدخال البريد الإلكتروني/الهاتف وكلمة المرور.',
    notRegistered:
      'هذا البريد الإلكتروني أو رقم الموبايل غير مسجل لدينا. يمكنك إنشاء حساب جديد.',
    wrongPassword:
      'كلمة السر غير صحيحة. جرب مرة أخرى أو اضغط على "نسيت كلمة السر؟".',
    suspended: 'تم إيقاف هذا الحساب مؤقتاً من قِبل إدارة المنصة.',
    noAdminAccess:
      'هذا الحساب لا يمتلك صلاحيات الإدارة. يرجى تسجيل الدخول بحساب مدير النظام.',
    fillAllRegister: 'يرجى ملء جميع الحقول وكلمة سر لا تقل عن 8 أحرف.',
    emailExists: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.',
    phoneExists: 'رقم الموبايل هذا مسجل بالفعل. يرجى تسجيل الدخول.',
    registerFailed: 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً.',
    enterEmail: 'يرجى إدخال البريد الإلكتروني.',
    emailNotFound: 'هذا البريد الإلكتروني غير مسجل لدينا.',
    emailSendFailed: 'تعذر إرسال البريد الإلكتروني حالياً.',
    enterValidOtp: 'يرجى إدخال الكود بشكل صحيح.',
    otpExpired: 'الكود منتهي الصلاحية، يرجى طلب كود جديد.',
    invalidOtp: 'كود التحقق غير صحيح.',
    shortPassword: 'كلمة السر يجب أن تكون 8 أحرف على الأقل.',
    updatePassFailed: 'تعذر تحديث كلمة المرور في قاعدة البيانات.',
    invalidLink: 'رابط غير صالح.',
    accountNotFound: 'الحساب غير موجود.',
  },
  en: {
    turnstile: 'Please complete the security check (Cloudflare) and try again.',
    missingLogin: 'Please enter your email/phone and password.',
    notRegistered:
      'This email or phone number is not registered. You can create a new account.',
    wrongPassword:
      'Incorrect password. Please try again or click "Forgot password?".',
    suspended: 'This account has been temporarily suspended by administration.',
    noAdminAccess:
      'This account does not have admin privileges. Please sign in with an Admin account.',
    fillAllRegister:
      'Please fill in all fields and use a password of at least 8 characters.',
    emailExists: 'This email is already registered. Please sign in.',
    phoneExists: 'This phone number is already registered. Please sign in.',
    registerFailed: 'Could not create account, please try again later.',
    enterEmail: 'Please enter your email address.',
    emailNotFound: 'This email address is not registered with us.',
    emailSendFailed: 'Could not send email at the moment.',
    enterValidOtp: 'Please enter a valid verification code.',
    otpExpired: 'Verification code has expired, please request a new one.',
    invalidOtp: 'Incorrect verification code.',
    shortPassword: 'Password must be at least 8 characters long.',
    updatePassFailed: 'Could not update password in the database.',
    invalidLink: 'Invalid link.',
    accountNotFound: 'Account not found.',
  },
  ru: {
    turnstile:
      'Пожалуйста, пройдите проверку безопасности (Cloudflare) и попробуйте снова.',
    missingLogin: 'Пожалуйста, введите email/телефон и пароль.',
    notRegistered:
      'Этот email или телефон не зарегистрирован. Вы можете создать новый аккаунт.',
    wrongPassword:
      'Неверный пароль. Попробуйте снова или нажмите «Забыли пароль?».',
    suspended: 'Этот аккаунт временно приостановлен администрацией.',
    noAdminAccess:
      'У этого аккаунта нет прав администратора. Войдите под аккаунтом администратора.',
    fillAllRegister:
      'Заполните все поля (пароль должен содержать минимум 8 символов).',
    emailExists: 'Этот email уже зарегистрирован. Пожалуйста, войдите.',
    phoneExists: 'Этот номер телефона уже зарегистрирован. Пожалуйста, войдите.',
    registerFailed: 'Не удалось создать аккаунт, попробуйте позже.',
    enterEmail: 'Пожалуйста, введите ваш email.',
    emailNotFound: 'Этот email не зарегистрирован в системе.',
    emailSendFailed: 'Не удалось отправить письмо в данный момент.',
    enterValidOtp: 'Пожалуйста, введите корректный код подтверждения.',
    otpExpired: 'Срок действия кода истек, запросите новый код.',
    invalidOtp: 'Неверный код подтверждения.',
    shortPassword: 'Пароль должен содержать минимум 8 символов.',
    updatePassFailed: 'Не удалось обновить пароль в базе данных.',
    invalidLink: 'Недействительная ссылка.',
    accountNotFound: 'Аккаунт не найден.',
  },
  ka: {
    turnstile: 'გთხოვთ გაიაროთ უსაფრთხოების შემოწმება (Cloudflare).',
    missingLogin: 'გთხოვთ შეიყვანოთ ელ.ფოსტა/ტელეფონი და პაროლი.',
    notRegistered:
      'ეს ელ.ფოსტა ან ნომერი არ არის რეგისტრირებული. შეგიძლიათ შექმნათ ახალი ანგარიში.',
    wrongPassword:
      'პაროლი არასწორია. სცადეთ თავიდან ან დააჭირეთ „დაგავიწყდათ პაროლი?“.',
    suspended: 'ეს ანგარიში დროებით შეჩერებულია ადმინისტრაციის მიერ.',
    noAdminAccess:
      'ამ ანგარიშს არ აქვს ადმინისტრატორის უფლებები. გთხოვთ შეხვიდეთ ადმინის ანგარიშით.',
    fillAllRegister:
      'შეავსეთ ყველა ველი (პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს).',
    emailExists: 'ეს ელ.ფოსტა უკვე რეგისტრირებულია. გთხოვთ შეხვიდეთ.',
    phoneExists: 'ეს ნომერი უკვე რეგისტრირებულია. გთხოვთ შეხვიდეთ.',
    registerFailed: 'ანგარიშის შექმნა ვერ მოხერხდა, სცადეთ მოგვიანებით.',
    enterEmail: 'გთხოვთ შეიყვანოთ ელ.ფოსტა.',
    emailNotFound: 'ეს ელ.ფოსტა არ არის რეგისტრირებული.',
    emailSendFailed: 'წერილის გაგზავნა ვერ მოხერხდა.',
    enterValidOtp: 'გთხოვთ შეიყვანოთ სწორი კოდი.',
    otpExpired: 'კოდის ვადა გავიდა, გთხოვთ მოითხოვოთ ახალი.',
    invalidOtp: 'დადასტურების კოდი არასწორია.',
    shortPassword: 'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს.',
    updatePassFailed: 'პაროლის განახლება ვერ მოხერხდა.',
    invalidLink: 'არასწორი ბმული.',
    accountNotFound: 'ანგარიში ვერ მოიძებნა.',
  },
}

async function getActionMsg() {
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get('locale')?.value)
  return AUTH_MESSAGES[locale] || AUTH_MESSAGES.ar
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
}: {
  to: string
  subject: string
  html: string
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
      from: `"Aqar Exit - عقار إكزت" <${user}>`,
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
  const digits = sanitizeInput(rawPhone, 30)
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
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
  const msg = await getActionMsg()
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
      .ilike('email', `%${cleanEmail}%`)
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
      subject: 'تنبيه أمني: تم تسجيل الدخول لحسابك في دارك',
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
              <h2 style="color: #101A2B;">أهلاً بك مجدداً يا ${matchedUser.name || 'مستخدمنا العزيز'} 👋</h2>
              <p>تم تسجيل الدخول إلى حسابك في <strong>منصة دارك</strong> بنجاح.</p>
             </div>`,
    }).catch(() => {})
  }

  const targetRedirect =
    nextUrl && nextUrl.startsWith('/') ? nextUrl : '/account'

  return {
    success: true,
    redirectTo: targetRedirect,
  }
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const msg = await getActionMsg()
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
  const country = sanitizeInput(formData.get('country') || 'EG', 5).toUpperCase()

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://next-js-rtl-platform-structure.vercel.app'
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

export async function forgotPasswordAction(
  formData: FormData
): Promise<AuthResult> {
  const msg = await getActionMsg()
  const email = normalizeEmail(String(formData.get('email') || ''))

  if (!email) {
    return { success: false, error: msg.enterEmail }
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
    return { success: false, error: msg.emailSendFailed }
  }

  return { success: true }
}

export async function verifyOtpAction(
  email: string,
  otp: string
): Promise<AuthResult> {
  const msg = await getActionMsg()
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = sanitizeInput(otp, 10)

  if (!cleanEmail || !cleanOtp) {
    return { success: false, error: msg.enterValidOtp }
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
  const msg = await getActionMsg()
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
    .ilike('email', `%${cleanEmail}%`)
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
      .ilike('email', `%${cleanEmail}%`)
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
  const msg = await getActionMsg()
  const cleanEmail = normalizeEmail(email)
  if (!cleanEmail) return { success: false, error: msg.invalidLink }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('id, otp_code')
    .ilike('email', `%${cleanEmail}%`)
    .order('created_at', { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) return { success: false, error: msg.accountNotFound }

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
    if (!rawSession || !candidateUserId)
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role, status, password_hash')
      .eq('id', candidateUserId)
      .maybeSingle()

    if (!user)
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }

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
