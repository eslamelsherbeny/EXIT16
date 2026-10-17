import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { Check, ChevronLeft, CircleHelp, ImagePlus, LogOut, MessageCircle, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SellRequest = {
  id: string
  project_name: string | null
  area: string | null
  contract_price: number | null
  paid_amount: number | null
  status: string | null
  developer_name: string | null
  unit_type: string | null
  size: number | null
  rooms: number | null
  bathrooms: number | null
  finishing: string | null
  delivery_status: string | null
  description: string | null
  contract_year: number | null
  market_price: number | null
  installment_amount: number | null
  installment_frequency: string | null
  images: string[] | null
}

type Profile = { id: string; name: string | null; phone: string | null; email: string | null }

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

async function logout() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/')
}

async function deleteAccount() {
  'use server'
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) redirect('/')
  const supabase = await getSupabase()
  await supabase.from('sell_requests').delete().eq('user_id', sessionId)
  await supabase.from('buy_requests').delete().eq('user_id', sessionId)
  await supabase.from('users').delete().eq('id', sessionId)
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/')
}

function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('en-US')} ج.م`
}

export default async function AccountPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) redirect('/')

  const supabase = await getSupabase()
  const [{ data: profile }, { data: sells }] = await Promise.all([
    supabase.from('users').select('id, name, phone, email').eq('id', sessionId).maybeSingle<Profile>(),
    supabase.from('sell_requests').select('id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, description, contract_year, contract_price, paid_amount, market_price, installment_amount, installment_frequency, images, status').eq('user_id', sessionId).order('created_at', { ascending: false }).returns<SellRequest[]>(),
  ])
  if (!profile) redirect('/')

  const units = sells ?? []
  const unit = units[0]
  const project = unit?.project_name || 'وحدتك الجديدة'
  const completionFields = ['developer_name', 'project_name', 'contract_price', 'paid_amount', 'area', 'unit_type', 'size', 'rooms', 'bathrooms', 'finishing', 'delivery_status', 'description', 'contract_year', 'market_price', 'installment_amount', 'installment_frequency'] as const
  const completionFor = (item: SellRequest | undefined) => { if (!item) return 0; const filled = completionFields.filter((key) => item[key] !== null && item[key] !== undefined && item[key] !== '' && item[key] !== 0).length + (item.images?.length ? 1 : 0); return Math.round((filled / 17) * 100) }
  const completion = completionFor(unit)

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#142238]">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-7">
          <div>
            <p className="text-sm font-bold text-[#0c513f]">حسابي</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">أهلاً يا {profile.name || 'صاحب الوحدة'}</h1>
            <p className="mt-2 text-sm text-slate-500">تابع حالة وحدتك في {project} خطوة بخطوة.</p>
          </div>
          <form action={logout}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-[#0c513f]">
              <LogOut aria-hidden="true" className="size-4" /> تسجيل الخروج
            </button>
          </form>
        </header>

        <section className="mt-7 rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#0c513f]">الخطوة الجاية</span>
              <h2 className="mt-4 text-xl font-black sm:text-2xl">فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">كل ما تكمل بيانات وحدتك، نقدر نوصلها بالمشتري المناسب أسرع.</p>
            </div>
            {unit && completion < 100 && <a href={`/sell?resume=${unit.id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0c513f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#083c30]"><ImagePlus aria-hidden="true" className="size-4" /> {completion < 94 ? 'كمل بيانات وحدتك' : 'أضف الصور'}</a>}
          </div>
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-sm font-bold"><span>اكتمال بيانات وحدتك</span><span className="text-[#0c513f]">{completion}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-emerald-50"><div className="h-full rounded-full bg-[#0c513f]" style={{ width: `${completion}%` }} /></div>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#8a5b08]"><CircleHelp aria-hidden="true" className="size-5 shrink-0" /><span>فيه 4421 مشترين مستنيين وحدة زي بتاعتك — كمل بياناتها وشوفهم</span></div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black">وحداتي ({units.length || 1})</h2><a href="/sell" className="rounded-xl bg-[#142238] px-4 py-3 text-sm font-black text-white transition hover:bg-[#22344f]">+ ضيف وحدة تانية</a></div>
          <article className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500">{unit?.area || 'التجمع الخامس'}</p><h3 className="mt-2 text-xl font-black">{project}</h3><p className="mt-2 text-sm text-slate-500">بيانات وحدتك وصورها</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-[#0c513f]">{completion}%</span></div>
            <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_280px]">
              <div className="border-t border-slate-100 pt-6"><Timeline /></div>
              <div className="grid grid-cols-2 gap-3 self-start rounded-2xl bg-slate-50 p-4 text-sm"><div><p className="text-xs text-slate-500">سعر الوحدة في العقد</p><strong className="mt-1 block">{money(unit?.contract_price)}</strong></div><div><p className="text-xs text-slate-500">اللي دفعته (هدف الاسترداد)</p><strong className="mt-1 block">{money(unit?.paid_amount)}</strong></div></div>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard title="بيانات وحدتك" value="16/17 مكتملة" icon={<Check aria-hidden="true" className="size-5" />} />
          <InfoCard title="العروض" value="لسه مفيش" icon={<ChevronLeft aria-hidden="true" className="size-5" />} />
          <div className="rounded-3xl bg-[#142238] p-5 text-white"><MessageCircle aria-hidden="true" className="size-5 text-emerald-300" /><p className="mt-5 text-sm font-bold text-slate-300">مسؤول حالتك</p><p className="mt-2 font-black leading-7">تكلمنا على واتساب في أي وقت</p><a href="https://wa.me/201000000000" className="mt-4 inline-block text-sm font-bold text-emerald-300">كلمنا على واتساب</a></div>
        </section>

        <footer className="mt-10 flex items-center justify-center gap-5 border-t border-slate-200 pt-6 text-sm font-bold"><form action={logout}><button type="submit" className="text-slate-500 hover:text-[#0c513f]">تسجيل الخروج</button></form><span className="text-slate-300">|</span><form action={deleteAccount}><button type="submit" className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"><Trash2 aria-hidden="true" className="size-4" /> حذف الحساب</button></form></footer>
      </div>
    </main>
  )
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0c513f]">{icon}</div><p className="mt-5 text-sm font-bold text-slate-500">{title}</p><p className="mt-2 font-black">{value}</p></div>
}

function Timeline() {
  const steps = ['بدأنا طلبك', 'بيانات وحدتك وصورها', 'بنراجع وننشر وحدتك', 'معروضة في السوق', 'بندور على المشتري المناسب', 'عندك عرض', 'نقل التعاقد (بنراجع المستندات)', 'تمت العملية']
  return <ol className="grid gap-4">{steps.map((step, index) => <li key={step} className={`flex items-center gap-3 ${index > 1 ? 'text-slate-300' : index === 1 ? 'font-black text-[#142238]' : 'font-bold text-[#0c513f]'}`}><span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs ${index === 0 ? 'bg-[#0c513f] text-white' : index === 1 ? 'bg-[#142238] text-white' : 'border border-slate-200 bg-white text-slate-300'}`}>{index === 0 ? <Check aria-hidden="true" className="size-4" /> : index + 1}</span><span>{step}</span></li>)}</ol>
}
