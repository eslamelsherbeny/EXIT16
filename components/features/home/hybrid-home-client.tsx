'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Plus, ShieldCheck } from 'lucide-react'
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
  LeadingDevelopersSection,
  SponsoredRightAlignedBanner,
  TopUpBalanceGelSection,
} from './home-market-sections'

export type { HomeUnitCardItem }

const CONTAINER_CLS = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8'
const FAVORITES_STORAGE_KEY = 'darak_favorites'

const HOME_CAROUSEL_TITLES: Record<
  LocaleCode,
  {
    superVipTitle: string
    superVipSub: string
    superVipAllBtn: string
    availableOppsBadge: string
    availableOppsTitle: string
    availableOppsSub: string
    availableOppsAllBtn: string
    recentBadge: string
    recentTitle: string
    recentSub: string
    recentAllBtn: string
  }
> = {
  ar: {
    superVipTitle: 'إعلانات SUPER VIP',
    superVipSub: 'أقصى ظهور — أفضل العروض أولاً في صدارة المنصة',
    superVipAllBtn: 'كل SUPER VIP ←',
    availableOppsBadge: 'الفرص المتاحة',
    availableOppsTitle: 'الفرص المتاحة للتنازل',
    availableOppsSub:
      'تصفح وحدات إعادة البيع واستكمال الأقساط المعتمدة بدون أوفر في جورجيا',
    availableOppsAllBtn: 'كل الفرص المتاحة ←',
    recentBadge: 'جديد السوق',
    recentTitle: 'أضيفت حديثاً',
    recentSub: 'إعلانات جديدة مرتبة تنازلياً حسب التاريخ — الأحدث أولاً',
    recentAllBtn: 'كل الجديد ←',
  },
  en: {
    superVipTitle: 'SUPER VIP Listings',
    superVipSub: 'Maximum visibility — top exit offers first',
    superVipAllBtn: 'All SUPER VIP →',
    availableOppsBadge: 'Available Deals',
    availableOppsTitle: 'Available Exit Opportunities',
    availableOppsSub:
      'Explore verified installment takeover units at original contract price in Georgia',
    availableOppsAllBtn: 'All Opportunities →',
    recentBadge: 'New in Market',
    recentTitle: 'Recently Added',
    recentSub: 'Fresh installment exit units sorted by date — newest first',
    recentAllBtn: 'All New →',
  },
  ru: {
    superVipTitle: 'Объявления SUPER VIP',
    superVipSub: 'Максимальный охват — лучшие предложения первыми',
    superVipAllBtn: 'Все SUPER VIP →',
    availableOppsBadge: 'Доступные объекты',
    availableOppsTitle: 'Доступные предложения переуступки',
    availableOppsSub:
      'Проверенные объекты переуступки рассрочки без наценки в Грузии',
    availableOppsAllBtn: 'Все предложения →',
    recentBadge: 'Новинки',
    recentTitle: 'Недавно добавленные',
    recentSub: 'Новые объекты, отсортированные по дате — сначала новые',
    recentAllBtn: 'Все новые →',
  },
  ka: {
    superVipTitle: 'SUPER VIP განცხადებები',
    superVipSub: 'მაქსიმალური ხილვადობა — საუკეთესო შეთავაზებები',
    superVipAllBtn: 'ყველა SUPER VIP →',
    availableOppsBadge: 'ხელმისაწვდომი',
    availableOppsTitle: 'ხელმისაწვდომი შეთავაზებები',
    availableOppsSub: 'გადამოწმებული ობიექტები საქართველოში',
    availableOppsAllBtn: 'ყველა შეთავაზება →',
    recentBadge: 'ახალი',
    recentTitle: 'ახალი დამატებული',
    recentSub: 'ახალი განცხადებები თარიღის მიხედვით — უახლესი პირველ ადგილზე',
    recentAllBtn: 'ყველა ახალი →',
  },
}

export function HybridHomeClient({
  dbUnits,
  realUnitCount,
  formattedValue,
  valueUnitLabel,
}: {
  dbUnits: HomeUnitCardItem[]
  realUnitCount: number
  formattedValue: string
  valueUnitLabel: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const t = dict.home
  const cT = HOME_CAROUSEL_TITLES[locale] || HOME_CAROUSEL_TITLES.ar
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

  // الاعتماد الرسمي 100% على وحدات قاعدة البيانات الحقيقية فقط بدون أي وحدات وهمية
  const allDisplayUnits = useMemo(() => {
    const seen = new Set<string>()
    return (dbUnits || []).filter((u) => {
      if (!u?.id || seen.has(u.id)) return false
      seen.add(u.id)
      return true
    })
  }, [dbUnits])

  // 1. وحدات SUPER VIP الحقيقية من الداتا بيز
  const superVipUnits = useMemo(() => {
    return allDisplayUnits
      .filter(
        (u) =>
          u.isFeatured &&
          (u.boostTier === 'super_vip' || !u.boostTier)
      )
      .map((u) => ({ ...u, boostTier: 'super_vip' as const }))
  }, [allDisplayUnits])

  // 2. وحدات +VIP الحقيقية من الداتا بيز
  const vipPlusUnits = useMemo(() => {
    return allDisplayUnits
      .filter((u) => u.isFeatured && u.boostTier === 'vip_plus')
      .map((u) => ({ ...u, boostTier: 'vip_plus' as const }))
  }, [allDisplayUnits])

  // 3. الفرص المتاحة للتنازل (تظهر قبل أضيفت حديثاً وتوجه إلى /opportunities)
  const availableOpportunitiesUnits = useMemo(() => {
    return [...allDisplayUnits].sort((a, b) => {
      if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) {
        return a.isFeatured ? -1 : 1
      }
      return (b.gainAmount || 0) - (a.gainAmount || 0)
    })
  }, [allDisplayUnits])

  // 4. أحدث الوحدات المضافة مرتبة تنازلياً حسب التاريخ (الأحدث أولاً)
  const recentlyAddedUnits = useMemo(() => {
    return [...allDisplayUnits].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tB - tA
    })
  }, [allDisplayUnits])

  // القاعدة الذكية لظهور SUPER VIP و +VIP وكارت "إعلانك هنا":
  // - إذا لم يوجد لا SUPER VIP ولا +VIP: يظهر قسم SUPER VIP فقط (مع كارت "إعلانك هنا") ويختفي +VIP.
  // - إذا وجد SUPER VIP ولم يوجد +VIP: يظهر SUPER VIP بوحداته، ويظهر +VIP بكارت "إعلانك هنا".
  // - إذا وجد +VIP ولم يوجد SUPER VIP: يظهر SUPER VIP بكارت "إعلانك هنا"، ويظهر +VIP بوحداته.
  const hasSuperVip = superVipUnits.length > 0
  const hasVipPlus = vipPlusUnits.length > 0
  const showVipPlusSection = hasSuperVip || hasVipPlus

  const categoriesGrid = getHomeCategoriesGrid(isAr)
  const comparisonRows = t?.comparison?.rows || []
  const workSteps = t?.steps?.items || []
  const fairStandards = t?.standards?.items || []

  return (
    <div
      dir={dir}
      className="min-h-screen overflow-x-hidden bg-[#f6f8fc] text-[#0f1d40]"
    >
      {/* 1. الهيرو المتخصص في التنازل والأقساط */}
      <section className="aqar-animated-hero relative flex min-h-[640px] items-center overflow-hidden border-b border-slate-200/80 py-10 lg:min-h-[700px] lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="aqar-floating-orb-1" />
          <div className="aqar-floating-orb-2" />
        </div>

        <div
          className={`relative z-10 ${CONTAINER_CLS} grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14`}
        >
          <ScrollReveal className="text-start">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-4 py-1.5 text-xs font-bold text-[#007a5a] shadow-2xs">
              <span className="size-2 animate-pulse rounded-full bg-[#ff6437]" />
              <span>{t?.hero?.badge}</span>
            </span>

            <h1 className="heading-hero text-[#0f1d40]">
              {t?.hero?.titleLine1}
              <br className="hidden sm:inline" /> {t?.hero?.titleLine2}{' '}
              <span className="bg-gradient-to-r from-[#007a5a] via-[#2563eb] to-[#ff6437] bg-clip-text text-transparent">
                {t?.hero?.titleAccentLine1}
                <br className="hidden sm:inline" /> {t?.hero?.titleAccentLine2}
              </span>
            </h1>

            <p className="mt-5 max-w-[585px] text-[13.5px] font-medium leading-[1.95] text-[#475569] sm:text-[15px] lg:text-[15.5px]">
              {t?.hero?.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-start gap-3.5 sm:mt-8">
              <Button
                size="lg"
                className="h-12 flex-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,100,55,0.28)] transition-all hover:scale-[1.02] hover:opacity-95 sm:flex-none sm:px-8 sm:text-[15px]"
                render={<Link href="/sell" />}
              >
                {t?.hero?.sellBtn}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1 rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-[#0f1d40] shadow-xs transition-all hover:border-[#2563eb] hover:bg-blue-50/40 hover:text-[#2563eb] sm:flex-none sm:px-8 sm:text-[15px]"
                render={<Link href="/opportunities" />}
              >
                {t?.hero?.buyBtn}
              </Button>
            </div>

            <div className="mt-6 flex items-start justify-start gap-2 text-[11px] font-medium leading-relaxed text-slate-500 sm:items-center sm:text-xs">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#007a5a] sm:mt-0" />
              <p>{t?.hero?.trustNote}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal
            delay={120}
            className="relative mx-auto flex w-full max-w-[460px] flex-col items-center gap-4 lg:me-0"
          >
            <div className="w-full rounded-[22px] border border-rose-200/80 bg-white/95 p-5 text-[#0f1d40] shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 sm:p-6">
              <div className="flex items-center justify-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                  ✕
                </span>
                <p className="text-sm font-bold text-[#0f1d40]">
                  {t?.hero?.lossCardTitle}
                </p>
              </div>

              <div className="mt-5 flex items-end justify-between gap-2">
                <div className="text-start">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    {t?.hero?.lossCardLabel}
                  </p>
                  <strong className="mt-1 flex items-baseline gap-1.5 text-xl font-bold text-rose-600 tabular-nums sm:text-[26px]">
                    <span dir="ltr">- {t?.hero?.lossCardAmount}</span>
                    <span>{USD}</span>
                  </strong>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                    {t?.hero?.lossCardDurationLabel}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700 sm:text-base">
                    {t?.hero?.lossCardDurationValue}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-rose-50/80 px-4 py-2.5 text-center text-[11px] font-semibold text-rose-600 sm:text-xs">
                {t?.hero?.lossCardFooter}
              </div>
            </div>

            <div className="z-20 -my-6 flex size-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-[#2563eb] to-[#007a5a] text-[11px] font-bold uppercase text-white shadow-md">
              vs
            </div>

            <div className="w-full rounded-[22px] border-2 border-[#007a5a] bg-white p-5 text-[#0f1d40] shadow-2xl transition hover:-translate-y-0.5 sm:p-6">
              <div className="flex items-center justify-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#d8f3e5] text-xs font-bold text-[#007a5a]">
                  ✓
                </span>
                <p className="text-sm font-bold text-[#0f1d40]">
                  {t?.hero?.winCardTitle}
                </p>
              </div>

              <div className="mt-5 text-start">
                <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  {t?.hero?.winCardLabel}
                </p>
                <strong className="mt-1 flex items-baseline gap-1.5 text-2xl font-bold text-[#007a5a] tabular-nums sm:text-[32px]">
                  <span dir="ltr">{t?.hero?.winCardAmount}</span>
                  <span>{USD}</span>
                </strong>
                <p className="mt-1 text-xs font-bold text-[#0f1d40]">
                  {t?.hero?.winCardSub}
                </p>
              </div>

              <div className="mt-5 rounded-xl bg-[#eaf8f2] px-4 py-2.5 text-center text-[11px] font-bold text-[#007a5a] sm:text-xs">
                {t?.hero?.winCardFooter}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. شريط الإحصائيات الموثقة بالدولار ($) */}
      <section className={`${CONTAINER_CLS} pt-10 pb-4`}>
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

      {/* 3. ماذا تبحث عنه للتنازل؟ */}
      <section className={`${CONTAINER_CLS} py-10`}>
        <ScrollReveal>
          <div className="mb-6 text-start">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
              {isAr
                ? 'ماذا تبحث عنه للتنازل؟'
                : 'What are you looking for to take over?'}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {isAr
                ? 'اختر نوع الوحدة وتصفح أفضل عروض التنازل واستكمال الأقساط في جورجيا'
                : 'Choose unit type and explore verified installment exit opportunities'}
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

      {/* 4. قسم إعلانات SUPER VIP (يظهر دائماً: إما بوحداته أو بكارت "اعرض إعلانك هنا" إذا كان فارغاً) */}
      <HomeCardsCarouselSection
        badgeText="SUPER VIP"
        badgeClass="bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-xs"
        title={cT.superVipTitle}
        subtitle={cT.superVipSub}
        allLinkText={cT.superVipAllBtn}
        allLinkHref="/opportunities?tier=super_vip"
        units={superVipUnits}
        favorites={favorites}
        onToggleFav={toggleFav}
        showAdCardWhenEmpty={true}
        adTier="SUPER VIP"
      />

      {/* 5. قسم إعلانات +VIP (يظهر إذا كان هناك وحدات في SUPER VIP أو في +VIP، ويعرض كارت "اعرض إعلانك هنا" إذا كان فارغاً) */}
      {showVipPlusSection && (
        <HomeVipPlusSection
          vipPlusUnits={vipPlusUnits}
          favorites={favorites}
          onToggleFav={toggleFav}
          showWhenEmpty={hasSuperVip}
        />
      )}

      {/* 6. قسم الفرص المتاحة للتنازل (قبل أضيفت حديثاً مباشرةً، ويفتح /opportunities) */}
      <HomeCardsCarouselSection
        badgeText={cT.availableOppsBadge}
        badgeClass="bg-[#eaf8f2] text-[#007a5a] border border-emerald-200"
        title={cT.availableOppsTitle}
        subtitle={cT.availableOppsSub}
        allLinkText={cT.availableOppsAllBtn}
        allLinkHref="/opportunities"
        units={availableOpportunitiesUnits.slice(0, 12)}
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 7. قسم أضيفت حديثاً (مرتب تنازلياً حسب التاريخ، ويفتح /opportunities?sort=newest) */}
      <HomeCardsCarouselSection
        badgeText={cT.recentBadge}
        badgeClass="bg-blue-50 text-[#2563eb] border border-blue-200"
        title={cT.recentTitle}
        subtitle={cT.recentSub}
        allLinkText={cT.recentAllBtn}
        allLinkHref="/opportunities?sort=newest"
        units={recentlyAddedUnits.slice(0, 12)}
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 8. بانر الترويج المتوسط */}
      <SponsoredRightAlignedBanner />

      {/* 9. خريطة جورجيا ثلاثية الأبعاد */}
      <Home3DMapSection />

      {/* 10. لمن هذه المنصة؟ */}
      <section className={`${CONTAINER_CLS} py-12 md:py-16`}>
        <ScrollReveal className="max-w-xl text-start">
          <h2 className="heading-section">{t?.audience?.title}</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-gray-500 sm:text-base">
            {t?.audience?.subtitle}
          </p>
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal delay={60}>
            <div className="sivrce-card flex h-full flex-col justify-between rounded-[24px] border border-emerald-200/80 bg-white p-6 text-start shadow-xs sm:p-9">
              <div>
                <span className="inline-block rounded-full bg-[#e6f4f1] px-3.5 py-1 text-xs font-bold text-[#007a5a]">
                  {t?.audience?.sellerBadge}
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#0f1d40] sm:text-2xl">
                  {t?.audience?.sellerTitle}
                </h3>
                <p className="mt-3 text-xs leading-[1.9] text-gray-500 sm:text-sm">
                  {t?.audience?.sellerDesc}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                    <span>{t?.audience?.sellerPoint1}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                    <span>{t?.audience?.sellerPoint2}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                    <span>{t?.audience?.sellerPoint3}</span>
                  </li>
                </ul>

                <div className="mt-6 rounded-xl border border-[#b8e6d5] bg-[#eaf8f2] px-4 py-3 text-xs font-bold text-[#007a5a] sm:text-sm">
                  {t?.audience?.sellerFreeNote}
                </div>
              </div>

              <div className="mt-7">
                <Button
                  className="h-11 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-xs font-bold text-white shadow-xs hover:opacity-95 sm:text-sm"
                  render={<Link href="/sell" />}
                >
                  {t?.audience?.sellerBtn}
                </Button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <div className="sivrce-card flex h-full flex-col justify-between rounded-[24px] border border-blue-200/80 bg-gradient-to-br from-white via-[#f4f8ff] to-[#eef6ff] p-6 text-start text-[#0f1d40] shadow-xs sm:p-9">
              <div>
                <span className="inline-block rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-[#2563eb]">
                  {t?.audience?.buyerBadge}
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#0f1d40] sm:text-2xl">
                  {t?.audience?.buyerTitle}
                </h3>
                <p className="mt-3 text-xs leading-[1.9] text-slate-600 sm:text-sm">
                  {t?.audience?.buyerDesc}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
                    <span>{t?.audience?.buyerPoint1}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
                    <span>{t?.audience?.buyerPoint2}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
                    <span>{t?.audience?.buyerPoint3}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  className="h-11 rounded-full bg-[#2563eb] px-7 text-xs font-bold text-white shadow-xs hover:bg-blue-700 sm:text-sm"
                  render={<Link href="/opportunities" />}
                >
                  {t?.audience?.buyerBtn}
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 11. شركات التطوير الرائدة في جورجيا */}
      <LeadingDevelopersSection realUnitCount={realUnitCount} />

      {/* 12. جدول المقارنة */}
      <section className="bg-white py-14 sm:py-16">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.comparison?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.comparison?.subtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal
            delay={80}
            className="mt-8 overflow-hidden rounded-[22px] border border-gray-200/90 shadow-xs sm:mt-10"
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

      {/* 13. مثال واقعي بالأرقام بالدولار ($) */}
      <section className="bg-[#f6f8fc] py-14 sm:py-16">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.example?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.example?.subtitle}
            </p>
          </ScrollReveal>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <ScrollReveal delay={60}>
              <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-8">
                <div>
                  <div className="flex items-center justify-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecee] text-xs font-bold text-[#d9383a]">
                      ✕
                    </span>
                    <h3 className="text-base font-bold text-[#0f1d40]">
                      {t?.example?.lossTitle}
                    </h3>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs text-gray-400">
                      {t?.example?.lossDiscountLabel}
                    </p>
                    <p className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold text-[#d9383a] tabular-nums sm:text-3xl">
                      <span dir="ltr">- {t?.example?.lossDiscountAmount}</span>
                      <span>{USD}</span>
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                    <div className="text-start">
                      <p className="text-xs text-gray-400">
                        {t?.example?.lossReturnLabel}
                      </p>
                      <p className="mt-1 flex items-baseline gap-1 text-lg font-bold text-[#0f1d40] tabular-nums sm:text-xl">
                        <span dir="ltr">{t?.example?.lossReturnAmount}</span>
                        <span>{USD}</span>
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-gray-400">
                        {t?.example?.lossDurationLabel}
                      </p>
                      <p className="mt-1 text-lg font-bold text-[#b45309] sm:text-xl">
                        {t?.example?.lossDurationValue}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-xl bg-[#fef2f2] px-4 py-3 text-center text-xs font-bold text-[#d9383a]">
                  {t?.example?.lossFooter}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border-2 border-[#a7e3cb] bg-white p-6 text-start shadow-xs sm:p-8">
                <div>
                  <div className="flex items-center justify-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e3f7ed] text-xs font-bold text-[#007a5a]">
                      ✓
                    </span>
                    <h3 className="text-base font-bold text-[#0f1d40]">
                      {t?.example?.winTitle}
                    </h3>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs text-gray-400">
                      {t?.example?.winReturnLabel}
                    </p>
                    <p className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold text-[#007a5a] tabular-nums sm:text-3xl">
                      <span dir="ltr">{t?.example?.winReturnAmount}</span>
                      <span>{USD}</span>
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#0f1d40]">
                      {t?.example?.winReturnSub}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                      {t?.example?.winCommissionLabel}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#007a5a]">
                      {t?.example?.winCommissionValue}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#0f1d40]">
                      {t?.example?.winCommissionSub}
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-xl bg-[#eaf8f2] px-4 py-3 text-center text-xs font-bold text-[#007a5a]">
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

      {/* 14. إزاي بنشتغل في 5 خطوات */}
      <section className="border-t border-gray-200/60 bg-[#f6f8fc] py-14 sm:py-16">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.steps?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.steps?.subtitle}
            </p>
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

      {/* 15. معايير الأمان والتوثيق */}
      <section className="bg-white py-14 sm:py-16">
        <div className={CONTAINER_CLS}>
          <ScrollReveal className="text-start">
            <h2 className="heading-section">{t?.standards?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {t?.standards?.subtitle}
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-2 md:gap-y-10">
            {fairStandards.map((item: any, idx: number) => (
              <ScrollReveal key={item.title} delay={idx * 60}>
                <div className="flex items-start gap-4 text-start">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#0f1d40]">
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

      {/* 16. بانر حاسبة الخروج المجانية */}
      <section className={`${CONTAINER_CLS} pt-12 pb-4`}>
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[28px] border border-blue-200/80 bg-gradient-to-r from-[#eef5ff] via-[#f4fbf7] to-[#fff5f0] p-8 text-center shadow-xs sm:p-12">
            <h2 className="text-2xl font-bold text-[#0f1d40] sm:text-3xl md:text-4xl">
              {t?.calculatorBanner?.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm md:text-base">
              {t?.calculatorBanner?.subtitle}
            </p>
            <div className="mt-7">
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

      {/* 17. قسم شحن الرصيد وباقات الإعلانات */}
      <TopUpBalanceGelSection />

      {/* 18. كارتا الختام قبل الفوتر */}
      <section className="bg-[#f6f8fc] pb-16 pt-4 sm:pb-20">
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