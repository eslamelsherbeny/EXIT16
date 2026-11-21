"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  Box,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  FileCheck2,
  Flame,
  Handshake,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  Play,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  Users,
  Video,
  XCircle,
} from "lucide-react"
import {
  adminUpdatePropertyDataAction,
  savePropertyAdminNoteAction,
} from "@/actions/admin-actions"
import { adminWithdrawPendingOfferAction } from "@/actions/offer-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { LocaleCode } from "@/lib/i18n"
import type {
  ConfirmPropertyAction,
  SellRequest,
  UserVerificationBadgeInfo,
} from "./properties-helpers"
import {
  cleanPropertyAreaDisplay,
  deriveShortUnitCode,
  getPropertyHeadline,
  getSixStageTimelineMeta,
  getUnitUploadedDocsCount,
  isSellerEmailVerified,
  isSellerPhoneVerified,
  isUnitDocsSatisfied,
  isUnitWhatsAppDocsVerified,
} from "./properties-helpers"

const PRIORITY_RETURNED_TAG = "__PRIORITY_FROM_BACKUP__"

export function PropertyConfirmDialog({
  dir,
  t,
  confirmAction,
  setConfirmAction,
  reason,
  setReason,
  pending,
  getStatusLabel,
  onOpenDocs,
  onClose,
  onExecute,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  confirmAction: ConfirmPropertyAction | null
  setConfirmAction: (val: ConfirmPropertyAction | null) => void
  reason: string
  setReason: (val: string) => void
  pending: boolean
  getStatusLabel: (st: string | null | undefined) => string
  onOpenDocs?: (property: SellRequest) => void
  onClose: () => void
  onExecute: () => void
}) {
  const qMark = dir === "rtl" ? "؟" : "?"
  const mL = (t.modals as Record<string, string>) || {}

  const isPublishingIncompleteDocs =
    confirmAction?.type === "status" &&
    confirmAction.newStatus === "active" &&
    !isUnitDocsSatisfied(confirmAction.property)

  const uploadedCount =
    confirmAction?.type === "status"
      ? getUnitUploadedDocsCount(confirmAction.property.documents)
      : 0

  const allowWaOverride =
    confirmAction?.type === "status" &&
    Boolean(confirmAction.allowWhatsAppDocsVerify)

  const isConfirmDisabled =
    pending || (isPublishingIncompleteDocs && !allowWaOverride)

  return (
    <Dialog
      open={Boolean(confirmAction)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        dir={dir}
        className="w-[92vw] max-w-[430px] rounded-2xl p-5 text-start sm:max-w-[460px]"
      >
        {confirmAction && (
          <>
            <DialogHeader className="text-start">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    confirmAction.type === "delete" ||
                    confirmAction.type === "purge_all_deleted" ||
                    (confirmAction.type === "status" &&
                      (confirmAction.newStatus === "rejected" ||
                        confirmAction.newStatus === "paused_by_admin"))
                      ? "bg-red-100 text-red-600"
                      : confirmAction.type === "promote"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-[#105C50]"
                  }`}
                >
                  {confirmAction.type === "delete" ||
                  confirmAction.type === "purge_all_deleted" ? (
                    <Trash2 className="size-4" />
                  ) : confirmAction.type === "promote" ? (
                    <Star className="size-4 fill-amber-400 text-amber-600" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </span>
                <DialogTitle className="text-sm font-extrabold text-[#0a1122]">
                  {confirmAction.type === "purge_all_deleted" && mL.purgeTitle}
                  {confirmAction.type === "delete" && mL.deleteTitle}
                  {confirmAction.type === "promote" &&
                    (confirmAction.promoAction === "activate"
                      ? mL.activatePromoTitle
                      : mL.cancelPromoTitle)}
                  {confirmAction.type === "status" &&
                    (confirmAction.newStatus === "active"
                      ? mL.publishConfirmTitle
                      : confirmAction.newStatus === "paused_by_admin"
                        ? mL.pausedByAdminConfirmTitle
                        : confirmAction.newStatus === "pending"
                          ? mL.unpublishConfirmTitle
                          : mL.stageConfirmTitle)}
                </DialogTitle>
              </div>

              <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                {confirmAction.type === "purge_all_deleted" && (
                  <>
                    {mL.purgeDescPrefix} ({confirmAction.count}){" "}
                    {mL.purgeDescSuffix}
                  </>
                )}

                {confirmAction.type === "status" && (
                  <>
                    {mL.updateUnitPrefix}{" "}
                    <strong className="text-[#0a1122]">
                      &ldquo;
                      {getPropertyHeadline(
                        confirmAction.property,
                        confirmAction.property.name
                      )}
                      &rdquo;
                    </strong>{" "}
                    {mL.toWord}{" "}
                    <span className="font-bold text-[#105C50]">
                      ({getStatusLabel(confirmAction.newStatus)})
                    </span>
                    {qMark}
                  </>
                )}

                {confirmAction.type === "delete" && (
                  <>
                    {mL.deleteDescPrefix}{" "}
                    <strong className="text-red-600">
                      &ldquo;
                      {getPropertyHeadline(
                        confirmAction.property,
                        confirmAction.property.name
                      )}
                      &rdquo;
                    </strong>{" "}
                    {mL.deleteDescSuffix}
                  </>
                )}

                {confirmAction.type === "promote" &&
                  (confirmAction.promoAction === "activate" ? (
                    <>
                      {mL.selectPromoDuration}{" "}
                      <strong className="text-[#0a1122]">
                        &ldquo;
                        {getPropertyHeadline(
                          confirmAction.property,
                          confirmAction.property.name
                        )}
                        &rdquo;
                      </strong>
                      :
                    </>
                  ) : (
                    <>
                      {mL.confirmCancelPromo}{" "}
                      <strong className="text-[#0a1122]">
                        &ldquo;
                        {getPropertyHeadline(
                          confirmAction.property,
                          confirmAction.property.name
                        )}
                        &rdquo;
                      </strong>
                      {qMark}
                    </>
                  ))}
              </DialogDescription>
            </DialogHeader>

            {isPublishingIncompleteDocs && confirmAction.type === "status" && (
              <div className="mt-3 space-y-2.5 rounded-xl border-2 border-amber-300 bg-amber-50 p-3.5 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-black text-amber-950">
                      {mL.incompleteDocsGuardTitle} ({uploadedCount}/4)
                    </p>
                    <p className="mt-0.5 leading-relaxed font-medium text-amber-900">
                      {mL.incompleteDocsGuardDesc}
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-300/80 bg-white px-3 py-2.5 font-extrabold text-[#0f1d40]">
                  <input
                    type="checkbox"
                    checked={allowWaOverride}
                    onChange={(e) =>
                      setConfirmAction({
                        ...confirmAction,
                        allowWhatsAppDocsVerify: e.target.checked,
                      })
                    }
                    className="size-4 accent-[#007a5a]"
                  />
                  <span>{mL.incompleteDocsGuardCheckbox}</span>
                </label>

                {onOpenDocs && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetProp = confirmAction.property
                      onClose()
                      onOpenDocs(targetProp)
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#007a5a]/30 bg-white py-2 text-[11.5px] font-extrabold text-[#007a5a] transition hover:bg-[#eaf8f2]"
                  >
                    <UploadCloud className="size-3.5" />
                    <span>{mL.incompleteDocsGuardUploadBtn}</span>
                  </button>
                )}
              </div>
            )}

            {confirmAction.type === "promote" &&
              confirmAction.promoAction === "activate" && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        {
                          id: "super_vip",
                          label: "SUPER VIP",
                          icon: Crown,
                          activeCls:
                            "border-[#ff6437] bg-orange-50 text-[#ff6437]",
                        },
                        {
                          id: "vip_plus",
                          label: "+VIP",
                          icon: Flame,
                          activeCls:
                            "border-[#4f46e5] bg-indigo-50 text-[#4f46e5]",
                        },
                      ] as const
                    ).map((tierOpt) => {
                      const Icon = tierOpt.icon
                      const currentTier =
                        confirmAction.tier ||
                        (confirmAction.property.boost_tier === "vip_plus"
                          ? "vip_plus"
                          : "super_vip")
                      const isSelected = currentTier === tierOpt.id

                      return (
                        <button
                          key={tierOpt.id}
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              ...confirmAction,
                              tier: tierOpt.id,
                            })
                          }
                          className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-extrabold transition ${
                            isSelected
                              ? tierOpt.activeCls
                              : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          <span>{tierOpt.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            ...confirmAction,
                            days: d,
                          })
                        }
                        className={`rounded-xl border py-2 text-xs font-extrabold transition ${
                          confirmAction.days === d
                            ? "border-[#105C50] bg-[#eff9f5] text-[#105C50]"
                            : "border-gray-200 bg-white text-gray-600"
                        }`}
                      >
                        {d} {t.badges.dayWord}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {confirmAction.type === "status" &&
              (confirmAction.newStatus === "rejected" ||
                confirmAction.newStatus === "pending" ||
                confirmAction.newStatus === "under_review" ||
                confirmAction.newStatus === "paused_by_admin") && (
                <div className="mt-2.5 space-y-1.5">
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={
                      confirmAction.newStatus === "paused_by_admin"
                        ? mL.pausedByAdminReasonPlaceholder
                        : mL.rejectReasonPlaceholder
                    }
                    className="min-h-[70px] rounded-xl text-xs"
                  />
                  <p className="text-[10.5px] font-medium text-slate-500">
                    {mL.statusEmailNotifyHint}
                  </p>
                </div>
              )}

            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onClose}
                className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
              >
                {t.actions.cancelBtn}
              </Button>
              <Button
                type="button"
                disabled={isConfirmDisabled}
                onClick={onExecute}
                className={`h-9 flex-1 rounded-xl text-xs font-bold text-white sm:flex-none ${
                  confirmAction.type === "delete" ||
                  confirmAction.type === "purge_all_deleted" ||
                  (confirmAction.type === "status" &&
                    (confirmAction.newStatus === "rejected" ||
                      confirmAction.newStatus === "paused_by_admin"))
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#105C50] hover:bg-[#0c483f]"
                }`}
              >
                {pending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t.actions.executingBtn}
                  </span>
                ) : isPublishingIncompleteDocs && allowWaOverride ? (
                  mL.verifyWaAndPublishNowBtn
                ) : (
                  t.actions.confirmBtn
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function PropertyStageTimelineDialog({
  dir,
  t,
  blockedDict,
  data,
  onClose,
  onOpenOffersLog,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  blockedDict: Record<string, string>
  data: {
    property: SellRequest
    stage: string
    offerId?: string
  } | null
  onClose: () => void
  onOpenOffersLog: (property: SellRequest) => void
}) {
  if (!data) return null

  const mL = (t.modals as Record<string, string>) || {}
  const { property, stage, offerId } = data
  const { stages, currentStepIndex, isExceptionState, exceptionNote } =
    getSixStageTimelineMeta(stage, t)
  const uCode = deriveShortUnitCode(property.id, property.code)
  const headline = getPropertyHeadline(property, property.name)

  return (
    <Dialog open={Boolean(data)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[90vh] w-[93vw] max-w-[470px] overflow-y-auto rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pe-8 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <span
              dir="ltr"
              className="shrink-0 rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[11px] font-bold text-white"
            >
              {uCode}
            </span>
            <DialogTitle className="text-sm font-black text-[#0f1d40] sm:text-base">
              {mL.stageTimelineTitlePrefix} — {headline}
            </DialogTitle>
          </div>
          <DialogDescription className="text-start text-xs text-slate-500">
            {mL.stageTimelineSubtitle}
          </DialogDescription>
        </DialogHeader>

        {isExceptionState && exceptionNote && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
            ℹ️ {exceptionNote}
          </div>
        )}

        <ol className="relative mt-3 space-y-3 ps-1">
          {stages.map((st, idx) => {
            const isDone = idx < currentStepIndex
            const isCurrent = idx === currentStepIndex
            const isLast = idx === stages.length - 1

            return (
              <li key={st.key} className="relative flex items-start gap-3">
                {!isLast && (
                  <span
                    className={`absolute top-6 start-[11px] h-[calc(100%+4px)] w-[2px] ${
                      isDone ? "bg-[#007a5a]" : "bg-slate-200"
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    isDone
                      ? "bg-[#007a5a] text-white"
                      : isCurrent
                        ? "bg-[#0f1d40] text-white ring-4 ring-emerald-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-3.5 stroke-[2.6]" />
                  ) : (
                    idx + 1
                  )}
                </span>

                <div
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs ${
                    isCurrent
                      ? "border-[#007a5a] bg-[#eaf8f2]/70"
                      : isDone
                        ? "border-slate-100 bg-slate-50/70"
                        : "border-slate-100 bg-white opacity-75"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span
                      className={`font-extrabold ${
                        isCurrent
                          ? "text-[#0f1d40]"
                          : isDone
                            ? "text-[#007a5a]"
                            : "text-slate-500"
                      }`}
                    >
                      {st.label}
                    </span>

                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#007a5a] px-2 py-0.5 text-[9.5px] font-extrabold text-white">
                        {st.owner === "auto" && <Lock className="size-2.5" />}
                        <span>{mL.stageCurrentBadge}</span>
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-bold text-[#007a5a]">
                        {mL.stageDoneBadge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{st.sub}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 rounded-xl text-xs font-bold"
          >
            {blockedDict.gotItBtn || t.actions.closeBtn}
          </Button>

          {(stage === "in_deal" || stage === "sold") && offerId ? (
            <Link
              href={`/admin/deals?offerId=${offerId}`}
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white hover:bg-[#006248]"
            >
              <Handshake className="size-3.5" />
              <span>{blockedDict.openDealBtn}</span>
            </Link>
          ) : stage === "has_offers" || stage === "negotiating" ? (
            <button
              type="button"
              onClick={() => {
                const targetProp = property
                onClose()
                onOpenOffersLog(targetProp)
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#0f1d40] px-4 text-xs font-extrabold text-white hover:bg-[#1e293b]"
            >
              <ClipboardList className="size-3.5 text-emerald-300" />
              <span>{blockedDict.openOffersBtn}</span>
            </button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PropertyEditDataDialog({
  dir,
  t,
  property,
  onClose,
  onNotice,
}: {
  dir: "rtl" | "ltr"
  t?: Record<string, any>
  property: SellRequest | null
  onClose: () => void
  onNotice?: (msg: { text: string; isError?: boolean }) => void
}) {
  const router = useRouter()
  const [saving, startSaving] = useTransition()
  const mL = (t?.modals as Record<string, string>) || {}

  const [form, setForm] = useState({
    project_name: "",
    developer_name: "",
    area: "",
    exact_street: "",
    house_number: "",
    cadastral_code: "",
    unit_type: "",
    size: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    floor_number: "",
    total_floors: "",
    finishing: "",
    delivery_status: "",
    contract_price: "",
    paid_amount: "",
    market_price: "",
    installment_amount: "",
    installment_frequency: "",
    years_left: "",
    description: "",
  })

  useEffect(() => {
    if (!property) return
    const meta = property.documents?.__unit_meta || {}
    setForm({
      project_name: property.project_name || "",
      developer_name: property.developer_name || meta.developer_name || "",
      area: property.area || meta.area || "",
      exact_street: property.exact_street || meta.exact_street || "",
      house_number: property.house_number || meta.house_number || "",
      cadastral_code: property.cadastral_code || meta.cadastral_code || "",
      unit_type: property.unit_type || meta.unit_type || "",
      size: property.size != null ? String(property.size) : "",
      rooms: property.rooms != null ? String(property.rooms) : "",
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
      bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
      floor_number:
        property.floor_number != null ? String(property.floor_number) : "",
      total_floors:
        property.total_floors != null ? String(property.total_floors) : "",
      finishing: property.finishing || meta.finishing || "",
      delivery_status: property.delivery_status || meta.delivery_status || "",
      contract_price:
        property.contract_price != null ? String(property.contract_price) : "",
      paid_amount:
        property.paid_amount != null ? String(property.paid_amount) : "",
      market_price:
        property.market_price != null ? String(property.market_price) : "",
      installment_amount:
        property.installment_amount != null
          ? String(property.installment_amount)
          : "",
      installment_frequency:
        property.installment_frequency || meta.installment_frequency || "",
      years_left:
        property.years_left != null ? String(property.years_left) : "",
      description: property.description || "",
    })
  }, [property])

  if (!property) return null

  const uCode = deriveShortUnitCode(property.id, property.code)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!property) return
    startSaving(async () => {
      const toNum = (v: string) => (v.trim() === "" ? null : Number(v))
      const res = await adminUpdatePropertyDataAction({
        propertyId: property.id,
        project_name: form.project_name,
        developer_name: form.developer_name,
        area: form.area,
        exact_street: form.exact_street,
        house_number: form.house_number,
        cadastral_code: form.cadastral_code,
        unit_type: form.unit_type,
        size: toNum(form.size),
        rooms: toNum(form.rooms),
        bedrooms: toNum(form.bedrooms),
        bathrooms: toNum(form.bathrooms),
        floor_number: toNum(form.floor_number),
        total_floors: toNum(form.total_floors),
        finishing: form.finishing,
        delivery_status: form.delivery_status,
        contract_price: toNum(form.contract_price),
        paid_amount: toNum(form.paid_amount),
        market_price: toNum(form.market_price),
        installment_amount: toNum(form.installment_amount),
        installment_frequency: form.installment_frequency,
        years_left: toNum(form.years_left),
        description: form.description,
      })

      if (res.success) {
        onNotice?.({ text: `${mL.editSavedSuccess} (${uCode})` })
        router.refresh()
        onClose()
      } else {
        onNotice?.({
          text: res.error || mL.editSaveError,
          isError: true,
        })
      }
    })
  }

  const inputCls =
    "h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-bold text-[#0f1d40] focus:border-[#007a5a] focus:bg-white focus:outline-none"

  return (
    <Dialog
      open={Boolean(property)}
      onOpenChange={(o) => !o && !saving && onClose()}
    >
      <DialogContent
        dir={dir}
        className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 text-start">
          <DialogTitle className="flex items-center gap-2 text-sm font-black text-[#0f1d40] sm:text-base">
            <Edit3 className="size-4.5 text-[#007a5a]" />
            <span>{mL.editModalTitle}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-[#0f1d40]">
              {uCode}
            </span>
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-slate-500">
            {mL.editModalDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="mt-3 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editProjectLabel}
              </label>
              <input
                value={form.project_name}
                onChange={(e) =>
                  setForm({ ...form, project_name: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editDeveloperLabel}
              </label>
              <input
                value={form.developer_name}
                onChange={(e) =>
                  setForm({ ...form, developer_name: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editAreaLabel}
              </label>
              <input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editStreetLabel}
              </label>
              <input
                value={form.exact_street}
                onChange={(e) =>
                  setForm({ ...form, exact_street: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editHouseNoLabel}
              </label>
              <input
                value={form.house_number}
                onChange={(e) =>
                  setForm({ ...form, house_number: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editCadastralLabel}
              </label>
              <input
                dir="ltr"
                value={form.cadastral_code}
                onChange={(e) =>
                  setForm({ ...form, cadastral_code: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editUnitTypeLabel}
              </label>
              <input
                value={form.unit_type}
                onChange={(e) =>
                  setForm({ ...form, unit_type: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editSizeLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editRoomsLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.rooms}
                onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editBedroomsLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editBathroomsLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.bathrooms}
                onChange={(e) =>
                  setForm({ ...form, bathrooms: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editFloorLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.floor_number}
                onChange={(e) =>
                  setForm({ ...form, floor_number: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editTotalFloorsLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.total_floors}
                onChange={(e) =>
                  setForm({ ...form, total_floors: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200/70 bg-[#f8faf9] p-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#007a5a]">
                {mL.editPaidAmountLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.paid_amount}
                onChange={(e) =>
                  setForm({ ...form, paid_amount: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">
                {mL.editContractPriceLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.contract_price}
                onChange={(e) =>
                  setForm({ ...form, contract_price: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">
                {mL.editMarketPriceLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.market_price}
                onChange={(e) =>
                  setForm({ ...form, market_price: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">
                {mL.editInstallmentLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.installment_amount}
                onChange={(e) =>
                  setForm({ ...form, installment_amount: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">
                {mL.editFrequencyLabel}
              </label>
              <input
                value={form.installment_frequency}
                onChange={(e) =>
                  setForm({ ...form, installment_frequency: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">
                {mL.editYearsLeftLabel}
              </label>
              <input
                type="number"
                dir="ltr"
                value={form.years_left}
                onChange={(e) =>
                  setForm({ ...form, years_left: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editFinishingLabel}
              </label>
              <input
                value={form.finishing}
                onChange={(e) =>
                  setForm({ ...form, finishing: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {mL.editDeliveryLabel}
              </label>
              <input
                value={form.delivery_status}
                onChange={(e) =>
                  setForm({ ...form, delivery_status: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-500">
              {mL.editDescriptionLabel}
            </label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="min-h-[75px] rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
              className="h-9 rounded-xl text-xs font-bold"
            >
              {t?.actions?.cancelBtn}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white hover:bg-[#006248]"
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  {mL.editSavingBtn}
                </span>
              ) : (
                mL.editSaveBtn
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PropertyOffersLogDialog({
  dir,
  t,
  sm,
  dealsDict,
  property,
  offers,
  unitCur,
  onClose,
  onNotice,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  sm: Record<string, any>
  dealsDict: Record<string, any>
  property: SellRequest | null
  offers: any[]
  unitCur: string
  onClose: () => void
  onNotice?: (msg: { text: string; isError?: boolean }) => void
}) {
  const router = useRouter()
  const oL = (t.offersLog as Record<string, string>) || {}
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(
    null
  )
  const [withdrawnIds, setWithdrawnIds] = useState<Record<string, boolean>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  if (!property) return null

  const uCode = deriveShortUnitCode(property.id, property.code)
  const visibleOffers = [...offers]
    .filter((o) => !withdrawnIds[String(o.id)])
    .sort((a, b) => Number(b.offered_cash || 0) - Number(a.offered_cash || 0))

  function handleWithdraw(offerId: string) {
    setBusyId(offerId)
    startTransition(async () => {
      try {
        const res = await adminWithdrawPendingOfferAction(offerId)
        if (res.success) {
          setWithdrawnIds((prev) => ({ ...prev, [offerId]: true }))
          setConfirmWithdrawId(null)
          onNotice?.({ text: sm.offerCancelledSuccess })
          router.refresh()
        } else if (res.error) {
          onNotice?.({ text: res.error, isError: true })
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <Dialog open={Boolean(property)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[95vw] max-w-[600px] overflow-y-auto rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-sm font-black text-[#0f1d40] sm:text-base">
            <ClipboardList className="size-5 shrink-0 text-[#007a5a]" />
            <span>
              {oL.title}:{" "}
              <span className="text-[#007a5a]">
                {getPropertyHeadline(property, t.table.unspecifiedProject)}
              </span>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-[#0f1d40]">
              {uCode}
            </span>
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-slate-500">
            {oL.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-xs">
          {visibleOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center font-bold text-slate-400">
              {oL.emptyText}
            </div>
          ) : (
            visibleOffers.map((offer) => {
              const isAccepted = offer.status === "accepted"
              const isCounter = offer.status === "counter_offered"
              const isPendingAdmin = offer.status === "pending_admin"
              const isPendingSeller = offer.status === "pending_seller"
              const isWaitlist = offer.status === "unit_locked"
              const isPriorityReturned =
                isPendingAdmin &&
                Array.isArray(offer.diff_reasons) &&
                offer.diff_reasons.includes(PRIORITY_RETURNED_TAG)
              const canWithdraw = isPendingAdmin || isPendingSeller
              const routeHref =
                isAccepted || isWaitlist
                  ? `/admin/deals?offerId=${offer.id}`
                  : `/admin/offers?offerId=${offer.id}`

              return (
                <div
                  key={offer.id}
                  className={`rounded-2xl border p-3.5 shadow-2xs ${
                    isAccepted
                      ? "border-emerald-300 bg-emerald-50/30"
                      : isCounter
                        ? "border-purple-200 bg-purple-50/20"
                        : isPendingAdmin
                          ? "border-amber-300 bg-amber-50/25"
                          : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#0f1d40]">
                        {offer.buyer_name || dealsDict.buyerFallback}
                      </p>
                      <p
                        dir="ltr"
                        className="mt-0.5 font-mono text-[11px] font-bold text-slate-500"
                      >
                        {offer.buyer_phone || "—"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold ${
                        isAccepted
                          ? "bg-[#007a5a] text-white"
                          : isCounter
                            ? "bg-purple-700 text-white"
                            : isPendingAdmin && isPriorityReturned
                              ? "bg-amber-400 text-[#0f1d40]"
                              : isPendingAdmin
                                ? "bg-amber-500 text-white"
                                : isWaitlist
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      {isPriorityReturned && <Sparkles className="size-3" />}
                      {isPendingAdmin && !isPriorityReturned && (
                        <Clock className="size-3" />
                      )}
                      {isCounter && <Flame className="size-3" />}
                      {isWaitlist && <Lock className="size-3" />}
                      <span>
                        {isAccepted
                          ? sm.offerAcceptedTag
                          : isCounter
                            ? sm.offerCounterTag
                            : isPendingAdmin
                              ? sm.offerPendingAdminTag
                              : isWaitlist
                                ? sm.offerBackupTag
                                : sm.offerPendingTag}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {oL.buyerOfferedShort}
                      </span>
                      <strong
                        dir="ltr"
                        className="text-sm font-black text-[#007a5a] tabular-nums"
                      >
                        {unitCur}
                        {Number(offer.offered_cash || 0).toLocaleString(
                          "en-US"
                        )}
                      </strong>
                    </div>

                    {Number(offer.counter_cash || 0) > 0 && (
                      <div className="border-s border-slate-200 ps-4">
                        <span className="block text-[10px] font-bold text-purple-600">
                          {oL.ownerCounterShort}
                        </span>
                        <strong
                          dir="ltr"
                          className="text-sm font-black text-purple-800 tabular-nums"
                        >
                          {unitCur}
                          {Number(offer.counter_cash).toLocaleString("en-US")}
                        </strong>
                      </div>
                    )}
                  </div>

                  {confirmWithdrawId === offer.id ? (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px]">
                      <span className="font-extrabold text-red-800">
                        {sm.confirmCancelOfferPrompt}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === offer.id}
                          onClick={() => handleWithdraw(offer.id)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-[11px] font-extrabold text-white"
                        >
                          {busyId === offer.id && (
                            <Loader2 className="size-3 animate-spin" />
                          )}
                          <span>{sm.confirmYesCancelBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmWithdrawId(null)}
                          className="h-7 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-slate-700"
                        >
                          {sm.backBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <span
                        dir="ltr"
                        className="font-mono text-[10.5px] text-slate-400"
                      >
                        {offer.created_at
                          ? new Date(offer.created_at).toLocaleDateString(
                              "en-GB"
                            )
                          : ""}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {canWithdraw && (
                          <button
                            type="button"
                            onClick={() => setConfirmWithdrawId(offer.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 text-[11px] font-extrabold text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="size-3.5" />
                            <span>{sm.cancelOfferBtn}</span>
                          </button>
                        )}

                        {offer.buyer_phone && (
                          <a
                            data-admin-client-wa="true"
                            href={`https://wa.me/${String(offer.buyer_phone).replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-xl bg-[#25D366] px-2.5 text-[11px] font-bold text-white"
                          >
                            <MessageCircle className="size-3.5" />
                            <span>{sm.contactBuyerWa}</span>
                          </a>
                        )}

                        <Link
                          href={routeHref}
                          onClick={onClose}
                          className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#0f1d40] px-3 text-[11px] font-extrabold text-white hover:bg-[#1e293b]"
                        >
                          <Handshake className="size-3.5 text-emerald-300" />
                          <span>
                            {isAccepted ? oL.openDealBtn : oL.openOfferBtn}
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PropertyDealQuickSummaryDialog({
  dir,
  locale,
  t,
  sm,
  leadsDict,
  dealData,
  unitCur,
  commPct,
  onClose,
}: {
  dir: "rtl" | "ltr"
  locale: LocaleCode
  t: Record<string, any>
  sm: Record<string, any>
  leadsDict: Record<string, any>
  dealData: {
    property: SellRequest
    offer: any
    waitlistCount: number
  } | null
  unitCur: string
  commPct: number
  onClose: () => void
}) {
  if (!dealData) return null
  const { property, offer, waitlistCount } = dealData
  const uCode = deriveShortUnitCode(property.id, property.code)
  const area = cleanPropertyAreaDisplay(property.area, locale)
  const agreedCash = Number(offer.offered_cash || property.paid_amount || 0)
  const commBase = Number(property.contract_price || agreedCash || 0)
  const commission = Math.round(commBase * (commPct / 100))

  return (
    <Dialog open={Boolean(dealData)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir={dir}
        className="w-[94vw] max-w-[500px] rounded-2xl p-5 text-start"
      >
        <DialogHeader className="border-b border-slate-100 pb-3 pr-9 text-start">
          <DialogTitle className="flex items-center gap-2 text-base font-black text-[#0f1d40]">
            <Handshake className="size-5 text-[#007a5a]" />
            <span>{leadsDict.dealQuickSummaryTitle}</span>
          </DialogTitle>
          <DialogDescription className="mt-1 text-start text-xs font-semibold text-slate-500">
            {getPropertyHeadline(property, t.table.unspecifiedProject)} ({uCode}
            ){area ? ` · ${area}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-emerald-200 bg-[#eaf8f2]/70 p-3">
            <div>
              <span className="block text-[10.5px] font-bold text-[#007a5a]">
                {leadsDict.dealSummaryAgreedCash}
              </span>
              <strong
                dir="ltr"
                className="mt-0.5 block text-lg font-black text-[#007a5a] tabular-nums"
              >
                {unitCur}
                {agreedCash.toLocaleString("en-US")}
              </strong>
            </div>

            <div className="border-s border-emerald-200/80 ps-3">
              <span className="block text-[10.5px] font-bold text-slate-500">
                {leadsDict.dealSummaryCommission} ({commPct}%)
              </span>
              <strong
                dir="ltr"
                className="mt-0.5 block text-lg font-black text-[#0f1d40] tabular-nums"
              >
                {unitCur}
                {commission.toLocaleString("en-US")}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="block text-[10px] font-bold text-slate-400">
                {leadsDict.dealSummarySeller}
              </span>
              <p className="mt-0.5 truncate text-xs font-black text-[#0f1d40]">
                {property.name || "—"}
              </p>
              <p dir="ltr" className="font-mono text-[11px] text-slate-600">
                {property.phone || "—"}
              </p>
              <a
                data-admin-client-wa="true"
                href={`https://wa.me/${String(property.phone || "").replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex h-7.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-[11px] font-extrabold text-white"
              >
                <MessageCircle className="size-3.5" />
                <span>{sm.contactSellerWa}</span>
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="block text-[10px] font-bold text-slate-400">
                {leadsDict.dealSummaryBuyer}
              </span>
              <p className="mt-0.5 truncate text-xs font-black text-[#0f1d40]">
                {offer.buyer_name || "—"}
              </p>
              <p dir="ltr" className="font-mono text-[11px] text-slate-600">
                {offer.buyer_phone || "—"}
              </p>
              {offer.buyer_phone && (
                <a
                  data-admin-client-wa="true"
                  href={`https://wa.me/${String(offer.buyer_phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex h-7.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-[11px] font-extrabold text-white"
                >
                  <MessageCircle className="size-3.5" />
                  <span>{sm.contactBuyerWa}</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 font-bold text-slate-600">
              <Users className="size-4 text-[#007a5a]" />
              <span>{leadsDict.dealSummaryWaitlistCount}</span>
            </span>
            <strong className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-black text-[#0f1d40]">
              {waitlistCount}
            </strong>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 rounded-xl text-xs font-bold"
          >
            {t.actions.closeBtn}
          </Button>
          <Link
            href={`/admin/deals?offerId=${offer.id}`}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white transition hover:bg-[#006248]"
          >
            <Handshake className="size-3.5" />
            <span>
              {t.dealSummary?.openDealFileBtn || leadsDict.openDealFileBtn}
            </span>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PropertyDetailsDialog({
  dir,
  locale,
  t,
  publicSiteLabel,
  whatsappBtnLabel,
  detailsProperty,
  onClose,
  onOpenEdit,
  onOpenDocs,
  unitCur,
  waMessage,
  reportWaMessage,
  uploadedDocs,
  verificationMap,
  onVerifySellerContact,
  pending,
  renderBadges,
}: {
  dir: "rtl" | "ltr"
  locale: LocaleCode
  t: Record<string, any>
  publicSiteLabel: string
  whatsappBtnLabel: string
  detailsProperty: SellRequest | null
  onClose: () => void
  onOpenEdit?: (property: SellRequest) => void
  onOpenDocs?: (property: SellRequest) => void
  unitCur: string
  waMessage: string
  reportWaMessage?: string
  uploadedDocs: Array<{
    key: string
    label: string
    url: string
    name: string
    uploadedAt: string
  }>
  verificationMap?: Record<string, UserVerificationBadgeInfo>
  onVerifySellerContact?: (userId: string) => void
  pending: boolean
  renderBadges: (prop: SellRequest) => React.ReactNode
}) {
  const router = useRouter()
  const mL = (t.modals as Record<string, string>) || {}

  const [adminNoteText, setAdminNoteText] = useState("")
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false)
  const [savingNote, startSavingNote] = useTransition()

  useEffect(() => {
    setAdminNoteText(detailsProperty?.admin_note || "")
    setNoteSavedFeedback(false)
  }, [detailsProperty?.id, detailsProperty?.admin_note])

  const phoneOk = detailsProperty
    ? isSellerPhoneVerified(detailsProperty, verificationMap)
    : false
  const emailOk = detailsProperty
    ? isSellerEmailVerified(detailsProperty, verificationMap)
    : false
  const waDocsOk = detailsProperty
    ? isUnitWhatsAppDocsVerified(detailsProperty)
    : false

  const propActions = (t.actions as Record<string, string>) || {}
  const propBadges = (t.badges as Record<string, string>) || {}

  const meta = detailsProperty?.documents?.__unit_meta || {}
  const exactStreet = detailsProperty?.exact_street || meta.exact_street || ""
  const houseNumber = detailsProperty?.house_number || meta.house_number || ""
  const cadastralCode =
    detailsProperty?.cadastral_code || meta.cadastral_code || ""
  const videoUrl = detailsProperty?.video_url || meta.video_url || ""
  const tour3dUrl = detailsProperty?.tour_3d_url || meta.tour_3d_url || ""
  const allowOnlineViewing = Boolean(
    detailsProperty?.allow_online_viewing ?? meta.allow_online_viewing ?? false
  )

  const messengers: string[] = detailsProperty
    ? Array.isArray(detailsProperty.contact_messengers) &&
      detailsProperty.contact_messengers.length > 0
      ? detailsProperty.contact_messengers
      : Array.isArray(meta.contact_messengers)
        ? meta.contact_messengers
        : ["whatsapp"]
    : []

  const unitImages = Array.isArray(detailsProperty?.images)
    ? detailsProperty.images.filter(Boolean)
    : []

  const handleSaveNote = (textToSave: string) => {
    if (!detailsProperty) return
    setNoteSavedFeedback(false)
    startSavingNote(async () => {
      const res = await savePropertyAdminNoteAction({
        propertyId: detailsProperty.id,
        adminNote: textToSave,
      })
      if (res.success) {
        setAdminNoteText(textToSave)
        setNoteSavedFeedback(true)
        router.refresh()
      }
    })
  }

  return (
    <Dialog
      open={Boolean(detailsProperty)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        dir={dir}
        className="max-h-[90vh] w-[94vw] max-w-[520px] overflow-y-auto rounded-2xl p-5 text-start sm:max-w-xl"
      >
        {detailsProperty && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-sm font-extrabold sm:text-base">
                <span className="rounded-md bg-[#0f1d40] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                  {deriveShortUnitCode(detailsProperty.id, detailsProperty.code)}
                </span>
                <span>
                  {getPropertyHeadline(
                    detailsProperty,
                    mL.detailsFallbackTitle
                  )}{" "}
                  — {detailsProperty.name}
                </span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                {propActions.detailsBtn}
              </DialogDescription>
            </DialogHeader>

            {renderBadges(detailsProperty)}

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Link
                href={`/opportunities/${detailsProperty.id}`}
                target="_blank"
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-[#105C50] hover:bg-emerald-100"
              >
                <ExternalLink className="size-3.5" />
                <span>{publicSiteLabel}</span>
              </Link>

              {onOpenEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailsProperty
                    onClose()
                    onOpenEdit(target)
                  }}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#0f1d40] hover:bg-slate-50"
                >
                  <Edit3 className="size-3.5 text-[#007a5a]" />
                  <span>{propActions.editDataBtn}</span>
                </button>
              )}

              <a
                data-admin-client-wa="true"
                href={`https://wa.me/${String(detailsProperty.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white hover:opacity-90"
              >
                <MessageCircle className="size-3.5" />
                <span>{whatsappBtnLabel}</span>
              </a>

              {reportWaMessage && (
                <a
                  href={`https://wa.me/${String(detailsProperty.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(reportWaMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-3 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <BarChart3 className="size-3.5" />
                  <span>{mL.sendPerformanceReportBtn}</span>
                </a>
              )}

              {detailsProperty.user_id &&
                (!phoneOk || !emailOk) &&
                onVerifySellerContact && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      onVerifySellerContact(String(detailsProperty.user_id))
                    }
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#0a1122] px-3 text-xs font-bold text-white hover:bg-[#16223f] disabled:opacity-50"
                  >
                    <ShieldCheck className="size-3.5 text-emerald-400" />
                    <span>{propActions.verifySellerBtn}</span>
                  </button>
                )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {waDocsOk && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#007a5a] px-2.5 py-1 text-[10.5px] font-extrabold text-white">
                  <FileCheck2 className="size-3" />
                  <span>{mL.waDocsVerifiedBadge}</span>
                </span>
              )}
              {phoneOk && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50]">
                  <CheckCircle2 className="size-3" />
                  <span>{propBadges.phoneVerifiedBadge}</span>
                </span>
              )}
              {emailOk && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50]">
                  <CheckCircle2 className="size-3" />
                  <span>{propBadges.emailVerifiedBadge}</span>
                </span>
              )}
              {allowOnlineViewing && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#2563eb]">
                  <Video className="size-3" />
                  <span>{mL.onlineViewingBadge}</span>
                </span>
              )}
              {messengers.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700"
                >
                  💬 {m}
                </span>
              ))}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.areaLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {cleanPropertyAreaDisplay(detailsProperty.area, locale)}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.streetAddressLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {exactStreet
                    ? `${exactStreet}${houseNumber ? ` ${houseNumber}` : ""}`
                    : "—"}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.developerLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {detailsProperty.developer_name || "—"}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.cadastralLabel}
                </span>
                <strong dir="ltr" className="font-mono text-[#0a1122]">
                  {cadastralCode || "—"}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.sizeAndRoomsLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {detailsProperty.size || "—"} {t.table.sqmUnit} ·{" "}
                  {detailsProperty.rooms || "—"} (
                  {detailsProperty.bedrooms || "—"} 🛏)
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.floorAndConditionLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {detailsProperty.floor_number ?? "—"}
                  {detailsProperty.total_floors
                    ? `/${detailsProperty.total_floors}`
                    : ""}{" "}
                  · {detailsProperty.finishing || "—"}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {mL.contractPriceLabel}
                </span>
                <strong className="text-[#0a1122]">
                  <span dir="ltr">
                    {Number(
                      detailsProperty.contract_price || 0
                    ).toLocaleString("en-US")}
                  </span>{" "}
                  {unitCur}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.table.colCash}
                </span>
                <strong className="text-[#105C50]">
                  <span dir="ltr">
                    {Number(detailsProperty.paid_amount || 0).toLocaleString(
                      "en-US"
                    )}
                  </span>{" "}
                  {unitCur}
                </strong>
              </div>

              <div className="col-span-2 border-t border-gray-200/70 pt-2">
                <span className="block text-[10px] text-gray-400">
                  {mL.installmentAndRemainingLabel}
                </span>
                <strong className="text-[#0a1122]">
                  <span dir="ltr">
                    {Number(
                      detailsProperty.installment_amount || 0
                    ).toLocaleString("en-US")}{" "}
                    {unitCur}
                  </span>{" "}
                  ({detailsProperty.installment_frequency || "—"}) ·{" "}
                  {detailsProperty.years_left || 0}m ·{" "}
                  {detailsProperty.delivery_status || "—"}
                </strong>
              </div>
            </div>

            {(videoUrl || tour3dUrl) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-extrabold text-white hover:bg-red-700"
                  >
                    <Play className="size-3 fill-current" />
                    <span>{mL.videoLinkBtn}</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
                {tour3dUrl && (
                  <a
                    href={tour3dUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-[#2563eb] hover:bg-blue-100"
                  >
                    <Box className="size-3.5" />
                    <span>{mL.tour3dLinkBtn}</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            )}

            {unitImages.length > 0 && (
              <div className="mt-2.5 rounded-xl border border-gray-200 p-3 text-start text-xs">
                <p className="mb-2 font-extrabold text-[#0a1122]">
                  {mL.unitPhotosLabel} ({unitImages.length}):
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {unitImages.slice(0, 8).map((imgUrl, idx) => (
                    <a
                      key={`${imgUrl}-${idx}`}
                      href={imgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="size-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2.5 rounded-xl border border-gray-200 p-3 text-start text-xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-extrabold text-[#0a1122]">
                  {mL.uploadedDocsTitle} ({uploadedDocs.length}/4):
                </p>
                {onOpenDocs && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailsProperty
                      onClose()
                      onOpenDocs(target)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#eaf8f2] px-2.5 py-1 text-[11px] font-extrabold text-[#007a5a] hover:bg-[#007a5a] hover:text-white"
                  >
                    <UploadCloud className="size-3.5" />
                    <span>{mL.manageDocsWaBtn}</span>
                  </button>
                )}
              </div>
              {uploadedDocs.length === 0 ? (
                <p className="text-[11px] text-gray-400">
                  {waDocsOk ? mL.waDocsVerifiedEmptyText : mL.noDocsUploaded}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.key}
                      className="flex items-center justify-between rounded-lg bg-emerald-50/70 px-3 py-1.5"
                    >
                      <span className="font-bold text-[#0a1122]">
                        {doc.label}
                      </span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-[#105C50] px-2.5 py-1 text-[10px] font-bold text-white"
                      >
                        <span>{propActions.openDocBtn}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border-2 border-amber-300/80 bg-[#fffbeb] p-3.5 text-start text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                <MessageSquarePlus className="size-4 text-amber-600" />
                <span>{mL.sellerNoteBoxTitle}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                {mL.sellerNoteBoxSub}
              </p>

              <Textarea
                value={adminNoteText}
                onChange={(e) => {
                  setAdminNoteText(e.target.value)
                  setNoteSavedFeedback(false)
                }}
                placeholder={mL.sellerNotePlaceholder}
                className="mt-2.5 min-h-[70px] rounded-xl border-amber-300 bg-white text-xs text-[#0a1122]"
              />

              {noteSavedFeedback && (
                <p className="mt-2 flex items-center gap-1 text-[11px] font-extrabold text-[#105C50]">
                  <CheckCircle2 className="size-3.5" />
                  <span>{mL.noteSavedSuccess}</span>
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingNote}
                  onClick={() => handleSaveNote(adminNoteText)}
                  className="h-8 rounded-lg bg-[#0a1122] px-3.5 text-[11px] font-extrabold text-white hover:bg-[#16223f]"
                >
                  {savingNote ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span>{mL.saveAndNotifySellerBtn}</span>
                  )}
                </Button>

                {adminNoteText.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={savingNote}
                    onClick={() => handleSaveNote("")}
                    className="h-8 rounded-lg border-red-200 bg-white px-3 text-[11px] font-bold text-red-600 hover:bg-red-50"
                  >
                    {mL.clearNoteBtn}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}