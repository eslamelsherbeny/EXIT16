'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bus,
  Compass,
  Crown,
  Dumbbell,
  Eye,
  FileCheck2,
  Flame,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  List,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  Mountain,
  Navigation,
  Plus,
  RotateCcw,
  School,
  Search,
  ShoppingBag,
  Sparkles,
  TrainFront,
  Trees,
  TrendingDown,
  X,
} from 'lucide-react'
import type { NearbyPlaceCategory } from '@/actions/georgia-geocode-action'
import { formatRelativePublishTime } from '@/components/features/home/home-property-card'
import { type MappedProperty } from '@/components/features/opportunities/opportunities-shared'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { getInstantGeorgiaNearbyPlaces } from '@/lib/georgia-pois-engine'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

function loadMapLibreScript(): Promise<any> {
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

    const existing = document.getElementById('maplibre-gl-js')
    if (existing) {
      existing.addEventListener('load', () =>
        resolve((window as any).maplibregl)
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'maplibre-gl-js'
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
    script.async = true
    script.onload = () => resolve((window as any).maplibregl)
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

function getStableUnitCoords(prop: MappedProperty, fallbackIdx: number) {
  const baseCoords = getCoordinatesForArea(prop.rawArea || prop.area)
  const idStr = String(prop.id || fallbackIdx)
  let hash = 0
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) | 0
  }
  const absHash = Math.abs(hash)
  const offsetLat = ((absHash % 9) - 4) * 0.0022
  const offsetLng = (((absHash >> 4) % 9) - 4) * 0.0028

  return {
    lat: baseCoords.lat + offsetLat,
    lng: baseCoords.lng + offsetLng,
  }
}

const MAP_CITIES_BAR = [
  { id: 'Tbilisi', label: 'Tbilisi', lat: 41.7151, lng: 44.8271 },
  { id: 'Batumi', label: 'Batumi', lat: 41.6168, lng: 41.6367 },
  { id: 'Kutaisi', label: 'Kutaisi', lat: 42.2679, lng: 42.718 },
  { id: 'Rustavi', label: 'Rustavi', lat: 41.5495, lng: 44.9932 },
  { id: 'Poti', label: 'Poti', lat: 42.1462, lng: 41.672 },
  { id: 'Zugdidi', label: 'Zugdidi', lat: 42.5088, lng: 41.8709 },
  { id: 'Telavi', label: 'Telavi', lat: 41.9198, lng: 45.4731 },
  { id: 'Gori', label: 'Gori', lat: 41.9842, lng: 44.1158 },
  { id: 'Kobuleti', label: 'Kobuleti', lat: 41.8214, lng: 41.7767 },
  { id: 'Gudauri', label: 'Gudauri', lat: 42.4779, lng: 44.4761 },
  { id: 'Bakuriani', label: 'Bakuriani', lat: 41.7497, lng: 43.5325 },
]

type MapVisualStyle =
  | 'realistic'
  | 'streets'
  | 'satellite'
  | 'hybrid'
  | 'minimal'

const POI_COLORS: Record<string, string> = {
  metro: '#e11d48',
  school: '#2563eb',
  kindergarten: '#ec4899',
  pharmacy: '#10b981',
  park: '#16a34a',
  market: '#f59e0b',
  clinic: '#06b6d4',
  university: '#7c3aed',
  bank: '#4f46e5',
  landmark: '#d97706',
  gym: '#ea580c',
  bus: '#0284c7',
}

export function Search3DMapView({
  properties,
  is3DMode,
  setIs3DMode,
  onBackToList,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onResetFilters,
}: {
  properties: MappedProperty[]
  is3DMode: boolean
  setIs3DMode: (v: boolean) => void
  onBackToList: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  typeFilter: string
  setTypeFilter: (t: string) => void
  onResetFilters: () => void
}) {
  const { t: dict, locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const USD = '$'
  const mT = dict.opportunitiesPage.mapView

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const poiMarkersRef = useRef<any[]>([])
  const userGpsMarkerRef = useRef<any>(null)

  const [selectedProp, setSelectedProp] = useState<MappedProperty | null>(null)
  const [activePoi, setActivePoi] = useState<NearbyPlaceCategory | ''>('')
  const [activeCity, setActiveCity] = useState<string>('Tbilisi')
  const [statusSubFilter, setStatusSubFilter] = useState<
    'all' | 'under_const' | 'ready' | 'negotiable'
  >('all')

  const [layersOpen, setLayersOpen] = useState(false)
  const [mapStyle, setMapStyle] = useState<MapVisualStyle>('realistic')
  const [showTerrain, setShowTerrain] = useState(true)
  const [showTrees, setShowTrees] = useState(true)
  const [showPriceVsMarket, setShowPriceVsMarket] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapCenterCoords, setMapCenterCoords] = useState<{
    lat: number
    lng: number
  }>({ lat: 41.7151, lng: 44.7833 })

  const mapFilteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (statusSubFilter === 'ready' && !p.isReady) return false
      if (statusSubFilter === 'under_const' && p.isReady) return false
      if (statusSubFilter === 'negotiable' && !p.negotiable) return false
      return true
    })
  }, [properties, statusSubFilter])

  useEffect(() => {
    let isMounted = true
    let map: any = null

    const initialCenterCoords =
      properties.length > 0
        ? getCoordinatesForArea(properties[0].rawArea || properties[0].area)
        : { lat: 41.7151, lng: 44.7833 }

    setMapCenterCoords(initialCenterCoords)

    loadMapLibreScript()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [initialCenterCoords.lng, initialCenterCoords.lat],
          zoom: 13.2,
          pitch: is3DMode ? 58 : 0,
          bearing: is3DMode ? -16 : 0,
          attributionControl: false,
        })

        mapInstanceRef.current = map

        map.on('load', () => {
          try {
            map.resize()
            const style = map.getStyle()
            if (style?.layers) {
              for (const layer of style.layers) {
                if (layer.type === 'fill-extrusion') {
                  map.setPaintProperty(
                    layer.id,
                    'fill-extrusion-color',
                    '#d9cfc3'
                  )
                  map.setPaintProperty(
                    layer.id,
                    'fill-extrusion-opacity',
                    0.92
                  )
                }
              }
            }
          } catch {}
        })

        map.on('moveend', () => {
          try {
            const c = map.getCenter()
            if (c) {
              setMapCenterCoords({ lat: c.lat, lng: c.lng })
            }
          } catch {}
        })
      })
      .catch(() => {})

    return () => {
      isMounted = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      poiMarkersRef.current.forEach((m) => m.remove())
      poiMarkersRef.current = []
      if (userGpsMarkerRef.current) {
        userGpsMarkerRef.current.remove()
      }
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.easeTo({
      pitch: is3DMode ? (showTerrain ? 60 : 52) : 0,
      bearing: is3DMode ? -16 : 0,
      duration: 600,
    })
  }, [is3DMode, showTerrain])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.isStyleLoaded?.()) return

    try {
      const style = map.getStyle()
      if (!style?.layers) return

      for (const layer of style.layers) {
        if (layer.type === 'fill-extrusion') {
          const buildingColor = nightMode
            ? '#334155'
            : mapStyle === 'minimal'
              ? '#e2e8f0'
              : '#d8cfc4'
          map.setPaintProperty(
            layer.id,
            'fill-extrusion-color',
            buildingColor
          )
          map.setPaintProperty(
            layer.id,
            'fill-extrusion-opacity',
            mapStyle === 'streets' ? 0.35 : 0.92
          )
        }
      }
    } catch {}
  }, [mapStyle, nightMode, showTrees])

  useEffect(() => {
    let isCancelled = false
    loadMapLibreScript()
      .then((maplibregl) => {
        if (isCancelled || !mapInstanceRef.current || !maplibregl) return

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        mapFilteredProperties.forEach((prop, idx) => {
          const { lat, lng } = getStableUnitCoords(prop, idx)

          const pinWrapper = document.createElement('div')
          pinWrapper.style.zIndex = selectedProp?.id === prop.id ? '40' : '15'

          const pinBtn = document.createElement('button')
          pinBtn.type = 'button'
          const shortPrice =
            prop.cashNum >= 1000
              ? `$${Math.round(prop.cashNum / 1000)}k`
              : `$${prop.cash}`

          const tier =
            prop.boostTier || (prop.featured ? 'super_vip' : null)
          const hasMarketGain = (prop.gainNum || 0) > 0
          const isCurrentlySelected = selectedProp?.id === prop.id

          pinBtn.className =
            'cursor-pointer select-none whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-extrabold shadow-md transition-colors duration-150'

          if (isCurrentlySelected) {
            pinBtn.style.backgroundColor = '#0f1d40'
            pinBtn.style.color = '#ffffff'
            pinBtn.style.border = '2px solid #ffffff'
          } else if (showPriceVsMarket && hasMarketGain) {
            pinBtn.style.backgroundColor = '#007a5a'
            pinBtn.style.color = '#ffffff'
            pinBtn.style.border = '2px solid #ffffff'
          } else {
            pinBtn.style.backgroundColor = '#ffffff'
            pinBtn.style.color = '#0f1d40'
            pinBtn.style.border =
              tier === 'super_vip'
                ? '2px solid #ff6437'
                : tier === 'vip_plus'
                  ? '2px solid #6366f1'
                  : '2px solid #2563eb'
          }

          pinBtn.innerText = shortPrice

          pinBtn.onmouseenter = () => {
            if (!isCurrentlySelected) {
              pinBtn.style.backgroundColor = '#eff6ff'
            }
            pinWrapper.style.zIndex = '50'
          }

          pinBtn.onmouseleave = () => {
            if (!isCurrentlySelected) {
              pinBtn.style.backgroundColor =
                showPriceVsMarket && hasMarketGain ? '#007a5a' : '#ffffff'
            }
            pinWrapper.style.zIndex = '15'
          }

          pinBtn.onclick = (e) => {
            e.stopPropagation()
            setSelectedProp(prop)
            mapInstanceRef.current?.flyTo({
              center: [lng, lat],
              zoom: 15.2,
              pitch: is3DMode ? 58 : 0,
              duration: 650,
            })
          }

          pinWrapper.appendChild(pinBtn)

          const marker = new maplibregl.Marker({
            element: pinWrapper,
            anchor: 'bottom',
          })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current)

          markersRef.current.push(marker)
        })
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [mapFilteredProperties, is3DMode, showPriceVsMarket, selectedProp?.id])

  useEffect(() => {
    let isCancelled = false
    loadMapLibreScript()
      .then((maplibregl) => {
        if (isCancelled || !mapInstanceRef.current || !maplibregl) return

        poiMarkersRef.current.forEach((m) => m.remove())
        poiMarkersRef.current = []

        if (!activePoi) return

        const nearbyList = getInstantGeorgiaNearbyPlaces(
          mapCenterCoords.lat,
          mapCenterCoords.lng,
          activeLocale
        ).filter((item) => item.category === activePoi)

        nearbyList.slice(0, 35).forEach((poi) => {
          const badgeColor = POI_COLORS[poi.category] || '#2563eb'

          const poiWrapper = document.createElement('div')
          poiWrapper.style.zIndex = '10'

          const innerBadge = document.createElement('div')
          innerBadge.className =
            'flex items-center gap-1 rounded-full border-2 border-white px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md'
          innerBadge.style.backgroundColor = badgeColor
          innerBadge.innerHTML = `<span class="max-w-[130px] truncate">${poi.name}</span>`

          poiWrapper.appendChild(innerBadge)

          const marker = new maplibregl.Marker({
            element: poiWrapper,
            anchor: 'center',
          })
            .setLngLat([poi.lng, poi.lat])
            .addTo(mapInstanceRef.current)

          poiMarkersRef.current.push(marker)
        })
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [activePoi, mapCenterCoords.lat, mapCenterCoords.lng, activeLocale])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
      setTimeout(() => mapInstanceRef.current?.resize(), 150)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (
          wrapperRef.current || document.documentElement
        ).requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {}
  }

  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const maplibregl = await loadMapLibreScript().catch(() => null)

        if (maplibregl && mapInstanceRef.current) {
          if (userGpsMarkerRef.current) {
            userGpsMarkerRef.current.remove()
          }
          const dotWrapper = document.createElement('div')
          const dot = document.createElement('div')
          dot.className =
            'size-4 rounded-full border-2 border-white bg-[#2563eb] shadow-[0_0_0_6px_rgba(37,99,235,0.28)]'
          dotWrapper.appendChild(dot)

          userGpsMarkerRef.current = new maplibregl.Marker({
            element: dotWrapper,
            anchor: 'center',
          })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current)

          mapInstanceRef.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 900,
          })
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleFlyToCity = (cityId: string) => {
    setActiveCity(cityId)
    const found = MAP_CITIES_BAR.find((c) => c.id === cityId)
    if (found) {
      setMapCenterCoords({ lat: found.lat, lng: found.lng })
      mapInstanceRef.current?.flyTo({
        center: [found.lng, found.lat],
        zoom: 13.2,
        pitch: is3DMode ? 56 : 0,
        duration: 850,
      })
    }
  }

  const poiCategories: Array<{
    id: NearbyPlaceCategory
    label: string
    icon: any
  }> = [
    { id: 'metro', label: mT.pois.metro, icon: TrainFront },
    { id: 'school', label: mT.pois.school, icon: School },
    { id: 'kindergarten', label: mT.pois.kindergarten, icon: Sparkles },
    { id: 'pharmacy', label: mT.pois.pharmacy, icon: HeartPulse },
    { id: 'park', label: mT.pois.park, icon: Trees },
    { id: 'market', label: mT.pois.market, icon: ShoppingBag },
    { id: 'clinic', label: mT.pois.clinic, icon: HeartPulse },
    { id: 'university', label: mT.pois.university, icon: GraduationCap },
    { id: 'bank', label: mT.pois.bank, icon: Landmark },
    { id: 'landmark', label: mT.pois.landmark, icon: Compass },
    { id: 'gym', label: mT.pois.gym, icon: Dumbbell },
    { id: 'bus', label: mT.pois.bus, icon: Bus },
  ]

  const selectedTier = selectedProp
    ? selectedProp.boostTier || (selectedProp.featured ? 'super_vip' : null)
    : null

  const mapFilterClass = nightMode
    ? 'brightness-[0.72] contrast-[1.15] hue-rotate-180 invert-[0.88]'
    : mapStyle === 'satellite' || mapStyle === 'hybrid'
      ? 'contrast-[1.08] saturate-[1.25]'
      : mapStyle === 'minimal'
        ? 'grayscale-[0.45] contrast-[0.95]'
        : ''

  return (
    <div
      ref={wrapperRef}
      dir={dir}
      className="relative h-[calc(100vh-74px)] min-h-[640px] w-full overflow-hidden bg-[#dfe5dc]"
    >
      <div
        ref={mapContainerRef}
        dir="ltr"
        className={`absolute inset-0 h-full w-full transition-all duration-300 ${mapFilterClass}`}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-[1360px] flex-col gap-2 sm:inset-x-5 lg:pe-14">
        <div className="pointer-events-auto flex h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 shadow-md backdrop-blur-md">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
            <Sparkles className="size-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mT.searchPlaceholder}
            className="w-full bg-transparent text-start text-xs font-bold text-[#0f1d40] placeholder:font-normal placeholder:text-slate-400 focus:outline-none sm:text-sm"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          ) : (
            <Search className="size-4 shrink-0 text-slate-400" />
          )}
        </div>

        <div className="pointer-events-auto flex h-10 w-full items-center justify-start gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 px-4 text-xs font-bold shadow-sm backdrop-blur-md no-scrollbar">
          <span className="inline-flex shrink-0 items-center gap-1 pe-2 text-slate-400">
            <MapPin className="size-3.5 text-[#2563eb]" />
            <span>{mT.cityLabel}</span>
          </span>
          {MAP_CITIES_BAR.map((city) => {
            const active = activeCity === city.id
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleFlyToCity(city.id)}
                className={`shrink-0 rounded-full px-3 py-1 transition ${
                  active
                    ? 'bg-blue-50 font-extrabold text-[#2563eb]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f1d40]'
                }`}
              >
                {city.label}
              </button>
            )
          })}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-extrabold text-[#0f1d40] transition hover:bg-slate-200"
            >
              <List className="size-3.5" />
              <span>
                {mapFilteredProperties.length} {mT.listPrefix}
              </span>
            </button>

            <div className="mx-1 hidden h-4 w-[1px] bg-slate-200 sm:block" />

            {(
              [
                { id: 'all', label: mT.forExitTab },
                { id: 'under_const', label: mT.underConstTab },
                { id: 'ready', label: mT.readyTab },
                { id: 'negotiable', label: mT.negotiableTab },
              ] as const
            ).map((st) => {
              const active = statusSubFilter === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusSubFilter(st.id)}
                  className={`rounded-full px-3 py-1 transition ${
                    active
                      ? 'bg-[#2563eb] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              )
            })}

            <div className="mx-1 hidden h-4 w-[1px] bg-slate-200 md:block" />

            {[
              { id: '', label: mT.allTab },
              { id: 'Apartment', label: mT.apartmentsTab },
              { id: 'Private house', label: mT.housesTab },
              { id: 'Cottage', label: mT.cottagesTab },
              { id: 'Commercial', label: mT.commercialTab },
              { id: 'Land', label: mT.landTab },
              { id: 'Hotel', label: mT.hotelTab },
            ].map((tp) => {
              const active = typeFilter === tp.id
              return (
                <button
                  key={tp.id || 'all-types'}
                  type="button"
                  onClick={() => setTypeFilter(tp.id)}
                  className={`rounded-full px-3 py-1 transition ${
                    active
                      ? 'bg-[#0f1d40] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tp.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setStatusSubFilter('all')
              setActivePoi('')
              onResetFilters()
            }}
            className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0f1d40]"
            title={mT.resetTooltip}
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md sm:right-4">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="flex size-9 items-center justify-center rounded-xl text-[#0f1d40] transition hover:bg-slate-100"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="flex size-9 items-center justify-center rounded-xl text-[#0f1d40] transition hover:bg-slate-100"
        >
          <Minus className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setIs3DMode(!is3DMode)}
          className={`flex size-9 items-center justify-center rounded-xl text-xs font-black transition ${
            is3DMode
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'bg-slate-100 text-[#0f1d40] hover:bg-slate-200'
          }`}
        >
          3D
        </button>

        <button
          type="button"
          onClick={() =>
            mapInstanceRef.current?.easeTo({
              bearing: 0,
              pitch: is3DMode ? 55 : 0,
              duration: 500,
            })
          }
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#2563eb]"
        >
          <Compass className="size-4" />
        </button>

        <span className="rounded-lg bg-emerald-50 px-1.5 py-1 text-[9.5px] font-black text-[#007a5a]">
          {mT.liveBadge}
        </span>

        <button
          type="button"
          onClick={() => setLayersOpen(!layersOpen)}
          className={`flex size-9 items-center justify-center rounded-xl transition ${
            layersOpen
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f1d40]'
          }`}
          title={mT.layersTitle}
        >
          <Layers className="size-4" />
        </button>

        <button
          type="button"
          onClick={handleLocateMe}
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#2563eb]"
          title={mT.myLocationTooltip}
        >
          <Navigation className="size-4" />
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#0f1d40]"
          title={
            isFullscreen ? mT.exitFullscreenTooltip : mT.fullscreenTooltip
          }
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>
      </div>

      {layersOpen && (
        <div className="absolute right-16 top-1/2 z-30 w-72 -translate-y-1/2 rounded-3xl border border-slate-200/90 bg-white/95 p-4 text-start shadow-2xl backdrop-blur-md sm:right-18 sm:w-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <strong className="text-sm font-extrabold text-[#0f1d40]">
              {mT.layersTitle}
            </strong>
            <button
              type="button"
              onClick={() => setLayersOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3">
            <span className="block text-[11px] font-semibold text-slate-400">
              {mT.mapStyleLabel}
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'realistic', label: mT.styleRealistic },
                  { id: 'streets', label: mT.styleStreets },
                  { id: 'satellite', label: mT.styleSatellite },
                  { id: 'hybrid', label: mT.styleHybrid },
                  { id: 'minimal', label: mT.styleMinimal },
                ] as const
              ).map((st) => {
                const active = mapStyle === st.id
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setMapStyle(st.id)
                      if (st.id === 'streets') setIs3DMode(false)
                      if (st.id === 'realistic') setIs3DMode(true)
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      active
                        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {st.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-slate-100 pt-3.5 text-xs">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Mountain className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <div>
                  <strong className="block font-bold text-[#0f1d40]">
                    {mT.layerTerrain}
                  </strong>
                  <span className="text-[10.5px] text-slate-400">
                    {mT.layerTerrainSub}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showTerrain}
                onChange={(e) => setShowTerrain(e.target.checked)}
                className="size-4 accent-[#2563eb]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Trees className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <div>
                  <strong className="block font-bold text-[#0f1d40]">
                    {mT.layerTrees}
                  </strong>
                  <span className="text-[10.5px] text-slate-400">
                    {mT.layerTreesSub}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showTrees}
                onChange={(e) => setShowTrees(e.target.checked)}
                className="size-4 accent-[#2563eb]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <TrendingDown className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                <div>
                  <strong className="block font-bold text-[#0f1d40]">
                    {mT.layerPriceVsMarket}
                  </strong>
                  <span className="text-[10.5px] text-slate-400">
                    {mT.layerPriceVsMarketSub}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showPriceVsMarket}
                onChange={(e) => setShowPriceVsMarket(e.target.checked)}
                className="size-4 accent-[#007a5a]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Moon className="mt-0.5 size-4 shrink-0 text-indigo-600" />
                <div>
                  <strong className="block font-bold text-[#0f1d40]">
                    {mT.layerNightMode}
                  </strong>
                  <span className="text-[10.5px] text-slate-400">
                    {mT.layerNightModeSub}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={nightMode}
                onChange={(e) => setNightMode(e.target.checked)}
                className="size-4 accent-[#2563eb]"
              />
            </label>
          </div>
        </div>
      )}

      {selectedProp && (
        <div className="absolute bottom-20 start-4 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:start-6">
          <div className="relative h-40 w-full bg-slate-100">
            <img
              src={selectedProp.image}
              alt={selectedProp.project}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedProp(null)}
              className="absolute top-2.5 end-2.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="size-4" />
            </button>

            {selectedTier === 'super_vip' && (
              <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Crown className="size-3" />
                <span>SUPER VIP</span>
              </span>
            )}
            {selectedTier === 'vip_plus' && (
              <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Flame className="size-3" />
                <span>+VIP</span>
              </span>
            )}

            <span className="absolute bottom-2.5 start-2.5 rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
              #{selectedProp.code}
            </span>
          </div>

          <div className="p-4 text-start">
            <div className="flex items-center justify-between">
              <strong
                dir="ltr"
                className="text-lg font-extrabold text-[#0f1d40]"
              >
                {USD}
                {selectedProp.cash}
              </strong>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf8f2] px-2 py-0.5 text-[10px] font-bold text-[#007a5a]">
                <FileCheck2 className="size-3" />
                {mT.verifiedBadge}
              </span>
            </div>

            <h4 className="mt-1 line-clamp-1 text-xs font-bold text-[#0f1d40]">
              {selectedProp.project}
            </h4>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              {selectedProp.area} · {selectedProp.size} {mT.sqmUnit} ·{' '}
              {selectedProp.rooms} {mT.roomsWord}
            </p>

            <div className="mt-2.5 space-y-1 rounded-xl bg-slate-50 p-2.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{mT.remainingLabel}</span>
                <strong dir="ltr" className="font-bold text-[#0f1d40]">
                  {USD}
                  {selectedProp.remaining}
                </strong>
              </div>
              {selectedProp.installmentNum > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{mT.installmentLabel}</span>
                  <strong className="font-bold text-[#0f1d40]">
                    {USD}
                    {selectedProp.installment} · {selectedProp.installmentFreq}
                  </strong>
                </div>
              )}
              {selectedProp.gainNum > 0 && (
                <div className="flex items-center justify-between text-[#007a5a]">
                  <span className="font-bold">{mT.gainLabel}</span>
                  <strong dir="ltr" className="font-extrabold">
                    + {USD}
                    {selectedProp.gainNum.toLocaleString('en-US')}
                  </strong>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between pt-1.5 text-[10.5px] font-medium text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                <span>{selectedProp.viewsCount || 1}</span>
              </span>
              <span>
                {formatRelativePublishTime(
                  selectedProp.createdAt,
                  activeLocale
                )}
              </span>
            </div>

            <Link
              href={`/opportunities/${selectedProp.id}`}
              className="mt-2.5 flex h-9 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white hover:opacity-95"
            >
              {mT.viewDetailsBtn}
            </Link>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 flex justify-center sm:inset-x-6">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-md no-scrollbar">
          {poiCategories.map((poi) => {
            const Icon = poi.icon
            const active = activePoi === poi.id
            return (
              <button
                key={poi.id}
                type="button"
                onClick={() => setActivePoi(active ? '' : poi.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                  active
                    ? 'bg-[#2563eb] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0f1d40]'
                }`}
              >
                <Icon className="size-3.5" />
                <span>{poi.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}