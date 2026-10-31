'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bus,
  Compass,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Landmark,
  List,
  MapPin,
  Maximize2,
  Minus,
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
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  cleanPureLocaleText,
  getLocalizedUnitTitle,
  type HomeUnitCardItem,
} from '../home/home-data'

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

const QUICK_MAP_CITIES = [
  { id: 'Tbilisi', label: 'Tbilisi', lat: 41.7151, lng: 44.8271 },
  { id: 'Batumi', label: 'Batumi', lat: 41.6168, lng: 41.6367 },
  { id: 'Kutaisi', label: 'Kutaisi', lat: 42.2679, lng: 42.718 },
  { id: 'Rustavi', label: 'Rustavi', lat: 41.5495, lng: 44.9932 },
  { id: 'Poti', label: 'Poti', lat: 42.1462, lng: 41.672 },
  { id: 'Zugdidi', label: 'Zugdidi', lat: 42.5088, lng: 41.8709 },
  { id: 'Telavi', label: 'Telavi', lat: 41.9198, lng: 45.4731 },
  { id: 'Gori', label: 'Gori', lat: 41.9842, lng: 44.1158 },
]

export function Search3DMapView({
  units,
  is3DMode,
  setIs3DMode,
  onBackToList,
  searchQuery,
  setSearchQuery,
  dealFilter,
  setDealFilter,
  typeFilter,
  setTypeFilter,
  onResetFilters,
}: {
  units: HomeUnitCardItem[]
  is3DMode: boolean
  setIs3DMode: (v: boolean) => void
  onBackToList: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  dealFilter: 'all' | 'exit' | 'sale' | 'rent_monthly' | 'rent_daily'
  setDealFilter: (
    d: 'all' | 'exit' | 'sale' | 'rent_monthly' | 'rent_daily'
  ) => void
  typeFilter: string
  setTypeFilter: (t: string) => void
  onResetFilters: () => void
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const GEL = '₾'

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [selectedUnit, setSelectedUnit] = useState<HomeUnitCardItem | null>(
    null
  )
  const [activePoi, setActivePoi] = useState<string>('')
  const [activeCity, setActiveCity] = useState<string>('Tbilisi')

  // تهيئة الخريطة ثلاثية الأبعاد وإضافة دبابيس الأسعار
  useEffect(() => {
    let isMounted = true
    let map: any = null

    loadMapLibreScript()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [44.7833, 41.7225],
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
                    '#c7d2fe'
                  )
                  map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.88)
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

  // تحديث زاوية الميل 3D / 2D عند الضغط على زر 3D
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.easeTo({
      pitch: is3DMode ? 56 : 0,
      bearing: is3DMode ? -16 : 0,
      duration: 650,
    })
  }, [is3DMode])

  // رسم دبابيس الأسعار التفاعلية فوق الخريطة
  useEffect(() => {
    let isCancelled = false
    loadMapLibreScript()
      .then((maplibregl) => {
        if (isCancelled || !mapInstanceRef.current || !maplibregl) return

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        units.forEach((unit, idx) => {
          const baseCoords = getCoordinatesForArea(unit.area)
          // توزيع طفيف للدبابيس في نفس الحي حتى لا تتطابق فوق بعضها
          const jitterLat = ((idx % 5) - 2) * 0.0045
          const jitterLng = ((idx % 4) - 1.5) * 0.0055
          const lat = baseCoords.lat + jitterLat
          const lng = baseCoords.lng + jitterLng

          const pinEl = document.createElement('button')
          pinEl.type = 'button'
          const isRent =
            unit.category === 'rent_daily' || unit.category === 'rent_monthly'
          const borderCol =
            unit.category === 'exit'
              ? '#007a5a'
              : isRent
                ? '#e11d48'
                : '#2563eb'

          const shortPrice =
            unit.price >= 1000
              ? `${Math.round(unit.price / 1000)}k ${GEL}`
              : `${unit.price} ${GEL}${
                  unit.category === 'rent_daily'
                    ? isAr
                      ? '/يوم'
                      : '/d'
                    : unit.category === 'rent_monthly'
                      ? isAr
                        ? '/شهر'
                        : '/mo'
                      : ''
                }`

          pinEl.className =
            'rounded-full bg-white px-3 py-1 text-xs font-black text-[#0f1d40] shadow-lg transition-transform hover:scale-110'
          pinEl.style.border = `2px solid ${borderCol}`
          pinEl.innerText = shortPrice

          pinEl.onclick = (e) => {
            e.stopPropagation()
            setSelectedUnit(unit)
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
  }, [units, isAr, is3DMode])

  const handleFlyToCity = (city: (typeof QUICK_MAP_CITIES)[number]) => {
    setActiveCity(city.id)
    mapInstanceRef.current?.flyTo({
      center: [city.lng, city.lat],
      zoom: 13,
      pitch: is3DMode ? 55 : 0,
      duration: 850,
    })
  }

  const poiCategories = [
    { id: 'metro', label: isAr ? 'مترو' : 'Metro', icon: TrainFront },
    { id: 'train', label: isAr ? 'قطار' : 'Train', icon: TrainFront },
    { id: 'school', label: isAr ? 'مدرسة' : 'School', icon: School },
    { id: 'kindergarten', label: isAr ? 'روضة أطفال' : 'Kindergarten', icon: Sparkles },
    { id: 'pharmacy', label: isAr ? 'صيدلية' : 'Pharmacy', icon: HeartPulse },
    { id: 'park', label: isAr ? 'حديقة' : 'Park', icon: Trees },
    { id: 'market', label: isAr ? 'سوق' : 'Market', icon: ShoppingBag },
    { id: 'clinic', label: isAr ? 'عيادة' : 'Clinic', icon: HeartPulse },
    { id: 'uni', label: isAr ? 'جامعة' : 'University', icon: GraduationCap },
    { id: 'bank', label: isAr ? 'بنك' : 'Bank', icon: Landmark },
    { id: 'gym', label: isAr ? 'نادي رياضي' : 'Gym', icon: Dumbbell },
    { id: 'bus', label: isAr ? 'حافلة' : 'Bus', icon: Bus },
  ]

  return (
    <div
      dir={dir}
      className="relative h-[calc(100vh-74px)] min-h-[640px] w-full overflow-hidden bg-[#e5e9f0]"
    >
      {/* حاوية الخريطة الحية */}
      <div
        ref={mapContainerRef}
        dir="ltr"
        className="absolute inset-0 h-full w-full"
      />

      {/* 1. الأشرطة العلوية العائمة فوق الخريطة (مطابقة للصورة 9) */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-[1260px] flex-col gap-2 sm:inset-x-6">
        {/* الشريط الأول: بحث بالذكاء الاصطناعي والعنوان */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
            <Sparkles className="size-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'مدينة، حي، شارع — أو هاتف، كود عقار...'
                : 'City, district, street — or phone, ID...'
            }
            className="w-full bg-transparent text-xs font-bold text-[#0f1d40] placeholder:text-slate-400 focus:outline-none sm:text-sm"
          />
          <Search className="size-4 shrink-0 text-slate-400" />
        </div>

        {/* الشريط الثاني: مدن جورجيا السريعة */}
        <div className="pointer-events-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-extrabold shadow-md backdrop-blur-md no-scrollbar">
          <span className="inline-flex items-center gap-1 pe-2 text-slate-400">
            <MapPin className="size-3.5 text-[#2563eb]" />
            <span>{isAr ? 'المدينة:' : 'City:'}</span>
          </span>
          {QUICK_MAP_CITIES.map((city) => {
            const active = activeCity === city.id
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleFlyToCity(city)}
                className={`rounded-full px-3 py-1 transition ${
                  active
                    ? 'bg-blue-50 font-black text-[#2563eb]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f1d40]'
                }`}
              >
                {city.label}
              </button>
            )
          })}
        </div>

        {/* الشريط الثالث: فلاتر الخريطة السريعة + عداد الإعلانات وزر العودة للقائمة */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-[#0f1d40] transition hover:bg-slate-200"
            >
              <List className="size-3.5" />
              <span>
                {units.length} {isAr ? 'إعلان' : 'listings'}
              </span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            {(
              [
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'exit', label: isAr ? 'تنازل' : 'Exit' },
                { id: 'sale', label: isAr ? 'للبيع' : 'Sale' },
                { id: 'rent_monthly', label: isAr ? 'للإيجار' : 'Rent' },
                { id: 'rent_daily', label: isAr ? 'يومي' : 'Daily' },
              ] as const
            ).map((d) => {
              const active = dealFilter === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDealFilter(d.id)}
                  className={`rounded-full px-3 py-1 transition ${
                    active
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              )
            })}

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            {[
              { id: '', label: isAr ? 'الكل' : 'All' },
              { id: 'Apartment', label: isAr ? 'شقة' : 'Apartment' },
              { id: 'Private house', label: isAr ? 'منزل' : 'House' },
              { id: 'Commercial', label: isAr ? 'تجاري' : 'Commercial' },
              { id: 'Land', label: isAr ? 'أرض' : 'Land' },
              { id: 'Hotel', label: isAr ? 'فندق' : 'Hotel' },
            ].map((tp) => {
              const active = typeFilter === tp.id
              return (
                <button
                  key={tp.id || 'all-types'}
                  type="button"
                  onClick={() => setTypeFilter(tp.id)}
                  className={`hidden rounded-full px-3 py-1 transition md:inline-block ${
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
            title={isAr ? 'إعادة ضبط' : 'Reset'}
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* 2. شريط التحكم الجانبي الأيمن (+ / - / 3D / مباشر / توسيع) */}
      <div className="absolute end-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md sm:end-5">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="flex size-9 items-center justify-center rounded-xl text-[#0f1d40] transition hover:bg-slate-100"
          title="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="flex size-9 items-center justify-center rounded-xl text-[#0f1d40] transition hover:bg-slate-100"
          title="Zoom out"
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
          title="Toggle 2D / 3D"
        >
          3D
        </button>

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
          title={isAr ? 'موقعي' : 'My Location'}
        >
          <Compass className="size-4" />
        </button>

        <button
          type="button"
          onClick={onBackToList}
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#0f1d40]"
          title={isAr ? 'إغلاق الخريطة' : 'Exit map'}
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      {/* 3. كارت معاينة الوحدة المنبثق عند الضغط على دبوس السعر */}
      {selectedUnit && (
        <div className="absolute bottom-20 start-4 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:start-8">
          <div className="relative h-40 w-full bg-slate-100">
            <img
              src={selectedUnit.image}
              alt={selectedUnit.title}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedUnit(null)}
              className="absolute top-2.5 end-2.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="size-4" />
            </button>
            <span className="absolute bottom-2.5 start-2.5 rounded-full bg-[#ff6437] px-2.5 py-0.5 text-[10px] font-black text-white">
              SUPER VIP
            </span>
          </div>
          <div className="p-4 text-start">
            <strong dir="ltr" className="text-lg font-black text-[#0f1d40]">
              {selectedUnit.price.toLocaleString('en-US')} {GEL}
            </strong>
            <h4 className="mt-1 line-clamp-1 text-xs font-extrabold text-[#0f1d40]">
              {getLocalizedUnitTitle(
                selectedUnit,
                locale,
                cleanPureLocaleText(
                  getLocalizedGeorgiaAreaName(selectedUnit.area, locale),
                  locale
                )
              )}
            </h4>
            <p className="mt-1 text-[11px] font-bold text-slate-500">
              {selectedUnit.size} {isAr ? 'م²' : 'm²'} · {selectedUnit.rooms}{' '}
              {isAr ? 'غرف' : 'Rooms'}
            </p>
            <Link
              href={
                selectedUnit.id.startsWith('1')
                  ? '/opportunities'
                  : `/opportunities/${selectedUnit.id}`
              }
              className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-[#2563eb] text-xs font-black text-white hover:bg-blue-700"
            >
              {isAr ? 'عرض التفاصيل' : 'View Listing'}
            </Link>
          </div>
        </div>
      )}

      {/* 4. شريط المرافق والخدمات السفلي العائم (مترو، مدرسة، صيدلية، حديقة...) */}
      <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 flex justify-center sm:inset-x-6">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-2 shadow-xl backdrop-blur-md no-scrollbar">
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