import type { LocaleCode } from '@/lib/i18n'

export type GeorgiaPlaceSuggestion = {
  id: string
  primaryText: string
  secondaryText: string
  street: string
  houseNumber: string
  areaId: string
  displayAreaLabel: string
  lat: number
  lng: number
  category: 'landmark' | 'street' | 'district' | 'city'
}

/**
 * تفعيل إضافة اللغة العربية (RTL Text Plugin) في MapLibre
 * لمنع ظهور الحروف العربية مقطعة أو معكوسة على خريطة الـ 3D
 */
export function ensureMapLibreRTLPlugin() {
  if (typeof window === 'undefined') return
  const maplibregl = (window as any).maplibregl
  if (!maplibregl) return

  try {
    const status = maplibregl.getRTLTextPluginStatus?.()
    if (status === 'unavailable') {
      maplibregl.setRTLTextPlugin(
        'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
        true
      )
    }
  } catch {}
}

/**
 * 3 أنماط خرائط احترافية ومجانية 100% بدون أي علامات مائية وبدون انقطاع عند التقريب:
 * 1. '3d': خريطة فيكتور ثلاثية الأبعاد للمباني والأبراج (OpenFreeMap 3D Vector)
 * 2. 'streets': خريطة الشوارع والمعالم الواضحة بدعم كامل للعربية (Google Streets HD)
 * 3. 'satellite': خريطة القمر الصناعي الهجينة بأسماء الشوارع وحتى أعلى درجة تقريب (Google Satellite Hybrid HD)
 */
export function getReliableGeorgiaMapStyle(
  mode: '3d' | 'streets' | 'satellite' = '3d'
): string | Record<string, any> {
  ensureMapLibreRTLPlugin()

  if (mode === 'satellite') {
    return {
      version: 8,
      sources: {
        'google-satellite-hybrid': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}',
          ],
          tileSize: 256,
          maxzoom: 20,
        },
      },
      layers: [
        {
          id: 'satellite-hybrid-layer',
          type: 'raster',
          source: 'google-satellite-hybrid',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    }
  }

  if (mode === 'streets') {
    return {
      version: 8,
      sources: {
        'google-streets-hd': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=m&hl=ar&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=m&hl=ar&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=m&hl=ar&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=m&hl=ar&x={x}&y={y}&z={z}',
          ],
          tileSize: 256,
          maxzoom: 20,
        },
      },
      layers: [
        {
          id: 'google-streets-layer',
          type: 'raster',
          source: 'google-streets-hd',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    }
  }

  return 'https://tiles.openfreemap.org/styles/liberty'
}

/**
 * تفعيل وتجسيم المباني ثلاثية الأبعاد (3D Buildings Extrusion)
 * مع إعطاء ارتفاع افتراضي للمباني التي ليس لها ارتفاع مسجل وإمالة الكاميرا بزاوية 3D واضحة
 */
export function apply3DBuildingsToMap(map: any) {
  if (!map) return
  ensureMapLibreRTLPlugin()

  try {
    map.resize()
    const currentZoom = map.getZoom?.() || 16
    map.easeTo({
      zoom: currentZoom < 15.8 ? 16.4 : currentZoom,
      pitch: 60,
      bearing: -18,
      duration: 650,
    })

    const style = map.getStyle()
    if (!style?.layers) return

    for (const layer of style.layers) {
      if (layer.type === 'fill-extrusion') {
        try {
          map.setLayerZoomRange(layer.id, 13, 24)
          map.setPaintProperty(layer.id, 'fill-extrusion-color', [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'render_height'], ['get', 'height'], 14],
            0,
            '#d6cfc7',
            25,
            '#b8c4d4',
            60,
            '#93a8c4',
          ])
          map.setPaintProperty(layer.id, 'fill-extrusion-height', [
            'coalesce',
            ['get', 'render_height'],
            ['get', 'height'],
            14,
          ])
          map.setPaintProperty(layer.id, 'fill-extrusion-base', [
            'coalesce',
            ['get', 'render_min_height'],
            ['get', 'min_height'],
            0,
          ])
          map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.92)
        } catch {}
      }
    }
  } catch {}
}

export function mapDetectedAddressToGeorgiaAreaId(
  cityRaw: string,
  suburbRaw: string
): string {
  const combined = `${cityRaw} ${suburbRaw}`.toLowerCase()
  if (
    combined.includes('batumi') ||
    combined.includes('ბათუმი') ||
    combined.includes('батуми') ||
    combined.includes('باتومي') ||
    combined.includes('باطومي')
  ) {
    if (combined.includes('gonio') || combined.includes('kvariati'))
      return 'Batumi - Gonio / Kvariati'
    if (combined.includes('chakvi') || combined.includes('mtsvane'))
      return 'Batumi - Chakvi / Green Cape'
    if (combined.includes('makhinjauri')) return 'Batumi - Makhinjauri'
    if (combined.includes('bagrationi')) return 'Batumi - Bagrationi'
    if (combined.includes('khimshiashvili')) return 'Batumi - Khimshiashvili'
    if (combined.includes('rustaveli')) return 'Batumi - Rustaveli Avenue'
    if (combined.includes('heroes') || combined.includes('shartava'))
      return 'Batumi - Alley of Heroes'
    return 'Batumi - New Boulevard'
  }
  if (
    combined.includes('kutaisi') ||
    combined.includes('ქუთაისი') ||
    combined.includes('кутаиси') ||
    combined.includes('كوتايسي')
  ) {
    return 'Kutaisi'
  }
  if (
    combined.includes('rustavi') ||
    combined.includes('რუსთავი') ||
    combined.includes('روستافي')
  )
    return 'Rustavi'
  if (
    combined.includes('bakuriani') ||
    combined.includes('ბაკურიანი') ||
    combined.includes('باكورياني')
  )
    return 'Bakuriani'
  if (
    combined.includes('gudauri') ||
    combined.includes('გუდაური') ||
    combined.includes('غوداوري')
  )
    return 'Gudauri'
  if (
    combined.includes('borjomi') ||
    combined.includes('ბორჯომი') ||
    combined.includes('بورجومي')
  )
    return 'Borjomi'
  if (
    combined.includes('telavi') ||
    combined.includes('kakheti') ||
    combined.includes('تيلافي')
  )
    return 'Kakheti - Telavi / Kvareli'

  if (
    combined.includes('vake') ||
    combined.includes('ვაკე') ||
    combined.includes('bagebi') ||
    combined.includes('فاكي')
  )
    return 'Tbilisi - Vake'
  if (
    combined.includes('vera') ||
    combined.includes('ვერა') ||
    combined.includes('فيرا')
  )
    return 'Tbilisi - Vera'
  if (
    combined.includes('mtatsminda') ||
    combined.includes('მთაწმინდა') ||
    combined.includes('متاتسميندا')
  )
    return 'Tbilisi - Mtatsminda'
  if (combined.includes('krtsanisi') || combined.includes('ortachala'))
    return 'Tbilisi - Ortachala'
  if (
    combined.includes('isani') ||
    combined.includes('ისანი') ||
    combined.includes('vazisubani') ||
    combined.includes('إيساني')
  )
    return 'Tbilisi - Isani'
  if (
    combined.includes('samgori') ||
    combined.includes('სამგორი') ||
    combined.includes('سامغوري')
  )
    return 'Tbilisi - Samgori'
  if (
    combined.includes('varketili') ||
    combined.includes('ვარკეთილი') ||
    combined.includes('فاركيتيلي')
  )
    return 'Tbilisi - Varketili'
  if (
    combined.includes('gldani') ||
    combined.includes('გლდანი') ||
    combined.includes('mukhiani') ||
    combined.includes('غلداني')
  )
    return 'Tbilisi - Gldani'
  if (
    combined.includes('nadzaladevi') ||
    combined.includes('temka') ||
    combined.includes('sanzona')
  )
    return 'Tbilisi - Nadzaladevi'
  if (
    combined.includes('didube') ||
    combined.includes('დიდუბე') ||
    combined.includes('ديدوبي')
  )
    return 'Tbilisi - Didube'
  if (
    combined.includes('chughureti') ||
    combined.includes('marjanishvili') ||
    combined.includes('مارجانيشفيلي')
  )
    return 'Tbilisi - Chugureti / Marjanishvili'
  if (
    combined.includes('avlabari') ||
    combined.includes('ავლაბარი') ||
    combined.includes('أفلاباري')
  )
    return 'Tbilisi - Avlabari'
  if (
    combined.includes('didi dighomi') ||
    combined.includes('dighomi') ||
    combined.includes('დიღომი') ||
    combined.includes('ديغومي')
  )
    return 'Tbilisi - Didi Digomi'
  if (combined.includes('lisi') || combined.includes('ليسي'))
    return 'Tbilisi - Lisi Lake'

  return 'Tbilisi - Saburtalo'
}

const INSTANT_GEORGIA_INDEX: Array<{
  keywords: string[]
  ar: string
  en: string
  ru: string
  ka: string
  subAr: string
  subEn: string
  subRu: string
  subKa: string
  street: string
  houseNumber?: string
  areaId: string
  lat: number
  lng: number
  category: GeorgiaPlaceSuggestion['category']
}> = [
  {
    keywords: ['tbilisi', 'تبليسي', 'تبلسي', 'تبيليسي', 'тбилиси', 'თბილისი'],
    ar: 'تبليسي — وسط المدينة (Tbilisi Center)',
    en: 'Tbilisi — City Center',
    ru: 'Тбилиси — Центр города',
    ka: 'თბილისი — ცენტრი',
    subAr: 'العاصمة الجورجية · كل أحياء تبليسي',
    subEn: 'Capital of Georgia · All Districts',
    subRu: 'Столица Грузии',
    subKa: 'საქართველოს დედაქალაქი',
    street: 'Shota Rustaveli Ave',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7151,
    lng: 44.787,
    category: 'city',
  },
  {
    keywords: ['batumi', 'باتومي', 'باطومي', 'بتومي', 'батуми', 'ბათუმი'],
    ar: 'باتومي — البوليفارد الجديد (Batumi)',
    en: 'Batumi — New Boulevard & Coast',
    ru: 'Батуми — Новый бульвар и побережье',
    ka: 'ბათუმი — ახალი ბულვარი',
    subAr: 'ساحل البحر الأسود، جورجيا',
    subEn: 'Black Sea Coast, Georgia',
    subRu: 'Черноморское побережье, Грузия',
    subKa: 'შავი ზღვის სანაპირო',
    street: 'Sherif Khimshiashvili Street',
    areaId: 'Batumi - New Boulevard',
    lat: 41.6385,
    lng: 41.6135,
    category: 'city',
  },
  {
    keywords: ['saburtalo', 'سابورتالو', 'صبورتالو', 'сабуртало', 'საბურთალო'],
    ar: 'حي سابورتالو (Saburtalo)',
    en: 'Saburtalo District',
    ru: 'Район Сабуртало (Saburtalo)',
    ka: 'საბურთალო',
    subAr: 'تبليسي، جورجيا',
    subEn: 'Tbilisi, Georgia',
    subRu: 'Тбилиси, Грузия',
    subKa: 'თბილისი, საქართველო',
    street: 'Pekini Ave',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7255,
    lng: 44.756,
    category: 'district',
  },
  {
    keywords: ['vake', 'فاكي', 'فاكى', 'واكي', 'ваке', 'ვაკე'],
    ar: 'حي فاكي الراقي (Vake District)',
    en: 'Vake District',
    ru: 'Район Ваке (Vake)',
    ka: 'ვაკე',
    subAr: 'تبليسي، جورجيا',
    subEn: 'Tbilisi, Georgia',
    subRu: 'Тбилиси, Грузия',
    subKa: 'თბილისი, საქართველო',
    street: 'Ilia Chavchavadze Ave',
    areaId: 'Tbilisi - Vake',
    lat: 41.7089,
    lng: 44.7634,
    category: 'district',
  },
  {
    keywords: ['dighomi', 'digomi', 'ديغومي', 'ديدي ديغومي', 'дигоми', 'დიღომი'],
    ar: 'حي ديدي ديغومي (Didi Dighomi)',
    en: 'Didi Dighomi District',
    ru: 'Диди Дигоми (Didi Dighomi)',
    ka: 'დიდი დიღომი',
    subAr: 'تبليسي، جورجيا',
    subEn: 'Tbilisi, Georgia',
    subRu: 'Тбилиси, Грузия',
    subKa: 'თბილისი, საქართველო',
    street: 'Petre Iberi Street',
    areaId: 'Tbilisi - Didi Digomi',
    lat: 41.7865,
    lng: 44.7582,
    category: 'district',
  },
  {
    keywords: ['isani', 'إيساني', 'ايساني', 'исани', 'ისანი'],
    ar: 'حي إيساني (Isani District)',
    en: 'Isani District',
    ru: 'Район Исани (Isani)',
    ka: 'ისანი',
    subAr: 'تبليسي، جورجيا',
    subEn: 'Tbilisi, Georgia',
    subRu: 'Тбилиси, Грузия',
    subKa: 'თბილისი, საქართველო',
    street: 'Ketevan Dedofali Ave',
    areaId: 'Tbilisi - Isani',
    lat: 41.6868,
    lng: 44.8412,
    category: 'district',
  },
  {
    keywords: ['varketili', 'فاركيتيلي', 'واركيتيلي', 'варкетили', 'ვარკეთილი'],
    ar: 'حي فاركيتيلي (Varketili)',
    en: 'Varketili District',
    ru: 'Район Варкетили (Varketili)',
    ka: 'ვარკეთილი',
    subAr: 'تبليسي، جورجيا',
    subEn: 'Tbilisi, Georgia',
    subRu: 'Тбилиси, Грузия',
    subKa: 'თბილისი, საქართველო',
    street: 'Javakheti Street',
    areaId: 'Tbilisi - Varketili',
    lat: 41.6892,
    lng: 44.8725,
    category: 'district',
  },
  {
    keywords: ['gldani', 'غلداني', 'جلداني', 'глдани', 'გლდანი'],
    ar: 'حي غلداني (Gldani District)',
    en: 'Gldani District',
    ru: 'Район Глдани (Gldani)',
    ka: 'გლდანი',
    subAr: 'تبليسي، جورجيا',
    subEn: 'Tbilisi, Georgia',
    subRu: 'Тбилиси, Грузия',
    subKa: 'თბილისი, საქართველო',
    street: 'Khizanishvili Street',
    areaId: 'Tbilisi - Gldani',
    lat: 41.7925,
    lng: 44.8125,
    category: 'district',
  },
  {
    keywords: [
      'orbi',
      'city',
      'أوربي',
      'اوربي',
      'khimshiashvili',
      'خيمشياشفيلي',
      'орби',
      'химшиашвили',
      'ორბი',
    ],
    ar: 'أبراج أوربي سيتي — شارع خيمشياشفيلي (Orbi City)',
    en: 'Orbi City — Sherif Khimshiashvili St',
    ru: 'Orbi City — ул. Шерифа Химшиашвили',
    ka: 'Orbi City — შერიფ ხიმშიაშვილის ქუჩა',
    subAr: 'البوليفارد الجديد، باتومي',
    subEn: 'New Boulevard, Batumi',
    subRu: 'Новый бульвар, Батуми',
    subKa: 'ახალი ბულვარი, ბათუმი',
    street: 'Sherif Khimshiashvili Street',
    houseNumber: '7b',
    areaId: 'Batumi - Khimshiashvili',
    lat: 41.6392,
    lng: 41.6152,
    category: 'landmark',
  },
  {
    keywords: ['merab', 'kostava', 'ميراب', 'كوستافا', 'костава', 'კოსტავა'],
    ar: 'شارع ميراب كوستافا (Merab Kostava St)',
    en: 'Merab Kostava Street',
    ru: 'Улица Мераба Костава',
    ka: 'მერაბ კოსტავას ქუჩა',
    subAr: 'سابورتالو / فيرا، تبليسي',
    subEn: 'Saburtalo / Vera, Tbilisi',
    subRu: 'Сабуртало / Вера, Тбилиси',
    subKa: 'საბურთალო / ვერა, თბილისი',
    street: 'Merab Kostava Street',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7167,
    lng: 44.7814,
    category: 'street',
  },
  {
    keywords: [
      'chavchavadze',
      'ilia',
      'شافشافادزه',
      'تشافتشافادزه',
      'чавчавадзе',
      'ჭავჭავაძე',
    ],
    ar: 'شارع إيليا تشافتشافادزه (Chavchavadze Ave)',
    en: 'Ilia Chavchavadze Avenue',
    ru: 'Проспект Ильи Чавчавадзе',
    ka: 'ილია ჭავჭავაძის გამზირი',
    subAr: 'فاكي، تبليسي',
    subEn: 'Vake, Tbilisi',
    subRu: 'Ваке, Тбилиси',
    subKa: 'ვაკე, თბილისი',
    street: 'Ilia Chavchavadze Ave',
    areaId: 'Tbilisi - Vake',
    lat: 41.7089,
    lng: 44.7634,
    category: 'street',
  },
  {
    keywords: ['rustaveli', 'shota', 'روستافيلي', 'руставели', 'რუსთაველი'],
    ar: 'شارع شوتا روستافيلي (Rustaveli Ave)',
    en: 'Shota Rustaveli Avenue',
    ru: 'Проспект Шота Руставели',
    ka: 'შოთა რუსთაველის გამზირი',
    subAr: 'وسط تبليسي، جورجيا',
    subEn: 'City Center, Tbilisi',
    subRu: 'Центр, Тбилиси',
    subKa: 'მთაწმინდა, თბილისი',
    street: 'Shota Rustaveli Ave',
    areaId: 'Tbilisi - Mtatsminda',
    lat: 41.6975,
    lng: 44.7985,
    category: 'street',
  },
  {
    keywords: ['vazha', 'pshavela', 'فاجا', 'بشافيلا', 'важа', 'ვაჟა-ფშაველა'],
    ar: 'شارع فاجا بشافيلا (Vazha-Pshavela Ave)',
    en: 'Vazha-Pshavela Avenue',
    ru: 'Проспект Важа-Пшавела',
    ka: 'ვაჟა-ფშაველას გამზირი',
    subAr: 'سابورتالو، تبليسي',
    subEn: 'Saburtalo, Tbilisi',
    subRu: 'Сабуртало, Тбилиси',
    subKa: 'საბურთალო, თბილისი',
    street: 'Vazha-Pshavela Ave',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7244,
    lng: 44.7428,
    category: 'street',
  },
  {
    keywords: ['pekini', 'pekin', 'بيكيني', 'пекини', 'პეკინი'],
    ar: 'شارع بيكيني (Pekini Ave)',
    en: 'Pekini Avenue',
    ru: 'Проспект Пекини',
    ka: 'პეკინის გამზირი',
    subAr: 'سابورتالو، تبليسي',
    subEn: 'Saburtalo, Tbilisi',
    subRu: 'Сабуртало, Тбилиси',
    subKa: 'საბურთალო, თბილისი',
    street: 'Pekini Ave',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7262,
    lng: 44.7695,
    category: 'street',
  },
  {
    keywords: [
      'agmashenebeli',
      'marjanishvili',
      'أغماشينيبيلي',
      'مارجانيشفيلي',
      'агмашенебели',
      'აღმაშენებელი',
    ],
    ar: 'شارع ديفيد أغماشينيبيلي (Marjanishvili)',
    en: 'David Agmashenebeli Ave (Marjanishvili)',
    ru: 'Проспект Давида Агмашенебели',
    ka: 'დავით აღმაშენებლის გამზირი',
    subAr: 'مارجانيشفيلي، تبليسي',
    subEn: 'Marjanishvili, Tbilisi',
    subRu: 'Марджанишвили, Тбилиси',
    subKa: 'ჩუღურეთი, თბილისი',
    street: 'David Agmashenebeli Ave',
    areaId: 'Tbilisi - Chugureti / Marjanishvili',
    lat: 41.7096,
    lng: 44.7972,
    category: 'street',
  },
  {
    keywords: [
      'paata',
      'datuashvili',
      'باتا',
      'داتواشفيلي',
      'датуашвили',
      'დათუაშვილი',
    ],
    ar: 'شارع باتا داتواشفيلي (Paata Datuashvili St)',
    en: 'Paata Datuashvili Street',
    ru: 'Улица Пааты Датуашвили',
    ka: 'პაატა დათუაშვილის ქუჩა',
    subAr: 'سابورتالو، تبليسي',
    subEn: 'Saburtalo, Tbilisi',
    subRu: 'Сабуртало, Тбилиси',
    subKa: 'საბურთალო, თბილისი',
    street: 'Paata Datuashvili Street',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7289,
    lng: 44.7185,
    category: 'street',
  },
  {
    keywords: [
      'king david',
      'كينج ديفيد',
      'aleksidze',
      'الكسيدزه',
      'кинг давид',
      'ალექსიძე',
    ],
    ar: 'أبراج كينج ديفيد — شارع ألكسيدزه (King David)',
    en: 'King David Residences — Merab Aleksidze St',
    ru: 'King David Residences — ул. Алексидзе',
    ka: 'King David — მერაბ ალექსიძის ქუჩა',
    subAr: 'سابورتالو، تبليسي',
    subEn: 'Saburtalo, Tbilisi',
    subRu: 'Сабуртало, Тбилиси',
    subKa: 'საბურთალო, თბილისი',
    street: 'Merab Aleksidze Street',
    houseNumber: '12',
    areaId: 'Tbilisi - Saburtalo',
    lat: 41.7186,
    lng: 44.7828,
    category: 'landmark',
  },
  {
    keywords: [
      'heroes',
      'alley',
      'shartava',
      'ممر الأبطال',
      'شارتافا',
      'аллея героев',
      'шартава',
    ],
    ar: 'ممر الأبطال — شارع شارتافا (Alley of Heroes)',
    en: 'Alley of Heroes — Zhiuli Shartava Ave',
    ru: 'Аллея Героев — пр. Жиули Шартава',
    ka: 'გმირთა ხეივანი — ჟიული შარტავას გამზირი',
    subAr: 'باتومي، جورجيا',
    subEn: 'Batumi, Georgia',
    subRu: 'Батуми, Грузия',
    subKa: 'ბათუმი, საქართველო',
    street: 'Zhiuli Shartava Avenue',
    areaId: 'Batumi - Alley of Heroes',
    lat: 41.6388,
    lng: 41.6224,
    category: 'street',
  },
  {
    keywords: [
      'white sails',
      'kaczynski',
      'وايت سيلز',
      'كاتشينسكي',
      'بوليفارد',
      'уайт сейлс',
    ],
    ar: 'منتجع وايت سيلز — البوليفارد الجديد (White Sails)',
    en: 'White Sails — Lech and Maria Kaczynski St',
    ru: 'White Sails — Новый бульвар, Батуми',
    ka: 'White Sails — ახალი ბულვარი, ბათუმი',
    subAr: 'البوليفارد الجديد، باتومي',
    subEn: 'New Boulevard, Batumi',
    subRu: 'Новый бульвар, Батуми',
    subKa: 'ახალი ბულვარი, ბათუმი',
    street: 'Lech and Maria Kaczynski Street',
    houseNumber: '5',
    areaId: 'Batumi - New Boulevard',
    lat: 41.6228,
    lng: 41.5992,
    category: 'landmark',
  },
  {
    keywords: ['kutaisi', 'كوتايسي', 'قطايسي', 'кутаиси', 'ქუთაისი'],
    ar: 'مدينة كوتايسي (Kutaisi)',
    en: 'Kutaisi City Center',
    ru: 'Кутаиси (Kutaisi)',
    ka: 'ქუთაისი',
    subAr: 'إيميريتي، جورجيا',
    subEn: 'Imereti, Georgia',
    subRu: 'Имерети, Грузия',
    subKa: 'იმერეთი, საქართველო',
    street: 'David Agmashenebeli Ave',
    areaId: 'Kutaisi',
    lat: 42.2679,
    lng: 42.718,
    category: 'city',
  },
  {
    keywords: ['bakuriani', 'باكورياني', 'بكراني', 'бакуриани', 'ბაკურიანი'],
    ar: 'منتجع باكورياني الجبلي (Bakuriani)',
    en: 'Bakuriani Ski Resort',
    ru: 'Бакуриани (Bakuriani)',
    ka: 'ბაკურიანი',
    subAr: 'منتجع التزلج، جورجيا',
    subEn: 'Ski Resort, Georgia',
    subRu: 'Горнолыжный курорт, Грузия',
    subKa: 'სათხილამურო კურორტი',
    street: 'Didveli Street',
    areaId: 'Bakuriani',
    lat: 41.7497,
    lng: 43.5325,
    category: 'city',
  },
  {
    keywords: ['gudauri', 'غوداوري', 'جوداوري', 'гудаури', 'გუდაური'],
    ar: 'منتجع غوداوري الجبلي (Gudauri)',
    en: 'New Gudauri Ski Resort',
    ru: 'Гудаури (New Gudauri)',
    ka: 'გუდაური',
    subAr: 'القوقاز، جورجيا',
    subEn: 'Caucasus Mountains, Georgia',
    subRu: 'Кавказ, Грузия',
    subKa: 'ყაზბეგის მუნიციპალიტეტი',
    street: 'New Gudauri',
    areaId: 'Gudauri',
    lat: 42.4779,
    lng: 44.4761,
    category: 'city',
  },
  {
    keywords: ['borjomi', 'بورجومي', 'برجومي', 'боржоми', 'ბორჯომი'],
    ar: 'مدينة ومنتجع بورجومي (Borjomi)',
    en: 'Borjomi Resort City',
    ru: 'Боржоми (Borjomi)',
    ka: 'ბორჯომი',
    subAr: 'سامتسخه-جافاخيتي، جورجيا',
    subEn: 'Samtskhe-Javakheti, Georgia',
    subRu: 'Грузия',
    subKa: 'საქართველო',
    street: '9 Aprilis Street',
    areaId: 'Borjomi',
    lat: 41.839,
    lng: 43.3891,
    category: 'city',
  },
  {
    keywords: ['rustavi', 'روستافي', 'رستافي', 'рустави', 'რუსთავი'],
    ar: 'مدينة روستافي (Rustavi)',
    en: 'Rustavi City',
    ru: 'Рустави (Rustavi)',
    ka: 'რუსთავი',
    subAr: 'بالقرب من تبليسي، جورجيا',
    subEn: 'Near Tbilisi, Georgia',
    subRu: 'Грузия',
    subKa: 'საქართველო',
    street: 'Megobroba Avenue',
    areaId: 'Rustavi',
    lat: 41.5495,
    lng: 44.9932,
    category: 'city',
  },
  {
    keywords: ['kobuleti', 'كوبوليتي', 'كبوليتي', 'кобулети', 'ქობულეთი'],
    ar: 'مدينة كوبوليتي الساحلية (Kobuleti)',
    en: 'Kobuleti Beach City',
    ru: 'Кобулети (Kobuleti)',
    ka: 'ქობულეთი',
    subAr: 'أجارا، ساحل البحر الأسود',
    subEn: 'Adjara, Black Sea Coast',
    subRu: 'Аджария, Грузия',
    subKa: 'აჭარა, საქართველო',
    street: 'David Agmashenebeli Ave',
    areaId: 'Batumi - Chakvi / Green Cape',
    lat: 41.8214,
    lng: 41.7766,
    category: 'city',
  },
]

function mapIndexItemToSuggestion(
  item: (typeof INSTANT_GEORGIA_INDEX)[0],
  idx: number,
  locale: LocaleCode
): GeorgiaPlaceSuggestion {
  return {
    id: `instant-${idx}-${item.lat}`,
    primaryText:
      locale === 'ar'
        ? item.ar
        : locale === 'ru'
          ? item.ru
          : locale === 'ka'
            ? item.ka
            : item.en,
    secondaryText:
      locale === 'ar'
        ? item.subAr
        : locale === 'ru'
          ? item.subRu
          : locale === 'ka'
            ? item.subKa
            : item.subEn,
    street: item.street,
    houseNumber: item.houseNumber || '',
    areaId: item.areaId,
    displayAreaLabel:
      locale === 'ar'
        ? item.subAr
        : locale === 'ru'
          ? item.subRu
          : locale === 'ka'
            ? item.subKa
            : item.subEn,
    lat: item.lat,
    lng: item.lng,
    category: item.category,
  }
}

export function getInstantLocalGeorgiaSuggestions(
  query: string,
  locale: LocaleCode = 'ar'
): GeorgiaPlaceSuggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return INSTANT_GEORGIA_INDEX.slice(0, 8).map((item, idx) =>
      mapIndexItemToSuggestion(item, idx, locale)
    )
  }

  return INSTANT_GEORGIA_INDEX.filter((item) => {
    return (
      item.keywords.some((k) => k.toLowerCase().includes(q)) ||
      item.ar.toLowerCase().includes(q) ||
      item.en.toLowerCase().includes(q) ||
      item.ru.toLowerCase().includes(q) ||
      item.ka.toLowerCase().includes(q) ||
      item.subAr.toLowerCase().includes(q) ||
      item.street.toLowerCase().includes(q)
    )
  }).map((item, idx) => mapIndexItemToSuggestion(item, idx, locale))
}

export async function searchGeorgiaPlacesLikeUber({
  query,
  cityContext,
  locale = 'ar',
  signal,
}: {
  query: string
  cityContext?: string
  locale?: LocaleCode
  signal?: AbortSignal
}): Promise<GeorgiaPlaceSuggestion[]> {
  const cleanQ = query.trim()
  const localMatches = getInstantLocalGeorgiaSuggestions(cleanQ, locale)
  if (cleanQ.length < 2) {
    return localMatches
  }

  const results: GeorgiaPlaceSuggestion[] = [...localMatches]
  const seenCoords = new Set(
    localMatches.map((m) => `${m.lat.toFixed(3)},${m.lng.toFixed(3)}`)
  )

  const photonLang = locale === 'en' || locale === 'ru' ? locale : 'en'

  try {
    const searchQ = cityContext ? `${cleanQ} ${cityContext}` : cleanQ
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      searchQ
    )}&bbox=40.0,41.0,46.8,43.6&limit=8&lang=${photonLang}`

    const res = await fetch(photonUrl, { signal })
    if (res.ok) {
      const data = await res.json()
      const features = Array.isArray(data?.features) ? data.features : []

      for (const feat of features) {
        const props = feat?.properties || {}
        const coords = feat?.geometry?.coordinates || []
        const lng = Number(coords[0])
        const lat = Number(coords[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

        if (
          props.countrycode &&
          String(props.countrycode).toUpperCase() !== 'GE'
        ) {
          continue
        }

        const coordKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
        if (seenCoords.has(coordKey)) continue
        seenCoords.add(coordKey)

        const city =
          props.city || props.town || props.county || props.state || 'Tbilisi'
        const district = props.district || props.suburb || props.locality || ''
        const streetName = props.street || props.name || district || city
        const houseNo = props.housenumber || ''
        const primaryTitle = props.name
          ? props.street && props.street !== props.name
            ? `${props.name} — ${props.street}`
            : props.name
          : `${streetName}${houseNo ? ' ' + houseNo : ''}`

        const areaId = mapDetectedAddressToGeorgiaAreaId(city, district)
        const secondaryParts = [district, city, 'Georgia'].filter(Boolean)

        results.push({
          id: `photon-${props.osm_id || coordKey}`,
          primaryText: primaryTitle,
          secondaryText: secondaryParts.join(', '),
          street: streetName,
          houseNumber: String(houseNo),
          areaId,
          displayAreaLabel: district ? `${city} — ${district}` : city,
          lat,
          lng,
          category: props.osm_key === 'highway' ? 'street' : 'landmark',
        })
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return results
  }

  if (results.length < 5) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&viewbox=40.0,43.6,46.8,41.0&bounded=1&addressdetails=1&limit=6&q=${encodeURIComponent(
        cleanQ
      )}`
      const nomRes = await fetch(nomUrl, {
        headers: { 'Accept-Language': `${locale},en;q=0.9,ka;q=0.8` },
        signal,
      })
      if (nomRes.ok) {
        const nomData = await nomRes.json()
        if (Array.isArray(nomData)) {
          for (const item of nomData) {
            const lat = Number(item.lat)
            const lng = Number(item.lon)
            const coordKey = `${lat.toFixed(3)},${lng.toFixed(3)}`
            if (seenCoords.has(coordKey)) continue
            seenCoords.add(coordKey)

            const addr = item.address || {}
            const city =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.state ||
              'Tbilisi'
            const suburb =
              addr.suburb || addr.neighbourhood || addr.city_district || ''
            const road =
              addr.road ||
              addr.pedestrian ||
              item.name ||
              item.display_name?.split(',')[0] ||
              cleanQ
            const houseNo = addr.house_number || ''
            const areaId = mapDetectedAddressToGeorgiaAreaId(city, suburb)

            results.push({
              id: `nom-${item.place_id || coordKey}`,
              primaryText: `${road}${houseNo ? ' ' + houseNo : ''}`,
              secondaryText: [suburb, city, 'Georgia']
                .filter(Boolean)
                .join(', '),
              street: road,
              houseNumber: houseNo,
              areaId,
              displayAreaLabel: suburb ? `${city} — ${suburb}` : city,
              lat,
              lng,
              category: 'street',
            })
          }
        }
      }
    } catch {}
  }

  return results.slice(0, 10)
}