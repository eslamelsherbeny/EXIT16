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
  Sparkles,
  UserCheck,
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
import { unitTypes as sharedUnitTypes } from '@/components/features/seller/seller-shared'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { AccountActionLinks } from './delete-account-modal'
import type { SellerUnitItem } from './seller-dashboard'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
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
  userName = '',
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
  const currency = getCurrencySymbol('GE', locale)
  const listSep = dir === 'rtl' ? '، ' : ', '

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
      : [sharedUnitTypes[0]]
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
        const paid = Number(u.paid_amount) || 0
        const contract = Number(u.contract_price) || paid
        const market = Number(u.market_price) || contract
        const commission = Math.round(market * 0.0125)
        const gainVal = Math.max(0, market - contract - commission)
        const unitMonthly = calcMonthlyInstallment(
          Number(u.installment_amount) || 0,
          u.installment_frequency
        )

        const rawDel = String(u.delivery_status || '')
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

        const rawAreaId = u.area || GEORGIA_CITIES_AND_DISTRICTS[0].id
        const localizedArea = getLocalizedGeorgiaAreaName(rawAreaId, locale)
        const unitType = u.unit_type || sharedUnitTypes[0]
        const unitCurrency = getCurrencySymbol('GE', locale)

        // التقييم الجغرافي الحقيقي عبر الإحداثيات (GPS Proximity)
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
          bTypes.some((tp) => unitType.includes(tp) || tp.includes(unitType))

        const matchTags: string[] = []
        if (isCashMatch) matchTags.push(t.tagCashMatch)
        if (isInstMatch) matchTags.push(t.tagInstMatch)
        if (isExactAreaMatch) {
          matchTags.push(t.tagAreaMatch)
        } else if (isNearbyInSameCity) {
          const kmLabel = geoEval.distanceKm
            ? ` (${geoEval.distanceKm} ${t.kmUnit || 'كم'})`
            : ''
          matchTags.push(
            `${t.tagNearbyAreaMatch || t.tagAreaMatch}${kmLabel}`
          )
        } else if (isTypeMatch) {
          matchTags.push(t.tagTypeMatch)
        }

        return {
          id: String(u.id),
          title: u.project_name || t.defaultUnitTitle,
          subtitle: `${u.developer_name || t.defaultDeveloper} · ${localizedArea} · ${unitType}`,
          area: rawAreaId,
          localizedArea,
          type: unitType,
          rooms: Number(u.rooms) || 2,
          cashNum: paid,
          cashStr: paid.toLocaleString('en-US'),
          contractNum: contract,
          marketNum: market,
          marketStr: market.toLocaleString('en-US'),
          gainNum: gainVal,
          gainStr: gainVal > 0 ? `+ ${gainVal.toLocaleString('en-US')}` : '',
          currency: unitCurrency,
          monthlyInst: unitMonthly,
          negotiable: Boolean(u.willing_to_discount),
          deliveryStatus,
          deliveryYear,
          contractYear: Number(u.contract_year) || 2024,
          image:
            Array.isArray(u.images) && u.images[0] ? u.images[0] : undefined,
          matchTags,
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
    locale,
    t,
  ])

  const filteredUnits = useMemo(() => {
    const maxCashVal = Number(maxCashFilter.replace(/,/g, ''))
    const maxInstVal = Number(maxInstFilter.replace(/,/g, ''))
    const maxConVal = Number(maxContractFilter.replace(/,/g, ''))

    const list = mappedUnits.filter((item) => {
      if (
        searchQuery.trim() &&
        !`${item.title} ${item.subtitle} ${item.localizedArea}`
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
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) {
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

  // 1. وحدات في نفس المنطقة المطلوبة بالضبط
  const unitsInPreferredArea = filteredUnits.filter((u) => u.isAreaMatch)

  // 2. وحدات في أحياء قريبة فعلياً داخل نفس المدينة فقط (وليس في مدن بعيدة أو دول أخرى!)
  const unitsInTrulyNearbyAreas = filteredUnits
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
                  setBCash(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
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
                    Number(e.target.value.replace(/[^0-9]/g, '')) || 0
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
                    Number(e.target.value.replace(/[^0-9]/g, '')) || 0
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
                {sharedUnitTypes.map((typeItem: string) => {
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

            {/* اختيار المناطق المفضلة في جورجيا من القائمة المنسدلة الموحدة */}
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

      {/* ==================== 1. بانر هوية الحساب الشخصي للمشتري (لمنع التشابه مع صفحة الفرص العامة) ==================== */}
      <ScrollReveal>
        <section className="rounded-[22px] border border-emerald-200/80 bg-gradient-to-br from-[#0a1122] via-[#10233f] to-[#0d3b33] p-5 text-start text-white shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-extrabold text-emerald-300 ring-1 ring-emerald-400/30">
                <UserCheck className="size-3.5" />
                <span>
                  {t.myAccountBadge || 'حسابي الشخصي — لوحة المشتري'}
                  {userName ? ` · ${userName.split(' ')[0]}` : ''}
                </span>
              </div>
              <h1 className="mt-2.5 text-xl font-black tracking-tight text-white sm:text-2xl">
                {t.mainTitle}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {t.radarActiveSubtitle ||
                  'الرادار الذكي يطابق ميزانيتك ومنطقتك المفضلة في جورجيا مع الوحدات المعروضة للتنازل'}
              </p>
            </div>

            {/* أزرار عروضي (مع عداد العروض المتاحة) + تعديل طلب الشراء */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/account/offers"
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-emerald-400/40 bg-white px-4 py-2 text-center shadow-sm transition hover:bg-emerald-50"
              >
                <div className="flex items-center gap-1.5">
                  <Wallet className="size-4 text-[var(--brand-primary,#007a5a)]" />
                  <span className="text-xs font-black text-[var(--brand-navy,#0a1122)] sm:text-sm">
                    {t.myOffersBtn}
                  </span>
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-primary,#007a5a)] px-1.5 text-[11px] font-black text-white">
                    {offersCount}
                  </span>
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold text-[var(--brand-primary,#007a5a)]">
                  {offersCount > 0
                    ? `${offersCount} ${t.offersAvailableSub || 'عروض متاحة'}`
                    : t.noOffersSub || 'تابع عروضك وترشيحاتك'}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsEditingBudget(true)}
                className="inline-flex h-12 items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 text-xs font-extrabold text-white backdrop-blur-xs transition hover:bg-white/20"
              >
                <SlidersHorizontal className="size-3.5 text-emerald-300" />
                <span>{t.editBudgetBtn}</span>
              </button>
            </div>
          </div>

          {/* ملخص طلب الشراء الخاص بالعميل داخل كارت الهوية */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[10.5px] text-slate-300">
                {t.summaryCashLabel}
              </span>
              <strong
                dir="ltr"
                className="mt-0.5 block text-sm font-black text-emerald-300 tabular-nums sm:text-base"
              >
                {bCash.toLocaleString('en-US')} {currency}
              </strong>
            </div>
            <div>
              <span className="block text-[10.5px] text-slate-300">
                {t.summaryInstLabel}
              </span>
              <strong
                dir="ltr"
                className="mt-0.5 block text-sm font-black text-white tabular-nums sm:text-base"
              >
                {bInstallment.toLocaleString('en-US')} {currency}
              </strong>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <span className="block text-[10.5px] text-slate-300">
                {t.preferredAreasLabel}
              </span>
              <strong className="mt-0.5 block truncate text-xs font-extrabold text-white sm:text-sm">
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
          <p className="mt-2 text-[11px] text-gray-400">
            {t.filterByRequestSub}
          </p>
        </section>

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
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
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
        </section>
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
          {/* القسم الأول: وحدات في نفس المنطقة المطلوبة بالضبط */}
          {unitsInPreferredArea.length > 0 && (
            <section className="mt-7">
              <div className="mb-4 flex items-center gap-2 text-start">
                <MapPin className="size-4 text-[var(--brand-primary,#007a5a)]" />
                <h2 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                  {t.preferredSectionTitle} (
                  {localizedPreferredAreasNames.join(listSep)}){' '}
                  <span className="font-normal text-gray-400">
                    ({unitsInPreferredArea.length})
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
                {unitsInPreferredArea.slice(0, visibleCount).map((u, idx) => (
                  <ScrollReveal key={u.id} delay={(idx % 6) * 50}>
                    <BuyerUnitCard
                      t={t}
                      unit={u}
                      isLiked={favoriteIds.includes(String(u.id))}
                      onToggleLike={() => toggleFavorite(u.id)}
                    />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}

          {/* القسم الثاني: وحدات في أحياء قريبة فعلياً داخل نفس المدينة (أقل من 20 كم) */}
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

              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
                {(showAllNearbyAreas
                  ? unitsInTrulyNearbyAreas
                  : unitsInTrulyNearbyAreas.slice(0, NEARBY_AREAS_PREVIEW_SIZE)
                ).map((u, idx) => (
                  <ScrollReveal key={u.id} delay={(idx % 6) * 50}>
                    <BuyerUnitCard
                      t={t}
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
  unit,
  isLiked,
  onToggleLike,
}: {
  t: any
  unit: any
  isLiked: boolean
  onToggleLike: () => void
}) {
  return (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[16px] border border-gray-200/85 bg-white shadow-2xs transition hover:shadow-md sm:rounded-[18px]">
      <div>
        <div className="relative h-[130px] w-full overflow-hidden bg-gray-100 sm:h-[175px]">
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

          {/* شارة نسبة التوافق مكتوب بها "متوافق 98%" بوضوح */}
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-[#0a1122]/90 px-2.5 py-1 text-[10px] font-black text-emerald-300 shadow-sm backdrop-blur-xs">
            <span>🎯 {t.matchScorePrefix || 'متوافق'}</span>
            <span dir="ltr">{unit.scorePct}%</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onToggleLike()
            }}
            aria-label={t.addToFavoritesAria}
            className={`absolute top-2.5 left-2.5 flex size-7 items-center justify-center rounded-full shadow-md transition sm:size-8 ${
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/95 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart
              className={`size-3.5 sm:size-4 ${isLiked ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        <Link
          href={`/opportunities/${unit.id}`}
          className="block p-3.5 text-start sm:p-5"
        >
          <h3 className="line-clamp-1 min-h-[20px] text-xs font-bold leading-snug text-[var(--brand-navy,#0a1122)] group-hover:text-[var(--brand-primary,#007a5a)] sm:line-clamp-2 sm:min-h-[44px] sm:text-[16px]">
            {unit.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[10px] text-gray-500 sm:text-xs">
            {unit.subtitle}
          </p>

          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] text-gray-400 sm:text-[11px]">
              {t.cardRequiredCash}
            </p>
            <p className="mt-0.5 text-sm font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-xl">
              {unit.cashStr}{' '}
              <span className="text-[10px] font-semibold sm:text-xs">
                {unit.currency}
              </span>
            </p>
          </div>

          {unit.gainStr && (
            <div className="mt-2.5 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-2.5 py-2 text-start sm:mt-3 sm:px-3 sm:py-2.5">
              <p
                dir="ltr"
                className="text-start text-xs font-bold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-sm"
              >
                {unit.gainStr} {unit.currency}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[9.5px] text-[#2b8a6e] sm:text-[10.5px]">
                {t.cardMarketPriceToday} {unit.marketStr} {unit.currency}
              </p>
            </div>
          )}

          {unit.matchTags?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3">
              {unit.matchTags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#e3f2ef] px-2 py-0.5 text-[9.5px] font-bold text-[var(--brand-primary,#007a5a)] sm:px-2.5 sm:py-1 sm:text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Link>
      </div>

      <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-2.5 sm:px-5 sm:pb-4">
        <Link
          href={`/account/offers?applyUnitId=${unit.id}`}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary,#007a5a)] px-3 text-[11px] font-extrabold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] sm:h-9 sm:text-xs"
        >
          <Sparkles className="size-3" />
          <span>{t.makeOfferCardBtn || t.myOffersBtn}</span>
        </Link>
      </div>
    </div>
  )
}