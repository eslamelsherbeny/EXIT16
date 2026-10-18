'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Maximize2,
  Share2,
  Star,
  X,
  ZoomIn,
} from 'lucide-react'

// صور المعرض (شاملة صور المشروع والمخططات كما في الموقع الأصلي)
const gallery = [
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    caption: 'واجهة المشروع - إلڤا ماونتن فيو',
  },
  {
    url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    caption: 'الإطلالة واللاندسكيب المميز',
  },
  {
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85',
    caption: 'تصميم المباني والواجهات',
  },
  {
    url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
    caption: 'المساحات الخضراء والبحيرات',
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    caption: 'الكلوب هاوس والخدمات',
  },
]

// مواصفات الوحدة التسع كما في التصميم الأصلي
const unitSpecs = [
  { label: 'النوع', value: 'شقة' },
  { label: 'المساحة', value: '190 م²' },
  { label: 'الدور', value: '2' },
  { label: 'غرف', value: '4' },
  { label: 'حمامات', value: '4' },
  { label: 'التشطيب', value: 'نصف تشطيب' },
  { label: 'حالة البناء', value: 'تحت الإنشاء' },
  { label: 'سنة التعاقد', value: '2023' },
  { label: 'سعر المتر بالتعاقد', value: '52,992 ج.م' },
]

// المميزات الإضافية
const unitTags = [
  'حديقة خاصة',
  'فيو لاندسكيب',
  'ناصية',
  'قريبة من الخدمات',
  'جراج',
  'كلوب هاوس',
]

// الفرص المشابهة (5 كروت كما في الصورة)
const similarOpportunities = [
  {
    id: 'aliva-1',
    name: 'اليفا',
    area: 'المستقبل سيتي',
    specs: 'شقة · 3 غرف · 190 م² · استلام 2028',
    cash: '3,750,000',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'iva-2',
    name: 'إلڤا',
    area: 'المستقبل سيتي',
    specs: 'شقة · 3 غرف · 155 م² · استلام 2028',
    cash: '2,850,000',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'madinaty-3',
    name: 'مدينتي',
    area: 'القاهرة الجديدة',
    specs: 'شقة · 3 غرف · 140 م² · استلام 2026',
    cash: '3,450,000',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'aliva-4',
    name: 'Aliva',
    area: 'المستقبل سيتي',
    specs: 'شقة · 3 غرف · 165 م² · استلام 2027',
    cash: '3,100,000',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hap-town-5',
    name: 'HAP Town - هاب تاون',
    area: 'المستقبل سيتي',
    specs: 'شقة · 3 غرف · 175 م² · استلام 2027',
    cash: '3,900,000',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
  },
]

export default function PropertyDetailsPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [readiness, setReadiness] = useState<'week' | 'month' | 'info'>('info')
  const [agreedToCommission, setAgreedToCommission] = useState(false)

  // تحديث موضع الشريط السفلي عند تحريك الصور
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) {
      setScrollProgress(0)
      return
    }
    // في وضع RTL قد تكون قيمة scrollLeft سالبة في بعض المتصفحات
    const currentScroll = Math.abs(el.scrollLeft)
    setScrollProgress(Math.min(100, Math.max(0, (currentScroll / maxScroll) * 100)))
  }

  // تحريك الصور عبر الشريط أو الأسهم
  const scrollByAmount = (direction: 'next' | 'prev') => {
    const el = scrollContainerRef.current
    if (!el) return
    const amount = direction === 'next' ? -360 : 360
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setScrollProgress(value)
    const el = scrollContainerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    el.scrollLeft = -((value / 100) * maxScroll)
  }

  const copyUnitCode = () => {
    navigator.clipboard?.writeText('U-13158')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f6f8] py-6 text-[#0a1122] sm:py-10">
      <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
        
        {/* ==================== 1. رابط الرجوع العلوي ==================== */}
        <div className="flex items-center justify-start">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-[#0b6954]"
          >
            <ChevronRight className="size-3.5" />
            <span>رجوع للفرص</span>
          </Link>
        </div>

        {/* ==================== 2. هيدر الوحدة (العنوان والشارات) ==================== */}
        <header className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          {/* اليمين: اسم المشروع والمطور والكود */}
          <div className="text-right">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0a1122] sm:text-3xl">
              إلڤا
            </h1>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              ماونتن فيو · المستقبل سيتي
            </p>
            <button
              type="button"
              onClick={copyUnitCode}
              title="نسخ كود الوحدة"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-mono text-[11px] text-gray-500 transition hover:border-gray-300 hover:text-[#0a1122]"
            >
              <span>U-13158</span>
              <Copy className="size-3 text-gray-400" />
              {copied && <span className="font-sans text-[10px] text-[#0b6954]">تم النسخ</span>}
            </button>
          </div>

          {/* اليسار: الشارات وأزرار المشاركة والمفضلة */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e6f4f9] px-3 py-1 text-[11px] font-bold text-[#0b6954]">
              متحقق بالمستندات
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-bold text-amber-700">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              <span>مميزة</span>
            </span>
            <button
              type="button"
              onClick={() => navigator.share?.({ title: 'إلڤا - عقار إكزت', url: window.location.href })}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <Share2 className="size-3.5 text-gray-500" />
              <span>مشاركة</span>
            </button>
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
                liked
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className={`size-3.5 ${liked ? 'fill-current text-red-500' : 'text-gray-500'}`} />
              <span>أضف للمفضلة</span>
            </button>
          </div>
        </header>

        {/* ==================== 3. معرض الصور المتحرك + شريط التمرير + التكبير ==================== */}
        <section className="mt-5">
          {/* حاوية الصور القابلة للسحب والتمرير */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            style={{ scrollbarWidth: 'thin' }}
          >
            {gallery.map((item, idx) => (
              <div
                key={item.url}
                onClick={() => setLightboxIndex(idx)}
                className={`group relative shrink-0 cursor-pointer overflow-hidden rounded-[18px] bg-gray-200 snap-center ${
                  idx === 0
                    ? 'h-[230px] w-[85%] sm:h-[310px] sm:w-[460px]'
                    : 'h-[230px] w-[70%] sm:h-[310px] sm:w-[300px]'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                {/* شارة اضغط لتكبير الصورة */}
                <span
                  className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/65 px-3.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-opacity ${
                    idx === 0 ? 'inline-flex' : 'hidden group-hover:inline-flex'
                  }`}
                >
                  <ZoomIn className="size-3.5" />
                  <span>اضغط لتكبير الصورة</span>
                </span>
              </div>
            ))}
          </div>

          {/* الشريط المتحرك السفلي للتحكم في الصور (كما في الموقع الأصلي) */}
          <div className="mt-2 flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => scrollByAmount('prev')}
              aria-label="الصورة السابقة"
              className="flex size-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-[#0a1122]"
            >
              <ChevronRight className="size-3.5" />
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={scrollProgress}
                onChange={handleSliderChange}
                aria-label="شريط تحريك الصور"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={() => scrollByAmount('next')}
              aria-label="الصورة التالية"
              className="flex size-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-[#0a1122]"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          </div>
        </section>

        {/* ==================== 4. بطاقة مواصفات الوحدة ==================== */}
        <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-right sm:grid-cols-4">
            {unitSpecs.map((spec) => (
              <div key={spec.label}>
                <span className="block text-[11px] text-gray-400">{spec.label}</span>
                <strong className="mt-1 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {spec.value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 5. بطاقة المميزات والوصف ==================== */}
        <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-5 text-right shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-2">
            {unitTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-[11px] font-semibold text-gray-700"
              >
                <Check className="size-3 text-[#0b6954]" />
                <span>{tag}</span>
              </span>
            ))}
          </div>

          <p className="mt-4 text-xs leading-[1.9] text-gray-600 sm:text-[13px]">
            شقة 4 غرف في إلڤا - ماونتن فيو، 190 م² في الدور 2. فيو لاندسكيب، ناصية، مع حديقة خاصة. قريبة من الخدمات، بجراج وكلوب هاوس.
          </p>
        </section>

        {/* ==================== 6. البطاقة المالية الرئيسية (المطلوب كاش دلوقتي) ==================== */}
        <section className="mt-4 rounded-[18px] border border-[#b8e6d5] bg-white p-5 text-right shadow-sm sm:p-6">
          <p className="text-xs font-bold text-gray-500">المطلوب كاش دلوقتي</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#0a1122] sm:text-[34px]">
            3,718,000 <span className="text-lg font-bold">ج.م</span>
          </p>
          <p className="mt-1 text-xs font-bold text-[#0b6954]">
            ده نفس المبلغ اللي دفعه صاحب الوحدة — من غير أوفر
          </p>

          {/* شريط قابل للتفاوض */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-[#fffbeb] px-4 py-3 text-right">
            <p className="text-xs font-extrabold text-[#b45309]">↓ قابل للتفاوض</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#92400e]">
              البائع مستعد يتفاوض في حدود 5% من المدفوع (حوالي 185,000 ج.م) لسرعة التنفيذ.
            </p>
          </div>

          {/* صندوق مكسبك عن سعر السوق الحالي */}
          <div className="mt-3 rounded-xl border border-[#c8eedd] bg-[#ecfbf3] px-4 py-3 text-right">
            <p className="text-xs font-extrabold text-[#0b6954]">
              مكسبك عن سعر السوق الحالي: <span dir="ltr">+ 8,805,582</span> ج.م
            </p>
            <p className="mt-1 text-[11px] text-[#0b6954]/85">
              سعر السوق اليوم: 19,000,000 ج.م · بعد خصم عمولتنا 1.25%
            </p>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            سعر السوق ده تقدير صاحب الوحدة وعلى مسؤوليته — مش تقييم رسمي من عقار إكزت.
          </p>
        </section>

        {/* ==================== 7. جدول تفصيل الأقساط والمطلوب ==================== */}
        <section className="mt-4 overflow-hidden rounded-[18px] border border-gray-200/80 bg-white shadow-sm">
          <div className="divide-y divide-gray-100 text-xs sm:text-[13px]">
            
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">المتبقي للمطور (هتكمّله أقساط)</span>
              <strong className="font-extrabold text-[#0a1122]">6,350,485 ج.م</strong>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">القسط</span>
              <strong className="font-extrabold text-[#0a1122]">271,000 ج.م · ربع سنوي</strong>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">باقي على الأقساط تقريبًا</span>
              <strong className="font-extrabold text-[#0a1122]">6 سنة</strong>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-gray-500">الاستلام</span>
              <strong className="font-extrabold text-[#0a1122]">2027</strong>
            </div>

            <div className="px-5 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  عمولة عقار إكزت على المشتري (1.25% من إجمالي التعاقد)
                </span>
                <strong className="font-extrabold text-[#0a1122]">125,856 ج.م</strong>
              </div>
              <p className="mt-1 text-right text-[10px] text-gray-400">
                بتدفع بس عند إتمام التنازل — للبايع مجانًا تمامًا، مفيش عمولة عليه
              </p>
            </div>

            {/* الصف الأخير المظلل */}
            <div className="flex items-center justify-between bg-[#f1f5f9] px-5 py-4">
              <span className="font-extrabold text-[#0a1122]">إجمالي المطلوب منك دلوقتي</span>
              <strong className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                3,843,856 ج.م
              </strong>
            </div>

          </div>
        </section>

        {/* ==================== 8. شريط الوحدات الأخرى في نفس المشروع ==================== */}
        <section className="mt-4 flex items-center justify-between rounded-[16px] border border-gray-200/80 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3 text-right">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#0b6954]">
              <Building2 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#0a1122] sm:text-[13px]">
                في 74 وحدة تانية في نفس المشروع
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                بأسعار كاش تبدأ من 632,299 ج.م ومساحات مختلفة
              </p>
            </div>
          </div>

          <Link
            href="/opportunities"
            className="shrink-0 text-xs font-bold text-[#0b6954] hover:underline"
          >
            شوفهم كلهم
          </Link>
        </section>

        {/* ==================== 9. قسم فرص مميزة مشابهة ==================== */}
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-right">
            <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
              فرص مميزة مشابهة
            </h2>
            <span className="text-[11px] text-gray-400">
              وحدات تانية في المستقبل سيتي أو قريبة من نفس الكاش
            </span>
          </div>

          {/* 2 كارت بجانب بعض على الموبايل، و 3 على الكمبيوتر */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {similarOpportunities.map((item) => (
              <Link
                key={item.id}
                href={`/opportunities/${item.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-[16px] border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="relative h-28 w-full overflow-hidden bg-gray-100 sm:h-32">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-amber-700 shadow-sm">
                      <Star className="size-2.5 fill-amber-400 text-amber-500" />
                      <span>مميزة</span>
                    </span>
                  </div>

                  <div className="p-3 text-right">
                    <h3 className="line-clamp-1 text-xs font-extrabold text-[#0a1122] group-hover:text-[#0b6954] sm:text-[13px]">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-[10px] text-gray-400">{item.area}</p>
                    <p className="mt-1.5 line-clamp-1 text-[10px] text-gray-500">{item.specs}</p>
                    <p className="mt-2 text-[11px] font-extrabold text-[#0a1122]">
                      المطلوب كاش: {item.cash} ج.م
                    </p>
                  </div>
                </div>

                <div className="px-3 pb-3 pt-1 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0b6954]">
                    <span>شوف التفاصيل</span>
                    <span>←</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ==================== 10. نموذج الحجز (عايز تلحق تحجز الفرصة دي؟) ==================== */}
        <section className="mt-8 rounded-[20px] border border-gray-200/90 bg-white p-5 text-right shadow-sm sm:p-8">
          <h2 className="text-lg font-extrabold text-[#0a1122] sm:text-xl">
            عايز تلحق تحجز الفرصة دي؟
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            سجّل بياناتك دلوقتي — مسؤول حالة هيتواصل معاك بتفاصيل الوحدة وإجراءات التنازل.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              alert('تم تسجيل اهتمامك بالوحدة بنجاح! سيتواصل معك مسؤول الحالة قريباً.')
            }}
            className="mt-6 space-y-5"
          >
            {/* الاسم */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">الاسم</label>
              <input
                type="text"
                defaultValue="basma"
                required
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:text-sm"
              />
            </div>

            {/* رقم الواتساب */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">رقم الواتساب</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  dir="ltr"
                  defaultValue="01149484906"
                  required
                  className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-right text-xs font-medium text-[#0a1122] focus:border-[#0b6954] focus:outline-none sm:text-sm"
                />
                <div className="relative">
                  <select
                    defaultValue="+20"
                    className="h-11 appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                  >
                    <option value="+20">🇪🇬 مصر +20</option>
                    <option value="+966">🇸🇦 السعودية +966</option>
                    <option value="+971">🇦🇪 الإمارات +971</option>
                  </select>
                  <ChevronLeft className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 -rotate-90 text-gray-400" />
                </div>
              </div>
            </div>

            {/* الأسئلة أو التفاصيل */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#0a1122]">
                إيه الأسئلة أو التفاصيل اللي تحب نوضحهالك في المكالمة؟
              </label>
              <textarea
                rows={3}
                placeholder="اختياري..."
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-[#0a1122] placeholder:text-gray-400 focus:border-[#0b6954] focus:outline-none sm:text-sm"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                أهم النقط اللي تهمك تعرفها عشان نجهزلك كل الإجابات قبل ما نكلمك.
              </p>
            </div>

            {/* جاهزية التنفيذ */}
            <fieldset>
              <legend className="mb-2.5 text-xs font-bold text-[#0a1122]">
                إنت جاهز للتنفيذ في قد إيه؟
              </legend>
              <div className="space-y-2.5">
                <label
                  onClick={() => setReadiness('week')}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                    readiness === 'week'
                      ? 'border-[#0b6954] bg-[#eff8f6] font-bold text-[#0a1122]'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="readiness"
                    checked={readiness === 'week'}
                    onChange={() => setReadiness('week')}
                    className="size-4 accent-[#0b6954]"
                  />
                  <span>معايا الكاش وجاهز أنفّذ خلال أسبوع لو الورق سليم</span>
                </label>

                <label
                  onClick={() => setReadiness('month')}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                    readiness === 'month'
                      ? 'border-[#0b6954] bg-[#eff8f6] font-bold text-[#0a1122]'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="readiness"
                    checked={readiness === 'month'}
                    onChange={() => setReadiness('month')}
                    className="size-4 accent-[#0b6954]"
                  />
                  <span>جاهز خلال شهر لـ 3 شهور</span>
                </label>

                <label
                  onClick={() => setReadiness('info')}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs transition ${
                    readiness === 'info'
                      ? 'border-[#0b6954] bg-[#eff8f6] font-bold text-[#0a1122]'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="readiness"
                    checked={readiness === 'info'}
                    onChange={() => setReadiness('info')}
                    className="size-4 accent-[#0b6954]"
                  />
                  <span>لسه بجمع معلومات وبقارن</span>
                </label>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">
                عشان نرتّب معاك الإجراءات والخطوات في الوقت المناسب ليك.
              </p>
            </fieldset>

            {/* الموافقة على العمولة */}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs leading-relaxed text-gray-700">
              <input
                type="checkbox"
                checked={agreedToCommission}
                onChange={(e) => setAgreedToCommission(e.target.checked)}
                required
                className="mt-0.5 size-4 rounded accent-[#0b6954]"
              />
              <span>
                أوافق على عمولة عقار إكزت للمشتري (1.25% من إجمالي سعر التعاقد) وتُدفع عند إتمام التنازل فقط.
              </span>
            </label>

            {/* صندوق التحقق Cloudflare Turnstile */}
            <div className="flex justify-center">
              <div className="flex h-14 w-full max-w-[300px] items-center justify-between rounded-lg border border-gray-200 bg-[#fafafa] px-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#10b981] text-white">
                    <Check className="size-3.5 stroke-[3]" />
                  </span>
                  <span className="text-xs font-bold text-gray-700">تحقق ناجح!</span>
                </div>
                <div className="text-left">
                  <span className="block font-sans text-[10px] font-extrabold tracking-tight text-gray-600">
                    CLOUDFLARE
                  </span>
                  <span className="block font-sans text-[8px] text-gray-400">Turnstile</span>
                </div>
              </div>
            </div>

            {/* زر التأكيد */}
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#0b6954] text-sm font-bold text-white shadow-sm transition hover:bg-[#095443]"
            >
              أكّد اهتمامي بالوحدة
            </button>

            <p className="text-center text-[10px] text-gray-400">
              بياناتك في أمان — مش بنشاركها مع أي طرف.
            </p>
          </form>
        </section>

      </div>

      {/* ==================== نافذة تكبير الصور (Lightbox Modal) ==================== */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          {/* شريط علوي: الإغلاق وعداد الصور */}
          <div
            className="mb-4 flex w-full max-w-4xl items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>
            <span className="text-xs font-bold">
              {lightboxIndex + 1} / {gallery.length} — {gallery[lightboxIndex].caption}
            </span>
          </div>

          {/* الصورة المكبرة وأزرار التنقل */}
          <div
            className="relative flex w-full max-w-4xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null ? (prev - 1 + gallery.length) % gallery.length : 0
                )
              }
              className="absolute right-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 sm:right-4 sm:size-12"
              aria-label="السابق"
            >
              <ChevronRight className="size-6" />
            </button>

            <img
              src={gallery[lightboxIndex].url}
              alt={gallery[lightboxIndex].caption}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />

            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null ? (prev + 1) % gallery.length : 0
                )
              }
              className="absolute left-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 sm:left-4 sm:size-12"
              aria-label="التالي"
            >
              <ChevronLeft className="size-6" />
            </button>
          </div>

          {/* شريط الصور المصغرة أسفل النافذة */}
          <div
            className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {gallery.map((img, idx) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  lightboxIndex === idx ? 'border-[#2ee59d] scale-105' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}