'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { extractUserIdFromCookie } from '@/lib/session-security'
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
  if (digits.startsWith('+') && !digits.startsWith('+20')) return digits
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

export async function getCurrentSellerProfileAction() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { isLoggedIn: false, user: null }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone, country')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) return { isLoggedIn: false, user: null }
    return { isLoggedIn: true, user }
  } catch {
    return { isLoggedIn: false, user: null }
  }
}

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
  unitCountry?: string
  userCountry?: string
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

    const unitCountryCode = (payload.unitCountry || 'EG').trim().toUpperCase()
    const userCountryCode = (
      payload.userCountry ||
      payload.unitCountry ||
      'EG'
    )
      .trim()
      .toUpperCase()

    async function upsertDraftUnit(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const unitData: Record<string, any> = {
        user_id: userId,
        country: unitCountryCode,
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

      try {
        await supabase.from('notifications').insert([
          {
            user_id: null,
            title: `عقار جديد بانتظار استكمال البيانات (${unitCountryCode}): ${payload.project || 'وحدة سكنية'}`,
            message: `المالك: ${contact.name} · المدفوع: ${Number(payload.paidAmount || 0).toLocaleString('en-US')}`,
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

    async function sendOrderConfirmationMagicEmail(
      userId: string,
      unitId: string,
      userName: string,
      userEmail: string
    ) {
      if (!userEmail || !unitId) return
      const orderRef = generateOrderRef(unitId)
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
      const magicToken = createMagicToken(userId, unitId, expiresAt)
      const magicLink = `${siteUrl}/sell?magic=${encodeURIComponent(magicToken)}`
      const paidFormatted = Number(payload.paidAmount || 0).toLocaleString('en-US')

      await sendNotificationEmail({
        to: userEmail,
        subject: `وصلنا طلبك ${orderRef} — عقار إكزت`,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.8; color: #0a1122;">
                <p style="font-size: 16px;">أهلاً <strong>${userName}</strong>،</p>
                <p>وصلنا طلبك — رقم الطلب: <strong>${orderRef}</strong>.</p>
                <p>للتأكيد: المبلغ اللي هتستلمه عند إتمام التنازل هو <strong>${paidFormatted}</strong> — اللي دفعته بالظبط، بدون أي أوفر.</p>
                <p>كمّل بيانات وحدتك من اللينك ده — مش محتاج كلمة سر ولا تسجيل دخول:</p>
                <p style="margin: 18px 0;">
                  <a href="${magicLink}" style="color: #0b6954; font-weight: bold; word-break: break-all;">${magicLink}</a>
                </p>
                <p>ضفنا الطلب ده على الوحدة اللي عندك عندنا، فمفيش أي بيانات ضاعت.</p>
                <p>محتاج حاجة؟ كلمنا واتساب: <a href="https://wa.me/201018595959">https://wa.me/201018595959</a></p>
               </div>`,
      }).catch(() => {})
    }

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

    if (emailUser) {
      const unitId = await upsertDraftUnit(emailUser.id, {
        name: cleanName || emailUser.name,
        phone: emailUser.phone || formattedPhone,
        email: emailUser.email,
      })
      const orderRef = generateOrderRef(unitId)

      await sendOrderConfirmationMagicEmail(
        emailUser.id,
        unitId,
        cleanName || emailUser.name || 'عميلنا العزيز',
        emailUser.email
      )

      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        unitId,
        orderRef,
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

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

    const hash = hashPassword(password)
    const { data: createdUser, error: createErr } = await supabase
      .from('users')
      .insert({
        name: cleanName,
        phone: formattedPhone,
        email: cleanEmail,
        password_hash: hash,
        country: userCountryCode,
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
    }
  } catch (e) {
    console.error('processSellerStep2Action error:', e)
    return { status: 'error', error: 'حدث خطأ غير متوقع.' }
  }
}

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
    const expiresAt = Date.now() + 60 * 60 * 1000
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
      country: text(formData, 'country') || 'EG',
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
    const unitCountry = (text(formData, 'country') || 'EG').toUpperCase()

    const payload: Record<string, any> = {
      country: unitCountry,
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

    if (existingUnitId) {
      const { data: prevUnit } = await supabase
        .from('sell_requests')
        .select('status, size, area')
        .eq('id', existingUnitId)
        .maybeSingle()

      const wasPreviouslySubmitted = Boolean(
        prevUnit?.area ||
          prevUnit?.size ||
          prevUnit?.status === 'active' ||
          prevUnit?.status === 'paused_by_seller'
      )

      if (wasPreviouslySubmitted) {
        payload.submission_type = 'edited_by_seller'
        payload.last_seller_edit_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('sell_requests')
        .update(payload)
        .eq('id', existingUnitId)

      if (error) {
        return { success: false, error: 'تعذر حفظ بيانات الوحدة النهائية.' }
      }

      try {
        await supabase.from('notifications').insert({
          user_id: null,
          title: wasPreviouslySubmitted
            ? `🔄 تعديل بيانات وحدة (${unitCountry}) من المالك: ${projectName || 'وحدة'}`
            : `✅ استكمال بيانات وحدة (${unitCountry}): ${projectName || 'وحدة'}`,
          message: `قام البائع (${payload.name || 'المالك'}) بتحديث بيانات وصور الوحدة في (${payload.area || '—'}) وبانتظار مراجعتك.`,
          type: 'property',
          link: '/admin/properties',
          is_read: false,
        })
      } catch {}

      revalidatePath('/account', 'page')
      revalidatePath('/opportunities', 'page')
      revalidatePath('/admin', 'layout')
      return {
        success: true,
        unitId: existingUnitId,
        orderRef: generateOrderRef(existingUnitId),
      }
    }

    const targetUserId = sessionId || null
    const { data: inserted, error } = await supabase
      .from('sell_requests')
      .insert({
        ...payload,
        user_id: targetUserId,
        submission_type: 'new',
      })
      .select('id')
      .single()

    if (error || !inserted) {
      return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    }

    const finalId = String(inserted.id)
    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `عقار جديد بانتظار المراجعة (${unitCountry}): ${projectName || 'وحدة جديدة'}`,
        message: `البائع: ${payload.name} · ${payload.area || '—'}`,
        type: 'property',
        link: '/admin/properties',
        is_read: false,
      })
    } catch {}

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
  country?: string
  userCountry?: string
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

export async function processBuyerStep3Action(payload: {
  mode: 'session' | 'login' | 'register'
  country?: string
  userCountry?: string
  available_cash: number
  max_installment: number
  payment_plan: string
  budget: number
  unit_types: string[]
  min_rooms: number
  delivery_status: string
  preferred_areas: string[]
  name?: string
  phone?: string
  email?: string
  password?: string
  loginIdentifier?: string
}): Promise<Step2AuthResponse> {
  try {
    const supabase = await getSupabase()
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'

    const targetCountry = (payload.country || 'EG').trim().toUpperCase()
    const buyerResidenceCountry = (
      payload.userCountry ||
      payload.country ||
      'EG'
    )
      .trim()
      .toUpperCase()

    async function insertBuyRequestRecord(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const { data: inserted, error } = await supabase
        .from('buy_requests')
        .insert({
          user_id: userId,
          country: targetCountry,
          available_cash: Number(payload.available_cash) || 0,
          max_installment: Number(payload.max_installment) || 0,
          payment_plan: payload.payment_plan || 'شهري',
          budget: Number(payload.budget) || 0,
          unit_types: payload.unit_types || [],
          min_rooms: Number(payload.min_rooms) || 0,
          delivery_status: payload.delivery_status || 'جاهزة للاستلام',
          preferred_areas: payload.preferred_areas || [],
          name: contact.name || 'مشتري',
          phone: contact.phone || '',
          email: contact.email || null,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Insert Buy Request Error:', error)
      }

      const reqId = inserted?.id ? String(inserted.id) : ''
      const cashFormatted = Number(
        payload.available_cash || payload.budget || 0
      ).toLocaleString('en-US')

      try {
        await supabase.from('notifications').insert([
          {
            user_id: null,
            title: `طلب شراء جديد (${targetCountry}): ${contact.name || 'مشتري'}`,
            message: `الكاش المتاح: ${cashFormatted} · المناطق: ${(payload.preferred_areas || []).slice(0, 2).join('، ')}`,
            type: 'lead',
            link: '/admin/leads',
            is_read: false,
          },
          {
            user_id: userId,
            title: 'تم تفعيل رادار الفرص العقارية لحسابك 🎯',
            message: `تم حفظ ميزانيتك (${cashFormatted})، وسنرسل لك إشعاراً فور نزول أي وحدة مطابقة.`,
            type: 'property_match',
            link: '/account?view=buyer',
            is_read: false,
          },
        ])
      } catch {}

      if (contact.email) {
        const orderRef = generateOrderRef(reqId)
        sendNotificationEmail({
          to: contact.email,
          subject: `وصلنا طلب الشراء ${orderRef} — عقار إكزت`,
          html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.8; color: #0a1122;">
                  <p style="font-size: 16px;">أهلاً <strong>${contact.name}</strong>،</p>
                  <p>وصلنا طلب الشراء الخاص بك — رقم الطلب: <strong>${orderRef}</strong>.</p>
                  <p>الكاش المتاح المسجل: <strong>${cashFormatted}</strong>.</p>
                  <p>تقدر تتابع الفرص المطابقة لميزانيتك مباشرة من حسابك على المنصة:</p>
                  <p style="margin: 18px 0;">
                    <a href="${siteUrl}/account?view=buyer" style="color: #0b6954; font-weight: bold;">${siteUrl}/account?view=buyer</a>
                  </p>
                 </div>`,
        }).catch(() => {})
      }

      return reqId
    }

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

      const reqId = await insertBuyRequestRecord(currentUser.id, {
        name: currentUser.name || 'مشتري',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      })

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')

      return {
        status: 'ok',
        userId: currentUser.id,
        unitId: reqId,
        orderRef: generateOrderRef(reqId),
      }
    }

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
          .ilike('email', `%${normalizeEmail(rawIdentifier)}%`)
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
      const reqId = await insertBuyRequestRecord(matched.id, {
        name: matched.name || 'مشتري',
        phone: matched.phone || '',
        email: matched.email || '',
      })

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')

      return {
        status: 'ok',
        userId: matched.id,
        unitId: reqId,
        orderRef: generateOrderRef(reqId),
      }
    }

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

    if (emailUser) {
      const reqId = await insertBuyRequestRecord(emailUser.id, {
        name: cleanName || emailUser.name,
        phone: emailUser.phone || formattedPhone,
        email: emailUser.email,
      })

      revalidatePath('/admin', 'layout')

      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        orderRef: generateOrderRef(reqId),
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

    if (phoneUser && !emailUser) {
      const reqId = await insertBuyRequestRecord(phoneUser.id, {
        name: cleanName || phoneUser.name,
        phone: phoneUser.phone,
        email: phoneUser.email,
      })

      revalidatePath('/admin', 'layout')

      return {
        status: 'phone_exists_different_email',
        userId: phoneUser.id,
        orderRef: generateOrderRef(reqId),
        userEmail: phoneUser.email,
        userPhone: phoneUser.phone,
      }
    }

    const hash = hashPassword(password)
    const { data: createdUser, error: createErr } = await supabase
      .from('users')
      .insert({
        name: cleanName,
        phone: formattedPhone,
        email: cleanEmail,
        password_hash: hash,
        country: buyerResidenceCountry,
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
    const reqId = await insertBuyRequestRecord(createdUser.id, {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
    })

    revalidatePath('/account', 'page')
    revalidatePath('/admin', 'layout')

    return {
      status: 'ok',
      userId: createdUser.id,
      unitId: reqId,
      orderRef: generateOrderRef(reqId),
    }
  } catch (e) {
    console.error('processBuyerStep3Action error:', e)
    return { status: 'error', error: 'حدث خطأ غير متوقع.' }
  }
}

export async function submitBuyRequest(
  input: BuyRequestPayload | FormData
): Promise<SubmitResult> {
  if (!(input instanceof FormData)) {
    const res = await processBuyerStep3Action({
      mode: 'register',
      ...input,
    })
    if (res.status === 'ok') return { success: true, orderRef: res.orderRef }
    return {
      success: false,
      error: res.error || 'هذا الحساب مسجل بالفعل، يرجى تسجيل الدخول.',
    }
  }
  return { success: false, error: 'طريقة إرسال غير مدعومة.' }
}

export async function submitInvestorLead(formData: FormData) {
  try {
    const supabase = await getSupabase()

    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const company = String(formData.get('company') || '').trim()
    const country = String(formData.get('country') || 'EG').trim()
    const investor_type = String(formData.get('investor_type') || '').trim()
    const years_experience = String(formData.get('years_experience') || '').trim()
    const investment_range = String(formData.get('investment_range') || '').trim()
    const exact_amount = Number(formData.get('exact_amount') || 0)
    const preferred_structure = String(formData.get('preferred_structure') || '').trim()
    const holding_period = String(formData.get('holding_period') || '').trim()
    const participation_level = String(formData.get('participation_level') || '').trim()
    const target_roi = String(formData.get('target_roi') || '').trim()
    const signature_name = String(formData.get('signature_name') || name).trim()
    const notes = String(formData.get('notes') || '').trim()
    const sectors = formData.getAll('sectors').map(String).filter(Boolean)

    if (!name || !phone) {
      return { success: false, error: 'يرجى إدخال الاسم ورقم الهاتف.' }
    }

    const finalRange =
      investment_range ||
      (exact_amount > 0 ? `$${exact_amount.toLocaleString('en-US')}` : '')
    const finalSectors =
      sectors.length > 0 ? sectors : [investor_type].filter(Boolean)

    const leadPayload: Record<string, any> = {
      name,
      phone,
      email: email || null,
      company: company || null,
      country,
      investor_type: investor_type || null,
      years_experience: years_experience || null,
      preferred_sectors: finalSectors,
      investment_range: finalRange,
      exact_amount,
      preferred_structure: preferred_structure || null,
      holding_period: holding_period || null,
      participation_level: participation_level || null,
      target_roi: target_roi || null,
      signature_name,
      notes: notes || null,
      status: 'new',
    }

    // 1. الحفظ في جدول investor_leads الذي تقرأ منه لوحة الأدمن
    let { error } = await supabase.from('investor_leads').insert(leadPayload)

    // Fallback في حال كان الجدول بدون الأعمدة الإضافية
    if (error) {
      const basicLead = {
        name,
        phone,
        email: email || null,
        investor_type: investor_type || null,
        preferred_sectors: finalSectors,
        investment_range: finalRange,
        preferred_structure: preferred_structure || null,
        participation_level: participation_level || null,
        status: 'new',
      }
      const retry = await supabase.from('investor_leads').insert(basicLead)
      error = retry.error
    }

    // 2. الحفظ أيضاً في investor_requests إن وجد لضمان عدم ضياع أي سجل
    if (error) {
      const fallbackTable = await supabase.from('investor_requests').insert({
        name,
        phone,
        email: email || null,
        investor_type,
        investment_range: finalRange,
        preferred_structure,
        participation_level,
        target_roi,
        signature_name,
        status: 'new',
      })
      error = fallbackTable.error
    }

    if (error) {
      console.error('Error inserting investor lead:', error)
      return {
        success: false,
        error: 'تعذر إرسال بيانات المستثمر حالياً، يرجى المحاولة مرة أخرى.',
      }
    }

    // 3. إرسال إشعار فوري للأدمن (user_id: null لكي يظهر في جرس الهيدر للأدمن)
    try {
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'investor',
        title: `💼 طلب مستثمر جديد (${country}): ${name}`,
        message: `${investor_type || 'مستثمر'} · نطاق الاستثمار: ${finalRange || 'غير محدد'}`,
        link: '/admin/investors',
        is_read: false,
      })
    } catch {}

    revalidatePath('/admin/investors')
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error in submitInvestorLead:', err)
    return {
      success: false,
      error: 'تعذر إرسال طلب المستثمر. حاول مرة أخرى.',
    }
  }
}
