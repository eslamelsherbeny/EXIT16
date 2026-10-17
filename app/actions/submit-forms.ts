'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
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
  return formData.getAll(key).filter((value): value is string => typeof value === 'string' && value.length > 0)
}

export type SubmitResult = { success: boolean; error?: string }

const ACCOUNT_ERROR = 'رقم الموبايل أو البريد الإلكتروني مسجل بالفعل. يرجى إدخال كلمة السر الصحيحة الخاصة بهذا الحساب أو استخدام رقم وإيميل جديد.'

async function setUserSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('user_session', userId, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: true, httpOnly: true })
  cookieStore.set('session_hint', '1', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', secure: true })
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

async function establishUser(supabase: Awaited<ReturnType<typeof getSupabase>>, input: { name: string; phone: string; email: string; password: string }) {
  if (!input.phone || !input.email || input.password.length < 8) return { userId: null, error: 'اكتب الاسم ورقم الموبايل والإيميل وكلمة سر لا تقل عن ٨ حروف.' }
  const hash = hashPassword(input.password)
  const { data: matches, error: lookupError } = await supabase.from('users').select('id, name, phone, email, password_hash').or(`phone.eq.${input.phone},email.eq.${input.email}`)
  if (lookupError) return { userId: null, error: 'تعذر التحقق من بيانات الحساب. حاول مرة أخرى.' }
  const existing = matches?.[0]
  if (existing && !verifyPassword(input.password, existing.password_hash)) return { userId: null, error: ACCOUNT_ERROR }
  if (existing) {
    const updates: Record<string, string> = { name: input.name, phone: input.phone, email: input.email }
    if (!existing.password_hash?.startsWith('scrypt$')) updates.password_hash = hash
    const { error } = await supabase.from('users').update(updates).eq('id', existing.id)
    if (error) return { userId: null, error: ACCOUNT_ERROR }
    await setUserSession(existing.id)
    return { userId: existing.id, passwordHash: existing.password_hash?.startsWith('scrypt$') ? existing.password_hash : hash, error: null }
  }
  const { data: created, error } = await supabase.from('users').insert({ name: input.name, phone: input.phone, email: input.email, password_hash: hash }).select('id').single()
  if (error || !created) return { userId: null, error: error?.code === '23505' ? ACCOUNT_ERROR : 'تعذر إنشاء الحساب. حاول مرة أخرى.' }
  await setUserSession(created.id)
  return { userId: created.id, passwordHash: hash, error: null }
}

async function requestAlreadyExists(supabase: Awaited<ReturnType<typeof getSupabase>>, table: 'sell_requests' | 'buy_requests', phone: string, email: string) {
  if (!phone && !email) return false
  let query = supabase.from(table).select('id').limit(1)
  if (phone && email) query = query.or(`phone.eq.${phone},email.eq.${email}`)
  else if (phone) query = query.eq('phone', phone)
  else query = query.eq('email', email)
  const { data } = await query.maybeSingle()
  return Boolean(data)
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
      phone: text(formData, 'phone'),
      email: text(formData, 'email') || null,
      is_original_owner: formData.get('is_original_owner') === 'on',
      images: list(formData, 'image'),
      password_hash: null,
    }
    const phone = payload.phone
    const email = payload.email ?? ''
    const account = await establishUser(supabase, { name: payload.name, phone, email, password })
    if (account.error || !account.userId) return { success: false, error: account.error ?? 'تعذر إنشاء الحساب.' }
    payload.password_hash = account.passwordHash
    if (await requestAlreadyExists(supabase, 'sell_requests', phone, email)) return { success: true }
    const { error } = await supabase.from('sell_requests').insert({ ...payload, password_hash: account.passwordHash, user_id: account.userId })
    if (error) return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر إرسال الطلب' }
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
  password_hash?: string | null
}

export async function submitBuyRequest(input: BuyRequestPayload | FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const payload: BuyRequestPayload = input instanceof FormData ? {
      available_cash: number(input, 'available_cash', 0),
      max_installment: number(input, 'max_installment', 0),
      payment_plan: text(input, 'payment_plan'),
      budget: number(input, 'budget', 0),
      unit_types: list(input, 'unit_type'),
      min_rooms: integer(input, 'min_rooms', 0),
      delivery_status: text(input, 'delivery_status'),
      preferred_areas: list(input, 'preferred_area'),
      name: text(input, 'name') || 'Unknown',
      phone: text(input, 'phone') || 'Unknown',
      email: text(input, 'email'),
      password: text(input, 'password'),
    } : {
      available_cash: Number(input.available_cash) || 0,
      max_installment: Number(input.max_installment) || 0,
      payment_plan: input.payment_plan || '',
      budget: Number(input.budget) || 0,
      unit_types: input.unit_types,
      min_rooms: Number.parseInt(String(input.min_rooms), 10) || 0,
      delivery_status: input.delivery_status || '',
      preferred_areas: input.preferred_areas,
      name: input.name.trim() || 'Unknown',
      phone: input.phone.trim() || 'Unknown',
      email: input.email.trim(),
      password: input.password.trim(),
    }
    const phone = payload.phone
    const email = payload.email ?? ''
    const account = await establishUser(supabase, { name: payload.name, phone, email, password: payload.password })
    if (account.error || !account.userId) return { success: false, error: account.error ?? 'تعذر إنشاء الحساب.' }
    payload.password_hash = account.passwordHash
    if (await requestAlreadyExists(supabase, 'buy_requests', phone, email)) return { success: true }
    const { error } = await supabase.from('buy_requests').insert({ ...payload, password_hash: account.passwordHash, user_id: account.userId })
    if (error) return { success: false, error: 'تعذر حفظ الطلب. حاول مرة أخرى.' }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر إرسال الطلب' }
  }
}

export async function saveSellProgress(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const sessionId = (await cookies()).get('user_session')?.value
    if (!sessionId) return { success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.' }
    const payload = {
      developer_name: text(formData, 'developer_name') || null, project_name: text(formData, 'project_name') || null,
      area: text(formData, 'area') || null, unit_type: text(formData, 'unit_type') || null, size: number(formData, 'size'),
      rooms: number(formData, 'rooms'), bathrooms: number(formData, 'bathrooms'), finishing: text(formData, 'finishing') || null,
      delivery_status: text(formData, 'delivery_status') || null, description: text(formData, 'description') || null,
      contract_price: number(formData, 'contract_price'), paid_amount: number(formData, 'paid_amount'), market_price: number(formData, 'market_price'),
      installment_amount: number(formData, 'installment_amount'), installment_frequency: text(formData, 'installment_frequency') || null,
      contract_year: integer(formData, 'contract_year'), images: list(formData, 'image'), user_id: sessionId,
    }
    const { data: existing } = await supabase.from('sell_requests').select('id').eq('user_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!existing) return { success: false, error: 'لم يتم العثور على طلب البيع الحالي.' }
    const { error } = await supabase.from('sell_requests').update(payload).eq('id', existing.id).eq('user_id', sessionId)
    return error ? { success: false, error: 'تعذر حفظ التقدم.' } : { success: true }
  } catch { return { success: false, error: 'تعذر حفظ التقدم.' } }
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
    phone: text(formData, 'phone'),
    email: text(formData, 'email'),
    signature_name: text(formData, 'signature_name') || null,
  }
  const { error } = await supabase.from('investor_leads').insert(payload)
  if (error) {
    return { success: false, error: 'تعذر إرسال بيانات المستثمرين. حاول مرة أخرى.' }
  }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر إرسال الطلب' }
  }
}
