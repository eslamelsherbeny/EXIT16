import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } })
}

async function logout() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/')
}

export default async function AccountPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) return <EmptyAccount />
  const supabase = await getSupabase()
  const [{ data: profile }, { data: sells }, { data: buys }] = await Promise.all([
    supabase.from('users').select('id, name, phone, email').eq('id', sessionId).maybeSingle(),
    supabase.from('sell_requests').select('id, project_name, area, unit_type, contract_price, paid_amount, status').eq('user_id', sessionId).order('created_at', { ascending: false }),
    supabase.from('buy_requests').select('id, available_cash, max_installment, preferred_areas, unit_types, status').eq('user_id', sessionId).order('created_at', { ascending: false }),
  ])
  if (!profile) return <EmptyAccount />
  return <main dir="rtl" className="min-h-screen bg-[#f5f6f8] px-4 py-12 text-[#111a30] sm:px-6"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-4"><h1 className="text-3xl font-black">حسابي</h1><form action={logout}><button className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold">تسجيل الخروج</button></form></div><section className="mt-8 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">بياناتي الشخصية</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><p><span className="block text-sm text-slate-500">الاسم</span><b>{profile.name || '—'}</b></p><p><span className="block text-sm text-slate-500">الهاتف</span><b dir="ltr">{profile.phone || '—'}</b></p><p><span className="block text-sm text-slate-500">البريد الإلكتروني</span><b>{profile.email || '—'}</b></p></div></section><div className="mt-6 grid gap-6 lg:grid-cols-2"><RequestList title="طلبات البيع" empty="لا توجد طلبات بيع حتى الآن." items={sells ?? []} /><RequestList title="طلبات الشراء" empty="لا توجد طلبات شراء حتى الآن." items={buys ?? []} /></div></div></main>
}

function RequestList({ title, empty, items }: { title: string; empty: string; items: Record<string, unknown>[] }) { return <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{title}</h2><div className="mt-5 grid gap-3">{items.length ? items.map((item) => <article key={String(item.id)} className="rounded-xl border p-4 text-sm"><b>{String(item.project_name || 'طلب عقاري')}</b><p className="mt-2 text-slate-600">{String(item.area || item.preferred_areas || '—')}</p><p className="mt-1">الحالة: {String(item.status || 'قيد المراجعة')}</p></article>) : <p className="text-sm text-slate-500">{empty}</p>}</div></section> }
function EmptyAccount() { return <main dir="rtl" className="min-h-screen bg-[#f5f6f8] px-4 py-16 text-center"><h1 className="text-3xl font-black">حسابي</h1><p className="mt-5 text-slate-600">لا يوجد حساب نشط. سجّل بياناتك من نموذج البيع أو الشراء.</p></main> }
