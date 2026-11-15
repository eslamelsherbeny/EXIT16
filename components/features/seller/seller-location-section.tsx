'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowUpLeft,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  Compass,
  Contrast,
  Globe,
  Layers,
  Loader2,
  Lock,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Mountain,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  fetchRealNearbyPlacesAndWeatherAction,
  reverseGeocodeGeorgiaPinAction,
} from '@/actions/georgia-geocode-action'
import {
  apply3DBuildingsToMap,
  extractInstantAddressFromMapFeatures,
  geocodeExactBuildingInGeorgia,
  getInstantLocalGeorgiaSuggestions,
  getReliableGeorgiaMapStyle,
  highlight3DBuildingAtCoordinates,
  mapDetectedAddressToGeorgiaAreaId,
  matchStreetAndDistrictToOurDatabase,
  type GeorgiaMapThemeMode,
  type GeorgiaPlaceSuggestion,
} from '@/lib/georgia-uber-search'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'
import {
  RequiredLabel,
  SivrceLocationModalPicker,
} from './seller-shared'

export { mapDetectedAddressToGeorgiaAreaId }

const GEORGIA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [39.8, 40.9],
  [46.9, 43.7],
]

function isPointInsideGeorgia(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 40.9 &&
    lat <= 43.7 &&
    lng >= 39.8 &&
    lng <= 46.9
  )
}

const MAP_STYLE_OPTIONS: Array<{
  id: GeorgiaMapThemeMode
  label: string
  icon: any
}> = [
  { id: 'streets', label: 'Streets', icon: MapIcon },
  { id: 'sivrce', label: 'Sivrce', icon: Globe },
  { id: 'realistic', label: 'Realistic', icon: Mountain },
  { id: 'photoreal', label: 'Photoreal', icon: Camera },
  { id: 'hybrid', label: 'Hybrid', icon: Sparkles },
  { id: 'minimal', label: 'Minimal', icon: Circle },
  { id: 'contrast', label: 'High contrast', icon: Contrast },
]

const SIVRCE_MAP_UI_I18N: Record<
  LocaleCode,
  {
    windowsHelpText: string
    macHelpText: string
    mobileHelpText: string
    enterStreetHint: string
    bottomSnapHint: string
    parcelFoundText: string
    optionalNaprHint: string
    hideCadastralBtn: string
    hiddenFromPublicBadge: string
    outsideGeorgiaMapAlert: string
    shortProjectPlaceholder: string
    shortDeveloperPlaceholder: string
    shortStreetPlaceholder: string
    shortHousePlaceholder: string
    shortCadastralPlaceholder: string
  }
> = {
  ar: {
    windowsHelpText: 'استخدم Ctrl + التمرير لتكبير الخريطة',
    macHelpText: 'استخدم ⌘ + التمرير لتكبير الخريطة',
    mobileHelpText: 'استخدم إصبعين لتحريك وتكبير الخريطة',
    enterStreetHint: 'أدخل الشارع — يسقط الدبوس تلقائياً',
    bottomSnapHint:
      'الدبوس والمبنى يتحدثان تلقائياً · أو اضغط على الخريطة لتحديد مبنى',
    parcelFoundText:
      'تم العثور على القطعة — تم توجيه الخريطة إلى قطعة NAPR',
    optionalNaprHint: 'اختياري — يوجه الخريطة تلقائياً إلى قطعة NAPR',
    hideCadastralBtn: 'إخفاء الرقم العقاري عن الجمهور في الإعلان',
    hiddenFromPublicBadge: 'مخفي عن الزوار في صفحة الإعلان (يظهر للإدارة فقط)',
    outsideGeorgiaMapAlert:
      'موقعك الحالي خارج جورجيا — يرجى تحديد موقع العقار داخل خريطة جورجيا فقط.',
    shortProjectPlaceholder: 'اسم المشروع أو المجمع...',
    shortDeveloperPlaceholder: 'اسم المطور (اختياري)...',
    shortStreetPlaceholder: 'ابحث باسم الشارع...',
    shortHousePlaceholder: 'مثال: 12',
    shortCadastralPlaceholder: 'اختياري (مثال: 01.10...)',
  },
  en: {
    windowsHelpText: 'Use Ctrl + scroll to zoom the map',
    macHelpText: 'Use ⌘ + scroll to zoom the map',
    mobileHelpText: 'Use two fingers to move the map',
    enterStreetHint: 'Enter the street — the pin drops automatically',
    bottomSnapHint:
      'Pin and building snap automatically · or tap the map to mark a building',
    parcelFoundText: 'Parcel found — map snapped to the NAPR lot',
    optionalNaprHint: 'Optional — snaps NAPR parcel onto the map',
    hideCadastralBtn: 'Hide cadastral code on the website',
    hiddenFromPublicBadge: 'Hidden from public visitors (Visible to Admin only)',
    outsideGeorgiaMapAlert:
      'Your GPS location is outside Georgia — please pin the property inside Georgia.',
    shortProjectPlaceholder: 'Project or complex name...',
    shortDeveloperPlaceholder: 'Developer name (optional)...',
    shortStreetPlaceholder: 'Type street name...',
    shortHousePlaceholder: 'e.g. 12',
    shortCadastralPlaceholder: 'Optional (e.g. 01.10...)',
  },
  ru: {
    windowsHelpText: 'Используйте Ctrl + колесико для масштабирования',
    macHelpText: 'Используйте ⌘ + колесико для масштабирования',
    mobileHelpText: 'Используйте два пальца для перемещения карты',
    enterStreetHint: 'Введите улицу — пин установится автоматически',
    bottomSnapHint:
      'Пин и здание выбираются автоматически · или нажмите на карту',
    parcelFoundText: 'Участок найден — карта привязана к участку NAPR',
    optionalNaprHint: 'Необязательно — привязывает участок NAPR к карте',
    hideCadastralBtn: 'Скрыть кадастровый код на сайте',
    hiddenFromPublicBadge: 'Скрыто от посетителей в объявлении (Видно только админу)',
    outsideGeorgiaMapAlert:
      'Ваша геопозиция вне Грузии — укажите объект на карте Грузии.',
    shortProjectPlaceholder: 'Название ЖК или проекта...',
    shortDeveloperPlaceholder: 'Застройщик (необязательно)...',
    shortStreetPlaceholder: 'Введите название улицы...',
    shortHousePlaceholder: 'напр. 12',
    shortCadastralPlaceholder: 'Необязательно',
  },
  ka: {
    windowsHelpText: 'გამოიყენეთ Ctrl + სქროლი რუკის გასადიდებლად',
    macHelpText: 'გამოიყენეთ ⌘ + სქროლი რუკის გასადიდებლად',
    mobileHelpText: 'გამოიყენეთ ორი თითი რუკის გადასაადგილებლად',
    enterStreetHint: 'შეიყვანეთ ქუჩა — პინი ავტომატურად დაჯდება',
    bottomSnapHint:
      'პინი და შენობა ავტომატურად ინიშნება · ან დააჭირეთ რუკას',
    parcelFoundText: 'ნაკვეთი ნაპოვნია — რუკა გასწორდა NAPR-ის მიხედვით',
    optionalNaprHint: 'არასავალდებულო — აფიქსირებს NAPR ნაკვეთს რუკაზე',
    hideCadastralBtn: 'საკადასტრო კოდის დამალვა საიტზე',
    hiddenFromPublicBadge: 'დამალულია საჯაროდ (ჩანს მხოლოდ ადმინისტრაციისთვის)',
    outsideGeorgiaMapAlert:
      'თქვენი GPS მდებარეობა საქართველოს გარეთაა — მონიშნეთ ობიექტი საქართველოში.',
    shortProjectPlaceholder: 'პროექტის სახელი...',
    shortDeveloperPlaceholder: 'დეველოპერი (არასავალდებულო)...',
    shortStreetPlaceholder: 'ჩაწერეთ ქუჩის სახელი...',
    shortHousePlaceholder: 'მაგ. 12',
    shortCadastralPlaceholder: 'არასავალდებულო',
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

function createOrangePinElement(): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.alignItems = 'center'
  wrapper.style.cursor = 'grab'
  wrapper.innerHTML = `
    <div style="width: 38px; height: 38px; border-radius: 9999px; border: 3px solid #ffffff; background: #ea580c; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,0,0,0.28);">
      <div style="width: 11px; height: 11px; border-radius: 9999px; background: #ffffff;"></div>
    </div>
    <div style="margin-top: -3px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 9px solid #ea580c;"></div>
    <div style="margin-top: 2px; width: 12px; height: 5px; border-radius: 9999px; background: rgba(0,0,0,0.32); filter: blur(1px);"></div>
  `
  return wrapper
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
  const mapUiT =
    SIVRCE_MAP_UI_I18N[locale as LocaleCode] || SIVRCE_MAP_UI_I18N.ar

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapWrapperRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const streetDropdownRef = useRef<HTMLDivElement | null>(null)
  const styleMenuRef = useRef<HTMLDivElement | null>(null)
  const lastManualTypedRef = useRef<string>('')
  const reverseAbortRef = useRef<AbortController | null>(null)

  const updateRef = useRef(update)
  updateRef.current = update
  const localeRef = useRef(locale as LocaleCode)
  localeRef.current = locale as LocaleCode
  const formRef = useRef(form)
  formRef.current = form

  const defaultAreaCoords = getCoordinatesForArea(
    form.location || 'Tbilisi - Saburtalo'
  )

  const parsedFormLat = Number(form.lat)
  const parsedFormLng = Number(form.lng)
  const validSavedGeorgiaCoords = isPointInsideGeorgia(
    parsedFormLat,
    parsedFormLng
  )

  const initialLat = validSavedGeorgiaCoords
    ? parsedFormLat
    : defaultAreaCoords.lat
  const initialLng = validSavedGeorgiaCoords
    ? parsedFormLng
    : defaultAreaCoords.lng

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  })
  const liveCoordsRef = useRef<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  })

  const hasSelectedAnyLocation = Boolean(
    (form.location && form.location.trim().length > 0) ||
      (form.exactStreet && form.exactStreet.trim().length >= 2) ||
      (form.cadastralCode && form.cadastralCode.trim().length >= 6)
  )

  const [mapStyleMode, setMapStyleMode] =
    useState<GeorgiaMapThemeMode>('realistic')
  const [styleMenuOpen, setStyleMenuOpen] = useState(false)
  const [is3dPitch, setIs3dPitch] = useState(true)
  const is3dPitchRef = useRef(true)
  is3dPitchRef.current = is3dPitch

  const [isFullscreenMap, setIsFullscreenMap] = useState(false)
  const [streetDropdownOpen, setStreetDropdownOpen] = useState(false)
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [outsideGeorgiaAlert, setOutsideGeorgiaAlert] = useState('')
  const [cachedPlacesJson, setCachedPlacesJson] = useState<string>(
    form.nearbyPlacesJson || ''
  )

  const [naprParcelAddress, setNaprParcelAddress] = useState<string>('')
  const hideCadastralOnSite = form.hideCadastral === 'true'

  const isPureRasterMode =
    mapStyleMode === 'photoreal' || mapStyleMode === 'satellite'

  const streetSuggestions = useMemo(() => {
    const q = (form.exactStreet || '').trim()
    const rawLoc = (form.locationDisplay || form.location || '').trim()
    const cityContext = rawLoc.includes(',')
      ? rawLoc.split(',').pop()?.trim()
      : rawLoc.split(/[-—]/)[0]?.trim()

    return getInstantLocalGeorgiaSuggestions(
      q,
      locale as LocaleCode,
      cityContext
    )
  }, [form.exactStreet, form.location, form.locationDisplay, locale])

  const syncCoordsAndMarker = useCallback((lat: number, lng: number) => {
    if (!isPointInsideGeorgia(lat, lng)) return
    liveCoordsRef.current = { lat, lng }
    setLiveCoords({ lat, lng })
    updateRef.current('lat', String(lat.toFixed(6)))
    updateRef.current('lng', String(lng.toFixed(6)))
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLngLat([lng, lat])
    }
    if (mapInstanceRef.current) {
      highlight3DBuildingAtCoordinates(mapInstanceRef.current, lng, lat)
    }
  }, [])

  // ضمان مزامنة الإحداثيات مع كائن form فور اختيار أي منطقة
  useEffect(() => {
    if (!hasSelectedAnyLocation) return
    if (!form.lat || !form.lng) {
      updateRef.current('lat', String(liveCoords.lat.toFixed(6)))
      updateRef.current('lng', String(liveCoords.lng.toFixed(6)))
    }
  }, [hasSelectedAnyLocation, liveCoords.lat, liveCoords.lng, form.lat, form.lng])

  // جلب الأماكن المحيطة في الخلفية أثناء ملء البائع لبيانات الوحدة لتُحفظ مع الفورم فوراً
  useEffect(() => {
    if (!hasSelectedAnyLocation) return
    if (!isPointInsideGeorgia(liveCoords.lat, liveCoords.lng)) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await fetchRealNearbyPlacesAndWeatherAction({
          lat: liveCoords.lat,
          lng: liveCoords.lng,
          locale: 'en',
        })
        if (
          !cancelled &&
          Array.isArray(res?.places) &&
          res.places.length >= 5
        ) {
          const serialized = JSON.stringify(res.places.slice(0, 180))
          setCachedPlacesJson(serialized)
          updateRef.current('nearbyPlacesJson', serialized)
        }
      } catch {}
    }, 900)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [hasSelectedAnyLocation, liveCoords.lat, liveCoords.lng])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        streetDropdownRef.current &&
        !streetDropdownRef.current.contains(e.target as Node)
      ) {
        setStreetDropdownOpen(false)
      }
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
    const map = mapInstanceRef.current
    if (!map) return
    const timer = setTimeout(() => {
      map.resize()
      highlight3DBuildingAtCoordinates(
        map,
        liveCoordsRef.current.lng,
        liveCoordsRef.current.lat
      )
    }, 120)
    return () => clearTimeout(timer)
  }, [isFullscreenMap])

  const flyMapToExactPoint = useCallback(
    (lat: number, lng: number, zoomLevel = 17.6) => {
      if (!isPointInsideGeorgia(lat, lng)) return
      syncCoordsAndMarker(lat, lng)
      const map = mapInstanceRef.current
      if (!map) return
      map.flyTo({
        center: [lng, lat],
        zoom: zoomLevel,
        pitch: is3dPitchRef.current && !isPureRasterMode ? 52 : 0,
        bearing: is3dPitchRef.current && !isPureRasterMode ? -12 : 0,
        duration: 520,
      })
      setTimeout(() => {
        if (mapInstanceRef.current) {
          highlight3DBuildingAtCoordinates(mapInstanceRef.current, lng, lat)
        }
      }, 580)
    },
    [isPureRasterMode, syncCoordsAndMarker]
  )

  const selectPointOnMap = useCallback(
    async (
      lat: number,
      lng: number,
      shouldFly = true,
      clickPixelPoint?: { x: number; y: number }
    ) => {
      if (!isPointInsideGeorgia(lat, lng)) {
        setOutsideGeorgiaAlert(mapUiT.outsideGeorgiaMapAlert)
        return
      }
      setOutsideGeorgiaAlert('')

      const map = mapInstanceRef.current
      const currentZoom = map?.getZoom?.() || 16.5
      const targetZoom = Math.max(currentZoom, 17.6)

      if (shouldFly) {
        flyMapToExactPoint(lat, lng, targetZoom)
      } else {
        syncCoordsAndMarker(lat, lng)
      }

      const screenPt =
        clickPixelPoint ||
        (map && typeof map.project === 'function'
          ? map.project([lng, lat])
          : undefined)

      const instantLocal = extractInstantAddressFromMapFeatures(
        map,
        localeRef.current,
        screenPt
      )
      if (instantLocal) {
        const nextSt = instantLocal.street || formRef.current.exactStreet || ''
        const nextHn =
          instantLocal.houseNumber !== undefined
            ? instantLocal.houseNumber
            : formRef.current.houseNumber || ''
        const nextDisp =
          instantLocal.displayLabel || formRef.current.locationDisplay || ''

        lastManualTypedRef.current = `${nextSt}|${nextHn}|${nextDisp}`

        if (instantLocal.street) {
          updateRef.current('exactStreet', instantLocal.street)
        }
        if (instantLocal.houseNumber !== undefined) {
          updateRef.current('houseNumber', instantLocal.houseNumber)
        }
        if (instantLocal.areaId) {
          updateRef.current('location', instantLocal.areaId)
        }
        if (instantLocal.displayLabel) {
          updateRef.current('locationDisplay', instantLocal.displayLabel)
        }
      }

      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort()
      }
      const controller = new AbortController()
      reverseAbortRef.current = controller

      setReverseGeoLoading(true)
      try {
        const serverData = await reverseGeocodeGeorgiaPinAction({
          lat,
          lng,
          locale: localeRef.current,
        })

        if (controller.signal.aborted || !serverData) return

        if (serverData.outsideGeorgia) {
          setOutsideGeorgiaAlert(mapUiT.outsideGeorgiaMapAlert)
          return
        }

        const matched = matchStreetAndDistrictToOurDatabase({
          rawStreet: serverData.rawStreet,
          rawStreetKa: serverData.rawStreetKa,
          rawSuburb: serverData.rawSuburb,
          rawCity: serverData.rawCity,
          locale: localeRef.current,
        })

        const finalStreet = matched.street || instantLocal?.street || ''
        const finalHouse =
          instantLocal?.houseNumber || serverData.rawHouse || ''

        lastManualTypedRef.current = `${finalStreet}|${finalHouse}|${matched.displayLabel || ''}`
        if (matched.areaId) updateRef.current('location', matched.areaId)
        if (matched.displayLabel) {
          updateRef.current('locationDisplay', matched.displayLabel)
        }
        if (finalStreet) updateRef.current('exactStreet', finalStreet)
        updateRef.current('houseNumber', finalHouse)

        updateRef.current('cadastralCode', serverData.cadastralCode || '')
        setNaprParcelAddress(
          serverData.cadastralCode ? serverData.naprAddress || '' : ''
        )

        if (mapInstanceRef.current) {
          highlight3DBuildingAtCoordinates(mapInstanceRef.current, lng, lat)
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
      } finally {
        if (!controller.signal.aborted) {
          setReverseGeoLoading(false)
        }
      }
    },
    [flyMapToExactPoint, mapUiT.outsideGeorgiaMapAlert, syncCoordsAndMarker]
  )

  const selectPointRef = useRef(selectPointOnMap)
  selectPointRef.current = selectPointOnMap

  useEffect(() => {
    const streetClean = (form.exactStreet || '').trim()
    const houseClean = (form.houseNumber || '').trim()
    const signature = `${streetClean}|${houseClean}|${form.locationDisplay || ''}`

    if (
      streetClean.length < 3 ||
      signature === lastManualTypedRef.current ||
      streetDropdownOpen
    ) {
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      lastManualTypedRef.current = signature
      const rawLoc = (form.locationDisplay || form.location || 'Tbilisi').trim()
      const parts = rawLoc.split(',')
      const districtCtx = parts.length > 1 ? parts[0].trim() : ''
      const cityCtx =
        parts.length > 1
          ? parts[parts.length - 1].trim()
          : parts[0].split(/[-—]/)[0].trim()

      const coords = await geocodeExactBuildingInGeorgia({
        street: streetClean,
        houseNumber: houseClean,
        district: districtCtx,
        city: cityCtx || 'Tbilisi',
        signal: controller.signal,
      })

      if (coords && !controller.signal.aborted) {
        flyMapToExactPoint(
          coords.lat,
          coords.lng,
          houseClean ? 17.8 : 17.4
        )
        if (coords.cadastralCode) {
          updateRef.current('cadastralCode', coords.cadastralCode)
          setNaprParcelAddress(coords.naprAddress || '')
        }
      }
    }, 550)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [
    form.exactStreet,
    form.houseNumber,
    form.location,
    form.locationDisplay,
    streetDropdownOpen,
    flyMapToExactPoint,
  ])

  useEffect(() => {
    if (!hasSelectedAnyLocation) return

    let isMounted = true
    let map: any = null
    let marker: any = null

    loadSellerMapLibre()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: getReliableGeorgiaMapStyle(mapStyleMode),
          center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
          zoom: 17.2,
          pitch: is3dPitchRef.current && !isPureRasterMode ? 52 : 0,
          bearing: is3dPitchRef.current && !isPureRasterMode ? -12 : 0,
          maxBounds: GEORGIA_MAX_BOUNDS,
          attributionControl: false,
          cooperativeGestures: true,
          locale: {
            'ScrollZoomBlocker.CtrlMessage': mapUiT.windowsHelpText,
            'ScrollZoomBlocker.CmdMessage': mapUiT.macHelpText,
            'TouchPanBlocker.Message': mapUiT.mobileHelpText,
          },
        })

        mapInstanceRef.current = map

        const pinEl = createOrangePinElement()
        marker = new maplibregl.Marker({
          element: pinEl,
          draggable: true,
          anchor: 'bottom',
        })
          .setLngLat([liveCoordsRef.current.lng, liveCoordsRef.current.lat])
          .addTo(map)

        markerInstanceRef.current = marker

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          if (
            lngLat &&
            Number.isFinite(lngLat.lat) &&
            Number.isFinite(lngLat.lng)
          ) {
            void selectPointRef.current(
              Number(lngLat.lat),
              Number(lngLat.lng),
              true
            )
          }
        })

        map.on('load', () => {
          if (!isPureRasterMode) {
            apply3DBuildingsToMap(
              map,
              localeRef.current,
              mapStyleMode,
              is3dPitchRef.current
            )
            highlight3DBuildingAtCoordinates(
              map,
              liveCoordsRef.current.lng,
              liveCoordsRef.current.lat
            )
          } else {
            map.resize()
          }
          setTimeout(() => map?.resize(), 120)
        })

        map.on('idle', () => {
          if (!isPureRasterMode) {
            highlight3DBuildingAtCoordinates(
              map,
              liveCoordsRef.current.lng,
              liveCoordsRef.current.lat
            )
          }
        })

        map.on('click', (e: any) => {
          const clickedLat = Number(e?.lngLat?.lat)
          const clickedLng = Number(e?.lngLat?.lng)
          if (Number.isFinite(clickedLat) && Number.isFinite(clickedLng)) {
            void selectPointRef.current(
              clickedLat,
              clickedLng,
              true,
              e?.point
            )
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
  }, [hasSelectedAnyLocation, mapStyleMode, isPureRasterMode, mapUiT])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || isPureRasterMode) return
    if (map.isStyleLoaded?.()) {
      apply3DBuildingsToMap(
        map,
        locale as LocaleCode,
        mapStyleMode,
        is3dPitch
      )
      highlight3DBuildingAtCoordinates(
        map,
        liveCoordsRef.current.lng,
        liveCoordsRef.current.lat
      )
    }
  }, [is3dPitch, locale, mapStyleMode, isPureRasterMode])

  const handleSelectStreetSuggestion = async (item: GeorgiaPlaceSuggestion) => {
    setStreetDropdownOpen(false)
    setOutsideGeorgiaAlert('')
    const selectedStreet = item.street || item.primaryText
    const nextHouse = item.houseNumber || form.houseNumber || ''
    lastManualTypedRef.current = `${selectedStreet}|${nextHouse}|${item.displayAreaLabel}`
    update('exactStreet', selectedStreet)
    if (item.houseNumber) update('houseNumber', item.houseNumber)
    update('location', item.areaId)
    update('locationDisplay', item.displayAreaLabel)

    const cityPart =
      item.displayAreaLabel.split(',').pop()?.trim() || 'Tbilisi'
    const distPart = item.displayAreaLabel.split(',')[0]?.trim() || ''

    const exactCoords = await geocodeExactBuildingInGeorgia({
      street: selectedStreet,
      houseNumber: nextHouse,
      district: distPart,
      city: cityPart,
    })

    const targetLat = exactCoords?.lat || item.lat
    const targetLng = exactCoords?.lng || item.lng

    flyMapToExactPoint(targetLat, targetLng, 17.6)

    if (exactCoords?.cadastralCode) {
      update('cadastralCode', exactCoords.cadastralCode)
      setNaprParcelAddress(exactCoords.naprAddress || '')
    } else {
      update('cadastralCode', '')
      setNaprParcelAddress('')
    }
  }

  const handleDetectMyGps = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    setGpsLoading(true)
    setOutsideGeorgiaAlert('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (!isPointInsideGeorgia(lat, lng)) {
          setOutsideGeorgiaAlert(mapUiT.outsideGeorgiaMapAlert)
          return
        }
        void selectPointOnMap(lat, lng, true)
      },
      () => {
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleZoomAroundCenter = (delta: number) => {
    const map = mapInstanceRef.current
    if (!map) return
    const nextZoom = Math.min(19.5, Math.max(9, (map.getZoom() || 16) + delta))
    map.easeTo({
      center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
      zoom: nextZoom,
      duration: 250,
    })
  }

  const toggle3dCameraPitch = () => {
    if (isPureRasterMode) {
      setMapStyleMode('realistic')
      setIs3dPitch(true)
      return
    }
    const next3d = !is3dPitch
    setIs3dPitch(next3d)
    mapInstanceRef.current?.easeTo({
      center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
      pitch: next3d ? 52 : 0,
      bearing: next3d ? -12 : 0,
      duration: 380,
    })
  }

  const resetCompass = () => {
    mapInstanceRef.current?.easeTo({
      center: [liveCoordsRef.current.lng, liveCoordsRef.current.lat],
      bearing: 0,
      pitch: is3dPitch && !isPureRasterMode ? 52 : 0,
      duration: 350,
    })
  }

  const hasValidCadastral = Boolean(
    form.cadastralCode && form.cadastralCode.trim().length >= 8
  )

  const subtleInputClass =
    'h-12 rounded-xl text-xs font-semibold text-[#0a1122] sm:text-sm placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-300'

  return (
    <section
      ref={sectionRef}
      onClick={onHover}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <input
        type="hidden"
        name="lat"
        value={hasSelectedAnyLocation ? String(liveCoords.lat.toFixed(6)) : ''}
      />
      <input
        type="hidden"
        name="lng"
        value={hasSelectedAnyLocation ? String(liveCoords.lng.toFixed(6)) : ''}
      />
      <input
        type="hidden"
        name="location_display"
        value={form.locationDisplay ?? ''}
      />
      <input
        type="hidden"
        name="hide_cadastral"
        value={form.hideCadastral ?? 'false'}
      />
      <input
        type="hidden"
        name="nearby_places_json"
        value={cachedPlacesJson}
      />

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
              cadastralCode,
              naprAddress,
              lat,
              lng,
            }) => {
              setOutsideGeorgiaAlert('')
              update('location', areaId)
              update('locationDisplay', displayLabel)

              const nextStreet = street !== undefined ? street : ''
              const nextHouse = houseNumber !== undefined ? houseNumber : ''
              update('exactStreet', nextStreet)
              update('houseNumber', nextHouse)

              update('cadastralCode', cadastralCode || '')
              setNaprParcelAddress(naprAddress || '')

              if (!areaId && !nextStreet) {
                update('lat', '')
                update('lng', '')
                return
              }

              const fallbackArea = getCoordinatesForArea(
                areaId || 'Tbilisi - Saburtalo'
              )
              const resolvedLat = lat || fallbackArea.lat
              const resolvedLng = lng || fallbackArea.lng

              if (!nextStreet) {
                lastManualTypedRef.current = `||${displayLabel}`
                syncCoordsAndMarker(resolvedLat, resolvedLng)
                setTimeout(
                  () => flyMapToExactPoint(resolvedLat, resolvedLng, 16.2),
                  80
                )
              } else {
                lastManualTypedRef.current = `${nextStreet}|${nextHouse}|${displayLabel}`
                const cityPart =
                  displayLabel.split(',').pop()?.trim() || 'Tbilisi'
                const distPart =
                  displayLabel.split(',')[0]?.trim() || ''

                syncCoordsAndMarker(resolvedLat, resolvedLng)

                void (async () => {
                  const exactRes = await geocodeExactBuildingInGeorgia({
                    street: nextStreet,
                    houseNumber: nextHouse,
                    district: distPart,
                    city: cityPart,
                  })
                  const targetLat = exactRes?.lat || resolvedLat
                  const targetLng = exactRes?.lng || resolvedLng
                  flyMapToExactPoint(targetLat, targetLng, 17.5)
                  if (exactRes?.cadastralCode) {
                    update('cadastralCode', exactRes.cadastralCode)
                    setNaprParcelAddress(exactRes.naprAddress || '')
                  }
                })()
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
          <div className="grid grid-cols-1 items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
            <div id="field-wrap-project" className="flex flex-col gap-2">
              <Label
                htmlFor="project"
                className="text-start text-xs font-extrabold text-[#0a1122]"
              >
                <RequiredLabel>{locT.projectLabel}</RequiredLabel>
              </Label>
              <Input
                id="project"
                name="project"
                type="text"
                dir={dir}
                placeholder={mapUiT.shortProjectPlaceholder}
                value={form.project ?? ''}
                onChange={(e) => update('project', e.target.value)}
                className={`${subtleInputClass} ${
                  fieldErrors.project
                    ? 'border-2 border-red-500 bg-red-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              />
              {fieldErrors.project && (
                <p className="text-start text-xs font-extrabold text-red-600">
                  {fieldErrors.project}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="developer"
                className="text-start text-xs font-extrabold text-[#0a1122]"
              >
                {locT.developerLabel}
              </Label>
              <Input
                id="developer"
                name="developer"
                type="text"
                dir={dir}
                placeholder={mapUiT.shortDeveloperPlaceholder}
                value={form.developer ?? ''}
                onChange={(e) => update('developer', e.target.value)}
                className={`${subtleInputClass} border-slate-200 bg-white`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
          <div
            id="field-wrap-exactStreet"
            ref={streetDropdownRef}
            className="relative flex flex-col gap-2 sm:col-span-2"
          >
            <Label
              htmlFor="exactStreet"
              className="text-start text-xs font-extrabold text-[#0a1122]"
            >
              <RequiredLabel>{locT.streetLabel}</RequiredLabel>
            </Label>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-300" />
              <Input
                id="exactStreet"
                name="exactStreet"
                type="text"
                dir={dir}
                autoComplete="off"
                placeholder={mapUiT.shortStreetPlaceholder}
                value={form.exactStreet ?? ''}
                onFocus={() => setStreetDropdownOpen(true)}
                onChange={(e) => {
                  update('exactStreet', e.target.value)
                  setStreetDropdownOpen(true)
                }}
                className={`${subtleInputClass} ps-10 pe-10 ${
                  fieldErrors.exactStreet
                    ? 'border-2 border-red-500 bg-red-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              />
              {form.exactStreet ? (
                <button
                  type="button"
                  onClick={() => {
                    update('exactStreet', '')
                    update('houseNumber', '')
                    update('cadastralCode', '')
                    setNaprParcelAddress('')
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
              <p className="text-start text-[11px] font-medium text-slate-400">
                {locT.streetAutocompleteHint}
              </p>
            )}

            {streetDropdownOpen && streetSuggestions.length > 0 && (
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
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="houseNumber"
              className="text-start text-xs font-extrabold text-[#0a1122]"
            >
              {locT.houseNoLabel}
            </Label>
            <Input
              id="houseNumber"
              name="houseNumber"
              type="text"
              dir="ltr"
              placeholder={mapUiT.shortHousePlaceholder}
              value={form.houseNumber ?? ''}
              onChange={(e) => update('houseNumber', e.target.value)}
              className={`${subtleInputClass} border-slate-200 bg-white`}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label
                htmlFor="cadastralCode"
                className="text-start text-xs font-extrabold text-[#0a1122]"
              >
                {locT.cadastralLabel}
              </Label>

              {hideCadastralOnSite && hasValidCadastral && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#007a5a]">
                  <Lock className="size-3" />
                  <span>{mapUiT.hiddenFromPublicBadge}</span>
                </span>
              )}
            </div>

            <Input
              id="cadastralCode"
              name="cadastralCode"
              type="text"
              dir="ltr"
              placeholder={mapUiT.shortCadastralPlaceholder}
              value={form.cadastralCode ?? ''}
              onChange={(e) => update('cadastralCode', e.target.value)}
              className={`${subtleInputClass} font-mono transition ${
                hideCadastralOnSite && hasValidCadastral
                  ? 'border-emerald-200 bg-emerald-50/30 text-slate-500'
                  : 'border-slate-200 bg-white'
              }`}
            />
          </div>

          {hasValidCadastral ? (
            <div className="flex flex-col justify-between gap-3 pt-0.5 sm:flex-row sm:items-center">
              <div className="space-y-1 text-start">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#2563eb]" />
                  <span>{mapUiT.parcelFoundText}</span>
                </div>
                <p
                  dir="ltr"
                  className="text-xs font-medium text-slate-500"
                >
                  {naprParcelAddress ||
                    [
                      form.locationDisplay || 'Tbilisi',
                      form.exactStreet,
                      form.houseNumber ? `N ${form.houseNumber}` : '',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !hideCadastralOnSite
                  update('hideCadastral', nextVal ? 'true' : 'false')
                }}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
                  hideCadastralOnSite
                    ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full border ${
                    hideCadastralOnSite
                      ? 'border-white bg-white/20 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {hideCadastralOnSite && (
                    <Check className="size-2.5 stroke-[3]" />
                  )}
                </span>
                <span>{mapUiT.hideCadastralBtn}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <CheckCircle2 className="size-4 shrink-0 text-[#2563eb]" />
              <span>{mapUiT.optionalNaprHint}</span>
            </div>
          )}
        </div>

        {outsideGeorgiaAlert && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-start text-xs font-bold text-amber-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>{outsideGeorgiaAlert}</span>
          </div>
        )}

        {hasSelectedAnyLocation && (
          <div
            ref={mapWrapperRef}
            className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  <span className="text-[#ea580c]">📍</span>
                  <span>Aqar Exit Maps</span>
                </span>
                {reverseGeoLoading && (
                  <Loader2 className="size-3.5 animate-spin text-[#2563eb]" />
                )}
              </div>

              <span
                dir="ltr"
                className="font-mono text-xs font-semibold text-slate-400"
              >
                {`${liveCoords.lat.toFixed(5)}, ${liveCoords.lng.toFixed(5)}`}
              </span>
            </div>

            <div
              dir="ltr"
              className={
                isFullscreenMap
                  ? 'fixed inset-0 z-[9999] h-[100dvh] w-screen bg-[#e5e9e2]'
                  : 'relative h-[380px] w-full overflow-hidden rounded-[22px] border border-slate-200/90 bg-[#e5e9e2] shadow-sm transition-all duration-300 sm:h-[460px]'
              }
            >
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '100%' }}
                className="h-full w-full"
              />

              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
                <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => handleZoomAroundCenter(1)}
                    className="hidden size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100 sm:flex"
                    title="Zoom in"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomAroundCenter(-1)}
                    className="hidden size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100 sm:flex"
                    title="Zoom out"
                  >
                    <Minus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetCompass}
                    className="hidden size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100 sm:flex"
                    title="Reset bearing"
                  >
                    <Compass className="size-4" />
                  </button>

                  <button
                    type="button"
                    disabled={gpsLoading}
                    onClick={handleDetectMyGps}
                    className="flex size-10 items-center justify-center border-b border-slate-100 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    title={locT.detectMyGpsBtn}
                  >
                    {gpsLoading ? (
                      <Loader2 className="size-4 animate-spin text-[#2563eb]" />
                    ) : (
                      <LocateFixed className="size-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenMap((p) => !p)}
                    className="flex size-10 items-center justify-center text-slate-700 transition hover:bg-slate-100"
                    title="Fullscreen map"
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
                      onClick={toggle3dCameraPitch}
                      className={`flex h-10 min-w-[44px] items-center justify-center px-3 text-xs font-black transition ${
                        is3dPitch && !isPureRasterMode
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
            </div>

            <p className="mt-2.5 text-start text-xs font-medium text-slate-400">
              {mapUiT.bottomSnapHint}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}