'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronDown, Filter, Heart, Search, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'

const properties = [
  { id: 'capital-gardens', project: 'رابيسك العاصمة الجديدة', location: 'الشركة السعودية المصرية · العاصمة الإدارية الجديدة', cash: '1,955,000', gain: '+ 2,014,450', type: 'شقة', area: '125 م²', image: 'from-[#cfc2a8] via-[#eee8dc] to-[#614d3b]' },
  { id: 'porto-cairo', project: 'بورتو كروز', location: 'عامر جروب · الساحل الشمالي', cash: '2,045,000', gain: '+ 3,083,612', type: 'شاليه', area: '99 م²', image: 'from-[#8ab277] via-[#3d775e] to-[#d7e2b6]' },
  { id: 'south-med', project: 'South med', location: 'طلعت مصطفى · الساحل الشمالي', cash: '6,179,735', gain: '+ 1,821,517', type: 'شقة', area: '129 م²', image: 'from-[#1a8caa] via-[#66c7c7] to-[#e4c983]' },
  { id: 'salt', project: 'Salt', location: 'Tatweer · رأس الحكمة', cash: '3,330,852', gain: '+ 2,150,712', type: 'شاليه', area: '95 م²', image: 'from-[#7bc1ed] via-[#7ec6db] to-[#d6c39c]' },
  { id: 'porto-hacienda', project: 'بورتو حلف مارينا', location: 'عامر جروب · الساحل الشمالي', cash: '1,381,000', gain: '+ 756,097', type: 'شقة', area: '90 م²', image: 'from-[#75b3c0] via-[#4c8e5b] to-[#dbe5ae]' },
  { id: 'capital-lake', project: 'لاكبيتال العاصمة', location: 'بريمير للتطوير العقاري · العاصمة الجديدة', cash: '985,000', gain: '+ 446,750', type: 'شقة', area: '166 م²', image: 'from-[#78b9e9] via-[#8ab9d2] to-[#efe5ca]' },
]

const unitTypes = ['شقة', 'شاليه', 'دوبلكس', 'تاون هاوس', 'فيلا']
const years = ['2025', '2026', '2027', '2028']
const areas = ['الساحل الشمالي', 'العاصمة الإدارية', 'القاهرة الجديدة', 'رأس الحكمة']
const sorts = ['الأحدث', 'الأنسب لي', 'الفرص المميزة', 'الأقل كاش', 'أقل قسط', 'الأكبر مكسب', 'الأقرب للاستلام']

function PropertyCard({ property }: { property: (typeof properties)[number] }) {
  return <Link href={`/opportunities/${property.id}`} className="group block">
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className={`relative h-56 bg-gradient-to-br ${property.image}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.45),transparent_28%)]" />
        <Badge className="absolute right-4 top-4 rounded-full bg-white text-sky-700 shadow-sm hover:bg-white">متحقق بالمستندات</Badge>
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-sm"><button type="button" aria-label="إضافة للمفضلة" className="grid size-9 place-items-center rounded-full bg-slate-600/70 text-white"><Heart /></button><Star className="size-5 fill-amber-400 text-amber-500" /></div>
      </div>
      <CardContent className="flex flex-col gap-4 p-5 text-right">
        <div><h2 className="text-xl font-bold text-slate-950 dark:text-white">{property.project}</h2><p className="mt-1 text-sm text-slate-500">{property.location}</p><p className="mt-3 text-xs text-slate-400">U-{property.id.slice(0, 5).toUpperCase()}</p></div>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{property.type} · 2 غرف · حمام · {property.area}</p>
        <div><p className="text-sm text-slate-500">المطلوب كاش دلوقتي</p><p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{property.cash} <span className="text-base">ج.م</span></p><p className="mt-1 text-sm font-bold text-orange-600">↓ قابل للتفاوض</p></div>
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700"><p className="text-xs">مكسبك عن سعر السوق</p><p className="mt-1 text-xl font-black">{property.gain} ج.م</p><p className="mt-1 text-[11px]">سعر السوق اليوم: بعد خصم عمولتنا 1.25%</p></div>
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 text-xs"><span className="text-slate-500">المتبقي للمطور</span><strong>6,475,000 ج.م</strong><span className="text-slate-500">القسط</span><strong>239,000 ج.م · ربع سنوي</strong></div>
        <Button className="h-12 rounded-xl bg-[#0a1128] text-white hover:bg-[#111d42]">تفاصيل</Button>
      </CardContent>
    </Card>
  </Link>
}

export default function OpportunitiesPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sort, setSort] = useState('الأحدث')
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const toggle = (value: string) => setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  const clear = () => { setSelected([]); setSearch('') }
  const visible = properties.filter((item) => !search || `${item.project} ${item.location}`.includes(search))

  return <main className="min-h-screen bg-[#f4f6f8] py-8 dark:bg-slate-950 lg:py-12"><div className="mx-auto max-w-7xl px-4 lg:px-8">
    <div className="mb-7 text-right"><p className="text-sm font-bold text-teal-700">سوق الفرص العقارية</p><h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white md:text-4xl">الفرص المتاحة</h1></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><Button variant={filtersOpen ? 'default' : 'outline'} className="rounded-xl" onClick={() => setFiltersOpen((open) => !open)}><Filter data-icon="inline-start" /> فلترة</Button><span className="text-sm font-bold text-slate-600 dark:text-slate-300">{visible.length ? '8467' : '0'} وحدة متاحة</span></div><div className="relative flex items-center gap-3"><span className="text-sm text-slate-500">ترتيب</span><Button variant="outline" className="min-w-36 justify-between rounded-xl" onClick={() => setSortOpen((open) => !open)}>{sort}<ChevronDown data-icon="inline-end" /></Button>{sortOpen && <div className="absolute left-0 top-12 z-20 w-48 rounded-xl border bg-white p-2 text-right shadow-xl dark:border-slate-700 dark:bg-slate-900">{sorts.map((item) => <button type="button" key={item} onClick={() => { setSort(item); setSortOpen(false) }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${sort === item ? 'bg-slate-100 font-bold dark:bg-slate-800' : ''}`}>{item}{sort === item && <Check className="size-4 text-teal-600" />}</button>)}</div>}</div></div>
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}><CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"><div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700"><div className="relative"><Search className="absolute right-4 top-3 size-4 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 rounded-xl pr-10" placeholder="اسم المشروع أو المنطقة" /></div><div className="mt-5 grid gap-5 md:grid-cols-3"><FilterGroup title="نوع الوحدة" items={unitTypes} selected={selected} onToggle={toggle} /><FilterGroup title="سنة الاستلام" items={years} selected={selected} onToggle={toggle} /><FilterGroup title="المناطق" items={areas} selected={selected} onToggle={toggle} /></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Input className="h-11 rounded-xl" placeholder="الأقل كاش (جنيه)" /><Input className="h-11 rounded-xl" placeholder="الأعلى كاش (جنيه)" /></div><div className="mt-5 flex items-center justify-end gap-3"><Button className="rounded-xl bg-teal-600 text-white hover:bg-teal-700" onClick={() => setFiltersOpen(false)}>عرض النتائج</Button><Button variant="ghost" className="rounded-xl" onClick={clear}>مسح الكل <X data-icon="inline-end" /></Button></div></div></CollapsibleContent></Collapsible>
    </section>
    <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
  </div></main>
}

function FilterGroup({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <fieldset><legend className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">{title}</legend><div className="flex flex-wrap gap-2">{items.map((item) => <button type="button" key={item} onClick={() => onToggle(item)} className={`rounded-full border px-3 py-2 text-xs transition ${selected.includes(item) ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{item}</button>)}</div></fieldset>
}
