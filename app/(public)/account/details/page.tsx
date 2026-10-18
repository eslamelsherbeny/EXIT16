import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

// ==================== Server Action 1: تحديث الاسم ورقم الموبايل ====================
async function updatePersonalInfo(formData: FormData) {
  'use server'
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) return redirect('/login')

  const name = formData.get('name') as string
  const phoneInput = formData.get('phone') as string
  
  let phone = phoneInput
  if (phone && !phone.startsWith('+20')) {
    phone = `+20${phone.replace(/^0+/, '')}`
  }

  const supabase = await getSupabase()
  await supabase.from('users').update({ name, phone }).eq('id', sessionId)
  
  redirect('/account/details?success=1')
}

// ==================== Server Action 2: تحديث الإيميل ====================
async function updateEmailInfo(formData: FormData) {
  'use server'
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) return redirect('/login')

  const email = formData.get('email') as string

  const supabase = await getSupabase()
  await supabase.from('users').update({ email }).eq('id', sessionId)
  
  redirect('/account/details?success=1')
}

export default async function AccountDetailsPage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const resolvedParams = searchParams ? await searchParams : {}
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value

  if (!sessionId) {
    redirect('/login')
  }

  const supabase = await getSupabase()
  const { data: profile } = await supabase.from('users').select('*').eq('id', sessionId).maybeSingle()

  if (!profile) {
    redirect('/login')
  }

  const isSuccess = resolvedParams.success === '1'

  // استخراج رقم الموبايل بدون كود الدولة لعرضه بشكل صحيح في الحقل
  let displayPhone = profile.phone || ''
  if (displayPhone.startsWith('+20')) {
    displayPhone = displayPhone.substring(3)
  } else if (displayPhone.startsWith('20')) {
    displayPhone = displayPhone.substring(2)
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f6f8] text-[#0a1128] pb-24">
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 md:py-16">
        
        {/* ==================== الهيدر ==================== */}
        <header className="mb-10 text-center">
          <h1 className="text-[28px] font-black tracking-tight text-[#0a1128]">بياناتي</h1>
          <p className="mt-2 text-[13px] text-slate-500">غيّر اسمك أو رقمك أو إيميلك في أي وقت.</p>
        </header>

        {/* رسالة النجاح */}
        {isSuccess && (
          <div className="mb-8 rounded-[12px] bg-[#eaf8f2] p-4 text-center text-[13px] font-bold text-[#105C50]">
            تم حفظ التعديلات بنجاح!
          </div>
        )}

        <div className="flex flex-col gap-6">
          
          {/* ==================== كارت الاسم ورقم الموبايل ==================== */}
          <section className="rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-[16px] font-black text-[#0a1128] text-right">الاسم ورقم الموبايل</h2>
            <p className="mt-1 text-[11px] text-slate-500 text-right">الرقم ده اللي بنكلّمك عليه وبنبعتلك عليه واتساب — خليه صح.</p>
            
            <form action={updatePersonalInfo} className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-[13px] font-bold text-[#0a1128] text-right">الاسم</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  dir="rtl" 
                  defaultValue={profile.name || ''} 
                  required 
                  className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-[13px] font-semibold text-[#0a1128] focus:border-[#105C50] focus:outline-none focus:ring-1 focus:ring-[#105C50] transition" 
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="mb-2 block text-[13px] font-bold text-[#0a1128] text-right">رقم الموبايل</label>
                <div className="flex flex-row-reverse items-center gap-2">
                  {/* حقل إدخال الرقم (على اليمين) */}
                  <input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    dir="ltr" 
                    defaultValue={displayPhone} 
                    required 
                    className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-left text-[13px] font-semibold text-[#0a1128] focus:border-[#105C50] focus:outline-none focus:ring-1 focus:ring-[#105C50] transition" 
                  />
                  {/* مفتاح الدولة المظهري (على اليسار) */}
                  <div className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 text-[13px] font-semibold text-[#0a1128]">
                    <ChevronDown className="size-3.5 text-gray-500" />
                    <span>مصر +20</span>
                    <span className="text-sm">🇪🇬</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-start">
                <button type="submit" className="h-[42px] w-[100px] rounded-[10px] bg-[#101A2B] text-[13px] font-bold text-white shadow-sm transition hover:bg-[#16223f]">
                  احفظ
                </button>
              </div>
            </form>
          </section>

          {/* ==================== كارت الإيميل ==================== */}
          <section className="rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-[16px] font-black text-[#0a1128] text-right">الإيميل</h2>
            <p className="mt-1 text-[11px] text-slate-500 text-right">ده الإيميل اللي بتدخل بيه على حسابك.</p>
            
            <form action={updateEmailInfo} className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-[13px] font-bold text-[#0a1128] text-right">الإيميل</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  dir="ltr" 
                  defaultValue={profile.email || ''} 
                  required 
                  className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-left text-[13px] font-semibold text-[#0a1128] focus:border-[#105C50] focus:outline-none focus:ring-1 focus:ring-[#105C50] transition" 
                />
              </div>

              <div className="mt-2 flex justify-start">
                <button type="submit" className="flex h-[42px] items-center justify-center rounded-[10px] border border-gray-200 bg-white px-5 text-[13px] font-bold text-[#0a1128] shadow-sm transition hover:bg-gray-50">
                  غيّر الإيميل
                </button>
              </div>
            </form>
          </section>

        </div>

        {/* ==================== رابط الرجوع السفلي ==================== */}
        <div className="mt-10 flex justify-center">
          <Link href="/account" className="text-[13px] font-bold text-[#105C50] transition hover:text-[#0c483f]">
            رجوع
          </Link>
        </div>

      </div>
    </main>
  )
}