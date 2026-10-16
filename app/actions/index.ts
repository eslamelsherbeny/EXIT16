'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type ActionResult = { success: boolean; error?: string }

export interface Property {
  id: string
  developer: string | null
  project: string | null
  total_price: number | null
  comfortable_installment: number | null
  payment_method: string | null
  has_overdue_installments: boolean
  created_at: string
}

export interface BuyerPreference {
  id: string
  user_id: string | null
  cash_available: number | null
  max_installment: number | null
  target_price: number | null
  areas: string | null
  property_type: string | null
  delivery_status: string | null
  created_at: string
}

export interface InvestorRequest {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string
  investment_amount: number | null
  experience: string | null
  created_at: string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function addProperty(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').insert({
    developer: text(formData, 'developer'),
    project: text(formData, 'project'),
    total_price: Number(text(formData, 'total-price')) || null,
    comfortable_installment: Number(text(formData, 'comfortable-installment')) || null,
    payment_method: text(formData, 'payment-method') || null,
    has_overdue_installments: formData.get('overdue') === 'on',
  })
  if (error) return { success: false, error: 'تعذر حفظ بيانات الوحدة. حاول مرة أخرى.' }
  revalidatePath('/opportunities')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getProperties() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
  if (error) return { data: [], error: 'تعذر تحميل الفرص حالياً.' }
  return { data: data ?? [], error: null }
}

export async function addBuyerPreference(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('buyer_preferences').insert({
    user_id: user?.id ?? null,
    cash_available: Number(text(formData, 'cash')) || null,
    max_installment: Number(text(formData, 'installment')) || null,
    target_price: Number(text(formData, 'target-price')) || null,
    areas: text(formData, 'areas') || null,
    property_type: text(formData, 'property-type') || null,
    delivery_status: text(formData, 'delivery-status') || null,
  })
  if (error) return { success: false, error: 'تعذر حفظ تفضيلاتك. حاول مرة أخرى.' }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function addInvestorRequest(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('investor_requests').insert({
    user_id: user?.id ?? null,
    full_name: text(formData, 'full-name'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    investment_amount: Number(text(formData, 'investment-amount')) || null,
    experience: text(formData, 'experience') || null,
  })
  if (error) return { success: false, error: 'تعذر إرسال طلب المستثمر. حاول مرة أخرى.' }
  revalidatePath('/investors')
  return { success: true }
}

export async function register(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email: text(formData, 'email'), password: text(formData, 'password'), options: { data: { full_name: text(formData, 'full-name') } } })
  if (error) return { success: false, error: 'تعذر إنشاء الحساب. تأكد من البيانات وحاول مرة أخرى.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function login(email: string, password: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: 'البريد الإلكتروني أو كلمة السر غير صحيحة.' }
  revalidatePath('/', 'layout')
  return { success: true }
}
