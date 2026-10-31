'use client'

import { useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  Bath,
  Bed,
  Box,
  Building,
  Building2,
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Droplets,
  Dumbbell,
  Eye,
  FileCheck2,
  FileText,
  Flame,
  Home,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  MapPin,
  Maximize2,
  Mountain,
  Play,
  Plus,
  Ruler,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Sun,
  Trash2,
  Trees,
  Tv,
  UploadCloud,
  Utensils,
  Video,
  Waves,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import {
  getSellerFormTranslations,
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
  getOptionLabel,
  getOptionSub,
  HEATING_TYPES,
  MoneyField,
  MonthYearSelector,
  PROPERTY_KINDS,
  SIVRCE_FEATURE_GROUPS,
  toEnglishDigits,
  years,
  type DealCategory,
  type LocalizedOptionItem,
} from './seller-shared'

export { LocationSection } from './seller-location-section'
export { LivePreviewSidebar } from './seller-preview-sidebar'

function getFeatureItemIcon(featureId: string) {
  const map: Record<string, any> = {
    Balcony: Sun,
    Loggia: Layers,
    Terrace: Trees,
    Yard: Trees,
    Storage: Box,
    Cellar: Layers,
    'Walk-in closet': Home,
    'Separate kitchen': Utensils,
    Elevator: ArrowUpDown,
    Parking: Car,
    'Underground parking': Car,
    Garage: Car,
    Security: ShieldCheck,
    Concierge: Building2,
    Intercom: Smartphone,
    'Backup generator': Zap,
    'Iron door': Lock,
    'Double glazing': Maximize2,
    Penthouse: Crown,
    'Step-free access': Check,
    'Underfloor heating': Flame,
    'Natural gas': Flame,
    'Hot water': Droplets,
    Internet: Wifi,
    'Cable TV': Tv,
    Furniture: Bed,
    Appliances: Zap,
    'Air conditioning': Snowflake,
    Dishwasher: Droplets,
    'Washing machine': Droplets,
    Dryer: Wind,
    Fireplace: Flame,
    Kitchen: Utensils,
    TV: Tv,
    'Panoramic view': Eye,
    'Sea view': Waves,
    'Mountain view': Mountain,
    'Yard view': Trees,
    'Street view': MapPin,
    Beachfront: Waves,
    Bright: Sun,
    Quiet: Wind,
    Pool: Waves,
    Jacuzzi: Bath,
    Sauna: Flame,
    Gym: Dumbbell,
    'BBQ grill': Flame,
    'EV charger': Zap,
    'Ski access': Mountain,
  }
  return map[featureId] || Sparkles
}

const DEAL_ICON_STYLES: Record<string, string> = {
  exit: 'bg-emerald-50 text-emerald-600',
  sale: 'bg-blue-50 text-[#2563eb]',
  rent_monthly: 'bg-purple-50 text-purple-600',
  rent_daily: 'bg-rose-50 text-rose-500',
}

const KIND_ICON_STYLES: Record<string, string> = {
  Apartment: 'bg-blue-50 text-[#2563eb]',
  'Private house': 'bg-orange-50 text-[#ea580c]',
  Cottage: 'bg-emerald-50 text-emerald-600',
  Land: 'bg-amber-50 text-amber-600',
  Commercial: 'bg-purple-50 text-purple-600',
  Hotel: 'bg-cyan-50 text-cyan-600',
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
// 1. قسم نوع الإعلان والعقار وحالة البناء بالتدرج (TypeSection)
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
  dealCategory: DealCategory | ''
  setDealCategory: (c: DealCategory | '') => void
  propertyKind: string
  setPropertyKind: (k: string) => void
  buildingStatus: string
  setBuildingStatus: (s: string) => void
  dynamicStatusOptions: Array<LocalizedOptionItem<string>>
}) {
  const { locale } = useTranslation()
  const fT = getSellerFormTranslations(locale)
  const tSec = fT.typeSection

  return (
    <section
      ref={sectionRef}
      onClick={onHover}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">{tSec.title}</h2>
      <p className="mt-1 text-xs text-slate-500">{tSec.subtitle}</p>

      <div className="mt-5">
        <label className="mb-2.5 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
          {tSec.whatToDoLabel}
        </label>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {DEAL_TYPES.map((d) => {
            const Icon = d.icon
            const active = dealCategory === d.id
            const softColor =
              DEAL_ICON_STYLES[d.id] || 'bg-slate-100 text-slate-600'

            return (
              <button
                key={d.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDealCategory(active ? '' : d.id)
                }}
                className={`relative flex min-h-[132px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                  active
                    ? 'border-2 border-[#2563eb] bg-blue-50/25 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 end-2.5 flex size-5 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-2xs">
                    <Check className="size-3 stroke-[3]" />
                  </span>
                )}
                <div
                  className={`flex size-10 items-center justify-center rounded-xl transition ${
                    active ? 'bg-[#2563eb] text-white' : softColor
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="mt-3">
                  <strong className="block text-xs font-black text-[#0a1122] sm:text-[13px]">
                    {getOptionLabel(d, locale)}
                  </strong>
                  <span className="mt-1 block text-[11px] leading-snug text-slate-400">
                    {getOptionSub(d, locale)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {Boolean(dealCategory) && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="mb-2.5 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
            {tSec.whatKindLabel}
          </label>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {PROPERTY_KINDS.map((k) => {
              const Icon = k.icon
              const active = propertyKind === k.id
              const softColor =
                KIND_ICON_STYLES[k.id] || 'bg-slate-100 text-slate-600'

              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPropertyKind(active ? '' : k.id)
                  }}
                  className={`relative flex min-h-[110px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                    active
                      ? 'border-2 border-[#2563eb] bg-blue-50/25 shadow-xs'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  {active && (
                    <span className="absolute top-2.5 end-2.5 flex size-5 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-2xs">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  )}
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl transition ${
                      active ? 'bg-[#2563eb] text-white' : softColor
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <strong className="mt-2.5 text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {getOptionLabel(k, locale)}
                  </strong>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {Boolean(dealCategory && propertyKind && propertyKind !== 'Land') && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="mb-2.5 block text-xs font-extrabold text-slate-500">
            {tSec.statusLabel}
          </label>
          <div
            className={`grid gap-3.5 ${
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setBuildingStatus(active ? '' : st.id)
                  }}
                  className={`relative flex min-h-[100px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                    active
                      ? 'border-2 border-[#2563eb] bg-blue-50/25 font-black text-[#0a1122] shadow-xs'
                      : 'border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`mb-2 flex size-9 items-center justify-center rounded-xl transition ${
                      active
                        ? 'bg-[#2563eb] text-white'
                        : 'bg-blue-50 text-[#2563eb]'
                    }`}
                  >
                    <Building className="size-4" />
                  </div>
                  <span className="text-xs">{getOptionLabel(st, locale)}</span>
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
  const fT = getSellerFormTranslations(locale)
  const pT = fT.photosSection

  const uploadFromPhoneLabel =
    locale === 'ar'
      ? 'رفع الصور من الموبايل'
      : locale === 'ru'
        ? 'Загрузить с телефона'
        : locale === 'ka'
          ? 'ტელეფონიდან ატვირთვა'
          : 'Upload from phone'

  const addPhotoCardLabel =
    locale === 'ar'
      ? 'إضافة صورة'
      : locale === 'ru'
        ? 'Добавить фото'
        : locale === 'ka'
          ? 'ფოტოს დამატება'
          : 'Add photo'

  return (
    <section
      ref={sectionRef}
      onClick={onHover}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">{pT.title}</h2>
      <p className="mt-1 text-xs text-slate-500">{pT.subtitle}</p>

      {images.length === 0 ? (
        <label className="mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-[#f8fafc] p-6 text-center transition hover:border-[#2563eb] hover:bg-blue-50/20">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
            <ImagePlus className="size-5" />
          </div>
          <p className="mt-1 text-sm font-black text-[#0a1122]">
            {pT.dropTitle}
          </p>
          <p className="text-xs font-bold text-slate-400">
            {images.length}/22 {pT.photosWord}
          </p>
          <p className="mt-1 max-w-md text-[11px] leading-relaxed text-slate-400">
            {pT.dropHint}
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => onUploadPhotos(e.target.files)}
          />
        </label>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
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
                <span className="absolute bottom-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-[#ea580c] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                  ★ {pT.coverBadge}
                </span>
              )}
              <button
                type="button"
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="absolute top-2.5 end-2.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}

          {images.length < 22 && (
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-[#f8fafc] p-4 text-center transition hover:border-[#2563eb] hover:bg-blue-50/20">
              <Plus className="size-5 text-slate-500" />
              <strong className="mt-1.5 text-xs font-extrabold text-slate-600">
                {addPhotoCardLabel}
              </strong>
              <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                {images.length}/22 {pT.photosWord}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => onUploadPhotos(e.target.files)}
              />
            </label>
          )}
        </div>
      )}

      <div className="mt-3.5">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-[#2563eb] shadow-2xs transition hover:bg-blue-50/40">
          <Smartphone className="size-3.5" />
          <span>{uploadFromPhoneLabel}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => onUploadPhotos(e.target.files)}
          />
        </label>
      </div>

      {uploading && (
        <div className="mt-3 flex items-center gap-2 text-xs font-extrabold text-[#2563eb]">
          <Loader2 className="size-4 animate-spin" />
          <span>{pT.uploading}</span>
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-xs font-black text-[#0a1122] sm:text-sm">
          {pT.videoSectionTitle}
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {pT.videoSectionSubtitle}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-[#f8fafc] p-5 text-center transition hover:border-[#2563eb]">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
              <Video className="size-4" />
            </div>
            <strong className="mt-2.5 text-xs font-extrabold text-[#0a1122]">
              {pT.uploadVideoBoxTitle}
            </strong>
            <span className="mt-0.5 text-[10px] text-slate-400">
              {pT.uploadVideoBoxSub}
            </span>
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => onUploadPhotos(e.target.files)}
            />
          </label>

          <div className="flex flex-col justify-center rounded-2xl border border-slate-200/80 bg-white p-4">
            <label className="mb-2 block text-[11px] font-extrabold text-slate-600">
              {pT.videoUrlLabel}
            </label>
            <div className="relative">
              <Play className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                dir="ltr"
                value={form.videoUrl}
                onChange={(e) => update('videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="h-11 rounded-xl border-slate-200 pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-extrabold text-slate-600">
            {pT.tour3dLabel}
          </label>
          <div className="relative">
            <Box className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              dir="ltr"
              value={form.tour3dUrl}
              onChange={(e) => update('tour3dUrl', e.target.value)}
              placeholder="https://my.matterport.com/..."
              className="h-11 rounded-xl border-slate-200 pl-10 text-xs"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// =====================================================
// 3. قسم المواصفات والمميزات بالتدرج الذكي (DetailsSection)
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
  dealCategory: DealCategory | ''
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
  const fT = getSellerFormTranslations(locale)
  const dT = fT.detailsSection

  const isUnlocked = Boolean(dealCategory && propertyKind)
  const isDirectSale = dealCategory === 'sale'

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
      onClick={onHover}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">{dT.title}</h2>
      <p className="mt-1 text-xs text-slate-500">{dT.subtitle}</p>

      {!isUnlocked ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-[#f8fafc] px-4 py-4 text-xs font-semibold text-slate-500">
          {dT.lockedBanner}
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          {propertyKind !== 'Land' && (
            <>
              <div className="mt-5">
                <label className="mb-2 block text-xs font-extrabold text-slate-700">
                  {dT.conditionLabel}
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
                        {getOptionLabel(c, locale)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  {dT.buildingSeriesLabel}
                </label>
                <p className="mb-2 text-[11px] text-slate-400">
                  {dT.buildingSeriesSub}
                </p>
                <div className="flex flex-wrap gap-2">
                  {BUILDING_SERIES.map((ser) => {
                    const active = selected.buildingSeries?.[0] === ser
                    return (
                      <button
                        key={ser}
                        type="button"
                        onClick={() => toggleSingle('buildingSeries', ser)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                          active
                            ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {ser}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-extrabold text-slate-700">
                    {dT.floorTypeLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FLOOR_TYPES.map((ft) => {
                      const active = selected.floorType?.[0] === ft.id
                      return (
                        <button
                          key={ft.id}
                          type="button"
                          onClick={() => toggleSingle('floorType', ft.id)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {getOptionLabel(ft, locale)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-slate-700">
                    {dT.heatingLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HEATING_TYPES.map((ht) => {
                      const active = selected.heatingType?.[0] === ht.id
                      return (
                        <button
                          key={ht.id}
                          type="button"
                          onClick={() => toggleSingle('heatingType', ht.id)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {getOptionLabel(ht, locale)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-slate-700">
                    {dT.buildingMaterialLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BUILDING_MATERIALS.map((bm) => {
                      const active = selected.buildingMaterial?.[0] === bm.id
                      return (
                        <button
                          key={bm.id}
                          type="button"
                          onClick={() =>
                            toggleSingle('buildingMaterial', bm.id)
                          }
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {getOptionLabel(bm, locale)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-5 space-y-4">
            {propertyKind !== 'Land' && (
              <div className="max-w-[200px]">
                <Field
                  label={dT.yearBuiltLabel}
                  id="yearBuilt"
                  type="number"
                  placeholder="2024"
                  value={form.yearBuilt}
                  update={(v) => update('yearBuilt', v)}
                />
              </div>
            )}

            <div className="max-w-sm">
              <label className="mb-2 block text-start text-xs font-extrabold text-[#0a1122]">
                {dT.areaLabel.replace(' *', '')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Ruler className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="74"
                  value={form.areaSize}
                  onChange={(e) =>
                    update(
                      'areaSize',
                      toEnglishDigits(e.target.value).replace(/[^0-9.]/g, '')
                    )
                  }
                  className="h-12 rounded-xl border-slate-200 pl-10 font-bold"
                />
              </div>
            </div>

            {propertyKind !== 'Land' && (
              <>
                <div className="max-w-sm">
                  <Field
                    label={dT.kitchenAreaLabel}
                    id="kitchenArea"
                    type="number"
                    placeholder="12"
                    value={form.kitchenArea}
                    update={(v) => update('kitchenArea', v)}
                  />
                </div>

                <div className="grid max-w-xl grid-cols-3 gap-3">
                  <Field
                    label={dT.balconyAreaLabel}
                    id="balconyArea"
                    type="number"
                    placeholder="0"
                    value={form.balconyArea}
                    update={(v) => update('balconyArea', v)}
                  />
                  <Field
                    label={dT.loggiaAreaLabel}
                    id="loggiaArea"
                    type="number"
                    placeholder="0"
                    value={form.loggiaArea}
                    update={(v) => update('loggiaArea', v)}
                  />
                  <Field
                    label={dT.terraceAreaLabel}
                    id="terraceArea"
                    type="number"
                    placeholder="0"
                    value={form.terraceArea}
                    update={(v) => {
                      update('terraceArea', v)
                      update('garden', v)
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {propertyKind !== 'Land' && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
                  {dT.bedroomsLabel.replace(' *', '')}{' '}
                  <span className="text-red-500">*</span>
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
                          onClick={() =>
                            update('bedrooms', active ? '' : cleanVal)
                          }
                          className={`flex size-9 items-center justify-center rounded-full border text-xs font-extrabold transition ${
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
                  {dT.roomsLabel.replace(' *', '')}{' '}
                  <span className="text-red-500">*</span>
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
                          onClick={() =>
                            update('rooms', active ? '' : cleanVal)
                          }
                          className={`flex size-9 items-center justify-center rounded-full border text-xs font-extrabold transition ${
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
                  {dT.bathroomsLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['1', '2', '3', '4', '5+'].map((num) => {
                    const cleanVal = num.replace('+', '')
                    const active = form.bathrooms === cleanVal
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          update('bathrooms', active ? '' : cleanVal)
                        }
                        className={`flex size-9 items-center justify-center rounded-full border text-xs font-extrabold transition ${
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-start text-xs font-extrabold text-[#0a1122]">
                    {dT.floorLabel}
                  </label>
                  <div className="relative">
                    <Layers className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="5"
                      value={form.floor}
                      onChange={(e) =>
                        update(
                          'floor',
                          toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                        )
                      }
                      className="h-12 rounded-xl border-slate-200 pl-10 font-bold"
                    />
                  </div>
                </div>

                <Field
                  label={dT.totalFloorsLabel}
                  id="totalFloors"
                  type="number"
                  placeholder="12"
                  value={form.totalFloors}
                  update={(v) => update('totalFloors', v)}
                />
              </div>

              {dealCategory === 'rent_daily' && (
                <div className="max-w-xs">
                  <Field
                    label={dT.maxGuestsLabel}
                    id="maxGuests"
                    type="number"
                    placeholder="2"
                    value={form.maxGuests}
                    update={(v) => update('maxGuests', v)}
                  />
                </div>
              )}

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
            <h3 className="text-sm font-black text-[#0a1122]">
              {dT.featuresTitle}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {dT.featuresSubtitle}
            </p>

            <div className="mt-4 divide-y divide-slate-100">
              {SIVRCE_FEATURE_GROUPS.map((grp) => {
                const isOpen = openFeatureGroups[grp.key] ?? true

                return (
                  <div key={grp.key} className="py-4 first:pt-2">
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
                      <strong className="text-xs font-extrabold text-slate-500">
                        {getOptionLabel(grp, locale)}
                      </strong>
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
                          const FeatIcon = getFeatureItemIcon(item.id)
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleMulti('features', item.id)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                                active
                                  ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                            >
                              <FeatIcon
                                className={`size-3.5 shrink-0 ${
                                  active ? 'text-white' : 'text-slate-400'
                                }`}
                              />
                              <span>{getOptionLabel(item, locale)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-3 space-y-2.5">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc]/60 p-4 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={flags.allowOnlineViewing}
                  onChange={(e) =>
                    setFlags((p) => ({
                      ...p,
                      allowOnlineViewing: e.target.checked,
                    }))
                  }
                  className="mt-0.5 size-4 rounded-full accent-[#2563eb]"
                />
                <div>
                  <strong className="block text-xs font-extrabold text-[#0a1122]">
                    {dT.onlineViewingTitle}
                  </strong>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {dT.onlineViewingSub}
                  </span>
                </div>
              </label>

              {isDirectSale && (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc]/60 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={flags.installmentSalePossible}
                    onChange={(e) =>
                      setFlags((p) => ({
                        ...p,
                        installmentSalePossible: e.target.checked,
                      }))
                    }
                    className="mt-0.5 size-4 rounded-full accent-[#2563eb]"
                  />
                  <div>
                    <strong className="block text-xs font-extrabold text-[#0a1122]">
                      {dT.installmentSaleTitle}
                    </strong>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {dT.installmentSaleSub}
                    </span>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// =====================================================
// 4. قسم السعر والوصف والمستندات (PricingSection)
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
  dealCategory: DealCategory | ''
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
  const fT = getSellerFormTranslations(locale)
  const prT = fT.pricingSection
  const currSym =
    currencyChoice === 'GEL' ? '₾' : currencyChoice === 'EUR' ? '€' : '$'

  return (
    <section
      ref={sectionRef}
      onClick={onHover}
      onMouseEnter={onHover}
      className="scroll-mt-32 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-7"
    >
      <h2 className="text-lg font-black text-[#0a1122]">{prT.title}</h2>
      <p className="mt-1 text-xs text-slate-500">{prT.subtitle}</p>

      <div className="mt-5">
        <span className="mb-2 block text-xs font-extrabold text-[#0a1122]">
          {prT.priceLabel.replace(' *', '')}{' '}
          <span className="text-red-500">*</span>
        </span>

        <div className="flex flex-wrap items-center gap-3">
          {!isRentDeal && !isExitDeal && (
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
                {prT.totalPriceBtn}
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
                {prT.perSqmBtn}
              </button>
            </div>
          )}

          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            {(
              [
                { code: 'GEL', sym: '₾' },
                { code: 'USD', sym: '$' },
                { code: 'EUR', sym: '€' },
              ] as const
            ).map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrencyChoice(c.code)}
                className={`flex size-7 items-center justify-center rounded-full text-xs font-black transition ${
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
      </div>

      {isExitDeal ? (
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MoneyField
              label={prT.contractPriceLabel}
              value={form.contractPrice}
              currencySymbol={currSym}
              update={(v) => update('contractPrice', v)}
            />
            <MoneyField
              label={prT.paidAmountLabel}
              value={form.paidAmount}
              currencySymbol={currSym}
              update={(v) => update('paidAmount', v)}
            />
            <MoneyField
              label={prT.marketPriceLabel}
              value={form.marketPrice}
              currencySymbol={currSym}
              update={(v) => update('marketPrice', v)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MoneyField
              label={prT.installmentAmountLabel}
              value={form.installment}
              currencySymbol={currSym}
              update={(v) => update('installment', v)}
            />
            <Field
              label={prT.remainingMonthsLabel}
              id="remainingMonths"
              type="number"
              placeholder="24"
              value={form.remainingMonths}
              update={(v) => update('remainingMonths', v)}
            />
            <MonthYearSelector
              label={prT.contractDateLabel}
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
                  {prT.docsBoxTitle}
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
                  { key: 'contract', title: prT.docContract },
                  { key: 'receipts', title: prT.docReceipts },
                  { key: 'statement', title: prT.docStatement },
                  { key: 'passport', title: prT.docPassport },
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
                        <span>{hasDoc ? prT.changeBtn : prT.uploadBtn}</span>
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
      ) : isRentDeal ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MoneyField
            label=""
            value={form.rentPrice}
            currencySymbol={currSym}
            update={(v) => update('rentPrice', v)}
          />
          <div className="flex flex-col justify-center space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/80 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.discountOffer?.[0] === 'yes'}
                onChange={(e) =>
                  toggleSingle('discountOffer', e.target.checked ? 'yes' : 'no')
                }
                className="size-4 rounded-full accent-[#2563eb]"
              />
              <span>{prT.negotiableLabel}</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {priceInputMode === 'total' ? (
            <MoneyField
              label=""
              value={form.contractPrice}
              currencySymbol={currSym}
              update={(v) => {
                update('contractPrice', v)
                update('paidAmount', v)
              }}
            />
          ) : (
            <MoneyField
              label=""
              value={form.pricePerSqm}
              currencySymbol={currSym}
              update={(v) => update('pricePerSqm', v)}
            />
          )}

          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/80 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.discountOffer?.[0] === 'yes'}
                onChange={(e) =>
                  toggleSingle('discountOffer', e.target.checked ? 'yes' : 'no')
                }
                className="size-4 rounded-full accent-[#2563eb]"
              />
              <span>{prT.negotiableLabel}</span>
            </label>

            {Boolean(dealCategory === 'sale') && (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/80 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={flags.exchangePossible}
                  onChange={(e) =>
                    setFlags((p) => ({
                      ...p,
                      exchangePossible: e.target.checked,
                    }))
                  }
                  className="size-4 rounded-full accent-[#2563eb]"
                />
                <span>{prT.exchangePossibleLabel}</span>
              </label>
            )}
          </div>
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/80 bg-[#f8fafc]/70 p-4 text-start transition hover:bg-slate-50">
        <input
          type="checkbox"
          checked={flags.isExclusive}
          onChange={(e) =>
            setFlags((p) => ({
              ...p,
              isExclusive: e.target.checked,
            }))
          }
          className="size-4 rounded-full accent-[#2563eb]"
        />
        <Crown className="size-4 text-slate-400" />
        <div>
          <strong className="block text-xs font-extrabold text-[#0a1122]">
            {prT.exclusiveTitle}
          </strong>
          <span className="text-[11px] text-slate-400">{prT.exclusiveSub}</span>
        </div>
      </label>

      {selected.discountOffer?.[0] === 'yes' && isExitDeal && (
        <div className="mt-4">
          <MoneyField
            label={prT.discountAmountLabel}
            value={form.discountAmount}
            currencySymbol={currSym}
            update={(v) => update('discountAmount', v)}
          />
        </div>
      )}

      {(Boolean(dealCategory) || Boolean(form.location)) && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white">
            <Sparkles className="size-4" />
          </div>
          <div className="text-start">
            <strong className="block text-xs font-black text-[#0a1122]">
              {prT.districtGuideTitle}
              {form.location
                ? ` · ${form.locationDisplay || getLocalizedGeorgiaAreaName(form.location, locale)}`
                : ''}
            </strong>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {prT.districtGuideSub}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
            {prT.descriptionLabel}
          </label>
          <button
            type="button"
            onClick={onGenerateAiDescription}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-extrabold text-[#2563eb] transition hover:bg-indigo-200"
          >
            <Sparkles className="size-3.5" />
            <span>{prT.aiDescriptionBtn}</span>
          </button>
        </div>
        <Textarea
          dir={dir}
          value={form.description}
          onChange={(e) => update('description', e.target.value.slice(0, 5000))}
          placeholder={prT.descriptionPlaceholder}
          className="min-h-36 rounded-2xl border-slate-200 p-4 text-xs leading-relaxed sm:text-sm"
        />
        <div className="mt-1 text-end font-mono text-[11px] text-slate-400">
          {form.description.length}/5000
        </div>
      </div>
    </section>
  )
}