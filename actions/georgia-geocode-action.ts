'use server'

import { createClient } from '@supabase/supabase-js'

export type NearbyPlaceCategory =
  | 'metro'
  | 'school'
  | 'kindergarten'
  | 'pharmacy'
  | 'park'
  | 'market'
  | 'restaurants'
  | 'clinic'
  | 'university'
  | 'bank'
  | 'landmark'
  | 'gym'
  | 'bus'

export type RealNearbyPlaceItem = {
  id: string
  name: string
  names?: {
    ar: string
    en: string
    ru: string
    ka: string
  }
  category: NearbyPlaceCategory
  distanceMeters: number
  lat: number
  lng: number
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

const KA_TO_LATIN_MAP: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

const TBILISI_OFFICIAL_METRO_STATIONS: Array<{
  nameEn: string
  nameKa: string
  nameRu: string
  nameAr: string
  lat: number
  lng: number
}> = [
  { nameEn: 'Rustaveli', nameKa: 'რუსთაველი', nameRu: 'Руставели', nameAr: 'روستافيلي', lat: 41.7041, lng: 44.7896 },
  { nameEn: 'Liberty Square', nameKa: 'თავისუფლების მოედანი', nameRu: 'Площадь Свободы', nameAr: 'ميدان الحرية', lat: 41.6934, lng: 44.8015 },
  { nameEn: 'Marjanishvili', nameKa: 'მარჯანიშვილი', nameRu: 'Марджанишвили', nameAr: 'مارجانيشفيلي', lat: 41.7091, lng: 44.7971 },
  { nameEn: 'Station Square', nameKa: 'სადგურის მოედანი', nameRu: 'Вокзальная площадь', nameAr: 'ميدان المحطة', lat: 41.7201, lng: 44.7988 },
  { nameEn: 'Technical University', nameKa: 'ტექნიკური უნივერსიტეტი', nameRu: 'Технический университет', nameAr: 'الجامعة التقنية', lat: 41.7186, lng: 44.7779 },
  { nameEn: 'Medical University', nameKa: 'სამედიცინო უნივერსიტეტი', nameRu: 'Медицинский университет', nameAr: 'الجامعة الطبية', lat: 41.7259, lng: 44.7634 },
  { nameEn: 'Delisi', nameKa: 'დელისი', nameRu: 'Делиси', nameAr: 'ديليسي', lat: 41.7253, lng: 44.7469 },
  { nameEn: 'Vazha-Pshavela', nameKa: 'ვაჟა-ფშაველა', nameRu: 'Важа-Пшавела', nameAr: 'فاجا بشافيلا', lat: 41.7244, lng: 44.7311 },
  { nameEn: 'State University', nameKa: 'სახელმწიფო უნივერსიტეტი', nameRu: 'Государственный университет', nameAr: 'الجامعة الحكومية', lat: 41.7226, lng: 44.7176 },
  { nameEn: 'Avlabari', nameKa: 'ავლაბარი', nameRu: 'Авлабари', nameAr: 'أفلاباري', lat: 41.6924, lng: 44.8156 },
  { nameEn: '300 Aragveli', nameKa: '300 არაგველი', nameRu: '300 Арагвели', nameAr: '300 أراجفيلي', lat: 41.6878, lng: 44.8286 },
  { nameEn: 'Isani', nameKa: 'ისანი', nameRu: 'Исани', nameAr: 'إيساني', lat: 41.6869, lng: 44.8414 },
  { nameEn: 'Samgori', nameKa: 'სამგორი', nameRu: 'Самгори', nameAr: 'سامجوري', lat: 41.6838, lng: 44.8569 },
  { nameEn: 'Varketili', nameKa: 'ვარკეთილი', nameRu: 'Варкетили', nameAr: 'فاركيتيلي', lat: 41.6988, lng: 44.8762 },
  { nameEn: 'Tsereteli', nameKa: 'წერეთელი', nameRu: 'Церетели', nameAr: 'تسيريتيلي', lat: 41.7282, lng: 44.7885 },
  { nameEn: 'Gotsiridze', nameKa: 'გოცირიძე', nameRu: 'Гоциридзе', nameAr: 'جوتسيريدزه', lat: 41.7376, lng: 44.7842 },
  { nameEn: 'Didube', nameKa: 'დიდუბე', nameRu: 'Дидубе', nameAr: 'ديدوبي', lat: 41.7498, lng: 44.7796 },
  { nameEn: 'Grmagele', nameKa: 'ღრმაღელე', nameRu: 'Грмагеле', nameAr: 'غرماجيلي', lat: 41.7654, lng: 44.7891 },
  { nameEn: 'Guramishvili', nameKa: 'გურამიშვილი', nameRu: 'Гурамишвили', nameAr: 'جوراميشفيلي', lat: 41.7751, lng: 44.7952 },
  { nameEn: 'Sarajishvili', nameKa: 'სარაჯიშვილი', nameRu: 'Сараджишвили', nameAr: 'ساراجيشفيلي', lat: 41.7875, lng: 44.8012 },
  { nameEn: 'Akhmeteli Theatre', nameKa: 'ახმეტელის თეატრი', nameRu: 'Театр Ахметели', nameAr: 'مسرح أخسيتيلي', lat: 41.7931, lng: 44.8156 },
]

const GENERIC_CATEGORY_FALLBACK_NAMES: Record<
  NearbyPlaceCategory,
  { ar: string; en: string; ru: string; ka: string }
> = {
  metro: { ar: 'محطة مترو', en: 'Metro Station', ru: 'Станция метро', ka: 'მეტრო' },
  school: { ar: 'مدرسة', en: 'Public School', ru: 'Школа', ka: 'საჯარო სკოლა' },
  kindergarten: { ar: 'حضانة وروضة أطفال', en: 'Kindergarten', ru: 'Детский сад', ka: 'საბავშვო ბაღი' },
  pharmacy: { ar: 'صيدلية', en: 'Pharmacy', ru: 'Аптека', ka: 'აფთიაქი' },
  park: { ar: 'حديقة عامة', en: 'Park', ru: 'Сквер / Парк', ka: 'პარკი' },
  market: { ar: 'سوبرماركت', en: 'Supermarket', ru: 'Супермаркет', ka: 'სუპერმარკეტი' },
  restaurants: { ar: 'مطعم / كافيه', en: 'Restaurant / Cafe', ru: 'Ресторан / Кафе', ka: 'რესტორანი' },
  clinic: { ar: 'عيادة طبية', en: 'Clinic', ru: 'Клиника', ka: 'კლინიკა' },
  university: { ar: 'جامعة / كلية', en: 'University', ru: 'Университет', ka: 'უნივერსიტეტი' },
  bank: { ar: 'بنك', en: 'Bank', ru: 'Банк', ka: 'ბანკი' },
  landmark: { ar: 'معلم بارز', en: 'Landmark', ru: 'Достопримечательность', ka: 'ღირსშესანიშნაობა' },
  gym: { ar: 'صالة رياضية', en: 'Fitness Gym', ru: 'Фитнес-клуб', ka: 'ფიტნეს დარბაზი' },
  bus: { ar: 'محطة حافلات', en: 'Bus Stop', ru: 'Автобусная остановка', ka: 'ავტობუსის გაჩერება' },
}

function isPointInGeorgiaBounds(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 40.9 &&
    lat <= 43.7 &&
    lng >= 39.8 &&
    lng <= 46.9
  )
}

function transliterateKaToLatin(text: string): string {
  const clean = (text || '').trim()
  if (!clean || !/[ა-ჰ]/.test(clean)) return clean
  const romanized = Array.from(clean)
    .map((ch) => KA_TO_LATIN_MAP[ch] ?? ch)
    .join('')
  return romanized
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

function buildMultilingualPlaceNames(
  tags: Record<string, any>,
  category: NearbyPlaceCategory
): { ar: string; en: string; ru: string; ka: string } | null {
  const nameKa = String(
    tags['name:ka'] ||
      (/[ა-ჰ]/.test(tags.name || '') ? tags.name : '') ||
      tags.official_name ||
      tags.brand ||
      ''
  ).trim()

  const rawEn = String(
    tags['name:en'] ||
      tags['brand:en'] ||
      tags['int_name'] ||
      (!/[ა-ჰ]/.test(tags.brand || '') ? tags.brand : '') ||
      (!/[ა-ჰ]/.test(tags.name || '') ? tags.name : '') ||
      ''
  ).trim()

  const rawRu = String(tags['name:ru'] || tags['brand:ru'] || '').trim()
  const rawAr = String(tags['name:ar'] || '').trim()

  const addrStreet = String(
    tags['addr:street:en'] ||
      tags['addr:street'] ||
      tags.description ||
      ''
  ).trim()
  const addrNum = String(tags.ref || tags['addr:housenumber'] || '').trim()

  const baseEn =
    rawEn ||
    transliterateKaToLatin(nameKa) ||
    (category === 'bus' && addrStreet
      ? `${transliterateKaToLatin(addrStreet)}${addrNum ? ` #${addrNum}` : ''}`
      : '')

  const baseKa =
    nameKa ||
    rawEn ||
    (category === 'bus' && addrStreet
      ? `${addrStreet}${addrNum ? ` #${addrNum}` : ''}`
      : '')

  if (!baseEn && !baseKa) {
    if (
      category === 'restaurants' ||
      category === 'market' ||
      category === 'landmark'
    ) {
      return null
    }
    const fb = GENERIC_CATEGORY_FALLBACK_NAMES[category]
    const suffix = addrNum ? ` #${addrNum}` : ''
    return {
      ar: `${fb.ar}${suffix}`,
      en: `${fb.en}${suffix}`,
      ru: `${fb.ru}${suffix}`,
      ka: `${fb.ka}${suffix}`,
    }
  }

  const finalEn = baseEn || transliterateKaToLatin(baseKa)
  const finalKa = baseKa || finalEn
  const finalRu = rawRu || finalEn
  const finalAr = rawAr || finalEn

  return {
    ar: finalAr,
    en: finalEn,
    ru: finalRu,
    ka: finalKa,
  }
}

function haversineMetersServer(
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

function formatNaprOfficialAddress(
  city: string,
  street: string,
  houseNumber: string
): string {
  const cleanCity = city || 'Tbilisi'
  const cleanStreet = street || ''
  const cleanHouse = houseNumber ? `N ${houseNumber}` : ''
  return [cleanCity, cleanStreet, cleanHouse].filter(Boolean).join(', ')
}

export async function geocodeGeorgiaBuildingAction(params: {
  streetEn: string
  streetKa?: string
  baseStreetEn?: string
  houseNumber?: string
  district?: string
  city?: string
}): Promise<{
  lat: number
  lng: number
  houseNumber?: string
  cadastralCode?: string
  naprAddress?: string
} | null> {
  const cleanStreetEn = String(params?.streetEn || '').trim().slice(0, 180)
  const cleanStreetKa = String(params?.streetKa || '').trim().slice(0, 180)
  const cleanBaseStreetEn = String(params?.baseStreetEn || '').trim().slice(0, 180)
  const cleanHouse = String(params?.houseNumber || '').trim().slice(0, 40)
  const cleanCity = String(params?.city || 'Tbilisi').trim().slice(0, 80) || 'Tbilisi'

  if (!cleanStreetEn && !cleanStreetKa) return null

  const HEADERS = {
    'User-Agent': 'DualDealzGeorgiaRealEstate/2.0 (https://dualdealz.com)',
    'Accept-Language': 'en,ka;q=0.9',
  }

  const queries: string[] = []
  if (cleanHouse) {
    if (cleanStreetKa) queries.push(`${cleanStreetKa} ${cleanHouse}, ${cleanCity}`)
    if (cleanStreetEn) queries.push(`${cleanStreetEn} ${cleanHouse}, ${cleanCity}`)
    if (cleanBaseStreetEn && cleanBaseStreetEn !== cleanStreetEn) {
      queries.push(`${cleanBaseStreetEn} ${cleanHouse}, ${cleanCity}`)
    }
  } else {
    if (cleanStreetKa) queries.push(`${cleanStreetKa}, ${cleanCity}`)
    if (cleanStreetEn) queries.push(`${cleanStreetEn}, ${cleanCity}`)
    if (cleanBaseStreetEn && cleanBaseStreetEn !== cleanStreetEn) {
      queries.push(`${cleanBaseStreetEn}, ${cleanCity}`)
    }
  }

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ge&addressdetails=1&extratags=1&limit=3&q=${encodeURIComponent(
        q
      )}`
      const res = await fetch(url, {
        headers: HEADERS,
        next: { revalidate: 86400 },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const exactHouseHit = cleanHouse
          ? data.find(
              (item: any) =>
                String(item?.address?.house_number || '').toLowerCase() ===
                cleanHouse.toLowerCase()
            ) || data[0]
          : data[0]

        const lat = Number(exactHouseHit.lat)
        const lng = Number(exactHouseHit.lon)
        if (isPointInGeorgiaBounds(lat, lng)) {
          const resolvedHouse =
            exactHouseHit?.address?.house_number || cleanHouse
          const realOsmCadastre = String(
            exactHouseHit?.extratags?.['ref:cadastre'] ||
              exactHouseHit?.extratags?.cadastre ||
              ''
          ).trim()

          return {
            lat,
            lng,
            houseNumber: resolvedHouse,
            cadastralCode: realOsmCadastre || undefined,
            naprAddress: realOsmCadastre
              ? formatNaprOfficialAddress(cleanCity, cleanStreetEn, resolvedHouse)
              : undefined,
          }
        }
      }
    } catch {}
  }

  for (const q of queries.slice(0, 2)) {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        q
      )}&bbox=40.0,41.0,46.8,43.6&limit=2`
      const res = await fetch(photonUrl, {
        headers: HEADERS,
        next: { revalidate: 86400 },
      })
      if (!res.ok) continue
      const data = await res.json()
      const feat = data?.features?.[0]
      const coords = feat?.geometry?.coordinates
      if (Array.isArray(coords) && coords.length >= 2) {
        const lng = Number(coords[0])
        const lat = Number(coords[1])
        if (isPointInGeorgiaBounds(lat, lng)) {
          const resolvedHouse = feat?.properties?.housenumber
            ? String(feat.properties.housenumber)
            : cleanHouse
          return {
            lng,
            lat,
            houseNumber: resolvedHouse,
          }
        }
      }
    } catch {}
  }

  return null
}

export async function reverseGeocodeGeorgiaPinAction(params: {
  lat: number
  lng: number
  locale: string
  fallbackCity?: string | null
}): Promise<{
  outsideGeorgia?: boolean
  rawCity: string
  rawSuburb: string
  rawStreet: string
  rawStreetKa: string
  rawHouse: string
  cadastralCode: string
  naprAddress: string
} | null> {
  const lat = Number(params?.lat)
  const lng = Number(params?.lng)
  const locale = String(params?.locale || 'en')
  const fallbackCity = params?.fallbackCity
    ? String(params.fallbackCity).slice(0, 80)
    : null

  if (!isPointInGeorgiaBounds(lat, lng)) {
    return {
      outsideGeorgia: true,
      rawCity: '',
      rawSuburb: '',
      rawStreet: '',
      rawStreetKa: '',
      rawHouse: '',
      cadastralCode: '',
      naprAddress: '',
    }
  }

  const reqLang = locale === 'ka' ? 'ka' : locale === 'ru' ? 'ru' : 'en'
  const roundedLat = Number(lat).toFixed(5)
  const roundedLng = Number(lng).toFixed(5)

  const HEADERS = {
    'User-Agent': 'DualDealzGeorgiaRealEstate/2.0 (https://dualdealz.com)',
    'Accept-Language': `${reqLang},en;q=0.9,ka;q=0.8`,
  }

  const [nomResult, photonResult] = await Promise.allSettled([
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1&namedetails=1&extratags=1`,
      { headers: HEADERS, next: { revalidate: 86400 } }
    ).then((r) => (r.ok ? r.json() : null)),
    fetch(
      `https://photon.komoot.io/reverse?lon=${roundedLng}&lat=${roundedLat}&lang=en`,
      { headers: HEADERS, next: { revalidate: 86400 } }
    ).then((r) => (r.ok ? r.json() : null)),
  ])

  const nomData = nomResult.status === 'fulfilled' ? nomResult.value : null
  const pData = photonResult.status === 'fulfilled' ? photonResult.value : null

  const addr = nomData?.address || {}
  const names = nomData?.namedetails || {}
  const extratags = nomData?.extratags || {}
  const pProp = pData?.features?.[0]?.properties || {}

  if (addr.country_code && String(addr.country_code).toLowerCase() !== 'ge') {
    return {
      outsideGeorgia: true,
      rawCity: '',
      rawSuburb: '',
      rawStreet: '',
      rawStreetKa: '',
      rawHouse: '',
      cadastralCode: '',
      naprAddress: '',
    }
  }

  const rawCity =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    pProp.city ||
    pProp.town ||
    fallbackCity ||
    'Tbilisi'

  const rawSuburb =
    addr.suburb ||
    addr.city_district ||
    addr.neighbourhood ||
    addr.quarter ||
    pProp.district ||
    pProp.suburb ||
    ''

  const rawStreetKa =
    names['name:ka'] ||
    (/[ა-ჰ]/.test(addr.road || '') ? addr.road : '') ||
    ''

  const rawStreet =
    (locale !== 'ka' &&
      (names['name:en'] ||
        names['name:latin'] ||
        pProp.street ||
        (!/[ა-ჰ]/.test(addr.road || '') ? addr.road : ''))) ||
    addr.road ||
    addr.pedestrian ||
    addr.residential ||
    pProp.street ||
    pProp.name ||
    nomData?.name ||
    ''

  const rawHouse = String(
    addr.house_number || pProp.housenumber || ''
  ).trim()

  const realOsmCadastre = String(
    extratags['ref:cadastre'] || extratags.cadastre || ''
  ).trim()

  const englishStreetForNapr =
    names['name:en'] ||
    names['name:latin'] ||
    pProp.street ||
    (!/[ა-ჰ]/.test(rawStreet) ? rawStreet : '') ||
    rawStreet

  const naprAddress = realOsmCadastre
    ? formatNaprOfficialAddress(rawCity, englishStreetForNapr, rawHouse)
    : ''

  if (!rawStreet && !rawHouse && !rawSuburb) return null

  return {
    rawCity,
    rawSuburb,
    rawStreet,
    rawStreetKa,
    rawHouse,
    cadastralCode: realOsmCadastre,
    naprAddress,
  }
}

export async function fetchRealNearbyPlacesAndWeatherAction(params: {
  lat: number
  lng: number
  locale: string
  unitId?: string
}): Promise<{
  places: RealNearbyPlaceItem[]
  temp: number
  aqi: number
}> {
  const lat = Number(params?.lat)
  const lng = Number(params?.lng)
  const locale = String(params?.locale || 'en')
  const unitId = params?.unitId ? String(params.unitId).trim() : undefined

  // رفض أي إحداثيات غير صالحة أو خارج حدود جورجيا
  if (!isPointInGeorgiaBounds(lat, lng)) {
    return {
      places: [],
      temp: 18,
      aqi: 22,
    }
  }

  const rLat = Number(lat.toFixed(4))
  const rLng = Number(lng.toFixed(4))

  const overpassQuery = `[out:json][timeout:14];(
    nwr["amenity"~"school|kindergarten|childcare|preschool|language_school|music_school"](around:1500,${rLat},${rLng});
    nwr["building"~"school|kindergarten"](around:1500,${rLat},${rLng});
    nwr["amenity"~"university|college"](around:2800,${rLat},${rLng});
    nwr["building"~"university|college"](around:2800,${rLat},${rLng});
    nwr["amenity"~"pharmacy|bank"](around:1200,${rLat},${rLng});
    nwr["amenity"~"clinic|hospital|doctors|dentist"](around:1500,${rLat},${rLng});
    nwr["leisure"~"park|garden|fitness_centre|sports_centre|swimming_pool"](around:1500,${rLat},${rLng});
    nwr["shop"~"supermarket|convenience|mall|department_store|greengrocer|bakery"](around:1000,${rLat},${rLng});
    nwr["amenity"~"restaurant|cafe"](around:1000,${rLat},${rLng});
    nwr["amenity"="place_of_worship"](around:1500,${rLat},${rLng});
    nwr["tourism"~"attraction|museum|viewpoint|artwork|gallery"](around:1500,${rLat},${rLng});
    nwr["historic"~"monument|memorial|castle|ruins"](around:1500,${rLat},${rLng});
    node["highway"="bus_stop"](around:1000,${rLat},${rLng});
    nwr["railway"~"station|subway_entrance|tram_stop"](around:2600,${rLat},${rLng});
  );out center;`

  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  const fetchFastestOverpass = async (): Promise<any[]> => {
    const requests = OVERPASS_ENDPOINTS.map(async (endpoint) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 11000)
      try {
        const res = await fetch(
          `${endpoint}?data=${encodeURIComponent(overpassQuery)}`,
          {
            headers: {
              'User-Agent': 'DualDealzGeorgiaRealEstate/2.0',
            },
            signal: controller.signal,
            next: { revalidate: 86400 },
          }
        )
        if (!res.ok) throw new Error('Bad status')
        const json = await res.json()
        if (!Array.isArray(json?.elements) || json.elements.length === 0) {
          throw new Error('Empty')
        }
        return json.elements
      } finally {
        clearTimeout(timer)
      }
    })

    try {
      return await Promise.any(requests)
    } catch {
      return []
    }
  }

  const [elements, weatherData, aqiData] = await Promise.all([
    fetchFastestOverpass(),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${rLat}&longitude=${rLng}&current_weather=true`,
      { next: { revalidate: 3600 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${rLat}&longitude=${rLng}&current=european_aqi`,
      { next: { revalidate: 3600 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ])

  const temp =
    weatherData?.current_weather?.temperature !== undefined
      ? Math.round(Number(weatherData.current_weather.temperature))
      : 18
  const aqi =
    aqiData?.current?.european_aqi !== undefined
      ? Math.round(Number(aqiData.current.european_aqi))
      : 22

  const places: RealNearbyPlaceItem[] = []
  const seenSpatialItems: Array<{
    category: NearbyPlaceCategory
    nameKey: string
    lat: number
    lng: number
  }> = []

  const activeLang = (
    ['ar', 'en', 'ru', 'ka'].includes(locale) ? locale : 'en'
  ) as 'ar' | 'en' | 'ru' | 'ka'

  for (const el of elements) {
    const tags = el?.tags || {}
    const elLat = Number(el?.lat ?? el?.center?.lat)
    const elLng = Number(el?.lon ?? el?.center?.lon)
    if (!Number.isFinite(elLat) || !Number.isFinite(elLng)) continue

    const am = String(tags.amenity || '').toLowerCase()
    const bldg = String(tags.building || '').toLowerCase()
    const sh = String(tags.shop || '').toLowerCase()
    const leis = String(tags.leisure || '').toLowerCase()
    const hw = String(tags.highway || '').toLowerCase()
    const rw = String(tags.railway || '').toLowerCase()
    const st = String(tags.station || '').toLowerCase()
    const tour = String(tags.tourism || '').toLowerCase()
    const hist = String(tags.historic || '').toLowerCase()

    const lowerHint = `${tags['name:en'] || ''} ${tags.name || ''} ${tags.brand || ''} ${tags.description || ''}`.toLowerCase()

    let category: NearbyPlaceCategory | null = null
    if (
      rw === 'subway_entrance' ||
      st === 'subway' ||
      (rw === 'station' && lowerHint.includes('metro'))
    ) {
      category = 'metro'
    } else if (
      am === 'kindergarten' ||
      am === 'childcare' ||
      am === 'preschool' ||
      bldg === 'kindergarten' ||
      lowerHint.includes('kindergarten') ||
      lowerHint.includes('sabavshvo') ||
      lowerHint.includes('საბავშვო') ||
      lowerHint.includes('ბაგა-ბაღი')
    ) {
      category = 'kindergarten'
    } else if (
      am === 'university' ||
      am === 'college' ||
      bldg === 'university' ||
      bldg === 'college' ||
      lowerHint.includes('universit') ||
      lowerHint.includes('უნივერსიტეტი')
    ) {
      category = 'university'
    } else if (
      am === 'school' ||
      am === 'language_school' ||
      am === 'music_school' ||
      bldg === 'school' ||
      lowerHint.includes('sajaro skola') ||
      lowerHint.includes('საჯარო სკოლა')
    ) {
      category = 'school'
    } else if (am === 'pharmacy') {
      category = 'pharmacy'
    } else if (leis === 'park' || leis === 'garden') {
      category = 'park'
    } else if (am === 'bank') {
      category = 'bank'
    } else if (tour || hist || am === 'place_of_worship') {
      category = 'landmark'
    } else if (
      am === 'clinic' ||
      am === 'hospital' ||
      am === 'doctors' ||
      am === 'dentist'
    ) {
      category = 'clinic'
    } else if (am === 'restaurant' || am === 'cafe') {
      category = 'restaurants'
    } else if (
      leis === 'fitness_centre' ||
      leis === 'sports_centre' ||
      leis === 'swimming_pool'
    ) {
      category = 'gym'
    } else if (hw === 'bus_stop' || rw === 'tram_stop') {
      category = 'bus'
    } else if (sh) {
      category = 'market'
    }

    if (!category) continue

    const distanceMeters = haversineMetersServer(rLat, rLng, elLat, elLng)
    if (distanceMeters > 3500) continue

    const multiNames = buildMultilingualPlaceNames(tags, category)
    if (!multiNames) continue

    const nameKey = multiNames.en.toLowerCase().trim()

    const isDuplicateSameBuilding = seenSpatialItems.some(
      (item) =>
        item.category === category &&
        item.nameKey === nameKey &&
        haversineMetersServer(item.lat, item.lng, elLat, elLng) < 38
    )
    if (isDuplicateSameBuilding) continue

    seenSpatialItems.push({
      category,
      nameKey,
      lat: elLat,
      lng: elLng,
    })

    places.push({
      id: `${el.type || 'node'}_${el.id}`,
      name: multiNames[activeLang] || multiNames.en,
      names: multiNames,
      category,
      distanceMeters,
      lat: elLat,
      lng: elLng,
    })
  }

  const existingMetro = places.filter((p) => p.category === 'metro')
  if (existingMetro.length === 0) {
    let nearestStation = TBILISI_OFFICIAL_METRO_STATIONS[0]
    let minMetroDist = haversineMetersServer(
      rLat,
      rLng,
      nearestStation.lat,
      nearestStation.lng
    )

    for (const st of TBILISI_OFFICIAL_METRO_STATIONS) {
      const d = haversineMetersServer(rLat, rLng, st.lat, st.lng)
      if (d < minMetroDist) {
        minMetroDist = d
        nearestStation = st
      }
    }

    if (minMetroDist <= 5000) {
      const metroNames = {
        ar: nearestStation.nameAr,
        en: nearestStation.nameEn,
        ru: nearestStation.nameRu,
        ka: nearestStation.nameKa,
      }
      places.push({
        id: `metro_official_${nearestStation.nameEn.toLowerCase().replace(/\s+/g, '_')}`,
        name: metroNames[activeLang] || metroNames.en,
        names: metroNames,
        category: 'metro',
        distanceMeters: minMetroDist,
        lat: nearestStation.lat,
        lng: nearestStation.lng,
      })
    }
  }

  places.sort((a, b) => a.distanceMeters - b.distanceMeters)

  // منع تسميم الكاش: لا نحدّث إلا إذا كان unitId صحيحاً وتطابقت الإحداثيات فعلياً مع موقع الوحدة المسجّل
  if (
    unitId &&
    UUID_REGEX.test(unitId) &&
    places.length >= 10 &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    void (async () => {
      try {
        const adminSb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: row } = await adminSb
          .from('sell_requests')
          .select('id, documents')
          .eq('id', unitId)
          .maybeSingle()

        if (!row) return

        const existingDocs =
          row.documents && typeof row.documents === 'object'
            ? row.documents
            : {}
        const existingMeta = existingDocs.__unit_meta || {}
        const coordsKey = `${rLat}_${rLng}`

        if (existingMeta.cached_nearby_coords === coordsKey) return

        const savedLat = Number(existingMeta.lat)
        const savedLng = Number(existingMeta.lng)
        if (
          !isPointInGeorgiaBounds(savedLat, savedLng) ||
          haversineMetersServer(savedLat, savedLng, rLat, rLng) > 250
        ) {
          return
        }

        await adminSb
          .from('sell_requests')
          .update({
            documents: {
              ...existingDocs,
              __unit_meta: {
                ...existingMeta,
                cached_nearby_places_v5: places.slice(0, 200),
                cached_nearby_coords: coordsKey,
              },
            },
          })
          .eq('id', unitId)
      } catch {}
    })()
  }

  return {
    places,
    temp,
    aqi,
  }
}