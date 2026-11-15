'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CloudSun,
  Compass,
  Footprints,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plane,
  Plus,
  TrainFront,
} from 'lucide-react'
import {
  fetchRealNearbyPlacesAndWeatherAction,
  type RealNearbyPlaceItem,
} from '@/actions/georgia-geocode-action'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  apply3DBuildingsToMap,
  geocodeExactBuildingInGeorgia,
  getReliableGeorgiaMapStyle,
  highlight3DBuildingAtCoordinates,
  type GeorgiaMapThemeMode,
} from '@/lib/georgia-uber-search'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  CATEGORY_ICONS,
  INSIGHTS_I18N,
  MAP_STYLE_OPTIONS,
  calculateSivrceMobilityBreakdown,
  formatTravelEstimate,
  getLocalizedPlaceName,
  type NearbyCategoryKey,
} from './location-insights-data'
import { SunAndDaylightInteractiveCard } from './unit-sun-daylight-card'

function loadMapLibreFromCDN(): Promise<any> {
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

function createExactUnitPinElement(): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.alignItems = 'center'
  wrapper.innerHTML = `
    <div style="width: 40px; height: 40px; border-radius: 9999px; border: 3px solid #ffffff; background: #ea580c; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 22px rgba(0,0,0,0.3);">
      <div style="width: 12px; height: 12px; border-radius: 9999px; background: #ffffff;"></div>
    </div>
    <div style="margin-top: -3px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 9px solid #ea580c;"></div>
    <div style="margin-top: 2px; width: 12px; height: 5px; border-radius: 9999px; background: rgba(0,0,0,0.32); filter: blur(1px);"></div>
  `
  return wrapper
}

export function UnitLocationInsights({
  unitId,
  areaId,
  locationDisplay,
  exactStreet,
  houseNumber,
  savedLat,
  savedLng,
  cachedPlaces,
  locale = 'ar',
}: {
  unitId?: string
  areaId: string | null
  locationDisplay?: string
  exactStreet?: string
  houseNumber?: string
  savedLat?: number | null
  savedLng?: number | null
  cachedPlaces?: RealNearbyPlaceItem[] | null
  t?: any
  locale?: string
}) {
  const { t: dict } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const baseI18n = INSIGHTS_I18N[activeLocale] || INSIGHTS_I18N.ar
  const customInsights =
    (dict.unitDetailsPage as any)?.locationInsights || {}
  const iT = {
    ...baseI18n,
    ...customInsights,
    categories: {
      ...baseI18n.categories,
      ...(customInsights.categories || {}),
    },
  }

  const defaultCoords = getCoordinatesForArea(areaId)
  const hasSavedExactCoords = Boolean(
    savedLat &&
      savedLng &&
      Number.isFinite(Number(savedLat)) &&
      Number.isFinite(Number(savedLng)) &&
      Number(savedLat) >= 40.9 &&
      Number(savedLat) <= 43.7 &&
      Number(savedLng) >= 39.8 &&
      Number(savedLng) <= 46.9
  )

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: hasSavedExactCoords ? Number(savedLat) : defaultCoords.lat,
    lng: hasSavedExactCoords ? Number(savedLng) : defaultCoords.lng,
  }))

  const localizedArea =
    locationDisplay || getLocalizedGeorgiaAreaName(areaId, activeLocale)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const styleMenuRef = useRef<HTMLDivElement | null>(null)

  const [isLocationSectionOpen, setIsLocationSectionOpen] = useState(true)
  const [mapStyleMode, setMapStyleMode] =
    useState<GeorgiaMapThemeMode>('realistic')
  const [styleMenuOpen, setStyleMenuOpen] = useState(false)
  const [is3D, setIs3D] = useState(true)
  const is3DRef = useRef(true)
  is3DRef.current = is3D

  const [isFullscreenMap, setIsFullscreenMap] = useState(false)
  const [activeCategory, setActiveCategory] =
    useState<NearbyCategoryKey>('all')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  )

  const hasInitialCachedPlaces =
    Array.isArray(cachedPlaces) && cachedPlaces.length >= 10
  const [places, setPlaces] = useState<RealNearbyPlaceItem[]>(() =>
    hasInitialCachedPlaces ? cachedPlaces! : []
  )
  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(
    !hasInitialCachedPlaces
  )
  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number
    aqi: number
  }>({ temp: 18, aqi: 22 })

  const isPureRasterMode =
    mapStyleMode === 'photoreal' || mapStyleMode === 'satellite'

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        styleMenuRef.current &&
        !styleMenuRef.current.contains(e.target as Node)
      ) {
        setStyleMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (hasSavedExactCoords) {
      setCoords({ lat: Number(savedLat), lng: Number(savedLng) })
      return
    }

    const street = String(exactStreet || '').trim()
    const house = String(houseNumber || '').trim()
    if (street.length < 3) {
      setCoords({ lat: defaultCoords.lat, lng: defaultCoords.lng })
      return
    }

    const rawLoc = String(locationDisplay || areaId || 'Tbilisi').trim()
    const cityPart = rawLoc.includes(',')
      ? rawLoc.split(',').pop()!.trim()
      : rawLoc.split(/[-—]/)[0].trim()
    const distPart = rawLoc.includes(',') ? rawLoc.split(',')[0].trim() : ''

    let cancelled = false
    geocodeExactBuildingInGeorgia({
      street,
      houseNumber: house,
      district: distPart,
      city: cityPart || 'Tbilisi',
    })
      .then((res) => {
        if (
          !cancelled &&
          res &&
          Number.isFinite(res.lat) &&
          Number.isFinite(res.lng)
        ) {
          setCoords({ lat: res.lat, lng: res.lng })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [
    hasSavedExactCoords,
    savedLat,
    savedLng,
    exactStreet,
    houseNumber,
    areaId,
    locationDisplay,
    defaultCoords.lat,
    defaultCoords.lng,
  ])

  useEffect(() => {
    // If cached places are already loaded from Supabase DB, render in 0ms!
    if (hasInitialCachedPlaces && cachedPlaces) {
      setPlaces(cachedPlaces)
      setLoadingPlaces(false)
      return
    }

    let isCancelled = false
    const storageCacheKey = `aqar_nearby_v5_${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}_${activeLocale}`

    try {
      const localCached = sessionStorage.getItem(storageCacheKey)
      if (localCached) {
        const parsed = JSON.parse(localCached)
        if (Array.isArray(parsed?.places) && parsed.places.length >= 10) {
          setPlaces(parsed.places)
          if (parsed.temp !== undefined) {
            setWeatherInfo({ temp: parsed.temp, aqi: parsed.aqi || 22 })
          }
          setLoadingPlaces(false)
          return
        }
      }
    } catch {}

    setLoadingPlaces(true)

    fetchRealNearbyPlacesAndWeatherAction({
      lat: coords.lat,
      lng: coords.lng,
      locale: activeLocale,
      unitId,
    })
      .then((res) => {
        if (isCancelled) return
        if (Array.isArray(res.places) && res.places.length > 0) {
          setPlaces(res.places)
          try {
            sessionStorage.setItem(storageCacheKey, JSON.stringify(res))
          } catch {}
        }
        setWeatherInfo({ temp: res.temp, aqi: res.aqi })
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setLoadingPlaces(false)
      })

    return () => {
      isCancelled = true
    }
  }, [
    coords.lat,
    coords.lng,
    activeLocale,
    unitId,
    hasInitialCachedPlaces,
    cachedPlaces,
  ])

  const mobilityBreakdown = useMemo(
    () =>
      calculateSivrceMobilityBreakdown(
        places,
        coords.lat,
        coords.lng,
        activeLocale
      ),
    [places, coords.lat, coords.lng, activeLocale]
  )

  useEffect(() => {
    if (!isLocationSectionOpen) return
    let isMounted = true
    let map: any = null
    let marker: any = null

    loadMapLibreFromCDN()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: getReliableGeorgiaMapStyle(mapStyleMode),
          center: [coords.lng, coords.lat],
          zoom: 17.3,
          pitch: is3DRef.current && !isPureRasterMode ? 54 : 0,
          bearing: is3DRef.current && !isPureRasterMode ? -14 : 0,
          attributionControl: false,
          cooperativeGestures: true,
          locale: {
            'ScrollZoomBlocker.CtrlMessage': iT.windowsHelpText,
            'ScrollZoomBlocker.CmdMessage': iT.macHelpText,
            'TouchPanBlocker.Message': iT.mobileHelpText,
          },
        })

        mapInstanceRef.current = map

        const pinEl = createExactUnitPinElement()
        marker = new maplibregl.Marker({
          element: pinEl,
          anchor: 'bottom',
        })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map)

        markerInstanceRef.current = marker

        map.on('load', () => {
          if (!isPureRasterMode) {
            apply3DBuildingsToMap(
              map,
              activeLocale,
              mapStyleMode,
              is3DRef.current
            )
            highlight3DBuildingAtCoordinates(map, coords.lng, coords.lat)
          } else {
            map.resize()
          }
          setTimeout(() => map?.resize(), 120)
        })

        map.on('idle', () => {
          if (!isPureRasterMode) {
            highlight3DBuildingAtCoordinates(map, coords.lng, coords.lat)
          }
        })
      })
      .catch(() => {})

    return () => {
      isMounted = false
      if (marker) {
        marker.remove()
        markerInstanceRef.current = null
      }
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [
    coords.lat,
    coords.lng,
    isLocationSectionOpen,
    mapStyleMode,
    isPureRasterMode,
    activeLocale,
    iT.windowsHelpText,
    iT.macHelpText,
    iT.mobileHelpText,
  ])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    setTimeout(() => {
      map.resize()
      if (!isPureRasterMode && map.isStyleLoaded?.()) {
        apply3DBuildingsToMap(map, activeLocale, mapStyleMode, is3D)
        highlight3DBuildingAtCoordinates(map, coords.lng, coords.lat)
      }
    }, 120)
  }, [
    is3D,
    isFullscreenMap,
    activeLocale,
    mapStyleMode,
    isPureRasterMode,
    coords.lng,
    coords.lat,
  ])

  const handleZoomAroundUnit = useCallback(
    (delta: number) => {
      const map = mapInstanceRef.current
      if (!map) return
      const nextZoom = Math.min(
        19.5,
        Math.max(9, (map.getZoom() || 17) + delta)
      )
      map.easeTo({
        center: [coords.lng, coords.lat],
        zoom: nextZoom,
        duration: 250,
      })
    },
    [coords.lat, coords.lng]
  )

  const toggle3DPitch = () => {
    if (isPureRasterMode) {
      setMapStyleMode('realistic')
      setIs3D(true)
      return
    }
    const next3D = !is3D
    setIs3D(next3D)
    mapInstanceRef.current?.easeTo({
      center: [coords.lng, coords.lat],
      pitch: next3D ? 54 : 0,
      bearing: next3D ? -14 : 0,
      duration: 420,
    })
  }

  const visibleCategories =
    activeCategory === 'all'
      ? CATEGORY_ICONS.filter(
          (c) =>
            places.some((p) => p.category === c.key) ||
            [
              'school',
              'kindergarten',
              'pharmacy',
              'market',
              'restaurants',
              'clinic',
              'university',
              'bus',
            ].includes(c.key)
        )
      : CATEGORY_ICONS.filter((c) => c.key === activeCategory)

  const fullAddressLabel = exactStreet
    ? `${localizedArea} · ${exactStreet}${houseNumber ? ' ' + houseNumber : ''}`
    : localizedArea

  const isWaitingForInitialPlaces = loadingPlaces && places.length === 0

  return (
    <>
      <section className="mt-4 rounded-[20px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
        <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
          {iT.neighborhoodTitle}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-gray-500">
          {isWaitingForInitialPlaces ? (
            <span className="inline-flex items-center gap-1.5 text-[#2563eb]">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{iT.calculatingNeighborhoodText}</span>
            </span>
          ) : (
            <>
              {iT.neighborhoodSubPrefix}
              {places.length} {iT.neighborhoodSubSuffix}
            </>
          )}
        </p>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <Footprints className="size-3.5 text-[#2563eb]" />
                <span>{iT.walkScoreLabel}</span>
              </span>
              <strong className="font-black text-[#0a1122]">
                {isWaitingForInitialPlaces ? '—' : mobilityBreakdown.walkScore}
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full bg-[#2563eb] transition-all duration-500 ${
                  isWaitingForInitialPlaces ? 'w-2/3 animate-pulse opacity-40' : ''
                }`}
                style={
                  isWaitingForInitialPlaces
                    ? undefined
                    : { width: `${mobilityBreakdown.walkScore}%` }
                }
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <TrainFront className="size-3.5 text-[#2563eb]" />
                <span>{iT.mobilityScoreLabel}</span>
              </span>
              <strong className="font-black text-[#0a1122]">
                {isWaitingForInitialPlaces
                  ? '—'
                  : mobilityBreakdown.mobilityScore}
              </strong>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full bg-[#2563eb] transition-all duration-500 ${
                  isWaitingForInitialPlaces ? 'w-2/3 animate-pulse opacity-40' : ''
                }`}
                style={
                  isWaitingForInitialPlaces
                    ? undefined
                    : { width: `${mobilityBreakdown.mobilityScore}%` }
                }
              />
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-gray-100 pt-3.5 text-[11.5px]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.metroRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {mobilityBreakdown.metro.name} ·{' '}
                    <span dir="ltr">{mobilityBreakdown.metro.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.metro.points}/30
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563eb]">
                  🚗 ~{mobilityBreakdown.metro.driveMin} {iT.minWord} ·{' '}
                  {iT.bestBadge}
                </span>
                <span>
                  🚌 ~{mobilityBreakdown.metro.transitMin} {iT.minWord}
                </span>
                <span>
                  🚶 ~{mobilityBreakdown.metro.walkMin} {iT.minWord}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-50 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.busRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {iT.busLinesWithin500m}: {mobilityBreakdown.bus.linesCount}{' '}
                    · <span dir="ltr">{mobilityBreakdown.bus.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.bus.points}/40
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span>
                  🚶 ~{mobilityBreakdown.bus.walkMin} {iT.minWord}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-50 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.railRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {mobilityBreakdown.rail.name} ·{' '}
                    <span dir="ltr">{mobilityBreakdown.rail.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.rail.points}/15
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563eb]">
                  🚗 ~{mobilityBreakdown.rail.driveMin} {iT.minWord} ·{' '}
                  {iT.bestBadge}
                </span>
                <span>
                  🚌 ~{mobilityBreakdown.rail.transitMin} {iT.minWord}
                </span>
                <span>
                  🚶 ~{mobilityBreakdown.rail.walkMin} {iT.minWord}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-gray-50 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a1122]">
                  {iT.airportRowLabel}{' '}
                  <span className="font-medium text-gray-500">
                    — {mobilityBreakdown.airport.code} ·{' '}
                    <span dir="ltr">{mobilityBreakdown.airport.distStr}</span>
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-[11px] font-bold text-gray-500"
                >
                  {mobilityBreakdown.airport.points}/15
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563eb]">
                  <Plane className="size-3" /> ~
                  {mobilityBreakdown.airport.driveMin} {iT.minWord} ·{' '}
                  {iT.bestBadge}
                </span>
                <span>
                  🚌 ~{mobilityBreakdown.airport.transitMin} {iT.minWord}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[22px] border border-gray-200/85 bg-white p-4 shadow-2xs sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-[#0a1122] sm:text-lg">
              {iT.locationTitle}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-extrabold text-[#0a1122]">
                📍 {fullAddressLabel}
              </span>
              <span className="rounded-full border border-emerald-200 bg-[#eaf8f2] px-3 py-1 text-[11px] font-bold text-[#007a5a]">
                {hasSavedExactCoords || exactStreet
                  ? iT.exactBuildingBadge
                  : iT.approxCenterBadge}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-extrabold text-gray-700 shadow-2xs">
                <CloudSun className="size-3.5 text-sky-500" />
                <span dir="ltr">
                  {weatherInfo.temp}° {iT.cloudyWord}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-extrabold text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span dir="ltr">
                  AQI {weatherInfo.aqi} {iT.airQualityWord}
                </span>
              </span>
            </div>

            <div className="hidden h-5 w-[1px] bg-gray-200 sm:block" />

            <button
              type="button"
              onClick={() => setIsLocationSectionOpen((prev) => !prev)}
              title={
                isLocationSectionOpen
                  ? iT.collapseTooltip
                  : iT.expandTooltip
              }
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-gray-50/90 text-[#0a1122] shadow-2xs transition hover:border-[#2563eb] hover:bg-blue-50/50 hover:text-[#2563eb]"
            >
              {isLocationSectionOpen ? (
                <ChevronUp className="size-4 stroke-[2.4]" />
              ) : (
                <ChevronDown className="size-4 stroke-[2.4]" />
              )}
            </button>
          </div>
        </div>

        {isLocationSectionOpen && (
          <>
            <div
              dir="ltr"
              className={
                isFullscreenMap
                  ? 'fixed inset-0 z-[9999] h-[100dvh] w-screen bg-[#edeae4]'
                  : 'relative mt-4 h-[380px] w-full overflow-hidden rounded-[18px] border border-gray-200 bg-[#edeae4] sm:h-[460px]'
              }
            >
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '100%' }}
                className="absolute inset-0"
              />

              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
                <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => handleZoomAroundUnit(1)}
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100"
                    title="Zoom in"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomAroundUnit(-1)}
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100"
                    title="Zoom out"
                  >
                    <Minus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mapInstanceRef.current?.flyTo({
                        center: [coords.lng, coords.lat],
                        zoom: 17.4,
                        pitch: is3D && !isPureRasterMode ? 54 : 0,
                        bearing: is3D && !isPureRasterMode ? -14 : 0,
                        duration: 550,
                      })
                    }
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100"
                    title="Center on building"
                  >
                    <Compass className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenMap((p) => !p)}
                    className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-100"
                    title="Fullscreen"
                  >
                    {isFullscreenMap ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </button>
                </div>

                <div ref={styleMenuRef} className="relative flex items-center">
                  {styleMenuOpen && (
                    <div className="absolute top-0 right-24 z-30 grid w-[265px] grid-cols-2 gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-xl backdrop-blur-md">
                      {MAP_STYLE_OPTIONS.map((opt) => {
                        const active = mapStyleMode === opt.id
                        const IconComp = opt.icon
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setMapStyleMode(opt.id)
                              setStyleMenuOpen(false)
                            }}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-start text-xs font-extrabold transition ${
                              active
                                ? 'bg-[#2563eb] text-white shadow-2xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <IconComp
                              className={`size-3.5 shrink-0 ${
                                active ? 'text-white' : 'text-slate-500'
                              }`}
                            />
                            <span className="truncate">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-md backdrop-blur-md">
                    <button
                      type="button"
                      onClick={toggle3DPitch}
                      className={`flex h-10 min-w-[44px] items-center justify-center px-3 text-xs font-black transition ${
                        is3D && !isPureRasterMode
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      3D
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyleMenuOpen((p) => !p)}
                      title="Map styles"
                      className={`flex size-10 items-center justify-center transition ${
                        styleMenuOpen
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="pointer-events-auto rounded-xl bg-black/70 px-3.5 py-2 text-white backdrop-blur-xs">
                  <p className="text-xs font-extrabold">{fullAddressLabel}</p>
                  <p dir="ltr" className="font-mono text-[10px] text-gray-300">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/95 px-3.5 text-xs font-extrabold text-[#0a1122] shadow-md transition hover:bg-white"
                  >
                    <Navigation className="size-3.5 text-[#2563eb]" />
                    <span>{iT.directionsBtn}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenMap((p) => !p)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ea580c] px-4 text-xs font-extrabold text-white shadow-md transition hover:bg-[#c2410c]"
                  >
                    {isFullscreenMap ? (
                      <>
                        <Minimize2 className="size-3.5" />
                        <span>{iT.closeFullscreenBtn}</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="size-3.5" />
                        <span>{iT.open3dMapBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-[#0a1122] sm:text-base">
                    {iT.whatsNearbyTitle}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {iT.whatsNearbySub}
                  </p>
                </div>
                {isWaitingForInitialPlaces && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="hidden sm:inline">
                      {iT.loadingNearbyText}
                    </span>
                  </span>
                )}
              </div>

              <div className="mt-3.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                    activeCategory === 'all'
                      ? 'border-[#0a1122] bg-[#0a1122] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{iT.allCat}</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {places.length}
                  </span>
                </button>

                {CATEGORY_ICONS.map((cat) => {
                  const count = places.filter(
                    (p) => p.category === cat.key
                  ).length
                  if (count === 0 && !isWaitingForInitialPlaces) return null
                  const CatIcon = cat.icon
                  const active = activeCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                        active
                          ? 'border-[#0a1122] bg-[#0a1122] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CatIcon className="size-3.5 text-amber-600" />
                      <span>{iT.categories[cat.key]}</span>
                      <span className="text-[10px] text-gray-400">{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCategories.map((cat) => {
                  const catPlaces = places
                    .filter((p) => p.category === cat.key)
                    .sort((a, b) => a.distanceMeters - b.distanceMeters)
                  const isExpanded = Boolean(expandedCards[cat.key])
                  const shownPlaces = isExpanded
                    ? catPlaces
                    : catPlaces.slice(0, 3)
                  const extraCount = Math.max(0, catPlaces.length - 3)
                  const CatIcon = cat.icon

                  return (
                    <div
                      key={cat.key}
                      className="flex flex-col justify-between rounded-2xl border border-gray-200/85 bg-white p-4 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-600">
                            <CatIcon className="size-3.5 text-amber-600" />
                            <span>{iT.categories[cat.key]}</span>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-600">
                            {catPlaces.length}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3">
                          {shownPlaces.length > 0 ? (
                            shownPlaces.map((pl) => (
                              <div
                                key={pl.id}
                                onClick={() => {
                                  mapInstanceRef.current?.flyTo({
                                    center: [pl.lng, pl.lat],
                                    zoom: 17.5,
                                    duration: 600,
                                  })
                                }}
                                className="cursor-pointer rounded-lg p-1 text-xs transition hover:bg-slate-50"
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <strong className="truncate font-extrabold text-[#0a1122]">
                                    {getLocalizedPlaceName(pl, activeLocale)}
                                  </strong>
                                  <span
                                    dir="ltr"
                                    className="shrink-0 font-mono text-[11px] font-bold text-[#007a5a]"
                                  >
                                    {pl.distanceMeters < 1000
                                      ? `${pl.distanceMeters} m`
                                      : `${(pl.distanceMeters / 1000).toFixed(1)} km`}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-start text-[10.5px] font-semibold text-gray-400">
                                  {formatTravelEstimate(pl.distanceMeters, iT)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="py-3 text-center text-[11px] text-gray-400">
                              {isWaitingForInitialPlaces
                                ? iT.loadingNearbyText
                                : iT.noPlacesInCategory}
                            </p>
                          )}
                        </div>
                      </div>

                      {extraCount > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              [cat.key]: !prev[cat.key],
                            }))
                          }
                          className="mt-3 flex min-h-8 w-full items-center justify-center gap-1 rounded-xl bg-gray-50 text-[11px] font-extrabold text-gray-600 transition hover:bg-gray-100 hover:text-[#0a1122]"
                        >
                          {isExpanded
                            ? iT.showLessBtn
                            : `+${extraCount} ${iT.showMoreSuffix}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </section>

      <SunAndDaylightInteractiveCard
        lat={coords.lat}
        lng={coords.lng}
        iT={iT}
      />
    </>
  )
}