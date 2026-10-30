'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Building,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Eye,
  FileCheck2,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import { useTranslation } from '@/lib/i18n'
import {
  isImageFileUrl,
  type SellerDocKey,
  type SellerExtraLabels,
  type UploadedDocEntry,
} from './seller-i18n'
import {
  BUILDING_MATERIALS,
  BUILDING_SERIES,
  CONDITION_OPTIONS,
  DEAL_TYPES,
  Field,
  FLOOR_TYPES,
  HEATING_TYPES,
  MoneyField,
  MonthYearSelector,
  PROPERTY_KINDS,
  SIVRCE_FEATURE_GROUPS,
  years,
  type DealCategory,
} from './seller-shared'

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

export function StepValidationBanner({
  missingFields,
  prefixText,
}: {
  missingFields: string[]
  prefixText: string
}) {
  if (!missingFields.length) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-start text-xs leading-relaxed text-red-800 shadow-2xs"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      <div>
        <strong className="font-extrabold">{prefixText} </strong>
        <span className="font-bold">{missingFields.join(' ، ')}</span>
      </div>
    </div>
  )
}

// =====================================================
// 1. قسم نوع العملية ونوع العقار وحالة البناء (TypeSection)
// =====================================================
export function TypeSection({
  sectionRef,
  onHover,
  dealCategory,
  setDealCategory,
  propertyKind,
  setPropertyKind,
  buildingStatus,
  setBuildingStatus,
  dynamicStatusOptions,
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  dealCategory: DealCategory
  setDealCategory: (c: DealCategory) => void
  propertyKind: string
  setPropertyKind: (k: string) => void
  buildingStatus: string
  setBuildingStatus: (s: string) => void
  dynamicStatusOptions: Array<{ id: string; labelEn: string; labelAr: string }>
}) {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'

  return (
    <section
      ref={sectionRef}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">
        {isAr ? '1. نوع الإعلان والعقار (Type)' : 'Type'}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {isAr
          ? 'اختر نوع العملية أولاً ثم نوع العقار — يتكيف باقي النموذج تلقائياً حسب اختيارك.'
          : 'Pick sale, exit, or rent first, then the property type — we tailor the rest of the form.'}
      </p>

      <div className="mt-5">
        <label className="mb-2.5 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
          {isAr
            ? 'ماذا تريد أن تفعل بعقارك؟ (What do you want to do?)'
            : 'What do you want to do?'}
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {DEAL_TYPES.map((d) => {
            const Icon = d.icon
            const active = dealCategory === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDealCategory(d.id)}
                className={`relative flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition ${
                  active
                    ? 'border-2 border-[#2563eb] bg-blue-50/35 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 end-2.5 flex size-5 items-center justify-center rounded-full bg-[#2563eb] text-white">
                    <Check className="size-3 stroke-[3]" />
                  </span>
                )}
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="mt-3">
                  <strong className="block text-xs font-black text-[#0a1122] sm:text-sm">
                    {isAr ? d.titleAr : d.titleEn}
                  </strong>
                  <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                    {isAr ? d.subAr : d.subEn}
                  </span>
                </div>
                {(d.badgeAr || d.badgeEn) && (
                  <span
                    className={`mt-2.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      d.id === 'exit' || d.id === 'sale'
                        ? 'bg-emerald-50 text-[#007a5a]'
                        : 'bg-orange-50 text-[#ea580c]'
                    }`}
                  >
                    {isAr ? d.badgeAr : d.badgeEn}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-2.5 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
          {isAr
            ? 'ما هو نوع العقار؟ (What kind of property?)'
            : 'What kind of property?'}
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PROPERTY_KINDS.map((k) => {
            const Icon = k.icon
            const active = propertyKind === k.id
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setPropertyKind(k.id)
                  if (k.id === 'Hotel' || k.id === 'Commercial') {
                    setBuildingStatus('Completed')
                  } else if (buildingStatus === 'Completed') {
                    setBuildingStatus('Newly built')
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                  active
                    ? 'border-2 border-[#2563eb] bg-blue-50/35 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 end-2.5 flex size-5 items-center justify-center rounded-full bg-[#2563eb] text-white">
                    <Check className="size-3 stroke-[3]" />
                  </span>
                )}
                <div
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <strong className="mt-2.5 text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {isAr ? k.labelAr : k.labelEn}
                </strong>
              </button>
            )
          })}
        </div>
      </div>

      {propertyKind !== 'Land' && (
        <div className="mt-6">
          <label className="mb-2.5 block text-xs font-extrabold text-slate-500">
            {isAr ? 'حالة البناء (Status *)' : 'Status *'}
          </label>
          <div
            className={`grid gap-2.5 ${
              dynamicStatusOptions.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {dynamicStatusOptions.map((st) => {
              const active = buildingStatus === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setBuildingStatus(st.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition ${
                    active
                      ? 'border-2 border-[#2563eb] bg-blue-50/35 font-black text-[#0a1122]'
                      : 'border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building className="mb-1.5 size-4 text-[#2563eb]" />
                  <span className="text-xs">
                    {isAr ? st.labelAr : st.labelEn}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

// =====================================================
// 2. قسم الصور والفيديو والجولة الافتراضية (PhotosSection)
// =====================================================
export function PhotosSection({
  sectionRef,
  onHover,
  images,
  setImages,
  uploading,
  onUploadPhotos,
  onPreviewDoc,
  form,
  update,
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  images: string[]
  setImages: (imgs: string[]) => void
  uploading: boolean
  onUploadPhotos: (files: FileList | null) => void
  onPreviewDoc: (url: string, title: string) => void
  form: Record<string, string>
  update: (k: string, v: string) => void
}) {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'

  return (
    <section
      ref={sectionRef}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">
        {isAr ? '2. صور العقار والفيديو (Photos)' : 'Photos'}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {isAr
          ? 'أظهر التصميم الداخلي والخارجي: غرفة المعيشة، غرف النوم، الحمامات، الشرفة، والإطلالة. أول صورة هي الغلاف.'
          : 'Show interior and exterior: living room, bedroom, bathrooms, balcony, view.'}
      </p>

      <label className="mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-[#f8fafc] p-6 text-center transition hover:border-[#2563eb] hover:bg-blue-50/20">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
          <ImagePlus className="size-5" />
        </div>
        <p className="text-sm font-black text-[#0a1122]">
          {isAr
            ? 'اضغط لرفع الصور أو اسحبها وأفلتها هنا'
            : 'Click to upload or drag and drop here'}
        </p>
        <p className="text-xs font-bold text-slate-400">
          {images.length}/22 {isAr ? 'صورة' : 'photos'}
        </p>
        <p className="max-w-md text-[11px] text-slate-400">
          {isAr
            ? 'الإعلانات المزودة بصور واضحة تحصل على مشاهدات أعلى بـ 5 أضعاف. الصورة الأولى تصبح صورة الغلاف.'
            : 'Listings without photos get less interest. The first shot is the cover.'}
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => onUploadPhotos(e.target.files)}
        />
      </label>

      {uploading && (
        <div className="mt-3 flex items-center gap-2 text-xs font-extrabold text-[#2563eb]">
          <Loader2 className="size-4 animate-spin" />
          <span>{isAr ? 'جاري رفع الصور...' : 'Uploading photos...'}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url, idx) => (
            <div
              key={url}
              className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-slate-100 ${
                idx === 0 ? 'border-[#ea580c]' : 'border-slate-200'
              }`}
            >
              <img
                src={url}
                alt=""
                onClick={() => onPreviewDoc(url, `Photo ${idx + 1}`)}
                className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
              />
              {idx === 0 && (
                <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full bg-[#ea580c] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                  ★ {isAr ? 'صورة الغلاف' : 'Cover photo'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="absolute top-2 end-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-slate-600">
            <Video className="size-3.5 text-[#2563eb]" />
            <span>
              {isAr
                ? 'رابط فيديو العقار (YouTube / Vimeo)'
                : 'Video URL (YouTube / Vimeo)'}
            </span>
          </label>
          <Input
            dir="ltr"
            value={form.videoUrl}
            onChange={(e) => update('videoUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="h-11 rounded-xl border-slate-200 text-xs"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-slate-600">
            <Sparkles className="size-3.5 text-[#ea580c]" />
            <span>
              {isAr
                ? 'رابط جولة افتراضية ثلاثية الأبعاد (3D tour link)'
                : '3D tour link (Matterport)'}
            </span>
          </label>
          <Input
            dir="ltr"
            value={form.tour3dUrl}
            onChange={(e) => update('tour3dUrl', e.target.value)}
            placeholder="https://my.matterport.com/..."
            className="h-11 rounded-xl border-slate-200 text-xs"
          />
        </div>
      </div>
    </section>
  )
}

// =====================================================
// 3. قسم الموقع والخريطة الحية (LocationSection)
// =====================================================
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
  const isAr = locale === 'ar'
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const areaCoords = getCoordinatesForArea(form.location)

  useEffect(() => {
    let isMounted = true
    let map: any = null

    loadSellerMapLibre()
      .then((maplibregl) => {
        if (!isMounted || !mapContainerRef.current || !maplibregl) return

        map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [areaCoords.lng, areaCoords.lat],
          zoom: 15.5,
          pitch: 52,
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
                map.setPaintProperty(layer.id, 'fill-extrusion-color', '#d6c3b1')
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
  }, [areaCoords.lat, areaCoords.lng])

  return (
    <section
      ref={sectionRef}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">
        {isAr ? '3. الموقع والعنوان (Location)' : 'Location'}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {isRentDeal
          ? isAr
            ? 'في إعلانات الإيجار، يظهر الشارع والموقع للمستأجرين لتسهيل الوصول.'
            : 'Enter the exact street and house number — the pin drops on the map automatically.'
          : isAr
            ? 'في البيع والتنازل، نعرض للمشترين نطاق الحي التقريبي فقط ونخفي رقم المبنى لحماية خصوصيتك وعمولة الوساطة.'
            : 'For sale & exit deals, only approximate district center is shown publicly to protect privacy.'}
      </p>

      <div className="mt-4 space-y-4">
        <GeorgiaAreaSelect
          label={
            isAr
              ? 'المدينة / الحي في جورجيا (City / District *)'
              : 'City / District *'
          }
          value={form.location}
          onChange={(area) => update('location', area)}
        />

        {(isExitDeal || isDirectSale) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={
                isAr
                  ? 'اسم شركة التطوير العقاري (Developer)'
                  : 'Developer Name'
              }
              id="developer"
              placeholder="e.g. ORBI Group, Archi, m²..."
              value={form.developer}
              update={(v) => update('developer', v)}
            />
            <Field
              label={
                isAr
                  ? 'اسم المشروع أو الكمبوند (Project Name)'
                  : 'Project / Complex Name'
              }
              id="project"
              placeholder="e.g. King David, Orbi City..."
              value={form.project}
              update={(v) => update('project', v)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field
              label={
                isAr
                  ? 'الشارع (Street) — يظهر للإدارة وفي الإيجار فقط'
                  : 'Street'
              }
              id="exactStreet"
              placeholder="e.g. Chavchavadze Ave."
              value={form.exactStreet}
              update={(v) => update('exactStreet', v)}
            />
          </div>
          <div>
            <Field
              label={isAr ? 'رقم البناية (House Nº)' : 'House Nº'}
              id="houseNumber"
              placeholder="47"
              value={form.houseNumber}
              update={(v) => update('houseNumber', v)}
            />
          </div>
        </div>

        <Field
          label={
            isAr
              ? 'الرقم العقاري الحكومي الاختياري (Cadastral code — NAPR)'
              : 'Cadastral code (Optional)'
          }
          id="cadastralCode"
          placeholder="01.10.01.001.001"
          helper={
            isAr
              ? 'اختياري — يساعد في توثيق العقار سريعاً في السجل العقاري الجورجي NAPR'
              : 'Optional — snaps NAPR parcel onto the map'
          }
          value={form.cadastralCode}
          update={(v) => update('cadastralCode', v)}
        />

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#ea580c]" />
              <span>
                Aqar Exit 3D Maps ·{' '}
                {getLocalizedGeorgiaAreaName(form.location, locale)}
              </span>
            </span>
            <span dir="ltr" className="font-mono text-slate-400">
              {areaCoords.lat.toFixed(4)}, {areaCoords.lng.toFixed(4)}
            </span>
          </div>
          <div
            dir="ltr"
            className="relative h-56 w-full overflow-hidden bg-[#edeae4]"
          >
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%' }}
              className="absolute inset-0"
            />

            <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="flex flex-col items-center">
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#ea580c] text-white shadow-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="-mt-1 h-2.5 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#ea580c]" />
              </div>
            </div>

            <div className="absolute right-2.5 bottom-2.5 z-10 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-700 shadow-xs hover:bg-white"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-700 shadow-xs hover:bg-white"
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =====================================================
// 4. قسم المواصفات الهندسية والمميزات الـ 6 (DetailsSection)
// =====================================================
export function DetailsSection({
  sectionRef,
  onHover,
  propertyKind,
  buildingStatus,
  dealCategory,
  form,
  update,
  selected,
  toggleSingle,
  toggleMulti,
  flags,
  setFlags,
  extraT,
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  propertyKind: string
  buildingStatus: string
  dealCategory: DealCategory
  form: Record<string, string>
  update: (k: string, v: string) => void
  selected: Record<string, string[]>
  toggleSingle: (g: string, v: string) => void
  toggleMulti: (g: string, v: string) => void
  flags: {
    allowOnlineViewing: boolean
    installmentSalePossible: boolean
    exchangePossible: boolean
    isExclusive: boolean
    agreedTerms: boolean
  }
  setFlags: React.Dispatch<
    React.SetStateAction<{
      allowOnlineViewing: boolean
      installmentSalePossible: boolean
      exchangePossible: boolean
      isExclusive: boolean
      agreedTerms: boolean
    }>
  >
  extraT: SellerExtraLabels
}) {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'
  const isDirectSale = dealCategory === 'sale' || dealCategory === 'pledge'

  const [openFeatureGroups, setOpenFeatureGroups] = useState<
    Record<string, boolean>
  >({
    space: true,
    building: true,
    utilities: true,
    comfort: true,
    views: true,
    extra: true,
  })

  return (
    <section
      ref={sectionRef}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">
        {isAr ? '4. المواصفات الهندسية والمميزات (Details)' : 'Details'}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {isAr
          ? 'حدد حالة التشطيب، المساحات، عدد الغرف، الطابق، والمميزات المتوفرة فعلياً في العقار.'
          : 'Fill in accurate rooms, area, floor, status and features.'}
      </p>

      {propertyKind !== 'Land' && (
        <>
          <div className="mt-5">
            <label className="mb-2 block text-xs font-extrabold text-slate-600">
              {isAr ? 'حالة التشطيب (Condition)' : 'Condition'}
            </label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((c) => {
                const active = selected.finishing?.[0] === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleSingle('finishing', c.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      active
                        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? c.labelAr : c.labelEn}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-xs font-extrabold text-slate-600">
              {isAr ? 'طراز المبنى (Building series)' : 'Building series'}
            </label>
            <p className="mb-2 text-[11px] text-slate-400">
              {isAr
                ? 'للمباني الحديثة اختر Non-standard أو City type'
                : 'For older blocks — helps buyers filter fast'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {BUILDING_SERIES.map((ser) => {
                const active = selected.buildingSeries?.[0] === ser
                return (
                  <button
                    key={ser}
                    type="button"
                    onClick={() => toggleSingle('buildingSeries', ser)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'border-[#2563eb] bg-[#2563eb] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {ser}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-600">
                {isAr ? 'نوع الطابق (Floor type)' : 'Floor type'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FLOOR_TYPES.map((ft) => {
                  const active = selected.floorType?.[0] === ft.id
                  return (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => toggleSingle('floorType', ft.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {isAr ? ft.labelAr : ft.labelEn}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-600">
                {isAr ? 'التدفئة (Heating)' : 'Heating'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HEATING_TYPES.map((ht) => {
                  const active = selected.heatingType?.[0] === ht.id
                  return (
                    <button
                      key={ht.id}
                      type="button"
                      onClick={() => toggleSingle('heatingType', ht.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {isAr ? ht.labelAr : ht.labelEn}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-extrabold text-slate-600">
                {isAr ? 'مادة البناء (Building material)' : 'Building material'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BUILDING_MATERIALS.map((bm) => {
                  const active = selected.buildingMaterial?.[0] === bm.id
                  return (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => toggleSingle('buildingMaterial', bm.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {isAr ? bm.labelAr : bm.labelEn}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field
          label={isAr ? 'المساحة الإجمالية (Area m²) *' : 'Area (m²) *'}
          id="areaSize"
          type="number"
          placeholder="74"
          value={form.areaSize}
          update={(v) => update('areaSize', v)}
        />
        {propertyKind !== 'Land' && (
          <>
            <Field
              label={
                isAr ? 'مساحة المطبخ (Kitchen m²)' : 'Kitchen area (m²)'
              }
              id="kitchenArea"
              type="number"
              placeholder="12"
              value={form.kitchenArea}
              update={(v) => update('kitchenArea', v)}
            />
            <Field
              label={isAr ? 'سنة البناء (Year built)' : 'Year built'}
              id="yearBuilt"
              type="number"
              placeholder="2024"
              value={form.yearBuilt}
              update={(v) => update('yearBuilt', v)}
            />
            <Field
              label={isAr ? 'مساحة البلكونة (Balcony m²)' : 'Balcony (m²)'}
              id="balconyArea"
              type="number"
              placeholder="0"
              value={form.balconyArea}
              update={(v) => update('balconyArea', v)}
            />
            <Field
              label={isAr ? 'مساحة اللوجيا (Loggia m²)' : 'Loggia (m²)'}
              id="loggiaArea"
              type="number"
              placeholder="0"
              value={form.loggiaArea}
              update={(v) => update('loggiaArea', v)}
            />
            <Field
              label={
                isAr ? 'مساحة التراس / الحديقة (m²)' : 'Terrace / Yard (m²)'
              }
              id="terraceArea"
              type="number"
              placeholder="0"
              value={form.terraceArea}
              update={(v) => {
                update('terraceArea', v)
                update('garden', v)
              }}
            />
          </>
        )}
      </div>

      {propertyKind !== 'Land' && (
        <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
          <div>
            <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
              {isAr ? 'غرف النوم (Bedrooms *)' : 'Bedrooms *'}
            </label>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(
                (num) => {
                  const cleanVal = num.replace('+', '')
                  const active = form.bedrooms === cleanVal
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => update('bedrooms', cleanVal)}
                      className={`flex size-10 items-center justify-center rounded-full border text-xs font-extrabold transition ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
              {isAr ? 'إجمالي عدد الغرف (Rooms *)' : 'Rooms *'}
            </label>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(
                (num) => {
                  const cleanVal = num.replace('+', '')
                  const active = form.rooms === cleanVal
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => update('rooms', cleanVal)}
                      className={`flex size-10 items-center justify-center rounded-full border text-xs font-extrabold transition ${
                        active
                          ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
              {isAr ? 'عدد الحمامات (Bathrooms)' : 'Bathrooms'}
            </label>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5+'].map((num) => {
                const cleanVal = num.replace('+', '')
                const active = form.bathrooms === cleanVal
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => update('bathrooms', cleanVal)}
                    className={`flex size-10 items-center justify-center rounded-full border text-xs font-extrabold transition ${
                      active
                        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label={isAr ? 'الطابق (Floor)' : 'Floor'}
              id="floor"
              type="number"
              placeholder="5"
              value={form.floor}
              update={(v) => update('floor', v)}
            />
            <Field
              label={
                isAr ? 'إجمالي طوابق المبنى (Total floors)' : 'Total floors'
              }
              id="totalFloors"
              type="number"
              placeholder="12"
              value={form.totalFloors}
              update={(v) => update('totalFloors', v)}
            />
            {dealCategory === 'rent_daily' && (
              <Field
                label={
                  isAr ? 'أقصى عدد للضيوف (Max Guests)' : 'Max Guests'
                }
                id="maxGuests"
                type="number"
                placeholder="2"
                value={form.maxGuests}
                update={(v) => update('maxGuests', v)}
              />
            )}
          </div>

          {buildingStatus === 'Under construction' && (
            <div className="pt-2">
              <Field
                label={extraT.deliveryMonthsLabel}
                id="deliveryRemainingMonths"
                type="number"
                helper={extraT.deliveryMonthsHelper}
                value={form.deliveryRemainingMonths}
                update={(v) => update('deliveryRemainingMonths', v)}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-7 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
          {isAr ? 'مميزات العقار (Features)' : 'Features'}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          {isAr
            ? 'اختر جميع المميزات المتوفرة فعلياً في العقار لرفع تقييم الوحدة (Deal Score).'
            : 'Select only what the property actually has.'}
        </p>

        <div className="mt-4 space-y-3">
          {SIVRCE_FEATURE_GROUPS.map((grp) => {
            const isOpen = openFeatureGroups[grp.key] ?? true
            const selectedInGroup = grp.items.filter((it) =>
              selected.features?.includes(it.id)
            ).length

            return (
              <div
                key={grp.key}
                className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-4"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenFeatureGroups((prev) => ({
                      ...prev,
                      [grp.key]: !isOpen,
                    }))
                  }
                  className="flex w-full items-center justify-between text-start"
                >
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                      {isAr
                        ? `${grp.labelAr} (${grp.labelEn})`
                        : grp.labelEn}
                    </strong>
                    {selectedInGroup > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-black text-white">
                        {selectedInGroup}
                      </span>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="size-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="size-4 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {grp.items.map((item) => {
                      const active = selected.features?.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleMulti('features', item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {active && <Check className="size-3 stroke-[3]" />}
                          <span>{isAr ? item.labelAr : item.labelEn}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 space-y-2.5">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/60">
            <input
              type="checkbox"
              checked={flags.allowOnlineViewing}
              onChange={(e) =>
                setFlags((p) => ({
                  ...p,
                  allowOnlineViewing: e.target.checked,
                }))
              }
              className="mt-0.5 size-4 rounded accent-[#2563eb]"
            />
            <div>
              <strong className="block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                {isAr
                  ? 'أنا مستعد للمعاينة أونلاين بالفيديو (I am ready for online viewings)'
                  : 'I am ready for online viewings'}
              </strong>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {isAr
                  ? 'إذا كان بإمكانك عرض العقار عن بُعد عبر (WhatsApp, Viber, Zoom) فعّل هذا الخيار.'
                  : 'If you can show the property remotely (Viber, WhatsApp, Zoom), check this box.'}
              </span>
            </div>
          </label>

          {isDirectSale && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/60">
              <input
                type="checkbox"
                checked={flags.installmentSalePossible}
                onChange={(e) =>
                  setFlags((p) => ({
                    ...p,
                    installmentSalePossible: e.target.checked,
                  }))
                }
                className="mt-0.5 size-4 rounded accent-[#2563eb]"
              />
              <div>
                <strong className="block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {isAr
                    ? 'متاح البيع بالتقسيط على دفعات (Installment sale possible)'
                    : 'Installment sale possible'}
                </strong>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  {isAr
                    ? 'فعّل هذا الخيار إذا كنت تقبل دفع الثمن على دفعات.'
                    : 'Check if you accept the price paid in parts over time.'}
                </span>
              </div>
            </label>
          )}
        </div>
      </div>
    </section>
  )
}

// =====================================================
// 5. قسم السعر والمستندات والوصف بالذكاء الاصطناعي (PricingSection)
// =====================================================
export function PricingSection({
  sectionRef,
  onHover,
  dealCategory,
  isExitDeal,
  isDirectSale,
  isRentDeal,
  currencyChoice,
  setCurrencyChoice,
  priceInputMode,
  setPriceInputMode,
  form,
  update,
  selected,
  toggleSingle,
  flags,
  setFlags,
  unitDocs,
  uploadingDocKey,
  onUploadDoc,
  onRemoveDoc,
  onPreviewDoc,
  onGenerateAiDescription,
}: {
  sectionRef: React.RefObject<HTMLElement | null>
  onHover: () => void
  dealCategory: DealCategory
  isExitDeal: boolean
  isDirectSale: boolean
  isRentDeal: boolean
  currencyChoice: 'USD' | 'GEL' | 'EUR'
  setCurrencyChoice: (c: 'USD' | 'GEL' | 'EUR') => void
  priceInputMode: 'total' | 'sqm'
  setPriceInputMode: (m: 'total' | 'sqm') => void
  form: Record<string, string>
  update: (k: string, v: string) => void
  selected: Record<string, string[]>
  toggleSingle: (g: string, v: string) => void
  flags: {
    allowOnlineViewing: boolean
    installmentSalePossible: boolean
    exchangePossible: boolean
    isExclusive: boolean
    agreedTerms: boolean
  }
  setFlags: React.Dispatch<
    React.SetStateAction<{
      allowOnlineViewing: boolean
      installmentSalePossible: boolean
      exchangePossible: boolean
      isExclusive: boolean
      agreedTerms: boolean
    }>
  >
  unitDocs: Record<string, UploadedDocEntry>
  uploadingDocKey: string | null
  onUploadDoc: (k: SellerDocKey, files: FileList | null) => void
  onRemoveDoc: (k: SellerDocKey) => void
  onPreviewDoc: (url: string, title: string) => void
  onGenerateAiDescription: () => void
}) {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'

  return (
    <section
      ref={sectionRef}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-[#0a1122]">
            {isAr
              ? '5. السعر والتفاصيل المالية والوصف (Price & description)'
              : 'Price & description'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isAr
              ? 'ضع سعراً واقعياً أو حدد قابلية التفاوض لجذب المشترين الجادين بسرعة.'
              : 'Set a realistic price or mark negotiable.'}
          </p>
        </div>

        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
          {(
            [
              { code: 'USD', sym: '$ USD' },
              { code: 'GEL', sym: '₾ GEL' },
              { code: 'EUR', sym: '€ EUR' },
            ] as const
          ).map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrencyChoice(c.code)}
              className={`rounded-full px-3 py-1 text-xs font-extrabold transition ${
                currencyChoice === c.code
                  ? 'bg-[#2563eb] text-white'
                  : 'text-slate-600 hover:text-[#0a1122]'
              }`}
            >
              {c.sym}
            </button>
          ))}
        </div>
      </div>

      {isExitDeal && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MoneyField
              label={
                isAr
                  ? 'إجمالي سعر العقد مع المطور *'
                  : 'Total Contract Price *'
              }
              value={form.contractPrice}
              currencySymbol={currencyChoice}
              update={(v) => update('contractPrice', v)}
            />
            <MoneyField
              label={
                isAr
                  ? 'المبلغ المدفوع للمطور (الكاش المطلوب) *'
                  : 'Paid Amount (Required Cash) *'
              }
              value={form.paidAmount}
              currencySymbol={currencyChoice}
              update={(v) => update('paidAmount', v)}
            />
            <MoneyField
              label={
                isAr ? 'سعر الوحدة في السوق اليوم' : 'Current Market Price'
              }
              value={form.marketPrice}
              currencySymbol={currencyChoice}
              update={(v) => update('marketPrice', v)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MoneyField
              label={isAr ? 'قيمة القسط الدوري' : 'Installment Amount'}
              value={form.installment}
              currencySymbol={currencyChoice}
              update={(v) => update('installment', v)}
            />
            <Field
              label={
                isAr ? 'الأقساط المتبقية (بالشهور)' : 'Remaining Months'
              }
              id="remainingMonths"
              type="number"
              placeholder="24"
              value={form.remainingMonths}
              update={(v) => update('remainingMonths', v)}
            />
            <MonthYearSelector
              label={isAr ? 'تاريخ التعاقد الأصلي' : 'Contract Month & Year'}
              monthValue={form.contractMonth}
              yearValue={form.contractYear}
              yearsList={years}
              onMonthChange={(m) => update('contractMonth', m)}
              onYearChange={(y) => update('contractYear', y)}
            />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#007a5a]" />
                <strong className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {isAr
                    ? 'مستندات التنازل والملكية (اختياري الآن — يمكنك رفعها لاحقاً من حسابك)'
                    : 'Ownership Documents (Can be uploaded now or later)'}
                </strong>
              </div>
              <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-xs font-black text-[#007a5a]">
                {
                  (
                    ['contract', 'receipts', 'statement', 'passport'] as const
                  ).filter((k) => Boolean(unitDocs[k]?.url)).length
                }
                /4
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {(
                [
                  {
                    key: 'contract',
                    title: isAr ? 'عقد الشراء' : 'Unit Contract',
                  },
                  {
                    key: 'receipts',
                    title: isAr ? 'إيصالات السداد' : 'Payment Receipts',
                  },
                  {
                    key: 'statement',
                    title: isAr ? 'كشف الحساب' : 'Account Statement',
                  },
                  {
                    key: 'passport',
                    title: isAr ? 'جواز السفر' : 'Passport',
                  },
                ] as const
              ).map((sec) => {
                const entry = unitDocs[sec.key]
                const hasDoc = Boolean(entry?.url)
                const isUploadingThis = uploadingDocKey === sec.key
                return (
                  <div
                    key={sec.key}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {hasDoc ? (
                        <FileCheck2 className="size-4 shrink-0 text-[#007a5a]" />
                      ) : (
                        <FileText className="size-4 shrink-0 text-slate-400" />
                      )}
                      <span className="truncate text-xs font-bold text-[#0a1122]">
                        {sec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasDoc && isImageFileUrl(entry.url, entry.name) && (
                        <button
                          type="button"
                          onClick={() => onPreviewDoc(entry.url, sec.title)}
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      )}
                      <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-[#007a5a] px-2.5 text-[11px] font-bold text-white hover:bg-[#006248]">
                        {isUploadingThis ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <UploadCloud className="size-3" />
                        )}
                        <span>
                          {hasDoc
                            ? isAr
                              ? 'تغيير'
                              : 'Change'
                            : isAr
                              ? 'ارفع'
                              : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          onChange={(e) =>
                            onUploadDoc(sec.key, e.target.files)
                          }
                        />
                      </label>
                      {hasDoc && (
                        <button
                          type="button"
                          onClick={() => onRemoveDoc(sec.key)}
                          className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {isDirectSale && (
        <div className="mt-5 space-y-4">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setPriceInputMode('total')}
              className={`rounded-full px-4 py-1 text-xs font-extrabold transition ${
                priceInputMode === 'total'
                  ? 'bg-[#2563eb] text-white'
                  : 'text-slate-600'
              }`}
            >
              {isAr ? 'السعر الإجمالي (Total price)' : 'Total price'}
            </button>
            <button
              type="button"
              onClick={() => setPriceInputMode('sqm')}
              className={`rounded-full px-4 py-1 text-xs font-extrabold transition ${
                priceInputMode === 'sqm'
                  ? 'bg-[#2563eb] text-white'
                  : 'text-slate-600'
              }`}
            >
              {isAr ? 'سعر المتر (Price per m²)' : 'Price per m²'}
            </button>
          </div>

          {priceInputMode === 'total' ? (
            <MoneyField
              label={isAr ? 'إجمالي سعر البيع المطلوب *' : 'Total Price *'}
              value={form.contractPrice}
              currencySymbol={currencyChoice}
              update={(v) => {
                update('contractPrice', v)
                update('paidAmount', v)
              }}
            />
          ) : (
            <MoneyField
              label={isAr ? 'سعر المتر المربع *' : 'Price per m² *'}
              value={form.pricePerSqm}
              currencySymbol={currencyChoice}
              update={(v) => update('pricePerSqm', v)}
            />
          )}
        </div>
      )}

      {isRentDeal && (
        <div className="mt-5">
          <MoneyField
            label={
              dealCategory === 'rent_daily'
                ? isAr
                  ? 'سعر الإيجار في الليلة الواحدة (Daily Price) *'
                  : 'Price per night (Daily) *'
                : isAr
                  ? 'سعر الإيجار الشهري (Monthly Rent) *'
                  : 'Monthly Rent Price *'
            }
            value={form.rentPrice}
            currencySymbol={currencyChoice}
            update={(v) => update('rentPrice', v)}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200 p-3.5 text-xs font-extrabold text-[#0a1122] hover:bg-slate-50">
          <input
            type="checkbox"
            checked={selected.discountOffer?.[0] === 'yes'}
            onChange={(e) =>
              toggleSingle('discountOffer', e.target.checked ? 'yes' : 'no')
            }
            className="size-4 rounded accent-[#2563eb]"
          />
          <span>
            {isAr
              ? 'السعر قابل للتفاوض (Price negotiable)'
              : 'Price negotiable'}
          </span>
        </label>

        {!isRentDeal && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200 p-3.5 text-xs font-extrabold text-[#0a1122] hover:bg-slate-50">
            <input
              type="checkbox"
              checked={flags.exchangePossible}
              onChange={(e) =>
                setFlags((p) => ({
                  ...p,
                  exchangePossible: e.target.checked,
                }))
              }
              className="size-4 rounded accent-[#2563eb]"
            />
            <span>
              {isAr
                ? 'متاح البدل بعقار آخر (Exchange possible)'
                : 'Exchange possible'}
            </span>
          </label>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 text-xs font-extrabold text-[#0a1122]">
          <input
            type="checkbox"
            checked={flags.isExclusive}
            onChange={(e) =>
              setFlags((p) => ({
                ...p,
                isExclusive: e.target.checked,
              }))
            }
            className="size-4 rounded accent-[#ea580c]"
          />
          <Crown className="size-4 text-amber-500" />
          <span>
            {isAr ? 'حصري على المنصة (Exclusive)' : 'Exclusive on platform'}
          </span>
        </label>
      </div>

      {selected.discountOffer?.[0] === 'yes' && (
        <div className="mt-4">
          <MoneyField
            label={
              isAr
                ? 'قيمة الخصم المسموح به للتفاوض السريع (اختياري)'
                : 'Max Negotiable Discount Amount (Optional)'
            }
            value={form.discountAmount}
            currencySymbol={currencyChoice}
            update={(v) => update('discountAmount', v)}
          />
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
          <Sparkles className="size-5" />
        </div>
        <div className="text-start">
          <strong className="block text-xs font-black text-[#0a1122] sm:text-sm">
            {isAr
              ? `مرشد أسعار المنطقة (District price guide — ${getLocalizedGeorgiaAreaName(form.location, locale)})`
              : `District price guide — ${getLocalizedGeorgiaAreaName(form.location, locale)}`}
          </strong>
          <p className="mt-0.5 text-[11px] text-slate-600">
            {isAr
              ? 'متوسط سعر المتر السكني في هذه المنطقة يتراوح بين $1,150 و $1,650 / م² حسب حالة التشطيب والإطلالة.'
              : 'Average market range in this district is $1,150 – $1,650 / m² depending on condition and view.'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
            {isAr ? 'وصف العقار (Description)' : 'Description'}
          </label>
          <button
            type="button"
            onClick={onGenerateAiDescription}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3.5 py-1.5 text-xs font-extrabold text-[#2563eb] transition hover:bg-indigo-200"
          >
            <Sparkles className="size-3.5" />
            <span>
              {isAr
                ? 'كتابة الوصف بالذكاء الاصطناعي (AI description)'
                : 'AI description'}
            </span>
          </button>
        </div>
        <Textarea
          dir={dir}
          value={form.description}
          onChange={(e) => update('description', e.target.value.slice(0, 5000))}
          placeholder={
            isAr
              ? 'اشرح مميزات العقار، الإطلالة، القرب من الخدمات، أو اضغط على زر (AI description) لكتابته تلقائياً...'
              : 'Describe the property briefly — highlight the advantages...'
          }
          className="min-h-36 rounded-2xl border-slate-200 p-4 text-xs leading-relaxed sm:text-sm"
        />
        <div className="mt-1 text-end font-mono text-[11px] text-slate-400">
          {form.description.length}/5000
        </div>
      </div>
    </section>
  )
}

// =====================================================
// 6. الشريط الجانبي الثابت للمعاينة الحية وقوة الإعلان (LivePreviewSidebar)
// =====================================================
export function LivePreviewSidebar({
  images,
  livePreviewData,
  form,
  propertyKind,
  strength,
}: {
  images: string[]
  livePreviewData: { title: string; area: string; priceDisplay: string }
  form: Record<string, string>
  propertyKind: string
  strength: number
}) {
  const { locale } = useTranslation()
  const isAr = locale === 'ar'

  return (
    <aside className="space-y-4 lg:sticky lg:top-28 lg:col-span-4">
      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-black text-[#0a1122]">
          {isAr ? 'معاينة حية للإعلان (Live preview)' : 'Live preview'}
        </h3>
        <p className="text-[11px] text-slate-400">
          {isAr
            ? 'هكذا سيظهر إعلانك أمام المشترين والمستأجرين'
            : 'This is how buyers will see your listing'}
        </p>

        <div className="mt-3.5 overflow-hidden rounded-2xl border border-slate-100 bg-[#f8fafc]">
          {images.length > 0 ? (
            <div className="relative aspect-[4/3] w-full">
              <img
                src={images[0]}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-2.5 start-2.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-xs">
                1/{images.length}
              </span>
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center p-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#2563eb]">
                <ImagePlus className="size-5" />
              </div>
              <strong className="mt-3 text-xs font-extrabold text-[#0a1122]">
                {isAr
                  ? 'أضف صورة واحدة على الأقل'
                  : 'At least 1 photo is required'}
              </strong>
              <span className="mt-1 text-[11px] text-slate-400">
                {isAr
                  ? 'ارفع صورة ليظهر شكل إعلانك هنا مباشرة'
                  : 'Upload a photo — your listing preview appears here'}
              </span>
            </div>
          )}

          <div className="bg-white p-4 text-start">
            <strong
              dir="ltr"
              className="block text-lg font-black text-[#0a1122]"
            >
              {livePreviewData.priceDisplay}
            </strong>
            <p className="mt-1 line-clamp-2 text-xs font-extrabold text-slate-800">
              {livePreviewData.title}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="size-3 text-[#2563eb]" />
              <span>{livePreviewData.area}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 text-[11px] font-bold text-slate-500">
              {form.areaSize && <span>📐 {form.areaSize} m²</span>}
              {propertyKind !== 'Land' && form.bedrooms && (
                <span>🛏 {form.bedrooms} Beds</span>
              )}
              {propertyKind !== 'Land' && form.floor && (
                <span>
                  🏢 {form.floor}/{form.totalFloors || 12}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 text-start shadow-2xs">
        <div className="flex items-center justify-between">
          <strong className="text-xs font-black text-[#0a1122] sm:text-sm">
            {isAr ? 'قوة الإعلان (Listing strength)' : 'Listing strength'}
          </strong>
          <span className="font-mono text-xs font-black text-[#ea580c]">
            {strength}%
          </span>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#ea580c] transition-all duration-500"
            style={{ width: `${strength}%` }}
          />
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          {strength >= 80
            ? isAr
              ? 'إعلان ممتاز ومكتمل — جاهز للنشر وتصدر البحث!'
              : 'Great listing strength — ready for maximum visibility!'
            : isAr
              ? 'بداية جيدة — أضف المزيد من التفاصيل لرفع ترتيب إعلانك'
              : 'Good start — add more detail'}
        </p>

        <ul className="mt-3 space-y-1.5 text-[11px] font-bold">
          {images.length < 5 && (
            <li className="text-[#2563eb]">
              +25{' '}
              <span className="text-slate-700">
                {isAr
                  ? 'أضف 5 إلى 10 صور واضحة للعقار'
                  : 'Add 10 more photos'}
              </span>
            </li>
          )}
          {!form.exactStreet && (
            <li className="text-[#2563eb]">
              +15{' '}
              <span className="text-slate-700">
                {isAr
                  ? 'حدد الحي والشارع والمشروع'
                  : 'Pin the exact location and address'}
              </span>
            </li>
          )}
          {!form.areaSize && (
            <li className="text-[#2563eb]">
              +15{' '}
              <span className="text-slate-700">
                {isAr
                  ? 'أكمل المساحة وعدد الغرف والمميزات'
                  : 'Fill in the property details'}
              </span>
            </li>
          )}
          {form.description.length < 40 && (
            <li className="text-[#2563eb]">
              +15{' '}
              <span className="text-slate-700">
                {isAr
                  ? 'اكتب وصفاً كاملاً أو استخدم زر AI description'
                  : 'Write a fuller description'}
              </span>
            </li>
          )}
        </ul>
      </div>
    </aside>
    
  )
}