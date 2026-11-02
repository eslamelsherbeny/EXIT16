'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Flame,
  Loader2,
  Mail,
  MessageCircle,
} from 'lucide-react'
import {
  sendInlineEmailOtpAction,
  verifyInlineEmailOtpAction,
} from '@/actions/auth-actions'
import { createBoostRequestAction } from '@/actions/account-actions'
import { Input } from '@/components/ui/input'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  maskEmailDisplay,
  type SellerExtraLabels,
} from './seller-i18n'
import { toEnglishDigits } from './seller-shared'

const BOOST_PACKAGES_GEL = [
  {
    amount: 5,
    tier: 'VIP+' as const,
    days: 1,
    tagAr: 'بداية · يوم واحد',
    tagEn: 'Starter · 1 day',
  },
  {
    amount: 10,
    tier: 'SUPER VIP' as const,
    days: 1,
    tagAr: 'موصى به 🔥 · يوم واحد',
    tagEn: 'Recommended 🔥 · 1 day',
    highlight: true,
  },
  {
    amount: 20,
    tier: 'SUPER VIP' as const,
    days: 2,
    tagAr: 'SUPER VIP · يومان',
    tagEn: 'SUPER VIP · 2 days',
  },
  {
    amount: 50,
    tier: 'SUPER VIP' as const,
    days: 7,
    tagAr: 'شائع · 7 أيام',
    tagEn: 'Popular · 7 days',
  },
  {
    amount: 100,
    tier: 'SUPER VIP' as const,
    days: 17,
    tagAr: 'PRO -30% · 17 يوماً',
    tagEn: 'PRO -30% · 17 days',
  },
]

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
  const { t: dict, locale, dir, siteSettings } = useTranslation() as Record<
    string,
    any
  >
  const isAr = locale === 'ar'
  const s = dict.sell
  const tRev = s.reviewStep as Record<string, any>
  const GEL = '₾'

  const [selectedPkgAmt, setSelectedPkgAmt] = useState<number>(10)
  const [boostSubmittedNotice, setBoostSubmittedNotice] = useState<
    string | null
  >(null)
  const [promoPending, startPromoTransition] = useTransition()

  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  const activePkg =
    BOOST_PACKAGES_GEL.find((p) => p.amount === selectedPkgAmt) ||
    BOOST_PACKAGES_GEL[1]

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'
  const waVerifyLink = `${siteOrigin}/api/verify-contact?u=${encodeURIComponent(userId || '')}&unitId=${encodeURIComponent(unitId || '')}`
  const areaName = getLocalizedGeorgiaAreaName(form.location, locale)
  const waConfirmMessage = isAr
    ? `أهلاً إدارة Aqar Exit، أنا مالك الإعلان (${form.name || ''}) أؤكد رقم هاتفي وإعلاني رقم (${orderRef}) في (${areaName}).\nرابط المراجعة والتوثيق:\n${waVerifyLink}`
    : `Hello Aqar Exit, I confirm my listing (${orderRef}) in (${areaName}).\nVerification Link:\n${waVerifyLink}`

  const handleRequestBoost = () => {
    startPromoTransition(async () => {
      const res = await createBoostRequestAction({
        amountGel: activePkg.amount,
        packageTier: activePkg.tier,
        durationDays: activePkg.days,
        paymentMethod: 'card',
        unitId: unitId || undefined,
        unitCode: orderRef,
      })

      const paymentUrl =
        res?.paymentUrl ||
        siteSettings?.boostPaymentUrl ||
        process.env.NEXT_PUBLIC_BOOST_PAYMENT_URL ||
        ''

      if (paymentUrl) {
        const sep = paymentUrl.includes('?') ? '&' : '?'
        window.open(
          `${paymentUrl}${sep}amount=${activePkg.amount}&currency=GEL&tier=${encodeURIComponent(activePkg.tier)}&days=${activePkg.days}&unitId=${encodeURIComponent(unitId)}`,
          '_blank'
        )
      }

      setBoostSubmittedNotice(
        isAr
          ? `تم تسجيل طلب تفعيل باقة (${activePkg.tier} — ${activePkg.amount} ₾ لمدة ${activePkg.days} يوم) لوحدتك (${orderRef}). سيتم تفعيل التمييز تلقائياً فور مراجعة الأدمن للإعلان والدفع.`
          : `Boost request (${activePkg.tier} — ${activePkg.amount} ₾ for ${activePkg.days} days) recorded for unit (${orderRef}). It will activate automatically upon Admin approval.`
      )
    })
  }

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
          <h2 className="mt-4 text-2xl font-bold text-[#0a1122]">
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
            <p className="text-xs font-bold text-[#0a1122] sm:text-sm">
              {isAr
                ? 'لتسريع نشر إعلانك وتوثيق رقم هاتفك بعلامة التوثيق ✓:'
                : 'To fast-track listing review & verify your phone number ✓:'}
            </p>
            <a
              href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(waConfirmMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-xs font-bold text-white shadow-sm hover:opacity-95 sm:text-sm"
            >
              <MessageCircle className="size-4" />
              <span>{extraT.waVerifyBtn}</span>
            </a>
          </div>

          {/* توثيق البريد الإلكتروني بالكود */}
          {emailVerified ? (
            <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-bold text-[#007a5a]">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{extraT.emailVerifiedBadge}</span>
            </div>
          ) : (
            <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-start">
              <h3 className="text-sm font-bold text-[#0a1122]">
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
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a1122] px-5 text-xs font-bold text-white"
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
                      className="h-10 rounded-xl bg-[#007a5a] px-4 text-xs font-bold text-white"
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

          {/* باقات تمييز الإعلان باللاري الجورجي (₾) مربوطة بـ createBoostRequestAction */}
          <div className="mt-6 w-full rounded-2xl border border-blue-200/80 bg-[#f5f8ff] p-5 text-start">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
                <Crown className="size-4 text-[#ff6437]" />
                <span>SUPER VIP & VIP+ · {tRev.optionalBadge}</span>
              </div>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-[#ff6437]">
                1:1 ⚡
              </span>
            </div>

            <h3 className="mt-1.5 text-base font-bold text-[#0a1122]">
              {tRev.promoTitle}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {isAr
                ? 'اختر الباقة المناسبة وادفع بالبطاقة لتظهر وحدتك في صدارة الصفحة الرئيسية والفرص المتاحة فور تفعيل الأدمن.'
                : 'Choose a boost package to feature your unit at the top of the Homepage and Opportunities.'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {BOOST_PACKAGES_GEL.map((pkg) => {
                const active = selectedPkgAmt === pkg.amount
                return (
                  <button
                    key={pkg.amount}
                    type="button"
                    disabled={promoPending}
                    onClick={() => {
                      setSelectedPkgAmt(pkg.amount)
                      setBoostSubmittedNotice(null)
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                      active
                        ? 'border-2 border-[#2563eb] bg-white text-[#0f1d40] shadow-xs'
                        : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {pkg.highlight && (
                      <span className="mb-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-2 py-0.5 text-[8.5px] font-bold text-white">
                        ★
                      </span>
                    )}
                    <strong dir="ltr" className="text-sm font-bold text-[#0f1d40]">
                      {pkg.amount} {GEL}
                    </strong>
                    <span className="mt-0.5 text-[9.5px] font-semibold text-slate-500">
                      {isAr ? pkg.tagAr : pkg.tagEn}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={promoPending}
              onClick={handleRequestBoost}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-60 sm:text-sm"
            >
              {promoPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              <span>
                {isAr
                  ? `ادفع ${activePkg.amount} ${GEL} وتفعيل باقة ${activePkg.tier} (${activePkg.days} يوم)`
                  : `Pay ${activePkg.amount} ${GEL} for ${activePkg.tier} (${activePkg.days}d)`}
              </span>
            </button>

            {boostSubmittedNotice && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-xs font-semibold text-[#007a5a]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{boostSubmittedNotice}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/opportunities/${unitId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-xs font-bold text-[#0a1122] hover:bg-slate-50 sm:text-sm"
            >
              {isAr ? 'معاينة صفحة العقار' : 'View Property Page'}
            </Link>
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#007a5a] px-7 text-xs font-bold text-white shadow-sm hover:bg-[#006248] sm:text-sm"
            >
              {tRev.goToAccountBtn}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}