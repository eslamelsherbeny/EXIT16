// import {
//   Baby,
//   Building2,
//   Bus,
//   Camera,
//   Circle,
//   Compass,
//   Contrast,
//   Dumbbell,
//   Globe,
//   GraduationCap,
//   HeartPulse,
//   Landmark,
//   Map as MapIcon,
//   Mountain,
//   Pill,
//   ShoppingCart,
//   Sparkles,
//   TrainFront,
//   Trees,
//   Utensils,
// } from 'lucide-react'
// import type {
//   NearbyPlaceCategory,
//   RealNearbyPlaceItem,
// } from '@/actions/georgia-geocode-action'
// import type { GeorgiaMapThemeMode } from '@/lib/georgia-uber-search'
// import type { LocaleCode } from '@/lib/i18n'

// export type NearbyCategoryKey = 'all' | NearbyPlaceCategory

// export const MAP_STYLE_OPTIONS: Array<{
//   id: GeorgiaMapThemeMode
//   label: string
//   icon: any
// }> = [
//   { id: 'streets', label: 'Streets', icon: MapIcon },
//   { id: 'sivrce', label: 'Sivrce', icon: Globe },
//   { id: 'realistic', label: 'Realistic', icon: Mountain },
//   { id: 'photoreal', label: 'Photoreal', icon: Camera },
//   { id: 'hybrid', label: 'Hybrid', icon: Sparkles },
//   { id: 'minimal', label: 'Minimal', icon: Circle },
//   { id: 'contrast', label: 'High contrast', icon: Contrast },
// ]

// export const GEORGIA_RAIL_STATIONS = [
//   { name: 'Tbilisi Central', lat: 41.7205, lng: 44.7992 },
//   { name: 'Navtlughi', lat: 41.6882, lng: 44.8418 },
//   { name: 'Didube', lat: 41.7501, lng: 44.7795 },
//   { name: 'Batumi Central', lat: 41.6588, lng: 41.6769 },
// ]

// export const GEORGIA_AIRPORTS = [
//   { code: 'TBS', name: 'TBS Airport', lat: 41.6692, lng: 44.9547 },
//   { code: 'BUS', name: 'BUS Airport', lat: 41.6103, lng: 41.5997 },
//   { code: 'KUT', name: 'KUT Airport', lat: 42.1767, lng: 42.4826 },
// ]

// export const CATEGORY_ICONS: Array<{
//   key: NearbyPlaceCategory
//   icon: any
// }> = [
//   { key: 'metro', icon: TrainFront },
//   { key: 'school', icon: GraduationCap },
//   { key: 'kindergarten', icon: Baby },
//   { key: 'pharmacy', icon: Pill },
//   { key: 'park', icon: Trees },
//   { key: 'market', icon: ShoppingCart },
//   { key: 'restaurants', icon: Utensils },
//   { key: 'clinic', icon: HeartPulse },
//   { key: 'university', icon: Landmark },
//   { key: 'bank', icon: Building2 },
//   { key: 'landmark', icon: Compass },
//   { key: 'gym', icon: Dumbbell },
//   { key: 'bus', icon: Bus },
// ]

// export function haversineMetersClient(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ): number {
//   const R = 6371000
//   const dLat = ((lat2 - lat1) * Math.PI) / 180
//   const dLon = ((lon2 - lon1) * Math.PI) / 180
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2
//   return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
// }

// /**
//  * Exact Sivrce.ge Travel Time Formula:
//  * - Walk: 80 m/min
//  * - Transit: ~18 km/h (300 m/min) + 5 min waiting (shown only when faster than walking)
//  * - Car: ~30 km/h (500 m/min) + 4 min to park (shown only when faster than walking & distance >= 1200m)
//  */
// export function computeSivrceTravelTimes(meters: number) {
//   const walkMin = Math.max(1, Math.round(meters / 80))
//   const transitMin = Math.round(meters / 300) + 5
//   const driveMin = Math.round(meters / 500) + 4
//   return { walkMin, transitMin, driveMin }
// }

// export function formatTravelEstimate(
//   meters: number,
//   iT: (typeof INSIGHTS_I18N)['ar']
// ): string {
//   const { walkMin, transitMin, driveMin } = computeSivrceTravelTimes(meters)
//   const parts = [`${iT.walkWord} ~${walkMin} ${iT.minWord}`]

//   if (transitMin < walkMin) {
//     parts.push(`${iT.transitWord} ~${transitMin} ${iT.minWord}`)
//   }
//   if (meters >= 1200 && driveMin < walkMin) {
//     parts.push(`${iT.driveWord} ~${driveMin} ${iT.minWord}`)
//   }

//   return parts.join(' · ')
// }

// export function getLocalizedPlaceName(
//   place: RealNearbyPlaceItem,
//   locale: LocaleCode
// ): string {
//   const anyPlace = place as any
//   if (anyPlace.names && typeof anyPlace.names === 'object') {
//     const localized =
//       anyPlace.names[locale] ||
//       anyPlace.names.en ||
//       anyPlace.names.ka ||
//       anyPlace.names.ru ||
//       anyPlace.names.ar
//     if (localized && String(localized).trim()) {
//       return String(localized).trim()
//     }
//   }
//   return place.name
// }

// /**
//  * Exact Sivrce.ge Mobility & Walk Score Calculation:
//  * - Metro (max 30): full points within 500 m, linear decay to 0 at 1500 m.
//  * - Bus (max 40): 4 points per stop/line within 500 m (up to 10 = 40 pts).
//  * - Rail (max 15): full points within 1500 m, linear decay to 0 at 8000 m.
//  * - Airport (max 15): full points within 15 km, linear decay to 0 at 60 km.
//  */
// export function calculateSivrceMobilityBreakdown(
//   places: RealNearbyPlaceItem[],
//   lat: number,
//   lng: number,
//   locale: LocaleCode = 'en'
// ) {
//   // 1. Walk Score (0 - 100)
//   const walkCategories: NearbyPlaceCategory[] = [
//     'market',
//     'pharmacy',
//     'school',
//     'kindergarten',
//     'restaurants',
//     'park',
//     'bank',
//     'clinic',
//   ]
//   const walkEssentials = places.filter((p) =>
//     walkCategories.includes(p.category)
//   )
//   const within500m = walkEssentials.filter(
//     (p) => p.distanceMeters <= 500
//   ).length
//   const within1000m = walkEssentials.filter(
//     (p) => p.distanceMeters <= 1000
//   ).length

//   const nearestMarket =
//     places.find((p) => p.category === 'market')?.distanceMeters ?? 1200
//   const nearestPharmacy =
//     places.find((p) => p.category === 'pharmacy')?.distanceMeters ?? 1200
//   const nearestSchool =
//     places.find(
//       (p) => p.category === 'school' || p.category === 'kindergarten'
//     )?.distanceMeters ?? 1200

//   let computedWalk =
//     50 +
//     Math.min(24, within500m * 2.2) +
//     Math.min(12, within1000m * 0.5) +
//     (nearestMarket <= 250 ? 6 : nearestMarket <= 500 ? 4 : 0) +
//     (nearestPharmacy <= 300 ? 4 : nearestPharmacy <= 600 ? 2 : 0) +
//     (nearestSchool <= 500 ? 4 : nearestSchool <= 900 ? 2 : 0)

//   computedWalk = Math.round(Math.max(55, Math.min(98, computedWalk)))

//   // 2. Metro (0 - 30 pts)
//   const nearestMetroObj = places.find((p) => p.category === 'metro')
//   const metroDist = nearestMetroObj?.distanceMeters ?? 2200
//   const metroName = nearestMetroObj
//     ? getLocalizedPlaceName(nearestMetroObj, locale).replace(/ Metro$/i, '')
//     : 'Varketili'

//   let metroPoints = 0
//   if (metroDist <= 500) {
//     metroPoints = 30
//   } else if (metroDist < 1500) {
//     metroPoints = Math.round(30 * (1 - (metroDist - 500) / 1000))
//   }
//   const metroTimes = computeSivrceTravelTimes(metroDist)

//   // 3. Bus (0 - 40 pts: 4 pts per stop/line within 500m)
//   const busStops = places.filter((p) => p.category === 'bus')
//   const busWithin500 = busStops.filter((b) => b.distanceMeters <= 550)
//   const nearestBusDist = busStops[0]?.distanceMeters ?? 160
//   const busLinesCount = Math.min(
//     10,
//     Math.max(busStops.length > 0 ? 2 : 0, busWithin500.length)
//   )
//   const busPoints = Math.min(40, busLinesCount * 4)
//   const busTimes = computeSivrceTravelTimes(nearestBusDist)

//   // 4. Rail (0 - 15 pts: full within 1500m, 0 past 8000m)
//   const railsSorted = GEORGIA_RAIL_STATIONS.map((r) => ({
//     ...r,
//     dist: haversineMetersClient(lat, lng, r.lat, r.lng),
//   })).sort((a, b) => a.dist - b.dist)
//   const nearestRail = railsSorted[0]

//   let railPoints = 0
//   if (nearestRail.dist <= 1500) {
//     railPoints = 15
//   } else if (nearestRail.dist < 8000) {
//     railPoints = Math.round(15 * (1 - (nearestRail.dist - 1500) / 6500))
//   }
//   const railTimes = computeSivrceTravelTimes(nearestRail.dist)

//   // 5. Airport (0 - 15 pts: full within 15km, 0 past 60km)
//   const airportsSorted = GEORGIA_AIRPORTS.map((a) => ({
//     ...a,
//     dist: haversineMetersClient(lat, lng, a.lat, a.lng),
//   })).sort((a, b) => a.dist - b.dist)
//   const nearestAirport = airportsSorted[0]

//   let airportPoints = 0
//   if (nearestAirport.dist <= 15000) {
//     airportPoints = 15
//   } else if (nearestAirport.dist < 60000) {
//     airportPoints = Math.round(
//       15 * (1 - (nearestAirport.dist - 15000) / 45000)
//     )
//   }
//   const airportTimes = computeSivrceTravelTimes(nearestAirport.dist)

//   const totalMobility = Math.min(
//     100,
//     metroPoints + busPoints + railPoints + airportPoints
//   )

//   return {
//     walkScore: computedWalk,
//     mobilityScore: totalMobility,
//     metro: {
//       name: metroName,
//       distStr:
//         metroDist < 1000
//           ? `${metroDist} m`
//           : `${(metroDist / 1000).toFixed(1)} km`,
//       points: metroPoints,
//       driveMin: metroTimes.driveMin,
//       transitMin: metroTimes.transitMin,
//       walkMin: metroTimes.walkMin,
//     },
//     bus: {
//       linesCount: busLinesCount,
//       distStr: `${nearestBusDist} m`,
//       points: busPoints,
//       walkMin: busTimes.walkMin,
//     },
//     rail: {
//       name: nearestRail.name,
//       distStr: `${(nearestRail.dist / 1000).toFixed(1)} km`,
//       points: railPoints,
//       driveMin: railTimes.driveMin,
//       transitMin: railTimes.transitMin,
//       walkMin: railTimes.walkMin,
//     },
//     airport: {
//       code: nearestAirport.code,
//       distStr: `${(nearestAirport.dist / 1000).toFixed(1)} km`,
//       points: airportPoints,
//       driveMin: airportTimes.driveMin,
//       transitMin: airportTimes.transitMin,
//     },
//   }
// }

// export const INSIGHTS_I18N: Record<
//   LocaleCode,
//   {
//     neighborhoodTitle: string
//     neighborhoodSubPrefix: string
//     neighborhoodSubSuffix: string
//     calculatingNeighborhoodText: string
//     walkScoreLabel: string
//     mobilityScoreLabel: string
//     metroRowLabel: string
//     busRowLabel: string
//     busLinesWithin500m: string
//     railRowLabel: string
//     airportRowLabel: string
//     bestBadge: string
//     locationTitle: string
//     exactBuildingBadge: string
//     approxCenterBadge: string
//     cloudyWord: string
//     airQualityWord: string
//     collapseTooltip: string
//     expandTooltip: string
//     directionsBtn: string
//     open3dMapBtn: string
//     closeFullscreenBtn: string
//     whatsNearbyTitle: string
//     whatsNearbySub: string
//     loadingNearbyText: string
//     noPlacesInCategory: string
//     allCat: string
//     showLessBtn: string
//     showMoreSuffix: string
//     walkWord: string
//     transitWord: string
//     driveWord: string
//     minWord: string
//     sunTitle: string
//     sunSub: string
//     winterTab: string
//     todayTab: string
//     summerTab: string
//     windowDirectionTitle: string
//     northLabel: string
//     eastLabel: string
//     southLabel: string
//     westLabel: string
//     noDirectSun: string
//     brightMorning: string
//     veryBrightAllDay: string
//     brightAfternoon: string
//     southEastLabel: string
//     southWestLabel: string
//     timeLabel: string
//     heightLabel: string
//     directionLabel: string
//     daylightLabel: string
//     sunriseLabel: string
//     solarNoonLabel: string
//     sunsetLabel: string
//     windowsHelpText: string
//     macHelpText: string
//     mobileHelpText: string
//     categories: Record<NearbyPlaceCategory, string>
//   }
// > = {
//   ar: {
//     neighborhoodTitle: 'تقييم الحي وسهولة التنقل (Neighborhood & Mobility)',
//     neighborhoodSubPrefix: 'منطقة مخدومة بالكامل وقابلة للمشي (',
//     neighborhoodSubSuffix: 'مرفق وخدمة حقيقية مسجلة حول المبنى)',
//     calculatingNeighborhoodText:
//       'جاري قراءة المرافق والخدمات المحيطة بالمبنى من الخريطة...',
//     walkScoreLabel:
//       'مؤشر المشي والخدمات اليومية (Walk Score — قضاء الاحتياجات اليومية مشياً)',
//     mobilityScoreLabel:
//       'مؤشر المواصلات والربط المروري (Mobility Score · Well connected)',
//     metroRowLabel: 'المترو',
//     busRowLabel: 'الحافلات',
//     busLinesWithin500m: 'خطوط ضمن 500 م',
//     railRowLabel: 'محطة القطار',
//     airportRowLabel: 'المطار',
//     bestBadge: 'الأسرع',
//     locationTitle: 'الموقع والخريطة ثلاثية الأبعاد',
//     exactBuildingBadge: 'موقع المبنى الدقيق ✓',
//     approxCenterBadge: 'موقع موثق في السجل الجغرافي',
//     cloudyWord: 'معتدل',
//     airQualityWord: 'جودة الهواء',
//     collapseTooltip: 'طي القسم',
//     expandTooltip: 'فتح القسم',
//     directionsBtn: 'الاتجاهات على Google Maps',
//     open3dMapBtn: 'تكبير الخريطة 3D',
//     closeFullscreenBtn: 'تصغير الخريطة',
//     whatsNearbyTitle: 'الأماكن والخدمات القريبة من العقار',
//     whatsNearbySub:
//       'الأقرب أولاً · المسافة الحقيقية وزمن المشي والسيارة من موقع المبنى · خرائط جورجيا',
//     loadingNearbyText: 'جاري تحميل الأماكن والخدمات المحيطة بالمبنى...',
//     noPlacesInCategory: 'لا توجد مرافق مسجلة قريبة في هذا التصنيف',
//     allCat: 'الكل',
//     showLessBtn: 'عرض أقل ▲',
//     showMoreSuffix: 'المزيد ⌄',
//     walkWord: 'مشياً',
//     transitWord: 'مواصلات',
//     driveWord: 'سيارة',
//     minWord: 'د',
//     sunTitle: 'حركة الشمس والإضاءة الطبيعية للمبنى',
//     sunSub:
//       'مسار الشمس الفلكي المحسوب بدقة من إحداثيات هذا المبنى (بتوقيت جورجيا)',
//     winterTab: 'الشتاء',
//     todayTab: 'اليوم',
//     summerTab: 'الصيف',
//     windowDirectionTitle: 'تعرض النوافذ لأشعة الشمس المباشرة حسب الاتجاه',
//     northLabel: 'الشمال',
//     eastLabel: 'الشرق',
//     southLabel: 'الجنوب',
//     westLabel: 'الغرب',
//     noDirectSun: 'إضاءة ناعمة بدون شمس مباشرة',
//     brightMorning: 'مشرق صباحاً',
//     veryBrightAllDay: 'مشمس جداً طوال النهار',
//     brightAfternoon: 'مشرق عصراً',
//     southEastLabel: 'جنوب شرق',
//     southWestLabel: 'جنوب غرب',
//     timeLabel: 'الوقت المحدد',
//     heightLabel: 'زاوية الارتفاع',
//     directionLabel: 'الاتجاه',
//     daylightLabel: 'طول النهار',
//     sunriseLabel: 'الشروق',
//     solarNoonLabel: 'الظهيرة',
//     sunsetLabel: 'الغروب',
//     windowsHelpText: 'استخدم Ctrl + التمرير لتكبير الخريطة',
//     macHelpText: 'استخدم ⌘ + التمرير لتكبير الخريطة',
//     mobileHelpText: 'استخدم إصبعين لتحريك وتكبير الخريطة',
//     categories: {
//       metro: 'المترو',
//       school: 'مدارس',
//       kindergarten: 'حضانات ورياض أطفال',
//       pharmacy: 'صيدليات',
//       park: 'حدائق ومتنزهات',
//       market: 'سوبرماركت وأسواق',
//       restaurants: 'مطاعم وكافيهات',
//       clinic: 'عيادات ومستشفيات',
//       university: 'جامعات وكليات',
//       bank: 'بنوك وصراف آلي',
//       landmark: 'معالم شهيرة',
//       gym: 'صالات رياضية',
//       bus: 'محطات حافلات',
//     },
//   },
//   en: {
//     neighborhoodTitle: 'Neighborhood',
//     neighborhoodSubPrefix: 'Very walkable (',
//     neighborhoodSubSuffix: 'nearby amenities)',
//     calculatingNeighborhoodText: 'Reading nearby amenities from map...',
//     walkScoreLabel: 'Walk (Daily errands on foot)',
//     mobilityScoreLabel: 'Mobility Score · Well connected',
//     metroRowLabel: 'Metro',
//     busRowLabel: 'Bus',
//     busLinesWithin500m: 'Lines within 500 m',
//     railRowLabel: 'Rail',
//     airportRowLabel: 'Airport',
//     bestBadge: 'Best',
//     locationTitle: 'Location & 3D Map',
//     exactBuildingBadge: 'Exact building pin ✓',
//     approxCenterBadge: 'Verified area coordinates',
//     cloudyWord: 'Partly cloudy',
//     airQualityWord: 'Air quality',
//     collapseTooltip: 'Collapse',
//     expandTooltip: 'Expand',
//     directionsBtn: 'Directions',
//     open3dMapBtn: 'Open 3D map',
//     closeFullscreenBtn: 'Exit Fullscreen',
//     whatsNearbyTitle: "What's nearby",
//     whatsNearbySub: 'Nearest first · walking time · Aqar Exit Maps',
//     loadingNearbyText: 'Loading real nearby places...',
//     noPlacesInCategory: 'No places listed nearby in this category',
//     allCat: 'All',
//     showLessBtn: 'Show less ▲',
//     showMoreSuffix: 'More ⌄',
//     walkWord: 'walk',
//     transitWord: 'transit',
//     driveWord: 'drive',
//     minWord: 'min',
//     sunTitle: 'Sun & daylight',
//     sunSub:
//       'Sun path at this address — astronomical calculation from the coordinates',
//     winterTab: 'Winter',
//     todayTab: 'Today',
//     summerTab: 'Summer',
//     windowDirectionTitle: 'Direct sun by window direction',
//     northLabel: 'North',
//     eastLabel: 'East',
//     southLabel: 'South',
//     westLabel: 'West',
//     noDirectSun: 'No direct sun',
//     brightMorning: 'Bright',
//     veryBrightAllDay: 'Very bright',
//     brightAfternoon: 'Bright',
//     southEastLabel: 'South-East',
//     southWestLabel: 'South-West',
//     timeLabel: 'TIME',
//     heightLabel: 'HEIGHT',
//     directionLabel: 'DIRECTION',
//     daylightLabel: 'DAYLIGHT',
//     sunriseLabel: 'SUNRISE',
//     solarNoonLabel: 'SOLAR NOON',
//     sunsetLabel: 'SUNSET',
//     windowsHelpText: 'Use Ctrl + scroll to zoom the map',
//     macHelpText: 'Use ⌘ + scroll to zoom the map',
//     mobileHelpText: 'Use two fingers to move the map',
//     categories: {
//       metro: 'Metro',
//       school: 'School',
//       kindergarten: 'Kindergarten',
//       pharmacy: 'Pharmacy',
//       park: 'Park',
//       market: 'Market',
//       restaurants: 'Restaurants',
//       clinic: 'Clinic',
//       university: 'University',
//       bank: 'Bank',
//       landmark: 'Landmark',
//       gym: 'Gym',
//       bus: 'Bus',
//     },
//   },
//   ru: {
//     neighborhoodTitle: 'Район и транспортная доступность',
//     neighborhoodSubPrefix: 'Развитая инфраструктура в пешей доступности (',
//     neighborhoodSubSuffix: 'объектов рядом)',
//     calculatingNeighborhoodText: 'Загрузка объектов инфраструктуры с карты...',
//     walkScoreLabel: 'Пешая доступность (Магазины, аптеки и школы пешком)',
//     mobilityScoreLabel: 'Транспортная доступность · Отличная связь',
//     metroRowLabel: 'Метро',
//     busRowLabel: 'Автобус',
//     busLinesWithin500m: 'Линий в радиусе 500 м',
//     railRowLabel: 'Вокзал',
//     airportRowLabel: 'Аэропорт',
//     bestBadge: 'Лучший',
//     locationTitle: 'Локация и 3D-карта',
//     exactBuildingBadge: 'Точное здание ✓',
//     approxCenterBadge: 'Координаты подтверждены',
//     cloudyWord: 'Переменная облачность',
//     airQualityWord: 'Качество воздуха',
//     collapseTooltip: 'Свернуть',
//     expandTooltip: 'Развернуть',
//     directionsBtn: 'Маршрут',
//     open3dMapBtn: 'На весь экран 3D',
//     closeFullscreenBtn: 'Свернуть карту',
//     whatsNearbyTitle: 'Что находится рядом',
//     whatsNearbySub: 'Сначала ближайшие · точное время пешком · данные карты',
//     loadingNearbyText: 'Загрузка объектов рядом...',
//     noPlacesInCategory: 'Нет объектов поблизости',
//     allCat: 'Все',
//     showLessBtn: 'Свернуть ▲',
//     showMoreSuffix: 'Еще ⌄',
//     walkWord: 'пешком',
//     transitWord: 'транспорт',
//     driveWord: 'авто',
//     minWord: 'мин',
//     sunTitle: 'Солнце и естественное освещение',
//     sunSub: 'Траектория солнца по точным координатам здания',
//     winterTab: 'Зима',
//     todayTab: 'Сегодня',
//     summerTab: 'Лето',
//     windowDirectionTitle: 'Солнечный свет по направлению окон',
//     northLabel: 'Север',
//     eastLabel: 'Восток',
//     southLabel: 'Юг',
//     westLabel: 'Запад',
//     noDirectSun: 'Без прямого солнца',
//     brightMorning: 'Солнечно утром',
//     veryBrightAllDay: 'Солнечно весь день',
//     brightAfternoon: 'Солнечно после полудня',
//     southEastLabel: 'Юго-Восток',
//     southWestLabel: 'Юго-Запад',
//     timeLabel: 'ВРЕМЯ',
//     heightLabel: 'ВЫСОТА',
//     directionLabel: 'НАПРАВЛЕНИЕ',
//     daylightLabel: 'СВЕТОВОЙ ДЕНЬ',
//     sunriseLabel: 'ВОСХОД',
//     solarNoonLabel: 'ПОЛДЕНЬ',
//     sunsetLabel: 'ЗАКАТ',
//     windowsHelpText: 'Используйте Ctrl + колесико для масштабирования',
//     macHelpText: 'Используйте ⌘ + колесико для масштабирования',
//     mobileHelpText: 'Используйте два пальца для перемещения карты',
//     categories: {
//       metro: 'Метро',
//       school: 'Школы',
//       kindergarten: 'Детские сады',
//       pharmacy: 'Аптеки',
//       park: 'Парки',
//       market: 'Супермаркеты',
//       restaurants: 'Рестораны',
//       clinic: 'Клиники',
//       university: 'Университеты',
//       bank: 'Банки',
//       landmark: 'Достопримечательности',
//       gym: 'Фитнес',
//       bus: 'Автобус',
//     },
//   },
//   ka: {
//     neighborhoodTitle: 'უბანი და ტრანსპორტი',
//     neighborhoodSubPrefix: 'კეთილმოწყობილი და ფეხით სავალი ზონა (',
//     neighborhoodSubSuffix: 'ობიექტი შენობის გარშემო)',
//     calculatingNeighborhoodText: 'იტვირთება მონაცემები რუკიდან...',
//     walkScoreLabel: 'ფეხით ხელმისაწვდომობა (Walk Score)',
//     mobilityScoreLabel: 'ტრანსპორტის ხელმისაწვდომობა (Mobility Score)',
//     metroRowLabel: 'მეტრო',
//     busRowLabel: 'ავტობუსი',
//     busLinesWithin500m: 'ხაზები 500 მ-ში',
//     railRowLabel: 'რკინიგზა',
//     airportRowLabel: 'აეროპორტი',
//     bestBadge: 'საუკეთესო',
//     locationTitle: 'მდებარეობა და 3D რუკა',
//     exactBuildingBadge: 'ზუსტი შენობა ✓',
//     approxCenterBadge: 'დადასტურებული მდებარეობა',
//     cloudyWord: 'ზომიერი',
//     airQualityWord: 'ჰაერის ხარისხი',
//     collapseTooltip: 'ჩაკეცვა',
//     expandTooltip: 'გაშლა',
//     directionsBtn: 'მარშრუტი',
//     open3dMapBtn: '3D რუკა',
//     closeFullscreenBtn: 'დახურვა',
//     whatsNearbyTitle: 'რა არის ახლოს',
//     whatsNearbySub: 'უახლოესი ობიექტები · ფეხით სავალი დრო',
//     loadingNearbyText: 'იტვირთება ობიექტები...',
//     noPlacesInCategory: 'ობიექტები არ მოიძებნა',
//     allCat: 'ყველა',
//     showLessBtn: 'ნაკლები ▲',
//     showMoreSuffix: 'მეტი ⌄',
//     walkWord: 'ფეხით',
//     transitWord: 'ტრანსპორტი',
//     driveWord: 'მანქანით',
//     minWord: 'წთ',
//     sunTitle: 'მზე და ბუნებრივი განათება',
//     sunSub: 'მზის ტრაექტორია შენობის ზუსტი კოორდინატების მიხედვით',
//     winterTab: 'ზამთარი',
//     todayTab: 'დღეს',
//     summerTab: 'ზაფხული',
//     windowDirectionTitle: 'მზის სხივები ფანჯრების მიმართულებით',
//     northLabel: 'ჩრდილოეთი',
//     eastLabel: 'აღმოსავლეთი',
//     southLabel: 'სამხრეთი',
//     westLabel: 'დასავლეთი',
//     noDirectSun: 'პირდაპირი მზის გარეშე',
//     brightMorning: 'ნათელი დილით',
//     veryBrightAllDay: 'მზიანი მთელი დღე',
//     brightAfternoon: 'ნათელი საღამოს',
//     southEastLabel: 'სამხრეთ-აღმოსავლეთი',
//     southWestLabel: 'სამხრეთ-დასავლეთი',
//     timeLabel: 'დრო',
//     heightLabel: 'სიმაღლე',
//     directionLabel: 'მიმართულება',
//     daylightLabel: 'დღის ხანგრძლივობა',
//     sunriseLabel: 'ამოსვლა',
//     solarNoonLabel: 'შუადღე',
//     sunsetLabel: 'ჩასვლა',
//     windowsHelpText: 'გამოიყენეთ Ctrl + სქროლი რუკის გასადიდებლად',
//     macHelpText: 'გამოიყენეთ ⌘ + სქროლი რუკის გასადიდებლად',
//     mobileHelpText: 'გამოიყენეთ ორი თითი რუკის გადასაადგილებლად',
//     categories: {
//       metro: 'მეტრო',
//       school: 'სკოლები',
//       kindergarten: 'საბავშვო ბაღები',
//       pharmacy: 'აფთიაქები',
//       park: 'პარკები',
//       market: 'მარკეტები',
//       restaurants: 'რესტორნები',
//       clinic: 'კლინიკები',
//       university: 'უნივერსიტეტები',
//       bank: 'ბანკები',
//       landmark: 'ღირსშესანიშნაობები',
//       gym: 'ფიტნესი',
//       bus: 'ავტობუსი',
//     },
//   },
// }