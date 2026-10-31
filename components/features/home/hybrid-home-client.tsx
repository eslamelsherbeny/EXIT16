'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Play, Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import {
  FALLBACK_SHOWCASE_UNITS,
  getHomeCategoriesGrid,
  SHOWCASE_IMAGES,
  type HomeUnitCardItem,
} from './home-data'
import { HomeHero } from './home-hero'
import { HomeCardsCarouselSection } from './home-property-card'
import { Home3DMapSection } from './home-3d-map-section'
import { HomeMarketAndBottomSections } from './home-market-sections'

export type { HomeUnitCardItem }

export function HybridHomeClient({
  dbUnits,
  realUnitCount,
}: {
  dbUnits: HomeUnitCardItem[]
  realUnitCount: number
  formattedValue?: string
  valueUnitLabel?: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const t = dict.home
  const GEL = '₾'

  const [favorites, setFavorites] = useState<string[]>([])

  // دمج وحدات قاعدة البيانات مع الوحدات الاحتياطية لضمان وجود 8 كروت على الأقل للتقليب السلس
  const displayUnits = useMemo(() => {
    const combined = [...(dbUnits || []), ...FALLBACK_SHOWCASE_UNITS]
    const seen = new Set<string>()
    return combined
      .filter((u) => {
        if (seen.has(u.id)) return false
        seen.add(u.id)
        return true
      })
      .slice(0, 8)
  }, [dbUnits])

  const toggleFav = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const categoriesGrid = getHomeCategoriesGrid(isAr)

  const storiesItems = [
    {
      name: isAr ? 'ديدي ديغومي' : 'Didi Dighomi',
      price: '2,232 ₾',
      img: SHOWCASE_IMAGES.park,
      href: '/opportunities?area=Tbilisi+-+Didi+Digomi',
    },
    {
      name: isAr ? 'ساحل باتومي' : 'Batumi Coast',
      price: '428,498 ₾',
      img: SHOWCASE_IMAGES.coast,
      href: '/opportunities?area=Batumi+-+New+Boulevard',
    },
    {
      name: isAr ? 'ديغومي ماسيف' : 'Dighmis Masivi',
      price: '169,614 ₾',
      img: SHOWCASE_IMAGES.project,
      href: '/opportunities?area=Tbilisi+-+Saburtalo',
    },
    {
      name: isAr ? 'فاكي بارك' : 'Vake Park',
      price: '340,000 ₾',
      img: SHOWCASE_IMAGES.villa,
      href: '/opportunities?area=Tbilisi+-+Vake',
    },
  ]

  return (
    <div
      dir={dir}
      className="min-h-screen overflow-x-hidden bg-[#f6f8fc] text-[#0f1d40]"
    >
      {/* 1. الهيرو بالتدرج اللوني المتحرك والمباني بدون الخطين المنحنيين */}
      <HomeHero realUnitCount={realUnitCount} />

      {/* 2. قسم القصص (مفصول بوضوح عن الهيرو بخلفية بيضاء وحدود ناعمة) */}
      <section className="border-b border-slate-200/75 bg-white py-6">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span className="text-[#ff6437]">◉</span>
              <span>{isAr ? 'قصص · إعلان' : 'STORIES · SPONSORED'}</span>
            </span>

            <div className="flex items-center gap-6 overflow-x-auto py-1 no-scrollbar">
              {storiesItems.map((st) => (
                <Link
                  key={st.name}
                  href={st.href}
                  className="group flex shrink-0 flex-col items-center text-center"
                >
                  <div className="relative size-20 rounded-full bg-gradient-to-tr from-[#ff6437] to-[#2563eb] p-[2.5px] transition group-hover:scale-105">
                    <img
                      src={st.img}
                      alt={st.name}
                      className="h-full w-full rounded-full border-2 border-white object-cover"
                    />
                    <span className="absolute -bottom-1 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border border-white bg-[#0f1d40] text-white shadow-xs">
                      <Play className="size-2.5 fill-white" />
                    </span>
                  </div>
                  <strong className="mt-2.5 block text-xs font-extrabold text-[#0f1d40] group-hover:text-[#ff6437]">
                    {st.name}
                  </strong>
                  <span
                    dir="ltr"
                    className="text-[11px] font-bold text-slate-400"
                  >
                    {st.price}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. ماذا تبحث عنه؟ (16 قسماً بالأيقونات الملونة) */}
      <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 text-start">
          <h2 className="text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
            {isAr ? 'ماذا تبحث عنه؟' : 'What are you looking for?'}
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            {isAr
              ? 'شقق ومنازل واستراحات — بيع، إيجار، إيجار يومي'
              : 'Apartments, houses and cottages — sale, rent, daily'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {categoriesGrid.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="sivrce-card flex min-h-[118px] flex-col items-center justify-center rounded-[22px] border border-slate-200/75 bg-white p-3.5 text-center shadow-2xs"
              >
                <div
                  className={`mb-3 flex size-11 items-center justify-center rounded-2xl ${cat.color}`}
                >
                  <Icon className="size-5" />
                </div>
                <strong className="text-xs font-extrabold text-[#0f1d40]">
                  {cat.label}
                </strong>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 4. أول قسم كروت في الأعلى: إعلانات SUPER VIP (كما في الموقع الأصلي تماماً) */}
      <HomeCardsCarouselSection
        badgeText="SUPER VIP"
        badgeClass="bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-xs"
        title={isAr ? 'إعلانات SUPER VIP' : 'SUPER VIP listings'}
        subtitle={
          isAr
            ? 'أقصى ظهور — أفضل العروض أولاً'
            : 'Top offers first — maximum visibility'
        }
        allLinkText={isAr ? 'كل SUPER VIP ←' : 'All SUPER VIP →'}
        units={displayUnits}
        cardBadgeOverride="SUPER VIP"
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 5. أضيفت حديثاً */}
      <HomeCardsCarouselSection
        badgeText={isAr ? 'جديد' : 'NEW'}
        badgeClass="bg-[#2563eb] text-white"
        title={isAr ? 'أضيفت حديثاً' : 'Recently added'}
        subtitle={
          isAr
            ? 'إعلانات جديدة — الأحدث أولاً'
            : 'Fresh listings — newest first'
        }
        allLinkText={isAr ? 'كل الجديد ←' : 'All new →'}
        units={displayUnits.slice().reverse()}
        cardBadgeOverride={isAr ? 'جديد' : 'NEW'}
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 6. الخريطة التفاعلية ثلاثية الأبعاد (بالـ 4 سطور المتحركة بالتتابع والزر الأبيض السفلي) */}
      <Home3DMapSection />

      {/* 7. توصيات مخصصة */}
      <HomeCardsCarouselSection
        badgeText={isAr ? 'مختار لك' : 'FOR YOU'}
        badgeClass="bg-blue-50 text-[#2563eb]"
        title={isAr ? 'توصيات مخصصة' : 'Personalized recommendations'}
        subtitle={
          isAr
            ? 'عقارات مختارة بناءً على اهتماماتك وتاريخ بحثك وميزانيتك'
            : 'Selected properties based on your interests and target budget'
        }
        allLinkText={isAr ? 'عرض الكل ←' : 'View all →'}
        units={displayUnits}
        cardBadgeOverride={
          isAr ? 'ضمن ميزانيتك المحددة' : 'In your target budget'
        }
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 8. شوهدت مؤخراً (في مكانها الصحيح بالأسفل بعد التوصيات المخصصة) */}
      <HomeCardsCarouselSection
        badgeText={isAr ? 'شوهدت مؤخراً · 4' : 'RECENTLY VIEWED · 4'}
        badgeClass="bg-indigo-50 text-[#4f46e5]"
        title={isAr ? 'شوهدت مؤخراً' : 'Recently viewed'}
        allLinkText={isAr ? 'عرض الكل ←' : 'View all →'}
        units={displayUnits}
        favorites={favorites}
        onToggleFav={toggleFav}
      />

      {/* 9. قسم ميزة التنازل واستكمال الأقساط (Aqar Exit Advantage) */}
      <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-orange-200/60 bg-gradient-to-br from-white via-[#fff9f5] to-[#f4f8ff] p-6 shadow-sm sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="text-start lg:col-span-6">
              <span className="inline-block rounded-full bg-orange-100 px-3.5 py-1 text-xs font-extrabold text-[#ff6437]">
                {t?.hero?.badge ||
                  (isAr
                    ? 'نظام التنازل واستكمال الأقساط'
                    : 'Installment Exit System')}
              </span>
              <h2 className="mt-3.5 text-2xl font-black leading-snug text-[#0f1d40] sm:text-4xl">
                {t?.hero?.titleLine1} {t?.hero?.titleLine2}{' '}
                <span className="text-[#ff6437]">
                  {t?.hero?.titleAccentLine1} {t?.hero?.titleAccentLine2}
                </span>
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {t?.hero?.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/sell"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-black text-white shadow-sm transition hover:opacity-95 sm:text-sm"
                >
                  <Plus className="size-4 stroke-[3]" />
                  <span>
                    {t?.hero?.sellBtn ||
                      (isAr ? 'اعرض وحدتك للتنازل' : 'List Unit for Exit')}
                  </span>
                </Link>
                <Link
                  href="/calculator"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-xs font-extrabold text-[#0f1d40] transition hover:border-[#ff6437] hover:text-[#ff6437] sm:text-sm"
                >
                  {t?.calculatorBanner?.btn ||
                    (isAr ? 'حاسبة الخروج المجانية' : 'Free Exit Calculator')}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
              <div className="rounded-[22px] border border-red-200/80 bg-white p-5 text-start shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-red-50 text-xs font-black text-red-500">
                    ✕
                  </span>
                  <strong className="text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                    {t?.hero?.lossCardTitle}
                  </strong>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  {t?.hero?.lossCardLabel}
                </p>
                <strong
                  dir="ltr"
                  className="mt-1 block text-2xl font-black text-red-500 sm:text-3xl"
                >
                  - {t?.hero?.lossCardAmount} {GEL}
                </strong>
                <div className="mt-4 rounded-xl bg-red-50/70 p-2.5 text-center text-[11px] font-bold text-red-600">
                  {t?.hero?.lossCardFooter}
                </div>
              </div>

              <div className="rounded-[22px] border-2 border-[#007a5a] bg-white p-5 text-start shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-[#007a5a]">
                    ✓
                  </span>
                  <strong className="text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                    {t?.hero?.winCardTitle}
                  </strong>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  {t?.hero?.winCardLabel}
                </p>
                <strong
                  dir="ltr"
                  className="mt-1 block text-2xl font-black text-[#007a5a] sm:text-3xl"
                >
                  {t?.hero?.winCardAmount} {GEL}
                </strong>
                <div className="mt-4 rounded-xl bg-[#eaf8f2] p-2.5 text-center text-[11px] font-extrabold text-[#007a5a]">
                  {t?.hero?.winCardFooter}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. باقي أقسام السوق والمدونة وشحن الرصيد قبل الفوتر مباشرة */}
      <HomeMarketAndBottomSections realUnitCount={realUnitCount} />
    </div>
  )
}