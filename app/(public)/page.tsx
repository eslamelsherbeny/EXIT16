import Link from 'next/link'
import { ArrowLeft, Check, Download, ShieldCheck, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const comparisonRows = [
  ['استرجاع كل اللي دفعته', true, false],
  ['شراء بسعر التعاقد القديم', true, false],
  ['بدون دفع أوفر', true, false],
  ['وضوح كامل في كل خطوة', true, false],
]

const steps = [
  ['اعرف موقفك', 'جاوب على كام سؤال بسيط عن وحدتك.'],
  ['نحسب القيمة', 'بنراجع بيانات التعاقد ونحسبها بدقة.'],
  ['نعرض الفرصة', 'بنوصلك بمشتري مناسب مهتم بالوحدة.'],
  ['نتفق سوا', 'كل التفاصيل واضحة قبل أي خطوة.'],
  ['تخرج عادل', 'تسترجع فلوسك والمشتري يكمل بأمان.'],
]

const standards = [
  ['تقييم واضح', 'بنستخدم بيانات التعاقد الفعلية، من غير أرقام وهمية.'],
  ['أمان قانوني', 'كل خطوة موثقة وعقدك يفضل في أمان كامل.'],
  ['من غير أوفر', 'لا البائع ولا المشتري يدفعوا مبالغ إضافية غير مستحقة.'],
  ['تواصل مباشر', 'فريق متخصص معاك من أول سؤال لحد إتمام النقل.'],
]

function CheckLine({ children, negative = false }: { children: React.ReactNode; negative?: boolean }) {
  return <li className="flex items-center gap-3 text-sm leading-7"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${negative ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'}`}>{negative ? <X data-icon="inline-start" /> : <Check data-icon="inline-start" />}</span>{children}</li>
}

export default function HomePage() {
  return <div dir="rtl" className="bg-[#f5f6f8] text-[#0a1128]">
    <section className="relative overflow-hidden bg-[#0a1128] text-white">
      <div className="absolute -left-24 top-16 size-96 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="absolute bottom-0 right-1/3 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:py-24">
        <div className="order-1 lg:order-2">
          <span className="inline-flex rounded-full border border-teal-300/35 bg-transparent px-5 py-2 text-xs font-semibold text-teal-300">منصة التنازل عن وحدات التقسيط - بدون أوفر</span>
          <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.25] md:text-6xl">البايع يسترجع كل اللي دفعه كاش، <span className="text-teal-400">والمشتري ياخد سعر التعاقد القديم</span></h1>
          <p className="mt-6 max-w-lg text-sm leading-8 text-white/65 md:text-base">نقل تعاقدك العقاري بسهولة وأمان، من غير أوفر ولا مفاجآت. بنوصلك بالطرف المناسب ونخلي كل خطوة واضحة.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button size="lg" className="rounded-lg bg-teal-600 px-7 text-white hover:bg-teal-500" render={<Link href="/sell" />}>بيع وحدتك <ArrowLeft data-icon="inline-end" /></Button><Button size="lg" variant="outline" className="rounded-lg border-white/25 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white" render={<Link href="/buy" />}>شوف الفرص المتاحة</Button></div>
        </div>
        <div className="relative order-2 min-h-[360px] lg:order-1">
          <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-[#172647] via-[#101b36] to-[#0a1128] shadow-2xl shadow-black/30" />
          <div className="absolute left-0 top-10 w-[78%] rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><p className="text-xs text-white/60">لو رجّع الوحدة للمطور</p><span className="flex size-6 items-center justify-center rounded-full bg-red-400/15 text-red-300"><X /></span></div><p className="mt-5 text-xs text-white/60">خسارة وقت ومصاريف</p><strong className="mt-2 block text-xl text-red-300">- ١,٥٠٠,٠٠٠ ج.م</strong><div className="mt-4 h-px bg-white/10" /><div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 w-1/4 rounded-full bg-red-400" /></div><p className="mt-3 text-xs text-white/50">خسارة ٧٥٪ من فلوسك + سنين انتظار</p></div>
          <div className="absolute bottom-8 right-0 w-[82%] rounded-2xl border border-teal-300/40 bg-[#f8ffff] p-5 text-[#0a1128] shadow-2xl"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#0a1128]">لو نقل تعاقده عن طريق عقار إكزت</p><span className="flex size-6 items-center justify-center rounded-full bg-teal-100 text-teal-700"><Check /></span></div><strong className="mt-5 block text-xl text-teal-700">+ ٢,٠٠٠,٠٠٠ ج.م</strong><div className="mt-4 h-2 rounded-full bg-teal-100"><div className="h-2 w-4/5 rounded-full bg-teal-600" /></div><p className="mt-3 text-xs text-teal-700">استرجع كل اللي دفعته بأمان</p></div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-7 lg:px-8"><div className="grid overflow-hidden rounded-xl border-t-2 border-teal-600 bg-white shadow-sm md:grid-cols-2"><div className="border-b border-border p-8 text-center md:border-b-0 md:border-l"><div className="text-4xl font-bold text-[#0a1128] md:text-5xl">٩,٣٧٥</div><p className="mt-2 text-sm text-muted-foreground">وحدة متاحة</p></div><div className="p-8 text-center"><div className="text-4xl font-bold text-[#0a1128] md:text-5xl">١٣٤.٩ مليار</div><p className="mt-2 text-sm text-muted-foreground">ج.م قيمة تقديرية</p></div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><div className="mb-8 text-center"><h2 className="text-2xl font-bold md:text-3xl">طرف محتاج يبيع، وطرف مستني الفرصة</h2><p className="mt-3 text-sm text-muted-foreground">حلقة وصل واضحة وعادلة بين البائع والمشتري.</p></div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-xl bg-white p-7 shadow-sm md:p-9"><span className="text-xs font-semibold text-teal-700">للمشتري</span><h3 className="mt-3 text-2xl font-bold">تشتري بسعر التعاقد القديم</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">فرص موثقة وتقسيط على نفس شروط التعاقد من غير أوفر.</p><ul className="mt-6 flex flex-col gap-1"><CheckLine>أسعار أقل من السوق</CheckLine><CheckLine>تقسيط حسب التعاقد الأصلي</CheckLine><CheckLine>فرص موثقة ومراجعة</CheckLine></ul><Button className="mt-7 rounded-lg bg-[#0a1128] text-white hover:bg-slate-800" render={<Link href="/buy" />}>شوف الفرص المتاحة <ArrowLeft data-icon="inline-end" /></Button></div><div className="rounded-xl bg-[#0a1128] p-7 text-white shadow-sm md:p-9"><span className="text-xs font-semibold text-teal-300">للبايع</span><h3 className="mt-3 text-2xl font-bold">تبيع وترجعلك فلوسك</h3><p className="mt-3 text-sm leading-7 text-white/65">بيع وحدتك بسعر التعاقد القديم واسترجع كل اللي دفعته.</p><ul className="mt-6 flex flex-col gap-1"><CheckLine>استرجع مقدمك وأقساطك</CheckLine><CheckLine>من غير تفاوض على أوفر</CheckLine><CheckLine>إجراءات واضحة وسريعة</CheckLine></ul><Button className="mt-7 rounded-lg bg-teal-600 text-white hover:bg-teal-500" render={<Link href="/sell" />}>ابدأ بيع وحدتك <ArrowLeft data-icon="inline-end" /></Button></div></div></section>

    <section className="bg-white py-16"><div className="mx-auto max-w-5xl px-5 lg:px-8"><h2 className="text-center text-2xl font-bold md:text-3xl">إيه الفرق بينا وبين الريسيل العادي؟</h2><div className="mt-9 overflow-hidden rounded-xl border border-border shadow-sm"><div className="grid grid-cols-[1fr_100px_100px] bg-[#eef4f5] p-4 text-center text-xs font-bold md:grid-cols-[1fr_170px_170px]"><div className="text-right">المعيار</div><div className="text-teal-700">عقار إكزت</div><div className="text-red-500">الريسيل العادي</div></div>{comparisonRows.map(([label, good, bad]) => <div key={label as string} className="grid grid-cols-[1fr_100px_100px] items-center border-t border-border p-4 text-sm md:grid-cols-[1fr_170px_170px]"><div>{label as string}</div><div className="mx-auto flex size-7 items-center justify-center rounded-full bg-teal-100 text-teal-700"><Check /></div><div className="mx-auto flex size-7 items-center justify-center rounded-full bg-red-100 text-red-500"><X /></div></div>)}</div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><h2 className="text-center text-2xl font-bold">مثال بالأرقام</h2><div className="mt-8 grid gap-5 lg:grid-cols-2"><div className="rounded-xl border border-red-200 bg-red-50 p-7"><span className="text-xs font-semibold text-red-600">في الريسيل العادي</span><div className="mt-5 flex items-end justify-between"><span className="text-4xl font-bold">١٠م</span><span className="text-sm text-muted-foreground">قيمة التعاقد</span></div><div className="mt-6 border-t border-red-200 pt-5"><span>أوفر وتفاوض</span><strong className="float-left text-xl text-red-600">- ٣٠٠أ</strong></div><p className="mt-5 text-sm font-semibold text-red-600">وقت أطول، ومخاطرة أكبر</p></div><div className="rounded-xl border border-teal-200 bg-teal-50 p-7"><span className="text-xs font-semibold text-teal-700">مع عقار إكزت</span><div className="mt-5 flex items-end justify-between"><span className="text-4xl font-bold">١٠م</span><span className="text-sm text-muted-foreground">قيمة التعاقد</span></div><div className="mt-6 border-t border-teal-200 pt-5"><span>اللي دفعته</span><strong className="float-left text-xl text-teal-700">١.٥م ج.م</strong></div><p className="mt-5 text-sm font-semibold text-teal-700">ترجعلك فلوسك كاملة</p></div></div></section>

    <section className="bg-[#eef1f4] py-16"><div className="mx-auto max-w-6xl px-5 lg:px-8"><h2 className="text-center text-2xl font-bold">إزاي بنشتغل؟</h2><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{steps.map(([title, text], index) => <div key={title} className="relative rounded-xl bg-white p-5 pt-10 text-center shadow-sm"><span className="absolute -top-4 right-1/2 flex size-8 translate-x-1/2 items-center justify-center rounded-full bg-[#0a1128] text-sm font-bold text-white">{index + 1}</span><h3 className="font-bold">{title}</h3><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><h2 className="text-center text-2xl font-bold">معايير الخروج العادل</h2><div className="mt-9 grid gap-5 sm:grid-cols-2">{standards.map(([title, text]) => <div key={title} className="flex gap-4 rounded-xl bg-white p-6 shadow-sm"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700"><ShieldCheck /></span><div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></section>

    <section className="bg-[#0a1128] text-white"><div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8"><div><span className="text-xs font-semibold text-teal-300">تطبيق عقار إكزت</span><h2 className="mt-3 text-3xl font-bold">السوق كله في جيبك</h2><p className="mt-4 max-w-lg text-sm leading-7 text-white/65">تابع وحدتك، احسب موقفك، واكتشف فرص جديدة من على موبايلك.</p><div className="mt-7 flex flex-wrap gap-3"><Button variant="outline" className="rounded-lg border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Download data-icon="inline-start" /> App Store</Button><Button variant="outline" className="rounded-lg border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Download data-icon="inline-start" /> Google Play</Button></div></div><div className="mx-auto w-52 rounded-[2rem] border-8 border-[#1b2b4d] bg-[#050a18] p-3 shadow-2xl"><div className="rounded-[1.5rem] bg-white p-4 text-[#0a1128]"><div className="mx-auto mb-6 h-1 w-14 rounded-full bg-[#0a1128]" /><p className="text-xs text-muted-foreground">رصيدك العقاري</p><p className="mt-2 text-2xl font-bold">١.٥م ج.م</p><div className="mt-5 rounded-xl bg-teal-50 p-3"><Smartphone className="text-teal-700" /><p className="mt-3 text-xs font-bold">وحدتك تستحق خروج عادل</p></div></div></div></div></section>
  </div>
}
