'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, ChevronDown, Filter, Heart, Search, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'

const properties = [
  { id: 'kayan', project: 'Kayan', developer: 'Arkan palm · الشيخ زايد', type: 'شقة', specs: 'شقة · 3 غرف · 2 حمام · 120 م²', cash: '5,263,000', gain: '+ 7,367,562', remaining: '5,732,000', installment: '476,000 ج.م · ربع سنوي', delivery: '2027', area: 'الشيخ زايد', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85' },
  { id: 'swan-lake-west', project: 'Swan Lake West', developer: 'Hassan Allam Properties · 6 أكتوبر', type: 'تاون هاوس', specs: 'تاون هاوس · 4 غرف · 5 حمام · 205 م²', cash: '10,928,131', gain: '+ 9,465,643', remaining: '16,266,296', installment: '856,000 ج.م · ربع سنوي', delivery: '2028', area: '6 أكتوبر', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85' },
  { id: 'elka', project: 'إلڤا', developer: 'موتن فيو · المستقبل سيتي', type: 'شقة', specs: 'شقة · 4 غرف · 4 حمام · 190 م²', cash: '3,718,494', gain: '+ 8,805,582', remaining: '6,350,067', installment: '271,000 ج.م · ربع سنوي', delivery: '2027', area: 'المستقبل سيتي', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85' },
  { id: 'salt', project: 'Salt', developer: 'Tatweer · رأس الحكمة', type: 'شاليه', specs: 'شاليه · 2 غرف · 2 حمام · 95 م²', cash: '3,330,852', gain: '+ 2,150,712', remaining: '5,100,000', installment: '240,000 ج.م · ربع سنوي', delivery: '2026', area: 'رأس الحكمة', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85' },
  { id: 'porto-marina', project: 'بورتو حلف مارينا', developer: 'عامر جروب · الساحل الشمالي', type: 'شقة', specs: 'شقة · 3 غرف · 2 حمام · 90 م²', cash: '1,381,000', gain: '+ 756,097', remaining: '2,700,000', installment: '140,000 ج.م · ربع سنوي', delivery: '2028', area: 'الساحل الشمالي', image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85' },
  { id: 'lake-capital', project: 'لاكبيتال العاصمة', developer: 'بريمير للتطوير العقاري · العاصمة الجديدة', type: 'شقة', specs: 'شقة · 3 غرف · 2 حمام · 166 م²', cash: '985,000', gain: '+ 446,750', remaining: '1,900,000', installment: '95,000 ج.م · ربع سنوي', delivery: '2027', area: 'العاصمة الإدارية', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=85' },
]

const unitTypes = ['شقة', 'شاليه', 'دوبلكس', 'تاون هاوس', 'فيلا', 'أرض']
const years = ['2024 أو أقدم', '2025', '2026', '2027', '2028', '2029', '2030']
const areas = ['الساحل الشمالي', 'العاصمة الإدارية', 'القاهرة الجديدة', 'رأس الحكمة', 'الشيخ زايد', '6 أكتوبر']
const sorts = ['الأحدث', 'الأنسب لي', 'الفرص المميزة', 'الأقل كاش', 'الأكبر مكسب']

function PropertyCard({ property }: { property: (typeof properties)[number] }) {
  return <Link href={`/opportunities/${property.id}`} className="group block">
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white py-0 shadow-sm transition-shadow group-hover:shadow-md">
      <div className="relative h-48">
        <img src={property.image} alt={`صورة مشروع ${property.project}`} className="h-48 w-full object-cover" />
        <Badge className="absolute right-3 top-3 rounded-full bg-sky-50 text-sky-700 shadow-sm hover:bg-sky-50">متحقق بالمستندات</Badge>
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
          <button type="button" aria-label="إضافة للمفضلة" className="grid size-9 place-items-center rounded-full bg-slate-500/80 text-white"><Heart /></button>
          <Star aria-label="فرصة مميزة" className="mx-1 size-4 fill-amber-400 text-amber-500" />
        </div>
      </div>
      <CardContent className="flex flex-col gap-4 p-4 text-right">
        <div><h2 className="text-lg font-bold text-slate-950">{property.project}</h2><p className="mt-1 text-xs text-slate-500">{property.developer}</p><p className="mt-3 text-[11px] text-slate-400">U-{property.id.slice(0, 5).toUpperCase()}</p></div>
        <p className="text-sm font-bold text-slate-900">{property.specs}</p>
        <div><p className="text-xs text-slate-500">المطلوب كاش دلوقتي</p><p className="mt-1 text-2xl font-black text-slate-950">{property.cash} <span className="text-sm">ج.م</span></p><p className="mt-1 text-xs font-bold text-orange-600">↓ قابل للتفاوض</p></div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><p className="text-[11px]">مكسبك عن سعر السوق</p><p className="mt-1 text-lg font-black">{property.gain} ج.م</p><p className="mt-1 text-[10px]">سعر السوق اليوم · بعد خصم عمولتنا 1.25%</p></div>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center text-[10px]"><div><span className="block text-slate-500">المتبقي للمطور</span><strong className="mt-1 block text-slate-800">{property.remaining}</strong></div><div><span className="block text-slate-500">القسط</span><strong className="mt-1 block text-slate-800">{property.installment.split(' ')[0]}</strong></div><div><span className="block text-slate-500">الاستلام</span><strong className="mt-1 block text-slate-800">{property.delivery}</strong></div></div>
        <Button className="h-11 w-full rounded-xl bg-[#0a1128] text-white hover:bg-[#111d42]">تفاصيل</Button>
      </CardContent>
    </Card>
  </Link>
}

export default function OpportunitiesPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sort, setSort] = useState('الأحدث')
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [minCash, setMinCash] = useState('')
  const [maxCash, setMaxCash] = useState('')
  const toggle = (value: string) => setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  const clear = () => { setSelected([]); setSearch(''); setMinCash(''); setMaxCash('') }
  const visible = useMemo(() => properties.filter((item) => {
    const haystack = `${item.project} ${item.developer} ${item.area}`
    const matchesSearch = !search || haystack.includes(search)
    const matchesType = !selected.some((value) => unitTypes.includes(value)) || selected.includes(item.type)
    const matchesYear = !selected.some((value) => years.includes(value)) || selected.includes(item.delivery) || (selected.includes('2024 أو أقدم') && Number(item.delivery) <= 2024)
    const matchesArea = !selected.some((value) => areas.includes(value)) || selected.includes(item.area)
    const cash = Number(item.cash.replaceAll(',', ''))
    return matchesSearch && matchesType && matchesYear && matchesArea && (!minCash || cash >= Number(minCash)) && (!maxCash || cash <= Number(maxCash))
  }), [search, selected, minCash, maxCash])

  return <main className="min-h-screen bg-[#f4f6f8] py-10"><div className="mx-auto max-w-7xl px-4 lg:px-8">
    <div className="mb-8 text-right"><p className="text-sm font-bold text-teal-700">سوق الفرص العقارية</p><h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">الفرص المتاحة</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">كل فرصة هنا اتراجع عقدها وإصلاحها ورصيدها المتبقي قبل ما تظهر. مفيش أوفر، ومفيش أرقام على كلام حد.</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><Button variant={filtersOpen ? 'default' : 'outline'} className="rounded-xl" onClick={() => setFiltersOpen((open) => !open)}><Filter data-icon="inline-start" /> فلترة</Button><span className="text-sm font-bold text-slate-600">{visible.length ? '8467' : '0'} وحدة متاحة</span></div><div className="flex items-center gap-3"><label htmlFor="sort" className="text-sm text-slate-500">ترتيب</label><div className="relative"><select id="sort" value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 min-w-40 appearance-none rounded-xl border border-slate-200 bg-white px-4 pl-10 text-sm text-slate-700 outline-none focus:border-teal-600"><option>{sorts[0]}</option>{sorts.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-3 size-4 text-slate-500" /></div></div></div>
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}><CollapsibleContent className="overflow-hidden"><div className="mt-5 border-t border-slate-200 pt-5"><div className="relative"><Search className="absolute right-4 top-3 size-4 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 rounded-xl pr-10" placeholder="اسم المشروع أو المنطقة" /></div><div className="mt-5 grid gap-6 md:grid-cols-3"><FilterGroup title="المناطق" items={areas} selected={selected} onToggle={toggle} /><FilterGroup title="سنة الاستلام" items={years} selected={selected} onToggle={toggle} /><FilterGroup title="نوع الوحدة" items={unitTypes} selected={selected} onToggle={toggle} /></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Input inputMode="numeric" value={minCash} onChange={(event) => setMinCash(event.target.value)} className="h-11 rounded-xl" placeholder="الأقل كاش" /><Input inputMode="numeric" value={maxCash} onChange={(event) => setMaxCash(event.target.value)} className="h-11 rounded-xl" placeholder="الأعلى كاش" /></div><div className="mt-5 flex items-center justify-end gap-3"><Button className="rounded-xl bg-teal-600 text-white hover:bg-teal-700" onClick={() => setFiltersOpen(false)}>عرض النتائج</Button><Button variant="ghost" className="rounded-xl" onClick={clear}>مسح الكل <X data-icon="inline-end" /></Button></div></div></CollapsibleContent></Collapsible>
    </section>
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
  </div></main>
}

function FilterGroup({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <fieldset><legend className="mb-3 text-sm font-bold text-slate-800">{title}</legend><div className="flex flex-wrap gap-2">{items.map((item) => <button type="button" key={item} onClick={() => onToggle(item)} className={`rounded-full border px-3 py-2 text-xs transition ${selected.includes(item) ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-400'}`}>{item}</button>)}</div></fieldset>
}
