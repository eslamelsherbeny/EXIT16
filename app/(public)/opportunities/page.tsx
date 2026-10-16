'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Filter, Heart, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/empty-state'

const properties = [
  { id: 'marassi', project: 'مراسي', location: 'الساحل الشمالي، سيدي عبد الرحمن', cash: '540,000', gain: '+ 1,821,517', type: 'شاليه', area: '128 م²', status: 'متاح', tone: 'from-emerald-900 via-teal-700 to-amber-200' },
  { id: 'hacienda', project: 'هاسيندا ويست', location: 'رأس الحكمة، الساحل الشمالي', cash: '1,250,000', gain: '+ 2,104,800', type: 'تاون هاوس', area: '210 م²', status: 'قريباً', tone: 'from-slate-900 via-cyan-800 to-sky-200' },
  { id: 'mountain-view', project: 'ماونتن فيو آي سيتي', location: 'القاهرة الجديدة، التجمع الخامس', cash: '2,045,000', gain: '+ 3,083,612', type: 'شقة', area: '165 م²', status: 'متاح', tone: 'from-stone-900 via-orange-700 to-yellow-100' },
]

function PropertyCard({ property }: { property: typeof properties[number] }) {
  return <Link href={`/opportunities/${property.id}`} className="group block">
    <Card className="h-full overflow-hidden rounded-[1.35rem] border-border/70 bg-card py-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
      <div className={`relative h-52 bg-gradient-to-br ${property.tone}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,.28),transparent_30%)]" />
        <div className="absolute right-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-foreground shadow-sm">دارك<span className="text-primary">.</span></div>
        <span className="absolute bottom-4 right-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">{property.status}</span>
      </div>
      <CardContent className="flex flex-col gap-4 p-5">
        <div><h2 className="text-xl font-bold">{property.project}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{property.location}</p></div>
        <div className="border-y border-border/70 py-4"><p className="text-sm text-muted-foreground">المطلوب كاش دلوقتي:</p><p className="mt-1 text-3xl font-black tracking-tight">{property.cash} <span className="text-base font-bold">ج.م</span></p><p className="mt-2 text-sm font-bold text-primary">مكسبك عن سعر السوق الحالي: {property.gain} ج.م</p></div>
        <div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">الكاش في ميزانيتك</span><span className="rounded-full bg-muted px-3 py-1.5">{property.type}</span><span className="rounded-full bg-muted px-3 py-1.5">{property.area}</span></div>
      </CardContent>
    </Card>
  </Link>
}

function QuickFilterModal({ onClose }: { onClose: () => void }) {
  const pills = ['لحد 1 مليون', '1 - 2 مليون', 'أكتر من 2 مليون']
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quick-filter-title">
    <div className="w-full max-w-xl rounded-[1.5rem] bg-card p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-primary">فلتر سريع</p><h2 id="quick-filter-title" className="mt-1 text-2xl font-black">بتدور على إيه؟</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق"><X /></Button></div>
      <div className="mt-7 flex flex-col gap-6">
        <label className="flex flex-col gap-2 text-sm font-bold">المنطقة<div className="flex items-center justify-between rounded-xl border border-input px-4 py-3 font-normal text-muted-foreground">كل المناطق <ChevronDown className="size-4" /></div></label>
        <div><p className="mb-2 text-sm font-bold">نوع الوحدة</p><div className="flex flex-wrap gap-2">{['شقة', 'شاليه', 'تاون هاوس', 'فيلا'].map((item) => <button type="button" key={item} className="rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary hover:text-primary">{item}</button>)}</div></div>
        <div><p className="mb-2 text-sm font-bold">الكاش اللي معاك</p><div className="flex flex-wrap gap-2">{pills.map((item) => <button type="button" key={item} className="rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary hover:text-primary">{item}</button>)}</div></div>
        <div><p className="mb-2 text-sm font-bold">القسط الشهري</p><div className="flex flex-wrap gap-2">{['لحد 20 ألف', '20 - 40 ألف', 'أكتر من 40 ألف'].map((item) => <button type="button" key={item} className="rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary hover:text-primary">{item}</button>)}</div></div>
      </div>
      <div className="mt-8 flex items-center gap-4"><Button className="h-12 flex-1 rounded-xl" onClick={onClose}>اعرضلي الوحدات <ArrowLeft data-icon="inline-end" /></Button><button type="button" onClick={onClose} className="text-sm font-semibold text-muted-foreground hover:text-foreground">مش دلوقتي</button></div>
    </div>
  </div>
}

export default function OpportunitiesPage() {
  const [quickFilterOpen, setQuickFilterOpen] = useState(true)
  const [noResults, setNoResults] = useState(false)
  return <section className="min-h-screen bg-muted/35 py-12 lg:py-16"><div className="mx-auto max-w-7xl px-5 lg:px-8">
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="mb-3 text-sm font-bold text-primary">سوق الفرص العقارية</p><h1 className="text-4xl font-black tracking-tight md:text-5xl">لقينا لك فرص تستاهل</h1><p className="mt-3 max-w-xl text-muted-foreground">وحدات متباعة بعناية، بأسعار تعاقد قديمة ومكسب واضح من أول يوم.</p></div><Button variant="outline" className="rounded-xl md:hidden" onClick={() => setQuickFilterOpen(true)}><SlidersHorizontal data-icon="inline-start" /> فلتر سريع</Button></div>
    <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block"><Card className="sticky top-28 rounded-2xl border-border/70"><CardContent className="flex flex-col gap-6 p-5"><div className="flex items-center justify-between"><h2 className="font-bold">تصفية النتائج</h2><Filter className="size-4 text-primary" /></div><label className="relative block"><span className="sr-only">ابحث عن مشروع</span><Search className="absolute right-3 top-3 size-4 text-muted-foreground" /><Input className="pr-9" placeholder="ابحث عن مشروع أو منطقة" /></label><div><p className="mb-3 text-sm font-bold">الميزانية</p><div className="flex gap-2"><Input placeholder="الكاش" /><Input placeholder="القسط" /></div></div><div><p className="mb-3 text-sm font-bold">نوع الوحدة</p><div className="flex flex-col gap-3 text-sm">{['شقة', 'شاليه', 'تاون هاوس', 'فيلا'].map((item) => <label key={item} className="flex items-center gap-2"><Checkbox />{item}</label>)}</div></div><div><p className="mb-3 text-sm font-bold">الحالة</p><div className="flex flex-col gap-3 text-sm">{['متاح للحجز', 'قريباً'].map((item) => <label key={item} className="flex items-center gap-2"><Checkbox />{item}</label>)}</div></div><Button className="h-11 rounded-xl" onClick={() => setNoResults(true)}>تطبيق الفلاتر</Button></CardContent></Card></aside>
      <main><div className="mb-5 flex items-center justify-between"><p className="text-sm text-muted-foreground">{noResults ? 'مفيش نتائج' : 'عرض 12 فرصة مناسبة ليك'}</p><Button variant="outline" className="hidden rounded-xl sm:inline-flex"><SlidersHorizontal data-icon="inline-start" /> ترتيب: الأحدث</Button></div>{noResults ? <EmptyState onAction={() => setNoResults(false)} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}</main>
    </div>
  </div>{quickFilterOpen && <QuickFilterModal onClose={() => setQuickFilterOpen(false)} />}</section>
}
