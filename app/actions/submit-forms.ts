'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

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

async function sendNotificationEmail({
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
      from: `"عقار إكزت - Aqar Exit" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Notification email error:', error)
    return false
  }
}

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function number(formData: FormData, key: string, fallback = 0) {
  const rawValue = text(formData, key).replace(/,/g, '')
  if (!rawValue) return fallback
  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function integer(formData: FormData, key: string, fallback = 0) {
  const rawValue = text(formData, key).replace(/,/g, '')
  if (!rawValue) return fallback
  const value = Number.parseInt(rawValue, 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function list(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase()
}

function getPhoneVariants(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return []
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return Array.from(new Set([digits, `0${stripped}`, `+20${stripped}`]))
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return ''
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return `+20${stripped}`
}

function generateOrderRef(id?: string) {
  if (id) {
    const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (clean.length >= 6) return `AE-${clean.slice(0, 6)}`
  }
  return `AE-${randomBytes(3).toString('hex').toUpperCase()}`
}

function createMagicToken(userId: string, unitId: string, expiresAt: number) {
  const secret =
    process.env.EMAIL_PASS ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'darak-secret-key'
  const payload = `${userId}:${unitId}:${expiresAt}`
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export async function verifyMagicTokenAction(token: string) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [userId, unitId, expiresStr, sig] = decoded.split(':')
    const expiresAt = Number(expiresStr)
    if (!userId || !expiresAt || Date.now() > expiresAt) {
      return { valid: false, error: 'الرابط منتهي الصلاحية.' }
    }

    const secret =
      process.env.EMAIL_PASS ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'darak-secret-key'
    const expectedSig = createHmac('sha256', secret)
      .update(`${userId}:${unitId}:${expiresAt}`)
      .digest('hex')

    if (sig !== expectedSig) return { valid: false, error: 'رابط غير صالح.' }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', unitId)
      .maybeSingle()

    await setUserSession(userId)

    return {
      valid: true,
      userId,
      unitId,
      unit,
    }
  } catch {
    return { valid: false, error: 'تعذر التحقق من الرابط.' }
  }
}

export type SubmitResult = {
  success: boolean
  error?: string
  unitId?: string
  orderRef?: string
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
    const actual = createHash('sha256').update(password).digest('hex')
    if (
      actual.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(actual), Buffer.from(cleanStored))
    ) {
      return true
    }
    return cleanStored === password || cleanStored === cleanPass
  } catch {
    return false
  }
}

// ==========================================
// أ) جلب بيانات المستخدم المسجل حالياً لخيار "كمّل بحسابك الحالي"
// ==========================================
export async function getCurrentSellerProfileAction() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { isLoggedIn: false, user: null }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) return { isLoggedIn: false, user: null }
    return { isLoggedIn: true, user }
  } catch {
    return { isLoggedIn: false, user: null }
  }
}

// ==========================================
// ب) الدالة الذكية للخطوة الثانية (تتعامل مع كل حالات الحسابات وتنشئ الطلب المبدئي)
// ==========================================
export type Step2AuthResponse = {
  status:
    | 'ok'
    | 'email_exists_need_password'
    | 'phone_exists_different_email'
    | 'error'
  userId?: string
  unitId?: string
  orderRef?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  error?: string
}

export async function processSellerStep2Action(payload: {
  mode: 'session' | 'login' | 'register'
  developer: string
  project: string
  contractPrice: number
  paidAmount: number
  marketPrice?: number
  name?: string
  phone?: string
  email?: string
  password?: string
  loginIdentifier?: string
  existingUnitId?: string
}): Promise<Step2AuthResponse> {
  try {
    const supabase = await getSupabase()
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'

    // دالة داخلية لحفظ أو تحديث الوحدة المبدئية في قاعدة البيانات فور انتهاء الخطوة 2
    async function upsertDraftUnit(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const unitData: Record<string, any> = {
        user_id: userId,
        developer_name: payload.developer || null,
        project_name: payload.project || null,
        contract_price: Number(payload.contractPrice) || 0,
        paid_amount: Number(payload.paidAmount) || 0,
        market_price:
          Number(payload.marketPrice) || Number(payload.contractPrice) || 0,
        name: contact.name || 'مالك الوحدة',
        phone: contact.phone,
        email: contact.email || null,
        is_original_owner: true,
        status: 'pending',
      }

      if (payload.existingUnitId) {
        await supabase
          .from('sell_requests')
          .update(unitData)
          .eq('id', payload.existingUnitId)
        return payload.existingUnitId
      }

      const { data: inserted } = await supabase
        .from('sell_requests')
        .insert(unitData)
        .select('id')
        .single()

      const newUnitId = inserted?.id ? String(inserted.id) : ''

      // إرسال إشعار للإدارة وللبائع
      try {
        await supabase.from('notifications').insert([
          {
            user_id: null,
            title: `عقار جديد بانتظار استكمال البيانات: ${payload.project || 'وحدة سكنية'}`,
            message: `المالك: ${contact.name} · المدفوع: ${Number(payload.paidAmount || 0).toLocaleString('en-US')} ج.م`,
            type: 'property',
            link: '/admin/properties',
            is_read: false,
          },
          {
            user_id: userId,
            title: 'تم تسجيل طلب عرض وحدتك بنجاح 🏠',
            message: `استلمنا البيانات الأساسية لوحدتك في (${payload.project || 'مشروعك'}). يمكنك استكمال باقي التفاصيل في أي وقت.`,
            type: 'status_update',
            link: '/account?view=seller',
            is_read: false,
          },
        ])
      } catch {}

      return newUnitId
    }

    // إرسال إيميل تأكيد الطلب مع الرابط السحري للعودة للخطوة 3 مباشرة بدون باسورد
    async function sendOrderConfirmationMagicEmail(
      userId: string,
      unitId: string,
      userName: string,
      userEmail: string
    ) {
      if (!userEmail || !unitId) return
      const orderRef = generateOrderRef(unitId)
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // صالح لمدة 7 أيام
      const magicToken = createMagicToken(userId, unitId, expiresAt)
      const magicLink = `${siteUrl}/sell?magic=${encodeURIComponent(magicToken)}`
      const paidFormatted = Number(payload.paidAmount || 0).toLocaleString('en-US')

      await sendNotificationEmail({
        to: userEmail,
        subject: `وصلنا طلبك ${orderRef} — عقار إكزت`,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.8; color: #0a1122;">
                <p style="font-size: 16px;">أهلاً <strong>${userName}</strong>،</p>
                <p>وصلنا طلبك — رقم الطلب: <strong>${orderRef}</strong>.</p>
                <p>للتأكيد: المبلغ اللي هتستلمه عند إتمام التنازل هو <strong>${paidFormatted} ج.م</strong> — اللي دفعته بالظبط، بدون أي أوفر.</p>
                <p>كمّل بيانات وحدتك من اللينك ده — مش محتاج كلمة سر ولا تسجيل دخول:</p>
                <p style="margin: 18px 0;">
                  <a href="${magicLink}" style="color: #0b6954; font-weight: bold; word-break: break-all;">${magicLink}</a>
                </p>
                <p>ضفنا الطلب ده على الوحدة اللي عندك عندنا، فمفيش أي بيانات ضاعت.</p>
                <p>محتاج حاجة؟ كلمنا واتساب: <a href="https://wa.me/201018595959">https://wa.me/201018595959</a></p>
               </div>`,
      }).catch(() => {})
    }

    // =====================================================
    // الحالة 1: العميل اختار "كمّل بحسابي المسجل حالياً"
    // =====================================================
    if (payload.mode === 'session') {
      const cookieStore = await cookies()
      const sessionId = cookieStore.get('user_session')?.value
      if (!sessionId) {
        return { status: 'error', error: 'انتهت الجلسة، يرجى تسجيل الدخول.' }
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('id', sessionId)
        .maybeSingle()

      if (!currentUser) {
        return { status: 'error', error: 'لم يتم العثور على بيانات الحساب.' }
      }

      const unitId = await upsertDraftUnit(currentUser.id, {
        name: currentUser.name || 'مالك الوحدة',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      })

      const orderRef = generateOrderRef(unitId)
      if (currentUser.email) {
        sendOrderConfirmationMagicEmail(
          currentUser.id,
          unitId,
          currentUser.name || 'عميلنا العزيز',
          currentUser.email
        )
      }

      return {
        status: 'ok',
        userId: currentUser.id,
        unitId,
        orderRef,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: currentUser.phone,
      }
    }

    // =====================================================
    // الحالة 2: العميل اختار تبويب "عندي حساب بالفعل" (تسجيل دخول مباشر)
    // =====================================================
    if (payload.mode === 'login') {
      const rawIdentifier = (payload.loginIdentifier || '').trim()
      const password = payload.password || ''

      if (!rawIdentifier || !password) {
        return {
          status: 'error',
          error: 'يرجى إدخال البريد الإلكتروني/الموبايل وكلمة السر.',
        }
      }

      let candidates: any[] = []
      if (rawIdentifier.includes('@')) {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash')
          .ilike('email', normalizeEmail(rawIdentifier))
        candidates = data || []
      } else {
        const variants = getPhoneVariants(rawIdentifier)
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash')
          .in('phone', variants)
        candidates = data || []
      }

      if (candidates.length === 0) {
        return {
          status: 'error',
          error: 'هذا الحساب غير مسجل لدينا. اختر "بيانات جديدة" لإنشاء حسابك.',
        }
      }

      const matched = candidates.find((u) =>
        verifyPassword(password, u.password_hash)
      )
      if (!matched) {
        return {
          status: 'error',
          error: 'كلمة السر غير صحيحة. جرب مرة أخرى أو اضغط على نسيت كلمة السر.',
        }
      }

      await setUserSession(matched.id)
      const unitId = await upsertDraftUnit(matched.id, {
        name: matched.name || 'مالك الوحدة',
        phone: matched.phone || '',
        email: matched.email || '',
      })

      const orderRef = generateOrderRef(unitId)
      if (matched.email) {
        sendOrderConfirmationMagicEmail(
          matched.id,
          unitId,
          matched.name || 'عميلنا العزيز',
          matched.email
        )
      }

      return {
        status: 'ok',
        userId: matched.id,
        unitId,
        orderRef,
        userName: matched.name,
        userEmail: matched.email,
        userPhone: matched.phone,
      }
    }

    // =====================================================
    // الحالة 3: الوضع الافتراضي (إدخال الاسم + الموبايل + الإيميل + الباسورد)
    // =====================================================
    // =====================================================
    // الحالة 3: الوضع الافتراضي (تسجيل بيانات جديدة)
    // =====================================================
    const cleanName = (payload.name || '').trim()
    const cleanEmail = normalizeEmail(payload.email || '')
    const formattedPhone = formatPrimaryPhone(payload.phone || '')
    const phoneVariants = getPhoneVariants(payload.phone || '')
    const password = payload.password || ''

    if (!cleanName || !cleanEmail || !formattedPhone || password.length < 8) {
      return {
        status: 'error',
        error: 'يرجى إكمال كافة الحقول وكلمة سر 8 حروف على الأقل.',
      }
    }

    const [{ data: emailMatches }, { data: phoneMatches }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash')
        .ilike('email', `%${cleanEmail}%`)
        .limit(1),
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash')
        .in('phone', phoneVariants)
        .limit(1),
    ])

    const emailUser = emailMatches?.[0] || null
    const phoneUser = phoneMatches?.[0] || null

    // أ) إذا كان الإيميل مسجلاً بالفعل -> نحفظ الطلب ونرسل الإيميل ونظهر شاشة "الإيميل ده عنده حساب بالفعل" دائماً
    if (emailUser) {
      const unitId = await upsertDraftUnit(emailUser.id, {
        name: cleanName || emailUser.name,
        phone: emailUser.phone || formattedPhone,
        email: emailUser.email,
      })
      const orderRef = generateOrderRef(unitId)

      // إرسال الإيميل الفوري بالرابط السحري المباشر (الصورة 2)
      await sendOrderConfirmationMagicEmail(
        emailUser.id,
        unitId,
        cleanName || emailUser.name || 'عميلنا العزيز',
        emailUser.email
      )

      // إرجاع حالة وجود الإيميل دائماً لإظهار شاشة إدخال كلمة السر (الصورة 1)
      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        unitId,
        orderRef,
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

    // ب) إذا كان رقم الموبايل مسجلاً بالفعل ولكن بإيميل مختلف! (الصورة 3 و 4)
    if (phoneUser && !emailUser) {
      const unitId = await upsertDraftUnit(phoneUser.id, {
        name: cleanName || phoneUser.name,
        phone: phoneUser.phone,
        email: phoneUser.email,
      })
      const orderRef = generateOrderRef(unitId)

      if (phoneUser.email) {
        await sendOrderConfirmationMagicEmail(
          phoneUser.id,
          unitId,
          cleanName || phoneUser.name || 'عميلنا العزيز',
          phoneUser.email
        )
      }

      return {
        status: 'phone_exists_different_email',
        userId: phoneUser.id,
        unitId,
        orderRef,
        userEmail: phoneUser.email,
        userPhone: phoneUser.phone,
      }
    }

    // ج) مستخدم جديد تماماً -> إنشاء الحساب + حفظ الوحدة المبدئية + الدخول للخطوة 3 فوراً
    const hash = hashPassword(password)
    const { data: createdUser, error: createErr } = await supabase
      .from('users')
      .insert({
        name: cleanName,
        phone: formattedPhone,
        email: cleanEmail,
        password_hash: hash,
        status: 'active',
      })
      .select('id, name, email, phone')
      .single()

    if (createErr || !createdUser) {
      return {
        status: 'error',
        error: 'تعذر إنشاء الحساب حالياً، يرجى المحاولة مرة أخرى.',
      }
    }

    await setUserSession(createdUser.id)
    const unitId = await upsertDraftUnit(createdUser.id, {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
    })
    const orderRef = generateOrderRef(unitId)

    await sendOrderConfirmationMagicEmail(
      createdUser.id,
      unitId,
      cleanName,
      cleanEmail
    )

    return {
      status: 'ok',
      userId: createdUser.id,
      unitId,
      orderRef,
      userName: createdUser.name,
      userEmail: createdUser.email,
      userPhone: createdUser.phone,
    } } catch (e) {
    console.error('processSellerStep2Action error:', e)
    return { status: 'error', error: 'حدث خطأ غير متوقع.' }
  }
}

// ==========================================
// ج) التحقق من كلمة السر في شاشة "الإيميل ده عنده حساب بالفعل" (الصورة 1)
// ==========================================
export async function verifyExistingEmailPasswordAction(payload: {
  email: string
  password: string
}) {
  try {
    const supabase = await getSupabase()
    const cleanEmail = normalizeEmail(payload.email)
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash')
      .ilike('email', cleanEmail)

    const matched = (users || []).find((u) =>
      verifyPassword(payload.password, u.password_hash)
    )

    if (!matched) {
      return {
        success: false,
        error: 'كلمة السر غير صحيحة. جرب تاني أو اضغط على نسيت كلمة السر؟',
      }
    }

    await setUserSession(matched.id)
    return {
      success: true,
      user: {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
      },
    }
  } catch {
    return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول.' }
  }
}

// ==========================================
// د) إرسال لينك استرجاع/تعيين كلمة السر على الإيميل المسجل (الصورة 3 و 4 و 6)
// ==========================================
export async function sendSellerRecoveryLinkAction(payload: {
  userId?: string
  email?: string
  unitId?: string
}) {
  try {
    const supabase = await getSupabase()
    let targetUser: any = null

    if (payload.userId) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', payload.userId)
        .maybeSingle()
      targetUser = data
    } else if (payload.email) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .ilike('email', normalizeEmail(payload.email))
        .limit(1)
      targetUser = data?.[0]
    }

    if (!targetUser || !targetUser.email) {
      return { success: false, error: 'لم يتم العثور على بريد إلكتروني مسجل.' }
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'
    const expiresAt = Date.now() + 60 * 60 * 1000 // صالح لمدة ساعة
    const tokenHash = createMagicToken(
      targetUser.id,
      payload.unitId || '',
      expiresAt
    )

    const nextUrl = payload.unitId
      ? `/sell?magic=${encodeURIComponent(tokenHash)}`
      : '/account'
    const resetLink = `${siteUrl}/set-password?token_hash=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(nextUrl)}`

    await sendNotificationEmail({
      to: targetUser.email,
      subject: 'استرجاع كلمة السر — عقار إكزت',
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.8; color: #0a1122;">
              <p>اختار كلمة سر جديدة لحسابك من هنا (الرابط صالح لمدة محدودة):</p>
              <p style="margin: 18px 0;">
                <a href="${resetLink}" style="color: #0b6954; font-weight: bold; word-break: break-all;">${resetLink}</a>
              </p>
              <p style="color: #64748b; font-size: 13px;">لو مش انت اللي طلبت ده، تجاهل الرسالة دي.</p>
             </div>`,
    })

    return { success: true }
  } catch {
    return { success: false, error: 'تعذر إرسال الرابط حالياً.' }
  }
}

// ==========================================
// هـ) تعيين كلمة السر الجديدة من صفحة /set-password (الصورة 7: فعّل حسابك)
// ==========================================
export async function setNewPasswordFromTokenAction(payload: {
  tokenHash: string
  newPassword: string
}) {
  try {
    if (!payload.newPassword || payload.newPassword.length < 8) {
      return {
        success: false,
        error: 'كلمة السر يجب أن تكون 8 حروف على الأقل.',
      }
    }

    const verify = await verifyMagicTokenAction(payload.tokenHash)
    if (!verify.valid || !verify.userId) {
      return {
        success: false,
        error: verify.error || 'الرابط غير صالح أو منتهي الصلاحية.',
      }
    }

    const supabase = await getSupabase()
    const newHash = hashPassword(payload.newPassword)

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newHash, is_verified: true, status: 'active' })
      .eq('id', verify.userId)

    if (error) {
      return { success: false, error: 'تعذر تحديث كلمة السر.' }
    }

    await setUserSession(verify.userId)

    return {
      success: true,
      unitId: verify.unitId,
    }
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع.' }
  }
}

// ==========================================
// و) حفظ التقدم وإرسال الطلب النهائي
// ==========================================
export async function saveSellProgress(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const sessionId = (await cookies()).get('user_session')?.value
    const unitId = text(formData, 'unit_id')

    if (!sessionId && !unitId) {
      return {
        success: false,
        error: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.',
      }
    }

    const payload: Record<string, any> = {
      developer_name: text(formData, 'developer_name') || null,
      project_name: text(formData, 'project_name') || null,
      area: text(formData, 'area') || null,
      unit_type: text(formData, 'unit_type') || null,
      size: number(formData, 'size'),
      rooms: number(formData, 'rooms'),
      bathrooms: number(formData, 'bathrooms'),
      finishing: text(formData, 'finishing') || null,
      delivery_status: text(formData, 'delivery_status') || null,
      description: text(formData, 'description') || null,
      contract_price: number(formData, 'contract_price'),
      paid_amount: number(formData, 'paid_amount'),
      market_price: number(formData, 'market_price'),
      installment_amount: number(formData, 'installment_amount'),
      installment_frequency: text(formData, 'installment_frequency') || null,
      contract_year: integer(formData, 'contract_year'),
      images: list(formData, 'image'),
    }

    let targetUnitId = unitId

    if (!targetUnitId && sessionId) {
      const { data: existing } = await supabase
        .from('sell_requests')
        .select('id')
        .eq('user_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      targetUnitId = existing?.id ? String(existing.id) : ''
    }

    if (!targetUnitId) {
      return { success: false, error: 'لم يتم العثور على طلب البيع الحالي.' }
    }

    const { error } = await supabase
      .from('sell_requests')
      .update(payload)
      .eq('id', targetUnitId)

    revalidatePath('/account', 'page')
    return error
      ? { success: false, error: 'تعذر حفظ التقدم.' }
      : { success: true, unitId: targetUnitId }
  } catch {
    return { success: false, error: 'تعذر حفظ التقدم.' }
  }
}

export async function submitSellRequest(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    const existingUnitId = text(formData, 'unit_id')
    const projectName = text(formData, 'project_name')

    const payload: Record<string, any> = {
      project_name: projectName || null,
      developer_name: text(formData, 'developer_name') || null,
      area: text(formData, 'area') || null,
      unit_type: text(formData, 'unit_type') || null,
      size: number(formData, 'size'),
      rooms: number(formData, 'rooms'),
      bathrooms: number(formData, 'bathrooms'),
      floor_number: number(formData, 'floor_number'),
      garden_size: number(formData, 'garden_size'),
      finishing: text(formData, 'finishing') || null,
      delivery_status: text(formData, 'delivery_status') || null,
      features: list(formData, 'feature'),
      description: text(formData, 'description') || null,
      contract_price: number(formData, 'contract_price'),
      paid_amount: number(formData, 'paid_amount'),
      market_price: number(formData, 'market_price'),
      installment_amount: number(formData, 'installment_amount'),
      years_left: integer(formData, 'years_left'),
      contract_year: integer(formData, 'contract_year'),
      installment_frequency: text(formData, 'installment_frequency') || null,
      has_annual_installment: formData.get('has_annual_installment') === 'on',
      willing_to_discount: formData.get('willing_to_discount') === 'on',
      discount_amount: number(formData, 'discount_amount'),
      has_overdue_installments: formData.get('has_overdue_installments') === 'on',
      overdue_installments: number(formData, 'overdue_installments'),
      name: text(formData, 'name'),
      phone: formatPrimaryPhone(text(formData, 'phone')),
      email: normalizeEmail(text(formData, 'email')) || null,
      is_original_owner: formData.get('is_original_owner') === 'on',
      images: list(formData, 'image'),
      status: 'pending',
    }

    // إذا تم إنشاء الوحدة مسبقاً في الخطوة 2، نقوم بتحديثها بكل التفاصيل والصور
    if (existingUnitId) {
      const { error } = await supabase
        .from('sell_requests')
        .update(payload)
        .eq('id', existingUnitId)

      if (error) {
        return { success: false, error: 'تعذر حفظ بيانات الوحدة النهائية.' }
      }

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')
      return {
        success: true,
        unitId: existingUnitId,
        orderRef: generateOrderRef(existingUnitId),
      }
    }

    // احتياطي إذا لم يكن هناك existingUnitId
    const targetUserId = sessionId || null
    const { data: inserted, error } = await supabase
      .from('sell_requests')
      .insert({
        ...payload,
        user_id: targetUserId,
      })
      .select('id')
      .single()

    if (error || !inserted) {
      return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    }

    const finalId = String(inserted.id)
    revalidatePath('/account', 'page')
    revalidatePath('/admin', 'layout')
    return {
      success: true,
      unitId: finalId,
      orderRef: generateOrderRef(finalId),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'تعذر إرسال الطلب',
    }
  }
}

export type BuyRequestPayload = {
  available_cash: number
  max_installment: number
  payment_plan: string
  budget: number
  unit_types: string[]
  min_rooms: number
  delivery_status: string
  preferred_areas: string[]
  name: string
  phone: string
  email: string
  password: string
}

export async function submitBuyRequest(
  input: BuyRequestPayload | FormData
): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()

    const payload: BuyRequestPayload =
      input instanceof FormData
        ? {
            available_cash: number(input, 'available_cash', 0),
            max_installment: number(input, 'max_installment', 0),
            payment_plan: text(input, 'payment_plan'),
            budget: number(input, 'budget', 0),
            unit_types: list(input, 'unit_type'),
            min_rooms: integer(input, 'min_rooms', 0),
            delivery_status: text(input, 'delivery_status'),
            preferred_areas: list(input, 'preferred_area'),
            name: text(input, 'name') || 'Unknown',
            phone: formatPrimaryPhone(text(input, 'phone')) || 'Unknown',
            email: normalizeEmail(text(input, 'email')),
            password: text(input, 'password'),
          }
        : {
            available_cash: Number(input.available_cash) || 0,
            max_installment: Number(input.max_installment) || 0,
            payment_plan: input.payment_plan || '',
            budget: Number(input.budget) || 0,
            unit_types: input.unit_types,
            min_rooms: Number.parseInt(String(input.min_rooms), 10) || 0,
            delivery_status: input.delivery_status || '',
            preferred_areas: input.preferred_areas,
            name: input.name.trim() || 'Unknown',
            phone: formatPrimaryPhone(input.phone) || 'Unknown',
            email: normalizeEmail(input.email),
            password: input.password.trim(),
          }

    const cookieStore = await cookies()
    let userId = cookieStore.get('user_session')?.value || null

    if (!userId) {
      const hash = hashPassword(payload.password || '12345678')
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.ilike.${payload.email},phone.eq.${payload.phone}`)
        .limit(1)
        .maybeSingle()

      if (existingUser) {
        userId = existingUser.id
      } else {
        const { data: created } = await supabase
          .from('users')
          .insert({
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            password_hash: hash,
          })
          .select('id')
          .single()
        userId = created?.id || null
      }

      if (userId) await setUserSession(userId)
    }

    const { password, ...cleanPayload } = payload

    const { error } = await supabase.from('buy_requests').insert({
      ...cleanPayload,
      user_id: userId,
    })

    if (error) {
      return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    }

    revalidatePath('/account', 'page')
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'تعذر إرسال الطلب',
    }
  }
}

export async function submitInvestorLead(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const payload = {
      investor_type: text(formData, 'investor_type') || null,
      years_experience: number(formData, 'years_experience'),
      preferred_sectors: list(formData, 'preferred_sector'),
      investment_range: text(formData, 'investment_range') || null,
      preferred_structure: text(formData, 'preferred_structure') || null,
      participation_level: text(formData, 'participation_level') || null,
      target_roi: number(formData, 'target_roi'),
      name: text(formData, 'name'),
      phone: formatPrimaryPhone(text(formData, 'phone')),
      email: normalizeEmail(text(formData, 'email')),
      signature_name: text(formData, 'signature_name') || null,
    }

    const { error } = await supabase.from('investor_leads').insert(payload)
    if (error) {
      return { success: false, error: 'تعذر إرسال بيانات المستثمرين. حاول مرة أخرى.' }
    }

    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'تعذر إرسال الطلب',
    }
  }
}