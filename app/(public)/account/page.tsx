import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import {
  ArrowDown,
  Check,
  ChevronDown,
  ListFilter,
  Search,
  LogOut,
  UserCog,
  X,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SellRequest = {
  id: string
  project_name: string | null
  area: string | null
  contract_price: number | null
  paid_amount: number | null
  status: string | null
  images: string[] | null
}

type BuyRequest = {
  id: string
  budget: number | null
  max_installment?: number | null
  preferred_areas: string[] | null
  unit_types: string[] | null
}

type Profile = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
}

type BuyerUnitCard = {
  id: string
  title: string
  subtitle: string
  area: string
  type: string
  rooms: number
  delivery: string
  deliveryStatus: 'جاهزة' | 'تحت الإنشاء'
  contractYear: number
  negotiable: boolean
  cash: string
  gain: string
  marketPrice: string
  tags: string[]
  image?: string
}

// بيانات الوحدات الكاملة لواجهة المشتري بالفلاتر والكروت
const buyerMatchedUnits: BuyerUnitCard[] = [
  {
    id: 'hamra-1',
    title: 'ميني كمبوند قصر الحمرا',
    subtitle: 'توليدو · التجمع الخامس · شقة',
    area: 'التجمع الخامس',
    type: 'شقة',
    rooms: 3,
    delivery: '2026',
    deliveryStatus: 'جاهزة',
    contractYear: 2023,
    negotiable: true,
    cash: '2,235,000',
    gain: '+ 314,375',
    marketPrice: '3,200,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'في المنطقة اللي عايزها'],
  },
  {
    id: 'beit-watan-i76',
    title: 'بيت الوطن الحي الأول قطعة i76 التجمع الخامس',
    subtitle: 'فينسيا للتطوير العقار venesia development · التجمع الخامس · شقة',
    area: 'التجمع الخامس',
    type: 'شقة',
    rooms: 3,
    delivery: '2027',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2024,
    negotiable: true,
    cash: '1,000,000',
    gain: '+ 335,937',
    marketPrice: '3,500,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'في المنطقة اللي عايزها'],
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'beit-watan-almera',
    title: 'بيت الوطن',
    subtitle: 'Almera Development · التجمع الخامس · شقة',
    area: 'التجمع الخامس',
    type: 'شقة',
    rooms: 3,
    delivery: '2027',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2023,
    negotiable: true,
    cash: '1,551,400',
    gain: '+ 2,165,000',
    marketPrice: '5,000,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'في المنطقة اللي عايزها'],
    image:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'stayn-october',
    title: "Stay'n",
    subtitle: 'A Plus · 6 أكتوبر · شقة',
    area: '6 أكتوبر',
    type: 'شقة',
    rooms: 2,
    delivery: '2028',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2024,
    negotiable: true,
    cash: '337,004',
    gain: '+ 279,583',
    marketPrice: '2,600,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'نفس نوع الوحدة'],
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'kenan-sohag',
    title: 'كنان',
    subtitle: 'شركة افق للتطوير العقاري · سوهاج · شقة',
    area: 'سوهاج',
    type: 'شقة',
    rooms: 3,
    delivery: '2027',
    deliveryStatus: 'تحت الإنشاء',
    contractYear: 2023,
    negotiable: true,
    cash: '337,370',
    gain: '+ 469,762',
    marketPrice: '3,000,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'نفس نوع الوحدة'],
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
  },
]

// خيارات الفلاتر المطابقة للصور بالظبط
const buyerFilterPills = [
  'منطقتك',
  'الكاش المتاح',
  'أقصى قسط',
  'ميزانيتك',
  'نوع الوحدة',
  'عدد الغرف',
  'الاستلام',
]

const unitTypes = [
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
  'الأنسب لي 🎯',
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

function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('en-US')} ج.م`
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

// Server Actions لتسجيل الخروج وحذف الحساب
async function logout() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/login')
}

async function deleteAccount() {
  'use server'
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) redirect('/login')
  const supabase = await getSupabase()
  await supabase.from('sell_requests').delete().eq('user_id', sessionId)
  await supabase.from('buy_requests').delete().eq('user_id', sessionId)
  await supabase.from('users').delete().eq('id', sessionId)
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/login')
}

type SearchParamsType = {
  view?: string
  q?: string
  pill?: string
  flexible?: string
  sort?: string
  area?: string
  maxCash?: string
  maxInst?: string
  maxContract?: string
  type?: string
  status?: string
  delYear?: string
  conYear?: string
  rooms?: string
  openFilter?: string
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsType>
}) {
  const resolvedParams: SearchParamsType = searchParams ? await searchParams : {}
  const cookieStore = await cookies()

  const sessionId = cookieStore.get('user_session')?.value

  if (!sessionId) {
    redirect('/login')
  }

  const supabase = await getSupabase()

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const { data: sellsData } = await supabase
    .from('sell_requests')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const { data: buysData } = await supabase
    .from('buy_requests')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const sells = (sellsData as SellRequest[]) || []
  const buys = (buysData as BuyRequest[]) || []

  const hasSells = sells.length > 0
  const hasBuys = buys.length > 0

  const isSellerView =
    resolvedParams?.view === 'seller'
      ? true
      : resolvedParams?.view === 'buyer'
        ? false
        : hasSells
  const isBuyerView =
    resolvedParams?.view === 'buyer' ? true : !isSellerView && hasBuys

  const unit = sells[0]
  const buyReq = buys[0]

  const project = unit?.project_name || 'وحدتك'
  const unitArea = unit?.area || 'التجمع الخامس'
  const completion = unit?.images && unit.images.length > 0 ? 100 : 94

  const buyerCashBudget = buyReq?.budget ? money(buyReq.budget) : '3,000,000 ج.م'
  const buyerMaxInstallment = buyReq?.max_installment
    ? money(buyReq.max_installment)
    : '100,000 ج.م'
  const buyerArea = buyReq?.preferred_areas?.[0] || 'التجمع الخامس'

  // قراءة قيم الفلاتر النشطة من الـ URL
  const activePill = resolvedParams.pill || ''
  const isFlexible = resolvedParams.flexible === '1'
  const activeType = resolvedParams.type || ''
  const activeStatus = resolvedParams.status || 'الكل'
  const activeDelYear = resolvedParams.delYear || 'الكل'
  const activeConYear = resolvedParams.conYear || 'الكل'
  const activeRooms = resolvedParams.rooms || 'الكل'
  const searchQuery = resolvedParams.q || ''
  const areaFilter = resolvedParams.area || ''
  const maxCashFilter = resolvedParams.maxCash || ''
  const maxInstFilter = resolvedParams.maxInst || ''
  const maxContractFilter = resolvedParams.maxContract || ''
  const currentSort = resolvedParams.sort || 'الأحدث'

  // حساب عدد الفلاتر المفعلة لعرضه في الدائرة الخضراء بجانب "فلترة"
  let activeFilterCount = 0
  if (isFlexible) activeFilterCount++
  if (activePill) activeFilterCount++
  if (activeType) activeFilterCount++
  if (activeStatus !== 'الكل') activeFilterCount++
  if (activeDelYear !== 'الكل') activeFilterCount++
  if (activeConYear !== 'الكل') activeFilterCount++
  if (activeRooms !== 'الكل') activeFilterCount++
  if (areaFilter) activeFilterCount++
  if (maxCashFilter) activeFilterCount++
  if (maxInstFilter) activeFilterCount++
  if (maxContractFilter) activeFilterCount++

  const isFilterPanelOpen =
    resolvedParams.openFilter === '1' ||
    (resolvedParams.openFilter !== '0' && activeFilterCount > 0)

  // تطبيق الفلترة والترتيب الكامل على الكروت
  const filteredBuyerUnits = buyerMatchedUnits
    .filter((item) => {
      const cashVal = Number(item.cash.replaceAll(',', ''))
      const marketVal = Number(item.marketPrice.replaceAll(',', ''))

      if (
        searchQuery &&
        !`${item.title} ${item.subtitle} ${item.area}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      if (areaFilter && !item.area.includes(areaFilter)) return false
      if (isFlexible && !item.negotiable) return false
      if (activeType && item.type !== activeType) return false
      if (activeStatus !== 'الكل' && item.deliveryStatus !== activeStatus) {
        return false
      }
      if (activeDelYear !== 'الكل') {
        const maxYear = Number(activeDelYear.replace(/[^0-9]/g, ''))
        if (maxYear && Number(item.delivery) > maxYear) return false
      }
      if (activeConYear !== 'الكل') {
        const maxConYear = Number(activeConYear.replace(/[^0-9]/g, ''))
        if (maxConYear && item.contractYear > maxConYear) return false
      }
      if (activeRooms !== 'الكل') {
        const minR = Number(activeRooms.replace('+', ''))
        if (item.rooms < minR) return false
      }
      if (maxCashFilter && cashVal > Number(maxCashFilter)) return false
      if (maxContractFilter && marketVal > Number(maxContractFilter)) {
        return false
      }

      // تفعيل جميع أزرار فلتر بطلبك السريعة
      if (
        activePill === 'منطقتك' &&
        !item.tags.includes('في المنطقة اللي عايزها') &&
        !item.area.includes(buyerArea)
      ) {
        return false
      }
      if (
        activePill === 'الكاش المتاح' &&
        !item.tags.includes('الكاش في ميزانيتك')
      ) {
        return false
      }
      if (activePill === 'أقصى قسط' && !item.tags.includes('القسط مناسب')) {
        return false
      }
      if (
        activePill === 'ميزانيتك' &&
        !item.tags.includes('الكاش في ميزانيتك')
      ) {
        return false
      }
      if (
        activePill === 'نوع الوحدة' &&
        !item.tags.includes('نفس نوع الوحدة') &&
        item.type !== (buyReq?.unit_types?.[0] || 'شقة')
      ) {
        return false
      }
      if (activePill === 'عدد الغرف' && item.rooms < 3) {
        return false
      }
      if (activePill === 'الاستلام' && item.deliveryStatus !== 'جاهزة') {
        return false
      }

      return true
    })
    .sort((a, b) => {
      const cashA = Number(a.cash.replaceAll(',', ''))
      const cashB = Number(b.cash.replaceAll(',', ''))
      const gainA = Number(a.gain.replace(/[^0-9]/g, ''))
      const gainB = Number(b.gain.replace(/[^0-9]/g, ''))

      if (currentSort === 'الأقل كاش') return cashA - cashB
      if (currentSort === 'الأكبر مكسب') return gainB - gainA
      if (currentSort === 'الأقرب للاستلام') {
        return Number(a.delivery) - Number(b.delivery)
      }
      if (currentSort === 'جاهزة للنقل') {
        return a.deliveryStatus === 'جاهزة' ? -1 : 1
      }
      return 0
    })

  // دالة مساعدة لبناء الروابط مع الحفاظ على وضع المشتري والفلاتر الحالية
  const buildBuyerUrl = (updates: Partial<SearchParamsType>) => {
    const merged: Record<string, string> = {}
    if (resolvedParams.view) merged.view = resolvedParams.view
    Object.entries({ ...resolvedParams, ...updates }).forEach(([k, v]) => {
      if (v && v !== 'الكل') {
        merged[k] = v
      } else {
        delete merged[k]
      }
    })
    const qs = new URLSearchParams(merged).toString()
    return qs ? `/account?${qs}` : '/account'
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f6f8] py-8 pb-24 text-[#0a1122] sm:py-12"
    >
      {/* ==================== 1. واجهة البائع (Seller View) ==================== */}
      {isSellerView ? (
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          {/* الهيدر العلوي */}
          <header className="flex items-start justify-between pb-6">
            <div className="text-right">
              <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
                {project}{' '}
                <span className="font-normal text-gray-400">· {unitArea}</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-3 text-[11px] font-bold text-slate-600">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 transition hover:text-[#0a1122]"
                >
                  تسجيل الخروج <LogOut className="size-3.5" />
                </button>
              </form>
              <Link
                href="/account/details"
                className="flex items-center gap-2 transition hover:text-[#105C50]"
              >
                بياناتي <UserCog className="size-3.5" />
              </Link>
            </div>
          </header>

          <section className="mt-2 rounded-[18px] border border-[#105C50]/30 bg-white p-5 text-right shadow-sm sm:p-7">
            <span className="text-[11px] font-bold text-[#105C50]">
              الخطوة الجاية
            </span>
            <h2 className="mt-1 text-base font-extrabold text-[#0a1122] sm:text-lg">
              فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك
            </h2>

            <div className="mt-4">
              <Link
                href={unit?.id ? `/sell?resume=${unit.id}` : '/sell'}
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#105C50] px-6 text-xs font-bold text-white transition hover:bg-[#0c483f] sm:text-sm"
              >
                أضف الصور
              </Link>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">اكتمال بيانات وحدتك</span>
                <strong className="font-extrabold text-[#0a1122]">
                  {completion}%
                </strong>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#105C50] transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="mt-2 flex justify-start">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
                  الصور
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#eaf8f2] px-4 py-3 text-right text-xs font-bold text-[#105C50]">
              فيه 4435 مشترين مستنيين وحدة زي بتاعتك — كمّل بياناتها وشوفهم
            </div>

            <p className="mt-4 border-t border-gray-100 pt-3.5 text-right text-[11px] leading-relaxed text-gray-400">
              المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
            </p>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                وحداتي ({(sells ?? []).length || 1})
              </h2>
              <Link
                href="/sell"
                className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#101A2B] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]"
              >
                + ضيف وحدة تانية
              </Link>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[14px] border border-gray-200/80 bg-white px-5 py-4 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {project}{' '}
                  <span className="font-normal text-gray-400">· {unitArea}</span>
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  بيانات وحدتك وصورها
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
                {completion}%
              </span>
            </div>
            <p className="mt-2.5 text-right text-[11px] text-gray-400">
              عندك أكتر من وحدة عايز تخرج منها؟ ضيفها هنا — كل وحدة ليها ملفها ومشترينها وبتتتابع لوحدها.
            </p>
          </section>

          <section className="mt-7 pr-1">
            <Timeline />
          </section>

          <section className="mt-7 grid grid-cols-2 gap-4 rounded-[16px] border border-gray-200/80 bg-white p-5 text-right shadow-sm sm:p-6">
            <div>
              <p className="text-[11px] text-gray-400">سعر الوحدة في العقد</p>
              <strong className="mt-1 block text-lg font-extrabold text-[#0a1122] sm:text-xl">
                {unit?.contract_price
                  ? money(unit.contract_price)
                  : '3,000,000 ج.م'}
              </strong>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">
                اللي دفعته (هدف الاسترداد)
              </p>
              <strong className="mt-1 block text-lg font-extrabold text-[#105C50] sm:text-xl">
                {unit?.paid_amount ? money(unit.paid_amount) : '2,000,000 ج.م'}
              </strong>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href={unit?.id ? `/sell?resume=${unit.id}` : '/sell'}
              className="flex flex-col justify-center rounded-[14px] border border-gray-200/80 bg-white p-4 text-right shadow-sm transition hover:border-gray-300"
            >
              <p className="text-xs font-extrabold text-[#0a1122]">
                بيانات وحدتك
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {completion < 100 ? '16/17 مكتملة' : 'مكتملة بالكامل'}
              </p>
            </Link>
            <Link
              href="/account/offers"
              className="flex flex-col justify-center rounded-[14px] border border-gray-200/80 bg-white p-4 text-right shadow-sm transition hover:border-gray-300"
            >
              <p className="text-xs font-extrabold text-[#0a1122]">العروض</p>
              <p className="mt-1 text-[11px] text-gray-400">لسه مفيش</p>
            </Link>
            <a
              href="https://wa.me/201018595959"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col justify-center rounded-[14px] bg-[#101A2B] p-4 text-right text-white shadow-sm transition hover:bg-[#16223f]"
            >
              <p className="text-xs font-extrabold text-white">مسؤول حالتك</p>
              <p className="mt-1 text-[11px] text-gray-300">
                كلمنا على واتساب في أي وقت
              </p>
            </a>
          </section>

          <p className="mt-4 text-right text-[11px] leading-relaxed text-gray-400">
            <Link
              href="/account/documents"
              className="font-bold text-[#0a1122] underline hover:text-[#105C50]"
            >
              مستنداتك
            </Link>{' '}
            — المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
          </p>

          <AccountFooterActions />
        </div>
      ) : isBuyerView ? (
        /* ==================== 2. واجهة المشتري الكاملة بالفلاتر المفتوحة والمغلقة والكروت ==================== */
        <div className="mx-auto max-w-[980px] px-3 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
              فرص تناسب ميزانيتك
            </h1>
            <div className="flex items-center gap-3">
              <Link
                href="/account/offers"
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-xs font-bold text-[#0a1122] shadow-sm transition hover:bg-gray-50"
              >
                عروضي
              </Link>
              <Link
                href="/buy?edit=1"
                className="text-xs font-bold text-[#105C50] transition hover:underline"
              >
                عدّل ميزانيتك
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="px-2 text-xs font-bold text-red-500 transition hover:text-red-700"
                >
                  خروج
                </button>
              </form>
            </div>
          </header>

          {/* شريط ملخص الميزانية */}
          <section className="mt-5 rounded-[14px] border border-gray-200/80 bg-white px-5 py-3.5 text-right shadow-sm">
            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-xs">
              <div>
                <span className="text-gray-400">الكاش المتاح دلوقتي: </span>
                <strong className="font-extrabold text-[#0a1122]">
                  {buyerCashBudget}
                </strong>
              </div>
              <div>
                <span className="text-gray-400">أقصى قسط يريحك: </span>
                <strong className="font-extrabold text-[#0a1122]">
                  {buyerMaxInstallment}
                </strong>
              </div>
            </div>
          </section>

          {/* شريط أزرار الفلترة السريعة بطلبك (تفاعلية) */}
          <section className="mt-4 text-right">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <span className="ml-1 text-xs font-extrabold text-[#0a1122]">
                فلتر بطلبك:
              </span>
              {buyerFilterPills.map((pill) => {
                const isSelected = activePill === pill
                return (
                  <Link
                    key={pill}
                    scroll={false}
                    href={buildBuyerUrl({
                      pill: isSelected ? '' : pill,
                    })}
                    className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold shadow-sm transition ${
                      isSelected
                        ? 'border-[#105C50] bg-[#105C50] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#105C50] hover:text-[#105C50]'
                    }`}
                  >
                    {pill}
                  </Link>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              مرتّبة بالأنسب لطلبك — اختار أي شرط عشان تشوف اللي يطابقه بالظبط.
            </p>
          </section>

          {/* ==================== شريط البحث + لوحة الفلاتر الكاملة (تفتح وتغلق فوراً بالضغط) ==================== */}
          <div className="mt-4">
            {/* مفتاح التحكم الفوري بفتح وإغلاق الفلاتر بدون تعارض مع البحث */}
            <input
              id="buyer-filter-toggle"
              type="checkbox"
              defaultChecked={isFilterPanelOpen}
              className="peer/filter sr-only"
            />

            <div className="rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-sm sm:p-5">
              {/* نموذج البحث */}
              <form method="GET" action="/account" className="relative">
                {Object.entries(resolvedParams).map(([key, value]) =>
                  key !== 'q' && value ? (
                    <input key={key} type="hidden" name={key} value={value} />
                  ) : null
                )}
                <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="دوّر باسم المشروع أو المنطقة أو كود الوحدة (U-10057)..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#105C50] focus:outline-none sm:h-11 sm:text-sm"
                />
              </form>

              {/* شريط أزرار: فلترة + قابل للتفاوض + عدد الوحدات + ترتيب */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* زر فتح/إغلاق لوحة الفلاتر الكاملة */}
                  <label
                    htmlFor="buyer-filter-toggle"
                    className={`inline-flex h-9 cursor-pointer select-none items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                      activeFilterCount > 0 || isFilterPanelOpen
                        ? 'border-[#105C50] bg-[#eff8f6] text-[#105C50]'
                        : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
                    }`}
                  >
                    <ListFilter className="size-3.5" />
                    <span>فلترة</span>
                    {activeFilterCount > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#105C50] text-[10px] font-bold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </label>

                  {/* زر قابل للتفاوض */}
                  <Link
                    scroll={false}
                    href={buildBuyerUrl({
                      flexible: isFlexible ? '' : '1',
                    })}
                    className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                      isFlexible
                        ? 'border-[#d97706] bg-amber-50/70 text-[#b45309]'
                        : 'border-gray-200 bg-white text-[#0a1122] hover:bg-gray-50'
                    }`}
                  >
                    <span>قابل للتفاوض</span>
                    <ArrowDown className="size-3 text-[#d97706]" />
                  </Link>

                  <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
                    {isFlexible ? '2789' : '200'} وحدة متاحة
                  </span>
                </div>

                {/* قائمة الترتيب المنسدلة بكل الـ 11 خيار */}
                <form
                  method="GET"
                  action="/account"
                  className="flex items-center gap-1.5"
                >
                  {Object.entries(resolvedParams).map(([key, value]) =>
                    key !== 'sort' && value ? (
                      <input key={key} type="hidden" name={key} value={value} />
                    ) : null
                  )}
                  <span className="text-[11px] text-gray-400 sm:text-xs">
                    ترتيب
                  </span>
                  <div className="relative">
                    <select
                      name="sort"
                      defaultValue={currentSort}
                      className="h-9 min-w-[130px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none sm:h-10 sm:min-w-[155px]"
                    >
                      {sorts.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-500" />
                  </div>
                  <button
                    type="submit"
                    className="h-9 rounded-xl border border-gray-200 bg-gray-50 px-2.5 text-[11px] font-bold text-[#0a1122] transition hover:bg-gray-100 sm:h-10"
                  >
                    تطبيق
                  </button>
                </form>
              </div>

              {/* شريط الفلاتر المفعلة حالياً (يظهر تحت الأزرار مثل الصورة) */}
              {activeFilterCount > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-start gap-2 border-t border-gray-100 pt-3">
                  {isFlexible && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ flexible: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>قابل للتفاوض</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {activePill && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ pill: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>{activePill}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {activeType && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ type: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>{activeType}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {activeStatus !== 'الكل' && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ status: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>{activeStatus}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {activeDelYear !== 'الكل' && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ delYear: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>{activeDelYear}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {activeConYear !== 'الكل' && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ conYear: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>{activeConYear}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {activeRooms !== 'الكل' && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ rooms: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span dir="ltr">{activeRooms} غرف</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {areaFilter && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ area: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>منطقة: {areaFilter}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  {maxCashFilter && (
                    <Link
                      scroll={false}
                      href={buildBuyerUrl({ maxCash: '' })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4f1] px-3 py-1 text-xs font-bold text-[#105C50]"
                    >
                      <span>كاش حتى {Number(maxCashFilter).toLocaleString('en-US')}</span>
                      <X className="size-3.5" />
                    </Link>
                  )}
                  <Link
                    scroll={false}
                    href={
                      resolvedParams.view
                        ? `/account?view=${resolvedParams.view}`
                        : '/account'
                    }
                    className="mr-1 text-xs text-gray-400 underline hover:text-gray-600"
                  >
                    مسح الكل
                  </Link>
                </div>
              )}
            </div>

            {/* ==================== محتوى لوحة الفلترة المتقدمة الكاملة (تظهر فوراً عند الضغط على فلترة) ==================== */}
            <form
              method="GET"
              action="/account"
              className="mt-3 hidden rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-sm peer-checked/filter:block sm:p-7"
            >
              {/* الحفاظ على الفلاتر المختارة بالأزرار عند إرسال الفورم */}
              {resolvedParams.view && (
                <input type="hidden" name="view" value={resolvedParams.view} />
              )}
              {activePill && (
                <input type="hidden" name="pill" value={activePill} />
              )}
              {isFlexible && <input type="hidden" name="flexible" value="1" />}
              {activeType && (
                <input type="hidden" name="type" value={activeType} />
              )}
              {activeStatus !== 'الكل' && (
                <input type="hidden" name="status" value={activeStatus} />
              )}
              {activeDelYear !== 'الكل' && (
                <input type="hidden" name="delYear" value={activeDelYear} />
              )}
              {activeConYear !== 'الكل' && (
                <input type="hidden" name="conYear" value={activeConYear} />
              )}
              {activeRooms !== 'الكل' && (
                <input type="hidden" name="rooms" value={activeRooms} />
              )}
              {searchQuery && (
                <input type="hidden" name="q" value={searchQuery} />
              )}
              {currentSort !== 'الأحدث' && (
                <input type="hidden" name="sort" value={currentSort} />
              )}
              <input type="hidden" name="openFilter" value="1" />

              {/* الصف الأول: المناطق + أقصى كاش مطلوب دلوقتي + أقصى قسط شهري */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* المناطق */}
                <div className="text-right">
                  <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                    المناطق
                  </label>
                  <input
                    type="text"
                    name="area"
                    defaultValue={areaFilter}
                    placeholder="دوّر على المنطقة..."
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                {/* أقصى كاش مطلوب دلوقتي */}
                <div className="text-right">
                  <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                    أقصى كاش مطلوب دلوقتي
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="maxCash"
                      defaultValue={maxCashFilter}
                      className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                    />
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      ج.م
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-400">
                    أهم رقم — ده اللي هتدفعه عند النقل
                  </p>
                </div>

                {/* أقصى قسط شهري */}
                <div className="text-right">
                  <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                    أقصى قسط شهري
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="maxInst"
                      defaultValue={maxInstFilter}
                      className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                    />
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      ج.م
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-400">
                    الأقساط الربع/نص سنوية بنحسبها بما يعادلها شهريًا
                  </p>
                </div>
              </div>

              {/* الصف الثاني: نوع الوحدة */}
              <div className="mt-6 text-right">
                <p className="mb-2.5 text-xs font-bold text-[#0a1122]">
                  نوع الوحدة
                </p>
                <div className="flex flex-wrap gap-2">
                  {unitTypes.map((type) => {
                    const isSelected = activeType === type
                    return (
                      <Link
                        key={type}
                        scroll={false}
                        href={buildBuyerUrl({
                          type: isSelected ? '' : type,
                          openFilter: '1',
                        })}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-[#105C50] bg-[#105C50] text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {type}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* الصف الثالث: الاستلام + سنة الاستلام + سنة التعاقد */}
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* الاستلام */}
                <div className="text-right">
                  <p className="mb-2.5 text-xs font-bold text-[#0a1122]">
                    الاستلام
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deliveryStatuses.map((status) => {
                      const isSelected = activeStatus === status
                      return (
                        <Link
                          key={status}
                          scroll={false}
                          href={buildBuyerUrl({
                            status,
                            openFilter: '1',
                          })}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-[#105C50] bg-[#105C50] text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {status}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* سنة الاستلام */}
                <div className="text-right">
                  <p className="mb-2.5 text-xs font-bold text-[#0a1122]">
                    سنة الاستلام
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deliveryYears.map((yr) => {
                      const isSelected = activeDelYear === yr
                      return (
                        <Link
                          key={yr}
                          scroll={false}
                          href={buildBuyerUrl({
                            delYear: yr,
                            openFilter: '1',
                          })}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-[#105C50] bg-[#105C50] text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {yr}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* سنة التعاقد */}
                <div className="text-right">
                  <p className="mb-2.5 text-xs font-bold text-[#0a1122]">
                    سنة التعاقد
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contractYears.map((yr) => {
                      const isSelected = activeConYear === yr
                      return (
                        <Link
                          key={yr}
                          scroll={false}
                          href={buildBuyerUrl({
                            conYear: yr,
                            openFilter: '1',
                          })}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-[#105C50] bg-[#105C50] text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {yr}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* الصف الرابع: أقل عدد غرف + أقصى سعر تعاقد */}
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* أقل عدد غرف */}
                <div className="text-right">
                  <p className="mb-2.5 text-xs font-bold text-[#0a1122]">
                    أقل عدد غرف
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roomOptions.map((rm) => {
                      const isSelected = activeRooms === rm
                      return (
                        <Link
                          key={rm}
                          scroll={false}
                          href={buildBuyerUrl({
                            rooms: rm,
                            openFilter: '1',
                          })}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-[#105C50] bg-[#105C50] text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span dir="ltr">{rm}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* أقصى سعر تعاقد */}
                <div className="text-right">
                  <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                    أقصى سعر تعاقد
                  </label>
                  <div className="relative max-w-sm">
                    <input
                      type="number"
                      name="maxContract"
                      defaultValue={maxContractFilter}
                      className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-10 text-xs text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                    />
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* الشريط السفلي للوحة الفلترة: اعرض النتائج + مسح الكل + إخفاء */}
              <div className="mt-7 flex items-center justify-between border-t border-gray-100 pt-5">
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#105C50] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0c483f]"
                  >
                    اعرض النتائج
                  </button>
                  <Link
                    scroll={false}
                    href={
                      resolvedParams.view
                        ? `/account?view=${resolvedParams.view}`
                        : '/account'
                    }
                    className="text-xs font-medium text-gray-500 hover:text-[#0a1122]"
                  >
                    مسح الكل
                  </Link>
                </div>

                <label
                  htmlFor="buyer-filter-toggle"
                  className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-700"
                >
                  إخفاء
                </label>
              </div>
            </form>
          </div>

          {/* عرض الكروت المفلترة */}
          <section className="mt-7">
            <h2 className="mb-4 text-right text-sm font-extrabold text-[#0a1122] sm:text-base">
              الفرص في المنطقة اللي طلبتها ({buyerArea}){' '}
              <span className="font-normal text-gray-400">(60)</span>
            </h2>
            <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3">
              {filteredBuyerUnits.map((item) => (
                <BuyerPropertyCard key={item.id} unit={item} />
              ))}
            </div>
          </section>

          <AccountFooterActions />
        </div>
      ) : (
        /* ==================== 3. حساب جديد ==================== */
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          <section className="rounded-[20px] border border-gray-200/80 bg-white p-8 text-center shadow-sm sm:p-12">
            <h2 className="text-lg font-extrabold text-[#0a1122] sm:text-xl">
              أهلاً يا {profile.name?.split(' ')[0] || 'صاحب الحساب'} — ليس لديك
              أي طلبات حالياً
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
              ابدأ الآن بعرض وحدتك للتنازل بدون أوفر واسترداد ما دفعته كاش، أو
              سجل ميزانيتك كمشتري لتصلك الفرص المناسبة.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/sell"
                className="rounded-[10px] bg-[#105C50] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#0c483f] sm:text-sm"
              >
                عايز أبيع وحدتي
              </Link>
              <Link
                href="/buy"
                className="rounded-[10px] bg-[#101A2B] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#16223f] sm:text-sm"
              >
                عايز أشتري وحدة
              </Link>
            </div>
          </section>
          <AccountFooterActions />
        </div>
      )}
    </main>
  )
}

function BuyerPropertyCard({ unit }: { unit: BuyerUnitCard }) {
  return (
    <Link
      href={`/opportunities/${unit.id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-[14px] border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md sm:rounded-[18px]"
    >
      <div>
        {unit.image && (
          <div className="h-[115px] w-full overflow-hidden bg-gray-100 sm:h-[175px]">
            <img
              src={unit.image}
              alt={unit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-3 text-right sm:p-5">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-snug text-[#0a1122] group-hover:text-[#105C50] sm:text-[15px]">
            {unit.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[10px] text-gray-400 sm:text-xs">
            {unit.subtitle}
          </p>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] text-gray-400 sm:text-[11px]">
              المطلوب كاش دلوقتي
            </p>
            <p className="mt-0.5 text-sm font-extrabold tracking-tight text-[#0a1122] sm:text-xl">
              {unit.cash}{' '}
              <span className="text-[11px] font-bold sm:text-xs">ج.م</span>
            </p>
          </div>
          <div className="mt-2.5 rounded-xl bg-[#ecfbf3] px-2.5 py-2 text-right sm:mt-3 sm:px-3 sm:py-2.5">
            <p
              dir="ltr"
              className="text-right text-xs font-extrabold text-[#105C50] sm:text-sm"
            >
              {unit.gain} ج.م
            </p>
            <p className="mt-0.5 text-[9px] text-[#105C50]/80 sm:text-[10px]">
              سعر السوق اليوم: {unit.marketPrice} ج.م
            </p>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
            {unit.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[#e3f2ef] px-2 py-0.5 text-[9px] font-bold text-[#105C50] sm:text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Timeline() {
  const steps = [
    { title: 'بدأنا طلبك', status: 'done' as const },
    { title: 'بيانات وحدتك وصورها', status: 'current' as const },
    { title: 'بنراجع وننشر وحدتك', status: 'upcoming' as const },
    { title: 'معروضة في السوق', status: 'upcoming' as const },
    { title: 'بندور على المشتري المناسب', status: 'upcoming' as const },
    { title: 'عندك عرض', status: 'upcoming' as const },
    { title: 'نقل التعاقد (بنراجع المستندات)', status: 'upcoming' as const },
    { title: 'تمت العملية', status: 'upcoming' as const },
  ]

  return (
    <ol className="relative flex flex-col items-start">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        return (
          <li
            key={step.title}
            className="relative flex items-start gap-3.5 pb-6 last:pb-0"
          >
            {!isLast && (
              <span
                className={`absolute right-[11px] top-6 h-full w-[1.5px] ${
                  step.status === 'done' ? 'bg-[#105C50]' : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                step.status === 'done'
                  ? 'bg-[#105C50] text-white'
                  : step.status === 'current'
                    ? 'bg-[#101A2B] text-white'
                    : 'bg-transparent text-gray-400'
              }`}
            >
              {step.status === 'done' ? (
                <Check className="size-3.5 stroke-[2.5]" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`pt-0.5 text-xs ${
                step.status === 'current'
                  ? 'font-extrabold text-[#0a1122]'
                  : step.status === 'done'
                    ? 'font-medium text-gray-600'
                    : 'font-normal text-gray-400'
              }`}
            >
              {step.title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function AccountFooterActions() {
  return (
    <div className="mt-10 flex items-center justify-center gap-6 border-t border-gray-200 pt-4 text-[11px] font-bold">
      <Link
        href="/account/details"
        className="py-2 text-gray-500 transition hover:text-[#105C50]"
      >
        بياناتي
      </Link>
      <form action={deleteAccount}>
        <button
          type="submit"
          className="py-2 text-red-500 transition hover:text-red-700"
        >
          حذف الحساب
        </button>
      </form>
    </div>
  )
}