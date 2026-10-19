'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
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
      from: `"دارك للعقارات" <${user}>`,
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

export type SubmitResult = { success: boolean; error?: string }

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
  try {
    if (stored.startsWith('scrypt$')) {
      const [, salt, expected] = stored.split('$')
      if (!salt || !expected) return false
      const actual = scryptSync(password, salt, 64).toString('hex')
      return (
        actual.length === expected.length &&
        timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
      )
    }
    const actual = createHash('sha256').update(password).digest('hex')
    return (
      actual.length === stored.length &&
      timingSafeEqual(Buffer.from(actual), Buffer.from(stored))
    )
  } catch {
    return false
  }
}

async function establishUser(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  input: { name: string; phone: string; email: string; password: string }
) {
  const cleanEmail = normalizeEmail(input.email)
  const formattedPhone = formatPrimaryPhone(input.phone)
  const phoneVariants = getPhoneVariants(input.phone)

  if (!formattedPhone || !cleanEmail || !input.password || input.password.length < 8) {
    return {
      userId: null,
      error: 'اكتب الاسم ورقم الموبايل والإيميل وكلمة سر لا تقل عن ٨ حروف.',
    }
  }

  const hash = hashPassword(input.password)

  const [{ data: emailMatches }, { data: phoneMatches }] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, phone, email, password_hash')
      .ilike('email', cleanEmail)
      .limit(1),
    supabase
      .from('users')
      .select('id, name, phone, email, password_hash')
      .in('phone', phoneVariants)
      .limit(1),
  ])

  const emailUser = emailMatches?.[0] || null
  const phoneUser = phoneMatches?.[0] || null

  if (emailUser || phoneUser) {
    if (emailUser && phoneUser && emailUser.id !== phoneUser.id) {
      if (verifyPassword(input.password, emailUser.password_hash)) {
        await setUserSession(emailUser.id)
        return { userId: emailUser.id, error: null }
      }
      if (verifyPassword(input.password, phoneUser.password_hash)) {
        await setUserSession(phoneUser.id)
        return { userId: phoneUser.id, error: null }
      }
      return {
        userId: null,
        error:
          'رقم الموبايل والبريد الإلكتروني مسجلان بحسابات سابقة. يرجى إدخال كلمة السر الصحيحة أو تغيير الرقم والإيميل معاً.',
      }
    }

    const existing = emailUser || phoneUser!

    if (!verifyPassword(input.password, existing.password_hash)) {
      if (emailUser && !phoneUser) {
        return {
          userId: null,
          error:
            'هذا البريد الإلكتروني مسجل بالفعل بحساب آخر. يرجى تغيير البريد الإلكتروني أو كتابة كلمة السر الصحيحة الخاصة به.',
        }
      }
      if (phoneUser && !emailUser) {
        return {
          userId: null,
          error:
            'رقم الموبايل هذا مسجل بالفعل بحساب آخر. يرجى تغيير رقم الموبايل أو كتابة كلمة السر الصحيحة الخاصة به.',
        }
      }
      return {
        userId: null,
        error:
          'رقم الموبايل والإيميل مسجلان بالفعل. يرجى كتابة كلمة السر الصحيحة للحساب أو تغيير الرقم والإيميل معاً.',
      }
    }

    const updates: Record<string, string> = { name: input.name }
    if (!existing.password_hash?.startsWith('scrypt$')) {
      updates.password_hash = hash
    }
    await supabase.from('users').update(updates).eq('id', existing.id)
    await setUserSession(existing.id)
    return { userId: existing.id, error: null }
  }

  const { data: created, error } = await supabase
    .from('users')
    .insert({
      name: input.name,
      phone: formattedPhone,
      email: cleanEmail,
      password_hash: hash,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('Establish User Insert Error:', error)
    return {
      userId: null,
      error: 'تعذر إنشاء الحساب. يرجى التأكد من عدم استخدام الرقم أو الإيميل سابقاً.',
    }
  }

  await setUserSession(created.id)
  return { userId: created.id, error: null }
}

export async function submitSellRequest(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const password = text(formData, 'password')
    const projectName = text(formData, 'project_name')

    const payload = {
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
    }

    const phone = payload.phone
    const email = payload.email ?? ''

    const account = await establishUser(supabase, {
      name: payload.name,
      phone,
      email,
      password,
    })
    if (account.error || !account.userId) {
      return { success: false, error: account.error ?? 'تعذر إنشاء الحساب.' }
    }

    const { error } = await supabase.from('sell_requests').insert({
      ...payload,
      user_id: account.userId,
    })

    if (error) {
      return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    }

    // 1. إشعار فوري للأدمن في لوحة الإدارة + إشعار للبائع في حسابه
    try {
      await supabase.from('notifications').insert([
        {
          user_id: null, // للأدمن
          title: `عقار بانتظار المراجعة: ${projectName || 'وحدة جديدة'}`,
          message: `البائع: ${payload.name} · ${payload.area || '—'}`,
          type: 'property',
          link: '/admin/properties',
          is_read: false,
        },
        {
          user_id: account.userId, // للبائع
          title: 'استلمنا طلب عرض وحدتك بنجاح 🏠',
          message: `جاري مراجعة بيانات وحدتك في (${projectName || 'مشروعك'}) من قِبل الإدارة لنشرها.`,
          type: 'status_update',
          link: '/account?view=seller',
          is_read: false,
        },
      ])
    } catch {}

    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: 'تم استلام طلب عرض وحدتك بنجاح - دارك',
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
                <h2 style="color: #101A2B;">أهلاً بك يا ${payload.name} 🏠</h2>
                <p>تم استلام بيانات وحدتك في مشروع <strong>${projectName || 'وحدتك العقارية'}</strong> بنجاح.</p>
                <p>يمكنك متابعة حالة وحدتك واستكمال الصور من داخل حسابك في منصة دارك.</p>
               </div>`,
      })
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

    const phone = payload.phone
    const email = payload.email ?? ''

    const account = await establishUser(supabase, {
      name: payload.name,
      phone,
      email,
      password: payload.password,
    })
    if (account.error || !account.userId) {
      return { success: false, error: account.error ?? 'تعذر إنشاء الحساب.' }
    }

    const { password, ...cleanPayload } = payload

    const { error } = await supabase.from('buy_requests').insert({
      ...cleanPayload,
      user_id: account.userId,
    })

    if (error) {
      return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    }

    // إشعار فوري للأدمن + إشعار للمشتري في جرس الإشعارات
    try {
      const cashFormatted = Number(
        cleanPayload.available_cash || cleanPayload.budget || 0
      ).toLocaleString('en-US')

      await supabase.from('notifications').insert([
        {
          user_id: null, // للأدمن
          title: `طلب شراء جديد: ${payload.name}`,
          message: `الكاش المتاح: ${cashFormatted} ج.م`,
          type: 'lead',
          link: '/admin/leads',
          is_read: false,
        },
        {
          user_id: account.userId, // للمشتري
          title: 'تم تفعيل رادار الفرص العقارية لحسابك 🎯',
          message: `تم حفظ ميزانيتك (${cashFormatted} ج.م)، وسنرسل لك إشعاراً فور نزول أي وحدة مطابقة.`,
          type: 'property_match',
          link: '/account?view=buyer',
          is_read: false,
        },
      ])
    } catch {}

    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: 'تم تسجيل طلب الشراء وميزانيتك بنجاح - دارك',
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
                <h2 style="color: #101A2B;">أهلاً بك يا ${payload.name} 🌟</h2>
                <p>تم تسجيل طلب الشراء الخاص بك بنجاح، وتم تجهيز الفرص العقارية المطابقة لميزانيتك في حسابك.</p>
               </div>`,
      })
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

export async function saveSellProgress(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const sessionId = (await cookies()).get('user_session')?.value
    if (!sessionId)
      return { success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.' }

    const payload = {
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
      user_id: sessionId,
    }

    const { data: existing } = await supabase
      .from('sell_requests')
      .select('id')
      .eq('user_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!existing) return { success: false, error: 'لم يتم العثور على طلب البيع الحالي.' }

    const { error } = await supabase
      .from('sell_requests')
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', sessionId)

    revalidatePath('/account', 'page')

    return error ? { success: false, error: 'تعذر حفظ التقدم.' } : { success: true }
  } catch {
    return { success: false, error: 'تعذر حفظ التقدم.' }
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

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `طلب مستثمر جديد: ${payload.name}`,
        message: `المبلغ: ${payload.investment_range || 'غير محدد'}`,
        type: 'investor',
        link: '/admin/investors',
        is_read: false,
      })
    } catch {}

    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'تعذر إرسال الطلب',
    }
  }
}