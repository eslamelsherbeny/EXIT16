'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bath,
  BedDouble,
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
  Gem,
  Grid2X2,
  Home,
  Hotel,
  KeyRound,
  Layers,
  LayoutList,
  Map,
  MapPin,
  Megaphone,
  Mountain,
  PawPrint,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trees,
  Waves,
  X,
} from 'lucide-react'
import { SivrceLocationModalPicker } from '@/components/features/seller/seller-location-modal'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  cleanPureLocaleText,
  FALLBACK_SHOWCASE_UNITS,
  getLocalizedUnitTitle,
  type HomeUnitCardItem,
} from '../home/home-data'
import { HomePropertyCard } from '../home/home-property-card'
import {
  AreaFilterPanel,
  CommuteFilterPanel,
  MoreFiltersMegaPanel,
  PriceFilterPanel,
  RoomsFilterPanel,
  type SearchFiltersState,
} from './search-filter-popovers'
import { Search3DMapView } from './search-3d-map-view'

export function OpportunitiesSearchClient({
  initialUnits,
  initialCategory = 'all',
  initialType = '',
  initialArea = '',
  initialRooms = '',
  initialQuery = '',
  initialViewMode = 'list',
}: {
  initialUnits: HomeUnitCardItem[]
  initialCategory?: string
  initialType?: string
  initialArea?: string
  initialRooms?: string
  initialQuery?: string
  initialViewMode?: 'list' | 'map2d' | 'map3d'
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const GEL = '₾'

  const [viewMode, setViewMode] = useState<'list' | 'map2d' | 'map3d'>(
    initialViewMode
  )
  const [gridLayout, setGridLayout] = useState<'grid' | 'rows'>('grid')
  const [openPanel, setOpenPanel] = useState<
    null | 'type' | 'price' | 'rooms' | 'area' | 'commute' | 'more' | 'sort'
  >(null)
  const [savedSearchToast, setSavedSearchToast] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  const [filters, setFilters] = useState<SearchFiltersState>({
    q: initialQuery,
    deal: (['exit', 'sale', 'rent_monthly', 'rent_daily'].includes(
      initialCategory
    )
      ? initialCategory
      : 'all') as SearchFiltersState['deal'],
    propertyType: initialType,
    location: initialArea,
    locationDisplay: initialArea
      ? cleanPureLocaleText(
          getLocalizedGeorgiaAreaName(initialArea, locale),
          locale
        )
      : '',
    minPrice: '',
    maxPrice: '',
    currency: 'GEL',
    rooms: initialRooms,
    minArea: '',
    maxArea: '',
    commuteDest: '',
    commuteMode: 'car',
    commuteMinutes: '20',
    vipTier: '',
    bathrooms: '',
    minFloor: '',
    maxFloor: '',
    sellerType: '',
    condition: '',
    buildingStatus: '',
    buildingSeries: '',
    floorType: '',
    heating: '',
    quickTag: '',
    sortBy: 'date',
  })

  const chipsScrollRef = useRef<HTMLDivElement>(null)

  const updateFilter = <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
  }

  const handleResetAll = () => {
    setFilters({
      q: '',
      deal: 'all',
      propertyType: '',
      location: '',
      locationDisplay: '',
      minPrice: '',
      maxPrice: '',
      currency: 'GEL',
      rooms: '',
      minArea: '',
      maxArea: '',
      commuteDest: '',
      commuteMode: 'car',
      commuteMinutes: '20',
      vipTier: '',
      bathrooms: '',
      minFloor: '',
      maxFloor: '',
      sellerType: '',
      condition: '',
      buildingStatus: '',
      buildingSeries: '',
      floorType: '',
      heating: '',
      quickTag: '',
      sortBy: 'date',
    })
    setOpenPanel(null)
  }

  const allUnits = useMemo(() => {
    const combined = [...(initialUnits || []), ...FALLBACK_SHOWCASE_UNITS]
    const seen = new Set<string>()
    return combined.filter((u) => {
      if (seen.has(u.id)) return false
      seen.add(u.id)
      return true
    })
  }, [initialUnits])

  // فلترة وترتيب الوحدات الحية
  const filteredUnits = useMemo(() => {
    const list = allUnits.filter((u) => {
      if (filters.deal !== 'all' && u.category !== filters.deal) return false
      if (
        filters.propertyType &&
        !u.title.toLowerCase().includes(filters.propertyType.toLowerCase()) &&
        filters.propertyType !== 'Apartment'
      ) {
        return false
      }
      if (
        filters.location &&
        !u.area.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false
      }
      if (filters.rooms) {
        const rNum = Number(filters.rooms)
        if (rNum === 5 ? u.rooms < 5 : u.rooms !== rNum) return false
      }
      if (filters.minPrice && u.price < Number(filters.minPrice)) return false
      if (filters.maxPrice && u.price > Number(filters.maxPrice)) return false
      if (filters.minArea && u.size < Number(filters.minArea)) return false
      if (filters.maxArea && u.size > Number(filters.maxArea)) return false
      if (filters.q.trim()) {
        const qLower = filters.q.trim().toLowerCase()
        const matchTitle = u.title.toLowerCase().includes(qLower)
        const matchArea = u.area.toLowerCase().includes(qLower)
        const matchId = u.id.toLowerCase().includes(qLower)
        if (!matchTitle && !matchArea && !matchId) return false
      }
      return true
    })

    return list.sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.price - b.price
      if (filters.sortBy === 'price_desc') return b.price - a.price
      if (filters.sortBy === 'area_desc') return b.size - a.size
      if (filters.sortBy === 'sqm_asc')
        return a.price / (a.size || 1) - b.price / (b.size || 1)
      if (filters.sortBy === 'sqm_desc')
        return b.price / (b.size || 1) - a.price / (a.size || 1)
      return 0
    })
  }, [allUnits, filters])

  const toggleFav = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const quickCategoryChips = [
    { id: '', label: isAr ? 'كل الأنواع' : 'All types', icon: Grid2X2 },
    { id: 'exit', label: isAr ? 'تنازل وأقساط' : 'Installment Exit', icon: ShieldCheck },
    { id: 'Apartment', label: isAr ? 'شقق' : 'Apartments', icon: Building2 },
    { id: 'metro', label: isAr ? 'شقق قرب المترو' : 'Near metro', icon: MapPin },
    { id: 'Private house', label: isAr ? 'منازل' : 'Houses', icon: Home },
    { id: 'Cottage', label: isAr ? 'أكواخ' : 'Cottages', icon: Trees },
    { id: 'luxury', label: isAr ? 'عقارات فاخرة' : 'Luxury homes', icon: Gem },
    { id: 'rent_daily', label: isAr ? 'شقق يومية' : 'Daily stays', icon: Calendar },
    { id: 'self_checkin', label: isAr ? 'تسجيل وصول ذاتي' : 'Self check-in', icon: KeyRound },
    { id: 'sea', label: isAr ? 'إطلالة على البحر' : 'Sea view', icon: Waves },
    { id: 'pool', label: isAr ? 'مع حمام سباحة' : 'With pool', icon: Sparkles },
    { id: 'jacuzzi', label: isAr ? 'مع جاكوزي' : 'With Jacuzzi', icon: Bath },
    { id: 'ski', label: isAr ? 'منتجعات تزلج' : 'Ski resorts', icon: Mountain },
    { id: 'pet', label: isAr ? 'مسموح بالحيوانات الأليفة' : 'Pet friendly', icon: PawPrint },
    { id: 'workspace', label: isAr ? 'مساحة عمل' : 'Workspace', icon: Layers },
    { id: 'penthouse', label: isAr ? 'بنتهاوس' : 'Penthouse', icon: Crown },
    { id: 'Land', label: isAr ? 'قطع أراضٍ' : 'Land plots', icon: MapPin },
    { id: 'Commercial', label: isAr ? 'تجاري' : 'Commercial', icon: Store },
    { id: 'Hotel', label: isAr ? 'فنادق' : 'Hotels', icon: Hotel },
    { id: 'new_dev', label: isAr ? 'مشاريع جديدة' : 'New projects', icon: Building },
  ]

  const sortOptions = [
    { id: 'date', label: isAr ? 'حسب التاريخ' : 'By date' },
    {
      id: 'price_asc',
      label: isAr ? 'السعر: من الأقل إلى الأعلى' : 'Price: low to high',
    },
    {
      id: 'price_desc',
      label: isAr ? 'السعر: من الأعلى إلى الأقل' : 'Price: high to low',
    },
    { id: 'area_desc', label: isAr ? 'حسب المساحة' : 'By area' },
    {
      id: 'sqm_asc',
      label: isAr ? 'سعر/م²: من الأقل للأعلى' : 'Price/m²: low to high',
    },
    {
      id: 'sqm_desc',
      label: isAr ? 'سعر/م²: من الأعلى للأقل' : 'Price/m²: high to low',
    },
    { id: 'ai', label: isAr ? 'تقييم AI' : 'AI score' },
  ] as const

  // إذا اختار المستخدم وضع الخريطة 2D أو 3D نعرض واجهة الخريطة التفاعلية الكاملة
  if (viewMode === 'map2d' || viewMode === 'map3d') {
    return (
      <Search3DMapView
        units={filteredUnits}
        is3DMode={viewMode === 'map3d'}
        setIs3DMode={(v) => setViewMode(v ? 'map3d' : 'map2d')}
        onBackToList={() => setViewMode('list')}
        searchQuery={filters.q}
        setSearchQuery={(q) => updateFilter('q', q)}
        dealFilter={filters.deal}
        setDealFilter={(d) => updateFilter('deal', d)}
        typeFilter={filters.propertyType}
        setTypeFilter={(t) => updateFilter('propertyType', t)}
        onResetFilters={handleResetAll}
      />
    )
  }

  return (
    <div dir={dir} className="min-h-screen bg-[#f6f8fc] pb-20 pt-6 text-[#0f1d40]">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* 1. عنوان الصفحة والموقع المختار */}
        <div className="mb-4 text-start">
          <h1 className="text-2xl font-black tracking-tight text-[#0f1d40] sm:text-3xl">
            {isAr ? 'بحث' : 'Search'}
          </h1>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-400">
            <MapPin className="size-3.5 text-[#2563eb]" />
            <span>
              {filters.locationDisplay ||
                (isAr ? 'في كل مكان' : 'Everywhere')}
            </span>
          </p>
        </div>

        {/* 2. شريط الفلترة الرئيسي الأفقي (مطابق للصور 2 و 3 و 4) */}
        <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-slate-200/90 bg-white p-2.5 shadow-xs">
          {/* حقل البحث النصي + زر بحث الأزرق */}
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full bg-slate-100/80 ps-3.5 pe-1.5 py-1">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder={
                isAr
                  ? 'مدينة، حي، شارع — أو هاتف، كود عقار...'
                  : 'City, district, street — or phone, ID...'
              }
              className="w-full bg-transparent text-xs font-bold text-[#0f1d40] placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-[#2563eb] px-4 text-xs font-black text-white shadow-2xs transition hover:bg-blue-700"
            >
              <Search className="size-3" />
              <span>{isAr ? 'بحث' : 'Search'}</span>
            </button>
          </div>

          {/* تبويبات نوع الصفقة (الكل | تنازل | للبيع | للإيجار | يومي) */}
          <div className="inline-flex items-center rounded-full bg-slate-100/90 p-1 text-xs font-extrabold">
            {(
              [
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'exit', label: isAr ? 'تنازل' : 'Exit' },
                { id: 'sale', label: isAr ? 'للبيع' : 'For sale' },
                { id: 'rent_monthly', label: isAr ? 'للإيجار' : 'For rent' },
                { id: 'rent_daily', label: isAr ? 'يومي' : 'Daily' },
              ] as const
            ).map((d) => {
              const active = filters.deal === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => updateFilter('deal', d.id)}
                  className={`rounded-full px-3.5 py-1.5 transition ${
                    active
                      ? 'bg-[#2563eb] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#0f1d40]'
                  }`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>

          {/* فلتر نوع العقار */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenPanel(openPanel === 'type' ? null : 'type')
              }
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold transition ${
                filters.propertyType
                  ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                  : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
              }`}
            >
              <Layers className="size-3.5 text-slate-400" />
              <span>
                {filters.propertyType ||
                  (isAr ? 'نوع العقار' : 'Property type')}
              </span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {openPanel === 'type' && (
              <div className="absolute start-0 top-11 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                {[
                  { id: '', label: isAr ? 'كل الأنواع' : 'All types' },
                  { id: 'Apartment', label: isAr ? 'شقة' : 'Apartment' },
                  { id: 'Private house', label: isAr ? 'منزل خاص' : 'House' },
                  { id: 'Cottage', label: isAr ? 'كوخ' : 'Cottage' },
                  { id: 'Commercial', label: isAr ? 'تجاري' : 'Commercial' },
                  { id: 'Land', label: isAr ? 'أرض' : 'Land' },
                  { id: 'Hotel', label: isAr ? 'فندق' : 'Hotel' },
                ].map((t) => (
                  <button
                    key={t.id || 'all'}
                    type="button"
                    onClick={() => {
                      updateFilter('propertyType', t.id)
                      setOpenPanel(null)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${
                      filters.propertyType === t.id
                        ? 'bg-blue-50 text-[#2563eb]'
                        : 'text-[#0f1d40] hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.label}</span>
                    {filters.propertyType === t.id && (
                      <Check className="size-3.5 text-[#2563eb]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* فلتر الموقع (يفتح نافذة الموقع الشاملة مع "في كل مكان") */}
          <SivrceLocationModalPicker
            value={filters.location}
            displayText={filters.locationDisplay}
            showEverywhereOption={true}
            onSelectLocation={({ areaId, displayLabel }) => {
              updateFilter('location', areaId)
              updateFilter(
                'locationDisplay',
                areaId ? cleanPureLocaleText(displayLabel, locale) : ''
              )
            }}
            customTrigger={({ onClick, resolvedDisplay }) => (
              <button
                type="button"
                onClick={onClick}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold transition ${
                  filters.location
                    ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                    : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
                }`}
              >
                <MapPin className="size-3.5 text-slate-400" />
                <span>
                  {cleanPureLocaleText(resolvedDisplay, locale) ||
                    (isAr ? 'في كل مكان' : 'Everywhere')}
                </span>
              </button>
            )}
          />

          {/* زر السعر */}
          <button
            type="button"
            onClick={() =>
              setOpenPanel(openPanel === 'price' ? null : 'price')
            }
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-extrabold transition ${
              openPanel === 'price' || filters.minPrice || filters.maxPrice
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>{isAr ? 'السعر' : 'Price'}</span>
            <ChevronDown className="size-3" />
          </button>

          {/* زر الغرف */}
          <button
            type="button"
            onClick={() =>
              setOpenPanel(openPanel === 'rooms' ? null : 'rooms')
            }
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-extrabold transition ${
              openPanel === 'rooms' || filters.rooms
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>
              {filters.rooms
                ? `${filters.rooms} ${isAr ? 'غرف' : 'Rooms'}`
                : isAr
                  ? 'الغرف'
                  : 'Rooms'}
            </span>
            <ChevronDown className="size-3" />
          </button>

          {/* زر المساحة */}
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'area' ? null : 'area')}
            className={`inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-xs font-extrabold transition ${
              openPanel === 'area' || filters.minArea || filters.maxArea
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <span>{isAr ? 'المساحة' : 'Area'}</span>
            <ChevronDown className="size-3" />
          </button>

          {/* زر التنقل */}
          <button
            type="button"
            onClick={() =>
              setOpenPanel(openPanel === 'commute' ? null : 'commute')
            }
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold transition ${
              openPanel === 'commute' || filters.commuteDest
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <Clock3 className="size-3.5" />
            <span>{isAr ? 'التنقل' : 'Commute'}</span>
          </button>

          {/* زر المزيد من الفلاتر */}
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'more' ? null : 'more')}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold transition ${
              openPanel === 'more'
                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                : 'border-slate-200 bg-slate-50/70 text-[#0f1d40] hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{isAr ? 'المزيد من الفلاتر' : 'More filters'}</span>
          </button>

          {/* زر إعادة الضبط */}
          <button
            type="button"
            onClick={handleResetAll}
            className="flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0f1d40]"
            title={isAr ? 'مسح الفلاتر' : 'Reset filters'}
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {/* النوافذ التفاعلية التي تنفتح تحت شريط الفلاتر مباشرة */}
        {openPanel === 'price' && (
          <PriceFilterPanel
            filters={filters}
            updateFilter={updateFilter}
            isAr={isAr}
          />
        )}
        {openPanel === 'rooms' && (
          <RoomsFilterPanel filters={filters} updateFilter={updateFilter} />
        )}
        {openPanel === 'area' && (
          <AreaFilterPanel
            filters={filters}
            updateFilter={updateFilter}
            isAr={isAr}
          />
        )}
        {openPanel === 'commute' && (
          <CommuteFilterPanel
            filters={filters}
            updateFilter={updateFilter}
            onClose={() => setOpenPanel(null)}
            isAr={isAr}
          />
        )}
        {openPanel === 'more' && (
          <MoreFiltersMegaPanel
            filters={filters}
            updateFilter={updateFilter}
            isAr={isAr}
          />
        )}

        {/* 3. شريط التصنيفات السريعة الأفقي القابل للتمرير */}
        <div className="relative mt-3 flex items-center">
          <div
            ref={chipsScrollRef}
            className="flex items-center gap-2 overflow-x-auto py-1.5 pe-10 no-scrollbar"
          >
            {quickCategoryChips.map((chip) => {
              const Icon = chip.icon
              const active =
                (chip.id === 'exit' && filters.deal === 'exit') ||
                (chip.id === 'rent_daily' && filters.deal === 'rent_daily') ||
                (chip.id !== 'exit' &&
                  chip.id !== 'rent_daily' &&
                  filters.quickTag === chip.id)

              return (
                <button
                  key={chip.id || 'all-chips'}
                  type="button"
                  onClick={() => {
                    if (chip.id === 'exit') {
                      updateFilter('deal', 'exit')
                    } else if (chip.id === 'rent_daily') {
                      updateFilter('deal', 'rent_daily')
                    } else if (
                      ['Apartment', 'Private house', 'Cottage', 'Land', 'Commercial', 'Hotel'].includes(
                        chip.id
                      )
                    ) {
                      updateFilter('propertyType', chip.id)
                      updateFilter('quickTag', chip.id)
                    } else {
                      updateFilter('quickTag', chip.id)
                      updateFilter('propertyType', '')
                    }
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'border-[#0f1d40] bg-[#0f1d40] text-white shadow-2xs'
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
            aria-label="Scroll categories"
          >
            {dir === 'rtl' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>

        {/* 4. شريط التحكم: عدد الإعلانات + الفلاتر النشطة القابلة للحذف + حفظ البحث + الترتيب + أزرار الخريطة */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {/* اليمين: عدد الإعلانات + الشارات النشطة + حفظ البحث */}
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm font-black text-[#0f1d40]">
              {filteredUnits.length} {isAr ? 'إعلاناً' : 'listings'}
            </strong>

            {filters.deal !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563eb]">
                <span>
                  •{' '}
                  {filters.deal === 'exit'
                    ? isAr
                      ? 'تنازل'
                      : 'Exit'
                    : filters.deal === 'sale'
                      ? isAr
                        ? 'للبيع'
                        : 'For sale'
                      : filters.deal === 'rent_daily'
                        ? isAr
                          ? 'يومي'
                          : 'Daily'
                        : isAr
                          ? 'للإيجار'
                          : 'For rent'}
                </span>
                <button
                  type="button"
                  onClick={() => updateFilter('deal', 'all')}
                  className="hover:text-red-500"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {filters.rooms && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563eb]">
                <span>
                  {filters.rooms} {isAr ? 'الغرف' : 'Rooms'}
                </span>
                <button
                  type="button"
                  onClick={() => updateFilter('rooms', '')}
                  className="hover:text-red-500"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {filters.locationDisplay && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563eb]">
                <span>{filters.locationDisplay}</span>
                <button
                  type="button"
                  onClick={() => {
                    updateFilter('location', '')
                    updateFilter('locationDisplay', '')
                  }}
                  className="hover:text-red-500"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setSavedSearchToast(true)
                setTimeout(() => setSavedSearchToast(false), 2500)
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              <Bookmark className="size-3.5" />
              <span>
                {savedSearchToast
                  ? isAr
                    ? 'تم حفظ البحث ✓'
                    : 'Search saved ✓'
                  : isAr
                    ? 'حفظ البحث'
                    : 'Save search'}
              </span>
            </button>
          </div>

          {/* اليسار: قائمة الترتيب + تبديل العرض + أزرار القائمة / الخريطة / خريطة ثلاثية الأبعاد */}
          <div className="flex flex-wrap items-center gap-2">
            {/* قائمة الترتيب المنسدلة (مطابقة للصورة 8) */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenPanel(openPanel === 'sort' ? null : 'sort')
                }
                className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#0f1d40] shadow-2xs"
              >
                <span>
                  {sortOptions.find((s) => s.id === filters.sortBy)?.label}
                </span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>

              {openPanel === 'sort' && (
                <div className="absolute end-0 top-11 z-40 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl">
                  {sortOptions.map((opt) => {
                    const active = filters.sortBy === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          updateFilter('sortBy', opt.id)
                          setOpenPanel(null)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-start text-xs font-bold transition ${
                          active
                            ? 'bg-[#2563eb] text-white'
                            : 'text-[#0f1d40] hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* أزرار الشبكة / الصفوف */}
            <div className="hidden items-center rounded-full border border-slate-200 bg-white p-1 sm:inline-flex">
              <button
                type="button"
                onClick={() => setGridLayout('grid')}
                className={`rounded-full p-1.5 ${
                  gridLayout === 'grid'
                    ? 'bg-slate-100 text-[#0f1d40]'
                    : 'text-slate-400'
                }`}
                aria-label="Grid view"
              >
                <Grid2X2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setGridLayout('rows')}
                className={`rounded-full p-1.5 ${
                  gridLayout === 'rows'
                    ? 'bg-slate-100 text-[#0f1d40]'
                    : 'text-slate-400'
                }`}
                aria-label="List view"
              >
                <LayoutList className="size-3.5" />
              </button>
            </div>

            {/* أزرار: قائمة | الخريطة | خريطة ثلاثية الأبعاد (البرتقالي البارز) */}
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className=" rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-extrabold text-[#0f1d40]"
              >
                {isAr ? 'قائمة' : 'List'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map2d')}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 hover:text-[#0f1d40]"
              >
                <span>{isAr ? 'الخريطة' : 'Map'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('map3d')}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 text-xs font-black text-white shadow-[0_6px_18px_rgba(255,100,55,0.3)] transition hover:opacity-95"
            >
              <Layers className="size-3.5" />
              <span>{isAr ? 'خريطة ثلاثية الأبعاد' : '3D Map'}</span>
            </button>
          </div>
        </div>

        {/* 5. البانر الإعلاني الأبيض الأفقي ("إعلانك هنا") */}
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:px-7">
          <div className="flex items-center gap-3.5 text-start">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
              <Megaphone className="size-5" />
            </div>
            <div>
              <span className="text-[10.5px] font-extrabold text-[#2563eb]">
                {isAr
                  ? 'مساحة إعلانية · شبكة عقار إكزت'
                  : 'Ad Space · Aqar Exit Network'}
              </span>
              <strong className="block text-sm font-black text-[#0f1d40]">
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
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-black text-white shadow-xs transition hover:opacity-95"
          >
            {isAr ? 'أعلن هنا ←' : 'Advertise →'}
          </Link>
        </div>

        {/* 6. شبكة كروت نتائج البحث */}
        <div
          className={`mt-6 flex flex-wrap gap-5 ${
            gridLayout === 'rows' ? 'flex-col' : 'justify-start'
          }`}
        >
          {filteredUnits.map((unit) => (
            <HomePropertyCard
              key={unit.id}
              unit={unit}
              isFav={favorites.includes(unit.id)}
              onToggleFav={toggleFav}
            />
          ))}
        </div>

        {/* 7. الكلمات السريعة السفلية + شريط "شوهدت مؤخراً" المصغر كما في الصورة الطويلة رقم 10 */}
        <div className="mt-14 border-t border-slate-200/80 pt-8 text-start">
          <span className="block text-xs font-extrabold text-slate-500">
            {isAr
              ? 'عمليات البحث الشائعة في جورجيا'
              : 'Popular searches in Georgia'}
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              {
                label: isAr ? 'شقق للتنازل في تبليسي' : 'Exit apartments Tbilisi',
                onClick: () => updateFilter('deal', 'exit'),
              },
              {
                label: isAr ? 'شقق للبيع في باتومي' : 'Batumi apartments for sale',
                onClick: () => updateFilter('location', 'Batumi'),
              },
              {
                label: isAr ? 'شقق 2 غرف نوم' : '2-bedroom apartments',
                onClick: () => updateFilter('rooms', '2'),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:border-[#2563eb] hover:text-[#2563eb]"
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="mt-7 block text-xs font-extrabold text-slate-500">
            {isAr ? 'شوهدت مؤخراً' : 'Recently viewed'}
          </span>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {allUnits.slice(0, 4).map((u) => {
              const cleanArea = cleanPureLocaleText(
                getLocalizedGeorgiaAreaName(u.area, locale),
                locale
              )
              return (
                <Link
                  key={`mini-${u.id}`}
                  href="/opportunities"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition hover:border-[#2563eb]"
                >
                  <img
                    src={u.image}
                    alt={u.title}
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <strong
                      dir="ltr"
                      className="block text-xs font-black text-[#0f1d40]"
                    >
                      {u.price.toLocaleString('en-US')} {GEL}
                    </strong>
                    <p className="truncate text-[11px] font-bold text-slate-600">
                      {getLocalizedUnitTitle(u, locale, cleanArea)}
                    </p>
                    <span className="block truncate text-[10px] text-slate-400">
                      {cleanArea}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}