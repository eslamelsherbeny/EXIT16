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
  // إزالة أي مسافات من App Password الخاص بجوجل لضمان عدم فشل المصادقة على Vercel
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

// إرجاع كل الصيغ المحتملة لرقم الموبايل لضمان عدم حدوث تعارض بين 010 و +2010
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

// توقيع ذكي للـ OTP لضمان عمله حتى لو لم توجد أعمدة otp_code في قاعدة البيانات
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
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')

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
// 3. تسجيل الدخول (مع إرسال إيميل تنبيه دخول)
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
    // استخدام await ضروري على Vercel لضمان إرسال الإيميل قبل إغلاق الـ Serverless Function
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

  revalidatePath('/account', 'page')
  return { success: true }
}

// ==========================================
// 4. إنشاء حساب جديد (مع فحص دقيق للتكرار وإرسال رابط تأكيد)
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

  // فحص الإيميل والموبايل بشكل منفصل لمعرفة سبب التكرار بالضبط وتجنب خطأ maybeSingle
  const [{ data: existingEmails }, { data: existingPhones }] = await Promise.all([
    supabase.from('users').select('id').ilike('email', email).limit(1),
    supabase.from('users').select('id').in('phone', phoneVariants).limit(1),
  ])

  const emailTaken = (existingEmails?.length || 0) > 0
  const phoneTaken = (existingPhones?.length || 0) > 0

  if (emailTaken && phoneTaken) {
    return { success: false, error: 'البريد الإلكتروني ورقم الموبايل مسجلان بالفعل. يرجى تسجيل الدخول أو تغييرهما معاً.' }
  }
  if (emailTaken) {
    return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول.' }
  }
  if (phoneTaken) {
    return { success: false, error: 'رقم الموبايل هذا مسجل بالفعل. يرجى استخدام رقم آخر أو تسجيل الدخول.' }
  }

  const hash = hashPassword(password)
  const verifyToken = randomBytes(24).toString('hex')

  // إدراج بالأعمدة الأساسية لضمان عدم فشل الـ Insert
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
    console.error('Supabase Register Error:', error)
    return { success: false, error: 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً.' }
  }

  // محاولة حفظ التوكن لو العمود موجود في الداتابيز (بدون تعطيل لو غير موجود)
  try {
    await supabase.from('users').update({ otp_code: verifyToken, is_verified: false }).eq('id', newUser.id)
  } catch {}

  await setUserSession(newUser.id)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-ivory.vercel.app'
  const verifyLink = `${siteUrl}/login?verified=1&email=${encodeURIComponent(email)}&token=${verifyToken}`

  // إرسال إيميل الترحيب مع رابط تأكيد الحساب
  await sendEmail({
    to: email,
    subject: 'أهلاً بك في منصة دارك — تأكيد حسابك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
            <h2 style="color: #101A2B;">مرحباً بك يا ${name} في عائلة دارك! 🏠</h2>
            <p>تم إنشاء حسابك بنجاح. لتأكيد بريدك الإلكتروني وتفعيل حسابك بالكامل، اضغط على الزر التالي:</p>
            <div style="margin: 20px 0;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                تأكيد الحساب الآن
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.</p>
           </div>`,
  })

  revalidatePath('/account', 'page')
  return { success: true }
}

// ==========================================
// 5. استرجاع كلمة المرور (إرسال OTP)
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
  const expiresAt = Date.now() + 15 * 60 * 1000 // صالح لمدة 15 دقيقة
  const expiryIso = new Date(expiresAt).toISOString()

  // 1) حفظ توقيع الـ OTP في كوكي آمنة لضمان عمل التحقق 100% حتى لو أعمدة الـ OTP غير موجودة في جدول users
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

  // 2) محاولة حفظه أيضاً في قاعدة البيانات (إن وجدت الأعمدة)
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
    return { success: false, error: 'تعذر إرسال البريد الإلكتروني حالياً، تأكد من إعدادات الإيميل وحاول مجدداً.' }
  }

  return { success: true }
}

// ==========================================
// 6. التحقق من صحة كود الـ OTP
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

  // التحقق أولاً عبر الكوكي المشفرة
  const cookieStore = await cookies()
  const otpCookie = cookieStore.get('reset_otp_session')?.value
  const cookieCheck = verifySignedOtpToken(cleanEmail, cleanOtp, otpCookie)

  if (cookieCheck.expired) {
    return { success: false, error: 'الكود منتهي الصلاحية، يرجى طلب كود جديد.' }
  }

  if (cookieCheck.valid) {
    return { success: true }
  }

  // التحقق الاحتياطي عبر قاعدة البيانات (إذا كان العمود موجوداً)
  if (user.otp_code && String(user.otp_code).trim() === cleanOtp) {
    if (user.otp_expiry && new Date(user.otp_expiry) < new Date()) {
      return { success: false, error: 'الكود منتهي الصلاحية، يرجى طلب كود جديد.' }
    }
    return { success: true }
  }

  return { success: false, error: 'كود التحقق غير صحيح.' }
}

// ==========================================
// 7. تعيين كلمة مرور جديدة بعد التحقق من الكود
// ==========================================

export async function resetPasswordAction(email: string, otp: string, newPassword: string): Promise<AuthResult> {
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = (otp || '').trim()

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'كلمة السر يجب أن تكون 8 أحرف على الأقل.' }
  }

  // التأكد من صحة الـ OTP أولاً
  const otpVerification = await verifyOtpAction(cleanEmail, cleanOtp)
  if (!otpVerification.success) {
    return otpVerification
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .ilike('email', cleanEmail)
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return { success: false, error: 'لم يتم العثور على الحساب.' }
  }

  const newHash = hashPassword(newPassword)

  // تحديث عمود password_hash فقط أولاً لضمان عدم فشل التحديث لو أعمدة otp_code غير موجودة
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', user.id)

  if (error) {
    console.error('Reset Password Update Error:', error)
    return { success: false, error: 'تعذر تحديث كلمة المرور، حاول مرة أخرى.' }
  }

  // محاولة تصفير الكود في الداتابيز بشكل منفصل وآمن
  try {
    await supabase
      .from('users')
      .update({ otp_code: null, otp_expiry: null, is_verified: true })
      .eq('id', user.id)
  } catch {}

  // مسح كوكي الـ OTP بعد الاستخدام
  const cookieStore = await cookies()
  cookieStore.delete('reset_otp_session')

  // إرسال إيميل تأكيد بتغيير كلمة المرور
  await sendEmail({
    to: user.email || cleanEmail,
    subject: 'تم تغيير كلمة المرور بنجاح - دارك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
            <h2 style="color: #101A2B;">أهلاً ${user.name || 'مستخدمنا العزيز'}</h2>
            <p>تم تغيير كلمة المرور الخاصة بحسابك في منصة دارك بنجاح.</p>
            <p>يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</p>
           </div>`,
  })

  return { success: true }
}
// ==========================================
// فحص جلسة المستخدم وصلاحية الأدمن للهيدر
// ==========================================
export async function getSessionUserAction() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value

    if (!sessionId) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const role = String(user.role || 'user').toLowerCase().trim()
    const isAdmin = role === 'admin' || role === 'moderator'

    return {
      isLoggedIn: true,
      isAdmin,
      name: user.name || null,
      role,
    }
  } catch {
    return { isLoggedIn: false, isAdmin: false, name: null, role: null }
  }
}