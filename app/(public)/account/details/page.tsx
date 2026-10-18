'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CountrySelector } from '@/components/country-selector'
import Link from 'next/link'

type Profile = { id: string; name: string | null; phone: string | null; email: string | null }

export default function AccountDetailsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('20')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      // محاكاة جلب بيانات المستخدم الحالي بناءً على الجلسة
      const { data } = await supabase.from('users').select('*').limit(1).single()
      if (data) {
        setProfile(data)
        setName(data.name || '')
        setEmail(data.email || '')
        // فصل كود الدولة عن الرقم إذا كان موجوداً
        if (data.phone?.startsWith('+20')) {
          setCountryCode('20')
          setPhone(data.phone.substring(3))
        } else {
          setPhone(data.phone || '')
        }
      } else {
        router.push('/')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const handleSave = async (type: 'personal' | 'email') => {
    setMessage({ type: '', text: '' })
    startTransition(async () => {
      const supabase = createClient()
      let updates = {}
      
      if (type === 'personal') {
        if (!name.trim() || !phone.trim()) {
          setMessage({ type: 'error', text: 'الاسم ورقم الموبايل مطلوبين' })
          return
        }
        const fullPhone = `+${countryCode}${phone.replace(/^0+/, '')}`
        updates = { name, phone: fullPhone }
      } else {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setMessage({ type: 'error', text: 'يرجى إدخال إيميل صحيح' })
          return
        }
        updates = { email }
      }

      const { error } = await supabase.from('users').update(updates).eq('id', profile?.id)
      
      if (error) {
        setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ. ربما هذا الرقم أو الإيميل مستخدم.' })
      } else {
        setMessage({ type: 'success', text: 'تم حفظ التعديلات بنجاح!' })
      }
    })
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f7f8fa]"><div className="text-[#0c513f] font-bold">جاري التحميل...</div></div>

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] text-[#142238]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">بياناتي</h1>
          <p className="mt-2 text-sm text-slate-500">غيّر اسمك أو رقمك أو إيميلك في أي وقت.</p>
        </header>

        {message.text && (
          <div className={`mb-6 rounded-xl p-4 text-center text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* كارت الاسم والموبايل */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">الاسم ورقم الموبايل</h2>
            <p className="mt-1 text-xs text-slate-500">الرقم ده اللي بنكلمك عليه وبنبعتلك عليه واتساب — خليه صح.</p>
            
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <Label className="text-right block mb-2 font-bold">الاسم</Label>
                <Input dir="rtl" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl text-right" />
              </div>
              <div>
                <Label className="text-right block mb-2 font-bold">رقم الموبايل</Label>
                <div dir="ltr" className="flex items-center gap-2">
                  <CountrySelector value={countryCode} onChange={setCountryCode} />
                  <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} className="h-12 flex-1 rounded-xl px-3 text-left" />
                </div>
              </div>
              <Button onClick={() => handleSave('personal')} disabled={pending} className="mt-2 h-12 w-32 self-end rounded-xl bg-[#142238] font-bold text-white hover:bg-[#22344f]">
                {pending ? 'جاري الحفظ...' : 'احفظ'}
              </Button>
            </div>
          </section>

          {/* كارت الإيميل */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">الإيميل</h2>
            <p className="mt-1 text-xs text-slate-500">ده الإيميل اللي بتدخل بيه على حسابك.</p>
            
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <Label className="text-right block mb-2 font-bold">الإيميل</Label>
                <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl text-left" />
              </div>
              <Button onClick={() => handleSave('email')} variant="outline" disabled={pending} className="mt-2 h-12 w-32 self-end rounded-xl border-slate-300 font-bold">
                {pending ? 'جاري الحفظ...' : 'غيّر الإيميل'}
              </Button>
            </div>
          </section>

          <div className="mt-4 text-center">
            <Link href="/account" className="text-sm font-bold text-teal-700 hover:underline">
              رجوع
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}