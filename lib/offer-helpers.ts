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

export function isSelfDealOffer(offer: any, unit: any): boolean {
  if (!offer || !unit) return false
  if (
    offer.buyer_user_id &&
    unit.user_id &&
    String(offer.buyer_user_id) === String(unit.user_id)
  ) {
    return true
  }
  const bPhone = String(offer.buyer_phone || '').replace(/\D/g, '')
  const sPhone = String(unit.phone || '').replace(/\D/g, '')
  if (
    bPhone.length >= 8 &&
    sPhone.length >= 8 &&
    bPhone.slice(-8) === sPhone.slice(-8)
  ) {
    return true
  }
  return false
}

export function sanitizeGeorgiaProjectTitle(rawTitle?: string | null): string {
  const clean = String(rawTitle || '').trim()
  if (!clean || clean === 'الرحاب' || clean.includes('الرحاب')) {
    return 'King David Residences'
  }
  return clean
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

/**
 * تطهير بيانات الوحدة للعرض العام وللمشترين:
 * - يحافظ على الكود (code)، وعدد المشاهدات (views_count)، ونوع الباقة (boost_tier)، وسنة الاستلام (delivery_year)، وتاريخ النشر (created_at)
 * - يخفي دائماً اسم ورقم هاتف المالك والشارع الدقيق لحماية عمولة المنصة في التنازل والأقساط
 */
export function sanitizeUnitForPublicOrBuyer(
  unit: any
): (MatchableUnit & Record<string, any>) | undefined {
  if (!unit) return undefined
  const meta = unit.documents?.__unit_meta || {}

  const numericCode = String(unit.id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(unit.id || '')
    .slice(0, 5)
    .toUpperCase()
  const resolvedCode =
    unit.code || `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

  const isFeat =
    Boolean(unit.is_featured) &&
    (!unit.featured_until || new Date(unit.featured_until) > new Date())

  return {
    id: String(unit.id),
    code: resolvedCode,
    listing_category: 'exit',
    rent_price: 0,
    rent_period: 'monthly',
    project_name: sanitizeGeorgiaProjectTitle(unit.project_name),
    developer_name: unit.developer_name || null,
    area: unit.area || meta.area || null,
    exact_street: null,
    house_number: null,
    unit_type: unit.unit_type || meta.unit_type || null,
    size: Number(unit.size ?? meta.size) || 0,
    kitchen_area: Number(unit.kitchen_area ?? meta.kitchen_area) || 0,
    balcony_area: Number(unit.balcony_area ?? meta.balcony_area) || 0,
    loggia_area: Number(unit.loggia_area ?? meta.loggia_area) || 0,
    terrace_area: Number(unit.terrace_area ?? meta.terrace_area) || 0,
    garden_size: Number(unit.garden_size ?? meta.garden_size) || 0,
    rooms: Number(unit.rooms ?? meta.rooms) || 0,
    bedrooms:
      Number(unit.bedrooms ?? meta.bedrooms) ||
      Math.max(1, (Number(unit.rooms ?? meta.rooms) || 2) - 1),
    bathrooms: Number(unit.bathrooms ?? meta.bathrooms) || 0,
    floor_number: unit.floor_number ?? meta.floor_number ?? null,
    total_floors: Number(unit.total_floors ?? meta.total_floors) || null,
    max_guests: null,
    finishing: unit.finishing || meta.finishing || null,
    building_status: unit.building_status || meta.building_status || null,
    building_series: unit.building_series || meta.building_series || null,
    floor_type: unit.floor_type || meta.floor_type || null,
    heating_type: unit.heating_type || meta.heating_type || null,
    building_material: unit.building_material || meta.building_material || null,
    year_built: Number(unit.year_built ?? meta.year_built) || null,
    delivery_status: unit.delivery_status || meta.delivery_status || null,
    delivery_month: unit.delivery_month || meta.delivery_month || null,
    delivery_year: Number(unit.delivery_year ?? meta.delivery_year) || null,
    contract_month: unit.contract_month || meta.contract_month || null,
    contract_year: Number(unit.contract_year ?? meta.contract_year) || null,
    features: Array.isArray(unit.features)
      ? unit.features
      : Array.isArray(meta.features)
        ? meta.features
        : [],
    video_url: unit.video_url || meta.video_url || null,
    tour_3d_url: unit.tour_3d_url || meta.tour_3d_url || null,
    allow_online_viewing: Boolean(
      unit.allow_online_viewing ?? meta.allow_online_viewing
    ),
    installment_sale_possible: Boolean(
      unit.installment_sale_possible ?? meta.installment_sale_possible
    ),
    exchange_possible: Boolean(
      unit.exchange_possible ?? meta.exchange_possible
    ),
    is_exclusive: Boolean(unit.is_exclusive ?? meta.is_exclusive),
    contract_price: Number(unit.contract_price) || 0,
    paid_amount: Number(unit.paid_amount) || 0,
    market_price: Number(unit.market_price || unit.contract_price) || 0,
    price_per_sqm: Number(unit.price_per_sqm ?? meta.price_per_sqm) || 0,
    installment_amount:
      Number(unit.installment_amount ?? meta.installment_amount) || 0,
    installment_frequency:
      unit.installment_frequency || meta.installment_frequency || null,
    years_left: Number(unit.years_left ?? meta.years_left) || 0,
    willing_to_discount: Boolean(unit.willing_to_discount),
    discount_amount: Number(unit.discount_amount) || 0,
    country: 'GE',
    country_code: 'GE',
    currency_code: 'USD',
    status: unit.status || 'active',
    is_featured: isFeat,
    boost_tier: unit.boost_tier || (isFeat ? 'super_vip' : null),
    featured_until: unit.featured_until || null,
    docs_verified: unit.docs_verified ?? true,
    views_count: Number(unit.views_count) || 85,
    created_at: unit.created_at || new Date().toISOString(),
    images: Array.isArray(unit.images) ? unit.images : [],
    name: null,
    phone: null,
    contact_messengers: [],
  }
}

export function revalidateAllOfferPaths() {
  revalidatePath('/')
  revalidatePath('/account')
  revalidatePath('/account/offers')
  revalidatePath('/opportunities')
  revalidatePath('/admin')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/deals')
}