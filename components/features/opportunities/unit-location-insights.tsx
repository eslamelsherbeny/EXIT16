'use client'

import { useEffect, useMemo, useState } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as SunCalc from 'suncalc'
import {
  Building2,
  Bus,
  Coffee,
  GraduationCap,
  MapPin,
  ShoppingBag,
  Stethoscope,
  Sun,
  Train,
} from 'lucide-react'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'

// ==========================================
// 1. مكون مخطط الشمس والإضاءة الطبيعية (Sun & Daylight)
// ==========================================
function SunAndDaylightChart({
  lat,
  lng,
  t,
}: {
  lat: number
  lng: number
  t: any
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // تحديث المؤشر كل دقيقة
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const sunData = useMemo(() => {
    // استخدام SunCalc لحساب أوقات ومسار الشمس
    const times = SunCalc.getTimes(now, lat, lng)
    
    // حماية (Safe Fallback) لمنع خطأ TypeScript في حال كانت القيم null (مثل الأقطاب)
    const baseDate = new Date(now)
    const safeSunrise = times.sunrise || new Date(baseDate.setHours(6, 0, 0, 0))
    const safeSunset = times.sunset || new Date(baseDate.setHours(18, 0, 0, 0))
    const safeNoon = times.solarNoon || new Date(baseDate.setHours(12, 0, 0, 0))

    const noonPos = SunCalc.getPosition(safeNoon, lat, lng)

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

    const daylightMs = Math.max(0, safeSunset.getTime() - safeSunrise.getTime())
    const hours = Math.floor(daylightMs / (1000 * 60 * 60))
    const minutes = Math.floor((daylightMs % (1000 * 60 * 60)) / (1000 * 60))

    // حساب موقع الشمس الحالي على القوس (من 0 إلى 1)
    const totalDay = Math.max(1, safeSunset.getTime() - safeSunrise.getTime())
    const elapsed = now.getTime() - safeSunrise.getTime()
    let progress = Math.max(0, Math.min(1, elapsed / totalDay))

    // إذا كنا في الليل، نثبت الشمس عند أطراف القوس
    if (now < safeSunrise) progress = 0
    if (now > safeSunset) progress = 1

    return {
      sunrise: formatTime(safeSunrise),
      sunset: formatTime(safeSunset),
      noon: formatTime(safeNoon),
      maxHeight: Math.round((noonPos.altitude * 180) / Math.PI),
      daylightLength: `${hours}h ${minutes}m`,
      progress,
    }
  }, [lat, lng, now])

  // حسابات رسم الـ SVG للقوس البرتقالي
  const radius = 100
  const cx = 150
  const cy = 120
  const startX = cx - radius
  const endX = cx + radius

  // موقع الشمس الحالي على القوس
  const angle = Math.PI - sunData.progress * Math.PI
  const sunX = cx + radius * Math.cos(angle)
  const sunY = cy - radius * Math.sin(angle)

  return (
    <div className="mt-4 overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Sun className="size-5 text-orange-500" />
        <h3 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
          {t?.sunTitle || 'Sun & daylight'}
        </h3>
      </div>
      <p className="mt-2 text-[11px] text-gray-500">
        {t?.sunSubtitle ||
          'Sun path at this area based on astronomical calculation'}
      </p>

      {/* رسم المخطط SVG */}
      <div className="relative mt-6 flex h-[160px] w-full justify-center">
        <svg
          viewBox="0 0 300 140"
          className="w-full max-w-[320px] overflow-visible"
        >
          {/* خط الأفق */}
          <line
            x1="20"
            y1={cy}
            x2="280"
            y2={cy}
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* القوس الرمادي الخلفي */}
          <path
            d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="3"
          />
          {/* القوس البرتقالي النشط (يمثل الوقت المنقضي) */}
          <path
            d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${sunX} ${sunY}`}
            fill="none"
            stroke="#f97316"
            strokeWidth="4"
          />

          {/* نقطة الشمس */}
          <circle
            cx={sunX}
            cy={sunY}
            r="6"
            fill="#f97316"
            className="drop-shadow-md"
          />
          {/* خط عمودي أسفل الشمس */}
          <line
            x1={sunX}
            y1={sunY}
            x2={sunX}
            y2={cy}
            stroke="#f97316"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* نصوص الخريطة (الشرق، الجنوب، الغرب) */}
          <text
            x={startX}
            y={cy - 10}
            fontSize="10"
            fill="#9ca3af"
            textAnchor="middle"
          >
            E
          </text>
          <text
            x={cx}
            y={cy - radius - 15}
            fontSize="10"
            fill="#9ca3af"
            textAnchor="middle"
          >
            S
          </text>
          <text
            x={endX}
            y={cy - 10}
            fontSize="10"
            fill="#9ca3af"
            textAnchor="middle"
          >
            W
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-medium text-gray-500 sm:text-[11px]">
        <div>
          <span className="block">{t?.sunrise || 'SUNRISE'}</span>
          <strong className="mt-1 block font-mono text-[11px] font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xs">
            {sunData.sunrise}
          </strong>
        </div>
        <div>
          <span className="block">{t?.solarNoon || 'SOLAR NOON'}</span>
          <strong className="mt-1 block font-mono text-[11px] font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xs">
            {sunData.noon} ({sunData.maxHeight}°)
          </strong>
        </div>
        <div>
          <span className="block">{t?.sunset || 'SUNSET'}</span>
          <strong className="mt-1 block font-mono text-[11px] font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xs">
            {sunData.sunset}
          </strong>
        </div>
        <div>
          <span className="block">{t?.daylight || 'DAYLIGHT'}</span>
          <strong className="mt-1 block text-[11px] font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xs">
            {sunData.daylightLength}
          </strong>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 2. مكون الأماكن المجاورة (What's Nearby)
// ==========================================
type NearbyCategory =
  | 'All'
  | 'School'
  | 'Pharmacy'
  | 'Supermarket'
  | 'Transport'

const MOCK_NEARBY_PLACES = [
  {
    id: 1,
    name: 'Tbilisi Public School #47',
    cat: 'School',
    distanceMeters: 450,
    icon: GraduationCap,
  },
  {
    id: 2,
    name: 'Neoparmi Pharmacy',
    cat: 'Pharmacy',
    distanceMeters: 210,
    icon: Stethoscope,
  },
  {
    id: 3,
    name: 'Magniti Supermarket',
    cat: 'Supermarket',
    distanceMeters: 150,
    icon: ShoppingBag,
  },
  {
    id: 4,
    name: 'Nikora Supermarket',
    cat: 'Supermarket',
    distanceMeters: 320,
    icon: ShoppingBag,
  },
  {
    id: 5,
    name: 'Metro Station',
    cat: 'Transport',
    distanceMeters: 850,
    icon: Train,
  },
  {
    id: 6,
    name: 'Bus Stop #12',
    cat: 'Transport',
    distanceMeters: 120,
    icon: Bus,
  },
  {
    id: 7,
    name: 'Local Cafe',
    cat: 'Coffee',
    distanceMeters: 280,
    icon: Coffee,
  },
]

function NearbyPlacesList({ t }: { t: any }) {
  const [activeCat, setActiveCat] = useState<NearbyCategory>('All')

  // حساب وقت المشي والقيادة
  // متوسط سرعة المشي = 80 متر/دقيقة
  // متوسط سرعة السيارة = 300 متر/دقيقة (داخل المدن)
  const calculateTimes = (meters: number) => {
    const walkMins = Math.max(1, Math.ceil(meters / 80))
    const driveMins = Math.max(1, Math.ceil(meters / 300))
    return { walk: walkMins, drive: driveMins }
  }

  const filtered = MOCK_NEARBY_PLACES.filter(
    (p) => activeCat === 'All' || p.cat === activeCat
  ).sort((a, b) => a.distanceMeters - b.distanceMeters)

  const categories: NearbyCategory[] = [
    'All',
    'School',
    'Pharmacy',
    'Supermarket',
    'Transport',
  ]

  return (
    <div className="mt-4 rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
        {t?.nearbyTitle || "What's nearby"}
      </h3>
      <p className="mt-0.5 text-[11px] text-gray-500">
        Nearest first · walking time · distances are estimates
      </p>

      {/* فلاتر التصنيفات */}
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
              activeCat === cat
                ? 'border-[var(--brand-navy,#0a1122)] bg-[var(--brand-navy,#0a1122)] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* شبكة الأماكن */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((place) => {
          const times = calculateTimes(place.distanceMeters)
          const Icon = place.icon
          return (
            <div
              key={place.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#f8faf9] p-3 transition hover:border-[#007a5a]/30 hover:bg-[#eaf8f2]/30"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[var(--brand-primary,#007a5a)] shadow-2xs">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                    {place.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    🚶 walk ~{times.walk} min{' '}
                    {times.drive > 2 ? `· 🚗 drive ~${times.drive} min` : ''}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-end">
                <span className="text-[10px] font-bold text-gray-400">
                  {place.distanceMeters < 1000
                    ? `${place.distanceMeters} m`
                    : `${(place.distanceMeters / 1000).toFixed(1)} km`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==========================================
// 3. المكون الرئيسي: يجمع الخريطة والمكونات السابقة
// ==========================================
export function UnitLocationInsights({
  areaId,
  t,
}: {
  areaId: string | null
  t?: any
}) {
  const coords = getCoordinatesForArea(areaId)

  // ستايل خريطة مجاني من Carto يدعم البنية الأساسية (لا يتطلب API Key)
  const mapStyleUrl =
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 p-5">
          <MapPin className="size-5 text-[var(--brand-primary,#007a5a)]" />
          <div>
            <h3 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
              {t?.locationTitle || 'Location Insights'}
            </h3>
            <p className="text-[11px] text-gray-500">
              {t?.locationSubtitle ||
                'Approximate area center to protect owner privacy'}
            </p>
          </div>
        </div>

        {/* الخريطة ثلاثية الأبعاد (3D Map) */}
        <div className="relative h-[300px] w-full bg-gray-100 sm:h-[400px]">
          <Map
            initialViewState={{
              latitude: coords.lat,
              longitude: coords.lng,
              zoom: 14.5,
              pitch: 45, // زاوية الميل ليعطي الإحساس الـ 3D
              bearing: -17.6,
            }}
            mapStyle={mapStyleUrl}
            attributionControl={false}
          >
            <NavigationControl position="bottom-right" />

            {/* الدبوس الذي يحدد مركز المنطقة */}
            <Marker
              latitude={coords.lat}
              longitude={coords.lng}
              anchor="bottom"
            >
              <div className="relative flex flex-col items-center">
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-[var(--brand-primary,#007a5a)] text-white shadow-lg">
                  <Building2 className="size-5" />
                </div>
                <div className="-mt-1 h-3 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-[var(--brand-primary,#007a5a)] drop-shadow-md" />
              </div>
            </Marker>
          </Map>

          {/* تراكب شفاف لمنع السكرول المزعج بالخطأ على الموبايل */}
          <div className="pointer-events-none absolute inset-0 rounded-b-[20px] shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />
        </div>
      </section>

      {/* شبكة الأماكن القريبة */}
      <NearbyPlacesList t={t} />

      {/* مخطط الشمس والإضاءة */}
      <SunAndDaylightChart lat={coords.lat} lng={coords.lng} t={t} />
    </>
  )
}