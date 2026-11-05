'use client'

import { Compass } from 'lucide-react'
import {
  CONDITION_OPTIONS,
  getOptionLabel,
  toEnglishDigits,
} from '@/components/features/seller/seller-shared'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

export type SearchFiltersState = {
  q: string
  propertyType: string
  location: string
  locationDisplay: string
  minPrice: string
  maxPrice: string
  rooms: string
  minArea: string
  maxArea: string
  commuteDest: string
  commuteMode: 'car' | 'walk' | 'bike'
  commuteMinutes: '10' | '20' | '30'
  vipTier: string
  bathrooms: string
  minFloor: string
  maxFloor: string
  condition: string
  buildingStatus: string
  buildingSeries: string
  floorType: string
  heating: string
  quickTag: string
}

const POPOVER_I18N: Record<
  LocaleCode,
  {
    minCashPlaceholder: string
    maxCashPlaceholder: string
    minWord: string
    maxWord: string
    sqmUnit: string
    commutePlaceholder: string
    useMyLocationBtn: string
    modeCar: string
    modeWalk: string
    modeBike: string
    minSuffix: string
    applyBtn: string
    boostStatusLabel: string
    bathroomsLabel: string
    floorLabel: string
    conditionLabel: string
  }
> = {
  ar: {
    minCashPlaceholder: 'أدنى كاش مطلوب ($)',
    maxCashPlaceholder: 'أقصى كاش مطلوب ($)',
    minWord: 'الأدنى',
    maxWord: 'الأقصى',
    sqmUnit: 'م²',
    commutePlaceholder: 'الوجهة — العمل، الجامعة، أو محطة المترو...',
    useMyLocationBtn: 'استخدم موقعي الحالي',
    modeCar: 'سيارة',
    modeWalk: 'مشياً',
    modeBike: 'دراجة',
    minSuffix: 'د',
    applyBtn: 'تطبيق',
    boostStatusLabel: 'الباقة الإعلانية',
    bathroomsLabel: 'الحمامات',
    floorLabel: 'الطابق',
    conditionLabel: 'حالة التشطيب',
  },
  en: {
    minCashPlaceholder: 'Min Required Cash ($)',
    maxCashPlaceholder: 'Max Required Cash ($)',
    minWord: 'Min',
    maxWord: 'Max',
    sqmUnit: 'm²',
    commutePlaceholder: 'Destination — work, university, metro station...',
    useMyLocationBtn: 'Use my location',
    modeCar: 'Car',
    modeWalk: 'Walking',
    modeBike: 'Bicycle',
    minSuffix: 'min',
    applyBtn: 'Apply',
    boostStatusLabel: 'Boost status',
    bathroomsLabel: 'Bathrooms',
    floorLabel: 'Floor',
    conditionLabel: 'Finishing Condition',
  },
  ru: {
    minCashPlaceholder: 'Мин. сумма на руки ($)',
    maxCashPlaceholder: 'Макс. сумма на руки ($)',
    minWord: 'От',
    maxWord: 'До',
    sqmUnit: 'м²',
    commutePlaceholder: 'Пункт назначения — работа, ВУЗ, станция метро...',
    useMyLocationBtn: 'Моя геолокация',
    modeCar: 'Авто',
    modeWalk: 'Пешком',
    modeBike: 'Велосипед',
    minSuffix: 'мин',
    applyBtn: 'Применить',
    boostStatusLabel: 'Статус продвижения',
    bathroomsLabel: 'Санузлы',
    floorLabel: 'Этаж',
    conditionLabel: 'Состояние ремонта',
  },
  ka: {
    minCashPlaceholder: 'მინ. საჭირო თანხა ($)',
    maxCashPlaceholder: 'მაქს. საჭირო თანხა ($)',
    minWord: 'მინ.',
    maxWord: 'მაქს.',
    sqmUnit: 'მ²',
    commutePlaceholder: 'დანიშნულების ადგილი — სამსახური, უნივერსიტეტი, მეტრო...',
    useMyLocationBtn: 'ჩემი მდებარეობა',
    modeCar: 'მანქანით',
    modeWalk: 'ფეხით',
    modeBike: 'ველოსიპედით',
    minSuffix: 'წთ',
    applyBtn: 'გამოყენება',
    boostStatusLabel: 'VIP სტატუსი',
    bathroomsLabel: 'სველი წერტილები',
    floorLabel: 'სართული',
    conditionLabel: 'მდგომარეობა / რემონტი',
  },
}

export function PriceFilterPanel({
  filters,
  updateFilter,
  maxCash,
  setMaxCash,
  maxInstallment,
  setMaxInstallment,
  maxContractPrice,
  setMaxContractPrice,
  tFilters,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  maxCash: string
  setMaxCash: (v: string) => void
  maxInstallment: string
  setMaxInstallment: (v: string) => void
  maxContractPrice: string
  setMaxContractPrice: (v: string) => void
  tFilters: Record<string, any>
  isAr?: boolean
}) {
  const { locale } = useTranslation()
  const pT = POPOVER_I18N[locale] || POPOVER_I18N.ar

  return (
    <div className="mt-3 space-y-4 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2.5">
          <input
            type="number"
            dir="ltr"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            placeholder={tFilters.minCashPlaceholder || pT.minCashPlaceholder}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
          />
          <span className="font-bold text-slate-300">—</span>
          <input
            type="number"
            dir="ltr"
            value={filters.maxPrice}
            onChange={(e) => {
              updateFilter('maxPrice', e.target.value)
              setMaxCash(e.target.value)
            }}
            placeholder={tFilters.maxCashPlaceholder || pT.maxCashPlaceholder}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
          />
        </div>
        <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#2563eb] px-4 text-xs font-bold text-white shadow-2xs">
          USD ($)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-slate-200/70 pt-3.5 sm:grid-cols-3">
        <div className="text-start">
          <label className="mb-1 block text-[11px] font-bold text-[#0f1d40]">
            {tFilters.maxCashLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={maxCash}
              onChange={(e) =>
                setMaxCash(
                  toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                )
              }
              placeholder="0"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-left text-xs font-bold text-[#0f1d40] focus:border-[#007a5a] focus:outline-none"
            />
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
          </div>
        </div>

        <div className="text-start">
          <label className="mb-1 block text-[11px] font-bold text-[#0f1d40]">
            {tFilters.maxInstLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={maxInstallment}
              onChange={(e) =>
                setMaxInstallment(
                  toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                )
              }
              placeholder="0"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-left text-xs font-bold text-[#0f1d40] focus:border-[#007a5a] focus:outline-none"
            />
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
          </div>
        </div>

        <div className="text-start">
          <label className="mb-1 block text-[11px] font-bold text-[#0f1d40]">
            {tFilters.maxContractPriceLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={maxContractPrice}
              onChange={(e) =>
                setMaxContractPrice(
                  toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                )
              }
              placeholder="0"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-left text-xs font-bold text-[#0f1d40] focus:border-[#007a5a] focus:outline-none"
            />
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RoomsFilterPanel({
  filters,
  updateFilter,
  setMinRoomsIdx,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  setMinRoomsIdx: (idx: number) => void
}) {
  return (
    <div className="mt-3 flex justify-center rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex flex-wrap items-center gap-2.5">
        {['1', '2', '3', '4', '+5'].map((num, idx) => {
          const cleanVal = num.replace('+', '')
          const active = filters.rooms === cleanVal
          return (
            <button
              key={num}
              type="button"
              onClick={() => {
                const nextVal = active ? '' : cleanVal
                updateFilter('rooms', nextVal)
                setMinRoomsIdx(nextVal ? idx + 1 : 0)
              }}
              className={`flex size-10 items-center justify-center rounded-full border text-xs font-bold transition ${
                active
                  ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                  : 'border-slate-200 bg-white text-[#0f1d40] hover:border-slate-300'
              }`}
            >
              {num}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AreaFilterPanel({
  filters,
  updateFilter,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  isAr?: boolean
}) {
  const { locale } = useTranslation()
  const pT = POPOVER_I18N[locale] || POPOVER_I18N.ar

  return (
    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2.5">
        <input
          type="number"
          dir="ltr"
          value={filters.minArea}
          onChange={(e) => updateFilter('minArea', e.target.value)}
          placeholder={pT.minWord}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
        />
        <span className="font-bold text-slate-300">—</span>
        <input
          type="number"
          dir="ltr"
          value={filters.maxArea}
          onChange={(e) => updateFilter('maxArea', e.target.value)}
          placeholder={pT.maxWord}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
        />
        <span className="shrink-0 px-2 text-xs font-bold text-slate-400">
          {pT.sqmUnit}
        </span>
      </div>
    </div>
  )
}

export function CommuteFilterPanel({
  filters,
  updateFilter,
  onClose,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  onClose: () => void
  isAr?: boolean
}) {
  const { locale } = useTranslation()
  const pT = POPOVER_I18N[locale] || POPOVER_I18N.ar

  const handleDetectMyLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition((pos) => {
      updateFilter(
        'commuteDest',
        `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
      )
    })
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="mx-auto max-w-3xl space-y-3">
        <input
          type="text"
          value={filters.commuteDest}
          onChange={(e) => updateFilter('commuteDest', e.target.value)}
          placeholder={pT.commutePlaceholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
        />

        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleDetectMyLocation}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            <Compass className="size-3.5 text-[#2563eb]" />
            <span>{pT.useMyLocationBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-200/60 p-1">
          {(
            [
              { id: 'car', label: pT.modeCar },
              { id: 'walk', label: pT.modeWalk },
              { id: 'bike', label: pT.modeBike },
            ] as const
          ).map((mode) => {
            const active = filters.commuteMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => updateFilter('commuteMode', mode.id)}
                className={`rounded-xl py-2.5 text-xs font-bold transition ${
                  active
                    ? 'bg-[#0f1d40] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0f1d40]'
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {(['10', '20', '30'] as const).map((mins) => {
            const active = filters.commuteMinutes === mins
            return (
              <button
                key={mins}
                type="button"
                onClick={() => updateFilter('commuteMinutes', mins)}
                className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                  active
                    ? 'border-[#2563eb] bg-blue-50/80 text-[#2563eb]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mins} {pT.minSuffix}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-xl bg-[#2563eb] text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 sm:text-sm"
        >
          {pT.applyBtn}
        </button>
      </div>
    </div>
  )
}

export function MoreFiltersMegaPanel({
  filters,
  updateFilter,
  selectedTypes,
  toggleType,
  localizedTypes,
  deliveryStatusIdx,
  setDeliveryStatusIdx,
  deliveryYearIdx,
  setDeliveryYearIdx,
  contractYearIdx,
  setContractYearIdx,
  tFilters,
  onClearAll,
  onClose,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  selectedTypes: string[]
  toggleType: (tp: string) => void
  localizedTypes: string[]
  deliveryStatusIdx: number
  setDeliveryStatusIdx: (idx: number) => void
  deliveryYearIdx: number
  setDeliveryYearIdx: (idx: number) => void
  contractYearIdx: number
  setContractYearIdx: (idx: number) => void
  tFilters: Record<string, any>
  onClearAll: () => void
  onClose: () => void
  isAr?: boolean
}) {
  const { locale } = useTranslation()
  const pT = POPOVER_I18N[locale] || POPOVER_I18N.ar

  const pillClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
      active
        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
    }`

  return (
    <div className="mt-3 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-5 text-start shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 sm:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <span className="mb-2 block text-xs font-bold text-slate-400">
            {pT.boostStatusLabel}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['SUPER VIP', '+VIP'].map((tier) => {
              const active = filters.vipTier === tier
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => updateFilter('vipTier', active ? '' : tier)}
                  className={pillClass(active)}
                >
                  {tier}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-bold text-slate-400">
            {pT.bathroomsLabel}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['+1', '+2', '+3', '+4'].map((b) => {
              const clean = b.replace('+', '')
              const active = filters.bathrooms === clean
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => updateFilter('bathrooms', active ? '' : clean)}
                  className={`flex size-9 items-center justify-center rounded-full border text-xs font-bold transition ${
                    active
                      ? 'border-[#2563eb] bg-[#2563eb] text-white'
                      : 'border-slate-200 bg-slate-50 text-[#0f1d40]'
                  }`}
                >
                  {b}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-bold text-slate-400">
            {pT.floorLabel}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              dir="ltr"
              value={filters.minFloor}
              onChange={(e) => updateFilter('minFloor', e.target.value)}
              placeholder={pT.minWord}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:bg-white focus:outline-none"
            />
            <span className="text-slate-300">—</span>
            <input
              type="number"
              dir="ltr"
              value={filters.maxFloor}
              onChange={(e) => updateFilter('maxFloor', e.target.value)}
              placeholder={pT.maxWord}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <span className="mb-2 block text-xs font-bold text-slate-400">
          {tFilters.unitTypeLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {localizedTypes.map((type) => {
            const active = selectedTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={pillClass(active)}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
        <div>
          <span className="mb-2 block text-xs font-bold text-slate-400">
            {tFilters.deliveryLabel}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tFilters.deliveryStatuses.map((status: string, idx: number) => (
              <button
                key={status}
                type="button"
                onClick={() => setDeliveryStatusIdx(idx)}
                className={pillClass(deliveryStatusIdx === idx)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-bold text-slate-400">
            {tFilters.deliveryYearLabel}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tFilters.deliveryYears.map((yr: string, idx: number) => (
              <button
                key={yr}
                type="button"
                onClick={() => setDeliveryYearIdx(idx)}
                className={pillClass(deliveryYearIdx === idx)}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-bold text-slate-400">
            {tFilters.contractYearLabel}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tFilters.contractYears.map((yr: string, idx: number) => (
              <button
                key={yr}
                type="button"
                onClick={() => setContractYearIdx(idx)}
                className={pillClass(contractYearIdx === idx)}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <span className="mb-2 block text-xs font-bold text-slate-400">
          {pT.conditionLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((c) => {
            const active = filters.condition === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => updateFilter('condition', active ? '' : c.id)}
                className={pillClass(active)}
              >
                {getOptionLabel(c, locale)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#007a5a] px-6 py-2 text-xs font-bold text-white transition hover:bg-[#006248]"
          >
            {tFilters.showResultsBtn}
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-slate-500 hover:text-[#0f1d40]"
          >
            {tFilters.clearAllBtn}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-slate-700"
        >
          {tFilters.hideBtn}
        </button>
      </div>
    </div>
  )
}