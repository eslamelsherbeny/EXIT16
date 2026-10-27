'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Star,
} from 'lucide-react'
import {
  markUserPhoneVerifiedAction,
  sendInlineEmailOtpAction,
  verifyInlineEmailOtpAction,
} from '@/actions/auth-actions'
import { requestUnitPromotionAction } from '@/actions/account-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import {
  ACTIVE_PLATFORM_COUNTRY,
  maskEmailDisplay,
  type SellerExtraLabels,
} from './seller-i18n'
import { getCountryConfig, toEnglishDigits } from './seller-shared'

export function ReviewStep({
  form,
  selected,
  pending,
  submitted,
  error,
  submit,
  go,
  onSave,
  imagesLength,
  orderRef,
  unitId,
  userId,
  userEmail,
  emailVerified,
  setEmailVerified,
  supportWhatsApp,
  extraT,
}: {
  form: Record<string, string>
  selected: Record<string, string[]>
  pending: boolean
  submitted: boolean
  error: string
  submit: () => void
  go: (step: number) => void
  onSave: () => void
  imagesLength: number
  orderRef: string
  unitId: string
  userId: string
  userEmail: string
  emailVerified: boolean
  setEmailVerified: (val: boolean) => void
  supportWhatsApp: string
  extraT: SellerExtraLabels
}) {
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const t = s.reviewStep as Record<string, any>
  const listSep = dir === 'rtl' ? '، ' : ', '

  const [selectedPromo, setSelectedPromo] = useState<7 | 14 | 30 | null>(null)
  const [fawryCode, setFawryCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [promoPending, startPromoTransition] = useTransition()

  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  const maskedEmail = maskEmailDisplay(userEmail)
  const countryObj = getCountryConfig(ACTIVE_PLATFORM_COUNTRY)
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)
  const pkgPrices = countryObj.defaultPackages || {
    days7: 29,
    days14: 49,
    days30: 69,
  }

  const dynamicPackages: Array<{
    days: 7 | 14 | 30
    price: number
    label: string
  }> = [
    { days: 7, price: pkgPrices.days7, label: `7 ${t.daysWord}` },
    { days: 14, price: pkgPrices.days14, label: `14 ${t.daysWord}` },
    { days: 30, price: pkgPrices.days30, label: `30 ${t.daysWord}` },
  ]

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'

  const projectName = form.projectDetails || form.project || 'وحدة'
  const paidNum = Number(
    toEnglishDigits(form.paidAmount2 || form.paidAmount || '0')
  )
  const contractNum = Number(
    toEnglishDigits(form.contractPrice2 || form.contractPrice || '0')
  )
  const areaName = getLocalizedGeorgiaAreaName(form.location, locale)

  const waVerifyLink = `${siteOrigin}/admin/properties?verifyPhoneUserId=${encodeURIComponent(userId || '')}&unitId=${encodeURIComponent(unitId || '')}`
  const waConfirmMessage =
    locale === 'ar'
      ? `أهلاً إدارة Aqar Exit، أنا مالك الوحدة (${form.name || ''}) أؤكد رقم هاتفي وعرض وحدتي رقم (${orderRef}) في مشروع (${projectName} - ${areaName}) — المدفوع: (${paidNum.toLocaleString('en-US')} ${currency}) — إجمالي العقد: (${contractNum.toLocaleString('en-US')} ${currency}).\nرابط مراجعة وتوثيق الوحدة في الإدارة:\n${waVerifyLink}`
      : `Hello Aqar Exit, I confirm my phone & unit listing (${orderRef}) in (${projectName} - ${areaName}) — Paid: (${paidNum.toLocaleString('en-US')} ${currency}).\nAdmin Verification Link:\n${waVerifyLink}`

  const handleSendOtpCode = async () => {
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await sendInlineEmailOtpAction(userEmail)
      if (res.success) {
        setOtpSent(true)
      } else {
        setOtpError(res.error || 'تعذر إرسال الكود')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtpCode = async () => {
    if (!otpCode.trim()) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await verifyInlineEmailOtpAction(otpCode, userEmail)
      if (res.success) {
        setEmailVerified(true)
      } else {
        setOtpError(res.error || 'الكود غير صحيح')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleWhatsAppSupportClick = () => {
    markUserPhoneVerifiedAction({ userId, unitId }).catch(() => {})
  }

  const handleSelectPackage = (pkg: {
    days: 7 | 14 | 30
    price: number
    label: string
  }) => {
    setSelectedPromo(pkg.days)
    if (!unitId) {
      setFawryCode(`AD-${Math.floor(100000 + Math.random() * 900000)}`)
      return
    }
    startPromoTransition(async () => {
      const res = await requestUnitPromotionAction({
        unitId,
        days: pkg.days,
        price: pkg.price,
      })
      if (res.success && res.fawryCode) {
        setFawryCode(res.fawryCode)
      }
    })
  }

  if (submitted)
    return (
      <div className="flex flex-col items-center py-4 sm:py-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl text-white shadow-xs">
          ✓
        </div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
          {t.successTitle}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500 sm:text-sm">
          {t.successSubtitle}
        </p>

        <span className="mt-3.5 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700">
          {t.orderRefLabel} <strong className="font-mono">{orderRef}</strong>
        </span>

        <div className="mt-5 w-full rounded-2xl border-2 border-[#25D366]/40 bg-[#f0fdf4] p-4 text-center">
          <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
            {locale === 'ar'
              ? 'لتسريع مراجعة وحدتك وتوثيق رقم هاتفك بعلامة التوثيق ✓:'
              : 'To fast-track unit review & verify your phone number ✓:'}
          </p>
          <a
            href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waConfirmMessage)}`}
            target="_blank"
            rel="noreferrer"
            onClick={handleWhatsAppSupportClick}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 sm:w-auto sm:text-sm"
          >
            <MessageCircle className="size-4 shrink-0" />
            <span>{extraT.waVerifyBtn}</span>
          </a>
        </div>

        <div className="mt-6 w-full rounded-[20px] border border-[#aae3cb] bg-[#effaf5] p-5 text-start sm:p-6">
          <div className="flex items-center justify-start gap-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>{t.optionalBadge}</span>
          </div>

          <h3 className="mt-1 text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
            {t.promoTitle}
          </h3>

          <ul className="mt-3 space-y-2 text-xs font-medium text-[#1e3a34]">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.promoPoint1}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>
                {t.promoPoint2Prefix}{' '}
                <Star className="inline size-3 fill-amber-400 text-amber-500" />{' '}
                {t.promoPoint2Suffix}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.promoPoint3}</span>
            </li>
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
            {dynamicPackages.map((pkg) => {
              const isSelected = selectedPromo === pkg.days
              return (
                <button
                  key={pkg.days}
                  type="button"
                  disabled={promoPending}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`flex flex-col items-center justify-center rounded-2xl border bg-white p-3.5 text-center transition hover:shadow-md sm:p-4 ${
                    isSelected
                      ? 'border-[var(--brand-primary,#007a5a)] ring-2 ring-[var(--brand-primary,#007a5a)]/20'
                      : 'border-gray-200/90 hover:border-[var(--brand-primary,#007a5a)]/50'
                  }`}
                >
                  <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                    {pkg.label}
                  </span>
                  <span className="mt-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-sm">
                    <span dir="ltr">{pkg.price.toLocaleString('en-US')}</span>{' '}
                    {currency}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-[#2b584d]">
            {t.promoFreeNote}
          </p>

          {promoPending ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white p-3.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              <Loader2 className="size-4 animate-spin" />
              <span>{t.issuingCode}</span>
            </div>
          ) : fawryCode ? (
            <div className="mt-3 rounded-xl border border-[var(--brand-primary,#007a5a)]/30 bg-white p-4 text-start shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                    {t.adOrderCodeLabel} ({selectedPromo} {t.daysWord}):
                  </p>
                  <p className="mt-1 font-mono text-lg font-black tracking-wider text-[var(--brand-primary,#007a5a)]">
                    {fawryCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(fawryCode)
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-100"
                >
                  <Copy className="size-3.5" />
                  <span>{copiedCode ? t.copiedBtn : t.copyCodeBtn}</span>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                {t.adCodeInstruction}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-white p-3.5 text-[11px] leading-relaxed text-gray-600">
              {t.selectPackageHint}
            </div>
          )}
        </div>

        <Link
          href="/account"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-7 text-xs font-extrabold text-white shadow-sm transition hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
        >
          {t.goToAccountBtn}
        </Link>

        <p className="mt-2.5 text-center text-[11px] text-gray-400">
          {t.editAnytimeNote}
        </p>
      </div>
    )

  const monthsUnitLabel = t.monthsUnit || extraT.monthsUnit
  const baseDel = selected.delivery?.join(listSep) || '—'
  const deliveryFormatted =
    form.deliveryRemainingMonths && Number(form.deliveryRemainingMonths) > 0
      ? `${baseDel} (${form.deliveryRemainingMonths} ${monthsUnitLabel})`
      : baseDel

  const contractDateFormatted =
    form.contractMonth && (form.contractYear || selected.year?.[0])
      ? `${form.contractMonth}/${form.contractYear || selected.year?.[0]}`
      : form.contractYear || selected.year?.[0] || '—'

  const rows = [
    [
      t.rowDevProject,
      `${form.developerDetails || form.developer || '—'} · ${
        form.projectDetails || form.project || '—'
      }`,
    ],
    [t.rowArea, areaName],
    [t.rowType, selected.type?.join(listSep) || '—'],
    [t.rowSize, `${form.areaSize || '—'} ${t.sqmUnit}`],
    [t.rowRoomsBath, `${form.rooms || '—'} / ${form.bathrooms || '—'}`],
    [t.rowFinishing, selected.finishing?.join(listSep) || '—'],
    [t.rowDelivery, deliveryFormatted],
    [extraT.rowFeatures, String(selected.features?.length || 0)],
    [t.rowPhotos, String(imagesLength)],
    [t.rowContractPrice, `${contractNum.toLocaleString('en-US')} ${currency}`],
    [t.rowPaidAmount, `${paidNum.toLocaleString('en-US')} ${currency}`],
    [
      extraT.rowMarketPrice,
      `${Number(
        toEnglishDigits(
          form.marketPrice ||
            form.currentDeveloperPrice ||
            form.contractPrice ||
            '0'
        )
      ).toLocaleString('en-US')} ${currency}`,
    ],
    [
      extraT.rowInstallment,
      `${Number(toEnglishDigits(form.installment || '0')).toLocaleString('en-US')} ${currency}`,
    ],
    [t.rowContractDate || extraT.rowContractDate, contractDateFormatted],
    [
      t.rowRemainingMonths || extraT.rowRemainingMonths,
      form.remainingMonths
        ? `${form.remainingMonths} ${monthsUnitLabel}`
        : '0',
    ],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-4 py-3 text-sm">
            <span className="text-start text-slate-500">{label}</span>
            <strong className="text-end">{value}</strong>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 text-start text-xs leading-relaxed text-slate-500">
        <p>{extraT.reviewNoteBeforeSubmit}</p>
        <p className="font-bold text-slate-600">{extraT.savedBadge}</p>
      </div>

      {/* صندوق تأكيد الإيميل بالكود فقط (تم إزالة زر تأكيد الواتساب المكرر من أسفله) */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-start">
        <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
          {extraT.verifyBoxTitle}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          {extraT.verifyBoxDescPrefix}{' '}
          <strong dir="ltr" className="font-mono text-[#0a1122]">
            {maskedEmail}
          </strong>{' '}
          {extraT.verifyBoxDescSuffix}
        </p>

        <div className="mt-4">
          {emailVerified ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-[#007a5a]">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{extraT.emailVerifiedBadge}</span>
            </div>
          ) : !otpSent ? (
            <button
              type="button"
              disabled={otpLoading}
              onClick={handleSendOtpCode}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a1122] px-6 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#16223f] disabled:opacity-60 sm:text-sm"
            >
              {otpLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              <span>{extraT.sendCodeBtn}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    )
                  }
                  placeholder="# # # # # #"
                  className="h-11 w-40 rounded-xl border-slate-300 bg-white text-center font-mono text-base font-extrabold tracking-[0.25em]"
                />

                <button
                  type="button"
                  disabled={otpLoading || otpCode.length < 4}
                  onClick={handleVerifyOtpCode}
                  className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-extrabold text-white transition sm:text-sm ${
                    otpCode.length >= 6
                      ? 'bg-[#007a5a] hover:bg-[#006248]'
                      : 'bg-slate-400'
                  }`}
                >
                  {otpLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    extraT.confirmCodeBtn
                  )}
                </button>

                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={handleSendOtpCode}
                  className="px-2 text-xs font-bold text-[#0a1122] underline hover:text-[#007a5a]"
                >
                  {extraT.resendCodeBtn}
                </button>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-[#effaf5] p-3.5 text-start text-xs leading-relaxed text-[#0c4a3e]">
                <p className="font-extrabold">
                  {extraT.codeSentToPrefix}{' '}
                  <span dir="ltr" className="font-mono">
                    {maskedEmail}
                  </span>
                </p>
                <p className="mt-1">{extraT.codeSentBody}</p>
                <p className="mt-2">
                  {extraT.codeNotReceivedPrefix}{' '}
                  <a
                    href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waConfirmMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleWhatsAppSupportClick}
                    className="font-mono font-black underline"
                  >
                    {supportWhatsApp}
                  </a>{' '}
                  {extraT.codeNotReceivedSuffix}
                </p>
              </div>
            </div>
          )}

          {otpError && (
            <p className="mt-2 text-xs font-bold text-red-600">{otpError}</p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(6)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          disabled={pending || submitted}
          className="h-12 flex-1 rounded-xl bg-teal-700 font-bold transition active:scale-[0.98]"
          onClick={submit}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>{t.submittingBtn}</span>
            </span>
          ) : (
            t.submitFinalBtn
          )}
        </Button>
      </div>

      <div className="mt-2 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}
