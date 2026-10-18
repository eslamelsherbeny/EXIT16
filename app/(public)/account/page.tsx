'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, CircleHelp, ImagePlus, LogOut, MessageCircle, Trash2, UserCog } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

type BuyRequest = {
  id: string
  budget: number | null
  preferred_areas: string[] | null
  unit_types: string[] | null
  payment_plan: string | null
  delivery_status: string | null
}

type Profile = { id: string; name: string | null; phone: string | null; email: string | null }

function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('en-US')} ج.م`
}

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sells, setSells] = useState<SellRequest[]>([])
  const [buys, setBuys] = useState<BuyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: userData } = await supabase.from('users').select('*').limit(1).single()
      
      if (userData) {
        setProfile(userData)
        const { data: sellData } = await supabase.from('sell_requests').select('*').eq('user_id', userData.id).order('created_at', { ascending: false })
        const { data: buyData } = await supabase.from('buy_requests').select('*').eq('user_id', userData.id).order('created_at', { ascending: false })
        
        if (sellData) setSells(sellData)
        if (buyData) setBuys(buyData)
      } else {
        router.push('/')
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleLogout = async () => {
    document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'حذف') return
    document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push('/')
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f7f8fa]"><div className="text-[#0c513f] font-bold">جاري تحميل بيانات حسابك...</div></div>
  if (!profile) return null

  const isSeller = sells.length > 0
  const isBuyer = !isSeller && buys.length > 0
  const unit = sells[0]
  const project = unit?.project_name || 'وحدتك الجديدة'
  const completionFields = ['developer_name', 'project_name', 'contract_price', 'paid_amount', 'area', 'unit_type', 'size', 'rooms', 'bathrooms', 'finishing', 'delivery_status', 'description', 'contract_year', 'market_price', 'installment_amount', 'installment_frequency'] as const
  
  const completionFor = (item: SellRequest | undefined) => { 
    if (!item) return 0
    const filled = completionFields.filter((key) => item[key] !== null && item[key] !== undefined && item[key] !== '' && item[key] !== 0).length + (item.images?.length && item.images.length > 0 ? 1 : 0)
    return Math.round((filled / 17) * 100) 
  }
  
  const completion = completionFor(unit)

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#142238] relative">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-7">
          <div>
            <p className="text-sm font-bold text-[#0c513f]">حسابي ({isSeller ? 'بائع' : isBuyer ? 'مشتري' : 'حساب جديد'})</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">أهلاً يا {profile.name?.split(' ')[0] || 'صاحب الحساب'}</h1>
            {isSeller && <p className="mt-2 text-sm text-slate-500">تابع حالة وحدتك في {project} خطوة بخطوة.</p>}
            {isBuyer && <p className="mt-2 text-sm text-slate-500">تابع طلبات الشراء والفرص المناسبة لميزانيتك.</p>}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-[#0c513f]">
              <LogOut aria-hidden="true" className="size-4" /> تسجيل الخروج
            </button>
            <Link href="/account/details" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-teal-700">
              <UserCog aria-hidden="true" className="size-4" /> بياناتي
            </Link>
          </div>
        </header>

        {/* --- واجهة البائع (Seller Dashboard) --- */}
        {isSeller ? (
          <>
            <section className="mt-7 rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#0c513f]">الخطوة الجاية</span>
                  <h2 className="mt-4 text-xl font-black sm:text-2xl">{completion < 100 ? 'فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك' : 'تم استلام بيانات وصور وحدتك بنجاح'}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{completion < 100 ? 'كل ما تكمل بيانات وحدتك، نقدر نوصلها بالمشتري المناسب أسرع.' : 'جاري مراجعة وحدتك من قبل فريقنا لنشرها في السوق.'}</p>
                </div>
                {completion < 100 && <Link href={`/sell?resume=${unit.id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0c513f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#083c30]"><ImagePlus aria-hidden="true" className="size-4" /> {completion < 94 ? 'كمل بيانات وحدتك' : 'أضف الصور'}</Link>}
              </div>
              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between text-sm font-bold"><span>اكتمال بيانات وحدتك</span><span className="text-[#0c513f]">{completion}%</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-emerald-50"><div className="h-full rounded-full bg-[#0c513f] transition-all duration-500" style={{ width: `${completion}%` }} /></div>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">وحداتي ({sells.length})</h2>
                <Link href="/sell" className="rounded-xl bg-[#142238] px-4 py-3 text-sm font-black text-white transition hover:bg-[#22344f]">+ ضيف وحدة تانية</Link>
              </div>
              <article className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">{unit.area || 'التجمع الخامس'}</p>
                    <h3 className="mt-2 text-xl font-black">{project}</h3>
                    <p className="mt-2 text-sm text-slate-500">بيانات وحدتك وصورها</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-[#0c513f]">{completion}%</span>
                </div>
                <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_280px]">
                  <div className="border-t border-slate-100 pt-6"><Timeline /></div>
                  <div className="grid grid-cols-2 gap-3 self-start rounded-2xl bg-slate-50 p-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">سعر الوحدة في العقد</p>
                      <strong className="mt-1 block">{money(unit.contract_price)}</strong>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">اللي دفعته (هدف الاسترداد)</p>
                      <strong className="mt-1 block">{money(unit.paid_amount)}</strong>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <Link href={`/sell?resume=${unit.id}`} className="block transition hover:opacity-80">
                <InfoCard title="بيانات وحدتك" value={`${completion < 100 ? '16/17' : 'مكتملة بالكامل'}`} icon={<Check aria-hidden="true" className="size-5" />} />
              </Link>
              <Link href="/account/offers" className="block transition hover:opacity-80">
                <InfoCard title="العروض" value="لسه مفيش" icon={<ChevronLeft aria-hidden="true" className="size-5" />} />
              </Link>
              <div className="rounded-3xl bg-[#142238] p-5 text-white">
                <MessageCircle aria-hidden="true" className="size-5 text-emerald-300" />
                <p className="mt-5 text-sm font-bold text-slate-300">مسؤول حالتك</p>
                <p className="mt-2 font-black leading-7">تكلمنا على واتساب في أي وقت</p>
                <a href="https://wa.me/201018595959" target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-emerald-300">كلمنا على واتساب</a>
              </div>
            </section>
          </>
        ) : isBuyer ? (
          /* --- واجهة المشتري (Buyer Dashboard) --- */
          <div className="mt-8 flex flex-col gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">طلبات الشراء الخاصة بك ({buys.length})</h2>
                <Link href="/buyers" className="rounded-xl bg-[#0c513f] px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-900 transition">+ طلب شراء جديد</Link>
              </div>
              <div className="grid gap-4">
                {buys.map((buy) => (
                  <div key={buy.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="inline-block rounded-full bg-teal-100 px-3 py-0.5 text-xs font-bold text-teal-800 mb-2">ميزانية: {money(buy.budget)}</span>
                      <h3 className="font-black text-lg text-[#142238]">أنواع الوحدات: {buy.unit_types?.join('، ') || 'كل الوحدات'}</h3>
                      <p className="text-sm text-slate-500 mt-1">المناطق المفضلة: {buy.preferred_areas?.join('، ') || 'كل المناطق'}</p>
                    </div>
                    <Link href="/account/offers" className="rounded-xl bg-[#142238] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#22344f] transition">استعراض الفرص المطابقة</Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-black text-lg mb-2">المسؤول عن طلبك</h3>
                <p className="text-sm text-slate-500 mb-4">فريق المبيعات بيدور لك على أحسن فرصة بسعر التعاقد القديم.</p>
                <a href="https://wa.me/201018595959" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-[#0c513f] hover:bg-emerald-100 transition">
                  <MessageCircle className="size-4" /> تواصل مع وسيط الشراء عبر واتساب
                </a>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-black text-lg mb-2">عايز تبيع وحدة كمان؟</h3>
                <p className="text-sm text-slate-500 mb-4">تقدر تضيف وحدة جديدة للبيع في أي وقت بكل سهولة.</p>
                <Link href="/sell" className="inline-flex items-center gap-2 rounded-xl bg-[#142238] px-4 py-3 text-sm font-bold text-white hover:bg-[#22344f] transition">
                  أضف وحدة للبيع
                </Link>
              </div>
            </section>
          </div>
        ) : (
          /* --- لو لم يقم بأي طلب بعد --- */
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-black">ليس لديك أي طلبات بيع أو شراء حالياً</h2>
            <p className="mt-2 text-sm text-slate-500">ابدأ الآن ببيع وحدتك أو البحث عن وحدة للشراء بسعر التعاقد القديم.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/sell" className="rounded-xl bg-[#0c513f] px-6 py-3 text-sm font-bold text-white hover:bg-teal-900 transition">عايز أبيع</Link>
              <Link href="/buyers" className="rounded-xl bg-[#142238] px-6 py-3 text-sm font-bold text-white hover:bg-[#22344f] transition">عايز أشتري</Link>
            </div>
          </section>
        )}

        <footer className="mt-10 flex items-center justify-center gap-5 border-t border-slate-200 pt-6 text-sm font-bold pb-10">
          <Link href="/account/details" className="text-slate-500 hover:text-[#0c513f]">بياناتي</Link>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={() => setShowDeleteModal(true)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
            <Trash2 aria-hidden="true" className="size-4" /> حذف الحساب
          </button>
        </footer>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-center text-slate-900">حذف الحساب</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 text-center">
              هنسجل طلب بحذف حسابك، والفريق هيراجعه. وحداتك هتتشال من السوق فوراً.<br/><br/>
              لما الطلب يتقبل هيتم حذف بياناتك بالكامل — والخطوة دي مش بترجع.
            </p>
            <div className="mt-6">
              <Label className="text-right block mb-2 font-bold text-sm">ليه حابب تمشي؟ (اختياري)</Label>
              <Input dir="rtl" className="h-12 rounded-xl text-right" placeholder="أخبرنا بالسبب..." />
            </div>
            <div className="mt-4">
              <Label className="text-right block mb-2 font-bold text-sm text-red-600">اكتب «حذف» للتأكيد</Label>
              <Input dir="rtl" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="h-12 rounded-xl text-right border-red-200 focus-visible:ring-red-500" placeholder="حذف" />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button 
                type="button" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'حذف'} 
                className="w-full rounded-xl bg-red-100 py-3 text-sm font-bold text-red-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-200 transition"
              >
                ابعت طلب الحذف
              </button>
              <button type="button" onClick={() => {setShowDeleteModal(false); setDeleteConfirmText('')}} className="w-full rounded-xl py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition">
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0c513f]">{icon}</div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  )
}

function Timeline() {
  const steps = ['بدأنا طلبك', 'بيانات وحدتك وصورها', 'بنراجع وننشر وحدتك', 'معروضة في السوق', 'بندور على المشتري المناسب', 'عندك عرض', 'نقل التعاقد (بنراجع المستندات)', 'تمت العملية']
  return <ol className="grid gap-4">
    {steps.map((step, index) => <li key={step} className={`flex items-center gap-3 ${index > 1 ? 'text-slate-300' : index === 1 ? 'font-black text-[#142238]' : 'font-bold text-[#0c513f]'}`}>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs ${index === 0 ? 'bg-[#0c513f] text-white' : index === 1 ? 'bg-[#142238] text-white' : 'border border-slate-200 bg-white text-slate-300'}`}>
        {index === 0 ? <Check aria-hidden="true" className="size-4" /> : index + 1}
      </span>
      <span>{step}</span>
    </li>)}
  </ol>
}