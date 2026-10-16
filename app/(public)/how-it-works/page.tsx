import { Check } from 'lucide-react'

const ownerSteps = [
  ['قيّم عقدك', 'دخل بيانات عقدك واعرف موقفه مبدئيًا — وأول ما يتم طلبك، حسابك يتسجل تلقائيًا.'],
  ['ارفع مستنداتك', 'العقد وإيصالات السداد — نراجعها ونتحقق منها.'],
  ['نجهز فرصتك', 'بتتحقق من الأرقام بالمستندات ونجهز عرض موثوق للمشترين.'],
  ['بداية المشتري', 'بنطابق وحدتك مع مشترين قادرين فعلاً يكملوا.'],
  ['نقل التعاقد', 'بنمشي معاك في إجراءات النقل خطوة بخطوة لحد ما تقبض.'],
]

const buyerSteps = [
  ['قوّم ميزانيتك', 'اعرف المبلغ والقسط اللي يريحك — وحسابك يتجهز تلقائيًا من طلبك.'],
  ['شوف الفرص المناسبة', 'فرص متحقق منها بأرقام كاملة وواضحة.'],
  ['قدّم عرضك', 'عرض رسمي بشروط واضحة وأرقام كاملة.'],
  ['ثبت الحجز', 'كل خطوة موثقة — والدفع يتم ضمن إجراءات النقل الرسمية نفسها.'],
  ['استلم تعاقدك', 'نقل رسمي معتمد من المطور وملف كامل.'],
]

function JourneyCard({ title, steps, button }: { title: string; steps: string[][]; button: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
    <h2 className="text-xl font-bold text-[#101a35]">{title}</h2>
    <div className="mt-7 flex flex-col gap-6">
      {steps.map(([stepTitle, description], index) => <div key={stepTitle} className="relative flex gap-4 text-right">
        {index < steps.length - 1 && <span className="absolute right-[15px] top-9 h-[calc(100%+1.5rem)] w-px bg-slate-200" aria-hidden="true" />}
        <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#101a35] text-sm font-bold text-white">{index + 1}</span>
        <div className="min-w-0"><h3 className="font-bold text-[#101a35]">{stepTitle}</h3><p className="mt-2 text-sm leading-7 text-slate-500">{description}</p></div>
      </div>)}
    </div>
    <button className="mt-7 rounded-xl bg-[#101a35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#18264a]">{button}</button>
  </section>
}

export default function HowItWorksPage() {
  return <div dir="rtl" className="bg-slate-50 text-[#101a35]">
    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
      <header className="mx-auto max-w-3xl text-center"><h1 className="text-4xl font-bold tracking-tight md:text-5xl">إزاي بنشتغل</h1><p className="mt-4 text-base leading-8 text-slate-500">عملية واضحة من أول تقييم عقدك لحد ما تقبض — ومسؤول حالة معاك في كل خطوة</p></header>
      <div className="mt-12 grid gap-8 md:grid-cols-2"><JourneyCard title="رحلة صاحب الوحدة" steps={ownerSteps} button="ابدأ تقييم عقدك" /><JourneyCard title="رحلة المشتري" steps={buyerSteps} button="سجل كمشتري" /></div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-8"><h2 className="text-2xl font-bold">مجاناً للبائع — والعمولة بكل وضوح</h2><p className="mt-4 max-w-4xl text-sm leading-8 text-slate-600">البائع مش بيدفع ولا جنيه. المشتري بيدفع 1.25% من قيمة التعاقد، وليس لما يتم التنازل بنجاح. لو النقل ما تمش، مفيش عمولة على حد.</p><div className="mt-6 rounded-xl bg-blue-50 px-5 py-4 text-sm leading-8 text-blue-700">إحنا بنعرض تقديرات مبنية على مستندات حقيقية، لكن مفيش أي وعد بمدة بيع محددة أو نسبة استرداد مضمونة — النتيجة بتعتمد على عقدك وموافقة المطور والسوق.</div></section>
    </div>
  </div>
}
