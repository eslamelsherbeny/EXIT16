import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { Check, ChevronLeft, LogOut, MessageCircle, UserCog } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
  preferred_areas: string[] | null
  unit_types: string[] | null
}

type Profile = { id: string; name: string | null; phone: string | null; email: string | null }

function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('en-US')} ج.م`
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

// Server Actions الخاصة بتسجيل الخروج وحذف الحساب
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

export default async function AccountPage() {
  const cookieStore = await cookies()
  
  // التحقق الفعلي من الكوكي عبر السيرفر
  const sessionId = cookieStore.get('user_session')?.value

  if (!sessionId) {
    redirect('/login')
  }

  const supabase = await getSupabase()
  const { data: profile } = await supabase.from('users').select('*').eq('id', sessionId).maybeSingle<Profile>()

  if (!profile) {
    redirect('/login')
  }

  const [{ data: sells }, { data: buys }] = await Promise.all([
    supabase.from('sell_requests').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).returns<SellRequest[]>(),
    supabase.from('buy_requests').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).returns<BuyRequest[]>(),
  ])

  const isSeller = (sells ?? []).length > 0
  const isBuyer = !isSeller && (buys ?? []).length > 0
  const unit = sells?.[0]
  const project = unit?.project_name || 'وحدتك'
  const completion = unit?.images?.length ? 100 : 94

  return (
    <main dir="rtl" className="min-h-screen bg-[#f9fafc] text-[#0a1128] pb-24">
      <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 md:py-12">
        
        {/* --- الهيدر العلوي --- */}
        <header className="flex items-start justify-between pb-8">
          <div>
            <p className="text-xs font-bold text-slate-400">حسابي</p>
            <h1 className="mt-1 text-2xl font-black text-[#0a1128]">أهلاً يا {profile.name?.split(' ')[0] || 'صاحب الحساب'}</h1>
            {isSeller && <p className="mt-1.5 text-xs text-slate-500">{unit?.area || 'التجمع الخامس'} · {project}</p>}
          </div>
          <div className="flex flex-col items-end gap-3 text-[11px] font-bold text-slate-600">
            <form action={logout}>
              <button type="submit" className="flex items-center gap-2 hover:text-[#0a1128] transition">
                تسجيل الخروج <LogOut className="size-3.5" />
              </button>
            </form>
            <Link href="/account/details" className="flex items-center gap-2 hover:text-[#0a1128] transition">
              بياناتي <UserCog className="size-3.5" />
            </Link>
          </div>
        </header>

        {/* --- واجهة البائع --- */}
        {isSeller && unit ? (
          <>
            <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="w-full">
                  <span className="text-[11px] font-bold text-[#105C50]">الخطوة الجاية</span>
                  <h2 className="mt-1 text-lg font-black text-[#0a1128]">فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك</h2>
                  
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>اكتمال بيانات وحدتك</span>
                      <span className="text-[#0a1128]">{completion}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#105C50]" style={{ width: `${completion}%` }} />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-orange-400 text-left">الصور</p>
                  </div>

                  <div className="mt-5 rounded-[12px] bg-[#eaf8f2] px-4 py-3.5 text-center text-xs font-bold text-[#105C50]">
                    فيه 4434 مشترين مستنيين وحدة زي بتاعتك — كمل بياناتها وشوفهم
                  </div>
                  
                  <p className="mt-4 text-[10px] text-slate-400 leading-relaxed text-center">
                    المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا يكلمك، مطلوبة قبل إتمام البيع، مش قبل النشر.
                  </p>
                </div>

                <div className="w-full shrink-0 sm:w-[140px]">
                  <Link href={`/sell?resume=${unit.id}`} className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[#105C50] text-sm font-bold text-white transition hover:bg-[#0c483f]">
                    أضف الصور
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0a1128]">وحداتي ({(sells ?? []).length})</h2>
              <Link href="/sell" className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[#101A2B] px-4 text-[11px] font-bold text-white transition hover:bg-[#16223f]">
                + ضيف وحدة تانية
              </Link>
            </div>

            <div className="mt-4 rounded-[20px] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-[#0a1128]">{project} <span className="text-slate-400 font-normal">· {unit.area}</span></p>
                  <p className="mt-1 text-[11px] text-slate-400">بيانات وحدتك وصورها</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-500">{completion}%</span>
              </div>
              <p className="mt-4 text-[10px] text-slate-400 text-center">عندك أكثر من وحدة عايز تخرج منها؟ ضيفها هنا — كل وحدة ليها ملفها ومشترينها وبتتابع لوحدها.</p>

              <div className="mt-8 border-t border-slate-100 pt-8">
                <Timeline />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 rounded-[16px] border border-slate-100 bg-[#f9fafc] p-5 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">سعر الوحدة في العقد</p>
                  <strong className="mt-1.5 block text-lg font-black text-[#0a1128]">{money(unit.contract_price)}</strong>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">اللي دفعته (هدف الاسترداد)</p>
                  <strong className="mt-1.5 block text-lg font-black text-[#105C50]">{money(unit.paid_amount)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Link href={`/sell?resume=${unit.id}`} className="block transition hover:opacity-90">
                <InfoCard title="بيانات وحدتك" value={`${completion < 100 ? '16/17 مكتملة' : 'مكتملة بالكامل'}`} icon={<Check className="size-5" />} />
              </Link>
              <Link href="/account/offers" className="block transition hover:opacity-90">
                <InfoCard title="العروض" value="لسه مفيش" icon={<ChevronLeft className="size-5" />} />
              </Link>
              <div className="rounded-[16px] bg-[#101A2B] p-5 text-center text-white shadow-sm flex flex-col justify-center transition hover:bg-[#16223f]">
                <p className="text-[13px] font-bold text-white">مسؤول حالتك</p>
                <p className="mt-1 text-[10px] text-slate-400">كلمنا على واتساب في أي وقت</p>
              </div>
            </div>
          </>
        ) : isBuyer ? (
          /* --- واجهة المشتري --- */
          <div className="mt-8 flex flex-col gap-6">
            <div className="rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-black text-[#0a1128]">طلبات الشراء الخاصة بك ({(buys ?? []).length})</h2>
                <Link href="/buyers" className="rounded-xl bg-[#105C50] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#0c483f] transition">+ طلب جديد</Link>
              </div>
              <div className="grid gap-4">
                {(buys ?? []).map((buy) => (
                  <div key={buy.id} className="rounded-[16px] border border-slate-100 bg-[#f9fafc] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div>
                      <span className="inline-block rounded-full bg-[#eaf8f2] px-3 py-1 text-[10px] font-bold text-[#105C50] mb-3">ميزانية: {money(buy.budget)}</span>
                      <h3 className="font-black text-[13px] text-[#0a1128]">الوحدات: {buy.unit_types?.join('، ') || 'الكل'}</h3>
                      <p className="text-[11px] text-slate-400 mt-1.5">المناطق: {buy.preferred_areas?.join('، ') || 'الكل'}</p>
                    </div>
                    <Link href="/account/offers" className="rounded-[10px] bg-[#101A2B] px-5 py-2.5 text-[11px] font-bold text-white hover:bg-[#16223f] transition">استعراض الفرص</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* --- حساب جديد (لم يطلب بيع أو شراء) --- */
          <section className="mt-8 rounded-[20px] bg-white p-12 text-center shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-[#0a1128]">ليس لديك أي طلبات بيع أو شراء حالياً</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500 max-w-md mx-auto">ابدأ الآن ببيع وحدتك بسهولة بدون أوفر، أو البحث عن وحدة للشراء بسعر التعاقد القديم.</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/sell" className="rounded-[10px] bg-[#105C50] px-8 py-3 text-[13px] font-bold text-white shadow-sm hover:bg-[#0c483f] transition">عايز أبيع</Link>
              <Link href="/buyers" className="rounded-[10px] bg-[#101A2B] px-8 py-3 text-[13px] font-bold text-white shadow-sm hover:bg-[#16223f] transition">عايز أشتري</Link>
            </div>
          </section>
        )}
        
        {/* الفوتر السفلي (بياناتي | حذف الحساب) */}
        <div className="mt-12 flex items-center justify-center gap-6 border-t border-slate-200 pt-8 text-[11px] font-bold">
          <Link href="/account/details" className="text-slate-500 hover:text-[#105C50] transition">بياناتي</Link>
          <span className="text-slate-300">|</span>
          <form action={deleteAccount}>
            <button type="submit" className="text-red-500 hover:text-red-700 transition">حذف الحساب</button>
          </form>
        </div>

      </div>
    </main>
  )
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="h-full rounded-[16px] border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:shadow-md">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#105C50]">{icon}</div>
      <p className="mt-4 text-[13px] font-bold text-[#0a1128]">{title}</p>
      <p className="mt-1 text-[11px] text-slate-400">{value}</p>
    </div>
  )
}

function Timeline() {
  const steps = [
    { title: 'بدأنا طلبك', active: true },
    { title: 'بيانات وحدتك وصورها', active: true, current: true },
    { title: 'بنراجع وننشر وحدتك', active: false },
    { title: 'معروضة في السوق', active: false },
    { title: 'بندور على المشتري المناسب', active: false },
    { title: 'عندك عرض', active: false },
    { title: 'نقل التعاقد (بنراجع المستندات)', active: false },
    { title: 'تمت العملية', active: false }
  ]

  return (
    <ol className="flex flex-col gap-6 max-w-sm mx-auto">
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-center gap-4">
          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            step.current ? 'bg-[#101A2B] text-white' : step.active ? 'bg-[#105C50] text-white' : 'border border-slate-200 bg-white text-slate-300'
          }`}>
            {step.active && !step.current ? <Check className="size-3" /> : index + 1}
          </span>
          <span className={`text-[12px] ${step.current ? 'font-black text-[#0a1128]' : step.active ? 'font-bold text-slate-600' : 'text-slate-400 font-normal'}`}>
            {step.title}
          </span>
        </li>
      ))}
    </ol>
  )
}