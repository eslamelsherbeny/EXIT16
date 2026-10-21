import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  Bell,
  Check,
  CheckSquare,
  Home,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import ruDict from '@/dictionaries/ru.json'
import kaDict from '@/dictionaries/ka.json'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const dictionaries: Record<string, any> = {
  ar: arDict,
  en: enDict,
  ru: ruDict,
  ka: kaDict,
}

// دالة ذكية لعرض رمز العملة المناسب حسب الدولة ولغة المتصفح الحالية
function getHomeCurrencySymbol(countryCode: string, locale: string): string {
  const isArabic = locale === 'ar'
  switch (countryCode) {
    case 'EG':
      return isArabic ? 'ج.م' : 'EGP'
    case 'AE':
      return isArabic ? 'د.إ' : 'AED'
    case 'RU':
      return '₽'
    case 'GE':
      return '$'
    default:
      return isArabic ? 'ج.م' : 'EGP'
  }
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export default async function HomePage() {
  let realUnitCount = 0
  let totalMarketValue = 0
  let activeCountryCode = 'EG'
  let activeLocale = 'ar'

  try {
    const cookieStore = await cookies()
    activeCountryCode =
      cookieStore.get('darak_country')?.value?.trim().toUpperCase() || 'EG'
    activeLocale = cookieStore.get('locale')?.value?.trim() || 'ar'

    const supabase = await getSupabase()
    const { data: units } = await supabase
      .from('sell_requests')
      .select('status, country_code, market_price, contract_price, paid_amount')
      .neq('status', 'rejected')
      .neq('status', 'deleted_by_seller')

    if (units && units.length > 0) {
      const countryUnits = units.filter((u: any) => {
        const uCountry = (u.country_code || 'EG').toUpperCase()
        return uCountry === activeCountryCode
      })

      realUnitCount = countryUnits.length
      totalMarketValue = countryUnits.reduce((sum, u) => {
        const unitVal =
          Number(u.market_price) ||
          Number(u.contract_price) ||
          Number(u.paid_amount) ||
          0
        return sum + unitVal
      }, 0)
    }
  } catch (err) {
    console.error('Error fetching real stats on HomePage:', err)
  }

  const dict = dictionaries[activeLocale] || arDict
  const t = dict.home || arDict.home
  const isRtl = activeLocale === 'ar'

  // العملة الآن تتحدث تلقائياً حسب اللغة والدولة (ج.م بالعربي، و EGP بالإنجليزي/الروسي/الجورجي)
  const currencySymbol = getHomeCurrencySymbol(activeCountryCode, activeLocale)
  let formattedValue = '0'
  let valueUnitLabel = currencySymbol

  if (totalMarketValue >= 1_000_000_000) {
    formattedValue = (totalMarketValue / 1_000_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    })
    valueUnitLabel = `${t?.stats?.billion || 'مليار'} ${currencySymbol}`
  } else if (totalMarketValue >= 1_000_000) {
    formattedValue = (totalMarketValue / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })
    valueUnitLabel = `${t?.stats?.million || 'مليون'} ${currencySymbol}`
  } else {
    formattedValue = totalMarketValue.toLocaleString('en-US')
    valueUnitLabel = currencySymbol
  }

  const comparisonRows = t?.comparison?.rows || arDict.home.comparison.rows
  const workSteps = t?.steps?.items || arDict.home.steps.items
  const fairStandards = t?.standards?.items || arDict.home.standards.items

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen overflow-x-hidden bg-[var(--brand-surface,#f5f6f8)] text-[var(--brand-navy-text,#0a1128)]"
    >
      {/* ==================== 1. قسم الهيرو (Hero Section) ==================== */}
      <section className="relative flex min-h-[720px] items-center overflow-hidden bg-[var(--brand-navy,#0a1122)] text-white lg:min-h-[780px]">
        <div className="pointer-events-none absolute -bottom-40 -left-32 size-[28rem] rounded-full bg-teal-500/10 blur-[120px] sm:size-[38rem]" />
        <div className="pointer-events-none absolute -top-32 right-[15%] size-[24rem] rounded-full bg-blue-500/10 blur-[120px] sm:size-[32rem]" />

        <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:py-20">
          <div className="text-start">
            <span className="mb-6 inline-block rounded-full border border-white/10 bg-[#132230] px-4 py-1.5 text-[11px] font-semibold text-[#2dd4a8] sm:text-xs">
              {t?.hero?.badge}
            </span>

            <h1 className="heading-hero text-white">
              {t?.hero?.titleLine1}
              <br className="hidden sm:inline" /> {t?.hero?.titleLine2}{' '}
              <span className="text-[#19b394]">
                {t?.hero?.titleAccentLine1}
                <br className="hidden sm:inline" /> {t?.hero?.titleAccentLine2}
              </span>
            </h1>

            <p className="mt-5 max-w-[565px] text-[13.5px] leading-[1.95] text-[#9ba6b8] sm:text-[15px] lg:text-[15.5px]">
              {t?.hero?.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-start gap-3.5 sm:mt-8">
              <Button
                size="lg"
                className="h-12 flex-1 rounded-[10px] bg-[var(--brand-primary-dark,#0d6e52)] px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0a5942] sm:flex-none sm:px-8 sm:text-[15px]"
                render={<Link href="/sell" />}
              >
                {t?.hero?.sellBtn}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1 rounded-[10px] border border-white/15 !bg-[#111a2b]/60 px-7 text-sm font-bold text-white transition-all hover:!bg-white/10 hover:text-white sm:flex-none sm:px-8 sm:text-[15px]"
                render={<Link href="/opportunities" />}
              >
                {t?.hero?.buyBtn}
              </Button>
            </div>

            <div className="mt-6 flex items-start justify-start gap-2 text-[11px] leading-relaxed text-[#7e8b9f] sm:items-center sm:text-xs">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#19b394] sm:mt-0" />
              <p>{t?.hero?.trustNote}</p>
            </div>
          </div>

          {/* العمود الثاني: بطاقات المقارنة */}
          <div className="relative mx-auto flex w-full max-w-[440px] flex-col items-center gap-4">
            <div className="w-full rounded-[20px] border border-white/10 bg-[#162032]/90 p-5 text-white shadow-xl backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#3a1d2b] text-xs font-bold text-[#ff5a65]">
                  ✕
                </span>
                <p className="text-sm font-bold text-gray-200">
                  {t?.hero?.lossCardTitle}
                </p>
              </div>

              <div className="mt-5 flex items-end justify-between gap-2">
                <div className="text-start">
                  <p className="text-[11px] text-gray-400 sm:text-xs">
                    {t?.hero?.lossCardLabel}
                  </p>
                  <strong className="mt-1 flex items-baseline gap-1.5 text-xl font-extrabold text-[#ff5a65] tabular-nums sm:text-[26px]">
                    <span dir="ltr">- {t?.hero?.lossCardAmount}</span>
                    <span>{currencySymbol}</span>
                  </strong>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-[11px] text-gray-400 sm:text-xs">
                    {t?.hero?.lossCardDurationLabel}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-200 sm:text-base">
                    {t?.hero?.lossCardDurationValue}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white/[0.04] px-4 py-2.5 text-center text-[11px] text-gray-400 sm:text-xs">
                {t?.hero?.lossCardFooter}
              </div>
            </div>

            <div className="z-20 -my-6 flex size-9 items-center justify-center rounded-full border border-white/15 bg-[var(--brand-navy,#0a1122)] text-[11px] font-bold uppercase text-gray-300 shadow-md">
              vs
            </div>

            <div className="w-full rounded-[20px] bg-white p-5 text-[var(--brand-navy-text,#0a1128)] shadow-2xl sm:p-6">
              <div className="flex items-center justify-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d8f3e5] text-xs font-bold text-[#0f7a58]">
                  ✓
                </span>
                <p className="text-sm font-bold text-[var(--brand-navy-text,#0a1128)]">
                  {t?.hero?.winCardTitle}
                </p>
              </div>

              <div className="mt-5 text-start">
                <p className="text-[11px] text-gray-500 sm:text-xs">
                  {t?.hero?.winCardLabel}
                </p>
                <strong className="mt-1 flex items-baseline gap-1.5 text-2xl font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-[32px]">
                  <span dir="ltr">{t?.hero?.winCardAmount}</span>
                  <span>{currencySymbol}</span>
                </strong>
                <p className="mt-1 text-xs font-bold text-[var(--brand-navy-text,#0a1128)]">
                  {t?.hero?.winCardSub}
                </p>
              </div>

              <div className="mt-5 rounded-xl bg-[#e3f5ec] px-4 py-2.5 text-center text-[11px] font-semibold text-[#0f7a58] sm:text-xs">
                {t?.hero?.winCardFooter}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 2. قسم الإحصائيات الحقيقية من الداتابيز ==================== */}
      <section className="layout-container pt-10 pb-6">
        <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[20px] border border-gray-200/70 border-t-[3px] border-t-[var(--brand-primary,#007a5a)] bg-white shadow-sm md:grid-cols-2 md:divide-y-0 md:divide-x md:divide-x-reverse">
          <div className="p-7 text-start sm:p-10">
            <p className="text-xs font-bold text-gray-500">
              {t?.stats?.unitsTitle}
            </p>
            <div className="mt-3 flex items-baseline justify-start gap-2">
              <span
                dir="ltr"
                className="text-4xl font-extrabold tracking-tight text-[var(--brand-navy-text,#0a1128)] tabular-nums sm:text-5xl"
              >
                {realUnitCount.toLocaleString('en-US')}
              </span>
              <span className="text-base font-medium text-gray-500 sm:text-lg">
                {t?.stats?.unitWord}
              </span>
            </div>
            <div className="mt-4 h-[1px] w-10 bg-gray-200" />
            <p className="mt-3 text-xs text-gray-400">{t?.stats?.unitsSub}</p>
          </div>

          <div className="p-7 text-start sm:p-10">
            <div className="flex items-center justify-start gap-2">
              <p className="text-xs font-bold text-gray-500">
                {t?.stats?.valueTitle}
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-start gap-2">
              <span
                dir="ltr"
                className="text-4xl font-extrabold tracking-tight text-[var(--brand-navy-text,#0a1128)] tabular-nums sm:text-5xl"
              >
                {formattedValue}
              </span>
              <span className="text-base font-medium text-gray-500 sm:text-lg">
                {valueUnitLabel}
              </span>
            </div>
            <div className="mt-4 h-[1px] w-10 bg-gray-200" />
            <p className="mt-3 text-xs text-gray-400">{t?.stats?.valueSub}</p>
          </div>
        </div>
      </section>

      {/* ==================== 3. قسم الجمهور (البايع والمشتري) ==================== */}
      <section className="layout-container py-14 md:py-20">
        <div className="max-w-xl text-start">
          <h2 className="heading-section">{t?.audience?.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            {t?.audience?.subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-9">
            <div>
              <span className="inline-block rounded-full bg-[#e6f4f1] px-3.5 py-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                {t?.audience?.sellerBadge}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-navy-text,#0a1128)] sm:text-2xl">
                {t?.audience?.sellerTitle}
              </h3>
              <p className="mt-3 text-xs leading-[1.9] text-gray-500 sm:text-sm">
                {t?.audience?.sellerDesc}
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2.5 text-xs font-medium text-[var(--brand-navy-text,#0a1128)] sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                  <span>{t?.audience?.sellerPoint1}</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-[var(--brand-navy-text,#0a1128)] sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                  <span>{t?.audience?.sellerPoint2}</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-[var(--brand-navy-text,#0a1128)] sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
                  <span>{t?.audience?.sellerPoint3}</span>
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-[#b8e6d5] bg-[var(--brand-primary-light,#eaf8f2)] px-4 py-3 text-xs font-bold text-[var(--brand-primary,#007a5a)] sm:text-sm">
                {t?.audience?.sellerFreeNote}
              </div>
            </div>

            <div className="mt-7">
              <Button
                className="h-11 rounded-[10px] bg-[var(--brand-navy,#0a1122)] px-6 text-xs font-bold text-white hover:bg-[var(--brand-navy-hover,#16223f)] sm:text-sm"
                render={<Link href="/sell" />}
              >
                {t?.audience?.sellerBtn}
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#0a1122] via-[#0d1b2a] to-[#0c262e] p-6 text-start text-white shadow-lg sm:p-9">
            <div>
              <span className="inline-block rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-[var(--brand-accent,#2ee59d)]">
                {t?.audience?.buyerBadge}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-white sm:text-2xl">
                {t?.audience?.buyerTitle}
              </h3>
              <p className="mt-3 text-xs leading-[1.9] text-gray-300/85 sm:text-sm">
                {t?.audience?.buyerDesc}
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2.5 text-xs font-medium text-gray-200 sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-accent,#2ee59d)]" />
                  <span>{t?.audience?.buyerPoint1}</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-gray-200 sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-accent,#2ee59d)]" />
                  <span>{t?.audience?.buyerPoint2}</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-gray-200 sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-accent,#2ee59d)]" />
                  <span>{t?.audience?.buyerPoint3}</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Button
                className="h-11 rounded-[10px] bg-[var(--brand-primary,#007a5a)] px-6 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
                render={<Link href="/opportunities" />}
              >
                {t?.audience?.buyerBtn}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 4. قسم جدول المقارنة ==================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className="layout-container">
          <div className="text-start">
            <h2 className="heading-section">{t?.comparison?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.comparison?.subtitle}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[18px] border border-gray-200/90 shadow-sm sm:mt-10">
            <div className="grid grid-cols-[74px_1fr_1.1fr] text-start text-[11px] font-bold sm:grid-cols-[120px_1fr_1fr] sm:text-xs md:grid-cols-[140px_1fr_1fr] md:text-sm">
              <div className="flex items-center bg-[#f4f5f7] px-2.5 py-3 text-[10px] font-extrabold text-gray-400 sm:p-4 sm:text-xs">
                {t?.comparison?.colCriterion}
              </div>
              <div className="flex items-center border-r border-gray-200/80 bg-[#f4f5f7] px-2.5 py-3 text-gray-600 sm:p-4">
                {t?.comparison?.colResale}
              </div>
              <div className="flex items-center bg-[var(--brand-navy,#0a1122)] px-2.5 py-3 text-white sm:p-4">
                {t?.comparison?.colExit}
              </div>
            </div>

            {comparisonRows.map((row: any) => (
              <div
                key={row.criterion}
                className="grid grid-cols-[74px_1fr_1.1fr] items-stretch border-t border-gray-200/80 text-start text-[11px] leading-relaxed sm:grid-cols-[120px_1fr_1fr] sm:text-xs md:grid-cols-[140px_1fr_1fr] lg:text-sm"
              >
                <div className="flex items-center bg-[#f8f9fa] px-2.5 py-3.5 font-extrabold text-[var(--brand-navy-text,#0a1128)] sm:p-4">
                  {row.criterion}
                </div>

                <div className="flex items-start gap-1.5 border-r border-gray-200/80 bg-white px-2.5 py-3.5 text-gray-500 sm:items-center sm:gap-2.5 sm:p-4">
                  <span className="mt-0.5 shrink-0 font-bold text-red-500 sm:mt-0">
                    ✕
                  </span>
                  <span>{row.resale}</span>
                </div>

                <div className="flex items-start gap-1.5 bg-[#e3ecec] px-2.5 py-3.5 font-semibold text-[var(--brand-navy-text,#0a1128)] sm:items-center sm:gap-2.5 sm:p-4">
                  <span className="mt-0.5 shrink-0 font-bold text-[var(--brand-primary,#007a5a)] sm:mt-0">
                    ✓
                  </span>
                  <span>{row.exit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 5. قسم مثال بالأرقام ==================== */}
      <section className="bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-20">
        <div className="layout-container">
          <div className="text-start">
            <h2 className="heading-section">{t?.example?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.example?.subtitle}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-8">
              <div>
                <div className="flex items-center justify-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecee] text-xs font-bold text-[var(--brand-danger,#d9383a)]">
                    ✕
                  </span>
                  <h3 className="text-base font-extrabold text-[var(--brand-navy-text,#0a1128)]">
                    {t?.example?.lossTitle}
                  </h3>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400">
                    {t?.example?.lossDiscountLabel}
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-extrabold text-[var(--brand-danger,#d9383a)] tabular-nums sm:text-3xl">
                    <span dir="ltr">- {t?.example?.lossDiscountAmount}</span>
                    <span>{currencySymbol}</span>
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                  <div className="text-start">
                    <p className="text-xs text-gray-400">
                      {t?.example?.lossReturnLabel}
                    </p>
                    <p className="mt-1 flex items-baseline gap-1 text-lg font-extrabold text-[var(--brand-navy-text,#0a1128)] tabular-nums sm:text-xl">
                      <span dir="ltr">{t?.example?.lossReturnAmount}</span>
                      <span>{currencySymbol}</span>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-gray-400">
                      {t?.example?.lossDurationLabel}
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[#b45309] sm:text-xl">
                      {t?.example?.lossDurationValue}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-[#fef2f2] px-4 py-3 text-center text-xs font-bold text-[var(--brand-danger,#d9383a)]">
                {t?.example?.lossFooter}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[20px] border-2 border-[#a7e3cb] bg-white p-6 text-start shadow-sm sm:p-8">
              <div>
                <div className="flex items-center justify-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e3f7ed] text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                    ✓
                  </span>
                  <h3 className="text-base font-extrabold text-[var(--brand-navy-text,#0a1128)]">
                    {t?.example?.winTitle}
                  </h3>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400">
                    {t?.example?.winReturnLabel}
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-3xl">
                    <span dir="ltr">{t?.example?.winReturnAmount}</span>
                    <span>{currencySymbol}</span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--brand-navy-text,#0a1128)]">
                    {t?.example?.winReturnSub}
                  </p>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">
                    {t?.example?.winCommissionLabel}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--brand-primary,#007a5a)]">
                    {t?.example?.winCommissionValue}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--brand-navy-text,#0a1128)]">
                    {t?.example?.winCommissionSub}
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-4 py-3 text-center text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                {t?.example?.winFooter}
              </div>
            </div>
          </div>

          <p className="mt-6 text-start text-xs leading-relaxed text-gray-400">
            {t?.example?.disclaimer}
          </p>
        </div>
      </section>

      {/* ==================== 6. قسم إزاي بنشتغل؟ ==================== */}
      <section className="border-t border-gray-200/60 bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-20">
        <div className="layout-container">
          <div className="text-start">
            <h2 className="heading-section">{t?.steps?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.steps?.subtitle}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workSteps.map((step: any, index: number) => (
              <div
                key={step.title}
                className="rounded-[18px] border border-gray-200/70 bg-white p-6 text-start shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-navy,#0a1122)] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-extrabold text-[var(--brand-navy-text,#0a1128)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-[1.8] text-gray-500">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 7. قسم معايير الخروج العادل ==================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className="layout-container">
          <div className="text-start">
            <h2 className="heading-section">{t?.standards?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.standards?.subtitle}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-2 md:gap-y-10">
            {fairStandards.map((item: any) => (
              <div key={item.title} className="flex items-start gap-4 text-start">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f8] text-[#1e3a8a]">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--brand-navy-text,#0a1128)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-[1.85] text-gray-500 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 8. القسم الداكن المزدوج (اعرف موقفك + التطبيق) ==================== */}
      <section className="relative overflow-hidden bg-[var(--brand-navy,#0a1122)] py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-10 size-[28rem] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute left-[15%] bottom-0 size-[30rem] rounded-full bg-teal-500/10 blur-[140px]" />

        <div className="layout-container relative">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              {t?.calculatorBanner?.title}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-gray-400 sm:text-sm md:text-base">
              {t?.calculatorBanner?.subtitle}
            </p>
            <div className="mt-7">
              <Button
                size="lg"
                className="h-12 rounded-[10px] bg-[var(--brand-primary,#007a5a)] px-8 text-sm font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)] sm:text-base"
                render={<Link href="/sell" />}
              >
                {t?.calculatorBanner?.btn}
              </Button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-28 md:grid-cols-2 lg:gap-16">
            <div className="text-start">
              <span className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1 text-xs font-bold text-[var(--brand-accent,#2ee59d)]">
                {t?.app?.badge}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                {t?.app?.title}
              </h2>
              <p className="mt-4 max-w-md text-xs leading-[1.9] text-gray-300/85 sm:text-sm md:text-base">
                {t?.app?.description}
              </p>

              <ul className="mt-7 space-y-4">
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[var(--brand-accent,#2ee59d)]">
                    <Bell className="size-4" />
                  </span>
                  <span>{t?.app?.point1}</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[var(--brand-accent,#2ee59d)]">
                    <Zap className="size-4" />
                  </span>
                  <span>{t?.app?.point2}</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[var(--brand-accent,#2ee59d)]">
                    <CheckSquare className="size-4" />
                  </span>
                  <span>{t?.app?.point3}</span>
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
                <a
                  href="#app-store"
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 text-white transition hover:bg-white/5"
                >
                  <div className="text-start">
                    <span className="block text-[9px] text-gray-400">
                      {t?.app?.downloadFrom}
                    </span>
                    <span className="block text-sm font-bold leading-tight">
                      App Store
                    </span>
                  </div>
                  <svg className="size-6 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                  </svg>
                </a>

                <a
                  href="#google-play"
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 text-white transition hover:bg-white/5"
                >
                  <div className="text-start">
                    <span className="block text-[9px] text-gray-400">
                      {t?.app?.availableOn}
                    </span>
                    <span className="block text-sm font-bold leading-tight">
                      Google Play
                    </span>
                  </div>
                  <svg className="size-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M3.61 1.814L13.793 12 3.61 22.186a1.96 1.96 0 0 1-.61-1.42V3.234c0-.55.23-1.05.61-1.42z"
                    />
                    <path
                      fill="#34A853"
                      d="M17.22 8.573L13.793 12 3.61 1.814c.42-.4.99-.53 1.56-.21l12.05 6.97z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M20.635 10.548c.98.57.98 1.98 0 2.55l-3.415 1.975L13.793 12l3.427-3.427 3.415 1.975z"
                    />
                    <path
                      fill="#EA4335"
                      d="M17.22 15.427L5.17 22.396c-.57.32-1.14.19-1.56-.21L13.793 12l3.427 3.427z"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="hidden justify-center md:flex">
              <div className="w-[270px] -rotate-3 rounded-[40px] border-[6px] border-[#1c283c] bg-[#0b1323] p-4 shadow-2xl transition-transform duration-300 hover:rotate-0 sm:w-[300px]">
                <div className="mx-auto mb-4 h-4 w-24 rounded-full bg-black" />

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#131f33] p-3.5 text-start shadow-md">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-[var(--brand-accent,#2ee59d)]">
                    <Home className="size-4" />
                  </span>
                  <div className="mx-2.5 flex-1">
                    <p className="text-[11px] font-bold text-white">
                      {t?.app?.mockNotifTitle}
                    </p>
                    <p className="mt-0.5 text-[9px] text-gray-400">
                      {t?.app?.mockNotifSub}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/5 bg-[#101b2d] p-3">
                  <div className="h-20 w-full rounded-xl bg-gradient-to-b from-teal-900/35 to-teal-950/15" />
                  <div className="mt-3 h-2.5 w-3/4 rounded-full bg-white/10" />
                  <div className="mt-2 h-2 w-1/2 rounded-full bg-white/5" />
                  <div className="mt-3 flex justify-end">
                    <div className="h-4 w-14 rounded-md bg-teal-500/20" />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/5 bg-[#101b2d] p-3">
                  <div className="h-20 w-full rounded-xl bg-gradient-to-b from-[#17263c] to-[#101b2d]" />
                  <div className="mt-3 h-2.5 w-2/3 rounded-full bg-white/10" />
                  <div className="mt-2 h-2 w-2/5 rounded-full bg-white/5" />
                  <div className="mt-3 flex justify-end">
                    <div className="h-4 w-14 rounded-md bg-teal-500/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 9. قسم البطاقتين السفليتين قبل الفوتر ==================== */}
      <section className="bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-20">
        <div className="layout-container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-9">
              <div>
                <h3 className="text-xl font-extrabold text-[var(--brand-navy-text,#0a1122)] sm:text-2xl">
                  {t?.bottomCta?.sellerTitle}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  {t?.bottomCta?.sellerDesc}
                </p>
              </div>
              <div className="mt-7">
                <Button
                  className="h-11 rounded-[10px] bg-[var(--brand-navy,#0a1122)] px-6 text-xs font-bold text-white hover:bg-[var(--brand-navy-hover,#16223f)] sm:text-sm"
                  render={<Link href="/sell" />}
                >
                  {t?.bottomCta?.sellerBtn}
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-9">
              <div>
                <h3 className="text-xl font-extrabold text-[var(--brand-navy-text,#0a1122)] sm:text-2xl">
                  {t?.bottomCta?.buyerTitle}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  {t?.bottomCta?.buyerDesc}
                </p>
              </div>
              <div className="mt-7">
                <Button
                  variant="outline"
                  className="h-11 rounded-[10px] border border-gray-300 bg-white px-6 text-xs font-bold text-[var(--brand-navy-text,#0a1128)] hover:bg-gray-50 sm:text-sm"
                  render={<Link href="/buy" />}
                >
                  {t?.bottomCta?.buyerBtn}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
