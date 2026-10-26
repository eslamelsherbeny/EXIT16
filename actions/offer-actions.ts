'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
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
  if (!unit || !user) return false
  const role = String(user.role || 'user').trim().toLowerCase()
  if (role === 'admin' || role === 'moderator' || role === 'sales') return true
  if (unit.user_id && unit.user_id === user.id) return true
  if (
    user.email &&
    unit.email &&
    String(user.email).trim().toLowerCase() ===
      String(unit.email).trim().toLowerCase()
  ) {
    return true
  }
  if (
    user.phone &&
    unit.phone &&
    String(user.phone).trim() === String(unit.phone).trim()
  ) {
    return true
  }
  return false
}

function revalidateAllOfferPaths() {
  revalidatePath('/account')
  revalidatePath('/account/offers')
  revalidatePath('/opportunities')
  revalidatePath('/admin')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/leads')
}

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
  status:
    | 'recommended'
    | 'pending_seller'
    | 'counter_offered'
    | 'accepted'
    | 'rejected'
    | 'unit_locked'
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

  const cleanEmail = String(profile.email || '')
    .trim()
    .toLowerCase()
  const cleanPhone = String(profile.phone || '').trim()

  const [
    { data: allSellsData },
    { data: allBuysData },
    { data: offersData },
  ] = await Promise.all([
    supabase
      .from('sell_requests')
      .select('*')
      .neq('status', 'deleted_by_seller')
      .order('created_at', { ascending: false }),
    supabase
      .from('buy_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('property_offers')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const allUnits = (allSellsData || []) as MatchableUnit[]
  const allLeads = (allBuysData || []) as MatchableBuyer[]
  const allOffers = (offersData || []) as OfferRecord[]

  const mySells = allUnits.filter(
    (s: any) =>
      s.user_id === profile.id ||
      (cleanEmail &&
        String(s.email || '')
          .trim()
          .toLowerCase() === cleanEmail) ||
      (cleanPhone && String(s.phone || '').trim() === cleanPhone)
  )

  const myBuys = allLeads.filter(
    (b: any) =>
      b.user_id === profile.id ||
      (cleanEmail &&
        String(b.email || '')
          .trim()
          .toLowerCase() === cleanEmail) ||
      (cleanPhone && String(b.phone || '').trim() === cleanPhone)
  )

  const myUnitIds = new Set(mySells.map((u) => u.id))
  const myLeadIds = new Set(myBuys.map((b) => b.id))
  const unitsMap = new Map(allUnits.map((u) => [u.id, u]))

  const sellerOffers = allOffers
    .filter(
      (o) =>
        (myUnitIds.has(o.property_id) || o.seller_user_id === profile.id) &&
        o.status !== 'recommended'
    )
    .map((o) => ({
      ...o,
      match_reasons: Array.isArray(o.match_reasons) ? o.match_reasons : [],
      diff_reasons: Array.isArray(o.diff_reasons) ? o.diff_reasons : [],
      unit: unitsMap.get(o.property_id),
    }))

  const buyerOffers = allOffers
    .filter(
      (o) =>
        (o.buyer_user_id === profile.id ||
          (o.lead_id && myLeadIds.has(o.lead_id))) &&
        o.status !== 'recommended'
    )
    .map((o) => ({
      ...o,
      match_reasons: Array.isArray(o.match_reasons) ? o.match_reasons : [],
      diff_reasons: Array.isArray(o.diff_reasons) ? o.diff_reasons : [],
      unit: unitsMap.get(o.property_id),
    }))

  const activeBuyerReq = myBuys[0] || null
  const smartRecommendations: Array<{
    unit: MatchableUnit
    match: ReturnType<typeof calculateSmartMatch>
    recommendedByAdmin: boolean
    existingOfferId?: string
  }> = []

  if (activeBuyerReq) {
    const alreadyOfferedUnitIds = new Set(
      buyerOffers.map((bo) => bo.property_id)
    )

    const adminRecOffers = allOffers.filter(
      (o) =>
        o.status === 'recommended' &&
        (o.buyer_user_id === profile.id ||
          (o.lead_id && myLeadIds.has(o.lead_id)))
    )
    const adminRecMap = new Map(
      adminRecOffers.map((o) => [o.property_id, o.id])
    )

    const activeMarketUnits = allUnits.filter(
      (u) =>
        u.status === 'active' &&
        !isNonGeorgianLegacyArea(u.area) &&
        !myUnitIds.has(u.id) &&
        !alreadyOfferedUnitIds.has(u.id)
    )

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

    activeMarketUnits.forEach((unit) => {
      const m = calculateSmartMatch(unit, activeBuyerReq, matchLabels, locale)
      const isFromAdmin = adminRecMap.has(unit.id)

      if (isFromAdmin || m.score >= 70) {
        smartRecommendations.push({
          unit,
          match: m,
          recommendedByAdmin: isFromAdmin,
          existingOfferId: adminRecMap.get(unit.id),
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
}) {
  const { dict, locale } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const session = await getVerifiedClientSession()
    if (!session) {
      return { success: false, error: oDict.errLoginRequired }
    }
    const { supabase, user: buyerUser } = session
    const sessionId = buyerUser.id

    const [{ data: unit }, { data: buyerLeads }] = await Promise.all([
      supabase
        .from('sell_requests')
        .select('*')
        .eq('id', payload.propertyId)
        .maybeSingle(),
      supabase
        .from('buy_requests')
        .select('*')
        .eq('user_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    if (!unit) {
      return { success: false, error: oDict.errUnitNotFound }
    }

    if (unit.status === 'transferring' || unit.status === 'sold') {
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

    const activeLead = buyerLeads?.[0] || null
    const matchInfo = activeLead
      ? calculateSmartMatch(unit, activeLead, undefined, locale)
      : { score: 90, matches: [], differences: [] }

    const { data: existingOffer } = await supabase
      .from('property_offers')
      .select('id')
      .eq('property_id', unit.id)
      .eq('buyer_user_id', sessionId)
      .limit(1)
      .maybeSingle()

    const offerRow = {
      property_id: unit.id,
      lead_id: activeLead?.id || null,
      buyer_user_id: sessionId,
      seller_user_id: unit.user_id || null,
      buyer_name: buyerUser?.name || activeLead?.name || '',
      buyer_phone: buyerUser?.phone || activeLead?.phone || '',
      offered_cash: finalOfferedCash,
      counter_cash: null,
      required_cash: guardrails.requiredCash,
      payment_readiness: payload.paymentReadiness,
      payment_method: payload.paymentMethod,
      match_score: matchInfo.score,
      match_reasons: matchInfo.matches,
      diff_reasons: matchInfo.differences,
      status: 'pending_seller',
      initiated_by: 'buyer',
      updated_at: new Date().toISOString(),
    }

    if (existingOffer?.id) {
      const { error } = await supabase
        .from('property_offers')
        .update(offerRow)
        .eq('id', existingOffer.id)
      if (error) return { success: false, error: oDict.errSubmitFailed }
    } else {
      const { error } = await supabase.from('property_offers').insert(offerRow)
      if (error) return { success: false, error: oDict.errSubmitFailed }
    }

    if (unit.status === 'active') {
      await supabase
        .from('sell_requests')
        .update({ status: 'offer_received' })
        .eq('id', unit.id)
    }

    const notifsToInsert: any[] = [
      {
        user_id: null,
        title: `💰 ${oDict.adminNewOfferNotifTitle}: ${unit.project_name || ''}`,
        message: `${buyerUser?.name || ''} — ${finalOfferedCash.toLocaleString('en-US')}`,
        type: 'lead',
        link: `/admin/properties?unitId=${unit.id}`,
        is_read: false,
      },
    ]

    if (unit.user_id) {
      notifsToInsert.push({
        user_id: unit.user_id,
        title: `💰 ${oDict.sellerNewOfferNotifTitle} (${unit.project_name || ''})`,
        message: `${finalOfferedCash.toLocaleString('en-US')}`,
        type: 'new_offer',
        link: `/account/offers?unitId=${unit.id}`,
        is_read: false,
      })
    }

    try {
      await supabase.from('notifications').insert(notifsToInsert)
    } catch {}

    revalidateAllOfferPaths()
    return { success: true }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function respondToOfferBySellerAction(payload: {
  offerId: string
  decision: 'accept' | 'counter' | 'reject'
  counterCash?: number
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
        .in('status', ['pending_seller', 'counter_offered', 'recommended'])

      await supabase
        .from('sell_requests')
        .update({ status: 'transferring' })
        .eq('id', unit.id)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
      }

      const notifs: any[] = [
        {
          user_id: null,
          title: `🔥 ${oDict.adminDealAcceptedNotifTitle}: ${unit.project_name || ''}`,
          message: `${unit.name} 🤝 ${offer.buyer_name || ''} (${Number(offer.offered_cash).toLocaleString('en-US')})`,
          type: 'property',
          link: `/admin?deal=${offer.id}`,
          is_read: false,
        },
      ]

      if (offer.buyer_user_id) {
        notifs.push({
          user_id: offer.buyer_user_id,
          title: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${unit.project_name || ''})`,
          message: oDict.buyerOfferAcceptedNotifMsg,
          type: 'status_update',
          link: '/account/offers',
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
            message: `${cleanCounter.toLocaleString('en-US')}`,
            type: 'new_offer',
            link: '/account/offers',
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
        .in('status', ['pending_seller', 'counter_offered'])

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

    if (!offer) return { success: false, error: oDict.errUnitNotFound }

    // التحقق أن هذا العرض يخص المشتري المسجل دخوله
    const role = String(user.role || 'user').trim().toLowerCase()
    const isStaff = role === 'admin' || role === 'moderator' || role === 'sales'
    const isBuyerOwner =
      isStaff ||
      offer.buyer_user_id === user.id ||
      (user.phone &&
        offer.buyer_phone &&
        String(user.phone).trim() === String(offer.buyer_phone).trim())

    if (!isBuyerOwner) {
      return { success: false, error: oDict.errLoginRequired }
    }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle()

    if (!unit) return { success: false, error: oDict.errUnitNotFound }

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
        .in('status', ['pending_seller', 'counter_offered', 'recommended'])

      await supabase
        .from('sell_requests')
        .update({ status: 'transferring' })
        .eq('id', unit.id)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
      }

      const notifs: any[] = [
        {
          user_id: null,
          title: `🔥 ${oDict.adminDealAcceptedNotifTitle}: ${unit.project_name || ''}`,
          message: `${unit.name} 🤝 ${offer.buyer_name || ''} (${agreedAmount.toLocaleString('en-US')})`,
          type: 'property',
          link: `/admin?deal=${offer.id}`,
          is_read: false,
        },
      ]

      if (unit.user_id) {
        notifs.push({
          user_id: unit.user_id,
          title: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${unit.project_name || ''})`,
          message: `${agreedAmount.toLocaleString('en-US')}`,
          type: 'status_update',
          link: `/account/offers?unitId=${unit.id}`,
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
          link: '/account/offers',
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
      if (lead.user_id && lead.user_id === unit.user_id) continue
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
          message: `${cleanCash.toLocaleString('en-US')}`,
          type: 'new_offer',
          link: `/account/offers?unitId=${unit.id}`,
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