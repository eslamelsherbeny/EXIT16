'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Flame,
  Heart,
  ListFilter,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import {
  logoutAccountAction,
  updateBuyerPreferencesAction,
} from '@/app/actions/account-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AccountActionLinks } from './delete-account-modal'
import type { SellerUnitItem } from './seller-dashboard'

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
  created_at?: string | null
  notify_exact_match?: boolean | null
  notify_featured?: boolean | null
}

const POPULAR_AREAS = [
  'التجمع الخامس',
  'القاهرة الجديدة',
  'المستقبل سيتي',
  'العاصمة الإدارية',
  'الشيخ زايد',
  '6 أكتوبر',
  'الساحل الشمالي',
  'رأس الحكمة',
  'الشروق',
  'العين السخنة',
]

const buyerFilterPills = [
  'منطقتك',
  'الكاش المتاح',
  'أقصى قسط',
  'ميزانيتك',
  'نوع الوحدة',
  'عدد الغرف',
  'الاستلام',
]

const unitTypesList = [
  'شقة',
  'دوبلكس',
  'بنتهاوس',
  'تاون هاوس',
  'توين هاوس',
  'اي فيلا',
  'فيلا',
  'شاليه',
  'مكتب',
  'محل',
  'عيادة',
  'أرض',
]

const deliveryStatuses = ['الكل', 'جاهزة', 'تحت الإنشاء']
const deliveryYears = [
  'الكل',
  'حتى 2026',
  'حتى 2027',
  'حتى 2028',
  'حتى 2029',
  'حتى 2030',
  'حتى 2031',
]
const contractYears = [
  'الكل',
  '2025 أو أقدم',
  '2024 أو أقدم',
  '2023 أو أقدم',
  '2022 أو أقدم',
  '2021 أو أقدم',
  '2020 أو أقدم',
]
const roomOptions = ['الكل', '+1', '+2', '+3', '+4', '+5']
const sorts = [
  'الأحدث',
  'الفرص المميزة ⭐',
  'الأقل كاش',
  'أقل قسط',
  'الأكبر مكسب',
  'الأقرب للاستلام',
  'جاهزة للنقل',
]

const FAVORITES_STORAGE_KEY = 'darak_favorites'

function calcMonthlyInstallment(amount: number, freq: string | null) {
  if (!amount) return 0
  const f = (freq || '').trim()
  if (f.includes('ربع')) return Math.round(amount / 3)
  if (f.includes('نصف') || f.includes('نص')) return Math.round(amount / 6)
  if (f.includes('سنوي') && !f.includes('نصف') && !f.includes('ربع'))
    return Math.round(amount / 12)
  return amount
}

function formatMoneyHelper(val: number) {
  if (!val) return ''
  if (val >= 1_000_000)
    return `${(val / 1_000_000).toFixed(2).replace(/\.00$/, '')} مليون ج.م`
  if (val >= 1_000) return `${Math.round(val / 1_000)} ألف ج.م`
  return `${val.toLocaleString('en-US')} ج.م`
}

// فحص هل طلب الشراء هذا هو "حجز وحدة محددة" من صفحة الفرص أم "ميزانية عامة"
function isUnitReservationRequest(req: BuyerRequestItem) {
  const areasStr = Array.isArray(req.preferred_areas)
    ? req.preferred_areas.join(' ')
    : String(req.preferred_areas || '')
  const planStr = String(req.payment_plan || '')
  return (
    areasStr.includes('🎯') ||
    areasStr.includes('حجز وحدة') ||
    areasStr.includes('مهتم بوحدة') ||
    /U-[A-Z0-9]{4,}/i.test(areasStr) ||
    planStr.includes('مهتم بوحدة')
  )
}

// تنظيف اسم المنطقة من أي رموز حجز وحدة
function extractCleanAreas(areas: string[] | null | undefined): string[] {
  if (!Array.isArray(areas) || areas.length === 0) return ['التجمع الخامس']
  const cleaned = areas
    .map((a) => {
      if (a.includes(' - ')) {
        const parts = a.split(' - ')
        return parts[parts.length - 1].trim()
      }
      return a
        .replace(/🎯/g, '')
        .replace(/حجز وحدة:/g, '')
        .replace(/مهتم بوحدة:/g, '')
        .replace(/\(U-[^)]+\)/gi, '')
        .trim()
    })
    .filter(Boolean)

  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : ['التجمع الخامس']
}

export function BuyerDashboard({
  buyReq,
  allBuyRequests = [],
  marketUnits,
  deletionRequested = false,
}: {
  buyReq: BuyerRequestItem | null
  allBuyRequests?: BuyerRequestItem[]
  marketUnits: SellerUnitItem[]
  deletionRequested?: boolean
}) {
  // التبديل بين الشاشات: الفرص ('feed') | تعديل الميزانية ('edit') | وحدات مهتم بها ('reserved') | المفضلة ('favorites')
  const [activeSubView, setActiveSubView] = useState<
    'feed' | 'edit' | 'reserved' | 'favorites'
  >('feed')

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [isPending, startTransition] = useTransition()

  // فصل طلب الميزانية العام عن طلبات حجز الوحدات المحددة
  const allRequestsList = useMemo(() => {
    if (allBuyRequests && allBuyRequests.length > 0) return allBuyRequests
    return buyReq ? [buyReq] : []
  }, [allBuyRequests, buyReq])

  const generalBuyReq = useMemo(() => {
    return (
      allRequestsList.find((r) => !isUnitReservationRequest(r)) ||
      buyReq ||
      null
    )
  }, [allRequestsList, buyReq])

  const unitReservations = useMemo(() => {
    return allRequestsList.filter((r) => isUnitReservationRequest(r))
  }, [allRequestsList])

  // إدارة المفضلة (Favorites) مع المزامنة الفورية
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

  // التحكم في عدد الكروت المعروضة (قصير ومريح على الموبايل والكمبيوتر)
  const [visiblePreferredCount, setVisiblePreferredCount] = useState(6)
  const [showAllOtherAreas, setShowAllOtherAreas] = useState(false)

  // بيانات الميزانية القابلة للتعديل (نظيفة تماماً من نصوص حجز الوحدات)
  const [bCash, setBCash] = useState<number>(
    Number(generalBuyReq?.available_cash || generalBuyReq?.budget || 3000000)
  )
  const [bInstallment, setBInstallment] = useState<number>(
    Number(generalBuyReq?.max_installment || 100000)
  )
  const [bPlan, setBPlan] = useState<string>(
    generalBuyReq?.payment_plan && !generalBuyReq.payment_plan.includes('مهتم')
      ? generalBuyReq.payment_plan
      : 'شهري'
  )
  const [bBudget, setBBudget] = useState<number>(
    Number(generalBuyReq?.budget || 3500000)
  )
  const [bTypes, setBTypes] = useState<string[]>(
    Array.isArray(generalBuyReq?.unit_types) &&
      generalBuyReq.unit_types.length > 0
      ? generalBuyReq.unit_types
      : ['شقة']
  )
  const [bRooms, setBRooms] = useState<number>(
    Number(generalBuyReq?.min_rooms || 3)
  )
  const [bDelivery, setBDelivery] = useState<string>(
    generalBuyReq?.delivery_status || 'جاهزة للاستلام'
  )
  const [bAreas, setBAreas] = useState<string[]>(() =>
    extractCleanAreas(generalBuyReq?.preferred_areas)
  )
  const [newAreaInput, setNewAreaInput] = useState('')
  const [notifyExact, setNotifyExact] = useState<boolean>(
    generalBuyReq?.notify_exact_match ?? true
  )
  const [notifyFeatured, setNotifyFeatured] = useState<boolean>(
    generalBuyReq?.notify_featured ?? true
  )

  // حالات الفلاتر
  const [activePills, setActivePills] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [onlyNegotiable, setOnlyNegotiable] = useState(false)
  const [sortBy, setSortBy] = useState('الأحدث')

  const [areaFilter, setAreaFilter] = useState('')
  const [maxCashFilter, setMaxCashFilter] = useState('')
  const [maxInstFilter, setMaxInstFilter] = useState('')
  const [maxContractFilter, setMaxContractFilter] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [delStatusFilter, setDelStatusFilter] = useState('الكل')
  const [delYearFilter, setDelYearFilter] = useState('الكل')
  const [conYearFilter, setConYearFilter] = useState('الكل')
  const [minRoomsFilter, setMinRoomsFilter] = useState('الكل')

  useEffect(() => {
    setVisiblePreferredCount(6)
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

  const addAreaFromInput = () => {
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

  const toggleFilterType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
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
    setDelStatusFilter('الكل')
    setDelYearFilter('الكل')
    setConYearFilter('الكل')
    setMinRoomsFilter('الكل')
  }

  // تجهيز الوحدات مع شارات التطابق
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
        rawDel.includes('مستلم')
      const deliveryStatus: 'جاهزة' | 'تحت الإنشاء' = isReady
        ? 'جاهزة'
        : 'تحت الإنشاء'
      const yearMatch = rawDel.match(/20\d{2}/)
      const deliveryYear = yearMatch ? Number(yearMatch[0]) : 2027

      const unitArea = u.area || 'التجمع الخامس'
      const unitType = u.unit_type || 'شقة'

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
        bTypes.some((t) => unitType.includes(t) || t.includes(unitType))

      if (isCashMatch) matchTags.push('الكاش في ميزانيتك')
      if (isInstMatch) matchTags.push('القسط مناسب')
      if (isAreaMatch) matchTags.push('في منطقتك')
      else if (isTypeMatch) matchTags.push('نفس نوع الوحدة')

      return {
        id: String(u.id),
        title: u.project_name || 'وحدة سكنية معتمدة',
        subtitle: `${u.developer_name || 'مطور عقاري'} · ${unitArea} · ${unitType}`,
        area: unitArea,
        type: unitType,
        rooms: Number(u.rooms) || 3,
        size: Number(u.size) || 150,
        cashNum: paid,
        cashStr: paid.toLocaleString('en-US'),
        contractNum: contract,
        marketNum: market,
        marketStr: market.toLocaleString('en-US'),
        gainNum: gainVal,
        gainStr: gainVal > 0 ? `+ ${gainVal.toLocaleString('en-US')}` : '',
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
  }, [marketUnits, bCash, bInstallment, bPlan, bAreas, bTypes])

  // تطبيق الفلاتر
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
        delStatusFilter !== 'الكل' &&
        item.deliveryStatus !== delStatusFilter
      ) {
        return false
      }
      if (delYearFilter !== 'الكل') {
        const y = Number(delYearFilter.replace(/[^0-9]/g, ''))
        if (y && item.deliveryYear > y) return false
      }
      if (conYearFilter !== 'الكل') {
        const y = Number(conYearFilter.replace(/[^0-9]/g, ''))
        if (y && item.contractYear > y) return false
      }
      if (minRoomsFilter !== 'الكل') {
        const r = Number(minRoomsFilter.replace('+', ''))
        if (item.rooms < r) return false
      }
      if (maxCashVal > 0 && item.cashNum > maxCashVal) return false
      if (maxInstVal > 0 && item.monthlyInst > maxInstVal) return false
      if (maxConVal > 0 && item.contractNum > maxConVal) return false

      if (activePills.includes('منطقتك') && !item.isAreaMatch) return false
      if (activePills.includes('الكاش المتاح') && !item.isCashMatch)
        return false
      if (activePills.includes('أقصى قسط') && !item.isInstMatch) return false
      if (
        activePills.includes('ميزانيتك') &&
        bBudget > 0 &&
        item.contractNum > bBudget * 1.15
      )
        return false
      if (activePills.includes('نوع الوحدة') && !item.isTypeMatch) return false
      if (activePills.includes('عدد الغرف') && item.rooms < bRooms)
        return false
      if (activePills.includes('الاستلام')) {
        const wantReady = bDelivery.includes('جاهز')
        if (wantReady && item.deliveryStatus !== 'جاهزة') return false
      }

      return true
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'الأقل كاش') return a.cashNum - b.cashNum
      if (sortBy === 'أقل قسط') return a.monthlyInst - b.monthlyInst
      if (sortBy === 'الأكبر مكسب' || sortBy === 'الفرص المميزة ⭐')
        return b.gainNum - a.gainNum
      if (sortBy === 'الأقرب للاستلام') return a.deliveryYear - b.deliveryYear
      if (sortBy === 'جاهزة للنقل')
        return a.deliveryStatus === 'جاهزة' ? -1 : 1
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
  ])

  const activeFiltersCount = useMemo(() => {
    let c = activePills.length + selectedTypes.length
    if (onlyNegotiable) c++
    if (areaFilter.trim()) c++
    if (maxCashFilter.trim()) c++
    if (maxInstFilter.trim()) c++
    if (maxContractFilter.trim()) c++
    if (delStatusFilter !== 'الكل') c++
    if (delYearFilter !== 'الكل') c++
    if (conYearFilter !== 'الكل') c++
    if (minRoomsFilter !== 'الكل') c++
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
  ])

  // تقسيم الوحدات إلى:
  // 1) وحدات في منطقتك المحددة ومناسبة لميزانيتك
  // 2) وحدات في مناطق أخرى ولكن مناسبة لميزانيتك
  const unitsInPreferredArea = useMemo(
    () => filteredUnits.filter((u) => u.isAreaMatch),
    [filteredUnits]
  )
  const unitsInOtherAreas = useMemo(
    () => filteredUnits.filter((u) => !u.isAreaMatch && u.isCashMatch),
    [filteredUnits]
  )
  const favoriteUnitsList = useMemo(
    () => mappedUnits.filter((u) => favoriteIds.includes(String(u.id))),
    [mappedUnits, favoriteIds]
  )

  const handleOpenSaveConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    // لو العميل كتب منطقة في الحقل ولم يضغط إضافة، نضيفها تلقائياً قبل الحفظ
    if (newAreaInput.trim()) {
      addAreaFromInput()
    }
    setConfirmSaveOpen(true)
  }

  const executeSavePreferences = () => {
    startTransition(async () => {
      const res = await updateBuyerPreferencesAction({
        buyRequestId: generalBuyReq?.id,
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
        setActiveSubView('feed')
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 4000)
      }
    })
  }

  // ==================== الشريط العلوي الموحد (نظيف تماماً: تسجيل الخروج فقط في الأعلى) ====================
  const TopCleanBar = () => (
    <div className="mb-4 flex items-center justify-between border-b border-gray-200/80 pb-3.5">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveSubView('feed')}
          className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
            activeSubView === 'feed'
              ? 'bg-[#0b6954] text-white shadow-2xs'
              : 'bg-white text-[#0a1122] border border-gray-200 hover:bg-gray-50'
          }`}
        >
          الفرص المطابقة
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('favorites')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
            activeSubView === 'favorites'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'bg-white text-[#0a1122] border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Heart
            className={`size-3.5 ${
              activeSubView === 'favorites'
                ? 'fill-current text-white'
                : 'fill-red-500 text-red-500'
            }`}
          />
          <span>المفضلة ({favoriteIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('reserved')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
            activeSubView === 'reserved'
              ? 'bg-[#0a1122] text-white shadow-2xs'
              : 'bg-white text-[#0a1122] border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Flame className="size-3.5 text-amber-500" />
          <span>وحدات حجزتها ({unitReservations.length})</span>
        </button>
      </div>

      {/* زر تسجيل الخروج فقط في الأعلى بدون زحام */}
      <form action={logoutAccountAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <span>خروج</span>
          <LogOut className="size-3.5" />
        </button>
      </form>
    </div>
  )

  // ==================== 1. شاشة "عدّل ميزانيتك" (مع زر رجوع + إضافة عدة مناطق + رسالة تأكيد) ====================
  if (activeSubView === 'edit') {
    return (
      <div className="mx-auto max-w-[660px] px-3 py-2 sm:px-6">
        {/* زر الرجوع العلوي */}
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveSubView('feed')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#0b6954] hover:text-[#0b6954]"
          >
            <ArrowRight className="size-4" />
            <span>رجوع للفرص</span>
          </button>

          <form action={logoutAccountAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600"
            >
              <span>تسجيل الخروج</span>
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>

        <header className="mb-6 text-right">
          <h1 className="text-xl font-black text-[#0a1122] sm:text-2xl">
            عدّل قدرتك الشرائية وتفضيلاتك
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            حدّد المناطق اللي بتدور فيها وميزانيتك عشان نرتب لك الفرص الأنسب ليك أولاً.
          </p>
        </header>

        <form onSubmit={handleOpenSaveConfirm} className="space-y-6">
          <div className="space-y-6 rounded-[22px] border border-gray-200/80 bg-white p-5 text-right shadow-xs sm:p-8">
            {/* المناطق اللي تهمك (متعددة الاختيار + إضافة يدوية بزر واضح) */}
            <div>
              <label className="mb-2 block text-xs font-extrabold text-[#0a1122]">
                المناطق اللي بتدوّر فيها (تقدر تختار أكتر من منطقة)
              </label>

              {/* المناطق المختارة حالياً */}
              <div className="mb-3 flex flex-wrap gap-1.5 rounded-xl border border-emerald-200/80 bg-[#eff9f5]/60 p-3">
                {bAreas.map((ar) => (
                  <span
                    key={ar}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0b6954] px-3 py-1 text-xs font-bold text-white shadow-2xs"
                  >
                    <MapPin className="size-3" />
                    <span>{ar}</span>
                    {bAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setBAreas((prev) => prev.filter((x) => x !== ar))
                        }
                        className="rounded-full p-0.5 hover:bg-black/20"
                        title="حذف المنطقة"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* أزرار اختيار سريع لأشهر المناطق بضغطة واحدة */}
              <p className="mb-2 text-[11px] font-bold text-gray-500">
                اضغط لإضافة أو إزالة أي منطقة فوراً:
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {POPULAR_AREAS.map((popArea) => {
                  const isSelected = bAreas.includes(popArea)
                  return (
                    <button
                      key={popArea}
                      type="button"
                      onClick={() => togglePopularArea(popArea)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                        isSelected
                          ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954]'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected ? `✓ ${popArea}` : `+ ${popArea}`}
                    </button>
                  )
                })}
              </div>

              {/* حقل كتابة منطقة مخصصة + زر إضافة واضح للموبايل */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAreaFromInput()
                    }
                  }}
                  placeholder="اكتب اسم أي منطقة تانية..."
                  className="h-11 flex-1 rounded-xl border border-gray-200 px-3.5 text-xs focus:border-[#0b6954] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addAreaFromInput}
                  className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-[#0a1122] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]"
                >
                  <Plus className="size-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {/* الكاش المتاح */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                الكاش المتاح دلوقتي <span className="text-red-500">*</span>
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
                  className="h-12 w-full rounded-xl border border-gray-200 pr-4 pl-12 text-left text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                />
                <span className="absolute top-3.5 right-3.5 text-xs text-gray-400">
                  ج.م
                </span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                {formatMoneyHelper(bCash)}
              </p>
            </div>

            {/* أقصى قسط يريحك */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                أقصى قسط يريحك <span className="text-red-500">*</span>
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
                  className="h-12 w-full rounded-xl border border-gray-200 pr-4 pl-12 text-left text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                />
                <span className="absolute top-3.5 right-3.5 text-xs text-gray-400">
                  ج.م
                </span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                {formatMoneyHelper(bInstallment)}
              </p>
            </div>

            {/* نظام القسط */}
            <div>
              <label className="mb-2.5 block text-xs font-bold text-[#0a1122]">
                نظام القسط
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['شهري', 'ربع سنوي (كل 3 شهور)', 'نصف سنوي', 'سنوي'].map(
                  (plan) => (
                    <label
                      key={plan}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-xs font-bold transition ${
                        bPlan === plan
                          ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954]'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      <span>{plan}</span>
                      <input
                        type="radio"
                        checked={bPlan === plan}
                        onChange={() => setBPlan(plan)}
                        className="accent-[#0b6954]"
                      />
                    </label>
                  )
                )}
              </div>
            </div>

            {/* سعر التعاقد المستهدف */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                سعر التعاقد المستهدف (الميزانية الإجمالية)
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
                  className="h-12 w-full rounded-xl border border-gray-200 pr-4 pl-12 text-left text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                />
                <span className="absolute top-3.5 right-3.5 text-xs text-gray-400">
                  ج.م
                </span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                {formatMoneyHelper(bBudget)}
              </p>
            </div>

            {/* نوع الوحدة */}
            <div>
              <label className="mb-2.5 block text-xs font-bold text-[#0a1122]">
                نوع الوحدة اللي بتدوّر عليها
              </label>
              <div className="flex flex-wrap gap-2">
                {unitTypesList.map((t) => {
                  const active = bTypes.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setBTypes((prev) =>
                          prev.includes(t)
                            ? prev.length > 1
                              ? prev.filter((x) => x !== t)
                              : prev
                            : [...prev, t]
                        )
                      }
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954]'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {active ? `✓ ${t}` : t}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* أقل عدد غرف + الاستلام */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                  أقل عدد غرف
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={bRooms}
                    onChange={(e) => setBRooms(Number(e.target.value) || 0)}
                    className="h-11 w-24 rounded-xl border border-gray-200 text-center text-sm font-bold text-[#0a1122]"
                  />
                  <span className="text-xs text-gray-500">غرف</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                  الاستلام
                </label>
                <div className="flex gap-2">
                  {['جاهزة للاستلام', 'تحت الإنشاء'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBDelivery(st)}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                        bDelivery === st
                          ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954]'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* أزرار الحفظ والرجوع */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="h-12 flex-1 rounded-xl bg-[#0b6954] text-sm font-bold text-white shadow-xs transition hover:bg-[#095443]"
              >
                احفظ وشوف الفرص
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('feed')}
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-5 text-xs font-bold text-gray-600 transition hover:bg-gray-100"
              >
                إلغاء والرجوع
              </button>
            </div>
          </div>
        </form>

        {/* نافذة التأكيد الملمومة قبل حفظ الميزانية */}
        <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
          <DialogContent
            dir="rtl"
            className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
          >
            <DialogHeader className="text-right">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#0b6954]">
                  <ShieldAlert className="size-4" />
                </span>
                <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  تأكيد حفظ الميزانية والتفضيلات
                </DialogTitle>
              </div>
              <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                سيتم تحديث الكاش المتاح إلى{' '}
                <strong className="text-[#0a1122]">
                  ({bCash.toLocaleString('en-US')} ج.م)
                </strong>{' '}
                والمناطق المفضلة إلى{' '}
                <strong className="text-[#0b6954]">
                  ({bAreas.join('، ')})
                </strong>{' '}
                وإعادة ترتيب الفرص بناءً عليها.
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
                مراجعة التعديلات
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={executeSavePreferences}
                className="h-9 flex-1 rounded-xl bg-[#0b6954] text-xs font-bold text-white hover:bg-[#095443]"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    جاري الحفظ...
                  </span>
                ) : (
                  'نعم، احفظ الآن'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ==================== 2. شاشة "المفضلة ❤️" داخل الحساب ====================
  if (activeSubView === 'favorites') {
    return (
      <div className="mx-auto max-w-[1020px] px-3 sm:px-6">
        <TopCleanBar />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-right">
            <h1 className="text-lg font-extrabold text-[#0a1122] sm:text-2xl">
              وحداتي المفضلة ({favoriteUnitsList.length})
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              الوحدات التي قمت بحفظها بالضغط على علامة القلب أثناء تصفح الفرص.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubView('feed')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
          >
            <ArrowRight className="size-3.5" />
            <span>رجوع للفرص</span>
          </button>
        </div>

        {favoriteUnitsList.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
            <Heart className="mx-auto mb-3 size-10 text-gray-300" />
            <p className="text-sm font-extrabold text-[#0a1122]">
              قائمة المفضلة فارغة حالياً
            </p>
            <p className="mt-1 text-xs text-gray-500">
              اضغط على علامة القلب أعلى أي وحدة تعجبك لتجدها محفوظة هنا في أي وقت.
            </p>
            <button
              type="button"
              onClick={() => setActiveSubView('feed')}
              className="mt-5 rounded-xl bg-[#0b6954] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#095443]"
            >
              تصفح الفرص الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3">
            {favoriteUnitsList.map((u) => (
              <BuyerUnitCard
                key={u.id}
                unit={u}
                isLiked={favoriteIds.includes(String(u.id))}
                onToggleLike={() => toggleFavorite(u.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-6">
          <AccountActionLinks
            unitsCount={0}
            initialDeletionRequested={deletionRequested}
            position="bottom"
          />
        </div>
      </div>
    )
  }

  // ==================== 3. شاشة "وحدات حجزتها 🎯" (الوحدات التي ملأ لها نموذج اهتمام) ====================
  if (activeSubView === 'reserved') {
    return (
      <div className="mx-auto max-w-[1020px] px-3 sm:px-6">
        <TopCleanBar />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-right">
            <h1 className="text-lg font-extrabold text-[#0a1122] sm:text-2xl">
              وحدات طلبت حجزها أو الاستفسار عنها ({unitReservations.length})
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              هذه الوحدات قمت بملء نموذج الاهتمام بها ويتابعها معك مسؤول الحالة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubView('feed')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
          >
            <ArrowRight className="size-3.5" />
            <span>رجوع للفرص</span>
          </button>
        </div>

        {unitReservations.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
            <Building2 className="mx-auto mb-3 size-10 text-gray-300" />
            <p className="text-sm font-extrabold text-[#0a1122]">
              لم تقم بحجز أي وحدة محددة بعد
            </p>
            <p className="mt-1 text-xs text-gray-500">
              عندما تعجبك فرصة وتملأ نموذج «عايز تلحق تحجز الفرصة دي؟» ستظهر هنا لمتابعة حالتها.
            </p>
            <button
              type="button"
              onClick={() => setActiveSubView('feed')}
              className="mt-5 rounded-xl bg-[#0b6954] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#095443]"
            >
              استعرض الفرص المتاحة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {unitReservations.map((req) => {
              const titleText = Array.isArray(req.preferred_areas)
                ? req.preferred_areas[0] || 'وحدة عقارية'
                : String(req.preferred_areas || 'وحدة عقارية')
              const cleanTitle = titleText
                .replace('🎯 مهتم بوحدة:', '')
                .replace('🎯 حجز وحدة:', '')
                .trim()
              const st = req.status || 'new'
              const statusBadge =
                st === 'contacted'
                  ? { label: 'تم التواصل معك', cls: 'bg-amber-100 text-amber-800' }
                  : st === 'matched'
                    ? { label: 'جاري ترتيب المعاينة', cls: 'bg-purple-100 text-purple-800' }
                    : st === 'closed'
                      ? { label: 'تم التعاقد', cls: 'bg-emerald-100 text-emerald-800' }
                      : { label: 'قيد المراجعة والتواصل', cls: 'bg-blue-100 text-blue-800' }

              return (
                <div
                  key={req.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 text-right shadow-2xs sm:p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold text-orange-700">
                        <Flame className="size-3 fill-orange-500" />
                        <span>طلب اهتمام بوحدة</span>
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadge.cls}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-[#0a1122] sm:text-base">
                      {cleanTitle}
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs">
                      <div>
                        <span className="block text-[10px] text-gray-400">
                          الكاش المطلوب للوحدة
                        </span>
                        <strong className="font-extrabold text-[#0b6954] tabular-nums">
                          {Number(req.available_cash || 0).toLocaleString('en-US')} ج.م
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">
                          قسط الوحدة
                        </span>
                        <strong className="font-extrabold text-[#0a1122] tabular-nums">
                          {Number(req.max_installment || 0).toLocaleString('en-US')} ج.م
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {req.created_at
                        ? new Date(req.created_at).toLocaleDateString('ar-EG')
                        : 'حديثاً'}
                    </span>
                    <Link
                      href="/opportunities"
                      className="font-bold text-[#0b6954] hover:underline"
                    >
                      عرض في الفرص ←
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-6">
          <AccountActionLinks
            unitsCount={0}
            initialDeletionRequested={deletionRequested}
            position="bottom"
          />
        </div>
      </div>
    )
  }

  // ==================== 4. الشاشة الرئيسية للمشتري: "فرص تناسب ميزانيتك" ====================
  return (
    <div className="mx-auto max-w-[1020px] px-3 sm:px-6">
      <TopCleanBar />

      {savedToast && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-[#eff9f5] p-3 text-center text-xs font-bold text-[#0b6954]">
          ✓ تم تحديث قدرتك الشرائية وتفضيلاتك بنجاح!
        </div>
      )}

      {/* بطاقة ملخص الميزانية والمناطق المدمجة */}
      <section className="rounded-2xl border border-gray-200/80 bg-white p-4 text-right shadow-2xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-[#0a1122] sm:text-2xl">
              فرص تناسب ميزانيتك
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              مرتبة تلقائياً حسب منطقتك المفضلة وقدرتك المالية.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubView('edit')}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#eff9f5] px-3.5 text-xs font-extrabold text-[#0b6954] transition hover:bg-[#dff3eb] sm:h-10 sm:px-4"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>عدّل ميزانيتك ومناطقك</span>
          </button>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 text-xs">
          <div>
            <span className="text-gray-400">الكاش المتاح: </span>
            <strong className="font-extrabold text-[#0b6954] tabular-nums">
              {bCash.toLocaleString('en-US')} ج.م
            </strong>
          </div>
          <div>
            <span className="text-gray-400">أقصى قسط: </span>
            <strong className="font-extrabold text-[#0a1122] tabular-nums">
              {bInstallment.toLocaleString('en-US')} ج.م
            </strong>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-gray-400">مناطقك: </span>
            {bAreas.map((area) => (
              <span
                key={area}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-[#0a1122]"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* شريط "فلتر بطلبك" التفاعلي */}
      <section className="mt-3.5 text-right">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none sm:flex-wrap">
          <span className="ml-1 shrink-0 text-xs font-extrabold text-[#0a1122]">
            فلتر بطلبك:
          </span>
          {buyerFilterPills.map((pill) => {
            const isSelected = activePills.includes(pill)
            return (
              <button
                key={pill}
                type="button"
                onClick={() => togglePill(pill)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                  isSelected
                    ? 'border-[#0b6954] bg-[#0b6954] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#0b6954]'
                }`}
              >
                {pill}
              </button>
            )
          })}
        </div>
      </section>

      {/* شريط البحث والفلترة والترتيب */}
      <section className="mt-3 rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دوّر باسم المشروع أو المنطقة أو كود الوحدة..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none sm:h-11 sm:text-sm"
          />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                filterPanelOpen || activeFiltersCount > 0
                  ? 'border-[#0b6954] bg-[#eff8f6] text-[#0b6954]'
                  : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
              }`}
            >
              <ListFilter className="size-3.5" />
              <span>فلترة</span>
              {activeFiltersCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-[#0b6954] text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOnlyNegotiable(!onlyNegotiable)}
              className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition ${
                onlyNegotiable
                  ? 'border-[#d97706] bg-amber-50/70 text-[#b45309]'
                  : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
              }`}
            >
              <span>قابل للتفاوض</span>
              <ArrowDown className="size-3 text-[#d97706]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">ترتيب</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 min-w-[125px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
              >
                {sorts.map((s) => (
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
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2.5">
            {onlyNegotiable && (
              <button
                type="button"
                onClick={() => setOnlyNegotiable(false)}
                className="inline-flex items-center gap-1 rounded-full bg-[#eff9f5] px-2.5 py-1 text-[11px] font-bold text-[#0b6954]"
              >
                <span>قابل للتفاوض</span>
                <X className="size-3" />
              </button>
            )}
            {activePills.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePill(p)}
                className="inline-flex items-center gap-1 rounded-full bg-[#eff9f5] px-2.5 py-1 text-[11px] font-bold text-[#0b6954]"
              >
                <span>{p}</span>
                <X className="size-3" />
              </button>
            ))}
            {selectedTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleFilterType(t)}
                className="inline-flex items-center gap-1 rounded-full bg-[#eff9f5] px-2.5 py-1 text-[11px] font-bold text-[#0b6954]"
              >
                <span>{t}</span>
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="mr-1 text-[11px] text-gray-400 underline hover:text-[#0a1122]"
            >
              مسح الكل
            </button>
          </div>
        )}
      </section>

      {/* لوحة الفلترة المتقدمة */}
      {filterPanelOpen && (
        <section className="mt-3 rounded-[20px] border border-gray-200/80 bg-white p-4 text-right shadow-xs sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                المناطق
              </label>
              <input
                type="text"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                placeholder="دوّر على المنطقة..."
                className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                أقصى كاش مطلوب دلوقتي
              </label>
              <input
                type="number"
                value={maxCashFilter}
                onChange={(e) => setMaxCashFilter(e.target.value)}
                placeholder="ج.م"
                className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                أقصى قسط شهري
              </label>
              <input
                type="number"
                value={maxInstFilter}
                onChange={(e) => setMaxInstFilter(e.target.value)}
                placeholder="ج.م"
                className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-[#0a1122]">نوع الوحدة</p>
            <div className="flex flex-wrap gap-1.5">
              {unitTypesList.map((t) => {
                const active = selectedTypes.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleFilterType(t)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                      active
                        ? 'border-[#0b6954] bg-[#0b6954] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1.5 text-xs font-bold text-[#0a1122]">الاستلام</p>
              <div className="flex flex-wrap gap-1.5">
                {deliveryStatuses.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDelStatusFilter(st)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                      delStatusFilter === st
                        ? 'border-[#0b6954] bg-[#0b6954] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-[#0a1122]">
                أقل عدد غرف
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roomOptions.map((rm) => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => setMinRoomsFilter(rm)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                      minRoomsFilter === rm
                        ? 'border-[#0b6954] bg-[#0b6954] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span dir="ltr">{rm}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                أقصى سعر تعاقد
              </label>
              <input
                type="number"
                value={maxContractFilter}
                onChange={(e) => setMaxContractFilter(e.target.value)}
                placeholder="ج.م"
                className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-xl bg-[#0b6954] px-5 py-2 text-xs font-bold text-white"
              >
                اعرض النتائج
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-gray-500 hover:text-[#0a1122]"
              >
                مسح الكل
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="text-xs font-medium text-gray-400 hover:text-gray-700"
            >
              إخفاء
            </button>
          </div>
        </section>
      )}

      {/* ==================== عرض الفرص المقسم بوضوح ==================== */}
      {filteredUnits.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
          <p className="text-sm font-bold text-gray-600">
            مفيش وحدات مطابقة للفلاتر اللي اخترتها حالياً.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 rounded-xl bg-[#0b6954] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#095443]"
          >
            امسح الفلاتر
          </button>
        </div>
      ) : (
        <>
          {/* القسم الأول: الفرص المطابقة في منطقتك (مع الـ Pagination الوحيد هنا) */}
          <section className="mt-6">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-right text-sm font-extrabold text-[#0a1122] sm:text-base">
                الفرص في المنطقة اللي طلبتها ({bAreas.join('، ')}){' '}
                <span className="font-normal text-gray-400">
                  ({unitsInPreferredArea.length})
                </span>
              </h2>
            </div>

            {unitsInPreferredArea.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
                لا توجد حالياً وحدات معروضة في ({bAreas.join('، ')}) بهذه الشروط — تصفح الفرص المناسبة لميزانيتك في المناطق الأخرى بالأسفل أو عدّل مناطقك.
              </div>
            ) : (
              <>
                {/* كارتين في الصف على الموبايل، و3 على الكمبيوتر */}
                <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3">
                  {unitsInPreferredArea
                    .slice(0, visiblePreferredCount)
                    .map((u) => (
                      <BuyerUnitCard
                        key={u.id}
                        unit={u}
                        isLiked={favoriteIds.includes(String(u.id))}
                        onToggleLike={() => toggleFavorite(u.id)}
                      />
                    ))}
                </div>

                {/* زر الـ Pagination للقسم الأول فقط */}
                {unitsInPreferredArea.length > visiblePreferredCount && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisiblePreferredCount((prev) => prev + 8)
                      }
                      className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-xs font-bold text-[#0a1122] shadow-2xs transition hover:border-[#0b6954] hover:bg-gray-50 active:scale-95"
                    >
                      اعرض{' '}
                      {Math.min(
                        8,
                        unitsInPreferredArea.length - visiblePreferredCount
                      )}{' '}
                      فرصة كمان في منطقتك (
                      {unitsInPreferredArea.length - visiblePreferredCount}{' '}
                      متبقية)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* القسم الثاني: فرص مناسبة لميزانيتك في مناطق تانية (معاينة قصيرة + زر عرض الكل بجانب العنوان بدون Pagination سفلي) */}
          {unitsInOtherAreas.length > 0 && (
            <section className="mt-9 border-t border-gray-200/70 pt-7">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-right">
                  <Star className="size-4 fill-amber-400 text-amber-500" />
                  <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                    فرص مناسبة لميزانيتك في مناطق تانية (
                    {unitsInOtherAreas.length})
                  </h2>
                </div>

                {unitsInOtherAreas.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllOtherAreas((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0b6954] hover:underline"
                  >
                    <span>
                      {showAllOtherAreas
                        ? 'عرض عدد أقل'
                        : `عرض المزيد (${unitsInOtherAreas.length})`}
                    </span>
                    <ChevronLeft className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3">
                {(showAllOtherAreas
                  ? unitsInOtherAreas
                  : unitsInOtherAreas.slice(0, 4)
                ).map((u) => (
                  <BuyerUnitCard
                    key={u.id}
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

      {/* شريط أزرار الحساب الكامل في الأسفل فقط */}
      <div className="mt-10 border-t border-gray-200 pt-5">
        <AccountActionLinks
          unitsCount={0}
          initialDeletionRequested={deletionRequested}
          position="bottom"
        />
      </div>
    </div>
  )
}

// ==================== كارت الوحدة المدمج والمتناسق للموبايل والكمبيوتر ====================
function BuyerUnitCard({
  unit,
  isLiked,
  onToggleLike,
}: {
  unit: any
  isLiked: boolean
  onToggleLike: () => void
}) {
  return (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[14px] border border-gray-200/85 bg-white shadow-2xs transition hover:shadow-md sm:rounded-[18px]">
      <div>
        <div className="relative h-[120px] w-full overflow-hidden bg-gray-100 sm:h-[170px]">
          <Link href={`/opportunities/${unit.id}`} className="block h-full w-full">
            <img
              src={
                unit.image ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
              }
              alt={unit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* زر القلب (المفضلة) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onToggleLike()
            }}
            aria-label="إضافة للمفضلة"
            className={`absolute top-2 left-2 flex size-7 items-center justify-center rounded-full shadow-md transition sm:size-8 ${
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`size-3.5 sm:size-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        <Link
          href={`/opportunities/${unit.id}`}
          className="block p-3 text-right sm:p-4"
        >
          <h3 className="line-clamp-1 min-h-[20px] text-xs font-extrabold leading-snug text-[#0a1122] group-hover:text-[#0b6954] sm:line-clamp-2 sm:min-h-[40px] sm:text-[15px]">
            {unit.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-500 sm:text-xs">
            {unit.subtitle}
          </p>

          <div className="mt-2.5 sm:mt-3.5">
            <p className="text-[10px] text-gray-400 sm:text-[11px]">
              المطلوب كاش دلوقتي
            </p>
            <p className="mt-0.5 text-sm font-extrabold tracking-tight text-[#0a1122] tabular-nums sm:text-xl">
              {unit.cashStr}{' '}
              <span className="text-[10px] font-semibold sm:text-xs">ج.م</span>
            </p>
          </div>

          {unit.gainStr && (
            <div className="mt-2 rounded-lg bg-[#eff9f5] px-2.5 py-1.5 text-right sm:mt-3 sm:rounded-xl sm:px-3 sm:py-2">
              <p
                dir="ltr"
                className="text-right text-[11px] font-extrabold text-[#097a58] tabular-nums sm:text-sm"
              >
                {unit.gainStr} ج.م
              </p>
              <p className="mt-0.5 line-clamp-1 text-[9px] text-[#2b8a6e] sm:text-[10.5px]">
                سعر السوق: {unit.marketStr} ج.م
              </p>
            </div>
          )}

          {unit.matchTags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
              {unit.matchTags.slice(0, 2).map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#e3f2ef] px-2 py-0.5 text-[9px] font-bold text-[#0b6954] sm:text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}