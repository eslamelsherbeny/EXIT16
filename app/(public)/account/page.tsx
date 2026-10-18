import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import {
  AlertCircle,
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  ListFilter,
  LogOut,
  Search,
  Sparkles,
  UserCog,
  X,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SellRequest = {
  id: string
  project_name: string | null
  developer_name?: string | null
  area: string | null
  unit_type?: string | null
  rooms?: number | null
  contract_price: number | null
  paid_amount: number | null
  market_price?: number | null
  delivery_status?: string | null
  contract_year?: number | null
  willing_to_discount?: boolean | null
  status: string | null
  admin_note?: string | null
  images: string[] | null
  created_at?: string | null
}

type BuyRequest = {
  id: string
  budget: number | null
  available_cash?: number | null
  max_installment?: number | null
  preferred_areas: string[] | null
  unit_types: string[] | null
  status?: string | null
  created_at?: string | null
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

// بيانات الوحدات الافتراضية لواجهة المشتري (تُدمج مع الوحدات المعتمدة من الأدمن)
const defaultBuyerUnits: BuyerUnitCard[] = [
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

// ترجمة حالة العقار للشارات والألوان
function getSellerStatusMeta(status: string | null | undefined, hasImages: boolean) {
  const clean = (status || 'pending').trim().toLowerCase()

  switch (clean) {
    case 'active':
    case 'approved':
    case 'published':
      return {
        code: 'active',
        badgeText: 'معروضة في السوق الآن',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        headline: 'وحدتك معتمدة ومعروضة الآن أمام المشترين 🎉',
        subtext: 'فريقنا يرشح وحدتك حالياً للمشترين المطابقين لميزانيتها في نفس منطقتك.',
        stepIndex: 4, // المرحلة 5 (0-indexed = 4): بندور على المشتري المناسب
      }
    case 'offer_received':
      return {
        code: 'offer_received',
        badgeText: 'يوجد عرض شراء جديد 💰',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        headline: 'لديك عرض شراء جاد على وحدتك! 💰',
        subtext: 'تواصل مع مسؤول حالتك أو راجع صفحة العروض للاطلاع على التفاصيل وإتمام الاتفاق.',
        stepIndex: 5, // المرحلة 6: عندك عرض
      }
    case 'transferring':
      return {
        code: 'transferring',
        badgeText: 'جاري نقل التعاقد 📄',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
        headline: 'وحدتك في مرحلة مراجعة المستندات ونقل التعاقد 📄',
        subtext: 'يرجى التأكد من تجهيز العقد الأصلي وإيصالات السداد لإتمام التنازل في شركة التطوير.',
        stepIndex: 6, // المرحلة 7: نقل التعاقد
      }
    case 'sold':
      return {
        code: 'sold',
        badgeText: 'تم البيع بنجاح 🏆',
        badgeClass: 'bg-teal-600 text-white',
        headline: 'مبروك! تمت عملية بيع وحدتك ونقل التعاقد بنجاح 🏆',
        subtext: 'سعدنا بخدمتك في منصة دارك للتخارج العقاري الآمن بدون أوفر.',
        stepIndex: 8, // كل المراحل مكتملة
      }
    case 'rejected':
      return {
        code: 'rejected',
        badgeText: 'يحتاج لتعديل البيانات',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
        headline: 'يرجى مراجعة وتحديث بيانات وحدتك لإعادة النشر',
        subtext: 'قام فريق المراجعة بإضافة ملاحظة على طلبك. يمكنك تعديل البيانات أو التواصل معنا.',
        stepIndex: 1,
      }
    default:
      if (!hasImages) {
        return {
          code: 'pending_images',
          badgeText: 'بانتظار الصور',
          badgeClass: 'bg-amber-50 text-amber-600',
          headline: 'فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك',
          subtext: 'الوحدات اللي فيها صور واضحة بتتباع أسرع 4 مرات.',
          stepIndex: 1, // المرحلة 2: بيانات وحدتك وصورها
        }
      }
      return {
        code: 'pending_review',
        badgeText: 'قيد مراجعة الإدارة',
        badgeClass: 'bg-blue-50 text-blue-700',
        headline: 'استلمنا بيانات وحدتك وصورها — فريقنا يراجعها الآن لنشرها',
        subtext: 'بمجرد اعتماد الطلب من لوحة الإدارة ستتغير الحالة هنا فوراً وتظهر في صفحة الفرص.',
        stepIndex: 2, // المرحلة 3: بنراجع وننشر وحدتك
      }
  }
}

function getBuyerStatusMeta(status: string | null | undefined) {
  const clean = (status || 'new').trim().toLowerCase()
  switch (clean) {
    case 'contacted':
      return {
        label: 'تم التواصل معك من فريق المبيعات 📞',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      }
    case 'qualified':
    case 'viewing':
      return {
        label: 'جاري تنسيق المعاينة والعروض المطابقة 🎯',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    case 'closed':
    case 'purchased':
      return {
        label: 'تم إتمام التعاقد بنجاح 🏆',
        className: 'bg-teal-600 text-white border-teal-600',
      }
    case 'archived':
    case 'cancelled':
      return {
        label: 'الطلب مؤرشف / متوقف مؤقتاً',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
      }
    default:
      return {
        label: 'طلبك نشط — يتم ترشيح الفرص المطابقة لميزانيتك ✨',
        className: 'bg-[#eff8f6] text-[#105C50] border-[#105C50]/20',
      }
  }
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
  unitId?: string
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
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/login')
  }

  // جلب طلبات البيع والشراء الخاصة بالمستخدم (سواء بـ user_id أو بنفس الإيميل/الموبايل لضمان عدم ضياع أي طلب)
  const cleanEmail = (profile.email || '').trim().toLowerCase()
  const cleanPhone = (profile.phone || '').trim()

  const [{ data: allSells }, { data: allBuys }, { data: activeMarketUnits }] =
    await Promise.all([
      supabase
        .from('sell_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('buy_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('sell_requests')
        .select('*')
        .in('status', ['active', 'approved', 'published'])
        .order('created_at', { ascending: false }),
    ])

  const sells = ((allSells as SellRequest[]) || []).filter(
    (s: any) =>
      s.user_id === profile.id ||
      (cleanEmail && String(s.email || '').trim().toLowerCase() === cleanEmail) ||
      (cleanPhone && String(s.phone || '').trim() === cleanPhone)
  )

  const buys = ((allBuys as BuyRequest[]) || []).filter(
    (b: any) =>
      b.user_id === profile.id ||
      (cleanEmail && String(b.email || '').trim().toLowerCase() === cleanEmail) ||
      (cleanPhone && String(b.phone || '').trim() === cleanPhone)
  )

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

  const unit =
    (resolvedParams.unitId
      ? sells.find((s) => s.id === resolvedParams.unitId)
      : sells[0]) || sells[0]
  const buyReq = buys[0]

  const project = unit?.project_name || 'وحدتك العقارية'
  const unitArea = unit?.area || 'التجمع الخامس'
  const hasImages = Boolean(unit?.images && unit.images.length > 0)
  const completion = hasImages ? 100 : 94
  const sellerStatus = getSellerStatusMeta(unit?.status, hasImages)
  const buyerStatus = getBuyerStatusMeta(buyReq?.status)

  const buyerCashBudget =
    buyReq?.available_cash || buyReq?.budget
      ? money(buyReq.available_cash || buyReq.budget)
      : '3,000,000 ج.م'
  const buyerMaxInstallment = buyReq?.max_installment
    ? money(buyReq.max_installment)
    : '100,000 ج.م'
  const buyerArea = buyReq?.preferred_areas?.[0] || 'التجمع الخامس'

  // تحويل الوحدات المعتمدة من الأدمن في الداتابيز إلى كروت مشتري حقيقية
  const dynamicMarketCards: BuyerUnitCard[] = ((activeMarketUnits as SellRequest[]) || []).map(
    (u) => {
      const paid = Number(u.paid_amount || 0)
      const contract = Number(u.contract_price || 0)
      const market = Number(u.market_price || contract * 1.25 || 0)
      const gainVal = Math.max(0, market - contract)
      return {
        id: u.id,
        title: u.project_name || 'وحدة سكنية مميزة',
        subtitle: `${u.developer_name || 'مطور عقاري'} · ${u.area || 'القاهرة الجديدة'} · ${u.unit_type || 'شقة'}`,
        area: u.area || 'التجمع الخامس',
        type: u.unit_type || 'شقة',
        rooms: Number(u.rooms || 3),
        delivery: '2026',
        deliveryStatus:
          u.delivery_status === 'جاهزة' || u.delivery_status === 'فوري'
            ? 'جاهزة'
            : 'تحت الإنشاء',
        contractYear: Number(u.contract_year || 2024),
        negotiable: Boolean(u.willing_to_discount),
        cash: paid.toLocaleString('en-US'),
        gain: `+ ${gainVal.toLocaleString('en-US')}`,
        marketPrice: market.toLocaleString('en-US'),
        tags: ['معتمدة من الإدارة', 'بدون أوفر', u.area || 'موقع مميز'],
        image: u.images?.[0] || undefined,
      }
    }
  )

  const buyerMatchedUnits = [...dynamicMarketCards, ...defaultBuyerUnits]

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
      {/* أزرار التبديل السريع لو المستخدم عنده طلب بيع وطلب شراء معاً */}
      {hasSells && hasBuys && (
        <div className="mx-auto mb-6 flex max-w-[680px] justify-center gap-2 px-4">
          <Link
            href="/account?view=seller"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              isSellerView
                ? 'bg-[#105C50] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            لوحة البائع ({sells.length})
          </Link>
          <Link
            href="/account?view=buyer"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              isBuyerView
                ? 'bg-[#105C50] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            لوحة المشتري ({buys.length})
          </Link>
        </div>
      )}

      {/* ==================== 1. واجهة البائع (Seller View) ==================== */}
      {isSellerView ? (
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          {/* الهيدر العلوي */}
          <header className="flex items-start justify-between pb-6">
            <div className="text-right">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${sellerStatus.badgeClass}`}
                >
                  <Sparkles className="size-3" />
                  {sellerStatus.badgeText}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
                {project}{' '}
                <span className="font-normal text-gray-400">· {unitArea}</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-3 text-[11px] font-bold text-slate-600">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-red-600 transition hover:text-red-700"
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

          {/* الكارت العلوي المتغير ديناميكياً حسب حالة الأدمن */}
          <section className="mt-2 rounded-[18px] border border-[#105C50]/30 bg-white p-5 text-right shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#105C50]">
                حالة طلبك الآن
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sellerStatus.badgeClass}`}>
                {sellerStatus.badgeText}
              </span>
            </div>

            <h2 className="mt-2 text-base font-extrabold text-[#0a1122] sm:text-lg">
              {sellerStatus.headline}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {sellerStatus.subtext}
            </p>

            {/* إظهار ملاحظة الأدمن أو سبب الرفض إن وجد */}
            {unit?.admin_note && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <strong className="block font-extrabold">ملاحظة من إدارة المنصة:</strong>
                  <p className="mt-0.5 leading-relaxed">{unit.admin_note}</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2.5">
              {sellerStatus.code === 'active' && unit?.id ? (
                <Link
                  href={`/opportunities/${unit.id}`}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#105C50] px-5 text-xs font-bold text-white transition hover:bg-[#0c483f]"
                >
                  <span>معاينة إعلان وحدتك في الموقع</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              ) : sellerStatus.code === 'offer_received' ? (
                <Link
                  href="/account/offers"
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#105C50] px-6 text-xs font-bold text-white transition hover:bg-[#0c483f]"
                >
                  استعرض العروض المقدمة
                </Link>
              ) : (
                <Link
                  href={unit?.id ? `/sell?resume=${unit.id}` : '/sell'}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#105C50] px-6 text-xs font-bold text-white transition hover:bg-[#0c483f] sm:text-sm"
                >
                  {hasImages ? 'تعديل بيانات أو صور الوحدة' : 'أضف الصور'}
                </Link>
              )}
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
            </div>

            <div className="mt-4 rounded-xl bg-[#eaf8f2] px-4 py-3 text-right text-xs font-bold text-[#105C50]">
              فيه 4435 مشترين مستنيين وحدة زي بتاعتك — تابع حالة طلبك من هنا أولاً بأول
            </div>

            <p className="mt-4 border-t border-gray-100 pt-3.5 text-right text-[11px] leading-relaxed text-gray-400">
              المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
            </p>
          </section>

          {/* قائمة وحدات البائع */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                وحداتي ({sells.length})
              </h2>
              <Link
                href="/sell"
                className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#101A2B] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]"
              >
                + ضيف وحدة تانية
              </Link>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              {sells.map((item) => {
                const itemHasImages = Boolean(item.images && item.images.length > 0)
                const itemMeta = getSellerStatusMeta(item.status, itemHasImages)
                const isSelectedUnit = item.id === unit?.id
                return (
                  <Link
                    key={item.id}
                    href={`/account?view=seller&unitId=${item.id}`}
                    className={`flex items-center justify-between rounded-[14px] border bg-white px-5 py-4 shadow-sm transition ${
                      isSelectedUnit
                        ? 'border-[#105C50] ring-1 ring-[#105C50]/30'
                        : 'border-gray-200/80 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                        {item.project_name || 'وحدتك'}{' '}
                        <span className="font-normal text-gray-400">
                          · {item.area || 'غير محدد'}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        المطلوب كاش: {money(item.paid_amount)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${itemMeta.badgeClass}`}
                    >
                      {itemMeta.badgeText}
                    </span>
                  </Link>
                )
              })}
            </div>
            <p className="mt-2.5 text-right text-[11px] text-gray-400">
              عندك أكتر من وحدة عايز تخرج منها؟ ضيفها هنا — كل وحدة ليها ملفها ومشترينها وبتتتابع لوحدها.
            </p>
          </section>

          {/* التايم لاين الديناميكي المرتبط بحالة الأدمن */}
          <section className="mt-7 pr-1">
            <Timeline currentStepIndex={sellerStatus.stepIndex} isRejected={sellerStatus.code === 'rejected'} />
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
              <p className="mt-1 text-[11px] text-gray-400">
                {sellerStatus.code === 'offer_received' ? 'لديك عرض جديد 💰' : 'لسه مفيش'}
              </p>
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
        /* ==================== 2. واجهة المشتري الكاملة ==================== */
        <div className="mx-auto max-w-[980px] px-3 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
                فرص تناسب ميزانيتك
              </h1>
              {/* شارة حالة طلب الشراء المحدثة من لوحة الأدمن */}
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${buyerStatus.className}">
                <CheckCircle2 className="size-3.5 text-[#105C50]" />
                <span>حالة طلبك: {buyerStatus.label}</span>
              </div>
            </div>
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
                  className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                >
                  <span>تسجيل الخروج</span>
                  <LogOut className="size-3.5" />
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

          {/* شريط أزرار الفلترة السريعة */}
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

          {/* شريط البحث + لوحة الفلاتر الكاملة */}
          <div className="mt-4">
            <input
              id="buyer-filter-toggle"
              type="checkbox"
              defaultChecked={isFilterPanelOpen}
              className="peer/filter sr-only"
            />

            <div className="rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-sm sm:p-5">
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
                  placeholder="دوّر باسم المشروع أو المنطقة أو كود الوحدة..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#105C50] focus:outline-none sm:h-11 sm:text-sm"
                />
              </form>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
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
                    {filteredBuyerUnits.length} وحدة متاحة
                  </span>
                </div>

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
            </div>

            <form
              method="GET"
              action="/account"
              className="mt-3 hidden rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-sm peer-checked/filter:block sm:p-7"
            >
              {resolvedParams.view && (
                <input type="hidden" name="view" value={resolvedParams.view} />
              )}
              <input type="hidden" name="openFilter" value="1" />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
                </div>

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
                </div>
              </div>

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
              <span className="font-normal text-gray-400">
                ({filteredBuyerUnits.length})
              </span>
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
        /* ==================== 3. حساب جديد (بدون طلبات حالياً) ==================== */
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          {/* شريط علوي واضح لتسجيل الخروج وإدارة البيانات */}
          <header className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">
              حسابي الشخصي
            </span>
            <div className="flex items-center gap-4 text-xs font-bold">
              <Link
                href="/account/details"
                className="flex items-center gap-1.5 text-slate-600 transition hover:text-[#105C50]"
              >
                <UserCog className="size-3.5" />
                <span>بياناتي</span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 shadow-2xs transition hover:bg-red-50"
                >
                  <span>تسجيل الخروج</span>
                  <LogOut className="size-3.5" />
                </button>
              </form>
            </div>
          </header>

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

function Timeline({
  currentStepIndex,
  isRejected,
}: {
  currentStepIndex: number
  isRejected?: boolean
}) {
  const stepTitles = [
    'بدأنا طلبك',
    'بيانات وحدتك وصورها',
    'بنراجع وننشر وحدتك',
    'معروضة في السوق',
    'بندور على المشتري المناسب',
    'عندك عرض',
    'نقل التعاقد (بنراجع المستندات)',
    'تمت العملية',
  ]

  return (
    <ol className="relative flex flex-col items-start">
      {stepTitles.map((title, index) => {
        const isLast = index === stepTitles.length - 1
        const status: 'done' | 'current' | 'upcoming' =
          index < currentStepIndex
            ? 'done'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming'

        return (
          <li
            key={title}
            className="relative flex items-start gap-3.5 pb-6 last:pb-0"
          >
            {!isLast && (
              <span
                className={`absolute right-[11px] top-6 h-full w-[1.5px] ${
                  status === 'done' ? 'bg-[#105C50]' : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                status === 'done'
                  ? 'bg-[#105C50] text-white'
                  : status === 'current'
                    ? isRejected
                      ? 'bg-red-600 text-white'
                      : 'bg-[#101A2B] text-white'
                    : 'bg-transparent text-gray-400'
              }`}
            >
              {status === 'done' ? (
                <Check className="size-3.5 stroke-[2.5]" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`pt-0.5 text-xs ${
                status === 'current'
                  ? isRejected
                    ? 'font-extrabold text-red-600'
                    : 'font-extrabold text-[#0a1122]'
                  : status === 'done'
                    ? 'font-medium text-gray-600'
                    : 'font-normal text-gray-400'
              }`}
            >
              {title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function AccountFooterActions() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-gray-200 pt-4 text-[11px] font-bold">
      <Link
        href="/account/details"
        className="py-2 text-gray-500 transition hover:text-[#105C50]"
      >
        بياناتي
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-1.5 py-2 text-slate-700 transition hover:text-[#0a1122]"
        >
          <span>تسجيل الخروج</span>
          <LogOut className="size-3.5" />
        </button>
      </form>
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