'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as SunCalc from 'suncalc'
import {
  Baby,
  Building2,
  Bus,
  Camera,
  ChevronDown,
  ChevronUp,
  Circle,
  CloudSun,
  Compass,
  Contrast,
  Dumbbell,
  Footprints,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Minus,
  Mountain,
  Navigation,
  Pill,
  Plane,
  Plus,
  ShoppingCart,
  Sparkles,
  Sun,
  TrainFront,
  Trees,
  Utensils,
} from 'lucide-react'
import type {
  NearbyPlaceCategory,
  RealNearbyPlaceItem,
} from '@/actions/georgia-geocode-action'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  getInstantGeorgiaNearbyPlaces,
  haversineMetersClient,
} from '@/lib/georgia-pois-engine'
import {
  apply3DBuildingsToMap,
  geocodeExactBuildingInGeorgia,
  getReliableGeorgiaMapStyle,
  highlight3DBuildingAtCoordinates,
  type GeorgiaMapThemeMode,
} from '@/lib/georgia-uber-search'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

type NearbyCategoryKey = 'all' | NearbyPlaceCategory

const MAP_STYLE_OPTIONS: Array<{
  id: GeorgiaMapThemeMode
  label: string
  icon: any
}> = [
  { id: 'streets', label: 'Streets', icon: MapIcon },
  { id: 'sivrce', label: 'Sivrce', icon: Globe },
  { id: 'realistic', label: 'Realistic', icon: Mountain },
  { id: 'photoreal', label: 'Photoreal', icon: Camera },
  { id: 'hybrid', label: 'Hybrid', icon: Sparkles },
  { id: 'minimal', label: 'Minimal', icon: Circle },
  { id: 'contrast', label: 'High contrast', icon: Contrast },
]

const GEORGIA_RAIL_STATIONS = [
  { name: 'Tbilisi Central', lat: 41.7205, lng: 44.7992 },
  { name: 'Navtlughi', lat: 41.6882, lng: 44.8418 },
  { name: 'Didube', lat: 41.7501, lng: 44.7795 },
  { name: 'Batumi Central', lat: 41.6588, lng: 41.6769 },
]

const GEORGIA_AIRPORTS = [
  { code: 'TBS', name: 'TBS Airport', lat: 41.6692, lng: 44.9547 },
  { code: 'BUS', name: 'BUS Airport', lat: 41.6103, lng: 41.5997 },
  { code: 'KUT', name: 'KUT Airport', lat: 42.1767, lng: 42.4826 },
]

const CATEGORY_ICONS: Array<{
  key: NearbyPlaceCategory
  icon: any
}> = [
  { key: 'metro', icon: TrainFront },
  { key: 'school', icon: GraduationCap },
  { key: 'kindergarten', icon: Baby },
  { key: 'pharmacy', icon: Pill },
  { key: 'park', icon: Trees },
  { key: 'market', icon: ShoppingCart },
  { key: 'restaurants', icon: Utensils },
  { key: 'clinic', icon: HeartPulse },
  { key: 'university', icon: Landmark },
  { key: 'bank', icon: Building2 },
  { key: 'landmark', icon: Compass },
  { key: 'gym', icon: Dumbbell },
  { key: 'bus', icon: Bus },
]

function computeSivrceTravelTimes(meters: number) {
  const walkMin = Math.max(1, Math.round(meters / 80))
  const transitMin = Math.round(meters / 300) + 5
  const driveMin = Math.round(meters / 500) + 4
  return { walkMin, transitMin, driveMin }
}

const INSIGHTS_I18N: Record<
  LocaleCode,
  {
    neighborhoodTitle: string
    neighborhoodSubPrefix: string
    neighborhoodSubSuffix: string
    walkScoreLabel: string
    mobilityScoreLabel: string
    metroRowLabel: string
    busRowLabel: string
    busLinesWithin500m: string
    railRowLabel: string
    airportRowLabel: string
    bestBadge: string
    locationTitle: string
    exactBuildingBadge: string
    approxCenterBadge: string
    cloudyWord: string
    airQualityWord: string
    collapseTooltip: string
    expandTooltip: string
    directionsBtn: string
    open3dMapBtn: string
    closeFullscreenBtn: string
    whatsNearbyTitle: string
    whatsNearbySub: string
    allCat: string
    showLessBtn: string
    showMoreSuffix: string
    walkWord: string
    transitWord: string
    driveWord: string
    minWord: string
    sunTitle: string
    sunSub: string
    winterTab: string
    todayTab: string
    summerTab: string
    windowDirectionTitle: string
    northLabel: string
    eastLabel: string
    southLabel: string
    westLabel: string
    noDirectSun: string
    brightMorning: string
    veryBrightAllDay: string
    brightAfternoon: string
    southEastLabel: string
    southWestLabel: string
    timeLabel: string
    heightLabel: string
    directionLabel: string
    daylightLabel: string
    sunriseLabel: string
    solarNoonLabel: string
    sunsetLabel: string
    windowsHelpText: string
    macHelpText: string
    mobileHelpText: string
    categories: Record<NearbyPlaceCategory, string>
  }
> = {
  ar: {
    neighborhoodTitle: 'تقييم الحي وسهولة التنقل (Neighborhood & Mobility)',
    neighborhoodSubPrefix: 'منطقة مخدومة بالكامل وقابلة للمشي (',
    neighborhoodSubSuffix: 'مرفق وخدمة حقيقية مسجلة حول المبنى)',
    walkScoreLabel:
      'مؤشر المشي والخدمات اليومية (Walk Score — قضاء الاحتياجات اليومية مشياً)',
    mobilityScoreLabel:
      'مؤشر المواصلات والربط المروري (Mobility Score · Well connected)',
    metroRowLabel: 'المترو',
    busRowLabel: 'الحافلات',
    busLinesWithin500m: 'خطوط ضمن 500 م',
    railRowLabel: 'محطة القطار',
    airportRowLabel: 'المطار',
    bestBadge: 'الأسرع',
    locationTitle: 'الموقع والخريطة ثلاثية الأبعاد',
    exactBuildingBadge: 'موقع المبنى الدقيق ✓',
    approxCenterBadge: 'موقع موثق في السجل الجغرافي',
    cloudyWord: 'معتدل',
    airQualityWord: 'جودة الهواء',
    collapseTooltip: 'طي القسم',
    expandTooltip: 'فتح القسم',
    directionsBtn: 'الاتجاهات على Google Maps',
    open3dMapBtn: 'تكبير الخريطة 3D',
    closeFullscreenBtn: 'تصغير الخريطة',
    whatsNearbyTitle: 'الأماكن والخدمات القريبة من العقار',
    whatsNearbySub:
      'الأقرب أولاً · المسافة الحقيقية وزمن المشي والسيارة من موقع المبنى · خرائط جورجيا',
    allCat: 'الكل',
    showLessBtn: 'عرض أقل ▲',
    showMoreSuffix: 'المزيد ⌄',
    walkWord: 'مشياً',
    transitWord: 'مواصلات',
    driveWord: 'سيارة',
    minWord: 'د',
    sunTitle: 'حركة الشمس والإضاءة الطبيعية للمبنى',
    sunSub:
      'مسار الشمس الفلكي المحسوب بدقة من إحداثيات هذا المبنى (بتوقيت جورجيا)',
    winterTab: 'الشتاء',
    todayTab: 'اليوم',
    summerTab: 'الصيف',
    windowDirectionTitle: 'تعرض النوافذ لأشعة الشمس المباشرة حسب الاتجاه',
    northLabel: 'الشمال',
    eastLabel: 'الشرق',
    southLabel: 'الجنوب',
    westLabel: 'الغرب',
    noDirectSun: 'إضاءة ناعمة بدون شمس مباشرة',
    brightMorning: 'مشرق صباحاً',
    veryBrightAllDay: 'مشمس جداً طوال النهار',
    brightAfternoon: 'مشرق عصراً',
    southEastLabel: 'جنوب شرق',
    southWestLabel: 'جنوب غرب',
    timeLabel: 'الوقت المحدد',
    heightLabel: 'زاوية الارتفاع',
    directionLabel: 'الاتجاه',
    daylightLabel: 'طول النهار',
    sunriseLabel: 'الشروق',
    solarNoonLabel: 'الظهيرة',
    sunsetLabel: 'الغروب',
    windowsHelpText: 'استخدم Ctrl + التمرير لتكبير الخريطة',
    macHelpText: 'استخدم ⌘ + التمرير لتكبير الخريطة',
    mobileHelpText: 'استخدم إصبعين لتحريك وتكبير الخريطة',
    categories: {
      metro: 'المترو',
      school: 'مدارس',
      kindergarten: 'حضانات ورياض أطفال',
      pharmacy: 'صيدليات',
      park: 'حدائق ومتنزهات',
      market: 'سوبرماركت وأسواق',
      restaurants: 'مطاعم وكافيهات',
      clinic: 'عيادات ومستشفيات',
      university: 'جامعات وكليات',
      bank: 'بنوك وصراف آلي',
      landmark: 'معالم شهيرة',
      gym: 'صالات رياضية',
      bus: 'محطات حافلات',
    },
  },
  en: {
    neighborhoodTitle: 'Neighborhood',
    neighborhoodSubPrefix: 'Very walkable (',
    neighborhoodSubSuffix: 'nearby amenities)',
    walkScoreLabel: 'Walk (Daily errands on foot)',
    mobilityScoreLabel: 'Mobility Score · Well connected',
    metroRowLabel: 'Metro',
    busRowLabel: 'Bus',
    busLinesWithin500m: 'Lines within 500 m',
    railRowLabel: 'Rail',
    airportRowLabel: 'Airport',
    bestBadge: 'Best',
    locationTitle: 'Location & 3D Map',
    exactBuildingBadge: 'Exact building pin ✓',
    approxCenterBadge: 'Verified area coordinates',
    cloudyWord: 'Partly cloudy',
    airQualityWord: 'Air quality',
    collapseTooltip: 'Collapse',
    expandTooltip: 'Expand',
    directionsBtn: 'Directions',
    open3dMapBtn: 'Open 3D map',
    closeFullscreenBtn: 'Exit Fullscreen',
    whatsNearbyTitle: "What's nearby",
    whatsNearbySub: 'Nearest first · walking time · Aqar Exit Maps',
    allCat: 'All',
    showLessBtn: 'Show less ▲',
    showMoreSuffix: 'More ⌄',
    walkWord: 'walk',
    transitWord: 'transit',
    driveWord: 'drive',
    minWord: 'min',
    sunTitle: 'Sun & daylight',
    sunSub:
      'Sun path at this address — astronomical calculation from the coordinates',
    winterTab: 'Winter',
    todayTab: 'Today',
    summerTab: 'Summer',
    windowDirectionTitle: 'Direct sun by window direction',
    northLabel: 'North',
    eastLabel: 'East',
    southLabel: 'South',
    westLabel: 'West',
    noDirectSun: 'No direct sun',
    brightMorning: 'Bright',
    veryBrightAllDay: 'Very bright',
    brightAfternoon: 'Bright',
    southEastLabel: 'South-East',
    southWestLabel: 'South-West',
    timeLabel: 'TIME',
    heightLabel: 'HEIGHT',
    directionLabel: 'DIRECTION',
    daylightLabel: 'DAYLIGHT',
    sunriseLabel: 'SUNRISE',
    solarNoonLabel: 'SOLAR NOON',
    sunsetLabel: 'SUNSET',
    windowsHelpText: 'Use Ctrl + scroll to zoom the map',
    macHelpText: 'Use ⌘ + scroll to zoom the map',
    mobileHelpText: 'Use two fingers to move the map',
    categories: {
      metro: 'Metro',
      school: 'School',
      kindergarten: 'Kindergarten',
      pharmacy: 'Pharmacy',
      park: 'Park',
      market: 'Market',
      restaurants: 'Restaurants',
      clinic: 'Clinic',
      university: 'University',
      bank: 'Bank',
      landmark: 'Landmark',
      gym: 'Gym',
      bus: 'Bus',
    },
  },
  ru: {
    neighborhoodTitle: 'Район и транспортная доступность',
    neighborhoodSubPrefix: 'Развитая инфраструктура в пешей доступности (',
    neighborhoodSubSuffix: 'объектов рядом)',
    walkScoreLabel: 'Пешая доступность (Магазины, аптеки и школы пешком)',
    mobilityScoreLabel: 'Транспортная доступность · Отличная связь',
    metroRowLabel: 'Метро',
    busRowLabel: 'Автобус',
    busLinesWithin500m: 'Линий в радиусе 500 м',
    railRowLabel: 'Вокзал',
    airportRowLabel: 'Аэропорт',
    bestBadge: 'Лучший',
    locationTitle: 'Локация и 3D-карта',
    exactBuildingBadge: 'Точное здание ✓',
    approxCenterBadge: 'Координаты подтверждены',
    cloudyWord: 'Переменная облачность',
    airQualityWord: 'Качество воздуха',
    collapseTooltip: 'Свернуть',
    expandTooltip: 'Развернуть',
    directionsBtn: 'Маршрут',
    open3dMapBtn: 'На весь экран 3D',
    closeFullscreenBtn: 'Свернуть карту',
    whatsNearbyTitle: 'Что находится рядом',
    whatsNearbySub: 'Сначала ближайшие · точное время пешком · данные карты',
    allCat: 'Все',
    showLessBtn: 'Свернуть ▲',
    showMoreSuffix: 'Еще ⌄',
    walkWord: 'пешком',
    transitWord: 'транспорт',
    driveWord: 'авто',
    minWord: 'мин',
    sunTitle: 'Солнце и естественное освещение',
    sunSub: 'Траектория солнца по точным координатам здания',
    winterTab: 'Зима',
    todayTab: 'Сегодня',
    summerTab: 'Лето',
    windowDirectionTitle: 'Солнечный свет по направлению окон',
    northLabel: 'Север',
    eastLabel: 'Восток',
    southLabel: 'Юг',
    westLabel: 'Запад',
    noDirectSun: 'Без прямого солнца',
    brightMorning: 'Солнечно утром',
    veryBrightAllDay: 'Солнечно весь день',
    brightAfternoon: 'Солнечно после полудня',
    southEastLabel: 'Юго-Восток',
    southWestLabel: 'Юго-Запад',
    timeLabel: 'ВРЕМЯ',
    heightLabel: 'ВЫСОТА',
    directionLabel: 'НАПРАВЛЕНИЕ',
    daylightLabel: 'СВЕТОВОЙ ДЕНЬ',
    sunriseLabel: 'ВОСХОД',
    solarNoonLabel: 'ПОЛДЕНЬ',
    sunsetLabel: 'ЗАКАТ',
    windowsHelpText: 'Используйте Ctrl + колесико для масштабирования',
    macHelpText: 'Используйте ⌘ + колесико для масштабирования',
    mobileHelpText: 'Используйте два пальца для перемещения карты',
    categories: {
      metro: 'Метро',
      school: 'Школы',
      kindergarten: 'Детские сады',
      pharmacy: 'Аптеки',
      park: 'Парки',
      market: 'Супермаркеты',
      restaurants: 'Рестораны',
      clinic: 'Клиники',
      university: 'Университеты',
      bank: 'Банки',
      landmark: 'Достопримечательности',
      gym: 'Фитнес',
      bus: 'Автобус',
    },
  },
  ka: {
    neighborhoodTitle: 'უბანი და ტრანსპორტი',
    neighborhoodSubPrefix: 'კეთილმოწყობილი და ფეხით სავალი ზონა (',
    neighborhoodSubSuffix: 'ობიექტი შენობის გარშემო)',
    walkScoreLabel: 'ფეხით ხელმისაწვდომობა (Walk Score)',
    mobilityScoreLabel: 'ტრანსპორტის ხელმისაწვდომობა (Mobility Score)',
    metroRowLabel: 'მეტრო',
    busRowLabel: 'ავტობუსი',
    busLinesWithin500m: 'ხაზები 500 მ-ში',
    railRowLabel: 'რკინიგზა',
    airportRowLabel: 'აეროპორტი',
    bestBadge: 'საუკეთესო',
    locationTitle: 'მდებარეობა და 3D რუკა',
    exactBuildingBadge: 'ზუსტი შენობა ✓',
    approxCenterBadge: 'დადასტურებული მდებარეობა',
    cloudyWord: 'ზომიერი',
    airQualityWord: 'ჰაერის ხარისხი',
    collapseTooltip: 'ჩაკეცვა',
    expandTooltip: 'გაშლა',
    directionsBtn: 'მარშრუტი',
    open3dMapBtn: '3D რუკა',
    closeFullscreenBtn: 'დახურვა',
    whatsNearbyTitle: 'რა არის ახლოს',
    whatsNearbySub: 'უახლოესი ობიექტები · ფეხით სავალი დრო',
    allCat: 'ყველა',
    showLessBtn: 'ნაკლები ▲',
    showMoreSuffix: 'მეტი ⌄',
    walkWord: 'ფეხით',
    transitWord: 'ტრანსპორტი',
    driveWord: 'მანქანით',
    minWord: 'წთ',
    sunTitle: 'მზე და ბუნებრივი განათება',
    sunSub: 'მზის ტრაექტორია შენობის ზუსტი კოორდინატების მიხედვით',
    winterTab: 'ზამთარი',
    todayTab: 'დღეს',
    summerTab: 'ზაფხული',
    windowDirectionTitle: 'მზის სხივები ფანჯრების მიხედვით',
    northLabel: 'ჩრდილოეთი',
    eastLabel: 'აღმოსავლეთი',
    southLabel: 'სამხრეთი',
    westLabel: 'დასავლეთი',
    noDirectSun: 'პირდაპირი მზის გარეშე',
    brightMorning: 'ნათელი დილით',
    veryBrightAllDay: 'მზიანი მთელი დღე',
    brightAfternoon: 'ნათელი საღამოს',
    southEastLabel: 'სამხრეთ-აღმოსავლეთი',
    southWestLabel: 'სამხრეთ-დასავლეთი',
    timeLabel: 'დრო',
    heightLabel: 'სიმაღლე',
    directionLabel: 'მიმართულება',
    daylightLabel: 'დღის ხანგრძლივობა',
    sunriseLabel: 'ამოსვლა',
    solarNoonLabel: 'შუადღე',
    sunsetLabel: 'ჩასვლა',
    windowsHelpText: 'გამოიყენეთ Ctrl + სქროლი რუკის გასადიდებლად',
    macHelpText: 'გამოიყენეთ ⌘ + სქროლი რუკის გასადიდებლად',
    mobileHelpText: 'გამოიყენეთ ორი თითი რუკის გადასაადგილებლად',
    categories: {
      metro: 'მეტრო',
      school: 'სკოლები',
      kindergarten: 'საბავშვო ბაღები',
      pharmacy: 'აფთიაქები',
      park: 'პარკები',
      market: 'მარკეტები',
      restaurants: 'რესტორნები',
      clinic: 'კლინიკები',
      university: 'უნივერსიტეტები',
      bank: 'ბანკები',
      landmark: 'ღირსშესანიშნაობები',
      gym: 'ფიტნესი',
      bus: 'ავტობუსი',
    },
  },
}

function formatTravelEstimate(
  meters: number,
  iT: (typeof INSIGHTS_I18N)['ar']
): string {
  const { walkMin, transitMin, driveMin } = computeSivrceTravelTimes(meters)
  const parts = [`${iT.walkWord} ~${walkMin} ${iT.minWord}`]

  if (transitMin < walkMin) {
    parts.push(`${iT.transitWord} ~${transitMin} ${iT.minWord}`)
  }
  if (meters >= 1200 && driveMin < walkMin) {
    parts.push(`${iT.driveWord} ~${driveMin} ${iT.minWord}`)
  }

  return parts.join(' · ')
}

function getLocalizedPlaceName(
  place: RealNearbyPlaceItem,
  locale: LocaleCode
): string {
  const anyPlace = place as any
  if (anyPlace.names && typeof anyPlace.names === 'object') {
    const localized =
      anyPlace.names[locale] ||
      anyPlace.names.en ||
      anyPlace.names.ka ||
      anyPlace.names.ru ||
      anyPlace.names.ar
    if (localized && String(localized).trim()) {
      return String(localized).trim()
    }
  }
  return place.name
}

function calculateSivrceMobilityBreakdown(
  places: RealNearbyPlaceItem[],
  lat: number,
  lng: number,
  locale: LocaleCode = 'en'
) {
  const walkCategories: NearbyPlaceCategory[] = [
    'market',
    'pharmacy',
    'school',
    'kindergarten',
    'restaurants',
    'park',
    'bank',
    'clinic',
  ]
  const walkEssentials = places.filter((p) =>
    walkCategories.includes(p.category)
  )
  const within500m = walkEssentials.filter(
    (p) => p.distanceMeters <= 500
  ).length
  const within1000m = walkEssentials.filter(
    (p) => p.distanceMeters <= 1000
  ).length

  const nearestMarket =
    places.find((p) => p.category === 'market')?.distanceMeters ?? 400
  const nearestPharmacy =
    places.find((p) => p.category === 'pharmacy')?.distanceMeters ?? 400
  const nearestSchool =
    places.find(
      (p) => p.category === 'school' || p.category === 'kindergarten'
    )?.distanceMeters ?? 500

  let computedWalk =
    54 +
    Math.min(24, within500m * 2.2) +
    Math.min(12, within1000m * 0.5) +
    (nearestMarket <= 250 ? 6 : nearestMarket <= 500 ? 4 : 0) +
    (nearestPharmacy <= 300 ? 4 : nearestPharmacy <= 600 ? 2 : 0) +
    (nearestSchool <= 500 ? 4 : nearestSchool <= 900 ? 2 : 0)

  computedWalk = Math.round(Math.max(72, Math.min(98, computedWalk)))

  const nearestMetroObj = places.find((p) => p.category === 'metro')
  const metroDist = nearestMetroObj?.distanceMeters ?? 1800
  const metroName = nearestMetroObj
    ? getLocalizedPlaceName(nearestMetroObj, locale).replace(/ Metro$/i, '')
    : 'Technical University'

  let metroPoints = 0
  if (metroDist <= 500) {
    metroPoints = 30
  } else if (metroDist < 1500) {
    metroPoints = Math.round(30 * (1 - (metroDist - 500) / 1000))
  }
  const metroTimes = computeSivrceTravelTimes(metroDist)

  const busStops = places.filter((p) => p.category === 'bus')
  const busWithin500 = busStops.filter((b) => b.distanceMeters <= 550)
  const nearestBusDist = busStops[0]?.distanceMeters ?? 120
  const busLinesCount = Math.min(10, Math.max(4, busWithin500.length))
  const busPoints = Math.min(40, busLinesCount * 4)
  const busTimes = computeSivrceTravelTimes(nearestBusDist)

  const railsSorted = GEORGIA_RAIL_STATIONS.map((r) => ({
    ...r,
    dist: haversineMetersClient(lat, lng, r.lat, r.lng),
  })).sort((a, b) => a.dist - b.dist)
  const nearestRail = railsSorted[0]

  let railPoints = 0
  if (nearestRail.dist <= 1500) {
    railPoints = 15
  } else if (nearestRail.dist < 8000) {
    railPoints = Math.round(15 * (1 - (nearestRail.dist - 1500) / 6500))
  }
  const railTimes = computeSivrceTravelTimes(nearestRail.dist)

  const airportsSorted = GEORGIA_AIRPORTS.map((a) => ({
    ...a,
    dist: haversineMetersClient(lat, lng, a.lat, a.lng),
  })).sort((a, b) => a.dist - b.dist)
  const nearestAirport = airportsSorted[0]

  let airportPoints = 0
  if (nearestAirport.dist <= 15000) {
    airportPoints = 15
  } else if (nearestAirport.dist < 60000) {
    airportPoints = Math.round(
      15 * (1 - (nearestAirport.dist - 15000) / 45000)
    )
  }
  const airportTimes = computeSivrceTravelTimes(nearestAirport.dist)

  const totalMobility = Math.min(
    100,
    metroPoints + busPoints + railPoints + airportPoints
  )

  return {
    walkScore: computedWalk,
    mobilityScore: totalMobility,
    metro: {
      name: metroName,
      distStr:
        metroDist < 1000
          ? `${metroDist} m`
          : `${(metroDist / 1000).toFixed(1)} km`,
      points: metroPoints,
      driveMin: metroTimes.driveMin,
      transitMin: metroTimes.transitMin,
      walkMin: metroTimes.walkMin,
    },
    bus: {
      linesCount: busLinesCount,
      distStr: `${nearestBusDist} m`,
      points: busPoints,
      walkMin: busTimes.walkMin,
    },
    rail: {
      name: nearestRail.name,
      distStr: `${(nearestRail.dist / 1000).toFixed(1)} km`,
      points: railPoints,
      driveMin: railTimes.driveMin,
      transitMin: railTimes.transitMin,
      walkMin: railTimes.walkMin,
    },
    airport: {
      code: nearestAirport.code,
      distStr: `${(nearestAirport.dist / 1000).toFixed(1)} km`,
      points: airportPoints,
      driveMin: airportTimes.driveMin,
      transitMin: airportTimes.transitMin,
    },
  }
}

function normalizeAltitudeDegrees(rawAlt: number): number {
  if (!Number.isFinite(rawAlt)) return 0
  const deg =
    Math.abs(rawAlt) <= Math.PI / 2 + 0.05
      ? (rawAlt * 180) / Math.PI
      : rawAlt
  return Math.max(0, Math.min(90, Math.round(deg)))
}

function SunAndDaylightInteractiveCard({
  lat,
  lng,
  iT,
}: {
  lat: number
  lng: number
  iT: (typeof INSIGHTS_I18N)['ar']
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [season, setSeason] = useState<'winter' | 'today' | 'summer'>('today')
  const [sliderRatio, setSliderRatio] = useState(0.5)

  const targetDate = useMemo(() => {
    const now = new Date()
    if (season === 'winter')
      return new Date(Date.UTC(now.getFullYear(), 11, 21, 8, 0))
    if (season === 'summer')
      return new Date(Date.UTC(now.getFullYear(), 5, 21, 8, 0))
    return now
  }, [season])

  const sunMetrics = useMemo(() => {
    const times = SunCalc.getTimes(targetDate, lat, lng)
    const base = new Date(targetDate)
    const safeSunrise =
      times.sunrise && !isNaN(times.sunrise.getTime())
        ? times.sunrise
        : new Date(new Date(base).setUTCHours(3, 50, 0, 0))
    const safeSunset =
      times.sunset && !isNaN(times.sunset.getTime())
        ? times.sunset
        : new Date(new Date(base).setUTCHours(13, 42, 0, 0))
    const safeNoon =
      times.solarNoon && !isNaN(times.solarNoon.getTime())
        ? times.solarNoon
        : new Date((safeSunrise.getTime() + safeSunset.getTime()) / 2)

    const noonPos = SunCalc.getPosition(safeNoon, lat, lng)
    const maxDeg = Math.max(25, normalizeAltitudeDegrees(noonPos.altitude))

    const daylightMs = Math.max(0, safeSunset.getTime() - safeSunrise.getTime())
    const totalHours = Math.floor(daylightMs / 3600000)
    const totalMins = Math.floor((daylightMs % 3600000) / 60000)

    const clampedRatio = Math.max(0, Math.min(1, sliderRatio))
    const selectedTimeMs = safeSunrise.getTime() + daylightMs * clampedRatio
    const selectedDate = new Date(selectedTimeMs)
    const selectedPos = SunCalc.getPosition(selectedDate, lat, lng)

    const rawSelectedDeg = normalizeAltitudeDegrees(selectedPos.altitude)
    const smoothParabolicDeg = Math.round(
      maxDeg * 4 * clampedRatio * (1 - clampedRatio)
    )
    const selectedHeightDeg =
      rawSelectedDeg > 0 && rawSelectedDeg <= maxDeg
        ? rawSelectedDeg
        : smoothParabolicDeg

    let dirLabel = iT.southLabel
    if (clampedRatio < 0.25) dirLabel = iT.eastLabel
    else if (clampedRatio < 0.42) dirLabel = iT.southEastLabel
    else if (clampedRatio <= 0.58) dirLabel = iT.southLabel
    else if (clampedRatio < 0.78) dirLabel = iT.southWestLabel
    else dirLabel = iT.westLabel

    const fmt = (d: Date) => {
      try {
        return d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tbilisi',
        })
      } catch {
        return d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    }

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
  }, [targetDate, lat, lng, sliderRatio, iT])

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Sun className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
              {iT.sunTitle}
            </h3>
            <p className="text-[11px] text-gray-400">{iT.sunSub}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3.5">
          {isOpen && (
            <div className="hidden rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-extrabold sm:inline-flex">
              {(
                [
                  { id: 'winter', label: iT.winterTab },
                  { id: 'today', label: iT.todayTab },
                  { id: 'summer', label: iT.summerTab },
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
          )}

          <div className="hidden h-5 w-[1px] bg-gray-200 sm:block" />

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? iT.collapseTooltip : iT.expandTooltip}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-gray-50/90 text-[#0a1122] shadow-2xs transition hover:border-[#2563eb] hover:bg-blue-50/50 hover:text-[#2563eb]"
          >
            {isOpen ? (
              <ChevronUp className="size-4 stroke-[2.4]" />
            ) : (
              <ChevronDown className="size-4 stroke-[2.4]" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="mt-3 flex justify-end sm:hidden">
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-extrabold">
              {(
                [
                  { id: 'winter', label: iT.winterTab },
                  { id: 'today', label: iT.todayTab },
                  { id: 'summer', label: iT.summerTab },
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
              {iT.windowDirectionTitle}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
                  <span>{iT.northLabel}</span>
                  <span className="text-gray-400">—</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200" />
                <p className="mt-2 text-[11px] text-gray-400">
                  {iT.noDirectSun}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
                  <span>{iT.eastLabel}</span>
                  <span dir="ltr">{sunMetrics.eastHoursStr}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full w-1/2 rounded-full bg-orange-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <span>{iT.brightMorning}</span>
                  <span dir="ltr" className="font-mono">
                    {sunMetrics.eastWindowRange}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-3.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
                  <span>{iT.southLabel}</span>
                  <span dir="ltr">{sunMetrics.daylightStr}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full w-[92%] rounded-full bg-orange-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                  <span className="font-bold text-orange-700">
                    {iT.veryBrightAllDay}
                  </span>
                  <span dir="ltr" className="font-mono">
                    {sunMetrics.southWindowRange}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
                  <span>{iT.westLabel}</span>
                  <span dir="ltr">{sunMetrics.westHoursStr}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="ms-auto h-full w-1/2 rounded-full bg-orange-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <span>{iT.brightAfternoon}</span>
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
                  {iT.timeLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block font-mono text-sm font-black text-[#0a1122]"
                >
                  {sunMetrics.selectedTimeStr}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.heightLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block font-mono text-sm font-black text-[#0a1122]"
                >
                  {sunMetrics.selectedHeightDeg}°
                </strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.directionLabel}
                </span>
                <strong className="mt-0.5 block text-sm font-black text-[#0a1122]">
                  {sunMetrics.dirLabel}
                </strong>
              </div>
              <div className="hidden sm:block">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.daylightLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block text-sm font-black text-[#007a5a]"
                >
                  {sunMetrics.daylightStr}
                </strong>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.sunriseLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700"
                >
                  {sunMetrics.sunriseStr}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.solarNoonLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700"
                >
                  {sunMetrics.noonStr} · {sunMetrics.maxDeg}°
                </strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.sunsetLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700"
                >
                  {sunMetrics.sunsetStr}
                </strong>
              </div>
              <div className="sm:hidden">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  {iT.daylightLabel}
                </span>
                <strong
                  dir="ltr"
                  className="mt-0.5 block text-xs font-extrabold text-[#007a5a]"
                >
                  {sunMetrics.daylightStr}
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function loadMapLibreFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('SSR')
    if ((window as any).maplibregl) {
      return resolve((window as any).maplibregl)
    }

    if (!document.getElementById('maplibre-gl-css')) {
      const link = document.createElement('link')
      link.id = 'maplibre-gl-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
      document.head.appendChild(link)
    }

    const existingScript = document.getElementById('maplibre-gl-js')
    if (existingScript) {
      if ((window as any).maplibregl) {
        return resolve((window as any).maplibregl)
      }
      existingScript.addEventListener('load', () =>
        resolve((window as any).maplibregl)
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'maplibre-gl-js'
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
    script.async = true
    script.onload = () => resolve((window as any).maplibregl)
    script.onerror = (err) => reject(err)
    document.head.appendChild(script)
  })
}

function createExactUnitPinElement(): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.alignItems = 'center'
  wrapper.innerHTML = `
    <div style="width: 40px; height: 40px; border-radius: 9999px; border: 3px solid #ffffff; background: #ea580c; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 22px rgba(0,0,0,0.3);">
      <div style="width: 12px; height: 12px; border-radius: 9999px; background: #ffffff;"></div>
    </div>
    <div style="margin-top: -3px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 9px solid #ea580c;"></div>
    <div style="margin-top: 2px; width: 12px; height: 5px; border-radius: 9999px; background: rgba(0,0,0,0.32); filter: blur(1px);"></div>
  `
  return wrapper
}

export function UnitLocationInsights({
  areaId,
  locationDisplay,
  exactStreet,
  houseNumber,
  savedLat,
  savedLng,
  cachedPlaces,
  locale = 'ar',
}: {
  unitId?: string
  areaId: string | null
  locationDisplay?: string
  exactStreet?: string
  houseNumber?: string
  savedLat?: number | null
  savedLng?: number | null
  cachedPlaces?: RealNearbyPlaceItem[] | null
  t?: any
  locale?: string
}) {
  const { t: dict } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const baseI18n = INSIGHTS_I18N[activeLocale] || INSIGHTS_I18N.ar
  const customInsights =
    (dict.unitDetailsPage as any)?.locationInsights || {}
  const iT = {
    ...baseI18n,
    ...customInsights,
    categories: {
      ...baseI18n.categories,
      ...(customInsights.categories || {}),
    },
  }

  const defaultCoords = getCoordinatesForArea(areaId)
  const hasSavedExactCoords = Boolean(
    savedLat &&
      savedLng &&
      Number.isFinite(Number(savedLat)) &&
      Number.isFinite(Number(savedLng)) &&
      Number(savedLat) >= 40.9 &&
      Number(savedLat) <= 43.7 &&
      Number(savedLng) >= 39.8 &&
      Number(savedLng) <= 46.9
  )

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: hasSavedExactCoords ? Number(savedLat) : defaultCoords.lat,
    lng: hasSavedExactCoords ? Number(savedLng) : defaultCoords.lng,
  }))

  const localizedArea =
    locationDisplay || getLocalizedGeorgiaAreaName(areaId, activeLocale)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const styleMenuRef = useRef<HTMLDivElement | null>(null)

  const [isLocationSectionOpen, setIsLocationSectionOpen] = useState(true)
  const [mapStyleMode, setMapStyleMode] =
    useState<GeorgiaMapThemeMode>('realistic')
  const [styleMenuOpen, setStyleMenuOpen] = useState(false)
  const [is3D, setIs3D] = useState(true)
  const is3DRef = useRef(true)
  is3DRef.current = is3D

  const [isFullscreenMap, setIsFullscreenMap] = useState(false)
  const [activeCategory, setActiveCategory] =
    useState<NearbyCategoryKey>('all')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  )

  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number
    aqi: number
  }>({ temp: 18, aqi: 22 })

  const isPureRasterMode =
    mapStyleMode === 'photoreal' || mapStyleMode === 'satellite'

  const places = useMemo(() => {
    if (Array.isArray(cachedPlaces) && cachedPlaces.length >= 25) {
      return cachedPlaces
    }
    return getInstantGeorgiaNearbyPlaces(coords.lat, coords.lng, activeLocale)
  }, [cachedPlaces, coords.lat, coords.lng, activeLocale])

  const mobilityBreakdown = useMemo(
    () =>
      calculateSivrceMobilityBreakdown(
        places,
        coords.lat,
        coords.lng,
        activeLocale
      ),
    [places, coords.lat, coords.lng, activeLocale]
  )

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        styleMenuRef.current &&
        !styleMenuRef.current.contains(e.target as Node)
      ) {
        setStyleMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (hasSavedExactCoords) {
      setCoords({ lat: Number(savedLat), lng: Number(savedLng) })
      return
    }

    const street = String(exactStreet || '').trim()
    const house = String(houseNumber || '').trim()
    if (street.length < 3) {
      setCoords({ lat: defaultCoords.lat, lng: defaultCoords.lng })
      return
    }

    const rawLoc = String(locationDisplay || areaId || 'Tbilisi').trim()
    const cityPart = rawLoc.includes(',')
      ? rawLoc.split(',').pop()!.trim()
      : rawLoc.split(/[-—]/)[0].trim()
    const distPart = rawLoc.includes(',') ? rawLoc.split(',')[0].trim() : ''

    let cancelled = false
    geocodeExactBuildingInGeorgia({
      street,
      houseNumber: house,
      district: distPart,
      city: cityPart || 'Tbilisi',
    })
      .then((res) => {
        if (
          !cancelled &&
          res &&
          Number.isFinite(res.lat) &&
          Number.isFinite(res.lng)
        ) {
          setCoords({ lat: res.lat, lng: res.lng })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [
    hasSavedExactCoords,
    savedLat,
    savedLng,
    exactStreet,
    houseNumber,
    areaId,
    locationDisplay,
    defaultCoords.lat,
    defaultCoords.lng,
  ])

  useEffect(() => {
    let cancelled = false
    const rLat = coords.lat.toFixed(3)
    const rLng = coords.lng.toFixed(3)

    Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${rLat}&longitude=${rLng}&current_weather=true`
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${rLat}&longitude=${rLng}&current=european_aqi`
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([wData, aData]) => {
      if (cancelled) return
      const temp =
        wData?.current_weather?.temperature !== undefined
          ? Math.round(Number(wData.current_weather.temperature))
          : 18
      const aqi =
        aData?.current?.european_aqi !== undefined
          ? Math.round(Number(aData.current.european_aqi))
          : 22
      setWeatherInfo({ temp, aqi })
    })

    return () => {
      cancelled = true
    }
  }, [coords.lat, coords.lng])

  useEffect(() => {
    if (!isLocationSectionOpen) return
    let isMounted = true
    let map: any = null
    let marker: any = null

    loadMapLibreFromCDN()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: getReliableGeorgiaMapStyle(mapStyleMode),
          center: [coords.lng, coords.lat],
          zoom: 17.3,
          pitch: is3DRef.current && !isPureRasterMode ? 54 : 0,
          bearing: is3DRef.current && !isPureRasterMode ? -14 : 0,
          attributionControl: false,
          cooperativeGestures: true,
          locale: {
            'ScrollZoomBlocker.CtrlMessage': iT.windowsHelpText,
            'ScrollZoomBlocker.CmdMessage': iT.macHelpText,
            'TouchPanBlocker.Message': iT.mobileHelpText,
          },
        })

        mapInstanceRef.current = map

        const pinEl = createExactUnitPinElement()
        marker = new maplibregl.Marker({
          element: pinEl,
          anchor: 'bottom',
        })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map)

        markerInstanceRef.current = marker

        map.on('load', () => {
          if (!isPureRasterMode) {
            apply3DBuildingsToMap(
              map,
              activeLocale,
              mapStyleMode,
              is3DRef.current
            )
            highlight3DBuildingAtCoordinates(map, coords.lng, coords.lat)
          } else {
            map.resize()
          }
          setTimeout(() => map?.resize(), 120)
        })

        map.on('idle', () => {
          if (!isPureRasterMode) {
            highlight3DBuildingAtCoordinates(map, coords.lng, coords.lat)
          }
        })
      })
      .catch(() => {})

    return () => {
      isMounted = false
      if (marker) {
        marker.remove()
        markerInstanceRef.current = null
      }
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [
    coords.lat,
    coords.lng,
    isLocationSectionOpen,
    mapStyleMode,
    isPureRasterMode,
    activeLocale,
    iT.windowsHelpText,
    iT.macHelpText,
    iT.mobileHelpText,
  ])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    setTimeout(() => {
      map.resize()
      if (!isPureRasterMode && map.isStyleLoaded?.()) {
        apply3DBuildingsToMap(map, activeLocale, mapStyleMode, is3D)
        highlight3DBuildingAtCoordinates(map, coords.lng, coords.lat)
      }
    }, 120)
  }, [
    is3D,
    isFullscreenMap,
    activeLocale,
    mapStyleMode,
    isPureRasterMode,
    coords.lng,
    coords.lat,
  ])

  const handleZoomAroundUnit = useCallback(
    (delta: number) => {
      const map = mapInstanceRef.current
      if (!map) return
      const nextZoom = Math.min(
        19.5,
        Math.max(9, (map.getZoom() || 17) + delta)
      )
      map.easeTo({
        center: [coords.lng, coords.lat],
        zoom: nextZoom,
        duration: 250,
      })
    },
    [coords.lat, coords.lng]
  )

  const toggle3DPitch = () => {
    if (isPureRasterMode) {
      setMapStyleMode('realistic')
      setIs3D(true)
      return
    }
    const next3D = !is3D
    setIs3D(next3D)
    mapInstanceRef.current?.easeTo({
      center: [coords.lng, coords.lat],
      pitch: next3D ? 54 : 0,
      bearing: next3D ? -14 : 0,
      duration: 420,
    })
  }

  const visibleCategories =
    activeCategory === 'all'
      ? CATEGORY_ICONS.filter((c) => places.some((p) => p.category === c.key))
      : CATEGORY_ICONS.filter((c) => c.key === activeCategory)

  const fullAddressLabel = exactStreet
    ? `${localizedArea} · ${exactStreet}${houseNumber ? ' ' + houseNumber : ''}`
    : localizedArea

  return (
    <>
      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
          {iT.neighborhoodTitle}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-gray-500">
          {iT.neighborhoodSubPrefix}
          {places.length} {iT.neighborhoodSubSuffix}
        </p>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <Footprints className="size-3.5 text-[#2563eb]" />
                <span>{iT.walkScoreLabel}</span>
              </span>
              <strong className="font-black text-[#0a1122]">
                {mobilityBreakdown.walkScore}
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
                style={{ width: `${mobilityBreakdown.walkScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <TrainFront className="size-3.5 text-[#2563eb]" />
                <span>{iT.mobilityScoreLabel}</span>
              </span>
              <strong className="font-black text-[#0a1122]">
                {mobilityBreakdown.mobilityScore}
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
                style={{ width: `${mobilityBreakdown.mobilityScore}%` }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-gray-100 pt-3.5 text-[11.5px]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.metroRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {mobilityBreakdown.metro.name} ·{' '}
                    <span dir="ltr">{mobilityBreakdown.metro.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.metro.points}/30
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563eb]">
                  🚗 ~{mobilityBreakdown.metro.driveMin} {iT.minWord} ·{' '}
                  {iT.bestBadge}
                </span>
                <span>
                  🚌 ~{mobilityBreakdown.metro.transitMin} {iT.minWord}
                </span>
                <span>
                  🚶 ~{mobilityBreakdown.metro.walkMin} {iT.minWord}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-50 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.busRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {iT.busLinesWithin500m}: {mobilityBreakdown.bus.linesCount}{' '}
                    · <span dir="ltr">{mobilityBreakdown.bus.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.bus.points}/40
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span>
                  🚶 ~{mobilityBreakdown.bus.walkMin} {iT.minWord}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-50 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.railRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {mobilityBreakdown.rail.name} ·{' '}
                    <span dir="ltr">{mobilityBreakdown.rail.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.rail.points}/15
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563eb]">
                  🚗 ~{mobilityBreakdown.rail.driveMin} {iT.minWord} ·{' '}
                  {iT.bestBadge}
                </span>
                <span>
                  🚌 ~{mobilityBreakdown.rail.transitMin} {iT.minWord}
                </span>
                <span>
                  🚶 ~{mobilityBreakdown.rail.walkMin} {iT.minWord}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-50 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.airportRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {mobilityBreakdown.airport.code} ·{' '}
                    <span dir="ltr">{mobilityBreakdown.airport.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.airport.points}/15
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563eb]">
                  <Plane className="size-3" /> ~
                  {mobilityBreakdown.airport.driveMin} {iT.minWord} ·{' '}
                  {iT.bestBadge}
                </span>
                <span>
                  🚌 ~{mobilityBreakdown.airport.transitMin} {iT.minWord}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[22px] border border-gray-200/85 bg-white p-4 shadow-2xs sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-[#0a1122] sm:text-lg">
              {iT.locationTitle}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-extrabold text-[#0a1122]">
                📍 {fullAddressLabel}
              </span>
              <span className="rounded-full border border-emerald-200 bg-[#eaf8f2] px-3 py-1 text-[11px] font-bold text-[#007a5a]">
                {hasSavedExactCoords || exactStreet
                  ? iT.exactBuildingBadge
                  : iT.approxCenterBadge}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-extrabold text-gray-700 shadow-2xs">
                <CloudSun className="size-3.5 text-sky-500" />
                <span dir="ltr">
                  {weatherInfo.temp}° {iT.cloudyWord}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-extrabold text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span dir="ltr">
                  AQI {weatherInfo.aqi} {iT.airQualityWord}
                </span>
              </span>
            </div>

            <div className="hidden h-5 w-[1px] bg-gray-200 sm:block" />

            <button
              type="button"
              onClick={() => setIsLocationSectionOpen((prev) => !prev)}
              title={
                isLocationSectionOpen
                  ? iT.collapseTooltip
                  : iT.expandTooltip
              }
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-gray-50/90 text-[#0a1122] shadow-2xs transition hover:border-[#2563eb] hover:bg-blue-50/50 hover:text-[#2563eb]"
            >
              {isLocationSectionOpen ? (
                <ChevronUp className="size-4 stroke-[2.4]" />
              ) : (
                <ChevronDown className="size-4 stroke-[2.4]" />
              )}
            </button>
          </div>
        </div>

        {isLocationSectionOpen && (
          <>
            <div
              dir="ltr"
              className={
                isFullscreenMap
                  ? 'fixed inset-0 z-[9999] h-[100dvh] w-screen bg-[#edeae4]'
                  : 'relative mt-4 h-[380px] w-full overflow-hidden rounded-[18px] border border-gray-200 bg-[#edeae4] sm:h-[460px]'
              }
            >
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '100%' }}
                className="absolute inset-0"
              />

              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
                <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => handleZoomAroundUnit(1)}
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100"
                    title="Zoom in"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomAroundUnit(-1)}
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100"
                    title="Zoom out"
                  >
                    <Minus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mapInstanceRef.current?.flyTo({
                        center: [coords.lng, coords.lat],
                        zoom: 17.4,
                        pitch: is3D && !isPureRasterMode ? 54 : 0,
                        bearing: is3D && !isPureRasterMode ? -14 : 0,
                        duration: 550,
                      })
                    }
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100"
                    title="Center on building"
                  >
                    <Compass className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenMap((p) => !p)}
                    className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-100"
                    title="Fullscreen"
                  >
                    {isFullscreenMap ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </button>
                </div>

                <div ref={styleMenuRef} className="relative flex items-center">
                  {styleMenuOpen && (
                    <div className="absolute top-0 right-24 z-30 grid w-[265px] grid-cols-2 gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-xl backdrop-blur-md">
                      {MAP_STYLE_OPTIONS.map((opt) => {
                        const active = mapStyleMode === opt.id
                        const IconComp = opt.icon
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setMapStyleMode(opt.id)
                              setStyleMenuOpen(false)
                            }}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-start text-xs font-extrabold transition ${
                              active
                                ? 'bg-[#2563eb] text-white shadow-2xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <IconComp
                              className={`size-3.5 shrink-0 ${
                                active ? 'text-white' : 'text-slate-500'
                              }`}
                            />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-md backdrop-blur-md">
                    <button
                      type="button"
                      onClick={toggle3DPitch}
                      className={`flex h-10 min-w-[44px] items-center justify-center px-3 text-xs font-black transition ${
                        is3D && !isPureRasterMode
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      3D
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyleMenuOpen((p) => !p)}
                      title="Map styles"
                      className={`flex size-10 items-center justify-center transition ${
                        styleMenuOpen
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="pointer-events-auto rounded-xl bg-black/70 px-3.5 py-2 text-white backdrop-blur-xs">
                  <p className="text-xs font-extrabold">{fullAddressLabel}</p>
                  <p dir="ltr" className="font-mono text-[10px] text-gray-300">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
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
                    <span>{iT.directionsBtn}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenMap((p) => !p)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ea580c] px-4 text-xs font-extrabold text-white shadow-md transition hover:bg-[#c2410c]"
                  >
                    {isFullscreenMap ? (
                      <>
                        <Minimize2 className="size-3.5" />
                        <span>{iT.closeFullscreenBtn}</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="size-3.5" />
                        <span>{iT.open3dMapBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-[#0a1122] sm:text-base">
                    {iT.whatsNearbyTitle}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {iT.whatsNearbySub}
                  </p>
                </div>
              </div>

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
                  <span>{iT.allCat}</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {places.length}
                  </span>
                </button>

                {CATEGORY_ICONS.map((cat) => {
                  const count = places.filter(
                    (p) => p.category === cat.key
                  ).length
                  if (count === 0) return null
                  const CatIcon = cat.icon
                  const active = activeCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                        active
                          ? 'border-[#0a1122] bg-[#0a1122] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CatIcon className="size-3.5 text-amber-600" />
                      <span>{iT.categories[cat.key]}</span>
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
                            <span>{iT.categories[cat.key]}</span>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-600">
                            {catPlaces.length}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3">
                          {shownPlaces.map((pl) => (
                            <div
                              key={pl.id}
                              onClick={() => {
                                mapInstanceRef.current?.flyTo({
                                  center: [pl.lng, pl.lat],
                                  zoom: 17.5,
                                  duration: 600,
                                })
                              }}
                              className="cursor-pointer rounded-lg p-1 text-xs transition hover:bg-slate-50"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <strong className="truncate font-extrabold text-[#0a1122]">
                                  {getLocalizedPlaceName(pl, activeLocale)}
                                </strong>
                                <span
                                  dir="ltr"
                                  className="shrink-0 font-mono text-[11px] font-bold text-[#007a5a]"
                                >
                                  {pl.distanceMeters < 1000
                                    ? `${pl.distanceMeters} m`
                                    : `${(pl.distanceMeters / 1000).toFixed(1)} km`}
                                </span>
                              </div>
                              <p className="mt-0.5 text-start text-[10.5px] font-semibold text-gray-400">
                                {formatTravelEstimate(pl.distanceMeters, iT)}
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
                          className="mt-3 flex min-h-8 w-full items-center justify-center gap-1 rounded-xl bg-gray-50 text-[11px] font-extrabold text-gray-600 transition hover:bg-gray-100 hover:text-[#0a1122]"
                        >
                          {isExpanded
                            ? iT.showLessBtn
                            : `+${extraCount} ${iT.showMoreSuffix}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </section>

      <SunAndDaylightInteractiveCard
        lat={coords.lat}
        lng={coords.lng}
        iT={iT}
      />
    </>
  )
}