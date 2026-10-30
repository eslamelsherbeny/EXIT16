'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Star,
} from 'lucide-react'
import {
  sendInlineEmailOtpAction,
  verifyInlineEmailOtpAction,
} from '@/actions/auth-actions'
import { requestUnitPromotionAction } from '@/actions/account-actions'
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
  const isAr = locale === 'ar'
  const s = dict.sell
  const tRev = s.reviewStep as Record<string, any>

  const [selectedPromo, setSelectedPromo] = useState<7 | 14 | 30 | null>(null)
  const [fawryCode, setFawryCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [promoPending, startPromoTransition] = useTransition()

  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  const countryObj = getCountryConfig(ACTIVE_PLATFORM_COUNTRY)
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)
  const pkgPrices = countryObj.defaultPackages || {
    days7: 29,
    days14: 49,
    days30: 69,
  }

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'
  const waVerifyLink = `${siteOrigin}/api/verify-contact?u=${encodeURIComponent(userId || '')}&unitId=${encodeURIComponent(unitId || '')}`
  const areaName = getLocalizedGeorgiaAreaName(form.location, locale)
  const waConfirmMessage = isAr
    ? `أهلاً إدارة Aqar Exit، أنا مالك الإعلان (${form.name || ''}) أؤكد رقم هاتفي وإعلاني رقم (${orderRef}) في (${areaName}).\nرابط المراجعة والتوثيق:\n${waVerifyLink}`
    : `Hello Aqar Exit, I confirm my listing (${orderRef}) in (${areaName}).\nVerification Link:\n${waVerifyLink}`

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f5f6f8] px-4 py-10 text-[#0a1122]"
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500 text-3xl text-white shadow-md">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-black text-[#0a1122]">
            {tRev.successTitle}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {tRev.successSubtitle}
          </p>
          <span className="mt-3 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700">
            {tRev.orderRefLabel} <strong className="font-mono">{orderRef}</strong>
          </span>

          {/* توثيق الواتساب السريع */}
          <div className="mt-6 w-full rounded-2xl border-2 border-[#25D366]/40 bg-[#f0fdf4] p-4">
            <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
              {isAr
                ? 'لتسريع نشر إعلانك وتوثيق رقم هاتفك بعلامة التوثيق ✓:'
                : 'To fast-track listing review & verify your phone number ✓:'}
            </p>
            <a
              href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waConfirmMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-xs font-extrabold text-white shadow-sm hover:opacity-95 sm:text-sm"
            >
              <MessageCircle className="size-4" />
              <span>{extraT.waVerifyBtn}</span>
            </a>
          </div>

          {/* توثيق البريد الإلكتروني بالكود */}
          {emailVerified ? (
            <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-extrabold text-[#007a5a]">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{extraT.emailVerifiedBadge}</span>
            </div>
          ) : (
            <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-start">
              <h3 className="text-sm font-black text-[#0a1122]">
                {extraT.verifyBoxTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {extraT.verifyBoxDescPrefix}{' '}
                <strong dir="ltr" className="font-mono">
                  {maskEmailDisplay(userEmail)}
                </strong>
              </p>
              <div className="mt-3">
                {!otpSent ? (
                  <button
                    type="button"
                    disabled={otpLoading}
                    onClick={async () => {
                      setOtpLoading(true)
                      setOtpError('')
                      const res = await sendInlineEmailOtpAction(userEmail)
                      setOtpLoading(false)
                      if (res.success) setOtpSent(true)
                      else setOtpError(res.error || 'Error')
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a1122] px-5 text-xs font-extrabold text-white"
                  >
                    <Mail className="size-3.5" />
                    <span>{extraT.sendCodeBtn}</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(
                          toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                        )
                      }
                      placeholder="# # # # # #"
                      className="h-10 w-36 bg-white text-center font-mono font-bold tracking-widest"
                    />
                    <button
                      type="button"
                      disabled={otpLoading || otpCode.length < 4}
                      onClick={async () => {
                        setOtpLoading(true)
                        const res = await verifyInlineEmailOtpAction(
                          otpCode,
                          userEmail
                        )
                        setOtpLoading(false)
                        if (res.success) setEmailVerified(true)
                        else setOtpError(res.error || 'Invalid OTP')
                      }}
                      className="h-10 rounded-xl bg-[#007a5a] px-4 text-xs font-extrabold text-white"
                    >
                      {extraT.confirmCodeBtn}
                    </button>
                  </div>
                )}
                {otpError && (
                  <p className="mt-1.5 text-xs font-bold text-red-600">
                    {otpError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* باقات التمييز SUPER VIP */}
          <div className="mt-6 w-full rounded-2xl border border-[#aae3cb] bg-[#effaf5] p-5 text-start">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#007a5a]">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <span>SUPER VIP BOOST · {tRev.optionalBadge}</span>
            </div>
            <h3 className="mt-1 text-base font-extrabold text-[#0a1122]">
              {tRev.promoTitle}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {(
                [
                  { days: 7, price: pkgPrices.days7 },
                  { days: 14, price: pkgPrices.days14 },
                  { days: 30, price: pkgPrices.days30 },
                ] as const
              ).map((pkg) => (
                <button
                  key={pkg.days}
                  type="button"
                  disabled={promoPending}
                  onClick={() => {
                    setSelectedPromo(pkg.days)
                    if (!unitId) return
                    startPromoTransition(async () => {
                      const res = await requestUnitPromotionAction({
                        unitId,
                        days: pkg.days,
                        price: pkg.price,
                      })
                      if (res.success && res.fawryCode)
                        setFawryCode(res.fawryCode)
                    })
                  }}
                  className={`flex flex-col items-center rounded-2xl border bg-white p-3.5 transition ${
                    selectedPromo === pkg.days
                      ? 'border-[#007a5a] ring-2 ring-[#007a5a]/20'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="text-xs font-extrabold text-[#0a1122]">
                    {pkg.days} {tRev.daysWord}
                  </span>
                  <span className="mt-1 text-sm font-black text-[#007a5a]">
                    {pkg.price} {currency}
                  </span>
                </button>
              ))}
            </div>
            {fawryCode && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3">
                <div>
                  <span className="text-[11px] text-gray-500">
                    {tRev.adOrderCodeLabel}:
                  </span>
                  <strong className="ms-2 font-mono text-base font-black text-[#007a5a]">
                    {fawryCode}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(fawryCode)
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold"
                >
                  <Copy className="size-3.5" />
                  <span>{copiedCode ? tRev.copiedBtn : tRev.copyCodeBtn}</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/opportunities/${unitId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-xs font-extrabold text-[#0a1122] hover:bg-slate-50 sm:text-sm"
            >
              {isAr ? 'معاينة صفحة العقار' : 'View Property Page'}
            </Link>
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#007a5a] px-7 text-xs font-extrabold text-white shadow-sm hover:bg-[#006248] sm:text-sm"
            >
              {tRev.goToAccountBtn}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}