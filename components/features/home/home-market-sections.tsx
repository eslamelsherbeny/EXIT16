'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  CreditCard,
  MapPin,
  Megaphone,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { getHomeToolsList, SHOWCASE_IMAGES } from './home-data'

export function HomeMarketAndBottomSections({
  realUnitCount,
}: {
  realUnitCount: number
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const GEL = '₾'

  const [topUpAmount, setTopUpAmount] = useState<number>(10)

  const neighborhoods = [
    {
      name: isAr ? 'فاكي' : 'Vake',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      countNote: isAr ? '1 إعلان هنا' : '1 listing here',
      price: isAr ? '3,890 ₾/م²' : '3,890 ₾/m²',
      score: '10/8.2',
      areaQuery: 'Tbilisi - Vake',
      image: SHOWCASE_IMAGES.park,
    },
    {
      name: isAr ? 'سابورتالو' : 'Saburtalo',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      countNote: isAr ? '2 إعلان هنا' : '2 listings here',
      price: isAr ? '3,100 ₾/م²' : '3,100 ₾/m²',
      score: '10/7.8',
      areaQuery: 'Tbilisi - Saburtalo',
      image: SHOWCASE_IMAGES.project,
    },
    {
      name: isAr ? 'تبليسي القديمة' : 'Old Tbilisi',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      countNote: isAr ? '3 إعلان هنا' : '3 listings here',
      price: isAr ? '4,300 ₾/م²' : '4,300 ₾/m²',
      score: '10/7.4',
      areaQuery: 'Tbilisi - Old Tbilisi',
      image: SHOWCASE_IMAGES.villa,
    },
    {
      name: isAr ? 'بوليفارد باتومي' : 'Batumi Boulevard',
      city: isAr ? 'باتومي' : 'Batumi',
      countNote: isAr ? '4 إعلان هنا' : '4 listings here',
      price: isAr ? '3,550 ₾/م²' : '3,550 ₾/m²',
      score: '10/8.0',
      areaQuery: 'Batumi - New Boulevard',
      image: SHOWCASE_IMAGES.coast,
    },
  ]

  const underConstructionProjects = [
    {
      name: isAr ? 'أوربي سيتي' : 'Orbi City',
      developer: isAr ? 'مجموعة أوربي' : 'ORBI Group',
      address: isAr ? 'شارع شريف خيمشياشفيلي، 7' : 'Sherif Khimshiashvili St, 7',
      handover: isAr ? 'التسليم Q3 2026' : 'Handover Q3 2026',
      unitsText: isAr ? '10,800 شقة' : '10,800 units',
      progress: '94%',
      priceSqm: isAr ? '4,050 ₾/م²' : '4,050 ₾/m²',
      image: SHOWCASE_IMAGES.coast,
    },
    {
      name: isAr ? 'سيميتريا بارك' : 'Simetria Park',
      developer: isAr ? 'سيميتريا' : 'Simetria',
      address: isAr ? 'أوكروكانا، تبليسي' : 'Okrokana, Tbilisi',
      handover: isAr ? 'التسليم Q3 2026' : 'Handover Q3 2026',
      unitsText: isAr ? '66 شقة' : '66 units',
      progress: '92%',
      priceSqm: isAr ? '4,850 ₾/م²' : '4,850 ₾/m²',
      image: SHOWCASE_IMAGES.project,
    },
    {
      name: isAr ? 'ألفا هوم غلداني' : 'Alpha Home Gldani',
      developer: isAr ? 'ألفا هوم' : 'Alpha Home',
      address: isAr ? 'شارع تنغيز شيشيليدزه، 18' : 'Tengiz Sheshelidze St, 18',
      handover: isAr ? 'التسليم Q4 2026' : 'Handover Q4 2026',
      unitsText: isAr ? '240 شقة' : '240 units',
      progress: '90%',
      priceSqm: isAr ? '3,450 ₾/م²' : '3,450 ₾/m²',
      image: SHOWCASE_IMAGES.villa,
    },
  ]

  const topDevelopers = [
    {
      rank: 1,
      name: isAr ? 'آرتشي' : 'Archi',
      code: 'AR',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 55,
      activeCount: 33,
      badgeColor: 'bg-sky-500',
    },
    {
      rank: 2,
      name: isAr ? 'أركون للتطوير' : 'Arcon Development',
      code: 'MG',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 18,
      activeCount: 23,
      badgeColor: 'bg-rose-600',
    },
    {
      rank: 3,
      name: isAr ? 'مجموعة أوربي' : 'ORBI Group',
      code: 'OR',
      city: isAr ? 'باتومي' : 'Batumi',
      projectsCount: 30,
      activeCount: 18,
      badgeColor: 'bg-emerald-600',
    },
    {
      rank: 4,
      name: isAr ? 'نكست جروب' : 'NEXT Group',
      code: 'NX',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 65,
      activeCount: 17,
      badgeColor: 'bg-[#1e3a8a]',
    },
    {
      rank: 5,
      name: isAr ? 'إم سكوير' : 'm² Real Estate',
      code: 'M2',
      city: isAr ? 'تبليسي' : 'Tbilisi',
      projectsCount: 28,
      activeCount: 14,
      badgeColor: 'bg-amber-500',
    },
  ]

  const realEstateTools = getHomeToolsList(isAr)

  const extraServiceTags = isAr
    ? [
        'تشطيبات',
        'تصميم داخلي',
        'تصوير وجولة 3D',
        'استشارات قانونية',
        'تقييم عقاري',
        'نقل أثاث',
        'تنظيف',
        'إدارة أملاك',
        'فحص هندسي',
        'صيانة منزلية',
        'تكييف وتدفئة',
        'أمن وحراسة',
        'طاقة شمسية',
        'هندسة معمارية',
        'خدمات مبانٍ',
        'وساطة تمويل',
        'تأمين عقاري',
        'مساحة وأراضٍ',
      ]
    : [
        'Renovation',
        'Interior design',
        'Photo & 3D',
        'Legal',
        'Appraisal',
        'Moving',
        'Cleaning',
        'Property management',
        'Inspection',
        'Handyman',
        'Climate & heating',
        'Security',
        'Solar',
        'Architecture',
        'Building services',
        'Mortgage broker',
        'Insurance',
        'Surveying',
      ]

  const blogArticles = [
    {
      tag: isAr ? 'استثمار' : 'Investment',
      title: isAr
        ? 'غوداوري أم باكورياني: أين تشتري شقة تزلج في جورجيا 2026؟'
        : 'Gudauri or Bakuriani: Where to Buy a Ski Apartment in Georgia in 2026',
      date: isAr ? '18 أكتوبر 2026 · 6 دقائق' : '18 Oct 2026 · 6 min',
      image: SHOWCASE_IMAGES.chalet,
    },
    {
      tag: isAr ? 'الإقامة العقارية' : 'Residency',
      title: isAr
        ? 'دليل الحصول على الإقامة في جورجيا عن طريق تملك عقار 2026'
        : 'Residence Permit by Property in Georgia 2026',
      date: isAr ? '14 أكتوبر 2026 · 5 دقائق' : '14 Oct 2026 · 5 min',
      image: SHOWCASE_IMAGES.villa,
    },
    {
      tag: isAr ? 'التنازل والأقساط' : 'Selling',
      title: isAr
        ? 'كيف تبيع شقتك بالتقسيط في تبليسي أو باتومي وتسترد 100% من مدفوعاتك؟'
        : 'Selling an Apartment in Georgia 2026',
      date: isAr ? '10 أكتوبر 2026 · 4 دقائق' : '10 Oct 2026 · 4 min',
      image: SHOWCASE_IMAGES.project,
    },
    {
      tag: isAr ? 'قطع أراضٍ' : 'Land plot',
      title: isAr
        ? 'تنظيم الأراضي والبناء في تبليسي — ما الذي يمكنك بناؤه؟'
        : 'Tbilisi Zoning — what you can build',
      date: isAr ? '5 أكتوبر 2026 · 7 دقائق' : '05 Oct 2026 · 7 min',
      image: SHOWCASE_IMAGES.coast,
    },
  ]

  return (
    <>
      {/* 1. البانر الإعلاني الكبير (إعلانك هنا) */}
      <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#091540] via-[#2b193e] to-[#59213b] p-8 text-end text-white shadow-xl sm:p-12">
          <div className="flex flex-col items-end">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-extrabold text-orange-200">
              ✦ {isAr ? 'مساحة إعلانية · AQAR DISPLAY' : 'SPONSORED SLOT · DISPLAY'}
            </span>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">
              {isAr ? 'إعلانك هنا' : 'Your Ad on the Homepage'}
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/75 sm:text-sm">
              {isAr
                ? 'انشر إعلانك واصل إلى آلاف المشترين والمستثمرين في العقارات.'
                : 'Present your brand, project, or service to an engaged real-estate audience.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {[
                isAr ? 'جمهور مستهدف' : 'Targeted audience',
                isAr ? 'تواصل مباشر' : 'Direct contact',
                isAr ? 'إحصائيات شفافة' : 'Transparent metrics',
              ].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-bold text-white/90"
                >
                  <span className="me-1 text-[#ff6437]">•</span>
                  {pill}
                </span>
              ))}
            </div>
            <Link
              href="/contact"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-xs font-black text-white shadow-lg transition hover:opacity-95 sm:text-sm"
            >
              <span>{isAr ? 'أعلن هنا ←' : 'Advertise here →'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. أين تسكن (Where to live) */}
      <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-black text-[#2563eb]">
              ⌖ {isAr ? 'أحياء' : 'NEIGHBORHOODS'}
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
              {isAr ? 'أين تسكن' : 'Where to live'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              {isAr
                ? 'درجات قابلية العيش وأسعار حقيقية للمتر وصور حقيقية — من فاكي إلى باتومي'
                : 'Livability scores and real average price per m² — from Vake to Batumi'}
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-extrabold text-[#2563eb] hover:underline sm:text-sm"
          >
            {isAr ? 'كل الأحياء ←' : 'All neighborhoods →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {neighborhoods.map((nb) => (
            <Link
              key={nb.name}
              href={`/opportunities?area=${encodeURIComponent(nb.areaQuery)}`}
              className="sivrce-card group overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-xs"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={nb.image}
                  alt={nb.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <span
                  dir="ltr"
                  className="absolute top-3.5 end-3.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-[#0f1d40] shadow-xs"
                >
                  {nb.score}
                </span>
                <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between text-white">
                  <strong className="text-xl font-black">{nb.name}</strong>
                  <span className="text-[11px] font-bold text-white/85">
                    ⌖ {nb.city} · {nb.countNote}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 text-start">
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400">
                    {isAr ? 'متوسط السعر' : 'AVG. PRICE'}
                  </span>
                  <strong
                    dir="ltr"
                    className="text-base font-black text-[#2563eb]"
                  >
                    {nb.price}
                  </strong>
                </div>
                <span className="text-xs font-extrabold text-[#2563eb] group-hover:underline">
                  {isAr ? 'عرض الدليل ←' : 'View guide →'}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 3. شقق قيد الإنشاء (Apartments under construction) */}
        <div className="mt-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div className="text-start">
              <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-black text-[#2563eb]">
                🏗️ {isAr ? 'مشاريع جديدة' : 'NEW PROJECTS'}
              </span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
                {isAr ? 'شقق قيد الإنشاء' : 'Apartments under construction'}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                {isAr
                  ? 'كل المطورين وكل المشاريع — بتقييمات وتصوير ثلاثي الأبعاد'
                  : 'All developers and new builds — with ratings and 3D view'}
              </p>
            </div>
            <Link
              href="/opportunities?delivery=Under+Construction"
              className="text-xs font-extrabold text-[#2563eb] hover:underline sm:text-sm"
            >
              {isAr ? 'كل المشاريع (1205) ←' : 'All projects (1205) →'}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {underConstructionProjects.map((proj) => (
              <Link
                key={proj.name}
                href="/opportunities?delivery=Under+Construction"
                className="sivrce-card overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-xs"
              >
                <div className="relative h-60 w-full overflow-hidden">
                  <img
                    src={proj.image}
                    alt={proj.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <span className="absolute top-3.5 start-3.5 rounded-full bg-[#0f1d40]/90 px-3 py-1 text-xs font-extrabold text-white">
                    {isAr ? `اكتمل ${proj.progress}` : `${proj.progress} built`}
                  </span>
                  <div className="absolute inset-x-4 bottom-4 text-end text-white">
                    <strong className="block text-xl font-black">
                      {proj.name}
                    </strong>
                    <span className="text-xs text-white/85">
                      {proj.developer} ✓
                    </span>
                  </div>
                </div>
                <div className="p-4 text-start sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
                    <span>⌖ {proj.address}</span>
                    <span>📅 {proj.handover}</span>
                    <span>🏢 {proj.unitsText}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 me-4">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed]"
                        style={{ width: proj.progress }}
                      />
                    </div>
                    <strong
                      dir="ltr"
                      className="text-sm font-black text-[#2563eb]"
                    >
                      {proj.priceSqm}
                    </strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. شريط إعلاني فاتح + الوسطاء + شركات التطوير الرائدة (مطابق للصورة 7 و 8) */}
      <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
        {/* الشريط الإعلاني الأبيض الأفقي */}
        <div className="mb-12 flex flex-col items-center justify-between gap-4 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:px-8">
          <div className="flex items-center gap-4 text-start">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
              <Megaphone className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-[#2563eb]">
                {isAr ? 'مساحة إعلانية · شبكة عقار إكزت' : 'Ad Space · Aqar Exit Network'}
              </span>
              <strong className="block text-base font-black text-[#0f1d40]">
                {isAr ? 'إعلانك هنا' : 'Your Ad Here'}
              </strong>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'انشر إعلانك واصل إلى آلاف المشترين والمستثمرين في العقارات.'
                  : 'Reach thousands of active property buyers and investors.'}
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 text-xs font-black text-white shadow-sm transition hover:opacity-95"
          >
            {isAr ? 'أعلن هنا ←' : 'Advertise →'}
          </Link>
        </div>

        {/* الوسطاء أصحاب أكبر عدد من الإعلانات النشطة */}
        <div className="mb-14 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-black text-[#2563eb]">
              👤 {isAr ? 'أفضل الوسطاء' : 'TOP BROKERS'}
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
              {isAr
                ? 'الوسطاء أصحاب أكبر عدد من الإعلانات النشطة'
                : 'Brokers with the most active listings'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              {isAr
                ? 'ترتيب حسب المخزون الحي — الأكثر نشاطاً في السوق الآن'
                : 'Ranked by live inventory — most active on the market right now'}
            </p>
          </div>

          <Link
            href="/sell"
            className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-extrabold text-[#0f1d40] shadow-2xs transition hover:border-[#ff6437]"
          >
            <span className="rounded-lg bg-orange-50 px-2.5 py-1 font-black text-[#ff6437]">
              #1 #2 #3
            </span>
            <span>
              {isAr
                ? 'وكيل عقاري؟ ادخل القائمة — مجاناً ←'
                : 'Real estate agent? Join the list — free →'}
            </span>
          </Link>
        </div>

        {/* شركات التطوير الرائدة */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-black text-[#2563eb]">
              🏢 {isAr ? 'أفضل المطورين' : 'TOP DEVELOPERS'}
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
              {isAr ? 'شركات التطوير الرائدة' : 'Leading development companies'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              {isAr
                ? 'ترتيب حسب الإعلانات النشطة — استعرض المشاريع والعقارات'
                : 'Ranked by active listings — explore projects and units'}
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-extrabold text-[#2563eb] hover:underline sm:text-sm"
          >
            {isAr ? 'كل المطورين (1399) ←' : 'All developers (1399) →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {topDevelopers.map((dev) => (
            <Link
              key={dev.name}
              href="/opportunities"
              className="sivrce-card flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-5 text-start shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-black text-white ${dev.badgeColor}`}
                >
                  {dev.code}
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-black text-[#2563eb]">
                  {dev.rank}
                </span>
              </div>

              <div className="mt-4">
                <strong className="block text-base font-black text-[#0f1d40]">
                  {dev.name}
                </strong>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {dev.city} · {dev.projectsCount}{' '}
                  {isAr ? 'مشروع' : 'projects'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-extrabold">
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
      </section>

      {/* 5. كل ما يخص العقارات */}
      <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
            {isAr ? 'كل ما يخص العقارات' : 'Everything for real estate'}
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-500 sm:text-sm">
            {isAr
              ? 'من البحث إلى التوقيع — منظومة كاملة على منصة واحدة'
              : 'From search to closing — everything on one platform'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {realEstateTools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="sivrce-card flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-6 text-start shadow-2xs"
              >
                <div>
                  <div
                    className={`flex size-11 items-center justify-center rounded-2xl ${tool.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-base font-black text-[#0f1d40] sm:text-lg">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {tool.desc}
                  </p>
                </div>

                <span className="mt-5 inline-flex items-center gap-1 text-xs font-extrabold text-[#0f1d40]">
                  <span>{isAr ? 'استخدم الخدمة' : 'Use the service'}</span>
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {extraServiceTags.map((tag) => (
            <Link
              key={tag}
              href="/contact"
              className="rounded-full border border-slate-200/80 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-2xs transition hover:border-[#ff6437] hover:text-[#ff6437]"
            >
              {tag}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-white p-7 text-start shadow-2xs">
            <div>
              <strong
                dir="ltr"
                className="block text-4xl font-black text-[#0f1d40] sm:text-5xl"
              >
                {realUnitCount > 0 ? realUnitCount : '1,814'}
              </strong>
              <span className="mt-1 block text-xs font-bold text-slate-500">
                {isAr
                  ? 'مشاريع مطورين من كل جورجيا'
                  : 'Developer projects across Georgia'}
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
              <TrendingUp className="size-5" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-white p-7 text-start shadow-2xs">
            <div>
              <strong
                dir="ltr"
                className="block text-4xl font-black text-[#0f1d40] sm:text-5xl"
              >
                5
              </strong>
              <span className="mt-1 block text-xs font-bold text-slate-500">
                {isAr
                  ? 'مدن ومناطق مغطاة بالإحصائيات'
                  : 'Cities & regions covered with analytics'}
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
              <Award className="size-5" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. أخبار ونصائح عقارية */}
      <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-black text-[#2563eb]">
              📰 {isAr ? 'المدونة والأخبار' : 'BLOG AND NEWS'}
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
              {isAr ? 'أخبار ونصائح عقارية' : 'Real estate news and advice'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              {isAr
                ? 'أحدث المقالات وتحليلات السوق وتوصيات الخبراء'
                : 'Latest articles, market analysis and expert recommendations'}
            </p>
          </div>
          <Link
            href="/reports"
            className="text-xs font-extrabold text-[#2563eb] hover:underline sm:text-sm"
          >
            {isAr ? 'كل المقالات ←' : 'All articles →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {blogArticles.map((art) => (
            <Link
              key={art.title}
              href="/reports"
              className="sivrce-card flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-4 text-start shadow-2xs"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden rounded-2xl">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-3 start-3 rounded-full bg-[#2563eb] px-3 py-1 text-[10px] font-extrabold text-white">
                    {art.tag}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-slate-400">
                  {art.date}
                </p>
                <h3 className="mt-1.5 text-sm font-extrabold leading-snug text-[#0f1d40]">
                  {art.title}
                </h3>
              </div>

              <span className="mt-4 block border-t border-slate-100 pt-3 text-xs font-extrabold text-[#2563eb]">
                {isAr ? 'اقرأ المقال ←' : 'Read more →'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. بانر مساحتك في انتظارك (مطابق للصورة 9) */}
      <section className="relative overflow-hidden bg-[#0a1338] px-4 py-20 text-center text-white sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]"
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl">
            {isAr ? 'مساحتك في انتظارك' : 'Your space is waiting'}
            <span className="text-[#ff6437]">.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-white/65 sm:text-base">
            {isAr
              ? 'مشترٍ أو مستأجر أو بائع أو وكيل أو مطور — حساب واحد، الإعلان مجاني، 3 دقائق.'
              : 'Buyer, tenant, seller, agent or developer — one account, free listing, 3 minutes.'}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/sell"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-8 text-xs font-black text-white shadow-[0_8px_24px_rgba(255,100,55,0.35)] transition hover:opacity-95 sm:text-sm"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>{isAr ? 'أضف إعلاناً' : 'Add a listing'}</span>
            </Link>
            <Link
              href="/opportunities"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 text-xs font-extrabold text-white transition hover:bg-white/15 sm:text-sm"
            >
              <Search className="size-4" />
              <span>{isAr ? 'ابدأ البحث' : 'Start searching'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. قسم اشحن رصيدك بأي مبلغ (قبل الفوتر مباشرة كما في الصورة 10) */}
      <section className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-12">
          <div className="rounded-[24px] border border-slate-200/80 bg-[#f8fafc] p-5 text-start shadow-2xs sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-black text-[#ff6437]">
                1:1 ⚡
              </span>
              <div className="text-end">
                <strong className="block text-xs font-black text-[#0f1d40]">
                  {isAr ? 'مبالغ سريعة' : 'Quick amounts'}
                </strong>
                <span className="text-[10px] text-slate-400">
                  {isAr
                    ? `الأدنى 5 ${GEL} · الأقصى 10,000 ${GEL}`
                    : `Min 5 ${GEL} · Max 10,000 ${GEL}`}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {[
                { val: 5, tag: isAr ? 'بداية' : 'Starter' },
                {
                  val: 10,
                  tag: isAr ? 'موصى به' : 'Recommended',
                  highlight: true,
                },
                { val: 20, tag: 'SUPER VIP' },
                { val: 50, tag: isAr ? 'شائع' : 'Popular' },
                { val: 100, tag: 'PRO -30%' },
              ].map((item) => {
                const active = topUpAmount === item.val
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTopUpAmount(item.val)}
                    className={`relative flex flex-col items-center justify-center rounded-xl border py-2.5 text-center transition ${
                      active
                        ? 'border-2 border-[#2563eb] bg-blue-50/50 text-[#0f1d40] shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.highlight && (
                      <span className="absolute -top-2 rounded-full bg-[#ff6437] px-1.5 py-0.2 text-[8px] font-black text-white">
                        ★
                      </span>
                    )}
                    <strong dir="ltr" className="text-xs font-black sm:text-sm">
                      {item.val} {GEL}
                    </strong>
                    <span className="mt-0.5 text-[9px] font-bold text-slate-400">
                      {item.tag}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-[11px] font-bold text-slate-500">
                {isAr ? 'مبلغ مخصص' : 'Custom amount'}
              </span>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2">
                <span className="font-black text-slate-400">{GEL}</span>
                <input
                  type="number"
                  dir="ltr"
                  value={topUpAmount}
                  onChange={(e) =>
                    setTopUpAmount(Math.max(5, Number(e.target.value) || 0))
                  }
                  className="w-full bg-transparent text-center text-sm font-black text-[#0f1d40] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5">
              <strong className="block text-xs font-black text-[#0f1d40]">
                {topUpAmount} {GEL}{' '}
                {isAr ? 'تُضاف لرصيدك فوراً' : 'credited to your balance'}
              </strong>
              <span className="mt-0.5 block text-[11px] font-bold text-[#2563eb]">
                {isAr
                  ? `تغطي باقة SUPER VIP لمدة ${Math.max(1, Math.floor(topUpAmount / 10))} يوم · رسوم 0%`
                  : `Covers SUPER VIP for ${Math.max(1, Math.floor(topUpAmount / 10))} days · 0% fee`}
              </span>
            </div>

            <Link
              href="/sell"
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-black text-white shadow-md transition hover:opacity-95 sm:text-sm"
            >
              <CreditCard className="size-4" />
              <span>
                {isAr
                  ? `ادفع ${topUpAmount} ${GEL} بالبطاقة البنكية`
                  : `Pay ${topUpAmount} ${GEL} with Card`}
              </span>
            </Link>
          </div>

          <div className="text-start lg:col-span-7">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-extrabold text-[#2563eb]">
              ✦ {isAr ? 'رصيد المحفظة والترقية' : 'Wallet & Boost Balance'}
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight text-[#0f1d40] sm:text-4xl">
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
                ? 'رقِّ إعلاناتك لباقات SUPER VIP و VIP+، وافتح المميزات الفورية. الرصيد لا تنتهي صلاحيته أبداً.'
                : 'Promote your listings with SUPER VIP and VIP+ boosts, unlock services or instant features. Balance never expires.'}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <strong className="block text-xs font-black text-[#0f1d40]">
                  {isAr ? 'كل وسائل الدفع' : 'All Payment Methods'}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAr
                    ? 'Apple Pay · Mastercard · Visa · BOG · TBC · التحويل البنكي.'
                    : 'Apple Pay · Mastercard · Visa · BOG · TBC · Google Pay.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <strong className="block text-xs font-black text-[#0f1d40]">
                  {isAr ? 'قابل للاسترداد 100%' : '100% Refundable'}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAr
                    ? 'أي رصيد غير مستخدم قابل للاسترداد بالكامل في أي وقت عند الطلب.'
                    : 'Any unspent balance is fully refundable at any time upon request.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <strong className="block text-xs font-black text-[#0f1d40]">
                  {isAr ? 'رصيد فوري 1:1' : 'Instant 1:1 Credit'}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {isAr
                    ? '0% رسوم. كل 1 لاري يذهب مباشرة إلى محفظتك بدون أي استقطاع.'
                    : '0% fees. Every 1 GEL goes directly to your wallet with zero deduction.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}