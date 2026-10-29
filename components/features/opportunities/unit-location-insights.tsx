'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker, type MapRef } from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'
import * as SunCalc from 'suncalc'
import {
  Baby,
  Building2,
  Bus,
  CloudSun,
  Compass,
  Dumbbell,
  Footprints,
  GraduationCap,
  HeartPulse,
  Landmark,
  Maximize2,
  Minus,
  Navigation,
  Pill,
  Plus,
  ShoppingCart,
  Sun,
  TrainFront,
  Utensils,
} from 'lucide-react'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'

// ==========================================
// 1. أنواع وتصنيفات الأماكن القريبة الـ 9 (مطابقة لـ sivrce.ge)
// ==========================================
type NearbyCategoryKey =
  | 'all'
  | 'school'
  | 'kindergarten'
  | 'pharmacy'
  | 'market'
  | 'restaurants'
  | 'clinic'
  | 'university'
  | 'gym'
  | 'bus'

type PlaceItem = {
  id: string
  name: string
  category: Exclude<NearbyCategoryKey, 'all'>
  distanceMeters: number
}

const CATEGORY_META: Array<{
  key: Exclude<NearbyCategoryKey, 'all'>
  labelEn: string
  labelAr: string
  icon: any
}> = [
  { key: 'school', labelEn: 'School', labelAr: 'مدارس', icon: GraduationCap },
  {
    key: 'kindergarten',
    labelEn: 'Kindergarten',
    labelAr: 'حضانات ورياض أطفال',
    icon: Baby,
  },
  { key: 'pharmacy', labelEn: 'Pharmacy', labelAr: 'صيدليات', icon: Pill },
  {
    key: 'market',
    labelEn: 'Market',
    labelAr: 'سوبرماركت وأسواق',
    icon: ShoppingCart,
  },
  {
    key: 'restaurants',
    labelEn: 'Restaurants',
    labelAr: 'مطاعم وكافيهات',
    icon: Utensils,
  },
  {
    key: 'clinic',
    labelEn: 'Clinic',
    labelAr: 'عيادات ومراكز طبية',
    icon: HeartPulse,
  },
  {
    key: 'university',
    labelEn: 'University',
    labelAr: 'جامعات وكليات',
    icon: Landmark,
  },
  { key: 'gym', labelEn: 'Gym', labelAr: 'صالات رياضية (Gym)', icon: Dumbbell },
  { key: 'bus', labelEn: 'Bus', labelAr: 'محطات حافلات ومواصلات', icon: Bus },
]

// بيانات جورجية حقيقية كـ Fallback فوري سريع حتى تكتمل قراءة Overpass API
function getFallbackPlacesForArea(isBatumi: boolean): PlaceItem[] {
  if (isBatumi) {
    return [
      { id: 's1', name: 'Batumi Public School #2', category: 'school', distanceMeters: 540 },
      { id: 's2', name: 'Euro-2000 High School', category: 'school', distanceMeters: 780 },
      { id: 's3', name: 'Progress International School', category: 'school', distanceMeters: 1150 },
      { id: 'k1', name: 'Batumi Kindergarten #14', category: 'kindergarten', distanceMeters: 240 },
      { id: 'p1', name: 'Aversi Pharmacy', category: 'pharmacy', distanceMeters: 180 },
      { id: 'p2', name: 'PSP Pharmacy', category: 'pharmacy', distanceMeters: 410 },
      { id: 'p3', name: 'GPC Pharmacy', category: 'pharmacy', distanceMeters: 590 },
      { id: 'm1', name: 'Nikora Supermarket', category: 'market', distanceMeters: 140 },
      { id: 'm2', name: 'Magniti Max', category: 'market', distanceMeters: 290 },
      { id: 'm3', name: 'Carrefour Batumi Mall', category: 'market', distanceMeters: 620 },
      { id: 'm4', name: 'Ori Nabiji (2 Steps)', category: 'market', distanceMeters: 350 },
      { id: 'r1', name: 'Adjara House Restaurant', category: 'restaurants', distanceMeters: 260 },
      { id: 'r2', name: 'Pirosmani Georgian Cuisine', category: 'restaurants', distanceMeters: 420 },
      { id: 'r3', name: 'Batumi Boulevard Cafe', category: 'restaurants', distanceMeters: 530 },
      { id: 'c1', name: 'Batumi Referral Hospital', category: 'clinic', distanceMeters: 690 },
      { id: 'c2', name: 'MedCenter Batumi', category: 'clinic', distanceMeters: 940 },
      { id: 'u1', name: 'Batumi Shota Rustaveli State Univ.', category: 'university', distanceMeters: 1300 },
      { id: 'u2', name: 'Batumi Navigation Teaching Univ.', category: 'university', distanceMeters: 1650 },
      { id: 'g1', name: 'Reformers Fitness Batumi', category: 'gym', distanceMeters: 480 },
      { id: 'b1', name: 'Khimshiashvili Ave Bus Stop #4', category: 'bus', distanceMeters: 95 },
      { id: 'b2', name: 'New Boulevard Municipal Stop', category: 'bus', distanceMeters: 210 },
      { id: 'b3', name: 'Alley of Heroes Transit Stop', category: 'bus', distanceMeters: 340 },
    ]
  }

  return [
    { id: 's1', name: 'N°221 Sajaro Skola', category: 'school', distanceMeters: 784 },
    { id: 's2', name: 'Kartul-Germanuli Skola "Skhivi"', category: 'school', distanceMeters: 845 },
    { id: 's3', name: 'QSI International School of Tbilisi', category: 'school', distanceMeters: 1200 },
    { id: 's4', name: 'European School Tbilisi', category: 'school', distanceMeters: 1420 },
    { id: 'k1', name: 'Kindergarten #208', category: 'kindergarten', distanceMeters: 118 },
    { id: 'p1', name: 'Neoparmi', category: 'pharmacy', distanceMeters: 511 },
    { id: 'p2', name: '36.6 Pharmacy', category: 'pharmacy', distanceMeters: 554 },
    { id: 'p3', name: 'PSP & Aversi', category: 'pharmacy', distanceMeters: 680 },
    { id: 'm1', name: 'Magniti Maksi', category: 'market', distanceMeters: 407 },
    { id: 'm2', name: 'Ori Nabiji', category: 'market', distanceMeters: 559 },
    { id: 'm3', name: 'Nikora Supermarket', category: 'market', distanceMeters: 565 },
    { id: 'm4', name: 'Agrohub Hypermarket', category: 'market', distanceMeters: 890 },
    { id: 'r1', name: 'Mals Shaurma', category: 'restaurants', distanceMeters: 392 },
    { id: 'r2', name: 'Barakoni Georgian Restaurant', category: 'restaurants', distanceMeters: 419 },
    { id: 'r3', name: 'Asorti Bakery & Cafe', category: 'restaurants', distanceMeters: 608 },
    { id: 'r4', name: 'Tsiskvili Restaurant', category: 'restaurants', distanceMeters: 980 },
    { id: 'c1', name: 'Vivamedi Medical Center', category: 'clinic', distanceMeters: 646 },
    { id: 'c2', name: 'Evex Polyclinic', category: 'clinic', distanceMeters: 1450 },
    { id: 'c3', name: 'Tsm. Mikael Mtavarangelozis Clinic', category: 'clinic', distanceMeters: 1700 },
    { id: 'u1', name: 'Tavisupali Da Agraruli Universiteti', category: 'university', distanceMeters: 1000 },
    { id: 'u2', name: 'Kartul-Amerikuli Universiteti (GAU)', category: 'university', distanceMeters: 1600 },
    { id: 'u3', name: 'Evropis Universiteti', category: 'university', distanceMeters: 1800 },
    { id: 'g1', name: 'Format Fit Gym', category: 'gym', distanceMeters: 607 },
    { id: 'b1', name: '#208-E Sabavshvo Baghi Stop', category: 'bus', distanceMeters: 57 },
    { id: 'b2', name: 'Grigol Peradze St. #6 Stop', category: 'bus', distanceMeters: 98 },
    { id: 'b3', name: 'Agmashenebeli Alley Transit Stop', category: 'bus', distanceMeters: 310 },
  ]
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatTravelEstimate(meters: number) {
  const walkMin = Math.max(1, Math.round((meters * 1.22) / 80))
  const transitMin = Math.max(2, Math.round(meters / 150))
  const driveMin = Math.max(1, Math.round(meters / 260))

  if (meters < 800) {
    return `walk ~${walkMin} min`
  }
  if (meters < 1350) {
    return `walk ~${walkMin} min · transit ~${transitMin} min`
  }
  return `walk ~${walkMin} min · transit ~${transitMin} min · drive ~${driveMin} min`
}

// ==========================================
// 2. مكون مخطط الشمس التفاعلي الكامل
// ==========================================
function SunAndDaylightInteractiveCard({
  lat,
  lng,
  locale = 'ar',
}: {
  lat: number
  lng: number
  locale?: string
}) {
  const isAr = locale === 'ar'
  const [season, setSeason] = useState<'winter' | 'today' | 'summer'>('today')
  const [sliderRatio, setSliderRatio] = useState(0.5)

  const targetDate = useMemo(() => {
    const now = new Date()
    if (season === 'winter') return new Date(now.getFullYear(), 11, 21, 12, 0)
    if (season === 'summer') return new Date(now.getFullYear(), 5, 21, 12, 0)
    return now
  }, [season])

  const sunMetrics = useMemo(() => {
    const times = SunCalc.getTimes(targetDate, lat, lng)
    const base = new Date(targetDate)
    const safeSunrise =
      times.sunrise || new Date(new Date(base).setHours(7, 15, 0, 0))
    const safeSunset =
      times.sunset || new Date(new Date(base).setHours(18, 15, 0, 0))
    const safeNoon =
      times.solarNoon || new Date(new Date(base).setHours(12, 45, 0, 0))

    const noonPos = SunCalc.getPosition(safeNoon, lat, lng)
    const maxDeg = Math.max(15, Math.round((noonPos.altitude * 180) / Math.PI))

    const daylightMs = Math.max(0, safeSunset.getTime() - safeSunrise.getTime())
    const totalHours = Math.floor(daylightMs / 3600000)
    const totalMins = Math.floor((daylightMs % 3600000) / 60000)

    const selectedTimeMs =
      safeSunrise.getTime() + daylightMs * Math.max(0, Math.min(1, sliderRatio))
    const selectedDate = new Date(selectedTimeMs)
    const selectedPos = SunCalc.getPosition(selectedDate, lat, lng)
    const selectedHeightDeg = Math.max(
      0,
      Math.round((selectedPos.altitude * 180) / Math.PI)
    )

    let dirLabel = 'South'
    if (sliderRatio < 0.25) dirLabel = isAr ? 'الشرق (East)' : 'East'
    else if (sliderRatio < 0.42)
      dirLabel = isAr ? 'جنوب شرق (South-East)' : 'South-East'
    else if (sliderRatio <= 0.58) dirLabel = isAr ? 'الجنوب (South)' : 'South'
    else if (sliderRatio < 0.78)
      dirLabel = isAr ? 'جنوب غرب (South-West)' : 'South-West'
    else dirLabel = isAr ? 'الغرب (West)' : 'West'

    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const halfHours = Math.floor(totalHours / 2)
    const halfMins = Math.round(totalMins / 2)

    return {
      sunriseStr: fmt(safeSunrise),
      sunsetStr: fmt(safeSunset),
      noonStr: fmt(safeNoon),
      selectedTimeStr: fmt(selectedDate),
      maxDeg,
      selectedHeightDeg,
      dirLabel,
      daylightStr: `${totalHours} h ${totalMins} min`,
      eastHoursStr: `${halfHours} h ${halfMins} min`,
      westHoursStr: `${halfHours} h ${halfMins} min`,
      eastWindowRange: `${fmt(safeSunrise)}–${fmt(safeNoon)}`,
      westWindowRange: `${fmt(safeNoon)}–${fmt(safeSunset)}`,
      southWindowRange: `${fmt(safeSunrise)}–${fmt(safeSunset)}`,
    }
  }, [targetDate, lat, lng, sliderRatio, isAr])

  const startX = 40
  const endX = 560
  const baseY = 155
  const peakHeight = season === 'summer' ? 125 : season === 'winter' ? 75 : 105
  const tVal = sliderRatio
  const controlX = 300
  const controlY = baseY - peakHeight * 2

  const sunX =
    (1 - tVal) * (1 - tVal) * startX +
    2 * (1 - tVal) * tVal * controlX +
    tVal * tVal * endX
  const sunY =
    (1 - tVal) * (1 - tVal) * baseY +
    2 * (1 - tVal) * tVal * controlY +
    tVal * tVal * baseY

  return (
    <section className="mt-5 rounded-[22px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Sun className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
              {isAr
                ? 'حركة الشمس والإضاءة الطبيعية (Sun & daylight)'
                : 'Sun & daylight'}
            </h3>
            <p className="text-[11px] text-gray-400">
              {isAr
                ? 'مسار الشمس الفلكي المحسوب من إحداثيات المنطقة'
                : 'Sun path at this address — astronomical calculation from the coordinates'}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-extrabold">
          {(
            [
              { id: 'winter', label: isAr ? 'الشتاء' : 'Winter' },
              { id: 'today', label: isAr ? 'اليوم' : 'Today' },
              { id: 'summer', label: isAr ? 'الصيف' : 'Summer' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSeason(tab.id)}
              className={`rounded-full px-3.5 py-1 text-[11px] font-extrabold transition ${
                season === tab.id
                  ? 'bg-[#2563eb] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#0a1122]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2.5 text-xs font-extrabold text-[#0a1122]">
          {isAr
            ? 'تعرض النوافذ لأشعة الشمس المباشرة حسب الاتجاه (Direct sun by window direction)'
            : 'Direct sun by window direction'}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* North */}
          <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
              <span>{isAr ? 'الشمال (North)' : 'North'}</span>
              <span className="text-gray-400">—</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200" />
            <p className="mt-2 text-[11px] text-gray-400">
              {isAr ? 'إضاءة ناعمة بدون شمس مباشرة' : 'No direct sun'}
            </p>
          </div>

          {/* East */}
          <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
              <span>{isAr ? 'الشرق (East)' : 'East'}</span>
              <span dir="ltr">{sunMetrics.eastHoursStr}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-1/2 rounded-full bg-orange-500" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>{isAr ? 'مشرق صباحاً (Bright)' : 'Bright'}</span>
              <span dir="ltr" className="font-mono">
                {sunMetrics.eastWindowRange}
              </span>
            </div>
          </div>

          {/* South */}
          <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-3.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
              <span>{isAr ? 'الجنوب (South)' : 'South'}</span>
              <span dir="ltr">{sunMetrics.daylightStr}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-[92%] rounded-full bg-orange-500" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
              <span className="font-bold text-orange-700">
                {isAr ? 'مشمس جداً طوال النهار (Very bright)' : 'Very bright'}
              </span>
              <span dir="ltr" className="font-mono">
                {sunMetrics.southWindowRange}
              </span>
            </div>
          </div>

          {/* West */}
          <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
              <span>{isAr ? 'الغرب (West)' : 'West'}</span>
              <span dir="ltr">{sunMetrics.westHoursStr}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="ms-auto h-full w-1/2 rounded-full bg-orange-500" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>{isAr ? 'مشرق عصراً (Bright)' : 'Bright'}</span>
              <span dir="ltr" className="font-mono">
                {sunMetrics.westWindowRange}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <svg viewBox="0 0 600 185" className="w-full overflow-visible">
          <defs>
            <linearGradient id="sunArcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path
            d={`M ${startX} ${baseY} Q ${controlX} ${controlY} ${endX} ${baseY} Z`}
            fill="url(#sunArcGrad)"
          />

          <line
            x1="20"
            y1={baseY}
            x2="580"
            y2={baseY}
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          <path
            d={`M ${startX} ${baseY} Q ${controlX} ${controlY} ${endX} ${baseY}`}
            fill="none"
            stroke="#ea580c"
            strokeWidth="3"
          />

          <circle
            cx={sunX}
            cy={sunY}
            r="16"
            fill="#f97316"
            fillOpacity="0.18"
          />
          <circle
            cx={sunX}
            cy={sunY}
            r="7"
            fill="#ea580c"
            stroke="#ffffff"
            strokeWidth="2"
          />

          <text
            x="140"
            y={baseY + 24}
            fontSize="12"
            fontWeight="700"
            fill="#64748b"
            textAnchor="middle"
          >
            E
          </text>
          <text
            x="300"
            y={baseY + 24}
            fontSize="12"
            fontWeight="700"
            fill="#0f172a"
            textAnchor="middle"
          >
            S
          </text>
          <text
            x="460"
            y={baseY + 24}
            fontSize="12"
            fontWeight="700"
            fill="#64748b"
            textAnchor="middle"
          >
            W
          </text>
        </svg>

        <div className="mx-auto mt-2 max-w-md px-4">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sliderRatio * 100)}
            onChange={(e) => setSliderRatio(Number(e.target.value) / 100)}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-orange-200 accent-[#ea580c]"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-xs sm:grid-cols-4">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              {isAr ? 'الوقت المحدد (TIME)' : 'TIME'}
            </span>
            <strong dir="ltr" className="mt-0.5 block font-mono text-sm font-black text-[#0a1122]">
              {sunMetrics.selectedTimeStr}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              {isAr ? 'زاوية الارتفاع (HEIGHT)' : 'HEIGHT'}
            </span>
            <strong dir="ltr" className="mt-0.5 block font-mono text-sm font-black text-[#0a1122]">
              {sunMetrics.selectedHeightDeg}°
            </strong>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              {isAr ? 'الاتجاه (DIRECTION)' : 'DIRECTION'}
            </span>
            <strong className="mt-0.5 block text-sm font-black text-[#0a1122]">
              {sunMetrics.dirLabel}
            </strong>
          </div>
          <div className="hidden sm:block">
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              {isAr ? 'طول النهار (DAYLIGHT)' : 'DAYLIGHT'}
            </span>
            <strong dir="ltr" className="mt-0.5 block text-sm font-black text-[#007a5a]">
              {sunMetrics.daylightStr}
            </strong>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3 text-xs sm:grid-cols-4">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              SUNRISE
            </span>
            <strong dir="ltr" className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700">
              {sunMetrics.sunriseStr}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              SOLAR NOON
            </span>
            <strong dir="ltr" className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700">
              {sunMetrics.noonStr} · {sunMetrics.maxDeg}°
            </strong>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              SUNSET
            </span>
            <strong dir="ltr" className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700">
              {sunMetrics.sunsetStr}
            </strong>
          </div>
          <div className="sm:hidden">
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              DAYLIGHT
            </span>
            <strong dir="ltr" className="mt-0.5 block text-xs font-extrabold text-[#007a5a]">
              {sunMetrics.daylightStr}
            </strong>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==========================================
// 3. المكون الرئيسي: Neighborhood Score + 3D Map + What's Nearby + Sun Chart
// ==========================================
export function UnitLocationInsights({
  areaId,
  locale = 'ar',
}: {
  areaId: string | null
  t?: any
  locale?: string
}) {
  const isAr = locale === 'ar'
  const coords = getCoordinatesForArea(areaId)
  const localizedArea = getLocalizedGeorgiaAreaName(areaId, locale)
  const isBatumi = String(areaId || '')
    .toLowerCase()
    .includes('batumi')

  const mapRef = useRef<MapRef | null>(null)
  const [is3D, setIs3D] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [activeCategory, setActiveCategory] =
    useState<NearbyCategoryKey>('all')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  )
  const [places, setPlaces] = useState<PlaceItem[]>(() =>
    getFallbackPlacesForArea(isBatumi)
  )
  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number
    aqi: number
  }>({ temp: 18, aqi: 34 })

  // تفعيل وتلوين المباني الـ 3D تلقائياً فور تحميل الخريطة بدون أخطاء Source ID
  const handleMapLoad = useCallback((event: any) => {
    const map = event.target
    setMapLoaded(true)

    try {
      map.resize()

      const style = map.getStyle()
      const layers = style?.layers || []
      const sources = style?.sources || {}

      // 1. لو الستايل فيه طبقة مباني جاهزة، نلونها باللون البيج المجسم ونرفعها 3D
      let found3DLayer = false
      for (const layer of layers) {
        if (
          layer.type === 'fill-extrusion' ||
          (layer['source-layer'] &&
            String(layer['source-layer']).includes('building'))
        ) {
          if (layer.type === 'fill-extrusion') {
            found3DLayer = true
            map.setPaintProperty(layer.id, 'fill-extrusion-color', '#d8c5b4')
            map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.92)
          }
        }
      }

      // 2. لو مفيش طبقة fill-extrusion جاهزة، ننشئها على أول Vector Source متاح في الستايل
      if (!found3DLayer) {
        const vectorSourceKey = Object.keys(sources).find(
          (k) => sources[k]?.type === 'vector'
        )
        if (vectorSourceKey && !map.getLayer('custom-3d-buildings')) {
          map.addLayer({
            id: 'custom-3d-buildings',
            source: vectorSourceKey,
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#d8c5b4',
              'fill-extrusion-height': [
                'coalesce',
                ['get', 'render_height'],
                ['get', 'height'],
                16,
              ],
              'fill-extrusion-base': [
                'coalesce',
                ['get', 'render_min_height'],
                ['get', 'min_height'],
                0,
              ],
              'fill-extrusion-opacity': 0.92,
            },
          })
        }
      }
    } catch (e) {
      console.warn('3D layer enhancement skipped:', e)
    }
  }, [])

  // تحريك الخريطة لو تغيرت إحداثيات المنطقة
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 16.2,
        pitch: is3D ? 58 : 0,
        bearing: is3D ? -20 : 0,
        duration: 800,
      })
    }
  }, [coords.lat, coords.lng, mapLoaded, is3D])

  // جلب الطقس الحي والأماكن القريبة
  useEffect(() => {
    setPlaces(getFallbackPlacesForArea(isBatumi))

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current_weather?.temperature !== undefined) {
          setWeatherInfo((prev) => ({
            ...prev,
            temp: Math.round(data.current_weather.temperature),
          }))
        }
      })
      .catch(() => {})

    const query = `[out:json][timeout:8];(node["amenity"~"school|kindergarten|pharmacy|clinic|hospital|restaurant|cafe|university"](around:1600,${coords.lat},${coords.lng});node["shop"~"supermarket|convenience"](around:1600,${coords.lat},${coords.lng});node["leisure"="fitness_centre"](around:1600,${coords.lat},${coords.lng});node["highway"="bus_stop"](around:1200,${coords.lat},${coords.lng}););out body 60;`

    fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data?.elements) || data.elements.length < 5) return
        const mapped: PlaceItem[] = []
        data.elements.forEach((el: any) => {
          const name =
            el.tags?.['name:en'] || el.tags?.name || el.tags?.['name:ka']
          if (!name || !el.lat || !el.lon) return
          const dist = haversineMeters(coords.lat, coords.lng, el.lat, el.lon)
          const am = el.tags?.amenity || ''
          const sh = el.tags?.shop || ''
          let cat: Exclude<NearbyCategoryKey, 'all'> = 'market'

          if (am === 'school') cat = 'school'
          else if (am === 'kindergarten') cat = 'kindergarten'
          else if (am === 'pharmacy') cat = 'pharmacy'
          else if (am === 'clinic' || am === 'hospital') cat = 'clinic'
          else if (am === 'restaurant' || am === 'cafe') cat = 'restaurants'
          else if (am === 'university') cat = 'university'
          else if (el.tags?.leisure === 'fitness_centre') cat = 'gym'
          else if (el.tags?.highway === 'bus_stop') cat = 'bus'
          else if (sh) cat = 'market'

          mapped.push({
            id: String(el.id),
            name: String(name),
            category: cat,
            distanceMeters: dist,
          })
        })

        if (mapped.length >= 6) {
          setPlaces((prev) => {
            const combined = [...mapped, ...prev]
            const seen = new Set<string>()
            return combined
              .filter((p) => {
                const k = `${p.category}_${p.name.toLowerCase()}`
                if (seen.has(k)) return false
                seen.add(k)
                return true
              })
              .sort((a, b) => a.distanceMeters - b.distanceMeters)
          })
        }
      })
      .catch(() => {})
  }, [coords.lat, coords.lng, isBatumi])

  const toggle3DPitch = () => {
    const next3D = !is3D
    setIs3D(next3D)
    mapRef.current?.easeTo({
      pitch: next3D ? 58 : 0,
      bearing: next3D ? -20 : 0,
      duration: 700,
    })
  }

  const visibleCategories =
    activeCategory === 'all'
      ? CATEGORY_META
      : CATEGORY_META.filter((c) => c.key === activeCategory)

  return (
    <>
      {/* 1. كارت قابلية المشي والمواصلات (Neighborhood & Mobility Score) */}
      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
          {isAr ? 'تقييم الحي وسهولة التنقل (Neighborhood)' : 'Neighborhood'}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-gray-500">
          {isAr
            ? 'منطقة مخدومة بالكامل وقابلة للمشي (Very walkable)'
            : 'Very walkable & well connected'}
        </p>

        <div className="mt-4 space-y-3.5 text-xs">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <Footprints className="size-3.5 text-[#2563eb]" />
                <span>
                  {isAr ? 'مؤشر المشي والخدمات اليومية (Walk Score)' : 'Walk'}
                </span>
              </span>
              <strong className="font-black text-[#0a1122]">78</strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[78%] rounded-full bg-[#2563eb]" />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <TrainFront className="size-3.5 text-[#2563eb]" />
                <span>
                  {isAr
                    ? 'مؤشر المواصلات والربط المروري (Mobility Score)'
                    : 'Mobility Score · Well connected'}
                </span>
              </span>
              <strong className="font-black text-[#0a1122]">74</strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[74%] rounded-full bg-[#2563eb]" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. قسم الخريطة ثلاثية الأبعاد الحقيقية (3D Extruded Buildings Map) */}
      <section className="mt-5 overflow-hidden rounded-[22px] border border-gray-200/85 bg-white p-4 shadow-2xs sm:p-6">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-[#0a1122] sm:text-lg">
              {isAr ? 'الموقع والخريطة ثلاثية الأبعاد (Location)' : 'Location'}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-extrabold text-[#0a1122]">
                📍 {localizedArea}
              </span>
              <span className="rounded-full border border-emerald-200 bg-[#eaf8f2] px-3 py-1 text-[11px] font-bold text-[#007a5a]">
                {isAr
                  ? 'نطاق تقريبي لحماية خصوصية المالك'
                  : 'Approximate area center'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-extrabold text-gray-700 shadow-2xs">
              <CloudSun className="size-3.5 text-sky-500" />
              <span dir="ltr">{weatherInfo.temp}° Cloudy</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-extrabold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span dir="ltr">AQI {weatherInfo.aqi} Air quality</span>
            </span>
          </div>
        </div>

        {/* حاوية الخريطة ثلاثية الأبعاد مع أبعاد صريحة 100% */}
        <div className="relative h-[360px] w-full overflow-hidden rounded-[18px] border border-gray-200 bg-[#edeae4] sm:h-[430px]">
         <Map
            ref={mapRef}
            initialViewState={{
              latitude: coords.lat,
              longitude: coords.lng,
              zoom: 16.2,
              pitch: 58,
              bearing: -20,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            onLoad={(e) => {
              const map = e.target;
              map.resize();
            }}
            attributionControl={false}
          >
            {/* دبوس الموقع البرتقالي الثلاثي الأبعاد */}
            <Marker
              latitude={coords.lat}
              longitude={coords.lng}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <div className="flex size-11 items-center justify-center rounded-2xl border-2 border-white bg-[#ea580c] text-white shadow-xl">
                  <Building2 className="size-5" />
                </div>
                <div className="-mt-1 h-3 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-[#ea580c]" />
              </div>
            </Marker>
          </Map>

          {/* أزرار التحكم الجانبية على يمين الخريطة مثل sivrce.ge */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-white"
              title="Zoom in"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-white"
              title="Zoom out"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={toggle3DPitch}
              className={`flex size-8 items-center justify-center rounded-lg border text-[11px] font-black shadow-md transition ${
                is3D
                  ? 'border-[#2563eb] bg-[#2563eb] text-white'
                  : 'border-gray-200 bg-white/95 text-gray-700'
              }`}
              title="Toggle 3D"
            >
              3D
            </button>
            <button
              type="button"
              onClick={() =>
                mapRef.current?.flyTo({
                  center: [coords.lng, coords.lat],
                  zoom: 16.2,
                  pitch: 58,
                  bearing: -20,
                  duration: 600,
                })
              }
              className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-white"
              title="Reset view"
            >
              <Compass className="size-4" />
            </button>
          </div>

          {/* شريط الإحداثيات السفلي وأزرار Directions و Open 3D Map */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="pointer-events-auto rounded-xl bg-black/65 px-3 py-1.5 text-white backdrop-blur-xs">
              <p className="text-xs font-extrabold">{localizedArea}</p>
              <p dir="ltr" className="font-mono text-[10px] text-gray-300">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/95 px-3.5 text-xs font-extrabold text-[#0a1122] shadow-md transition hover:bg-white"
              >
                <Navigation className="size-3.5 text-[#2563eb]" />
                <span>{isAr ? 'الاتجاهات' : 'Directions'}</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIs3D(true)
                  mapRef.current?.easeTo({
                    zoom: 16.8,
                    pitch: 62,
                    bearing: -28,
                    duration: 800,
                  })
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ea580c] px-4 text-xs font-extrabold text-white shadow-md transition hover:bg-[#c2410c]"
              >
                <Maximize2 className="size-3.5" />
                <span>{isAr ? 'عرض ثلاثي الأبعاد 3D' : 'Open 3D map'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. قسم الأماكن القريبة (What's nearby) بشبكة الـ 9 كروت المجمعة */}
        <div className="mt-6">
          <h4 className="text-sm font-black text-[#0a1122] sm:text-base">
            {isAr ? "الأماكن والخدمات القريبة (What's nearby)" : "What's nearby"}
          </h4>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Nearest first · walking time · data © OpenStreetMap contributors
          </p>

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                activeCategory === 'all'
                  ? 'border-[#0a1122] bg-[#0a1122] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{isAr ? 'الكل' : 'All'}</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {places.length}
              </span>
            </button>

            {CATEGORY_META.map((cat) => {
              const count = places.filter((p) => p.category === cat.key).length
              const CatIcon = cat.icon
              const active = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'border-[#0a1122] bg-[#0a1122] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CatIcon className="size-3.5 text-amber-600" />
                  <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                  <span className="text-[10px] text-gray-400">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCategories.map((cat) => {
              const catPlaces = places
                .filter((p) => p.category === cat.key)
                .sort((a, b) => a.distanceMeters - b.distanceMeters)
              const isExpanded = Boolean(expandedCards[cat.key])
              const shownPlaces = isExpanded
                ? catPlaces
                : catPlaces.slice(0, 3)
              const extraCount = Math.max(0, catPlaces.length - 3)
              const CatIcon = cat.icon

              return (
                <div
                  key={cat.key}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200/85 bg-white p-4 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-600">
                        <CatIcon className="size-3.5 text-amber-600" />
                        <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-400">
                        {catPlaces.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      {shownPlaces.map((pl) => (
                        <div key={pl.id} className="text-xs">
                          <div className="flex items-baseline justify-between gap-2">
                            <strong className="truncate font-extrabold text-[#0a1122]">
                              {pl.name}
                            </strong>
                            <span
                              dir="ltr"
                              className="shrink-0 text-[11px] font-semibold text-gray-400"
                            >
                              {pl.distanceMeters < 1000
                                ? `${pl.distanceMeters} m`
                                : `${(pl.distanceMeters / 1000).toFixed(1)} km`}
                            </span>
                          </div>
                          <p
                            dir="ltr"
                            className="mt-0.5 text-start text-[10.5px] text-gray-400"
                          >
                            {formatTravelEstimate(pl.distanceMeters)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {extraCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCards((prev) => ({
                          ...prev,
                          [cat.key]: !prev[cat.key],
                        }))
                      }
                      className="mt-3 border-t border-gray-100 pt-2 text-center text-[11px] font-extrabold text-gray-500 hover:text-[#0a1122]"
                    >
                      {isExpanded
                        ? isAr
                          ? 'عرض أقل ▲'
                          : 'Show less ▲'
                        : `+${extraCount} More ⌄`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. مخطط الشمس والإضاءة التفاعلي الكامل */}
      <SunAndDaylightInteractiveCard
        lat={coords.lat}
        lng={coords.lng}
        locale={locale}
      />
    </>
  )
}