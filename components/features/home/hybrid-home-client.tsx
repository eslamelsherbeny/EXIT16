'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  getHomeCategoriesGrid,
  type HomeUnitCardItem,
} from './home-data'
import {
  HomeCardsCarouselSection,
  HomeVipPlusSection,
} from './home-property-card'
import { Home3DMapSection } from './home-3d-map-section'
import {
  SponsoredRightAlignedBanner,
  TopUpBalanceGelSection,
} from './home-market-sections'
import {
  ActiveBoostFloatingWidget,
  type MyActiveBoostItem,
} from './active-boost-floating-widget'

export type { HomeUnitCardItem }

const CONTAINER_CLS = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8'
const FAVORITES_STORAGE_KEY = 'darak_favorites'

function HeroMatteArchitecturalBackdrop({ isRtl }: { isRtl: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#112447] select-none"
    >
      {/* غلاف منفصل لقلب الاتجاه في LTR حتى لا يتعارض مع أنيميشن حركة الكاميرا */}
      <div className={`absolute inset-0 ${isRtl ? '' : '-scale-x-100'}`}>
        <div
          className="hero-ken-burns absolute inset-0 bg-cover bg-no-repeat bg-[54%_45%] sm:bg-[48%_52%] lg:bg-[32%_60%]"
          style={{
            backgroundImage: 'url("/hero-home.jpg")',
            opacity: 0.78,
            filter: 'brightness(1.12) saturate(1.06) contrast(1.04)',
          }}
        />
      </div>

      {/* تدرج عمودي ناعم ومفتوح مخصص للموبايل والتابلت لضمان وضوح النص والبيت معاً */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(16,35,70,0.82) 0%, rgba(16,38,74,0.62) 44%, rgba(14,48,68,0.48) 72%, rgba(15,34,66,0.72) 100%)',
        }}
      />

      {/* تدرج أفقي مفتوح للكمبيوتر: يحفظ قراءة النص على اليمين ويكشف البيت بإضاءة دافئة في الوسط واليسار */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          background: isRtl
            ? 'linear-gradient(270deg, rgba(16,35,70,0.84) 0%, rgba(16,38,74,0.58) 40%, rgba(14,54,72,0.22) 72%, rgba(12,68,68,0.32) 100%)'
            : 'linear-gradient(90deg, rgba(16,35,70,0.84) 0%, rgba(16,38,74,0.58) 40%, rgba(14,54,72,0.22) 72%, rgba(12,68,68,0.32) 100%)',
        }}
      />

      {/* توهج زمردي وسماوي خفيف متحرك يعطي إشراقة وعمق عصري للهيرو */}
      <div
        className="hero-ambient-glow absolute -top-24 size-[360px] rounded-full blur-[95px] sm:size-[480px]"
        style={{
          [isRtl ? 'left' : 'right']: '-6%',
          background:
            'radial-gradient(circle, rgba(46,229,157,0.26) 0%, rgba(56,189,248,0.10) 45%, transparent 72%)',
        }}
      />

      {/* دمج ناعم جداً عند الحافة العلوية والسفلية */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(16,35,70,0.28) 0%, transparent 18%, transparent 84%, rgba(16,35,70,0.44) 100%)',
        }}
      />
    </div>
  )
}

export function HybridHomeClient({
  dbUnits,
  realUnitCount,
  formattedValue,
  valueUnitLabel,
  myActiveBoosts = [],
}: {
  dbUnits: HomeUnitCardItem[]
  realUnitCount: number
  formattedValue: string
  valueUnitLabel: string
  myActiveBoosts?: MyActiveBoostItem[]
}) {
  const { t: dict, locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const isRtl = dir === 'rtl'
  const t = dict.home
  const cT = dict.home.carouselTitles
  const USD = '$'

  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setFavorites(parsed.map(String))
      }
    } catch {}
  }, [])

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const idStr = String(id)
      const next = prev.includes(idStr)
        ? prev.filter((x) => x !== idStr)
        : [...prev, idStr]
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
        window.dispatchEvent(new Event('favorites-updated'))
      } catch {}
      return next
    })
  }

  const allDisplayUnits = useMemo(() => {
    const seen = new Set<string>()
    return (dbUnits || []).filter((u) => {
      if (!u?.id || seen.has(u.id)) return false
      seen.add(u.id)
      return true
    })
  }, [dbUnits])

  const superVipUnits = useMemo(() => {
    return allDisplayUnits
      .filter(
        (u) =>
          u.isFeatured &&
          (u.boostTier === 'super_vip' || !u.boostTier)
      )
      .map((u) => ({ ...u, boostTier: 'super_vip' as const }))
  }, [allDisplayUnits])

  const vipPlusUnits = useMemo(() => {
    return allDisplayUnits
      .filter((u) => u.isFeatured && u.boostTier === 'vip_plus')
      .map((u) => ({ ...u, boostTier: 'vip_plus' as const }))
  }, [allDisplayUnits])

  const availableOpportunitiesUnits = useMemo(() => {
    return [...allDisplayUnits].sort((a, b) => {
      if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) {
        return a.isFeatured ? -1 : 1
      }
      return (b.gainAmount || 0) - (a.gainAmount || 0)
    })
  }, [allDisplayUnits])

  const recentlyAddedUnits = useMemo(() => {
    return [...allDisplayUnits].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tB - tA
    })
  }, [allDisplayUnits])

  const hasSuperVip = superVipUnits.length > 0
  const hasVipPlus = vipPlusUnits.length > 0
  const showVipPlusSection = hasSuperVip || hasVipPlus

  const categoriesGrid = getHomeCategoriesGrid(activeLocale)
  const comparisonRows = t?.comparison?.rows || []
  const workSteps = t?.steps?.items || []

  return (
    <div
      dir={dir}
      className="min-h-screen overflow-x-hidden bg-[#f6f8fc] text-[#0f1d40]"
    >
      {/* الويدجت العائم لصاحب الإعلان النشط فقط */}
      <ActiveBoostFloatingWidget items={myActiveBoosts} />

      {/* 1. الهيرو المعماري المشرق والمتجاوب مع أنيميشن سينمائي هادئ */}
      <section className="relative flex items-center overflow-hidden bg-[#112447] py-8 text-white sm:py-11 lg:min-h-[590px] lg:py-14">
        <HeroMatteArchitecturalBackdrop isRtl={isRtl} />

        <div
          className={`relative z-10 ${CONTAINER_CLS} grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[1.14fr_0.86fr] lg:gap-14`}
        >
          <ScrollReveal className="text-start">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-[#0f2544]/65 px-3.5 py-1.5 text-[11px] font-bold text-[#6ee7b7] backdrop-blur-md sm:mb-5 sm:px-4 sm:text-xs">
              <span className="size-2 animate-pulse rounded-full bg-[#2ee59d]" />
              <span>{t?.hero?.badge}</span>
            </span>

            <h1 className="heading-hero text-white drop-shadow-[0_2px_14px_rgba(8,19,41,0.35)]">
              {t?.hero?.titleLine1}
              <br className="hidden sm:inline" /> {t?.hero?.titleLine2}{' '}
              <span className="bg-gradient-to-l from-[#2ee59d] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                {t?.hero?.titleAccentLine1}
                <br className="hidden sm:inline" /> {t?.hero?.titleAccentLine2}
              </span>
            </h1>

            <p className="mt-4 max-w-[575px] text-[13.5px] font-medium leading-[1.85] text-slate-100/95 sm:mt-5 sm:text-[15px] sm:leading-[1.95] lg:text-[15.5px]">
              {t?.hero?.description}
            </p>

            {/* أزرار متناسقة جنباً إلى جنب على الموبايل والكمبيوتر */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:justify-start sm:gap-3.5">
              <Button
                size="lg"
                className="h-11 w-full rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(255,100,55,0.38)] transition-all hover:scale-[1.02] hover:opacity-95 sm:h-12 sm:w-auto sm:px-8 sm:text-[15px]"
                render={<Link href="/sell" />}
              >
                {t?.hero?.sellBtn}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 w-full rounded-full border border-white/30 bg-white/12 px-4 text-[13px] font-bold text-white backdrop-blur-md transition-all hover:border-emerald-300/65 hover:bg-white/20 hover:text-white sm:h-12 sm:w-auto sm:px-8 sm:text-[15px]"
                render={<Link href="/opportunities" />}
              >
                {t?.hero?.buyBtn}
              </Button>
            </div>

            <div className="mt-5 flex items-start justify-start gap-2 text-[11px] font-medium leading-relaxed text-slate-200/95 sm:mt-6 sm:items-center sm:text-xs">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#2ee59d] sm:mt-0" />
              <p>{t?.hero?.trustNote}</p>
            </div>
          </ScrollReveal>

          {/* كارتا المقارنة البيض بتباين واضح وتنسيق مشدود على الموبايل */}
          <ScrollReveal
            delay={120}
            className="relative mx-auto flex w-full max-w-[460px] flex-col items-center gap-3.5 sm:gap-4 lg:me-0"
          >
            <div className="w-full rounded-[20px] border border-white/25 bg-white/97 p-4 text-[#0f1d40] shadow-[0_22px_50px_-14px_rgba(8,19,41,0.42)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 sm:rounded-[22px] sm:p-6">
              <div className="flex items-center justify-start gap-2.5 sm:gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-600 sm:size-7 sm:text-xs">
                  ✕
                </span>
                <p className="text-[13px] font-bold text-[#0f1d40] sm:text-sm">
                  {t?.hero?.lossCardTitle}
                </p>
              </div>

              <div className="mt-3.5 flex items-end justify-between gap-2 sm:mt-4">
                <div className="text-start">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    {t?.hero?.lossCardLabel}
                  </p>
                  <strong className="mt-1 block text-xl font-bold text-rose-600 tabular-nums sm:text-[26px]">
                    <span dir="ltr" className="inline-block">
                      -{USD}
                      {t?.hero?.lossCardAmount}
                    </span>
                  </strong>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    {t?.hero?.lossCardDurationLabel}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-700 sm:text-base">
                    {t?.hero?.lossCardDurationValue}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 rounded-xl bg-rose-50 px-3 py-2 text-center text-[11px] font-semibold text-rose-600 sm:mt-4 sm:px-4 sm:py-2.5 sm:text-xs">
                {t?.hero?.lossCardFooter}
              </div>
            </div>

            <div className="hero-vs-pulse z-20 -my-5 flex size-8 items-center justify-center rounded-full border-2 border-[#112447] bg-gradient-to-r from-[#007a5a] to-[#2ee59d] text-[10px] font-black uppercase text-white shadow-lg sm:-my-6 sm:size-9 sm:text-[11px]">
              vs
            </div>

            <div className="w-full rounded-[20px] border-2 border-[#2ee59d] bg-white p-4 text-[#0f1d40] shadow-[0_24px_55px_-12px_rgba(0,122,90,0.45)] transition duration-300 hover:-translate-y-1 sm:rounded-[22px] sm:p-6">
              <div className="flex items-center justify-start gap-2.5 sm:gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d8f3e5] text-[11px] font-bold text-[#007a5a] sm:size-7 sm:text-xs">
                  ✓
                </span>
                <p className="text-[13px] font-bold text-[#0f1d40] sm:text-sm">
                  {t?.hero?.winCardTitle}
                </p>
              </div>

              <div className="mt-3.5 text-start sm:mt-4">
                <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  {t?.hero?.winCardLabel}
                </p>
                <strong className="mt-1 block text-2xl font-bold text-[#007a5a] tabular-nums sm:text-[32px]">
                  <span dir="ltr" className="inline-block">
                    {USD}
                    {t?.hero?.winCardAmount}
                  </span>
                </strong>
                <p className="mt-1 text-xs font-bold text-[#0f1d40]">
                  {t?.hero?.winCardSub}
                </p>
              </div>

              <div className="mt-3.5 rounded-xl bg-[#eaf8f2] px-3 py-2 text-center text-[11px] font-bold text-[#007a5a] sm:mt-4 sm:px-4 sm:py-2.5 sm:text-xs">
                {t?.hero?.winCardFooter}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. ماذا تبحث عنه للتنازل؟ */}
      <section className={`${CONTAINER_CLS} pt-10 pb-6`}>
        <ScrollReveal>
          <div className="mb-6 text-start">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
              {cT.categoriesTitle}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {cT.categoriesSub}
            </p>
          </div>

          <div className="grid auto-cols-[115px] grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-2 no-scrollbar md:auto-cols-auto md:grid-flow-row md:grid-cols-8 md:grid-rows-2">
            {categoriesGrid.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className="sivrce-card flex min-h-[116px] flex-col items-center justify-center rounded-[22px] border border-slate-200/75 bg-white p-3.5 text-center shadow-2xs"
                >
                  <div
                    className={`mb-2.5 flex size-11 items-center justify-center rounded-2xl ${cat.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <strong className="text-xs font-bold text-[#0f1d40]">
                    {cat.label}
                  </strong>
                </Link>
              )
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* 3. قسم إعلانات SUPER VIP */}
      <div
        className={
          !hasSuperVip ? '[&_a[href*="/opportunities"]]:hidden' : undefined
        }
      >
        <HomeCardsCarouselSection
          badgeText="SUPER VIP"
          badgeClass="bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-xs"
          title={cT.superVipTitle}
          subtitle={cT.superVipSub}
          allLinkText={hasSuperVip ? cT.superVipAllBtn : ''}
          allLinkHref={hasSuperVip ? '/opportunities?tier=super_vip' : ''}
          units={superVipUnits}
          favorites={favorites}
          onToggleFav={toggleFav}
          showAdCardWhenEmpty={true}
          adTier="SUPER VIP"
        />
      </div>

      {/* 4. قسم إعلانات +VIP */}
      {showVipPlusSection && (
        <div
          className={
            !hasVipPlus ? '[&_a[href*="/opportunities"]]:hidden' : undefined
          }
        >
          <HomeVipPlusSection
            vipPlusUnits={vipPlusUnits}
            favorites={favorites}
            onToggleFav={toggleFav}
            showWhenEmpty={hasSuperVip}
          />
        </div>
      )}

      {/* 5. جدول المقارنة السريع */}
      <section className="bg-white py-12 sm:py-14">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.comparison?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.comparison?.subtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal
            delay={80}
            className="mt-6 overflow-hidden rounded-[22px] border border-gray-200/90 shadow-xs sm:mt-8"
          >
            <div className="grid grid-cols-[80px_1fr_1.1fr] text-start text-[11px] font-bold sm:grid-cols-[130px_1fr_1fr] sm:text-xs md:grid-cols-[150px_1fr_1fr] md:text-sm">
              <div className="flex items-center bg-[#f4f5f7] px-3 py-3.5 text-[10px] font-bold text-gray-500 sm:p-4 sm:text-xs">
                {t?.comparison?.colCriterion}
              </div>
              <div className="flex items-center border-r border-gray-200/80 bg-[#f4f5f7] px-3 py-3.5 text-gray-600 sm:p-4">
                {t?.comparison?.colResale}
              </div>
              <div className="flex items-center bg-[#2563eb] px-3 py-3.5 text-white sm:p-4">
                {t?.comparison?.colExit}
              </div>
            </div>

            {comparisonRows.map((row: any) => (
              <div
                key={row.criterion}
                className="grid grid-cols-[80px_1fr_1.1fr] items-stretch border-t border-gray-200/80 text-start text-[11px] leading-relaxed sm:grid-cols-[130px_1fr_1fr] sm:text-xs md:grid-cols-[150px_1fr_1fr] lg:text-sm"
              >
                <div className="flex items-center bg-[#f8f9fa] px-3 py-3.5 font-bold text-[#0f1d40] sm:p-4">
                  {row.criterion}
                </div>

                <div className="flex items-start gap-1.5 border-r border-gray-200/80 bg-white px-3 py-3.5 text-gray-500 sm:items-center sm:gap-2.5 sm:p-4">
                  <span className="mt-0.5 shrink-0 font-bold text-red-500 sm:mt-0">
                    ✕
                  </span>
                  <span>{row.resale}</span>
                </div>

                <div className="flex items-start gap-1.5 bg-[#eaf8f2] px-3 py-3.5 font-semibold text-[#0f1d40] sm:items-center sm:gap-2.5 sm:p-4">
                  <span className="mt-0.5 shrink-0 font-bold text-[#007a5a] sm:mt-0">
                    ✓
                  </span>
                  <span>{row.exit}</span>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* 6. قسم الفرص المتاحة للتنازل */}
      <HomeCardsCarouselSection
        badgeText={cT.availableOppsBadge}
        badgeClass="bg-[#eaf8f2] text-[#007a5a] border border-emerald-200"
        title={cT.availableOppsTitle}
        subtitle={cT.availableOppsSub}
        allLinkText={
          availableOpportunitiesUnits.length > 0 ? cT.availableOppsAllBtn : ''
        }
        allLinkHref={
          availableOpportunitiesUnits.length > 0 ? '/opportunities' : ''
        }
        units={availableOpportunitiesUnits.slice(0, 12)}
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 7. بانر حاسبة الخروج المجانية */}
      <section className={`${CONTAINER_CLS} py-6`}>
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[28px] border border-blue-200/80 bg-gradient-to-r from-[#eef5ff] via-[#f4fbf7] to-[#fff5f0] p-7 text-center shadow-xs sm:p-11">
            <h2 className="text-2xl font-bold text-[#0f1d40] sm:text-3xl md:text-4xl">
              {t?.calculatorBanner?.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm md:text-base">
              {t?.calculatorBanner?.subtitle}
            </p>
            <div className="mt-6">
              <Button
                size="lg"
                className="h-12 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-8 text-sm font-bold text-white shadow-md hover:opacity-95 sm:text-base"
                render={<Link href="/calculator" />}
              >
                {t?.calculatorBanner?.btn}
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 8. قسم أضيفت حديثاً */}
      <HomeCardsCarouselSection
        badgeText={cT.recentBadge}
        badgeClass="bg-blue-50 text-[#2563eb] border border-blue-200"
        title={cT.recentTitle}
        subtitle={cT.recentSub}
        allLinkText={recentlyAddedUnits.length > 0 ? cT.recentAllBtn : ''}
        allLinkHref={
          recentlyAddedUnits.length > 0 ? '/opportunities?sort=newest' : ''
        }
        units={recentlyAddedUnits.slice(0, 12)}
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 9. البانر الترويجي */}
      <SponsoredRightAlignedBanner />

      {/* 10. إزاي بنشتغل في 5 خطوات */}
      <section className="border-t border-gray-200/60 bg-[#f6f8fc] py-12 sm:py-14">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="flex flex-wrap items-end justify-between gap-4 text-start">
            <div>
              <h2 className="heading-section">{t?.steps?.title}</h2>
              <p className="mt-2 text-sm text-gray-500 sm:text-base">
                {t?.steps?.subtitle}
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
            >
              {cT.howItWorksMoreLink}
            </Link>
          </ScrollReveal>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workSteps.map((step: any, index: number) => (
              <ScrollReveal key={step.title} delay={index * 70}>
                <div className="sivrce-card h-full rounded-[20px] border border-gray-200/70 bg-white p-6 text-start shadow-2xs">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-sm font-bold text-white shadow-xs">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[#0f1d40]">
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

      {/* 11. خريطة جورجيا ثلاثية الأبعاد */}
      <div className="mt-4">
        <Home3DMapSection />
      </div>

      {/* 12. سيكشن باقات الإعلانات */}
      <TopUpBalanceGelSection />

      {/* 13. شريط الإحصائيات الموثقة بالدولار ($) */}
      <section className={`${CONTAINER_CLS} pt-4 pb-6`}>
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[22px] border border-gray-200/70 border-t-[3px] border-t-[#007a5a] bg-white shadow-xs md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-x-reverse">
            <div className="p-7 text-start sm:p-9">
              <p className="text-xs font-bold text-gray-500">
                {t?.stats?.unitsTitle}
              </p>
              <div className="mt-3 flex items-baseline justify-start gap-2">
                <span
                  dir="ltr"
                  className="text-4xl font-bold tracking-tight text-[#0f1d40] tabular-nums sm:text-5xl"
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

            <div className="p-7 text-start sm:p-9">
              <p className="text-xs font-bold text-gray-500">
                {t?.stats?.valueTitle}
              </p>
              <div className="mt-3 flex items-baseline justify-start gap-2">
                <span
                  dir="ltr"
                  className="text-4xl font-bold tracking-tight text-[#0f1d40] tabular-nums sm:text-5xl"
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

      {/* 14. كارتا الختام قبل الفوتر */}
      <section className="bg-[#f6f8fc] pb-16 pt-6 sm:pb-20">
        <div className={CONTAINER_CLS}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ScrollReveal delay={50}>
              <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-9">
                <div>
                  <h3 className="text-xl font-bold text-[#0f1d40] sm:text-2xl">
                    {t?.bottomCta?.sellerTitle}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                    {t?.bottomCta?.sellerDesc}
                  </p>
                </div>
                <div className="mt-7">
                  <Button
                    className="h-11 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-xs font-bold text-white hover:opacity-95 sm:text-sm"
                    render={<Link href="/sell" />}
                  >
                    <Plus className="me-1.5 size-4" />
                    {t?.bottomCta?.sellerBtn}
                  </Button>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={130}>
              <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-9">
                <div>
                  <h3 className="text-xl font-bold text-[#0f1d40] sm:text-2xl">
                    {t?.bottomCta?.buyerTitle}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                    {t?.bottomCta?.buyerDesc}
                  </p>
                </div>
                <div className="mt-7">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border border-slate-300 bg-white px-7 text-xs font-bold text-[#0f1d40] hover:border-[#2563eb] hover:bg-blue-50/40 hover:text-[#2563eb] sm:text-sm"
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