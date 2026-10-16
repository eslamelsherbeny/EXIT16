import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Bath, BedDouble, CalendarDays, Check, ChevronLeft, Heart, MapPin, Maximize2, Share2, Sparkles, Upload, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const gallery = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
]
const similar = [
  ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80', 'Ravie', '905,200'],
  ['https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=600&q=80', 'Linq 30', '350,000'],
  ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80', 'رامتان', '3,044,980'],
  ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80', 'سيكتور', '2,243,051'],
  ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80', 'سراي', '5,601,193'],
]

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `لاكابيتال العاصمة | ${id}`, description: 'تفاصيل الفرصة العقارية والتقدم للحجز.' }
}

const info = [
  ['النوع', 'شقة', BedDouble], ['المساحة', '166 م²', Maximize2], ['الدور', '3', ChevronLeft], ['غرف', '3', BedDouble],
  ['حمامات', '2', Bath], ['التشطيب', 'تشطيب كامل', Sparkles], ['سنة الاستلام', 'جاهزة للاستلام', CalendarDays], ['سعر المتر', '44,940 ج.م', Waves],
] as const

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await params
  return <main className="min-h-screen bg-[#f4f6f8] py-6 text-[#0b1730]" dir="rtl">
    <div className="mx-auto w-full max-w-[820px] px-4 sm:px-6">
      <div className="flex items-center justify-between text-xs text-slate-500"><Link href="/opportunities" className="flex items-center gap-1 hover:text-teal-700"><ArrowRight className="size-3" /> الفرص المتاحة</Link><span>الرئيسية &gt; الفرص المتاحة &gt; لا كابيتال العاصمة</span></div>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">لاكابيتال العاصمة</h1><p className="mt-1 text-xs text-slate-500">بريمير للتطوير العقاري · العاصمة الإدارية الجديدة</p><Badge variant="outline" className="mt-3 rounded-full text-[10px]">U-19858</Badge></div>
        <div className="flex items-center gap-2"><Badge className="rounded-full bg-sky-50 text-[10px] text-sky-700 hover:bg-sky-50">متحقق بالمستندات</Badge><Badge className="rounded-full bg-amber-50 text-[10px] text-amber-700 hover:bg-amber-50"><Sparkles data-icon="inline-start" /> مميزة</Badge><Button variant="outline" size="sm" className="rounded-full text-xs"><Share2 data-icon="inline-start" /> مشاركة</Button><Button variant="outline" size="sm" className="rounded-full text-xs"><Heart data-icon="inline-start" /> أضف للمفضلة</Button></div>
      </header>
      <section className="mt-5 grid grid-cols-[1fr_1.35fr] gap-2 overflow-hidden rounded-2xl" dir="ltr"><div className="relative min-h-[250px] overflow-hidden rounded-s-2xl"><Image src={gallery[0]} alt="واجهة المشروع" fill className="object-cover" sizes="(max-width: 820px) 50vw, 500px" priority /></div><div className="grid gap-2"><div className="relative min-h-[122px] overflow-hidden rounded-e-2xl"><Image src={gallery[1]} alt="تفاصيل العقار" fill className="object-cover" sizes="(max-width: 820px) 50vw, 500px" /></div><div className="relative min-h-[122px] overflow-hidden rounded-e-2xl"><Image src={gallery[2]} alt="داخل العقار" fill className="object-cover" sizes="(max-width: 820px) 50vw, 500px" /></div></div></section>
      <section className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-4">{info.map(([label, value, Icon]) => <div key={label} className="flex min-h-[72px] flex-col items-center justify-center gap-1 border-b border-slate-100 p-3 text-center sm:border-b-0 sm:border-l"><Icon className="size-3.5 text-slate-400" /><span className="text-[10px] text-slate-500">{label}</span><strong className="text-xs">{value}</strong></div>)}</section>
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6"><div className="flex flex-wrap gap-2">{['متبقي قسطين', 'فيو مميز', 'بحري', 'قريبة من الخدمات', 'تشطيب كامل'].map((tag) => <Badge key={tag} variant="secondary" className="rounded-full bg-slate-50 text-[10px] font-medium text-slate-700">✓ {tag}</Badge>)}</div><p className="mt-3 text-slate-600">شقة في لاكابيتال العاصمة، متشطبة بالكامل بالخامات والمطابخ والأجهزة. الوحدة جاهزة للاستلام وتتمتع بإطلالة مميزة وموقع قريب من جميع الخدمات.</p></section>
      <Card className="mt-4 border-teal-600/40 bg-white py-0"><CardContent className="p-4 sm:p-5"><p className="text-xs text-slate-500">المطلوب كاش دلوقتي</p><p className="mt-1 text-3xl font-black tracking-tight">985,000 <span className="text-lg">ج.م</span></p><div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[10px] text-amber-800"><strong>↓ قابل للتفاوض</strong><p className="mt-1">السعر قابل للتفاوض حسب طريقة السداد وتفاصيل التنازل.</p></div><div className="mt-3 rounded-lg bg-emerald-50 p-3 text-emerald-700"><p className="text-[10px]">مكسبك عن سعر السوق الحالي</p><p className="mt-1 text-xl font-black">+ 446,750 ج.م</p><p className="text-[9px]">بعد خصم عمولتنا 1.25%</p></div></CardContent></Card>
      <Card className="mt-3 border-slate-200 bg-white py-0"><CardContent className="divide-y divide-slate-100 p-0 text-xs">{[['المتبقي للمطور (متفككة أقساط)', '6,475,000 ج.م'], ['القسط', '239,000 ج.م · ربع سنوي'], ['باقي على سداد الأقساط', '7 سنة'], ['عمولة عقار إكزت للمشتري (1.25% على إجمالي التعاقد)', '89,250 ج.م'], ['إجمالي المطلوب منك دلوقتي', '1,078,250 ج.م']].map(([label, value], index) => <div key={label} className="flex items-center justify-between gap-4 px-4 py-3"><span className="text-slate-500">{label}</span><strong className={index === 4 ? 'text-base' : ''}>{value}</strong></div>)}</CardContent></Card>
      <section className="mt-5"><div className="flex items-center justify-between"><h2 className="text-sm font-black">فرص مميزة مشابهة</h2><span className="text-[10px] text-slate-500">إعلانات مشابهة في نفس المنطقة</span></div><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{similar.map(([image, name, price]) => <Card key={name} className="overflow-hidden rounded-xl border-slate-200 bg-white py-0"><div className="relative h-24"><Image src={image} alt={name} fill className="object-cover" sizes="250px" /><Badge className="absolute right-2 top-2 rounded-full bg-white text-[9px] text-amber-700 hover:bg-white">★ مميزة</Badge></div><CardContent className="p-3 text-right"><h3 className="text-xs font-bold">{name}</h3><p className="mt-1 text-[9px] text-slate-500">العاصمة الإدارية الجديدة</p><p className="mt-2 text-[10px] font-black">المطلوب كاش دلوقتي: {price} ج.م</p><span className="mt-2 block text-[9px] text-teal-700">عرض الوحدة</span></CardContent></Card>)}</div></section>
      <Card className="mt-5 border-teal-600/40 bg-white"><CardHeader className="pb-2"><CardTitle className="text-base font-black">عايز تلحق تحجز الفرصة دي؟</CardTitle><p className="text-[10px] text-slate-500">سيب بياناتك وفريقنا هيتواصل معاك بأسرع وقت.</p></CardHeader><CardContent className="flex flex-col gap-4"><label className="text-xs font-bold">الاسم<Input className="mt-2 h-9 rounded-lg" defaultValue="basma" /></label><label className="text-xs font-bold">رقم الواتساب<div className="mt-2 flex gap-2"><Select defaultValue="eg"><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="eg">🇪🇬 مصر +20</SelectItem></SelectContent></Select><Input dir="ltr" className="h-9 flex-1 rounded-lg" defaultValue="01149484906" /></div></label><label className="text-xs font-bold">إيه الأسئلة أو التفاصيل اللي عايز تعرفها؟<Textarea className="mt-2 min-h-16 rounded-lg" placeholder="اكتب هنا" /></label><fieldset><legend className="mb-2 text-xs font-bold">أنت جاهز للتنفيذ في حركة؟</legend><div className="flex flex-col gap-2"><label className="flex items-center gap-2 rounded-lg border p-3 text-[10px]"><Checkbox /> مستعد أستلم ملكية الوحدة وأحدد معاينة خلال ٤٨ ساعة</label><label className="flex items-center gap-2 rounded-lg border p-3 text-[10px]"><Checkbox /> جاهز خلال شهر إلى ٣ شهور</label><label className="flex items-center gap-2 rounded-lg border border-teal-500 bg-teal-50 p-3 text-[10px]"><Checkbox defaultChecked /> محتاج وضاح معلومات</label></div></fieldset><label className="flex items-start gap-2 rounded-lg border border-teal-300 p-3 text-[10px]"><Checkbox className="mt-0.5" /> أوافق على عمولة عقار إكزت الإضافية كاش: 1.25% من قيمة التعاقد، تُدفع في حالة إتمام التنازل.</label><div className="flex h-10 items-center justify-center rounded-lg bg-slate-50 text-[10px] text-emerald-700">✓ Success! &nbsp; Cloudflare Turnstile</div><Button className="h-11 rounded-lg bg-teal-700 text-sm font-bold text-white hover:bg-teal-800">ألحق الفرصة</Button><p className="text-center text-[9px] text-slate-400">باستخدامك للنموذج، أنت توافق على سياسة الخصوصية.</p></CardContent></Card>
    </div>
  </main>
}
