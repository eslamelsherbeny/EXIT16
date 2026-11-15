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
  Loader2,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Minus,
  Mountain,
  Navigation,
  Pill,
  Plus,
  ShoppingCart,
  Sparkles,
  Sun,
  TrainFront,
  Utensils,
} from 'lucide-react'
import {
  fetchRealNearbyPlacesAndWeatherAction,
  type RealNearbyPlaceItem,
} from '@/actions/georgia-geocode-action'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  apply3DBuildingsToMap,
  geocodeExactBuildingInGeorgia,
  getReliableGeorgiaMapStyle,
  highlight3DBuildingAtCoordinates,
  type GeorgiaMapThemeMode,
} from '@/lib/georgia-uber-search'
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

const INSIGHTS_I18N: Record<
  LocaleCode,
  {
    neighborhoodTitle: string
    neighborhoodSubPrefix: string
    neighborhoodSubSuffix: string
    walkScoreLabel: string
    mobilityScoreLabel: string
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
    loadingNearbyText: string
    noPlacesInCategory: string
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
    categories: Record<Exclude<NearbyCategoryKey, 'all'>, string>
  }
> = {
  ar: {
    neighborhoodTitle: 'تقييم الحي وسهولة التنقل',
    neighborhoodSubPrefix: 'منطقة مخدومة بالكامل وقابلة للمشي (',
    neighborhoodSubSuffix: 'مرفق وخدمة حقيقية مسجلة حول المبنى)',
    walkScoreLabel:
      'مؤشر المشي والخدمات اليومية (قرب الأسواق والصيدليات والمدارس مشياً)',
    mobilityScoreLabel:
      'مؤشر المواصلات والربط المروري (قرب محطات الحافلات والمترو)',
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
      'الأقرب أولاً · المسافة الحقيقية وزمن المشي من موقع المبنى · بيانات OpenStreetMap',
    loadingNearbyText: 'جاري تحميل الأماكن والخدمات المحيطة بالمبنى...',
    noPlacesInCategory: 'لا توجد مرافق مسجلة ضمن 1.5 كم في هذا التصنيف',
    allCat: 'الكل',
    showLessBtn: 'عرض أقل ▲',
    showMoreSuffix: 'المزيد ⌄',
    walkWord: 'مشياً',
    transitWord: 'مواصلات',
    driveWord: 'سيارة',
    minWord: 'د',
    sunTitle: 'حركة الشمس والإضاءة الطبيعية للمبنى',
    sunSub: 'مسار الشمس الفلكي المحسوب بدقة من إحداثيات هذا المبنى',
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
      school: 'مدارس',
      kindergarten: 'حضانات ورياض أطفال',
      pharmacy: 'صيدليات',
      market: 'سوبرماركت وأسواق',
      restaurants: 'مطاعم وكافيهات',
      clinic: 'عيادات ومستشفيات',
      university: 'جامعات وكليات',
      gym: 'صالات رياضية',
      bus: 'محطات حافلات ومترو',
    },
  },
  en: {
    neighborhoodTitle: 'Neighborhood & Mobility',
    neighborhoodSubPrefix: 'Very walkable & well connected (',
    neighborhoodSubSuffix: 'real nearby amenities around this building)',
    walkScoreLabel: 'Walk Score (Daily errands on foot)',
    mobilityScoreLabel: 'Mobility Score (Public transit access)',
    locationTitle: 'Location & 3D Map',
    exactBuildingBadge: 'Exact building pin ✓',
    approxCenterBadge: 'Verified area coordinates',
    cloudyWord: 'Partly Cloudy',
    airQualityWord: 'Air quality',
    collapseTooltip: 'Collapse',
    expandTooltip: 'Expand',
    directionsBtn: 'Directions',
    open3dMapBtn: 'Fullscreen 3D Map',
    closeFullscreenBtn: 'Exit Fullscreen',
    whatsNearbyTitle: "What's nearby",
    whatsNearbySub:
      'Nearest first · exact walking time from building · OpenStreetMap data',
    loadingNearbyText: 'Loading real nearby places around this building...',
    noPlacesInCategory: 'No places listed within 1.5 km in this category',
    allCat: 'All',
    showLessBtn: 'Show less ▲',
    showMoreSuffix: 'More ⌄',
    walkWord: 'walk',
    transitWord: 'transit',
    driveWord: 'drive',
    minWord: 'min',
    sunTitle: 'Sun & Daylight',
    sunSub: 'Sun path calculated from exact building coordinates',
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
    windowsHelpText: 'Use Ctrl + scroll to zoom the map',
    macHelpText: 'Use ⌘ + scroll to zoom the map',
    mobileHelpText: 'Use two fingers to move the map',
    categories: {
      school: 'Schools',
      kindergarten: 'Kindergartens',
      pharmacy: 'Pharmacies',
      market: 'Supermarkets',
      restaurants: 'Restaurants & Cafes',
      clinic: 'Clinics & Hospitals',
      university: 'Universities',
      gym: 'Fitness & Gym',
      bus: 'Bus & Metro Stops',
    },
  },
  ru: {
    neighborhoodTitle: 'Район и транспортная доступность',
    neighborhoodSubPrefix: 'Развитая инфраструктура в пешей доступности (',
    neighborhoodSubSuffix: 'реальных объектов рядом со зданием)',
    walkScoreLabel: 'Пешая доступность (Магазины, аптеки и школы пешком)',
    mobilityScoreLabel: 'Транспортная доступность (Автобусы и метро)',
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
    whatsNearbySub:
      'Сначала ближайшие · точное время пешком от дома · данные OpenStreetMap',
    loadingNearbyText: 'Загрузка реальных объектов рядом со зданием...',
    noPlacesInCategory: 'В радиусе 1.5 км нет объектов этой категории',
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
    windowsHelpText: 'Используйте Ctrl + колесико для масштабирования',
    macHelpText: 'Используйте ⌘ + колесико для масштабирования',
    mobileHelpText: 'Используйте два пальца для перемещения карты',
    categories: {
      school: 'Школы',
      kindergarten: 'Детские сады',
      pharmacy: 'Аптеки',
      market: 'Супермаркеты',
      restaurants: 'Рестораны и кафе',
      clinic: 'Клиники',
      university: 'Университеты',
      gym: 'Фитнес-клубы',
      bus: 'Остановки и метро',
    },
  },
  ka: {
    neighborhoodTitle: 'უბანი და ტრანსპორტი',
    neighborhoodSubPrefix: 'კეთილმოწყობილი და ფეხით სავალი ზონა (',
    neighborhoodSubSuffix: 'რეალური ობიექტი შენობის გარშემო)',
    walkScoreLabel: 'ფეხით ხელმისაწვდომობა (მარკეტები, აფთიაქები, სკოლები)',
    mobilityScoreLabel: 'ტრანსპორტის ხელმისაწვდომობა (ავტობუსი და მეტრო)',
    locationTitle: 'მდებარეობა და 3D რუკა',
    exactBuildingBadge: 'ზუსტი შენობა ✓',
    approxCenterBadge: 'დადასტურებული მდებარეობა',
    cloudyWord: 'ზომიერი',
    airQualityWord: 'ჰაერის ხარისხი',
    collapseTooltip: 'ჩაკეცვა',
    expandTooltip: 'გაშლა',
    directionsBtn: 'მარშრუტი',
    open3dMapBtn: '3D რუკა სრულ ეკრანზე',
    closeFullscreenBtn: 'დახურვა',
    whatsNearbyTitle: 'რა არის ახლოს',
    whatsNearbySub:
      'უახლოესი ობიექტები · ფეხით სავალი დრო შენობიდან · OpenStreetMap',
    loadingNearbyText: 'იტვირთება ახლომდებარე ობიექტები...',
    noPlacesInCategory: '1.5 კმ რადიუსში ობიექტები არ მოიძებნა',
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
    windowsHelpText: 'გამოიყენეთ Ctrl + სქროლი რუკის გასადიდებლად',
    macHelpText: 'გამოიყენეთ ⌘ + სქროლი რუკის გასადიდებლად',
    mobileHelpText: 'გამოიყენეთ ორი თითი რუკის გადასაადგილებლად',
    categories: {
      school: 'სკოლები',
      kindergarten: 'საბავშვო ბაღები',
      pharmacy: 'აფთიაქები',
      market: 'სუპერმარკეტები',
      restaurants: 'რესტორნები და კაფეები',
      clinic: 'კლინიკები',
      university: 'უნივერსიტეტები',
      gym: 'ფიტნეს დარბაზები',
      bus: 'გაჩერებები და მეტრო',
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

function formatTravelEstimate(
  meters: number,
  iT: (typeof INSIGHTS_I18N)['ar']
) {
  const walkMin = Math.max(1, Math.round((meters * 1.25) / 80))
  const transitMin = Math.max(2, Math.round(meters / 160))
  const driveMin = Math.max(1, Math.round(meters / 280))

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
  locationDisplay,
  exactStreet,
  houseNumber,
  savedLat,
  savedLng,
  locale = 'ar',
}: {
  areaId: string | null
  locationDisplay?: string
  exactStreet?: string
  houseNumber?: string
  savedLat?: number | null
  savedLng?: number | null
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
      Number.isFinite(Number(savedLng))
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
  const [places, setPlaces] = useState<RealNearbyPlaceItem[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(true)
  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number
    aqi: number
  }>({ temp: 18, aqi: 28 })

  const isPureRasterMode =
    mapStyleMode === 'photoreal' || mapStyleMode === 'satellite'

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

  // إذا كان للبائع إحداثيات محفوظة نستخدمها فوراً، وإلا نحول الشارع ورقم المبنى لإحداثيات المبنى الدقيقة
  useEffect(() => {
    if (
      savedLat &&
      savedLng &&
      Number.isFinite(Number(savedLat)) &&
      Number.isFinite(Number(savedLng))
    ) {
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
        if (!cancelled && res && Number.isFinite(res.lat) && Number.isFinite(res.lng)) {
          setCoords({ lat: res.lat, lng: res.lng })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [savedLat, savedLng, exactStreet, houseNumber, areaId, locationDisplay, defaultCoords.lat, defaultCoords.lng])

  // جلب الأماكن والخدمات الحقيقية 100% من السيرفر حول نفس إحداثيات المبنى (coords.lat, coords.lng)
  useEffect(() => {
    let isCancelled = false
    setLoadingPlaces(true)

    fetchRealNearbyPlacesAndWeatherAction({
      lat: coords.lat,
      lng: coords.lng,
      locale: activeLocale,
    })
      .then((res) => {
        if (isCancelled) return
        setPlaces(res.places || [])
        setWeatherInfo({ temp: res.temp, aqi: res.aqi })
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setLoadingPlaces(false)
      })

    return () => {
      isCancelled = true
    }
  }, [coords.lat, coords.lng, activeLocale])

  // حساب مؤشر المشي ومؤشر المواصلات الحقيقيين بناءً على المسافات الفعلية للمرافق المحيطة بالمبنى
  const { walkScore, mobilityScore } = useMemo(() => {
    if (places.length === 0) {
      return { walkScore: 78, mobilityScore: 76 }
    }

    const walkEssentials = places.filter((p) =>
      ['market', 'pharmacy', 'school', 'kindergarten', 'restaurants'].includes(
        p.category
      )
    )
    const within500m = walkEssentials.filter(
      (p) => p.distanceMeters <= 500
    ).length
    const within1000m = walkEssentials.filter(
      (p) => p.distanceMeters <= 1000
    ).length

    const nearestMarket =
      places.find((p) => p.category === 'market')?.distanceMeters ?? 900
    const nearestPharmacy =
      places.find((p) => p.category === 'pharmacy')?.distanceMeters ?? 900
    const nearestSchool =
      places.find(
        (p) => p.category === 'school' || p.category === 'kindergarten'
      )?.distanceMeters ?? 1100

    let computedWalk =
      55 +
      Math.min(22, within500m * 3.5) +
      Math.min(10, within1000m * 1.2) +
      (nearestMarket <= 300 ? 6 : nearestMarket <= 600 ? 3 : 0) +
      (nearestPharmacy <= 350 ? 4 : 0) +
      (nearestSchool <= 600 ? 3 : 0)
    computedWalk = Math.round(Math.max(58, Math.min(98, computedWalk)))

    const busStops = places.filter((p) => p.category === 'bus')
    const nearestBus = busStops[0]?.distanceMeters ?? 800
    let computedMobility =
      56 +
      Math.min(24, busStops.length * 4) +
      (nearestBus <= 150 ? 12 : nearestBus <= 350 ? 8 : nearestBus <= 600 ? 4 : 0)
    computedMobility = Math.round(Math.max(58, Math.min(98, computedMobility)))

    return {
      walkScore: computedWalk,
      mobilityScore: computedMobility,
    }
  }, [places])

  // تشغيل الخريطة التفاعلية وتلوين المبنى المختار بالبرتقالي 3D
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
  }, [coords.lat, coords.lng, isLocationSectionOpen, mapStyleMode, isPureRasterMode, activeLocale, iT.windowsHelpText, iT.macHelpText, iT.mobileHelpText])

  // تحديث الـ 2D/3D واللغة وأبعاد الخريطة عند تكبير الشاشة
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
  }, [is3D, isFullscreenMap, activeLocale, mapStyleMode, isPureRasterMode, coords.lng, coords.lat])

  const handleZoomAroundUnit = useCallback(
    (delta: number) => {
      const map = mapInstanceRef.current
      if (!map) return
      const nextZoom = Math.min(19.5, Math.max(9, (map.getZoom() || 17) + delta))
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
                className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
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
                className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
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

              {/* أزرار التحكم الجانبية للخريطة + أنماط الخريطة الـ 7 مطابقة لـ sivrce.ge */}
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
                {loadingPlaces && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="hidden sm:inline">
                      {iT.loadingNearbyText}
                    </span>
                  </span>
                )}
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
                          <span className="text-[11px] font-bold text-gray-400">
                            {catPlaces.length}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3">
                          {shownPlaces.length > 0 ? (
                            shownPlaces.map((pl) => (
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
                                    {pl.name}
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
                                <p className="mt-0.5 text-start text-[10.5px] text-gray-400">
                                  {formatTravelEstimate(pl.distanceMeters, iT)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="py-3 text-center text-[11px] text-gray-400">
                              {loadingPlaces
                                ? iT.loadingNearbyText
                                : iT.noPlacesInCategory}
                            </p>
                          )}
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