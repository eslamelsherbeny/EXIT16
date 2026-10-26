'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Compass,
  Heart,
  ListFilter,
  Loader2,
  MapPin,
  Radar,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react'
import { updateBuyerPreferencesAction } from '@/actions/account-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  getLocalizedUnitTypes,
  toEnglishDigits,
} from '@/components/features/seller/seller-shared'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { AccountActionLinks } from './delete-account-modal'
import type { SellerUnitItem } from './seller-dashboard'
import { getCurrencySymbol, useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  calculateSmartMatch,
  evaluateGeorgiaAreaProximity,
  isNonGeorgianLegacyArea,
} from '@/lib/smart-matcher'

export type BuyerRequestItem = {
  id: string
  available_cash: number | null
  max_installment: number | null
  payment_plan: string | null
  budget: number | null
  unit_types: string[] | null
  min_rooms: number | null
  delivery_status: string | null
  preferred_areas: string[] | null
  status: string | null
  notify_exact_match?: boolean | null
  notify_featured?: boolean | null
}

const FAVORITES_STORAGE_KEY = 'darak_favorites'
const PREFERRED_PAGE_SIZE = 18
const NEARBY_AREAS_PREVIEW_SIZE = 6

function getBuyerExtraLabels(locale: LocaleCode) {
  if (locale === 'en') {
    return {
      submitOfferBtn: 'Submit Offer',
      detailsBtn: 'Details',
      specsSummaryLabel: 'Target Specs',
      remainingLabel: 'Remaining',
      installmentShort: 'Installment',
      negotiableTag: 'Negotiable',
      sqmUnit: 'm²',
      roomsWord: 'Rooms',
    }
  }
  if (locale === 'ru') {
    return {
      submitOfferBtn: 'Предложить цену',
      detailsBtn: 'Подробнее',
      specsSummaryLabel: 'Параметры',
      remainingLabel: 'Остаток',
      installmentShort: 'Взнос',
      negotiableTag: 'Торг',
      sqmUnit: 'м²',
      roomsWord: 'комн.',
    }
  }
  if (locale === 'ka') {
    return {
      submitOfferBtn: 'შეთავაზების გაგზავნა',
      detailsBtn: 'დეტალები',
      specsSummaryLabel: 'პარამეტრები',
      remainingLabel: 'დარჩენილი',
      installmentShort: 'განვადება',
      negotiableTag: 'შეთანხმებით',
      sqmUnit: 'მ²',
      roomsWord: 'ოთახი',
    }
  }
  return {
    submitOfferBtn: 'تقديم عرض شراء',
    detailsBtn: 'التفاصيل',
    specsSummaryLabel: 'المواصفات المطلوبة',
    remainingLabel: 'المتبقي للمطور',
    installmentShort: 'القسط الشهري',
    negotiableTag: 'قابل للتفاوض',
    sqmUnit: 'م²',
    roomsWord: 'غرف',
  }
}

function calcMonthlyInstallment(amount: number, freq: string | null) {
  if (!amount) return 0
  const f = (freq || '').trim()
  if (f.includes('ربع') || f.toLowerCase().includes('quarter'))
    return Math.round(amount / 3)
  if (
    f.includes('نصف') ||
    f.includes('نص') ||
    f.toLowerCase().includes('semi')
  )
    return Math.round(amount / 6)
  if (
    (f.includes('سنوي') && !f.includes('نصف') && !f.includes('ربع')) ||
    f.toLowerCase().includes('annual')
  )
    return Math.round(amount / 12)
  return amount
}

function extractCleanGeorgiaAreas(
  areas: string[] | null | undefined,
  fallbackAreaId: string
): string[] {
  if (!Array.isArray(areas) || areas.length === 0) return [fallbackAreaId]
  const cleaned = areas
    .map((a: string) => {
      if (a.includes(' - ') && a.includes('🎯')) {
        const parts = a.split(' - ')
        return parts[parts.length - 1].trim()
      }
      return a
        .replace(/🎯/g, '')
        .replace(/\(U-[^)]+\)/gi, '')
        .trim()
    })
    .filter((a) => Boolean(a) && !isNonGeorgianLegacyArea(a))

  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [fallbackAreaId]
}

export function BuyerDashboard({
  buyReq,
  marketUnits,
  offersCount = 0,
  deletionRequested = false,
}: {
  userName?: string
  buyReq: BuyerRequestItem | null
  marketUnits: SellerUnitItem[]
  offersCount?: number
  deletionRequested?: boolean
}) {
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const t = dict.accountComponents.buyer as Record<string, any>
  const oppFilters =
    (dict.opportunitiesPage?.filters as Record<string, any>) || {}
  const extraLabels = useMemo(() => getBuyerExtraLabels(locale), [locale])
  const currency = getCurrencySymbol('GE', locale)
  const listSep = dir === 'rtl' ? '، ' : ', '

  const localizedUnitTypes = useMemo(
    () => getLocalizedUnitTypes(dict, locale),
    [dict, locale]
  )

  const georgiaQuickAreas = useMemo(
    () => GEORGIA_CITIES_AND_DISTRICTS.slice(0, 10),
    []
  )

  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [visibleCount, setVisibleCount] = useState(PREFERRED_PAGE_SIZE)
  const [showAllNearbyAreas, setShowAllNearbyAreas] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setFavoriteIds(parsed.map(String))
      }
    } catch {}
  }, [])

  const toggleFavorite = (unitId: string) => {
    setFavoriteIds((prev) => {
      const idStr = String(unitId)
      const next = prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr]
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
        window.dispatchEvent(new Event('favorites-updated'))
      } catch {}
      return next
    })
  }

  const [bCash, setBCash] = useState<number>(
    Number(buyReq?.available_cash || buyReq?.budget || 35000)
  )
  const [bInstallment, setBInstallment] = useState<number>(
    Number(buyReq?.max_installment || 1200)
  )
  const [bPlan, setBPlan] = useState<string>(
    buyReq?.payment_plan || t.paymentPlans[0]
  )
  const [bBudget, setBBudget] = useState<number>(
    Number(buyReq?.budget || 85000)
  )
  const [bTypes, setBTypes] = useState<string[]>(
    Array.isArray(buyReq?.unit_types) && buyReq.unit_types.length > 0
      ? buyReq.unit_types
      : [localizedUnitTypes[0] || 'Apartment']
  )
  const [bRooms, setBRooms] = useState<number>(Number(buyReq?.min_rooms || 1))
  const [bDelivery, setBDelivery] = useState<string>(
    buyReq?.delivery_status || t.deliveryPreferences[0]
  )
  const [bAreas, setBAreas] = useState<string[]>(() =>
    extractCleanGeorgiaAreas(
      buyReq?.preferred_areas,
      GEORGIA_CITIES_AND_DISTRICTS[0].id
    )
  )
  const [notifyExact] = useState<boolean>(buyReq?.notify_exact_match ?? true)
  const [notifyFeatured] = useState<boolean>(buyReq?.notify_featured ?? true)

  const [activePills, setActivePills] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [onlyNegotiable, setOnlyNegotiable] = useState(false)
  const [sortBy, setSortBy] = useState(t.sorts[0])

  const [areaFilter, setAreaFilter] = useState('')
  const [maxCashFilter, setMaxCashFilter] = useState('')
  const [maxInstFilter, setMaxInstFilter] = useState('')
  const [maxContractFilter, setMaxContractFilter] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [delStatusFilter, setDelStatusFilter] = useState(t.deliveryStatuses[0])
  const [delYearFilter, setDelYearFilter] = useState(t.deliveryYears[0])
  const [conYearFilter, setConYearFilter] = useState(t.contractYears[0])
  const [minRoomsFilter, setMinRoomsFilter] = useState(t.roomOptions[0])

  useEffect(() => {
    setDelStatusFilter(t.deliveryStatuses[0])
    setDelYearFilter(t.deliveryYears[0])
    setConYearFilter(t.contractYears[0])
    setMinRoomsFilter(t.roomOptions[0])
    setSortBy(t.sorts[0])
  }, [locale, t])

  useEffect(() => {
    setVisibleCount(PREFERRED_PAGE_SIZE)
    setShowAllNearbyAreas(false)
  }, [
    searchQuery,
    areaFilter,
    onlyNegotiable,
    selectedTypes,
    delStatusFilter,
    delYearFilter,
    conYearFilter,
    minRoomsFilter,
    maxCashFilter,
    maxInstFilter,
    maxContractFilter,
    activePills,
    sortBy,
  ])

  const togglePopularArea = (areaId: string) => {
    setBAreas((prev) =>
      prev.includes(areaId)
        ? prev.length > 1
          ? prev.filter((x) => x !== areaId)
          : prev
        : [...prev, areaId]
    )
  }

  const togglePill = (pill: string) => {
    setActivePills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill]
    )
  }

  const toggleFilterType = (tp: string) => {
    setSelectedTypes((prev) =>
      prev.includes(tp) ? prev.filter((item) => item !== tp) : [...prev, tp]
    )
  }

  const clearAllFilters = () => {
    setActivePills([])
    setSearchQuery('')
    setOnlyNegotiable(false)
    setAreaFilter('')
    setMaxCashFilter('')
    setMaxInstFilter('')
    setMaxContractFilter('')
    setSelectedTypes([])
    setDelStatusFilter(t.deliveryStatuses[0])
    setDelYearFilter(t.deliveryYears[0])
    setConYearFilter(t.contractYears[0])
    setMinRoomsFilter(t.roomOptions[0])
  }

  const mappedUnits = useMemo(() => {
    const buyerMaxMonthly = calcMonthlyInstallment(bInstallment, bPlan)

    const virtualBuyer: BuyerRequestItem = {
      id: buyReq?.id || 'current',
      available_cash: bCash,
      max_installment: bInstallment,
      payment_plan: bPlan,
      budget: bBudget,
      unit_types: bTypes,
      min_rooms: bRooms,
      delivery_status: bDelivery,
      preferred_areas: bAreas,
      status: 'active',
    }

    return marketUnits
      .filter((u) => !isNonGeorgianLegacyArea(u.area))
      .map((u) => {
        const meta =
          u.documents && typeof u.documents === 'object'
            ? u.documents.__unit_meta || {}
            : {}

        const paid = Number(u.paid_amount) || 0
        const contract = Number(u.contract_price) || paid
        const remaining = Math.max(0, contract - paid)
        const market = Number(u.market_price) || contract
        const commission = Math.round(market * 0.0125)
        const gainVal = Math.max(0, market - contract - commission)
        const unitMonthly = calcMonthlyInstallment(
          Number(u.installment_amount ?? meta.installment_amount) || 0,
          u.installment_frequency || meta.installment_frequency
        )

        const rawDel = String(u.delivery_status || meta.delivery_status || '')
        const isReady =
          rawDel.includes('جاهز') ||
          rawDel.includes('فوري') ||
          rawDel.toLowerCase().includes('ready') ||
          rawDel.includes(t.deliveryStatuses[1])
        const deliveryStatus = isReady
          ? t.deliveryStatuses[1]
          : t.deliveryStatuses[2]
        const yearMatch = rawDel.match(/20\d{2}/)
        const deliveryYear = yearMatch ? Number(yearMatch[0]) : 2027

        const rawAreaId =
          u.area || meta.area || GEORGIA_CITIES_AND_DISTRICTS[0].id
        const localizedArea = getLocalizedGeorgiaAreaName(rawAreaId, locale)
        const unitType =
          u.unit_type || meta.unit_type || localizedUnitTypes[0] || 'Apartment'
        const unitCurrency = getCurrencySymbol('GE', locale)

        const numericCode = String(u.id || '')
          .replace(/\D/g, '')
          .slice(0, 5)
        const fallbackCode = String(u.id || '')
          .slice(0, 5)
          .toUpperCase()
        const code = `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

        const geoEval = evaluateGeorgiaAreaProximity(rawAreaId, bAreas)
        const smartRes = calculateSmartMatch(
          u,
          virtualBuyer,
          undefined,
          locale
        )

        const isExactAreaMatch = geoEval.relation === 'exact'
        const isNearbyInSameCity =
          geoEval.relation === 'nearby' || geoEval.relation === 'same_city'

        const isCashMatch = bCash === 0 || paid <= bCash * 1.15
        const isInstMatch =
          buyerMaxMonthly === 0 ||
          unitMonthly === 0 ||
          unitMonthly <= buyerMaxMonthly * 1.2
        const isTypeMatch =
          bTypes.length === 0 ||
          bTypes.some(
            (tp) =>
              unitType.toLowerCase().includes(tp.toLowerCase()) ||
              tp.toLowerCase().includes(unitType.toLowerCase())
          )

        const matchTags: string[] = []
        if (isCashMatch) matchTags.push(t.tagCashMatch)
        if (isInstMatch) matchTags.push(t.tagInstMatch)
        if (isExactAreaMatch) {
          matchTags.push(t.tagAreaMatch)
        } else if (isNearbyInSameCity) {
          matchTags.push(t.tagNearbyAreaMatch || t.tagAreaMatch)
        } else if (isTypeMatch) {
          matchTags.push(t.tagTypeMatch)
        }

        return {
          id: String(u.id),
          code,
          title: u.project_name || t.defaultUnitTitle,
          developer: u.developer_name || t.defaultDeveloper,
          area: rawAreaId,
          localizedArea,
          type: unitType,
          rooms: Number(u.rooms ?? meta.rooms) || 2,
          baths: Number(u.bathrooms ?? meta.bathrooms) || 1,
          size: Number(u.size ?? meta.size) || 75,
          cashNum: paid,
          cashStr: paid.toLocaleString('en-US'),
          remainingStr: remaining.toLocaleString('en-US'),
          contractNum: contract,
          marketNum: market,
          marketStr: market.toLocaleString('en-US'),
          gainNum: gainVal,
          gainStr: gainVal > 0 ? `+ ${gainVal.toLocaleString('en-US')}` : '',
          currency: unitCurrency,
          monthlyInst: unitMonthly,
          monthlyInstStr: unitMonthly.toLocaleString('en-US'),
          negotiable: Boolean(u.willing_to_discount),
          deliveryStatus,
          deliveryYear,
          contractYear: Number(u.contract_year ?? meta.contract_year) || 2024,
          image:
            Array.isArray(u.images) && u.images[0] ? u.images[0] : undefined,
          matchTags: matchTags.slice(0, 3),
          scorePct: smartRes.score,
          geoRelation: geoEval.relation,
          distanceKm: geoEval.distanceKm,
          isAreaMatch: isExactAreaMatch,
          isNearbyInSameCity,
          isCashMatch,
          isInstMatch,
          isTypeMatch,
        }
      })
  }, [
    marketUnits,
    buyReq?.id,
    bCash,
    bInstallment,
    bPlan,
    bBudget,
    bRooms,
    bDelivery,
    bAreas,
    bTypes,
    localizedUnitTypes,
    locale,
    t,
  ])

  const filteredUnits = useMemo(() => {
    const maxCashVal = Number(toEnglishDigits(maxCashFilter).replace(/,/g, ''))
    const maxInstVal = Number(toEnglishDigits(maxInstFilter).replace(/,/g, ''))
    const maxConVal = Number(
      toEnglishDigits(maxContractFilter).replace(/,/g, '')
    )

    const list = mappedUnits.filter((item) => {
      if (
        searchQuery.trim() &&
        !`${item.title} ${item.developer} ${item.localizedArea} ${item.code}`
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ) {
        return false
      }

      if (
        areaFilter.trim() &&
        !item.area.toLowerCase().includes(areaFilter.trim().toLowerCase()) &&
        !item.localizedArea
          .toLowerCase()
          .includes(areaFilter.trim().toLowerCase())
      ) {
        return false
      }
      if (onlyNegotiable && !item.negotiable) return false
      if (
        selectedTypes.length > 0 &&
        !selectedTypes.some(
          (st) =>
            item.type.toLowerCase().includes(st.toLowerCase()) ||
            st.toLowerCase().includes(item.type.toLowerCase())
        )
      ) {
        return false
      }
      if (
        delStatusFilter !== t.deliveryStatuses[0] &&
        item.deliveryStatus !== delStatusFilter
      ) {
        return false
      }
      if (delYearFilter !== t.deliveryYears[0]) {
        const y = Number(delYearFilter.replace(/[^0-9]/g, ''))
        if (y && item.deliveryYear > y) return false
      }
      if (conYearFilter !== t.contractYears[0]) {
        const y = Number(conYearFilter.replace(/[^0-9]/g, ''))
        if (y && item.contractYear > y) return false
      }
      if (minRoomsFilter !== t.roomOptions[0]) {
        const r = Number(minRoomsFilter.replace('+', ''))
        if (item.rooms < r) return false
      }
      if (maxCashVal > 0 && item.cashNum > maxCashVal) return false
      if (maxInstVal > 0 && item.monthlyInst > maxInstVal) return false
      if (maxConVal > 0 && item.contractNum > maxConVal) return false

      if (activePills.includes(t.filterPills[0]) && !item.isAreaMatch)
        return false
      if (activePills.includes(t.filterPills[1]) && !item.isCashMatch)
        return false
      if (activePills.includes(t.filterPills[2]) && !item.isInstMatch)
        return false
      if (
        activePills.includes(t.filterPills[3]) &&
        bBudget > 0 &&
        item.contractNum > bBudget * 1.15
      )
        return false
      if (activePills.includes(t.filterPills[4]) && !item.isTypeMatch)
        return false
      if (activePills.includes(t.filterPills[5]) && item.rooms < bRooms)
        return false
      if (activePills.includes(t.filterPills[6])) {
        const wantReady = bDelivery === t.deliveryPreferences[0]
        if (wantReady && item.deliveryStatus !== t.deliveryStatuses[1])
          return false
      }

      return true
    })

    return [...list].sort((a, b) => {
      if (sortBy === t.sorts[2]) return a.cashNum - b.cashNum
      if (sortBy === t.sorts[3]) return a.monthlyInst - b.monthlyInst
      if (sortBy === t.sorts[4] || sortBy === t.sorts[1])
        return b.gainNum - a.gainNum
      if (sortBy === t.sorts[5]) return a.deliveryYear - b.deliveryYear
      if (sortBy === t.sorts[6])
        return a.deliveryStatus === t.deliveryStatuses[1] ? -1 : 1
      return b.scorePct - a.scorePct
    })
  }, [
    mappedUnits,
    searchQuery,
    areaFilter,
    onlyNegotiable,
    selectedTypes,
    delStatusFilter,
    delYearFilter,
    conYearFilter,
    minRoomsFilter,
    maxCashFilter,
    maxInstFilter,
    maxContractFilter,
    activePills,
    sortBy,
    bBudget,
    bRooms,
    bDelivery,
    t,
  ])

  const activeFiltersCount = useMemo(() => {
    let c = activePills.length + selectedTypes.length
    if (onlyNegotiable) c++
    if (areaFilter.trim()) c++
    if (maxCashFilter.trim()) c++
    if (maxInstFilter.trim()) c++
    if (maxContractFilter.trim()) c++
    if (delStatusFilter !== t.deliveryStatuses[0]) c++
    if (delYearFilter !== t.deliveryYears[0]) c++
    if (conYearFilter !== t.contractYears[0]) c++
    if (minRoomsFilter !== t.roomOptions[0]) c++
    return c
  }, [
    activePills,
    selectedTypes,
    onlyNegotiable,
    areaFilter,
    maxCashFilter,
    maxInstFilter,
    maxContractFilter,
    delStatusFilter,
    delYearFilter,
    conYearFilter,
    minRoomsFilter,
    t,
  ])

  const unitsInPreferredArea = areaFilter.trim()
    ? filteredUnits
    : filteredUnits.filter((u) => u.isAreaMatch)

  const unitsInTrulyNearbyAreas = areaFilter.trim()
    ? []
    : filteredUnits
        .filter((u) => !u.isAreaMatch && u.isNearbyInSameCity)
        .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))

  const localizedPreferredAreasNames = bAreas.map((a) =>
    getLocalizedGeorgiaAreaName(a, locale)
  )

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmSaveOpen(true)
  }

  const executeSavePreferences = () => {
    startTransition(async () => {
      const res = await updateBuyerPreferencesAction({
        buyRequestId: buyReq?.id,
        available_cash: bCash,
        max_installment: bInstallment,
        payment_plan: bPlan,
        budget: bBudget,
        unit_types: bTypes,
        min_rooms: bRooms,
        delivery_status: bDelivery,
        preferred_areas: bAreas,
        notify_exact_match: notifyExact,
        notify_featured: notifyFeatured,
      })
      setConfirmSaveOpen(false)
      if (res.success) {
        setIsEditingBudget(false)
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 4000)
      }
    })
  }

  if (isEditingBudget) {
    return (
      <div dir={dir} className="mx-auto max-w-[660px] px-4 py-4 sm:px-6">
        <div className="mb-5 flex items-center justify-start">
          <button
            type="button"
            onClick={() => setIsEditingBudget(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] hover:text-[var(--brand-primary,#007a5a)]"
          >
            {isRtl ? (
              <ArrowRight className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
            <span>{t.backToOpportunitiesBtn}</span>
          </button>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-2xl font-black text-[var(--brand-navy,#0a1122)] sm:text-3xl">
            {t.editHeaderTitle}
          </h1>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            {t.editHeaderSub}
          </p>
        </header>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-6 rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-8">
            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.availableCashLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={bCash ? bCash.toLocaleString('en-US') : ''}
                onChange={(e) =>
                  setBCash(
                    Number(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    ) || 0
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
              />
              <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                {bCash.toLocaleString('en-US')} {currency}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {t.availableCashHelper}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.maxInstallmentLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={
                  bInstallment ? bInstallment.toLocaleString('en-US') : ''
                }
                onChange={(e) =>
                  setBInstallment(
                    Number(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    ) || 0
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
              />
              <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                {bInstallment.toLocaleString('en-US')} {currency}
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.paymentPlanLabel}
              </label>
              <div className="space-y-2">
                {t.paymentPlans.map((plan: string) => (
                  <label
                    key={plan}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold transition ${
                      bPlan === plan
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={bPlan === plan}
                      onChange={() => setBPlan(plan)}
                      className="accent-[var(--brand-primary,#007a5a)]"
                    />
                    <span>{plan}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.targetBudgetLabel}
              </label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={bBudget ? bBudget.toLocaleString('en-US') : ''}
                onChange={(e) =>
                  setBBudget(
                    Number(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    ) || 0
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
              />
              <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                {bBudget.toLocaleString('en-US')} {currency}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {t.targetBudgetHelper}
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.unitTypeLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {localizedUnitTypes.map((typeItem: string) => {
                  const active = bTypes.includes(typeItem)
                  return (
                    <button
                      key={typeItem}
                      type="button"
                      onClick={() =>
                        setBTypes((prev) =>
                          prev.includes(typeItem)
                            ? prev.filter((x) => x !== typeItem)
                            : [...prev, typeItem]
                        )
                      }
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {active ? `✓ ${typeItem}` : typeItem}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.minRoomsLabel}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={bRooms}
                  onChange={(e) => setBRooms(Number(e.target.value) || 0)}
                  className="h-11 w-28 rounded-xl border border-gray-200 text-center text-sm font-bold text-[var(--brand-navy,#0a1122)]"
                />
                <span className="text-xs text-gray-500">{t.roomWord}</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.deliveryLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {t.deliveryPreferences.map((st: string) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBDelivery(st)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                      bDelivery === st
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <GeorgiaAreaSelect
                label={t.preferredAreasLabel}
                value=""
                onChange={(selectedAreaId) => {
                  if (!bAreas.includes(selectedAreaId)) {
                    setBAreas((prev) => [...prev, selectedAreaId])
                  }
                }}
                placeholder={t.areaInputPlaceholder}
              />

              <div className="mt-3 flex flex-wrap gap-1.5">
                {bAreas.map((ar: string) => (
                  <span
                    key={ar}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]"
                  >
                    <span>{getLocalizedGeorgiaAreaName(ar, locale)}</span>
                    {bAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setBAreas((prev) => prev.filter((x) => x !== ar))
                        }
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {georgiaQuickAreas.map((item) => {
                  const isAdded = bAreas.includes(item.id)
                  const label = getLocalizedGeorgiaAreaName(item.id, locale)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePopularArea(item.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                        isAdded
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {isAdded ? `✓ ${label}` : `+ ${label}`}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {isPending ? t.savingBtn : t.saveAndViewBtn}
            </button>
          </div>
        </form>

        <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
          <DialogContent
            dir={dir}
            className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
          >
            <DialogHeader className="text-start">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[var(--brand-primary,#007a5a)]">
                  <ShieldAlert className="size-4" />
                </span>
                <DialogTitle className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                  {t.confirmModalTitle}
                </DialogTitle>
              </div>
              <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                {t.confirmModalDesc}{' '}
                <strong className="text-[var(--brand-primary,#007a5a)]">
                  ({localizedPreferredAreasNames.join(listSep)})
                </strong>
                ؟
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirmSaveOpen(false)}
                className="h-9 flex-1 rounded-xl text-xs font-bold"
              >
                {t.cancelBtn}
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={executeSavePreferences}
                className="h-9 flex-1 rounded-xl bg-[var(--brand-primary,#007a5a)] text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t.savingBtn}
                  </span>
                ) : (
                  t.confirmSaveBtn
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div dir={dir} className="mx-auto max-w-[1020px] px-3 sm:px-6">
      {savedToast && (
        <div className="mb-4 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] p-3 text-center text-xs font-bold text-[var(--brand-primary,#007a5a)]">
          {t.savedToastMsg}
        </div>
      )}

      {/* ==================== 1. كارت ملخص طلب الشراء + زر «عروضي» وبداخله عدد العروض بخط صغير ==================== */}
      <ScrollReveal>
        <section className="overflow-hidden rounded-[22px] border border-gray-200/90 border-t-[3px] border-t-[var(--brand-primary,#007a5a)] bg-white p-5 text-start shadow-xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
                <Radar className="size-5" />
              </span>
              <div>
                <h1 className="text-base font-black text-[var(--brand-navy,#0a1122)] sm:text-xl">
                  {t.mainTitle}
                </h1>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t.radarActiveSubtitle ||
                    'الرادار الذكي يطابق ميزانيتك ومنطقتك المفضلة في جورجيا مع الوحدات المعروضة للتنازل'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* الزر الوحيد لعروض المشتري: مكتوب فيه «عروضي» وتحته بخط صغير في نفس الزر عدد العروض */}
              <Link
                href="/account/offers?role=buyer"
                className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-[var(--brand-primary-light,#eaf8f2)]/70 px-4 py-2 text-center shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] hover:bg-[var(--brand-primary-light,#eaf8f2)]"
              >
                <div className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
                  <span className="text-xs font-black text-[var(--brand-navy,#0a1122)] sm:text-sm">
                    {t.myOffersBtn}
                  </span>
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold text-[var(--brand-primary,#007a5a)]">
                  {offersCount > 0
                    ? `${offersCount} ${t.offersAvailableSub || 'عروض متاحة'}`
                    : t.noOffersSub || 'لا توجد عروض حالياً'}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsEditingBudget(true)}
                className="inline-flex h-12 items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] transition hover:border-[var(--brand-primary,#007a5a)] hover:text-[var(--brand-primary,#007a5a)]"
              >
                <SlidersHorizontal className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
                <span>{t.editBudgetBtn}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-[#f8faf9] p-3">
              <span className="block text-[11px] font-semibold text-gray-500">
                {t.summaryCashLabel}
              </span>
              <strong
                dir="ltr"
                className="mt-1 block text-sm font-black text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-base"
              >
                {bCash.toLocaleString('en-US')} {currency}
              </strong>
            </div>

            <div className="rounded-xl border border-gray-100 bg-[#f8faf9] p-3">
              <span className="block text-[11px] font-semibold text-gray-500">
                {t.summaryInstLabel}
              </span>
              <strong
                dir="ltr"
                className="mt-1 block text-sm font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-base"
              >
                {bInstallment.toLocaleString('en-US')} {currency}
              </strong>
            </div>

            <div className="rounded-xl border border-gray-100 bg-[#f8faf9] p-3">
              <span className="block text-[11px] font-semibold text-gray-500">
                {extraLabels.specsSummaryLabel}
              </span>
              <strong className="mt-1 block truncate text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                {bTypes.join(listSep)} · {bRooms}+ {extraLabels.roomsWord}
              </strong>
            </div>

            <div className="rounded-xl border border-gray-100 bg-[#f8faf9] p-3">
              <span className="block text-[11px] font-semibold text-gray-500">
                {t.preferredAreasLabel}
              </span>
              <strong className="mt-1 block truncate text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                📍 {localizedPreferredAreasNames.join(listSep)}
              </strong>
            </div>
          </div>
        </section>

        <section className="mt-4 text-start">
          <div className="flex flex-wrap items-center justify-start gap-2">
            <span className="me-1 text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.filterByRequestLabel}
            </span>
            {t.filterPills.map((pill: string) => {
              const isSelected = activePills.includes(pill)
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => togglePill(pill)}
                  className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                    isSelected
                      ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-[var(--brand-primary,#007a5a)]'
                  }`}
                >
                  {pill}
                </button>
              )
            })}
          </div>
        </section>

        {/* ==================== 2. شريط البحث وزر الفلتر ==================== */}
        <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 end-3.5 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-3 pe-10 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-expanded={filterPanelOpen}
                onClick={() => setFilterPanelOpen((prev) => !prev)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                  filterPanelOpen || activeFiltersCount > 0
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                    : 'border-gray-200 bg-white text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
                }`}
              >
                <ListFilter className="size-3.5" />
                <span>{t.filterBtn}</span>
                {activeFiltersCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[var(--brand-primary,#007a5a)] text-[10px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOnlyNegotiable(!onlyNegotiable)}
                className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                  onlyNegotiable
                    ? 'border-[#d97706] bg-amber-50/70 text-[#b45309]'
                    : 'border-gray-200 bg-white text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
                }`}
              >
                <span>{t.negotiableBtn}</span>
                <ArrowDown className="size-3 text-[#d97706]" />
              </button>

              <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
                {unitsInPreferredArea.length + unitsInTrulyNearbyAreas.length}{' '}
                {t.availableUnitsWord}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 sm:text-xs">
                {t.sortByLabel}
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 min-w-[135px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-10 sm:min-w-[155px]"
                >
                  {t.sorts.map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-start gap-2 border-t border-gray-100 pt-2.5">
              {onlyNegotiable && (
                <button
                  type="button"
                  onClick={() => setOnlyNegotiable(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>{t.negotiableBtn}</span>
                  <X className="size-3" />
                </button>
              )}
              {areaFilter.trim() && (
                <button
                  type="button"
                  onClick={() => setAreaFilter('')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>
                    {oppFilters.areaBadgePrefix || '📍'}{' '}
                    {getLocalizedGeorgiaAreaName(areaFilter, locale)}
                  </span>
                  <X className="size-3" />
                </button>
              )}
              {maxCashFilter.trim() && (
                <button
                  type="button"
                  onClick={() => setMaxCashFilter('')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>
                    {oppFilters.cashUpToPrefix || '≤'}{' '}
                    {Number(toEnglishDigits(maxCashFilter)).toLocaleString(
                      'en-US'
                    )}{' '}
                    {currency}
                  </span>
                  <X className="size-3" />
                </button>
              )}
              {maxInstFilter.trim() && (
                <button
                  type="button"
                  onClick={() => setMaxInstFilter('')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>
                    {oppFilters.instUpToPrefix || '≤'}{' '}
                    {Number(toEnglishDigits(maxInstFilter)).toLocaleString(
                      'en-US'
                    )}{' '}
                    {currency}
                  </span>
                  <X className="size-3" />
                </button>
              )}
              {maxContractFilter.trim() && (
                <button
                  type="button"
                  onClick={() => setMaxContractFilter('')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>
                    {oppFilters.contractUpToPrefix || '≤'}{' '}
                    {Number(toEnglishDigits(maxContractFilter)).toLocaleString(
                      'en-US'
                    )}{' '}
                    {currency}
                  </span>
                  <X className="size-3" />
                </button>
              )}
              {selectedTypes.map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => toggleFilterType(tp)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>{tp}</span>
                  <X className="size-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ms-1 text-[11px] font-bold text-gray-400 underline hover:text-gray-700"
              >
                {t.clearFiltersBtn || oppFilters.clearAllBtn}
              </button>
            </div>
          )}
        </section>

        {/* ==================== 3. لوحة الفلتر المتقدم ==================== */}
        {filterPanelOpen && (
          <section className="mt-3 rounded-[18px] border border-gray-200/85 bg-white p-4 text-start shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <GeorgiaAreaSelect
                  label={oppFilters.areasLabel || t.preferredAreasLabel}
                  value={areaFilter}
                  onChange={(val) => setAreaFilter(val)}
                  placeholder={
                    oppFilters.areasPlaceholder || t.areaInputPlaceholder
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.maxCashLabel || t.availableCashLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={maxCashFilter}
                    onChange={(e) =>
                      setMaxCashFilter(
                        toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                      )
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-left text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.maxInstLabel || t.maxInstallmentLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={maxInstFilter}
                    onChange={(e) =>
                      setMaxInstFilter(
                        toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                      )
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-left text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.unitTypeLabel || t.unitTypeLabel}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {localizedUnitTypes.map((tp: string) => {
                  const active = selectedTypes.includes(tp)
                  return (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => toggleFilterType(tp)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {tp}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.deliveryLabel || t.deliveryLabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.deliveryStatuses.map((status: string) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDelStatusFilter(status)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        delStatusFilter === status
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.deliveryYearLabel || t.deliveryLabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.deliveryYears.map((yr: string) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setDelYearFilter(yr)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        delYearFilter === yr
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.contractYearLabel || 'سنة التعاقد'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.contractYears.map((yr: string) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setConYearFilter(yr)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        conYearFilter === yr
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.minRoomsLabel || t.minRoomsLabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.roomOptions.map((rm: string) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setMinRoomsFilter(rm)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        minRoomsFilter === rm
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span dir="ltr">{rm}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                  {oppFilters.maxContractPriceLabel || t.targetBudgetLabel}
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={maxContractFilter}
                    onChange={(e) =>
                      setMaxContractFilter(
                        toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                      )
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-left text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                    {currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilterPanelOpen(false)}
                  className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 py-2 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
                >
                  {oppFilters.showResultsBtn || 'عرض النتائج'} (
                  {unitsInPreferredArea.length + unitsInTrulyNearbyAreas.length})
                </button>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-gray-500 hover:text-[var(--brand-navy,#0a1122)]"
                >
                  {t.clearFiltersBtn || oppFilters.clearAllBtn}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                {oppFilters.hideBtn || t.cancelBtn}
              </button>
            </div>
          </section>
        )}
      </ScrollReveal>

      {unitsInPreferredArea.length === 0 &&
      unitsInTrulyNearbyAreas.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
          <Radar className="mx-auto mb-3 size-9 text-slate-300" />
          <p className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)]">
            {t.emptyFilteredTitle}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {t.emptyNearbyHint ||
              'لا توجد حالياً وحدات مطابقة في منطقتك المحددة أو الأحياء الملاصقة لها. يمكنك تعديل المناطق المفضلة أو تصفح كل الفرص.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
              >
                {t.clearFiltersBtn}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditingBudget(true)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-[#0a1122] hover:bg-slate-50"
            >
              {t.editBudgetBtn}
            </button>
            <Link
              href="/opportunities"
              className="rounded-xl bg-[#0a1122] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#16223f]"
            >
              {t.browseAllMarketBtn || 'تصفح جميع فرص السوق'}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {unitsInPreferredArea.length > 0 && (
            <section className="mt-7">
              <div className="mb-4 flex items-center gap-2 text-start">
                <MapPin className="size-4 text-[var(--brand-primary,#007a5a)]" />
                <h2 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                  {areaFilter.trim()
                    ? `${oppFilters.areaBadgePrefix || ''} ${getLocalizedGeorgiaAreaName(areaFilter, locale)}`
                    : `${t.preferredSectionTitle} (${localizedPreferredAreasNames.join(listSep)})`}{' '}
                  <span className="font-normal text-gray-400">
                    ({unitsInPreferredArea.length})
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unitsInPreferredArea.slice(0, visibleCount).map((u, idx) => (
                  <ScrollReveal key={u.id} delay={(idx % 6) * 50}>
                    <BuyerUnitCard
                      t={t}
                      extraLabels={extraLabels}
                      unit={u}
                      isLiked={favoriteIds.includes(String(u.id))}
                      onToggleLike={() => toggleFavorite(u.id)}
                    />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}

          {unitsInTrulyNearbyAreas.length > 0 && (
            <section className="mt-10 border-t border-gray-200/70 pt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center justify-start gap-1.5 text-start">
                  <Compass className="size-4 text-[var(--brand-primary,#007a5a)]" />
                  <h2 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                    {t.otherAreasSectionTitle} ({unitsInTrulyNearbyAreas.length})
                  </h2>
                </div>

                {unitsInTrulyNearbyAreas.length > NEARBY_AREAS_PREVIEW_SIZE && (
                  <button
                    type="button"
                    onClick={() => setShowAllNearbyAreas((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] transition hover:underline"
                  >
                    <span>
                      {showAllNearbyAreas
                        ? t.showLessBtn
                        : `${t.showAllBtn} (${unitsInTrulyNearbyAreas.length})`}
                    </span>
                    <ChevronLeft className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(showAllNearbyAreas
                  ? unitsInTrulyNearbyAreas
                  : unitsInTrulyNearbyAreas.slice(0, NEARBY_AREAS_PREVIEW_SIZE)
                ).map((u, idx) => (
                  <ScrollReveal key={u.id} delay={(idx % 6) * 50}>
                    <BuyerUnitCard
                      t={t}
                      extraLabels={extraLabels}
                      unit={u}
                      isLiked={favoriteIds.includes(String(u.id))}
                      onToggleLike={() => toggleFavorite(u.id)}
                    />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-10 flex justify-center border-t border-gray-200/80 pt-6 [&>*]:justify-center [&_div]:justify-center [&_form]:hidden">
        <AccountActionLinks
          unitsCount={0}
          initialDeletionRequested={deletionRequested}
          position="bottom"
        />
      </div>
    </div>
  )
}

function BuyerUnitCard({
  t,
  extraLabels,
  unit,
  isLiked,
  onToggleLike,
}: {
  t: any
  extraLabels: ReturnType<typeof getBuyerExtraLabels>
  unit: any
  isLiked: boolean
  onToggleLike: () => void
}) {
  return (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-[18px] border border-gray-200/90 bg-white shadow-2xs transition hover:shadow-md">
      <div>
        <div className="relative h-[165px] w-full overflow-hidden bg-gray-100 sm:h-[185px]">
          <Link
            href={`/opportunities/${unit.id}`}
            className="block h-full w-full"
          >
            <img
              src={
                unit.image ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
              }
              alt={unit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#0a1122]/90 px-3 py-1 text-[11px] font-black text-emerald-300 shadow-sm backdrop-blur-xs">
            <span>🎯 {t.matchScorePrefix || 'توافق'}</span>
            <span dir="ltr">{unit.scorePct}%</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onToggleLike()
            }}
            aria-label={t.addToFavoritesAria}
            className={`absolute top-3 left-3 flex size-8 items-center justify-center rounded-full shadow-md transition ${
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/95 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`size-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2">
            <span className="rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-xs">
              {unit.code}
            </span>
            <span className="rounded-md bg-white/95 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[var(--brand-navy,#0a1122)] shadow-2xs">
              {unit.deliveryStatus}
            </span>
          </div>
        </div>

        <div className="p-4 text-start sm:p-5">
          <Link href={`/opportunities/${unit.id}`}>
            <h3 className="line-clamp-1 text-sm font-extrabold text-[var(--brand-navy,#0a1122)] transition-colors group-hover:text-[var(--brand-primary,#007a5a)] sm:text-base">
              {unit.title}
            </h3>
          </Link>
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
            {unit.developer} · {unit.localizedArea}
          </p>

          <div className="mt-2.5 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-gray-100/80 px-2.5 py-1 text-[11px] font-bold text-[#1e293b]">
            <span>{unit.type}</span>
            <span>·</span>
            <span>
              {unit.rooms} {extraLabels.roomsWord}
            </span>
            <span>·</span>
            <span>
              {unit.size} {extraLabels.sqmUnit}
            </span>
          </div>

          <div className="mt-3.5 rounded-xl border border-gray-100 bg-[#f8faf9] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-[10.5px] font-semibold text-gray-500">
                  {t.cardRequiredCash}
                </p>
                <p className="mt-0.5 text-base font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-lg">
                  <span dir="ltr">{unit.cashStr}</span>{' '}
                  <span className="text-xs font-bold">{unit.currency}</span>
                </p>
              </div>
              {unit.negotiable && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  ↓ {extraLabels.negotiableTag}
                </span>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-gray-200/70 pt-2 text-[11px]">
              <div>
                <span className="block text-[10px] text-gray-400">
                  {extraLabels.installmentShort}
                </span>
                <strong
                  dir="ltr"
                  className="font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums"
                >
                  {unit.monthlyInst > 0
                    ? `${unit.monthlyInstStr} ${unit.currency}`
                    : '—'}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400">
                  {extraLabels.remainingLabel}
                </span>
                <strong
                  dir="ltr"
                  className="font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums"
                >
                  {unit.remainingStr} {unit.currency}
                </strong>
              </div>
            </div>
          </div>

          {unit.gainStr && (
            <div className="mt-2.5 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-2 text-start">
              <p
                dir="ltr"
                className="text-start text-xs font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums"
              >
                {unit.gainStr} {unit.currency}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-[#2b8a6e]">
                {t.cardMarketPriceToday} {unit.marketStr} {unit.currency}
              </p>
            </div>
          )}

          {unit.matchTags?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {unit.matchTags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#e3f2ef] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 px-4 py-3 sm:px-5">
        <Link
          href={`/account/offers?role=buyer&applyUnitId=${unit.id}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary,#007a5a)] px-3 text-xs font-extrabold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
        >
          <Wallet className="size-3.5 shrink-0" />
          <span className="truncate">{extraLabels.submitOfferBtn}</span>
        </Link>

        <Link
          href={`/opportunities/${unit.id}`}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] transition hover:border-gray-300 hover:bg-gray-50"
        >
          {extraLabels.detailsBtn}
        </Link>
      </div>
    </div>
  )
}