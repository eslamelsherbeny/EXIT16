'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowUpLeft,
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  Loader2,
  Map,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { SIVRCE_POPULAR_CITIES } from './seller-location-modal'
import {
  Field,
  getOptionLabel,
  RequiredLabel,
  SivrceLocationModalPicker,
} from './seller-shared'

export { mapDetectedAddressToGeorgiaAreaId }

const POPULAR_GEORGIA_DEVELOPERS = [
  'ORBI Group',
  'Archi',
  'm² (m2)',
  'Next Group',
  'Alliance Group',
  'ELT Building',
  'Biograpi Living',
  'Mardi Holding',
  'Gumbati Group',
  'Dar Building',
]

function loadSellerMapLibre(): Promise<any> {
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

export function LocationSection({
  sectionRef,
  onHover,
  form,
  update,
  isExitDeal,
  isDirectSale,
  isRentDeal,
  fieldErrors = {},
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  form: Record<string, string>
  update: (k: string, v: string) => void
  isExitDeal: boolean
  isDirectSale: boolean
  isRentDeal: boolean
  fieldErrors?: Record<string, string>
}) {
  const { t: dict, locale, dir } = useTranslation()
  const fT = getSellerFormTranslations(locale as LocaleCode, dict)
  const locT = fT.locationSection

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapWrapperRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const streetDropdownRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isProgrammaticFlyRef = useRef<boolean>(false)

  const defaultAreaCoords = getCoordinatesForArea(
    form.location || 'Tbilisi - Saburtalo'
  )

  const initialLat = Number(form.lat) || defaultAreaCoords.lat
  const initialLng = Number(form.lng) || defaultAreaCoords.lng

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  })
  const [mapStyleMode, setMapStyleMode] = useState<
    '3d' | 'streets' | 'satellite'
  >('3d')
  const [is3dMode, setIs3dMode] = useState(true)
  const [isExpandedMap, setIsExpandedMap] = useState(false)
  const [isDraggingMap, setIsDraggingMap] = useState(false)
  const [mapFlyingLoading, setMapFlyingLoading] = useState(false)

  const [streetSuggestions, setStreetSuggestions] = useState<
    GeorgiaPlaceSuggestion[]
  >(() => getInstantLocalGeorgiaSuggestions('', locale as LocaleCode))
  const [streetSearchLoading, setStreetSearchLoading] = useState(false)
  const [streetDropdownOpen, setStreetDropdownOpen] = useState(false)
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false)
  const [pinSuccessFeedback, setPinSuccessFeedback] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        streetDropdownRef.current &&
        !streetDropdownRef.current.contains(e.target as Node)
      ) {
        setStreetDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const reverseGeocodeCoordinates = useCallback(
    async (lat: number, lng: number, shouldFly = false) => {
      setLiveCoords({ lat, lng })
      update('lat', String(lat.toFixed(6)))
      update('lng', String(lng.toFixed(6)))

      if (shouldFly && mapInstanceRef.current) {
        setMapFlyingLoading(true)
        isProgrammaticFlyRef.current = true
        mapInstanceRef.current.flyTo({
          center: [lng, lat],
          zoom: 17,
          pitch: is3dMode && mapStyleMode === '3d' ? 58 : 0,
          bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
          duration: 800,
        })
        setTimeout(() => {
          isProgrammaticFlyRef.current = false
          setMapFlyingLoading(false)
        }, 850)
      }

      setReverseGeoLoading(true)
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
          addr.county ||
          addr.state ||
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
          detectedSuburb ||
          ''
        const detectedHouseNo = addr.house_number || ''

        const matchedAreaId = mapDetectedAddressToGeorgiaAreaId(
          detectedCity,
          detectedSuburb
        )
        const displayParts = [detectedCity, detectedSuburb].filter(Boolean)
        const areaDisplayLabel =
          displayParts.length > 0
            ? displayParts.join(' — ')
            : getLocalizedGeorgiaAreaName(matchedAreaId, locale as LocaleCode)

        update('location', matchedAreaId)
        update('locationDisplay', areaDisplayLabel)
        if (detectedStreet) {
          update('exactStreet', detectedStreet)
        }
        if (detectedHouseNo) {
          update('houseNumber', detectedHouseNo)
        }

        setPinSuccessFeedback(true)
        setTimeout(() => setPinSuccessFeedback(false), 3500)
      } catch {
        // احتفاظ بالإحداثيات
      } finally {
        setReverseGeoLoading(false)
      }
    },
    [is3dMode, mapStyleMode, locale, update]
  )

  useEffect(() => {
    const q = (form.exactStreet || '').trim()
    const instantMatches = getInstantLocalGeorgiaSuggestions(
      q,
      locale as LocaleCode
    )
    setStreetSuggestions(instantMatches)

    if (!streetDropdownOpen || q.length < 2) {
      setStreetSearchLoading(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setStreetSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const cityContext = (form.locationDisplay || form.location || '')
          .split('-')[0]
          .split('—')[0]
          .split(',')[0]
          .trim()

        const combined = await searchGeorgiaPlacesLikeUber({
          query: q,
          cityContext,
          locale: locale as LocaleCode,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) {
          setStreetSuggestions(combined)
        }
      } finally {
        if (!controller.signal.aborted) {
          setStreetSearchLoading(false)
        }
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [
    form.exactStreet,
    form.location,
    form.locationDisplay,
    locale,
    streetDropdownOpen,
  ])

  useEffect(() => {
    let isMounted = true
    let map: any = null

    setMapFlyingLoading(true)
    loadSellerMapLibre()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: getReliableGeorgiaMapStyle(mapStyleMode),
          center: [liveCoords.lng, liveCoords.lat],
          zoom: 15.6,
          pitch: is3dMode && mapStyleMode === '3d' ? 58 : 0,
          bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
          attributionControl: false,
        })

        mapInstanceRef.current = map

        map.on('load', () => {
          if (mapStyleMode === '3d') {
            apply3DBuildingsToMap(map)
          } else {
            map.resize()
          }
          setMapFlyingLoading(false)
          setTimeout(() => map?.resize(), 150)
        })

        map.on('error', () => {
          setMapFlyingLoading(false)
        })

        map.on('dragstart', () => {
          setIsDraggingMap(true)
        })

        map.on('click', (e: any) => {
          const clickedLat = Number(e?.lngLat?.lat)
          const clickedLng = Number(e?.lngLat?.lng)
          if (Number.isFinite(clickedLat) && Number.isFinite(clickedLng)) {
            void reverseGeocodeCoordinates(clickedLat, clickedLng, true)
          }
        })

        map.on('dragend', () => {
          setIsDraggingMap(false)
          if (isProgrammaticFlyRef.current) return
          const center = map.getCenter()
          if (
            center &&
            Number.isFinite(center.lat) &&
            Number.isFinite(center.lng)
          ) {
            void reverseGeocodeCoordinates(
              Number(center.lat),
              Number(center.lng),
              false
            )
          }
        })
      })
      .catch(() => {
        setMapFlyingLoading(false)
      })

    const safetyTimer = setTimeout(() => {
      if (isMounted) setMapFlyingLoading(false)
    }, 2200)

    return () => {
      isMounted = false
      clearTimeout(safetyTimer)
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapStyleMode])

  const handleSelectStreetSuggestion = (item: GeorgiaPlaceSuggestion) => {
    setStreetDropdownOpen(false)
    setMapFlyingLoading(true)
    update('exactStreet', item.street)
    if (item.houseNumber) {
      update('houseNumber', item.houseNumber)
    }
    update('location', item.areaId)
    update('locationDisplay', item.displayAreaLabel)
    update('lat', String(item.lat.toFixed(6)))
    update('lng', String(item.lng.toFixed(6)))
    setLiveCoords({ lat: item.lat, lng: item.lng })

    if (mapInstanceRef.current) {
      isProgrammaticFlyRef.current = true
      mapInstanceRef.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 17,
        pitch: is3dMode && mapStyleMode === '3d' ? 58 : 0,
        bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
        duration: 850,
      })
      setTimeout(() => {
        isProgrammaticFlyRef.current = false
        setMapFlyingLoading(false)
      }, 900)
    } else {
      setMapFlyingLoading(false)
    }
    setPinSuccessFeedback(true)
    setTimeout(() => setPinSuccessFeedback(false), 3500)
  }

  // الـ GPS يجلب موقعك الفعلي بالظبط حتى لو كنت خارج جورجيا
  const handleDetectMyGps = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    setGpsLoading(true)
    setMapFlyingLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        const rawLat = pos.coords.latitude
        const rawLng = pos.coords.longitude
        void reverseGeocodeCoordinates(rawLat, rawLng, true)
      },
      () => {
        setGpsLoading(false)
        setMapFlyingLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleFocusOnMapPicker = () => {
    setStreetDropdownOpen(false)
    setIsExpandedMap(true)
    setTimeout(() => {
      mapInstanceRef.current?.resize()
      mapWrapperRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)
  }

  const toggle3dPitch = () => {
    const next3d = !is3dMode
    setIs3dMode(next3d)
    mapInstanceRef.current?.easeTo({
      pitch: next3d ? 58 : 0,
      bearing: next3d ? -15 : 0,
      duration: 500,
    })
  }

  const resetCompass = () => {
    mapInstanceRef.current?.easeTo({
      bearing: 0,
      pitch: is3dMode ? 55 : 0,
      duration: 450,
    })
  }

  return (
    <section
      ref={sectionRef}
      onClick={onHover}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-[#0a1122]">{locT.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {isRentDeal ? locT.subtitleRent : locT.subtitleSale}
          </p>
        </div>

        <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-extrabold text-red-600">
          {fT.requiredBadge}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div id="field-wrap-location">
          <SivrceLocationModalPicker
            label={locT.cityDistrictLabel}
            value={form.location}
            displayText={form.locationDisplay}
            error={fieldErrors.location}
            onSelectLocation={({
              areaId,
              displayLabel,
              street,
              houseNumber,
              lat,
              lng,
            }) => {
              update('location', areaId)
              update('locationDisplay', displayLabel)
              if (street) update('exactStreet', street)
              if (houseNumber) update('houseNumber', houseNumber)
              if (lat && lng) {
                setMapFlyingLoading(true)
                setLiveCoords({ lat, lng })
                update('lat', String(lat.toFixed(6)))
                update('lng', String(lng.toFixed(6)))
                if (mapInstanceRef.current) {
                  isProgrammaticFlyRef.current = true
                  mapInstanceRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 16.8,
                    pitch: is3dMode && mapStyleMode === '3d' ? 58 : 0,
                    bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
                    duration: 850,
                  })
                  setTimeout(() => {
                    isProgrammaticFlyRef.current = false
                    setMapFlyingLoading(false)
                  }, 900)
                } else {
                  setMapFlyingLoading(false)
                }
              }
            }}
          />
          {fieldErrors.location && (
            <p className="mt-1.5 text-start text-xs font-extrabold text-red-600">
              {fieldErrors.location}
            </p>
          )}
        </div>

        {(isExitDeal || isDirectSale) && (
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <div id="field-wrap-project">
                <Field
                  label={locT.projectLabel}
                  id="project"
                  placeholder={locT.projectPlaceholder}
                  value={form.project}
                  error={fieldErrors.project}
                  update={(v) => update('project', v)}
                />
              </div>

              <Field
                label={locT.developerLabel}
                id="developer"
                placeholder={locT.developerPlaceholder}
                value={form.developer}
                update={(v) => update('developer', v)}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-500">
                {locT.popularDevelopersHint}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_GEORGIA_DEVELOPERS.map((devName) => {
                  const isSelected =
                    form.developer.trim().toLowerCase() ===
                    devName.toLowerCase()
                  return (
                    <button
                      key={devName}
                      type="button"
                      onClick={() =>
                        update('developer', isSelected ? '' : devName)
                      }
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                        isSelected
                          ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-[#2563eb]'
                      }`}
                    >
                      {devName}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
          <div
            id="field-wrap-exactStreet"
            ref={streetDropdownRef}
            className="relative flex flex-col gap-2 sm:col-span-2"
          >
            <Label htmlFor="exactStreet" className="text-start">
              <RequiredLabel>{locT.streetLabel}</RequiredLabel>
            </Label>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="exactStreet"
                name="exactStreet"
                type="text"
                dir={dir}
                autoComplete="off"
                placeholder={locT.streetPlaceholder}
                value={form.exactStreet ?? ''}
                onFocus={() => setStreetDropdownOpen(true)}
                onChange={(e) => {
                  update('exactStreet', e.target.value)
                  setStreetDropdownOpen(true)
                }}
                className={`h-12 rounded-xl ps-10 pe-10 font-bold ${
                  fieldErrors.exactStreet
                    ? 'border-2 border-red-500 bg-red-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              />
              {streetSearchLoading ? (
                <Loader2 className="absolute top-1/2 end-3.5 size-4 -translate-y-1/2 animate-spin text-[#2563eb]" />
              ) : form.exactStreet ? (
                <button
                  type="button"
                  onClick={() => {
                    update('exactStreet', '')
                  }}
                  className="absolute top-1/2 end-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {fieldErrors.exactStreet ? (
              <p className="mt-1 text-start text-xs font-extrabold text-red-600">
                {fieldErrors.exactStreet}
              </p>
            ) : (
              <p className="text-start text-[11px] font-semibold text-slate-400">
                {locT.streetAutocompleteHint}
              </p>
            )}

            {streetDropdownOpen && (
              <div className="absolute top-[78px] z-40 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                  {streetSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectStreetSuggestion(item)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition hover:bg-blue-50/60"
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
                  ))}

                  <button
                    type="button"
                    onClick={handleFocusOnMapPicker}
                    className="flex w-full items-center justify-between gap-3 bg-slate-50/90 px-4 py-3 text-start transition hover:bg-emerald-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf8f2] text-[#007a5a]">
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-[#0a1122]">
                          {locT.cantFindAddressTitle}
                        </p>
                        <p className="text-[11px] font-bold text-[#007a5a]">
                          {locT.setLocationOnMapBtn}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Field
              label={locT.houseNoLabel}
              id="houseNumber"
              placeholder={locT.houseNoPlaceholder}
              value={form.houseNumber}
              update={(v) => update('houseNumber', v)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleFocusOnMapPicker}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-4 text-xs font-extrabold text-[#2563eb] transition hover:bg-blue-100/70"
          >
            <span>{locT.setLocationOnMapBtn}</span>
          </button>

          <button
            type="button"
            disabled={gpsLoading}
            onClick={handleDetectMyGps}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] px-4 text-xs font-extrabold text-[#007a5a] transition hover:bg-emerald-100/70 disabled:opacity-60"
          >
            {gpsLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Navigation className="size-4" />
            )}
            <span>{locT.detectMyGpsBtn}</span>
          </button>

          {reverseGeoLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{locT.reverseGeocodingLoading}</span>
            </span>
          )}

          {pinSuccessFeedback && !reverseGeoLoading && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-extrabold text-[#007a5a]">
              <CheckCircle2 className="size-3.5" />
              <span>{locT.pinMovedSuccess}</span>
            </span>
          )}
        </div>

        <Field
          label={locT.cadastralLabel}
          id="cadastralCode"
          placeholder={locT.cadastralPlaceholder}
          helper={locT.cadastralHelper}
          value={form.cadastralCode}
          update={(v) => update('cadastralCode', v)}
        />

        {/* الخريطة التفاعلية الكبيرة داخل الفورم (3D Buildings + Streets + Satellite) */}
        <div
          ref={mapWrapperRef}
          className="mt-4 overflow-hidden rounded-2xl border-2 border-slate-200 shadow-xs transition focus-within:border-[#2563eb]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-3 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                <Globe className="size-3.5 text-[#2563eb]" />
                <span>{locT.mapHeaderTitle}</span>
              </span>
              {SIVRCE_POPULAR_CITIES.slice(0, 8).map((city) => {
                const isActiveCity = (form.location || '')
                  .toLowerCase()
                  .includes(city.id.toLowerCase())
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setMapFlyingLoading(true)
                      const cityCoords = getCoordinatesForArea(
                        city.defaultAreaId
                      )
                      update('location', city.defaultAreaId)
                      update(
                        'locationDisplay',
                        getLocalizedGeorgiaAreaName(
                          city.defaultAreaId,
                          locale as LocaleCode
                        )
                      )
                      setLiveCoords({
                        lat: cityCoords.lat,
                        lng: cityCoords.lng,
                      })
                      update('lat', String(cityCoords.lat.toFixed(6)))
                      update('lng', String(cityCoords.lng.toFixed(6)))
                      if (mapInstanceRef.current) {
                        isProgrammaticFlyRef.current = true
                        mapInstanceRef.current.flyTo({
                          center: [cityCoords.lng, cityCoords.lat],
                          zoom: 15.2,
                          pitch: is3dMode && mapStyleMode === '3d' ? 58 : 0,
                          bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
                          duration: 850,
                        })
                        setTimeout(() => {
                          isProgrammaticFlyRef.current = false
                          setMapFlyingLoading(false)
                        }, 900)
                      } else {
                        setMapFlyingLoading(false)
                      }
                    }}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      isActiveCity
                        ? 'bg-[#2563eb] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {getOptionLabel(city, locale as LocaleCode)}
                  </button>
                )
              })}
            </div>

            <div className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setMapStyleMode('3d')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                  mapStyleMode === '3d'
                    ? 'bg-[#2563eb] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                🏢 3D
              </button>
              <button
                type="button"
                onClick={() => setMapStyleMode('streets')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                  mapStyleMode === 'streets'
                    ? 'bg-[#2563eb] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                🗺️ Streets
              </button>
              <button
                type="button"
                onClick={() => setMapStyleMode('satellite')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                  mapStyleMode === 'satellite'
                    ? 'bg-[#2563eb] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                🛰️ Satellite
              </button>
            </div>
          </div>

          <div
            dir="ltr"
            style={{ height: isExpandedMap ? '560px' : '420px' }}
            className="relative w-full cursor-grab overflow-hidden bg-[#dfe5dc] transition-all duration-300 active:cursor-grabbing"
          >
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: isExpandedMap ? '560px' : '420px',
              }}
              className="h-full w-full"
            />

            {/* شاشة التحميل عند الانتقال لأي مدينة أو شارع */}
            {(mapFlyingLoading || gpsLoading) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px]">
                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold text-[#0a1122] shadow-xl">
                  <Loader2 className="size-4 animate-spin text-[#2563eb]" />
                  <span>{fT.locationModal.searchingMapsText}</span>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute top-3 left-3 z-10 max-w-[75%]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-extrabold text-[#0a1122] shadow-md backdrop-blur-xs">
                <MapPin className="size-3.5 shrink-0 text-[#2563eb]" />
                <span className="truncate">
                  {form.exactStreet
                    ? `${form.exactStreet}${form.houseNumber ? ' ' + form.houseNumber : ''} · `
                    : ''}
                  {form.locationDisplay ||
                    getLocalizedGeorgiaAreaName(
                      form.location || 'Tbilisi - Saburtalo',
                      locale as LocaleCode
                    )}
                </span>
              </div>
            </div>

            {/* دبوس تفاعلي يرتفع للأعلى عند سحب الخريطة */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="flex flex-col items-center">
                <div
                  className={`flex size-12 items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-white shadow-2xl ring-4 ring-blue-500/25 transition-transform duration-200 ${
                    isDraggingMap ? '-translate-y-3 scale-110' : 'translate-y-0'
                  }`}
                >
                  <Building2 className="size-5" />
                </div>
                <div
                  className={`-mt-1 h-3.5 w-0 border-x-[7px] border-t-[10px] border-x-transparent border-t-[#2563eb] transition-transform duration-200 ${
                    isDraggingMap ? '-translate-y-3' : 'translate-y-0'
                  }`}
                />
                <div
                  className={`mt-0.5 rounded-full bg-black/30 blur-[1px] transition-all duration-200 ${
                    isDraggingMap ? 'h-1 w-2 opacity-40' : 'h-1.5 w-3.5'
                  }`}
                />
              </div>
            </div>

            <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="flex size-8 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="flex size-8 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              >
                <Minus className="size-4" />
              </button>
              {mapStyleMode === '3d' && (
                <button
                  type="button"
                  onClick={toggle3dPitch}
                  className={`flex size-8 items-center justify-center rounded-xl text-[11px] font-black transition ${
                    is3dMode
                      ? 'bg-[#2563eb] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  3D
                </button>
              )}
              <button
                type="button"
                onClick={resetCompass}
                className="flex size-8 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              >
                <Compass className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExpandedMap((p) => !p)
                  setTimeout(() => mapInstanceRef.current?.resize(), 320)
                }}
                className="flex size-8 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              >
                {isExpandedMap ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>
            </div>

            <div className="pointer-events-none absolute inset-x-3 bottom-2.5 z-10 flex justify-start">
              <span className="rounded-lg bg-white/95 px-3 py-1.5 text-[10.5px] font-extrabold text-[#0a1122] shadow-sm backdrop-blur-xs">
                📍 {locT.mapHint}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}