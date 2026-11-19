"use client"

import Link from "next/link"
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Flame,
  Handshake,
  Loader2,
  Lock,
  MoreVertical,
  PauseCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  buildOwnerPerformanceReportWhatsAppMessage,
  buildSellerWhatsAppMessage,
  cleanPropertyAreaDisplay,
  deriveShortUnitCode,
  getRemainingDaysBeforePurge,
  isSellerEmailVerified,
  isSellerPhoneVerified,
  type ConfirmPropertyAction,
  type SellRequest,
  type UserVerificationBadgeInfo,
} from "./properties-helpers"
import type { LocaleCode } from "@/lib/i18n"

const PRIORITY_RETURNED_TAG = "__PRIORITY_FROM_BACKUP__"

export function WhatsAppOfficialIcon({
  className = "size-4",
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.473 1.332 4.988L2 22l5.188-1.361c1.469.801 3.125 1.225 4.843 1.225 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.82 14.129c-.244.688-1.422 1.314-1.977 1.396-.508.076-1.152.109-1.859-.115-.43-.137-.98-.32-1.688-.625-2.973-1.283-4.914-4.275-5.062-4.473-.148-.197-1.209-1.609-1.209-3.07 0-1.461.766-2.18 1.037-2.477.271-.297.592-.371.791-.371.197 0 .395.002.568.01.182.008.426-.068.666.508.246.592.84 2.049.914 2.197.074.148.123.32.025.518-.098.197-.148.32-.297.494-.148.172-.312.385-.445.518-.148.148-.303.309-.131.605.172.297.768 1.268 1.648 2.053 1.133 1.01 2.088 1.322 2.385 1.471.297.148.469.123.643-.074.172-.197.74-.863.938-1.16.197-.297.395-.246.666-.148.271.098 1.729.814 2.025.963.297.148.494.223.568.346.074.123.074.715-.17 1.403z" />
    </svg>
  )
}

function isImageUrl(url: string): boolean {
  const clean = String(url || "").toLowerCase().split("?")[0]
  return (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif") ||
    clean.startsWith("data:image/")
  )
}

function getLocalizedUnitTypeNameShort(
  rawType?: string | null,
  fallback = ""
): string {
  if (!rawType) return fallback
  return String(rawType).replace(/\s*\([^)]+\)\s*/g, "").trim() || fallback
}

export type StatusOptionItem = {
  value: string
  label: string
  badge: string
}

export type SharedPropertyCardProps = {
  property: SellRequest
  index?: number
  rawStatus: string
  currentSt: string
  stObj: StatusOptionItem
  sellerStatusOptions: StatusOptionItem[]
  isLoading: boolean
  isHighlighted: boolean
  isFeaturedActive: boolean
  unitCur: string
  locale: LocaleCode
  t: Record<string, any>
  propBadges: Record<string, string>
  leadsPrompts: Record<string, any>
  sm: Record<string, any>
  dealsDict: Record<string, any>
  aL: Record<string, string>
  expL: Record<string, any>
  pending: boolean
  verificationMap: Record<string, UserVerificationBadgeInfo>
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  onConfirmAction: (action: ConfirmPropertyAction) => void
  onOpenDetails: (property: SellRequest) => void
  onOpenDocs: (property: SellRequest) => void
  onOpenSmartMatch: (property: SellRequest) => void
  onExportSingle: (property: SellRequest, format: "excel" | "pdf") => void
  matchedBuyersCount: number
  validOffers: any[]
  docsCount: number
}

export function PropertyActivityBadges({
  property,
  rawStatus,
  isFeaturedActive,
  docsCount,
  matchedBuyersCount,
  validOffers,
  t,
  propBadges,
  sm,
  dealsDict,
  aL,
  onOpenDocs,
  onOpenSmartMatch,
  onConfirmAction,
}: {
  property: SellRequest
  rawStatus: string
  isFeaturedActive: boolean
  docsCount: number
  matchedBuyersCount: number
  validOffers: any[]
  t: Record<string, any>
  propBadges: Record<string, string>
  sm: Record<string, any>
  dealsDict: Record<string, any>
  aL: Record<string, string>
  onOpenDocs: (property: SellRequest) => void
  onOpenSmartMatch: (property: SellRequest) => void
  onConfirmAction: (action: ConfirmPropertyAction) => void
}) {
  const viewsCount = Math.max(1, Number(property.views_count) || 1)
  const acceptedOffer = validOffers.find((o) => o.status === "accepted")
  const priorityReturnedOffer = validOffers.find(
    (o) =>
      o.status === "pending_admin" &&
      Array.isArray(o.diff_reasons) &&
      o.diff_reasons.includes(PRIORITY_RETURNED_TAG)
  )
  const pendingAdminOffer = validOffers.find(
    (o) => o.status === "pending_admin"
  )
  const pendingSellerOffer = validOffers.find(
    (o) => o.status === "pending_seller" || o.status === "counter_offered"
  )
  const waitlistOffers = validOffers.filter((o) => o.status === "unit_locked")
  const isVipPlus = property.boost_tier === "vip_plus"

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 text-[11px] font-bold text-slate-600 shadow-2xs"
        title={aL.viewsColumnHeader}
      >
        <Eye className="size-3.5 text-[#2563eb]" />
        <span className="tabular-nums">
          {viewsCount.toLocaleString("en-US")} {aL.viewsWord}
        </span>
      </span>

      <button
        type="button"
        onClick={() => onOpenDocs(property)}
        title={t.modals.uploadedDocsTitle}
        className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-extrabold shadow-2xs transition ${
          docsCount >= 4
            ? "border-emerald-200 bg-white text-[#007a5a] hover:bg-[#eaf8f2]"
            : docsCount > 0
              ? "border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
        }`}
      >
        <FileCheck2
          className={`size-3.5 shrink-0 ${
            docsCount >= 4 ? "text-[#007a5a]" : "text-slate-400"
          }`}
        />
        <span dir="ltr" className="tabular-nums">
          {docsCount}/4
        </span>
        <span>{propBadges.docWord}</span>
      </button>

      {matchedBuyersCount > 0 && (
        <button
          type="button"
          onClick={() => onOpenSmartMatch(property)}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-emerald-200 bg-[#eaf8f2] px-2.5 text-[11px] font-extrabold text-[#007a5a] shadow-2xs transition hover:bg-[#007a5a] hover:text-white"
        >
          <span>🎯</span>
          <span>
            {matchedBuyersCount} {sm.matchedBuyersShort}
          </span>
        </button>
      )}

      {acceptedOffer ? (
        <Link
          href={`/admin/deals?offerId=${acceptedOffer.id}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#007a5a] px-3 text-[11px] font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
        >
          <Handshake className="size-3.5 shrink-0" />
          <span>
            {sm.offerAcceptedTag}
            {acceptedOffer.buyer_name ? ` (${acceptedOffer.buyer_name})` : ""}
          </span>
        </Link>
      ) : priorityReturnedOffer ? (
        <Link
          href={`/admin/deals?offerId=${priorityReturnedOffer.id}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-amber-400 px-3 text-[11px] font-black text-[#0f1d40] shadow-2xs transition hover:bg-amber-500"
        >
          <Sparkles className="size-3.5 shrink-0" />
          <span>
            ⭐ {dealsDict.badgePriorityReturned || sm.offerPendingAdminTag}
            {priorityReturnedOffer.buyer_name
              ? ` (${priorityReturnedOffer.buyer_name})`
              : ""}
          </span>
        </Link>
      ) : pendingAdminOffer ? (
        <Link
          href={`/admin/deals?offerId=${pendingAdminOffer.id}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-[11px] font-extrabold text-white shadow-2xs transition hover:bg-amber-600"
        >
          <Clock className="size-3.5 shrink-0" />
          <span>
            {sm.offerPendingAdminTag}
            {pendingAdminOffer.buyer_name
              ? ` (${pendingAdminOffer.buyer_name})`
              : ""}
          </span>
        </Link>
      ) : pendingSellerOffer ? (
        <Link
          href={`/admin/deals?offerId=${pendingSellerOffer.id}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-[11px] font-extrabold text-purple-900 shadow-2xs transition hover:bg-purple-100"
        >
          <span>
            💰 {sm.offerPendingTag}
            {pendingSellerOffer.buyer_name
              ? ` (${pendingSellerOffer.buyer_name})`
              : ""}
          </span>
        </Link>
      ) : null}

      {waitlistOffers.length > 0 && (
        <Link
          href={`/admin/deals?tab=waitlist&offerId=${waitlistOffers[0].id}`}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-extrabold text-slate-700 shadow-2xs transition hover:bg-slate-100"
        >
          <Lock className="size-3 shrink-0" />
          <span>
            ⏳ {waitlistOffers.length} {sm.offerBackupTag}
          </span>
        </Link>
      )}

      {!isFeaturedActive && property.featured_status === "pending_payment" && (
        <button
          type="button"
          onClick={() =>
            onConfirmAction({
              type: "promote",
              property,
              promoAction: "activate",
              days: property.featured_days || 14,
              tier: isVipPlus ? "vip_plus" : "super_vip",
            })
          }
          title={`${propBadges.promoReqPrefix} (${property.featured_fawry_code || "AD"}${property.featured_price ? ` · ${property.featured_price} ₾` : ""})`}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-extrabold text-amber-900 shadow-2xs hover:bg-amber-100"
        >
          <Sparkles className="size-3 shrink-0 text-amber-600" />
          <span>
            {propBadges.promoReqPrefix} {isVipPlus ? "+VIP" : "SUPER VIP"} (
            {property.featured_days || 1} {propBadges.dayWord})
          </span>
        </button>
      )}

      {property.submission_type === "edited_by_seller" &&
        rawStatus === "pending" && (
          <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-[11px] font-bold text-blue-800">
            <RefreshCw className="size-3" />
            <span>{propBadges.editedBySeller}</span>
          </span>
        )}

      {rawStatus === "paused_by_seller" && (
        <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-orange-50 px-2.5 text-[11px] font-bold text-orange-800">
          <PauseCircle className="size-3" />
          <span>{propBadges.pausedBySeller}</span>
        </span>
      )}

      {rawStatus === "deleted_by_seller" && (
        <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-100 px-2.5 text-[11px] font-bold text-red-800">
          <Trash2 className="size-3" />
          <span>
            {propBadges.deletedBySellerPrefix} (
            {getRemainingDaysBeforePurge(property.last_seller_edit_at)}{" "}
            {propBadges.daysWord})
          </span>
        </span>
      )}
    </div>
  )
}

function PropertyThreeDotsMenu(props: SharedPropertyCardProps) {
  const {
    property,
    currentSt,
    isFeaturedActive,
    openMenuId,
    setOpenMenuId,
    docsCount,
    matchedBuyersCount,
    validOffers,
    locale,
    t,
    aL,
    expL,
    pending,
    onOpenDocs,
    onConfirmAction,
    onExportSingle,
  } = props

  const isMenuOpen = openMenuId === property.id
  const viewsCount = Math.max(1, Number(property.views_count) || 1)
  const reportWaMessage = buildOwnerPerformanceReportWhatsAppMessage({
    property,
    viewsCount,
    offersCount: validOffers.length,
    matchedBuyersCount,
    locale,
    t,
  })

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={expL.moreActionsAria}
        onClick={(e) => {
          e.stopPropagation()
          setOpenMenuId(isMenuOpen ? null : property.id)
        }}
        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007a5a] hover:bg-slate-50 hover:text-[#0f1d40]"
      >
        <MoreVertical className="size-4" />
      </button>

      {isMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute end-0 top-9 z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(null)
              onOpenDocs(property)
            }}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-xs font-extrabold text-[#007a5a] transition hover:bg-[#eaf8f2]"
          >
            <span className="flex items-center gap-2">
              <FileCheck2 className="size-3.5 text-[#007a5a]" />
              <span>{t.modals.uploadedDocsTitle}</span>
            </span>
            <span
              dir="ltr"
              className="rounded-md bg-[#eaf8f2] px-1.5 py-0.5 font-mono text-[10px] font-black text-[#007a5a]"
            >
              {docsCount}/4
            </span>
          </button>

          <Link
            href={`/opportunities/${property.id}`}
            target="_blank"
            onClick={() => setOpenMenuId(null)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0f1d40] transition hover:bg-slate-50"
          >
            <ExternalLink className="size-3.5 text-[#007a5a]" />
            <span>{aL.viewUnitBtn}</span>
          </Link>

          <a
            href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(reportWaMessage)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpenMenuId(null)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#2563eb] transition hover:bg-blue-50"
          >
            <BarChart3 className="size-3.5 shrink-0 text-[#2563eb]" />
            <span>{aL.sendReportWaBtn}</span>
          </a>

          {currentSt !== "deleted_by_seller" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuId(null)
                  onConfirmAction({
                    type: "promote",
                    property,
                    promoAction: isFeaturedActive ? "cancel" : "activate",
                    days: property.featured_days || 14,
                    tier:
                      property.boost_tier === "vip_plus"
                        ? "vip_plus"
                        : "super_vip",
                  })
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-amber-800 transition hover:bg-amber-50"
              >
                <Star
                  className={`size-3.5 ${
                    isFeaturedActive
                      ? "fill-amber-500 text-amber-600"
                      : "text-amber-600"
                  }`}
                />
                <span>
                  {isFeaturedActive
                    ? t.actions.cancelPromoBtn
                    : t.actions.promoteStarBtn}
                </span>
              </button>

              {currentSt === "active" ||
              currentSt === "offer_received" ||
              currentSt === "transferring" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(null)
                    onConfirmAction({
                      type: "status",
                      property,
                      newStatus: "paused_by_seller",
                    })
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-orange-800 transition hover:bg-orange-50"
                >
                  <EyeOff className="size-3.5 text-orange-600" />
                  <span>{t.actions.unpublishBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(null)
                    onConfirmAction({
                      type: "status",
                      property,
                      newStatus: "active",
                    })
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#007a5a] transition hover:bg-[#eaf8f2]"
                >
                  <Check className="size-3.5 text-[#007a5a]" />
                  <span>{t.actions.publishShortBtn}</span>
                </button>
              )}
            </>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(null)
              onExportSingle(property, "excel")
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#007a5a] transition hover:bg-[#eaf8f2]"
          >
            <Download className="size-3.5 text-[#007a5a]" />
            <span>{expL.exportRowBtn}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(null)
              onExportSingle(property, "pdf")
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-blue-700 transition hover:bg-blue-50"
          >
            <FileText className="size-3.5 text-blue-600" />
            <span>{expL.exportRowPdfBtn}</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(null)
              onConfirmAction({ type: "delete", property })
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-3.5 text-red-600" />
            <span>{t.modals.deleteTitle}</span>
          </button>
        </div>
      )}
    </div>
  )
}

function PublishToggleButton({
  property,
  currentSt,
  pending,
  t,
  isMobile,
  onConfirmAction,
}: {
  property: SellRequest
  currentSt: string
  pending: boolean
  t: Record<string, any>
  isMobile?: boolean
  onConfirmAction: (action: ConfirmPropertyAction) => void
}) {
  if (currentSt === "deleted_by_seller" || currentSt === "sold") return null

  if (
    currentSt === "active" ||
    currentSt === "offer_received" ||
    currentSt === "transferring"
  ) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          onConfirmAction({
            type: "status",
            property,
            newStatus: "paused_by_seller",
          })
        }
        className={`inline-flex items-center justify-center gap-1 rounded-xl border border-orange-200 bg-orange-50 px-2.5 text-xs font-extrabold text-orange-800 transition hover:bg-orange-100 disabled:opacity-50 ${
          isMobile ? "h-8.5 flex-1" : "h-8 shrink-0"
        }`}
        title={t.actions.unpublishBtn}
      >
        <EyeOff className="size-3.5 shrink-0 text-orange-600" />
        <span className="truncate">{t.actions.unpublishBtn}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        onConfirmAction({ type: "status", property, newStatus: "active" })
      }
      className={`inline-flex items-center justify-center gap-1 rounded-xl bg-[#007a5a] px-3 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248] disabled:opacity-50 ${
        isMobile ? "h-8.5 flex-1" : "h-8 shrink-0"
      }`}
      title={t.actions.publishShortBtn}
    >
      <Check className="size-3.5 shrink-0" />
      <span className="truncate">{t.actions.publishShortBtn}</span>
    </button>
  )
}

export function PropertyMobileCard(props: SharedPropertyCardProps) {
  const {
    property,
    currentSt,
    stObj,
    sellerStatusOptions,
    isLoading,
    isHighlighted,
    isFeaturedActive,
    unitCur,
    locale,
    t,
    leadsPrompts,
    pending,
    verificationMap,
    onConfirmAction,
    onOpenDetails,
  } = props

  const isVipPlus = property.boost_tier === "vip_plus"
  const waText = buildSellerWhatsAppMessage({
    property,
    unitCur,
    locale,
    t,
    leadsPrompts,
  })
  const localizedArea = cleanPropertyAreaDisplay(property.area, locale)
  const phoneOk = isSellerPhoneVerified(property, verificationMap)
  const emailOk = isSellerEmailVerified(property, verificationMap)

  return (
    <div
      id={`prop-row-${property.id}`}
      className={`relative overflow-visible rounded-2xl border bg-white shadow-xs transition ${
        isLoading
          ? "border-[#007a5a] opacity-75"
          : isHighlighted
            ? "border-2 border-[#007a5a] ring-2 ring-[#007a5a]/25"
            : currentSt === "deleted_by_seller"
              ? "border-red-300 bg-red-50/20"
              : isFeaturedActive
                ? "border-amber-300"
                : "border-slate-200/90"
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/65 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-[#0f1d40] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
            <Loader2 className="size-3.5 animate-spin text-emerald-400" />
            <span>{t.table.updatingText}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                {deriveShortUnitCode(property.id, property.code)}
              </span>
              <h3 className="truncate text-sm font-black text-[#0f1d40]">
                {property.project_name || t.table.unspecifiedProject}
              </h3>
              {isFeaturedActive && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-black ${
                    isVipPlus
                      ? "bg-indigo-100 text-indigo-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {isVipPlus ? "+VIP" : "SUPER VIP"}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11.5px] font-semibold text-slate-500">
              <span className="text-[#0f1d40]">{localizedArea}</span> ·{" "}
              {getLocalizedUnitTypeNameShort(
                property.unit_type,
                t.table.defaultUnitType
              )}{" "}
              {property.size ? `· ${property.size} ${t.table.sqmUnit}` : ""}
            </p>
          </div>

          <PropertyThreeDotsMenu {...props} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs">
          <div>
            <span className="block text-[10px] font-bold text-slate-400">
              {t.table.colCash}
            </span>
            <strong
              dir="ltr"
              className="mt-0.5 block text-sm font-black text-[#007a5a] tabular-nums"
            >
              {property.paid_amount
                ? `${unitCur}${Number(property.paid_amount).toLocaleString("en-US")}`
                : "—"}
            </strong>
          </div>

          <div className="border-s border-slate-200/70 ps-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-400">{t.table.contractShort}</span>
              <strong dir="ltr" className="text-[#0f1d40] tabular-nums">
                {property.contract_price
                  ? `${unitCur}${Number(property.contract_price).toLocaleString("en-US")}`
                  : "—"}
              </strong>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-1">
              <span className="text-slate-400">{t.table.marketShort}</span>
              <strong dir="ltr" className="text-slate-600 tabular-nums">
                {property.market_price
                  ? `${unitCur}${Number(property.market_price).toLocaleString("en-US")}`
                  : "—"}
              </strong>
            </div>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5 font-extrabold text-[#0f1d40]">
              <User className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{property.name}</span>
            </div>
            <div
              dir="ltr"
              className="flex shrink-0 items-center gap-1 font-mono text-[11.5px] font-bold text-slate-700"
            >
              <Phone className="size-3 text-slate-400" />
              <span>{property.phone}</span>
              {phoneOk && <CheckCircle2 className="size-3.5 text-[#007a5a]" />}
            </div>
          </div>
          {property.email && (
            <div
              dir="ltr"
              className="mt-1 flex items-center justify-start gap-1 text-[10.5px] text-slate-500"
            >
              <span className="break-all">{property.email}</span>
              {emailOk && (
                <CheckCircle2 className="size-3 shrink-0 text-[#007a5a]" />
              )}
            </div>
          )}
        </div>

        <div className="mt-2.5">
          <select
            disabled={pending}
            value={currentSt}
            onChange={(e) => {
              const nextSt = e.target.value
              if (nextSt !== currentSt) {
                onConfirmAction({
                  type: "status",
                  property,
                  newStatus: nextSt,
                })
              }
            }}
            className={`h-9 w-full rounded-xl border px-3 text-center text-xs font-extrabold focus:outline-none [text-align-last:center] ${stObj.badge}`}
          >
            {sellerStatusOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-[#0f1d40]"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2.5 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <PropertyActivityBadges {...props} />

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2.5">
          <PublishToggleButton
            property={property}
            currentSt={currentSt}
            pending={pending}
            t={t}
            isMobile
            onConfirmAction={onConfirmAction}
          />

          <Button
            size="sm"
            variant="outline"
            className="h-8.5 flex-1 rounded-xl bg-white text-xs font-bold"
            onClick={() => onOpenDetails(property)}
          >
            <Eye className="me-1 size-3.5 text-[#007a5a]" />
            {t.actions.detailsBtn}
          </Button>

          <a
            data-admin-client-wa="true"
            href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white transition hover:bg-[#1ebe5d]"
          >
            <WhatsAppOfficialIcon className="size-4" />
            <span>{leadsPrompts.whatsappBtn}</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export function PropertyDesktopRow(props: SharedPropertyCardProps) {
  const {
    property,
    index = 0,
    currentSt,
    stObj,
    sellerStatusOptions,
    isLoading,
    isHighlighted,
    isFeaturedActive,
    unitCur,
    locale,
    t,
    propBadges,
    leadsPrompts,
    pending,
    verificationMap,
    onConfirmAction,
    onOpenDetails,
  } = props

  const isVipPlus = property.boost_tier === "vip_plus"
  const waText = buildSellerWhatsAppMessage({
    property,
    unitCur,
    locale,
    t,
    leadsPrompts,
  })
  const localizedArea = cleanPropertyAreaDisplay(property.area, locale)
  const phoneOk = isSellerPhoneVerified(property, verificationMap)
  const emailOk = isSellerEmailVerified(property, verificationMap)

  return (
    <div
      id={`prop-row-${property.id}`}
      className={`overflow-visible rounded-2xl border bg-white shadow-2xs transition-all hover:shadow-md ${
        isLoading
          ? "border-[#007a5a] bg-[#eaf8f2]/30 opacity-60"
          : isHighlighted
            ? "border-2 border-[#007a5a] bg-[#eaf8f2]/30 ring-2 ring-[#007a5a]/20"
            : currentSt === "active"
              ? "border-slate-200/90 border-s-4 border-s-[#007a5a]"
              : currentSt === "offer_received" || currentSt === "transferring"
                ? "border-purple-200 border-s-4 border-s-purple-600"
                : currentSt === "pending" || currentSt === "under_review"
                  ? "border-amber-200/90 border-s-4 border-s-amber-500"
                  : currentSt === "deleted_by_seller"
                    ? "border-red-200 bg-red-50/20"
                    : "border-slate-200/90"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,3.5fr)_minmax(0,2.5fr)_minmax(0,3fr)_215px] items-center gap-4 px-5 py-4">
        <div className="min-w-0 pe-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
              {index + 1}
            </span>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-black text-[#0f1d40]">
              {deriveShortUnitCode(property.id, property.code)}
            </span>
            <Link
              href={`/opportunities/${property.id}`}
              target="_blank"
              className="truncate text-sm font-black text-[#0f1d40] hover:text-[#007a5a] hover:underline"
            >
              {property.project_name || t.table.unspecifiedProject}
            </Link>
            {isFeaturedActive && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black ${
                  isVipPlus
                    ? "bg-indigo-100 text-indigo-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {isVipPlus ? (
                  <Flame className="size-3 text-indigo-600" />
                ) : (
                  <Crown className="size-3 text-amber-600" />
                )}
                <span>
                  {isVipPlus ? "+VIP" : "SUPER VIP"} (
                  {property.featured_days || 14} {propBadges.dayWord})
                </span>
              </span>
            )}
            {isLoading && (
              <Loader2 className="size-4 shrink-0 animate-spin text-[#007a5a]" />
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 ps-8 text-xs font-semibold text-slate-500">
            <span className="font-bold text-[#0f1d40]">{localizedArea}</span>
            <span>·</span>
            <span>
              {getLocalizedUnitTypeNameShort(
                property.unit_type,
                t.table.defaultUnitType
              )}
            </span>
            {property.size ? (
              <>
                <span>·</span>
                <span>
                  {property.size} {t.table.sqmUnit}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="border-s border-slate-100 ps-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              {t.table.colCash}
            </span>
            <span
              dir="ltr"
              className="text-base font-black text-[#007a5a] tabular-nums"
            >
              {property.paid_amount
                ? `${unitCur}${Number(property.paid_amount).toLocaleString("en-US")}`
                : "—"}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">{t.table.contractShort}</span>
              <strong
                dir="ltr"
                className="font-extrabold text-[#0f1d40] tabular-nums"
              >
                {property.contract_price
                  ? `${unitCur}${Number(property.contract_price).toLocaleString("en-US")}`
                  : "—"}
              </strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">{t.table.marketShort}</span>
              <span
                dir="ltr"
                className="font-bold text-slate-600 tabular-nums"
              >
                {property.market_price
                  ? `${unitCur}${Number(property.market_price).toLocaleString("en-US")}`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 border-s border-slate-100 ps-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#0f1d40]">
            <User className="size-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{property.name}</span>
          </div>
          <div
            dir="ltr"
            className="mt-1 flex items-center justify-start gap-1.5 font-mono text-[11.5px] font-bold text-slate-700"
          >
            <span>{property.phone}</span>
            {phoneOk && (
              <span
                title={propBadges.phoneVerifiedBadge}
                className="inline-flex text-[#007a5a]"
              >
                <CheckCircle2 className="size-3.5" />
              </span>
            )}
          </div>
          {property.email && (
            <div
              dir="ltr"
              className="mt-0.5 flex items-center justify-start gap-1 text-[11px] font-medium text-slate-500"
            >
              <span className="break-all">{property.email}</span>
              {emailOk && (
                <span
                  title={propBadges.emailVerifiedBadge}
                  className="inline-flex shrink-0 text-[#007a5a]"
                >
                  <CheckCircle2 className="size-3.5" />
                </span>
              )}
            </div>
          )}
        </div>

        <div className="border-s border-slate-100 ps-3.5">
          <select
            disabled={pending}
            value={currentSt}
            onChange={(e) => {
              const nextSt = e.target.value
              if (nextSt !== currentSt) {
                onConfirmAction({
                  type: "status",
                  property,
                  newStatus: nextSt,
                })
              }
            }}
            className={`h-9 w-full cursor-pointer rounded-xl border px-2 text-center text-[11px] font-extrabold transition focus:outline-none [text-align-last:center] ${stObj.badge}`}
          >
            {sellerStatusOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-xs text-[#0f1d40]"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-5 py-2.5">
        <div className="min-w-0 flex-1">
          <PropertyActivityBadges {...props} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {currentSt === "deleted_by_seller" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                onConfirmAction({
                  type: "status",
                  property,
                  newStatus: "pending",
                })
              }
              className="h-8 rounded-xl border-emerald-200 bg-[#eaf8f2] px-3 text-[11px] font-bold text-[#007a5a]"
            >
              <RotateCcw className="me-1 size-3" />
              {t.actions.restoreBtn}
            </Button>
          ) : (
            <>
              <PublishToggleButton
                property={property}
                currentSt={currentSt}
                pending={pending}
                t={t}
                onConfirmAction={onConfirmAction}
              />

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  onConfirmAction({
                    type: "promote",
                    property,
                    promoAction: isFeaturedActive ? "cancel" : "activate",
                    days: property.featured_days || 14,
                    tier:
                      property.boost_tier === "vip_plus"
                        ? "vip_plus"
                        : "super_vip",
                  })
                }
                title={
                  isFeaturedActive
                    ? t.actions.cancelPromoBtn
                    : t.actions.promoteStarBtn
                }
                className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl border px-2.5 text-[11px] font-extrabold transition disabled:opacity-50 ${
                  isFeaturedActive
                    ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                    : "border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <Star
                  className={`size-3.5 shrink-0 ${
                    isFeaturedActive
                      ? "fill-amber-500 text-amber-600"
                      : "text-amber-600"
                  }`}
                />
                <span className="truncate">
                  {isFeaturedActive
                    ? t.actions.cancelPromoBtn
                    : t.actions.promoteStarBtn}
                </span>
              </button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl bg-white px-2.5 text-[11px] font-bold"
                onClick={() => onOpenDetails(property)}
              >
                <Eye className="me-1 size-3 text-[#007a5a]" />
                {t.actions.detailsBtn}
              </Button>
            </>
          )}

          <a
            data-admin-client-wa="true"
            href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            title={leadsPrompts.whatsappBtn}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
          >
            <WhatsAppOfficialIcon className="size-4" />
          </a>

          <PropertyThreeDotsMenu {...props} />
        </div>
      </div>
    </div>
  )
}

export function PropertyDocsQuickDialog({
  dir,
  t,
  propBadges,
  docsProperty,
  docsList,
  onClose,
  onOpenFullDetails,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  propBadges: Record<string, string>
  docsProperty: SellRequest | null
  docsList: Array<{ label: string; url: string }>
  onClose: () => void
  onOpenFullDetails: (property: SellRequest) => void
}) {
  return (
    <Dialog open={Boolean(docsProperty)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 text-start">
          <DialogTitle className="flex items-center gap-2 text-sm font-black text-[#0f1d40] sm:text-base">
            <FileCheck2 className="size-5 text-[#007a5a]" />
            <span>{t.modals.uploadedDocsTitle}</span>
            {docsProperty && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-[#0f1d40]">
                {deriveShortUnitCode(docsProperty.id, docsProperty.code)}
              </span>
            )}
          </DialogTitle>
          {docsProperty && (
            <DialogDescription className="text-start text-xs font-semibold text-slate-500">
              {docsProperty.project_name || t.table.unspecifiedProject} ·{" "}
              {docsProperty.name} ({docsList.length}/4 {propBadges.docWord})
            </DialogDescription>
          )}
        </DialogHeader>

        {docsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center">
            <FileText className="mb-2 size-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-500">
              {t.modals.noDocsUploaded}
            </p>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {docsList.map((docItem, i) => (
              <div
                key={`${docItem.url}-${i}`}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
              >
                {isImageUrl(docItem.url) ? (
                  <a
                    href={docItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-40 w-full overflow-hidden bg-slate-100"
                  >
                    <img
                      src={docItem.url}
                      alt={docItem.label}
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ) : (
                  <div className="flex h-28 items-center justify-center bg-slate-50 text-slate-400">
                    <FileText className="size-10 text-[#007a5a]/60" />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-3">
                  <span className="truncate text-xs font-extrabold text-[#0f1d40]">
                    {docItem.label}
                  </span>
                  <a
                    href={docItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-[#eaf8f2] px-2.5 text-[11px] font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white"
                  >
                    <ExternalLink className="size-3" />
                    <span>{t.actions.openDocBtn}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          {docsProperty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold"
              onClick={() => {
                const target = docsProperty
                onClose()
                onOpenFullDetails(target)
              }}
            >
              <Eye className="me-1.5 size-3.5 text-[#007a5a]" />
              {t.actions.detailsBtn}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-[#0f1d40] text-xs font-bold text-white hover:bg-[#1e293b]"
            onClick={onClose}
          >
            {t.actions.closeBtn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}