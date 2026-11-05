'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as SunCalc from 'suncalc'
import {
  Baby,
  Building2,
  Bus,
  ChevronDown,
  ChevronUp,
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
import { useTranslation, type LocaleCode } from '@/lib/i18n'

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

const INSIGHTS_I18N: Record<
  LocaleCode,
  {
    neighborhoodTitle: string
    neighborhoodSubPrefix: string
    neighborhoodSubSuffix: string
    walkScoreLabel: string
    mobilityScoreLabel: string
    locationTitle: string
    approxCenterBadge: string
    cloudyWord: string
    airQualityWord: string
    collapseTooltip: string
    expandTooltip: string
    directionsBtn: string
    open3dMapBtn: string
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
    categories: Record<Exclude<NearbyCategoryKey, 'all'>, string>
  }
> = {
  ar: {
    neighborhoodTitle: 'تقييم الحي وسهولة التنقل',
    neighborhoodSubPrefix: 'منطقة مخدومة بالكامل وقابلة للمشي (',
    neighborhoodSubSuffix: 'مرفق وخدمة مسجلة حول الموقع)',
    walkScoreLabel:
      'مؤشر المشي والخدمات اليومية (قرب الأسواق والصيدليات والمدارس مشياً)',
    mobilityScoreLabel:
      'مؤشر المواصلات والربط المروري (قرب محطات الحافلات والمترو)',
    locationTitle: 'الموقع والخريطة ثلاثية الأبعاد',
    approxCenterBadge: 'موقع موثق في السجل الجغرافي',
    cloudyWord: 'معتدل',
    airQualityWord: 'جودة الهواء',
    collapseTooltip: 'طي القسم',
    expandTooltip: 'فتح القسم',
    directionsBtn: 'الاتجاهات',
    open3dMapBtn: 'عرض ثلاثي الأبعاد 3D',
    whatsNearbyTitle: 'الأماكن والخدمات القريبة',
    whatsNearbySub: 'الأقرب أولاً · زمن المشي التقريبي · بيانات خرائط جورجيا',
    allCat: 'الكل',
    showLessBtn: 'عرض أقل ▲',
    showMoreSuffix: 'المزيد ⌄',
    walkWord: 'مشياً',
    transitWord: 'مواصلات',
    driveWord: 'سيارة',
    minWord: 'د',
    sunTitle: 'حركة الشمس والإضاءة الطبيعية',
    sunSub: 'مسار الشمس الفلكي المحسوب من إحداثيات المنطقة',
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
    categories: {
      school: 'مدارس',
      kindergarten: 'حضانات ورياض أطفال',
      pharmacy: 'صيدليات',
      market: 'سوبرماركت وأسواق',
      restaurants: 'مطاعم وكافيهات',
      clinic: 'عيادات ومراكز طبية',
      university: 'جامعات وكليات',
      gym: 'صالات رياضية',
      bus: 'محطات حافلات ومواصلات',
    },
  },
  en: {
    neighborhoodTitle: 'Neighborhood & Mobility',
    neighborhoodSubPrefix: 'Very walkable & well connected (',
    neighborhoodSubSuffix: 'nearby amenities)',
    walkScoreLabel: 'Walk Score (Daily errands on foot)',
    mobilityScoreLabel: 'Mobility Score (Public transit access)',
    locationTitle: 'Location & 3D Map',
    approxCenterBadge: 'Verified area coordinates',
    cloudyWord: 'Partly Cloudy',
    airQualityWord: 'Air quality',
    collapseTooltip: 'Collapse',
    expandTooltip: 'Expand',
    directionsBtn: 'Directions',
    open3dMapBtn: 'Open 3D map',
    whatsNearbyTitle: "What's nearby",
    whatsNearbySub: 'Nearest first · walking time · OpenStreetMap data',
    allCat: 'All',
    showLessBtn: 'Show less ▲',
    showMoreSuffix: 'More ⌄',
    walkWord: 'walk',
    transitWord: 'transit',
    driveWord: 'drive',
    minWord: 'min',
    sunTitle: 'Sun & Daylight',
    sunSub: 'Sun path calculated from property coordinates',
    winterTab: 'Winter',
    todayTab: 'Today',
    summerTab: 'Summer',
    windowDirectionTitle: 'Direct sun by window direction',
    northLabel: 'North',
    eastLabel: 'East',
    southLabel: 'South',
    westLabel: 'West',
    noDirectSun: 'Soft light without direct sun',
    brightMorning: 'Bright in the morning',
    veryBrightAllDay: 'Very bright all day',
    brightAfternoon: 'Bright in the afternoon',
    southEastLabel: 'South-East',
    southWestLabel: 'South-West',
    timeLabel: 'TIME',
    heightLabel: 'HEIGHT',
    directionLabel: 'DIRECTION',
    daylightLabel: 'DAYLIGHT',
    sunriseLabel: 'SUNRISE',
    solarNoonLabel: 'SOLAR NOON',
    sunsetLabel: 'SUNSET',
    categories: {
      school: 'Schools',
      kindergarten: 'Kindergartens',
      pharmacy: 'Pharmacies',
      market: 'Supermarkets',
      restaurants: 'Restaurants & Cafes',
      clinic: 'Clinics & Hospitals',
      university: 'Universities',
      gym: 'Fitness & Gym',
      bus: 'Bus & Transit Stops',
    },
  },
  ru: {
    neighborhoodTitle: 'Район и транспортная доступность',
    neighborhoodSubPrefix: 'Развитая инфраструктура в пешей доступности (',
    neighborhoodSubSuffix: 'объектов рядом)',
    walkScoreLabel: 'Пешая доступность (Магазины, аптеки и школы пешком)',
    mobilityScoreLabel: 'Транспортная доступность (Автобусы и метро)',
    locationTitle: 'Локация и 3D-карта',
    approxCenterBadge: 'Координаты района подтверждены',
    cloudyWord: 'Переменная облачность',
    airQualityWord: 'Качество воздуха',
    collapseTooltip: 'Свернуть',
    expandTooltip: 'Развернуть',
    directionsBtn: 'Маршрут',
    open3dMapBtn: '3D-карта',
    whatsNearbyTitle: 'Что находится рядом',
    whatsNearbySub: 'Сначала ближайшие · время пешком · данные OpenStreetMap',
    allCat: 'Все',
    showLessBtn: 'Свернуть ▲',
    showMoreSuffix: 'Еще ⌄',
    walkWord: 'пешком',
    transitWord: 'транспорт',
    driveWord: 'авто',
    minWord: 'мин',
    sunTitle: 'Солнце и естественное освещение',
    sunSub: 'Траектория солнца по координатам объекта',
    winterTab: 'Зима',
    todayTab: 'Сегодня',
    summerTab: 'Лето',
    windowDirectionTitle: 'Солнечный свет по направлению окон',
    northLabel: 'Север',
    eastLabel: 'Восток',
    southLabel: 'Юг',
    westLabel: 'Запад',
    noDirectSun: 'Мягкий свет без прямого солнца',
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
    categories: {
      school: 'Школы',
      kindergarten: 'Детские сады',
      pharmacy: 'Аптеки',
      market: 'Супермаркеты',
      restaurants: 'Рестораны и кафе',
      clinic: 'Клиники',
      university: 'Университеты',
      gym: 'Фитнес-клубы',
      bus: 'Остановки транспорта',
    },
  },
  ka: {
    neighborhoodTitle: 'უბანი და ტრანსპორტი',
    neighborhoodSubPrefix: 'კეთილმოწყობილი და ფეხით სავალი ზონა (',
    neighborhoodSubSuffix: 'ობიექტი ახლოს)',
    walkScoreLabel: 'ფეხით ხელმისაწვდომობა (მარკეტები, აფთიაქები, სკოლები)',
    mobilityScoreLabel: 'ტრანსპორტის ხელმისაწვდომობა (ავტობუსი და მეტრო)',
    locationTitle: 'მდებარეობა და 3D რუკა',
    approxCenterBadge: 'დადასტურებული მდებარეობა',
    cloudyWord: 'ზომიერი',
    airQualityWord: 'ჰაერის ხარისხი',
    collapseTooltip: 'ჩაკეცვა',
    expandTooltip: 'გაშლა',
    directionsBtn: 'მარშრუტი',
    open3dMapBtn: '3D რუკა',
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
    sunSub: 'მზის ტრაექტორია კოორდინატების მიხედვით',
    winterTab: 'ზამთარი',
    todayTab: 'დღეს',
    summerTab: 'ზაფხული',
    windowDirectionTitle: 'მზის სხივები ფანჯრების მიმართულებით',
    northLabel: 'ჩრდილოეთი',
    eastLabel: 'აღმოსავლეთი',
    southLabel: 'სამხრეთი',
    westLabel: 'დასავლეთი',
    noDirectSun: 'რბილი განათება პირდაპირი მზის გარეშე',
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
    categories: {
      school: 'სკოლები',
      kindergarten: 'საბავშვო ბაღები',
      pharmacy: 'აფთიაქები',
      market: 'სუპერმარკეტები',
      restaurants: 'რესტორნები და კაფეები',
      clinic: 'კლინიკები',
      university: 'უნივერსიტეტები',
      gym: 'ფიტნეს დარბაზები',
      bus: 'გაჩერებები',
    },
  },
}

const CATEGORY_ICONS: Array<{
  key: Exclude<NearbyCategoryKey, 'all'>
  icon: any
}> = [
  { key: 'school', icon: GraduationCap },
  { key: 'kindergarten', icon: Baby },
  { key: 'pharmacy', icon: Pill },
  { key: 'market', icon: ShoppingCart },
  { key: 'restaurants', icon: Utensils },
  { key: 'clinic', icon: HeartPulse },
  { key: 'university', icon: Landmark },
  { key: 'gym', icon: Dumbbell },
  { key: 'bus', icon: Bus },
]

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

function formatTravelEstimate(
  meters: number,
  iT: (typeof INSIGHTS_I18N)['ar']
) {
  const walkMin = Math.max(1, Math.round((meters * 1.22) / 80))
  const transitMin = Math.max(2, Math.round(meters / 150))
  const driveMin = Math.max(1, Math.round(meters / 260))

  if (meters < 800) {
    return `${iT.walkWord} ~${walkMin} ${iT.minWord}`
  }
  if (meters < 1350) {
    return `${iT.walkWord} ~${walkMin} ${iT.minWord} · ${iT.transitWord} ~${transitMin} ${iT.minWord}`
  }
  return `${iT.walkWord} ~${walkMin} ${iT.minWord} · ${iT.transitWord} ~${transitMin} ${iT.minWord} · ${iT.driveWord} ~${driveMin} ${iT.minWord}`
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

    let dirLabel = iT.southLabel
    if (sliderRatio < 0.25) dirLabel = iT.eastLabel
    else if (sliderRatio < 0.42) dirLabel = iT.southEastLabel
    else if (sliderRatio <= 0.58) dirLabel = iT.southLabel
    else if (sliderRatio < 0.78) dirLabel = iT.southWestLabel
    else dirLabel = iT.westLabel

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

export function UnitLocationInsights({
  areaId,
  exactStreet,
  houseNumber,
  locale = 'ar',
}: {
  areaId: string | null
  exactStreet?: string
  houseNumber?: string
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
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultCoords.lat,
    lng: defaultCoords.lng,
  })

  const localizedArea = getLocalizedGeorgiaAreaName(areaId, activeLocale)
  const isBatumi = String(areaId || '')
    .toLowerCase()
    .includes('batumi')

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLocationSectionOpen, setIsLocationSectionOpen] = useState(true)
  const [is3D, setIs3D] = useState(true)
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

  useEffect(() => {
    setCoords({ lat: defaultCoords.lat, lng: defaultCoords.lng })
  }, [defaultCoords.lat, defaultCoords.lng])

  // تحديد الإحداثيات الدقيقة للشارع ورقم المبنى إذا كانا متوفرين
  useEffect(() => {
    const street = String(exactStreet || '').trim()
    const house = String(houseNumber || '').trim()
    if (street.length < 3) return

    const cityPart = String(areaId || 'Tbilisi')
      .split('-')[0]
      .trim()
    const q = `${house ? house + ' ' : ''}${street}, ${cityPart}, Georgia`

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&limit=1&q=${encodeURIComponent(q)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d[0]) {
          const lat = Number(d[0].lat)
          const lng = Number(d[0].lon)
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setCoords({ lat, lng })
          }
        }
      })
      .catch(() => {})
  }, [exactStreet, houseNumber, areaId])

  const { walkScore, mobilityScore } = useMemo(() => {
    const walkEssentials = places.filter((p) =>
      ['market', 'pharmacy', 'school', 'kindergarten', 'restaurants'].includes(
        p.category
      )
    )
    const within600m = walkEssentials.filter(
      (p) => p.distanceMeters <= 600
    ).length
    const nearestMarket =
      places.find((p) => p.category === 'market')?.distanceMeters || 500
    const nearestPharmacy =
      places.find((p) => p.category === 'pharmacy')?.distanceMeters || 500

    let computedWalk =
      68 +
      Math.min(20, within600m * 3) +
      (nearestMarket <= 350 ? 5 : 0) +
      (nearestPharmacy <= 400 ? 4 : 0)
    computedWalk = Math.max(62, Math.min(96, computedWalk))

    const busStops = places.filter((p) => p.category === 'bus')
    const nearestBus = busStops[0]?.distanceMeters || 250
    let computedMobility =
      65 +
      Math.min(18, busStops.length * 5) +
      (nearestBus <= 150 ? 9 : nearestBus <= 350 ? 5 : 0)
    computedMobility = Math.max(60, Math.min(95, computedMobility))

    return {
      walkScore: computedWalk,
      mobilityScore: computedMobility,
    }
  }, [places])

  useEffect(() => {
    if (!isLocationSectionOpen) return
    let isMounted = true
    let map: any = null

    loadMapLibreFromCDN()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [coords.lng, coords.lat],
          zoom: 16.4,
          pitch: 60,
          bearing: -22,
          attributionControl: false,
        })

        mapInstanceRef.current = map

        const enhance3DBuildings = () => {
          try {
            map.resize()
            const style = map.getStyle()
            if (!style || !style.layers) return

            for (const layer of style.layers) {
              if (layer.type === 'fill-extrusion') {
                map.setPaintProperty(layer.id, 'fill-extrusion-color', '#d6c3b1')
                map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.94)
              }
            }
          } catch {}
        }

        map.on('load', enhance3DBuildings)
      })
      .catch(() => {})

    return () => {
      isMounted = false
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [coords.lat, coords.lng, isLocationSectionOpen])

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
    mapInstanceRef.current?.easeTo({
      pitch: next3D ? 60 : 0,
      bearing: next3D ? -22 : 0,
      duration: 700,
    })
  }

  const visibleCategories =
    activeCategory === 'all'
      ? CATEGORY_ICONS
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

        <div className="mt-4 space-y-3.5 text-xs">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <Footprints className="size-3.5 text-[#2563eb]" />
                <span>{iT.walkScoreLabel}</span>
              </span>
              <strong className="font-black text-[#0a1122]">
                {walkScore}/100
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${walkScore}%` }}
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
                {mobilityScore}/100
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${mobilityScore}%` }}
              />
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
                {iT.approxCenterBadge}
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
                isLocationSectionOpen ? iT.collapseTooltip : iT.expandTooltip
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
              className="relative mt-4 h-[360px] w-full overflow-hidden rounded-[18px] border border-gray-200 bg-[#edeae4] sm:h-[430px]"
            >
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '100%' }}
                className="absolute inset-0"
              />

              <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
                <div className="flex flex-col items-center">
                  <div className="flex size-11 items-center justify-center rounded-2xl border-2 border-white bg-[#ea580c] text-white shadow-xl">
                    <Building2 className="size-5" />
                  </div>
                  <div className="-mt-1 h-3 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-[#ea580c]" />
                </div>
              </div>

              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-white"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-white"
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
                >
                  3D
                </button>
                <button
                  type="button"
                  onClick={() =>
                    mapInstanceRef.current?.flyTo({
                      center: [coords.lng, coords.lat],
                      zoom: 16.4,
                      pitch: 60,
                      bearing: -22,
                      duration: 600,
                    })
                  }
                  className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-md hover:bg-white"
                >
                  <Compass className="size-4" />
                </button>
              </div>

              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="pointer-events-auto rounded-xl bg-black/65 px-3 py-1.5 text-white backdrop-blur-xs">
                  <p className="text-xs font-extrabold">{fullAddressLabel}</p>
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
                    <span>{iT.directionsBtn}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIs3D(true)
                      mapInstanceRef.current?.easeTo({
                        center: [coords.lng, coords.lat],
                        zoom: 17,
                        pitch: 64,
                        bearing: -28,
                        duration: 800,
                      })
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ea580c] px-4 text-xs font-extrabold text-white shadow-md transition hover:bg-[#c2410c]"
                  >
                    <Maximize2 className="size-3.5" />
                    <span>{iT.open3dMapBtn}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-black text-[#0a1122] sm:text-base">
                {iT.whatsNearbyTitle}
              </h4>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {iT.whatsNearbySub}
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
                  <span>{iT.allCat}</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {places.length}
                  </span>
                </button>

                {CATEGORY_ICONS.map((cat) => {
                  const count = places.filter(
                    (p) => p.category === cat.key
                  ).length
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
                              <p className="mt-0.5 text-start text-[10.5px] text-gray-400">
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
                          className="mt-3 border-t border-gray-100 pt-2 text-center text-[11px] font-extrabold text-gray-500 hover:text-[#0a1122]"
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