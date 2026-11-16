'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
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
  SIVRCE_BUYER_MUNICIPALITIES_AZ,
  SIVRCE_BUYER_POPULAR_CITIES,
  SIVRCE_BUYER_SIDEBAR_CITIES,
  SIVRCE_CITY_DISTRICT_COLUMNS,
  SIVRCE_DISTRICTS_AZ_DIRECTORY,
} from '@/components/features/buyer/buyer-location-modal'
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
import { RequiredLabel } from './seller-shared'

export const SIVRCE_POPULAR_CITIES = SIVRCE_BUYER_POPULAR_CITIES.map((id) => ({
  id,
  ar: id,
  en: id,
  ru: id,
  ka: id,
}))

export const SIVRCE_MUNICIPALITIES_AZ = SIVRCE_BUYER_MUNICIPALITIES_AZ
export const SIVRCE_SIDEBAR_CITIES = SIVRCE_BUYER_SIDEBAR_CITIES
export const SIVRCE_TBILISI_COLUMNS = SIVRCE_CITY_DISTRICT_COLUMNS.Tbilisi

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

function isCoordInsideGeorgia(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 40.9 &&
    lat <= 43.7 &&
    lng >= 39.8 &&
    lng <= 46.9
  )
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
  const activeLocale = (locale as LocaleCode) || 'ar'
  const fT = getSellerFormTranslations(activeLocale, dict)
  const mT = fT.locationModal
  const uiT = dict.locationModal

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
  const [gpsOutsideWarning, setGpsOutsideWarning] = useState('')

  const resolvedDisplay =
    displayText ||
    (value ? getLocalizedGeorgiaAreaName(value, activeLocale) : '')

  const activeCityColumns = useMemo(() => {
    if (!activeCity) return []
    const foundKey = Object.keys(SIVRCE_CITY_DISTRICT_COLUMNS).find(
      (k) => k.toLowerCase() === activeCity.toLowerCase()
    )
    return foundKey ? SIVRCE_CITY_DISTRICT_COLUMNS[foundKey] : []
  }, [activeCity])

  const currentCityDistricts = useMemo(() => {
    if (!activeCity) return []
    return getCityDistrictsFromDb(activeCity, activeLocale)
  }, [activeCity, activeLocale])

  const hasDistrictsForActiveCity =
    activeCityColumns.length > 0 || currentCityDistricts.length > 0

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
      activeLocale
    )
  }, [activeCity, activeDistrict, hasDistrictsForActiveCity, activeLocale])

  const liveGeoResults = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return []
    return getInstantLocalGeorgiaSuggestions(q, activeLocale, activeCity)
  }, [searchQuery, activeLocale, activeCity])

  const handleNearbyClick = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    setNearbyLoading(true)
    setGpsOutsideWarning('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude

          if (!isCoordInsideGeorgia(lat, lng)) {
            setGpsOutsideWarning(uiT.outsideGeorgiaGpsWarning)
            return
          }

          const resolved = await reverseGeocodeGeorgiaPin({
            lat,
            lng,
            locale: activeLocale,
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
  }

  const handlePickDistrictFromAZDirectory = (item: {
    district: string
    city: string
    areaId: string
  }) => {
    setGpsOutsideWarning('')
    setActiveCity(item.city)
    setActiveDistrict({
      key: item.district,
      label: item.district,
      areaId: item.areaId,
    })
    setCheckedStreet(null)
    setSubTab('districts')
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
          onClick: () => {
            setGpsOutsideWarning('')
            setOpen(true)
          },
          resolvedDisplay,
        })
      ) : (
        <button
          type="button"
          onClick={() => {
            setGpsOutsideWarning('')
            setOpen(true)
          }}
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
            <span
              className={`truncate ${
                !value
                  ? 'text-[11px] font-normal text-slate-300 sm:text-xs'
                  : ''
              }`}
            >
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
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[20px] bg-white shadow-2xl sm:h-[630px] sm:rounded-[20px]"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2.5 sm:px-6">
              <div className="flex items-center gap-2">
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
                    className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                  </button>
                )}
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                  {mT.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {activeCity && (
              <div className="flex flex-wrap items-center gap-2 px-5 pb-2 sm:px-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  <span>{activeCity}</span>
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                    <span>{activeDistrict.key}</span>
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                    <span>{checkedStreet.display}</span>
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

            <div className="px-5 pb-3 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={mT.searchPlaceholder}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white ps-10 pe-9 text-start text-xs text-slate-800 transition focus:border-[#2563eb] focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 end-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              {searchQuery.trim().length >= 1 && (
                <div className="mt-1.5 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
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
                      className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-start transition hover:bg-blue-50/60"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                          <MapPin className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {item.primaryText}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {item.secondaryText}
                          </p>
                        </div>
                      </div>
                      <ArrowUpLeft className="size-3.5 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!activeCity ? (
              <div className="flex-1 overflow-y-auto px-5 py-1 sm:px-6">
                <button
                  type="button"
                  disabled={nearbyLoading}
                  onClick={handleNearbyClick}
                  className="flex w-full flex-col items-start justify-center rounded-xl bg-[#f8f9fb] p-4 text-start transition hover:bg-[#f1f4f9] disabled:opacity-60"
                >
                  <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-2xs">
                    {nearbyLoading ? (
                      <Loader2 className="size-4 animate-spin text-[#2563eb]" />
                    ) : (
                      <LocateFixed className="size-4" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {mT.nearbyTitle}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    {mT.nearbySub}
                  </span>
                </button>

                {gpsOutsideWarning && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-start text-xs leading-relaxed font-semibold text-amber-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>{gpsOutsideWarning}</span>
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      {mT.popularCitiesTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGpsOutsideWarning('')
                        setActiveCity('Tbilisi')
                        setActiveDistrict(null)
                        setCheckedStreet(null)
                        setSubTab('districts')
                      }}
                      className="text-[11px] font-semibold text-[#2563eb] hover:underline"
                    >
                      {uiT.browseAllCitiesBtn}
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {SIVRCE_BUYER_POPULAR_CITIES.map((cityEn) => (
                      <button
                        key={cityEn}
                        type="button"
                        onClick={() => {
                          setGpsOutsideWarning('')
                          setActiveCity(cityEn)
                          setActiveDistrict(null)
                          setCheckedStreet(null)
                          setSubTab('districts')
                        }}
                        className="group flex h-11 items-center justify-between rounded-xl bg-[#f8f9fb] px-3.5 text-xs font-semibold text-slate-800 transition hover:bg-[#eef2f6] hover:text-[#2563eb]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="size-3.5 shrink-0 text-slate-400 group-hover:text-[#2563eb]" />
                          <span className="truncate">{cityEn}</span>
                        </div>
                        <ChevronLeft className="size-3.5 shrink-0 text-slate-300 transition group-hover:text-[#2563eb] ltr:rotate-180" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pb-5">
                  <span className="block text-[11px] font-medium text-slate-400">
                    {uiT.districtsAZTitle}
                  </span>
                  <div className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                    {Object.entries(SIVRCE_DISTRICTS_AZ_DIRECTORY).map(
                      ([letter, list]) => (
                        <div key={letter} className="text-start">
                          <div className="mb-2 rounded-lg bg-[#f8f9fb] px-3 py-1 text-xs font-semibold text-slate-500">
                            {letter}
                          </div>
                          <ul className="space-y-1.5 px-1">
                            {list.map((item) => (
                              <li key={`${item.district}-${item.city}`}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePickDistrictFromAZDirectory(item)
                                  }
                                  className="flex w-full items-center justify-between gap-2 py-0.5 text-start text-xs font-normal text-slate-700 hover:font-semibold hover:text-[#2563eb]"
                                >
                                  <span className="truncate">
                                    {item.district}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-slate-400">
                                    {item.city}
                                  </span>
                                </button>
                              </li>
                            ))}
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
                  <div className="flex max-h-36 flex-col overflow-hidden border-b border-slate-100 sm:col-span-3 sm:max-h-none sm:border-e sm:border-b-0">
                    <div className="border-b border-slate-100 px-5 py-2.5 text-start text-xs font-semibold text-slate-500">
                      {uiT.citiesHeader}
                    </div>
                    <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
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
                              setSubTab('districts')
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-start text-xs transition ${
                              isCurrent
                                ? 'bg-blue-50/80 font-bold text-[#2563eb]'
                                : 'font-normal text-slate-600 hover:bg-slate-50'
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

                  <div className="flex flex-1 flex-col overflow-hidden sm:col-span-9">
                    <div className="flex items-center gap-6 border-b border-slate-100 px-5 pt-2.5">
                      {hasDistrictsForActiveCity && (
                        <button
                          type="button"
                          onClick={() => setSubTab('districts')}
                          className={`border-b-2 pb-2 text-xs font-bold transition ${
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
                        className={`flex items-center gap-1.5 border-b-2 pb-2 text-xs font-bold transition ${
                          subTab === 'streets'
                            ? 'border-[#2563eb] text-[#2563eb]'
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <span>{uiT.streetsTab}</span>
                        {activeDistrict && currentDistrictStreets.length > 0 && (
                          <span className="rounded-full bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-[#2563eb]">
                            {currentDistrictStreets.length}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 text-start">
                      {subTab === 'districts' && hasDistrictsForActiveCity ? (
                        <div>
                          <button
                            type="button"
                            onClick={handleWholeCityClick}
                            className="mb-5 inline-flex items-center rounded-full bg-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            {uiT.wholeCityBtn} ({activeCity})
                          </button>

                          {activeCityColumns.length > 0 ? (
                            <div
                              className={`grid grid-cols-2 gap-5 text-start ${
                                activeCityColumns.length >= 5
                                  ? 'sm:grid-cols-3 md:grid-cols-5'
                                  : 'sm:grid-cols-3'
                              }`}
                            >
                              {activeCityColumns.map((col) => (
                                <div key={col.title}>
                                  <strong className="mb-2.5 block text-xs font-bold text-slate-800">
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
                                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-start text-xs transition ${
                                            isChecked
                                              ? 'bg-blue-50/80 font-bold text-[#2563eb]'
                                              : 'font-normal text-slate-600 hover:text-[#2563eb]'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            readOnly
                                            className="size-3.5 shrink-0 rounded border-slate-300 accent-[#2563eb]"
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
                            <div className="grid grid-cols-2 gap-3 text-start sm:grid-cols-3">
                              {currentCityDistricts.map((dist) => {
                                const isChecked =
                                  activeDistrict?.key === dist.key
                                return (
                                  <label
                                    key={dist.key}
                                    onClick={() =>
                                      handleSelectDistrictItem(dist.key)
                                    }
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-start text-xs transition ${
                                      isChecked
                                        ? 'bg-blue-50/80 font-bold text-[#2563eb]'
                                        : 'font-normal text-slate-600 hover:bg-slate-50 hover:text-[#2563eb]'
                                    }`}
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
                        <div className="flex h-full min-h-[200px] items-center justify-center text-center text-xs text-slate-400">
                          {uiT.pickDistrictOrStreetHint}
                        </div>
                      ) : (
                        <div>
                          {!hasDistrictsForActiveCity && (
                            <button
                              type="button"
                              onClick={handleWholeCityClick}
                              className="mb-4 inline-flex items-center rounded-full bg-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              {uiT.wholeCityBtn} ({activeCity})
                            </button>
                          )}

                          <div className="space-y-1 text-start">
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
                                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-start transition ${
                                      isChecked
                                        ? 'bg-slate-100/80'
                                        : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="size-3.5 shrink-0 rounded border-slate-300 accent-[#2563eb]"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-semibold text-slate-800">
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
                              <div className="flex h-44 items-center justify-center text-center text-xs text-slate-400">
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

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setActiveCity(null)
                  setActiveDistrict(null)
                  setCheckedStreet(null)
                  setSearchQuery('')
                  setGpsOutsideWarning('')
                  setSubTab('districts')
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                {mT.clearBtn}
              </button>

              <button
                type="button"
                onClick={handleFinalSelectConfirm}
                className="inline-flex min-w-[100px] items-center justify-center rounded-full bg-[#2563eb] px-6 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
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