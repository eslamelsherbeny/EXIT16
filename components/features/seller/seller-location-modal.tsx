'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpLeft,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  Compass,
  Loader2,
  Map,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  apply3DBuildingsToMap,
  getInstantLocalGeorgiaSuggestions,
  getReliableGeorgiaMapStyle,
  mapDetectedAddressToGeorgiaAreaId,
  searchGeorgiaPlacesLikeUber,
  type GeorgiaPlaceSuggestion,
} from '@/lib/georgia-uber-search'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'
import { getOptionLabel } from './seller-options-data'
import { RequiredLabel } from './seller-shared'

export const SIVRCE_POPULAR_CITIES = [
  { id: 'Tbilisi', ar: 'تبليسي', en: 'Tbilisi', ru: 'Тбилиси', ka: 'თბილისი', defaultAreaId: 'Tbilisi - Saburtalo', lat: 41.7225, lng: 44.7485 },
  { id: 'Batumi', ar: 'باتومي', en: 'Batumi', ru: 'Батуми', ka: 'ბათუმი', defaultAreaId: 'Batumi - New Boulevard', lat: 41.6355, lng: 41.6115 },
  { id: 'Kutaisi', ar: 'كوتايسي', en: 'Kutaisi', ru: 'Кутаиси', ka: 'ქუთაისი', defaultAreaId: 'Kutaisi', lat: 42.2679, lng: 42.7180 },
  { id: 'Rustavi', ar: 'روستافي', en: 'Rustavi', ru: 'Рустави', ka: 'რუსთავი', defaultAreaId: 'Rustavi', lat: 41.5495, lng: 44.9932 },
  { id: 'Kobuleti', ar: 'كوبوليتي', en: 'Kobuleti', ru: 'Кобулети', ka: 'ქობულეთი', defaultAreaId: 'Batumi - Chakvi / Green Cape', lat: 41.8214, lng: 41.7766 },
  { id: 'Bakuriani', ar: 'باكورياني', en: 'Bakuriani', ru: 'Бакуриани', ka: 'ბაკურიანი', defaultAreaId: 'Bakuriani', lat: 41.7497, lng: 43.5325 },
  { id: 'Gudauri', ar: 'غوداوري', en: 'Gudauri', ru: 'Гудаури', ka: 'გუდაური', defaultAreaId: 'Gudauri', lat: 42.4779, lng: 44.4761 },
  { id: 'Borjomi', ar: 'بورجومي', en: 'Borjomi', ru: 'Боржоми', ka: 'ბორჯომი', defaultAreaId: 'Borjomi', lat: 41.8390, lng: 43.3891 },
  { id: 'Telavi', ar: 'تيلافي', en: 'Telavi', ru: 'Телави', ka: 'თელავი', defaultAreaId: 'Kakheti - Telavi / Kvareli', lat: 41.9198, lng: 45.4731 },
  { id: 'Gori', ar: 'غوري', en: 'Gori', ru: 'Гори', ka: 'გორი', defaultAreaId: 'Tbilisi - Didi Digomi', lat: 41.9842, lng: 44.1158 },
]

export const SIVRCE_MUNICIPALITIES_AZ: Record<string, string[]> = {
  A: [
    'Abasha Municipality',
    'Achalkalaki Municipality',
    'Adigeni Municipality',
    'Akhaltsikhe Municipality',
    'Akhmeta Municipality',
    'Ambrolauri Municipality',
    'Aspindza Municipality',
  ],
  B: ['Baghdati Municipality', 'Bolnisi Municipality', 'Borjomi Municipality'],
  C: [
    'Chiatura Municipality',
    'Chkhorotsqu Municipality',
    'Chokhatauri Municipality',
  ],
  D: [
    'Dedoplistsqaro Municipality',
    'Dmanisi Municipality',
    'Dusheti Municipality',
  ],
  G: [
    'Gardabani Municipality',
    'Gori Municipality',
    'Gurjaani Municipality',
  ],
  K: [
    'Kareli Municipality',
    'Kaspi Municipality',
    'Keda Municipality',
    'Khashuri Municipality',
    'Khelvachauri Municipality',
    'Kobuleti Municipality',
    'Kutaisi Municipality',
  ],
  L: ['Lagodekhi Municipality', 'Lanchkhuti Municipality'],
  M: [
    'Marneuli Municipality',
    'Martvili Municipality',
    'Mestia Municipality',
    'Mtskheta Municipality',
  ],
  O: ['Oni Municipality', 'Ozurgeti Municipality'],
  Q: ['Qazbegi Municipality', 'Qvareli Municipality'],
  S: [
    'Sagarejo Municipality',
    'Samtredia Municipality',
    'Senaki Municipality',
    'Sighnaghi Municipality',
  ],
  T: [
    'Telavi Municipality',
    'Tetritsqaro Municipality',
    'Tianeti Municipality',
    'Tskaltubo Municipality',
  ],
  Z: ['Zestafoni Municipality', 'Zugdidi Municipality'],
}

export const SIVRCE_SIDEBAR_CITIES = [
  'Tbilisi',
  'Batumi',
  'Kutaisi',
  'Rustavi',
  'Kobuleti',
  'Bakuriani',
  'Gudauri',
  'Borjomi',
  'Telavi',
  'Gori',
  'Mtskheta',
  'Zugdidi',
  'Poti',
  'Marneuli',
  'Gardabani',
  'Khelvachauri',
  'Qazbegi',
  'Sighnaghi',
  'Qvareli',
  'Tskaltubo',
  'Ureki',
  'Shekvetili',
  'Chakvi',
  'Gonio',
  'Kvariati',
]

export const TBILISI_DISTRICT_GROUPS: Array<{
  group: string
  items: Array<{ name: string; areaId: string }>
}> = [
  {
    group: 'Vake-Saburtalo',
    items: [
      { name: 'Vake (فاكي)', areaId: 'Tbilisi - Vake' },
      { name: 'Saburtalo (سابورتالو)', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Vashlijvari', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Vedzisi', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Lisi Lake (بحيرة ليسي)', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Bagebi', areaId: 'Tbilisi - Vake' },
      { name: 'Nutsubidze Plato', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Didi Dighomi (ديدي ديغومي)', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Vazha-Pshavela', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Dighomi 1-9', areaId: 'Tbilisi - Didi Digomi' },
    ],
  },
  {
    group: 'Isani-Samgori',
    items: [
      { name: 'Varketili (فاركيتيلي)', areaId: 'Tbilisi - Varketili' },
      { name: 'Isani (إيساني)', areaId: 'Tbilisi - Isani' },
      { name: 'Moskovis Ave.', areaId: 'Tbilisi - Samgori' },
      { name: 'Vazisubani', areaId: 'Tbilisi - Isani' },
      { name: 'Samgori (سامغوري)', areaId: 'Tbilisi - Samgori' },
      { name: 'Ponichala', areaId: 'Tbilisi - Krtsanisi' },
    ],
  },
  {
    group: 'Gldani-Nadzaladevi',
    items: [
      { name: 'Gldani (غلداني)', areaId: 'Tbilisi - Gldani' },
      { name: 'Tbilisi Sea (بحر تبليسي)', areaId: 'Tbilisi - Tbilisi Sea' },
      { name: 'Temka', areaId: 'Tbilisi - Nadzaladevi' },
      { name: 'Mukhiani', areaId: 'Tbilisi - Gldani' },
      { name: 'Nadzaladevi', areaId: 'Tbilisi - Nadzaladevi' },
      { name: 'Sanzona', areaId: 'Tbilisi - Nadzaladevi' },
    ],
  },
  {
    group: 'Didube-Chughureti',
    items: [
      { name: 'Didube (ديدوبي)', areaId: 'Tbilisi - Didube' },
      { name: 'Dighmis Masivi', areaId: 'Tbilisi - Digomi Massive' },
      { name: 'Marjanishvili (مارجانيشفيلي)', areaId: 'Tbilisi - Chugureti / Marjanishvili' },
      { name: 'Chughureti', areaId: 'Tbilisi - Chugureti / Marjanishvili' },
    ],
  },
  {
    group: 'Old Tbilisi (تبليسي القديمة)',
    items: [
      { name: 'Old Tbilisi (تبليسي القديمة)', areaId: 'Tbilisi - Old Tbilisi' },
      { name: 'Vera (فيرا)', areaId: 'Tbilisi - Vera' },
      { name: 'Krtsanisi (كرتسانيسي)', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Mtatsminda (متاتسميندا)', areaId: 'Tbilisi - Mtatsminda' },
      { name: 'Sololaki', areaId: 'Tbilisi - Old Tbilisi' },
      { name: 'Avlabari (أفلاباري)', areaId: 'Tbilisi - Avlabari' },
      { name: 'Ortachala (أورتاتشالا)', areaId: 'Tbilisi - Ortachala' },
    ],
  },
]

export const BATUMI_DISTRICTS_LIST: Array<{ name: string; areaId: string }> = [
  { name: 'New Boulevard (البوليفارد الجديد)', areaId: 'Batumi - New Boulevard' },
  { name: 'Old Boulevard (البوليفارد القديم)', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Alley of Heroes (ممر الأبطال)', areaId: 'Batumi - Alley of Heroes' },
  { name: 'Rustaveli Ave (شارع روستافيلي)', areaId: 'Batumi - Rustaveli Avenue' },
  { name: 'Khimshiashvili (خيمشياشفيلي / أوربي)', areaId: 'Batumi - Khimshiashvili' },
  { name: 'Bagrationi (باغراتيوني)', areaId: 'Batumi - Bagrationi' },
  { name: 'Airport District / Adlia', areaId: 'Batumi - Airport District' },
  { name: 'Gonio / Kvariati (غونيو / كفارياتي)', areaId: 'Batumi - Gonio / Kvariati' },
  { name: 'Makhinjauri (ماخينجاوري)', areaId: 'Batumi - Makhinjauri' },
  { name: 'Chakvi / Green Cape (تشاكفي)', areaId: 'Batumi - Chakvi / Green Cape' },
]

export const CITY_PRESET_STREETS: Record<string, string[]> = {
  Kutaisi: [
    'David Agmashenebeli Ave.',
    'Ilia Chavchavadze Ave.',
    'Shota Rustaveli Ave.',
    'Tamar Mepe St.',
    'Tsereteli St.',
  ],
  Rustavi: [
    'Megobroba Ave.',
    'Shartava Ave.',
    'Kostava Ave.',
    'Pirosmani St.',
  ],
  Kobuleti: [
    'David Agmashenebeli Ave.',
    'Tamar Mepe Sanapiro',
    'Rustaveli St.',
  ],
  Bakuriani: [
    'Agmashenebeli St.',
    'Tamar Mepe St.',
    'Kokhta-Mitarbi Rd.',
    'Didveli St.',
  ],
  Gudauri: [
    'New Gudauri (RedCo)',
    'Upper Gudauri',
    'Lower Gudauri',
  ],
}

export const GENERIC_MUNICIPALITY_STREETS = [
  'Shota Rustavelis St.',
  'David Agmasheneblis Ave.',
  'Ilia Chavchavadzis St.',
  'Tamar Mepis St.',
  'Merab Kostava St.',
  'Vazha-Pshavelas Ave.',
  'Pekini Ave.',
]

const MODAL_MAP_I18N: Record<
  LocaleCode,
  {
    openMapStepBtn: string
    openMapShortBtn: string
    backToListBtn: string
    backToListShortBtn: string
    dragMapHint: string
    readingAddressText: string
    flyingToPlaceLoading: string
    detectedStreetLabel: string
    detectedHouseLabel: string
    confirmExactPinBtn: string
    noResultsTryMapText: string
    satelliteViewBtn: string
    map3dViewBtn: string
    streetsViewBtn: string
  }
> = {
  ar: {
    openMapStepBtn: 'تحديد الموقع الدقيق على الخريطة 3D',
    openMapShortBtn: 'الخريطة 3D',
    backToListBtn: 'العودة لقائمة المدن والأحياء',
    backToListShortBtn: 'قائمة المدن',
    dragMapHint:
      'حرّك الخريطة أو اضغط على المبنى — سيتم التقاط اسم الشارع ورقم العقار تلقائياً',
    readingAddressText: 'جاري قراءة اسم الشارع ورقم المبنى...',
    flyingToPlaceLoading: 'جاري الانتقال للموقع وتحميل الخريطة...',
    detectedStreetLabel: 'الشارع المحدد:',
    detectedHouseLabel: 'رقم المبنى:',
    confirmExactPinBtn: 'تأكيد هذا الموقع والعنوان ✓',
    noResultsTryMapText: 'اضغط هنا لتحديد موقع العقار مباشرة من الخريطة 3D',
    satelliteViewBtn: '🛰️ قمر صناعي',
    map3dViewBtn: '🏢 خريطة 3D',
    streetsViewBtn: '🗺️ شوارع',
  },
  en: {
    openMapStepBtn: 'Set exact location on 3D Map',
    openMapShortBtn: '3D Map',
    backToListBtn: 'Back to cities & districts list',
    backToListShortBtn: 'Cities List',
    dragMapHint:
      'Drag the map or tap on the building — street name and building number update automatically',
    readingAddressText: 'Reading street name & building number...',
    flyingToPlaceLoading: 'Flying to location and loading map...',
    detectedStreetLabel: 'Detected Street:',
    detectedHouseLabel: 'Building Nº:',
    confirmExactPinBtn: 'Confirm Exact Location ✓',
    noResultsTryMapText: 'Click here to set the location directly on the 3D map',
    satelliteViewBtn: '🛰️ Satellite',
    map3dViewBtn: '🏢 3D Map',
    streetsViewBtn: '🗺️ Streets',
  },
  ru: {
    openMapStepBtn: 'Указать точную локацию на 3D-карте',
    openMapShortBtn: '3D-карта',
    backToListBtn: 'Назад к списку городов и районов',
    backToListShortBtn: 'Список городов',
    dragMapHint:
      'Передвигайте карту или нажмите на дом — улица и номер дома определятся автоматически',
    readingAddressText: 'Определение улицы и номера дома...',
    flyingToPlaceLoading: 'Переход к выбранной локации...',
    detectedStreetLabel: 'Улица:',
    detectedHouseLabel: 'Дом Nº:',
    confirmExactPinBtn: 'Подтвердить эту локацию ✓',
    noResultsTryMapText: 'Нажмите здесь, чтобы указать точку на 3D-карте',
    satelliteViewBtn: '🛰️ Спутник',
    map3dViewBtn: '🏢 3D-карта',
    streetsViewBtn: '🗺️ Схема',
  },
  ka: {
    openMapStepBtn: 'მონიშნეთ ზუსტი მდებარეობა 3D რუკაზე',
    openMapShortBtn: '3D რუკა',
    backToListBtn: 'უკან ქალაქების სიაში',
    backToListShortBtn: 'ქალაქების სია',
    dragMapHint:
      'გადაადგილეთ რუკა ან დააჭირეთ შენობას — ქუჩა და სახლის ნომერი ავტომატურად შეივსება',
    readingAddressText: 'მისამართის წაკითხვა...',
    flyingToPlaceLoading: 'მდებარეობაზე გადასვლა...',
    detectedStreetLabel: 'ქუჩა:',
    detectedHouseLabel: 'სახლის Nº:',
    confirmExactPinBtn: 'მდებარეობის დადასტურება ✓',
    noResultsTryMapText: 'დააჭირეთ 3D რუკაზე მოსანიშნად',
    satelliteViewBtn: '🛰️ სატელიტი',
    map3dViewBtn: '🏢 3D რუკა',
    streetsViewBtn: '🗺️ ქუჩები',
  },
}

function loadModalMapLibre(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('SSR')
    if ((window as any).maplibregl) return resolve((window as any).maplibregl)

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

export function SivrceLocationModalPicker({
  label,
  value,
  displayText,
  onSelectLocation,
  error,
  customTrigger,
}: {
  label?: string
  value: string
  displayText?: string
  onSelectLocation: (payload: {
    areaId: string
    displayLabel: string
    street?: string
    houseNumber?: string
    lat?: number
    lng?: number
  }) => void
  error?: string
  showEverywhereOption?: boolean
  customTrigger?: (props: {
    onClick: () => void
    resolvedDisplay: string
  }) => React.ReactNode
}) {
  const { t: dict, locale, dir } = useTranslation()
  const fT = getSellerFormTranslations(locale as LocaleCode, dict)
  const mT = fT.locationModal
  const mapI18n = MODAL_MAP_I18N[locale as LocaleCode] || MODAL_MAP_I18N.ar

  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'browse' | 'map'>('browse')
  const [mapStyleMode, setMapStyleMode] = useState<
    '3d' | 'streets' | 'satellite'
  >('3d')
  const [isPitch3D, setIsPitch3D] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [checkedSubItem, setCheckedSubItem] = useState<{
    name: string
    areaId: string
    isStreet?: boolean
    houseNumber?: string
    lat?: number
    lng?: number
  } | null>(null)

  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsNotice, setGpsNotice] = useState('')
  const [liveGeoResults, setLiveGeoResults] = useState<
    GeorgiaPlaceSuggestion[]
  >([])
  const [searchingGeo, setSearchingGeo] = useState(false)
  const [cityStreetsLive, setCityStreetsLive] = useState<string[]>([])
  const [isDraggingPin, setIsDraggingPin] = useState(false)
  const [mapTransitionLoading, setMapTransitionLoading] = useState(false)

  const modalMapContainerRef = useRef<HTMLDivElement | null>(null)
  const modalMapInstanceRef = useRef<any>(null)
  const isModalFlyingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const defaultCoords = getCoordinatesForArea(value || 'Tbilisi - Saburtalo')
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultCoords.lat,
    lng: defaultCoords.lng,
  })
  const pinCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: defaultCoords.lat,
    lng: defaultCoords.lng,
  })

  const [pinReadingAddress, setPinReadingAddress] = useState(false)
  const [pinResolvedData, setPinResolvedData] = useState<{
    areaId: string
    displayLabel: string
    street: string
    houseNumber: string
  }>({
    areaId: value || 'Tbilisi - Saburtalo',
    displayLabel:
      displayText ||
      getLocalizedGeorgiaAreaName(
        value || 'Tbilisi - Saburtalo',
        locale as LocaleCode
      ),
    street: '',
    houseNumber: '',
  })

  const updatePinCoords = useCallback((lat: number, lng: number) => {
    pinCoordsRef.current = { lat, lng }
    setPinCoords({ lat, lng })
  }, [])

  const resolvedDisplay =
    displayText ||
    (value ? getLocalizedGeorgiaAreaName(value, locale as LocaleCode) : '')

  const filteredSidebarCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return SIVRCE_SIDEBAR_CITIES
    return SIVRCE_SIDEBAR_CITIES.filter((c) => c.toLowerCase().includes(q))
  }, [searchQuery])

  useEffect(() => {
    if (
      !activeCity ||
      activeCity.toLowerCase() === 'tbilisi' ||
      activeCity.toLowerCase() === 'batumi'
    ) {
      setCityStreetsLive([])
      return
    }
    const preset = CITY_PRESET_STREETS[activeCity]
    setCityStreetsLive(preset || GENERIC_MUNICIPALITY_STREETS)
  }, [activeCity])

  const reverseGeocodeModalPin = useCallback(
    async (lat: number, lng: number, fly = false) => {
      updatePinCoords(lat, lng)
      if (fly && modalMapInstanceRef.current) {
        isModalFlyingRef.current = true
        modalMapInstanceRef.current.flyTo({
          center: [lng, lat],
          zoom: 16.8,
          pitch: isPitch3D && mapStyleMode === '3d' ? 56 : 0,
          bearing: isPitch3D && mapStyleMode === '3d' ? -15 : 0,
          duration: 750,
        })
        setTimeout(() => {
          isModalFlyingRef.current = false
        }, 850)
      }

      setPinReadingAddress(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': `${locale},en;q=0.9,ka;q=0.8` } }
        )
        const data = await res.json()
        const addr = data?.address || {}
        const detectedCity =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.state ||
          activeCity ||
          'Tbilisi'
        const detectedSuburb =
          addr.suburb ||
          addr.neighbourhood ||
          addr.city_district ||
          addr.quarter ||
          ''
        const detectedStreet =
          addr.road ||
          addr.pedestrian ||
          addr.footway ||
          addr.residential ||
          data?.name ||
          ''
        const detectedHouse = addr.house_number || ''

        const areaId = mapDetectedAddressToGeorgiaAreaId(
          detectedCity,
          detectedSuburb
        )
        const labelParts = [
          detectedCity,
          detectedSuburb,
          detectedStreet
            ? `${detectedStreet}${detectedHouse ? ' ' + detectedHouse : ''}`
            : '',
        ].filter(Boolean)

        setPinResolvedData({
          areaId,
          displayLabel:
            labelParts.length > 0
              ? labelParts.join(' ، ')
              : getLocalizedGeorgiaAreaName(areaId, locale as LocaleCode),
          street: detectedStreet,
          houseNumber: detectedHouse,
        })
      } catch {
        // احتفاظ بآخر عنوان معروف
      } finally {
        setPinReadingAddress(false)
      }
    },
    [activeCity, isPitch3D, mapStyleMode, locale, updatePinCoords]
  )

  useEffect(() => {
    if (!open || viewMode !== 'map') return
    let isMounted = true
    let map: any = null

    setMapTransitionLoading(true)
    loadModalMapLibre()
      .then((maplibregl) => {
        if (!isMounted || !modalMapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: modalMapContainerRef.current,
          style: getReliableGeorgiaMapStyle(mapStyleMode),
          center: [pinCoordsRef.current.lng, pinCoordsRef.current.lat],
          zoom: 16.4,
          pitch: isPitch3D && mapStyleMode === '3d' ? 56 : 0,
          bearing: isPitch3D && mapStyleMode === '3d' ? -15 : 0,
          attributionControl: false,
        })

        modalMapInstanceRef.current = map

        map.on('load', () => {
          if (mapStyleMode === '3d') {
            apply3DBuildingsToMap(map)
          } else {
            map.resize()
          }
          setMapTransitionLoading(false)
          setTimeout(() => map?.resize(), 150)
          setTimeout(() => map?.resize(), 350)
        })

        map.on('error', () => {
          setMapTransitionLoading(false)
        })

        map.on('dragstart', () => {
          setIsDraggingPin(true)
        })

        map.on('click', (e: any) => {
          const nextLat = Number(e?.lngLat?.lat)
          const nextLng = Number(e?.lngLat?.lng)
          if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
            void reverseGeocodeModalPin(nextLat, nextLng, true)
          }
        })

        map.on('dragend', () => {
          setIsDraggingPin(false)
          if (isModalFlyingRef.current) return
          const c = map.getCenter()
          if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
            void reverseGeocodeModalPin(Number(c.lat), Number(c.lng), false)
          }
        })
      })
      .catch(() => {
        setMapTransitionLoading(false)
      })

    const safetyTimer = setTimeout(() => {
      if (isMounted) setMapTransitionLoading(false)
    }, 2200)

    return () => {
      isMounted = false
      clearTimeout(safetyTimer)
      if (map) {
        map.remove()
        modalMapInstanceRef.current = null
      }
    }
  }, [open, viewMode, mapStyleMode])

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setLiveGeoResults([])
      setSearchingGeo(false)
      return
    }

    const instantLocal = getInstantLocalGeorgiaSuggestions(
      q,
      locale as LocaleCode
    )
    setLiveGeoResults(instantLocal)

    if (q.length < 2) {
      setSearchingGeo(false)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearchingGeo(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchGeorgiaPlacesLikeUber({
          query: q,
          cityContext: activeCity || undefined,
          locale: locale as LocaleCode,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) {
          setLiveGeoResults(results)
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingGeo(false)
        }
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery, activeCity, locale])

  const openInteractiveMapForSelection = async (target: {
    areaId: string
    displayLabel: string
    street?: string
    houseNumber?: string
    lat?: number
    lng?: number
    searchQueryForCoords?: string
  }) => {
    setMapTransitionLoading(true)
    setViewMode('map')

    let resolvedLat = target.lat
    let resolvedLng = target.lng

    if (!resolvedLat || !resolvedLng) {
      const areaFallback = getCoordinatesForArea(
        target.areaId || 'Tbilisi - Saburtalo'
      )
      resolvedLat = areaFallback.lat
      resolvedLng = areaFallback.lng

      if (target.searchQueryForCoords) {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&limit=1&q=${encodeURIComponent(
              target.searchQueryForCoords
            )}`
          )
          const d = await r.json()
          if (Array.isArray(d) && d[0]) {
            resolvedLat = Number(d[0].lat)
            resolvedLng = Number(d[0].lon)
          }
        } catch {}
      }
    }

    updatePinCoords(resolvedLat, resolvedLng)
    setPinResolvedData({
      areaId: target.areaId || 'Tbilisi - Saburtalo',
      displayLabel: target.displayLabel,
      street: target.street || '',
      houseNumber: target.houseNumber || '',
    })

    if (modalMapInstanceRef.current) {
      isModalFlyingRef.current = true
      modalMapInstanceRef.current.flyTo({
        center: [resolvedLng, resolvedLat],
        zoom: 16.6,
        pitch: isPitch3D && mapStyleMode === '3d' ? 56 : 0,
        bearing: isPitch3D && mapStyleMode === '3d' ? -15 : 0,
        duration: 750,
      })
      setTimeout(() => {
        isModalFlyingRef.current = false
        setMapTransitionLoading(false)
      }, 850)
    } else {
      setTimeout(() => setMapTransitionLoading(false), 700)
    }

    if (!target.street) {
      void reverseGeocodeModalPin(resolvedLat, resolvedLng, false)
    }
  }

  const handleDetectRealGPS = () => {
    setGpsNotice('')
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsNotice(mT.gpsUnsupportedError)
      return
    }

    setGpsLoading(true)
    setMapTransitionLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsLoading(false)
        setViewMode('map')
        const rawLat = pos.coords.latitude
        const rawLng = pos.coords.longitude
        await reverseGeocodeModalPin(rawLat, rawLng, true)
        setMapTransitionLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        setMapTransitionLoading(false)
        setGpsNotice(
          err.code === 1 ? mT.gpsPermissionError : mT.gpsSignalError
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // زوم ثابت حول نقطة الدبوس بالمللي حتى لا ينحرف السهم لمكان آخر عند التكبير
  const handleModalZoom = (delta: number) => {
    const map = modalMapInstanceRef.current
    if (!map) return
    isModalFlyingRef.current = true
    const nextZoom = Math.min(19.5, Math.max(9, (map.getZoom() || 16) + delta))
    map.easeTo({
      center: [pinCoordsRef.current.lng, pinCoordsRef.current.lat],
      zoom: nextZoom,
      duration: 300,
    })
    setTimeout(() => {
      isModalFlyingRef.current = false
    }, 350)
  }

  const toggleModal3dPitch = () => {
    const next = !isPitch3D
    setIsPitch3D(next)
    modalMapInstanceRef.current?.easeTo({
      center: [pinCoordsRef.current.lng, pinCoordsRef.current.lat],
      pitch: next ? 56 : 0,
      bearing: next ? -15 : 0,
      duration: 450,
    })
  }

  const handleFinalConfirmFromModal = () => {
    if (viewMode === 'map') {
      onSelectLocation({
        areaId: pinResolvedData.areaId,
        displayLabel: pinResolvedData.displayLabel,
        street: pinResolvedData.street || undefined,
        houseNumber: pinResolvedData.houseNumber || undefined,
        lat: pinCoords.lat,
        lng: pinCoords.lng,
      })
      setOpen(false)
      return
    }

    if (checkedSubItem) {
      const cityPrefix = activeCity || 'Tbilisi'
      void openInteractiveMapForSelection({
        areaId: checkedSubItem.areaId,
        displayLabel: `${checkedSubItem.name}, ${cityPrefix}`,
        street: checkedSubItem.isStreet ? checkedSubItem.name : undefined,
        houseNumber: checkedSubItem.houseNumber,
        lat: checkedSubItem.lat,
        lng: checkedSubItem.lng,
        searchQueryForCoords: `${checkedSubItem.name.split('(')[0].trim()}, ${cityPrefix}, Georgia`,
      })
      return
    }

    if (activeCity) {
      const pop = SIVRCE_POPULAR_CITIES.find(
        (c) => c.id.toLowerCase() === activeCity.toLowerCase()
      )
      void openInteractiveMapForSelection({
        areaId: pop?.defaultAreaId || 'Tbilisi - Saburtalo',
        displayLabel: activeCity,
        lat: pop?.lat,
        lng: pop?.lng,
        searchQueryForCoords: `${activeCity}, Georgia`,
      })
      return
    }

    setViewMode('map')
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <Label className="text-start text-xs font-extrabold text-[#0a1122]">
          <RequiredLabel>{label}</RequiredLabel>
        </Label>
      ) : null}

      {customTrigger ? (
        customTrigger({
          onClick: () => {
            setViewMode('browse')
            setOpen(true)
          },
          resolvedDisplay,
        })
      ) : (
        <button
          type="button"
          onClick={() => {
            setViewMode('browse')
            setOpen(true)
          }}
          className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-start text-xs font-bold transition sm:text-sm ${
            error
              ? 'border-2 border-red-500 bg-red-50/20 text-red-700'
              : !value
                ? 'border-orange-300 bg-white text-slate-400 hover:border-[#ea580c]'
                : 'border-slate-200 bg-white text-[#0a1122] hover:border-[#2563eb]'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin
              className={`size-4 shrink-0 ${
                error
                  ? 'text-red-500'
                  : value
                    ? 'text-[#2563eb]'
                    : 'text-slate-400'
              }`}
            />
            <span className="truncate">
              {resolvedDisplay || mT.searchPlaceholder}
            </span>
          </span>
          {value ? (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onSelectLocation({
                  areaId: '',
                  displayLabel: '',
                  street: '',
                  houseNumber: '',
                })
                setActiveCity(null)
                setCheckedSubItem(null)
              }}
              className="flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-3.5" />
            </span>
          ) : (
            <ChevronDown className="size-4 text-slate-400" />
          )}
        </button>
      )}

      {open && (
        <div
          dir={dir}
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/65 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[94vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-t-[26px] bg-white shadow-2xl sm:rounded-[26px]"
          >
            {/* هيدر رشيق ومتجاوب 100% على الموبايل والكمبيوتر */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-2">
                {(activeCity || viewMode === 'map') && (
                  <button
                    type="button"
                    onClick={() => {
                      if (viewMode === 'map') {
                        setViewMode('browse')
                      } else {
                        setActiveCity(null)
                        setCheckedSubItem(null)
                      }
                    }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                  </button>
                )}
                <h3 className="truncate text-sm font-black text-[#0a1122] sm:text-base">
                  {viewMode === 'map' ? mapI18n.openMapStepBtn : mT.title}
                </h3>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode(viewMode === 'map' ? 'browse' : 'map')
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold whitespace-nowrap text-[#2563eb] transition hover:bg-blue-100 sm:text-xs"
                >
                  <span className="sm:hidden">
                    {viewMode === 'map'
                      ? mapI18n.backToListShortBtn
                      : mapI18n.openMapShortBtn}
                  </span>
                  <span className="hidden sm:inline">
                    {viewMode === 'map'
                      ? mapI18n.backToListBtn
                      : mapI18n.openMapStepBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* شريط البحث السريع */}
            <div className="border-b border-slate-100 px-4 py-2.5 sm:px-6 sm:py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={mT.searchPlaceholder}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 ps-10 pe-10 text-xs font-semibold text-[#0a1122] focus:border-[#2563eb] focus:bg-white focus:outline-none sm:h-11 sm:text-sm"
                />
                {searchingGeo ? (
                  <Loader2 className="absolute top-1/2 end-3.5 size-4 -translate-y-1/2 animate-spin text-[#2563eb]" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 end-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>

              {searchQuery.trim().length >= 1 && (
                <div className="mt-2 max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {liveGeoResults.length > 0 ? (
                    liveGeoResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          void openInteractiveMapForSelection({
                            areaId: item.areaId,
                            displayLabel: item.primaryText,
                            street: item.street || undefined,
                            houseNumber: item.houseNumber || undefined,
                            lat: item.lat,
                            lng: item.lng,
                          })
                        }}
                        className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-start transition hover:bg-blue-50/70"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                              item.category === 'landmark'
                                ? 'bg-amber-50 text-[#ea580c]'
                                : 'bg-blue-50 text-[#2563eb]'
                            }`}
                          >
                            {item.category === 'landmark' ? (
                              <Sparkles className="size-4" />
                            ) : (
                              <MapPin className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-[#0a1122] sm:text-sm">
                              {item.primaryText}
                            </p>
                            <p className="truncate text-[11px] font-medium text-slate-500">
                              {item.secondaryText}
                            </p>
                          </div>
                        </div>
                        <ArrowUpLeft className="size-4 shrink-0 text-slate-400" />
                      </button>
                    ))
                  ) : searchingGeo ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#2563eb]">
                      <Loader2 className="size-4 animate-spin" />
                      <span>{mT.searchingMapsText}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setViewMode('map')
                      }}
                      className="flex w-full items-center justify-center gap-2 py-3 text-xs font-extrabold text-[#007a5a] hover:underline"
                    >
                      <span>{mapI18n.noResultsTryMapText}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* المحتوى الرئيسي */}
            {viewMode === 'map' ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-[#f8fafc] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-xs">
                      <MapPin className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {pinReadingAddress ? (
                        <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#2563eb]">
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>{mapI18n.readingAddressText}</span>
                        </p>
                      ) : (
                        <>
                          <p className="truncate text-xs font-black text-[#0a1122] sm:text-sm">
                            {pinResolvedData.displayLabel}
                          </p>
                          {(pinResolvedData.street ||
                            pinResolvedData.houseNumber) && (
                            <p className="truncate text-[11px] font-bold text-[#007a5a]">
                              {mapI18n.detectedStreetLabel}{' '}
                              {pinResolvedData.street || '—'}
                              {pinResolvedData.houseNumber
                                ? ` · ${mapI18n.detectedHouseLabel} ${pinResolvedData.houseNumber}`
                                : ''}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 sm:justify-end">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setMapStyleMode('3d')}
                        className={`rounded-lg px-2 py-1 text-[11px] font-extrabold transition sm:px-2.5 ${
                          mapStyleMode === '3d'
                            ? 'bg-[#2563eb] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mapI18n.map3dViewBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapStyleMode('streets')}
                        className={`rounded-lg px-2 py-1 text-[11px] font-extrabold transition sm:px-2.5 ${
                          mapStyleMode === 'streets'
                            ? 'bg-[#2563eb] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mapI18n.streetsViewBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapStyleMode('satellite')}
                        className={`rounded-lg px-2 py-1 text-[11px] font-extrabold transition sm:px-2.5 ${
                          mapStyleMode === 'satellite'
                            ? 'bg-[#2563eb] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mapI18n.satelliteViewBtn}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={gpsLoading}
                      onClick={handleDetectRealGPS}
                      className="inline-flex h-8 items-center gap-1 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-2.5 text-[11px] font-extrabold text-[#007a5a] hover:bg-emerald-100"
                    >
                      {gpsLoading ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Navigation className="size-3" />
                      )}
                      <span>GPS</span>
                    </button>
                  </div>
                </div>

                {gpsNotice && (
                  <div className="bg-red-50 px-4 py-1.5 text-center text-[11px] font-bold text-red-600">
                    ⚠️ {gpsNotice}
                  </div>
                )}

                <div
                  dir="ltr"
                  className="relative h-[370px] w-full cursor-grab overflow-hidden bg-[#dfe5dc] active:cursor-grabbing sm:h-[460px]"
                >
                  <div
                    ref={modalMapContainerRef}
                    style={{ width: '100%', height: '100%' }}
                    className="h-full w-full"
                  />

                  {(mapTransitionLoading || gpsLoading) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/75 backdrop-blur-[2px]">
                      <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-[#0a1122] shadow-xl sm:text-sm">
                        <Loader2 className="size-4 animate-spin text-[#2563eb]" />
                        <span>{mapI18n.flyingToPlaceLoading}</span>
                      </div>
                    </div>
                  )}

                  {/* دبوس المنتصف الثابت */}
                  <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-11 items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-white shadow-2xl ring-4 ring-blue-500/30 transition-transform duration-200 sm:size-12 ${
                          isDraggingPin
                            ? '-translate-y-3 scale-110'
                            : 'translate-y-0'
                        }`}
                      >
                        <Building2 className="size-5" />
                      </div>
                      <div
                        className={`-mt-1 h-3 w-0 border-x-[6px] border-t-[9px] border-x-transparent border-t-[#2563eb] transition-transform duration-200 ${
                          isDraggingPin ? '-translate-y-3' : 'translate-y-0'
                        }`}
                      />
                      <div
                        className={`mt-0.5 rounded-full bg-black/30 blur-[1px] transition-all duration-200 ${
                          isDraggingPin ? 'h-1 w-2 opacity-40' : 'h-1.5 w-3.5'
                        }`}
                      />
                    </div>
                  </div>

                  {/* أزرار التحكم بالزوم حول نقطة الدبوس بالمللي */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleModalZoom(1)}
                      className="flex size-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModalZoom(-1)}
                      className="flex size-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                    >
                      <Minus className="size-4" />
                    </button>
                    {mapStyleMode === '3d' && (
                      <button
                        type="button"
                        onClick={toggleModal3dPitch}
                        className={`flex size-8 items-center justify-center rounded-xl text-[11px] font-black transition ${
                          isPitch3D
                            ? 'bg-[#2563eb] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        3D
                      </button>
                    )}
                  </div>

                  <div className="pointer-events-none absolute inset-x-3 bottom-2.5 z-10 flex justify-center">
                    <span className="rounded-full bg-[#0a1122]/90 px-3.5 py-1.5 text-[10.5px] font-bold text-white shadow-md backdrop-blur-xs">
                      📍 {mapI18n.dragMapHint}
                    </span>
                  </div>
                </div>
              </div>
            ) : !activeCity ? (
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={gpsLoading}
                    onClick={handleDetectRealGPS}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-start transition hover:border-blue-200 hover:bg-blue-50/30 disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563eb] shadow-2xs">
                        <Compass
                          className={`size-4.5 ${
                            gpsLoading ? 'animate-spin' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <strong className="block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                          {mT.nearbyTitle}
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          {gpsLoading ? mT.detectingGpsText : mT.nearbySub}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMapTransitionLoading(true)
                      setViewMode('map')
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-emerald-200/80 bg-[#eaf8f2]/50 p-3.5 text-start transition hover:bg-[#eaf8f2]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#007a5a] text-white shadow-2xs">
                      </div>
                      <div>
                        <strong className="block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                          {mapI18n.openMapStepBtn}
                        </strong>
                        <span className="text-[11px] text-[#007a5a]">
                          {mapI18n.dragMapHint}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-5">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {mT.popularCitiesTitle}
                  </span>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {SIVRCE_POPULAR_CITIES.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => {
                          setActiveCity(city.id)
                          setCheckedSubItem(null)
                        }}
                        className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-start text-xs font-extrabold text-[#0a1122] transition hover:border-[#2563eb] hover:bg-blue-50/30"
                      >
                        <MapPin className="size-3.5 shrink-0 text-[#2563eb]" />
                        <span className="truncate">
                          {getOptionLabel(city, locale as LocaleCode)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {mT.municipalitiesTitle}
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                    {Object.entries(SIVRCE_MUNICIPALITIES_AZ).map(
                      ([letter, list]) => (
                        <div key={letter}>
                          <div className="mb-1.5 w-fit rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-black text-[#2563eb]">
                            {letter}
                          </div>
                          <ul className="space-y-1 px-1">
                            {list.map((muni) => {
                              const cleanCity = muni
                                .replace(' Municipality', '')
                                .replace(' Avtonomiuri Respublika', '')
                              return (
                                <li key={muni}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCity(cleanCity)
                                      setCheckedSubItem(null)
                                    }}
                                    className="text-start text-xs font-semibold text-slate-700 hover:font-extrabold hover:text-[#2563eb]"
                                  >
                                    {muni}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid flex-1 grid-cols-1 overflow-hidden sm:grid-cols-12">
                <div className="max-h-40 overflow-y-auto border-b border-slate-100 bg-slate-50/50 p-3 sm:col-span-3 sm:max-h-none sm:border-e sm:border-b-0 sm:p-4">
                  <div className="mb-2 border-b border-blue-500 px-2 pb-1.5 text-xs font-extrabold text-[#2563eb]">
                    {mT.districtsTab}
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto sm:flex-col sm:space-y-1 sm:overflow-visible">
                    {filteredSidebarCities.map((city) => {
                      const isCurrent =
                        activeCity.toLowerCase() === city.toLowerCase()
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setActiveCity(city)
                            setCheckedSubItem(null)
                          }}
                          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-start text-xs transition sm:w-full ${
                            isCurrent
                              ? 'bg-blue-50 font-black text-[#2563eb]'
                              : 'font-semibold text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{city}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:col-span-9 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pop = SIVRCE_POPULAR_CITIES.find(
                          (c) =>
                            c.id.toLowerCase() === activeCity.toLowerCase()
                        )
                        void openInteractiveMapForSelection({
                          areaId: pop?.defaultAreaId || 'Tbilisi - Saburtalo',
                          displayLabel: activeCity,
                          lat: pop?.lat,
                          lng: pop?.lng,
                          searchQueryForCoords: `${activeCity}, Georgia`,
                        })
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-blue-700"
                    >
                      <span>
                        {mT.wholeCityBtn} ({activeCity}) —{' '}
                        {mapI18n.openMapShortBtn}
                      </span>
                    </button>
                  </div>

                  {activeCity.toLowerCase() === 'tbilisi' ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                      {TBILISI_DISTRICT_GROUPS.map((grp) => (
                        <div key={grp.group}>
                          <strong className="mb-2 block text-[11px] font-black text-[#0a1122]">
                            {grp.group}
                          </strong>
                          <div className="space-y-1.5">
                            {grp.items.map((it) => {
                              const checked = checkedSubItem?.name === it.name
                              return (
                                <button
                                  key={it.name}
                                  type="button"
                                  onClick={() => {
                                    setCheckedSubItem({
                                      name: it.name,
                                      areaId: it.areaId,
                                    })
                                    void openInteractiveMapForSelection({
                                      areaId: it.areaId,
                                      displayLabel: `${it.name}, Tbilisi`,
                                      searchQueryForCoords: `${it.name.split('(')[0].trim()}, Tbilisi, Georgia`,
                                    })
                                  }}
                                  className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-start text-xs font-semibold transition ${
                                    checked
                                      ? 'bg-blue-50 font-extrabold text-[#2563eb]'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <MapPin className="size-3 shrink-0 text-[#2563eb]" />
                                  <span className="leading-tight">
                                    {it.name}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeCity.toLowerCase() === 'batumi' ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {BATUMI_DISTRICTS_LIST.map((it) => {
                        const checked = checkedSubItem?.name === it.name
                        return (
                          <button
                            key={it.name}
                            type="button"
                            onClick={() => {
                              setCheckedSubItem({
                                name: it.name,
                                areaId: it.areaId,
                              })
                              void openInteractiveMapForSelection({
                                areaId: it.areaId,
                                displayLabel: `${it.name}, Batumi`,
                                searchQueryForCoords: `${it.name.split('(')[0].trim()}, Batumi, Georgia`,
                              })
                            }}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-bold transition ${
                              checked
                                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                                : 'border-slate-200/80 bg-white text-slate-700 hover:border-blue-300'
                            }`}
                          >
                            <MapPin className="size-3.5 shrink-0 text-[#2563eb]" />
                            <span>{it.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {cityStreetsLive.map((st) => {
                        const checked = checkedSubItem?.name === st
                        const mappedArea =
                          SIVRCE_POPULAR_CITIES.find(
                            (c) =>
                              c.id.toLowerCase() === activeCity.toLowerCase()
                          )?.defaultAreaId || 'Tbilisi - Saburtalo'
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setCheckedSubItem({
                                name: st,
                                areaId: mappedArea,
                                isStreet: true,
                              })
                              void openInteractiveMapForSelection({
                                areaId: mappedArea,
                                displayLabel: `${st}, ${activeCity}`,
                                street: st,
                                searchQueryForCoords: `${st}, ${activeCity}, Georgia`,
                              })
                            }}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-bold transition ${
                              checked
                                ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]'
                                : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <MapPin className="size-3.5 shrink-0 text-[#2563eb]" />
                            <span>{st}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* فوتر النافذة */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setActiveCity(null)
                  setCheckedSubItem(null)
                  setSearchQuery('')
                  setViewMode('browse')
                }}
                className="text-xs font-extrabold text-slate-500 hover:text-[#0a1122]"
              >
                {mT.clearBtn}
              </button>

              <button
                type="button"
                disabled={pinReadingAddress}
                onClick={handleFinalConfirmFromModal}
                className="inline-flex items-center gap-2 rounded-full bg-[#007a5a] px-6 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#006248] disabled:opacity-60 sm:px-7 sm:py-3 sm:text-sm"
              >
                <Check className="size-4 stroke-[3]" />
                <span>
                  {viewMode === 'map'
                    ? mapI18n.confirmExactPinBtn
                    : mT.selectBtn}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}