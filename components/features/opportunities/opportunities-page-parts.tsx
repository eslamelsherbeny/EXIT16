'use client'

import React, { useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  Bath,
  Bookmark,
  Building,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Flame,
  Gem,
  Grid2X2,
  Home,
  Hotel,
  Layers,
  MapPin,
  Mountain,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trees,
  Waves,
  X,
} from 'lucide-react'
import {
  getOptionLabel,
  PROPERTY_KINDS,
} from '@/components/features/seller/seller-shared'
import { SivrceLocationModalPicker } from '@/components/features/seller/seller-location-modal'
import {
  AreaFilterPanel,
  CommuteFilterPanel,
  MoreFiltersMegaPanel,
  PriceFilterPanel,
  RoomsFilterPanel,
  type SearchFiltersState,
} from '@/components/features/opportunities/search-filter-popovers'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { type LocaleCode } from '@/lib/i18n'

export const PUBLIC_SAFE_UNIT_COLUMNS =
  'id, code, project_name, developer_name, area, exact_street, house_number, cadastral_code, unit_type, size, garden_size, rooms, bedrooms, bathrooms, floor_number, total_floors, finishing, delivery_status, delivery_month, delivery_year, features, video_url, tour_3d_url, allow_online_viewing, description, contract_price, paid_amount, market_price, price_per_sqm, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, boost_tier, featured_until, docs_verified, views_count, approved_at, created_at, documents'

export const CORE_SAFE_UNIT_COLUMNS =
  'id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at, documents'

export const OPPS_UI_FALLBACK: Record<
  LocaleCode,
  {
    searchBtn: string
    allTypesOption: string
    everywhereBtn: string
    cashAndInstallmentsBtn: string
    roomsBtn: string
    areaBtn: string
    commuteBtn: string
    searchResultsPrefix: string
    activeSearchLabel: string
    clearFilterShowAllBtn: string
    saveSearchBtn: string
    searchSavedToast: string
    listViewBtn: string
    map2dBtn: string
    map3dBtn: string
    showingRangePrefix: string
    showingRangeOf: string
    prevPageBtn: string
    nextPageBtn: string
    adCardBadge: string
    adCardTitle: string
    adCardSub: string
    adBullet1: string
    adBullet2: string
    adBullet3: string
    adCardBtn: string
    newlyAddedHeading: string
    chips: {
      all: string
      apartments: string
      houses: string
      cottages: string
      luxury: string
      ready: string
      underConst: string
      sea: string
      pool: string
      jacuzzi: string
      ski: string
      land: string
      commercial: string
      hotel: string
    }
  }
> = {
  ar: {
    searchBtn: 'بحث',
    allTypesOption: 'كل الأنواع',
    everywhereBtn: 'في كل مكان',
    cashAndInstallmentsBtn: 'الكاش والأقساط ($)',
    roomsBtn: 'الغرف',
    areaBtn: 'المساحة',
    commuteBtn: 'التنقل',
    searchResultsPrefix: 'نتائج البحث:',
    activeSearchLabel: 'البحث النشط:',
    clearFilterShowAllBtn: 'إلغاء الفلتر وعرض الكل',
    saveSearchBtn: 'حفظ البحث',
    searchSavedToast: 'تم حفظ البحث ✓',
    listViewBtn: 'قائمة',
    map2dBtn: 'الخريطة',
    map3dBtn: 'خريطة ثلاثية الأبعاد',
    showingRangePrefix: 'عرض',
    showingRangeOf: 'من أصل',
    prevPageBtn: 'السابق',
    nextPageBtn: 'التالي',
    adCardBadge: 'مساحة إعلانية',
    adCardTitle: 'إعلانك هنا',
    adCardSub: 'انشر إعلانك واصل إلى آلاف المشترين والمستثمرين في العقارات.',
    adBullet1: 'جمهور مستهدف من المشترين',
    adBullet2: 'تواصل مباشر وسريع',
    adBullet3: 'إحصائيات ومشاهدات شفافة',
    adCardBtn: 'أعلن هنا ←',
    newlyAddedHeading: 'أضيفت حديثاً (مرتبة حسب التاريخ)',
    chips: {
      all: 'كل عروض التنازل',
      apartments: 'شقق بالتقسيط',
      houses: 'منازل وفيلات',
      cottages: 'أكواخ وشاليهات',
      luxury: 'عقارات فاخرة',
      ready: 'استلام فوري',
      underConst: 'قيد الإنشاء',
      sea: 'إطلالة بحرية',
      pool: 'مع حمام سباحة',
      jacuzzi: 'مع جاكوزي',
      ski: 'منتجعات تزلج',
      land: 'قطع أراضٍ',
      commercial: 'تجاري وإداري',
      hotel: 'شقق فندقية',
    },
  },
  en: {
    searchBtn: 'Search',
    allTypesOption: 'All types',
    everywhereBtn: 'Everywhere',
    cashAndInstallmentsBtn: 'Cash & Installments ($)',
    roomsBtn: 'Rooms',
    areaBtn: 'Area',
    commuteBtn: 'Commute',
    searchResultsPrefix: 'Search Results:',
    activeSearchLabel: 'Active Search:',
    clearFilterShowAllBtn: 'Clear Filter & Show All',
    saveSearchBtn: 'Save search',
    searchSavedToast: 'Search saved ✓',
    listViewBtn: 'List',
    map2dBtn: 'Map',
    map3dBtn: '3D Map',
    showingRangePrefix: 'Showing',
    showingRangeOf: 'of',
    prevPageBtn: 'Prev',
    nextPageBtn: 'Next',
    adCardBadge: 'Ad Space',
    adCardTitle: 'Your Ad Here',
    adCardSub:
      'Publish your listing and reach thousands of real estate buyers and investors.',
    adBullet1: 'Targeted audience',
    adBullet2: 'Direct contact',
    adBullet3: 'Transparent metrics',
    adCardBtn: 'Advertise Here →',
    newlyAddedHeading: 'Recently Added (Sorted by Date)',
    chips: {
      all: 'All Exit Deals',
      apartments: 'Apartments',
      houses: 'Houses & Villas',
      cottages: 'Cottages',
      luxury: 'Luxury homes',
      ready: 'Ready to move',
      underConst: 'Under construction',
      sea: 'Sea view',
      pool: 'With pool',
      jacuzzi: 'With Jacuzzi',
      ski: 'Ski resorts',
      land: 'Land plots',
      commercial: 'Commercial',
      hotel: 'Hotel units',
    },
  },
  ru: {
    searchBtn: 'Поиск',
    allTypesOption: 'Все типы',
    everywhereBtn: 'Везде',
    cashAndInstallmentsBtn: 'На руки и рассрочка ($)',
    roomsBtn: 'Комнаты',
    areaBtn: 'Площадь',
    commuteBtn: 'В пути',
    searchResultsPrefix: 'Результаты поиска:',
    activeSearchLabel: 'Активный фильтр:',
    clearFilterShowAllBtn: 'Сбросить фильтр и показать все',
    saveSearchBtn: 'Сохранить поиск',
    searchSavedToast: 'Поиск сохранен ✓',
    listViewBtn: 'Список',
    map2dBtn: 'Карта',
    map3dBtn: '3D Карта',
    showingRangePrefix: 'Показано',
    showingRangeOf: 'из',
    prevPageBtn: 'Назад',
    nextPageBtn: 'Далее',
    adCardBadge: 'Рекламное место',
    adCardTitle: 'Ваша реклама здесь',
    adCardSub:
      'Разместите объявление и привлеките тысячи покупателей и инвесторов.',
    adBullet1: 'Целевая аудитория инвесторов',
    adBullet2: 'Прямой контакт с покупателем',
    adBullet3: 'Прозрачная статистика просмотров',
    adCardBtn: 'Разместить →',
    newlyAddedHeading: 'Недавно добавленные (по дате)',
    chips: {
      all: 'Все предложения',
      apartments: 'Квартиры',
      houses: 'Дома и виллы',
      cottages: 'Коттеджи и шале',
      luxury: 'Премиум объекты',
      ready: 'Готово к сдаче',
      underConst: 'Строится',
      sea: 'Вид на море',
      pool: 'С бассейном',
      jacuzzi: 'С джакузи',
      ski: 'Горнолыжные курорты',
      land: 'Участки земли',
      commercial: 'Коммерция',
      hotel: 'Апарт-отели',
    },
  },
  ka: {
    searchBtn: 'ძიება',
    allTypesOption: 'ყველა ტიპი',
    everywhereBtn: 'ყველგან',
    cashAndInstallmentsBtn: 'თანხა და განვადება ($)',
    roomsBtn: 'ოთახები',
    areaBtn: 'ფართობი',
    commuteBtn: 'მგზავრობა',
    searchResultsPrefix: 'ძიების შედეგები:',
    activeSearchLabel: 'აქტიური ფილტრი:',
    clearFilterShowAllBtn: 'ფილტრის გასუფთავება',
    saveSearchBtn: 'ძიების შენახვა',
    searchSavedToast: 'შენახულია ✓',
    listViewBtn: 'სია',
    map2dBtn: 'რუკა',
    map3dBtn: '3D რუკა',
    showingRangePrefix: 'ნაჩვენებია',
    showingRangeOf: 'სულ:',
    prevPageBtn: 'წინა',
    nextPageBtn: 'შემდეგი',
    adCardBadge: 'სარეკლამო სივრცე',
    adCardTitle: 'თქვენი რეკლამა აქ',
    adCardSub:
      'განათავსეთ განცხადება და მიაწვდინეთ ხმა ათასობით მყიდველსა და ინვესტორს.',
    adBullet1: 'მიზნობრივი აუდიტორია',
    adBullet2: 'პირდაპირი კონტაქტი',
    adBullet3: 'გამჭვირვალე სტატისტიკა',
    adCardBtn: 'განთავსება →',
    newlyAddedHeading: 'ახალი დამატებული (თარიღის მიხედვით)',
    chips: {
      all: 'ყველა შეთავაზება',
      apartments: 'ბინები',
      houses: 'სახლები და ვილები',
      cottages: 'კოტეჯები',
      luxury: 'პრემიუმ ქონება',
      ready: 'მზადაა შესასვლელად',
      underConst: 'მშენებარე',
      sea: 'ზღვის ხედით',
      pool: 'აუზით',
      jacuzzi: 'ჯაკუზით',
      ski: 'სათხილამურო კურორტები',
      land: 'მიწის ნაკვეთები',
      commercial: 'კომერციული',
      hotel: 'აპარტ-ოტელი',
    },
  },
}

export function localizePropertyTypeLabel(
  rawType: string,
  locale: LocaleCode
): string {
  const lower = (rawType || '').toLowerCase()
  if (
    lower.includes('studio') ||
    rawType.includes('استوديو') ||
    lower.includes('студия') ||
    rawType.includes('სტუდიო')
  ) {
    return locale === 'ar'
      ? 'استوديو'
      : locale === 'ru'
        ? 'Студия'
        : locale === 'ka'
          ? 'სტუდიო'
          : 'Studio'
  }
  if (
    lower.includes('hotel') ||
    rawType.includes('فندق') ||
    lower.includes('апарт') ||
    rawType.includes('აპარტ')
  ) {
    return locale === 'ar'
      ? 'شقة فندقية'
      : locale === 'ru'
        ? 'Апарт-отель'
        : locale === 'ka'
          ? 'აპარტ-ოტელი'
          : 'Aparthotel'
  }
  if (
    lower.includes('house') ||
    lower.includes('villa') ||
    rawType.includes('فيلا') ||
    rawType.includes('منزل')
  ) {
    return locale === 'ar'
      ? 'فيلا'
      : locale === 'ru'
        ? 'Вилла / Дом'
        : locale === 'ka'
          ? 'ვილა / სახლი'
          : 'Villa'
  }
  if (
    lower.includes('cottage') ||
    lower.includes('chalet') ||
    rawType.includes('شاليه') ||
    rawType.includes('كوخ')
  ) {
    return locale === 'ar'
      ? 'شاليه'
      : locale === 'ru'
        ? 'Коттедж'
        : locale === 'ka'
          ? 'კოტეჯი'
          : 'Cottage'
  }
  if (lower.includes('commercial') || rawType.includes('تجاري')) {
    return locale === 'ar'
      ? 'تجاري'
      : locale === 'ru'
        ? 'Коммерческая'
        : locale === 'ka'
          ? 'კომერციული'
          : 'Commercial'
  }
  if (lower.includes('land') || rawType.includes('أرض')) {
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

/**
 * كارت المساحة الإعلانية بنفس الأنيميشن الاحترافي الموجود في الصفحة الرئيسية
 */
export function InlineAdSlotCard({
  uT,
  tierLabel,
}: {
  uT: Record<string, any>
  tierLabel?: string
}) {
  return (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-xs transition-all duration-500 hover:-translate-y-1.5 hover:border-orange-300/80 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
      <div>
        <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#31102f]">
          {/* إضاءات خلفية متموجة */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -left-10 size-40 animate-pulse rounded-full bg-[#ff6437]/20 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -bottom-10 size-40 animate-pulse rounded-full bg-blue-500/20 blur-2xl"
          />

          {/* حلقات رادار ومدار متحركة مثل كروت الصفحة الرئيسية */}
          <div className="relative flex size-28 items-center justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 animate-[ping_3.2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-orange-400/30 bg-orange-500/5"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-1.5 animate-[spin_14s_linear_infinite] rounded-full border border-dashed border-white/20"
            />
            <div className="relative flex size-22 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xs transition-transform duration-500 group-hover:scale-110">
              <div className="flex size-14 items-center justify-center rounded-full border border-orange-400/40 bg-gradient-to-br from-[#ff6437]/25 to-[#ff4f69]/20 shadow-[0_0_25px_rgba(255,100,55,0.45)]">
                <Sparkles className="size-6 animate-pulse text-[#ff6437] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
              </div>
            </div>
          </div>

          {tierLabel && (
            <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10px] font-black text-white shadow-md">
              <Crown className="size-3 animate-bounce" />
              <span>{tierLabel}</span>
            </span>
          )}

          <span className="absolute end-3 bottom-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10.5px] font-bold text-white backdrop-blur-xs">
            {uT.adCardBadge}
          </span>
        </div>

        <div className="p-5 text-start">
          <h3 className="text-base font-black text-[#0f1d40] transition-colors group-hover:text-[#ff6437] sm:text-lg">
            {uT.adCardTitle}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {uT.adCardSub}
          </p>

          <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
            <li className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-[#ff6437] shadow-[0_0_8px_#ff6437]" />
              <span>{uT.adBullet1}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-[#ff6437] shadow-[0_0_8px_#ff6437]" />
              <span>{uT.adBullet2}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-[#ff6437] shadow-[0_0_8px_#ff6437]" />
              <span>{uT.adBullet3}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3.5 text-start">
        <Link
          href="/#boost-packages-section"
          className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-extrabold text-white shadow-[0_6px_18px_rgba(255,100,55,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_24px_rgba(255,100,55,0.5)]"
        >
          {uT.adCardBtn}
        </Link>
      </div>
    </div>
  )
}

export function getQuickCategoryChips(uT: Record<string, any>) {
  return [
    {
      id: '',
      label: uT.chips.all,
      icon: Grid2X2,
      feature: '',
      type: '',
    },
    {
      id: 'Apartment',
      label: uT.chips.apartments,
      icon: Building2,
      feature: '',
      type: 'Apartment',
    },
    {
      id: 'Private house',
      label: uT.chips.houses,
      icon: Home,
      feature: '',
      type: 'Private house',
    },
    {
      id: 'Cottage',
      label: uT.chips.cottages,
      icon: Trees,
      feature: '',
      type: 'Cottage',
    },
    {
      id: 'luxury',
      label: uT.chips.luxury,
      icon: Gem,
      feature: 'Panoramic view',
      type: '',
    },
    {
      id: 'ready',
      label: uT.chips.ready,
      icon: Calendar,
      feature: '',
      type: '',
    },
    {
      id: 'under_const',
      label: uT.chips.underConst,
      icon: Building,
      feature: '',
      type: '',
    },
    {
      id: 'sea',
      label: uT.chips.sea,
      icon: Waves,
      feature: 'Sea view',
      type: '',
    },
    {
      id: 'pool',
      label: uT.chips.pool,
      icon: Sparkles,
      feature: 'Pool',
      type: '',
    },
    {
      id: 'jacuzzi',
      label: uT.chips.jacuzzi,
      icon: Bath,
      feature: 'Jacuzzi',
      type: '',
    },
    {
      id: 'ski',
      label: uT.chips.ski,
      icon: Mountain,
      feature: 'Ski access',
      type: '',
    },
    {
      id: 'Land',
      label: uT.chips.land,
      icon: MapPin,
      feature: '',
      type: 'Land',
    },
    {
      id: 'Commercial',
      label: uT.chips.commercial,
      icon: Store,
      feature: '',
      type: 'Commercial',
    },
    {
      id: 'Hotel',
      label: uT.chips.hotel,
      icon: Hotel,
      feature: '',
      type: 'Hotel',
    },
  ]
}

export function OpportunitiesFilterSection({
  t,
  uT,
  activeLocale,
  dir,
  isAr,
  search,
  setSearch,
  areaQuery,
  setAreaQuery,
  negotiable,
  setNegotiable,
  sortIdx,
  setSortIdx,
  strictDateSort,
  setStrictDateSort,
  maxCash,
  setMaxCash,
  maxInstallment,
  setMaxInstallment,
  maxContractPrice,
  setMaxContractPrice,
  selectedTypes,
  toggleType,
  localizedTypes,
  selectedFeature,
  setSelectedFeature,
  activeCategoryLabel,
  setActiveCategoryLabel,
  deliveryStatusIdx,
  setDeliveryStatusIdx,
  deliveryYearIdx,
  setDeliveryYearIdx,
  contractYearIdx,
  setContractYearIdx,
  minRoomsIdx,
  setMinRoomsIdx,
  sivrceFilters,
  updateSivrceFilter,
  openPanel,
  setOpenPanel,
  activeFilterCount,
  availableUnitsCount,
  savedSearchToast,
  setSavedSearchToast,
  setViewMode,
  clearAll,
}: {
  t: Record<string, any>
  uT: Record<string, any>
  activeLocale: LocaleCode
  dir: 'rtl' | 'ltr'
  isAr: boolean
  search: string
  setSearch: (v: string) => void
  areaQuery: string
  setAreaQuery: (v: string) => void
  negotiable: boolean
  setNegotiable: (v: boolean) => void
  sortIdx: number
  setSortIdx: (v: number) => void
  strictDateSort: boolean
  setStrictDateSort: (v: boolean) => void
  maxCash: string
  setMaxCash: (v: string) => void
  maxInstallment: string
  setMaxInstallment: (v: string) => void
  maxContractPrice: string
  setMaxContractPrice: (v: string) => void
  selectedTypes: string[]
  toggleType: (tp: string) => void
  localizedTypes: string[]
  selectedFeature: string
  setSelectedFeature: (v: string) => void
  activeCategoryLabel: string
  setActiveCategoryLabel: (v: string) => void
  deliveryStatusIdx: number
  setDeliveryStatusIdx: (v: number) => void
  deliveryYearIdx: number
  setDeliveryYearIdx: (v: number) => void
  contractYearIdx: number
  setContractYearIdx: (v: number) => void
  minRoomsIdx: number
  setMinRoomsIdx: (v: number) => void
  sivrceFilters: SearchFiltersState
  updateSivrceFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  openPanel: null | 'type' | 'price' | 'rooms' | 'area' | 'commute' | 'more'
  setOpenPanel: (
    p: null | 'type' | 'price' | 'rooms' | 'area' | 'commute' | 'more'
  ) => void
  activeFilterCount: number
  availableUnitsCount: number
  savedSearchToast: boolean
  setSavedSearchToast: (v: boolean) => void
  setViewMode: (m: 'list' | 'map2d' | 'map3d') => void
  clearAll: () => void
}) {
  const chipsScrollRef = useRef<HTMLDivElement>(null)
  const quickCategoryChips = useMemo(() => getQuickCategoryChips(uT), [uT])

  const typeMenuOptions = useMemo(() => {
    return [
      { id: '', label: uT.allTypesOption },
      ...PROPERTY_KINDS.map((k) => ({
        id: k.id,
        label: getOptionLabel(k, activeLocale),
      })),
    ]
  }, [uT.allTypesOption, activeLocale])

  const selectedTypeDisplay = useMemo(() => {
    if (sivrceFilters.propertyType) {
      const found = PROPERTY_KINDS.find(
        (k) => k.id === sivrceFilters.propertyType
      )
      if (found) return getOptionLabel(found, activeLocale)
      return sivrceFilters.propertyType
    }
    return selectedTypes[0] || t.filters.unitTypeLabel
  }, [
    sivrceFilters.propertyType,
    selectedTypes,
    activeLocale,
    t.filters.unitTypeLabel,
  ])

  return (
    <>
      <section className="mt-5 rounded-[22px] border border-slate-200/90 bg-white p-3 shadow-xs sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[230px] flex-1 items-center gap-2 rounded-full bg-slate-100/80 py-1 ps-3.5 pe-1.5">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.filters.searchPlaceholder}
              className="h-8 w-full bg-transparent text-xs font-semibold text-[#0f1d40] placeholder:text-slate-400 focus:outline-none sm:text-[13px]"
            />
            <button
              type="button"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-[#2563eb] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
            >
              <Search className="size-3" />
              <span>{uT.searchBtn}</span>
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenPanel(openPanel === 'type' ? null : 'type')
              }
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                sivrceFilters.propertyType || selectedTypes.length > 0
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <Layers className="size-3.5 text-slate-400" />
              <span>{selectedTypeDisplay}</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {openPanel === 'type' && (
              <div className="absolute start-0 top-11 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                {typeMenuOptions.map((tp) => (
                  <button
                    key={tp.id || 'all'}
                    type="button"
                    onClick={() => {
                      updateSivrceFilter('propertyType', tp.id)
                      setActiveCategoryLabel(tp.id ? tp.label : '')
                      setOpenPanel(null)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${
                      sivrceFilters.propertyType === tp.id
                        ? 'bg-blue-50 font-bold text-[#2563eb]'
                        : 'text-[#0f1d40] hover:bg-slate-50'
                    }`}
                  >
                    <span>{tp.label}</span>
                    {sivrceFilters.propertyType === tp.id && (
                      <Check className="size-3.5 text-[#2563eb]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <SivrceLocationModalPicker
            value={areaQuery}
            displayText={
              areaQuery
                ? getLocalizedGeorgiaAreaName(areaQuery, activeLocale)
                : ''
            }
            showEverywhereOption={true}
            onSelectLocation={({ areaId, displayLabel }) => {
              setAreaQuery(areaId)
              updateSivrceFilter('location', areaId)
              updateSivrceFilter('locationDisplay', displayLabel)
            }}
            customTrigger={({ onClick, resolvedDisplay }) => (
              <button
                type="button"
                onClick={onClick}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                  areaQuery
                    ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                    : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
                }`}
              >
                <MapPin className="size-3.5 text-slate-400" />
                <span>{resolvedDisplay || uT.everywhereBtn}</span>
              </button>
            )}
          />

          <button
            type="button"
            onClick={() =>
              setOpenPanel(openPanel === 'price' ? null : 'price')
            }
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
              openPanel === 'price' ||
              sivrceFilters.minPrice ||
              sivrceFilters.maxPrice ||
              maxCash ||
              maxInstallment
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>{uT.cashAndInstallmentsBtn}</span>
            <ChevronDown className="size-3" />
          </button>

          <button
            type="button"
            onClick={() =>
              setOpenPanel(openPanel === 'rooms' ? null : 'rooms')
            }
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
              openPanel === 'rooms' || sivrceFilters.rooms || minRoomsIdx > 0
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>
              {sivrceFilters.rooms
                ? `${sivrceFilters.rooms} ${t.card.roomsWord}`
                : uT.roomsBtn}
            </span>
            <ChevronDown className="size-3" />
          </button>

          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'area' ? null : 'area')}
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
              openPanel === 'area' ||
              sivrceFilters.minArea ||
              sivrceFilters.maxArea
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>{uT.areaBtn}</span>
            <ChevronDown className="size-3" />
          </button>

          <button
            type="button"
            onClick={() =>
              setOpenPanel(openPanel === 'commute' ? null : 'commute')
            }
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
              openPanel === 'commute' || sivrceFilters.commuteDest
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <Clock3 className="size-3.5" />
            <span>{uT.commuteBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'more' ? null : 'more')}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
              openPanel === 'more' || activeFilterCount > 0
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{t.filters.advancedFilterBtn}</span>
            {activeFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setNegotiable(!negotiable)}
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-bold transition ${
              negotiable
                ? 'border-[#d97706] bg-amber-50/60 text-[#b45309]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>{t.filters.negotiableBtn}</span>
            <ArrowDown className="size-3 text-[#d97706]" />
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0f1d40]"
            title={t.filters.clearAllBtn}
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {openPanel === 'price' && (
          <PriceFilterPanel
            filters={sivrceFilters}
            updateFilter={updateSivrceFilter}
            maxCash={maxCash}
            setMaxCash={setMaxCash}
            maxInstallment={maxInstallment}
            setMaxInstallment={setMaxInstallment}
            maxContractPrice={maxContractPrice}
            setMaxContractPrice={setMaxContractPrice}
            tFilters={t.filters}
            isAr={isAr}
          />
        )}
        {openPanel === 'rooms' && (
          <RoomsFilterPanel
            filters={sivrceFilters}
            updateFilter={updateSivrceFilter}
            setMinRoomsIdx={setMinRoomsIdx}
          />
        )}
        {openPanel === 'area' && (
          <AreaFilterPanel
            filters={sivrceFilters}
            updateFilter={updateSivrceFilter}
            isAr={isAr}
          />
        )}
        {openPanel === 'commute' && (
          <CommuteFilterPanel
            filters={sivrceFilters}
            updateFilter={updateSivrceFilter}
            onClose={() => setOpenPanel(null)}
            isAr={isAr}
          />
        )}
        {openPanel === 'more' && (
          <MoreFiltersMegaPanel
            filters={sivrceFilters}
            updateFilter={updateSivrceFilter}
            selectedTypes={selectedTypes}
            toggleType={toggleType}
            localizedTypes={localizedTypes}
            deliveryStatusIdx={deliveryStatusIdx}
            setDeliveryStatusIdx={setDeliveryStatusIdx}
            deliveryYearIdx={deliveryYearIdx}
            setDeliveryYearIdx={setDeliveryYearIdx}
            contractYearIdx={contractYearIdx}
            setContractYearIdx={setContractYearIdx}
            tFilters={t.filters}
            onClearAll={clearAll}
            onClose={() => setOpenPanel(null)}
            isAr={isAr}
          />
        )}
      </section>

      <div className="relative mt-3 flex items-center">
        <div
          ref={chipsScrollRef}
          className="flex items-center gap-2 overflow-x-auto py-1.5 pe-10 no-scrollbar"
        >
          <button
            type="button"
            onClick={() =>
              updateSivrceFilter(
                'vipTier',
                sivrceFilters.vipTier === 'SUPER VIP' ? '' : 'SUPER VIP'
              )
            }
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
              sivrceFilters.vipTier === 'SUPER VIP'
                ? 'border-[#ff6437] bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-2xs'
                : 'border-orange-200 bg-orange-50/70 text-[#ff6437] hover:bg-orange-100/70'
            }`}
          >
            <Crown className="size-3.5" />
            <span>SUPER VIP</span>
          </button>

          <button
            type="button"
            onClick={() =>
              updateSivrceFilter(
                'vipTier',
                sivrceFilters.vipTier === '+VIP' ? '' : '+VIP'
              )
            }
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
              sivrceFilters.vipTier === '+VIP'
                ? 'border-[#4f46e5] bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-2xs'
                : 'border-indigo-200 bg-indigo-50/70 text-[#4f46e5] hover:bg-indigo-100/70'
            }`}
          >
            <Flame className="size-3.5" />
            <span>+VIP</span>
          </button>

          {quickCategoryChips.map((chip) => {
            const Icon = chip.icon
            const active = sivrceFilters.quickTag === chip.id
            return (
              <button
                key={chip.id || 'all-chips'}
                type="button"
                onClick={() => {
                  updateSivrceFilter('quickTag', chip.id)
                  setActiveCategoryLabel(chip.id ? chip.label : '')
                  setSelectedFeature(chip.feature || '')
                  updateSivrceFilter('propertyType', chip.type || '')
                  if (chip.id === 'ready') {
                    setDeliveryStatusIdx(1)
                  } else if (chip.id === 'under_const') {
                    setDeliveryStatusIdx(2)
                  } else {
                    setDeliveryStatusIdx(0)
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[#0f1d40] bg-[#0f1d40] font-bold text-white shadow-2xs'
                    : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-[#0f1d40]'
                }`}
              >
                <Icon className="size-3.5" />
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            chipsScrollRef.current?.scrollBy({
              left: dir === 'rtl' ? -240 : 240,
              behavior: 'smooth',
            })
          }
          className="absolute end-0 flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
        >
          {dir === 'rtl' ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm font-bold text-[#0f1d40]">
            {availableUnitsCount.toLocaleString('en-US')}{' '}
            {t.filters.availableUnitCountWord}
          </strong>

          {sivrceFilters.vipTier && (
            <button
              type="button"
              onClick={() => updateSivrceFilter('vipTier', '')}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563eb] transition hover:bg-blue-100"
            >
              <span>{sivrceFilters.vipTier}</span>
              <X className="size-3" />
            </button>
          )}

          {strictDateSort && (
            <button
              type="button"
              onClick={() => {
                setStrictDateSort(false)
                setActiveCategoryLabel('')
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#eaf8f2] px-3 py-1 text-xs font-extrabold text-[#007a5a]"
            >
              <span>{uT.newlyAddedHeading}</span>
              <X className="size-3" />
            </button>
          )}

          {negotiable && (
            <button
              type="button"
              onClick={() => setNegotiable(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
            >
              <span>{t.filters.negotiableBtn}</span>
              <X className="size-3" />
            </button>
          )}

          {selectedFeature && (
            <button
              type="button"
              onClick={() => {
                setSelectedFeature('')
                setActiveCategoryLabel('')
                updateSivrceFilter('quickTag', '')
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#2563eb] sm:text-xs"
            >
              <span>{activeCategoryLabel || selectedFeature}</span>
              <X className="size-3" />
            </button>
          )}

          {areaQuery.trim() && (
            <button
              type="button"
              onClick={() => setAreaQuery('')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)] sm:text-xs"
            >
              <span>
                {t.filters.areaBadgePrefix}{' '}
                {getLocalizedGeorgiaAreaName(areaQuery, activeLocale)}
              </span>
              <X className="size-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setSavedSearchToast(true)
              setTimeout(() => setSavedSearchToast(false), 2500)
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            <Bookmark className="size-3.5" />
            <span>
              {savedSearchToast ? uT.searchSavedToast : uT.saveSearchBtn}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="sort-select"
              className="text-[11px] text-gray-400 sm:text-xs"
            >
              {t.filters.sortLabel}
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortIdx}
                onChange={(e) => {
                  const nextIdx = Number(e.target.value)
                  setSortIdx(nextIdx)
                  setStrictDateSort(nextIdx === 1)
                }}
                className="h-9 min-w-[130px] appearance-none rounded-full border border-slate-200 bg-white pr-3.5 pl-8 text-xs font-bold text-[#0f1d40] shadow-2xs focus:border-[#007a5a] focus:outline-none sm:min-w-[155px]"
              >
                {t.filters.sorts.map((item: string, idx: number) => (
                  <option key={item} value={idx}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-[#0f1d40]"
            >
              {uT.listViewBtn}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map2d')}
              className="inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0f1d40]"
            >
              <span>{uT.map2dBtn}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setViewMode('map3d')}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,100,55,0.3)] transition hover:opacity-95"
          >
            <Layers className="size-3.5" />
            <span>{uT.map3dBtn}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function OpportunitiesPagination({
  totalPages,
  safeCurrentPage,
  pageNumbers,
  handleGoToPage,
  dir,
  uT,
}: {
  totalPages: number
  safeCurrentPage: number
  pageNumbers: number[]
  handleGoToPage: (p: number) => void
  dir: 'rtl' | 'ltr'
  uT: Record<string, any>
}) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10"
    >
      <button
        type="button"
        disabled={safeCurrentPage <= 1}
        onClick={() => handleGoToPage(safeCurrentPage - 1)}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {dir === 'rtl' ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
        <span>{uT.prevPageBtn}</span>
      </button>

      {pageNumbers.map((pageNum) => {
        const isActive = pageNum === safeCurrentPage
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => handleGoToPage(pageNum)}
            className={`flex size-10 items-center justify-center rounded-xl border text-xs font-extrabold transition tabular-nums ${
              isActive
                ? 'border-[#007a5a] bg-[#007a5a] text-white shadow-sm'
                : 'border-slate-200 bg-white text-[#0f1d40] hover:border-[#2563eb] hover:text-[#2563eb]'
            }`}
          >
            {pageNum}
          </button>
        )
      })}

      <button
        type="button"
        disabled={safeCurrentPage >= totalPages}
        onClick={() => handleGoToPage(safeCurrentPage + 1)}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>{uT.nextPageBtn}</span>
        {dir === 'rtl' ? (
          <ChevronLeft className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>
    </nav>
  )
}