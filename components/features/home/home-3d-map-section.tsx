'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Layers,
  MousePointerClick,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function Home3DMapSection() {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'

  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.22 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const mapRows = [
    {
      title: isAr ? 'اضغط على أي مبنى' : 'Pick any building',
      sub: isAr
        ? 'اضغط على مبنى في الخريطة ثلاثية الأبعاد لترى كل المساحات المعروضة للبيع والإيجار في البرج.'
        : 'Tap a building on the 3D map to see every unit for sale, exit or rent in that block.',
      icon: MousePointerClick,
    },
    {
      title: isAr
        ? 'تصوير المباني قيد الإنشاء'
        : 'Under-construction buildings in 3D',
      sub: isAr
        ? 'حتى المشاريع غير المكتملة تُعرض ثلاثية الأبعاد — اختر شقتك مباشرة من مجسم البناء.'
        : 'Even unfinished projects are rendered in 3D — pick your apartment directly from the model.',
      icon: Building2,
    },
    {
      title: isAr ? 'تحليل كامل للحي' : 'Full neighborhood analytics',
      sub: isAr
        ? 'ديناميكية الأسعار وسعر المتر والبنية التحتية وإمكانات الاستثمار على شاشة واحدة.'
        : 'Price dynamics, price per m², infrastructure and investment potential on one screen.',
      icon: BarChart3,
    },
    {
      title: isAr ? 'وضعا 2D / 3D' : '2D / 3D modes',
      sub: isAr
        ? 'بدّل بين الخريطة الكلاسيكية وعرض ثلاثي الأبعاد غامر بلمسة واحدة — على أي جهاز.'
        : 'Switch between classic 2D map and immersive 3D view with one tap — on any device.',
      icon: Layers,
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0a1338] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"
    >
      {/* خلفية شبكية هندسية خفيفة مثل الصورة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(96,165,250,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]"
      />

      <div className="relative z-10 mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 lg:grid-cols-12">
        {/* المجسم التفاعلي ثلاثي الأبعاد + الزر البرتقالي بداخله */}
        <div className="order-2 flex min-h-[340px] flex-col items-center justify-end overflow-hidden rounded-[28px] border border-blue-400/25 bg-[linear-gradient(180deg,#101f5a_0%,#091238_100%)] p-7 shadow-2xl sm:min-h-[410px] lg:order-1 lg:col-span-6">
          <div className="relative flex h-52 w-full items-end justify-center gap-2.5 sm:gap-4">
            {[28, 62, 42, 86, 52, 150, 74, 60, 98, 46, 78].map((h, i) => (
              <div
                key={i}
                style={{
                  height: inView ? `${h}px` : '12px',
                  transitionDelay: `${i * 55}ms`,
                }}
                className={`relative w-5 rounded-t-md transition-all duration-700 ease-out sm:w-7 ${
                  i === 5
                    ? 'bg-gradient-to-t from-[#60a5fa] to-[#bfdbfe] shadow-[0_0_28px_rgba(96,165,250,0.65)]'
                    : 'bg-[#3b5bdb]/75 hover:bg-[#60a5fa]'
                }`}
              >
                {i === 5 && (
                  <span className="absolute -top-11 left-1/2 flex size-9 -translate-x-1/2 animate-bounce items-center justify-center rounded-full bg-[#ff6437] text-xs font-black text-white shadow-[0_0_20px_rgba(255,100,55,0.8)]">
                    📍
                  </span>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/opportunities"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 py-2.5 text-xs font-black text-white shadow-[0_8px_24px_rgba(255,100,55,0.4)] transition hover:scale-105"
          >
            <span>
              {isAr
                ? 'افتح الخريطة التفاعلية ثلاثية الأبعاد'
                : 'Open Interactive 3D Map'}
            </span>
          </Link>
        </div>

        {/* العمود الأيمن: العنوان + الـ 4 سطور التي تنزل واحداً تحت الآخر بنعومة + الزر الأبيض السفلي */}
        <div className="order-1 text-start lg:order-2 lg:col-span-6">
          <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-xs font-extrabold text-blue-300">
            ▱ {isAr ? 'المدينة ثلاثية الأبعاد' : 'CITY IN 3D'}
          </span>

          <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
            <span className="text-[#7297ff]">
              {isAr
                ? 'خريطة ثلاثية الأبعاد تفاعلية'
                : 'Interactive 3D map'}
            </span>{' '}
            {isAr ? 'لجورجيا' : 'of Georgia'}
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-white/65 sm:text-sm">
            {isAr
              ? 'شاهد المدينة كما هي — اعثر على شقة على الخريطة ثلاثية الأبعاد.'
              : 'See the city as it is — find an apartment on the 3D map.'}
          </p>

          {/* الـ 4 سطور المتتابعة بنعومة */}
          <div className="mt-6 space-y-3">
            {mapRows.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  style={{ transitionDelay: `${150 + idx * 160}ms` }}
                  className={`flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-700 ease-out hover:border-blue-400/40 hover:bg-white/[0.08] ${
                    inView
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-7 opacity-0'
                  }`}
                >
                  <div className="min-w-0 flex-1 text-start">
                    <strong className="block text-sm font-extrabold text-white">
                      {item.title}
                    </strong>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {item.sub}
                    </p>
                  </div>

                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      idx === 0 || idx === 2
                        ? 'bg-[#2563eb] text-white'
                        : 'bg-white/10 text-blue-300'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* الزر الأبيض السفلي الذي يظهر بعد اكتمال نزول الـ 4 سطور */}
          <div
            style={{ transitionDelay: '820ms' }}
            className={`mt-7 transition-all duration-700 ease-out ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0'
            }`}
          >
            <Link
              href="/opportunities"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-black text-[#0a1338] shadow-lg transition hover:bg-blue-50 sm:text-sm"
            >
              <span>
                {isAr
                  ? 'افتح الخريطة ثلاثية الأبعاد'
                  : 'Open the 3D map'}
              </span>
              {dir === 'rtl' ? (
                <ArrowLeft className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}