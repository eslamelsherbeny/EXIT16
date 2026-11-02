'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Flame,
  Landmark,
  Lock,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { useTranslation } from '@/lib/i18n'
import { createBoostRequestAction } from '@/actions/account-actions'

// دالة حساب تفاصيل الباقة باللاري الجورجي (₾) مطابقة للصور 5 إلى 10 بالضبط
export function calculateGelBoostPackage(amount: number, isAr: boolean) {
  const cleanAmt = Math.max(5, Math.round(amount || 5))

  let tier: 'VIP+' | 'SUPER VIP' = cleanAmt < 10 ? 'VIP+' : 'SUPER VIP'
  let days = 1
  let discountBadge = ''
  let upsellTarget = 60
  let upsellDiscount = '-25%'
  let upsellDays = 10

  if (cleanAmt < 10) {
    tier = 'VIP+'
    days = Math.max(1, Math.floor(cleanAmt / 5))
  } else if (cleanAmt < 20) {
    tier = 'SUPER VIP'
    days = Math.max(1, Math.floor(cleanAmt / 10))
  } else if (cleanAmt < 50) {
    tier = 'SUPER VIP'
    days = Math.max(2, Math.floor(cleanAmt / 10))
  } else if (cleanAmt < 60) {
    tier = 'SUPER VIP'
    days = 7
  } else if (cleanAmt < 100) {
    tier = 'SUPER VIP'
    days = Math.max(10, Math.round(cleanAmt / 6))
    discountBadge = '-25%'
    upsellTarget = 100
    upsellDiscount = '-30%'
    upsellDays = 17
  } else if (cleanAmt < 200) {
    tier = 'SUPER VIP'
    days = Math.max(17, Math.round(cleanAmt / 5.88))
    discountBadge = '-30%'
    upsellTarget = 200
    upsellDiscount = '-33%'
    upsellDays = 30
  } else {
    tier = 'SUPER VIP'
    days = Math.max(30, Math.round(cleanAmt / 6.6))
    discountBadge = '-33%'
    upsellTarget = 0
  }

  const coverLabel = isAr
    ? `تغطي باقة ${tier} لمدة ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : 'أيام'}`
    : `Covers ${tier} for ${days} ${days === 1 ? 'day' : 'days'}`

  return {
    amount: cleanAmt,
    tier,
    days,
    discountBadge,
    upsellTarget,
    upsellDiscount,
    upsellDays,
    coverLabel,
  }
}

// 1. البانر الإعلاني مع الموجة المتحركة (Wave Shimmer) والكلام على اليمين
export function SponsoredRightAlignedBanner() {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="aqar-wave-banner rounded-[30px] border border-amber-400/20 bg-gradient-to-r from-[#0d2b26] via-[#132a4a] to-[#2d1b4e] p-8 text-center text-white shadow-xl transition duration-300 hover:shadow-2xl sm:p-12">
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
            <span className="inline-block rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-1 text-[11px] font-bold text-amber-300">
              ✦{' '}
              {isAr
                ? 'مساحة ترويجية مميزة · AQAR EXIT SPOTLIGHT'
                : 'PREMIUM SPOTLIGHT · AQAR EXIT'}
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-4xl">
              {isAr
                ? 'هل تريد بيع وحدتك أو تسويق مشروعك أسرع؟'
                : 'Want to Exit Your Unit or Promote Your Project Faster?'}
            </h2>
            <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-white/80 sm:text-sm">
              {isAr
                ? 'ضع وحدتك في صدارة الصفحة الرئيسية أمام آلاف المستثمرين والمشترين الجادين الباحثين عن فرص استكمال الأقساط في جورجيا.'
                : 'Place your property at the top of the homepage in front of thousands of serious investors.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                isAr ? 'ظهور في الصدارة' : 'Top placement',
                isAr ? 'مشترون جادون بدون وسطاء' : 'Direct serious buyers',
                isAr ? 'تفعيل فوري' : 'Instant activation',
              ].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-white/90"
                >
                  <span className="me-1 text-[#2ee59d]">•</span>
                  {pill}
                </span>
              ))}
            </div>
            <Link
              href="#boost-packages-section"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-8 text-xs font-bold text-white shadow-lg transition hover:scale-105 hover:opacity-95 sm:text-sm"
            >
              <span>
                {isAr
                  ? 'اختر باقة تمييز إعلانك الآن ←'
                  : 'Boost your listing now →'}
              </span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

// 2. قسم شركات التطوير الرائدة (التصميم الأفقي مع اللوجو على الجنب مطابق للصورة 1) + بطاقتي الإحصائيات (1,814 و 6)
export function LeadingDevelopersSection({
  realUnitCount = 0,
}: {
  realUnitCount?: number
}) {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'

  const topDevelopers = [
    {
      rank: 1,
      name: isAr ? 'آرتشي' : 'Archi',
      nameEn: 'Archi',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 55,
      activeCount: 33,
      logoType: 'archi',
    },
    {
      rank: 2,
      name: isAr ? 'أركون للتطوير' : 'Arcon Development',
      nameEn: 'Arcon',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 18,
      activeCount: 23,
      logoType: 'arcon',
    },
    {
      rank: 3,
      name: isAr ? 'مجموعة أوربي' : 'ORBI Group',
      nameEn: 'ORBI Group',
      city: isAr ? 'باتومي' : 'Batumi',
      projectsCount: 30,
      activeCount: 18,
      logoType: 'orbi',
    },
    {
      rank: 4,
      name: isAr ? 'نكست جروب' : 'NEXT Group',
      nameEn: 'NEXT Group',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 65,
      activeCount: 17,
      logoType: 'next',
    },
    {
      rank: 5,
      name: isAr ? 'إم سكوير' : 'm² Real Estate',
      nameEn: 'm²',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 28,
      activeCount: 14,
      logoType: 'm2',
    },
  ]

  const renderDeveloperLogo = (type: string) => {
    if (type === 'archi') {
      return (
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#009fe3] text-white shadow-2xs">
          <svg viewBox="0 0 24 24" className="size-6" fill="none">
            <path
              d="M6 19L12 5L18 19M9 14H15"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )
    }
    if (type === 'arcon') {
      return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="rounded border-2 border-[#e11d48] px-1.5 py-0.5 text-[11px] font-black tracking-tighter text-[#0f1d40]">
            MG
          </span>
        </div>
      )
    }
    if (type === 'orbi') {
      return (
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/70 text-[#15803d] shadow-2xs">
          <Building2 className="size-5" />
          <span className="mt-0.5 text-[7px] font-black uppercase">ORBI</span>
        </div>
      )
    }
    if (type === 'next') {
      return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] font-black tracking-wider text-[#0f1d40]">
            NEXT
          </span>
        </div>
      )
    }
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1e293b] text-amber-400 shadow-2xs">
        <span className="text-sm font-black">m²</span>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold text-[#2563eb]">
              🏢 {isAr ? 'أفضل المطورين' : 'TOP DEVELOPERS'}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
              {isAr ? 'شركات التطوير الرائدة' : 'Leading development companies'}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {isAr
                ? 'ترتيب حسب الإعلانات النشطة — استعرض المشاريع والعقارات'
                : 'Ranked by active exit listings — explore projects and units'}
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
          >
            {isAr ? 'كل المطورين (1399) ←' : 'All developers (1399) →'}
          </Link>
        </div>

        {/* كروت شركات التطوير مع اللوجو على الجنب كما في الصورة الأولى */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 no-scrollbar lg:grid lg:grid-cols-5 lg:overflow-visible">
          {topDevelopers.map((dev) => (
            <Link
              key={dev.name}
              href={`/opportunities?q=${encodeURIComponent(dev.nameEn)}`}
              className="sivrce-card flex w-[250px] shrink-0 snap-start flex-col justify-between rounded-[22px] border border-slate-200/85 bg-white p-4 text-start shadow-2xs lg:w-auto"
            >
              {/* الجزء العلوي: اللوجو في مربع على الجنب وبجانبه الاسم ورقم الترتيب والمدينة */}
              <div className="flex items-center gap-3.5">
                {renderDeveloperLogo(dev.logoType)}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <strong className="truncate text-sm font-bold text-[#0f1d40]">
                      {dev.name}
                    </strong>
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#2563eb]">
                      {dev.rank}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-[11px] font-medium text-slate-400">
                    {dev.city} · {dev.projectsCount}{' '}
                    {isAr ? 'مشروع' : 'projects'}
                  </span>
                </div>
              </div>

              {/* الجزء السفلي: عدد الإعلانات النشطة ورابط المشاريع */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                <span className="text-slate-500">
                  {dev.activeCount} {isAr ? 'نشطة' : 'active'}
                </span>
                <span className="text-[#2563eb]">
                  {isAr ? 'المشاريع ←' : 'Projects →'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </section>
  )
}

// 3. قسم باقات الإعلانات وشحن الرصيد باللاري الجورجي (₾) + ربط الدفع وموافقة الأدمن (مطابق للصور 5 إلى 10)
export function TopUpBalanceGelSection() {
  const { locale, siteSettings } = useTranslation() as Record<string, any>
  const isAr = locale === 'ar'
  const GEL = '₾'

  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(10)
  const [topUpAmount, setTopUpAmount] = useState<number>(10)
  const [unitCodeInput, setUnitCodeInput] = useState<string>('')
  const [submittingBoost, setSubmittingBoost] = useState(false)
  const [boostNotice, setBoostNotice] = useState<string | null>(null)

  const pkgDetails = useMemo(
    () => calculateGelBoostPackage(topUpAmount, isAr),
    [topUpAmount, isAr]
  )

  const presets = [
    {
      id: 5,
      val: 5,
      topBadge: 'Starter',
      subText: 'VIP+ · 1 day',
    },
    {
      id: 10,
      val: 10,
      topBadge: 'Recommended 🔥',
      subText: 'SUPER VIP',
      isRecommended: true,
    },
    {
      id: 20,
      val: 20,
      topBadge: '',
      subText: 'SUPER VIP',
    },
    {
      id: 50,
      val: 50,
      topBadge: 'Popular',
      subText: 'SUPER VIP',
    },
    {
      id: 100,
      val: 100,
      topBadge: 'PRO -30%',
      subText: 'SUPER VIP',
    },
    {
      id: 'custom' as const,
      val: 0,
      topBadge: 'Custom amount',
      subText: 'Any',
    },
  ]

 const handleProceedToPayment = async (method: 'card' | 'bank') => {
    setSubmittingBoost(true)
    setBoostNotice(null)

    const res = await createBoostRequestAction({
      amountGel: pkgDetails.amount,
      packageTier: pkgDetails.tier,
      durationDays: pkgDetails.days,
      paymentMethod: method,
      unitCode: unitCodeInput.trim() || undefined,
    })

    setSubmittingBoost(false)

    const configuredPaymentUrl =
      res?.paymentUrl ||
      siteSettings?.boostPaymentUrl ||
      process.env.NEXT_PUBLIC_BOOST_PAYMENT_URL ||
      ''

    if (configuredPaymentUrl) {
      const sep = configuredPaymentUrl.includes('?') ? '&' : '?'
      window.open(
        `${configuredPaymentUrl}${sep}amount=${pkgDetails.amount}&currency=GEL&tier=${encodeURIComponent(pkgDetails.tier)}&days=${pkgDetails.days}&reqId=${encodeURIComponent(res?.boostRequestId || '')}`,
        '_blank'
      )
    }

    setBoostNotice(
      isAr
        ? `تم تسجيل طلب تفعيل باقة (${pkgDetails.tier} — ${pkgDetails.amount} ₾ لمدة ${pkgDetails.days} يوم)${res?.unitCode ? ` للوحدة ${res.unitCode}` : ''}. بمجرد إتمام الدفع ومراجعة الأدمن للإعلان والدفع سيتم التفعيل تلقائياً.`
        : `Boost request (${pkgDetails.tier} — ${pkgDetails.amount} ₾ for ${pkgDetails.days} days) recorded. It will activate automatically once payment and listing are approved by Admin.`
    )
  }
  return (
    <section
      id="boost-packages-section"
      className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8"
    >
      <ScrollReveal>
        <div className="grid grid-cols-1 items-center gap-10 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-10 lg:grid-cols-12">
          {/* العمود الأول (يظهر في اليمين في العربي): العنوان والشرح والكروت الثلاثة بدون كلمة "باللاري" */}
          <div className="text-start lg:col-span-7">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#2563eb]">
              ✦ {isAr ? 'رصيد المحفظة والترقية' : 'Wallet & Boost Balance'}
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-[#0f1d40] sm:text-4xl">
              {isAr ? (
                <>
                  اشحن رصيدك <span className="text-[#2563eb]">بأي مبلغ</span>
                </>
              ) : (
                <>
                  Top Up Your Balance{' '}
                  <span className="text-[#2563eb]">With Any Amount</span>
                </>
              )}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {isAr
                ? 'رقِّ إعلان التنازل الخاص بك لباقات SUPER VIP و VIP+ ليظهر في صدارة الصفحة الرئيسية والفرص المتاحة. بمجرد الدفع عبر الرابط ومراجعة الأدمن للإعلان والدفع، يتم تفعيل باقتك تلقائياً بالمدة المحددة.'
                : 'Promote your listings with SUPER VIP and VIP+ boosts. Once paid and verified by Admin, your listing boost activates automatically.'}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-orange-50 text-[#ff6437]">
                  <CreditCard className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {isAr ? 'كل وسائل الدفع' : 'All Payment Methods'}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAr
                    ? 'دفع مباشر سريع عبر رابط الدفع الآمن بالبطاقة أو التحويل البنكي.'
                    : 'Apple Pay · Mastercard · Visa · BOG · TBC · Bank Transfer.'}
                </p>
              </div>

              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#007a5a]">
                  <Check className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {isAr ? 'قابل للاسترداد 100%' : '100% Refundable'}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAr
                    ? 'إذا لم تتم الموافقة على الإعلان من الأدمن، يُسترد المبلغ بالكامل فوراً.'
                    : 'Any unspent balance is fully refundable at any time upon request.'}
                </p>
              </div>

              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Sparkles className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {isAr ? 'تفعيل فوري بعد المراجعة' : 'Instant 1:1 Credit'}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAr
                    ? '0% رسوم إضافية — تُحسب أيام الترقية تلقائياً حسب قيمة الباقة المدفوعة.'
                    : '0% fees. Every 1 GEL goes directly to your listing boost.'}
                </p>
              </div>
            </div>
          </div>

          {/* العمود الثاني (يظهر في الشمال في العربي): كارت الباقات والدفع التفاعلي */}
          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 text-start shadow-md sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#ff6437]">
                1:1 ⚡
              </span>
              <div className="flex items-center gap-2.5">
                <div className="text-end">
                  <strong className="block text-xs font-bold text-[#0f1d40]">
                    {isAr ? 'مبالغ سريعة' : 'Quick amounts'}
                  </strong>
                  <span dir="ltr" className="text-[10px] text-slate-400">
                    Min 5 {GEL} · Max 10,000 {GEL}
                  </span>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Wallet className="size-4" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {presets.map((item) => {
                const isActive =
                  item.id === 'custom'
                    ? selectedPreset === 'custom'
                    : selectedPreset === item.val && topUpAmount === item.val

                return (
                  <button
                    key={String(item.id)}
                    type="button"
                    onClick={() => {
                      if (item.id === 'custom') {
                        setSelectedPreset('custom')
                      } else {
                        setSelectedPreset(item.val)
                        setTopUpAmount(item.val)
                      }
                      setBoostNotice(null)
                    }}
                    className={`relative flex min-h-[68px] flex-col items-center justify-center rounded-2xl border px-1.5 py-2 text-center transition ${
                      isActive
                        ? 'border-2 border-[#2563eb] bg-blue-50/40 text-[#0f1d40] shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.topBadge && (
                      <span
                        className={`-mt-1 mb-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold whitespace-nowrap ${
                          item.isRecommended
                            ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-2xs'
                            : isActive
                              ? 'text-[#2563eb]'
                              : 'text-slate-400'
                        }`}
                      >
                        {item.topBadge}
                      </span>
                    )}

                    <strong dir="ltr" className="text-xs font-bold sm:text-sm">
                      {item.id === 'custom' ? '...' : `${item.val} ${GEL}`}
                    </strong>
                    <span className="mt-0.5 text-[8.5px] font-semibold text-slate-400">
                      {item.subText}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-end text-[11px] font-semibold text-slate-500">
                {isAr ? 'مبلغ مخصص' : 'Custom amount'}
              </span>
              <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom')
                      setTopUpAmount((prev) => Math.min(10000, prev + 5))
                    }}
                    className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    {GEL}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset(10)
                      setTopUpAmount(10)
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                    title="Reset"
                  >
                    ×
                  </button>
                </div>

                <input
                  type="number"
                  dir="ltr"
                  value={topUpAmount}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setTopUpAmount(Math.max(5, Number(e.target.value) || 5))
                  }}
                  className="w-full bg-transparent text-center text-base font-bold text-[#0f1d40] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('custom')
                    setTopUpAmount((prev) => Math.max(5, prev - 5))
                  }}
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  -
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f5f8ff] p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-100/80 text-[#2563eb]">
                  <Zap className="size-4" />
                </span>
                <div className="text-end">
                  <strong
                    dir="ltr"
                    className="block text-xs font-bold text-[#0f1d40] sm:text-sm"
                  >
                    {pkgDetails.amount} {GEL}{' '}
                    {isAr
                      ? 'تُضاف لرصيد إعلانك'
                      : 'credited to your balance'}
                  </strong>
                  <span className="mt-0.5 block text-[11px] font-bold text-[#2563eb]">
                    {pkgDetails.coverLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                  ✓ {isAr ? 'عمولة 0%' : '0% fee'}
                </span>
                <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                  ✓ {isAr ? 'رصيد فوري 1:1' : 'Instant 1:1 credit'}
                </span>
              </div>

              {pkgDetails.upsellTarget > 0 && (
                <div className="mt-3 border-t border-blue-200/60 pt-3 text-end">
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {isAr
                      ? `نصيحة: شحن ${pkgDetails.upsellTarget} ${GEL} يفتح لك خصم ${pkgDetails.upsellDiscount} على باقة SUPER VIP (${pkgDetails.upsellDays} يوماً)`
                      : `Recommendation: ${pkgDetails.upsellTarget} ${GEL} unlocks ${pkgDetails.upsellDiscount} volume discount on SUPER VIP (${pkgDetails.upsellDays} days)`}{' '}
                    ✨
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom')
                      setTopUpAmount(pkgDetails.upsellTarget)
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-2xs transition hover:opacity-95"
                  >
                    <span>
                      {isAr
                        ? `اشحن ${pkgDetails.upsellTarget} ${GEL}`
                        : `Top up to ${pkgDetails.upsellTarget} ${GEL}`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={unitCodeInput}
                onChange={(e) => setUnitCodeInput(e.target.value)}
                placeholder={
                  isAr
                    ? 'كود إعلانك (اختياري — لتفعيله فور مراجعة الأدمن للدفع)'
                    : 'Your unit code (optional — for instant admin activation)'
                }
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-[#0f1d40] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-1 text-[10.5px] font-semibold text-slate-500">
              <span>⚡ {isAr ? 'رسوم 0%' : '0% fee'}</span>
              <span>✓ {isAr ? 'لا تنتهي صلاحيته' : 'Never expires'}</span>
              <span>🛡️ {isAr ? 'قابل للاسترداد بالكامل' : 'Fully refundable'}</span>
            </div>

            <button
              type="button"
              disabled={submittingBoost}
              onClick={() => handleProceedToPayment('card')}
              className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,100,55,0.3)] transition hover:opacity-95 disabled:opacity-60 sm:text-sm"
            >
              <CreditCard className="size-4" />
              <span>
                {isAr
                  ? `ادفع ${pkgDetails.amount} ${GEL} بالبطاقة البنكية`
                  : `Pay ${pkgDetails.amount} ${GEL} with Card`}
              </span>
            </button>

            <button
              type="button"
              disabled={submittingBoost}
              onClick={() => handleProceedToPayment('bank')}
              className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#0f1d40] transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Landmark className="size-3.5 text-slate-500" />
              <span>
                {isAr
                  ? `تحويل بنكي ${pkgDetails.amount} ${GEL}`
                  : `Bank Transfer ${pkgDetails.amount} ${GEL}`}
              </span>
            </button>

            {boostNotice && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-xs font-semibold text-[#007a5a]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{boostNotice}</span>
              </div>
            )}

            <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400">
              <span>Visa · Mastercard · Apple Pay · TBC · BOG</span>
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" /> 256-bit SSL
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}