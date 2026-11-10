'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowUpLeft,
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  Loader2,
  Lock,
  Map,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  Search,
  Sparkles,
  Unlock,
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

const MAP_LOCK_I18N: Record<
  LocaleCode,
  {
    unlockBtn: string
    lockBtn: string
    lockedHint: string
  }
> = {
  ar: {
    unlockBtn: 'اضغط لتحريك الدبوس وتعديل الموقع',
    lockBtn: 'تثبيت وقفل الخريطة ✓',
    lockedHint: 'الخريطة مثبتة لمنع تغير العنوان أثناء التصفح',
  },
  en: {
    unlockBtn: 'Tap to move pin & adjust location',
    lockBtn: 'Lock map position ✓',
    lockedHint: 'Map locked to prevent accidental scroll changes',
  },
  ru: {
    unlockBtn: 'Нажмите, чтобы передвинуть пин',
    lockBtn: 'Зафиксировать карту ✓',
    lockedHint: 'Карта зафиксирована от случайного сдвига',
  },
  ka: {
    unlockBtn: 'დააჭირეთ პინის გადასაადგილებლად',
    lockBtn: 'რუკის დაფიქსირება ✓',
    lockedHint: 'რუკა დაბლოკილია შემთხვევითი გადაადგილებისგან',
  },
}

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
  const lockT =
    MAP_LOCK_I18N[locale as LocaleCode] || MAP_LOCK_I18N.ar

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapWrapperRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const streetDropdownRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isProgrammaticFlyRef = useRef<boolean>(false)
  const lastManualTypedRef = useRef<string>('')

  const defaultAreaCoords = getCoordinatesForArea(
    form.location || 'Tbilisi - Saburtalo'
  )

  const initialLat = Number(form.lat) || defaultAreaCoords.lat
  const initialLng = Number(form.lng) || defaultAreaCoords.lng

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  })
  const liveCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  })

  // قفل الخريطة افتراضياً أثناء التصفح لمنع تحرك الدبوس بالخطأ عند عمل Scroll باليد على الموبايل
  const [isMapInteractive, setIsMapInteractive] = useState(false)
  const isMapInteractiveRef = useRef(false)

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

  const syncCoords = useCallback(
    (lat: number, lng: number) => {
      liveCoordsRef.current = { lat, lng }
      setLiveCoords({ lat, lng })
      update('lat', String(lat.toFixed(6)))
      update('lng', String(lng.toFixed(6)))
    },
    [update]
  )

  // تفعيل أو تعطيل سحب الخريطة حسب حالة القفل
  const toggleMapLock = useCallback((enable: boolean) => {
    isMapInteractiveRef.current = enable
    setIsMapInteractive(enable)
    const map = mapInstanceRef.current
    if (!map) return
    try {
      if (enable) {
        map.dragPan?.enable()
        map.touchZoomRotate?.enable()
        map.doubleClickZoom?.enable()
      } else {
        map.dragPan?.disable()
        map.touchZoomRotate?.disable()
        map.doubleClickZoom?.disable()
      }
    } catch {}
  }, [])

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

  const flyMapToExactPoint = useCallback(
    (lat: number, lng: number, zoomLevel = 17) => {
      syncCoords(lat, lng)
      if (!mapInstanceRef.current) return
      setMapFlyingLoading(true)
      isProgrammaticFlyRef.current = true
      mapInstanceRef.current.flyTo({
        center: [lng, lat],
        zoom: zoomLevel,
        pitch: is3dMode && mapStyleMode === '3d' ? 56 : 0,
        bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
        duration: 750,
      })
      setTimeout(() => {
        isProgrammaticFlyRef.current = false
        setMapFlyingLoading(false)
      }, 800)
    },
    [is3dMode, mapStyleMode, syncCoords]
  )

  const reverseGeocodeCoordinates = useCallback(
    async (lat: number, lng: number, shouldFly = false) => {
      if (shouldFly) {
        flyMapToExactPoint(lat, lng, 17)
      } else {
        syncCoords(lat, lng)
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

        lastManualTypedRef.current = `${detectedStreet}|${detectedHouseNo}`
        update('location', matchedAreaId)
        update('locationDisplay', areaDisplayLabel)
        if (detectedStreet) update('exactStreet', detectedStreet)
        if (detectedHouseNo) update('houseNumber', detectedHouseNo)

        setPinSuccessFeedback(true)
        setTimeout(() => setPinSuccessFeedback(false), 3500)
      } catch {
        // احتفاظ بالإحداثيات
      } finally {
        setReverseGeoLoading(false)
      }
    },
    [flyMapToExactPoint, locale, syncCoords, update]
  )

  // عندما يعدل المستخدم اسم الشارع أو رقم العقار بيده، تتحدث الخريطة تلقائياً وتطير للعنوان الجديد!
  useEffect(() => {
    const streetClean = (form.exactStreet || '').trim()
    const houseClean = (form.houseNumber || '').trim()
    const signature = `${streetClean}|${houseClean}`

    if (
      streetClean.length < 3 ||
      signature === lastManualTypedRef.current ||
      streetDropdownOpen
    ) {
      return
    }

    const timer = setTimeout(async () => {
      lastManualTypedRef.current = signature
      try {
        const cityContext = (form.locationDisplay || form.location || 'Tbilisi')
          .split('-')[0]
          .split('—')[0]
          .split(',')[0]
          .trim()
        const fullQuery = `${streetClean} ${houseClean}, ${cityContext}`.trim()
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          fullQuery
        )}`
        const r = await fetch(url, {
          headers: { 'Accept-Language': `${locale},en;q=0.9` },
        })
        const d = await r.json()
        if (Array.isArray(d) && d[0]) {
          const nextLat = Number(d[0].lat)
          const nextLng = Number(d[0].lon)
          if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
            flyMapToExactPoint(nextLat, nextLng, 17.2)
          }
        }
      } catch {}
    }, 850)

    return () => clearTimeout(timer)
  }, [
    form.exactStreet,
    form.houseNumber,
    form.location,
    form.locationDisplay,
    locale,
    streetDropdownOpen,
    flyMapToExactPoint,
  ])

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
          center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
          zoom: 16,
          pitch: is3dMode && mapStyleMode === '3d' ? 56 : 0,
          bearing: is3dMode && mapStyleMode === '3d' ? -15 : 0,
          attributionControl: false,
          scrollZoom: false,
          dragPan: isMapInteractiveRef.current,
          touchZoomRotate: isMapInteractiveRef.current,
          doubleClickZoom: isMapInteractiveRef.current,
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
          if (!isMapInteractiveRef.current) return
          setIsDraggingMap(true)
        })

        map.on('click', (e: any) => {
          if (!isMapInteractiveRef.current) return
          const clickedLat = Number(e?.lngLat?.lat)
          const clickedLng = Number(e?.lngLat?.lng)
          if (Number.isFinite(clickedLat) && Number.isFinite(clickedLng)) {
            void reverseGeocodeCoordinates(clickedLat, clickedLng, true)
          }
        })

        map.on('dragend', () => {
          setIsDraggingMap(false)
          if (!isMapInteractiveRef.current || isProgrammaticFlyRef.current) {
            return
          }
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
    lastManualTypedRef.current = `${item.street}|${item.houseNumber || ''}`
    update('exactStreet', item.street)
    if (item.houseNumber) {
      update('houseNumber', item.houseNumber)
    }
    update('location', item.areaId)
    update('locationDisplay', item.displayAreaLabel)
    flyMapToExactPoint(item.lat, item.lng, 17)
    setPinSuccessFeedback(true)
    setTimeout(() => setPinSuccessFeedback(false), 3500)
  }

  const handleDetectMyGps = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    setGpsLoading(true)
    setMapFlyingLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        void reverseGeocodeCoordinates(
          pos.coords.latitude,
          pos.coords.longitude,
          true
        )
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
    toggleMapLock(true)
    setTimeout(() => {
      mapInstanceRef.current?.resize()
      mapWrapperRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)
  }

  // تثبيت مركز الخريطة عند التكبير والتصغير حتى لا ينحرف الدبوس عن الموقع المختار أبداً
  const handleZoomAroundCenter = (delta: number) => {
    const map = mapInstanceRef.current
    if (!map) return
    isProgrammaticFlyRef.current = true
    const nextZoom = Math.min(19.5, Math.max(9, (map.getZoom() || 16) + delta))
    map.easeTo({
      center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
      zoom: nextZoom,
      duration: 300,
    })
    setTimeout(() => {
      isProgrammaticFlyRef.current = false
    }, 350)
  }

  const toggle3dPitch = () => {
    const next3d = !is3dMode
    setIs3dMode(next3d)
    mapInstanceRef.current?.easeTo({
      center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
      pitch: next3d ? 56 : 0,
      bearing: next3d ? -15 : 0,
      duration: 450,
    })
  }

  const resetCompass = () => {
    mapInstanceRef.current?.easeTo({
      center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
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
              lastManualTypedRef.current = `${street || form.exactStreet || ''}|${houseNumber || form.houseNumber || ''}`
              if (lat && lng) {
                flyMapToExactPoint(lat, lng, 17)
                toggleMapLock(false)
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

        {/* الخريطة التفاعلية المحمية من اللمس الخاطئ أثناء التصفح */}
        <div
          ref={mapWrapperRef}
          className={`mt-4 overflow-hidden rounded-2xl border-2 shadow-xs transition ${
            isMapInteractive ? 'border-[#2563eb]' : 'border-slate-200'
          }`}
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
                      flyMapToExactPoint(
                        cityCoords.lat,
                        cityCoords.lng,
                        15.2
                      )
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
            style={{ height: isExpandedMap ? '500px' : '360px' }}
            className="relative w-full overflow-hidden bg-[#dfe5dc] transition-all duration-300"
          >
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: isExpandedMap ? '500px' : '360px',
              }}
              className="h-full w-full"
            />

            {/* طبقة حماية الـ Scroll على الموبايل: تمنع تحرك الدبوس بالخطأ إلا عندما يضغط المستخدم "تعديل الموقع" */}
            {!isMapInteractive && (
              <div
                onClick={() => toggleMapLock(true)}
                className="absolute inset-0 z-15 flex cursor-pointer items-end justify-center bg-black/5 pb-12 transition hover:bg-black/10"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMapLock(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-[#0a1122]/90 px-4 py-2 text-xs font-extrabold text-white shadow-xl backdrop-blur-md transition hover:scale-105"
                >
                  <Unlock className="size-3.5 text-emerald-400" />
                  <span>{lockT.unlockBtn}</span>
                </button>
              </div>
            )}

            {isMapInteractive && (
              <div className="absolute bottom-11 left-1/2 z-20 -translate-x-1/2">
                <button
                  type="button"
                  onClick={() => toggleMapLock(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#007a5a] px-4 py-1.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-[#006248]"
                >
                  <Lock className="size-3.5" />
                  <span>{lockT.lockBtn}</span>
                </button>
              </div>
            )}

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

            <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="flex flex-col items-center">
                <div
                  className={`flex size-11 items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-white shadow-2xl ring-4 ring-blue-500/25 transition-transform duration-200 ${
                    isDraggingMap ? '-translate-y-3 scale-110' : 'translate-y-0'
                  }`}
                >
                  <Building2 className="size-5" />
                </div>
                <div
                  className={`-mt-1 h-3 w-0 border-x-[6px] border-t-[9px] border-x-transparent border-t-[#2563eb] transition-transform duration-200 ${
                    isDraggingMap ? '-translate-y-3' : 'translate-y-0'
                  }`}
                />
                <div
                  className={`mt-0.5 rounded-full bg-black/30 blur-[1px] transition-all duration-200 ${
                    isDraggingMap ? 'h-1 w-2 opacity-40' : 'h-1.5 w-3'
                  }`}
                />
              </div>
            </div>

            <div className="absolute top-3 right-3 z-20 flex flex-col items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleZoomAroundCenter(1)}
                className="flex size-8 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleZoomAroundCenter(-1)}
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
              <span className="rounded-lg bg-white/95 px-3 py-1 text-[10.5px] font-extrabold text-[#0a1122] shadow-sm backdrop-blur-xs">
                📍 {isMapInteractive ? locT.mapHint : lockT.lockedHint}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}