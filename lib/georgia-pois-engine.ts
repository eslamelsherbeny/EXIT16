'use client'

import type {
  NearbyPlaceCategory,
  RealNearbyPlaceItem,
} from '@/actions/georgia-geocode-action'
import type { LocaleCode } from '@/lib/i18n'
import realPoisSnapshot from './georgia-real-osm-pois.json'

export const GEORGIA_MAP_SNAPSHOT_AS_OF =
  (realPoisSnapshot as any)?.asOf || '2026-11-15'
export const CUSTOM_OSM_SNAPSHOT_STORAGE_KEY = 'aqar_georgia_osm_snapshot_v2'

export type MultilingualName = {
  ar: string
  en: string
  ru: string
  ka: string
}

export type MasterPoiRecord = {
  id: string
  category: NearbyPlaceCategory
  lat: number
  lng: number
  names: MultilingualName
}

export function haversineMetersClient(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/**
 * محطات مترو تبليسي الـ 23 الرسمية بإحداثياتها الحقيقية الثابتة
 */
export const OFFICIAL_METRO_POIS: MasterPoiRecord[] = [
  { id: 'metro_rustaveli', category: 'metro', lat: 41.7041, lng: 44.7896, names: { ar: 'روستافيلي', en: 'Rustaveli', ru: 'Руставели', ka: 'რუსთაველი' } },
  { id: 'metro_liberty', category: 'metro', lat: 41.6934, lng: 44.8015, names: { ar: 'ميدان الحرية', en: 'Liberty Square', ru: 'Площадь Свободы', ka: 'თავისუფლების მოედანი' } },
  { id: 'metro_marjanishvili', category: 'metro', lat: 41.7091, lng: 44.7971, names: { ar: 'مارجانيشفيلي', en: 'Marjanishvili', ru: 'Марджанишвили', ka: 'მარჯანიშვილი' } },
  { id: 'metro_station_sq', category: 'metro', lat: 41.7201, lng: 44.7988, names: { ar: 'ميدان المحطة', en: 'Station Square', ru: 'Вокзальная площадь', ka: 'სადგურის მოედანი' } },
  { id: 'metro_tech_uni', category: 'metro', lat: 41.7186, lng: 44.7779, names: { ar: 'الجامعة التقنية', en: 'Technical University', ru: 'Технический университет', ka: 'ტექნიკური უნივერსიტეტი' } },
  { id: 'metro_med_uni', category: 'metro', lat: 41.7259, lng: 44.7634, names: { ar: 'الجامعة الطبية', en: 'Medical University', ru: 'Медицинский университет', ka: 'სამედიცინო უნივერსიტეტი' } },
  { id: 'metro_delisi', category: 'metro', lat: 41.7253, lng: 44.7469, names: { ar: 'ديليسي', en: 'Delisi', ru: 'Делиси', ka: 'დელისი' } },
  { id: 'metro_vazha', category: 'metro', lat: 41.7244, lng: 44.7311, names: { ar: 'فاجا بشافيلا', en: 'Vazha-Pshavela', ru: 'Важа-Пшавела', ka: 'ვაჟა-ფშაველა' } },
  { id: 'metro_state_uni', category: 'metro', lat: 41.7226, lng: 44.7176, names: { ar: 'الجامعة الحكومية', en: 'State University', ru: 'Государственный университет', ka: 'სახელმწიფო უნივერსიტეტი' } },
  { id: 'metro_avlabari', category: 'metro', lat: 41.6924, lng: 44.8156, names: { ar: 'أفلاباري', en: 'Avlabari', ru: 'Авлабари', ka: 'ავლაბარი' } },
  { id: 'metro_300_aragveli', category: 'metro', lat: 41.6878, lng: 44.8286, names: { ar: '300 أراجفيلي', en: '300 Aragveli', ru: '300 Арагвели', ka: '300 არაგველი' } },
  { id: 'metro_isani', category: 'metro', lat: 41.6869, lng: 44.8414, names: { ar: 'إيساني', en: 'Isani', ru: 'Исани', ka: 'ისანი' } },
  { id: 'metro_samgori', category: 'metro', lat: 41.6838, lng: 44.8569, names: { ar: 'سامجوري', en: 'Samgori', ru: 'Самгори', ka: 'სამგორი' } },
  { id: 'metro_varketili', category: 'metro', lat: 41.6988, lng: 44.8762, names: { ar: 'فاركيتيلي', en: 'Varketili', ru: 'Варкетили', ka: 'ვარკეთილი' } },
  { id: 'metro_tsereteli', category: 'metro', lat: 41.7282, lng: 44.7885, names: { ar: 'تسيريتيلي', en: 'Tsereteli', ru: 'Церетели', ka: 'წერეთელი' } },
  { id: 'metro_gotsiridze', category: 'metro', lat: 41.7376, lng: 44.7842, names: { ar: 'جوتسيريدزه', en: 'Gotsiridze', ru: 'Гоциридзе', ka: 'გოცირიძე' } },
  { id: 'metro_didube', category: 'metro', lat: 41.7498, lng: 44.7796, names: { ar: 'ديدوبي', en: 'Didube', ru: 'Дидубе', ka: 'დიდუბე' } },
  { id: 'metro_ghrmaghele', category: 'metro', lat: 41.7654, lng: 44.7891, names: { ar: 'غرماجيلي', en: 'Ghrmaghele', ru: 'Грмагеле', ka: 'ღრმაღელე' } },
  { id: 'metro_guramishvili', category: 'metro', lat: 41.7751, lng: 44.7952, names: { ar: 'جوراميشفيلي', en: 'Guramishvili', ru: 'Гурамишвили', ka: 'გურამიშვილი' } },
  { id: 'metro_sarajishvili', category: 'metro', lat: 41.7875, lng: 44.8012, names: { ar: 'ساراجيشفيلي', en: 'Sarajishvili', ru: 'Сараджишвили', ka: 'სარაჯიშვილი' } },
  { id: 'metro_akhmeteli', category: 'metro', lat: 41.7931, lng: 44.8156, names: { ar: 'مسرح أخسيتيلي', en: 'Akhmeteli Theatre', ru: 'Театр Ахметели', ka: 'ახმეტელის თეატრი' } },
]

/**
 * أنصاف الأقطار الدقيقة لكل تصنيف بالمتر (مطابقة لنطاق المشي في sivrce.ge)
 */
const CATEGORY_RADIUS_LIMITS: Record<NearbyPlaceCategory, number> = {
  metro: 3000,
  university: 1800,
  school: 1100,
  kindergarten: 1100,
  clinic: 900,
  park: 1200,
  landmark: 1000,
  gym: 1200,
  bank: 900,
  pharmacy: 850,
  market: 800,
  restaurants: 750,
  bus: 750,
}

/**
 * الحد الأقصى لعدد العناصر المعروضة في كل تصنيف (لإعطاء إجمالي احترافي ~140-190 مرفق حول العقار)
 */
const CATEGORY_MAX_ITEMS_CAP: Record<NearbyPlaceCategory, number> = {
  metro: 3,
  school: 12,
  kindergarten: 12,
  pharmacy: 15,
  park: 8,
  market: 25,
  restaurants: 25,
  clinic: 15,
  university: 10,
  bank: 15,
  landmark: 12,
  gym: 12,
  bus: 35,
}

/**
 * استبعاد الأسماء العامة المجهولة (مثل Park أو Medical Clinic بدون اسم مميز)
 */
const GENERIC_UNNAMED_SKIP = new Set([
  'park',
  'პარკი',
  'парк / сквер',
  'حديقة عامة',
  'medical clinic',
  'კლინიკა',
  'клиника',
  'عيادة طبية',
  'pharmacy',
  'აფთიაქი',
  'صيدلية',
  'bank',
  'ბანკი',
  'بنك',
])

/**
 * قراءة المرافق الحقيقية الثابتة من ملف georgia-real-osm-pois.json
 * وحساب المسافة الفعلية بالمتر من إحداثيات العمارة في الشارع (في 0 ثانية)
 */
export function getInstantGeorgiaNearbyPlaces(
  lat: number,
  lng: number,
  locale: LocaleCode = 'ar'
): RealNearbyPlaceItem[] {
  const safeLat =
    Number.isFinite(lat) && lat >= 40.9 && lat <= 43.7 ? lat : 41.70934
  const safeLng =
    Number.isFinite(lng) && lng >= 39.8 && lng <= 46.9 ? lng : 44.76359
  const activeLang: keyof MultilingualName = [
    'ar',
    'en',
    'ru',
    'ka',
  ].includes(locale)
    ? (locale as keyof MultilingualName)
    : 'en'

  const candidates: RealNearbyPlaceItem[] = []
  const seenIds = new Set<string>()

  // 1. محطات المترو الرسمية (أقرب 3 محطات ضمن 4.5 كم)
  const metrosSorted = OFFICIAL_METRO_POIS.map((m) => ({
    ...m,
    dist: haversineMetersClient(safeLat, safeLng, m.lat, m.lng),
  })).sort((a, b) => a.dist - b.dist)

  for (const m of metrosSorted.slice(0, 3)) {
    if (m.dist <= 4500) {
      seenIds.add(m.id)
      candidates.push({
        id: m.id,
        name: m.names[activeLang] || m.names.en,
        names: m.names,
        category: 'metro',
        distanceMeters: m.dist,
        lat: m.lat,
        lng: m.lng,
      })
    }
  }

  // 2. قراءة قائمة المرافق الحقيقية الثابتة من ملف الـ JSON مع تصفية الأسماء المجهولة
  const rawItems: MasterPoiRecord[] = Array.isArray(
    (realPoisSnapshot as any)?.items
  )
    ? ((realPoisSnapshot as any).items as MasterPoiRecord[])
    : []

  for (const item of rawItems) {
    if (!item || !Number.isFinite(item.lat) || !Number.isFinite(item.lng)) {
      continue
    }

    // فلتر مربع جغرافي سريع قبل حساب Haversine لتسريع البحث في الـ 11,393 مرفق (أقل من 1ms)
    if (
      Math.abs(item.lat - safeLat) > 0.022 ||
      Math.abs(item.lng - safeLng) > 0.028
    ) {
      continue
    }

    const enLower = String(item.names?.en || '').trim().toLowerCase()
    if (
      ['park', 'clinic', 'pharmacy', 'bank'].includes(item.category) &&
      GENERIC_UNNAMED_SKIP.has(enLower)
    ) {
      continue
    }

    const maxRadius = CATEGORY_RADIUS_LIMITS[item.category] || 1000
    const dist = haversineMetersClient(safeLat, safeLng, item.lat, item.lng)

    if (dist <= maxRadius && !seenIds.has(item.id)) {
      seenIds.add(item.id)
      candidates.push({
        id: item.id,
        name: item.names?.[activeLang] || item.names?.en || 'Place',
        names: item.names,
        category: item.category,
        distanceMeters: dist,
        lat: item.lat,
        lng: item.lng,
      })
    }
  }

  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters)

  // 3. تطبيق السقف لكل فئة ليكون العرض متوازناً ومرتباً من الأقرب للأبعد
  const countByCat: Record<string, number> = {}
  const finalResults: RealNearbyPlaceItem[] = []

  for (const place of candidates) {
    const currentCount = countByCat[place.category] || 0
    const cap = CATEGORY_MAX_ITEMS_CAP[place.category] || 15
    if (currentCount < cap) {
      countByCat[place.category] = currentCount + 1
      finalResults.push(place)
    }
  }

  return finalResults
}