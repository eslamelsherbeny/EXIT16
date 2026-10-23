export type MatchableUnit = {
  id: string
  user_id?: string | null
  project_name?: string | null
  developer_name?: string | null
  area?: string | null
  unit_type?: string | null
  size?: number | null
  rooms?: number | null
  bathrooms?: number | null
  delivery_status?: string | null
  contract_price?: number | null
  paid_amount?: number | null
  market_price?: number | null
  installment_amount?: number | null
  installment_frequency?: string | null
  years_left?: number | null
  willing_to_discount?: boolean | null
  discount_amount?: number | null
  country?: string | null
  country_code?: string | null
  status?: string | null
  images?: string[] | null
  name?: string | null
  phone?: string | null
}

export type MatchableBuyer = {
  id: string
  user_id?: string | null
  name?: string | null
  phone?: string | null
  email?: string | null
  available_cash?: number | null
  max_installment?: number | null
  payment_plan?: string | null
  budget?: number | null
  unit_types?: string[] | null
  min_rooms?: number | null
  delivery_status?: string | null
  preferred_areas?: string[] | string | null
  country?: string | null
  country_code?: string | null
  status?: string | null
}

export type SmartMatchResult = {
  score: number
  isAutoPilotEligible: boolean
  isNegotiableBridge: boolean
  matches: string[]
  differences: string[]
  pricingGuardrails: {
    requiredCash: number
    allowNegotiation: boolean
    minAllowedOfferCash: number
    maxAllowedOfferCash: number
    maxDiscountAmount: number
  }
  financialAdvisor: {
    developerPenaltyEstimate: number
    netSavedAtFullPrice: number
  }
}

export function toMonthlyEquivalent(
  amount: number | null | undefined,
  freq?: string | null
): number {
  const val = Number(amount) || 0
  if (val <= 0) return 0
  const f = String(freq || '').trim().toLowerCase()
  if (f.includes('ربع') || f.includes('quarter')) return Math.round(val / 3)
  if (f.includes('نصف') || f.includes('نص') || f.includes('semi'))
    return Math.round(val / 6)
  if (
    (f.includes('سنوي') && !f.includes('نصف') && !f.includes('ربع')) ||
    f.includes('annual') ||
    f.includes('year')
  ) {
    return Math.round(val / 12)
  }
  return val
}

export function cleanPreferredAreasList(
  raw: string[] | string | null | undefined
): string[] {
  const arr = Array.isArray(raw) ? raw : raw ? [String(raw)] : []
  return arr
    .map((a) =>
      String(a)
        .replace(/🎯/g, '')
        .replace(/مهتم بوحدة:/g, '')
        .replace(/\(U-[^)]+\)/gi, '')
        .trim()
    )
    .filter(Boolean)
}

export function getUnitPricingGuardrails(unit: MatchableUnit) {
  const requiredCash = Math.max(0, Number(unit.paid_amount) || 0)
  const allowNegotiation = Boolean(unit.willing_to_discount)
  const rawSellerDiscount = Number(unit.discount_amount) || 0

  if (!allowNegotiation || requiredCash <= 0) {
    return {
      requiredCash,
      allowNegotiation: false,
      minAllowedOfferCash: requiredCash,
      maxAllowedOfferCash: requiredCash,
      maxDiscountAmount: 0,
    }
  }

  // إذا حدد البائع مبلغ خصم معين نلتزم به، وإلا فحد التفاوض الأقصى 10% لحماية البائع من بخس السعر
  const maxDiscountAmount =
    rawSellerDiscount > 0 && rawSellerDiscount < requiredCash * 0.35
      ? rawSellerDiscount
      : Math.round(requiredCash * 0.1)

  const minAllowedOfferCash = Math.max(0, requiredCash - maxDiscountAmount)

  return {
    requiredCash,
    allowNegotiation: true,
    minAllowedOfferCash,
    maxAllowedOfferCash: requiredCash,
    maxDiscountAmount,
  }
}

export function calculateSmartMatch(
  unit: MatchableUnit,
  buyer: MatchableBuyer,
  labels?: {
    cashExact?: string
    cashNegotiableBridge?: string
    cashSlightlyHigher?: string
    instMatch?: string
    instHigher?: string
    areaMatch?: string
    areaDiff?: string
    typeMatch?: string
    typeDiff?: string
    roomsMatch?: string
    roomsDiff?: string
    deliveryMatch?: string
    deliveryDiff?: string
  }
): SmartMatchResult {
  const unitCountry = (unit.country_code || unit.country || 'EG').toUpperCase()
  const buyerCountry = (
    buyer.country_code ||
    buyer.country ||
    'EG'
  ).toUpperCase()

  const guardrails = getUnitPricingGuardrails(unit)
  const contractPrice = Number(unit.contract_price) || guardrails.requiredCash
  const developerPenaltyEstimate = Math.round(contractPrice * 0.125)

  if (unitCountry !== buyerCountry) {
    return {
      score: 0,
      isAutoPilotEligible: false,
      isNegotiableBridge: false,
      matches: [],
      differences: [],
      pricingGuardrails: guardrails,
      financialAdvisor: {
        developerPenaltyEstimate,
        netSavedAtFullPrice: developerPenaltyEstimate,
      },
    }
  }

  let score = 0
  let isNegotiableBridge = false
  const matches: string[] = []
  const differences: string[] = []

  const unitCash = guardrails.requiredCash
  const buyerCash = Number(buyer.available_cash || buyer.budget || 0)

  // 1. توافق الكاش والسيولة (40 نقطة)
  if (buyerCash <= 0 || unitCash <= 0) {
    score += 30
  } else if (unitCash <= buyerCash) {
    score += 40
    matches.push(labels?.cashExact || 'cash_match')
  } else if (
    guardrails.allowNegotiation &&
    guardrails.minAllowedOfferCash <= buyerCash
  ) {
    score += 35
    isNegotiableBridge = true
    matches.push(labels?.cashNegotiableBridge || 'cash_negotiable_bridge')
  } else if (unitCash <= buyerCash * 1.15) {
    score += 26
    differences.push(labels?.cashSlightlyHigher || 'cash_slightly_higher')
  } else if (unitCash <= buyerCash * 1.3) {
    score += 14
    differences.push(labels?.cashSlightlyHigher || 'cash_higher')
  } else {
    differences.push(labels?.cashSlightlyHigher || 'cash_higher')
  }

  // 2. توافق القسط الشهري المعادل (25 نقطة)
  const unitMonthly = toMonthlyEquivalent(
    unit.installment_amount,
    unit.installment_frequency
  )
  const buyerMonthly = toMonthlyEquivalent(
    buyer.max_installment,
    buyer.payment_plan
  )

  if (buyerMonthly <= 0 || unitMonthly <= 0) {
    score += 22
    matches.push(labels?.instMatch || 'inst_match')
  } else if (unitMonthly <= buyerMonthly * 1.05) {
    score += 25
    matches.push(labels?.instMatch || 'inst_match')
  } else if (unitMonthly <= buyerMonthly * 1.25) {
    score += 15
    differences.push(labels?.instHigher || 'inst_higher')
  } else {
    score += 5
    differences.push(labels?.instHigher || 'inst_higher')
  }

  // 3. توافق المنطقة (20 نقطة)
  const unitArea = String(unit.area || '').trim()
  const buyerAreas = cleanPreferredAreasList(buyer.preferred_areas)

  if (!unitArea || buyerAreas.length === 0) {
    score += 15
  } else {
    const areaMatched = buyerAreas.some(
      (a) =>
        unitArea.toLowerCase().includes(a.toLowerCase()) ||
        a.toLowerCase().includes(unitArea.toLowerCase())
    )
    if (areaMatched) {
      score += 20
      matches.push(`${labels?.areaMatch || 'area_match'}: ${unitArea}`)
    } else {
      score += 6
      differences.push(`${labels?.areaDiff || 'area_diff'}: ${unitArea}`)
    }
  }

  // 4. توافق النوع وعدد الغرف والاستلام (15 نقطة)
  const unitType = String(unit.unit_type || '').trim()
  const buyerTypes = Array.isArray(buyer.unit_types) ? buyer.unit_types : []

  if (
    !unitType ||
    buyerTypes.length === 0 ||
    buyerTypes.some(
      (tp) =>
        unitType.toLowerCase().includes(tp.toLowerCase()) ||
        tp.toLowerCase().includes(unitType.toLowerCase())
    )
  ) {
    score += 6
    if (unitType)
      matches.push(`${labels?.typeMatch || 'type_match'}: ${unitType}`)
  } else {
    differences.push(`${labels?.typeDiff || 'type_diff'}: ${unitType}`)
  }

  const unitRooms = Number(unit.rooms) || 0
  const buyerMinRooms = Number(buyer.min_rooms) || 0
  if (buyerMinRooms <= 0 || unitRooms >= buyerMinRooms) {
    score += 5
    if (unitRooms > 0) {
      matches.push(`${labels?.roomsMatch || 'rooms_match'}: ${unitRooms}`)
    }
  } else {
    differences.push(
      `${labels?.roomsDiff || 'rooms_diff'}: ${unitRooms} (${buyerMinRooms}+)`
    )
  }

  const unitDel = String(unit.delivery_status || '').trim()
  const buyerDel = String(buyer.delivery_status || '').trim()
  const unitIsReady =
    unitDel.includes('جاهز') ||
    unitDel.includes('فوري') ||
    unitDel.toLowerCase().includes('ready')
  const buyerWantsReady =
    buyerDel.includes('جاهز') ||
    buyerDel.includes('فوري') ||
    buyerDel.toLowerCase().includes('ready')

  if (!buyerDel || buyerDel.includes('الاتنين') || unitIsReady === buyerWantsReady) {
    score += 4
  } else {
    differences.push(
      `${labels?.deliveryDiff || 'delivery_diff'}: ${unitDel || '—'}`
    )
  }

  const finalScore = Math.max(15, Math.min(99, Math.round(score)))

  return {
    score: finalScore,
    isAutoPilotEligible: finalScore >= 85,
    isNegotiableBridge,
    matches,
    differences,
    pricingGuardrails: guardrails,
    financialAdvisor: {
      developerPenaltyEstimate,
      netSavedAtFullPrice: developerPenaltyEstimate,
    },
  }
}