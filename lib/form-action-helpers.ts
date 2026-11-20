import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

import { sendEmail } from '@/lib/mail'
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import { getServerI18n } from '@/lib/get-server-dictionary'
import type { LocaleCode } from '@/lib/i18n-config'
import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import ruDict from '@/dictionaries/ru.json'
import kaDict from '@/dictionaries/ka.json'

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-16.vercel.app'
export const ACTIVE_COUNTRY_CODE = 'GE'
export const ACTIVE_CURRENCY_CODE = 'USD'

export type ListingCategoryType =
  | 'exit'
  | 'sale'
  | 'rent_monthly'
  | 'rent_daily'
  | 'pledge'

const FEATURE_GROUP_KEYS = [
  {
    key: 'space',
    ids: [
      'Balcony',
      'Loggia',
      'Terrace',
      'Yard',
      'Storage',
      'Cellar',
      'Walk-in closet',
      'Separate kitchen',
    ],
  },
  {
    key: 'building',
    ids: [
      'Elevator',
      'Parking',
      'Underground parking',
      'Garage',
      'Security',
      'Concierge',
      'Intercom',
      'Backup generator',
      'Iron door',
      'Double glazing',
      'Penthouse',
      'Step-free access',
    ],
  },
  {
    key: 'utilities',
    ids: [
      'Underfloor heating',
      'Natural gas',
      'Hot water',
      'Internet',
      'Cable TV',
    ],
  },
  {
    key: 'comfort',
    ids: [
      'Furniture',
      'Appliances',
      'Air conditioning',
      'Dishwasher',
      'Washing machine',
      'Dryer',
      'Fireplace',
      'Kitchen',
      'TV',
    ],
  },
  {
    key: 'views',
    ids: [
      'Panoramic view',
      'Sea view',
      'Mountain view',
      'Yard view',
      'Street view',
      'Beachfront',
      'Bright',
      'Quiet',
    ],
  },
  {
    key: 'extra',
    ids: [
      'Pool',
      'Jacuzzi',
      'Sauna',
      'Gym',
      'BBQ grill',
      'EV charger',
      'Ski access',
    ],
  },
] as const

export const SIVRCE_FEATURE_GROUPS = FEATURE_GROUP_KEYS.map((group) => ({
  key: group.key,
  labelEn:
    (enDict.sell.optionsData.featureGroups as Record<string, string>)[
      group.key
    ] || group.key,
  labelAr:
    (arDict.sell.optionsData.featureGroups as Record<string, string>)[
      group.key
    ] || group.key,
  labelRu:
    (ruDict.sell.optionsData.featureGroups as Record<string, string>)[
      group.key
    ] || group.key,
  labelKa:
    (kaDict.sell.optionsData.featureGroups as Record<string, string>)[
      group.key
    ] || group.key,
  items: group.ids.map((id) => ({
    id,
    labelEn:
      (enDict.sell.optionsData.featureItems as Record<string, string>)[id] ||
      id,
    labelAr:
      (arDict.sell.optionsData.featureItems as Record<string, string>)[id] ||
      id,
    labelRu:
      (ruDict.sell.optionsData.featureItems as Record<string, string>)[id] ||
      id,
    labelKa:
      (kaDict.sell.optionsData.featureItems as Record<string, string>)[id] ||
      id,
  })),
}))

const FORMS_DICTS_BY_LOCALE: Record<LocaleCode, Record<string, string>> = {
  ar: arDict.serverActions.forms,
  en: enDict.serverActions.forms,
  ru: ruDict.serverActions.forms,
  ka: kaDict.serverActions.forms,
}

export async function getFormsDict() {
  const { dict, locale, dir } = await getServerI18n()
  const raw =
    (dict as Record<string, any>)?.serverActions?.forms ||
    (dict as Record<string, any>)?.serverActions?.submitForms ||
    {}
  const fb = FORMS_DICTS_BY_LOCALE[locale] || FORMS_DICTS_BY_LOCALE.en
  const t: Record<string, string> = { ...fb }

  for (const key of Object.keys({ ...fb, ...raw })) {
    const val = raw[key]
    if (typeof val === 'string' && val.trim()) {
      if (locale !== 'ar' && /[\u0600-\u06FF]/.test(val)) {
        t[key] = fb[key] || FORMS_DICTS_BY_LOCALE.en[key] || val
      } else {
        t[key] = val
      }
    }
  }

  return { t, locale, dir }
}

export async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export function getSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'aqar-exit-enterprise-secret-key-2026'
  )
}

export async function getVerifiedSellerSession(supabase: any) {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const sessionId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !sessionId) return null

  const { data: user } = await supabase
    .from('users')
    .select(
      'id, name, email, phone, country, role, status, is_verified, password_hash'
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (!user) return null
  const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
  const status = String(user.status || 'active').trim().toLowerCase()
  if (!check.valid || status === 'suspended') return null

  return user
}

export async function setUserSession(
  userId: string,
  passwordHash?: string | null
) {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')

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

export async function upsertUserVerificationMeta(
  supabase: any,
  userId: string,
  updates: { emailVerified?: boolean; phoneVerified?: boolean }
) {
  if (!userId) return

  try {
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id, message')
      .eq('user_id', userId)
      .eq('title', '__USER_VERIFICATION_META__')
      .maybeSingle()

    let currentMeta = { emailVerified: false, phoneVerified: false }
    if (existingNotif?.message) {
      try {
        currentMeta = { ...currentMeta, ...JSON.parse(existingNotif.message) }
      } catch {}
    }

    const nextMeta = {
      emailVerified:
        updates.emailVerified !== undefined
          ? updates.emailVerified
          : currentMeta.emailVerified,
      phoneVerified:
        updates.phoneVerified !== undefined
          ? updates.phoneVerified
          : currentMeta.phoneVerified,
      updatedAt: new Date().toISOString(),
    }

    if (existingNotif?.id) {
      await supabase
        .from('notifications')
        .update({ message: JSON.stringify(nextMeta), is_read: true })
        .eq('id', existingNotif.id)
    } else {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '__USER_VERIFICATION_META__',
        message: JSON.stringify(nextMeta),
        type: 'system_verification',
        link: '/account',
        is_read: true,
      })
    }
  } catch {}

  if (updates.emailVerified !== undefined) {
    try {
      await supabase
        .from('users')
        .update({
          is_verified: updates.emailVerified,
          ...(updates.emailVerified ? { otp_code: null } : {}),
        })
        .eq('id', userId)
    } catch {}
  }

  if (updates.phoneVerified !== undefined) {
    try {
      await supabase
        .from('users')
        .update({ phone_verified: updates.phoneVerified })
        .eq('id', userId)
    } catch {}
  }
}

export async function sendNotificationEmail({
  to,
  subject,
  html,
  senderName,
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  return sendEmail({
    to,
    subject,
    html,
    senderName: senderName || 'DualDealz',
  })
}

export function normalizeDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

export function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function number(formData: FormData, key: string, fallback = 0) {
  const rawValue = normalizeDigits(text(formData, key))
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '')
  if (!rawValue) return fallback
  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function integer(formData: FormData, key: string, fallback = 0) {
  const rawValue = normalizeDigits(text(formData, key))
    .replace(/,/g, '')
    .replace(/[^0-9]/g, '')
  if (!rawValue) return fallback
  const value = Number.parseInt(rawValue, 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function list(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    )
}

export function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase()
}

export function getPhoneVariants(rawPhone: string) {
  const digits = normalizeDigits(rawPhone || '')
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return []
  if (digits.startsWith('+')) {
    const noPlus = digits.slice(1)
    return Array.from(new Set([digits, noPlus, `0${noPlus}`]))
  }
  const stripped = digits.replace(/^0+/, '')
  return Array.from(
    new Set([
      digits,
      `+${stripped}`,
      `0${stripped}`,
      `+995${stripped}`,
      `+20${stripped}`,
      `+966${stripped}`,
      `+971${stripped}`,
    ])
  )
}

export function formatPrimaryPhone(rawPhone: string) {
  const digits = normalizeDigits(rawPhone || '')
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/^0+/, '')}`
  const stripped = digits.replace(/^0+/, '')
  if (
    stripped.startsWith('995') ||
    stripped.startsWith('20') ||
    stripped.startsWith('966') ||
    stripped.startsWith('971') ||
    stripped.startsWith('965') ||
    stripped.startsWith('974')
  ) {
    return `+${stripped}`
  }
  return `+995${stripped}`
}

export function generateOrderRef(id?: string) {
  if (id) {
    const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (clean.length >= 6) return `AE-${clean.slice(0, 6)}`
  }
  return `AE-${randomBytes(3).toString('hex').toUpperCase()}`
}

export function createMagicToken(
  userId: string,
  unitId: string,
  expiresAt: number
) {
  const payload = `${userId}:${unitId}:${expiresAt}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

export function verifyPassword(password: string, stored: string | null) {
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

export function parseDeliveryDateFromStatus(rawStatus: string) {
  const str = normalizeDigits(String(rawStatus || ''))
  const monthYearMatch = str.match(/(0[1-9]|1[0-2])\/(20\d{2})/)
  const yearOnlyMatch = str.match(/(20\d{2})/)
  const monthsCountMatch = str.match(/\((\d+)\s*/)
  return {
    deliveryMonth: monthYearMatch
      ? monthYearMatch[1]
      : monthsCountMatch
        ? monthsCountMatch[1]
        : null,
    deliveryYear: monthYearMatch
      ? Number.parseInt(monthYearMatch[2], 10)
      : yearOnlyMatch
        ? Number.parseInt(yearOnlyMatch[1], 10)
        : null,
  }
}

export function stripExtendedSellColumns(payload: Record<string, any>) {
  const clone = { ...payload }
  delete clone.contract_month
  delete clone.delivery_month
  delete clone.delivery_year
  delete clone.annual_installment_amount
  delete clone.overdue_total_amount
  delete clone.currency_code
  delete clone.floor_number
  delete clone.garden_size
  delete clone.has_annual_installment
  delete clone.has_overdue_installments
  delete clone.overdue_installments
  delete clone.submission_type
  delete clone.last_seller_edit_at
  delete clone.listing_category
  delete clone.rent_price
  delete clone.rent_period
  delete clone.price_per_sqm
  delete clone.exact_street
  delete clone.house_number
  delete clone.cadastral_code
  delete clone.building_status
  delete clone.building_series
  delete clone.floor_type
  delete clone.heating_type
  delete clone.building_material
  delete clone.year_built
  delete clone.total_floors
  delete clone.bedrooms
  delete clone.max_guests
  delete clone.kitchen_area
  delete clone.balcony_area
  delete clone.loggia_area
  delete clone.terrace_area
  delete clone.video_url
  delete clone.tour_3d_url
  delete clone.allow_online_viewing
  delete clone.installment_sale_possible
  delete clone.exchange_possible
  delete clone.is_exclusive
  delete clone.contact_messengers
  return clone
}

export function stripToCoreSellColumns(payload: Record<string, any>) {
  const coreKeys = [
    'user_id',
    'project_name',
    'developer_name',
    'area',
    'unit_type',
    'size',
    'rooms',
    'bathrooms',
    'finishing',
    'delivery_status',
    'features',
    'description',
    'contract_price',
    'paid_amount',
    'market_price',
    'installment_amount',
    'installment_frequency',
    'years_left',
    'contract_year',
    'willing_to_discount',
    'discount_amount',
    'images',
    'documents',
    'name',
    'phone',
    'email',
    'status',
  ]
  const clean: Record<string, any> = {}
  for (const key of coreKeys) {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  }
  return clean
}