'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Compass,
  Layers,
  MousePointerClick,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function Home3DMapSection() {
  const { locale, dir } = useTranslation()
  const isAr = locale === 'ar'

  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  // مراقبة السكرول لتفعيل أنيميشن نزول السطور واحداً تحت الآخر بوضوح في كل مرة
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
        } else {
          setInView(false)
        }
      },
      { threshold: 0.18 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const mapFeatures = [
    {
      title: isAr
        ? 'استكشف عروض التنازل داخل كل برج'
        : 'Explore Exit Deals in Every Tower',
      sub: isAr
        ? 'اضغط على أي مجمع سكني على الخريطة لترى الشقق المتاحة لاستكمال الأقساط ومقدار الكاش المطلوب بالدولار.'
        : 'Tap any residential tower to see available installment takeover units and required cash in USD.',
      icon: MousePointerClick,
    },
    {
      title: isAr
        ? 'مجسمات حية للمشاريع قيد الإنشاء'
        : '3D Models for Under-Construction Projects',
      sub: isAr
        ? 'عاين موقع مشروعك ونسبة الإنجاز المعماري ثلاثي الأبعاد قبل اتخاذ قرار شراء عقد التقسيط.'
        : 'Preview project location and 3D architectural progress before taking over an installment contract.',
      icon: Building2,
    },
    {
      title: isAr
        ? 'مقارنة سعر العقد القديم بسعر المطور اليوم'
        : 'Compare Old Contract vs. Current Developer Price',
      sub: isAr
        ? 'اعرف حجم التوفير الفوري لكل منطقة في تبليسي وباتومي مع مؤشرات الأسعار والخدمات المحيطة.'
        : 'See instant savings per district across Tbilisi and Batumi alongside nearby amenities.',
      icon: BarChart3,
    },
    {
      title: isAr
        ? 'تبديل فوري بين المنظور المسطح 2D والغامر 3D'
        : 'Instant Switch Between 2D & Immersive 3D',
      sub: isAr
        ? 'تصفح خريطة الفرص بمرونة كاملة على التلفون أو الكمبيوتر بلمسة واحدة.'
        : 'Navigate opportunities smoothly on mobile or desktop with one tap.',
      icon: Layers,
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#1e1b4b] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"
    >
      {/* إضاءة خلفية ناعمة باللون الأزرق الملكي والبرتقالي */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 size-96 rounded-full bg-blue-500/15 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 size-96 rounded-full bg-orange-500/15 blur-[110px]"
      />

      <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 lg:grid-cols-12">
        {/* العمود الأول (يظهر في اليمين في العربي): العنوان + السطور الـ 4 التي تنزل بالتتابع + الزر السفلي */}
        <div className="text-start lg:col-span-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-xs font-bold text-sky-300">
            <Compass className="size-3.5" />
            <span>
              {isAr
                ? 'مستكشف المشاريع ثلاثي الأبعاد'
                : '3D PROJECT EXPLORER'}
            </span>
          </span>

          <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
            {isAr ? 'تصفح فرص التنازل على' : 'Explore Exit Opportunities on'}{' '}
            <span className="bg-gradient-to-r from-[#60a5fa] to-[#ff8552] bg-clip-text text-transparent">
              {isAr ? 'خريطة جورجيا 3D' : 'Georgia 3D Map'}
            </span>
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-blue-100/75 sm:text-sm">
            {isAr
              ? 'رؤية بانورامية تفاعلية لجميع الأبراج والمجمعات السكنية المعتمدة في تبليسي وباتومي.'
              : 'Interactive panoramic view of verified residential complexes in Tbilisi and Batumi.'}
          </p>

          {/* السطور الـ 4 التي تنزل واحداً تحت الآخر بنعومة واضحة */}
          <div className="mt-6 space-y-3">
            {mapFeatures.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  style={{ transitionDelay: `${120 + idx * 180}ms` }}
                  className={`flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-all duration-700 ease-out hover:border-sky-400/40 hover:bg-white/[0.1] ${
                    inView
                      ? 'translate-y-0 opacity-100'
                      : '-translate-y-6 opacity-0'
                  }`}
                >
                  <div className="min-w-0 flex-1 text-start">
                    <strong className="block text-sm font-bold text-white">
                      {item.title}
                    </strong>
                    <p className="mt-1 text-xs leading-relaxed text-blue-100/65">
                      {item.sub}
                    </p>
                  </div>

                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      idx % 2 === 0
                        ? 'bg-[#2563eb] text-white'
                        : 'bg-white/10 text-sky-300'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* الزر الأبيض السفلي يظهر بعد اكتمال السطور الأربعة */}
          <div
            style={{ transitionDelay: '860ms' }}
            className={`mt-7 transition-all duration-700 ease-out ${
              inView ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
            }`}
          >
            <Link
              href="/opportunities?view=map3d"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-bold text-[#0f172a] shadow-lg transition hover:bg-blue-50 sm:text-sm"
            >
              <span>
                {isAr
                  ? 'استعرض كل الوحدات على الخريطة'
                  : 'Browse all units on 3D map'}
              </span>
              {dir === 'rtl' ? (
                <ArrowLeft className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Link>
          </div>
        </div>

        {/* العمود الثاني (يظهر في الشمال في العربي): المجسم البياني ثلاثي الأبعاد */}
        <div className="flex min-h-[340px] flex-col items-center justify-end overflow-hidden rounded-[28px] border border-blue-400/25 bg-[linear-gradient(180deg,rgba(37,99,235,0.16)_0%,rgba(15,23,42,0.88)_100%)] p-7 shadow-2xl backdrop-blur-xs sm:min-h-[410px] lg:col-span-6">
          <div className="relative flex h-52 w-full items-end justify-center gap-2.5 sm:gap-4">
            {[32, 68, 46, 92, 58, 155, 80, 64, 105, 50, 82].map((h, i) => (
              <div
                key={i}
                style={{
                  height: inView ? `${h}px` : '12px',
                  transitionDelay: `${i * 60}ms`,
                }}
                className={`relative w-5 rounded-t-lg transition-all duration-700 ease-out sm:w-7 ${
                  i === 5
                    ? 'bg-gradient-to-t from-[#2563eb] via-[#60a5fa] to-[#dbeafe] shadow-[0_0_28px_rgba(96,165,250,0.65)]'
                    : 'bg-blue-400/25 hover:bg-blue-400/50'
                }`}
              >
                {i === 5 && (
                  <span className="absolute -top-11 left-1/2 flex -translate-x-1/2 animate-bounce items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                    <span>$38k</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/opportunities?view=map3d"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(255,100,55,0.4)] transition hover:scale-105"
          >
            <span>
              {isAr
                ? 'افتح خريطة الفرص ثلاثية الأبعاد'
                : 'Launch Interactive 3D Map'}
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}