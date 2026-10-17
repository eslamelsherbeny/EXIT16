'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const [profile, setProfile] = useState<{ name?: string; phone?: string; email?: string } | null>(null)
  const [sellRequests, setSellRequests] = useState<Record<string, unknown>[]>([])
  const [buyRequests, setBuyRequests] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const [{ data: profileData }, { data: sells }, { data: buys }] = await Promise.all([
        supabase.from('users').select('name, phone, email').eq('id', user.id).maybeSingle(),
        supabase.from('sell_requests').select('id, project_name, area, unit_type, contract_price, paid_amount, status').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('buy_requests').select('id, available_cash, max_installment, preferred_areas, unit_types, status').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setProfile(profileData ?? { email: user.email ?? '' })
      setSellRequests(sells ?? [])
      setBuyRequests(buys ?? [])
      setLoading(false)
    }
    void loadAccount()
  }, [])

  return <main dir="rtl" className="min-h-screen bg-[#f5f6f8] px-4 py-12 text-[#111a30] sm:px-6"><div className="mx-auto max-w-5xl"><h1 className="text-3xl font-black">حسابي</h1>{loading ? <p className="mt-8 text-slate-500">جاري تحميل بياناتك...</p> : !profile ? <div className="mt-8 rounded-2xl bg-white p-8 text-center">سجّل الدخول لعرض حسابك وطلباتك.</div> : <div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">بياناتي الشخصية</h2><dl className="mt-5 grid gap-4 text-sm"><div><dt className="text-slate-500">الاسم</dt><dd className="font-bold">{profile.name || '—'}</dd></div><div><dt className="text-slate-500">الهاتف</dt><dd className="font-bold">{profile.phone || '—'}</dd></div><div><dt className="text-slate-500">البريد الإلكتروني</dt><dd className="font-bold">{profile.email || '—'}</dd></div></dl></section><section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">وحداتي المعروضة للبيع</h2><div className="mt-5 grid gap-3">{sellRequests.length ? sellRequests.map((item) => <article key={String(item.id)} className="rounded-xl border p-4 text-sm"><strong>{String(item.project_name || 'وحدة عقارية')}</strong><p className="mt-2 text-slate-600">{String(item.area || '—')} · {String(item.unit_type || '—')}</p><p className="mt-1">العقد: {String(item.contract_price || '—')} · المدفوع: {String(item.paid_amount || '—')}</p></article>) : <p className="text-sm text-slate-500">لا توجد طلبات بيع حتى الآن.</p>}</div></section><section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2"><h2 className="text-xl font-black">طلبات الشراء الخاصة بي</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{buyRequests.length ? buyRequests.map((item) => <article key={String(item.id)} className="rounded-xl border p-4 text-sm"><strong>طلب شراء</strong><p className="mt-2">الكاش: {String(item.available_cash || '—')} · أقصى قسط: {String(item.max_installment || '—')}</p><p className="mt-1 text-slate-600">المناطق: {Array.isArray(item.preferred_areas) ? item.preferred_areas.join('، ') : String(item.preferred_areas || '—')}</p></article>) : <p className="text-sm text-slate-500">لا توجد طلبات شراء حتى الآن.</p>}</div></section></div>}</div></main>
}
