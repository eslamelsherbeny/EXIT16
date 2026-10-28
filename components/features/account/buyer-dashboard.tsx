'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Compass,
  MapPin,
  MessageCircle,
  Radar,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'
import { updateBuyerPreferencesAction } from '@/actions/account-actions'
import {
  getCurrentSellerProfileAction,
  markUserPhoneVerifiedAction,
} from '@/actions/submit-forms'
import {
  getLocalizedUnitTypes,
  toEnglishDigits,
} from '@/components/features/seller/seller-shared'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { AccountActionLinks } from './delete-account-modal'
import type { SellerUnitItem } from './seller-dashboard'
import { BuyerEditPreferencesForm, BuyerUnitCard } from './buyer-unit-card'
import { BuyerFiltersBar } from './buyer-filters-bar'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import {
  calculateSmartMatch,
  evaluateGeorgiaAreaProximity,
  isNonGeorgianLegacyArea,
} from '@/lib/smart-matcher'

export type BuyerRequestItem = {
  id: string
  user_id?: string | null
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
const BUYER_WA_SENT_STORAGE_KEY = 'aqar_buyer_wa_fasttrack_sent'
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
  const currency = getCurrencySymbol('GE', locale)
  const listSep = dir === 'rtl' ? '، ' : ', '
  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )

  const localizedUnitTypes = useMemo(
    () => getLocalizedUnitTypes(dict, locale),
    [dict, locale]
  )

  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [visibleCount, setVisibleCount] = useState(PREFERRED_PAGE_SIZE)
  const [showAllNearbyAreas, setShowAllNearbyAreas] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const [currentUserId, setCurrentUserId] = useState('')
  const [waBoxHidden, setWaBoxHidden] = useState(false)

  useEffect(() => {
    try {
      const sentFlag = localStorage.getItem(
        `${BUYER_WA_SENT_STORAGE_KEY}_${buyReq?.id || 'default'}`
      )
      if (sentFlag === '1') {
        setWaBoxHidden(true)
      }
    } catch {}

    getCurrentSellerProfileAction().then((res) => {
      if (res.isLoggedIn && res.user) {
        setCurrentUserId(res.user.id)
        if (res.user.phoneVerified) {
          setWaBoxHidden(true)
        }
      }
    })
  }, [buyReq?.id])

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
      : [localizedUnitTypes[0] || '']
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
          u.unit_type || meta.unit_type || localizedUnitTypes[0] || ''
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

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'
  const targetBuyerUserId = buyReq?.user_id || currentUserId
  const adminVerifyLeadLink = `${siteOrigin}/admin/leads?verifyPhoneUserId=${encodeURIComponent(targetBuyerUserId)}&leadId=${encodeURIComponent(buyReq?.id || '')}`

  const buyerFastTrackWaMsg = `${t.waFastTrackMsgPrefix} (${bCash.toLocaleString('en-US')} ${currency}) — ${t.preferredAreasLabel}: (${localizedPreferredAreasNames.join(listSep)}).\n${adminVerifyLeadLink}`

  // بمجرد الضغط على زر الواتساب وفتح التطبيق يختفي الصندوق فوراً ويُحفظ ذلك
  const handleWhatsAppFastTrackClick = () => {
    setWaBoxHidden(true)
    try {
      localStorage.setItem(
        `${BUYER_WA_SENT_STORAGE_KEY}_${buyReq?.id || 'default'}`,
        '1'
      )
    } catch {}
    markUserPhoneVerifiedAction({
      userId: targetBuyerUserId,
      leadId: buyReq?.id,
    }).catch(() => {})
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
      <BuyerEditPreferencesForm
        t={t}
        dir={dir}
        isRtl={isRtl}
        locale={locale}
        currency={currency}
        listSep={listSep}
        bCash={bCash}
        setBCash={setBCash}
        bInstallment={bInstallment}
        setBInstallment={setBInstallment}
        bPlan={bPlan}
        setBPlan={setBPlan}
        bBudget={bBudget}
        setBBudget={setBBudget}
        bTypes={bTypes}
        setBTypes={setBTypes}
        bRooms={bRooms}
        setBRooms={setBRooms}
        bDelivery={bDelivery}
        setBDelivery={setBDelivery}
        bAreas={bAreas}
        setBAreas={setBAreas}
        localizedUnitTypes={localizedUnitTypes}
        localizedPreferredAreasNames={localizedPreferredAreasNames}
        confirmSaveOpen={confirmSaveOpen}
        setConfirmSaveOpen={setConfirmSaveOpen}
        isPending={isPending}
        onClose={() => setIsEditingBudget(false)}
        onExecuteSave={executeSavePreferences}
      />
    )
  }

  return (
    <div dir={dir} className="mx-auto max-w-[1020px] px-3 sm:px-6">
      {savedToast && (
        <div className="mb-4 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] p-3 text-center text-xs font-bold text-[var(--brand-primary,#007a5a)]">
          {t.savedToastMsg}
        </div>
      )}

      <ScrollReveal>
        <section className="overflow-hidden rounded-[22px] border border-gray-200/90 border-t-[3px] border-t-[var(--brand-primary,#007a5a)] bg-white p-5 text-start shadow-xs sm:p-6">
          <div className="flex flex-col gap-3.5 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
                <Radar className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-black text-[var(--brand-navy,#0a1122)] sm:text-xl">
                  {t.mainTitle}
                </h1>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  {t.radarActiveSubtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/account/offers?role=buyer"
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-[var(--brand-primary-light,#eaf8f2)]/70 px-4 py-2 text-center shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] hover:bg-[var(--brand-primary-light,#eaf8f2)] sm:flex-none"
              >
                <div className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
                  <span className="text-xs font-black text-[var(--brand-navy,#0a1122)] sm:text-sm">
                    {t.myOffersBtn}
                  </span>
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold text-[var(--brand-primary,#007a5a)]">
                  {offersCount > 0
                    ? `${offersCount} ${t.offersAvailableSub}`
                    : t.noOffersSub}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsEditingBudget(true)}
                className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] transition hover:border-[var(--brand-primary,#007a5a)] hover:text-[var(--brand-primary,#007a5a)] sm:flex-none"
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
                {t.specsSummaryLabel}
              </span>
              <strong className="mt-1 block truncate text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                {bTypes.join(listSep)} · {bRooms}+ {t.roomsWord}
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

          {!waBoxHidden && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#25D366]/40 bg-[#f0fdf4] p-3.5 sm:flex-row sm:items-center">
              <p className="text-xs leading-relaxed font-extrabold text-[#0a1122]">
                {t.fastTrackWaTitle}
              </p>
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(buyerFastTrackWaMsg)}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleWhatsAppFastTrackClick}
                className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>{t.fastTrackWaBtn}</span>
              </a>
            </div>
          )}
        </section>

        <BuyerFiltersBar
          t={t}
          oppFilters={oppFilters}
          locale={locale}
          currency={currency}
          activePills={activePills}
          togglePill={togglePill}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterPanelOpen={filterPanelOpen}
          setFilterPanelOpen={setFilterPanelOpen}
          activeFiltersCount={activeFiltersCount}
          onlyNegotiable={onlyNegotiable}
          setOnlyNegotiable={setOnlyNegotiable}
          totalAvailableCount={
            unitsInPreferredArea.length + unitsInTrulyNearbyAreas.length
          }
          sortBy={sortBy}
          setSortBy={setSortBy}
          areaFilter={areaFilter}
          setAreaFilter={setAreaFilter}
          maxCashFilter={maxCashFilter}
          setMaxCashFilter={setMaxCashFilter}
          maxInstFilter={maxInstFilter}
          setMaxInstFilter={setMaxInstFilter}
          maxContractFilter={maxContractFilter}
          setMaxContractFilter={setMaxContractFilter}
          selectedTypes={selectedTypes}
          toggleFilterType={toggleFilterType}
          localizedUnitTypes={localizedUnitTypes}
          delStatusFilter={delStatusFilter}
          setDelStatusFilter={setDelStatusFilter}
          delYearFilter={delYearFilter}
          setDelYearFilter={setDelYearFilter}
          conYearFilter={conYearFilter}
          setConYearFilter={setConYearFilter}
          minRoomsFilter={minRoomsFilter}
          setMinRoomsFilter={setMinRoomsFilter}
          clearAllFilters={clearAllFilters}
        />
      </ScrollReveal>

      {unitsInPreferredArea.length === 0 &&
      unitsInTrulyNearbyAreas.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
          <Radar className="mx-auto mb-3 size-9 text-slate-300" />
          <p className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)]">
            {t.emptyFilteredTitle}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {t.emptyNearbyHint}
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
              {t.browseAllMarketBtn}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {unitsInPreferredArea.length > 0 && (
            <section className="mt-7">
              <div className="mb-4 flex items-center gap-2 text-start">
                <MapPin className="size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
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
                  <Compass className="size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
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
