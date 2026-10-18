import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
}

// دالة الحفظ تعمل على السيرفر مباشرة (Server Action)
async function updateProfile(formData: FormData) {
  'use server'
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value
  if (!sessionId) return redirect('/login')

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string

  const supabase = await getSupabase()
  await supabase.from('users').update({ name, phone, email }).eq('id', sessionId)
  
  redirect('/account/details?success=1')
}

export default async function AccountDetailsPage({ searchParams }: { searchParams: { success?: string } }) {
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

  const isSuccess = searchParams.success === '1'

  return (
    <main dir="rtl" className="min-h-screen bg-[#f9fafc] text-[#0a1128] pb-24">
      <div className="mx-auto max-w-[600px] px-4 py-10 sm:px-6 md:py-16">
        
        <header className="mb-10 text-center">
          <h1 className="text-[28px] font-black tracking-tight text-[#0a1128]">بياناتي</h1>
          <p className="mt-2 text-[13px] text-slate-500">غيّر اسمك أو رقمك أو إيميلك في أي وقت.</p>
        </header>

        {isSuccess && (
          <div className="mb-8 rounded-[12px] bg-[#eaf8f2] p-4 text-center text-[13px] font-bold text-[#105C50]">
            تم حفظ التعديلات بنجاح!
          </div>
        )}

        <form action={updateProfile} className="flex flex-col gap-6">
          <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-[16px] font-black text-[#0a1128]">الاسم ورقم الموبايل</h2>
            <p className="mt-1 text-[11px] text-slate-500">الرقم ده اللي بنكلمك عليه وبنبعتلك عليه واتساب — خليه صح.</p>
            
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-[13px] font-bold text-[#0a1128]">الاسم</label>
                <input id="name" name="name" type="text" dir="rtl" defaultValue={profile.name || ''} required className="h-12 w-full rounded-[10px] border border-slate-200 bg-[#f9fafc] px-4 text-[13px] font-semibold text-[#0a1128] focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50] transition" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-[13px] font-bold text-[#0a1128]">رقم الموبايل</label>
                <input id="phone" name="phone" type="tel" dir="ltr" defaultValue={profile.phone || ''} required className="h-12 w-full rounded-[10px] border border-slate-200 bg-[#f9fafc] px-4 text-left text-[13px] font-semibold text-[#0a1128] focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50] transition" />
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-[16px] font-black text-[#0a1128]">الإيميل</h2>
            <p className="mt-1 text-[11px] text-slate-500">ده الإيميل اللي بتدخل بيه على حسابك.</p>
            
            <div className="mt-6">
              <label htmlFor="email" className="mb-2 block text-[13px] font-bold text-[#0a1128]">الإيميل</label>
              <input id="email" name="email" type="email" dir="ltr" defaultValue={profile.email || ''} required className="h-12 w-full rounded-[10px] border border-slate-200 bg-[#f9fafc] px-4 text-left text-[13px] font-semibold text-[#0a1128] focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50] transition" />
            </div>
          </section>

          <div className="mt-6 flex flex-col items-center gap-5">
            <button type="submit" className="flex h-12 w-full max-w-[240px] items-center justify-center rounded-[10px] bg-[#101A2B] text-[14px] font-bold text-white shadow-md transition hover:bg-[#16223f]">
              احفظ التعديلات
            </button>
            <Link href="/account" className="text-[12px] font-bold text-[#105C50] transition hover:text-[#0c483f] hover:underline">
              رجوع للحساب
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}