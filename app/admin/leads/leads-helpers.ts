import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import type { LocaleCode } from "@/lib/i18n"

export const ACTIVE_ADMIN_COUNTRY = "GE"
export const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"
export const PRIORITY_RETURNED_TAG = "__PRIORITY_FROM_BACKUP__"

export type BuyerLead = {
  id: string
  user_id?: string | null
  name: string
  phone: string
  email?: string | null
  available_cash: number | null
  max_installment: number | null
  budget: number | null
  payment_plan?: string | null
  unit_types?: string[] | null
  min_rooms?: number | null
  delivery_status?: string | null
  preferred_areas: string[] | string | null
  contact_messengers?: string[] | null
  country_code?: string | null
  currency_code?: string | null
  status?: string | null
  created_at: string
}

export type LinkedUnitSummary = {
  id: string
  code?: string | null
  user_id?: string | null
  project_name: string | null
  area: string | null
  unit_type: string | null
  rooms?: number | null
  bedrooms?: number | null
  delivery_status?: string | null
  paid_amount: number | null
  contract_price: number | null
  installment_amount: number | null
  installment_frequency?: string | null
  willing_to_discount?: boolean | null
  discount_amount?: number | null
  name: string
  phone: string
  status?: string | null
  country_code?: string | null
  country?: string | null
}

export type UserVerificationBadgeInfo = {
  emailVerified: boolean
  phoneVerified: boolean
}

export type ConfirmLeadAction =
  | {
      type: "status"
      lead: BuyerLead
      newStatus: string
    }
  | {
      type: "delete"
      lead: BuyerLead
    }

export type DirectUnitInquiryItem = {
  key: string
  lead: BuyerLead
  parsed: ReturnType<typeof parseLeadDetails>
  unit: LinkedUnitSummary | null
  unitCode: string | null
  offer: any | null
  hasGeneralSearchProfile: boolean
  createdAt: string
}

export function getLeadUiMicroLabels(locale: LocaleCode) {
  switch (locale) {
    case "en":
      return {
        searchProfilesTab: "Buyer Requests & Direct Offers",
        directInquiriesTab: "Direct Unit Inquiries",
        searchTabDesc:
          "All active buyers — whether they submitted search criteria or made a direct offer on a unit.",
        inquiriesTabDesc:
          "Clients who expressed direct interest or sent offers on specific units.",
        desiredAreasCol: "Desired Areas & Specs",
        targetUnitCol: "Target Unit & Owner",
        interestedBuyerCol: "Interested Buyer",
        offerFinanceCol: "Offer / Capacity",
        unitOwnerLabel: "Owner:",
        targetBudgetLabel: "Target Budget",
        hasGeneralProfileTag: "Has Search Profile",
        alternativeUnitsWord: "alternative units",
        openDealsBtn: "Track Offer",
        offeredCashLabel: "Offered Cash",
        unitRequiredCashLabel: "Unit Cash",
        sourceDirectOfferBadge: "Direct Offer",
        sourceSearchBadge: "Search Request",
      }
    case "ru":
      return {
        searchProfilesTab: "Заявки покупателей и офферы",
        directInquiriesTab: "Интерес к объектам",
        searchTabDesc:
          "Все активные покупатели — как с заявкой на подбор, так и с прямым оффером.",
        inquiriesTabDesc:
          "Клиенты, проявившие прямой интерес или отправившие оффер по конкретным объектам.",
        desiredAreasCol: "Районы и параметры",
        targetUnitCol: "Объект и владелец",
        interestedBuyerCol: "Покупатель",
        offerFinanceCol: "Оффер / Бюджет",
        unitOwnerLabel: "Владелец:",
        targetBudgetLabel: "Целевой бюджет",
        hasGeneralProfileTag: "Есть заявка на подбор",
        alternativeUnitsWord: "похожих объектов",
        openDealsBtn: "К офферу",
        offeredCashLabel: "Предложено",
        unitRequiredCashLabel: "Наличными по объекту",
        sourceDirectOfferBadge: "Прямой оффер",
        sourceSearchBadge: "Заявка на подбор",
      }
    case "ka":
      return {
        searchProfilesTab: "მყიდველების მოთხოვნები და შეთავაზებები",
        directInquiriesTab: "ინტერესი ობიექტებზე",
        searchTabDesc:
          "ყველა აქტიური მყიდველი — ძიების მოთხოვნით ან პირდაპირი შეთავაზებით.",
        inquiriesTabDesc:
          "კლიენტები, რომლებმაც გამოხატეს ინტერესი ან გაგზავნეს შეთავაზება კონკრეტულ ობიექტზე.",
        desiredAreasCol: "სასურველი უბნები და პარამეტრები",
        targetUnitCol: "ობიექტი და მფლობელი",
        interestedBuyerCol: "დაინტერესებული მყიდველი",
        offerFinanceCol: "შეთავაზება / ბიუჯეტი",
        unitOwnerLabel: "მფლობელი:",
        targetBudgetLabel: "სამიზნე ბიუჯეტი",
        hasGeneralProfileTag: "აქვს ძიების პროფილი",
        alternativeUnitsWord: "ალტერნატიული ობიექტი",
        openDealsBtn: "შეთავაზების ნახვა",
        offeredCashLabel: "შეთავაზებული თანხა",
        unitRequiredCashLabel: "ობიექტის თანხა",
        sourceDirectOfferBadge: "პირდაპირი შეთავაზება",
        sourceSearchBadge: "ძიების მოთხოვნა",
      }
    default:
      return {
        searchProfilesTab: "طلبات الشراء والعروض المباشرة",
        directInquiriesTab: "طلبات الاهتمام والحجز المباشر",
        searchTabDesc:
          "جميع المشترين النشطين — سواء من سجلوا مواصفات بحث أو من قدموا عرضاً مباشراً على وحدة.",
        inquiriesTabDesc:
          "العملاء الذين أبدوا اهتماماً أو قدموا عروضاً على وحدات محددة.",
        desiredAreasCol: "المناطق والمواصفات المطلوبة",
        targetUnitCol: "الوحدة المستهدفة والمالك",
        interestedBuyerCol: "العميل المهتم",
        offerFinanceCol: "العرض / القدرة المالية",
        unitOwnerLabel: "مالك الوحدة:",
        targetBudgetLabel: "الميزانية المستهدفة",
        hasGeneralProfileTag: "لديه طلب بحث عام",
        alternativeUnitsWord: "وحدات بديلة",
        openDealsBtn: "متابعة العرض",
        offeredCashLabel: "العرض المقدم",
        unitRequiredCashLabel: "كاش الوحدة",
        sourceDirectOfferBadge: "عرض مباشر",
        sourceSearchBadge: "طلب بحث",
      }
  }
}

export function deriveShortUnitCode(id: string, dbCode?: string | null) {
  if (dbCode && String(dbCode).trim()) return String(dbCode).trim()
  const numericCode = String(id || "")
    .replace(/\D/g, "")
    .slice(0, 5)
  const fallbackCode = String(id || "")
    .slice(0, 5)
    .toUpperCase()
  return `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`
}

export function cleanAreaLabel(
  rawArea: string | null | undefined,
  locale: LocaleCode
): string {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

export function normalizeOfferStatus(rawOffer: any): string {
  const rawDiffs = Array.isArray(rawOffer?.diff_reasons)
    ? rawOffer.diff_reasons
    : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)
  if (
    rawOffer?.status === "pending_admin" ||
    (rawOffer?.status === "recommended" &&
      (rawOffer?.initiated_by === "buyer" || hasPendingAdminTag))
  ) {
    return "pending_admin"
  }
  return rawOffer?.status || "pending_seller"
}

export function isOfferOwnedByLead(offer: any, lead: BuyerLead): boolean {
  if (!offer || !lead) return false
  if (String(offer.lead_id || "") === String(lead.id)) return true
  if (
    lead.user_id &&
    offer.buyer_user_id &&
    String(offer.buyer_user_id) === String(lead.user_id)
  ) {
    return true
  }
  const leadPhoneDigits = String(lead.phone || "").replace(/\D/g, "")
  const offerPhoneDigits = String(offer.buyer_phone || "").replace(/\D/g, "")
  if (
    leadPhoneDigits.length >= 8 &&
    offerPhoneDigits.length >= 8 &&
    leadPhoneDigits.slice(-8) === offerPhoneDigits.slice(-8)
  ) {
    return true
  }
  return false
}

export function isSelfOfferForLead(
  offer: any,
  units: LinkedUnitSummary[]
): boolean {
  if (!offer) return false
  const unit = units.find((u) => String(u.id) === String(offer.property_id))
  if (!unit) return false
  if (
    offer.buyer_user_id &&
    unit.user_id &&
    String(offer.buyer_user_id) === String(unit.user_id)
  ) {
    return true
  }
  const bPhone = String(offer.buyer_phone || "").replace(/\D/g, "")
  const sPhone = String(unit.phone || "").replace(/\D/g, "")
  if (
    bPhone.length >= 8 &&
    sPhone.length >= 8 &&
    bPhone.slice(-8) === sPhone.slice(-8)
  ) {
    return true
  }
  return false
}

export function isBuyerPhoneVerified(
  lead: BuyerLead,
  verificationMap?: Record<string, UserVerificationBadgeInfo>
): boolean {
  if (lead.user_id && verificationMap?.[lead.user_id]?.phoneVerified) {
    return true
  }
  return false
}

export function isBuyerEmailVerified(
  lead: BuyerLead,
  verificationMap?: Record<string, UserVerificationBadgeInfo>
): boolean {
  if (lead.user_id && verificationMap?.[lead.user_id]?.emailVerified) {
    return true
  }
  return false
}

export function findMatchingUnitForLead(
  unitCode: string | null,
  cleanTargetUnit: string,
  units: LinkedUnitSummary[],
  directPropertyId?: string | null
): LinkedUnitSummary | null {
  if (!units || units.length === 0) return null

  if (directPropertyId) {
    const byDirectId = units.find(
      (u) => String(u.id) === String(directPropertyId)
    )
    if (byDirectId) return byDirectId
  }

  if (unitCode) {
    const cleanCode = unitCode.toUpperCase()
    const byCode = units.find(
      (u) =>
        (u.code && String(u.code).trim().toUpperCase() === cleanCode) ||
        deriveShortUnitCode(u.id, u.code).toUpperCase() === cleanCode ||
        `U-${u.id.slice(0, 5).toUpperCase()}` === cleanCode ||
        u.id.toUpperCase().startsWith(cleanCode.replace("U-", ""))
    )
    if (byCode) return byCode
  }

  const byProjectName = units.find(
    (u) =>
      u.project_name &&
      cleanTargetUnit.includes(u.project_name.trim()) &&
      (!u.area || cleanTargetUnit.includes(u.area.trim()))
  )
  if (byProjectName) return byProjectName

  return (
    units.find(
      (u) => u.project_name && cleanTargetUnit.includes(u.project_name.trim())
    ) || null
  )
}

export function parseLeadDetails({
  lead,
  units,
  offers,
  locale,
  dir,
  leadsPrompts,
}: {
  lead: BuyerLead
  units: LinkedUnitSummary[]
  offers: any[]
  locale: LocaleCode
  dir: "rtl" | "ltr"
  leadsPrompts: Record<string, any>
}) {
  const sep = dir === "rtl" ? "، " : ", "
  const areasList = Array.isArray(lead.preferred_areas)
    ? lead.preferred_areas.filter(Boolean)
    : lead.preferred_areas
      ? [String(lead.preferred_areas)]
      : []

  const areasRaw = areasList
    .join(sep)
    .replace(/الرحاب/g, "King David Residences")
  const planRaw = lead.payment_plan || ""

  const directOffers = (offers || [])
    .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
    .filter((o) => {
      if (o.status === "recommended") return false
      if (isSelfOfferForLead(o, units)) return false
      return isOfferOwnedByLead(o, lead)
    })

  const offerLinkedByLeadId =
    directOffers.find((o) => String(o.lead_id || "") === String(lead.id)) ||
    null
  const latestActiveDirectOffer =
    directOffers.find((o) => o.status !== "rejected") || null
  const latestDirectOffer =
    latestActiveDirectOffer || offerLinkedByLeadId || directOffers[0] || null

  const isLegacyUnitLead =
    areasRaw.includes("🎯") ||
    areasRaw.includes("U-") ||
    planRaw.includes("مهتم بوحدة")

  // تحديد ما إذا كان هذا المشتري قد دخل عبر "عرض مباشر على وحدة" (للتمييز بالشارة فقط دون إخفائه)
  const isDirectUnitSource = (() => {
    if (isLegacyUnitLead) return true
    if (!offerLinkedByLeadId || areasList.length > 1) return false
    const leadTime = new Date(lead.created_at).getTime()
    const offerTime = new Date(
      offerLinkedByLeadId.created_at || lead.created_at
    ).getTime()
    return (
      Number.isFinite(leadTime) &&
      Number.isFinite(offerTime) &&
      Math.abs(offerTime - leadTime) <= 120_000
    )
  })()

  // لا نخفي إلا السجلات التراثية القديمة جداً؛ أما العروض المباشرة الجديدة فتظهر في طلبات الشراء
  const isPureUnitInquiry = isLegacyUnitLead
  const isUnitLead = isPureUnitInquiry

  const codeMatch = `${areasRaw} ${planRaw}`.match(/U-[A-Z0-9]+/i)
  let unitCode = codeMatch ? codeMatch[0].toUpperCase() : null

  const matchedUnit = isDirectUnitSource
    ? findMatchingUnitForLead(
        unitCode,
        areasRaw,
        units,
        latestDirectOffer?.property_id
      )
    : null

  if (!unitCode && matchedUnit) {
    unitCode = deriveShortUnitCode(matchedUnit.id, matchedUnit.code)
  }

  let readinessBadge: { text: string; className: string } | null = null
  if (
    latestDirectOffer?.payment_readiness === "48h" ||
    latestDirectOffer?.payment_readiness === "1_week" ||
    planRaw.includes("48") ||
    planRaw.includes("خلال أسبوع")
  ) {
    readinessBadge = {
      text: leadsPrompts.readiness?.week || "",
      className: "bg-red-50 text-red-700 border border-red-200",
    }
  } else if (
    latestDirectOffer?.payment_readiness === "2_weeks" ||
    planRaw.includes("شهر لـ 3 شهور") ||
    planRaw.includes("خلال شهر")
  ) {
    readinessBadge = {
      text: leadsPrompts.readiness?.month || "",
      className: "bg-amber-50 text-amber-800 border border-amber-200",
    }
  } else if (planRaw.includes("يجمع معلومات")) {
    readinessBadge = {
      text: leadsPrompts.readiness?.info || "",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    }
  }

  let customerNotes = ""
  if (planRaw.includes("أسئلة العميل:")) {
    customerNotes = planRaw.split("أسئلة العميل:")[1]?.trim() || ""
  } else if (planRaw.includes("ملاحظات:")) {
    customerNotes = planRaw.split("ملاحظات:")[1]?.trim() || ""
  }

  const preferredAreasList = isLegacyUnitLead
    ? []
    : areasList
        .map((a) =>
          cleanAreaLabel(a.replace(/الرحاب/g, "King David Residences"), locale)
        )
        .filter(Boolean)

  const localizedAreasStr = isLegacyUnitLead
    ? areasRaw
        .replace("🎯 مهتم بوحدة:", "")
        .replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "")
        .trim()
    : preferredAreasList.join(sep)

  const cleanTargetUnit = localizedAreasStr || leadsPrompts.allAreas || ""

  return {
    isUnitLead,
    isPureUnitInquiry,
    isDirectUnitSource,
    unitCode,
    cleanTargetUnit,
    preferredAreasList,
    readinessBadge,
    customerNotes,
    matchedUnit,
    latestDirectOffer,
    directOffers,
  }
}

export function buildLeadWhatsAppMessage({
  lead,
  parsed,
  leadCur,
  locale,
  t,
  leadsPrompts,
  focusUnit,
}: {
  lead: BuyerLead
  parsed: ReturnType<typeof parseLeadDetails>
  leadCur: string
  locale: LocaleCode
  t: Record<string, any>
  leadsPrompts: Record<string, any>
  focusUnit?: LinkedUnitSummary | null
}) {
  const sep = locale === "ar" ? "، " : ", "
  const cashVal = Number(
    lead.available_cash || lead.budget || 0
  ).toLocaleString("en-US")
  const instVal = Number(lead.max_installment || 0).toLocaleString("en-US")
  const typesStr = Array.isArray(lead.unit_types)
    ? lead.unit_types.join(sep)
    : ""

  const targetUnit =
    focusUnit || (parsed.isPureUnitInquiry ? parsed.matchedUnit : null)

  if (targetUnit || parsed.isPureUnitInquiry) {
    const uCode = targetUnit
      ? deriveShortUnitCode(targetUnit.id, targetUnit.code)
      : parsed.unitCode || ""
    const unitTitle = targetUnit
      ? `${targetUnit.project_name || ""} - ${cleanAreaLabel(targetUnit.area, locale)} (${uCode})`
      : parsed.cleanTargetUnit
    return `${leadsPrompts.waUnitLeadPrefix} ${lead.name}${sep}${leadsPrompts.waUnitLeadMiddle} (${unitTitle}) — ${t.cashLabel} ${cashVal} ${leadCur} | ${t.installmentLabel} ${instVal} ${leadCur}.${parsed.customerNotes ? ` (${t.customerNotesLabel} ${parsed.customerNotes})` : ""} ${leadsPrompts.waUnitLeadSuffix}`
  }

  return `${leadsPrompts.waGeneralPrefix} ${lead.name}${sep}${leadsPrompts.waGeneralMiddle} (${parsed.cleanTargetUnit}) — ${t.cashLabel} ${cashVal} ${leadCur} | ${t.installmentLabel} ${instVal} ${leadCur}${typesStr ? ` | ${typesStr}` : ""}. ${leadsPrompts.waGeneralSuffix}`
}