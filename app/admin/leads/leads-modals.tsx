"use client"

import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Flame,
  Handshake,
  Loader2,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
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
import {
  isBuyerEmailVerified,
  isBuyerPhoneVerified,
  type BuyerLead,
  type ConfirmLeadAction,
  type parseLeadDetails,
  type UserVerificationBadgeInfo,
} from "./leads-helpers"

export function LeadConfirmDialog({
  dir,
  t,
  confirmAction,
  pending,
  getLeadStatusLabel,
  onClose,
  onExecute,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  confirmAction: ConfirmLeadAction | null
  pending: boolean
  getLeadStatusLabel: (st: string | null | undefined) => string
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
        className="w-[90vw] max-w-[360px] rounded-2xl p-5 text-start sm:max-w-[400px]"
      >
        {confirmAction && (
          <>
            <DialogHeader className="text-start">
              <div className="mb-2 flex items-center gap-2.5">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    confirmAction.type === "delete"
                      ? "bg-red-100 text-red-600"
                      : "bg-emerald-100 text-[#105C50]"
                  }`}
                >
                  {confirmAction.type === "delete" ? (
                    <Trash2 className="size-4" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </span>
                <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  {confirmAction.type === "delete"
                    ? t.confirmDeleteTitle
                    : t.confirmStatusTitle}
                </DialogTitle>
              </div>

              <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                <strong className="text-[#0a1122]">
                  &ldquo;{confirmAction.lead.name}&rdquo;
                </strong>
                {confirmAction.type === "status" && (
                  <>
                    {" "}
                    →{" "}
                    <span className="font-bold text-[#105C50]">
                      ({getLeadStatusLabel(confirmAction.newStatus)})
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onClose}
                className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
              >
                {t.cancelBtn}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={onExecute}
                className={`h-9 flex-1 rounded-xl text-xs font-bold text-white sm:flex-none ${
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#105C50] hover:bg-[#0c483f]"
                }`}
              >
                {pending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t.savingBtn}
                  </span>
                ) : (
                  t.confirmBtn
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function LeadDetailsDialog({
  dir,
  t,
  propAdminDict,
  publicSiteLabel,
  propertiesNavLabel,
  openInDealsRoomLabel,
  detailsLead,
  parsed,
  leadCur,
  waText,
  verificationMap,
  onVerifyBuyerContact,
  pending,
  onClose,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  propAdminDict: Record<string, any>
  publicSiteLabel: string
  propertiesNavLabel: string
  openInDealsRoomLabel: string
  detailsLead: BuyerLead | null
  parsed: ReturnType<typeof parseLeadDetails> | null
  leadCur: string
  waText: string
  verificationMap?: Record<string, UserVerificationBadgeInfo>
  onVerifyBuyerContact?: (userId: string) => void
  pending: boolean
  onClose: () => void
}) {
  const phoneOk = detailsLead
    ? isBuyerPhoneVerified(detailsLead, verificationMap)
    : false
  const emailOk = detailsLead
    ? isBuyerEmailVerified(detailsLead, verificationMap)
    : false

  const typesText =
    detailsLead && Array.isArray(detailsLead.unit_types)
      ? detailsLead.unit_types.join("، ")
      : "—"

  return (
    <Dialog open={Boolean(detailsLead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        dir={dir}
        className="max-h-[88vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-2xl p-5 text-start sm:max-w-lg"
      >
        {detailsLead && parsed && (
          <>
            <DialogHeader className="text-start">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  {detailsLead.name}
                </DialogTitle>
                {parsed.isUnitLead && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-800">
                    <Flame className="size-3 fill-orange-500 text-orange-600" />
                    {t.unitBadge} {parsed.unitCode || ""}
                  </span>
                )}
              </div>
              <DialogDescription className="text-start text-xs text-gray-500">
                <span dir="ltr">{detailsLead.phone}</span>
                {detailsLead.email ? ` · ${detailsLead.email}` : ""}
              </DialogDescription>
            </DialogHeader>

            {(phoneOk || emailOk) && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {phoneOk && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50]">
                    <CheckCircle2 className="size-3" />
                    <span>{propAdminDict.badges?.phoneVerifiedBadge}</span>
                  </span>
                )}
                {emailOk && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10.5px] font-extrabold text-[#105C50]">
                    <CheckCircle2 className="size-3" />
                    <span>{propAdminDict.badges?.emailVerifiedBadge}</span>
                  </span>
                )}
              </div>
            )}

            {detailsLead.user_id &&
              (!phoneOk || !emailOk) &&
              onVerifyBuyerContact && (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      onVerifyBuyerContact(String(detailsLead.user_id))
                    }
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0a1122] px-3 text-xs font-bold text-white hover:bg-[#16223f] disabled:opacity-50"
                  >
                    <ShieldCheck className="size-3.5 text-emerald-400" />
                    <span>
                      {t.verifyBuyerBtn || propAdminDict.actions?.verifySellerBtn}
                    </span>
                  </button>
                </div>
              )}

            <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 text-xs">
              <p className="font-extrabold text-orange-950">
                📍 {parsed.cleanTargetUnit}
              </p>
              {parsed.matchedUnit && (
                <p className="mt-1 text-[11px] font-semibold text-orange-800">
                  {propAdminDict.table?.colClient}: {parsed.matchedUnit.name} (
                  <span dir="ltr">{parsed.matchedUnit.phone}</span>)
                </p>
              )}
              {parsed.isUnitLead && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={
                      parsed.matchedUnit
                        ? `/opportunities/${parsed.matchedUnit.id}`
                        : `/opportunities?q=${encodeURIComponent(parsed.unitCode || parsed.cleanTargetUnit)}`
                    }
                    target="_blank"
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#105C50] px-3 text-xs font-bold text-white hover:bg-[#0c483f]"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>
                      {publicSiteLabel} ({t.unitBtn})
                    </span>
                  </Link>

                  {parsed.latestDirectOffer && (
                    <Link
                      href={`/admin/deals?offerId=${parsed.latestDirectOffer.id}`}
                      onClick={onClose}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0a1122] px-3 text-xs font-bold text-white hover:bg-[#16223f]"
                    >
                      <Handshake className="size-3.5 text-emerald-400" />
                      <span>{openInDealsRoomLabel}</span>
                    </Link>
                  )}

                  {parsed.matchedUnit && (
                    <Link
                      href={`/admin/properties?unitId=${parsed.matchedUnit.id}`}
                      onClick={onClose}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
                    >
                      <Building2 className="size-3.5 text-[#105C50]" />
                      <span>{propertiesNavLabel}</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-xl bg-gray-50 p-3 text-xs">
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.cashLabel}
                </span>
                <strong className="text-[#105C50]">
                  <span dir="ltr">
                    {Number(
                      detailsLead.available_cash || detailsLead.budget || 0
                    ).toLocaleString("en-US")}
                  </span>{" "}
                  {leadCur}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.installmentLabel}
                </span>
                <strong className="text-[#0a1122]">
                  <span dir="ltr">
                    {Number(detailsLead.max_installment || 0).toLocaleString(
                      "en-US"
                    )}
                  </span>{" "}
                  {leadCur}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.typeDetailsLabel}
                </span>
                <strong className="text-[#0a1122]">
                  {typesText}{" "}
                  {detailsLead.min_rooms ? `(+${detailsLead.min_rooms})` : ""}
                </strong>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.dateLabel}
                </span>
                <strong dir="ltr" className="text-[#0a1122]">
                  {new Date(detailsLead.created_at).toLocaleDateString("en-GB")}
                </strong>
              </div>
            </div>

            {parsed.readinessBadge && (
              <div className="mt-2">
                <span
                  className={`inline-block rounded-lg px-3 py-1 text-xs font-bold ${parsed.readinessBadge.className}`}
                >
                  {parsed.readinessBadge.text}
                </span>
              </div>
            )}

            {parsed.customerNotes && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong className="block font-extrabold">
                  {t.customerNotesLabel}
                </strong>
                <p className="mt-1">{parsed.customerNotes}</p>
              </div>
            )}

            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-9 rounded-xl text-xs font-bold"
              >
                {propAdminDict.actions?.closeBtn || t.cancelBtn}
              </Button>
              <a
                data-admin-client-wa="true"
                href={`https://wa.me/${String(detailsLead.phone).replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white hover:opacity-90"
              >
                <MessageCircle className="size-4" />
                <span>{t.whatsappBtn}</span>
              </a>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
