'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function OffersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  // في المستقبل، سيتم استخدام هذه المتغيرات لعرض العروض الحقيقية
  // const [offers, setOffers] = useState([])
  const [userRole, setUserRole] = useState<'seller' | 'buyer' | null>(null)

  useEffect(() => {
    async function checkUserStatus() {
      const supabase = createClient()
      
      // هنا نتحقق هل المستخدم بائع أم مشتري لتحديد الواجهة المناسبة
      const { data: userData } = await supabase.from('users').select('id').limit(1).single()
      
      if (userData) {
        // نتحقق إذا كان بائعاً
        const { data: sellData } = await supabase.from('sell_requests').select('id').eq('user_id', userData.id).limit(1).maybeSingle()
        if (sellData) {
          setUserRole('seller')
        } else {
          // إن لم يكن بائعاً، نتحقق إذا كان مشترياً
          const { data: buyData } = await supabase.from('buy_requests').select('id').eq('user_id', userData.id).limit(1).maybeSingle()
          if (buyData) {
             setUserRole('buyer')
          }
        }
      } else {
        router.push('/')
      }
      setLoading(false)
    }
    
    checkUserStatus()
  }, [router])

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f5f6f8]"><div className="text-[#0c513f] font-bold">جاري تحميل العروض...</div></div>

  // واجهة البائع (كما في الصورة 29 - لسه مفيش عروض)
  if (userRole === 'seller') {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f5f6f8] text-[#111a30]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">العروض على وحدتك</h1>
          </header>

          <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <p className="text-lg font-bold text-slate-700">لسه مفيش عروض — أول ما يوصل عرض هيظهر هنا وهنبلغك</p>
          </div>

          <p className="mt-8 text-center text-sm leading-6 text-slate-500">
            قبولك للعرض خطوة مبدئية — مفيش أي التزام نهائي قبل ما تمضي مستندات النقل الرسمية بنفسك. التواصل مع المشتري بيتم حصريًا عن طريق فريق عقار إكزت لحماية حقوق الطرفين.
          </p>

          <div className="mt-10 text-center">
            <Link href="/account" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              رجوع لحسابي
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // واجهة المشتري (في المستقبل سيتم برمجتها لتعرض السوق Marketplace كما في الصورة 31)
  if (userRole === 'buyer') {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f5f6f8] text-[#111a30]">
         <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-black tracking-tight">الفرص المتاحة (السوق)</h1>
              <p className="mt-2 text-slate-500">هنا سيتم عرض الوحدات التي تتطابق مع ميزانيتك وتفضيلاتك.</p>
            </header>
            
            <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200">
              <p className="text-lg font-bold text-slate-700">جاري برمجة سوق العقارات وعرض الكروت...</p>
            </div>
            
            <div className="mt-10 text-center">
              <Link href="/account" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                رجوع لحسابي
              </Link>
            </div>
         </div>
      </main>
    )
  }

  return null
}