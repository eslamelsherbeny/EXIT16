import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import type { LocaleCode } from "@/lib/i18n"

export const ACTIVE_ADMIN_COUNTRY = "GE"
export const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"

export type SellRequest = {
  id: string
  user_id?: string | null
  project_name: string | null
  developer_name?: string | null
  area: string | null
  unit_type: string | null
  size?: number | null
  rooms?: number | null
  bathrooms?: number | null
  finishing?: string | null
  delivery_status?: string | null
  delivery_month?: string | null
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
  description?: string | null
  images?: string[] | null
  documents?: Record<string, any> | null
  country?: string | null
  country_code?: string | null
  currency_code?: string | null
  submission_type?: string | null
  last_seller_edit_at?: string | null
  is_featured?: boolean | null
  featured_days?: number | null
  featured_price?: number | null
  featured_status?: string | null
  featured_fawry_code?: string | null
  featured_until?: string | null
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
  | { type: "status"; property: SellRequest; newStatus: string }
  | { type: "delete"; property: SellRequest }
  | { type: "purge_all_deleted"; count: number }
  | {
      type: "promote"
      property: SellRequest
      promoAction: "activate" | "cancel"
      days: number
    }

export function deriveShortUnitCode(id: string) {
  const digits = String(id || "").replace(/\D/g, "")
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, "0")}`
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
      key,
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
  const uCode = deriveShortUnitCode(property.id)
  const proj = property.project_name || t.table.unspecifiedProject
  const localizedArea = property.area
    ? ` - ${getLocalizedGeorgiaAreaName(property.area, locale)}`
    : ""
  const cash = Number(property.paid_amount || 0).toLocaleString("en-US")
  const contract = Number(property.contract_price || 0).toLocaleString("en-US")
  const adPart = property.featured_fawry_code
    ? ` | ${t.badges.adCodeLabel} ${property.featured_fawry_code}`
    : ""

  return `${leadsPrompts.waGeneralPrefix} ${property.name}، (${proj}${localizedArea} - ${uCode}${adPart}) — ${t.table.colCash}: ${cash} ${unitCur} | ${t.table.contractShort} ${contract} ${unitCur}`
}
