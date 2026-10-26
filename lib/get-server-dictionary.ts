import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  DICTIONARIES,
  getCurrencySymbol,
  normalizeLocale,
  type CountryCode,
  type Dictionary,
} from './i18n-config'
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from './session-security'

export type GlobalSiteSettings = {
  siteName: string
  whatsappNumber: string
  supportEmail: string
  buyerCommission: string
  developerPenaltyMin?: string
  developerPenaltyMax?: string
  promo7Price: string
  promo14Price: string
  promo30Price: string
  promo_RU_7: string
  promo_RU_14: string
  promo_RU_30: string
  promo_GE_7: string
  promo_GE_14: string
  promo_GE_30: string
  promo_AE_7: string
  promo_AE_14: string
  promo_AE_30: string
  maintenanceMode: boolean
  allowNewSells: boolean
  allowNewBuys: boolean
  emailNotifications: boolean
}

export const DEFAULT_SITE_SETTINGS: GlobalSiteSettings = {
  siteName: 'Aqar Exit',
  whatsappNumber: '+201018595959',
  supportEmail: 'info@aqarexit.com',
  buyerCommission: '1.25',
  developerPenaltyMin: '10',
  developerPenaltyMax: '15',
  promo7Price: '29',
  promo14Price: '49',
  promo30Price: '69',
  promo_RU_7: '2500',
  promo_RU_14: '4200',
  promo_RU_30: '5900',
  promo_GE_7: '29',
  promo_GE_14: '49',
  promo_GE_30: '69',
  promo_AE_7: '99',
  promo_AE_14: '179',
  promo_AE_30: '249',
  maintenanceMode: false,
  allowNewSells: true,
  allowNewBuys: true,
  emailNotifications: true,
}

export async function getServerDictionary(
  localeOverride?: string
): Promise<Dictionary> {
  if (localeOverride) {
    const clean = normalizeLocale(localeOverride)
    return DICTIONARIES[clean] || DICTIONARIES.ar
  }
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get('locale')?.value)
  return DICTIONARIES[locale] || DICTIONARIES.ar
}

export async function getServerI18n() {
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get('locale')?.value)
  // تثبيت الدولة النشطة على جورجيا (GE)
  const country: CountryCode = 'GE'
  const dir = locale === 'ar' ? ('rtl' as const) : ('ltr' as const)

  const baseDict = DICTIONARIES[locale] || DICTIONARIES.ar
  const dict = structuredClone(baseDict) as Dictionary & Record<string, any>
  const currency = getCurrencySymbol(country, locale)

  let siteSettings: GlobalSiteSettings = { ...DEFAULT_SITE_SETTINGS }
  const rawSession = cookieStore.get('user_session')?.value
  const candidateUserId = extractUserIdFromCookie(rawSession)

  let isLoggedIn = false
  let isStaff = false

  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
        }
      )

      // 1. قراءة إعدادات الموقع من جدول site_settings في Supabase
      let loadedFromDb = false
      try {
        const { data: dbRow } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'global')
          .maybeSingle()

        if (dbRow) {
          siteSettings = {
            ...siteSettings,
            ...dbRow,
            maintenanceMode: Boolean(dbRow.maintenanceMode),
            allowNewSells:
              dbRow.allowNewSells !== undefined
                ? Boolean(dbRow.allowNewSells)
                : true,
            allowNewBuys:
              dbRow.allowNewBuys !== undefined
                ? Boolean(dbRow.allowNewBuys)
                : true,
            emailNotifications:
              dbRow.emailNotifications !== undefined
                ? Boolean(dbRow.emailNotifications)
                : true,
          }
          loadedFromDb = true
        }
      } catch {}

      // 2. قراءة احتياطية من جدول notifications
      if (!loadedFromDb) {
        try {
          const { data: sysRow } = await supabase
            .from('notifications')
            .select('message')
            .eq('type', 'system')
            .eq('title', '__GLOBAL_SITE_CONFIG__')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (sysRow?.message) {
            const parsed = JSON.parse(sysRow.message)
            siteSettings = {
              ...siteSettings,
              ...parsed,
              maintenanceMode: Boolean(parsed.maintenanceMode),
            }
          }
        } catch {}
      }

      // 3. التحقق الدقيق من جلسة المستخدم وصلاحية الإدارة
      if (rawSession && candidateUserId) {
        const { data: user } = await supabase
          .from('users')
          .select('id, role, status, password_hash')
          .eq('id', candidateUserId)
          .maybeSingle()

        if (user) {
          const check = parseAndVerifySessionCookie(
            rawSession,
            user.password_hash
          )
          const cleanStatus = String(user.status || 'active')
            .trim()
            .toLowerCase()
          const cleanRole = String(user.role || 'user')
            .replace(/[\r\n\s]+/g, '')
            .toLowerCase()

          if (check.valid && cleanStatus !== 'suspended') {
            isLoggedIn = true
            if (
              cleanRole === 'admin' ||
              cleanRole === 'moderator' ||
              cleanRole === 'sales'
            ) {
              isStaff = true
            }
          }
        }
      }
    }
  } catch {}

  if (siteSettings.whatsappNumber) {
    const cleanWa = String(siteSettings.whatsappNumber).trim()
    if (dict.footer) dict.footer.phone = cleanWa
    if (dict.publicPages?.contact) {
      dict.publicPages.contact.whatsappValue = cleanWa
    }
  }

  if (siteSettings.supportEmail) {
    const cleanEmail = String(siteSettings.supportEmail).trim()
    if (dict.footer) dict.footer.email = cleanEmail
    if (dict.publicPages?.contact) {
      dict.publicPages.contact.emailValue = cleanEmail
    }
  }

  return {
    locale,
    country,
    dir,
    isRtl: dir === 'rtl',
    dict,
    t: dict,
    currency,
    siteSettings,
    isLoggedIn,
    hasSession: isLoggedIn,
    isStaff,
  }
}