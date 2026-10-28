"use client"

import Link from "next/link"
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react"
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
import { getLocalizedGeorgiaAreaName } from "@/components/shared/georgia-areas"
import type { LocaleCode } from "@/lib/i18n"
import type {
  ConfirmPropertyAction,
  SellRequest,
  UserVerificationBadgeInfo,
} from "./properties-helpers"
import {
  isSellerEmailVerified,
  isSellerPhoneVerified,
} from "./properties-helpers"

export function PropertyConfirmDialog({
  dir,
  t,
  confirmAction,
  setConfirmAction,
  reason,
  setReason,
  pending,
  getStatusLabel,
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
  onClose: () => void
  onExecute: () => void
}) {
  return (
    <Dialog
      open={Boolean(confirmAction)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        dir={dir}
        className="w-[90vw] max-w-[360px] rounded-2xl p-5 text-start sm:max-w-[390px]"
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
                      confirmAction.newStatus === "rejected")
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
                  {confirmAction.type === "purge_all_deleted" &&
                    t.modals.purgeTitle}
                  {confirmAction.type === "delete" && t.modals.deleteTitle}
                  {confirmAction.type === "promote" &&
                    (confirmAction.promoAction === "activate"
                      ? t.modals.activatePromoTitle
                      : t.modals.cancelPromoTitle)}
                  {confirmAction.type === "status" &&
                    (confirmAction.newStatus === "active"
                      ? t.modals.publishConfirmTitle
                      : confirmAction.newStatus === "pending"
                        ? t.modals.unpublishConfirmTitle
                        : t.modals.stageConfirmTitle)}
                </DialogTitle>
              </div>

              <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                {confirmAction.type === "purge_all_deleted" && (
                  <>
                    {t.modals.purgeDescPrefix} ({confirmAction.count}){" "}
                    {t.modals.purgeDescSuffix}
                  </>
                )}

                {confirmAction.type === "status" && (
                  <>
                    {t.modals.updateUnitPrefix}{" "}
                    <strong className="text-[#0a1122]">
                      &ldquo;
                      {confirmAction.property.project_name ||
                        confirmAction.property.name}
                      &rdquo;
                    </strong>{" "}
                    {t.modals.toWord}{" "}
                    <span className="font-bold text-[#105C50]">
                      ({getStatusLabel(confirmAction.newStatus)})
                    </span>
                    ؟
                  </>
                )}

                {confirmAction.type === "delete" && (
                  <>
                    {t.modals.deleteDescPrefix}{" "}
                    <strong className="text-red-600">
                      &ldquo;
                      {confirmAction.property.project_name ||
                        confirmAction.property.name}
                      &rdquo;
                    </strong>{" "}
                    {t.modals.deleteDescSuffix}
                  </>
                )}

                {confirmAction.type === "promote" &&
                  (confirmAction.promoAction === "activate" ? (
                    <>
                      {t.modals.selectPromoDuration}{" "}
                      <strong className="text-[#0a1122]">
                        &ldquo;
                        {confirmAction.property.project_name ||
                          confirmAction.property.name}
                        &rdquo;
                      </strong>
                      :
                    </>
                  ) : (
                    <>
                      {t.modals.confirmCancelPromo}{" "}
                      <strong className="text-[#0a1122]">
                        &ldquo;
                        {confirmAction.property.project_name ||
                          confirmAction.property.name}
                        &rdquo;
                      </strong>
                      ؟
                    </>
                  ))}
              </DialogDescription>
            </DialogHeader>

            {confirmAction.type === "promote" &&
              confirmAction.promoAction === "activate" && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((d) => (
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
              )}

            {confirmAction.type === "status" &&
              confirmAction.newStatus === "rejected" && (
                <div className="mt-2">
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t.modals.rejectReasonPlaceholder}
                    className="min-h-[65px] rounded-xl text-xs"
                  />
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
                disabled={pending}
                onClick={onExecute}
                className={`h-9 flex-1 rounded-xl text-xs font-bold text-white sm:flex-none ${
                  confirmAction.type === "delete" ||
                  confirmAction.type === "purge_all_deleted" ||
                  (confirmAction.type === "status" &&
                    confirmAction.newStatus === "rejected")
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#105C50] hover:bg-[#0c483f]"
                }`}
              >
                {pending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t.actions.executingBtn}
                  </span>
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

export function PropertyDetailsDialog({
  dir,
  locale,
  t,
  publicSiteLabel,
  whatsappBtnLabel,
  detailsProperty,
  onClose,
  unitCur,
  waMessage,
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
  unitCur: string
  waMessage: string
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
  const phoneOk = detailsProperty
    ? isSellerPhoneVerified(detailsProperty, verificationMap)
    : false
  const emailOk = detailsProperty
    ? isSellerEmailVerified(detailsProperty, verificationMap)
    : false

  return (
    <Dialog
      open={Boolean(detailsProperty)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-2xl p-5 text-start sm:max-w-lg"
      >
        {detailsProperty && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="text-sm font-extrabold sm:text-base">
                {detailsProperty.project_name || t.modals.detailsFallbackTitle}{" "}
                — {detailsProperty.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t.actions.detailsBtn}
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
                    <span>{t.actions.verifySellerBtn}</span>
                  </button>
                )}
            </div>

            {(phoneOk || emailOk) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {phoneOk && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50]">
                    <CheckCircle2 className="size-3" />
                    <span>{t.badges.phoneVerifiedBadge}</span>
                  </span>
                )}
                {emailOk && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50]">
                    <CheckCircle2 className="size-3" />
                    <span>{t.badges.emailVerifiedBadge}</span>
                  </span>
                )}
              </div>
            )}

            <div className="mt-2.5 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.modals.areaLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {getLocalizedGeorgiaAreaName(detailsProperty.area, locale)}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.modals.developerLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {detailsProperty.developer_name || "—"}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.modals.contractPriceLabel}
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
            </div>

            <div className="mt-2.5 rounded-xl border border-gray-200 p-3 text-start text-xs">
              <p className="mb-2 font-extrabold text-[#0a1122]">
                {t.modals.uploadedDocsTitle} ({uploadedDocs.length}/4):
              </p>
              {uploadedDocs.length === 0 ? (
                <p className="text-[11px] text-gray-400">
                  {t.modals.noDocsUploaded}
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
                        <span>{t.actions.openDocBtn}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
