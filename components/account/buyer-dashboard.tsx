'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ChevronDown,
  ListFilter,
  Search,
  Star,
  X,
} from 'lucide-react'
import { updateBuyerPreferencesAction } from '@/app/actions/account-actions'
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
  notify_exact_match?: boolean | null
  notify_featured?: boolean | null
}

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
  'الأكثر طلبًا',
  'الأكثر حفظًا',
  'الأكثر زيارة',
]

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

export function BuyerDashboard({
  buyReq,
  marketUnits,
  deletionRequested = false,
}: {
  buyReq: BuyerRequestItem | null
  marketUnits: SellerUnitItem[]
  deletionRequested?: boolean
}) {
  // التبديل بين شاشة الفرص وشاشة "عدّل ميزانيتك" (الصورة 39)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [visibleCount, setVisibleCount] = useState(20)

  // بيانات الميزانية القابلة للتعديل
  const [bCash, setBCash] = useState<number>(
    Number(buyReq?.available_cash || buyReq?.budget || 3000000)
  )
  const [bInstallment, setBInstallment] = useState<number>(
    Number(buyReq?.max_installment || 100000)
  )
  const [bPlan, setBPlan] = useState<string>(buyReq?.payment_plan || 'شهري')
  const [bBudget, setBBudget] = useState<number>(
    Number(buyReq?.budget || 3500000)
  )
  const [bTypes, setBTypes] = useState<string[]>(
    Array.isArray(buyReq?.unit_types) && buyReq.unit_types.length > 0
      ? buyReq.unit_types
      : ['شقة']
  )
  const [bRooms, setBRooms] = useState<number>(Number(buyReq?.min_rooms || 3))
  const [bDelivery, setBDelivery] = useState<string>(
    buyReq?.delivery_status || 'جاهزة للاستلام'
  )
  const [bAreas, setBAreas] = useState<string[]>(
    Array.isArray(buyReq?.preferred_areas) && buyReq.preferred_areas.length > 0
      ? buyReq.preferred_areas
      : ['التجمع الخامس']
  )
  const [newAreaInput, setNewAreaInput] = useState('')
  const [notifyExact, setNotifyExact] = useState<boolean>(
    buyReq?.notify_exact_match ?? true
  )
  const [notifyFeatured, setNotifyFeatured] = useState<boolean>(
    buyReq?.notify_featured ?? true
  )

  // حالات الفلاتر في صفحة الفرص (الصور 31 - 37)
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

  // تجهيز الوحدات من الداتابيز مع حساب شارات التطابق لكل وحدة
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

      // حساب شارات التطابق الخضراء التي تظهر أسفل الكارت (الصور 32 و 33)
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
      if (isAreaMatch) matchTags.push('في المنطقة اللي عايزها')
      else if (isTypeMatch) matchTags.push('نفس نوع الوحدة')

      return {
        id: u.id,
        title: u.project_name || 'وحدة سكنية معتمدة',
        subtitle: `${u.developer_name || 'مطور عقاري'} · ${unitArea} · ${unitType}`,
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

      // فلاتر الأزرار السريعة (فلتر بطلبك)
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

  // تقسيم الوحدات إلى (وحدات في منطقتك المطلوبة) و (وحدات أخرى مناسبة لميزانيتك)
  const unitsInPreferredArea = filteredUnits.filter((u) => u.isAreaMatch)
  const unitsInOtherAreas = filteredUnits.filter((u) => !u.isAreaMatch)

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
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
      if (res.success) {
        setIsEditingBudget(false)
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 4000)
      }
    })
  }

  // ==================== الشاشة الفرعية: "عدّل ميزانيتك" (الصورة 39) ====================
  if (isEditingBudget) {
    return (
      <div className="mx-auto max-w-[660px] px-4 py-4 sm:px-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-black text-[#0a1122] sm:text-3xl">
            قدرتك الشرائية وتفضيلاتك
          </h1>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            كل ما تدّينا تفاصيل أكتر، كل ما نرشّح لك وحدات أقرب لطلبك.
          </p>
        </header>

        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="space-y-6 rounded-[22px] border border-gray-200/80 bg-white p-6 text-right shadow-xs sm:p-8">
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
              <p className="mt-0.5 text-[11px] text-gray-400">
                المبلغ اللي تقدر تدفعه فوراً لصاحب الوحدة
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
              <div className="space-y-2">
                {['شهري', 'ربع سنوي (كل 3 شهور)', 'نصف سنوي', 'سنوي'].map(
                  (plan) => (
                    <label
                      key={plan}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold transition ${
                        bPlan === plan
                          ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954]'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={bPlan === plan}
                        onChange={() => setBPlan(plan)}
                        className="accent-[#0b6954]"
                      />
                      <span>{plan}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* سعر التعاقد المستهدف */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                سعر التعاقد المستهدف (الميزانية)
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
              <p className="mt-0.5 text-[11px] text-gray-400">
                أقصى سعر تعاقد أصلي مستعد توصله — بنرشّح لك في حدوده
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
                            ? prev.filter((x) => x !== t)
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

            {/* أقل عدد غرف */}
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
                  className="h-11 w-28 rounded-xl border border-gray-200 text-center text-sm font-bold text-[#0a1122]"
                />
                <span className="text-xs text-gray-500">غرفة</span>
              </div>
            </div>

            {/* الاستلام */}
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
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
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

            {/* المناطق اللي تهمك */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                المناطق اللي تهمك
              </label>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {bAreas.map((ar) => (
                  <span
                    key={ar}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#eff9f5] px-3 py-1 text-xs font-bold text-[#0b6954]"
                  >
                    <span>{ar}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBAreas((prev) => prev.filter((x) => x !== ar))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const clean = newAreaInput.trim()
                    if (clean && !bAreas.includes(clean)) {
                      setBAreas([...bAreas, clean])
                      setNewAreaInput('')
                    }
                  }
                }}
                placeholder="ضيف منطقة تانية... (اضغط Enter للإضافة)"
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl bg-[#0b6954] text-sm font-bold text-white transition hover:bg-[#095443]"
            >
              {isPending ? 'جاري الحفظ...' : 'احفظ وشوف الفرص'}
            </button>
          </div>

          {/* كارت إعدادات الإشعارات كما في الصورة 39 */}
          <div className="rounded-[22px] border border-gray-200/80 bg-white p-6 text-right shadow-xs sm:p-7">
            <h3 className="text-sm font-black text-[#0a1122]">الإشعارات</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#0a1122]">
                    وحدات جديدة مطابقة لطلبك
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    نبلغك لما وحدة جديدة تنزل وتناسب طلبك — 3 في اليوم بالكتير.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyExact(!notifyExact)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    notifyExact ? 'bg-[#0b6954]' : 'bg-gray-300'
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
                  <p className="text-xs font-bold text-[#0a1122]">
                    وحدات مميزة ممكن تناسبك
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    إعلانات لوحدات مميزة قريبة من طلبك — مرة في اليوم بالكتير و3
                    في الأسبوع.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyFeatured(!notifyFeatured)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    notifyFeatured ? 'bg-[#0b6954]' : 'bg-gray-300'
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
      </div>
    )
  }

  // ==================== الشاشة الرئيسية للمشتري: "فرص تناسب ميزانيتك" (الصور 31 - 37) ====================
  return (
    <div className="mx-auto max-w-[1020px] px-3 sm:px-6">
      {/* شريط علوي لأزرار الحساب (لأن صفحة المشتري طويلة كما طلبت) */}
      

      {savedToast && (
        <div className="mb-4 rounded-xl bg-[#eff9f5] p-3 text-center text-xs font-bold text-[#0b6954]">
          ✓ تم تحديث قدرتك الشرائية وتفضيلاتك بنجاح!
        </div>
      )}

      {/* الهيدر: فرص تناسب ميزانيتك + عروضي + عدّل ميزانيتك */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
          فرص تناسب ميزانيتك
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/account/offers"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[#0a1122] shadow-2xs transition hover:bg-gray-50"
          >
            عروضي
          </Link>
          <button
            type="button"
            onClick={() => setIsEditingBudget(true)}
            className="text-xs font-bold text-[#1e3a8a] transition hover:underline"
          >
            عدّل ميزانيتك
          </button>
        </div>
      </header>

      {/* شريط ملخص الكاش والقسط */}
      <section className="mt-4 rounded-[14px] border border-gray-200/80 bg-white px-5 py-3.5 text-right shadow-2xs">
        <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="text-gray-400">الكاش المتاح دلوقتي: </span>
            <strong className="font-extrabold text-[#0a1122] tabular-nums">
              {bCash.toLocaleString('en-US')} ج.م
            </strong>
          </div>
          <div>
            <span className="text-gray-400">أقصى قسط يريحك: </span>
            <strong className="font-extrabold text-[#0a1122] tabular-nums">
              {bInstallment.toLocaleString('en-US')} ج.م
            </strong>
          </div>
        </div>
      </section>

      {/* شريط "فلتر بطلبك" التفاعلي */}
      <section className="mt-4 text-right">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <span className="ml-1 text-xs font-extrabold text-[#0a1122]">
            فلتر بطلبك:
          </span>
          {buyerFilterPills.map((pill) => {
            const isSelected = activePills.includes(pill)
            return (
              <button
                key={pill}
                type="button"
                onClick={() => togglePill(pill)}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
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
        <p className="mt-2 text-[11px] text-gray-400">
          مرتّبة بالأنسب لطلبك — اختار أي شرط عشان تشوف اللي يطابقه بالظبط.
        </p>
      </section>

      {/* شريط البحث والفلترة المتقدمة والترتيب */}
      <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دوّر باسم المشروع أو المنطقة أو كود الوحدة (U-10057)..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none sm:text-sm"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                filterPanelOpen || activeFiltersCount > 0
                  ? 'border-[#0b6954] bg-[#eff8f6] text-[#0b6954]'
                  : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
              }`}
            >
              <ListFilter className="size-3.5" />
              <span>فلترة</span>
              {activeFiltersCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0b6954] text-[10px] font-bold text-white">
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
                  : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
              }`}
            >
              <span>قابل للتفاوض</span>
              <ArrowDown className="size-3 text-[#d97706]" />
            </button>

            <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
              {filteredUnits.length} وحدة متاحة
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 sm:text-xs">ترتيب</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 min-w-[135px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:h-10 sm:min-w-[155px]"
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

        {/* شارات الفلاتر النشطة كما في الصورة 36 */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5">
            {onlyNegotiable && (
              <button
                type="button"
                onClick={() => setOnlyNegotiable(false)}
                className="inline-flex items-center gap-1 rounded-full bg-[#eff9f5] px-3 py-1 text-[11px] font-bold text-[#0b6954]"
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
                className="inline-flex items-center gap-1 rounded-full bg-[#eff9f5] px-3 py-1 text-[11px] font-bold text-[#0b6954]"
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
                className="inline-flex items-center gap-1 rounded-full bg-[#eff9f5] px-3 py-1 text-[11px] font-bold text-[#0b6954]"
              >
                <span>{t}</span>
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="mr-1 text-[11px] text-gray-500 underline hover:text-[#0a1122]"
            >
              مسح الكل
            </button>
          </div>
        )}
      </section>

      {/* لوحة الفلترة المتقدمة الكاملة (الصور 34 و 35) */}
      {filterPanelOpen && (
        <section className="mt-3 rounded-[20px] border border-gray-200/80 bg-white p-5 text-right shadow-xs sm:p-7">
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
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                أقصى كاش مطلوب دلوقتي
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxCashFilter}
                  onChange={(e) => setMaxCashFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs"
                />
                <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                  ج.م
                </span>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                أهم رقم — ده اللي هتدفعه عند النقل
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                أقصى قسط شهري
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxInstFilter}
                  onChange={(e) => setMaxInstFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs"
                />
                <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                  ج.م
                </span>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                الأقساط الربع/نص سنوية بنحسبها بما يعادلها شهرياً
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold text-[#0a1122]">نوع الوحدة</p>
            <div className="flex flex-wrap gap-1.5">
              {unitTypesList.map((t) => {
                const active = selectedTypes.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleFilterType(t)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
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

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-bold text-[#0a1122]">الاستلام</p>
              <div className="flex flex-wrap gap-1.5">
                {deliveryStatuses.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDelStatusFilter(st)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
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
              <p className="mb-2 text-xs font-bold text-[#0a1122]">
                سنة الاستلام
              </p>
              <div className="flex flex-wrap gap-1.5">
                {deliveryYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setDelYearFilter(yr)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      delYearFilter === yr
                        ? 'border-[#0b6954] bg-[#0b6954] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-[#0a1122]">
                سنة التعاقد
              </p>
              <div className="flex flex-wrap gap-1.5">
                {contractYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setConYearFilter(yr)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      conYearFilter === yr
                        ? 'border-[#0b6954] bg-[#0b6954] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
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
              <p className="mb-2 text-xs font-bold text-[#0a1122]">
                أقل عدد غرف
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roomOptions.map((rm) => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => setMinRoomsFilter(rm)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
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
              <div className="relative max-w-sm">
                <input
                  type="number"
                  value={maxContractFilter}
                  onChange={(e) => setMaxContractFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs"
                />
                <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                  ج.م
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-xl bg-[#0b6954] px-6 py-2 text-xs font-bold text-white"
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

      {/* عرض النتائج أو رسالة "مفيش وحدات مطابقة" (الصورة 36) */}
      {filteredUnits.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
          <p className="text-sm font-bold text-gray-600">
            مفيش وحدات مطابقة للفلاتر اللي اخترتها.
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
          {unitsInPreferredArea.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-4 text-right text-sm font-extrabold text-[#0a1122] sm:text-base">
                الفرص في المنطقة اللي طلبتها ({bAreas.join('، ')}){' '}
                <span className="font-normal text-gray-400">
                  ({unitsInPreferredArea.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unitsInPreferredArea.map((u) => (
                  <BuyerUnitCard key={u.id} unit={u} />
                ))}
              </div>
            </section>
          )}

          {unitsInOtherAreas.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-start gap-1.5 text-right">
                <Star className="size-4 fill-amber-400 text-amber-500" />
                <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  فرص مميزة مناسبة ليك في مناطق تانية ({unitsInOtherAreas.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unitsInOtherAreas.map((u) => (
                  <BuyerUnitCard key={u.id} unit={u} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {/* عرض النتائج بحد أقصى 20 وحدة في الدفعة الواحدة + زر Pagination */}
      {filteredUnits.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
          <p className="text-sm font-bold text-gray-600">
            مفيش وحدات مطابقة للفلاتر اللي اخترتها.
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
          <section className="mt-7">
            <h2 className="mb-4 text-right text-sm font-extrabold text-[#0a1122] sm:text-base">
              الفرص في المنطقة اللي طلبتها ({bAreas.join('، ')}){' '}
              <span className="font-normal text-gray-400">
                ({filteredUnits.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.slice(0, visibleCount).map((u) => (
                <BuyerUnitCard key={u.id} unit={u} />
              ))}
            </div>

            {/* زر الـ Pagination لعرض 20 وحدة إضافية */}
            {filteredUnits.length > visibleCount && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="rounded-full border border-gray-200 bg-white px-7 py-2.5 text-xs font-bold text-[#0a1122] shadow-2xs transition hover:border-[#0b6954] hover:bg-gray-50 active:scale-95"
                >
                  اعرض {Math.min(20, filteredUnits.length - visibleCount)} فرصة
                  كمان ({filteredUnits.length - visibleCount} متبقية)
                </button>
              </div>
            )}
          </section>
        </>
      )}

      

      {/* شريط أزرار الحساب في الأسفل أيضاً */}
      <AccountActionLinks
        unitsCount={0}
        initialDeletionRequested={deletionRequested}
        position="bottom"
      />
    </div>
  )
}

function BuyerUnitCard({ unit }: { unit: any }) {
  return (
    <Link
      href={`/opportunities/${unit.id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-[18px] border border-gray-200/85 bg-white shadow-2xs transition hover:shadow-md"
    >
      <div>
        {unit.image && (
          <div className="h-[175px] w-full overflow-hidden bg-gray-100">
            <img
              src={unit.image}
              alt={unit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5 text-right">
          <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-[#0a1122] group-hover:text-[#0b6954]">
            {unit.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
            {unit.subtitle}
          </p>

          <div className="mt-4">
            <p className="text-[11px] text-gray-400">المطلوب كاش دلوقتي</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight text-[#0a1122] tabular-nums">
              {unit.cashStr} <span className="text-xs font-semibold">ج.م</span>
            </p>
          </div>

          {unit.gainStr && (
            <div className="mt-3 rounded-xl bg-[#eff9f5] px-3 py-2.5 text-right">
              <p
                dir="ltr"
                className="text-right text-sm font-bold text-[#097a58] tabular-nums"
              >
                {unit.gainStr} ج.م
              </p>
              <p className="mt-0.5 text-[10.5px] text-[#2b8a6e]">
                سعر السوق اليوم: {unit.marketStr} ج.م
              </p>
            </div>
          )}

          {unit.matchTags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {unit.matchTags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#e3f2ef] px-2.5 py-1 text-[10px] font-bold text-[#0b6954]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}