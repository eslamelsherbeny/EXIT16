'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Compass,
  Globe,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { useTranslation } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'
import { SIVRCE_POPULAR_CITIES } from './seller-location-modal'
import { Field, getOptionLabel, SivrceLocationModalPicker } from './seller-shared'

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
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  form: Record<string, string>
  update: (k: string, v: string) => void
  isExitDeal: boolean
  isDirectSale: boolean
  isRentDeal: boolean
}) {
  const { t: dict, locale } = useTranslation()
  const fT = getSellerFormTranslations(locale, dict)
  const locT = fT.locationSection

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const defaultAreaCoords = getCoordinatesForArea(
    form.location || 'Tbilisi - Saburtalo'
  )

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultAreaCoords.lat,
    lng: defaultAreaCoords.lng,
  })
  const [is3dMode, setIs3dMode] = useState(true)
  const [isExpandedMap, setIsExpandedMap] = useState(false)

  useEffect(() => {
    setLiveCoords({
      lat: defaultAreaCoords.lat,
      lng: defaultAreaCoords.lng,
    })
  }, [defaultAreaCoords.lat, defaultAreaCoords.lng])

  // تحريك الخريطة تلقائياً عند كتابة الشارع ورقم المبنى
  useEffect(() => {
    const street = (form.exactStreet || '').trim()
    const house = (form.houseNumber || '').trim()
    const cityLabel = (form.locationDisplay || form.location || 'Tbilisi')
      .split(',')[0]
      .split('-')[0]
      .trim()

    if (street.length < 3) return

    const timer = setTimeout(async () => {
      try {
        const query = `${house ? house + ' ' : ''}${street}, ${cityLabel}, Georgia`
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&limit=1&q=${encodeURIComponent(query)}`
        )
        const data = await res.json()
        if (Array.isArray(data) && data[0]) {
          const nextLat = Number(data[0].lat)
          const nextLng = Number(data[0].lon)
          if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
            setLiveCoords({ lat: nextLat, lng: nextLng })
            mapInstanceRef.current?.flyTo({
              center: [nextLng, nextLat],
              zoom: 16.5,
              pitch: is3dMode ? 58 : 0,
              duration: 900,
            })
          }
        }
      } catch {}
    }, 600)

    return () => clearTimeout(timer)
  }, [
    form.exactStreet,
    form.houseNumber,
    form.locationDisplay,
    form.location,
    is3dMode,
  ])

  useEffect(() => {
    let isMounted = true
    let map: any = null

    loadSellerMapLibre()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [liveCoords.lng, liveCoords.lat],
          zoom: 14.8,
          pitch: 58,
          bearing: -15,
          attributionControl: false,
        })

        mapInstanceRef.current = map

        map.on('load', () => {
          try {
            map.resize()
            const style = map.getStyle()
            if (!style?.layers) return
            for (const layer of style.layers) {
              if (layer.type === 'fill-extrusion') {
                map.setPaintProperty(
                  layer.id,
                  'fill-extrusion-color',
                  '#d8cfc4'
                )
                map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.9)
              }
            }
          } catch {}
        })
      })
      .catch(() => {})

    return () => {
      isMounted = false
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [liveCoords.lat, liveCoords.lng])

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
      <h2 className="text-lg font-black text-[#0a1122]">{locT.title}</h2>
      <p className="mt-1 text-xs text-slate-500">
        {isRentDeal ? locT.subtitleRent : locT.subtitleSale}
      </p>

      <div className="mt-4 space-y-4">
        <SivrceLocationModalPicker
          label={locT.cityDistrictLabel}
          value={form.location}
          displayText={form.locationDisplay}
          onSelectLocation={({ areaId, displayLabel, street, lat, lng }) => {
            update('location', areaId)
            update('locationDisplay', displayLabel)
            if (street) {
              update('exactStreet', street)
            }
            if (lat && lng) {
              setLiveCoords({ lat, lng })
            }
          }}
        />

        {(isExitDeal || isDirectSale) && (
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={locT.developerLabel}
                id="developer"
                placeholder={locT.developerPlaceholder}
                value={form.developer}
                update={(v) => update('developer', v)}
              />
              <Field
                label={locT.projectLabel}
                id="project"
                placeholder={locT.projectPlaceholder}
                value={form.project}
                update={(v) => update('project', v)}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field
              label={locT.streetLabel}
              id="exactStreet"
              placeholder={locT.streetPlaceholder}
              value={form.exactStreet}
              update={(v) => update('exactStreet', v)}
            />
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

        <Field
          label={locT.cadastralLabel}
          id="cadastralCode"
          placeholder={locT.cadastralPlaceholder}
          helper={locT.cadastralHelper}
          value={form.cadastralCode}
          update={(v) => update('cadastralCode', v)}
        />

        {/* خريطة 3D بتصميم Sivrce الاحترافي المطابق للصورة */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
          {/* شريط المدن السريع العائم بالأعلى مثل Sivrce */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-md">
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
                      update('location', city.defaultAreaId)
                      update(
                        'locationDisplay',
                        getLocalizedGeorgiaAreaName(city.defaultAreaId, locale)
                      )
                    }}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      isActiveCity
                        ? 'bg-[#2563eb] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {getOptionLabel(city, locale)}
                  </button>
                )
              })}
            </div>

            <span
              dir="ltr"
              className="hidden shrink-0 font-mono text-[10px] font-bold text-slate-400 sm:inline-block"
            >
              {liveCoords.lat.toFixed(4)}, {liveCoords.lng.toFixed(4)}
            </span>
          </div>

          <div
            dir="ltr"
            className={`relative w-full overflow-hidden bg-[#dfe5dc] transition-all duration-300 ${
              isExpandedMap ? 'h-[430px]' : 'h-72'
            }`}
          >
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%' }}
              className="absolute inset-0"
            />

            {/* كبسولة اسم الحي/الشارع العائمة فوق الخريطة */}
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
                      locale
                    )}
                </span>
              </div>
            </div>

            {/* دبوس الموقع في المنتصف */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="flex flex-col items-center">
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-white shadow-lg ring-4 ring-blue-500/20">
                  <Building2 className="size-4" />
                </div>
                <div className="-mt-1 h-2.5 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#2563eb]" />
              </div>
            </div>

            {/* شريط أدوات الخريطة الرأسي على اليمين مطابق لتصميم Sivrce */}
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

            {/* تلميح أسفل الخريطة */}
            <div className="pointer-events-none absolute inset-x-3 bottom-2.5 z-10 flex justify-start">
              <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-2xs backdrop-blur-xs">
                {locT.mapHint}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}