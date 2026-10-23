'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Heart,
  ListFilter,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react'
import { updateBuyerPreferencesAction } from '@/app/actions/account-actions'
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
  formatAmount,
  unitTypes as sharedUnitTypes,
} from '@/components/seller/seller-shared'
import { AccountActionLinks } from './delete-account-modal'
import type { SellerUnitItem } from './seller-dashboard'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

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
const OTHER_AREAS_PREVIEW_SIZE = 6

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

function extractCleanAreas(
  areas: string[] | null | undefined,
  fallbackArea: string
): string[] {
  if (!Array.isArray(areas) || areas.length === 0) return [fallbackArea]
  const cleaned = areas
    .map((a) => {
      if (a.includes(' - ')) {
        const parts = a.split(' - ')
        return parts[parts.length - 1].trim()
      }
      return a
        .replace(/🎯/g, '')
        .replace(/\(U-[^)]+\)/gi, '')
        .trim()
    })
    .filter(Boolean)

  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [fallbackArea]
}

export function BuyerDashboard({
  buyReq,
  marketUnits,
  deletionRequested = false,
}: {
  buyReq: BuyerRequestItem | null
  marketUnits: SellerUnitItem[]
  deletionRequested?: boolean
}) {
  const { t: dict, locale, country, dir, isRtl, currency } = useTranslation()
  const t = dict.accountComponents.buyer

  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [visibleCount, setVisibleCount] = useState(PREFERRED_PAGE_SIZE)
  const [showAllOtherAreas, setShowAllOtherAreas] = useState(false)
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
    Number(buyReq?.available_cash || buyReq?.budget || 3000000)
  )
  const [bInstallment, setBInstallment] = useState<number>(
    Number(buyReq?.max_installment || 100000)
  )
  const [bPlan, setBPlan] = useState<string>(
    buyReq?.payment_plan || t.paymentPlans[0]
  )
  const [bBudget, setBBudget] = useState<number>(
    Number(buyReq?.budget || 3500000)
  )
  const [bTypes, setBTypes] = useState<string[]>(
    Array.isArray(buyReq?.unit_types) && buyReq.unit_types.length > 0
      ? buyReq.unit_types
      : [sharedUnitTypes[0]]
  )
  const [bRooms, setBRooms] = useState<number>(Number(buyReq?.min_rooms || 3))
  const [bDelivery, setBDelivery] = useState<string>(
    buyReq?.delivery_status || t.deliveryPreferences[0]
  )
  const [bAreas, setBAreas] = useState<string[]>(() =>
    extractCleanAreas(buyReq?.preferred_areas, t.popularAreas[0])
  )
  const [newAreaInput, setNewAreaInput] = useState('')
  const [notifyExact, setNotifyExact] = useState<boolean>(
    buyReq?.notify_exact_match ?? true
  )
  const [notifyFeatured, setNotifyFeatured] = useState<boolean>(
    buyReq?.notify_featured ?? true
  )

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
    setShowAllOtherAreas(false)
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

  const addCustomArea = () => {
    const parts = newAreaInput
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    setBAreas((prev) => Array.from(new Set([...prev, ...parts])))
    setNewAreaInput('')
  }

  const togglePopularArea = (areaName: string) => {
    setBAreas((prev) =>
      prev.includes(areaName)
        ? prev.length > 1
          ? prev.filter((x) => x !== areaName)
          : prev
        : [...prev, areaName]
    )
  }

  const togglePill = (pill: string) => {
    setActivePills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill]
    )
  }

  const toggleFilterType = (typeVal: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeVal)
        ? prev.filter((x) => x !== typeVal)
        : [...prev, typeVal]
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

    return marketUnits.map((u) => {
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
        rawDel.includes(t.deliveryStatuses[1])
      const deliveryStatus = isReady
        ? t.deliveryStatuses[1]
        : t.deliveryStatuses[2]
      const yearMatch = rawDel.match(/20\d{2}/)
      const deliveryYear = yearMatch ? Number(yearMatch[0]) : 2027

      const unitArea = u.area || t.popularAreas[0]
      const unitType = u.unit_type || sharedUnitTypes[0]
      const unitCurrency = getCurrencySymbol(
        u.country_code || u.country || country,
        locale
      )

      const matchTags: string[] = []
      const isCashMatch = bCash === 0 || paid <= bCash * 1.15
      const isInstMatch =
        buyerMaxMonthly === 0 ||
        unitMonthly === 0 ||
        unitMonthly <= buyerMaxMonthly * 1.2
      const isAreaMatch =
        bAreas.length === 0 ||
        bAreas.some((a) => unitArea.includes(a) || a.includes(unitArea))
      const isTypeMatch =
        bTypes.length === 0 ||
        bTypes.some((tp) => unitType.includes(tp) || tp.includes(unitType))

      if (isCashMatch) matchTags.push(t.tagCashMatch)
      if (isInstMatch) matchTags.push(t.tagInstMatch)
      if (isAreaMatch) matchTags.push(t.tagAreaMatch)
      else if (isTypeMatch) matchTags.push(t.tagTypeMatch)

      return {
        id: String(u.id),
        title: u.project_name || t.defaultUnitTitle,
        subtitle: `${u.developer_name || t.defaultDeveloper} · ${unitArea} · ${unitType}`,
        area: unitArea,
        type: unitType,
        rooms: Number(u.rooms) || 3,
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
        isAreaMatch,
        isCashMatch,
        isInstMatch,
        isTypeMatch,
      }
    })
  }, [marketUnits, bCash, bInstallment, bPlan, bAreas, bTypes, country, locale, t])

  const filteredUnits = useMemo(() => {
    const maxCashVal = Number(maxCashFilter.replace(/,/g, ''))
    const maxInstVal = Number(maxInstFilter.replace(/,/g, ''))
    const maxConVal = Number(maxContractFilter.replace(/,/g, ''))

    const list = mappedUnits.filter((item) => {
      if (
        searchQuery.trim() &&
        !`${item.title} ${item.subtitle} ${item.area}`
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ) {
        return false
      }

      if (areaFilter.trim() && !item.area.includes(areaFilter.trim())) {
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
      return 0
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

  const unitsInPreferredArea = filteredUnits.filter((u) => u.isAreaMatch)
  const unitsInOtherAreas = filteredUnits.filter((u) => !u.isAreaMatch)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newAreaInput.trim()) {
      addCustomArea()
    }
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
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={bCash ? bCash.toLocaleString('en-US') : ''}
                  onChange={(e) =>
                    setBCash(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 pr-4 pl-12 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
              </div>
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
              <div className="relative">
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
                  className="h-12 w-full rounded-xl border border-gray-200 pr-4 pl-12 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
                {bInstallment.toLocaleString('en-US')} {currency}
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.paymentPlanLabel}
              </label>
              <div className="space-y-2">
                {t.paymentPlans.map((plan) => (
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
              <div className="relative">
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
                  className="h-12 w-full rounded-xl border border-gray-200 pr-4 pl-12 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
              </div>
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
                {sharedUnitTypes.map((typeItem) => {
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
              <div className="flex gap-2">
                {t.deliveryPreferences.map((st) => (
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
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.preferredAreasLabel}
              </label>

              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {bAreas.map((ar) => (
                  <span
                    key={ar}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]"
                  >
                    <span>{ar}</span>
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomArea()
                    }
                  }}
                  placeholder={t.areaInputPlaceholder}
                  className="h-11 flex-1 rounded-xl border border-gray-200 px-3.5 text-xs focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomArea}
                  className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-[var(--brand-navy,#0a1122)] px-4 text-xs font-bold text-white transition hover:bg-[var(--brand-navy-hover,#16223f)]"
                >
                  <Plus className="size-3.5" />
                  <span>{t.addAreaBtn}</span>
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {t.popularAreas.map((areaName) => {
                  const isAdded = bAreas.includes(areaName)
                  return (
                    <button
                      key={areaName}
                      type="button"
                      onClick={() => togglePopularArea(areaName)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                        isAdded
                          ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {isAdded ? `✓ ${areaName}` : `+ ${areaName}`}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {isPending ? t.savingBtn : t.saveAndViewBtn}
            </button>
          </div>

          <div className="rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-7">
            <h3 className="text-sm font-black text-[var(--brand-navy,#0a1122)]">
              {t.notificationsTitle}
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                    {t.notifyExactTitle}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {t.notifyExactSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyExact(!notifyExact)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    notifyExact
                      ? 'bg-[var(--brand-primary,#007a5a)]'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block size-5 rounded-full bg-white shadow-xs transition-transform ${
                      notifyExact ? '-translate-x-5' : '-translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                    {t.notifyFeaturedTitle}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {t.notifyFeaturedSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyFeatured(!notifyFeatured)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    notifyFeatured
                      ? 'bg-[var(--brand-primary,#007a5a)]'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block size-5 rounded-full bg-white shadow-xs transition-transform ${
                      notifyFeatured ? '-translate-x-5' : '-translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
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
                  ({bAreas.join('، ')})
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

      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
          {t.mainTitle}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/account/offers"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:bg-gray-50"
          >
            {t.myOffersBtn}
          </Link>
          <button
            type="button"
            onClick={() => setIsEditingBudget(true)}
            className="text-xs font-bold text-[#1e3a8a] transition hover:underline"
          >
            {t.editBudgetBtn}
          </button>
        </div>
      </header>

      <section className="mt-4 rounded-[14px] border border-gray-200/80 bg-white px-5 py-3.5 text-start shadow-2xs">
        <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="text-gray-400">{t.summaryCashLabel} </span>
            <strong className="font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums">
              {bCash.toLocaleString('en-US')} {currency}
            </strong>
          </div>
          <div>
            <span className="text-gray-400">{t.summaryInstLabel} </span>
            <strong className="font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums">
              {bInstallment.toLocaleString('en-US')} {currency}
            </strong>
          </div>
        </div>
      </section>

      <section className="mt-4 text-start">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <span className="me-1 text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
            {t.filterByRequestLabel}
          </span>
          {t.filterPills.map((pill) => {
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
        <p className="mt-2 text-[11px] text-gray-400">{t.filterByRequestSub}</p>
      </section>

      <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
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
              {filteredUnits.length} {t.availableUnitsWord}
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
                {t.sorts.map((s) => (
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
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5">
            {onlyNegotiable && (
              <button
                type="button"
                onClick={() => setOnlyNegotiable(false)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>{t.negotiableBtn}</span>
                <X className="size-3" />
              </button>
            )}
            {activePills.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePill(p)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>{p}</span>
                <X className="size-3" />
              </button>
            ))}
            {selectedTypes.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => toggleFilterType(tp)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>{tp}</span>
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="ms-1 text-[11px] text-gray-500 underline hover:text-[var(--brand-navy,#0a1122)]"
            >
              {t.clearAllBtn}
            </button>
          </div>
        )}
      </section>

      {filterPanelOpen && (
        <section className="mt-3 rounded-[20px] border border-gray-200/80 bg-white p-5 text-start shadow-xs sm:p-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.advAreasLabel}
              </label>
              <input
                type="text"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                placeholder={t.advAreasPlaceholder}
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.advMaxCashLabel}
              </label>
              <input
                type="number"
                value={maxCashFilter}
                onChange={(e) => setMaxCashFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                {t.advMaxCashHelper}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {t.advMaxInstLabel}
              </label>
              <input
                type="number"
                value={maxInstFilter}
                onChange={(e) => setMaxInstFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                {t.advMaxInstHelper}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.unitTypeLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sharedUnitTypes.map((tp) => {
                const active = selectedTypes.includes(tp)
                return (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => toggleFilterType(tp)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                      active
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {tp}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 py-2 text-xs font-bold text-white"
              >
                {t.showResultsBtn}
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-gray-500 hover:text-[var(--brand-navy,#0a1122)]"
              >
                {t.clearAllBtn}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="text-xs font-medium text-gray-400 hover:text-gray-700"
            >
              {t.hideBtn}
            </button>
          </div>
        </section>
      )}

      {filteredUnits.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
          <p className="text-sm font-bold text-gray-600">
            {t.emptyFilteredTitle}
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 py-2.5 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
          >
            {t.clearFiltersBtn}
          </button>
        </div>
      ) : (
        <>
          {unitsInPreferredArea.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-4 text-start text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                {t.preferredSectionTitle} ({bAreas.join('، ')}){' '}
                <span className="font-normal text-gray-400">
                  ({unitsInPreferredArea.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
                {unitsInPreferredArea.slice(0, visibleCount).map((u) => (
                  <BuyerUnitCard
                    key={u.id}
                    t={t}
                    unit={u}
                    isLiked={favoriteIds.includes(String(u.id))}
                    onToggleLike={() => toggleFavorite(u.id)}
                  />
                ))}
              </div>

              {unitsInPreferredArea.length > visibleCount && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) => prev + PREFERRED_PAGE_SIZE)
                    }
                    className="rounded-full border border-gray-200 bg-white px-7 py-2.5 text-xs font-bold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] hover:bg-gray-50 active:scale-95"
                  >
                    {t.showMorePrefix}{' '}
                    {Math.min(
                      PREFERRED_PAGE_SIZE,
                      unitsInPreferredArea.length - visibleCount
                    )}{' '}
                    {t.showMoreMiddle} (
                    {unitsInPreferredArea.length - visibleCount}{' '}
                    {t.remainingWord})
                  </button>
                </div>
              )}
            </section>
          )}

          {unitsInOtherAreas.length > 0 && (
            <section className="mt-10 border-t border-gray-200/70 pt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center justify-start gap-1.5 text-start">
                  <Star className="size-4 fill-amber-400 text-amber-500" />
                  <h2 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                    {t.otherAreasSectionTitle} ({unitsInOtherAreas.length})
                  </h2>
                </div>

                {unitsInOtherAreas.length > OTHER_AREAS_PREVIEW_SIZE && (
                  <button
                    type="button"
                    onClick={() => setShowAllOtherAreas((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] transition hover:underline"
                  >
                    <span>
                      {showAllOtherAreas
                        ? t.showLessBtn
                        : `${t.showAllBtn} (${unitsInOtherAreas.length})`}
                    </span>
                    <ChevronLeft className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
                {(showAllOtherAreas
                  ? unitsInOtherAreas
                  : unitsInOtherAreas.slice(0, OTHER_AREAS_PREVIEW_SIZE)
                ).map((u) => (
                  <BuyerUnitCard
                    key={u.id}
                    t={t}
                    unit={u}
                    isLiked={favoriteIds.includes(String(u.id))}
                    onToggleLike={() => toggleFavorite(u.id)}
                  />
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
  const matchCount =
    (unit.isCashMatch ? 40 : 15) +
    (unit.isInstMatch ? 25 : 10) +
    (unit.isAreaMatch ? 20 : 5) +
    (unit.isTypeMatch ? 12 : 5)
  const scorePct = Math.min(98, Math.max(60, matchCount))

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

          <span className="absolute top-2.5 right-2.5 rounded-full bg-[#0a1122]/90 px-2.5 py-1 text-[10px] font-black text-emerald-300 shadow-sm backdrop-blur-xs">
            🎯 {scorePct}%
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
          className="inline-flex h-8 w-full items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-3 text-[11px] font-extrabold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] sm:h-9 sm:text-xs"
        >
          {t.myOffersBtn}
        </Link>
      </div>
    </div>
  )
}