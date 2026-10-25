import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Check, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { getServerI18n } from '@/lib/get-server-dictionary'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

const CONTAINER_CLS = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8'

export default async function HomePage() {
  const { dict, dir, currency: currencySymbol } = await getServerI18n()
  const t = dict.home

  let realUnitCount = 0
  let totalMarketValue = 0

  try {
    const supabase = await getSupabase()
    const { data: units } = await supabase
      .from('sell_requests')
      .select('status, area, country_code, market_price, contract_price, paid_amount')
      .in('status', ['active', 'offer_received'])

    if (units && units.length > 0) {
      const georgiaUnits = units.filter(
        (u: any) => !isNonGeorgianLegacyArea(u.area)
      )

      realUnitCount = georgiaUnits.length
      totalMarketValue = georgiaUnits.reduce((sum, u) => {
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

  let formattedValue = '0'
  let valueUnitLabel = currencySymbol

  if (totalMarketValue >= 1_000_000_000) {
    formattedValue = (totalMarketValue / 1_000_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    })
    valueUnitLabel = `${t?.stats?.billion || 'B'} ${currencySymbol}`
  } else if (totalMarketValue >= 1_000_000) {
    formattedValue = (totalMarketValue / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })
    valueUnitLabel = `${t?.stats?.million || 'M'} ${currencySymbol}`
  } else {
    formattedValue = totalMarketValue.toLocaleString('en-US')
    valueUnitLabel = currencySymbol
  }

  const comparisonRows = t?.comparison?.rows || []
  const workSteps = t?.steps?.items || []
  const fairStandards = t?.standards?.items || []

  return (
    <div
      dir={dir}
      className="min-h-screen overflow-x-hidden bg-[var(--brand-surface,#f5f6f8)] text-[var(--brand-navy-text,#0a1128)]"
    >
      {/* ==================== 1. قسم الهيرو (Hero Section) ==================== */}
      <section className="relative flex min-h-[700px] items-center overflow-hidden bg-[var(--brand-navy,#0a1122)] text-white lg:min-h-[760px]">
        <div className="pointer-events-none absolute -bottom-40 -left-32 size-[28rem] rounded-full bg-teal-500/10 blur-[120px] sm:size-[38rem]" />
        <div className="pointer-events-none absolute -top-32 right-[15%] size-[24rem] rounded-full bg-blue-500/10 blur-[120px] sm:size-[32rem]" />

        <div
          className={`relative ${CONTAINER_CLS} grid grid-cols-1 items-center gap-12 py-12 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-20`}
        >
          <ScrollReveal className="text-start">
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

            <p className="mt-5 max-w-[585px] text-[13.5px] leading-[1.95] text-[#9ba6b8] sm:text-[15px] lg:text-[15.5px]">
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
          </ScrollReveal>

          <ScrollReveal
            delay={120}
            className="relative mx-auto flex w-full max-w-[460px] flex-col items-center gap-4 lg:me-0"
          >
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
          </ScrollReveal>
        </div>
      </section>

      {/* ==================== 2. قسم الإحصائيات الحقيقية من الداتابيز ==================== */}
      <section className={`${CONTAINER_CLS} pt-10 pb-6`}>
        <ScrollReveal>
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
        </ScrollReveal>
      </section>

      {/* ==================== 3. قسم الجمهور (البايع والمشتري) ==================== */}
      <section className={`${CONTAINER_CLS} py-14 md:py-20`}>
        <ScrollReveal className="max-w-xl text-start">
          <h2 className="heading-section">{t?.audience?.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            {t?.audience?.subtitle}
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal delay={60}>
            <div className="flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-9">
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
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <div className="flex h-full flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#0a1122] via-[#0d1b2a] to-[#0c262e] p-6 text-start text-white shadow-lg sm:p-9">
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
          </ScrollReveal>
        </div>
      </section>

      {/* ==================== 4. قسم جدول المقارنة ==================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.comparison?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.comparison?.subtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal
            delay={80}
            className="mt-8 overflow-hidden rounded-[18px] border border-gray-200/90 shadow-sm sm:mt-10"
          >
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
          </ScrollReveal>
        </div>
      </section>

      {/* ==================== 5. قسم مثال بالأرقام ==================== */}
      <section className="bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-20">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.example?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.example?.subtitle}
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <ScrollReveal delay={60}>
              <div className="flex h-full flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-8">
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
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div className="flex h-full flex-col justify-between rounded-[20px] border-2 border-[#a7e3cb] bg-white p-6 text-start shadow-sm sm:p-8">
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
            </ScrollReveal>
          </div>

          <p className="mt-6 text-start text-xs leading-relaxed text-gray-400">
            {t?.example?.disclaimer}
          </p>
        </div>
      </section>

      {/* ==================== 6. قسم إزاي بنشتغل؟ ==================== */}
      <section className="border-t border-gray-200/60 bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-20">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.steps?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.steps?.subtitle}
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workSteps.map((step: any, index: number) => (
              <ScrollReveal key={step.title} delay={index * 70}>
                <div className="h-full rounded-[18px] border border-gray-200/70 bg-white p-6 text-start shadow-sm">
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 7. قسم معايير الخروج العادل ==================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.standards?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.standards?.subtitle}
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-2 md:gap-y-10">
            {fairStandards.map((item: any, idx: number) => (
              <ScrollReveal key={item.title} delay={idx * 60}>
                <div className="flex items-start gap-4 text-start">
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 8. بانر حاسبة الخروج الآمن ==================== */}
      <section className="relative overflow-hidden bg-[var(--brand-navy,#0a1122)] py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-10 size-[28rem] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[130px]" />

        <div className={`relative ${CONTAINER_CLS}`}>
          <ScrollReveal className="mx-auto max-w-xl text-center">
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
                render={<Link href="/calculator" />}
              >
                {t?.calculatorBanner?.btn}
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ==================== 9. قسم البطاقتين السفليتين قبل الفوتر ==================== */}
      <section className="bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-20">
        <div className={CONTAINER_CLS}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ScrollReveal delay={50}>
              <div className="flex h-full flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-9">
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
            </ScrollReveal>

            <ScrollReveal delay={130}>
              <div className="flex h-full flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-start shadow-sm sm:p-9">
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
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ============================================================================
   ARCHIVED MOBILE APP SHOWCASE SECTION (COMMENTED FOR FUTURE USE WHEN APP IS READY)
   ============================================================================
          <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-28 md:grid-cols-2 lg:gap-16">
            <ScrollReveal className="text-start">
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
                  <span>{t?.app?.point1}</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span>{t?.app?.point2}</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span>{t?.app?.point3}</span>
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
                <a href="#app-store" className="flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 text-white">
                  <div className="text-start">
                    <span className="block text-[9px] text-gray-400">{t?.app?.downloadFrom}</span>
                    <span className="block text-sm font-bold leading-tight">App Store</span>
                  </div>
                </a>
                <a href="#google-play" className="flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 text-white">
                  <div className="text-start">
                    <span className="block text-[9px] text-gray-400">{t?.app?.availableOn}</span>
                    <span className="block text-sm font-bold leading-tight">Google Play</span>
                  </div>
                </a>
              </div>
            </ScrollReveal>
          </div>
============================================================================ */