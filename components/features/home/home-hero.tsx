'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Home,
  Hotel,
  Layers,
  MapPin,
  Plus,
  Search,
  Store,
  Trees,
} from 'lucide-react'
import { SivrceLocationModalPicker } from '@/components/features/seller/seller-location-modal'
import { useTranslation } from '@/lib/i18n'
import { cleanPureLocaleText, type HomeUnitCardItem } from './home-data'

export function HomeHero({
  realUnitCount,
  units = [],
}: {
  realUnitCount: number
  units?: HomeUnitCardItem[]
}) {
  const router = useRouter()
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const GEL = '₾'

  const [searchMode, setSearchMode] = useState<
    'exit' | 'sale' | 'rent_monthly' | 'rent_daily' | 'new_dev'
  >('exit')
  const [openPopover, setOpenPopover] = useState<
    null | 'type' | 'rooms' | 'price'
  >(null)

  const [propType, setPropType] = useState('')
  const [whereArea, setWhereArea] = useState('')
  const [whereDisplay, setWhereDisplay] = useState('')
  const [roomsFilter, setRoomsFilter] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [quickQuery, setQuickQuery] = useState('')
  const [comingSoonNotice, setComingSoonNotice] = useState(false)

  const filterBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        filterBarRef.current &&
        !filterBarRef.current.contains(e.target as Node)
      ) {
        setOpenPopover(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const propertyTypeOptions = [
    {
      id: '',
      label: isAr ? 'كل الأنواع' : 'All types',
      icon: Layers,
      iconBg: 'bg-slate-100 text-slate-600',
    },
    {
      id: 'Apartment',
      label: isAr ? 'شقة' : 'Apartment',
      icon: Building2,
      iconBg: 'bg-blue-50 text-[#2563eb]',
    },
    {
      id: 'Private house',
      label: isAr ? 'منزل خاص' : 'Private house',
      icon: Home,
      iconBg: 'bg-orange-50 text-[#ea580c]',
    },
    {
      id: 'Cottage',
      label: isAr ? 'كوخ' : 'Cottage',
      icon: Trees,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'Commercial',
      label: isAr ? 'تجاري' : 'Commercial',
      icon: Store,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'Land',
      label: isAr ? 'أرض' : 'Land',
      icon: MapPin,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'Hotel',
      label: isAr ? 'فندق' : 'Hotel',
      icon: Hotel,
      iconBg: 'bg-cyan-50 text-cyan-600',
    },
  ]

  const selectedTypeObj =
    propertyTypeOptions.find((o) => o.id === propType) || propertyTypeOptions[0]

  const roomsTriggerLabel = useMemo(() => {
    const parts: string[] = []
    if (roomsFilter) {
      parts.push(
        isAr
          ? `${roomsFilter} غرف`
          : `${roomsFilter} ${roomsFilter === '1' ? 'Room' : 'Rooms'}`
      )
    }
    if (minArea || maxArea) {
      parts.push(`${minArea || 0}-${maxArea || '∞'} ${isAr ? 'م²' : 'm²'}`)
    }
    return parts.length > 0 ? parts.join(' · ') : isAr ? 'الكل' : 'Any'
  }, [roomsFilter, minArea, maxArea, isAr])

  const priceTriggerLabel = useMemo(() => {
    if (!minPrice && !maxPrice) return isAr ? 'الكل' : 'Any'
    if (minPrice && maxPrice) return `${minPrice} - ${maxPrice} ${GEL}`
    if (minPrice) return `${isAr ? 'من' : 'From'} ${minPrice} ${GEL}`
    return `${isAr ? 'حتى' : 'Up to'} ${maxPrice} ${GEL}`
  }, [minPrice, maxPrice, isAr])

  // حساب عدد الإعلانات المطابقة لحظياً ليظهر داخل زر البحث (خاص بقسم تنازل وأقساط المربوط حالياً)
  const matchingCount = useMemo(() => {
    if (searchMode !== 'exit') return 0
    const baseList = units.length > 0 ? units : []
    if (baseList.length === 0) return realUnitCount > 0 ? realUnitCount : 8

    return baseList.filter((u) => {
      if (
        whereArea &&
        !u.area.toLowerCase().includes(whereArea.toLowerCase())
      ) {
        return false
      }
      if (roomsFilter) {
        const rNum = Number(roomsFilter.replace('+', ''))
        if (rNum === 5 ? u.rooms < 5 : u.rooms !== rNum) return false
      }
      if (minPrice && u.price < Number(minPrice)) return false
      if (maxPrice && u.price > Number(maxPrice)) return false
      if (minArea && u.size < Number(minArea)) return false
      if (maxArea && u.size > Number(maxArea)) return false
      if (quickQuery.trim()) {
        const qLower = quickQuery.trim().toLowerCase()
        if (
          !u.title.toLowerCase().includes(qLower) &&
          !u.area.toLowerCase().includes(qLower)
        ) {
          return false
        }
      }
      return true
    }).length
  }, [
    searchMode,
    units,
    realUnitCount,
    whereArea,
    roomsFilter,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    quickQuery,
  ])

  const handleRunSearch = () => {
    // فقط قسم "تنازل وأقساط" مربوط بالمنتجات حالياً
    if (searchMode !== 'exit') {
      setComingSoonNotice(true)
      setTimeout(() => setComingSoonNotice(false), 3500)
      return
    }

    const params = new URLSearchParams()
    params.set('category', 'exit')
    if (propType) params.set('type', propType)
    if (whereArea) params.set('area', whereArea)
    if (roomsFilter) params.set('rooms', roomsFilter.replace('+', ''))
    if (minArea) params.set('minArea', minArea)
    if (maxArea) params.set('maxArea', maxArea)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (quickQuery.trim()) params.set('q', quickQuery.trim())
    router.push(`/opportunities?${params.toString()}`)
  }

  return (
    <section className="aqar-animated-hero relative overflow-visible border-b border-slate-200/85 px-3 pb-8 pt-5 text-center shadow-[0_6px_24px_rgba(15,29,64,0.04)] sm:px-6 sm:pb-12 sm:pt-10 lg:px-10">
      {/* التدرج المتحرك والطيور والمباني الواضحة في التلفون والكمبيوتر */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="aqar-floating-orb-1" />
        <div className="aqar-floating-orb-2" />

        {/* طيور متحركة تظهر في التلفون والكمبيوتر */}
        <svg
          viewBox="0 0 42 20"
          className="aqar-bird aqar-bird-1"
          fill="none"
        >
          <path
            d="M2 14C9 4 16 6 21 13C26 6 33 4 40 14"
            stroke="rgba(0,122,90,0.42)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          viewBox="0 0 42 20"
          className="aqar-bird aqar-bird-2"
          fill="none"
        >
          <path
            d="M2 14C9 4 16 6 21 13C26 6 33 4 40 14"
            stroke="rgba(255,100,55,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          viewBox="0 0 42 20"
          className="aqar-bird aqar-bird-3 hidden sm:block"
          fill="none"
        >
          <path
            d="M2 14C9 4 16 6 21 13C26 6 33 4 40 14"
            stroke="rgba(37,99,235,0.35)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* الأبراج المعمارية المتحركة موزعة على كامل العرض لتظهر بوضوح في شاشة التلفون والكمبيوتر */}
        <svg
          viewBox="0 0 1440 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 left-0 h-52 w-full object-cover opacity-80 sm:h-60"
          preserveAspectRatio="xMidYMax slice"
        >
          {/* الطبقة الخلفية للأبراج موزعة على كامل الشاشة */}
          <g className="aqar-skyline-wave-2" fill="url(#bgTowersGrad)">
            <rect x="35" y="105" width="58" height="165" rx="5" />
            <rect x="115" y="60" width="72" height="210" rx="5" />
            <rect x="210" y="120" width="56" height="150" rx="5" />
            <rect x="290" y="75" width="68" height="195" rx="5" />
            <rect x="380" y="110" width="62" height="160" rx="5" />
            <rect x="465" y="68" width="74" height="202" rx="5" />
            <rect x="560" y="115" width="60" height="155" rx="5" />
            <rect x="640" y="58" width="76" height="212" rx="5" />
            <rect x="740" y="95" width="66" height="175" rx="5" />
            <rect x="830" y="65" width="74" height="205" rx="5" />
            <rect x="925" y="115" width="58" height="155" rx="5" />
            <rect x="1005" y="80" width="68" height="190" rx="5" />
            <rect x="1100" y="52" width="78" height="218" rx="5" />
            <rect x="1205" y="110" width="62" height="160" rx="5" />
            <rect x="1295" y="70" width="72" height="200" rx="5" />
          </g>

          {/* الطبقة الأمامية للأبراج الزجاجية ثلاثية الأبعاد */}
          <g className="aqar-skyline-wave-1">
            <polygon
              points="85,130 130,105 130,270 85,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="130,105 175,130 175,270 130,270"
              fill="url(#fgTowerRight)"
            />

            <polygon
              points="225,78 280,48 280,270 225,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="280,48 335,78 335,270 280,270"
              fill="url(#fgTowerRight)"
            />

            <polygon
              points="480,85 535,55 535,270 480,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="535,55 590,85 590,270 535,270"
              fill="url(#fgTowerRight)"
            />

            <polygon
              points="660,72 715,42 715,270 660,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="715,42 770,72 770,270 715,270"
              fill="url(#fgTowerRight)"
            />

            <polygon
              points="850,88 905,58 905,270 850,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="905,58 960,88 960,270 905,270"
              fill="url(#fgTowerRight)"
            />

            <polygon
              points="1115,75 1170,45 1170,270 1115,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="1170,45 1225,75 1225,270 1170,270"
              fill="url(#fgTowerRight)"
            />

            <polygon
              points="1255,125 1300,100 1300,270 1255,270"
              fill="url(#fgTowerLeft)"
            />
            <polygon
              points="1300,100 1345,125 1345,270 1300,270"
              fill="url(#fgTowerRight)"
            />
          </g>

          <rect
            x="0"
            y="205"
            width="1440"
            height="65"
            fill="url(#skylineBottomFade)"
          />

          <defs>
            <linearGradient id="bgTowersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007a5a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="fgTowerLeft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="fgTowerRight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6437" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient
              id="skylineBottomFade"
              x1="720"
              y1="205"
              x2="720"
              y2="270"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ffffff" stopOpacity="0" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.92" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-20 mx-auto max-w-[1000px]">
        {/* شارة الهيرو العلوية */}
        <Link
          href="/sell"
          className="mx-auto mb-3.5 inline-flex max-w-full items-center gap-2 rounded-full border border-white bg-white/95 px-3.5 py-1 text-[11px] font-bold text-[#0f1d40] shadow-xs transition hover:-translate-y-0.5 sm:mb-5 sm:px-4 sm:py-1.5 sm:text-xs"
        >
          <span className="size-2 shrink-0 animate-pulse rounded-full bg-[#ff6437]" />
          <span className="truncate">
            {isAr ? (
              <>
                منصة العقار الأولى ✦ استرد{' '}
                <b className="text-[#ff6437]">100%</b> من مدفوعاتك أو تصفح عروض
                جورجيا
              </>
            ) : (
              <>
                First members advantage ✦ Recover{' '}
                <b className="text-[#ff6437]">100%</b> of your paid installments
              </>
            )}
          </span>
          {dir === 'rtl' ? (
            <ArrowLeft className="size-3.5 shrink-0 text-slate-400" />
          ) : (
            <ArrowRight className="size-3.5 shrink-0 text-slate-400" />
          )}
        </Link>

        {/* العنوان الرئيسي بخط هادئ وأنيق */}
        <h1 className="mx-auto text-3xl font-extrabold leading-[1.12] tracking-tight text-[#0f1d40] sm:text-5xl lg:text-[64px]">
          {isAr ? (
            <>
              عقارات
              <span className="mt-1 block bg-gradient-to-r from-[#007a5a] via-[#2563eb] to-[#ff6437] bg-clip-text text-transparent">
                في جورجيا
              </span>
            </>
          ) : (
            <>
              Real Estate
              <span className="mt-1 block bg-gradient-to-r from-[#007a5a] via-[#2563eb] to-[#ff6437] bg-clip-text text-transparent">
                in Georgia
              </span>
            </>
          )}
        </h1>

        <p className="mx-auto mt-2.5 max-w-xl px-2 text-xs font-medium leading-relaxed text-[#475569] sm:mt-3.5 sm:text-[15px]">
          {isAr
            ? 'شقق ومنازل وشاليهات في جميع أنحاء جورجيا — للتنازل، البيع، أو الإيجار الشهري واليومي مباشرة من المالكين.'
            : 'Apartments, houses and cottages across Georgia — installment exit, buy, rent or daily, directly from owners.'}
        </p>

        {/* التبويبات العلوية — سطر واحد أفقي يُسحب باللمس في الموبايل بدون أن يأخذ سطرين */}
        <div className="mx-auto mt-4 flex w-fit max-w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-white bg-white/95 p-1 text-xs font-bold shadow-sm no-scrollbar sm:mt-6">
          {[
            {
              id: 'exit' as const,
              label: isAr ? 'تنازل وأقساط' : 'Installment Exit',
              dot: 'text-[#007a5a]',
            },
            {
              id: 'sale' as const,
              label: isAr ? 'للبيع' : 'For sale',
              dot: 'text-[#2563eb]',
            },
            {
              id: 'rent_monthly' as const,
              label: isAr ? 'للإيجار' : 'For rent',
              dot: 'text-purple-600',
            },
            {
              id: 'rent_daily' as const,
              label: isAr ? 'يومي' : 'Daily',
              dot: 'text-[#ff6437]',
            },
            {
              id: 'new_dev' as const,
              label: isAr ? 'مشاريع جديدة' : 'New developments',
              dot: 'text-sky-500',
            },
          ].map((tab) => {
            const active = searchMode === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSearchMode(tab.id)
                  setComingSoonNotice(false)
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 transition sm:px-5 ${
                  active
                    ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-xs'
                    : 'text-[#566383] hover:bg-slate-100 hover:text-[#0f1d40]'
                }`}
              >
                <span className={active ? 'text-white' : tab.dot}>•</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* شريط البحث الرشيق ذو الحجم المناسب للموبايل والكمبيوتر */}
        <div
          ref={filterBarRef}
          className="relative mx-auto mt-2.5 max-w-[900px] rounded-[22px] border border-white bg-white px-3 py-2 text-start shadow-[0_20px_50px_rgba(15,29,64,0.11)] sm:mt-3 sm:rounded-[24px] sm:px-4 sm:py-2.5"
        >
          <div className="grid grid-cols-2 gap-1.5 border-b border-slate-100 pb-2 sm:grid-cols-4 sm:gap-3 sm:pb-2.5">
            {/* 1. نوع العقار */}
            <div className="relative border-e border-slate-100 pe-2">
              <button
                type="button"
                onClick={() =>
                  setOpenPopover(openPopover === 'type' ? null : 'type')
                }
                className="flex w-full items-center justify-between gap-1.5 rounded-lg px-1.5 py-0.5 text-start hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {isAr ? 'نوع العقار' : 'PROPERTY TYPE'}
                  </span>
                  <strong className="block truncate text-xs font-bold text-[#0f1d40]">
                    {selectedTypeObj.label}
                  </strong>
                </div>
                <Layers className="size-3.5 shrink-0 text-slate-400" />
              </button>

              {openPopover === 'type' && (
                <div className="absolute start-0 top-[calc(100%+8px)] z-[80] w-60 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xl">
                  {propertyTypeOptions.map((opt) => {
                    const Icon = opt.icon
                    const active = propType === opt.id
                    return (
                      <button
                        key={opt.id || 'all'}
                        type="button"
                        onClick={() => {
                          setPropType(opt.id)
                          setOpenPopover(null)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                          active
                            ? 'bg-orange-50 text-[#ff6437]'
                            : 'text-[#0f1d40] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex size-7 items-center justify-center rounded-lg ${opt.iconBg}`}
                          >
                            <Icon className="size-3.5" />
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {active && (
                          <Check className="size-3.5 text-[#ff6437]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 2. أين */}
            <div className="relative sm:border-e sm:border-slate-100 sm:pe-2">
              <SivrceLocationModalPicker
                value={whereArea}
                displayText={whereDisplay}
                showEverywhereOption={true}
                onSelectLocation={({ areaId, displayLabel }) => {
                  setWhereArea(areaId)
                  setWhereDisplay(
                    areaId ? cleanPureLocaleText(displayLabel, locale) : ''
                  )
                  setOpenPopover(null)
                }}
                customTrigger={({ onClick, resolvedDisplay }) => (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPopover(null)
                      onClick()
                    }}
                    className="flex w-full items-center justify-between gap-1.5 rounded-lg px-1.5 py-0.5 text-start hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-semibold text-slate-400">
                        {isAr ? 'أين' : 'WHERE'}
                      </span>
                      <strong className="block truncate text-xs font-bold text-[#0f1d40]">
                        {cleanPureLocaleText(resolvedDisplay, locale) ||
                          (isAr ? 'في كل مكان' : 'Everywhere')}
                      </strong>
                    </div>
                    <MapPin className="size-3.5 shrink-0 text-slate-400" />
                  </button>
                )}
              />
            </div>

            {/* 3. الغرف */}
            <div className="relative border-t border-e border-slate-100 pt-1.5 pe-2 sm:border-t-0 sm:pt-0">
              <button
                type="button"
                onClick={() =>
                  setOpenPopover(openPopover === 'rooms' ? null : 'rooms')
                }
                className="flex w-full items-center justify-between gap-1.5 rounded-lg px-1.5 py-0.5 text-start hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {isAr ? 'الغرف' : 'ROOMS'}
                  </span>
                  <strong className="block truncate text-xs font-bold text-[#0f1d40]">
                    {roomsTriggerLabel}
                  </strong>
                </div>
                <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
              </button>

              {openPopover === 'rooms' && (
                <div className="absolute start-0 top-[calc(100%+8px)] z-[80] w-68 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl">
                  <span className="block text-start text-xs font-bold text-slate-500">
                    {isAr ? 'الغرف' : 'Rooms'}
                  </span>
                  <div className="mt-2 flex items-center justify-between gap-1.5">
                    {['1', '2', '3', '4', '+5'].map((num) => {
                      const active = roomsFilter === num
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRoomsFilter(active ? '' : num)}
                          className={`flex size-9 items-center justify-center rounded-full border text-xs font-bold transition ${
                            active
                              ? 'border-[#ff6437] bg-[#ff6437] text-white'
                              : 'border-slate-200 bg-slate-50 text-[#0f1d40]'
                          }`}
                        >
                          {num}
                        </button>
                      )
                    })}
                  </div>

                  <span className="mt-3.5 block text-start text-xs font-bold text-slate-500">
                    {isAr ? 'المساحة' : 'Area'}
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="number"
                      dir="ltr"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      placeholder={isAr ? 'الأدنى' : 'Min'}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-center text-xs font-bold text-[#0f1d40] focus:border-[#ff6437] focus:bg-white focus:outline-none"
                    />
                    <span className="text-slate-300">—</span>
                    <input
                      type="number"
                      dir="ltr"
                      value={maxArea}
                      onChange={(e) => setMaxArea(e.target.value)}
                      placeholder={isAr ? 'الأقصى' : 'Max'}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-center text-xs font-bold text-[#0f1d40] focus:border-[#ff6437] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. السعر */}
            <div className="relative border-t border-slate-100 pt-1.5 sm:border-t-0 sm:pt-0">
              <button
                type="button"
                onClick={() =>
                  setOpenPopover(openPopover === 'price' ? null : 'price')
                }
                className="flex w-full items-center justify-between gap-1.5 rounded-lg px-1.5 py-0.5 text-start hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {isAr ? 'السعر' : 'PRICE'}
                  </span>
                  <strong className="block truncate text-xs font-bold text-[#0f1d40]">
                    {priceTriggerLabel}
                  </strong>
                </div>
                <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
              </button>

              {openPopover === 'price' && (
                <div className="absolute end-0 top-[calc(100%+8px)] z-[80] w-68 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      dir="ltr"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder={isAr ? 'الأدنى' : 'Min'}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-center text-xs font-bold text-[#0f1d40] focus:border-[#ff6437] focus:bg-white focus:outline-none"
                    />
                    <span className="text-slate-300">—</span>
                    <input
                      type="number"
                      dir="ltr"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder={isAr ? 'الأقصى' : 'Max'}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-center text-xs font-bold text-[#0f1d40] focus:border-[#ff6437] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الصف الثاني: حقل الكتابة + زر البحث البرتقالي المزود بعدد الإعلانات */}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 px-1.5 py-0.5">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunSearch()
                }}
                placeholder={
                  isAr
                    ? 'شقة للتنازل في تبليسي أو منزل في باتومي...'
                    : '2-bedroom apartment in Tbilisi or Batumi...'
                }
                className="w-full bg-transparent text-xs font-medium text-[#0f1d40] placeholder:text-slate-400 focus:outline-none sm:text-[13px]"
              />
            </div>

            <button
              type="button"
              onClick={handleRunSearch}
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,100,55,0.32)] transition hover:opacity-95 active:scale-98 sm:w-auto sm:min-w-[180px] sm:text-sm"
            >
              <Search className="size-3.5 stroke-[2.2]" />
              <span>
                {searchMode === 'exit'
                  ? isAr
                    ? `${matchingCount} إعلاناً`
                    : `${matchingCount} listings`
                  : isAr
                    ? 'بحث (قريباً)'
                    : 'Search (Soon)'}
              </span>
            </button>
          </div>

          {comingSoonNotice && (
            <p className="mt-2 rounded-xl bg-orange-50 px-3 py-1.5 text-center text-[11px] font-semibold text-[#ea580c]">
              {isAr
                ? 'قسم البيع والإيجار المباشر سيتم تفعيله قريباً — يمكنك حالياً البحث في قسم «تنازل وأقساط».'
                : 'Direct Sale & Rent sections are launching soon — browse active Installment Exit deals.'}
            </p>
          )}
        </div>

        {/* الكلمات السريعة (رائج) — في سطر واحد يُسحب يميناً ويساراً باللمس في الموبايل */}
        <div className="mx-auto mt-3.5 flex max-w-[900px] flex-nowrap items-center justify-start gap-1.5 overflow-x-auto px-1 py-1 text-xs font-semibold no-scrollbar sm:flex-wrap sm:justify-center">
          <span className="shrink-0 px-2 py-1 text-slate-600">
            {isAr ? 'رائج:' : 'Popular:'}
          </span>
          {[
            {
              label: isAr ? 'قرب المترو' : 'Near metro',
              href: '/opportunities?category=exit&area=Tbilisi+-+Saburtalo',
            },
            {
              label: isAr
                ? 'شقق في تبليسي'
                : 'Apartments in Tbilisi',
              href: '/opportunities?category=exit',
            },
            {
              label: isAr ? 'فاكي' : 'Vake',
              href: '/opportunities?category=exit&area=Tbilisi+-+Vake',
            },
            {
              label: isAr ? 'سابورتالو' : 'Saburtalo',
              href: '/opportunities?category=exit&area=Tbilisi+-+Saburtalo',
            },
            {
              label: isAr ? 'متاتسميندا' : 'Mtatsminda',
              href: '/opportunities?category=exit&area=Tbilisi+-+Mtatsminda',
            },
            {
              label: isAr ? 'باتومي' : 'Batumi',
              href: '/opportunities?category=exit&area=Batumi+-+New+Boulevard',
            },
            {
              label: isAr ? 'تبليسي القديمة' : 'Old Tbilisi',
              href: '/opportunities?category=exit&area=Tbilisi+-+Old+Tbilisi',
            },
            {
              label: isAr ? 'ديغومي' : 'Digomi',
              href: '/opportunities?category=exit&area=Tbilisi+-+Didi+Digomi',
            },
          ].map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className="shrink-0 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold text-[#0f1d40] shadow-2xs transition hover:-translate-y-0.5 hover:text-[#ff6437]"
            >
              {pill.label}
            </Link>
          ))}
        </div>

        {/* الزران السفليان */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/opportunities?category=exit"
            className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:bg-white"
          >
            {realUnitCount > 0 ? realUnitCount : '1,814'}{' '}
            {isAr ? 'مشاريع مطورين' : 'Development projects'}
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>{isAr ? 'أضف إعلاناً' : 'Add a listing'}</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
