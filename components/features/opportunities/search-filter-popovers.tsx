'use client'

import { Compass } from 'lucide-react'

export type SearchFiltersState = {
  q: string
  deal: 'all' | 'exit' | 'sale' | 'rent_monthly' | 'rent_daily'
  propertyType: string
  location: string
  locationDisplay: string
  minPrice: string
  maxPrice: string
  currency: 'GEL' | 'USD' | 'EUR'
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
  sellerType: string
  condition: string
  buildingStatus: string
  buildingSeries: string
  floorType: string
  heating: string
  quickTag: string
  sortBy:
    | 'date'
    | 'price_asc'
    | 'price_desc'
    | 'area_desc'
    | 'sqm_asc'
    | 'sqm_desc'
    | 'ai'
}

export function PriceFilterPanel({
  filters,
  updateFilter,
  isAr,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  isAr: boolean
}) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2.5">
          <input
            type="number"
            dir="ltr"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            placeholder={isAr ? 'الأدنى' : 'Min'}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-extrabold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
          />
          <span className="font-bold text-slate-300">—</span>
          <input
            type="number"
            dir="ltr"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            placeholder={isAr ? 'الأقصى' : 'Max'}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-extrabold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
          />
        </div>

        <div className="inline-flex shrink-0 items-center self-end rounded-full border border-slate-200 bg-white p-1 sm:self-auto">
          {(
            [
              { code: 'GEL', sym: '₾' },
              { code: 'USD', sym: '$' },
              { code: 'EUR', sym: '€' },
            ] as const
          ).map((c) => {
            const active = filters.currency === c.code
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => updateFilter('currency', c.code)}
                className={`flex size-8 items-center justify-center rounded-full text-xs font-black transition ${
                  active
                    ? 'bg-[#2563eb] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.sym}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function RoomsFilterPanel({
  filters,
  updateFilter,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
}) {
  return (
    <div className="mt-3 flex justify-center rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex flex-wrap items-center gap-2.5">
        {['1', '2', '3', '4', '+5'].map((num) => {
          const cleanVal = num.replace('+', '')
          const active = filters.rooms === cleanVal
          return (
            <button
              key={num}
              type="button"
              onClick={() => updateFilter('rooms', active ? '' : cleanVal)}
              className={`flex size-10 items-center justify-center rounded-full border text-xs font-black transition ${
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
  isAr,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  isAr: boolean
}) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-3.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2.5">
        <input
          type="number"
          dir="ltr"
          value={filters.minArea}
          onChange={(e) => updateFilter('minArea', e.target.value)}
          placeholder={isAr ? 'الأدنى' : 'Min'}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-extrabold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
        />
        <span className="font-bold text-slate-300">—</span>
        <input
          type="number"
          dir="ltr"
          value={filters.maxArea}
          onChange={(e) => updateFilter('maxArea', e.target.value)}
          placeholder={isAr ? 'الأقصى' : 'Max'}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-extrabold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
        />
        <span className="shrink-0 px-2 text-xs font-black text-slate-400">
          {isAr ? 'م²' : 'm²'}
        </span>
      </div>
    </div>
  )
}

export function CommuteFilterPanel({
  filters,
  updateFilter,
  onClose,
  isAr,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  onClose: () => void
  isAr: boolean
}) {
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
          placeholder={
            isAr
              ? 'الوجهة — العمل، الدراسة، أو محطة المترو...'
              : 'Destination — work, university, metro station...'
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:outline-none sm:text-sm"
        />

        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleDetectMyLocation}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-extrabold text-[#0f1d40] shadow-2xs transition hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            <Compass className="size-3.5 text-[#2563eb]" />
            <span>{isAr ? 'استخدم موقعي' : 'Use my location'}</span>
          </button>
        </div>

        {/* وسيلة التنقل */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-200/60 p-1">
          {(
            [
              { id: 'car', label: isAr ? 'سيارة' : 'Car' },
              { id: 'walk', label: isAr ? 'مشياً' : 'Walking' },
              { id: 'bike', label: isAr ? 'دراجة' : 'Bicycle' },
            ] as const
          ).map((mode) => {
            const active = filters.commuteMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => updateFilter('commuteMode', mode.id)}
                className={`rounded-xl py-2.5 text-xs font-extrabold transition ${
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

        {/* المدة الزمنية */}
        <div className="grid grid-cols-3 gap-2.5">
          {(['10', '20', '30'] as const).map((mins) => {
            const active = filters.commuteMinutes === mins
            return (
              <button
                key={mins}
                type="button"
                onClick={() => updateFilter('commuteMinutes', mins)}
                className={`rounded-xl border py-2.5 text-xs font-black transition ${
                  active
                    ? 'border-[#2563eb] bg-blue-50/80 text-[#2563eb]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mins} {isAr ? 'د' : 'min'}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-xl bg-[#7aa2f7] text-xs font-black text-white shadow-xs transition hover:bg-[#2563eb] sm:text-sm"
        >
          {isAr ? 'تطبيق' : 'Apply'}
        </button>
      </div>
    </div>
  )
}

export function MoreFiltersMegaPanel({
  filters,
  updateFilter,
  isAr,
}: {
  filters: SearchFiltersState
  updateFilter: <K extends keyof SearchFiltersState>(
    key: K,
    val: SearchFiltersState[K]
  ) => void
  isAr: boolean
}) {
  const pillClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
      active
        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-2xs'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
    }`

  const conditions = [
    { id: 'Newly renovated', ar: 'مجدد حديثاً', en: 'Newly renovated' },
    { id: 'Old renovation', ar: 'ترميم قديم', en: 'Old renovation' },
    { id: 'Under renovation', ar: 'تحت الترميم', en: 'Under renovation' },
    { id: 'Needs renovation', ar: 'يحتاج ترميماً', en: 'Needs renovation' },
    { id: 'White frame', ar: 'هيكل أبيض', en: 'White frame' },
    { id: 'Black frame', ar: 'هيكل أسود', en: 'Black frame' },
    { id: 'Green frame', ar: 'هيكل أخضر', en: 'Green frame' },
    { id: 'White plus', ar: 'تشطيب أبيض', en: 'White plus' },
  ]

  const buildingStatuses = [
    { id: 'Newly built', ar: 'حديث البناء', en: 'Newly built' },
    { id: 'Old built', ar: 'قديم البناء', en: 'Old built' },
    { id: 'Under construction', ar: 'قيد الإنشاء', en: 'Under construction' },
  ]

  const seriesList = isAr
    ? [
        'غير قياسي',
        'لينينغراد',
        'لفيف',
        'كييف',
        'فناء تبليسي',
        'موسكو',
        'حضري',
        'تشيكي',
        'خروتشوف',
        'توخاريلي',
        'فيدزيسي',
        'يوغوسلافي',
        'مترومشيني',
        'كافلاشفيلي',
        'أخرى',
      ]
    : [
        'Non-standard',
        'Leningrad',
        'Lvov',
        'Kiev',
        'Tbilisi yard',
        'Moscow',
        'City type',
        'Czech',
        'Khrushchev',
        'Tukhareli',
        'Vedzisi',
        'Yugoslav',
        'Metromsheni',
        'Kavlashvili',
        'Other',
      ]

  const floorTypes = [
    { id: 'Duplex', ar: 'دوبلكس', en: 'Duplex' },
    { id: 'Triplex', ar: 'تريبلكس', en: 'Triplex' },
    { id: 'Attic', ar: 'علية', en: 'Attic' },
  ]

  const heatingTypes = [
    { id: 'Central', ar: 'مركزية', en: 'Central' },
    { id: 'Own gas boiler', ar: 'غلاية غاز فردية', en: 'Gas boiler' },
    { id: 'Electric', ar: 'كهربائية', en: 'Electric' },
    { id: 'None', ar: 'لا يوجد', en: 'None' },
  ]

  return (
    <div className="mt-3 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-5 text-start shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 sm:p-6">
      {/* الصف الأول: حالة مدفوعة | الحمامات | الطابق | البائع */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="mb-2 block text-xs font-extrabold text-slate-400">
            {isAr ? 'حالة مدفوعة' : 'Boost status'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['SUPER VIP', '+VIP', 'VIP'].map((tier) => {
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
          <span className="mb-2 block text-xs font-extrabold text-slate-400">
            {isAr ? 'الحمامات' : 'Bathrooms'}
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
                  className={`flex size-9 items-center justify-center rounded-full border text-xs font-black transition ${
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
          <span className="mb-2 block text-xs font-extrabold text-slate-400">
            {isAr ? 'الطابق' : 'Floor'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              dir="ltr"
              value={filters.minFloor}
              onChange={(e) => updateFilter('minFloor', e.target.value)}
              placeholder={isAr ? 'الأدنى' : 'Min'}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:bg-white focus:outline-none"
            />
            <span className="text-slate-300">—</span>
            <input
              type="number"
              dir="ltr"
              value={filters.maxFloor}
              onChange={(e) => updateFilter('maxFloor', e.target.value)}
              placeholder={isAr ? 'الأقصى' : 'Max'}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-[#0f1d40] focus:border-[#2563eb] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-extrabold text-slate-400">
            {isAr ? 'البائع' : 'Seller'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'owner', label: isAr ? 'المالك' : 'Owner' },
              { id: 'agency', label: isAr ? 'وكالة' : 'Agency' },
              { id: 'installment', label: isAr ? 'بالتقسيط' : 'Installments' },
            ].map((s) => {
              const active = filters.sellerType === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => updateFilter('sellerType', active ? '' : s.id)}
                  className={pillClass(active)}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* الحالة (Condition) */}
      <div>
        <span className="mb-2 block text-xs font-extrabold text-slate-400">
          {isAr ? 'الحالة' : 'Condition'}
        </span>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => {
            const active = filters.condition === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => updateFilter('condition', active ? '' : c.id)}
                className={pillClass(active)}
              >
                {isAr ? c.ar : c.en}
              </button>
            )
          })}
        </div>
      </div>

      {/* حالة المبنى (Building Status) */}
      <div>
        <span className="mb-2 block text-xs font-extrabold text-slate-400">
          {isAr ? 'حالة المبنى' : 'Building status'}
        </span>
        <div className="flex flex-wrap gap-2">
          {buildingStatuses.map((bs) => {
            const active = filters.buildingStatus === bs.id
            return (
              <button
                key={bs.id}
                type="button"
                onClick={() =>
                  updateFilter('buildingStatus', active ? '' : bs.id)
                }
                className={pillClass(active)}
              >
                {isAr ? bs.ar : bs.en}
              </button>
            )
          })}
        </div>
      </div>

      {/* سلسلة المبنى (Building Series) */}
      <div>
        <span className="mb-2 block text-xs font-extrabold text-slate-400">
          {isAr ? 'سلسلة المبنى' : 'Building series'}
        </span>
        <div className="flex flex-wrap gap-2">
          {seriesList.map((ser) => {
            const active = filters.buildingSeries === ser
            return (
              <button
                key={ser}
                type="button"
                onClick={() =>
                  updateFilter('buildingSeries', active ? '' : ser)
                }
                className={pillClass(active)}
              >
                {ser}
              </button>
            )
          })}
        </div>
      </div>

      {/* نوع الطابق + التدفئة */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-2 block text-xs font-extrabold text-slate-400">
            {isAr ? 'نوع الطابق' : 'Floor type'}
          </span>
          <div className="flex flex-wrap gap-2">
            {floorTypes.map((ft) => {
              const active = filters.floorType === ft.id
              return (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => updateFilter('floorType', active ? '' : ft.id)}
                  className={pillClass(active)}
                >
                  {isAr ? ft.ar : ft.en}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-extrabold text-slate-400">
            {isAr ? 'التدفئة' : 'Heating'}
          </span>
          <div className="flex flex-wrap gap-2">
            {heatingTypes.map((ht) => {
              const active = filters.heating === ht.id
              return (
                <button
                  key={ht.id}
                  type="button"
                  onClick={() => updateFilter('heating', active ? '' : ht.id)}
                  className={pillClass(active)}
                >
                  {isAr ? ht.ar : ht.en}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}