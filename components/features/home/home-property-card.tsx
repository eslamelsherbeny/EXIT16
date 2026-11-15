'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Eye,
  FileCheck2,
  Flame,
  Heart,
  Layers,
  Sparkles,
} from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  cleanPureLocaleText,
  getLocalizedUnitTitle,
  SHOWCASE_IMAGES,
  type HomeUnitCardItem,
} from './home-data'

const CARD_I18N: Record<
  LocaleCode,
  {
    docsVerified: string
    sqmUnit: string
    roomsWord: string
    bathWord: string
    requiredCashNow: string
    negotiable: string
    yourMarketGain: string
    marketPriceTodayPrefix: string
    afterFeeSuffix: string
    remainingToDeveloper: string
    installment: string
    fullyPaid: string
    delivery: string
    detailsBtn: string
    viewsTitle: string
    adSpace: string
    yourAdHere: string
    adDescSuper: string
    adDescVip: string
    adBullet1: string
    adBullet2: string
    adBullet3: string
    advertiseHereBtn: string
    vipPlusTitle: string
    vipPlusSub: string
    vipPlusAllBtn: string
  }
> = {
  ar: {
    docsVerified: 'متحقق بالمستندات',
    sqmUnit: 'م²',
    roomsWord: 'غرف',
    bathWord: 'حمام',
    requiredCashNow: 'المطلوب كاش دلوقتي',
    negotiable: 'قابل للتفاوض',
    yourMarketGain: 'مكسبك عن سعر السوق',
    marketPriceTodayPrefix: 'سعر السوق اليوم:',
    afterFeeSuffix: '· بعد خصم عمولتنا 1.25%',
    remainingToDeveloper: 'المتبقي للمطور',
    installment: 'القسط',
    fullyPaid: 'خالص الأقساط',
    delivery: 'الاستلام',
    detailsBtn: 'تفاصيل',
    viewsTitle: 'عدد المشاهدات',
    adSpace: 'مساحة إعلانية',
    yourAdHere: 'إعلانك هنا',
    adDescSuper:
      'انشر إعلانك في صدارة SUPER VIP واصل إلى آلاف المشترين والمستثمرين في العقارات.',
    adDescVip:
      'رقِّ إعلانك لباقة +VIP بـ 5 ₾ فقط ليظهر في الصدارة أمام المشترين الجادين.',
    adBullet1: 'جمهور مستهدف من المشترين',
    adBullet2: 'تواصل مباشر وسريع',
    adBullet3: 'إحصائيات ومشاهدات شفافة',
    advertiseHereBtn: 'أعلن هنا ←',
    vipPlusTitle: 'إعلانات +VIP',
    vipPlusSub: 'إعلانات ذات أولوية — عقارات موثقة بالمستندات وجاهزة للتنازل',
    vipPlusAllBtn: 'كل +VIP ←',
  },
  en: {
    docsVerified: 'Docs Verified',
    sqmUnit: 'm²',
    roomsWord: 'Rooms',
    bathWord: 'Bath',
    requiredCashNow: 'Required Cash Now',
    negotiable: 'Negotiable',
    yourMarketGain: 'Your Market Gain',
    marketPriceTodayPrefix: 'Market price today:',
    afterFeeSuffix: '· after 1.25% fee',
    remainingToDeveloper: 'Remaining to Developer',
    installment: 'Installment',
    fullyPaid: 'Fully Paid',
    delivery: 'Delivery',
    detailsBtn: 'Details',
    viewsTitle: 'Views',
    adSpace: 'Ad Space',
    yourAdHere: 'Your Ad Here',
    adDescSuper:
      'Publish your listing in SUPER VIP and reach thousands of real estate buyers and investors.',
    adDescVip:
      'Upgrade your listing to VIP+ for just 5 ₾ to appear first to serious buyers.',
    adBullet1: 'Targeted audience',
    adBullet2: 'Direct contact',
    adBullet3: 'Transparent metrics',
    advertiseHereBtn: 'Advertise Here →',
    vipPlusTitle: 'VIP+ Listings',
    vipPlusSub: 'Priority listings — verified installment exit properties',
    vipPlusAllBtn: 'All VIP+ →',
  },
  ru: {
    docsVerified: 'Документы проверены',
    sqmUnit: 'м²',
    roomsWord: 'комн.',
    bathWord: 'сануз.',
    requiredCashNow: 'Сумма на руки сейчас',
    negotiable: 'Торг уместен',
    yourMarketGain: 'Ваша выгода от рынка',
    marketPriceTodayPrefix: 'Рыночная цена:',
    afterFeeSuffix: '· после комиссии 1.25%',
    remainingToDeveloper: 'Остаток застройщику',
    installment: 'Рассрочка',
    fullyPaid: 'Выплачено полностью',
    delivery: 'Сдача',
    detailsBtn: 'Подробнее',
    viewsTitle: 'Просмотры',
    adSpace: 'Рекламное место',
    yourAdHere: 'Ваша реклама здесь',
    adDescSuper:
      'Разместите объект в SUPER VIP и получите максимальный охват среди покупателей и инвесторов.',
    adDescVip:
      'Поднимите объявление в +VIP всего за 5 ₾ для приоритетного показа покупателям.',
    adBullet1: 'Целевая аудитория инвесторов',
    adBullet2: 'Прямой контакт с покупателем',
    adBullet3: 'Прозрачная статистика просмотров',
    advertiseHereBtn: 'Разместить рекламу →',
    vipPlusTitle: 'Объявления +VIP',
    vipPlusSub: 'Приоритетные объявления — проверенные объекты переуступки',
    vipPlusAllBtn: 'Все +VIP →',
  },
  ka: {
    docsVerified: 'დოკუმენტები შემოწმებულია',
    sqmUnit: 'მ²',
    roomsWord: 'ოთახი',
    bathWord: 'სველი წ.',
    requiredCashNow: 'საჭირო თანხა ხელზე',
    negotiable: 'ფასზე შეთანხმებით',
    yourMarketGain: 'თქვენი მოგება საბაზრო ფასთან',
    marketPriceTodayPrefix: 'საბაზრო ფასი დღეს:',
    afterFeeSuffix: '· 1.25% საკომისიოს შემდეგ',
    remainingToDeveloper: 'დარჩენილი დეველოპერთან',
    installment: 'განვადება',
    fullyPaid: 'სრულად გადახდილი',
    delivery: 'ჩაბარება',
    detailsBtn: 'დეტალურად',
    viewsTitle: 'ნახვები',
    adSpace: 'სარეკლამო სივრცე',
    yourAdHere: 'თქვენი რეკლამა აქ',
    adDescSuper:
      'განათავსეთ განცხადება SUPER VIP-ში და მიწვდით ათასობით მყიდველსა და ინვესტორს.',
    adDescVip:
      'გაააქტიურეთ +VIP მხოლოდ 5 ₾-ად და გამოჩნდით პირველ ადგილზე.',
    adBullet1: 'მიზნობრივი აუდიტორია',
    adBullet2: 'პირდაპირი კონტაქტი',
    adBullet3: 'გამჭვირვალე სტატისტიკა',
    advertiseHereBtn: 'რეკლამის განთავსება →',
    vipPlusTitle: '+VIP განცხადებები',
    vipPlusSub: 'პრიორიტეტული განცხადებები — გადამოწმებული ობიექტები',
    vipPlusAllBtn: 'ყველა +VIP →',
  },
}

export function formatRelativePublishTime(
  createdAt?: string,
  localeOrIsAr: LocaleCode | boolean = 'ar'
): string {
  const lang: LocaleCode =
    typeof localeOrIsAr === 'boolean'
      ? localeOrIsAr
        ? 'ar'
        : 'en'
      : ['ar', 'en', 'ru', 'ka'].includes(localeOrIsAr)
        ? localeOrIsAr
        : 'en'

  const fallbackWeek =
    lang === 'ar'
      ? 'منذ أسبوع'
      : lang === 'ru'
        ? '1 нед. назад'
        : lang === 'ka'
          ? '1 კვირის წინ'
          : '1 week ago'

  if (!createdAt) return fallbackWeek
  const createdTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdTime)) return fallbackWeek

  const diffMs = Math.max(0, Date.now() - createdTime)
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const h = Math.max(1, diffHours)
    if (lang === 'ar') {
      if (h === 1) return 'منذ ساعة'
      if (h === 2) return 'منذ ساعتين'
      if (h <= 10) return `منذ ${h} ساعات`
      return `منذ ${h} ساعة`
    }
    if (lang === 'ru') return `${h} ч. назад`
    if (lang === 'ka') return `${h} სთ წინ`
    return h === 1 ? '1 hour ago' : `${h} hours ago`
  }

  if (diffDays < 7) {
    if (lang === 'ar') {
      if (diffDays === 1) return 'منذ يوم واحد'
      if (diffDays === 2) return 'منذ يومين'
      return `منذ ${diffDays} أيام`
    }
    if (lang === 'ru') return `${diffDays} дн. назад`
    if (lang === 'ka') return `${diffDays} დღის წინ`
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }

  if (diffDays < 30) {
    const weeks = Math.max(1, Math.floor(diffDays / 7))
    if (lang === 'ar') {
      if (weeks === 1) return 'منذ أسبوع'
      if (weeks === 2) return 'منذ أسبوعين'
      return `منذ ${weeks} أسابيع`
    }
    if (lang === 'ru') return `${weeks} нед. назад`
    if (lang === 'ka') return `${weeks} კვირის წინ`
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  }

  const months = Math.max(1, Math.floor(diffDays / 30))
  if (lang === 'ar') {
    return `منذ ${months} ${months === 1 ? 'شهر' : months === 2 ? 'شهرين' : 'شهور'}`
  }
  if (lang === 'ru') return `${months} мес. назад`
  if (lang === 'ka') return `${months} თვის წინ`
  return `${months} mo ago`
}

function translateInstallmentFreq(
  rawFreq?: string,
  locale: LocaleCode = 'ar'
): string {
  const clean = (rawFreq || '').trim().toLowerCase()
  const isQuarterly =
    clean.includes('quarter') ||
    clean.includes('ربع') ||
    clean.includes('квартал') ||
    clean.includes('კვარტალ')
  const isSemi =
    clean.includes('semi') ||
    clean.includes('نصف') ||
    clean.includes('полгод') ||
    clean.includes('ნახევარ')
  const isAnnual =
    (clean.includes('annual') ||
      clean.includes('year') ||
      clean.includes('سنوي') ||
      clean.includes('год') ||
      clean.includes('წლიურ')) &&
    !isSemi

  if (isQuarterly) {
    if (locale === 'ar') return 'ربع سنوي'
    if (locale === 'ru') return 'Ежеквартально'
    if (locale === 'ka') return 'კვარტალური'
    return 'Quarterly'
  }
  if (isSemi) {
    if (locale === 'ar') return 'نصف سنوي'
    if (locale === 'ru') return 'Раз в полгода'
    if (locale === 'ka') return '6 თვეში ერთხელ'
    return 'Semi-Annual'
  }
  if (isAnnual) {
    if (locale === 'ar') return 'سنوي'
    if (locale === 'ru') return 'Ежегодно'
    if (locale === 'ka') return 'წლიური'
    return 'Annual'
  }

  if (locale === 'ar') return 'شهري'
  if (locale === 'ru') return 'Ежемесячно'
  if (locale === 'ka') return 'ყოველთვიური'
  return 'Monthly'
}

function translateDeliveryLabel(
  rawDel?: string,
  locale: LocaleCode = 'ar'
): string {
  if (!rawDel) return '2026'
  const clean = rawDel.trim()
  const yearMatch = clean.match(/20\d{2}/)
  const yr = yearMatch ? yearMatch[0] : ''
  const lower = clean.toLowerCase()
  const isReady =
    clean.includes('جاهز') ||
    clean.includes('فوري') ||
    clean.includes('مستلم') ||
    lower.includes('ready') ||
    lower.includes('готов') ||
    clean.includes('მზად')

  const readyWord =
    locale === 'ar'
      ? 'جاهزة'
      : locale === 'ru'
        ? 'Готово'
        : locale === 'ka'
          ? 'მზადაა'
          : 'Ready'

  if (isReady && yr) return `${readyWord} (${yr})`
  if (isReady) return readyWord
  return yr || clean
}

function translateUnitTypeWord(
  rawType?: string,
  locale: LocaleCode = 'ar'
): string {
  const clean = (rawType || '').trim()
  const lower = clean.toLowerCase()

  const isStudio =
    clean.includes('استوديو') ||
    lower.includes('studio') ||
    lower.includes('студия') ||
    clean.includes('სტუდიო')
  const isHotel =
    clean.includes('فندقية') ||
    lower.includes('hotel') ||
    lower.includes('апарт') ||
    clean.includes('აპარტ')
  const isVilla =
    clean.includes('فيلا') ||
    clean.includes('منزل') ||
    lower.includes('house') ||
    lower.includes('villa') ||
    lower.includes('дом') ||
    lower.includes('вилл') ||
    clean.includes('სახლი') ||
    clean.includes('ვილა')
  const isCottage =
    clean.includes('شاليه') ||
    clean.includes('كوخ') ||
    lower.includes('cottage') ||
    lower.includes('коттедж') ||
    clean.includes('კოტეჯი')
  const isComm =
    clean.includes('تجاري') ||
    lower.includes('commercial') ||
    lower.includes('коммерч') ||
    clean.includes('კომერციული')
  const isLand =
    clean.includes('أرض') ||
    lower.includes('land') ||
    lower.includes('участок') ||
    clean.includes('მიწა')

  if (isStudio) {
    return locale === 'ar'
      ? 'استوديو'
      : locale === 'ru'
        ? 'Студия'
        : locale === 'ka'
          ? 'სტუდიო'
          : 'Studio'
  }
  if (isHotel) {
    return locale === 'ar'
      ? 'شقة فندقية'
      : locale === 'ru'
        ? 'Апарт-отель'
        : locale === 'ka'
          ? 'აპარტ-ოტელი'
          : 'Aparthotel'
  }
  if (isVilla) {
    return locale === 'ar'
      ? 'فيلا'
      : locale === 'ru'
        ? 'Вилла / Дом'
        : locale === 'ka'
          ? 'ვილა / სახლი'
          : 'Villa'
  }
  if (isCottage) {
    return locale === 'ar'
      ? 'شاليه'
      : locale === 'ru'
        ? 'Коттедж'
        : locale === 'ka'
          ? 'კოტეჯი'
          : 'Cottage'
  }
  if (isComm) {
    return locale === 'ar'
      ? 'تجاري'
      : locale === 'ru'
        ? 'Коммерческая'
        : locale === 'ka'
          ? 'კომერციული'
          : 'Commercial'
  }
  if (isLand) {
    return locale === 'ar'
      ? 'أرض'
      : locale === 'ru'
        ? 'Участок'
        : locale === 'ka'
          ? 'მიწა'
          : 'Land'
  }

  return locale === 'ar'
    ? 'شقة'
    : locale === 'ru'
      ? 'Квартира'
      : locale === 'ka'
        ? 'ბინა'
        : 'Apartment'
}

export function HomeCarouselAdSlotCard({
  tier = 'SUPER VIP',
}: {
  tier?: 'SUPER VIP' | '+VIP'
  isAr?: boolean
}) {
  const { locale } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const cT = CARD_I18N[activeLocale] || CARD_I18N.ar
  const isSuper = tier === 'SUPER VIP'

  return (
    <Link
      href="#boost-packages-section"
      className={`sivrce-card group flex min-h-[460px] w-[300px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[20px] border bg-white text-start shadow-xs transition hover:shadow-md sm:w-[326px] lg:w-[336px] ${
        isSuper
          ? 'border-orange-200/90 border-t-[3px] border-t-[#ff6437]'
          : 'border-indigo-200/90 border-t-[3px] border-t-[#4f46e5]'
      }`}
    >
      <div>
        <div
          className={`relative flex h-[205px] w-full items-center justify-center overflow-hidden ${
            isSuper
              ? 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#3b122c]'
              : 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#1e1b4b]'
          }`}
        >
          <div className="flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-110">
            <div className="flex size-14 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/15">
              {isSuper ? (
                <Crown className="size-6 text-[#ff6437]" />
              ) : (
                <Flame className="size-6 text-indigo-400" />
              )}
            </div>
          </div>

          <span
            className={`absolute top-3 start-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10.5px] font-bold text-white shadow-sm ${
              isSuper
                ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69]'
                : 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]'
            }`}
          >
            {isSuper ? (
              <Crown className="size-3" />
            ) : (
              <Flame className="size-3" />
            )}
            <span>{tier}</span>
          </span>

          <span className="absolute end-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
            {cT.adSpace}
          </span>
        </div>

        <div className="p-5 text-start">
          <h3 className="text-lg font-extrabold text-[#0f1d40]">
            {cT.yourAdHere}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {isSuper ? cT.adDescSuper : cT.adDescVip}
          </p>

          <ul className="mt-4 space-y-1.5 text-xs font-semibold text-slate-500">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ff6437]" />
              <span>{cT.adBullet1}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ff6437]" />
              <span>{cT.adBullet2}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ff6437]" />
              <span>{cT.adBullet3}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3.5 text-start">
        <span
          className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-xs font-extrabold text-white shadow-sm transition group-hover:scale-105 ${
            isSuper
              ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69]'
              : 'bg-gradient-to-r from-[#4f46e5] to-[#6366f1]'
          }`}
        >
          {cT.advertiseHereBtn}
        </span>
      </div>
    </Link>
  )
}

export function HomePropertyCard({
  unit,
  isFav,
  onToggleFav,
  fullWidthOnGrid = false,
}: {
  unit: HomeUnitCardItem
  isFav: boolean
  onToggleFav: (id: string) => void
  fullWidthOnGrid?: boolean
}) {
  const { locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const cT = CARD_I18N[activeLocale] || CARD_I18N.ar
  const USD = '$'

  const gallery =
    unit.images && unit.images.length >= 1
      ? unit.images
      : [unit.image || SHOWCASE_IMAGES.interior]

  const [imgIdx, setImgIdx] = useState(0)

  const contractPriceVal = unit.contractPrice || unit.price
  const remainingVal =
    unit.remainingAmount !== undefined
      ? unit.remainingAmount
      : Math.max(0, contractPriceVal - unit.price)

  const marketPriceVal =
    unit.marketPrice && unit.marketPrice > contractPriceVal
      ? unit.marketPrice
      : 0

  const gainVal =
    unit.gainAmount !== undefined
      ? unit.gainAmount
      : marketPriceVal > contractPriceVal
        ? Math.max(
            0,
            Math.round(
              marketPriceVal - contractPriceVal - contractPriceVal * 0.0125
            )
          )
        : 0

  const sqmPrice =
    unit.size > 0
      ? Math.round(contractPriceVal / unit.size).toLocaleString('en-US')
      : '1,350'

  const rawLocalizedArea = getLocalizedGeorgiaAreaName(unit.area, activeLocale)
  const cleanArea = cleanPureLocaleText(rawLocalizedArea, activeLocale)
  const projectName = getLocalizedUnitTitle(unit, activeLocale, cleanArea)
  const cleanDeveloper = cleanPureLocaleText(
    unit.developer || '',
    activeLocale
  )
  const subtitleLine = cleanDeveloper
    ? `${cleanDeveloper} · ${cleanArea}`
    : cleanArea

  const detailHref = `/opportunities/${unit.id}`

  const views = Math.max(1, Number(unit.viewsCount) || 1)
  const rawCode =
    unit.code ||
    `U-${String(unit.id || '').replace(/[^0-9]/g, '').slice(0, 5) || '10901'}`
  const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`
  const publishedAgo = formatRelativePublishTime(unit.createdAt, activeLocale)
  const totalCount = gallery.length

  const activeTier =
    unit.boostTier || (unit.isFeatured ? 'super_vip' : null)

  const unitTypeWord = translateUnitTypeWord(unit.unitTypeLabel, activeLocale)
  const localizedFreq = translateInstallmentFreq(
    unit.installmentFreq,
    activeLocale
  )

  const instText =
    unit.installmentAmount && unit.installmentAmount > 0
      ? `${USD}${unit.installmentAmount.toLocaleString('en-US')} · ${localizedFreq}`
      : cT.fullyPaid

  const deliveryLabel = translateDeliveryLabel(unit.deliveryText, activeLocale)

  return (
    <article
      className={`sivrce-card group relative flex flex-col justify-between overflow-hidden rounded-[20px] border bg-white shadow-xs ${
        fullWidthOnGrid
          ? 'h-full w-full'
          : 'w-[300px] shrink-0 snap-start sm:w-[326px] lg:w-[336px]'
      } ${
        activeTier === 'super_vip'
          ? 'border-orange-200/90 border-t-[3px] border-t-[#ff6437]'
          : activeTier === 'vip_plus'
            ? 'border-indigo-200/90 border-t-[3px] border-t-[#4f46e5]'
            : 'border-slate-200/90 border-t-[3px] border-t-[#007a5a]'
      }`}
    >
      <div>
        <div className="relative h-[205px] w-full overflow-hidden bg-slate-100">
          <Link href={detailHref} className="block h-full w-full">
            <img
              src={gallery[imgIdx] || unit.image}
              alt={projectName}
              className="h-full w-full object-cover"
            />
          </Link>

          {activeTier === 'super_vip' && (
            <span className="pointer-events-none absolute top-3 start-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-sm">
              <Crown className="size-3" />
              <span>SUPER VIP</span>
            </span>
          )}

          {activeTier === 'vip_plus' && (
            <span className="pointer-events-none absolute top-3 start-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-3 py-1 text-[10.5px] font-bold text-white shadow-sm">
              <Flame className="size-3" />
              <span>+VIP</span>
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFav(unit.id)
            }}
            className="absolute top-3 end-3 z-20 flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-xs transition hover:scale-110"
            aria-label="Favorite"
          >
            <Heart
              className={`size-4 ${
                isFav ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setImgIdx((prev) =>
                    prev === 0 ? gallery.length - 1 : prev - 1
                  )
                }}
                className="absolute start-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f1d40] opacity-90 shadow-md transition hover:scale-105 hover:bg-white md:opacity-0 md:group-hover:opacity-100"
                aria-label="Previous photo"
              >
                {dir === 'rtl' ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronLeft className="size-4" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setImgIdx((prev) => (prev + 1) % gallery.length)
                }}
                className="absolute end-2.5 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f1d40] opacity-90 shadow-md transition hover:scale-105 hover:bg-white md:opacity-0 md:group-hover:opacity-100"
                aria-label="Next photo"
              >
                {dir === 'rtl' ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            </>
          )}

          <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10 flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-1">
              {gallery.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-0.5 flex-1 rounded-full transition-all ${
                    imgIdx === idx ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            <span
              dir="ltr"
              className="rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white"
            >
              {totalCount}/{imgIdx + 1}
            </span>
          </div>
        </div>

        <div className="px-4 pt-3 pb-2 text-start">
          <Link href={detailHref}>
            <h3 className="line-clamp-1 text-[17px] font-bold leading-tight text-[#0f1d40] transition hover:text-[#2563eb]">
              {projectName}
            </h3>
          </Link>

          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">
            {subtitleLine}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-[#eaf8f2] px-2.5 py-0.5 text-[10.5px] font-bold text-[#007a5a]">
              <FileCheck2 className="size-3 shrink-0" />
              <span>{cT.docsVerified}</span>
            </span>

            <span
              dir="ltr"
              className="text-xs font-bold text-slate-400 tabular-nums"
            >
              {USD}
              {sqmPrice}/{cT.sqmUnit}
            </span>
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#1e293b]">
            <span>
              {unitTypeWord} · {unit.rooms} {cT.roomsWord} · {unit.bathrooms}{' '}
              {cT.bathWord} · {unit.size} {cT.sqmUnit}
            </span>
            {unit.floor !== undefined && (
              <span
                dir="ltr"
                className="inline-flex items-center gap-0.5 text-slate-500"
              >
                · <Layers className="size-3.5 text-slate-400" /> {unit.floor}/
                {unit.totalFloors || 16}
              </span>
            )}
          </p>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11.5px] font-medium text-slate-500">
                {cT.requiredCashNow}
              </p>
              <strong
                dir="ltr"
                className="block text-[22px] font-bold leading-tight tracking-tight text-[#0f1d40] tabular-nums"
              >
                {USD}
                {unit.price.toLocaleString('en-US')}
              </strong>
            </div>

            {unit.negotiable && (
              <p className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#b45309]">
                <span>↓</span>
                <span>{cT.negotiable}</span>
              </p>
            )}
          </div>

          {gainVal > 0 && (
            <div className="mt-2 rounded-xl bg-[#eaf8f2] px-3 py-2 text-start">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-bold text-[#007a5a]">
                  {cT.yourMarketGain}
                </p>
                <strong
                  dir="ltr"
                  className="text-base font-bold text-[#007a5a] tabular-nums"
                >
                  + {USD}
                  {gainVal.toLocaleString('en-US')}
                </strong>
              </div>
              {marketPriceVal > 0 && (
                <p className="mt-0.5 text-[10px] font-medium leading-tight text-[#2b8a6e]">
                  {cT.marketPriceTodayPrefix} {USD}
                  {marketPriceVal.toLocaleString('en-US')} {cT.afterFeeSuffix}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-1 pb-3">
        <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-500">
              {cT.remainingToDeveloper}
            </span>
            <strong
              dir="ltr"
              className="font-bold text-[#0f1d40] tabular-nums"
            >
              {USD}
              {remainingVal.toLocaleString('en-US')}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-500">
              {cT.installment}
            </span>
            <strong className="font-bold text-[#0f1d40] tabular-nums">
              {instText}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-500">{cT.delivery}</span>
            <strong className="font-bold text-[#0f1d40] tabular-nums">
              {deliveryLabel}
            </strong>
          </div>
        </div>

        <Link
          href={detailHref}
          className="mt-2.5 flex h-9.5 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white shadow-xs transition hover:opacity-95 sm:text-[13px]"
        >
          <span>{cT.detailsBtn}</span>
        </Link>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1 text-slate-500"
              title={cT.viewsTitle}
            >
              <Eye className="size-3.5 text-slate-400" />
              <span className="tabular-nums">{views}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5 text-slate-400" />
              <span>{publishedAgo}</span>
            </span>
          </div>

          <span
            dir="ltr"
            className="font-mono text-[10.5px] font-semibold text-slate-400"
          >
            {displayCode}
          </span>
        </div>
      </div>
    </article>
  )
}

export function HomeCardsCarouselSection({
  badgeText,
  badgeClass,
  title,
  subtitle,
  allLinkText,
  allLinkHref = '/opportunities',
  units,
  favorites,
  onToggleFav,
  showAdCardWhenEmpty = false,
  adTier = 'SUPER VIP',
}: {
  badgeText?: string
  badgeClass?: string
  title: string
  subtitle?: string
  allLinkText: string
  allLinkHref?: string
  units: HomeUnitCardItem[]
  favorites: string[]
  onToggleFav: (id: string) => void
  showAdCardWhenEmpty?: boolean
  adTier?: 'SUPER VIP' | '+VIP'
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const isRtl = dir === 'rtl'
  const scrollRef = useRef<HTMLDivElement>(null)

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    if (maxScroll <= 6) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }

    const offset = Math.abs(el.scrollLeft)
    setCanScrollPrev(offset > 12)
    setCanScrollNext(offset < maxScroll - 12)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollButtons()
    const timer = setTimeout(updateScrollButtons, 150)

    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [units, dir, updateScrollButtons])

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return

    const step = 356
    const delta =
      direction === 'next' ? (isRtl ? -step : step) : isRtl ? step : -step

    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const hasUnits = Boolean(units && units.length > 0)
  if (!hasUnits && !showAdCardWhenEmpty) return null

  return (
    <section
      dir={dir}
      className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="text-start">
          {badgeText && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold ${badgeClass}`}
            >
              {badgeText === 'SUPER VIP' ? (
                <Crown className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              <span>{badgeText}</span>
            </span>
          )}
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {allLinkText && (
          <Link
            href={allLinkHref}
            className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
          >
            {allLinkText}
          </Link>
        )}
      </div>

      <div className="relative">
        {canScrollPrev && (
          <button
            type="button"
            onClick={() => handleScroll('prev')}
            aria-label="Previous listings"
            className="absolute -start-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 md:flex"
          >
            {isRtl ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </button>
        )}

        <div
          ref={scrollRef}
          dir={dir}
          className="flex snap-x snap-mandatory items-stretch justify-start gap-5 overflow-x-auto pb-4 no-scrollbar"
        >
          {hasUnits ? (
            <>
              {units.map((unit) => (
                <HomePropertyCard
                  key={unit.id}
                  unit={unit}
                  isFav={favorites.includes(unit.id)}
                  onToggleFav={onToggleFav}
                />
              ))}
              {badgeText === 'SUPER VIP' && (
                <HomeCarouselAdSlotCard tier="SUPER VIP" isAr={isAr} />
              )}
            </>
          ) : (
            <HomeCarouselAdSlotCard tier={adTier} isAr={isAr} />
          )}
        </div>

        {canScrollNext && (
          <button
            type="button"
            onClick={() => handleScroll('next')}
            aria-label="Next listings"
            className="absolute -end-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 md:flex"
          >
            {isRtl ? (
              <ChevronLeft className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </button>
        )}
      </div>
    </section>
  )
}

export function HomeVipPlusSection({
  vipPlusUnits,
  favorites,
  onToggleFav,
  showWhenEmpty = false,
}: {
  vipPlusUnits: HomeUnitCardItem[]
  favorites: string[]
  onToggleFav: (id: string) => void
  showWhenEmpty?: boolean
}) {
  const { locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const cT = CARD_I18N[activeLocale] || CARD_I18N.ar
  const isAr = activeLocale === 'ar'
  const isRtl = dir === 'rtl'
  const scrollRef = useRef<HTMLDivElement>(null)

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    if (maxScroll <= 6) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }

    const offset = Math.abs(el.scrollLeft)
    setCanScrollPrev(offset > 12)
    setCanScrollNext(offset < maxScroll - 12)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollButtons()
    const timer = setTimeout(updateScrollButtons, 150)

    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [vipPlusUnits, dir, updateScrollButtons])

  const hasUnits = Boolean(vipPlusUnits && vipPlusUnits.length > 0)
  if (!hasUnits && !showWhenEmpty) {
    return null
  }

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return
    const step = 356
    const delta =
      direction === 'next' ? (isRtl ? -step : step) : isRtl ? step : -step
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section
      dir={dir}
      className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="text-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#6366f1] px-3.5 py-1 text-[11px] font-bold text-white shadow-xs">
            <Flame className="size-3.5" />
            <span>+VIP</span>
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
            {cT.vipPlusTitle}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {cT.vipPlusSub}
          </p>
        </div>

        <Link
          href="/opportunities?tier=vip_plus"
          className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
        >
          {cT.vipPlusAllBtn}
        </Link>
      </div>

      <div className="relative">
        {canScrollPrev && (
          <button
            type="button"
            onClick={() => handleScroll('prev')}
            aria-label="Previous VIP+ listings"
            className="absolute -start-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 md:flex"
          >
            {isRtl ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </button>
        )}

        <div
          ref={scrollRef}
          dir={dir}
          className="flex snap-x snap-mandatory items-stretch justify-start gap-5 overflow-x-auto pb-4 no-scrollbar"
        >
          {hasUnits &&
            vipPlusUnits.map((unit) => (
              <HomePropertyCard
                key={unit.id}
                unit={{ ...unit, boostTier: 'vip_plus' }}
                isFav={favorites.includes(unit.id)}
                onToggleFav={onToggleFav}
              />
            ))}

          <HomeCarouselAdSlotCard tier="+VIP" isAr={isAr} />
        </div>

        {canScrollNext && (
          <button
            type="button"
            onClick={() => handleScroll('next')}
            aria-label="Next VIP+ listings"
            className="absolute -end-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f1d40] shadow-[0_8px_24px_rgba(15,29,64,0.15)] transition hover:scale-110 hover:bg-slate-50 md:flex"
          >
            {isRtl ? (
              <ChevronLeft className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </button>
        )}
      </div>
    </section>
  )
}