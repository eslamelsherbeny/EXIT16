"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  Building2,
  Check,
  Heart,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"

export type OpportunityUnit = {
  id: string
  code: string
  projectName: string
  developerName: string
  area: string
  unitType: string
  rooms: number
  bathrooms: number
  size: number
  finishing: string
  requiredCash: number
  paidAmount: number
  contractPrice: number
  marketPrice: number
  remainingForDeveloper: number
  installmentAmount: number
  installmentFrequency: string
  yearsLeft: number
  deliveryText: string
  willingToDiscount: boolean
  discountAmount: number
  netBuyerGain: number
  image: string
  createdAt: string
}

export default function OpportunitiesClient({
  initialUnits,
}: {
  initialUnits: OpportunityUnit[]
}) {
  // حالات الفلاتر
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArea, setSelectedArea] = useState("all")
  const [selectedUnitType, setSelectedUnitType] = useState("all")
  const [maxCash, setMaxCash] = useState<string>("")
  const [maxInstallment, setMaxInstallment] = useState<string>("")
  const [minRooms, setMinRooms] = useState<string>("all")
  const [onlyNegotiable, setOnlyNegotiable] = useState(false)
  const [sortBy, setSortBy] = useState<
    "newest" | "lowest_cash" | "highest_gain" | "lowest_installment"
  >("newest")

  // حالة درج الفلاتر على الموبايل + المفضلة
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // استخراج قوائم المناطق وأنواع الوحدات ديناميكياً من البيانات الحقيقية
  const availableAreas = useMemo(() => {
    const set = new Set<string>()
    initialUnits.forEach((u) => {
      if (u.area) set.add(u.area.trim())
    })
    return Array.from(set)
  }, [initialUnits])

  const availableUnitTypes = useMemo(() => {
    const set = new Set<string>()
    initialUnits.forEach((u) => {
      if (u.unitType) set.add(u.unitType.trim())
    })
    return Array.from(set)
  }, [initialUnits])

  // تطبيق الفلاتر والترتيب على الوحدات الحقيقية
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const cashLimit = Number(maxCash.replace(/,/g, "")) || 0
    const installmentLimit = Number(maxInstallment.replace(/,/g, "")) || 0
    const roomsMin = minRooms === "all" ? 0 : Number(minRooms) || 0

    const list = initialUnits.filter((unit) => {
      if (q) {
        const haystack =
          `${unit.projectName} ${unit.developerName} ${unit.area} ${unit.unitType} ${unit.code}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      if (selectedArea !== "all" && unit.area.trim() !== selectedArea) {
        return false
      }

      if (
        selectedUnitType !== "all" &&
        unit.unitType.trim() !== selectedUnitType
      ) {
        return false
      }

      if (cashLimit > 0 && unit.requiredCash > cashLimit) {
        return false
      }

      if (installmentLimit > 0 && unit.installmentAmount > installmentLimit) {
        return false
      }

      if (roomsMin > 0 && unit.rooms < roomsMin) {
        return false
      }

      if (onlyNegotiable && !unit.willingToDiscount) {
        return false
      }

      return true
    })

    // الترتيب
    return [...list].sort((a, b) => {
      if (sortBy === "lowest_cash") return a.requiredCash - b.requiredCash
      if (sortBy === "highest_gain") return b.netBuyerGain - a.netBuyerGain
      if (sortBy === "lowest_installment")
        return a.installmentAmount - b.installmentAmount
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })
  }, [
    initialUnits,
    searchQuery,
    selectedArea,
    selectedUnitType,
    maxCash,
    maxInstallment,
    minRooms,
    onlyNegotiable,
    sortBy,
  ])

  // حساب الإحصائيات الحقيقية 100% من البيانات الفعلية
  const realStats = useMemo(() => {
    const totalCount = filteredUnits.length
    const totalMarketValue = filteredUnits.reduce(
      (sum, u) => sum + (u.marketPrice || u.contractPrice || 0),
      0
    )
    const totalBuyerSavings = filteredUnits.reduce(
      (sum, u) => sum + (u.netBuyerGain || 0),
      0
    )
    const minCashAvailable =
      filteredUnits.length > 0
        ? Math.min(...filteredUnits.map((u) => u.requiredCash))
        : 0

    return {
      totalCount,
      totalMarketValue,
      totalBuyerSavings,
      minCashAvailable,
    }
  }, [filteredUnits])

  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    if (selectedArea !== "all") count++
    if (selectedUnitType !== "all") count++
    if (maxCash) count++
    if (maxInstallment) count++
    if (minRooms !== "all") count++
    if (onlyNegotiable) count++
    return count
  }, [
    searchQuery,
    selectedArea,
    selectedUnitType,
    maxCash,
    maxInstallment,
    minRooms,
    onlyNegotiable,
  ])

  const resetAllFilters = () => {
    setSearchQuery("")
    setSelectedArea("all")
    setSelectedUnitType("all")
    setMaxCash("")
    setMaxInstallment("")
    setMinRooms("all")
    setOnlyNegotiable(false)
    setSortBy("newest")
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f6f8] pb-20 text-[#0a1122]">
      {/* ==================== 1. الهيدر العلوي والإحصائيات الحقيقية ==================== */}
      <section className="bg-[#0a1122] pt-10 pb-12 text-white sm:pt-14 sm:pb-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-block rounded-full border border-white/10 bg-[#132230] px-3.5 py-1 text-[11px] font-semibold text-[#2dd4a8]">
                بيانات حقيقية وموثقة بالمستندات — بدون أوفر
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                الفرص المتاحة للتنازل
              </h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#9ba6b8] sm:text-sm">
                كل الوحدات المعروضة هنا تمت مراجعتها من الإدارة، وتُباع بنفس المبلغ المدفوع فعلياً للمطور بدون جنيه أوفر.
              </p>
            </div>

            <Link
              href="/buy"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#0d6e52] px-5 text-xs font-bold text-white transition hover:bg-[#0a5942] sm:text-sm lg:self-auto"
            >
              <Sparkles className="size-4" />
              <span>ملقتش طلبك؟ سجّل ميزانيتك ونبلغك فوراً</span>
            </Link>
          </div>

          {/* كروت الإحصائيات الحقيقية من الداتابيز */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#131d31]/90 p-4 sm:p-5">
              <p className="text-[11px] font-medium text-[#9ba6b8] sm:text-xs">
                الوحدات المتاحة حالياً
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  dir="ltr"
                  className="text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl"
                >
                  {realStats.totalCount.toLocaleString("en-US")}
                </span>
                <span className="text-xs font-normal text-[#9ba6b8]">وحدة</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#131d31]/90 p-4 sm:p-5">
              <p className="text-[11px] font-medium text-[#9ba6b8] sm:text-xs">
                إجمالي قيمة الوحدات بالسوق
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  dir="ltr"
                  className="text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl"
                >
                  {realStats.totalMarketValue.toLocaleString("en-US")}
                </span>
                <span className="text-xs font-normal text-[#9ba6b8]">ج.م</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#131d31]/90 p-4 sm:p-5">
              <p className="text-[11px] font-medium text-[#9ba6b8] sm:text-xs">
                أقل كاش مطلوب للبدء
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  dir="ltr"
                  className="text-2xl font-bold tracking-tight text-[#2dd4a8] tabular-nums sm:text-3xl"
                >
                  {realStats.minCashAvailable.toLocaleString("en-US")}
                </span>
                <span className="text-xs font-normal text-[#9ba6b8]">ج.م</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#131d31]/90 p-4 sm:p-5">
              <p className="text-[11px] font-medium text-[#9ba6b8] sm:text-xs">
                إجمالي التوفير عن سعر السوق
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  dir="ltr"
                  className="text-2xl font-bold tracking-tight text-[#2dd4a8] tabular-nums sm:text-3xl"
                >
                  {realStats.totalBuyerSavings.toLocaleString("en-US")}
                </span>
                <span className="text-xs font-normal text-[#9ba6b8]">ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 2. شريط الفلاتر المتجاوب (Responsive Filters) ==================== */}
      <section className="sticky top-[74px] z-30 border-b border-gray-200/80 bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto max-w-[1180px] px-4 py-3 sm:px-6 sm:py-4">
          {/* أ) شريط الموبايل السريع (يظهر على الهاتف والتابلت فقط) */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالمشروع، المطور، أو الكود..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9fb] pr-9 pl-3 text-xs font-medium text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:bg-white focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="relative inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-[#0a1122] shadow-2xs transition active:scale-95"
              >
                <SlidersHorizontal className="size-4 text-[#0b6954]" />
                <span>فلترة</span>
                {activeFiltersCount > 0 && (
                  <span
                    dir="ltr"
                    className="flex size-4 items-center justify-center rounded-full bg-[#0b6954] text-[10px] font-bold text-white"
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* أزرار المناطق السريعة القابلة للسحب أفقياً على الموبايل */}
            {availableAreas.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedArea("all")}
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    selectedArea === "all"
                      ? "bg-[#0a1122] text-white"
                      : "bg-gray-100 text-[#5a6578] hover:bg-gray-200"
                  }`}
                >
                  كل المناطق ({initialUnits.length})
                </button>
                {availableAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() =>
                      setSelectedArea(selectedArea === area ? "all" : area)
                    }
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      selectedArea === area
                        ? "bg-[#0b6954] text-white"
                        : "bg-gray-100 text-[#5a6578] hover:bg-gray-200"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ب) شريط فلاتر الكمبيوتر الكامل (Desktop Filters) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-3">
            <div className="grid grid-cols-12 gap-2.5">
              {/* البحث */}
              <div className="relative col-span-3">
                <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالمشروع أو المطور أو الكود..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9fb] pr-10 pl-3 text-xs font-medium text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:bg-white focus:outline-none"
                />
              </div>

              {/* المنطقة */}
              <div className="col-span-2">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                >
                  <option value="all">كل المناطق</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع الوحدة */}
              <div className="col-span-2">
                <select
                  value={selectedUnitType}
                  onChange={(e) => setSelectedUnitType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                >
                  <option value="all">كل أنواع الوحدات</option>
                  {availableUnitTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* أقصى كاش متاح */}
              <div className="col-span-2">
                <input
                  type="number"
                  value={maxCash}
                  onChange={(e) => setMaxCash(e.target.value)}
                  placeholder="أقصى كاش (مثال: 3000000)"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none"
                />
              </div>

              {/* عدد الغرف */}
              <div className="col-span-1">
                <select
                  value={minRooms}
                  onChange={(e) => setMinRooms(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-semibold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                >
                  <option value="all">الغرف</option>
                  <option value="1">+1 غرفة</option>
                  <option value="2">+2 غرفة</option>
                  <option value="3">+3 غرف</option>
                  <option value="4">+4 غرف</option>
                </select>
              </div>

              {/* الترتيب */}
              <div className="col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                >
                  <option value="newest">الترتيب: الأحدث</option>
                  <option value="lowest_cash">الأقل كاش مطلوب</option>
                  <option value="highest_gain">الأعلى مكسب عن السوق</option>
                  <option value="lowest_installment">الأقل قسط دوري</option>
                </select>
              </div>
            </div>

            {/* شريط سفلي للفلاتر الإضافية وعداد النتائج */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-[#475569]">
                  <input
                    type="checkbox"
                    checked={onlyNegotiable}
                    onChange={(e) => setOnlyNegotiable(e.target.checked)}
                    className="size-4 rounded border-gray-300 accent-[#0b6954]"
                  />
                  <span>قابل للتفاوض فقط</span>
                </label>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 font-bold text-red-600 hover:underline"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>إعادة ضبط الفلاتر ({activeFiltersCount})</span>
                  </button>
                )}
              </div>

              <p className="text-xs font-semibold text-[#5a6578]">
                إجمالي النتائج المعروضة:{" "}
                <strong className="font-bold text-[#0a1122]">
                  {filteredUnits.length}
                </strong>{" "}
                من أصل {initialUnits.length} وحدة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3. نافذة الفلاتر الكاملة للموبايل (Mobile Filter Drawer) ==================== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-[#0b6954]" />
                <h3 className="text-sm font-bold text-[#0a1122]">
                  فلترة وترتيب الفرص
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-5 text-right">
              {/* الترتيب */}
              <div>
                <label className="block text-xs font-bold text-[#0a1122]">
                  ترتيب الوحدات حسب
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { id: "newest", label: "الأحدث إضافة" },
                    { id: "lowest_cash", label: "الأقل كاش مطلوب" },
                    { id: "highest_gain", label: "الأعلى مكسب" },
                    { id: "lowest_installment", label: "الأقل قسط" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSortBy(item.id as any)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        sortBy === item.id
                          ? "border-[#0b6954] bg-[#eff8f6] text-[#0b6954]"
                          : "border-gray-200 bg-white text-[#475569]"
                      }`}
                    >
                      <span>{item.label}</span>
                      {sortBy === item.id && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* المنطقة */}
              <div>
                <label className="block text-xs font-bold text-[#0a1122]">
                  المنطقة
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-[#0a1122]"
                >
                  <option value="all">جميع المناطق</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع الوحدة */}
              <div>
                <label className="block text-xs font-bold text-[#0a1122]">
                  نوع الوحدة
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUnitType("all")}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                      selectedUnitType === "all"
                        ? "border-[#0b6954] bg-[#0b6954] text-white"
                        : "border-gray-200 bg-white text-[#475569]"
                    }`}
                  >
                    الكل
                  </button>
                  {availableUnitTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedUnitType(type)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                        selectedUnitType === type
                          ? "border-[#0b6954] bg-[#0b6954] text-white"
                          : "border-gray-200 bg-white text-[#475569]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* أقصى كاش وأقصى قسط */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0a1122]">
                    أقصى كاش متاح (ج.م)
                  </label>
                  <input
                    type="number"
                    value={maxCash}
                    onChange={(e) => setMaxCash(e.target.value)}
                    placeholder="مثال: 2500000"
                    className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0a1122]">
                    أقصى قسط دوري (ج.م)
                  </label>
                  <input
                    type="number"
                    value={maxInstallment}
                    onChange={(e) => setMaxInstallment(e.target.value)}
                    placeholder="مثال: 150000"
                    className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium"
                  />
                </div>
              </div>

              {/* عدد الغرف */}
              <div>
                <label className="block text-xs font-bold text-[#0a1122]">
                  الحد الأدنى للغرف
                </label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {[
                    { v: "all", l: "الكل" },
                    { v: "1", l: "+1" },
                    { v: "2", l: "+2" },
                    { v: "3", l: "+3" },
                    { v: "4", l: "+4" },
                  ].map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => setMinRooms(r.v)}
                      className={`rounded-xl border py-2 text-xs font-bold ${
                        minRooms === r.v
                          ? "border-[#0b6954] bg-[#0b6954] text-white"
                          : "border-gray-200 bg-white text-[#475569]"
                      }`}
                    >
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* قابل للتفاوض */}
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                <span className="text-xs font-bold text-[#0a1122]">
                  إظهار الوحدات القابلة للتفاوض فقط
                </span>
                <input
                  type="checkbox"
                  checked={onlyNegotiable}
                  onChange={(e) => setOnlyNegotiable(e.target.checked)}
                  className="size-4 rounded accent-[#0b6954]"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 bg-white p-4">
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-11 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-600"
              >
                مسح الكل
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="h-11 flex-1 rounded-xl bg-[#0b6954] text-xs font-bold text-white shadow-sm"
              >
                عرض النتائج ({filteredUnits.length} وحدة)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. شبكة كروت الوحدات (مطابقة 100% للموقع الأصلي) ==================== */}
      <section className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-6">
        {filteredUnits.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-gray-200/80 bg-white p-10 text-center shadow-xs">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#eff8f6] text-[#0b6954]">
              <Building2 className="size-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0a1122]">
              {initialUnits.length === 0
                ? "لا توجد وحدات منشورة حالياً"
                : "لا توجد وحدات تطابق هذه الفلاتر"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#64748b] sm:text-sm">
              {initialUnits.length === 0
                ? "بمجرد موافقة الإدارة على طلبات البيع وتفعيلها إلى (معروضة في السوق)، ستظهر هنا تلقائياً بكامل أرقامها الحقيقية."
                : "جرب تخفيف شروط الفلترة أو البحث بكلمات أخرى، أو سجّل طلبك وسنرشح لك أقرب وحدة مناسبة."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
                >
                  إعادة ضبط الفلاتر
                </button>
              )}
              <Link
                href="/buy"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a1122] px-5 text-xs font-bold text-white hover:bg-[#16223f]"
              >
                سجّل ميزانيتك كمشتري
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUnits.map((unit) => {
              const isFav = favorites.includes(unit.id)

              return (
                <article
                  key={unit.id}
                  className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0_2px_12px_rgba(10,17,34,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(10,17,34,0.08)]"
                >
                  <div>
                    {/* صورة الوحدة والشارات العلوية */}
                    <div className="relative h-[205px] w-full overflow-hidden bg-gray-100">
                      <img
                        src={unit.image}
                        alt={unit.projectName}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />

                      {/* شارة التوثيق في اليمين */}
                      <span className="absolute right-3.5 top-3.5 rounded-full bg-[#e8f5f0]/95 px-3 py-1 text-[11px] font-semibold text-[#0b6954] shadow-2xs backdrop-blur-xs">
                        متحقق بالمستندات
                      </span>

                      {/* زر المفضلة في اليسار */}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(unit.id)}
                        aria-label="إضافة للمفضلة"
                        className="absolute left-3.5 top-3.5 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-xs transition hover:bg-black/55"
                      >
                        <Heart
                          className={`size-4 ${
                            isFav ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* جسم الكارت — مطابق 100% لأوزان خطوط وألوان الموقع الأصلي */}
                    <div className="p-5 sm:p-6">
                      {/* 1. اسم المشروع والمطور والمنطقة */}
                      <div className="text-right">
                        <h2 className="text-[19px] font-bold leading-snug text-[#0a1128]">
                          {unit.projectName}
                        </h2>
                        <p className="mt-1 text-[13px] font-normal text-[#64748b]">
                          {unit.developerName} · {unit.area}
                        </p>
                      </div>

                      {/* 2. مواصفات الوحدة على اليمين والكود على اليسار */}
                      <div className="mt-3.5 flex items-center justify-between text-[13px]">
                        <p className="font-semibold text-[#1e293b]">
                          {unit.unitType}
                          {unit.rooms > 0 ? ` · ${unit.rooms} غرف` : ""}
                          {unit.bathrooms > 0 ? ` · ${unit.bathrooms} حمام` : ""}
                          {unit.size > 0 ? ` · ${unit.size} م²` : ""}
                        </p>
                        <span
                          dir="ltr"
                          className="font-mono text-[11.5px] font-normal tracking-wide text-[#94a3b8]"
                        >
                          {unit.code}
                        </span>
                      </div>

                      {/* 3. المطلوب كاش دلوقتي */}
                      <div className="mt-5 text-right">
                        <p className="text-[12px] font-normal text-[#64748b]">
                          المطلوب كاش دلوقتي
                        </p>
                        <div className="mt-0.5 flex items-baseline justify-start gap-1.5">
                          <span
                            dir="ltr"
                            className="text-[25px] font-bold tracking-tight text-[#0a1128] tabular-nums"
                          >
                            {unit.requiredCash.toLocaleString("en-US")}
                          </span>
                          <span className="text-[15px] font-semibold text-[#0a1128]">
                            ج.م
                          </span>
                        </div>

                        {unit.willingToDiscount && (
                          <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-[#b45309]">
                            <ArrowDown className="size-3 stroke-[2.5]" />
                            <span>قابل للتفاوض</span>
                          </p>
                        )}
                      </div>

                      {/* 4. صندوق مكسبك عن سعر السوق (ناعم وبدون إطار حاد تماماً كالأصلي) */}
                      <div className="mt-4 rounded-[14px] bg-[#eff9f5] px-4 py-3.5 text-right">
                        <p className="text-[11.5px] font-semibold text-[#0c7758]">
                          مكسبك عن سعر السوق
                        </p>
                        <p className="mt-1 flex items-baseline justify-start gap-1 text-[18px] font-bold text-[#097a58] tabular-nums">
                          <span dir="ltr">
                            + {unit.netBuyerGain.toLocaleString("en-US")}
                          </span>
                          <span className="text-[14px] font-semibold">ج.م</span>
                        </p>
                        <p className="mt-1 text-[11px] font-normal text-[#2b8a6e]">
                          سعر السوق اليوم:{" "}
                          <span dir="ltr" className="tabular-nums">
                            {unit.marketPrice.toLocaleString("en-US")}
                          </span>{" "}
                          ج.م · بعد خصم عمولتنا 1.25%
                        </p>
                      </div>

                      <p className="mt-2 text-right text-[10.5px] font-normal text-[#94a3b8]">
                        سعر السوق من صاحب الوحدة ومسؤوليته — مش تقييم من عقار إكزت.
                      </p>

                      {/* 5. جدول التفاصيل السفلية (المتبقي، القسط، الاستلام) */}
                      <div className="mt-4 space-y-2 border-t border-[#f1f5f9] pt-4 text-[12.5px]">
                        <div className="flex items-center justify-between">
                          <span className="font-normal text-[#64748b]">
                            المتبقي للمطور
                          </span>
                          <span className="font-semibold text-[#0a1128] tabular-nums">
                            <span dir="ltr">
                              {unit.remainingForDeveloper.toLocaleString("en-US")}
                            </span>{" "}
                            ج.م
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-normal text-[#64748b]">
                            القسط
                          </span>
                          <span className="font-semibold text-[#0a1128] tabular-nums">
                            {unit.installmentAmount > 0 ? (
                              <>
                                <span dir="ltr">
                                  {unit.installmentAmount.toLocaleString("en-US")}
                                </span>{" "}
                                ج.م · {unit.installmentFrequency}
                              </>
                            ) : (
                              "خالصة الأقساط"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-normal text-[#64748b]">
                            الاستلام
                          </span>
                          <span
                            dir="ltr"
                            className="font-semibold text-[#0a1128] tabular-nums"
                          >
                            {unit.deliveryText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. زر التفاصيل السفلي */}
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <Link
                      href={`/opportunities/${unit.id}`}
                      className="flex h-[44px] w-full items-center justify-center rounded-[11px] bg-[#0a1122] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#16223f]"
                    >
                      تفاصيل
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}