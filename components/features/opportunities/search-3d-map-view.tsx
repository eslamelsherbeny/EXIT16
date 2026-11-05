'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bus,
  Compass,
  Crown,
  Dumbbell,
  Eye,
  FileCheck2,
  Flame,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  List,
  MapPin,
  Maximize2,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  School,
  Search,
  ShoppingBag,
  Sparkles,
  TrainFront,
  Trees,
  X,
} from 'lucide-react'
import { formatRelativePublishTime } from '@/components/features/home/home-property-card'
import { SIVRCE_POPULAR_CITIES } from '@/components/features/seller/seller-location-modal'
import { getOptionLabel } from '@/components/features/seller/seller-options-data'
import { type MappedProperty } from '@/components/features/opportunities/opportunities-shared'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

function loadMapLibreScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('SSR')
    if ((window as any).maplibregl) return resolve((window as any).maplibregl)

    if (!document.getElementById('maplibre-gl-css')) {
      const link = document.createElement('link')
      link.id = 'maplibre-gl-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
      document.head.appendChild(link)
    }

    const existing = document.getElementById('maplibre-gl-js')
    if (existing) {
      existing.addEventListener('load', () =>
        resolve((window as any).maplibregl)
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'maplibre-gl-js'
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
    script.async = true
    script.onload = () => resolve((window as any).maplibregl)
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

const MAP_CITIES_COORDS = [
  { id: 'Tbilisi', lat: 41.7151, lng: 44.8271 },
  { id: 'Batumi', lat: 41.6168, lng: 41.6367 },
  { id: 'Kutaisi', lat: 42.2679, lng: 42.718 },
  { id: 'Rustavi', lat: 41.5495, lng: 44.9932 },
  { id: 'Kobuleti', lat: 41.8214, lng: 41.7767 },
  { id: 'Bakuriani', lat: 41.7497, lng: 43.5325 },
  { id: 'Gudauri', lat: 42.4779, lng: 44.4761 },
  { id: 'Telavi', lat: 41.9198, lng: 45.4731 },
  { id: 'Gori', lat: 41.9842, lng: 44.1158 },
]

const MAP_UI_FALLBACK: Record<
  LocaleCode,
  {
    searchPlaceholder: string
    cityLabel: string
    listPrefix: string
    allTab: string
    forExitTab: string
    apartmentsTab: string
    housesTab: string
    cottagesTab: string
    commercialTab: string
    landTab: string
    hotelTab: string
    liveBadge: string
    resetTooltip: string
    myLocationTooltip: string
    exitMapTooltip: string
    verifiedBadge: string
    roomsWord: string
    sqmUnit: string
    viewDetailsBtn: string
    pois: Record<string, string>
  }
> = {
  ar: {
    searchPlaceholder:
      'مدينة، حي، شارع — أو مشروع، مطور، كود عقاري (U-10057)...',
    cityLabel: 'City',
    listPrefix: 'إعلان',
    allTab: 'الكل',
    forExitTab: 'للتنازل',
    apartmentsTab: 'شقة',
    housesTab: 'منزل',
    cottagesTab: 'شاليه',
    commercialTab: 'تجاري',
    landTab: 'أرض',
    hotelTab: 'فندق',
    liveBadge: 'مباشر',
    resetTooltip: 'إعادة ضبط الفلاتر',
    myLocationTooltip: 'موقعي الحالي',
    exitMapTooltip: 'العودة للقائمة',
    verifiedBadge: 'متحقق بالمستندات',
    roomsWord: 'غرف',
    sqmUnit: 'م²',
    viewDetailsBtn: 'عرض تفاصيل الوحدة',
    pois: {
      metro: 'مترو',
      train: 'قطار',
      school: 'مدرسة',
      kindergarten: 'روضة أطفال',
      pharmacy: 'صيدلية',
      park: 'حديقة',
      market: 'سوق',
      clinic: 'عيادة',
      uni: 'جامعة',
      bank: 'بنك',
      gym: 'نادي رياضي',
      bus: 'حافلة',
    },
  },
  en: {
    searchPlaceholder:
      'City, district, street — or project, developer, unit code...',
    cityLabel: 'City',
    listPrefix: 'listings',
    allTab: 'All',
    forExitTab: 'Exit Deals',
    apartmentsTab: 'Apartment',
    housesTab: 'House',
    cottagesTab: 'Cottage',
    commercialTab: 'Commercial',
    landTab: 'Land',
    hotelTab: 'Hotel',
    liveBadge: 'Live',
    resetTooltip: 'Reset filters',
    myLocationTooltip: 'My Location',
    exitMapTooltip: 'Back to list',
    verifiedBadge: 'Verified',
    roomsWord: 'Rooms',
    sqmUnit: 'm²',
    viewDetailsBtn: 'View Unit Details',
    pois: {
      metro: 'Metro',
      train: 'Train',
      school: 'School',
      kindergarten: 'Kindergarten',
      pharmacy: 'Pharmacy',
      park: 'Park',
      market: 'Market',
      clinic: 'Clinic',
      uni: 'University',
      bank: 'Bank',
      gym: 'Gym',
      bus: 'Bus',
    },
  },
  ru: {
    searchPlaceholder:
      'Город, район, улица — или ЖК, застройщик, код объекта...',
    cityLabel: 'Город',
    listPrefix: 'объектов',
    allTab: 'Все',
    forExitTab: 'Переуступка',
    apartmentsTab: 'Квартира',
    housesTab: 'Дом',
    cottagesTab: 'Коттедж',
    commercialTab: 'Коммерция',
    landTab: 'Участок',
    hotelTab: 'Отель',
    liveBadge: 'Live',
    resetTooltip: 'Сбросить фильтры',
    myLocationTooltip: 'Моя локация',
    exitMapTooltip: 'К списку',
    verifiedBadge: 'Проверено',
    roomsWord: 'комн.',
    sqmUnit: 'м²',
    viewDetailsBtn: 'Подробнее об объекте',
    pois: {
      metro: 'Метро',
      train: 'Поезд',
      school: 'Школа',
      kindergarten: 'Детсад',
      pharmacy: 'Аптека',
      park: 'Парк',
      market: 'Рынок',
      clinic: 'Клиника',
      uni: 'ВУЗ',
      bank: 'Банк',
      gym: 'Спортзал',
      bus: 'Автобус',
    },
  },
  ka: {
    searchPlaceholder:
      'ქალაქი, უბანი, ქუჩა — ან პროექტი, დეველოპერი, კოდი...',
    cityLabel: 'City',
    listPrefix: 'განცხადება',
    allTab: 'ყველა',
    forExitTab: 'გადაბარება',
    apartmentsTab: 'ბინა',
    housesTab: 'სახლი',
    cottagesTab: 'კოტეჯი',
    commercialTab: 'კომერციული',
    landTab: 'მიწა',
    hotelTab: 'სასტუმრო',
    liveBadge: 'Live',
    resetTooltip: 'ფილტრების გასუფთავება',
    myLocationTooltip: 'ჩემი მდებარეობა',
    exitMapTooltip: 'სიაზე დაბრუნება',
    verifiedBadge: 'დამოწმებული',
    roomsWord: 'ოთახი',
    sqmUnit: 'მ²',
    viewDetailsBtn: 'დეტალების ნახვა',
    pois: {
      metro: 'მეტრო',
      train: 'მატარებელი',
      school: 'სკოლა',
      kindergarten: 'ბაღი',
      pharmacy: 'აფთიაქი',
      park: 'პარკი',
      market: 'მარკეტი',
      clinic: 'კლინიკა',
      uni: 'უნივერსიტეტი',
      bank: 'ბანკი',
      gym: 'დარბაზი',
      bus: 'ავტობუსი',
    },
  },
}

export function Search3DMapView({
  properties,
  is3DMode,
  setIs3DMode,
  onBackToList,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onResetFilters,
}: {
  properties: MappedProperty[]
  is3DMode: boolean
  setIs3DMode: (v: boolean) => void
  onBackToList: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  typeFilter: string
  setTypeFilter: (t: string) => void
  onResetFilters: () => void
}) {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const USD = '$'

  const baseUi = MAP_UI_FALLBACK[locale] || MAP_UI_FALLBACK.ar
  const customMapUi = (dict.opportunitiesPage as any)?.mapView || {}
  const mT = {
    ...baseUi,
    ...customMapUi,
    pois: { ...baseUi.pois, ...(customMapUi.pois || {}) },
  }

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [selectedProp, setSelectedProp] = useState<MappedProperty | null>(null)
  const [activePoi, setActivePoi] = useState<string>('')
  const [activeCity, setActiveCity] = useState<string>('Tbilisi')

  useEffect(() => {
    let isMounted = true
    let map: any = null

    const initialCenterCoords =
      properties.length > 0
        ? getCoordinatesForArea(properties[0].rawArea || properties[0].area)
        : { lat: 41.7225, lng: 44.7833 }

    loadMapLibreScript()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [initialCenterCoords.lng, initialCenterCoords.lat],
          zoom: 12.6,
          pitch: is3DMode ? 56 : 0,
          bearing: is3DMode ? -16 : 0,
          attributionControl: false,
        })

        mapInstanceRef.current = map

        map.on('load', () => {
          try {
            map.resize()
            const style = map.getStyle()
            if (style?.layers) {
              for (const layer of style.layers) {
                if (layer.type === 'fill-extrusion') {
                  map.setPaintProperty(
                    layer.id,
                    'fill-extrusion-color',
                    '#d8cfc4'
                  )
                  map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.9)
                }
              }
            }
          } catch {}
        })
      })
      .catch(() => {})

    return () => {
      isMounted = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.easeTo({
      pitch: is3DMode ? 56 : 0,
      bearing: is3DMode ? -16 : 0,
      duration: 650,
    })
  }, [is3DMode])

  useEffect(() => {
    let isCancelled = false
    loadMapLibreScript()
      .then((maplibregl) => {
        if (isCancelled || !mapInstanceRef.current || !maplibregl) return

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        properties.forEach((prop, idx) => {
          const baseCoords = getCoordinatesForArea(prop.rawArea || prop.area)
          const jitterLat = ((idx % 5) - 2) * 0.0042
          const jitterLng = ((idx % 4) - 1.5) * 0.0052
          const lat = baseCoords.lat + jitterLat
          const lng = baseCoords.lng + jitterLng

          const pinEl = document.createElement('button')
          pinEl.type = 'button'
          const shortPrice =
            prop.cashNum >= 1000
              ? `${Math.round(prop.cashNum / 1000)}k`
              : `${prop.cash}`

          const tier =
            prop.boostTier || (prop.featured ? 'super_vip' : null)

          pinEl.className =
            'rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-[#0f1d40] shadow-md transition-transform hover:scale-110'
          pinEl.style.border =
            tier === 'super_vip'
              ? '2px solid #ef4444'
              : tier === 'vip_plus'
                ? '2px solid #8b5cf6'
                : '2px solid #2563eb'
          pinEl.innerText = shortPrice

          pinEl.onclick = (e) => {
            e.stopPropagation()
            setSelectedProp(prop)
            mapInstanceRef.current?.flyTo({
              center: [lng, lat],
              zoom: 15.2,
              pitch: is3DMode ? 58 : 0,
              duration: 750,
            })
          }

          const marker = new maplibregl.Marker({
            element: pinEl,
            anchor: 'bottom',
          })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current)

          markersRef.current.push(marker)
        })
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [properties, is3DMode])

  const handleFlyToCity = (cityId: string) => {
    setActiveCity(cityId)
    const found = MAP_CITIES_COORDS.find((c) => c.id === cityId)
    if (found) {
      mapInstanceRef.current?.flyTo({
        center: [found.lng, found.lat],
        zoom: 13,
        pitch: is3DMode ? 55 : 0,
        duration: 850,
      })
    }
  }

  const poiCategories = [
    { id: 'metro', label: mT.pois.metro, icon: TrainFront },
    { id: 'train', label: mT.pois.train, icon: TrainFront },
    { id: 'school', label: mT.pois.school, icon: School },
    { id: 'kindergarten', label: mT.pois.kindergarten, icon: Sparkles },
    { id: 'pharmacy', label: mT.pois.pharmacy, icon: HeartPulse },
    { id: 'park', label: mT.pois.park, icon: Trees },
    { id: 'market', label: mT.pois.market, icon: ShoppingBag },
    { id: 'clinic', label: mT.pois.clinic, icon: HeartPulse },
    { id: 'uni', label: mT.pois.uni, icon: GraduationCap },
    { id: 'bank', label: mT.pois.bank, icon: Landmark },
    { id: 'gym', label: mT.pois.gym, icon: Dumbbell },
    { id: 'bus', label: mT.pois.bus, icon: Bus },
  ]

  const selectedTier = selectedProp
    ? selectedProp.boostTier || (selectedProp.featured ? 'super_vip' : null)
    : null

  return (
    <div
      dir={dir}
      className="relative h-[calc(100vh-74px)] min-h-[640px] w-full overflow-hidden bg-[#dfe5dc]"
    >
      <div
        ref={mapContainerRef}
        dir="ltr"
        className="absolute inset-0 h-full w-full"
      />

      {/* الأشرطة العلوية الـ 3 العائمة المطابقة لتصميم Sivrce في الصورة */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-[1340px] flex-col gap-2 sm:inset-x-6">
        {/* 1. شريط البحث العلوي العريض */}
        <div className="pointer-events-auto flex h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 shadow-md backdrop-blur-md">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mT.searchPlaceholder}
            className="w-full bg-transparent text-xs font-bold text-[#0f1d40] placeholder:text-slate-400 focus:outline-none sm:text-sm"
          />
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
            <Sparkles className="size-4" />
          </div>
        </div>

        {/* 2. شريط المدن السريع */}
        <div className="pointer-events-auto flex h-10 w-full items-center justify-start gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 px-4 text-xs font-bold shadow-sm backdrop-blur-md no-scrollbar">
          <span className="inline-flex shrink-0 items-center gap-1 pe-2 text-slate-400">
            <MapPin className="size-3.5 text-[#2563eb]" />
            <span>{mT.cityLabel}</span>
          </span>
          {SIVRCE_POPULAR_CITIES.slice(0, 8).map((city) => {
            const active = activeCity === city.id
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleFlyToCity(city.id)}
                className={`shrink-0 rounded-full px-3 py-1 transition ${
                  active
                    ? 'bg-blue-50 font-extrabold text-[#2563eb]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f1d40]'
                }`}
              >
                {getOptionLabel(city, locale)}
              </button>
            )
          })}
        </div>

        {/* 3. شريط الفلاتر الأفقي وعدد الإعلانات */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-extrabold text-[#0f1d40] transition hover:bg-slate-200"
            >
              <List className="size-3.5" />
              <span>
                {properties.length} {mT.listPrefix}
              </span>
            </button>

            <div className="mx-1 hidden h-4 w-[1px] bg-slate-200 sm:block" />

            <span className="rounded-full bg-[#2563eb] px-3 py-1 text-white">
              {mT.forExitTab}
            </span>

            {[
              { id: '', label: mT.allTab },
              { id: 'Apartment', label: mT.apartmentsTab },
              { id: 'Private house', label: mT.housesTab },
              { id: 'Cottage', label: mT.cottagesTab },
              { id: 'Commercial', label: mT.commercialTab },
              { id: 'Land', label: mT.landTab },
              { id: 'Hotel', label: mT.hotelTab },
            ].map((tp) => {
              const active = typeFilter === tp.id
              return (
                <button
                  key={tp.id || 'all-types'}
                  type="button"
                  onClick={() => setTypeFilter(tp.id)}
                  className={`rounded-full px-3 py-1 transition ${
                    active
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tp.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0f1d40]"
            title={mT.resetTooltip}
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* الشريط الرأسي لأدوات الخريطة على اليمين مطابق للصورة */}
      <div className="absolute end-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md sm:end-5">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="flex size-9 items-center justify-center rounded-xl text-[#0f1d40] transition hover:bg-slate-100"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="flex size-9 items-center justify-center rounded-xl text-[#0f1d40] transition hover:bg-slate-100"
        >
          <Minus className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setIs3DMode(!is3DMode)}
          className={`flex size-9 items-center justify-center rounded-xl text-xs font-black transition ${
            is3DMode
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'bg-slate-100 text-[#0f1d40] hover:bg-slate-200'
          }`}
        >
          3D
        </button>

        <button
          type="button"
          onClick={() =>
            mapInstanceRef.current?.easeTo({
              bearing: 0,
              pitch: is3DMode ? 55 : 0,
              duration: 500,
            })
          }
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#2563eb]"
        >
          <Compass className="size-4" />
        </button>

        <span className="rounded-lg bg-emerald-50 px-1.5 py-1 text-[9.5px] font-black text-[#007a5a]">
          {mT.liveBadge}
        </span>

        <button
          type="button"
          onClick={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                mapInstanceRef.current?.flyTo({
                  center: [pos.coords.longitude, pos.coords.latitude],
                  zoom: 15,
                })
              })
            }
          }}
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#2563eb]"
          title={mT.myLocationTooltip}
        >
          <Navigation className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setIs3DMode(!is3DMode)}
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#0f1d40]"
        >
          <Layers className="size-4" />
        </button>

        <button
          type="button"
          onClick={onBackToList}
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#0f1d40]"
          title={mT.exitMapTooltip}
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      {/* بطاقة معاينة الوحدة عند الضغط على الدبوس */}
      {selectedProp && (
        <div className="absolute bottom-20 start-4 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:start-8">
          <div className="relative h-40 w-full bg-slate-100">
            <img
              src={selectedProp.image}
              alt={selectedProp.project}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedProp(null)}
              className="absolute top-2.5 end-2.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="size-4" />
            </button>

            {selectedTier === 'super_vip' && (
              <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Crown className="size-3" />
                <span>SUPER VIP</span>
              </span>
            )}
            {selectedTier === 'vip_plus' && (
              <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Flame className="size-3" />
                <span>+VIP</span>
              </span>
            )}

            <span className="absolute bottom-2.5 start-2.5 rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
              #{selectedProp.code}
            </span>
          </div>

          <div className="p-4 text-start">
            <div className="flex items-center justify-between">
              <strong dir="ltr" className="text-lg font-bold text-[#0f1d40]">
                {USD}
                {selectedProp.cash}
              </strong>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf8f2] px-2 py-0.5 text-[10px] font-bold text-[#007a5a]">
                <FileCheck2 className="size-3" />
                {mT.verifiedBadge}
              </span>
            </div>
            <h4 className="mt-1 line-clamp-1 text-xs font-bold text-[#0f1d40]">
              {selectedProp.project}
            </h4>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {selectedProp.area}
              {selectedProp.exactStreet
                ? ` · ${selectedProp.exactStreet}${selectedProp.houseNumber ? ' ' + selectedProp.houseNumber : ''}`
                : ''}{' '}
              · {selectedProp.size} {mT.sqmUnit} · {selectedProp.rooms}{' '}
              {mT.roomsWord}
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] font-medium text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                <span>{selectedProp.viewsCount || 1}</span>
              </span>
              <span>
                {formatRelativePublishTime(selectedProp.createdAt, isAr)}
              </span>
            </div>
            <Link
              href={`/opportunities/${selectedProp.id}`}
              className="mt-2.5 flex h-9 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white hover:opacity-95"
            >
              {mT.viewDetailsBtn}
            </Link>
          </div>
        </div>
      )}

      {/* شريط المرافق والخدمات السفلي العائم */}
      <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 flex justify-center sm:inset-x-6">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-md no-scrollbar">
          {poiCategories.map((poi) => {
            const Icon = poi.icon
            const active = activePoi === poi.id
            return (
              <button
                key={poi.id}
                type="button"
                onClick={() => setActivePoi(active ? '' : poi.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                  active
                    ? 'bg-[#2563eb] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f1d40]'
                }`}
              >
                <Icon className="size-3.5" />
                <span>{poi.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}