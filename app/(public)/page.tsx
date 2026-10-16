import Link from 'next/link'
import { ArrowLeft, Check, Download, Headphones, LockKeyhole, ShieldCheck, Smartphone, X } from 'lucide-react'
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
  ['من غير أوفر', 'لا seller ولا buyer يدفعوا مبالغ إضافية غير مستحقة.'],
  ['تواصل مباشر', 'فريق متخصص معاك من أول سؤال لحد إتمام النقل.'],
]

function CheckLine({ children, negative = false }: { children: React.ReactNode; negative?: boolean }) {
  return <li className="flex items-center gap-3 text-sm leading-7"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${negative ? 'bg-red-100 text-red-600' : 'bg-primary/12 text-primary'}`}>{negative ? <X data-icon="inline-start" /> : <Check data-icon="inline-start" />}</span>{children}</li>
}

export default function HomePage() {
  return <div dir="rtl" className="bg-slate-50">
    <section className="relative overflow-hidden bg-[#0a1128] text-white">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
        <div className="order-1 lg:order-2">
          <div className="mb-6 inline-flex rounded-full border border-teal-300/30 bg-white/5 px-4 py-2 text-sm text-teal-200">خروج عادل من وحدتك العقارية</div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.25] tracking-tight md:text-6xl">البايع يسترجع كل اللي دفعه والمشتري بياخد سعر التعاقد القديم</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">منصة عقار إكزت بتخلّي بيع وشراء الوحدات بالتقسيط أسهل، أوضح، ومن غير ما حد يدفع أوفر.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button size="lg" className="rounded-full bg-teal-600 px-7 text-[#0a1128] hover:bg-teal-500" render={<Link href="/sell" />}>بيع وحدتك <ArrowLeft data-icon="inline-end" /></Button><Button size="lg" variant="outline" className="rounded-full border-white/25 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white" render={<Link href="/buy" />}>عايز تشتري</Button></div>
        </div>
        <div className="relative order-2 min-h-[340px] lg:order-1 lg:min-h-[480px]">
          <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-[#14213d] via-[#0f1b35] to-[#0a1128] shadow-2xl shadow-black/30" />
          <div className="absolute left-0 top-12 w-[78%] rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"><p className="text-sm text-white/60">في الريسيل العادي</p><div className="mt-4 flex items-center gap-3 text-xl font-semibold"><span className="flex size-9 items-center justify-center rounded-full bg-red-400/15 text-red-300"><X /></span>تدفع أوفر عشان تبيع</div><div className="mt-4 h-px bg-white/10" /><p className="mt-4 text-sm text-white/60">المشتري بيدفع أكتر من سعر التعاقد</p></div>
          <div className="absolute bottom-10 right-0 w-[82%] rounded-3xl border border-teal-300/40 bg-[#101b36]/90 p-6 shadow-2xl backdrop-blur-xl"><p className="text-sm text-teal-200">مع عقار إكزت</p><div className="mt-4 flex items-center gap-3 text-xl font-semibold"><span className="flex size-9 items-center justify-center rounded-full bg-teal-600/20 text-teal-200"><Check /></span>تخرج من غير ما تخسر</div><div className="mt-4 h-px bg-white/10" /><p className="mt-4 text-sm text-white/60">سعر التعاقد القديم يفضل هو السعر</p></div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8"><div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2"><div className="bg-white p-8 text-center md:p-10"><div className="text-4xl font-bold text-[#0a1128] md:text-5xl">٩,٣١٦</div><p className="mt-2 text-muted-foreground">وحدة عقارية</p></div><div className="bg-white p-8 text-center md:p-10"><div className="text-4xl font-bold text-[#0a1128] md:text-5xl">١٣٤.١ مليار</div><p className="mt-2 text-muted-foreground">ج.م قيمة تقديرية</p></div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10"><span className="text-sm font-semibold text-primary">للبايع</span><h2 className="mt-3 text-3xl font-bold text-[#0a1128]">بدون أوفر = أسرع بيع</h2><p className="mt-4 text-muted-foreground">بيّع وحدتك بسعر التعاقد القديم واسترجع كل اللي دفعته.</p><ul className="mt-7 flex flex-col gap-2"><CheckLine>استرجع مقدمك وأقساطك</CheckLine><CheckLine>من غير تفاوض على أوفر</CheckLine><CheckLine>إجراءات واضحة وسريعة</CheckLine></ul><Button className="mt-8 rounded-full bg-[#0a1128] px-7 hover:bg-[#285448]" render={<Link href="/sell" />}>ابدأ بيع وحدتك <ArrowLeft data-icon="inline-end" /></Button></div><div className="rounded-[2rem] bg-[#0a1128] p-8 text-white shadow-sm md:p-10"><span className="text-sm font-semibold text-teal-200">للمشتري</span><h2 className="mt-3 text-3xl font-bold">وحدة بالتقسيط من غير ما تدفع أوفر</h2><p className="mt-4 text-white/65">اشتري وحدة جاهزة للتعاقد بنفس السعر القديم، وبأقساط مريحة.</p><ul className="mt-7 flex flex-col gap-2"><CheckLine>أسعار أقل من السوق</CheckLine><CheckLine>تقسيط حسب التعاقد الأصلي</CheckLine><CheckLine>فرص موثقة ومراجعة</CheckLine></ul><Button className="mt-8 rounded-full bg-teal-600 px-7 text-[#0a1128] hover:bg-teal-500" render={<Link href="/buy" />}>شوف الوحدات المتاحة <ArrowLeft data-icon="inline-end" /></Button></div></div></section>

    <section className="bg-white py-16"><div className="mx-auto max-w-5xl px-5 lg:px-8"><h2 className="text-center text-3xl font-bold text-[#0a1128] md:text-4xl">إيه الفرق بينا وبين الريسيل العادي؟</h2><div className="mt-10 overflow-hidden rounded-3xl border border-border"><div className="grid grid-cols-[1fr_110px_110px] bg-[#f4f7f2] p-4 text-center text-sm font-semibold md:grid-cols-[1fr_170px_170px]"><div className="text-right">المعيار</div><div className="text-primary">عقار إكزت</div><div className="text-red-500">الريسيل العادي</div></div>{comparisonRows.map(([label, good, bad]) => <div key={label as string} className="grid grid-cols-[1fr_110px_110px] items-center border-t border-border p-4 text-sm md:grid-cols-[1fr_170px_170px]"><div>{label as string}</div><div className="mx-auto flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Check /></div><div className="mx-auto flex size-8 items-center justify-center rounded-full bg-red-100 text-red-500"><X /></div></div>)}</div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><h2 className="text-center text-3xl font-bold text-[#0a1128]">المعادلة ببساطة</h2><div className="mt-10 grid gap-6 lg:grid-cols-2"><div className="rounded-[2rem] border border-[#a7e0b5] bg-teal-50 p-8 md:p-10"><div className="text-sm font-semibold text-primary">مع عقار إكزت</div><div className="mt-6 flex items-end gap-3"><span className="text-5xl font-bold text-[#0a1128]">١٠م</span><span className="pb-2 text-muted-foreground">قيمة التعاقد</span></div><div className="mt-7 flex items-center justify-between border-t border-primary/15 pt-5"><span>اللي دفعته</span><strong className="text-2xl text-primary">١.٥م ج.م</strong></div><p className="mt-4 font-semibold text-primary">ترجعلك فلوسك كاملة</p></div><div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 md:p-10"><div className="text-sm font-semibold text-red-600">في الريسيل العادي</div><div className="mt-6 flex items-end gap-3"><span className="text-5xl font-bold text-[#0a1128]">١٠م</span><span className="pb-2 text-muted-foreground">قيمة التعاقد</span></div><div className="mt-7 flex items-center justify-between border-t border-red-200 pt-5"><span>أوفر وتفاوض</span><strong className="text-2xl text-red-600">- ٣٠٠أ</strong></div><p className="mt-4 font-semibold text-red-600">وقت أطول، ومخاطرة أكبر</p></div></div></section>

    <section className="bg-[#f0f4ed] py-16"><div className="mx-auto max-w-7xl px-5 lg:px-8"><h2 className="text-center text-3xl font-bold text-[#0a1128]">إزاي بنشتغل</h2><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{steps.map(([title, text], index) => <div key={title} className="relative rounded-3xl bg-white p-6 pt-12 text-center shadow-sm"><span className="absolute -top-5 right-1/2 flex size-10 translate-x-1/2 items-center justify-center rounded-full bg-[#0a1128] font-bold text-white">{index + 1}</span><h3 className="font-bold text-[#0a1128]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><h2 className="text-center text-3xl font-bold text-[#0a1128]">معايير الخروج العادل</h2><div className="mt-10 grid gap-5 sm:grid-cols-2">{standards.map(([title, text]) => <div key={title} className="flex gap-4 rounded-3xl border border-border bg-white p-6"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck /></span><div><h3 className="font-bold text-[#0a1128]">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></section>

    <section className="mx-5 overflow-hidden rounded-[2rem] bg-[#0a1128] md:mx-auto md:max-w-7xl"><div className="flex flex-col items-center justify-between gap-6 px-8 py-10 text-center text-white md:flex-row md:px-12 md:text-right"><div><h2 className="text-3xl font-bold">اعرف موقفك في دقيقة</h2><p className="mt-2 text-white/60">جاوب على كام سؤال وخد إجابة واضحة عن وحدتك.</p></div><Button size="lg" className="rounded-full bg-teal-600 px-8 text-[#0a1128] hover:bg-teal-500" render={<Link href="/dashboard" />}>احسب دلوقتي <ArrowLeft data-icon="inline-end" /></Button></div></section>

    <section className="mt-16 overflow-hidden bg-[#0a1128] text-white"><div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div className="order-2 flex justify-center lg:order-1"><div className="w-56 rounded-[2.5rem] border-8 border-[#1b2b4d] bg-[#050a18] p-3 shadow-2xl"><div className="rounded-[2rem] bg-slate-50 p-4 text-[#0a1128]"><div className="mx-auto mb-7 h-1 w-16 rounded-full bg-[#0a1128]" /><p className="text-xs text-muted-foreground">رصيدك العقاري</p><p className="mt-2 text-2xl font-bold">١.٥م ج.م</p><div className="mt-6 rounded-2xl bg-[#dcefe0] p-3"><Smartphone className="text-primary" /><p className="mt-3 text-xs font-bold">وحدتك تستحق خروج عادل</p><p className="mt-1 text-[10px] text-muted-foreground">اعرف الخطوة الجاية</p></div><div className="mt-4 flex gap-2"><div className="h-10 flex-1 rounded-xl bg-[#0a1128]" /><div className="h-10 flex-1 rounded-xl bg-[#dcefe0]" /></div></div></div></div><div className="order-1 lg:order-2"><span className="text-sm font-semibold text-teal-200">تطبيق عقار إكزت</span><h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight">كل فرصك العقارية في مكان واحد</h2><p className="mt-5 max-w-lg leading-8 text-white/65">تابع وحدتك، احسب موقفك، واكتشف فرص جديدة من على موباي��ك.</p><div className="mt-8 flex flex-wrap gap-3"><Button variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Download data-icon="inline-start" /> App Store</Button><Button variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Download data-icon="inline-start" /> Google Play</Button></div></div></div></section>
  </div>
}
