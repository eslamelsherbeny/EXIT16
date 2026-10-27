'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes, scryptSync } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import { getServerI18n } from '@/lib/get-server-dictionary'
import {
  calculateSmartMatch,
  getUnitPricingGuardrails,
  isNonGeorgianLegacyArea,
  type MatchableBuyer,
  type MatchableUnit,
} from '@/lib/smart-matcher'

const PENDING_ADMIN_TAG = '__PENDING_ADMIN_VERIFICATION__'

function makeOfferRefCode(offerId: string): string {
  const clean = String(offerId || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  return `OF-${clean.slice(0, 6) || '1001'}`
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

async function setBuyerSessionCookie(
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

async function getVerifiedClientSession() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const userId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !userId) return null

  const supabase = await getSupabase()
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

function isUnitOwnedByUser(unit: any, user: any): boolean {
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

function normalizeOfferRecord(raw: any): OfferRecord {
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

function sanitizeUnitForPublicOrBuyer(unit: any): MatchableUnit | undefined {
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

function revalidateAllOfferPaths() {
  revalidatePath('/account')
  revalidatePath('/account/offers')
  revalidatePath('/opportunities')
  revalidatePath('/admin')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/deals')
}

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

export async function getAccountOffersDataAction() {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  const session = await getVerifiedClientSession()
  if (!session) {
    return {
      isLoggedIn: false,
      sells: [] as MatchableUnit[],
      buys: [] as MatchableBuyer[],
      sellerOffers: [] as Array<OfferRecord & { unit?: MatchableUnit }>,
      buyerOffers: [] as Array<OfferRecord & { unit?: MatchableUnit }>,
      smartRecommendations: [] as Array<{
        unit: MatchableUnit
        match: ReturnType<typeof calculateSmartMatch>
        recommendedByAdmin: boolean
        existingOfferId?: string
      }>,
    }
  }

  const { supabase, user: profile } = session

  const cleanEmail = String(profile.email || '').trim().toLowerCase()
  const cleanPhone = String(profile.phone || '').trim()

  try {
    if (cleanEmail) {
      await Promise.all([
        supabase
          .from('sell_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .ilike('email', cleanEmail),
        supabase
          .from('buy_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .ilike('email', cleanEmail),
      ])
    }
    if (cleanPhone) {
      await Promise.all([
        supabase
          .from('sell_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .eq('phone', cleanPhone),
        supabase
          .from('buy_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .eq('phone', cleanPhone),
      ])
    }
  } catch {}

  const [
    { data: mySellsData },
    { data: myBuysData },
    { data: activeMarketData },
    { data: offersData },
  ] = await Promise.all([
    supabase
      .from('sell_requests')
      .select('*')
      .eq('user_id', profile.id)
      .neq('status', 'deleted_by_seller')
      .order('created_at', { ascending: false }),
    supabase
      .from('buy_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('sell_requests')
      .select('*')
      .in('status', ['active', 'approved', 'published', 'offer_received'])
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('property_offers')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const mySells = ((mySellsData || []) as any[])
    .map((u) => sanitizeUnitForPublicOrBuyer(u)!)
    .filter(Boolean)
  const myBuys = (myBuysData || []) as MatchableBuyer[]
  const allOffers = ((offersData || []) as any[]).map(normalizeOfferRecord)

  const myUnitIds = new Set(mySells.map((u) => String(u.id)))
  const myLeadIds = new Set(myBuys.map((b) => String(b.id)))

  const allKnownUnitsMap = new Map<string, MatchableUnit>()
  mySells.forEach((u) => allKnownUnitsMap.set(String(u.id), u))
  ;(activeMarketData || []).forEach((u: any) => {
    const clean = sanitizeUnitForPublicOrBuyer(u)
    if (clean) allKnownUnitsMap.set(String(clean.id), clean)
  })

  // 1. عروض البائع: لا تظهر للبائع إلا العروض الحقيقية التي اعتمدها الأدمن (pending_seller / counter_offered / accepted / unit_locked)
  const sellerOffers = allOffers
    .filter(
      (o) =>
        (myUnitIds.has(String(o.property_id)) ||
          String(o.seller_user_id || '') === String(profile.id)) &&
        o.status !== 'recommended' &&
        o.status !== 'pending_admin' &&
        o.status !== 'rejected'
    )
    .map((o) => ({
      ...o,
      buyer_name: null,
      buyer_phone: null,
      unit: allKnownUnitsMap.get(String(o.property_id)),
    }))
    .sort((a, b) => {
      if (a.status === 'accepted' && b.status !== 'accepted') return -1
      if (b.status === 'accepted' && a.status !== 'accepted') return 1
      return Number(b.offered_cash) - Number(a.offered_cash)
    })

  // 2. عروض المشتري الرسمية
  const buyerOffers = allOffers
    .filter(
      (o) =>
        (String(o.buyer_user_id || '') === String(profile.id) ||
          (o.lead_id && myLeadIds.has(String(o.lead_id)))) &&
        o.status !== 'recommended'
    )
    .map((o) => ({
      ...o,
      unit: allKnownUnitsMap.get(String(o.property_id)),
    }))

  const activeBuyerReq =
    myBuys.find((b) => {
      const areasStr = Array.isArray(b.preferred_areas)
        ? b.preferred_areas.join(' ')
        : String(b.preferred_areas || '')
      return !areasStr.includes('🎯')
    }) ||
    myBuys[0] ||
    null

  const smartRecommendations: Array<{
    unit: MatchableUnit
    match: ReturnType<typeof calculateSmartMatch>
    recommendedByAdmin: boolean
    existingOfferId?: string
  }> = []

  const matchLabels = {
    cashExact: oDict.matchCashExact,
    cashNegotiableBridge: oDict.matchCashBridge,
    cashSlightlyHigher: oDict.diffCashHigher,
    instMatch: oDict.matchInst,
    instHigher: oDict.diffInstHigher,
    areaMatch: oDict.matchArea,
    areaDiff: oDict.diffArea,
    typeMatch: oDict.matchType,
    typeDiff: oDict.diffType,
    roomsMatch: oDict.matchRooms,
    roomsDiff: oDict.diffRooms,
    deliveryDiff: oDict.diffDelivery,
  }

  if (activeBuyerReq) {
    const alreadyOfferedUnitIds = new Set(
      buyerOffers.map((bo) => String(bo.property_id))
    )

    const adminRecOffers = allOffers.filter(
      (o) =>
        o.status === 'recommended' &&
        (String(o.buyer_user_id || '') === String(profile.id) ||
          (o.lead_id && myLeadIds.has(String(o.lead_id))))
    )
    const adminRecMap = new Map(
      adminRecOffers.map((o) => [String(o.property_id), String(o.id)])
    )

    const candidateMarketUnits = ((activeMarketData || []) as any[])
      .map((u) => sanitizeUnitForPublicOrBuyer(u)!)
      .filter(
        (u) =>
          u &&
          (u.status === 'active' ||
            u.status === 'approved' ||
            u.status === 'published' ||
            u.status === 'offer_received') &&
          !isNonGeorgianLegacyArea(u.area) &&
          !myUnitIds.has(String(u.id)) &&
          !alreadyOfferedUnitIds.has(String(u.id))
      )

    candidateMarketUnits.forEach((unit) => {
      const m = calculateSmartMatch(unit, activeBuyerReq, matchLabels, locale)
      const isFromAdmin = adminRecMap.has(String(unit.id))

      if (isFromAdmin || m.score >= 70) {
        smartRecommendations.push({
          unit,
          match: m,
          recommendedByAdmin: isFromAdmin,
          existingOfferId: adminRecMap.get(String(unit.id)),
        })
      }
    })

    smartRecommendations.sort((a, b) => {
      if (a.recommendedByAdmin !== b.recommendedByAdmin) {
        return a.recommendedByAdmin ? -1 : 1
      }
      return b.match.score - a.match.score
    })
  }

  return {
    isLoggedIn: true,
    userId: profile.id,
    userName: profile.name,
    sells: mySells,
    buys: myBuys,
    sellerOffers,
    buyerOffers,
    smartRecommendations,
  }
}

export async function submitBuyerOfferAction(payload: {
  propertyId: string
  offeredCash: number
  paymentReadiness: '48h' | '1_week' | '2_weeks'
  paymentMethod: 'bank_check' | 'bank_transfer'
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestPassword?: string
  buyerNotes?: string
}): Promise<{
  success: boolean
  error?: string
  offerId?: string
  offerRef?: string
}> {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const supabase = await getSupabase()
    const session = await getVerifiedClientSession()
    let buyerUser = session?.user || null
    let sessionId = buyerUser?.id || null

    const cleanGuestName = String(payload.guestName || '').trim().slice(0, 120)
    const cleanGuestPhone = String(payload.guestPhone || '')
      .trim()
      .replace(/\s+/g, '')
      .slice(0, 25)
    const cleanGuestEmail = String(payload.guestEmail || '')
      .trim()
      .toLowerCase()
    const cleanGuestPassword = String(payload.guestPassword || '').trim()

    if (!sessionId && (!cleanGuestName || cleanGuestPhone.length < 7)) {
      return {
        success: false,
        error:
          oDict.errLoginRequired ||
          'يرجى إدخال الاسم ورقم الواتساب الصحيح لتسجيل عرضك',
      }
    }

    // إذا كان زائراً جديداً، ننشئ له حساب مشتري تلقائياً أو نربطه بحسابه الحالي ونسجل دخوله فوراً!
    if (!sessionId && cleanGuestPhone) {
      const { data: existingUserByPhone } = await supabase
        .from('users')
        .select('id, name, email, phone, role, status, password_hash')
        .eq('phone', cleanGuestPhone)
        .limit(1)
        .maybeSingle()

      if (existingUserByPhone) {
        buyerUser = existingUserByPhone
        sessionId = String(existingUserByPhone.id)
      } else {
        const autoEmail =
          cleanGuestEmail ||
          `buyer.${cleanGuestPhone.replace(/\D/g, '')}@aqarexit.ge`
        const autoPass =
          cleanGuestPassword.length >= 8
            ? cleanGuestPassword
            : randomBytes(8).toString('hex')
        const passHash = hashPassword(autoPass)

        const { data: createdUser } = await supabase
          .from('users')
          .insert({
            name: cleanGuestName,
            phone: cleanGuestPhone,
            email: autoEmail,
            password_hash: passHash,
            country: 'GE',
            role: 'user',
            status: 'active',
          })
          .select('id, name, email, phone, role, status, password_hash')
          .maybeSingle()

        if (createdUser) {
          buyerUser = createdUser
          sessionId = String(createdUser.id)
          await setBuyerSessionCookie(sessionId, passHash)
        }
      }
    }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', payload.propertyId)
      .maybeSingle()

    if (!unit) {
      return { success: false, error: oDict.errUnitNotFound }
    }

    if (sessionId && unit.user_id && String(unit.user_id) === String(sessionId)) {
      return {
        success: false,
        error:
          locale === 'ar'
            ? 'لا يمكنك تقديم عرض شراء على وحدتك الخاصة.'
            : 'You cannot submit an offer on your own unit.',
      }
    }

    if (unit.status === 'sold' || unit.status === 'deleted_by_seller') {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    const guardrails = getUnitPricingGuardrails(unit)
    const cleanOfferedCash = Math.round(Number(payload.offeredCash) || 0)

    if (
      !guardrails.allowNegotiation &&
      cleanOfferedCash < guardrails.requiredCash
    ) {
      return {
        success: false,
        error: oDict.errFixedPriceOnly,
      }
    }

    if (
      guardrails.allowNegotiation &&
      cleanOfferedCash < guardrails.minAllowedOfferCash
    ) {
      return {
        success: false,
        error: `${oDict.errBelowMinFloor} (${guardrails.minAllowedOfferCash.toLocaleString('en-US')})`,
      }
    }

    const finalOfferedCash = Math.min(
      guardrails.requiredCash,
      Math.max(guardrails.minAllowedOfferCash, cleanOfferedCash)
    )

    const buyerNameFinal = buyerUser?.name || cleanGuestName || 'مشتري'
    const buyerPhoneFinal = buyerUser?.phone || cleanGuestPhone || ''

    let activeLead: any = null
    if (sessionId) {
      const { data: existingLeads } = await supabase
        .from('buy_requests')
        .select('*')
        .eq('user_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
      activeLead = existingLeads?.[0] || null
    }

    if (!activeLead && buyerPhoneFinal) {
      const { data: createdLead } = await supabase
        .from('buy_requests')
        .insert({
          user_id: sessionId,
          country: 'GE',
          country_code: 'GE',
          currency_code: 'USD',
          name: buyerNameFinal,
          phone: buyerPhoneFinal,
          email: buyerUser?.email || cleanGuestEmail || null,
          available_cash: finalOfferedCash,
          budget: Number(unit.contract_price) || finalOfferedCash,
          max_installment: Number(unit.installment_amount) || 0,
          payment_plan: unit.installment_frequency || 'شهري',
          preferred_areas: [unit.area || 'Tbilisi - Saburtalo'],
          unit_types: [unit.unit_type || 'شقة'],
          min_rooms: Number(unit.rooms) || 1,
          delivery_status: unit.delivery_status || 'جاهز للاستلام',
          status: 'new',
        })
        .select('*')
        .maybeSingle()
      activeLead = createdLead
    }

    const matchInfo = activeLead
      ? calculateSmartMatch(unit, activeLead, undefined, locale)
      : { score: 92, matches: [], differences: [] }

    const reasonsList = [...matchInfo.matches]
    if (payload.buyerNotes?.trim()) {
      reasonsList.push(`💬 ${payload.buyerNotes.trim().slice(0, 180)}`)
    }

    const isBuyerAlreadyVerified = Boolean(
      buyerUser &&
        (buyerUser.role === 'admin' ||
          buyerUser.role === 'moderator' ||
          buyerUser.role === 'sales')
    )
    const initialOfferStatus: OfferStatusType = isBuyerAlreadyVerified
      ? 'pending_seller'
      : 'pending_admin'

    let existingOfferId: string | null = null
    if (sessionId) {
      const { data: existingOffer } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', unit.id)
        .eq('buyer_user_id', sessionId)
        .limit(1)
        .maybeSingle()
      existingOfferId = existingOffer?.id ? String(existingOffer.id) : null
    }

    const offerRow = {
      property_id: unit.id,
      lead_id: activeLead?.id || null,
      buyer_user_id: sessionId,
      seller_user_id: unit.user_id || null,
      buyer_name: buyerNameFinal,
      buyer_phone: buyerPhoneFinal,
      offered_cash: finalOfferedCash,
      counter_cash: null,
      required_cash: guardrails.requiredCash,
      payment_readiness: payload.paymentReadiness,
      payment_method: payload.paymentMethod,
      match_score: matchInfo.score,
      match_reasons: reasonsList,
      diff_reasons: matchInfo.differences,
      status: initialOfferStatus,
      initiated_by: 'buyer',
      updated_at: new Date().toISOString(),
    }

    // نسخة احتياطية متوافقة مع أي قيد CHECK قديم في قاعدة البيانات
    const fallbackCompatibleRow = {
      ...offerRow,
      status: isBuyerAlreadyVerified ? 'pending_seller' : 'recommended',
      diff_reasons: isBuyerAlreadyVerified
        ? matchInfo.differences
        : [...matchInfo.differences, PENDING_ADMIN_TAG],
    }

    let savedOfferId = existingOfferId || ''

    if (existingOfferId) {
      let { error } = await supabase
        .from('property_offers')
        .update(offerRow)
        .eq('id', existingOfferId)
      if (error) {
        const retry = await supabase
          .from('property_offers')
          .update(fallbackCompatibleRow)
          .eq('id', existingOfferId)
        error = retry.error
      }
      if (error) return { success: false, error: oDict.errSubmitFailed }
    } else {
      let { data: insertedOffer, error } = await supabase
        .from('property_offers')
        .insert(offerRow)
        .select('id')
        .single()
      if (error || !insertedOffer) {
        const retry = await supabase
          .from('property_offers')
          .insert(fallbackCompatibleRow)
          .select('id')
          .single()
        insertedOffer = retry.data
        error = retry.error
      }
      if (error || !insertedOffer) {
        return { success: false, error: oDict.errSubmitFailed }
      }
      savedOfferId = String(insertedOffer.id)
    }

    const offerRef = makeOfferRefCode(savedOfferId)

    const notifsToInsert: any[] = [
      {
        user_id: null,
        title: `🎯 عرض شراء جديد (${offerRef}): ${unit.project_name || ''}`,
        message: `${buyerNameFinal} (${buyerPhoneFinal}) — $${finalOfferedCash.toLocaleString('en-US')}`,
        type: 'lead',
        link: `/admin/deals?offerId=${savedOfferId}`,
        is_read: false,
      },
    ]

    if (initialOfferStatus === 'pending_seller' && unit.user_id) {
      notifsToInsert.push({
        user_id: unit.user_id,
        title: `💰 ${oDict.sellerNewOfferNotifTitle} (${unit.project_name || ''})`,
        message: `$${finalOfferedCash.toLocaleString('en-US')}`,
        type: 'new_offer',
        link: `/account/offers?role=seller&unitId=${unit.id}`,
        is_read: false,
      })
    }

    try {
      await supabase.from('notifications').insert(notifsToInsert)
    } catch {}

    revalidateAllOfferPaths()
    return {
      success: true,
      offerId: savedOfferId,
      offerRef,
    }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function respondToOfferBySellerAction(payload: {
  offerId: string
  decision: 'accept' | 'counter' | 'reject'
  counterCash?: number
}) {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const session = await getVerifiedClientSession()
    if (!session) return { success: false, error: oDict.errLoginRequired }
    const { supabase, user } = session

    const { data: offer } = await supabase
      .from('property_offers')
      .select('*')
      .eq('id', payload.offerId)
      .maybeSingle()

    if (!offer) return { success: false, error: oDict.errUnitNotFound }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle()

    if (!unit || !isUnitOwnedByUser(unit, user)) {
      return { success: false, error: oDict.errLoginRequired }
    }

    if (payload.decision === 'accept') {
      const { data: alreadyAccepted } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', unit.id)
        .eq('status', 'accepted')
        .neq('id', offer.id)
        .limit(1)

      if (alreadyAccepted && alreadyAccepted.length > 0) {
        return {
          success: false,
          error:
            locale === 'ar'
              ? 'لقد وافقت بالفعل على عرض آخر لهذه الوحدة. إذا لم يكتمل التعاقد يمكنك التواصل مع الإدارة لإعادة فتح العروض.'
              : 'You have already accepted another offer for this unit.',
        }
      }

      await supabase
        .from('property_offers')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      await supabase
        .from('property_offers')
        .update({ status: 'unit_locked' })
        .eq('property_id', unit.id)
        .neq('id', offer.id)
        .in('status', ['pending_seller', 'counter_offered'])

      await supabase
        .from('sell_requests')
        .update({ status: 'offer_received' })
        .eq('id', unit.id)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
      }

      const offerRef = makeOfferRefCode(offer.id)
      const notifs: any[] = [
        {
          user_id: null,
          title: `🔥 صفقة متفق عليها (${offerRef}): ${unit.project_name || ''}`,
          message: `وافق البائع (${unit.name}) على عرض المشتري (${offer.buyer_name || ''}) بمبلغ $${Number(offer.offered_cash).toLocaleString('en-US')}`,
          type: 'property',
          link: `/admin/deals?offerId=${offer.id}`,
          is_read: false,
        },
      ]

      if (offer.buyer_user_id) {
        notifs.push({
          user_id: offer.buyer_user_id,
          title: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${unit.project_name || ''})`,
          message: oDict.buyerOfferAcceptedNotifMsg,
          type: 'status_update',
          link: '/account/offers?role=buyer',
          is_read: false,
        })
      }

      try {
        await supabase.from('notifications').insert(notifs)
      } catch {}
    } else if (payload.decision === 'counter') {
      const cleanCounter = Math.round(Number(payload.counterCash) || 0)
      const maxPrice = Number(unit.paid_amount) || offer.required_cash

      if (cleanCounter <= offer.offered_cash || cleanCounter > maxPrice) {
        return {
          success: false,
          error: oDict.errInvalidCounterAmount,
        }
      }

      await supabase
        .from('property_offers')
        .update({
          status: 'counter_offered',
          counter_cash: cleanCounter,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      if (offer.buyer_user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: offer.buyer_user_id,
            title: `🔄 ${oDict.buyerCounterNotifTitle} (${unit.project_name || ''})`,
            message: `$${cleanCounter.toLocaleString('en-US')}`,
            type: 'new_offer',
            link: '/account/offers?role=buyer',
            is_read: false,
          })
        } catch {}
      }
    } else if (payload.decision === 'reject') {
      await supabase
        .from('property_offers')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      const { data: remainingOffers } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', unit.id)
        .in('status', ['pending_seller', 'counter_offered', 'accepted'])

      if (!remainingOffers || remainingOffers.length === 0) {
        if (unit.status === 'offer_received') {
          await supabase
            .from('sell_requests')
            .update({ status: 'active' })
            .eq('id', unit.id)
        }
      }
    }

    revalidateAllOfferPaths()
    return { success: true }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function respondToCounterOfferByBuyerAction(payload: {
  offerId: string
  decision: 'accept' | 'reject'
}) {
  const { dict } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const session = await getVerifiedClientSession()
    if (!session) return { success: false, error: oDict.errLoginRequired }
    const { supabase, user } = session

    const { data: offer } = await supabase
      .from('property_offers')
      .select('*')
      .eq('id', payload.offerId)
      .maybeSingle()

    if (!offer || offer.status !== 'counter_offered') {
      return { success: false, error: oDict.errUnitNotFound }
    }

    const role = String(user.role || 'user').trim().toLowerCase()
    const isStaff = role === 'admin' || role === 'moderator' || role === 'sales'
    const isBuyerOwner =
      isStaff || String(offer.buyer_user_id) === String(user.id)

    if (!isBuyerOwner) {
      return { success: false, error: oDict.errLoginRequired }
    }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle()

    if (!unit || unit.status === 'sold') {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    if (payload.decision === 'accept') {
      const agreedAmount = Number(offer.counter_cash || offer.offered_cash)

      await supabase
        .from('property_offers')
        .update({
          offered_cash: agreedAmount,
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      await supabase
        .from('property_offers')
        .update({ status: 'unit_locked' })
        .eq('property_id', unit.id)
        .neq('id', offer.id)
        .in('status', ['pending_seller', 'counter_offered'])

      await supabase
        .from('sell_requests')
        .update({ status: 'offer_received' })
        .eq('id', unit.id)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
      }

      const offerRef = makeOfferRefCode(offer.id)
      const notifs: any[] = [
        {
          user_id: null,
          title: `🔥 صفقة متفق عليها (${offerRef}): ${unit.project_name || ''}`,
          message: `${unit.name} 🤝 ${offer.buyer_name || ''} ($${agreedAmount.toLocaleString('en-US')})`,
          type: 'property',
          link: `/admin/deals?offerId=${offer.id}`,
          is_read: false,
        },
      ]

      if (unit.user_id) {
        notifs.push({
          user_id: unit.user_id,
          title: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${unit.project_name || ''})`,
          message: `$${agreedAmount.toLocaleString('en-US')}`,
          type: 'status_update',
          link: `/account/offers?role=seller&unitId=${unit.id}`,
          is_read: false,
        })
      }

      try {
        await supabase.from('notifications').insert(notifs)
      } catch {}
    } else {
      await supabase
        .from('property_offers')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)
    }

    revalidateAllOfferPaths()
    return { success: true }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

async function verifyStaffSession() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const userId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !userId) return null

  const supabase = await getSupabase()
  const { data: user } = await supabase
    .from('users')
    .select('id, role, status, password_hash')
    .eq('id', userId)
    .maybeSingle()

  if (!user) return null
  const valid = parseAndVerifySessionCookie(rawSession, user.password_hash).valid
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

/**
 * دالة سيرفر آمنة لجلب كافة العروض والوحدات لغرفة الصفقات في الأدمن (/admin/deals)
 */
export async function adminGetDealsRoomDataAction() {
  try {
    const auth = await verifyStaffSession()
    if (!auth) {
      return { authorized: false, offers: [] as any[], units: [] as any[] }
    }
    const { supabase } = auth

    const [{ data: offersData }, { data: unitsData }] = await Promise.all([
      supabase
        .from('property_offers')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('sell_requests')
        .select('*')
        .neq('status', 'deleted_by_seller'),
    ])

    const normalizedOffers = ((offersData || []) as any[])
      .map(normalizeOfferRecord)
      .filter((o) => o.status !== 'recommended')

    return {
      authorized: true,
      offers: normalizedOffers,
      units: unitsData || [],
    }
  } catch (e) {
    console.error('adminGetDealsRoomDataAction error:', e)
    return { authorized: false, offers: [] as any[], units: [] as any[] }
  }
}

export async function adminManageOfferLifecycleAction(payload: {
  offerId: string
  action:
    | 'approve_to_seller'
    | 'reopen_unit_offers'
    | 'mark_unit_sold'
    | 'reject_offer'
}) {
  const { dict } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const auth = await verifyStaffSession()
    if (!auth) return { success: false, error: oDict.errLoginRequired }
    const { supabase } = auth

    const { data: offer } = await supabase
      .from('property_offers')
      .select('*')
      .eq('id', payload.offerId)
      .maybeSingle()

    if (!offer) return { success: false, error: oDict.errUnitNotFound }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle()

    if (!unit) return { success: false, error: oDict.errUnitNotFound }

    const cleanDiffs = Array.isArray(offer.diff_reasons)
      ? offer.diff_reasons.filter((d: string) => d !== PENDING_ADMIN_TAG)
      : []

    if (payload.action === 'approve_to_seller') {
      await supabase
        .from('property_offers')
        .update({
          status: 'pending_seller',
          diff_reasons: cleanDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      if (unit.status === 'active') {
        await supabase
          .from('sell_requests')
          .update({ status: 'offer_received' })
          .eq('id', unit.id)
      }

      if (unit.user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: unit.user_id,
            title: `💰 ${oDict.sellerNewOfferNotifTitle} (${unit.project_name || ''})`,
            message: `$${Number(offer.offered_cash).toLocaleString('en-US')}`,
            type: 'new_offer',
            link: `/account/offers?role=seller&unitId=${unit.id}`,
            is_read: false,
          })
        } catch {}
      }
    } else if (payload.action === 'reopen_unit_offers') {
      await supabase
        .from('property_offers')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      await supabase
        .from('property_offers')
        .update({
          status: 'pending_seller',
          updated_at: new Date().toISOString(),
        })
        .eq('property_id', unit.id)
        .eq('status', 'unit_locked')

      await supabase
        .from('sell_requests')
        .update({ status: 'active' })
        .eq('id', unit.id)
    } else if (payload.action === 'mark_unit_sold') {
      await supabase
        .from('property_offers')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      await supabase
        .from('sell_requests')
        .update({ status: 'sold' })
        .eq('id', unit.id)
    } else if (payload.action === 'reject_offer') {
      await supabase
        .from('property_offers')
        .update({
          status: 'rejected',
          diff_reasons: cleanDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)
    }

    revalidateAllOfferPaths()
    return { success: true }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function adminSendRecommendationAction(payload: {
  propertyId: string
  leadId: string
}) {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const auth = await verifyStaffSession()
    if (!auth) return { success: false, error: oDict.errLoginRequired }
    const { supabase } = auth

    const [{ data: unit }, { data: lead }] = await Promise.all([
      supabase
        .from('sell_requests')
        .select('*')
        .eq('id', payload.propertyId)
        .maybeSingle(),
      supabase
        .from('buy_requests')
        .select('*')
        .eq('id', payload.leadId)
        .maybeSingle(),
    ])

    if (!unit || !lead) return { success: false, error: oDict.errUnitNotFound }

    const match = calculateSmartMatch(unit, lead, undefined, locale)

    const { data: existing } = await supabase
      .from('property_offers')
      .select('id')
      .eq('property_id', unit.id)
      .eq('lead_id', lead.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from('property_offers').insert({
        property_id: unit.id,
        lead_id: lead.id,
        buyer_user_id: lead.user_id || null,
        seller_user_id: unit.user_id || null,
        buyer_name: lead.name || '',
        buyer_phone: lead.phone || '',
        offered_cash: Number(unit.paid_amount) || 0,
        required_cash: Number(unit.paid_amount) || 0,
        payment_readiness: '1_week',
        payment_method: 'bank_check',
        match_score: match.score,
        match_reasons: match.matches,
        diff_reasons: match.differences,
        status: 'recommended',
        initiated_by: 'admin',
      })
    }

    if (lead.user_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: lead.user_id,
          title: `🎯 ${oDict.buyerAdminRecNotifTitle} (${match.score}%)`,
          message: `${unit.project_name || ''} — ${unit.area || ''}`,
          type: 'property_match',
          link: '/account/offers?role=buyer',
          is_read: false,
        })
      } catch {}
    }

    revalidateAllOfferPaths()
    return { success: true, matchScore: match.score }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function adminSendBulkRecommendationsAction(payload: {
  propertyId: string
  minScore?: number
}) {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const auth = await verifyStaffSession()
    if (!auth) return { success: false, error: oDict.errLoginRequired }
    const { supabase } = auth

    const threshold = payload.minScore || 65

    const [{ data: unit }, { data: allLeads }] = await Promise.all([
      supabase
        .from('sell_requests')
        .select('*')
        .eq('id', payload.propertyId)
        .maybeSingle(),
      supabase.from('buy_requests').select('*'),
    ])

    if (!unit || !allLeads) {
      return { success: false, error: oDict.errUnitNotFound, sentCount: 0 }
    }

    let sentCount = 0
    for (const lead of allLeads) {
      if (lead.user_id && String(lead.user_id) === String(unit.user_id))
        continue
      const m = calculateSmartMatch(unit, lead, undefined, locale)
      if (m.score >= threshold) {
        await adminSendRecommendationAction({
          propertyId: unit.id,
          leadId: lead.id,
        })
        sentCount++
      }
    }

    revalidateAllOfferPaths()
    return { success: true, sentCount }
  } catch {
    return { success: false, error: oDict.errSubmitFailed, sentCount: 0 }
  }
}

export async function adminCreateOfficialOfferAction(payload: {
  propertyId: string
  leadId: string
  offeredCash: number
  paymentReadiness: '48h' | '1_week' | '2_weeks'
}) {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const auth = await verifyStaffSession()
    if (!auth) return { success: false, error: oDict.errLoginRequired }
    const { supabase } = auth

    const [{ data: unit }, { data: lead }] = await Promise.all([
      supabase
        .from('sell_requests')
        .select('*')
        .eq('id', payload.propertyId)
        .maybeSingle(),
      supabase
        .from('buy_requests')
        .select('*')
        .eq('id', payload.leadId)
        .maybeSingle(),
    ])

    if (!unit || !lead) return { success: false, error: oDict.errUnitNotFound }

    const match = calculateSmartMatch(unit, lead, undefined, locale)
    const cleanCash =
      Math.round(Number(payload.offeredCash)) || Number(unit.paid_amount) || 0

    await supabase.from('property_offers').insert({
      property_id: unit.id,
      lead_id: lead.id,
      buyer_user_id: lead.user_id || null,
      seller_user_id: unit.user_id || null,
      buyer_name: lead.name || '',
      buyer_phone: lead.phone || '',
      offered_cash: cleanCash,
      required_cash: Number(unit.paid_amount) || 0,
      payment_readiness: payload.paymentReadiness,
      payment_method: 'bank_check',
      match_score: match.score,
      match_reasons: match.matches,
      diff_reasons: match.differences,
      status: 'pending_seller',
      initiated_by: 'admin',
    })

    if (unit.status === 'active') {
      await supabase
        .from('sell_requests')
        .update({ status: 'offer_received' })
        .eq('id', unit.id)
    }

    if (unit.user_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: unit.user_id,
          title: `💰 ${oDict.sellerNewOfferNotifTitle} (${unit.project_name || ''})`,
          message: `$${cleanCash.toLocaleString('en-US')}`,
          type: 'new_offer',
          link: `/account/offers?role=seller&unitId=${unit.id}`,
          is_read: false,
        })
      } catch {}
    }

    revalidateAllOfferPaths()
    return { success: true }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}
