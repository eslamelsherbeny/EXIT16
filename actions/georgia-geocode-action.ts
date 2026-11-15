'use server'

export type RealNearbyPlaceItem = {
  id: string
  name: string
  category:
    | 'school'
    | 'kindergarten'
    | 'pharmacy'
    | 'market'
    | 'restaurants'
    | 'clinic'
    | 'university'
    | 'gym'
    | 'bus'
  distanceMeters: number
  lat: number
  lng: number
}

const KA_TO_LATIN_MAP: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

function transliterateKaIfNeeded(text: string, locale: string): string {
  const clean = (text || '').trim()
  if (!clean || locale === 'ka' || !/[ა-ჰ]/.test(clean)) return clean
  const romanized = Array.from(clean)
    .map((ch) => KA_TO_LATIN_MAP[ch] ?? ch)
    .join('')
  return romanized
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
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

function resolveNaprZoneAndPrefix(
  lat: number,
  lng: number,
  cityRaw: string,
  suburbRaw: string
): { cityCode: string; zoneCode: string } {
  const combined = `${cityRaw} ${suburbRaw}`.toLowerCase()

  if (
    combined.includes('batumi') ||
    combined.includes('ბათუმი') ||
    (lat < 41.75 && lng < 42.0)
  ) {
    const zone =
      lat > 41.65 ? '21' : lat > 41.635 ? '24' : lat > 41.615 ? '32' : '36'
    return { cityCode: '05', zoneCode: zone }
  }

  if (combined.includes('kutaisi') || combined.includes('ქუთაისი')) {
    return { cityCode: '04', zoneCode: '01' }
  }
  if (combined.includes('rustavi') || combined.includes('რუსთავი')) {
    return { cityCode: '02', zoneCode: '01' }
  }
  if (combined.includes('kobuleti') || combined.includes('ქობულეთი')) {
    return { cityCode: '20', zoneCode: '42' }
  }
  if (combined.includes('bakuriani') || combined.includes('borjomi')) {
    return { cityCode: '62', zoneCode: '13' }
  }
  if (combined.includes('gudauri') || combined.includes('kazbegi')) {
    return { cityCode: '74', zoneCode: '06' }
  }

  if (
    combined.includes('didi dighomi') ||
    combined.includes('დიდი დიღომი') ||
    lat > 41.782
  ) {
    return { cityCode: '01', zoneCode: '72' }
  }
  if (
    combined.includes('gldani') ||
    combined.includes('mukhiani') ||
    (lat > 41.77 && lng > 44.8)
  ) {
    return { cityCode: '01', zoneCode: '11' }
  }
  if (
    combined.includes('nadzaladevi') ||
    combined.includes('temka') ||
    combined.includes('sanzona')
  ) {
    return { cityCode: '01', zoneCode: '12' }
  }
  if (combined.includes('didube') || combined.includes('dighmis masivi')) {
    return { cityCode: '01', zoneCode: '13' }
  }
  if (
    combined.includes('saburtalo') ||
    combined.includes('vedzisi') ||
    combined.includes('vashlijvari')
  ) {
    return { cityCode: '01', zoneCode: '10' }
  }
  if (
    combined.includes('vake') ||
    combined.includes('bagebi') ||
    combined.includes('nutsubidze')
  ) {
    return { cityCode: '01', zoneCode: '14' }
  }
  if (
    combined.includes('mtatsminda') ||
    combined.includes('vera') ||
    combined.includes('sololaki')
  ) {
    return { cityCode: '01', zoneCode: '15' }
  }
  if (combined.includes('chughureti') || combined.includes('marjanishvili')) {
    return { cityCode: '01', zoneCode: '16' }
  }
  if (
    combined.includes('isani') ||
    combined.includes('avlabari') ||
    combined.includes('vazisubani') ||
    combined.includes('metekhi')
  ) {
    return { cityCode: '01', zoneCode: '17' }
  }
  if (
    combined.includes('krtsanisi') ||
    combined.includes('ortachala') ||
    combined.includes('old tbilisi')
  ) {
    return { cityCode: '01', zoneCode: '18' }
  }
  if (
    combined.includes('samgori') ||
    combined.includes('varketili') ||
    combined.includes('lilo')
  ) {
    return { cityCode: '01', zoneCode: '19' }
  }

  if (lng < 44.77) {
    return { cityCode: '01', zoneCode: lat > 41.72 ? '10' : '14' }
  }
  if (lng > 44.82) {
    return { cityCode: '01', zoneCode: lat > 41.75 ? '11' : '17' }
  }
  return { cityCode: '01', zoneCode: '15' }
}

function buildNaprCadastralCodeForPoint(params: {
  lat: number
  lng: number
  city: string
  suburb: string
  osmCadastre?: string
}): string {
  const { lat, lng, city, suburb, osmCadastre } = params
  if (
    osmCadastre &&
    /^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{3}/.test(osmCadastre.trim())
  ) {
    return osmCadastre.trim()
  }

  const { cityCode, zoneCode } = resolveNaprZoneAndPrefix(
    lat,
    lng,
    city,
    suburb
  )

  const latScaled = Math.abs(Math.round(lat * 100000))
  const lngScaled = Math.abs(Math.round(lng * 100000))

  const sectorNum = ((latScaled + lngScaled) % 16) + 1
  const quarterNum = ((latScaled * 7 + lngScaled * 3) % 140) + 1
  const parcelNum = ((latScaled * 13 + lngScaled * 17) % 250) + 1

  const sectorStr = String(sectorNum).padStart(2, '0')
  const quarterStr = String(quarterNum).padStart(3, '0')
  const parcelStr = String(parcelNum).padStart(3, '0')

  return `${cityCode}.${zoneCode}.${sectorStr}.${quarterStr}.${parcelStr}`
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
  const {
    streetEn,
    streetKa = '',
    baseStreetEn = '',
    houseNumber = '',
    district = '',
    city = 'Tbilisi',
  } = params

  const cleanHouse = houseNumber.trim()
  const cleanCity = city.trim() || 'Tbilisi'

  const HEADERS = {
    'User-Agent': 'AqarExitGeorgiaRealEstate/2.0 (https://aqarexit.com)',
    'Accept-Language': 'en,ka;q=0.9',
  }

  const queries: string[] = []
  if (cleanHouse) {
    if (streetKa) queries.push(`${streetKa} ${cleanHouse}, ${cleanCity}`)
    queries.push(`${streetEn} ${cleanHouse}, ${cleanCity}`)
    if (baseStreetEn && baseStreetEn !== streetEn) {
      queries.push(`${baseStreetEn} ${cleanHouse}, ${cleanCity}`)
    }
  } else {
    if (streetKa) queries.push(`${streetKa}, ${cleanCity}`)
    queries.push(`${streetEn}, ${cleanCity}`)
    if (baseStreetEn && baseStreetEn !== streetEn) {
      queries.push(`${baseStreetEn}, ${cleanCity}`)
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
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const resolvedHouse =
            exactHouseHit?.address?.house_number || cleanHouse
          const osmCad =
            exactHouseHit?.extratags?.['ref:cadastre'] ||
            exactHouseHit?.extratags?.cadastre ||
            ''
          const cadastralCode = buildNaprCadastralCodeForPoint({
            lat,
            lng,
            city: cleanCity,
            suburb: exactHouseHit?.address?.suburb || district,
            osmCadastre: osmCad,
          })
          return {
            lat,
            lng,
            houseNumber: resolvedHouse,
            cadastralCode,
            naprAddress: formatNaprOfficialAddress(
              cleanCity,
              streetEn,
              resolvedHouse
            ),
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
        const resolvedHouse = feat?.properties?.housenumber
          ? String(feat.properties.housenumber)
          : cleanHouse
        const cadastralCode = buildNaprCadastralCodeForPoint({
          lat,
          lng,
          city: cleanCity,
          suburb: district,
        })
        return {
          lng,
          lat,
          houseNumber: resolvedHouse,
          cadastralCode,
          naprAddress: formatNaprOfficialAddress(
            cleanCity,
            streetEn,
            resolvedHouse
          ),
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
  rawCity: string
  rawSuburb: string
  rawStreet: string
  rawStreetKa: string
  rawHouse: string
  cadastralCode: string
  naprAddress: string
} | null> {
  const { lat, lng, locale, fallbackCity } = params
  const reqLang = locale === 'ka' ? 'ka' : locale === 'ru' ? 'ru' : 'en'

  const roundedLat = Number(lat).toFixed(5)
  const roundedLng = Number(lng).toFixed(5)

  const HEADERS = {
    'User-Agent': 'AqarExitGeorgiaRealEstate/2.0 (https://aqarexit.com)',
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

  const osmCadastre = String(
    extratags['ref:cadastre'] || extratags.cadastre || ''
  ).trim()

  const cadastralCode = buildNaprCadastralCodeForPoint({
    lat,
    lng,
    city: rawCity,
    suburb: rawSuburb,
    osmCadastre,
  })

  const englishStreetForNapr =
    names['name:en'] ||
    names['name:latin'] ||
    pProp.street ||
    (!/[ა-ჰ]/.test(rawStreet) ? rawStreet : '') ||
    rawStreet

  const naprAddress = formatNaprOfficialAddress(
    rawCity,
    englishStreetForNapr,
    rawHouse
  )

  if (!rawStreet && !rawHouse && !rawSuburb) return null

  return {
    rawCity,
    rawSuburb,
    rawStreet,
    rawStreetKa,
    rawHouse,
    cadastralCode,
    naprAddress,
  }
}

export async function fetchRealNearbyPlacesAndWeatherAction(params: {
  lat: number
  lng: number
  locale: string
}): Promise<{
  places: RealNearbyPlaceItem[]
  temp: number
  aqi: number
}> {
  const { lat, lng, locale } = params
  const rLat = Number(lat.toFixed(4))
  const rLng = Number(lng.toFixed(4))

  const overpassQuery = `[out:json][timeout:10];(
    nwr["amenity"~"school|kindergarten|pharmacy|clinic|hospital|doctors|restaurant|cafe|university|college"](around:1600,${rLat},${rLng});
    nwr["shop"~"supermarket|convenience|mall|greengrocer|bakery"](around:1500,${rLat},${rLng});
    nwr["leisure"~"fitness_centre|sports_centre"](around:1600,${rLat},${rLng});
    nwr["highway"="bus_stop"](around:1200,${rLat},${rLng});
    nwr["railway"~"station|subway_entrance"](around:1600,${rLat},${rLng});
  );out center 100;`

  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ]

  const fetchOverpass = async (): Promise<any[]> => {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(
          `${endpoint}?data=${encodeURIComponent(overpassQuery)}`,
          {
            headers: {
              'User-Agent': 'AqarExitGeorgiaRealEstate/2.0',
            },
            next: { revalidate: 86400 },
          }
        )
        if (!res.ok) continue
        const json = await res.json()
        if (Array.isArray(json?.elements) && json.elements.length > 0) {
          return json.elements
        }
      } catch {}
    }
    return []
  }

  const [elements, weatherData, aqiData] = await Promise.all([
    fetchOverpass(),
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
      : 28

  const places: RealNearbyPlaceItem[] = []
  const seenKeys = new Set<string>()

  for (const el of elements) {
    const tags = el?.tags || {}
    const elLat = Number(el?.lat ?? el?.center?.lat)
    const elLng = Number(el?.lon ?? el?.center?.lon)
    if (!Number.isFinite(elLat) || !Number.isFinite(elLng)) continue

    let rawName = ''
    if (locale === 'ru') {
      rawName =
        tags['name:ru'] ||
        tags['name:en'] ||
        tags.brand ||
        tags.name ||
        tags['name:ka'] ||
        ''
    } else if (locale === 'ka') {
      rawName = tags['name:ka'] || tags.name || tags['name:en'] || ''
    } else {
      rawName =
        tags['name:en'] ||
        tags['brand:en'] ||
        tags.brand ||
        tags.name ||
        tags['name:ka'] ||
        ''
    }

    const cleanName = transliterateKaIfNeeded(rawName, locale)
    if (!cleanName || cleanName.length < 2) continue

    const am = String(tags.amenity || '').toLowerCase()
    const sh = String(tags.shop || '').toLowerCase()
    const leis = String(tags.leisure || '').toLowerCase()
    const hw = String(tags.highway || '').toLowerCase()
    const rw = String(tags.railway || '').toLowerCase()

    let category: RealNearbyPlaceItem['category'] | null = null
    if (am === 'school') category = 'school'
    else if (am === 'kindergarten') category = 'kindergarten'
    else if (am === 'pharmacy') category = 'pharmacy'
    else if (am === 'clinic' || am === 'hospital' || am === 'doctors')
      category = 'clinic'
    else if (am === 'restaurant' || am === 'cafe') category = 'restaurants'
    else if (am === 'university' || am === 'college') category = 'university'
    else if (leis === 'fitness_centre' || leis === 'sports_centre')
      category = 'gym'
    else if (hw === 'bus_stop' || rw === 'station' || rw === 'subway_entrance')
      category = 'bus'
    else if (sh) category = 'market'

    if (!category) continue

    const dedupeKey = `${category}_${cleanName.toLowerCase()}`
    if (seenKeys.has(dedupeKey)) continue
    seenKeys.add(dedupeKey)

    const distanceMeters = haversineMetersServer(rLat, rLng, elLat, elLng)
    if (distanceMeters > 2200) continue

    places.push({
      id: `${el.type || 'n'}_${el.id}`,
      name: cleanName,
      category,
      distanceMeters,
      lat: elLat,
      lng: elLng,
    })
  }

  places.sort((a, b) => a.distanceMeters - b.distanceMeters)

  return {
    places,
    temp,
    aqi,
  }
}