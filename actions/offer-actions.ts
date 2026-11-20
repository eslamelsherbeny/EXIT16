'use server'

import { randomBytes } from 'node:crypto'
import { getServerI18n } from '@/lib/get-server-dictionary'
import {
  calculateSmartMatch,
  getUnitPricingGuardrails,
  isNonGeorgianLegacyArea,
  type MatchableBuyer,
  type MatchableUnit,
} from '@/lib/smart-matcher'
import {
  getOfferSupabase,
  getVerifiedClientSession,
  hashOfferPassword,
  isSelfDealOffer,
  isUnitOwnedByUser,
  makeOfferRefCode,
  normalizeOfferRecord,
  PENDING_ADMIN_TAG,
  revalidateAllOfferPaths,
  sanitizeGeorgiaProjectTitle,
  sanitizeUnitForPublicOrBuyer,
  setBuyerSessionCookie,
  verifyStaffSession,
  type OfferRecord,
  type OfferStatusType,
} from '@/lib/offer-helpers'
import {
  ADMIN_SYNCED_PRICE_TAG,
  AUTO_PUBLISH_MATCH_THRESHOLD,
  BUYER_HIDDEN_TAG,
  BUYER_PAUSED_FOR_DEAL_TAG,
  DEFAULT_SITE_URL,
  freezeBuyerOtherPendingOffers,
  MAX_ACTIVE_BUYER_OFFERS,
  PRIORITY_RETURNED_TAG,
  purgeBuyerOtherOffersOnSale,
  REOPENED_PROMPT_TAG,
  resolveBuyerEmail,
  resolveSellerEmail,
  SELLER_DELAYED_UNAVAILABLE_TAG,
  sendOfferTransactionalEmail,
  unfreezeBuyerPausedOffers,
} from '@/lib/offer-lifecycle-helpers'

export type { OfferRecord, OfferStatusType }

function isAdvanceableToMatched(status?: string | null): boolean {
  const st = String(status || '').trim().toLowerCase()
  return !st || st === 'new' || st === 'contacted'
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
      .in('status', [
        'active',
        'approved',
        'published',
        'offer_received',
        'transferring',
        'sold',
        'paused_by_seller',
        'deleted_by_seller',
      ])
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

  const lockedByAcceptedOfferUnitIds = new Set(
    allOffers
      .filter((o) => o.status === 'accepted')
      .map((o) => String(o.property_id))
  )

  const myUnitIds = new Set(mySells.map((u) => String(u.id)))
  const myLeadIds = new Set(myBuys.map((b) => String(b.id)))

  const allKnownUnitsMap = new Map<string, MatchableUnit>()
  mySells.forEach((u) => allKnownUnitsMap.set(String(u.id), u))
  ;(activeMarketData || []).forEach((u: any) => {
    const clean = sanitizeUnitForPublicOrBuyer(u)
    if (clean) allKnownUnitsMap.set(String(clean.id), clean)
  })

  const sellerOffers = allOffers
    .filter((o) => {
      const unit = allKnownUnitsMap.get(String(o.property_id))
      if (isSelfDealOffer(o, unit)) return false
      const isMine =
        myUnitIds.has(String(o.property_id)) ||
        String(o.seller_user_id || '') === String(profile.id)
      if (!isMine) return false

      if (
        o.status === 'recommended' ||
        o.status === 'pending_admin' ||
        o.status === 'rejected' ||
        o.status === 'unit_locked'
      ) {
        return false
      }

      if (
        lockedByAcceptedOfferUnitIds.has(String(o.property_id)) &&
        o.status !== 'accepted'
      ) {
        return false
      }

      return true
    })
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

  const buyerOffers = allOffers
    .filter((o) => {
      const unit = allKnownUnitsMap.get(String(o.property_id))
      if (isSelfDealOffer(o, unit)) return false
      if (myUnitIds.has(String(o.property_id))) return false
      const diffs = Array.isArray(o.diff_reasons) ? o.diff_reasons : []
      if (diffs.includes(BUYER_HIDDEN_TAG)) return false

      return (
        (String(o.buyer_user_id || '') === String(profile.id) ||
          (o.lead_id && myLeadIds.has(String(o.lead_id)))) &&
        o.status !== 'recommended'
      )
    })
    .map((o) => ({
      ...o,
      unit: allKnownUnitsMap.get(String(o.property_id)),
    }))
    .sort((a, b) => {
      const getPriority = (item: OfferRecord & { unit?: MatchableUnit }) => {
        const uStatus = String(item.unit?.status || '').toLowerCase()
        if (
          uStatus === 'sold' ||
          uStatus === 'deleted_by_seller' ||
          uStatus === 'paused_by_seller'
        ) {
          return 90
        }
        if (item.status === 'accepted') return 10
        if (item.status === 'counter_offered') return 20
        const diffs = Array.isArray(item.diff_reasons) ? item.diff_reasons : []
        if (item.status === 'unit_locked' && diffs.includes(REOPENED_PROMPT_TAG))
          return 25
        if (item.status === 'pending_seller' || item.status === 'pending_admin')
          return 30
        if (item.status === 'unit_locked') return 40
        return 80
      }
      return getPriority(a) - getPriority(b)
    })

  const activeBuyerReq =
    myBuys.find((b) => {
      const st = String((b as any).status || '').toLowerCase()
      if (st === 'closed' || st === 'archived') return false
      const areasStr = Array.isArray(b.preferred_areas)
        ? b.preferred_areas.join(' ')
        : String(b.preferred_areas || '')
      return !areasStr.includes('🎯')
    }) || null

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
        !myUnitIds.has(String(o.property_id)) &&
        !lockedByAcceptedOfferUnitIds.has(String(o.property_id)) &&
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
          !lockedByAcceptedOfferUnitIds.has(String(u.id)) &&
          !isNonGeorgianLegacyArea(u.area) &&
          !myUnitIds.has(String(u.id)) &&
          !alreadyOfferedUnitIds.has(String(u.id))
      )

    candidateMarketUnits.forEach((unit) => {
      const m = calculateSmartMatch(unit, activeBuyerReq, matchLabels, locale)
      const isFromAdmin = adminRecMap.has(String(unit.id))

      if (isFromAdmin || m.score >= AUTO_PUBLISH_MATCH_THRESHOLD) {
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
  isBackupWaitlist?: boolean
  accountCreated?: boolean
}> {
  const { dict, locale, dir } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}
  const accCommon = (dict.accountPages as Record<string, any>)?.common || {}
  const formsDict = (dict.serverActions as Record<string, any>)?.forms || {}
  const authDict = (dict.serverActions as Record<string, any>)?.auth || {}

  try {
    const supabase = await getOfferSupabase()
    const session = await getVerifiedClientSession()
    const authenticatedUser = session?.user || null
    let buyerUser = authenticatedUser
    let sessionId = authenticatedUser?.id || null
    let accountCreatedNow = false
    let setupPasswordToken = ''

    const cleanGuestName = String(payload.guestName || '').trim().slice(0, 120)
    const cleanGuestPhone = String(payload.guestPhone || '')
      .trim()
      .replace(/\s+/g, '')
      .slice(0, 25)
    const cleanGuestEmail = String(payload.guestEmail || '')
      .trim()
      .toLowerCase()
    const cleanGuestPassword = String(payload.guestPassword || '').trim()

    if (
      !sessionId &&
      (!cleanGuestName ||
        cleanGuestPhone.length < 7 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanGuestEmail))
    ) {
      return { success: false, error: oDict.errLoginRequired }
    }

    if (!sessionId && cleanGuestPhone && cleanGuestEmail) {
      const phoneTail = cleanGuestPhone.replace(/\D/g, '').slice(-8)
      const [{ data: existingByEmail }, { data: existingByPhone }] =
        await Promise.all([
          supabase
            .from('users')
            .select('id')
            .ilike('email', cleanGuestEmail)
            .limit(1)
            .maybeSingle(),
          phoneTail.length >= 8
            ? supabase
                .from('users')
                .select('id')
                .ilike('phone', `%${phoneTail}`)
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ])

      if (existingByEmail) {
        return {
          success: false,
          error:
            authDict.emailExists ||
            'هذا البريد الإلكتروني مسجل لدينا بالفعل، يرجى تسجيل الدخول أولاً.',
        }
      }
      if (existingByPhone) {
        return {
          success: false,
          error:
            authDict.phoneExists ||
            'رقم الموبايل مسجل لدينا بالفعل، يرجى تسجيل الدخول أولاً.',
        }
      }

      const autoPass =
        cleanGuestPassword.length >= 8
          ? cleanGuestPassword
          : randomBytes(10).toString('hex')
      const passHash = hashOfferPassword(autoPass)
      setupPasswordToken = randomBytes(24).toString('hex')

      const { data: createdUser } = await supabase
        .from('users')
        .insert({
          name: cleanGuestName,
          phone: cleanGuestPhone,
          email: cleanGuestEmail,
          password_hash: passHash,
          country: 'GE',
          role: 'user',
          status: 'active',
          is_verified: false,
          otp_code: setupPasswordToken,
          otp_expiry: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select('id, name, email, phone, role, status, password_hash')
        .maybeSingle()

      if (createdUser) {
        buyerUser = createdUser
        sessionId = String(createdUser.id)
        accountCreatedNow = true
        await setBuyerSessionCookie(sessionId, passHash)
      }
    }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', payload.propertyId)
      .maybeSingle()

    if (!unit) return { success: false, error: oDict.errUnitNotFound }

    const buyerNameFinal =
      buyerUser?.name || cleanGuestName || formsDict.buyerFallback || ''
    const buyerPhoneFinal = buyerUser?.phone || cleanGuestPhone || ''

    if (
      (sessionId &&
        unit.user_id &&
        String(unit.user_id) === String(sessionId)) ||
      isSelfDealOffer(
        { buyer_user_id: sessionId, buyer_phone: buyerPhoneFinal },
        unit
      )
    ) {
      return {
        success: false,
        error: oDict.errCannotOfferOwnUnit || oDict.errSubmitFailed,
      }
    }

    const cleanUnitStatus = String(unit.status || '').trim().toLowerCase()
    if (
      [
        'sold',
        'deleted_by_seller',
        'paused_by_seller',
        'paused_deletion',
        'pending',
        'under_review',
        'rejected',
      ].includes(cleanUnitStatus)
    ) {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    const { data: alreadyAcceptedDeal } = await supabase
      .from('property_offers')
      .select('id, buyer_user_id')
      .eq('property_id', unit.id)
      .eq('status', 'accepted')
      .limit(1)
      .maybeSingle()

    if (
      alreadyAcceptedDeal &&
      sessionId &&
      String(alreadyAcceptedDeal.buyer_user_id || '') === String(sessionId)
    ) {
      return {
        success: true,
        offerId: String(alreadyAcceptedDeal.id),
        offerRef: makeOfferRefCode(String(alreadyAcceptedDeal.id)),
      }
    }

    const isUnitCurrentlyInClosing =
      cleanUnitStatus === 'transferring' || Boolean(alreadyAcceptedDeal)

    let existingOfferRow: any = null
    if (sessionId) {
      const { data: existingOffer } = await supabase
        .from('property_offers')
        .select('id, status, diff_reasons')
        .eq('property_id', unit.id)
        .eq('buyer_user_id', sessionId)
        .limit(1)
        .maybeSingle()
      existingOfferRow = existingOffer
        ? normalizeOfferRecord(existingOffer)
        : null
    }

    if (sessionId && !existingOfferRow && !isUnitCurrentlyInClosing) {
      const { data: myActiveOffers } = await supabase
        .from('property_offers')
        .select('id, status')
        .eq('buyer_user_id', sessionId)
        .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

      if ((myActiveOffers || []).length >= MAX_ACTIVE_BUYER_OFFERS) {
        return {
          success: false,
          error:
            oDict.errMaxActiveOffersReached ||
            'لديك 3 عروض شراء نشطة حالياً قيد المراجعة أو التفاوض. يرجى انتظار رد الملاك أو إلغاء أحد عروضك الحالية لتتمكن من تقديم عرض جديد.',
        }
      }
    }

    if (existingOfferRow?.status === 'rejected') {
      return {
        success: false,
        error:
          oDict.errOfferAlreadyClosedOnUnit ||
          'تم إغلاق التفاوض على هذا العرض مسبقاً. إذا كنت ترغب في تقديم عرض جديد بالسعر الكامل، يرجى التواصل مع مستشار الصفقات عبر واتساب.',
      }
    }

    const guardrails = getUnitPricingGuardrails(unit)
    const requiredPaidCash = Math.max(1, Number(guardrails.requiredCash) || 1)
    const cleanOfferedCash = Math.round(Number(payload.offeredCash) || 0)

    if (!guardrails.allowNegotiation && cleanOfferedCash < requiredPaidCash) {
      return { success: false, error: oDict.errFixedPriceOnly }
    }

    if (guardrails.allowNegotiation) {
      if (cleanOfferedCash > requiredPaidCash) {
        return {
          success: false,
          error:
            oDict.errOfferExceedsPaid ||
            `الرقم المدخل يتجاوز إجمالي المبلغ المدفوع المطلوب (${requiredPaidCash.toLocaleString('en-US')}).`,
        }
      }
      const sanityFloor = Math.round(requiredPaidCash * 0.5)
      if (cleanOfferedCash < sanityFloor) {
        return {
          success: false,
          error:
            oDict.errOfferSanityIncomplete ||
            'يرجى التأكد من كتابة مبلغ العرض بالكامل وبشكل منطقي.',
        }
      }
    }

    const finalOfferedCash = guardrails.allowNegotiation
      ? Math.min(requiredPaidCash, cleanOfferedCash)
      : requiredPaidCash

    let activeLead: any = null
    if (sessionId) {
      const { data: existingLeads } = await supabase
        .from('buy_requests')
        .select('*')
        .eq('user_id', sessionId)
        .neq('status', 'closed')
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(1)
      activeLead = existingLeads?.[0] || null
    }

    if (!activeLead && buyerPhoneFinal) {
      const rawCity = String(unit.area || 'Tbilisi')
        .split(/\s*[-–—]\s*/)[0]
        .trim()
      const targetCity = rawCity || 'Tbilisi'

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
          payment_plan:
            unit.installment_frequency || formsDict.defaultMonthly || '',
          preferred_areas: [targetCity],
          unit_types: [unit.unit_type || accCommon.defaultUnitType || ''],
          min_rooms: Number(unit.rooms) || 1,
          delivery_status:
            unit.delivery_status || formsDict.defaultReady || '',
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

    const isStaffCaller = Boolean(
      authenticatedUser &&
        ['owner', 'admin', 'moderator', 'sales'].includes(
          String(authenticatedUser.role || '').toLowerCase()
        )
    )

    const initialOfferStatus: OfferStatusType = isUnitCurrentlyInClosing
      ? 'unit_locked'
      : isStaffCaller
        ? 'pending_seller'
        : 'pending_admin'

    const existingOfferId = existingOfferRow?.id
      ? String(existingOfferRow.id)
      : null

    const cleanDiffReasons = [...matchInfo.differences].filter(
      (d) =>
        d !== BUYER_HIDDEN_TAG &&
        d !== REOPENED_PROMPT_TAG &&
        d !== ADMIN_SYNCED_PRICE_TAG &&
        d !== SELLER_DELAYED_UNAVAILABLE_TAG &&
        d !== BUYER_PAUSED_FOR_DEAL_TAG
    )

    const offerRow = {
      property_id: unit.id,
      lead_id: activeLead?.id || null,
      buyer_user_id: sessionId,
      seller_user_id: unit.user_id || null,
      buyer_name: buyerNameFinal,
      buyer_phone: buyerPhoneFinal,
      offered_cash: finalOfferedCash,
      counter_cash: null,
      required_cash: requiredPaidCash,
      payment_readiness: payload.paymentReadiness,
      payment_method: payload.paymentMethod,
      match_score: matchInfo.score,
      match_reasons: reasonsList,
      diff_reasons: cleanDiffReasons,
      status: initialOfferStatus,
      initiated_by: 'buyer',
      updated_at: new Date().toISOString(),
    }

    const fallbackCompatibleRow = {
      ...offerRow,
      status: isUnitCurrentlyInClosing
        ? 'unit_locked'
        : isStaffCaller
          ? 'pending_seller'
          : 'recommended',
      diff_reasons:
        isUnitCurrentlyInClosing || isStaffCaller
          ? cleanDiffReasons
          : [...cleanDiffReasons, PENDING_ADMIN_TAG],
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
    const projectTitle = sanitizeGeorgiaProjectTitle(unit.project_name)

    if (accountCreatedNow && cleanGuestEmail && setupPasswordToken) {
      const setPassUrl = `${DEFAULT_SITE_URL}/set-password?token_hash=${encodeURIComponent(setupPasswordToken)}&next=${encodeURIComponent('/account/offers?role=buyer')}`
      sendOfferTransactionalEmail({
        to: cleanGuestEmail,
        dir,
        subject:
          locale === 'en'
            ? `Offer Received (${offerRef}) — ${projectTitle} | DualDealz`
            : `تم استلام عرضك (${offerRef}) على ${projectTitle} — DualDealz`,
        heading:
          locale === 'en'
            ? `Thank you, ${buyerNameFinal}! Your offer has been received.`
            : `أهلاً بك يا ${buyerNameFinal} — تم استلام عرضك بنجاح!`,
        bodyLines:
          locale === 'en'
            ? [
                `We received your ${isUnitCurrentlyInClosing ? 'waitlist request' : 'purchase offer'} of <strong>$${finalOfferedCash.toLocaleString('en-US')}</strong> for <strong>${projectTitle}</strong> (Ref: #${offerRef}).`,
                `Expect a call or message from our sales advisor shortly to confirm your offer and coordinate the next steps with you.`,
                `We also created your personal account automatically so you can track your offers and view matching units. Click below to confirm your email and set a password whenever you like:`,
              ]
            : [
                `تم استلام ${isUnitCurrentlyInClosing ? 'طلب انضمامك لقائمة الانتظار' : 'عرض الشراء الخاص بك'} بمبلغ <strong>$${finalOfferedCash.toLocaleString('en-US')}</strong> على وحدة <strong>${projectTitle}</strong> (رقم المرجع: #${offerRef}).`,
                `انتظر مكالمة أو رسالة من مسؤول المبيعات قريباً لتأكيد العرض والتنسيق معك في كل خطوة.`,
                `كما أنشأنا لك حساباً شخصياً تلقائياً لمتابعة عروضك والوحدات المطابقة لميزانيتك؛ يمكنك الضغط بالأسفل لتأكيد بريدك الإلكتروني وتعيين كلمة مرور لحسابك وقتما تشاء:`,
              ],
        ctaText:
          locale === 'en'
            ? 'Confirm Email & Set Password'
            : 'تأكيد الإيميل وتعيين كلمة المرور',
        ctaUrl: setPassUrl,
      }).catch(() => {})
    }

    const notifsToInsert: any[] = [
      {
        user_id: null,
        role: 'admin',
        title: isUnitCurrentlyInClosing
          ? `⏳ ${oDict.waitlistAdminNotifTitle || 'تسجيل اهتمام احتياطي'} (${offerRef}): ${projectTitle}`
          : `🎯 ${oDict.adminNewOfferNotifTitle} (${offerRef}): ${projectTitle}`,
        message: `${buyerNameFinal} (${buyerPhoneFinal}) — $${finalOfferedCash.toLocaleString('en-US')}`,
        type: 'lead',
        link: isUnitCurrentlyInClosing
          ? `/admin/deals?offerId=${savedOfferId}`
          : `/admin/offers?offerId=${savedOfferId}`,
        is_read: false,
      },
    ]

    if (initialOfferStatus === 'pending_seller' && unit.user_id) {
      if (cleanUnitStatus === 'active') {
        await supabase
          .from('sell_requests')
          .update({ status: 'offer_received' })
          .eq('id', unit.id)
      }
      if (activeLead?.id && isAdvanceableToMatched(activeLead.status)) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', activeLead.id)
      }
      notifsToInsert.push({
        user_id: unit.user_id,
        role: 'client',
        title: `💰 ${oDict.sellerNewOfferNotifTitle} (${projectTitle})`,
        message: `$${finalOfferedCash.toLocaleString('en-US')}`,
        type: 'new_offer',
        link: `/account/offers?role=seller&unitId=${unit.id}&offerId=${savedOfferId}`,
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
      isBackupWaitlist: isUnitCurrentlyInClosing,
      accountCreated: accountCreatedNow,
    }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function manageBuyerOwnOfferAction(payload: {
  offerId: string
  action:
    | 'update_pending_price'
    | 'cancel_offer'
    | 'confirm_reopened_interest'
    | 'dismiss_from_list'
  newOfferedCash?: number
}) {
  const { dict } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const session = await getVerifiedClientSession()
    if (!session) return { success: false, error: oDict.errLoginRequired }
    const { supabase, user } = session

    const { data: rawOffer } = await supabase
      .from('property_offers')
      .select('*')
      .eq('id', payload.offerId)
      .maybeSingle()

    if (!rawOffer) return { success: false, error: oDict.errUnitNotFound }
    const offer = normalizeOfferRecord(rawOffer)

    if (String(offer.buyer_user_id || '') !== String(user.id)) {
      return { success: false, error: oDict.errLoginRequired }
    }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle()

    const currentDiffs = Array.isArray(offer.diff_reasons)
      ? [...offer.diff_reasons]
      : []

    if (payload.action === 'dismiss_from_list') {
      const nextDiffs = Array.from(new Set([...currentDiffs, BUYER_HIDDEN_TAG]))
      await supabase
        .from('property_offers')
        .update({
          diff_reasons: nextDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      revalidateAllOfferPaths()
      return { success: true }
    }

    if (payload.action === 'cancel_offer') {
      if (offer.status === 'accepted') {
        return {
          success: false,
          error:
            oDict.errCannotCancelAcceptedDeal ||
            'العرض في مرحلة إتمام التعاقد حالياً، يرجى التواصل مع مستشار الصفقة عبر واتساب.',
        }
      }
      const nextDiffs = Array.from(
        new Set([
          ...currentDiffs.filter(
            (d) =>
              d !== PENDING_ADMIN_TAG &&
              d !== REOPENED_PROMPT_TAG &&
              d !== BUYER_PAUSED_FOR_DEAL_TAG
          ),
          BUYER_HIDDEN_TAG,
        ])
      )
      await supabase
        .from('property_offers')
        .update({
          status: 'rejected',
          diff_reasons: nextDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      revalidateAllOfferPaths()
      return { success: true }
    }

    if (!unit) return { success: false, error: oDict.errUnitNotFound }
    const requiredPaid = Math.max(
      1,
      Number(unit.paid_amount || offer.required_cash) || 1
    )

    if (payload.action === 'update_pending_price') {
      if (offer.status !== 'pending_admin' && offer.status !== 'unit_locked') {
        return {
          success: false,
          error:
            oDict.errCannotEditSentOffer ||
            'تم إرسال العرض للمالك بالفعل ولا يمكن تعديله إلا بعد رد المالك.',
        }
      }
      const cleanNewCash = Math.round(Number(payload.newOfferedCash) || 0)
      if (
        cleanNewCash > requiredPaid ||
        cleanNewCash < Math.round(requiredPaid * 0.5)
      ) {
        return {
          success: false,
          error:
            oDict.errOfferExceedsPaid ||
            'يرجى إدخال مبلغ صحيح لا يتجاوز المبلغ المدفوع المطلوب.',
        }
      }

      await supabase
        .from('property_offers')
        .update({
          offered_cash: cleanNewCash,
          required_cash: requiredPaid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      revalidateAllOfferPaths()
      return { success: true }
    }

    if (payload.action === 'confirm_reopened_interest') {
      const { data: activeAccepted } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', unit.id)
        .eq('status', 'accepted')
        .limit(1)

      if (
        unit.status === 'transferring' ||
        unit.status === 'sold' ||
        (activeAccepted && activeAccepted.length > 0)
      ) {
        const cleanedDiffs = currentDiffs.filter(
          (d) => d !== REOPENED_PROMPT_TAG && d !== BUYER_PAUSED_FOR_DEAL_TAG
        )
        await supabase
          .from('property_offers')
          .update({ status: 'unit_locked', diff_reasons: cleanedDiffs })
          .eq('id', offer.id)

        revalidateAllOfferPaths()
        return {
          success: false,
          error:
            oDict.errUnitLockedAgainKeepWaitlist ||
            'تم حجز الوحدة لمشترٍ آخر للتو، ويظل عرضك محفوظاً في قائمة الانتظار.',
        }
      }

      const nextCash = payload.newOfferedCash
        ? Math.min(
            requiredPaid,
            Math.max(
              Math.round(requiredPaid * 0.5),
              Math.round(Number(payload.newOfferedCash))
            )
          )
        : Number(offer.offered_cash)

      const updatedDiffs = Array.from(
        new Set([
          ...currentDiffs.filter(
            (d) =>
              d !== REOPENED_PROMPT_TAG && d !== BUYER_PAUSED_FOR_DEAL_TAG
          ),
          PRIORITY_RETURNED_TAG,
        ])
      )

      let { error } = await supabase
        .from('property_offers')
        .update({
          offered_cash: nextCash,
          required_cash: requiredPaid,
          status: 'pending_admin',
          diff_reasons: updatedDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      if (error) {
        await supabase
          .from('property_offers')
          .update({
            offered_cash: nextCash,
            required_cash: requiredPaid,
            status: 'recommended',
            diff_reasons: [...updatedDiffs, PENDING_ADMIN_TAG],
            updated_at: new Date().toISOString(),
          })
          .eq('id', offer.id)
      }

      const offerRef = makeOfferRefCode(offer.id)
      try {
        await supabase.from('notifications').insert({
          user_id: null,
          role: 'admin',
          title: `⭐ ${oDict.priorityBuyerReturnedAdminTitle || 'عميل أولوية عائد من الاحتياطي'} (${offerRef}): ${sanitizeGeorgiaProjectTitle(unit.project_name)}`,
          message: `${user.name || offer.buyer_name || ''} — $${nextCash.toLocaleString('en-US')}`,
          type: 'lead',
          link: `/admin/offers?offerId=${offer.id}`,
          is_read: false,
        })
      } catch {}

      revalidateAllOfferPaths()
      return { success: true }
    }

    return { success: false, error: oDict.errSubmitFailed }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function respondToOfferBySellerAction(payload: {
  offerId: string
  decision: 'accept' | 'counter' | 'reject'
  counterCash?: number
}) {
  const { dict, dir } = await getServerI18n()
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

    const normalizedCurrent = normalizeOfferRecord(offer)
    if (
      normalizedCurrent.status !== 'pending_seller' &&
      payload.decision !== 'reject'
    ) {
      revalidateAllOfferPaths()
      return {
        success: false,
        error:
          oDict.errStaleOfferState ||
          'تم تحديث حالة هذا العرض للتو، يرجى مراجعة أحدث حالة في صفحتك.',
      }
    }

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
            oDict.errSellerAlreadyAcceptedAnother ||
            oDict.errUnitAlreadyLocked,
        }
      }

      await supabase
        .from('property_offers')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', offer.id)

      await supabase
        .from('property_offers')
        .update({ status: 'unit_locked' })
        .eq('property_id', unit.id)
        .neq('id', offer.id)
        .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

      await supabase
        .from('sell_requests')
        .update({ status: 'transferring' })
        .eq('id', unit.id)

      await freezeBuyerOtherPendingOffers(supabase, offer)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
          .neq('status', 'closed')
      }

      const offerRef = makeOfferRefCode(offer.id)
      const notifs: any[] = [
        {
          user_id: null,
          role: 'admin',
          title: `🔥 ${oDict.adminDealAcceptedNotifTitle} (${offerRef}): ${sanitizeGeorgiaProjectTitle(unit.project_name)}`,
          message: `${unit.name} 🤝 ${offer.buyer_name || ''} ($${Number(offer.offered_cash).toLocaleString('en-US')})`,
          type: 'property',
          link: `/admin/deals?offerId=${offer.id}`,
          is_read: false,
        },
      ]

      if (offer.buyer_user_id) {
        notifs.push({
          user_id: offer.buyer_user_id,
          role: 'client',
          title: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          message: oDict.buyerOfferAcceptedNotifMsg,
          type: 'status_update',
          link: '/account/offers?role=buyer',
          is_read: false,
        })
      }

      const buyerContact = await resolveBuyerEmail(supabase, offer)
      if (buyerContact.email) {
        sendOfferTransactionalEmail({
          to: buyerContact.email,
          dir,
          subject: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          heading: oDict.buyerOfferAcceptedNotifTitle,
          bodyLines: [
            `${oDict.buyerOfferAcceptedNotifMsg} (${sanitizeGeorgiaProjectTitle(unit.project_name)}) — $${Number(offer.offered_cash).toLocaleString('en-US')}.`,
          ],
          ctaText: oDict.buyerTitle || 'My Offers',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=buyer`,
        }).catch(() => {})
      }

      try {
        await supabase.from('notifications').insert(notifs)
      } catch {}
    } else if (payload.decision === 'counter') {
      const cleanCounter = Math.round(Number(payload.counterCash) || 0)
      const maxPrice = Number(unit.paid_amount) || offer.required_cash

      if (cleanCounter <= offer.offered_cash || cleanCounter > maxPrice) {
        return { success: false, error: oDict.errInvalidCounterAmount }
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
            role: 'client',
            title: `🔄 ${oDict.buyerCounterNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
            message: `$${cleanCounter.toLocaleString('en-US')}`,
            type: 'new_offer',
            link: '/account/offers?role=buyer',
            is_read: false,
          })
        } catch {}
      }

      const buyerContact = await resolveBuyerEmail(supabase, offer)
      if (buyerContact.email) {
        sendOfferTransactionalEmail({
          to: buyerContact.email,
          dir,
          subject: `🔄 ${oDict.buyerCounterNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          heading: `${oDict.buyerCounterNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          bodyLines: [
            `${oDict.sellerCounterReceivedText}: $${cleanCounter.toLocaleString('en-US')}.`,
          ],
          ctaText: oDict.acceptCounterBtn || 'Review Offer',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=buyer`,
        }).catch(() => {})
      }
    } else if (payload.decision === 'reject') {
      const wasAccepted = offer.status === 'accepted'
      await supabase
        .from('property_offers')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', offer.id)

      if (wasAccepted) {
        await unfreezeBuyerPausedOffers(supabase, offer)
      }

      const { data: remainingOffers } = await supabase
        .from('property_offers')
        .select('id, status')
        .eq('property_id', unit.id)
        .in('status', ['pending_seller', 'counter_offered', 'accepted'])

      const stillHasAccepted = (remainingOffers || []).some(
        (r: any) => r.status === 'accepted'
      )

      if (!remainingOffers || remainingOffers.length === 0) {
        if (
          unit.status === 'offer_received' ||
          unit.status === 'transferring'
        ) {
          await supabase
            .from('sell_requests')
            .update({ status: 'active' })
            .eq('id', unit.id)
        }
      } else if (!stillHasAccepted && unit.status === 'transferring') {
        await supabase
          .from('sell_requests')
          .update({ status: 'offer_received' })
          .eq('id', unit.id)
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
  const { dict, dir } = await getServerI18n()
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

    const role = String(user.role || 'user').trim().toLowerCase()
    const isStaff = ['owner', 'admin', 'moderator', 'sales'].includes(role)
    if (!isStaff && String(offer.buyer_user_id) !== String(user.id)) {
      return { success: false, error: oDict.errLoginRequired }
    }

    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', offer.property_id)
      .maybeSingle()

    if (!unit || unit.status === 'sold' || unit.status === 'transferring') {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    if (payload.decision === 'accept') {
      if (!isStaff && offer.buyer_user_id) {
        const { data: buyerExistingAccepted } = await supabase
          .from('property_offers')
          .select('id')
          .eq('buyer_user_id', offer.buyer_user_id)
          .eq('status', 'accepted')
          .neq('id', offer.id)
          .limit(1)

        if (buyerExistingAccepted && buyerExistingAccepted.length > 0) {
          return {
            success: false,
            error:
              oDict.errBuyerDoubleAcceptance ||
              'لديك وحدة أخرى في مرحلة إتمام التعاقد حالياً.',
          }
        }
      }

      const { data: alreadyAccepted } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', unit.id)
        .eq('status', 'accepted')
        .neq('id', offer.id)
        .limit(1)

      if (alreadyAccepted && alreadyAccepted.length > 0) {
        return { success: false, error: oDict.errUnitAlreadyLocked }
      }

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
        .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

      await supabase
        .from('sell_requests')
        .update({ status: 'transferring' })
        .eq('id', unit.id)

      await freezeBuyerOtherPendingOffers(supabase, offer)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
          .neq('status', 'closed')
      }

      const offerRef = makeOfferRefCode(offer.id)
      const notifs: any[] = [
        {
          user_id: null,
          role: 'admin',
          title: `🔥 ${oDict.adminDealAcceptedNotifTitle} (${offerRef}): ${sanitizeGeorgiaProjectTitle(unit.project_name)}`,
          message: `${unit.name} 🤝 ${offer.buyer_name || ''} ($${agreedAmount.toLocaleString('en-US')})`,
          type: 'property',
          link: `/admin/deals?offerId=${offer.id}`,
          is_read: false,
        },
      ]

      if (unit.user_id) {
        notifs.push({
          user_id: unit.user_id,
          role: 'client',
          title: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          message: `$${agreedAmount.toLocaleString('en-US')}`,
          type: 'status_update',
          link: `/account/offers?role=seller&unitId=${unit.id}`,
          is_read: false,
        })
      }

      const sellerContact = await resolveSellerEmail(supabase, unit)
      if (sellerContact.email) {
        sendOfferTransactionalEmail({
          to: sellerContact.email,
          dir,
          subject: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          heading: oDict.sellerCounterAcceptedNotifTitle,
          bodyLines: [
            `${sanitizeGeorgiaProjectTitle(unit.project_name)} — $${agreedAmount.toLocaleString('en-US')}.`,
            oDict.dealLockedBannerForSeller || '',
          ],
          ctaText: oDict.sellerTitle || 'View Deal',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=seller&unitId=${unit.id}`,
        }).catch(() => {})
      }

      try {
        await supabase.from('notifications').insert(notifs)
      } catch {}
    } else {
      await supabase
        .from('property_offers')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', offer.id)

      const { data: remainingOffers } = await supabase
        .from('property_offers')
        .select('id, status')
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

export async function adminGetDealsRoomDataAction() {
  try {
    const auth = await verifyStaffSession()
    if (!auth) {
      return {
        authorized: false,
        offers: [] as any[],
        units: [] as any[],
        leads: [] as any[],
      }
    }
    const { supabase } = auth

    const [{ data: offersData }, { data: unitsData }, { data: leadsData }] =
      await Promise.all([
        supabase
          .from('property_offers')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase
          .from('sell_requests')
          .select('*')
          .neq('status', 'deleted_by_seller'),
        supabase
          .from('buy_requests')
          .select('*')
          .neq('status', 'closed')
          .neq('status', 'archived')
          .order('created_at', { ascending: false }),
      ])

    const cleanedUnits = ((unitsData || []) as any[]).map((u) => ({
      ...u,
      project_name: sanitizeGeorgiaProjectTitle(u.project_name),
    }))
    const uMap = new Map(cleanedUnits.map((u) => [String(u.id), u]))

    const selfOfferIdsToDelete: string[] = []
    const validNormalizedOffers = ((offersData || []) as any[])
      .map(normalizeOfferRecord)
      .filter((o) => {
        if (o.status === 'recommended') return false
        const unit = uMap.get(String(o.property_id))
        if (!unit) return false
        if (isSelfDealOffer(o, unit)) {
          selfOfferIdsToDelete.push(String(o.id))
          return false
        }
        return true
      })

    if (selfOfferIdsToDelete.length > 0) {
      try {
        await supabase
          .from('property_offers')
          .delete()
          .in('id', selfOfferIdsToDelete)
      } catch {}
    }

    return {
      authorized: true,
      offers: validNormalizedOffers,
      units: cleanedUnits,
      leads: (leadsData || []) as any[],
    }
  } catch (e) {
    console.error('adminGetDealsRoomDataAction error:', e)
    return {
      authorized: false,
      offers: [] as any[],
      units: [] as any[],
      leads: [] as any[],
    }
  }
}

export async function adminManageOfferLifecycleAction(payload: {
  offerId: string
  action:
    | 'approve_to_seller'
    | 'admin_accept_deal'
    | 'reopen_unit_offers'
    | 'mark_unit_sold'
    | 'reject_offer'
    | 'seller_unresponsive_cancel'
  negotiatedCash?: number
}) {
  const { dict, dir } = await getServerI18n()
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
      ? offer.diff_reasons.filter(
          (d: string) =>
            d !== PENDING_ADMIN_TAG &&
            d !== REOPENED_PROMPT_TAG &&
            d !== BUYER_HIDDEN_TAG &&
            d !== SELLER_DELAYED_UNAVAILABLE_TAG &&
            d !== BUYER_PAUSED_FOR_DEAL_TAG
        )
      : []

    if (payload.action === 'approve_to_seller') {
      const nextCash =
        payload.negotiatedCash && Number(payload.negotiatedCash) > 0
          ? Math.round(Number(payload.negotiatedCash))
          : Number(offer.offered_cash)

      const wasPriceAdjustedByAdmin = nextCash !== Number(offer.offered_cash)
      const diffsWithSyncTag = wasPriceAdjustedByAdmin
        ? Array.from(new Set([...cleanDiffs, ADMIN_SYNCED_PRICE_TAG]))
        : cleanDiffs

      await supabase
        .from('property_offers')
        .update({
          offered_cash: nextCash,
          counter_cash: null,
          status: 'pending_seller',
          diff_reasons: diffsWithSyncTag,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      if (unit.status === 'active') {
        await supabase
          .from('sell_requests')
          .update({ status: 'offer_received' })
          .eq('id', unit.id)
      }

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
          .in('status', ['new', 'contacted'])
      }

      if (unit.user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: unit.user_id,
            role: 'client',
            title: `💰 ${oDict.sellerNewOfferNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
            message: `$${nextCash.toLocaleString('en-US')}`,
            type: 'new_offer',
            link: `/account/offers?role=seller&unitId=${unit.id}&offerId=${offer.id}`,
            is_read: false,
          })
        } catch {}
      }

      const sellerContact = await resolveSellerEmail(supabase, unit)
      if (sellerContact.email) {
        sendOfferTransactionalEmail({
          to: sellerContact.email,
          dir,
          subject: `💰 ${oDict.sellerNewOfferNotifTitle} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
          heading: oDict.sellerNewOfferNotifTitle,
          bodyLines: [
            `${sanitizeGeorgiaProjectTitle(unit.project_name)} — $${nextCash.toLocaleString('en-US')}.`,
            oDict.sellerSubtitle || '',
          ],
          ctaText: oDict.sellerTitle || 'Review Offer',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=seller&unitId=${unit.id}`,
        }).catch(() => {})
      }

      if (offer.buyer_user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: offer.buyer_user_id,
            role: 'client',
            title: `⏳ ${oDict.statusWaitingSellerBadge} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
            message: `$${nextCash.toLocaleString('en-US')}`,
            type: 'status_update',
            link: `/account/offers?role=buyer&offerId=${offer.id}`,
            is_read: false,
          })
        } catch {}
      }
    } else if (payload.action === 'admin_accept_deal') {
      const agreedCash =
        payload.negotiatedCash && Number(payload.negotiatedCash) > 0
          ? Math.round(Number(payload.negotiatedCash))
          : Number(offer.counter_cash || offer.offered_cash)

      await supabase
        .from('property_offers')
        .update({
          offered_cash: agreedCash,
          status: 'accepted',
          diff_reasons: cleanDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      await supabase
        .from('property_offers')
        .update({ status: 'unit_locked' })
        .eq('property_id', unit.id)
        .neq('id', offer.id)
        .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

      await supabase
        .from('sell_requests')
        .update({ status: 'transferring' })
        .eq('id', unit.id)

      await freezeBuyerOtherPendingOffers(supabase, offer)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', offer.lead_id)
          .neq('status', 'closed')
      }

      // توثيق الاتفاق الهاتفي فوراً بإشعار وإيميل للطرفين (البائع والمشتري)
      const projectTitle = sanitizeGeorgiaProjectTitle(unit.project_name)
      const notifs: any[] = []
      if (offer.buyer_user_id) {
        notifs.push({
          user_id: offer.buyer_user_id,
          role: 'client',
          title: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${projectTitle})`,
          message: `$${agreedCash.toLocaleString('en-US')} — ${oDict.buyerOfferAcceptedNotifMsg}`,
          type: 'status_update',
          link: '/account/offers?role=buyer',
          is_read: false,
        })
      }
      if (unit.user_id) {
        notifs.push({
          user_id: unit.user_id,
          role: 'client',
          title: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${projectTitle})`,
          message: `$${agreedCash.toLocaleString('en-US')}`,
          type: 'status_update',
          link: `/account/offers?role=seller&unitId=${unit.id}`,
          is_read: false,
        })
      }
      if (notifs.length > 0) {
        try {
          await supabase.from('notifications').insert(notifs)
        } catch {}
      }

      const [buyerContact, sellerContact] = await Promise.all([
        resolveBuyerEmail(supabase, offer),
        resolveSellerEmail(supabase, unit),
      ])

      if (buyerContact.email) {
        sendOfferTransactionalEmail({
          to: buyerContact.email,
          dir,
          subject: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${projectTitle})`,
          heading: oDict.buyerOfferAcceptedNotifTitle,
          bodyLines: [
            `${oDict.buyerOfferAcceptedNotifMsg} (${projectTitle}) — $${agreedCash.toLocaleString('en-US')}.`,
          ],
          ctaText: oDict.buyerTitle || 'My Offers',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=buyer`,
        }).catch(() => {})
      }

      if (sellerContact.email) {
        sendOfferTransactionalEmail({
          to: sellerContact.email,
          dir,
          subject: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${projectTitle})`,
          heading: oDict.sellerCounterAcceptedNotifTitle,
          bodyLines: [
            `${projectTitle} — $${agreedCash.toLocaleString('en-US')}.`,
            oDict.dealLockedBannerForSeller || '',
          ],
          ctaText: oDict.sellerTitle || 'View Deal',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=seller&unitId=${unit.id}`,
        }).catch(() => {})
      }
    } else if (payload.action === 'reopen_unit_offers') {
      await supabase
        .from('property_offers')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', offer.id)

      await supabase
        .from('sell_requests')
        .update({ status: 'active' })
        .eq('id', unit.id)

      await unfreezeBuyerPausedOffers(supabase, offer)

      const { data: backupOffers } = await supabase
        .from('property_offers')
        .select('*')
        .eq('property_id', unit.id)
        .eq('status', 'unit_locked')

      if (backupOffers && backupOffers.length > 0) {
        for (const bOffer of backupOffers) {
          const bDiffs = Array.isArray(bOffer.diff_reasons)
            ? bOffer.diff_reasons.filter((d: string) => d !== BUYER_HIDDEN_TAG)
            : []
          const nextDiffs = Array.from(
            new Set([...bDiffs, REOPENED_PROMPT_TAG])
          )

          await supabase
            .from('property_offers')
            .update({
              diff_reasons: nextDiffs,
              updated_at: new Date().toISOString(),
            })
            .eq('id', bOffer.id)

          if (bOffer.buyer_user_id) {
            try {
              await supabase.from('notifications').insert({
                user_id: bOffer.buyer_user_id,
                role: 'client',
                title: `🔥 ${oDict.reopenedUnitBuyerNotifTitle || 'عادت الوحدة متاحة للسوق!'} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
                message:
                  oDict.reopenedUnitBuyerNotifMsg ||
                  'أنت في قائمة الأولوية الاحتياطية لهذه الوحدة. اضغط هنا لتأكيد اهتمامك إذا كنت لا تزال راغباً في شرائها.',
                type: 'status_update',
                link: '/account/offers?role=buyer',
                is_read: false,
              })
            } catch {}
          }

          const bContact = await resolveBuyerEmail(supabase, bOffer)
          if (bContact.email) {
            sendOfferTransactionalEmail({
              to: bContact.email,
              dir,
              subject: `🔥 ${oDict.reopenedUnitBuyerNotifTitle || 'عادت الوحدة متاحة للسوق!'} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
              heading: `${sanitizeGeorgiaProjectTitle(unit.project_name)}`,
              bodyLines: [
                oDict.reopenedUnitBuyerNotifMsg ||
                  'لم تكتمل إجراءات التعاقد السابقة وعادت الوحدة متاحة الآن. يمكنك الدخول لتأكيد اهتمامك فوراً.',
              ],
              ctaText: oDict.confirmReopenedBtn || 'Confirm My Offer',
              ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=buyer`,
            }).catch(() => {})
          }
        }
      }
    } else if (payload.action === 'mark_unit_sold') {
      await supabase
        .from('property_offers')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', offer.id)

      await supabase
        .from('sell_requests')
        .update({ status: 'sold' })
        .eq('id', unit.id)

      if (offer.lead_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'closed' })
          .eq('id', offer.lead_id)
      } else if (offer.buyer_user_id) {
        await supabase
          .from('buy_requests')
          .update({ status: 'closed' })
          .eq('user_id', offer.buyer_user_id)
          .neq('status', 'closed')
      }

      await purgeBuyerOtherOffersOnSale(supabase, offer)

      const { data: otherOffers } = await supabase
        .from('property_offers')
        .select('id, buyer_user_id')
        .eq('property_id', unit.id)
        .neq('id', offer.id)

      if (otherOffers && otherOffers.length > 0) {
        const buyerIds = Array.from(
          new Set(otherOffers.map((o: any) => o.buyer_user_id).filter(Boolean))
        ) as string[]
        if (buyerIds.length > 0) {
          try {
            await supabase.from('notifications').insert(
              buyerIds.map((bId) => ({
                user_id: bId,
                role: 'client',
                title: `ℹ️ ${oDict.unitSoldToOtherNotifTitle || 'تم بيع الوحدة نهائياً'} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
                message:
                  oDict.unitSoldToOtherNotifMsg ||
                  'تم إتمام بيع هذه الوحدة لمشترٍ آخر. استكشف الفرص المشابهة المطابقة لميزانيتك في حسابك.',
                type: 'status_update',
                link: '/account/offers?role=buyer',
                is_read: false,
              }))
            )
          } catch {}
        }
      }
    } else if (payload.action === 'seller_unresponsive_cancel') {
      const { data: pendingUnitOffers } = await supabase
        .from('property_offers')
        .select('id, buyer_user_id, diff_reasons')
        .eq('property_id', unit.id)
        .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

      const targets =
        pendingUnitOffers && pendingUnitOffers.length > 0
          ? pendingUnitOffers
          : [offer]

      for (const tOffer of targets) {
        const tDiffs = Array.isArray(tOffer.diff_reasons)
          ? tOffer.diff_reasons.filter((d: string) => d !== PENDING_ADMIN_TAG)
          : []
        const updatedDiffs = Array.from(
          new Set([...tDiffs, SELLER_DELAYED_UNAVAILABLE_TAG])
        )

        await supabase
          .from('property_offers')
          .update({
            status: 'rejected',
            diff_reasons: updatedDiffs,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tOffer.id)

        if (tOffer.buyer_user_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: tOffer.buyer_user_id,
              role: 'client',
              title: `ℹ️ ${oDict.sellerDelayedNotifTitle || 'تحديث بخصوص عرضك على وحدة'} (${sanitizeGeorgiaProjectTitle(unit.project_name)})`,
              message:
                oDict.sellerDelayedNotifMsg ||
                'المالك غير متاح للرد وإتمام الإجراءات في الوقت الحالي.',
              type: 'status_update',
              link: '/account/offers?role=buyer',
              is_read: false,
            })
          } catch {}
        }
      }

      if (unit.status === 'offer_received') {
        await supabase
          .from('sell_requests')
          .update({ status: 'active' })
          .eq('id', unit.id)
      }
    } else if (payload.action === 'reject_offer') {
      const wasAccepted = offer.status === 'accepted'

      await supabase
        .from('property_offers')
        .update({
          status: 'rejected',
          diff_reasons: cleanDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id)

      if (wasAccepted) {
        await unfreezeBuyerPausedOffers(supabase, offer)
      }

      const { data: remainingOffers } = await supabase
        .from('property_offers')
        .select('id, status')
        .eq('property_id', unit.id)
        .in('status', ['pending_seller', 'counter_offered', 'accepted'])

      if (!remainingOffers || remainingOffers.length === 0) {
        if (
          unit.status === 'offer_received' ||
          (wasAccepted && unit.status === 'transferring')
        ) {
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

export async function adminSendRecommendationAction(payload: {
  propertyId: string
  leadId: string
}) {
  const { dict, locale, dir } = await getServerI18n()
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

    const leadSt = String(lead.status || '').trim().toLowerCase()
    if (leadSt === 'closed' || leadSt === 'archived') {
      return {
        success: false,
        error: 'لا يمكن إرسال ترشيح لطلب شراء مغلق أو مؤرشف.',
      }
    }

    if (unit.status === 'transferring' || unit.status === 'sold') {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    if (
      isSelfDealOffer(
        { buyer_user_id: lead.user_id, buyer_phone: lead.phone },
        unit
      )
    ) {
      return {
        success: false,
        error: oDict.errCannotOfferOwnUnit || oDict.errSubmitFailed,
      }
    }

    const match = calculateSmartMatch(unit, lead, undefined, locale)
    let buyerUserId = lead.user_id || null
    if (!buyerUserId && lead.phone) {
      const { data: matchedUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', String(lead.phone).trim())
        .limit(1)
        .maybeSingle()
      if (matchedUser?.id) buyerUserId = String(matchedUser.id)
    }

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
        buyer_user_id: buyerUserId,
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

    if (isAdvanceableToMatched(lead.status)) {
      await supabase
        .from('buy_requests')
        .update({ status: 'matched' })
        .eq('id', lead.id)
    }

    const projectTitle = sanitizeGeorgiaProjectTitle(unit.project_name)
    if (buyerUserId) {
      try {
        await supabase.from('notifications').insert({
          user_id: buyerUserId,
          role: 'client',
          title: `⭐ ${oDict.buyerAdminRecNotifTitle} (${match.score}%)`,
          message: `${projectTitle} — ${unit.area || ''}`,
          type: 'property_match',
          link: `/opportunities/${unit.id}`,
          is_read: false,
        })
      } catch {}
    }

    const buyerEmail = lead.email ? String(lead.email).trim() : null
    if (buyerEmail) {
      sendOfferTransactionalEmail({
        to: buyerEmail,
        dir,
        subject: `⭐ ${oDict.buyerAdminRecNotifTitle} — ${projectTitle}`,
        heading: `${oDict.adminRecommendedBadge || oDict.buyerAdminRecNotifTitle}`,
        bodyLines: [
          `${projectTitle} — ${unit.area || ''} ($${Number(unit.paid_amount || 0).toLocaleString('en-US')}).`,
        ],
        ctaText: oDict.viewUnitPageBtn || 'View Unit',
        ctaUrl: `${DEFAULT_SITE_URL}/opportunities/${unit.id}`,
      }).catch(() => {})
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

    const threshold = payload.minScore || 60

    const [{ data: unit }, { data: allLeads }] = await Promise.all([
      supabase
        .from('sell_requests')
        .select('*')
        .eq('id', payload.propertyId)
        .maybeSingle(),
      supabase
        .from('buy_requests')
        .select('*')
        .neq('status', 'closed')
        .neq('status', 'archived'),
    ])

    if (!unit || !allLeads) {
      return { success: false, error: oDict.errUnitNotFound, sentCount: 0 }
    }

    if (unit.status === 'transferring' || unit.status === 'sold') {
      return { success: false, error: oDict.errUnitAlreadyLocked, sentCount: 0 }
    }

    let sentCount = 0
    for (const lead of allLeads) {
      if (
        isSelfDealOffer(
          { buyer_user_id: lead.user_id, buyer_phone: lead.phone },
          unit
        )
      ) {
        continue
      }
      const m = calculateSmartMatch(unit, lead, undefined, locale)
      if (m.score >= threshold && m.score < AUTO_PUBLISH_MATCH_THRESHOLD) {
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
  mode?: 'send_to_seller' | 'direct_accept_deal'
}): Promise<{
  success: boolean
  error?: string
  offerId?: string
  isDirectDeal?: boolean
}> {
  const { dict, locale, dir } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const auth = await verifyStaffSession()
    if (!auth) return { success: false, error: oDict.errLoginRequired }
    const { supabase } = auth

    const isDirectDeal = payload.mode === 'direct_accept_deal'

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

    const leadSt = String(lead.status || '').trim().toLowerCase()
    if (leadSt === 'closed' || leadSt === 'archived') {
      return {
        success: false,
        error: 'لا يمكن تسجيل عرض لطلب شراء مغلق أو مؤرشف.',
      }
    }

    if (unit.status === 'transferring' || unit.status === 'sold') {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    if (
      isSelfDealOffer(
        { buyer_user_id: lead.user_id, buyer_phone: lead.phone },
        unit
      )
    ) {
      return {
        success: false,
        error: oDict.errCannotOfferOwnUnit || oDict.errSubmitFailed,
      }
    }

    const { data: lockedCheck } = await supabase
      .from('property_offers')
      .select('id')
      .eq('property_id', unit.id)
      .eq('status', 'accepted')
      .limit(1)

    if (lockedCheck && lockedCheck.length > 0) {
      return { success: false, error: oDict.errUnitAlreadyLocked }
    }

    let buyerUserId = lead.user_id || null
    if (!buyerUserId && lead.phone) {
      const { data: matchedUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', String(lead.phone).trim())
        .limit(1)
        .maybeSingle()
      if (matchedUser?.id) buyerUserId = String(matchedUser.id)
    }

    // منع بدء صفقتين متزامنتين لنفس المشتري
    if (isDirectDeal && (buyerUserId || lead.id)) {
      let activeDealQuery = supabase
        .from('property_offers')
        .select('id')
        .eq('status', 'accepted')
        .neq('property_id', unit.id)
        .limit(1)
      if (buyerUserId) {
        activeDealQuery = activeDealQuery.eq('buyer_user_id', buyerUserId)
      } else {
        activeDealQuery = activeDealQuery.eq('lead_id', lead.id)
      }
      const { data: buyerAlreadyInDeal } = await activeDealQuery
      if (buyerAlreadyInDeal && buyerAlreadyInDeal.length > 0) {
        return {
          success: false,
          error:
            oDict.errBuyerDoubleAcceptance ||
            'هذا المشتري لديه صفقة قيد التعاقد بالفعل على وحدة أخرى.',
        }
      }
    }

    const match = calculateSmartMatch(unit, lead, undefined, locale)
    const cleanCash =
      Math.round(Number(payload.offeredCash)) || Number(unit.paid_amount) || 0

    const { data: existingOffer } = await supabase
      .from('property_offers')
      .select('id')
      .eq('property_id', unit.id)
      .eq('lead_id', lead.id)
      .limit(1)
      .maybeSingle()

    const targetOfferStatus: OfferStatusType = isDirectDeal
      ? 'accepted'
      : 'pending_seller'

    let savedOfferId = ''

    if (existingOffer?.id) {
      savedOfferId = String(existingOffer.id)
      await supabase
        .from('property_offers')
        .update({
          buyer_user_id: buyerUserId,
          seller_user_id: unit.user_id || null,
          offered_cash: cleanCash,
          counter_cash: null,
          status: targetOfferStatus,
          diff_reasons: match.differences,
          initiated_by: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOffer.id)
    } else {
      const { data: inserted } = await supabase
        .from('property_offers')
        .insert({
          property_id: unit.id,
          lead_id: lead.id,
          buyer_user_id: buyerUserId,
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
          status: targetOfferStatus,
          initiated_by: 'admin',
        })
        .select('id')
        .maybeSingle()

      if (inserted?.id) savedOfferId = String(inserted.id)
    }

    const projectTitle = sanitizeGeorgiaProjectTitle(unit.project_name)

    if (isDirectDeal) {
      // قفل العروض المنافسة على الوحدة لقائمة الانتظار + تحويل الوحدة لقيد التعاقد (تظل بالماركت بشارة قيد التعاقد)
      await supabase
        .from('property_offers')
        .update({ status: 'unit_locked' })
        .eq('property_id', unit.id)
        .neq('id', savedOfferId)
        .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

      await supabase
        .from('sell_requests')
        .update({ status: 'transferring' })
        .eq('id', unit.id)

      await freezeBuyerOtherPendingOffers(supabase, {
        id: savedOfferId,
        buyer_user_id: buyerUserId,
        lead_id: lead.id,
      })

      if (isAdvanceableToMatched(lead.status)) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', lead.id)
      }

      const notifs: any[] = []
      if (unit.user_id) {
        notifs.push({
          user_id: unit.user_id,
          role: 'client',
          title: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${projectTitle})`,
          message: `$${cleanCash.toLocaleString('en-US')}`,
          type: 'status_update',
          link: `/account/offers?role=seller&unitId=${unit.id}`,
          is_read: false,
        })
      }
      if (buyerUserId) {
        notifs.push({
          user_id: buyerUserId,
          role: 'client',
          title: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${projectTitle})`,
          message: `$${cleanCash.toLocaleString('en-US')} — ${oDict.buyerOfferAcceptedNotifMsg}`,
          type: 'status_update',
          link: `/account/offers?role=buyer`,
          is_read: false,
        })
      }
      if (notifs.length > 0) {
        try {
          await supabase.from('notifications').insert(notifs)
        } catch {}
      }

      const [sellerContact, buyerContact] = await Promise.all([
        resolveSellerEmail(supabase, unit),
        resolveBuyerEmail(supabase, {
          buyer_user_id: buyerUserId,
          lead_id: lead.id,
          buyer_name: lead.name,
        }),
      ])
      if (sellerContact.email) {
        sendOfferTransactionalEmail({
          to: sellerContact.email,
          dir,
          subject: `🎉 ${oDict.sellerCounterAcceptedNotifTitle} (${projectTitle})`,
          heading: oDict.sellerCounterAcceptedNotifTitle,
          bodyLines: [
            `${projectTitle} — $${cleanCash.toLocaleString('en-US')}.`,
            oDict.dealLockedBannerForSeller || '',
          ],
          ctaText: oDict.sellerTitle || 'View Deal',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=seller&unitId=${unit.id}`,
        }).catch(() => {})
      }
      if (buyerContact.email) {
        sendOfferTransactionalEmail({
          to: buyerContact.email,
          dir,
          subject: `🎉 ${oDict.buyerOfferAcceptedNotifTitle} (${projectTitle})`,
          heading: oDict.buyerOfferAcceptedNotifTitle,
          bodyLines: [
            `${oDict.buyerOfferAcceptedNotifMsg} (${projectTitle}) — $${cleanCash.toLocaleString('en-US')}.`,
          ],
          ctaText: oDict.buyerTitle || 'My Offers',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=buyer`,
        }).catch(() => {})
      }
    } else {
      if (unit.status === 'active') {
        await supabase
          .from('sell_requests')
          .update({ status: 'offer_received' })
          .eq('id', unit.id)
      }

      if (isAdvanceableToMatched(lead.status)) {
        await supabase
          .from('buy_requests')
          .update({ status: 'matched' })
          .eq('id', lead.id)
      }

      const offerIdQuery = savedOfferId ? `&offerId=${savedOfferId}` : ''
      const notifs: any[] = []
      if (unit.user_id) {
        notifs.push({
          user_id: unit.user_id,
          role: 'client',
          title: `💰 ${oDict.sellerNewOfferNotifTitle} (${projectTitle})`,
          message: `$${cleanCash.toLocaleString('en-US')}`,
          type: 'new_offer',
          link: `/account/offers?role=seller&unitId=${unit.id}${offerIdQuery}`,
          is_read: false,
        })
      }
      if (buyerUserId) {
        notifs.push({
          user_id: buyerUserId,
          role: 'client',
          title: `✅ ${oDict.offerSubmittedSuccess}`,
          message: `${projectTitle} — $${cleanCash.toLocaleString('en-US')}`,
          type: 'new_offer',
          link: `/account/offers?role=buyer${offerIdQuery}`,
          is_read: false,
        })
      }

      if (notifs.length > 0) {
        try {
          await supabase.from('notifications').insert(notifs)
        } catch {}
      }

      const sellerContact = await resolveSellerEmail(supabase, unit)
      if (sellerContact.email) {
        sendOfferTransactionalEmail({
          to: sellerContact.email,
          dir,
          subject: `💰 ${oDict.sellerNewOfferNotifTitle} (${projectTitle})`,
          heading: oDict.sellerNewOfferNotifTitle,
          bodyLines: [
            `${projectTitle} — $${cleanCash.toLocaleString('en-US')}.`,
            oDict.sellerSubtitle || '',
          ],
          ctaText: oDict.sellerTitle || 'Review Offer',
          ctaUrl: `${DEFAULT_SITE_URL}/account/offers?role=seller&unitId=${unit.id}`,
        }).catch(() => {})
      }
    }

    revalidateAllOfferPaths()
    return {
      success: true,
      offerId: savedOfferId || undefined,
      isDirectDeal,
    }
  } catch {
    return { success: false, error: oDict.errSubmitFailed }
  }
}

export async function adminWithdrawPendingOfferAction(offerId: string) {
  const { dict } = await getServerI18n()
  const oDict = (dict.accountPages as Record<string, any>)?.offers || {}

  try {
    const auth = await verifyStaffSession()
    if (!auth) {
      return { success: false, error: oDict.errLoginRequired || 'Unauthorized' }
    }
    const { supabase } = auth

    const { data: rawOffer } = await supabase
      .from('property_offers')
      .select('id, property_id, status, diff_reasons')
      .eq('id', offerId)
      .maybeSingle()

    if (!rawOffer) return { success: true }

    const offer = normalizeOfferRecord(rawOffer)

    if (offer.status === 'accepted' || offer.status === 'counter_offered') {
      return {
        success: false,
        error:
          'لا يمكن سحب هذا العرض مباشرة لأن المالك قد ردّ عليه بالفعل؛ يرجى متابعته من قسم العروض والصفقات.',
      }
    }

    const { error: delErr } = await supabase
      .from('property_offers')
      .delete()
      .eq('id', offerId)

    if (delErr) return { success: false, error: delErr.message }

    try {
      await supabase
        .from('notifications')
        .delete()
        .ilike('link', `%offerId=${offerId}%`)
    } catch {}

    if (offer.property_id) {
      const { data: remainingOffers } = await supabase
        .from('property_offers')
        .select('id, status')
        .eq('property_id', offer.property_id)
        .in('status', ['pending_seller', 'counter_offered', 'accepted'])

      if (!remainingOffers || remainingOffers.length === 0) {
        await supabase
          .from('sell_requests')
          .update({ status: 'active' })
          .eq('id', offer.property_id)
          .eq('status', 'offer_received')
      }
    }

    revalidateAllOfferPaths()
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || oDict.errSubmitFailed || 'Unexpected error',
    }
  }
}