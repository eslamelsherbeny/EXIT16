'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpLeft,
  ChevronDown,
  ChevronLeft,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import {
  getCityCoordinatesAndArea,
  getCityDistrictsFromDb,
  getDistrictCoordinates,
  getDistrictStreetsFromDb,
  getInstantLocalGeorgiaSuggestions,
  reverseGeocodeGeorgiaPin,
} from '@/lib/georgia-uber-search'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'
import { getOptionLabel } from './seller-options-data'
import { RequiredLabel } from './seller-shared'

const MODAL_EXTRA_I18N: Record<
  LocaleCode,
  {
    districtsTab: string
    streetsTab: string
    wholeCityBtn: string
    pickDistrictOrStreetHint: string
    noStreetsForAreaHint: string
  }
> = {
  ar: {
    districtsTab: 'الأحياء والمناطق',
    streetsTab: 'الشوارع',
    wholeCityBtn: 'كل المدينة',
    pickDistrictOrStreetHint: 'اختر الحي أولاً أو ابحث باسم الشارع بالأعلى',
    noStreetsForAreaHint:
      'لا توجد شوارع فرعية مسجلة لهذه المنطقة — اضغط تأكيد لاختيار المنطقة مباشرة',
  },
  en: {
    districtsTab: 'Districts',
    streetsTab: 'Streets',
    wholeCityBtn: 'Whole city',
    pickDistrictOrStreetHint: 'Pick a district or type a street above',
    noStreetsForAreaHint:
      'No streets listed for this area — click Select to use location',
  },
  ru: {
    districtsTab: 'Районы',
    streetsTab: 'Улицы',
    wholeCityBtn: 'Весь город',
    pickDistrictOrStreetHint: 'Выберите район или введите улицу выше',
    noStreetsForAreaHint:
      'Для этого района нет списка улиц — нажмите Выбрать для подтверждения',
  },
  ka: {
    districtsTab: 'უბნები',
    streetsTab: 'ქუჩები',
    wholeCityBtn: 'მთელი ქალაქი',
    pickDistrictOrStreetHint: 'აირჩიეთ უბანი ან ჩაწერეთ ქუჩა ზემოთ',
    noStreetsForAreaHint:
      'ამ ზონაში ქუჩები არ არის — დააჭირეთ არჩევას მდებარეობის გამოსაყენებლად',
  },
}

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
    'Gardabani Municipality',
    'Gori Municipality',
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
  O: ['Oni Municipality', 'Ozurgeti Municipality'],
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
  'Abastumani',
  'Abasha',
  'Agara',
  'Adigeni',
  'Ambrolauri',
  'Aspindza',
  'Apkhazeti',
  'Akhal Atoni',
  'Akhalgori',
  'Akhalkalaki',
  'Akhaltsikhe',
  'Akhmeta',
  'Batumi',
  'Bakuriani',
  'Baghdati',
  'Bolnisi',
  'Borjomi',
  'Gardabani',
  'Gonio',
  'Gori',
  'Gudauri',
  'Gurjaani',
  'Dedoplistsqaro',
  'Dmanisi',
  'Dusheti',
  'Vani',
  'Zestafoni',
  'Zugdidi',
  'Tetritsqaro',
  'Telavi',
  'Terjola',
  'Tianeti',
  'Kaspi',
  'Kvariati',
  'Lagodekhi',
  'Lanchkhuti',
  'Marneuli',
  'Martvili',
  'Mestia',
  'Mtskheta',
  'Ozurgeti',
  'Poti',
  'Rustavi',
  'Sagarejo',
  'Samtredia',
  'Senaki',
  'Sighnaghi',
  'Tkibuli',
  'Kareli',
  'Keda',
  'Kobuleti',
  'Kutaisi',
  'Kvareli',
  'Kazbegi',
  'Chakvi',
  'Chiatura',
  'Chokhatauri',
  'Tskaltubo',
  'Khashuri',
  'Khelvachauri',
  'Khobi',
  'Khoni',
]

export const SIVRCE_TBILISI_COLUMNS: Array<{
  title: string
  keys: string[]
}> = [
  {
    title: 'Vake-Saburtalo',
    keys: [
      'Vake',
      'Saburtalo',
      'Vashlijvari',
      'Vedzisi',
      'Tkhinvali',
      'Kus Tba',
      'Lisi',
      'Lisis Tba',
      'Mukhatgverdi',
      'Mukhattsqaro',
      'Bagebi',
      'Sop. Dighomi',
      'Dighmis Chala',
      'Koshigora',
      'Dighomi 1-9',
      'Nutsubidzis Perdobi',
      'Didgori',
      'Didi Dighomi',
      'Vazha-Pshavelas Kvartlebi',
      'Zurgovana',
    ],
  },
  {
    title: 'Isani-Samgori',
    keys: [
      'Varketili',
      'Isani',
      'Lilo',
      'Mesame Masivi',
      'Moskovis Ave.',
      'Aprika',
      'Aeroportis Dasakhleba',
      'Dampalos Dasakhleba',
      'Vazisubani',
      'Navtlughi',
      'Orkhevi',
      'Samgori',
      'Ponichala',
      'Varketilis Meurneoba',
    ],
  },
  {
    title: 'Gldani-Nadzaladevi',
    keys: [
      'Gldani',
      'Gldanula',
      'Tbilisis Zghva',
      'Temka',
      'Koniakis Dasakhleba',
      'Lotkini',
      'Mukhiani',
      'Nadzaladevi',
      'Sanzona',
      'Avshniani',
      'Avchala',
      'Zahesi',
      'Giorgitsminda',
      'Zghvisubani',
      'Gldanis Masivi',
    ],
  },
  {
    title: 'Didube-Chughureti',
    keys: [
      'Didube',
      'Dighmis Masivi',
      'Kukia',
      'Chughureti',
      'Ivertubani',
      'Svanetis Ubani',
    ],
  },
  {
    title: 'Dzveli Tbilisi',
    keys: [
      'Dzveli Tbilisi',
      'Vera',
      'Krtsanisi',
      'Mtatsminda',
      'Sololaki',
      'Tsavkisis Veli',
      'Abanotubani',
      'Avlabari',
      'Elia',
      'Ortachala',
      'Metekhi',
      'Okrokana',
      'Tsqneti',
      'Tabakhmela',
      'Kojori',
      'Shindisi',
      'Tsavkisi',
      'Kiketi',
      'Betania',
      'Akhaldaba',
      'Kaklebi',
      'Tsveri',
      'Mskhaldidi',
      'Tsodoreti',
    ],
  },
]

export const TBILISI_DISTRICT_GROUPS = SIVRCE_TBILISI_COLUMNS.map((col) => ({
  group: col.title,
  items: col.keys.map((k) => ({ name: k, areaId: 'Tbilisi - Saburtalo' })),
}))

export const BATUMI_DISTRICTS_LIST = [
  { name: 'New Boulevard', areaId: 'Batumi - New Boulevard' },
  { name: 'Old Boulevard', areaId: 'Batumi - Old Boulevard / Center' },
  { name: 'Alley of Heroes', areaId: 'Batumi - Alley of Heroes' },
  { name: 'Rustaveli Ave', areaId: 'Batumi - Rustaveli Avenue' },
  { name: 'Khimshiashvili', areaId: 'Batumi - Khimshiashvili' },
  { name: 'Bagrationi', areaId: 'Batumi - Bagrationi' },
  { name: 'Airport District', areaId: 'Batumi - Airport District' },
  { name: 'Gonio / Kvariati', areaId: 'Batumi - Gonio / Kvariati' },
  { name: 'Makhinjauri', areaId: 'Batumi - Makhinjauri' },
  { name: 'Chakvi / Green Cape', areaId: 'Batumi - Chakvi / Green Cape' },
]

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
    cadastralCode?: string
    naprAddress?: string
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
  const uiT = MODAL_EXTRA_I18N[locale as LocaleCode] || MODAL_EXTRA_I18N.ar

  const [open, setOpen] = useState(false)
  const [subTab, setSubTab] = useState<'districts' | 'streets'>('districts')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [activeDistrict, setActiveDistrict] = useState<{
    key: string
    label: string
    areaId: string
  } | null>(null)
  const [checkedStreet, setCheckedStreet] = useState<{
    name: string
    display: string
    areaId: string
    districtKey: string
  } | null>(null)

  const [nearbyLoading, setNearbyLoading] = useState(false)

  const resolvedDisplay =
    displayText ||
    (value ? getLocalizedGeorgiaAreaName(value, locale as LocaleCode) : '')

  const currentCityDistricts = useMemo(() => {
    if (!activeCity) return []
    return getCityDistrictsFromDb(activeCity, locale as LocaleCode)
  }, [activeCity, locale])

  const hasDistrictsForActiveCity = currentCityDistricts.length > 0

  const districtMapByKey = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; areaId: string; totalStreets: number }
    >()
    for (const d of currentCityDistricts) {
      map.set(d.key.toLowerCase(), d)
    }
    return map
  }, [currentCityDistricts])

  const currentDistrictStreets = useMemo(() => {
    if (!activeCity) return []
    if (hasDistrictsForActiveCity && !activeDistrict) return []
    return getDistrictStreetsFromDb(
      activeCity,
      activeDistrict?.key || null,
      locale as LocaleCode
    )
  }, [activeCity, activeDistrict, hasDistrictsForActiveCity, locale])

  const liveGeoResults = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return []
    return getInstantLocalGeorgiaSuggestions(
      q,
      locale as LocaleCode,
      activeCity
    )
  }, [searchQuery, locale, activeCity])

  useEffect(() => {
    if (!activeCity) return
    if (hasDistrictsForActiveCity) {
      setSubTab('districts')
    } else {
      setSubTab('streets')
    }
  }, [activeCity, hasDistrictsForActiveCity])

  const handleNearbyClick = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    setNearbyLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const resolved = await reverseGeocodeGeorgiaPin({
            lat,
            lng,
            locale: locale as LocaleCode,
          })
          onSelectLocation({
            areaId: resolved.areaId,
            displayLabel: resolved.displayLabel,
            street: resolved.street || '',
            houseNumber: resolved.houseNumber || '',
            cadastralCode: resolved.cadastralCode || '',
            naprAddress: resolved.naprAddress || '',
            lat,
            lng,
          })
          setOpen(false)
        } finally {
          setNearbyLoading(false)
        }
      },
      () => {
        setNearbyLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSelectDistrictItem = (distKeyRaw: string) => {
    const found = districtMapByKey.get(distKeyRaw.toLowerCase())
    const areaId =
      found?.areaId ||
      (activeCity?.toLowerCase() === 'batumi'
        ? 'Batumi - New Boulevard'
        : 'Tbilisi - Saburtalo')
    const label = found?.label || distKeyRaw

    if (activeDistrict?.key.toLowerCase() === distKeyRaw.toLowerCase()) {
      setActiveDistrict(null)
      setCheckedStreet(null)
      return
    }

    setActiveDistrict({
      key: found?.key || distKeyRaw,
      label,
      areaId,
    })
    setCheckedStreet(null)
    setSubTab('streets')
  }

  const handleWholeCityClick = () => {
    if (!activeCity) return
    const cityInfo = getCityCoordinatesAndArea(activeCity)
    onSelectLocation({
      areaId: cityInfo.areaId,
      displayLabel: activeCity,
      street: '',
      houseNumber: '',
      cadastralCode: '',
      naprAddress: '',
      lat: cityInfo.lat,
      lng: cityInfo.lng,
    })
    setOpen(false)
  }

  const handleFinalSelectConfirm = () => {
    const cityName = activeCity || 'Tbilisi'

    if (checkedStreet) {
      const coords = getDistrictCoordinates(
        checkedStreet.districtKey,
        checkedStreet.areaId
      )
      onSelectLocation({
        areaId: checkedStreet.areaId,
        displayLabel:
          checkedStreet.districtKey.toLowerCase() === cityName.toLowerCase()
            ? cityName
            : `${checkedStreet.districtKey}, ${cityName}`,
        street: checkedStreet.display,
        houseNumber: '',
        cadastralCode: '',
        naprAddress: '',
        lat: coords.lat,
        lng: coords.lng,
      })
      setOpen(false)
      return
    }

    if (activeDistrict) {
      const coords = getDistrictCoordinates(
        activeDistrict.key,
        activeDistrict.areaId
      )
      onSelectLocation({
        areaId: activeDistrict.areaId,
        displayLabel: `${activeDistrict.key}, ${cityName}`,
        street: '',
        houseNumber: '',
        cadastralCode: '',
        naprAddress: '',
        lat: coords.lat,
        lng: coords.lng,
      })
      setOpen(false)
      return
    }

    if (activeCity) {
      handleWholeCityClick()
    }
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
            error
              ? 'border-2 border-red-500 bg-red-50/20 text-red-700'
              : !value
                ? 'border-slate-200 bg-white text-slate-400 hover:border-[#2563eb]'
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
                  cadastralCode: '',
                  naprAddress: '',
                })
                setActiveCity(null)
                setActiveDistrict(null)
                setCheckedStreet(null)
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
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[90vh] w-full max-w-[1060px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:h-[650px] sm:rounded-[24px]"
          >
            {/* الهيدر */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2.5 sm:px-6 sm:pt-5 sm:pb-3">
              <div className="flex items-center gap-2.5">
                {activeCity && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        subTab === 'streets' &&
                        activeDistrict &&
                        hasDistrictsForActiveCity
                      ) {
                        setSubTab('districts')
                      } else {
                        setActiveCity(null)
                        setActiveDistrict(null)
                        setCheckedStreet(null)
                      }
                    }}
                    className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                  </button>
                )}
                <h3 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
                  {mT.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* شريط الـ Chips للمدينة والحي والشارع المختار */}
            {activeCity && (
              <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 sm:px-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563eb]">
                  {activeCity}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCity(null)
                      setActiveDistrict(null)
                      setCheckedStreet(null)
                    }}
                    className="hover:text-blue-900"
                  >
                    <X className="size-3" />
                  </button>
                </span>

                {activeDistrict && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563eb]">
                    {activeDistrict.key}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDistrict(null)
                        setCheckedStreet(null)
                        setSubTab('districts')
                      }}
                      className="hover:text-blue-900"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {checkedStreet && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563eb]">
                    {checkedStreet.display}
                    <button
                      type="button"
                      onClick={() => setCheckedStreet(null)}
                      className="hover:text-blue-900"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* شريط البحث الفوري 0ms */}
            <div className="px-4 pb-3 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={mT.searchPlaceholder}
                  className="h-11 w-full rounded-xl border border-slate-200/90 bg-[#f8fafc] ps-10 pe-10 text-xs font-medium text-[#0a1122] transition focus:border-[#2563eb] focus:bg-white focus:outline-none sm:text-sm"
                />
                {searchQuery ? (
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
                <div className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {liveGeoResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        onSelectLocation({
                          areaId: item.areaId,
                          displayLabel: item.displayAreaLabel,
                          street: item.street || '',
                          houseNumber: item.houseNumber || '',
                          cadastralCode: '',
                          naprAddress: '',
                          lat: item.lat,
                          lng: item.lng,
                        })
                        setOpen(false)
                      }}
                      className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-start transition hover:bg-blue-50/70"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                          <MapPin className="size-4" />
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
                  ))}
                </div>
              )}
            </div>

            {/* المحتوى الرئيسي */}
            {!activeCity ? (
              <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-6">
                <button
                  type="button"
                  disabled={nearbyLoading}
                  onClick={handleNearbyClick}
                  className="flex w-full flex-col items-start justify-center rounded-2xl border border-slate-100 bg-[#f8fafc] p-4 text-start transition hover:border-slate-200 hover:bg-slate-100/70 disabled:opacity-60"
                >
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-2xs">
                    {nearbyLoading ? (
                      <Loader2 className="size-4 animate-spin text-[#2563eb]" />
                    ) : (
                      <LocateFixed className="size-4" />
                    )}
                  </div>
                  <strong className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {mT.nearbyTitle}
                  </strong>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    {mT.nearbySub}
                  </span>
                </button>

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
                          setActiveDistrict(null)
                          setCheckedStreet(null)
                        }}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-[#f8fafc] px-3.5 py-2.5 text-start text-xs font-bold text-[#0a1122] transition hover:border-slate-200 hover:bg-slate-100/80"
                      >
                        <MapPin className="size-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {getOptionLabel(city, locale as LocaleCode)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pb-4">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {mT.municipalitiesTitle}
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-x-6">
                    {Object.entries(SIVRCE_MUNICIPALITIES_AZ).map(
                      ([letter, list]) => (
                        <div key={letter}>
                          <div className="mb-2 rounded-lg bg-[#f8fafc] px-3 py-1 text-xs font-extrabold text-slate-600">
                            {letter}
                          </div>
                          <ul className="space-y-1.5 px-1">
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
                                      setActiveDistrict(null)
                                      setCheckedStreet(null)
                                    }}
                                    className="text-start text-xs font-medium text-slate-700 hover:font-bold hover:text-[#2563eb]"
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
              <div className="flex flex-1 flex-col overflow-hidden border-t border-slate-100">
                <div className="grid flex-1 grid-cols-1 overflow-hidden sm:grid-cols-12">
                  {/* العمود الجانبي للمدن: يظهر على الكمبيوتر فقط (hidden sm:flex) */}
                  <div className="hidden flex-col overflow-hidden border-e border-slate-100 sm:col-span-3 sm:flex">
                    <div className="border-b border-slate-100 px-5 pt-2.5 pb-2 text-xs font-bold text-slate-700">
                      {subTab === 'districts'
                        ? uiT.districtsTab
                        : uiT.streetsTab}
                    </div>
                    <div className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
                      {SIVRCE_SIDEBAR_CITIES.map((cityItem) => {
                        const isCurrent =
                          activeCity.toLowerCase() === cityItem.toLowerCase()
                        return (
                          <button
                            key={cityItem}
                            type="button"
                            onClick={() => {
                              setActiveCity(cityItem)
                              setActiveDistrict(null)
                              setCheckedStreet(null)
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs transition ${
                              isCurrent
                                ? 'bg-blue-50/80 font-extrabold text-[#2563eb]'
                                : 'font-medium text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <MapPin
                              className={`size-3.5 shrink-0 ${
                                isCurrent ? 'text-[#2563eb]' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{cityItem}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* العمود الأيمن: الأحياء أو الشوارع */}
                  <div className="flex flex-1 flex-col overflow-hidden sm:col-span-9">
                    <div className="flex items-center gap-6 border-b border-slate-100 px-4 pt-2.5 sm:px-6">
                      {hasDistrictsForActiveCity && (
                        <button
                          type="button"
                          onClick={() => setSubTab('districts')}
                          className={`border-b-2 pb-2 text-xs font-extrabold transition ${
                            subTab === 'districts'
                              ? 'border-[#2563eb] text-[#2563eb]'
                              : 'border-transparent text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {uiT.districtsTab}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSubTab('streets')}
                        className={`border-b-2 pb-2 text-xs font-extrabold transition ${
                          subTab === 'streets'
                            ? 'border-[#2563eb] text-[#2563eb]'
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {uiT.streetsTab}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                      {subTab === 'districts' && hasDistrictsForActiveCity ? (
                        <div>
                          <button
                            type="button"
                            onClick={handleWholeCityClick}
                            className="mb-5 inline-flex items-center rounded-full bg-[#2563eb] px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
                          >
                            {uiT.wholeCityBtn} ({activeCity})
                          </button>

                          {activeCity.toLowerCase() === 'tbilisi' ? (
                            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
                              {SIVRCE_TBILISI_COLUMNS.map((col) => (
                                <div key={col.title}>
                                  <strong className="mb-2.5 block text-xs font-extrabold text-[#0a1122]">
                                    {col.title}
                                  </strong>
                                  <div className="space-y-2">
                                    {col.keys.map((dKey) => {
                                      const isChecked =
                                        activeDistrict?.key.toLowerCase() ===
                                        dKey.toLowerCase()
                                      return (
                                        <label
                                          key={dKey}
                                          onClick={() =>
                                            handleSelectDistrictItem(dKey)
                                          }
                                          className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 hover:text-[#2563eb]"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            readOnly
                                            className="size-3.5 rounded border-slate-300 accent-[#2563eb]"
                                          />
                                          <span className="leading-snug">
                                            {dKey}
                                          </span>
                                        </label>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {currentCityDistricts.map((dist) => {
                                const isChecked =
                                  activeDistrict?.key === dist.key
                                return (
                                  <label
                                    key={dist.key}
                                    onClick={() =>
                                      handleSelectDistrictItem(dist.key)
                                    }
                                    className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563eb]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="size-3.5 rounded border-slate-300 accent-[#2563eb]"
                                    />
                                    <span>{dist.key}</span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ) : hasDistrictsForActiveCity && !activeDistrict ? (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-center text-xs font-medium text-slate-400 sm:text-sm">
                          {uiT.pickDistrictOrStreetHint}
                        </div>
                      ) : (
                        <div>
                          {!hasDistrictsForActiveCity && (
                            <button
                              type="button"
                              onClick={handleWholeCityClick}
                              className="mb-4 inline-flex items-center rounded-full bg-[#2563eb] px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
                            >
                              {uiT.wholeCityBtn} ({activeCity})
                            </button>
                          )}

                          <div className="space-y-1">
                            {currentDistrictStreets.length > 0 ? (
                              currentDistrictStreets.map((st) => {
                                const isChecked = checkedStreet?.name === st.en
                                return (
                                  <button
                                    key={st.slug}
                                    type="button"
                                    onClick={() =>
                                      setCheckedStreet(
                                        isChecked
                                          ? null
                                          : {
                                              name: st.en,
                                              display: st.display,
                                              areaId: st.areaId,
                                              districtKey: st.districtKey,
                                            }
                                      )
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-start transition ${
                                      isChecked
                                        ? 'bg-slate-100/80'
                                        : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="size-4 rounded border-slate-300 accent-[#2563eb]"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-bold text-[#0a1122] sm:text-sm">
                                        {st.display}
                                      </p>
                                      <p className="truncate text-[11px] text-slate-400">
                                        {st.districtKey}
                                      </p>
                                    </div>
                                  </button>
                                )
                              })
                            ) : (
                              <div className="flex h-48 items-center justify-center text-center text-xs text-slate-400">
                                {uiT.noStreetsForAreaHint}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* الفوتر */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setActiveCity(null)
                  setActiveDistrict(null)
                  setCheckedStreet(null)
                  setSearchQuery('')
                  setSubTab('districts')
                }}
                className="text-xs font-bold text-slate-600 hover:text-[#0a1122]"
              >
                {mT.clearBtn}
              </button>

              <button
                type="button"
                onClick={handleFinalSelectConfirm}
                className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-full bg-[#2563eb] px-7 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 sm:text-sm"
              >
                <span>{mT.selectBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}