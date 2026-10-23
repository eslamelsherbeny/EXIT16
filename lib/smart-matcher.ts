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

const DEFAULT_MATCH_TEXTS: Record<
  string,
  {
    cashExact: string
    cashNegotiableBridge: string
    cashSlightlyHigher: string
    instMatch: string
    instHigher: string
    areaMatch: string
    areaDiff: string
    typeMatch: string
    typeDiff: string
    roomsMatch: string
    roomsDiff: string
    buyerAskedRooms: string
    deliveryDiff: string
  }
> = {
  ar: {
    cashExact: 'الكاش المطلوب في حدود سيولتك المتاحة',
    cashNegotiableBridge: 'متوافق عبر التفاوض على الكاش',
    cashSlightlyHigher: 'الكاش المطلوب أعلى قليلاً من سيولتك المحددة',
    instMatch: 'القسط مناسب لقدرتك الشهرية',
    instHigher: 'القسط أعلى من القسط المفضل لديك',
    areaMatch: 'نفس المنطقة المطلوبة',
    areaDiff: 'منطقة بديلة قريبة',
    typeMatch: 'نفس نوع الوحدة',
    typeDiff: 'نوع الوحدة',
    roomsMatch: 'عدد الغرف مناسب',
    roomsDiff: 'عدد الغرف',
    buyerAskedRooms: 'طلبك',
    deliveryDiff: 'حالة الاستلام',
  },
  en: {
    cashExact: 'Required cash fits your available liquidity',
    cashNegotiableBridge: 'Matches via cash negotiation',
    cashSlightlyHigher: 'Required cash is slightly above your specified cash',
    instMatch: 'Installment fits your monthly capacity',
    instHigher: 'Installment is higher than your preferred limit',
    areaMatch: 'Exact preferred area',
    areaDiff: 'Alternative nearby area',
    typeMatch: 'Exact unit type',
    typeDiff: 'Unit type',
    roomsMatch: 'Bedrooms count matches',
    roomsDiff: 'Bedrooms',
    buyerAskedRooms: 'requested',
    deliveryDiff: 'Delivery status',
  },
  ru: {
    cashExact: 'Требуемый кэш в рамках вашего бюджета',
    cashNegotiableBridge: 'Подходит с учетом торга',
    cashSlightlyHigher: 'Требуемый кэш немного выше указанного',
    instMatch: 'Платеж по рассрочке подходит вам',
    instHigher: 'Платеж выше желаемого лимита',
    areaMatch: 'Желаемый район',
    areaDiff: 'Соседний район',
    typeMatch: 'Тип объекта совпадает',
    typeDiff: 'Тип объекта',
    roomsMatch: 'Количество комнат подходит',
    roomsDiff: 'Комнат',
    buyerAskedRooms: 'запрос',
    deliveryDiff: 'Статус сдачи',
  },
  ka: {
    cashExact: 'ქეში ჯდება თქვენს ბიუჯეტში',
    cashNegotiableBridge: 'თავსებადია მოლაპარაკებით',
    cashSlightlyHigher: 'მოთხოვნილი ქეში ოდნავ აღემატება ბიუჯეტს',
    instMatch: 'განვადება შეესაბამება თქვენს ლიმიტს',
    instHigher: 'განვადება აღემატება სასურველ ლიმიტს',
    areaMatch: 'სასურველი უბანი',
    areaDiff: 'მიმდებარე უბანი',
    typeMatch: 'ობიექტის ტიპი ემთხვევა',
    typeDiff: 'ობიექტის ტიპი',
    roomsMatch: 'ოთახების რაოდენობა ემთხვევა',
    roomsDiff: 'ოთახები',
    buyerAskedRooms: 'მოთხოვნა',
    deliveryDiff: 'ჩაბარების სტატუსი',
  },
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
  const rawSellerDiscount = Number(unit.discount_amount) || 0

  if (requiredCash <= 0) {
    return {
      requiredCash: 0,
      allowNegotiation: true,
      minAllowedOfferCash: 0,
      maxAllowedOfferCash: 0,
      maxDiscountAmount: 0,
    }
  }

  // نسمح للمشتري بتقديم عرضه المناسب بشرط ألا يكون رقماً وهمياً (الحد الأدنى المنطقي 75% من المدفوع أو خصم البائع المحدد)
  const defaultMaxDiscount = Math.round(requiredCash * 0.25)
  const maxDiscountAmount =
    rawSellerDiscount > defaultMaxDiscount
      ? rawSellerDiscount
      : defaultMaxDiscount

  const minAllowedOfferCash = Math.max(1, requiredCash - maxDiscountAmount)

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
  customLabels?: Record<string, string | undefined>,
  locale: string = 'ar'
): SmartMatchResult {
  const fb = DEFAULT_MATCH_TEXTS[locale] || DEFAULT_MATCH_TEXTS.ar
  const L = {
    cashExact: customLabels?.cashExact || fb.cashExact,
    cashNegotiableBridge:
      customLabels?.cashNegotiableBridge || fb.cashNegotiableBridge,
    cashSlightlyHigher:
      customLabels?.cashSlightlyHigher || fb.cashSlightlyHigher,
    instMatch: customLabels?.instMatch || fb.instMatch,
    instHigher: customLabels?.instHigher || fb.instHigher,
    areaMatch: customLabels?.areaMatch || fb.areaMatch,
    areaDiff: customLabels?.areaDiff || fb.areaDiff,
    typeMatch: customLabels?.typeMatch || fb.typeMatch,
    typeDiff: customLabels?.typeDiff || fb.typeDiff,
    roomsMatch: customLabels?.roomsMatch || fb.roomsMatch,
    roomsDiff: customLabels?.roomsDiff || fb.roomsDiff,
    buyerAskedRooms: fb.buyerAskedRooms,
    deliveryDiff: customLabels?.deliveryDiff || fb.deliveryDiff,
  }

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
    score += 32
  } else if (unitCash <= buyerCash) {
    score += 40
    matches.push(L.cashExact)
  } else if (unitCash <= buyerCash * 1.15) {
    score += 34
    isNegotiableBridge = true
    matches.push(L.cashNegotiableBridge)
  } else if (unitCash <= buyerCash * 1.3) {
    score += 22
    differences.push(L.cashSlightlyHigher)
  } else {
    score += 10
    differences.push(L.cashSlightlyHigher)
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
    score += 23
    matches.push(L.instMatch)
  } else if (unitMonthly <= buyerMonthly * 1.05) {
    score += 25
    matches.push(L.instMatch)
  } else if (unitMonthly <= buyerMonthly * 1.25) {
    score += 16
    differences.push(L.instHigher)
  } else {
    score += 8
    differences.push(L.instHigher)
  }

  // 3. توافق المنطقة (20 نقطة)
  const unitArea = String(unit.area || '').trim()
  const buyerAreas = cleanPreferredAreasList(buyer.preferred_areas)

  if (!unitArea || buyerAreas.length === 0) {
    score += 16
  } else {
    const areaMatched = buyerAreas.some(
      (a) =>
        unitArea.toLowerCase().includes(a.toLowerCase()) ||
        a.toLowerCase().includes(unitArea.toLowerCase())
    )
    if (areaMatched) {
      score += 20
      matches.push(`${L.areaMatch}: ${unitArea}`)
    } else {
      score += 9
      differences.push(`${L.areaDiff}: ${unitArea}`)
    }
  }

  // 4. توافق النوع وعدد الغرف والاستلام (15 نقطة) — بدون إظهار 0 أو شرطة فارغة أبداً!
  const unitType = String(unit.unit_type || '').trim()
  const buyerTypes = Array.isArray(buyer.unit_types) ? buyer.unit_types : []

  if (!unitType || buyerTypes.length === 0) {
    score += 6
  } else if (
    buyerTypes.some(
      (tp) =>
        unitType.toLowerCase().includes(tp.toLowerCase()) ||
        tp.toLowerCase().includes(unitType.toLowerCase())
    )
  ) {
    score += 6
    matches.push(`${L.typeMatch}: ${unitType}`)
  } else {
    score += 2
    differences.push(`${L.typeDiff}: ${unitType}`)
  }

  const unitRooms = Number(unit.rooms) || 0
  const buyerMinRooms = Number(buyer.min_rooms) || 0
  if (unitRooms <= 0 || buyerMinRooms <= 0) {
    score += 5
    if (unitRooms > 0) matches.push(`${L.roomsDiff}: ${unitRooms}`)
  } else if (unitRooms >= buyerMinRooms) {
    score += 5
    matches.push(`${L.roomsDiff}: ${unitRooms}`)
  } else {
    score += 2
    differences.push(
      `${L.roomsDiff}: ${unitRooms} (${L.buyerAskedRooms} ${buyerMinRooms}+)`
    )
  }

  const unitDel = String(unit.delivery_status || '').trim()
  const buyerDel = String(buyer.delivery_status || '').trim()
  if (!unitDel || !buyerDel) {
    score += 4
  } else {
    const unitIsReady =
      unitDel.includes('جاهز') ||
      unitDel.includes('فوري') ||
      unitDel.toLowerCase().includes('ready')
    const buyerWantsReady =
      buyerDel.includes('جاهز') ||
      buyerDel.includes('فوري') ||
      buyerDel.toLowerCase().includes('ready')

    if (buyerDel.includes('الاتنين') || unitIsReady === buyerWantsReady) {
      score += 4
    } else {
      differences.push(`${L.deliveryDiff}: ${unitDel}`)
    }
  }

  const finalScore = Math.max(20, Math.min(99, Math.round(score)))

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