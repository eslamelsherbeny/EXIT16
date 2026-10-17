'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'

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

export async function submitSellRequest(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const password = text(formData, 'password')
    const developerName = text(formData, 'developer_name')
    const projectName = text(formData, 'project_name')
    const rooms = text(formData, 'rooms')
    const finishing = text(formData, 'finishing')
    const projectDetails = [
      developerName,
      projectName,
      rooms ? `Rooms: ${rooms}` : '',
      finishing ? `Finishing: ${finishing}` : '',
    ].filter(Boolean).join(' - ')

    const payload = {
      project_name: projectDetails || null,
      area: text(formData, 'area') || null,
      unit_type: text(formData, 'unit_type') || null,
      size: number(formData, 'size'),
      contract_price: number(formData, 'contract_price'),
      paid_amount: number(formData, 'paid_amount'),
      market_price: number(formData, 'market_price'),
      installment_amount: number(formData, 'installment_amount'),
      years_left: integer(formData, 'years_left'),
      discount_amount: number(formData, 'discount_amount'),
      overdue_installments: number(formData, 'overdue_installments'),
      name: text(formData, 'name'),
      phone: text(formData, 'phone'),
      email: text(formData, 'email') || null,
      password_hash: password ? createHash('sha256').update(password).digest('hex') : null,
      is_original_owner: formData.get('is_original_owner') === 'on',
    }
  console.log('SENDING PAYLOAD:', payload)
  const { error } = await supabase.from('sell_requests').insert(payload)
  if (error) {
    console.log('SUPABASE ERROR:', error)
    return { success: false, error: `Supabase Error: ${error.message} | Details: ${error.details || ''}` }
  }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر إرسال الطلب' }
  }
}

export async function submitBuyRequest(formData: FormData): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
  const payload = {
    available_cash: number(formData, 'available_cash'),
    max_installment: number(formData, 'max_installment'),
    payment_plan: text(formData, 'payment_plan') || null,
    budget: number(formData, 'budget'),
    unit_types: list(formData, 'unit_type'),
    min_rooms: number(formData, 'min_rooms'),
    delivery_status: text(formData, 'delivery_status') || null,
    preferred_areas: list(formData, 'preferred_area'),
    name: text(formData, 'name'),
    phone: text(formData, 'phone'),
    email: text(formData, 'email') || null,
  }
  console.log('SENDING PAYLOAD:', payload)
  const { error } = await supabase.from('buy_requests').insert(payload)
  if (error) {
    console.log('SUPABASE ERROR:', error)
    return { success: false, error: `Supabase Error: ${error.message} | Details: ${error.details || ''}` }
  }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر إرسال الطلب' }
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
    phone: text(formData, 'phone'),
    email: text(formData, 'email'),
    signature_name: text(formData, 'signature_name') || null,
  }
  console.log('SENDING PAYLOAD:', payload)
  const { error } = await supabase.from('investor_leads').insert(payload)
  if (error) {
    console.log('SUPABASE ERROR:', error)
    return { success: false, error: `Supabase Error: ${error.message} | Details: ${error.details || ''}` }
  }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر إرسال الطلب' }
  }
}
