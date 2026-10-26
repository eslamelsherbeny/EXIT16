import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import ruDict from '@/dictionaries/ru.json'
import kaDict from '@/dictionaries/ka.json'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'

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
  finishing?: string | null
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
  currency_code?: string | null
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

export type AreaProximityRelation =
  | 'exact'
  | 'nearby'
  | 'same_city'
  | 'far'
  | 'invalid_country'

export type SmartMatchResult = {
  score: number
  isAutoPilotEligible: boolean
  isNegotiableBridge: boolean
  matches: string[]
  differences: string[]
  areaRelation: AreaProximityRelation
  distanceKm: number | null
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

export type GeorgiaRegionCode =
  | 'tbilisi_metro'
  | 'batumi_adjara'
  | 'kutaisi_imereti'
  | 'mountain_resorts'
  | 'kakheti_region'

type GeorgiaDistrictNode = {
  id: string
  regionCode: GeorgiaRegionCode
  isCityWide?: boolean
  keywords: string[]
}

const GEORGIA_REGION_DISTRICTS: GeorgiaDistrictNode[] = [
  {
    id: 'Tbilisi - Saburtalo',
    regionCode: 'tbilisi_metro',
    keywords: ['saburtalo', 'سابورتالو', 'сабуртало', 'საბურთალო'],
  },
  {
    id: 'Tbilisi - Vake',
    regionCode: 'tbilisi_metro',
    keywords: ['vake', 'فاكي', 'ваке', 'ვაკე'],
  },
  {
    id: 'Tbilisi - Vera',
    regionCode: 'tbilisi_metro',
    keywords: ['vera', 'فيرا', 'вера', 'ვერა'],
  },
  {
    id: 'Tbilisi - Mtatsminda',
    regionCode: 'tbilisi_metro',
    keywords: ['mtatsminda', 'متاتسميندا', 'мтацминда', 'მთაწმინდა'],
  },
  {
    id: 'Tbilisi - Old Tbilisi',
    regionCode: 'tbilisi_metro',
    keywords: ['old tbilisi', 'تبليسي القديمة', 'старый тбилиси', 'ძველი თბილისი'],
  },
  {
    id: 'Tbilisi - Ortachala',
    regionCode: 'tbilisi_metro',
    keywords: ['ortachala', 'أورتاشالا', 'اورتاشالا', 'ортачала', 'ორთაჭალა'],
  },
  {
    id: 'Tbilisi - Krtsanisi',
    regionCode: 'tbilisi_metro',
    keywords: ['krtsanisi', 'كرتسانيسي', 'крцаниси', 'კრწანისი'],
  },
  {
    id: 'Tbilisi - Isani',
    regionCode: 'tbilisi_metro',
    keywords: ['isani', 'إيساني', 'ايساني', 'исани', 'ისანი'],
  },
  {
    id: 'Tbilisi - Samgori',
    regionCode: 'tbilisi_metro',
    keywords: ['samgori', 'سامغوري', 'самгори', 'სამგორი'],
  },
  {
    id: 'Tbilisi - Varketili',
    regionCode: 'tbilisi_metro',
    keywords: ['varketili', 'فاركيتيلي', 'варкетили', 'ვარკეთილი'],
  },
  {
    id: 'Tbilisi - Didi Digomi',
    regionCode: 'tbilisi_metro',
    keywords: ['didi digomi', 'ديدي ديغومي', 'диди дигоми', 'დიდი დიღომი'],
  },
  {
    id: 'Tbilisi - Digomi Massive',
    regionCode: 'tbilisi_metro',
    keywords: ['digomi', 'ديغومي', 'дигом', 'დიღმის'],
  },
  {
    id: 'Tbilisi - Didube',
    regionCode: 'tbilisi_metro',
    keywords: ['didube', 'ديدوبي', 'дидубе', 'დიდუბე'],
  },
  {
    id: 'Tbilisi - Chugureti / Marjanishvili',
    regionCode: 'tbilisi_metro',
    keywords: [
      'chugureti',
      'marjanishvili',
      'تشوغوريتي',
      'مارجانيشفيلي',
      'чугурети',
      'марджанишвили',
      'ჩუღურეთი',
      'მარჯანიშვილი',
    ],
  },
  {
    id: 'Tbilisi - Nadzaladevi',
    regionCode: 'tbilisi_metro',
    keywords: ['nadzaladevi', 'نادزالاديفي', 'надзаладеви', 'ნაძალადევი'],
  },
  {
    id: 'Tbilisi - Gldani',
    regionCode: 'tbilisi_metro',
    keywords: ['gldani', 'غلداني', 'глдани', 'გლდანი'],
  },
  {
    id: 'Tbilisi - Avlabari',
    regionCode: 'tbilisi_metro',
    keywords: ['avlabari', 'أفلاباري', 'افلاباري', 'авлабари', 'ავლაბარი'],
  },
  {
    id: 'Tbilisi - Lisi Lake',
    regionCode: 'tbilisi_metro',
    keywords: ['lisi', 'ليسي', 'лиси', 'ლისის'],
  },
  {
    id: 'Tbilisi - Tbilisi Sea',
    regionCode: 'tbilisi_metro',
    keywords: ['tbilisi sea', 'بحر تبليسي', 'тбилисское море', 'თბილისის ზღვა'],
  },
  {
    id: 'Tbilisi - Tabakhmela / Kojori',
    regionCode: 'tbilisi_metro',
    keywords: ['tabakhmela', 'kojori', 'تاباخميلا', 'كوجوري', 'табахмела', 'ტაბახმელა'],
  },
  {
    id: 'Mtskheta / Saguramo',
    regionCode: 'tbilisi_metro',
    keywords: ['mtskheta', 'saguramo', 'متسخيتا', 'ساجورامو', 'мцхета', 'сагурамо', 'მცხეთა', 'საგურამო'],
  },
  {
    id: 'Rustavi',
    regionCode: 'tbilisi_metro',
    keywords: ['rustavi', 'روستافي', 'рустави', 'რუსთავი'],
  },
  {
    id: 'Batumi - New Boulevard',
    regionCode: 'batumi_adjara',
    keywords: ['new boulevard', 'نيو بوليفارد', 'новый бульвар', 'ახალი ბულვარი'],
  },
  {
    id: 'Batumi - Alley of Heroes',
    regionCode: 'batumi_adjara',
    keywords: ['alley of heroes', 'ممر الأبطال', 'ممر الابطال', 'аллея героев', 'გმირთა ხეივანი'],
  },
  {
    id: 'Batumi - Old Boulevard / Center',
    regionCode: 'batumi_adjara',
    keywords: ['old boulevard', 'البوليفارد القديم', 'وسط المدينة', 'старый бульвар', 'ძველი ბულვარი'],
  },
  {
    id: 'Batumi - Rustaveli Avenue',
    regionCode: 'batumi_adjara',
    keywords: ['rustaveli', 'روستافيلي', 'руставели', 'რუსთაველის'],
  },
  {
    id: 'Batumi - Khimshiashvili',
    regionCode: 'batumi_adjara',
    keywords: ['khimshiashvili', 'خيمشياشفيلي', 'химшиашвили', 'ხიმშიაშვილი'],
  },
  {
    id: 'Batumi - Bagrationi',
    regionCode: 'batumi_adjara',
    keywords: ['bagrationi', 'باغراتيوني', 'багратиони', 'ბაგრატიონი'],
  },
  {
    id: 'Batumi - Airport District',
    regionCode: 'batumi_adjara',
    keywords: ['airport', 'منطقة المطار', 'аэропорт', 'აეროპორტის'],
  },
  {
    id: 'Batumi - Gonio / Kvariati',
    regionCode: 'batumi_adjara',
    keywords: ['gonio', 'kvariati', 'غونيو', 'كفارياتي', 'гонио', 'გონიო'],
  },
  {
    id: 'Batumi - Makhinjauri',
    regionCode: 'batumi_adjara',
    keywords: ['makhinjauri', 'ماخينجاوري', 'махинджаури', 'მახინჯაური'],
  },
  {
    id: 'Batumi - Chakvi / Green Cape',
    regionCode: 'batumi_adjara',
    keywords: ['chakvi', 'green cape', 'تشاكفي', 'غرين كيب', 'чакви', 'ჩაქვი'],
  },
  {
    id: 'Kobuleti / Shekvetili',
    regionCode: 'batumi_adjara',
    keywords: ['kobuleti', 'shekvetili', 'كوبوليتي', 'شيكفيتيلي', 'кобулети', 'ქობულეთი'],
  },
  {
    id: 'Kutaisi',
    regionCode: 'kutaisi_imereti',
    isCityWide: true,
    keywords: ['kutaisi', 'كوتايسي', 'кутаиси', 'ქუთაისი'],
  },
  {
    id: 'Gudauri',
    regionCode: 'mountain_resorts',
    keywords: ['gudauri', 'غودوري', 'جوداوري', 'гудаури', 'გუდაური'],
  },
  {
    id: 'Bakuriani',
    regionCode: 'mountain_resorts',
    keywords: ['bakuriani', 'باكورياني', 'бакуриани', 'ბაკურიანი'],
  },
  {
    id: 'Borjomi',
    regionCode: 'mountain_resorts',
    keywords: ['borjomi', 'بورجومي', 'боржоми', 'ბორჯომი'],
  },
  {
    id: 'Kakheti - Telavi / Kvareli',
    regionCode: 'kakheti_region',
    isCityWide: true,
    keywords: ['kakheti', 'telavi', 'kvareli', 'كاخيتي', 'تيلافي', 'كفاريلي', 'кахетия', 'კახეთი'],
  },
]

const NON_GEORGIAN_LEGACY_KEYWORDS = [
  'التجمع',
  'القاهرة',
  'زايد',
  'أكتوبر',
  'اكتوبر',
  'العاصمة',
  'الساحل',
  'سخنة',
  'الجونة',
  'مدينتي',
  'المستقبل',
  'الشروق',
  'العبور',
  'المعادي',
  'مصر',
  'new cairo',
  'fifth settlement',
  'sheikh zayed',
  'october',
  'north coast',
  'sokhna',
  'new capital',
  'egypt',
]

export function isNonGeorgianLegacyArea(rawArea?: string | null): boolean {
  if (!rawArea) return false
  const lower = String(rawArea).trim().toLowerCase()
  return NON_GEORGIAN_LEGACY_KEYWORDS.some((kw) => lower.includes(kw))
}

function resolveGeorgiaDistrict(rawArea?: string | null): {
  nodeId: string
  regionCode: GeorgiaRegionCode
  isGenericCityOnly: boolean
} | null {
  if (!rawArea) return null
  const clean = String(rawArea).trim().toLowerCase()
  if (!clean || isNonGeorgianLegacyArea(clean)) return null

  for (const d of GEORGIA_REGION_DISTRICTS) {
    if (
      d.id.toLowerCase() === clean ||
      d.keywords.some((kw) => clean.includes(kw.toLowerCase()))
    ) {
      return {
        nodeId: d.id,
        regionCode: d.regionCode,
        isGenericCityOnly: Boolean(d.isCityWide),
      }
    }
  }

  if (
    clean.includes('tbilisi') ||
    clean.includes('تبليسي') ||
    clean.includes('тбилиси') ||
    clean.includes('თბილისი')
  ) {
    return {
      nodeId: 'Tbilisi',
      regionCode: 'tbilisi_metro',
      isGenericCityOnly: true,
    }
  }

  if (
    clean.includes('batumi') ||
    clean.includes('باتومي') ||
    clean.includes('батуми') ||
    clean.includes('ბათუმი')
  ) {
    return {
      nodeId: 'Batumi',
      regionCode: 'batumi_adjara',
      isGenericCityOnly: true,
    }
  }

  return null
}

export function evaluateGeorgiaAreaProximity(
  unitAreaRaw: string | null | undefined,
  buyerPreferredAreas: string[] | string | null | undefined
): {
  relation: AreaProximityRelation
  distanceKm: number | null
  points: number
} {
  const unitArea = String(unitAreaRaw || '').trim()

  if (isNonGeorgianLegacyArea(unitArea)) {
    return { relation: 'invalid_country', distanceKm: null, points: 0 }
  }

  const buyerAreas = cleanPreferredAreasList(buyerPreferredAreas).filter(
    (a) => !isNonGeorgianLegacyArea(a)
  )

  if (!unitArea || buyerAreas.length === 0) {
    return { relation: 'exact', distanceKm: 0, points: 16 }
  }

  const unitResolved = resolveGeorgiaDistrict(unitArea)
  let foundSameCityRegion = false

  for (const bArea of buyerAreas) {
    if (
      unitArea.toLowerCase() === bArea.toLowerCase() ||
      unitArea.toLowerCase().includes(bArea.toLowerCase()) ||
      bArea.toLowerCase().includes(unitArea.toLowerCase())
    ) {
      return { relation: 'exact', distanceKm: 0, points: 20 }
    }

    const buyerResolved = resolveGeorgiaDistrict(bArea)
    if (unitResolved && buyerResolved) {
      if (
        unitResolved.nodeId === buyerResolved.nodeId ||
        buyerResolved.isGenericCityOnly
      ) {
        return { relation: 'exact', distanceKm: 0, points: 20 }
      }

      if (unitResolved.regionCode === buyerResolved.regionCode) {
        foundSameCityRegion = true
      }
    }
  }

  if (foundSameCityRegion) {
    return { relation: 'same_city', distanceKm: null, points: 16 }
  }

  return { relation: 'far', distanceKm: null, points: 0 }
}

function getMatcherDict(locale: string = 'ar') {
  const dictionaries: Record<string, any> = {
    ar: arDict,
    en: enDict,
    ru: ruDict,
    ka: kaDict,
  }
  const activeDict = dictionaries[locale] || arDict
  const smDict = activeDict?.smartMatcher || {}
  const offersDict = activeDict?.accountPages?.offers || {}

  return {
    cashExact: smDict.cashExact || offersDict.matchCashExact || '',
    cashNegotiableBridge:
      smDict.cashNegotiableBridge || offersDict.matchCashBridge || '',
    cashSlightlyHigher:
      smDict.cashSlightlyHigher || offersDict.diffCashHigher || '',
    instMatch: smDict.instMatch || offersDict.matchInst || '',
    instHigher: smDict.instHigher || offersDict.diffInstHigher || '',
    areaMatch: smDict.areaMatch || offersDict.matchArea || '',
    areaSameCity: smDict.areaSameCity || offersDict.matchArea || '',
    areaDiff: smDict.areaDiff || offersDict.diffArea || '',
    typeMatch: smDict.typeMatch || offersDict.matchType || '',
    typeDiff: smDict.typeDiff || offersDict.diffType || '',
    roomsMatch: smDict.roomsMatch || offersDict.matchRooms || '',
    roomsDiff: smDict.roomsDiff || offersDict.diffRooms || '',
    buyerAskedRooms: smDict.buyerAskedRooms || '',
    deliveryDiff: smDict.deliveryDiff || offersDict.diffDelivery || '',
    readyKeywords: Array.isArray(smDict.readyKeywords)
      ? smDict.readyKeywords
      : ['جاهز', 'فوري', 'مستلم', 'ready', 'сдан', 'готов', 'ჩაბარებული'],
    bothDeliveryKeywords: Array.isArray(smDict.bothDeliveryKeywords)
      ? smDict.bothDeliveryKeywords
      : ['الاتنين', 'كلاهما', 'both', 'any', 'оба', 'ორივე'],
  }
}

export function toMonthlyEquivalent(
  amount: number | null | undefined,
  freq?: string | null
): number {
  const val = Number(amount) || 0
  if (val <= 0) return 0
  const f = String(freq || '')
    .trim()
    .toLowerCase()
  if (
    f.includes('ربع') ||
    f.includes('quarter') ||
    f.includes('квартал') ||
    f.includes('კვარტ')
  ) {
    return Math.round(val / 3)
  }
  if (
    f.includes('نصف') ||
    f.includes('نص') ||
    f.includes('semi') ||
    f.includes('полгод') ||
    f.includes('ნახევარ')
  ) {
    return Math.round(val / 6)
  }
  if (
    (f.includes('سنوي') && !f.includes('نصف') && !f.includes('ربع')) ||
    f.includes('annual') ||
    f.includes('year') ||
    f.includes('ежегод') ||
    f.includes('წლიური')
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
  const rawSellerDiscount = Math.max(0, Number(unit.discount_amount) || 0)
  const sellerAllowsDiscount = Boolean(
    unit.willing_to_discount || rawSellerDiscount > 0
  )

  if (requiredCash <= 0) {
    return {
      requiredCash: 0,
      allowNegotiation: false,
      minAllowedOfferCash: 0,
      maxAllowedOfferCash: 0,
      maxDiscountAmount: 0,
    }
  }

  if (!sellerAllowsDiscount) {
    return {
      requiredCash,
      allowNegotiation: false,
      minAllowedOfferCash: requiredCash,
      maxAllowedOfferCash: requiredCash,
      maxDiscountAmount: 0,
    }
  }

  const defaultMaxDiscount = Math.round(requiredCash * 0.2)
  const maxDiscountAmount =
    rawSellerDiscount > 0
      ? Math.min(requiredCash - 1, rawSellerDiscount)
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
  const dictLabels = getMatcherDict(locale)
  const L = {
    cashExact: customLabels?.cashExact || dictLabels.cashExact,
    cashNegotiableBridge:
      customLabels?.cashNegotiableBridge || dictLabels.cashNegotiableBridge,
    cashSlightlyHigher:
      customLabels?.cashSlightlyHigher || dictLabels.cashSlightlyHigher,
    instMatch: customLabels?.instMatch || dictLabels.instMatch,
    instHigher: customLabels?.instHigher || dictLabels.instHigher,
    areaMatch: customLabels?.areaMatch || dictLabels.areaMatch,
    areaSameCity: customLabels?.areaSameCity || dictLabels.areaSameCity,
    areaDiff: customLabels?.areaDiff || dictLabels.areaDiff,
    typeMatch: customLabels?.typeMatch || dictLabels.typeMatch,
    typeDiff: customLabels?.typeDiff || dictLabels.typeDiff,
    roomsMatch: customLabels?.roomsMatch || dictLabels.roomsMatch,
    roomsDiff: customLabels?.roomsDiff || dictLabels.roomsDiff,
    buyerAskedRooms: dictLabels.buyerAskedRooms,
    deliveryDiff: customLabels?.deliveryDiff || dictLabels.deliveryDiff,
  }

  const guardrails = getUnitPricingGuardrails(unit)
  const contractPrice = Number(unit.contract_price) || guardrails.requiredCash
  const developerPenaltyEstimate = Math.round(contractPrice * 0.125)

  const rawUnitArea = String(unit.area || '').trim()
  const areaEval = evaluateGeorgiaAreaProximity(
    rawUnitArea,
    buyer.preferred_areas
  )

  if (areaEval.relation === 'invalid_country') {
    return {
      score: 0,
      isAutoPilotEligible: false,
      isNegotiableBridge: false,
      matches: [],
      differences: [],
      areaRelation: 'invalid_country',
      distanceKm: null,
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
    if (L.cashExact) matches.push(L.cashExact)
  } else if (
    guardrails.allowNegotiation &&
    buyerCash >= guardrails.minAllowedOfferCash
  ) {
    score += 35
    isNegotiableBridge = true
    if (L.cashNegotiableBridge) matches.push(L.cashNegotiableBridge)
  } else if (unitCash <= buyerCash * 1.15) {
    score += 28
    if (L.cashSlightlyHigher) differences.push(L.cashSlightlyHigher)
  } else if (unitCash <= buyerCash * 1.3) {
    score += 20
    if (L.cashSlightlyHigher) differences.push(L.cashSlightlyHigher)
  } else {
    score += 10
    if (L.cashSlightlyHigher) differences.push(L.cashSlightlyHigher)
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
    if (L.instMatch) matches.push(L.instMatch)
  } else if (unitMonthly <= buyerMonthly * 1.05) {
    score += 25
    if (L.instMatch) matches.push(L.instMatch)
  } else if (unitMonthly <= buyerMonthly * 1.25) {
    score += 16
    if (L.instHigher) differences.push(L.instHigher)
  } else {
    score += 8
    if (L.instHigher) differences.push(L.instHigher)
  }

  // 3. توافق المنطقة والمحافظة الجورجية (20 نقطة)
  const localizedUnitArea = getLocalizedGeorgiaAreaName(rawUnitArea, locale)

  if (areaEval.relation === 'exact') {
    score += 20
    if (rawUnitArea && L.areaMatch) {
      matches.push(`${L.areaMatch}: ${localizedUnitArea}`)
    }
  } else if (
    areaEval.relation === 'same_city' ||
    areaEval.relation === 'nearby'
  ) {
    score += 16
    if (rawUnitArea && L.areaSameCity) {
      matches.push(`${L.areaSameCity}: ${localizedUnitArea}`)
    }
  } else {
    score += 0
    if (rawUnitArea && L.areaDiff) {
      differences.push(`${L.areaDiff}: ${localizedUnitArea}`)
    }
  }

  // 4. توافق النوع وعدد الغرف والاستلام (15 نقطة)
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
    if (L.typeMatch) matches.push(`${L.typeMatch}: ${unitType}`)
  } else {
    score += 2
    if (L.typeDiff) differences.push(`${L.typeDiff}: ${unitType}`)
  }

  const unitRooms = Number(unit.rooms) || 0
  const buyerMinRooms = Number(buyer.min_rooms) || 0
  if (unitRooms <= 0 || buyerMinRooms <= 0) {
    score += 5
    if (unitRooms > 0 && L.roomsMatch) {
      matches.push(`${L.roomsMatch}: ${unitRooms}`)
    }
  } else if (unitRooms >= buyerMinRooms) {
    score += 5
    if (L.roomsMatch) matches.push(`${L.roomsMatch}: ${unitRooms}`)
  } else {
    score += 2
    if (L.roomsDiff) {
      differences.push(
        `${L.roomsDiff}: ${unitRooms} (${L.buyerAskedRooms} ${buyerMinRooms}+)`
      )
    }
  }

  const unitDel = String(unit.delivery_status || '').trim()
  const buyerDel = String(buyer.delivery_status || '').trim()
  if (!unitDel || !buyerDel) {
    score += 4
  } else {
    const unitIsReady = dictLabels.readyKeywords.some((kw: string) =>
      unitDel.toLowerCase().includes(kw.toLowerCase())
    )
    const buyerWantsReady = dictLabels.readyKeywords.some((kw: string) =>
      buyerDel.toLowerCase().includes(kw.toLowerCase())
    )
    const buyerAcceptsBoth = dictLabels.bothDeliveryKeywords.some(
      (kw: string) => buyerDel.toLowerCase().includes(kw.toLowerCase())
    )

    if (buyerAcceptsBoth || unitIsReady === buyerWantsReady) {
      score += 4
    } else if (L.deliveryDiff) {
      differences.push(`${L.deliveryDiff}: ${unitDel}`)
    }
  }

  if (areaEval.relation === 'far') {
    score = Math.min(score, 55)
  }

  const finalScore = Math.max(20, Math.min(99, Math.round(score)))

  return {
    score: finalScore,
    isAutoPilotEligible: finalScore >= 85 && areaEval.relation !== 'far',
    isNegotiableBridge,
    matches,
    differences,
    areaRelation: areaEval.relation,
    distanceKm: areaEval.distanceKm,
    pricingGuardrails: guardrails,
    financialAdvisor: {
      developerPenaltyEstimate,
      netSavedAtFullPrice: developerPenaltyEstimate,
    },
  }
}