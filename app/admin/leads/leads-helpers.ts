import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import type { LocaleCode } from "@/lib/i18n"

export const ACTIVE_ADMIN_COUNTRY = "GE"
export const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"

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
  country_code?: string | null
  currency_code?: string | null
  status?: string | null
  created_at: string
}

export type LinkedUnitSummary = {
  id: string
  user_id?: string | null
  project_name: string | null
  area: string | null
  unit_type: string | null
  rooms?: number | null
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

export function deriveShortUnitCode(id: string) {
  const digits = String(id || "").replace(/\D/g, "")
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, "0")}`
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
        deriveShortUnitCode(u.id).toUpperCase() === cleanCode ||
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
    ? lead.preferred_areas
    : lead.preferred_areas
      ? [String(lead.preferred_areas)]
      : []

  const areasRaw = areasList
    .join("، ")
    .replace(/الرحاب/g, "King David Residences")
  const planRaw = lead.payment_plan || ""

  // ربط العرض بهذا الطلب تحديداً (lead.id) فقط وعدم تعميم عرض واحد على كل طلبات المستخدم!
  const leadDirectOffers = (offers || [])
    .map((o) => ({ ...o, status: normalizeOfferStatus(o) }))
    .filter(
      (o) =>
        o.status !== "recommended" &&
        !isSelfOfferForLead(o, units) &&
        String(o.lead_id || "") === String(lead.id)
    )

  const latestDirectOffer = leadDirectOffers[0] || null

  const isLegacyUnitLead =
    areasRaw.includes("🎯") ||
    areasRaw.includes("U-") ||
    planRaw.includes("مهتم بوحدة")

  // إذا كان العميل قد اختار أكثر من منطقة في الفورم فهو بحث عام وليس حجز وحدة واحدة
  const isSingleAreaDirectOffer =
    Boolean(latestDirectOffer) && areasList.length <= 1

  const isUnitLead = isLegacyUnitLead || isSingleAreaDirectOffer

  const codeMatch = `${areasRaw} ${planRaw}`.match(/U-[A-Z0-9]+/i)
  let unitCode = codeMatch ? codeMatch[0].toUpperCase() : null

  const matchedUnit = isUnitLead
    ? findMatchingUnitForLead(
        unitCode,
        areasRaw,
        units,
        latestDirectOffer?.property_id
      )
    : null

  if (!unitCode && matchedUnit) {
    unitCode = deriveShortUnitCode(matchedUnit.id)
  }

  let readinessBadge: { text: string; className: string } | null = null
  if (
    latestDirectOffer?.payment_readiness === "48h" ||
    planRaw.includes("48") ||
    planRaw.includes("خلال أسبوع")
  ) {
    readinessBadge = {
      text: leadsPrompts.readiness?.week || "",
      className: "bg-red-100 text-red-700 border border-red-200",
    }
  } else if (
    latestDirectOffer?.payment_readiness === "1_week" ||
    planRaw.includes("شهر لـ 3 شهور") ||
    planRaw.includes("خلال شهر")
  ) {
    readinessBadge = {
      text: leadsPrompts.readiness?.month || "",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
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

  const localizedAreasStr = isLegacyUnitLead
    ? areasRaw
        .replace("🎯 مهتم بوحدة:", "")
        .replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "")
        .trim()
    : isSingleAreaDirectOffer && matchedUnit
      ? `${matchedUnit.project_name || ""} — ${cleanAreaLabel(matchedUnit.area, locale)}`
      : areasList
          .map((a) =>
            cleanAreaLabel(a.replace(/الرحاب/g, "King David Residences"), locale)
          )
          .filter(Boolean)
          .join(sep)

  const cleanTargetUnit = localizedAreasStr || leadsPrompts.allAreas || ""

  return {
    isUnitLead,
    unitCode,
    cleanTargetUnit,
    readinessBadge,
    customerNotes,
    matchedUnit,
    latestDirectOffer,
  }
}

export function buildLeadWhatsAppMessage({
  lead,
  parsed,
  leadCur,
  locale,
  t,
  leadsPrompts,
}: {
  lead: BuyerLead
  parsed: ReturnType<typeof parseLeadDetails>
  leadCur: string
  locale: LocaleCode
  t: Record<string, any>
  leadsPrompts: Record<string, any>
}) {
  const cashVal = Number(
    lead.available_cash || lead.budget || 0
  ).toLocaleString("en-US")
  const instVal = Number(lead.max_installment || 0).toLocaleString("en-US")
  const typesStr = Array.isArray(lead.unit_types)
    ? lead.unit_types.join("، ")
    : ""

  if (parsed.isUnitLead) {
    const unitTitle = parsed.matchedUnit
      ? `${parsed.matchedUnit.project_name || ""} - ${cleanAreaLabel(parsed.matchedUnit.area, locale)} (${parsed.unitCode || ""})`
      : parsed.cleanTargetUnit
    return `${leadsPrompts.waUnitLeadPrefix} ${lead.name}، ${leadsPrompts.waUnitLeadMiddle} (${unitTitle}) — ${t.cashLabel} ${cashVal} ${leadCur} | ${t.installmentLabel} ${instVal} ${leadCur}.${parsed.customerNotes ? ` (${t.customerNotesLabel} ${parsed.customerNotes})` : ""} ${leadsPrompts.waUnitLeadSuffix}`
  }

  return `${leadsPrompts.waGeneralPrefix} ${lead.name}، ${leadsPrompts.waGeneralMiddle} (${parsed.cleanTargetUnit}) — ${t.cashLabel} ${cashVal} ${leadCur} | ${t.installmentLabel} ${instVal} ${leadCur}${typesStr ? ` | ${typesStr}` : ""}. ${leadsPrompts.waGeneralSuffix}`
}