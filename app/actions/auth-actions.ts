'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

// دالة إرسال الإيميلات مع معالجة الأخطاء لمنع تعطل التسجيل
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    })

    await transporter.sendMail({
      from: `"دارك للعقارات" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Email sending failed (non-blocking):', error)
    return false
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false
  if (stored.startsWith('scrypt$')) {
    const [, salt, expected] = stored.split('$')
    const actual = scryptSync(password, salt, 64).toString('hex')
    return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  }
  const actual = createHash('sha256').update(password).digest('hex')
  return actual.length === stored.length && timingSafeEqual(Buffer.from(actual), Buffer.from(stored))
}

async function setUserSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')

  const isProd = process.env.NODE_ENV === 'production'

  cookieStore.set('user_session', userId, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: isProd, httpOnly: true })
  cookieStore.set('session_hint', '1', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: isProd })
}

export type AuthResult = { success: boolean; error?: string }

// ==========================================
// تسجيل الدخول
// ==========================================
export async function loginAction(formData: FormData): Promise<AuthResult> {
  const emailOrPhone = formData.get('emailOrPhone') as string
  const password = formData.get('password') as string

  if (!emailOrPhone || !password) {
    return { success: false, error: 'يرجى إدخال البريد الإلكتروني/الهاتف وكلمة المرور.' }
  }

  const supabase = await getSupabase()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash')
    .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
    .maybeSingle()

  if (error || !user) {
    return { success: false, error: 'بيانات الدخول غير صحيحة.' }
  }

  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'بيانات الدخول غير صحيحة.' }
  }

  await setUserSession(user.id)

  if (user.email) {
    sendEmail({
      to: user.email,
      subject: 'تنبيه أمني: تم تسجيل الدخول لحسابك في دارك',
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
              <h2 style="color: #101A2B;">أهلاً بك مجدداً يا ${user.name || 'مستخدمنا العزيز'}</h2>
              <p>تم تسجيل الدخول إلى حسابك بنجاح من متصفح جديد أو جلسة جديدة.</p>
             </div>`
    })
  }

  revalidatePath('/account', 'page')
  return { success: true }
}

// ==========================================
// إنشاء حساب جديد
// ==========================================
export async function registerAction(formData: FormData): Promise<AuthResult> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!name || !email || !phone || !password || password.length < 8) {
    return { success: false, error: 'يرجى ملء جميع الحقول وكلمة سر لا تقل عن 8 أحرف.' }
  }

  let formattedPhone = phone
  if (formattedPhone && !formattedPhone.startsWith('+20')) {
    formattedPhone = `+20${formattedPhone.replace(/^0+/, '')}`
  }

  const supabase = await getSupabase()
  
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${email},phone.eq.${formattedPhone}`)
    .maybeSingle()

  if (existingUser) {
    return { success: false, error: 'البريد الإلكتروني أو رقم الموبايل مستخدم بالفعل.' }
  }

  const hash = hashPassword(password)

  // حفظ المستخدم في الداتابيز بالأعمدة الأساسية فقط لضمان عدم حدوث خطأ
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ 
      name, 
      email, 
      phone: formattedPhone, 
      password_hash: hash
    })
    .select('id')
    .single()

  if (error || !newUser) {
    console.error('Supabase Register Error:', error)
    return { success: false, error: 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً.' }
  }

  // تسجيل الدخول مباشرة للعميل
  await setUserSession(newUser.id)

  // إرسال إيميل ترحيبي في الخلفية بدون تعطيل عملية التسجيل لو فشل
  sendEmail({
    to: email,
    subject: 'أهلاً بك في منصة دارك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
            <h2 style="color: #101A2B;">مرحباً بك يا ${name} في عائلة دارك! 🏠</h2>
            <p>يسعدنا انضمامك إلينا وتبدأ رحلتك العقارية معنا بكل سهولة.</p>
           </div>`
  })

  revalidatePath('/account', 'page')
  return { success: true }
}

// ==========================================
// استرجاع كلمة المرور
// ==========================================
export async function forgotPasswordAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  if (!email) return { success: false, error: 'يرجى إدخال الإيميل.' }

  const supabase = await getSupabase()
  const { data: user } = await supabase.from('users').select('id, name').eq('email', email).maybeSingle()

  if (!user) {
    return { success: true } 
  }

  const otp = generateOTP()
  const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  
  // حفظ الـ OTP مؤقتاً (تأكد من وجود عمود ffotp_code و otp_expiry أو تجاهله لو مش موجود)
  await supabase.from('users').update({ otp_code: otp, otp_expiry: expiry }).eq('id', user.id)

  sendEmail({
    to: email,
    subject: 'رمز استرجاع كلمة المرور - دارك',
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
            <h2 style="color: #101A2B;">أهلاً ${user.name || 'مستخدمنا'}</h2>
            <p>رمز استرجاع كلمة المرور الخاص بك هو:</p>
            <h1 style="color: #105C50; letter-spacing: 5px;">${otp}</h1>
           </div>`
  })

  return { success: true }
}