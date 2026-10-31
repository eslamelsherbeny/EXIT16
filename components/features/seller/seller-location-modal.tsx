'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  Compass,
  Globe,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'
import { getOptionLabel } from './seller-options-data'
import { RequiredLabel } from './seller-shared'

export const SIVRCE_POPULAR_CITIES = [
  { id: 'Tbilisi', ar: 'تبليسي', en: 'Tbilisi', ru: 'Тбилиси', ka: 'თბილისი', defaultAreaId: 'Tbilisi - Saburtalo' },
  { id: 'Batumi', ar: 'باتومي', en: 'Batumi', ru: 'Батуми', ka: 'ბათუმი', defaultAreaId: 'Batumi - New Boulevard' },
  { id: 'Kutaisi', ar: 'كوتايسي', en: 'Kutaisi', ru: 'Кутаиси', ka: 'ქუთაისი', defaultAreaId: 'Kutaisi' },
  { id: 'Rustavi', ar: 'روستافي', en: 'Rustavi', ru: 'Рустави', ka: 'რუსთავი', defaultAreaId: 'Rustavi' },
  { id: 'Kobuleti', ar: 'كوبوليتي', en: 'Kobuleti', ru: 'Кобулети', ka: 'ქობულეთი', defaultAreaId: 'Batumi - Chakvi / Green Cape' },
  { id: 'Bakuriani', ar: 'باكورياني', en: 'Bakuriani', ru: 'Бакуриани', ka: 'ბაკურიანი', defaultAreaId: 'Bakuriani' },
  { id: 'Gudauri', ar: 'غوداوري', en: 'Gudauri', ru: 'Гудаури', ka: 'გუდაური', defaultAreaId: 'Gudauri' },
  { id: 'Borjomi', ar: 'بورجومي', en: 'Borjomi', ru: 'Боржоми', ka: 'ბორჯომი', defaultAreaId: 'Borjomi' },
  { id: 'Telavi', ar: 'تيلافي', en: 'Telavi', ru: 'Телави', ka: 'თელავი', defaultAreaId: 'Kakheti - Telavi / Kvareli' },
  { id: 'Gori', ar: 'غوري', en: 'Gori', ru: 'Гори', ka: 'გორი', defaultAreaId: 'Tbilisi - Didi Digomi' },
]

export const SIVRCE_MUNICIPALITIES_AZ: Record<string, string[]> = {
  A: [
    'Abasha Municipality',
    'Achalkalaki Municipality',
    'Adigeni Municipality',
    'Akhalgori Municipality',
    'Akhaltsikhe Municipality',
    'Akhmeta Municipality',
    'Ambrolauri Municipality',
    'Apkhazetis Avtonomiuri Respublika',
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
    'Gagra Municipality',
    'Gali Municipality',
    'Gardabani Municipality',
    'Gori Municipality',
    'Gudauta Municipality',
    'Gulripshi Municipality',
    'Gurjaani Municipality',
  ],
  K: [
    'Kareli Municipality',
    'Kaspi Municipality',
    'Keda Municipality',
    'Kharagauli Municipality',
    'Khashuri Municipality',
    'Khelvachauri Municipality',
    'Khobi Municipality',
    'Khoni Municipality',
    'Khulo Municipality',
    'Kobuleti Municipality',
    'Kutaisi Municipality',
  ],
  L: [
    'Lagodekhi Municipality',
    'Lanchkhuti Municipality',
    'Lentekhi Municipality',
  ],
  M: [
    'Marneuli Municipality',
    'Martvili Municipality',
    'Mestia Municipality',
    'Mtskheta Municipality',
  ],
  N: ['Ninotsminda Municipality'],
  O: [
    'Ochamchire Municipality',
    'Oni Municipality',
    'Ozurgeti Municipality',
  ],
  Q: ['Qazbegi Municipality', 'Qvareli Municipality'],
  S: [
    'Sachkhere Municipality',
    'Sagarejo Municipality',
    'Samtredia Municipality',
    'Senaki Municipality',
    'Shuakhevi Municipality',
    'Sighnaghi Municipality',
    'Sokhumi Municipality',
  ],
  T: [
    'Telavi Municipality',
    'Terjola Municipality',
    'Tetritsqaro Municipality',
    'Tianeti Municipality',
    'Tqibuli Municipality',
    'Tqvarcheli Municipality',
    'Tsageri Municipality',
    'Tsalenjikha Municipality',
    'Tsalka Municipality',
    'Tskaltubo Municipality',
    'Tskhinvali Municipality',
  ],
  V: ['Vani Municipality'],
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
  'Gurjaani',
  'Sagarejo',
  'Lagodekhi',
  'Tskaltubo',
  'Zestafoni',
  'Samtredia',
  'Senaki',
  'Ozurgeti',
  'Ureki',
  'Shekvetili',
  'Chakvi',
  'Gonio',
  'Kvariati',
  'Sarpi',
  'Abastumani',
  'Abasha',
  'Agara',
  'Adigeni',
  'Ambrolauri',
  'Aspindza',
  'Apkhazeti',
  'Akhal Atoni',
  'Akhalgori',
  'Achalkalaki',
  'Akhaltsikhe',
  'Akhmeta',
  'Baghdati',
  'Bolnisi',
  'Chiatura',
  'Chkhorotsqu',
  'Chokhatauri',
  'Dedoplistsqaro',
  'Dmanisi',
  'Dusheti',
  'Kareli',
  'Kaspi',
  'Keda',
  'Kharagauli',
  'Khashuri',
  'Khobi',
  'Khoni',
  'Khulo',
  'Lanchkhuti',
  'Lentekhi',
  'Martvili',
  'Mestia',
  'Ninotsminda',
  'Oni',
  'Sachkhere',
  'Shuakhevi',
  'Terjola',
  'Tetritsqaro',
  'Tianeti',
  'Tqibuli',
  'Tsageri',
  'Tsalenjikha',
  'Tsalka',
  'Vani',
]

export const TBILISI_DISTRICT_GROUPS: Array<{
  group: string
  items: Array<{ name: string; areaId: string }>
}> = [
  {
    group: 'Vake-Saburtalo',
    items: [
      { name: 'Vake', areaId: 'Tbilisi - Vake' },
      { name: 'Saburtalo', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Vashlijvari', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Vedzisi', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Tkhinvali', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Kus Tba', areaId: 'Tbilisi - Vake' },
      { name: 'Lisi', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Mukhatgverdi', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Mukhattsqaro', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Bagebi', areaId: 'Tbilisi - Vake' },
      { name: 'Sop. Dighomi', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Dighmis Chala', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Koshigora', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Dighomi 1-9', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Nutsubidzis Plato', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Didgori', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Didi Dighomi', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Vazha-Pshavelas Kvartlebi', areaId: 'Tbilisi - Saburtalo' },
      { name: 'Dighomi', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Zurgovana', areaId: 'Tbilisi - Didi Digomi' },
    ],
  },
  {
    group: 'Isani-Samgori',
    items: [
      { name: 'Varketili', areaId: 'Tbilisi - Varketili' },
      { name: 'Isani', areaId: 'Tbilisi - Isani' },
      { name: 'Lilo', areaId: 'Tbilisi - Samgori' },
      { name: 'Mesame Masivi', areaId: 'Tbilisi - Varketili' },
      { name: 'Moskovis Ave.', areaId: 'Tbilisi - Samgori' },
      { name: 'Afrika', areaId: 'Tbilisi - Samgori' },
      { name: 'Aeroportis Dasakhleba', areaId: 'Tbilisi - Samgori' },
      { name: 'Dampalos Dasakhleba', areaId: 'Tbilisi - Samgori' },
      { name: 'Vazisubani', areaId: 'Tbilisi - Isani' },
      { name: 'Navtlughi', areaId: 'Tbilisi - Samgori' },
      { name: 'Orkhevi', areaId: 'Tbilisi - Samgori' },
      { name: 'Samgori', areaId: 'Tbilisi - Samgori' },
      { name: 'Ponichala', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Varketilis Meurneoba', areaId: 'Tbilisi - Varketili' },
    ],
  },
  {
    group: 'Gldani-Nadzaladevi',
    items: [
      { name: 'Gldani', areaId: 'Tbilisi - Gldani' },
      { name: 'Gldanula', areaId: 'Tbilisi - Gldani' },
      { name: 'Tbilisis Zghva', areaId: 'Tbilisi - Tbilisi Sea' },
      { name: 'Temka', areaId: 'Tbilisi - Nadzaladevi' },
      { name: 'Koniakis Dasakhleba', areaId: 'Tbilisi - Gldani' },
      { name: 'Lotkini', areaId: 'Tbilisi - Nadzaladevi' },
      { name: 'Mukhiani', areaId: 'Tbilisi - Gldani' },
      { name: 'Nadzaladevi', areaId: 'Tbilisi - Nadzaladevi' },
      { name: 'Sanzona', areaId: 'Tbilisi - Nadzaladevi' },
      { name: 'Avshniani', areaId: 'Tbilisi - Gldani' },
      { name: 'Avchala', areaId: 'Tbilisi - Gldani' },
      { name: 'Zahesi', areaId: 'Tbilisi - Gldani' },
      { name: 'Sop. Gldani', areaId: 'Tbilisi - Gldani' },
      { name: 'Giorgitsmindas Dasakhleba', areaId: 'Tbilisi - Gldani' },
      { name: 'Zghvisubani', areaId: 'Tbilisi - Tbilisi Sea' },
      { name: 'Gldanis Masivi', areaId: 'Tbilisi - Gldani' },
    ],
  },
  {
    group: 'Didube-Chughureti',
    items: [
      { name: 'Didube', areaId: 'Tbilisi - Didube' },
      { name: 'Dighmis Masivi', areaId: 'Tbilisi - Digomi Massive' },
      { name: 'Kukia', areaId: 'Tbilisi - Chugureti / Marjanishvili' },
      { name: 'Chughureti', areaId: 'Tbilisi - Chugureti / Marjanishvili' },
      { name: 'Ivertubani', areaId: 'Tbilisi - Chugureti / Marjanishvili' },
      { name: 'Svanetis Ubani', areaId: 'Tbilisi - Chugureti / Marjanishvili' },
    ],
  },
  {
    group: 'Dzveli Tbilisi',
    items: [
      { name: 'Dzveli Tbilisi', areaId: 'Tbilisi - Old Tbilisi' },
      { name: 'Elia', areaId: 'Tbilisi - Avlabari' },
      { name: 'Vera', areaId: 'Tbilisi - Vera' },
      { name: 'Krtsanisi', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Mtatsminda', areaId: 'Tbilisi - Mtatsminda' },
      { name: 'Sololaki', areaId: 'Tbilisi - Old Tbilisi' },
      { name: 'Tsavkisis Veli', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Abanotubani', areaId: 'Tbilisi - Old Tbilisi' },
      { name: 'Avlabari', areaId: 'Tbilisi - Avlabari' },
      { name: 'Ortachala', areaId: 'Tbilisi - Ortachala' },
      { name: 'Metekhi', areaId: 'Tbilisi - Avlabari' },
    ],
  },
  {
    group: 'Tbilisis Shemogareni',
    items: [
      { name: 'Tsveri', areaId: 'Tbilisi - Mtatsminda' },
      { name: 'Akhaldaba', areaId: 'Tbilisi - Vake' },
      { name: 'Betania', areaId: 'Tbilisi - Vake' },
      { name: 'Kaklebi', areaId: 'Tbilisi - Vake' },
      { name: 'Kiketi', areaId: 'Tbilisi - Vake' },
      { name: 'Kojori', areaId: 'Tbilisi - Mtatsminda' },
      { name: 'Okrokana', areaId: 'Tbilisi - Mtatsminda' },
      { name: 'Tabakhmela', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Shindisi', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Tsavkisi', areaId: 'Tbilisi - Krtsanisi' },
      { name: 'Tsqneti', areaId: 'Tbilisi - Vake' },
      { name: 'Mskhaldidi', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Tsodoreti', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Tskhvarichamia', areaId: 'Tbilisi - Gldani' },
      { name: 'Zemo Lisi', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Kveseti', areaId: 'Tbilisi - Vake' },
      { name: 'Agaraki', areaId: 'Tbilisi - Lisi Lake' },
      { name: 'Didi Lilo', areaId: 'Tbilisi - Samgori' },
      { name: 'Telovani', areaId: 'Tbilisi - Didi Digomi' },
      { name: 'Nasaguri', areaId: 'Tbilisi - Samgori' },
      { name: 'Tsinubani', areaId: 'Tbilisi - Samgori' },
    ],
  },
]

export const BATUMI_DISTRICTS_LIST: Array<{ name: string; areaId: string }> = [
  { name: 'Adlia', areaId: 'Batumi - Airport District' },
  { name: 'Akhali Bulvari', areaId: 'Batumi - New Boulevard' },
  { name: 'Boni-Gorodokis Ubani', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Gonio', areaId: 'Batumi - Gonio / Kvariati' },
  { name: 'Kakhabris Ubani', areaId: 'Batumi - Airport District' },
  { name: 'Mejinistsqali', areaId: 'Batumi - Airport District' },
  { name: 'Dzveli Batumi', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Javakhishvilis Ubani', areaId: 'Batumi - Alley of Heroes' },
  { name: 'Aeroportis Ubani', areaId: 'Batumi - Airport District' },
  { name: 'Bagrationis Ubani', areaId: 'Batumi - Bagrationi' },
  { name: 'Bulvari', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Tamaris Dasakhleba', areaId: 'Batumi - Makhinjauri' },
  { name: 'Kvariati', areaId: 'Batumi - Gonio / Kvariati' },
  { name: 'Mtsvane Kontskhi', areaId: 'Batumi - Chakvi / Green Cape' },
  { name: 'Dzveli Batumis Ubani', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Aghmasheneblis Ubani', areaId: 'Batumi - Alley of Heroes' },
  { name: 'Bartskhana', areaId: 'Batumi - Makhinjauri' },
  { name: 'Garadoki', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Todogauri', areaId: 'Batumi - Airport District' },
  { name: 'Makhinjauri', areaId: 'Batumi - Makhinjauri' },
  { name: 'Rustavelis Ubani', areaId: 'Batumi - Rustaveli Avenue' },
  { name: 'Khimshiashvilis Ubani', areaId: 'Batumi - Khimshiashvili' },
  { name: 'Chakvi', areaId: 'Batumi - Chakvi / Green Cape' },
  { name: 'Sarpi', areaId: 'Batumi - Gonio / Kvariati' },
]

export const CITY_PRESET_STREETS: Record<string, string[]> = {
  Akhmeta: [
    '1 Maisis St.',
    '300 Aragvelis St.',
    '9 Aprilis St.',
    '9 Aprilis Alley',
    'Alaverdis St.',
    'Alaznis St.',
    'Aleksandre Chavchavadzis St.',
    'Andronikashvilis St.',
    'Aghmasheneblis St.',
    'Bidzina Cholokashvilis St.',
    'Rustavelis St.',
  ],
  'Akhal Atoni': [
    'Abovianis St.',
    'Akhali Atonis Gamokvabultan Misasvleli',
    'Gagarinis St.',
    'Gulias St.',
    'Lakobas St.',
    'Sokhumis Hwy',
    'Chanbas St.',
  ],
  Kutaisi: [
    'Avangardi',
    'Aghmashenebeli',
    'Gora',
    'Mtsvaneqvavila',
    'Pasiloki',
    'Saghoria',
    'Tsentri',
    'Avtokarkhana',
    'Balakhvani',
    'Zastava',
    'Nikea',
    'Plashadka',
    'Steklotara',
    'Chavchavadze',
    'Asatiani',
    'Bzholebi',
    'Mepetubani',
    'Ninoshvili',
    'Sapichkhia',
    'Shaomiani',
    'Choma',
  ],
  Rustavi: [
    'Megobroba Ave.',
    'Shartava Ave.',
    'Kostava Ave.',
    'Pirosmani St.',
    'Tsereteli St.',
    'Leonidze St.',
    'Meskhishvili St.',
    'Tbilisi St.',
  ],
  Kobuleti: [
    'David Agmashenebeli Ave.',
    'Tamar Mepe Sanapiro',
    'Rustaveli St.',
    'Tavisupleba St.',
    'Ninoshvili St.',
    'Leselidze St.',
  ],
  Bakuriani: [
    'Agmashenebeli St.',
    'Tamar Mepe St.',
    'Kokhta-Mitarbi Rd.',
    'Didveli St.',
    'Koba Tsakadze St.',
    '9 Aprilis St.',
    'Borjomi St.',
  ],
  Gudauri: [
    'New Gudauri (RedCo)',
    'Upper Gudauri',
    'Lower Gudauri',
    'Georgian Military Hwy',
    'Marco Polo Area',
    'Burjula St.',
  ],
}

export const GENERIC_MUNICIPALITY_STREETS = [
  'Shota Rustavelis St.',
  'David Agmasheneblis Ave.',
  'Ilia Chavchavadzis St.',
  'Tamar Mepis St.',
  '9 Aprilis St.',
  'Tavisuplebis St.',
  'Giorgi Saakadzis St.',
  'Akaki Tseretlis St.',
  'Vazha-Pshavelas St.',
  'Kostavas St.',
  'Pirosmanis St.',
  'Gamsakhurdias St.',
  'Vardziis St.',
  'Meskhtis St.',
  'Ninoshvilis St.',
  'Samasi Aragvelis St.',
  'Sanapiros St.',
  'Paliashvilis St.',
]

export function SivrceLocationModalPicker({
  label,
  value,
  displayText,
  onSelectLocation,
  error,
  showEverywhereOption = false,
  customTrigger,
}: {
  label?: string
  value: string
  displayText?: string
  onSelectLocation: (payload: {
    areaId: string
    displayLabel: string
    street?: string
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
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const fT = getSellerFormTranslations(locale)
  const mT = fT.locationModal

  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [checkedSubItem, setCheckedSubItem] = useState<{
    name: string
    areaId: string
    isStreet?: boolean
    lat?: number
    lng?: number
  } | null>(null)

  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [liveGeoResults, setLiveGeoResults] = useState<
    Array<{
      displayName: string
      city: string
      street: string
      areaId: string
      lat: number
      lng: number
    }>
  >([])
  const [searchingGeo, setSearchingGeo] = useState(false)
  const [cityStreetsLive, setCityStreetsLive] = useState<string[]>([])

  const resolvedDisplay =
    displayText || (value ? getLocalizedGeorgiaAreaName(value, locale) : '')

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
    if (preset) {
      setCityStreetsLive(preset)
    } else {
      setCityStreetsLive(GENERIC_MUNICIPALITY_STREETS)
    }
  }, [activeCity])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setLiveGeoResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingGeo(true)
      try {
        const searchTarget = activeCity
          ? `${q}, ${activeCity}, Georgia`
          : `${q}, Georgia`
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&addressdetails=1&limit=10&q=${encodeURIComponent(searchTarget)}`,
          { headers: { 'Accept-Language': locale } }
        )
        const data = await res.json()
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => {
            const addr = item.address || {}
            const city =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.county ||
              addr.state ||
              activeCity ||
              'Tbilisi'
            const street =
              addr.road ||
              addr.pedestrian ||
              addr.suburb ||
              addr.neighbourhood ||
              addr.quarter ||
              item.name ||
              ''
            const matchedPop = SIVRCE_POPULAR_CITIES.find((c) =>
              city.toLowerCase().includes(c.id.toLowerCase())
            )
            const fallbackAreaId =
              matchedPop?.defaultAreaId || 'Tbilisi - Saburtalo'

            return {
              displayName: item.display_name.split(',').slice(0, 3).join('، '),
              city,
              street,
              areaId: fallbackAreaId,
              lat: Number(item.lat),
              lng: Number(item.lon),
            }
          })
          setLiveGeoResults(mapped)
        }
      } catch {
        setLiveGeoResults([])
      } finally {
        setSearchingGeo(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, activeCity, locale])

  const handleDetectRealGPS = () => {
    setGpsError('')
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsError(
        isAr
          ? 'متصفحك لا يدعم خاصية تحديد الموقع GPS'
          : 'Geolocation is not supported by your browser'
      )
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': locale } }
          )
          const data = await res.json()
          const addr = data?.address || {}
          const detectedCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.state ||
            'Tbilisi'
          const detectedSuburb =
            addr.suburb || addr.neighbourhood || addr.quarter || ''
          const detectedStreet = addr.road || addr.pedestrian || ''

          const isBatumi = detectedCity.toLowerCase().includes('batumi')
          const matchedAreaId = isBatumi
            ? 'Batumi - New Boulevard'
            : 'Tbilisi - Saburtalo'

          const labelParts = [
            detectedCity,
            detectedSuburb,
            detectedStreet,
          ].filter(Boolean)
          const finalDisplay =
            labelParts.length > 0
              ? labelParts.join('، ')
              : `${lat.toFixed(4)}, ${lng.toFixed(4)}`

          onSelectLocation({
            areaId: matchedAreaId,
            displayLabel: finalDisplay,
            street: detectedStreet || undefined,
            lat,
            lng,
          })
          setGpsLoading(false)
          setOpen(false)
        } catch {
          onSelectLocation({
            areaId: 'Tbilisi - Saburtalo',
            displayLabel: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng,
          })
          setGpsLoading(false)
          setOpen(false)
        }
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(
          err.code === 1
            ? isAr
              ? 'يرجى السماح للمتصفح بالوصول إلى موقعك (Allow Location)'
              : 'Please allow location permission in your browser'
            : isAr
              ? 'تعذر التقاط إشارة GPS'
              : 'Could not detect GPS location'
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleConfirmSelection = async () => {
    if (checkedSubItem) {
      const cityPrefix = activeCity || 'Tbilisi'
      let exactLat = checkedSubItem.lat
      let exactLng = checkedSubItem.lng

      if (!exactLat || !exactLng) {
        try {
          const q = `${checkedSubItem.name}, ${cityPrefix}, Georgia`
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&limit=1&q=${encodeURIComponent(q)}`
          )
          const d = await r.json()
          if (Array.isArray(d) && d[0]) {
            exactLat = Number(d[0].lat)
            exactLng = Number(d[0].lon)
          }
        } catch {}
      }

      onSelectLocation({
        areaId: checkedSubItem.areaId,
        displayLabel: `${checkedSubItem.name}, ${cityPrefix}`,
        street: checkedSubItem.isStreet ? checkedSubItem.name : undefined,
        lat: exactLat,
        lng: exactLng,
      })
    } else if (activeCity) {
      const pop = SIVRCE_POPULAR_CITIES.find(
        (c) => c.id.toLowerCase() === activeCity.toLowerCase()
      )
      const areaId = pop?.defaultAreaId || 'Tbilisi - Saburtalo'
      let exactLat: number | undefined
      let exactLng: number | undefined

      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&limit=1&q=${encodeURIComponent(activeCity + ', Georgia')}`
        )
        const d = await r.json()
        if (Array.isArray(d) && d[0]) {
          exactLat = Number(d[0].lat)
          exactLng = Number(d[0].lon)
        }
      } catch {}

      onSelectLocation({
        areaId,
        displayLabel: activeCity,
        lat: exactLat,
        lng: exactLng,
      })
    }
    setOpen(false)
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
          onClick: () => setOpen(true),
          resolvedDisplay,
        })
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-start text-xs font-bold transition sm:text-sm ${
            !value || error
              ? 'border-orange-300 bg-white text-slate-400 hover:border-[#ea580c]'
              : 'border-slate-200 bg-white text-[#0a1122] hover:border-[#2563eb]'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin
              className={`size-4 shrink-0 ${
                value ? 'text-[#2563eb]' : 'text-slate-400'
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
                onSelectLocation({ areaId: '', displayLabel: '', street: '' })
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                {activeCity && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCity(null)
                      setCheckedSubItem(null)
                    }}
                    className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                  >
                    <ChevronLeft className="size-5 rtl:rotate-180" />
                  </button>
                )}
                <h3 className="text-base font-black text-[#0a1122] sm:text-lg">
                  {mT.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="border-b border-slate-100 px-6 py-4">
              {activeCity && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-[#2563eb]">
                    <span>{activeCity}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCity(null)
                        setCheckedSubItem(null)
                      }}
                      className="hover:text-blue-800"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                  {checkedSubItem && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-extrabold text-[#ea580c]">
                      <span>{checkedSubItem.name}</span>
                      <button
                        type="button"
                        onClick={() => setCheckedSubItem(null)}
                        className="hover:text-orange-800"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={mT.searchPlaceholder}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 ps-10 pe-4 text-xs font-semibold text-[#0a1122] focus:border-[#2563eb] focus:bg-white focus:outline-none sm:text-sm"
                />
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                  {searchingGeo ? (
                    <p className="py-2 text-center text-xs font-bold text-slate-400">
                      {isAr
                        ? 'جاري البحث في خرائط جورجيا...'
                        : 'Searching Georgia maps...'}
                    </p>
                  ) : liveGeoResults.length > 0 ? (
                    liveGeoResults.map((item, idx) => (
                      <button
                        key={`${item.lat}-${item.lng}-${idx}`}
                        type="button"
                        onClick={() => {
                          onSelectLocation({
                            areaId: item.areaId,
                            displayLabel: item.displayName,
                            street: item.street || undefined,
                            lat: item.lat,
                            lng: item.lng,
                          })
                          setOpen(false)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs font-bold text-[#0a1122] hover:bg-blue-50/60"
                      >
                        <MapPin className="size-3.5 shrink-0 text-[#2563eb]" />
                        <span className="truncate">{item.displayName}</span>
                      </button>
                    ))
                  ) : null}
                </div>
              )}
            </div>

            {!activeCity ? (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div
                  className={`grid grid-cols-1 gap-3 ${
                    showEverywhereOption ? 'sm:grid-cols-2' : ''
                  }`}
                >
                  {showEverywhereOption && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLocation({
                          areaId: '',
                          displayLabel: isAr ? 'في كل مكان' : 'Everywhere',
                        })
                        setActiveCity(null)
                        setCheckedSubItem(null)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-start transition ${
                        !value
                          ? 'border-[#2563eb] bg-blue-50/25 ring-2 ring-[#2563eb]/15'
                          : 'border-slate-100 bg-slate-50/70 hover:border-blue-200 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-xs">
                          <Globe className="size-5" />
                        </div>
                        <div>
                          <strong className="block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                            {isAr ? 'في كل مكان' : 'Everywhere'}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            {isAr ? 'كل الإعلانات في جورجيا' : 'All listings'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={gpsLoading}
                    onClick={handleDetectRealGPS}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-start transition hover:border-blue-200 hover:bg-blue-50/30 disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white text-[#2563eb] shadow-2xs">
                        <Compass
                          className={`size-5 ${
                            gpsLoading ? 'animate-spin' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <strong className="block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                          {mT.nearbyTitle}
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          {gpsLoading
                            ? isAr
                              ? 'جاري تحديد موقعك...'
                              : 'Detecting location...'
                            : mT.nearbySub}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {gpsError && (
                  <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                    {gpsError}
                  </p>
                )}

                <div className="mt-6">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {mT.popularCitiesTitle}
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {SIVRCE_POPULAR_CITIES.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => {
                          setActiveCity(city.id)
                          setCheckedSubItem(null)
                        }}
                        className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-start text-xs font-extrabold text-[#0a1122] transition hover:border-[#2563eb] hover:bg-blue-50/30"
                      >
                        <MapPin className="size-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {getOptionLabel(city, locale)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-7">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {mT.municipalitiesTitle}
                  </span>
                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {Object.entries(SIVRCE_MUNICIPALITIES_AZ).map(
                      ([letter, list]) => {
                        const filtered = searchQuery.trim()
                          ? list.filter((m) =>
                              m
                                .toLowerCase()
                                .includes(searchQuery.trim().toLowerCase())
                            )
                          : list
                        if (filtered.length === 0) return null
                        return (
                          <div key={letter}>
                            <div className="mb-2 w-fit rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-[#2563eb]">
                              {letter}
                            </div>
                            <ul className="space-y-1.5 px-1">
                              {filtered.map((muni) => {
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
                      }
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid flex-1 grid-cols-1 overflow-hidden sm:grid-cols-12">
                <div className="max-h-48 overflow-y-auto border-b border-slate-100 bg-slate-50/50 p-4 sm:col-span-3 sm:max-h-none sm:border-e sm:border-b-0">
                  <div className="mb-3 border-b border-blue-500 pb-2 px-2 text-xs font-extrabold text-[#2563eb]">
                    {mT.districtsTab}
                  </div>
                  <div className="space-y-1">
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
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-xs transition ${
                            isCurrent
                              ? 'bg-blue-50 font-black text-[#2563eb]'
                              : 'font-semibold text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{city}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:col-span-9">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckedSubItem(null)
                      handleConfirmSelection()
                    }}
                    className="mb-5 inline-flex items-center rounded-full bg-[#2563eb] px-5 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-blue-700"
                  >
                    {mT.wholeCityBtn}
                  </button>

                  {activeCity.toLowerCase() === 'tbilisi' ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-5">
                      {TBILISI_DISTRICT_GROUPS.map((grp) => (
                        <div key={grp.group}>
                          <strong className="mb-2 block text-[11px] font-black text-[#0a1122]">
                            {grp.group}
                          </strong>
                          <div className="space-y-2">
                            {grp.items
                              .filter(
                                (it) =>
                                  !searchQuery.trim() ||
                                  it.name
                                    .toLowerCase()
                                    .includes(searchQuery.trim().toLowerCase())
                              )
                              .map((it) => {
                                const checked =
                                  checkedSubItem?.name === it.name
                                return (
                                  <label
                                    key={it.name}
                                    onClick={() =>
                                      setCheckedSubItem(
                                        checked
                                          ? null
                                          : { name: it.name, areaId: it.areaId }
                                      )
                                    }
                                    className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {}}
                                      className="mt-0.5 size-4 rounded accent-[#2563eb]"
                                    />
                                    <span className="leading-tight">
                                      {it.name}
                                    </span>
                                  </label>
                                )
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeCity.toLowerCase() === 'batumi' ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {BATUMI_DISTRICTS_LIST.filter(
                        (it) =>
                          !searchQuery.trim() ||
                          it.name
                            .toLowerCase()
                            .includes(searchQuery.trim().toLowerCase())
                      ).map((it) => {
                        const checked = checkedSubItem?.name === it.name
                        return (
                          <label
                            key={it.name}
                            onClick={() =>
                              setCheckedSubItem(
                                checked
                                  ? null
                                  : { name: it.name, areaId: it.areaId }
                              )
                            }
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="size-4 rounded accent-[#2563eb]"
                            />
                            <span>{it.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cityStreetsLive
                        .filter(
                          (st) =>
                            !searchQuery.trim() ||
                            st
                              .toLowerCase()
                              .includes(searchQuery.trim().toLowerCase())
                        )
                        .map((st) => {
                          const checked = checkedSubItem?.name === st
                          const mappedArea =
                            SIVRCE_POPULAR_CITIES.find(
                              (c) =>
                                c.id.toLowerCase() === activeCity.toLowerCase()
                            )?.defaultAreaId || 'Tbilisi - Saburtalo'
                          return (
                            <label
                              key={st}
                              onClick={() =>
                                setCheckedSubItem(
                                  checked
                                    ? null
                                    : {
                                        name: st,
                                        areaId: mappedArea,
                                        isStreet: true,
                                      }
                                )
                              }
                              className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                                checked
                                  ? 'bg-slate-100 text-[#0a1122]'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="size-4 rounded accent-[#2563eb]"
                              />
                              <span>{st}</span>
                            </label>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setActiveCity(null)
                  setCheckedSubItem(null)
                  setSearchQuery('')
                }}
                className="text-xs font-extrabold text-slate-500 hover:text-[#0a1122]"
              >
                {mT.clearBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmSelection}
                className="rounded-full bg-[#2563eb] px-8 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                {mT.selectBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}