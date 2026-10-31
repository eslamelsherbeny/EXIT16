'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, MapPin, Minus, Plus } from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { useTranslation } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'
import { Field, SivrceLocationModalPicker } from './seller-shared'

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
  const { locale } = useTranslation()
  const fT = getSellerFormTranslations(locale)
  const locT = fT.locationSection

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const hasSelectedLocation = Boolean(form.location && form.location.trim())
  const defaultAreaCoords = getCoordinatesForArea(
    form.location || 'Tbilisi - Saburtalo'
  )

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultAreaCoords.lat,
    lng: defaultAreaCoords.lng,
  })

  useEffect(() => {
    setLiveCoords({
      lat: defaultAreaCoords.lat,
      lng: defaultAreaCoords.lng,
    })
  }, [defaultAreaCoords.lat, defaultAreaCoords.lng])

  // تحريك الخريطة تلقائياً للشارع ورقم المبنى بمجرد كتابتهما
  useEffect(() => {
    if (!hasSelectedLocation) return
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
              zoom: 16.8,
              pitch: 58,
              duration: 900,
            })
          }
        }
      } catch {}
    }, 600)

    return () => clearTimeout(timer)
  }, [
    hasSelectedLocation,
    form.exactStreet,
    form.houseNumber,
    form.locationDisplay,
    form.location,
  ])

  useEffect(() => {
    if (!hasSelectedLocation) return
    let isMounted = true
    let map: any = null

    loadSellerMapLibre()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [liveCoords.lng, liveCoords.lat],
          zoom: 15.8,
          pitch: 55,
          bearing: -18,
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
                  '#d6c3b1'
                )
                map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.92)
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
  }, [hasSelectedLocation, liveCoords.lat, liveCoords.lng])

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={locT.developerLabel}
              id="developer"
              placeholder="ORBI Group, Archi, m²..."
              value={form.developer}
              update={(v) => update('developer', v)}
            />
            <Field
              label={locT.projectLabel}
              id="project"
              placeholder="King David, Orbi City..."
              value={form.project}
              update={(v) => update('project', v)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field
              label={`${locT.streetLabel} *`}
              id="exactStreet"
              placeholder="e.g. Chavchavadze Ave."
              value={form.exactStreet}
              update={(v) => update('exactStreet', v)}
            />
          </div>
          <div>
            <Field
              label={locT.houseNoLabel}
              id="houseNumber"
              placeholder="47"
              value={form.houseNumber}
              update={(v) => update('houseNumber', v)}
            />
          </div>
        </div>

        <Field
          label={locT.cadastralLabel}
          id="cadastralCode"
          placeholder="01.10.01.001.001"
          helper={locT.cadastralHelper}
          value={form.cadastralCode}
          update={(v) => update('cadastralCode', v)}
        />

        {hasSelectedLocation && (
          <div className="mt-4 animate-in fade-in overflow-hidden rounded-2xl border border-slate-200 duration-300">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[#ea580c]" />
                <span>
                  {form.locationDisplay ||
                    getLocalizedGeorgiaAreaName(form.location, locale)}
                </span>
              </span>
              <span dir="ltr" className="font-mono text-[10px] text-slate-400">
                {liveCoords.lat.toFixed(4)}, {liveCoords.lng.toFixed(4)}
              </span>
            </div>

            <div
              dir="ltr"
              className="relative h-64 w-full overflow-hidden bg-[#edeae4]"
            >
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '100%' }}
                className="absolute inset-0"
              />

              <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
                <div className="flex flex-col items-center">
                  <div className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-[#ea580c] text-white shadow-lg">
                    <Building2 className="size-4" />
                  </div>
                  <div className="-mt-1 h-2.5 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#ea580c]" />
                </div>
              </div>

              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-xs hover:bg-white"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-xs hover:bg-white"
                >
                  <Minus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}