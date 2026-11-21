import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import type { LocaleCode } from "@/lib/i18n"
import {
  getUnifiedUnitCode,
  getUnifiedUnitHeadline,
  getUnitImagesCount,
  getUnitUploadedDocsCount,
  hasUnitAllCoreDetails,
  isUnitCompleteForReview,
  isUnitDocsSatisfied,
  isUnitWhatsAppDocsVerified,
  REAL_UNIT_DOC_KEYS,
  type UnitDocKey,
} from "@/lib/unit-display-helpers"

export {
  getUnifiedUnitCode,
  getUnifiedUnitHeadline,
  getUnitImagesCount,
  getUnitUploadedDocsCount,
  hasUnitAllCoreDetails,
  isUnitCompleteForReview,
  isUnitDocsSatisfied,
  isUnitWhatsAppDocsVerified,
  REAL_UNIT_DOC_KEYS,
  type UnitDocKey,
}

export const ACTIVE_ADMIN_COUNTRY = "GE"
export const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"

export type SellRequest = {
  id: string
  code?: string | null
  user_id?: string | null
  project_name: string | null
  developer_name?: string | null
  area: string | null
  exact_street?: string | null
  house_number?: string | null
  cadastral_code?: string | null
  unit_type: string | null
  building_status?: string | null
  size?: number | null
  rooms?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  floor_number?: number | null
  total_floors?: number | null
  finishing?: string | null
  delivery_status?: string | null
  delivery_month?: string | null
  delivery_year?: number | null
  contract_price?: number | null
  paid_amount?: number | null
  market_price: number | null
  installment_amount?: number | null
  installment_frequency?: string | null
  years_left?: number | null
  contract_month?: string | null
  contract_year?: number | null
  willing_to_discount?: boolean | null
  discount_amount?: number | null
  video_url?: string | null
  tour_3d_url?: string | null
  allow_online_viewing?: boolean | null
  features?: string[] | null
  description?: string | null
  images?: string[] | null
  documents?: Record<string, any> | null
  country?: string | null
  country_code?: string | null
  currency_code?: string | null
  submission_type?: string | null
  last_seller_edit_at?: string | null
  is_featured?: boolean | null
  boost_tier?: "super_vip" | "vip_plus" | null
  featured_days?: number | null
  featured_price?: number | null
  featured_status?: string | null
  featured_fawry_code?: string | null
  featured_until?: string | null
  views_count?: number | null
  contact_messengers?: string[] | null
  name: string
  phone: string
  email?: string | null
  status?: string | null
  admin_note?: string | null
  created_at: string
}

export type UserVerificationBadgeInfo = {
  emailVerified: boolean
  phoneVerified: boolean
}

export type ConfirmPropertyAction =
  | {
      type: "status"
      property: SellRequest
      newStatus: string
      allowWhatsAppDocsVerify?: boolean
    }
  | { type: "delete"; property: SellRequest }
  | { type: "purge_all_deleted"; count: number }
  | {
      type: "promote"
      property: SellRequest
      promoAction: "activate" | "cancel"
      days: number
      tier?: "super_vip" | "vip_plus"
    }

export function deriveShortUnitCode(id: string, dbCode?: string | null) {
  return getUnifiedUnitCode(id, dbCode)
}

export function getPropertyHeadline(
  property: SellRequest,
  fallback = ""
) {
  return getUnifiedUnitHeadline(property, fallback)
}

export function cleanPropertyAreaDisplay(
  rawArea: string | null | undefined,
  locale: LocaleCode
): string {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

export function getSixStageTimelineMeta(
  effectiveStage: string,
  t?: Record<string, any>
) {
  const stL = (t?.stageTimeline as Record<string, string>) || {}

  const stages = [
    {
      index: 0,
      key: "incomplete",
      label: stL.s1Label || "",
      sub: stL.s1Sub || "",
      owner: "client" as const,
    },
    {
      index: 1,
      key: "review",
      label: stL.s2Label || "",
      sub: stL.s2Sub || "",
      owner: "admin" as const,
    },
    {
      index: 2,
      key: "active",
      label: stL.s3Label || "",
      sub: stL.s3Sub || "",
      owner: "admin" as const,
    },
    {
      index: 3,
      key: "offers",
      label: stL.s4Label || "",
      sub: stL.s4Sub || "",
      owner: "auto" as const,
    },
    {
      index: 4,
      key: "in_deal",
      label: stL.s5Label || "",
      sub: stL.s5Sub || "",
      owner: "auto" as const,
    },
    {
      index: 5,
      key: "sold",
      label: stL.s6Label || "",
      sub: stL.s6Sub || "",
      owner: "auto" as const,
    },
  ]

  let currentStepIndex = 1
  let isExceptionState = false
  let exceptionNote = ""

  switch (effectiveStage) {
    case "incomplete":
    case "draft_unverified":
      currentStepIndex = 0
      break
    case "pending":
    case "under_review":
      currentStepIndex = 1
      break
    case "active":
      currentStepIndex = 2
      break
    case "has_offers":
    case "negotiating":
    case "offer_received":
      currentStepIndex = 3
      break
    case "in_deal":
    case "transferring":
      currentStepIndex = 4
      break
    case "sold":
      currentStepIndex = 5
      break
    case "paused_by_admin":
      currentStepIndex = 2
      isExceptionState = true
      exceptionNote = stL.excPausedAdmin || ""
      break
    case "paused_by_seller":
      currentStepIndex = 2
      isExceptionState = true
      exceptionNote = stL.excPausedSeller || ""
      break
    case "rejected":
      currentStepIndex = 1
      isExceptionState = true
      exceptionNote = stL.excRejected || ""
      break
    case "deleted_by_seller":
      currentStepIndex = 0
      isExceptionState = true
      exceptionNote = stL.excDeleted || ""
      break
    default:
      currentStepIndex = 1
  }

  return { stages, currentStepIndex, isExceptionState, exceptionNote }
}

export function isSelfOfferOnProperty(
  offer: any,
  property: SellRequest
): boolean {
  if (!offer || !property) return false
  if (
    offer.buyer_user_id &&
    property.user_id &&
    String(offer.buyer_user_id) === String(property.user_id)
  ) {
    return true
  }
  const bPhone = String(offer.buyer_phone || "").replace(/\D/g, "")
  const sPhone = String(property.phone || "").replace(/\D/g, "")
  if (
    bPhone.length >= 8 &&
    sPhone.length >= 8 &&
    bPhone.slice(-8) === sPhone.slice(-8)
  ) {
    return true
  }
  return false
}

export function getRemainingDaysBeforePurge(lastEditIso?: string | null) {
  if (!lastEditIso) return 7
  const deletedTime = new Date(lastEditIso).getTime()
  const purgeTime = deletedTime + 7 * 24 * 60 * 60 * 1000
  const diffDays = Math.ceil((purgeTime - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(7, diffDays))
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

export function isSellerPhoneVerified(
  property: SellRequest,
  verificationMap?: Record<string, UserVerificationBadgeInfo>
): boolean {
  if (property.user_id && verificationMap?.[property.user_id]?.phoneVerified) {
    return true
  }
  return Boolean(property.documents?.__unit_meta?.phone_verified)
}

export function isSellerEmailVerified(
  property: SellRequest,
  verificationMap?: Record<string, UserVerificationBadgeInfo>
): boolean {
  if (property.user_id && verificationMap?.[property.user_id]?.emailVerified) {
    return true
  }
  return Boolean(property.documents?.__unit_meta?.email_verified)
}

export function getUploadedDocsList(
  docs: Record<string, any> | null | undefined,
  docLabels: Record<string, string>,
  fallbackName: string
) {
  if (!docs || typeof docs !== "object") return []
  return Object.entries(docs)
    .filter(
      ([key, val]) =>
        key !== "__unit_meta" && val && typeof val === "object" && val.url
    )
    .map(([key, val]) => ({
      key: key === "national_id" ? "passport" : key,
      label: docLabels[key] || key,
      url: String(val.url),
      name: String(val.name || fallbackName),
      uploadedAt: String(val.uploaded_at || ""),
    }))
}

export function buildSellerWhatsAppMessage({
  property,
  unitCur,
  locale,
  t,
  leadsPrompts,
}: {
  property: SellRequest
  unitCur: string
  locale: LocaleCode
  t: Record<string, any>
  leadsPrompts: Record<string, any>
}) {
  const uCode = deriveShortUnitCode(property.id, property.code)
  const proj = getPropertyHeadline(property, t.table.unspecifiedProject)
  const localizedArea = property.area
    ? ` - ${cleanPropertyAreaDisplay(property.area, locale)}`
    : ""
  const cash = Number(property.paid_amount || 0).toLocaleString("en-US")
  const contract = Number(property.contract_price || 0).toLocaleString("en-US")
  const adPart = property.featured_fawry_code
    ? ` | ${t.badges.adCodeLabel} ${property.featured_fawry_code}`
    : ""
  const commaSep = locale === "ar" ? "، " : ", "

  return `${leadsPrompts.waGeneralPrefix} ${property.name}${commaSep}(${proj}${localizedArea} - ${uCode}${adPart}) — ${t.table.colCash}: ${cash} ${unitCur} | ${t.table.contractShort} ${contract} ${unitCur}`
}

export function buildOwnerPerformanceReportWhatsAppMessage({
  property,
  viewsCount,
  offersCount,
  matchedBuyersCount,
  locale = "ar",
  t,
}: {
  property: SellRequest
  viewsCount: number
  offersCount: number
  matchedBuyersCount: number
  locale?: LocaleCode
  t?: Record<string, any>
}) {
  const aL = (t?.analytics as Record<string, string>) || {}
  const uCode = deriveShortUnitCode(property.id, property.code)
  const proj = getPropertyHeadline(
    property,
    t?.modals?.detailsFallbackTitle || t?.table?.unspecifiedProject || ""
  )
  const area = cleanPropertyAreaDisplay(property.area, locale)
  const siteOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://dualdealz.com"
  const unitUrl = `${siteOrigin}/opportunities/${property.id}`
  const isFeatured = Boolean(property.is_featured)
  const tierName = property.boost_tier === "vip_plus" ? "+VIP" : "SUPER VIP"

  const promoStatusText = isFeatured
    ? `${aL.waReportFeaturedPrefix || ""} (${tierName})`.trim()
    : aL.waReportStandardTier || ""

  return [
    aL.waReportTitle || "",
    `${aL.waReportGreetingPrefix || ""} ${property.name}${aL.waReportGreetingSuffix || ""}`,
    ``,
    `${aL.waReportProjectLabel || ""} ${proj} (${area})`,
    `${aL.waReportCodeLabel || ""} #${uCode}`,
    `${aL.waReportViewsLabel || ""} ${viewsCount.toLocaleString("en-US")}${aL.waReportViewsSuffix ? ` ${aL.waReportViewsSuffix}` : ""}`,
    `${aL.waReportMatchedBuyersLabel || ""} ${matchedBuyersCount}${aL.waReportMatchedBuyersSuffix ? ` ${aL.waReportMatchedBuyersSuffix}` : ""}`,
    `${aL.waReportOffersLabel || ""} ${offersCount}${aL.waReportOffersSuffix ? ` ${aL.waReportOffersSuffix}` : ""}`,
    `${aL.waReportPromoStatusLabel || ""} ${promoStatusText}`,
    ``,
    aL.waReportDirectLinkLabel || "",
    unitUrl,
  ].join("\n")
}