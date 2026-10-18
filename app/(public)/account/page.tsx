import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { ArrowDown, Check, ChevronDown, ListFilter, Search, LogOut, UserCog } from 'lucide-react'
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
  cash: string
  gain: string
  marketPrice: string
  tags: string[]
  image?: string
}

// بيانات افتراضية للمشتري لعرض شكل الكروت
const buyerMatchedUnits: BuyerUnitCard[] = [
  {
    id: 'hamra-1',
    title: 'ميني كمبوند قصر الحمرا',
    subtitle: 'توليدو · التجمع الخامس · شقة',
    cash: '2,235,000',
    gain: '+ 314,375',
    marketPrice: '3,200,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'في المنطقة اللي عايزها'],
  },
  {
    id: 'beit-watan-i76',
    title: 'بيت الوطن الحي الأول قطعة i76 التجمع الخامس',
    subtitle: 'فينسيا للتطوير العقار venesia development · التجمع الخامس · شقة',
    cash: '1,000,000',
    gain: '+ 335,937',
    marketPrice: '3,500,000',
    tags: ['الكاش في ميزانيتك', 'القسط مناسب', 'في المنطقة اللي عايزها'],
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
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

export default async function AccountPage({ searchParams }: { searchParams?: Promise<{ view?: string }> }) {
  const resolvedParams = searchParams ? await searchParams : {}
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

  const isSellerView = resolvedParams?.view === 'seller' ? true : resolvedParams?.view === 'buyer' ? false : hasSells
  const isBuyerView = resolvedParams?.view === 'buyer' ? true : !isSellerView && hasBuys

  const unit = sells[0]
  const buyReq = buys[0]
  
  const project = unit?.project_name || 'وحدتك'
  const unitArea = unit?.area || 'التجمع الخامس'
  const completion = unit?.images && unit.images.length > 0 ? 100 : 94

  const buyerCashBudget = buyReq?.budget ? money(buyReq.budget) : '3,000,000 ج.م'
  const buyerMaxInstallment = buyReq?.max_installment ? money(buyReq.max_installment) : '100,000 ج.م'
  const buyerArea = buyReq?.preferred_areas?.[0] || 'التجمع الخامس'

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f6f8] py-8 text-[#0a1122] sm:py-12 pb-24">
      {/* ==================== 1. واجهة البائع (Seller View) ==================== */}
      {isSellerView ? (
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          
          {/* الهيدر العلوي */}
          <header className="flex items-start justify-between pb-6">
            <div className="text-right">
              <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
                {project} <span className="font-normal text-gray-400">· {unitArea}</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-3 text-[11px] font-bold text-slate-600">
              <form action={logout}>
                <button type="submit" className="flex items-center gap-2 hover:text-[#0a1122] transition">
                  تسجيل الخروج <LogOut className="size-3.5" />
                </button>
              </form>
              <Link href="/account/details" className="flex items-center gap-2 hover:text-[#105C50] transition">
                بياناتي <UserCog className="size-3.5" />
              </Link>
            </div>
          </header>

          <section className="mt-2 rounded-[18px] border border-[#105C50]/30 bg-white p-5 text-right shadow-sm sm:p-7">
            <span className="text-[11px] font-bold text-[#105C50]">الخطوة الجاية</span>
            <h2 className="mt-1 text-base font-extrabold text-[#0a1122] sm:text-lg">
              فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك
            </h2>

            <div className="mt-4">
              <Link href={unit?.id ? `/sell?resume=${unit.id}` : '/sell'} className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#105C50] px-6 text-xs font-bold text-white transition hover:bg-[#0c483f] sm:text-sm">
                أضف الصور
              </Link>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">اكتمال بيانات وحدتك</span>
                <strong className="font-extrabold text-[#0a1122]">{completion}%</strong>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#105C50] transition-all" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-2 flex justify-start">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">الصور</span>
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
              <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">وحداتي ({(sells ?? []).length || 1})</h2>
              <Link href="/sell" className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#101A2B] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]">
                + ضيف وحدة تانية
              </Link>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[14px] border border-gray-200/80 bg-white px-5 py-4 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {project} <span className="font-normal text-gray-400">· {unitArea}</span>
                </p>
                <p className="mt-1 text-[11px] text-gray-400">بيانات وحدتك وصورها</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">{completion}%</span>
            </div>
            <p className="mt-2.5 text-right text-[11px] text-gray-400">عندك أكتر من وحدة عايز تخرج منها؟ ضيفها هنا — كل وحدة ليها ملفها ومشترينها وبتتتابع لوحدها.</p>
          </section>

          <section className="mt-7 pr-1">
            <Timeline />
          </section>

          <section className="mt-7 grid grid-cols-2 gap-4 rounded-[16px] border border-gray-200/80 bg-white p-5 text-right shadow-sm sm:p-6">
            <div>
              <p className="text-[11px] text-gray-400">سعر الوحدة في العقد</p>
              <strong className="mt-1 block text-lg font-extrabold text-[#0a1122] sm:text-xl">{unit?.contract_price ? money(unit.contract_price) : '3,000,000 ج.م'}</strong>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">اللي دفعته (هدف الاسترداد)</p>
              <strong className="mt-1 block text-lg font-extrabold text-[#105C50] sm:text-xl">{unit?.paid_amount ? money(unit.paid_amount) : '2,000,000 ج.م'}</strong>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href={unit?.id ? `/sell?resume=${unit.id}` : '/sell'} className="flex flex-col justify-center rounded-[14px] border border-gray-200/80 bg-white p-4 text-right shadow-sm transition hover:border-gray-300">
              <p className="text-xs font-extrabold text-[#0a1122]">بيانات وحدتك</p>
              <p className="mt-1 text-[11px] text-gray-400">{completion < 100 ? '16/17 مكتملة' : 'مكتملة بالكامل'}</p>
            </Link>
            <Link href="/account/offers" className="flex flex-col justify-center rounded-[14px] border border-gray-200/80 bg-white p-4 text-right shadow-sm transition hover:border-gray-300">
              <p className="text-xs font-extrabold text-[#0a1122]">العروض</p>
              <p className="mt-1 text-[11px] text-gray-400">لسه مفيش</p>
            </Link>
            <a href="https://wa.me/201018595959" target="_blank" rel="noreferrer" className="flex flex-col justify-center rounded-[14px] bg-[#101A2B] p-4 text-right text-white shadow-sm transition hover:bg-[#16223f]">
              <p className="text-xs font-extrabold text-white">مسؤول حالتك</p>
              <p className="mt-1 text-[11px] text-gray-300">كلمنا على واتساب في أي وقت</p>
            </a>
          </section>

          <p className="mt-4 text-right text-[11px] leading-relaxed text-gray-400">
            <Link href="/account/documents" className="font-bold text-[#0a1122] underline hover:text-[#105C50]">مستنداتك</Link> — المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
          </p>

          <AccountFooterActions />
        </div>
      ) : isBuyerView ? (
        /* ==================== 2. واجهة المشتري (Buyer View) ==================== */
        <div className="mx-auto max-w-[980px] px-3 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">فرص تناسب ميزانيتك</h1>
            <div className="flex items-center gap-3">
              <Link href="/account/offers" className="inline-flex h-10 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-xs font-bold text-[#0a1122] shadow-sm transition hover:bg-gray-50">عروضي</Link>
              <Link href="/buy?edit=1" className="text-xs font-bold text-[#105C50] transition hover:underline">عدّل ميزانيتك</Link>
              <form action={logout}>
                <button type="submit" className="text-xs font-bold text-red-500 hover:text-red-700 transition px-2">خروج</button>
              </form>
            </div>
          </header>

          <section className="mt-5 rounded-[14px] border border-gray-200/80 bg-white px-5 py-3.5 text-right shadow-sm">
            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-xs">
              <div><span className="text-gray-400">الكاش المتاح دلوقتي: </span><strong className="font-extrabold text-[#0a1122]">{buyerCashBudget}</strong></div>
              <div><span className="text-gray-400">أقصى قسط يريحك: </span><strong className="font-extrabold text-[#0a1122]">{buyerMaxInstallment}</strong></div>
            </div>
          </section>

          <section className="mt-4 text-right">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <span className="ml-1 text-xs font-extrabold text-[#0a1122]">فلتر بطلبك:</span>
              {buyerFilterPills.map((pill) => (
                <button key={pill} type="button" className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-[#105C50] hover:text-[#105C50]">{pill}</button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">مرتّبة بالأنسب لطلبك — اختار أي شرط عشان تشوف اللي يطابقه بالظبط.</p>
          </section>

          <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-sm sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="دوّر باسم المشروع أو المنطقة أو كود الوحدة (U-10057)..." className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-10 pl-3 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#105C50] focus:outline-none sm:h-11 sm:text-sm" />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-[#0a1122] hover:bg-gray-50 sm:h-10">
                  <ListFilter className="size-3.5" />
                  <span>فلترة</span>
                </button>
                <button type="button" className="inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-[#0a1122] hover:bg-gray-50 sm:h-10">
                  <span>قابل للتفاوض</span>
                  <ArrowDown className="size-3 text-[#d97706]" />
                </button>
                <span className="text-[11px] font-medium text-gray-500 sm:text-xs">200 وحدة متاحة</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 sm:text-xs">ترتيب</span>
                <div className="relative">
                  <select className="h-9 min-w-[125px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[#0a1122] focus:outline-none sm:h-10 sm:min-w-[145px]">
                    <option>الأحدث</option>
                    <option>الأنسب لي</option>
                    <option>الأقل كاش</option>
                    <option>الأكبر مكسب</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-4 text-right text-sm font-extrabold text-[#0a1122] sm:text-base">
              الفرص في المنطقة اللي طلبتها ({buyerArea}) <span className="font-normal text-gray-400">(60)</span>
            </h2>
            <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-5 lg:grid-cols-3">
              {buyerMatchedUnits.map((item) => (
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
              أهلاً يا {profile.name?.split(' ')[0] || 'صاحب الحساب'} — ليس لديك أي طلبات حالياً
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
              ابدأ الآن بعرض وحدتك للتنازل بدون أوفر واسترداد ما دفعته كاش، أو سجل ميزانيتك كمشتري لتصلك الفرص المناسبة.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/sell" className="rounded-[10px] bg-[#105C50] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#0c483f] sm:text-sm">
                عايز أبيع وحدتي
              </Link>
              <Link href="/buy" className="rounded-[10px] bg-[#101A2B] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#16223f] sm:text-sm">
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
    <Link href={`/opportunities/${unit.id}`} className="group flex flex-col justify-between overflow-hidden rounded-[14px] border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md sm:rounded-[18px]">
      <div>
        {unit.image && (
          <div className="h-[115px] w-full overflow-hidden bg-gray-100 sm:h-[175px]">
            <img src={unit.image} alt={unit.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        )}
        <div className="p-3 text-right sm:p-5">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-snug text-[#0a1122] group-hover:text-[#105C50] sm:text-[15px]">{unit.title}</h3>
          <p className="mt-1 line-clamp-1 text-[10px] text-gray-400 sm:text-xs">{unit.subtitle}</p>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] text-gray-400 sm:text-[11px]">المطلوب كاش دلوقتي</p>
            <p className="mt-0.5 text-sm font-extrabold tracking-tight text-[#0a1122] sm:text-xl">{unit.cash} <span className="text-[11px] font-bold sm:text-xs">ج.م</span></p>
          </div>
          <div className="mt-2.5 rounded-xl bg-[#ecfbf3] px-2.5 py-2 text-right sm:mt-3 sm:px-3 sm:py-2.5">
            <p dir="ltr" className="text-right text-xs font-extrabold text-[#105C50] sm:text-sm">{unit.gain} ج.م</p>
            <p className="mt-0.5 text-[9px] text-[#105C50]/80 sm:text-[10px]">سعر السوق اليوم: {unit.marketPrice} ج.م</p>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
            {unit.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-[#e3f2ef] px-2 py-0.5 text-[9px] font-bold text-[#105C50] sm:text-[10px]">{tag}</span>
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
          <li key={step.title} className="relative flex items-start gap-3.5 pb-6 last:pb-0">
            {!isLast && <span className={`absolute right-[11px] top-6 h-full w-[1.5px] ${step.status === 'done' ? 'bg-[#105C50]' : 'bg-gray-200'}`} />}
            <span className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${step.status === 'done' ? 'bg-[#105C50] text-white' : step.status === 'current' ? 'bg-[#101A2B] text-white' : 'bg-transparent text-gray-400'}`}>
              {step.status === 'done' ? <Check className="size-3.5 stroke-[2.5]" /> : index + 1}
            </span>
            <span className={`pt-0.5 text-xs ${step.status === 'current' ? 'font-extrabold text-[#0a1122]' : step.status === 'done' ? 'font-medium text-gray-600' : 'font-normal text-gray-400'}`}>{step.title}</span>
          </li>
        )
      })}
    </ol>
  )
}

function AccountFooterActions() {
  return (
    <div className="mt-10 flex items-center justify-center gap-6 pt-4 text-[11px] font-bold border-t border-gray-200">
      <Link href="/account/details" className="text-gray-500 hover:text-[#105C50] transition py-2">بياناتي</Link>
      <form action={deleteAccount}>
        <button type="submit" className="text-red-500 hover:text-red-700 transition py-2">حذف الحساب</button>
      </form>
    </div>
  )
}