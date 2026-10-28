import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes, scryptSync } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import type { MatchableUnit } from '@/lib/smart-matcher'

export const PENDING_ADMIN_TAG = '__PENDING_ADMIN_VERIFICATION__'

export type OfferStatusType =
  | 'pending_admin'
  | 'recommended'
  | 'pending_seller'
  | 'counter_offered'
  | 'accepted'
  | 'rejected'
  | 'unit_locked'

export type OfferRecord = {
  id: string
  property_id: string
  lead_id?: string | null
  buyer_user_id?: string | null
  seller_user_id?: string | null
  buyer_name?: string | null
  buyer_phone?: string | null
  offered_cash: number
  counter_cash?: number | null
  required_cash: number
  payment_readiness: '48h' | '1_week' | '2_weeks'
  payment_method: 'bank_check' | 'bank_transfer'
  match_score: number
  match_reasons: string[]
  diff_reasons: string[]
  status: OfferStatusType
  initiated_by: 'buyer' | 'admin' | 'auto'
  created_at: string
  updated_at?: string
}

export function makeOfferRefCode(offerId: string): string {
  const clean = String(offerId || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  return `OF-${clean.slice(0, 6) || '1001'}`
}

export function hashOfferPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

export async function setBuyerSessionCookie(
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

export async function getOfferSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export async function getVerifiedClientSession() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const userId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !userId) return null

  const supabase = await getOfferSupabase()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, phone, role, status, password_hash')
    .eq('id', userId)
    .maybeSingle()

  if (!user) return null
  const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
  const cleanStatus = String(user.status || 'active').trim().toLowerCase()
  if (!check.valid || cleanStatus === 'suspended') {
    return null
  }

  return { supabase, user }
}

export async function verifyStaffSession() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const userId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !userId) return null

  const supabase = await getOfferSupabase()
  const { data: user } = await supabase
    .from('users')
    .select('id, role, status, password_hash')
    .eq('id', userId)
    .maybeSingle()

  if (!user) return null
  const valid = parseAndVerifySessionCookie(
    rawSession,
    user.password_hash
  ).valid
  const role = String(user.role || '')
    .trim()
    .toLowerCase()
  if (
    !valid ||
    user.status === 'suspended' ||
    (role !== 'admin' && role !== 'moderator' && role !== 'sales')
  ) {
    return null
  }
  return { supabase, user }
}

export function isUnitOwnedByUser(unit: any, user: any): boolean {
  if (!unit || !user?.id) return false
  const role = String(user.role || 'user').trim().toLowerCase()
  if (role === 'admin' || role === 'moderator' || role === 'sales') return true

  if (unit.user_id) {
    return String(unit.user_id) === String(user.id)
  }

  const byEmail =
    user.email &&
    unit.email &&
    String(user.email).trim().toLowerCase() ===
      String(unit.email).trim().toLowerCase()
  const byPhone =
    user.phone &&
    unit.phone &&
    String(user.phone).trim() === String(unit.phone).trim()

  return Boolean(byEmail || byPhone)
}

export function normalizeOfferRecord(raw: any): OfferRecord {
  const rawDiffs = Array.isArray(raw.diff_reasons) ? raw.diff_reasons : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)
  const cleanDiffs = rawDiffs.filter((d: string) => d !== PENDING_ADMIN_TAG)

  let effectiveStatus: OfferStatusType = raw.status || 'pending_admin'
  if (
    raw.status === 'pending_admin' ||
    (raw.status === 'recommended' &&
      (raw.initiated_by === 'buyer' || hasPendingAdminTag))
  ) {
    effectiveStatus = 'pending_admin'
  }

  return {
    ...raw,
    id: String(raw.id),
    property_id: String(raw.property_id),
    status: effectiveStatus,
    match_reasons: Array.isArray(raw.match_reasons) ? raw.match_reasons : [],
    diff_reasons: cleanDiffs,
  }
}

export function sanitizeUnitForPublicOrBuyer(
  unit: any
): MatchableUnit | undefined {
  if (!unit) return undefined
  return {
    id: String(unit.id),
    project_name: unit.project_name || null,
    developer_name: unit.developer_name || null,
    area: unit.area || unit.documents?.__unit_meta?.area || null,
    unit_type: unit.unit_type || unit.documents?.__unit_meta?.unit_type || null,
    size: Number(unit.size ?? unit.documents?.__unit_meta?.size) || 0,
    rooms: Number(unit.rooms ?? unit.documents?.__unit_meta?.rooms) || 0,
    bathrooms:
      Number(unit.bathrooms ?? unit.documents?.__unit_meta?.bathrooms) || 0,
    finishing:
      unit.finishing || unit.documents?.__unit_meta?.finishing || null,
    delivery_status:
      unit.delivery_status ||
      unit.documents?.__unit_meta?.delivery_status ||
      null,
    contract_price: Number(unit.contract_price) || 0,
    paid_amount: Number(unit.paid_amount) || 0,
    market_price: Number(unit.market_price || unit.contract_price) || 0,
    installment_amount:
      Number(
        unit.installment_amount ??
          unit.documents?.__unit_meta?.installment_amount
      ) || 0,
    installment_frequency:
      unit.installment_frequency ||
      unit.documents?.__unit_meta?.installment_frequency ||
      null,
    years_left:
      Number(unit.years_left ?? unit.documents?.__unit_meta?.years_left) || 0,
    willing_to_discount: Boolean(unit.willing_to_discount),
    discount_amount: Number(unit.discount_amount) || 0,
    country: 'GE',
    country_code: 'GE',
    currency_code: 'USD',
    status: unit.status || 'active',
    images: Array.isArray(unit.images) ? unit.images : [],
  }
}

export function revalidateAllOfferPaths() {
  revalidatePath('/account')
  revalidatePath('/account/offers')
  revalidatePath('/opportunities')
  revalidatePath('/admin')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/deals')
}