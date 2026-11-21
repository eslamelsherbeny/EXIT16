"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardList,
  Crown,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Flame,
  Handshake,
  Info,
  Loader2,
  Lock,
  MessageCircle,
  MoreVertical,
  PauseCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UploadCloud,
  User,
} from "lucide-react"
import {
  adminUploadUnitDocumentAction,
  verifyUnitDocsViaWhatsAppAction,
} from "@/actions/admin-actions"
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
  getPropertyHeadline,
  getRemainingDaysBeforePurge,
  isSellerEmailVerified,
  isSellerPhoneVerified,
  isUnitWhatsAppDocsVerified,
  REAL_UNIT_DOC_KEYS,
  type ConfirmPropertyAction,
  type SellRequest,
  type UnitDocKey,
  type UserVerificationBadgeInfo,
} from "./properties-helpers"
import type { LocaleCode } from "@/lib/i18n"

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

function computeRemainingBoostDays(property: SellRequest): number {
  if (property.featured_until) {
    const ms = new Date(property.featured_until).getTime() - Date.now()
    if (ms > 0) return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  }
  return Math.max(1, Number(property.featured_days) || 1)
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
  isAutoLockedStage: boolean
  isPromotionsPage: boolean
  stObj: StatusOptionItem
  manualStatusOptions: StatusOptionItem[]
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
  onOpenEdit: (property: SellRequest) => void
  onOpenDocs: (property: SellRequest) => void
  onOpenSmartMatch: (property: SellRequest) => void
  onOpenOffersLog: (property: SellRequest) => void
  onOpenDealSummary: (
    property: SellRequest,
    offer: any,
    waitlistCount: number
  ) => void
  onOpenBlockedStage: (
    property: SellRequest,
    stage: string,
    offerId?: string
  ) => void
  onExportSingle: (property: SellRequest, format: "excel" | "pdf") => void
  matchedBuyersCount: number
  validOffers: any[]
  docsCount: number
}

function UnitStatusControl(props: SharedPropertyCardProps) {
  const {
    property,
    currentSt,
    isAutoLockedStage,
    stObj,
    manualStatusOptions,
    pending,
    validOffers,
    onConfirmAction,
    onOpenBlockedStage,
  } = props

  if (currentSt === "sold") {
    const acceptedOffer = validOffers.find((o) => o.status === "accepted")
    return (
      <button
        type="button"
        onClick={() =>
          onOpenBlockedStage(
            property,
            "sold",
            acceptedOffer ? String(acceptedOffer.id) : undefined
          )
        }
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#007a5a] bg-[#007a5a] px-3 text-center text-[11px] font-extrabold text-white transition hover:bg-[#006248]"
      >
        <Lock className="size-3.5 shrink-0 opacity-85" />
        <span className="truncate">{stObj.label}</span>
        <Info className="size-3.5 shrink-0 opacity-85" />
      </button>
    )
  }

  if (currentSt === "deleted_by_seller") {
    return (
      <div className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 text-center text-[11px] font-extrabold text-red-900 select-none">
        <Trash2 className="size-3.5 shrink-0" />
        <span className="truncate">{stObj.label}</span>
      </div>
    )
  }

  if (isAutoLockedStage) {
    const acceptedOffer = validOffers.find((o) => o.status === "accepted")
    return (
      <button
        type="button"
        onClick={() =>
          onOpenBlockedStage(
            property,
            currentSt,
            acceptedOffer ? String(acceptedOffer.id) : undefined
          )
        }
        className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border px-3 text-center text-[11px] font-extrabold transition ${stObj.badge}`}
      >
        <span className="truncate">{stObj.label}</span>
        <Info className="size-3.5 shrink-0 opacity-80" />
      </button>
    )
  }

  const selectValue =
    currentSt === "incomplete" ? "pending" : currentSt

  return (
    <select
      disabled={pending}
      value={selectValue}
      onChange={(e) => {
        const nextSt = e.target.value
        if (nextSt !== selectValue) {
          onConfirmAction({
            type: "status",
            property,
            newStatus: nextSt,
          })
        }
      }}
      className={`h-9 w-full cursor-pointer rounded-xl border px-2 text-center text-[11px] font-extrabold transition focus:outline-none [text-align-last:center] ${stObj.badge}`}
    >
      {manualStatusOptions.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="bg-white text-xs text-[#0f1d40]"
        >
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function PropertyActivityBadges({
  property,
  rawStatus,
  currentSt,
  isPromotionsPage,
  isFeaturedActive,
  docsCount,
  matchedBuyersCount,
  validOffers,
  unitCur,
  t,
  propBadges,
  sm,
  aL,
  onOpenDocs,
  onOpenSmartMatch,
  onOpenOffersLog,
  onOpenDealSummary,
  onConfirmAction,
}: SharedPropertyCardProps) {
  const viewsCount = Math.max(1, Number(property.views_count) || 1)
  const acceptedOffer = validOffers.find((o) => o.status === "accepted")
  const activeNonAcceptedOffers = validOffers.filter(
    (o) =>
      o.status === "pending_admin" ||
      o.status === "pending_seller" ||
      o.status === "counter_offered"
  )
  const waitlistOffers = validOffers.filter((o) => o.status === "unit_locked")
  const isVipPlus = property.boost_tier === "vip_plus"
  const waDocsVerified = isUnitWhatsAppDocsVerified(property)
  const ds = (t.dealSummary as Record<string, string>) || {}
  const oL = (t.offersLog as Record<string, string>) || {}

  if (currentSt === "sold") {
    const buyerName = acceptedOffer?.buyer_name || "—"
    const amountStr = `${unitCur}${Number(acceptedOffer?.offered_cash || property.paid_amount || 0).toLocaleString("en-US")}`
    const soldLine = acceptedOffer
      ? String(ds.soldToBuyerSummary || "")
          .replace("{buyer}", buyerName)
          .replace("{amount}", amountStr)
      : ds.soldNoBuyerSummary || ""

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-3 py-1.5 text-[11px] font-extrabold text-[#0f1d40]">
          <Trophy className="size-3.5 shrink-0 text-[#007a5a]" />
          <span>{soldLine}</span>
        </span>
        {acceptedOffer && (
          <Link
            href={`/admin/deals?offerId=${acceptedOffer.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#0f1d40] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#1e293b]"
          >
            <Handshake className="size-3.5 text-emerald-300" />
            <span>{ds.openDealFileBtn}</span>
          </Link>
        )}
      </div>
    )
  }

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
          waDocsVerified || docsCount >= 4
            ? "border-emerald-200 bg-white text-[#007a5a] hover:bg-[#eaf8f2]"
            : docsCount > 0
              ? "border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
        }`}
      >
        <FileCheck2
          className={`size-3.5 shrink-0 ${
            waDocsVerified || docsCount >= 4
              ? "text-[#007a5a]"
              : "text-slate-400"
          }`}
        />
        {waDocsVerified ? (
          <span>{propBadges.waDocsVerifiedShort}</span>
        ) : (
          <>
            <span dir="ltr" className="tabular-nums">
              {docsCount}/4
            </span>
            <span>{propBadges.docWord}</span>
          </>
        )}
      </button>

      {currentSt === "in_deal" && acceptedOffer ? (
        <>
          <button
            type="button"
            onClick={() =>
              onOpenDealSummary(property, acceptedOffer, waitlistOffers.length)
            }
            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#007a5a] px-3 text-[11px] font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
          >
            <Handshake className="size-3.5 shrink-0" />
            <span>
              {ds.currentDealBtn}
              {acceptedOffer.buyer_name
                ? ` (${acceptedOffer.buyer_name})`
                : ""}
            </span>
          </button>

          {waitlistOffers.length > 0 && (
            <Link
              href={`/admin/deals?offerId=${acceptedOffer.id}`}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-extrabold text-slate-700 shadow-2xs transition hover:bg-slate-100"
            >
              <Lock className="size-3 shrink-0" />
              <span>
                ⏳ {ds.waitlistCountPrefix} ({waitlistOffers.length})
              </span>
            </Link>
          )}
        </>
      ) : (
        <>
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

          {activeNonAcceptedOffers.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenOffersLog(property)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-extrabold shadow-2xs transition ${
                activeNonAcceptedOffers.some(
                  (o) => o.status === "counter_offered"
                )
                  ? "border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-700 hover:text-white"
                  : activeNonAcceptedOffers.some(
                        (o) => o.status === "pending_admin"
                      )
                    ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-500 hover:text-white"
                    : "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-600 hover:text-white"
              }`}
            >
              <ClipboardList className="size-3.5 shrink-0" />
              <span>
                {oL.btnLabel} ({activeNonAcceptedOffers.length})
              </span>
            </button>
          )}
        </>
      )}

      {isPromotionsPage &&
        !isFeaturedActive &&
        property.featured_status === "pending_payment" && (
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

      {rawStatus === "paused_by_admin" && (
        <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-rose-50 px-2.5 text-[11px] font-bold text-rose-800">
          <ShieldAlert className="size-3" />
          <span>{propBadges.pausedByAdmin}</span>
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
    isAutoLockedStage,
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
    onOpenEdit,
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

          {currentSt !== "sold" && currentSt !== "deleted_by_seller" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                onOpenEdit(property)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0f1d40] transition hover:bg-slate-50"
            >
              <Edit3 className="size-3.5 text-[#007a5a]" />
              <span>{t.actions.editDataBtn}</span>
            </button>
          )}

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

          {currentSt !== "deleted_by_seller" && currentSt !== "sold" && (
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

              {!isAutoLockedStage &&
                (currentSt === "active" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(null)
                      onConfirmAction({
                        type: "status",
                        property,
                        newStatus: "paused_by_admin",
                      })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  >
                    <EyeOff className="size-3.5 text-rose-600" />
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
                ))}
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

          {!isAutoLockedStage && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}

function PublishToggleButton({
  property,
  currentSt,
  isAutoLockedStage,
  pending,
  t,
  isMobile,
  onConfirmAction,
}: {
  property: SellRequest
  currentSt: string
  isAutoLockedStage: boolean
  pending: boolean
  t: Record<string, any>
  isMobile?: boolean
  onConfirmAction: (action: ConfirmPropertyAction) => void
}) {
  if (
    currentSt === "deleted_by_seller" ||
    currentSt === "sold" ||
    isAutoLockedStage
  ) {
    return null
  }

  if (currentSt === "active") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          onConfirmAction({
            type: "status",
            property,
            newStatus: "paused_by_admin",
          })
        }
        className={`inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-xs font-extrabold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50 ${
          isMobile ? "h-8.5 flex-1" : "h-8 shrink-0"
        }`}
        title={t.actions.unpublishBtn}
      >
        <EyeOff className="size-3.5 shrink-0 text-rose-600" />
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
    isAutoLockedStage,
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
  const remainingDays = computeRemainingBoostDays(property)
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
            : currentSt === "sold"
              ? "border-emerald-200/90 bg-slate-50/40 border-s-4 border-s-[#0f1d40]"
              : currentSt === "deleted_by_seller"
                ? "border-red-300 bg-red-50/20"
                : currentSt === "paused_by_admin"
                  ? "border-rose-300 bg-rose-50/15"
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
                {getPropertyHeadline(property, t.table.unspecifiedProject)}
              </h3>
              {isFeaturedActive && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-black ${
                    isVipPlus
                      ? "bg-indigo-100 text-indigo-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {isVipPlus ? "+VIP" : "SUPER VIP"} · {remainingDays}{" "}
                  {propBadges.dayWord}
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
          <UnitStatusControl {...props} />
        </div>
      </div>

      <div className="space-y-2.5 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <PropertyActivityBadges {...props} />

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2.5">
          <PublishToggleButton
            property={property}
            currentSt={currentSt}
            isAutoLockedStage={isAutoLockedStage}
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
    isAutoLockedStage,
    isPromotionsPage,
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
  const remainingDays = computeRemainingBoostDays(property)
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
            : currentSt === "sold"
              ? "border-emerald-200/90 bg-slate-50/40 border-s-4 border-s-[#0f1d40]"
              : currentSt === "in_deal"
                ? "border-emerald-300 border-s-4 border-s-[#007a5a]"
                : currentSt === "negotiating"
                  ? "border-purple-200 border-s-4 border-s-purple-600"
                  : currentSt === "has_offers"
                    ? "border-amber-200 border-s-4 border-s-amber-500"
                    : currentSt === "active"
                      ? "border-slate-200/90 border-s-4 border-s-[#007a5a]"
                      : currentSt === "paused_by_admin"
                        ? "border-rose-200/90 border-s-4 border-s-rose-500"
                        : currentSt === "pending" ||
                            currentSt === "under_review" ||
                            currentSt === "incomplete"
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
              {getPropertyHeadline(property, t.table.unspecifiedProject)}
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
                  {isVipPlus ? "+VIP" : "SUPER VIP"} · {remainingDays}{" "}
                  {propBadges.dayWord}
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
          <UnitStatusControl {...props} />
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
                isAutoLockedStage={isAutoLockedStage}
                pending={pending}
                t={t}
                onConfirmAction={onConfirmAction}
              />

              {isPromotionsPage && currentSt !== "sold" && (
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
              )}

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
  onNotice,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  propBadges: Record<string, string>
  docsProperty: SellRequest | null
  docsList: Array<{ key: string; label: string; url: string }>
  onClose: () => void
  onOpenFullDetails: (property: SellRequest) => void
  onNotice?: (msg: { text: string; isError?: boolean }) => void
}) {
  const router = useRouter()
  const dm = (t.docsModal as Record<string, string>) || {}
  const docsDict = (t.docs as Record<string, string>) || {}
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [waBusy, setWaBusy] = useState(false)
  const [, startTransition] = useTransition()

  if (!docsProperty) return null

  const waDocsVerified = isUnitWhatsAppDocsVerified(docsProperty)
  const existingByKey = new Map(docsList.map((d) => [d.key, d]))

  function handleFileUpload(docKey: UnitDocKey, file: File | null) {
    if (!file || !docsProperty) return
    setBusyKey(docKey)
    const fd = new FormData()
    fd.append("propertyId", docsProperty.id)
    fd.append("docKey", docKey)
    fd.append("file", file)

    startTransition(async () => {
      try {
        const res = await adminUploadUnitDocumentAction(fd)
        if (res.success) {
          onNotice?.({ text: dm.uploadSuccess })
          router.refresh()
        } else {
          onNotice?.({ text: res.error || dm.uploadError, isError: true })
        }
      } finally {
        setBusyKey(null)
      }
    })
  }

  function handleToggleWaDocsVerify(publishImmediately = false) {
    if (!docsProperty) return
    setWaBusy(true)
    startTransition(async () => {
      try {
        const res = await verifyUnitDocsViaWhatsAppAction({
          propertyId: docsProperty.id,
          verified: publishImmediately ? true : !waDocsVerified,
          publishImmediately,
        })
        if (res.success) {
          onNotice?.({
            text: publishImmediately
              ? dm.waVerifiedAndPublishedSuccess
              : waDocsVerified
                ? dm.waVerifyRemovedSuccess
                : dm.waVerifiedSuccess,
          })
          router.refresh()
          if (publishImmediately) onClose()
        } else {
          onNotice?.({ text: res.error || t.loadError, isError: true })
        }
      } finally {
        setWaBusy(false)
      }
    })
  }

  return (
    <Dialog open={Boolean(docsProperty)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[95vw] max-w-2xl overflow-y-auto rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 text-start">
          <DialogTitle className="flex items-center gap-2 text-sm font-black text-[#0f1d40] sm:text-base">
            <FileCheck2 className="size-5 text-[#007a5a]" />
            <span>{t.modals.uploadedDocsTitle}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-[#0f1d40]">
              {deriveShortUnitCode(docsProperty.id, docsProperty.code)}
            </span>
          </DialogTitle>
          <DialogDescription className="text-start text-xs font-semibold text-slate-500">
            {getPropertyHeadline(docsProperty, t.table.unspecifiedProject)} ·{" "}
            {docsProperty.name} ({docsList.length}/4 {propBadges.docWord})
          </DialogDescription>
        </DialogHeader>

        {/* شريط توثيق المستندات عبر واتساب من الأدمن */}
        <div
          className={`mt-2 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border p-3 text-xs ${
            waDocsVerified
              ? "border-emerald-300 bg-[#eaf8f2]"
              : "border-amber-200 bg-amber-50/70"
          }`}
        >
          <div className="flex items-start gap-2">
            <MessageCircle
              className={`mt-0.5 size-4 shrink-0 ${
                waDocsVerified ? "text-[#007a5a]" : "text-amber-600"
              }`}
            />
            <div>
              <strong className="block font-extrabold text-[#0f1d40]">
                {waDocsVerified ? dm.waVerifiedTitle : dm.waVerifyBoxTitle}
              </strong>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {waDocsVerified ? dm.waVerifiedSub : dm.waVerifyBoxSub}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={waBusy}
              onClick={() => handleToggleWaDocsVerify(false)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-extrabold transition disabled:opacity-50 ${
                waDocsVerified
                  ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  : "bg-[#25D366] text-white hover:opacity-95"
              }`}
            >
              {waBusy && <Loader2 className="size-3.5 animate-spin" />}
              <span>
                {waDocsVerified ? dm.waVerifyUndoBtn : dm.waVerifyConfirmBtn}
              </span>
            </button>

            {!waDocsVerified &&
              String(docsProperty.status || "").toLowerCase() !== "active" && (
                <button
                  type="button"
                  disabled={waBusy}
                  onClick={() => handleToggleWaDocsVerify(true)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#007a5a] px-3 text-[11px] font-extrabold text-white hover:bg-[#006248] disabled:opacity-50"
                >
                  <Check className="size-3.5" />
                  <span>{dm.waVerifyAndPublishBtn}</span>
                </button>
              )}
          </div>
        </div>

        {/* شبكة المستندات الـ 4 مع إمكانية الرفع أو الاستبدال من الأدمن */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REAL_UNIT_DOC_KEYS.map((docKey) => {
            const docItem = existingByKey.get(docKey)
            const label = docsDict[docKey] || docKey
            const isUploadingThis = busyKey === docKey

            return (
              <div
                key={docKey}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
              >
                {docItem ? (
                  isImageUrl(docItem.url) ? (
                    <a
                      href={docItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-36 w-full overflow-hidden bg-slate-100"
                    >
                      <img
                        src={docItem.url}
                        alt={label}
                        className="h-full w-full object-cover transition hover:scale-105"
                      />
                    </a>
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-slate-50 text-slate-400">
                      <FileText className="size-9 text-[#007a5a]/60" />
                    </div>
                  )
                ) : (
                  <div className="flex h-24 flex-col items-center justify-center bg-slate-50/70 text-slate-400">
                    <UploadCloud className="size-7 text-slate-300" />
                    <span className="mt-1 text-[10.5px] font-semibold">
                      {dm.notUploadedYet}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3">
                  <span className="truncate text-xs font-extrabold text-[#0f1d40]">
                    {label}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {docItem && (
                      <a
                        href={docItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-[#eaf8f2] px-2.5 text-[11px] font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white"
                      >
                        <ExternalLink className="size-3" />
                        <span>{t.actions.openDocBtn}</span>
                      </a>
                    )}

                    <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-extrabold text-[#0f1d40] transition hover:border-[#007a5a] hover:text-[#007a5a]">
                      {isUploadingThis ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <UploadCloud className="size-3" />
                      )}
                      <span>
                        {docItem ? dm.replaceDocBtn : dm.uploadDocBtn}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        disabled={isUploadingThis}
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          e.target.value = ""
                          handleFileUpload(docKey, f)
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
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