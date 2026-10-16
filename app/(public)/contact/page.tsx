"use client"

import { useState } from 'react'
import { Clock3, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const required = <span className="text-red-500">*</span>

export default function ContactPage() {
  const [message, setMessage] = useState('')

  return (
    <div dir="rtl" className="bg-white">
      <section className="mx-auto max-w-7xl px-5 pb-14 pt-14 text-center lg:px-8 lg:pt-16">
        <p className="text-sm font-bold text-teal-700">كلمنا</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#101a35] md:text-6xl">عايز تتكلم مع حد حقيقي؟ إحنا هنا.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-500">سواء عندك سؤال عن التنزيل، أو عايز تعرف إحنا مين قبل ما تسلّمنا وِحدة، كلّمنا على أي قناة من دول وهترد عليك.</p>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-12 lg:px-8">
          <aside className="order-1 lg:col-span-4">
            <h2 className="mb-4 text-center text-lg font-bold text-[#101a35] lg:text-right">طرق التواصل</h2>
            <div className="flex flex-col gap-4">
              <Info icon={<MessageCircle />} title="واتساب" value="+201018595959" detail="أسرع طريقة توصلنا" />
              <Info icon={<Mail />} title="الإيميل" value="info@aqarexit.com" />
              <Info icon={<Clock3 />} title="مواعيد العمل" value="من السبت للخميس، 10 ص - 9 م" detail="بتوقيت القاهرة" />
            </div>
            <p className="mt-5 rounded-2xl bg-white px-5 py-4 text-center text-sm leading-7 text-slate-500 shadow-sm">بنرد على الرسايل في ساعات العمل، لو الموضوع مستعجل واتساب أسرع طريقة.</p>
          </aside>

          <div className="order-2 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-8 lg:col-span-8">
            <h2 className="text-2xl font-bold text-[#101a35]">ابعتلنا رسالة</h2>
            <p className="mt-3 text-sm text-slate-500">مش محتاج حساب ولا تسجيل، املأ الرسالة وسيبنا نرد بيها.</p>
            <form className="mt-7 flex flex-col gap-5">
              <Field label={<>اسمك {required}</>}><Input placeholder="الاسم بالكامل" /></Field>
              <Field label={<>رقم الموبايل {required}</>}>
                <div className="flex gap-2"><button type="button" className="flex h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><span>🇪🇬</span> مصر +20 <ChevronDown /></button><Input className="flex-1" type="tel" placeholder="01xx xxx xxxx" /></div>
              </Field>
              <Field label="الإيميل"><Input type="email" placeholder="name@example.com" /></Field>
              <Field label={<>الموضوع {required}</>}><div className="relative"><select className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"><option>استفسار عام</option><option>بيع وحدة</option><option>شراء وحدة</option><option>استثمار</option></select><ChevronDown className="pointer-events-none absolute left-4 top-3" /></div></Field>
              <Field label={<>رسالتك {required}</>}><Textarea rows={5} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب سؤالك أو موضوعك بالتفصيل..." /><div className="text-left text-xs text-slate-400">{message.length} / 4000</div></Field>
              <div className="mx-auto flex h-14 w-60 items-center justify-between rounded border border-slate-200 bg-white px-3 shadow-sm"><span className="flex items-center gap-2 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-green-600 font-bold text-white">✓</span>Success!</span><span className="text-right text-[9px] font-bold text-slate-500">CLOUDFLARE<br /><span className="font-normal">Privacy - Help</span></span></div>
              <Button type="submit" className="h-11 w-full rounded-lg bg-teal-700 text-white hover:bg-teal-800">ابعت الرسالة</Button>
              <p className="text-center text-xs text-slate-400">بياناتك بتوصل لفريقنا بس ومش بنشاركها مع أي طرف تاني.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold text-[#101a35]">{label}{children}</label> }
function Info({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail?: string }) { return <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm"><span className="order-2 flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">{icon}</span><div className="order-1 flex-1"><p className="text-sm text-slate-400">{title}</p><p className="mt-2 font-bold text-[#101a35]">{value}</p>{detail && <p className="mt-2 text-sm text-slate-500">{detail}</p>}</div></div> }

