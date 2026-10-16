import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const standards = ['وضوح كامل في كل خطوة وكل رقم', 'تقييم عادل مبني على بيانات السوق', 'التزام بالمواعيد والتواصل المستمر', 'منصة آمنة تحفظ حقوق كل الأطراف']
const points = ['أنت عارف هتبيع بكام', 'مفيش مفاجآت أو وعود مبهمة', 'أرقام حقيقية وقرار واضح', 'احترام كامل لوقت ومجهود كل طرف']

function Quote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border-r-4 border-teal-600 bg-slate-50 px-6 py-5 text-base font-semibold leading-8 text-[#0a1128]">{children}</div>
}

function CheckList({ items }: { items: string[] }) {
  return <ul className="flex flex-col gap-4 text-sm leading-7 text-slate-600">{items.map((item) => <li key={item} className="flex items-start gap-3"><Check className="mt-1 shrink-0 text-teal-600" data-icon="inline-start" />{item}</li>)}</ul>
}

export default function StoryPage() {
  return <div dir="rtl" className="bg-[#f6f7f9] text-[#0a1128]">
    <section className="bg-[#0a1128] text-white"><div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20"><div className="relative order-2 mx-auto h-[360px] w-full max-w-[310px] overflow-hidden rounded-2xl bg-slate-800 shadow-2xl lg:order-1"><Image src="/story-founder.png" alt="د. محمود عمار" fill priority className="object-cover object-top grayscale" /></div><div className="order-1 text-right lg:order-2"><p className="text-sm font-semibold text-teal-300">الحكاية من البداية</p><h1 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.45] md:text-5xl">ليه حد ممكن يخسر جزء كبير من فلوسه لمجرد إنه مش قادر يكمّل؟</h1><p className="mt-6 text-lg font-semibold text-teal-300">د. محمود عمار</p><p className="mt-1 text-xs text-teal-200">مؤسس عقار إكزت</p><p className="mt-6 max-w-xl text-sm leading-8 text-slate-300">من هنا بدأت الفكرة: نعمل سوق عقاري أكثر وضوحًا وإنسانية، يساعدك تاخد قرارك من غير ضغط أو غموض، ويحفظ قيمة كل جنيه دفعته.</p></div></div></section>
    <main className="mx-auto max-w-3xl px-5 py-16 lg:px-0 lg:py-20">
      <article className="flex flex-col gap-10 text-right leading-8">
        <div className="flex flex-col gap-6 text-sm text-slate-600"><p>الفكرة بدأت من ملاحظة بسيطة: ناس كتير بتدخل مشروعات العقارات بحلم كبير، لكن الظروف أحيانًا بتتغير قبل ما الحلم يكتمل.</p><p>تأخير، التزامات جديدة، أو احتياج مفاجئ للسيولة. وفي اللحظة دي، غالبًا بيكون الحل الوحيد هو البيع بخسارة أو الانتظار من غير نهاية واضحة.</p><Quote>أكمل أقساطنا من غير ما نخسر فلوس؟ وإزاي نضمن إن العقد واتصال الشراكة يكونوا واضحين؟</Quote></div>
        <section className="flex flex-col gap-5"><h2 className="text-2xl font-bold">هنا بدأت أشوف المشكلة بشكل مختلف</h2><p className="text-sm text-slate-600">المشكلة مش في العقار نفسه، المشكلة في غياب المسار العادل. المشتري محتاج حل واضح، والبائع محتاج يخرج من التزامه من غير ما يخسر كل اللي دفعه.</p><p className="text-sm text-slate-600">علشان كده بنينا طريقة شغل بتجمع بين الطرفين وتخلي كل خطوة مفهومة ومعلنة.</p><h3 className="text-xl font-bold text-teal-700">طب ليه مانعيش الطرفين؟</h3><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-white p-5 text-sm shadow-sm">صاحب العقد يخرج من التزامه ويرجع جزء كبير من فلوسه</div><div className="rounded-xl bg-white p-5 text-sm shadow-sm">والشاري يدخل على فرصة بسعر مناسب وببيانات واضحة</div></div></section>
        <section className="flex flex-col gap-5"><h2 className="text-2xl font-bold">ومن هنا اتولدت عقار إكزت</h2><p className="text-sm text-slate-600">منصة هدفها إنها تخلي بيع وشراء الوحدات عملية مفهومة، مش سباق وعود ولا مساحة للتخمين.</p><div className="rounded-xl bg-white p-6 shadow-sm"><CheckList items={points} /></div></section>
        <section className="flex flex-col gap-5"><h2 className="text-2xl font-bold">أهم قرار أخدناه من البداية</h2><p className="text-sm text-slate-600">كان لازم نبدأ من سؤال بسيط: هل ممكن نكون عادلين مع البائع والمشتري في نفس الوقت؟</p><Quote>إحنا أخدنا على عاتقنا إننا نبيع ونشتري بوضوح، مش نكسب من حيرة صاحب الوحدة.</Quote><div className="rounded-2xl bg-[#0a1128] p-8 text-white"><p className="text-6xl font-bold text-teal-300">صفر</p><h3 className="mt-3 text-xl font-bold">عمولة عقار إكزت في البيع</h3><p className="mt-3 text-sm leading-7 text-slate-300">لأن خروجك العادل مش لازم يتكلف عمولة إضافية، ولا لازم تدفع علشان تاخد حقك.</p></div></section>
        <section className="flex flex-col gap-5"><h2 className="text-2xl font-bold">بالنسبة لي... القيمة الحقيقية مش في بيع وحدة</h2><p className="text-sm text-slate-600">القيمة في إنك تخرج من التزامك وأنت فاهم كل رقم، وتبدأ خطوة جديدة من غير إحساس بالندم أو الخسارة.</p><Quote>لما يكون القرار واضح، كل الأطراف تقدر تكمل وهي مطمئنة.</Quote></section>
        <section className="flex flex-col gap-5"><h2 className="text-2xl font-bold">رؤيتنا أكبر من مجرد موقع وحدات</h2><p className="text-sm text-slate-600">إحنا بنبني مجتمع عقاري يعتمد على البيانات، ويحترم وقت الناس، ويفتح فرص عادلة لكل شخص داخل السوق.</p><CheckList items={standards} /></section>
        <section className="flex flex-col gap-5"><h2 className="text-2xl font-bold">في الآخر... عقار إكزت مبنية على فكرة واحدة</h2><Quote>السوق العادل هو السوق اللي يقدر كل طرف يخرج منه وهو كسبان.</Quote><p className="text-sm text-slate-600">لسه الحكاية في بدايتها، لكن كل وحدة بنساعد فيها صاحبها هي خطوة جديدة ناحية سوق أكثر وضوحًا.</p></section>
        <section className="flex flex-col items-center gap-5 border-t border-slate-200 pt-10 text-center"><p className="text-sm font-semibold">د. محمود عمار</p><p className="text-xs text-slate-500">المؤسس والرئيس التنفيذي</p><div className="flex flex-wrap justify-center gap-3"><Button className="bg-teal-700 text-white hover:bg-teal-800" render={<Link href="/sell" />}>بيع وحدتك</Button><Button variant="outline" className="border-teal-700 text-teal-700" render={<Link href="/opportunities" />}>شوف الفرص المتاحة <ArrowLeft data-icon="inline-end" /></Button></div></section>
      </article>
    </main>
  </div>
}
