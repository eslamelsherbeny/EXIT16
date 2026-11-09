'use client'

import {
  AlertCircle,
  BookmarkCheck,
  Check,
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { maskEmailDisplay, type SellerExtraLabels } from './seller-i18n'
import { toEnglishDigits } from './seller-shared'
import type {
  FLOW_LOADING_LABELS,
  MissingCoreFieldItem,
} from './seller-flow-helpers'

export function SellerFinalReadinessCard({
  loadT,
  fT,
  liveMissingCoreItems,
  fieldErrors,
  pending,
  savingDraftLoading,
  onPublishListing,
  onSaveDraft,
}: {
  loadT: (typeof FLOW_LOADING_LABELS)['ar']
  fT: any
  liveMissingCoreItems: MissingCoreFieldItem[]
  fieldErrors: Record<string, string>
  pending: boolean
  savingDraftLoading: boolean
  onPublishListing: () => void
  onSaveDraft: () => void
}) {
  return (
    <section className="rounded-[26px] border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-start">
        <h3 className="text-lg font-black text-[#0a1122] sm:text-xl">
          {loadT.finalCardTitle}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed font-semibold text-slate-500">
          {loadT.finalCardSub}
        </p>
      </div>

      {Object.keys(fieldErrors).length > 0 &&
        liveMissingCoreItems.length > 0 && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border-2 border-red-300 bg-red-50/90 p-4 text-start animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2 text-sm font-black text-red-900">
              <AlertCircle className="size-5 shrink-0 text-red-600" />
              <span>{loadT.missingFieldsAlertTitle}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {liveMissingCoreItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    document.getElementById(item.scrollId)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-extrabold text-red-700 shadow-2xs transition hover:border-red-500 hover:bg-red-600 hover:text-white sm:text-sm"
                >
                  <span>• {item.label}</span>
                  <span className="text-xs">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

      <div className="mt-6 flex flex-col gap-3.5 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={pending || savingDraftLoading}
          onClick={onPublishListing}
          className="inline-flex min-h-[56px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#007a5a] to-[#00966e] px-6 py-4 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60 sm:text-base"
        >
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>{fT.bottomBar.publishingBtn}</span>
            </>
          ) : (
            <>
              <Send className="size-5 shrink-0" />
              <span>{loadT.publishBtnText}</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={pending || savingDraftLoading}
          onClick={onSaveDraft}
          className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-extrabold text-[#0a1122] transition hover:border-[#0a1122] hover:bg-white disabled:opacity-60"
        >
          {savingDraftLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-[#007a5a]" />
              <span>{loadT.savingLaterBtnText}</span>
            </>
          ) : (
            <>
              <BookmarkCheck className="size-5 shrink-0 text-[#007a5a]" />
              <span>{loadT.saveLaterBtnText}</span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}

export function SellerMissingMediaConfirmModal({
  open,
  dir,
  loadT,
  hasPhotos,
  hasAllDocs,
  uploadedDocsCount,
  pending,
  onClose,
  onConfirmSubmitAnyway,
  onGoToUploadNow,
}: {
  open: boolean
  dir: string
  loadT: (typeof FLOW_LOADING_LABELS)['ar']
  hasPhotos: boolean
  hasAllDocs: boolean
  uploadedDocsCount: number
  pending: boolean
  onClose: () => void
  onConfirmSubmitAnyway: () => void
  onGoToUploadNow: () => void
}) {
  if (!open) return null

  const isAr = dir === 'rtl'

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-[#ea580c]">
            <Sparkles className="size-5" />
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-extrabold text-amber-800">
            {loadT.mediaDialogBadge}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-black text-[#0a1122] sm:text-xl">
          {loadT.mediaDialogTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed font-semibold text-slate-600">
          {loadT.mediaDialogDesc}
        </p>

        {/* جملة واحدة واضحة ومباشرة بحجم مقروء */}
        <p className="mt-2.5 text-sm leading-relaxed font-extrabold text-[#007a5a]">
          {isAr
            ? 'ملاحظة: الصور والمستندات شرط أساسي لنشر الوحدة وظهورها للمشترين.'
            : 'Note: Photos and documents are mandatory for publishing the unit to buyers.'}
        </p>

        <div className="mt-4 space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm font-extrabold text-amber-950">
          {!hasPhotos && (
            <div className="flex items-center gap-2.5">
              <ImagePlus className="size-4 shrink-0 text-[#ea580c]" />
              <span>{loadT.mediaDialogMissingPhotos}</span>
            </div>
          )}
          {!hasAllDocs && (
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 shrink-0 text-[#2563eb]" />
              <span>
                {loadT.mediaDialogMissingDocs} ({uploadedDocsCount}/4)
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            disabled={pending}
            onClick={onConfirmSubmitAnyway}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#007a5a] px-5 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-[#006248] disabled:opacity-60 sm:text-base"
          >
            {pending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-4 shrink-0" />
            )}
            <span>{loadT.mediaDialogConfirmBtn}</span>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={onGoToUploadNow}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
          >
            {loadT.mediaDialogUploadNowBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SellerVerifyEmailModal({
  open,
  dir,
  activeModalEmail,
  loadT,
  extraT,
  saveLaterLabel,
  otpSent,
  otpCode,
  setOtpCode,
  otpLoading,
  otpError,
  onClose,
  onSendOtp,
  onVerifyOtp,
  onSaveAndContinueLater,
}: {
  open: boolean
  dir: string
  activeModalEmail: string
  loadT: (typeof FLOW_LOADING_LABELS)['ar']
  extraT: SellerExtraLabels
  saveLaterLabel: string
  otpSent: boolean
  otpCode: string
  setOtpCode: (v: string) => void
  otpLoading: boolean
  otpError: string
  onClose: () => void
  onSendOtp: () => void
  onVerifyOtp: () => void
  onSaveAndContinueLater: () => void
}) {
  if (!open) return null

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#007a5a]">
            <ShieldAlert className="size-6" />
          </div>
          <span className="rounded-full bg-blue-50 px-3.5 py-1 text-xs font-extrabold text-[#2563eb]">
            {loadT.oneTimeVerifyBadge}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-black text-[#0a1122] sm:text-xl">
          {extraT.verifyBoxTitle}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {extraT.verifyBoxDescPrefix}{' '}
          <strong dir="ltr" className="font-mono text-[#0a1122]">
            {maskEmailDisplay(activeModalEmail)}
          </strong>{' '}
          {extraT.verifyBoxDescSuffix}
        </p>

        <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-sm font-bold text-[#007a5a]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{extraT.savedBadge}</span>
          </div>
          <p className="mt-1 leading-relaxed font-medium text-slate-600">
            {loadT.oneTimeVerifyNote}
          </p>
        </div>

        <div className="mt-5">
          {!otpSent ? (
            <button
              type="button"
              disabled={otpLoading}
              onClick={onSendOtp}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-60"
            >
              {otpLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              <span>{extraT.sendCodeBtn}</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">
                <strong className="block font-bold text-[#0a1122]">
                  {extraT.codeSentToPrefix}
                </strong>
                <span className="mt-0.5 block">{extraT.codeSentBody}</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    )
                  }
                  placeholder="• • • • • •"
                  className="h-12 flex-1 rounded-xl border-slate-300 bg-white text-center font-mono text-lg font-black tracking-[0.35em]"
                />
                <button
                  type="button"
                  disabled={otpLoading || otpCode.length < 6}
                  onClick={onVerifyOtp}
                  className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-50"
                >
                  {otpLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  <span>{extraT.confirmCodeBtn}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={onSendOtp}
                  className="text-xs font-bold text-[#2563eb] hover:underline"
                >
                  {extraT.resendCodeBtn}
                </button>
              </div>
            </div>
          )}

          {otpError && (
            <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
              {otpError}
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={otpLoading}
            onClick={onSaveAndContinueLater}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100"
          >
            {saveLaterLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SellerDocPreviewModal({
  previewDoc,
  onClose,
}: {
  previewDoc: { url: string; title: string } | null
  onClose: () => void
}) {
  if (!previewDoc) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="text-xs font-bold text-[#0a1122]">
            {previewDoc.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex max-h-[80vh] items-center justify-center overflow-auto bg-slate-950/5 p-2">
          <img
            src={previewDoc.url}
            alt={previewDoc.title}
            className="max-h-[76vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  )
}