"use client"

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Flame,
  Heart,
  Home,
  KeyRound,
  Landmark,
  MapPin,
  Megaphone,
  Palmtree,
  Plus,
  Repeat,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trees,
  Waves,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type MarketMode = 'exit' | 'sale' | 'rent' | 'daily' | 'projects'

type ListingItem = {
  id: string
  mode: MarketMode
  badge: string
  badgeTone: 'emerald' | 'amber' | 'blue' | 'purple'
  title: string
  location: string
  subLocation: string
  price: string
  secondaryPrice: string
  pricePerSqm: string
  area: number
  beds: number
  baths: number
  views: number
  postedAgo: string
  image: string
  isVip?: boolean
  installmentProgress?: number
}

const PROPERTY_IMAGES = {
  villa:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-NMvhsP5Gm20iT2BHflI0z79ZS1fNwx.png',
  coast:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WhCkjUzdIn5BCFEEOfqe5MTtnf8nRR.png',
  park:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xQJTyPRko8qmcc3mNV4GYmeqsJu93e.png',
  project:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-QXfSlHuNR7gpYHJoomEpX3DE8hi7oa.png',
}

export function HeroMarketplace({
  dir = 'rtl',
  currencySymbol = '$',
  heroDict,
  realUnitCount = 0,
  formattedValue = '0',
  valueUnitLabel = '$',
}: {
  dir?: 'rtl' | 'ltr'
  currencySymbol?: string
  heroDict?: Record<string, any>
  realUnitCount?: number
  formattedValue?: string
  valueUnitLabel?: string
}) {
  const router = useRouter()
  const isRtl = dir === 'rtl'
  const [activeMode, setActiveMode] = useState<MarketMode>('exit')
  const [propertyType, setPropertyType] = useState('all')
  const [city, setCity] = useState('all')
  const [budget, setBudget] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const modes: {
    id: MarketMode
    label: string
    badge?: string
    icon: any
  }[] = [
    {
      id: 'exit',
      label: isRtl ? 'تكملة أقساط وتخارج' : 'Installment Exit',
      badge: isRtl ? 'بدون خسارة' : 'Zero Loss',
      icon: Repeat,
    },
    {
      id: 'sale',
      label: isRtl ? 'عقارات للبيع' : 'For Sale',
      icon: Building2,
    },
    {
      id: 'rent',
      label: isRtl ? 'للإيجار الشهري' : 'For Rent',
      icon: KeyRound,
    },
    {
      id: 'daily',
      label: isRtl ? 'إيجار يومي وفندقي' : 'Daily Stay',
      icon: CalendarDays,
    },
    {
      id: 'projects',
      label: isRtl ? 'مشاريع قيد الإنشاء' : 'New Projects',
      icon: Landmark,
    },
  ]

  const popularTags = isRtl
    ? [
        { label: 'فيلل بالتقسيط في تبليسي', href: '/opportunities?tag=tbilisi-villas' },
        { label: 'شقق بإطلالة بحرية باتومي', href: '/opportunities?tag=batumi-sea' },
        { label: 'استلام فوري فاكي (Vake)', href: '/opportunities?tag=vake' },
        { label: 'شقق فندقية للإيجار اليومي', href: '/opportunities?mode=daily' },
        { label: 'تنازل عقود بدون عمولة بائع', href: '/opportunities?mode=exit' },
        { label: 'أراضي استثمارية', href: '/opportunities?tag=land' },
      ]
    : [
        { label: 'Installment Villas Tbilisi', href: '/opportunities?tag=tbilisi-villas' },
        { label: 'Sea View Batumi', href: '/opportunities?tag=batumi-sea' },
        { label: 'Ready to Move Vake', href: '/opportunities?tag=vake' },
        { label: 'Daily Luxury Stays', href: '/opportunities?mode=daily' },
        { label: '0% Seller Fee Exit Deals', href: '/opportunities?mode=exit' },
      ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('mode', activeMode)
    if (propertyType !== 'all') params.set('type', propertyType)
    if (city !== 'all') params.set('city', city)
    if (budget !== 'all') params.set('budget', budget)
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    router.push(`/opportunities?${params.toString()}`)
  }

  return (
    <section className="relative overflow-hidden bg-[#0a1122] pt-10 pb-20 text-white lg:pt-14 lg:pb-28">
      {/* إضاءات خلفية فاخرة وشبكة هندسية */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-36 -left-32 size-[32rem] rounded-full bg-[#007a5a]/25 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/4 -right-32 size-[30rem] rounded-full bg-[#2ee59d]/15 blur-[140px]" />

      {/* أفق المباني المتحرك في الخلفية */}
      <div className="aqar-hero-buildings" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="relative z-10 mx-auto max-w-[1340px] px-4 sm:px-6 lg:px-8">
        {/* الجزء العلوي من الهيرو: العنوان + بطاقة المقارنة الذكية */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <div className="text-start">
            <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#2ee59d]/25 bg-[#122436]/90 px-4 py-1.5 text-xs font-bold text-[#2ee59d] shadow-sm backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>
                {heroDict?.badge ||
                  (isRtl
                    ? 'المنصة العقارية المتكاملة الأولى: بيع • إيجار • تكملة أقساط • إعلانات'
                    : 'All-in-One Real Estate Ecosystem: Buy • Rent • Exit Installments • Advertise')}
              </span>
            </div>

            <h1 className="heading-hero text-white">
              {isRtl ? (
                <>
                  كل قراراتك العقارية في مكان واحد..{' '}
                  <span className="bg-gradient-to-l from-[#2ee59d] via-[#19b394] to-[#6ee7b7] bg-clip-text text-transparent">
                    اشترِ، استأجر، أو أعلن وبيع بدون خسارة
                  </span>
                </>
              ) : (
                <>
                  Every Property Move in One Place..{' '}
                  <span className="bg-gradient-to-r from-[#2ee59d] via-[#19b394] to-[#6ee7b7] bg-clip-text text-transparent">
                    Buy, Rent, Advertise & Exit Safely
                  </span>
                </>
              )}
            </h1>

            <p className="mt-5 max-w-[630px] text-sm leading-[1.9] text-[#a7b4c8] sm:text-base lg:text-[16.5px]">
              {heroDict?.description ||
                (isRtl
                  ? 'سواء كنت تبحث عن فيلا أو شقة جاهزة للتملك، أو إيجار شهري ويومي، أو تريد استرداد أموالك المدفوعة عبر التنازل الآمن عن عقد التقسيط، أو ترغب في الإعلان عن عقارك لآلاف المشترين الجادين.'
                  : 'Whether you are buying a ready villa or apartment, booking monthly or daily rent, recovering your paid installments safely, or advertising your listing to thousands of verified investors.')}
            </p>

            {/* شريط إحصائيات حي مدمج داخل الهيرو */}
            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <div>
                <p className="text-[11px] text-gray-400">
                  {isRtl ? 'الفرص النشطة' : 'Active Units'}
                </p>
                <p dir="ltr" className="mt-0.5 text-lg font-black text-white sm:text-xl">
                  +{Math.max(realUnitCount, 148).toLocaleString('en-US')}
                </p>
              </div>
              <div className="border-x border-white/10 px-3">
                <p className="text-[11px] text-gray-400">
                  {isRtl ? 'القيمة السوقية' : 'Market Volume'}
                </p>
                <p dir="ltr" className="mt-0.5 text-lg font-black text-[#2ee59d] sm:text-xl">
                  {formattedValue !== '0' ? `${formattedValue} ${valueUnitLabel}` : '$42.5M+'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">
                  {isRtl ? 'عمولة البائع' : 'Seller Fee'}
                </p>
                <p dir="ltr" className="mt-0.5 text-lg font-black text-amber-400 sm:text-xl">
                  0%
                </p>
              </div>
            </div>
          </div>

          {/* البطاقة اليمنى الذكية (تتفاعل مع وضع البحث أو تعرض ميزة Aqar Exit الحصرية) */}
          <div className="relative mx-auto w-full max-w-[460px]">
            <div className="rounded-[24px] border border-white/15 bg-[#131f33]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-[#007a5a]/25 text-[#2ee59d]">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      {isRtl ? 'مقارنة العائد العقاري الذكي' : 'Smart Property Exit vs Traditional'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {isRtl ? 'حماية 100% للمدفوعات' : '100% Equity Protection'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#2ee59d]/15 px-2.5 py-1 text-[10px] font-black text-[#2ee59d]">
                  AQAR EXIT
                </span>
              </div>

              {/* كارت الخسارة التقليدية */}
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-[#251824]/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-gray-200">
                    <span className="flex size-5 items-center justify-center rounded-full bg-red-500/20 text-[10px] text-red-400">
                      ✕
                    </span>
                    {heroDict?.lossCardTitle || (isRtl ? 'الانسحاب أو الكسر التقليدي' : 'Traditional Contract Break')}
                  </span>
                  <span className="text-[11px] font-bold text-red-400">
                    {heroDict?.lossCardDurationValue || (isRtl ? 'خسارة فورية' : 'Heavy Penalty')}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[11px] text-gray-400">
                    {heroDict?.lossCardLabel || (isRtl ? 'متوسط الخسارة والخصم' : 'Average Deduction')}
                  </span>
                  <strong dir="ltr" className="text-xl font-black text-[#ff5a65]">
                    - {heroDict?.lossCardAmount || '30%'} {currencySymbol}
                  </strong>
                </div>
              </div>

              {/* كارت المكسب والبيع عبر المنصة */}
              <div className="mt-3 rounded-2xl border border-[#2ee59d]/30 bg-white p-4 text-[#0a1128] shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0a1128]">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#d8f3e5] text-[10px] font-black text-[#007a5a]">
                      ✓
                    </span>
                    {heroDict?.winCardTitle || (isRtl ? 'البيع أو التخارج عبر منصتنا' : 'Via Aqar Exit Marketplace')}
                  </span>
                  <span className="rounded-full bg-[#eaf8f2] px-2.5 py-0.5 text-[10px] font-extrabold text-[#007a5a]">
                    {isRtl ? '0% عمولة بائع' : '0% Seller Fee'}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500">
                      {heroDict?.winCardLabel || (isRtl ? 'استرداد المدفوعات + الأرباح' : 'Full Paid Recovery + Profit')}
                    </p>
                    <p className="text-[11px] font-bold text-[#007a5a]">
                      {heroDict?.winCardSub || (isRtl ? 'مشتري جاهز يكمل مكانك أو يشتري كاش' : 'Verified cash or installment buyer')}
                    </p>
                  </div>
                  <strong dir="ltr" className="text-2xl font-black text-[#007a5a]">
                    {heroDict?.winCardAmount || '100%'} {currencySymbol}
                  </strong>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Link
                  href="/sell"
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] text-xs font-extrabold text-white transition hover:bg-[#006248]"
                >
                  <Plus className="size-3.5 text-[#2ee59d]" />
                  <span>{isRtl ? 'اعرض عقارك مجاناً' : 'List Property Free'}</span>
                </Link>
                <Link
                  href="/calculator"
                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  {isRtl ? 'حاسبة التسعير الذكية' : 'Smart Valuation'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== محرك البحث الموحد العملاق (Sivrce + Aqar Exit Search Engine) ==================== */}
        <div className="mt-12 rounded-[28px] border border-white/15 bg-white/95 p-3 text-[#0a1128] shadow-[0_28px_70px_rgba(5,10,25,0.45)] backdrop-blur-xl sm:p-5">
          {/* تبويبات أوضاع السوق الـ 5 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 no-scrollbar border-b border-gray-100">
            {modes.map((m) => {
              const Icon = m.icon
              const active = activeMode === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMode(m.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition-all sm:px-5 sm:text-[13px] ${
                    active
                      ? 'bg-[#0a1122] text-white shadow-md'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70 hover:text-[#0a1122]'
                  }`}
                >
                  <Icon className={`size-4 ${active ? 'text-[#2ee59d]' : 'text-[#007a5a]'}`} />
                  <span>{m.label}</span>
                  {m.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        active
                          ? 'bg-[#007a5a] text-[#2ee59d]'
                          : 'bg-[#eaf8f2] text-[#007a5a]'
                      }`}
                    >
                      {m.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* حقول الفلترة */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-center"
          >
            {/* البحث الحر */}
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-gray-50/70 px-4 py-2.5 focus-within:border-[#007a5a] focus-within:bg-white">
              <Search className="size-4 shrink-0 text-[#007a5a]" />
              <div className="min-w-0 flex-1 text-start">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  {isRtl ? 'ابحث بالمشروع أو الحي' : 'PROJECT OR KEYWORD'}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isRtl
                      ? 'مثال: فيلا في تبليسي، شقة بإطلالة بحر...'
                      : 'e.g. Villa in Tbilisi, Sea view apartment...'
                  }
                  className="w-full bg-transparent text-xs font-bold text-[#0a1122] placeholder:text-gray-400 focus:outline-none sm:text-[13px]"
                />
              </div>
            </div>

            {/* نوع العقار */}
            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 px-4 py-2.5 text-start">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                {isRtl ? 'نوع العقار' : 'PROPERTY TYPE'}
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-xs font-extrabold text-[#0a1122] focus:outline-none sm:text-[13px]"
              >
                <option value="all">{isRtl ? 'كل العقارات (شقق، فيلل، أراضي)' : 'All Property Types'}</option>
                <option value="apartment">{isRtl ? 'شقق سكنية وفندقية' : 'Apartments & Studios'}</option>
                <option value="villa">{isRtl ? 'فيلل ومنازل مستقلة' : 'Villas & Houses'}</option>
                <option value="commercial">{isRtl ? 'مكاتب ومحلات تجارية' : 'Commercial & Offices'}</option>
                <option value="land">{isRtl ? 'أراضي استثمارية' : 'Land Plots'}</option>
              </select>
            </div>

            {/* المدينة / المنطقة */}
            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 px-4 py-2.5 text-start">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                {isRtl ? 'المدينة أو المنطقة' : 'LOCATION'}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-xs font-extrabold text-[#0a1122] focus:outline-none sm:text-[13px]"
              >
                <option value="all">{isRtl ? 'كل المدن والمناطق' : 'Everywhere in Georgia'}</option>
                <option value="tbilisi">{isRtl ? 'تبليسي (Vake, Saburtalo, Old Tbilisi)' : 'Tbilisi'}</option>
                <option value="batumi">{isRtl ? 'باتومي والشريط الساحلي' : 'Batumi Coast'}</option>
                <option value="gudauri">{isRtl ? 'غوداوري وبكورياني (منتجعات)' : 'Gudauri & Resorts'}</option>
                <option value="kutaisi">{isRtl ? 'كوتايسي وكوبوليتي' : 'Kutaisi & Kobuleti'}</option>
              </select>
            </div>

            {/* الميزانية / طريقة الدفع */}
            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/70 px-4 py-2.5 text-start">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                {activeMode === 'exit'
                  ? isRtl
                    ? 'المبلغ المدفوع للتنازل'
                    : 'PAID EQUITY'
                  : isRtl
                    ? 'الميزانية والسعر'
                    : 'PRICE RANGE'}
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-xs font-extrabold text-[#0a1122] focus:outline-none sm:text-[13px]"
              >
                <option value="all">{isRtl ? 'أي ميزانية (كاش أو تقسيط)' : 'Any Budget'}</option>
                <option value="under-50k">{isRtl ? 'أقل من $50,000' : 'Under $50,000'}</option>
                <option value="50k-120k">{isRtl ? '$50,000 إلى $120,000' : '$50,000 - $120,000'}</option>
                <option value="120k-250k">{isRtl ? '$120,000 إلى $250,000' : '$120,000 - $250,000'}</option>
                <option value="luxury">{isRtl ? '+$250,000 (عقارات فاخرة)' : '$250,000+ Luxury'}</option>
              </select>
            </div>

            {/* زر البحث */}
            <Button
              type="submit"
              className="h-[54px] rounded-2xl bg-gradient-to-r from-[#007a5a] to-[#0b6954] px-8 text-sm font-black text-white shadow-[0_10px_25px_rgba(0,122,90,0.3)] transition hover:scale-[1.02]"
            >
              <Search className="size-4 me-2" />
              <span>{isRtl ? 'استكشف العقارات' : 'Search Now'}</span>
            </Button>
          </form>

          {/* الكلمات الأكثر بحثاً */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-extrabold text-gray-400">
              {isRtl ? 'الأكثر طلباً الآن:' : 'Popular right now:'}
            </span>
            {popularTags.map((tag) => (
              <Link
                key={tag.label}
                href={tag.href}
                className="rounded-full border border-gray-200/80 bg-gray-50 px-3 py-1 text-[11.5px] font-bold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-[#eaf8f2] hover:text-[#007a5a]"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function SponsoredStoriesBar({ dir = 'rtl' }: { dir?: 'rtl' | 'ltr' }) {
  const isRtl = dir === 'rtl'
  const stories = isRtl
    ? [
        { tag: 'تخارج فوري', area: 'Saburtalo, Tbilisi', price: 'مدفوع $38,000', hot: true },
        { tag: 'فيلا خاصة بحمام سباحة', area: 'Digomi, Tbilisi', price: '$240,000 كاش/تقسيط', hot: false },
        { tag: 'شقة بإطلالة بحرية', area: 'Orbi City, Batumi', price: '$65 / ليلة', hot: false },
        { tag: 'تنازل بدون أوفر برايس', area: 'Vake Residence', price: 'قسط $850/شهر', hot: true },
        { tag: 'أرض استثمارية مرخصة', area: 'Kobuleti Coast', price: '$75,200', hot: false },
      ]
    : [
        { tag: 'Urgent Exit', area: 'Saburtalo, Tbilisi', price: '$38,000 Paid', hot: true },
        { tag: 'Private Pool Villa', area: 'Digomi, Tbilisi', price: '$240,000', hot: false },
        { tag: 'Sea View Suite', area: 'Orbi City, Batumi', price: '$65 / night', hot: false },
        { tag: '0% Premium Exit', area: 'Vake Residence', price: '$850/mo', hot: true },
        { tag: 'Licensed Land Plot', area: 'Kobuleti Coast', price: '$75,200', hot: false },
      ]

  return (
    <div className="border-b border-gray-200/80 bg-white">
      <div className="mx-auto flex max-w-[1340px] items-center gap-4 overflow-x-auto px-4 py-3.5 no-scrollbar sm:px-6 lg:px-8">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0a1122] px-3 py-1 text-[11px] font-black text-[#2ee59d]">
          <Flame className="size-3.5 text-amber-400" />
          <span>{isRtl ? 'إعلانات وعروض ممولة' : 'SPONSORED STORIES'}</span>
        </span>

        <div className="flex items-center gap-3">
          {stories.map((s, idx) => (
            <Link
              key={idx}
              href="/opportunities"
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-gray-200/80 bg-gray-50/70 px-3.5 py-1.5 text-xs transition hover:border-[#007a5a] hover:bg-[#eaf8f2]"
            >
              <span
                className={`size-2 rounded-full ${
                  s.hot ? 'animate-ping bg-emerald-500' : 'bg-[#007a5a]'
                }`}
              />
              <span className="font-extrabold text-[#0a1122]">{s.tag}</span>
              <span className="text-gray-400">•</span>
              <span className="font-semibold text-gray-600">{s.area}</span>
              <span
                dir="ltr"
                className="rounded-md bg-white px-2 py-0.5 text-[11px] font-black text-[#007a5a] shadow-2xs"
              >
                {s.price}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/sell#advertise"
          className="ms-auto inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#007a5a] hover:underline"
        >
          <Megaphone className="size-3.5" />
          <span>{isRtl ? 'ضع إعلانك هنا' : 'Advertise Here'}</span>
        </Link>
      </div>
    </div>
  )
}

export function CategoriesExplorer({ dir = 'rtl' }: { dir?: 'rtl' | 'ltr' }) {
  const isRtl = dir === 'rtl'

  const categories = [
    {
      title: isRtl ? 'عقود تقسيط للتنازل' : 'Installment Exit',
      count: '140+ فرصة',
      icon: Repeat,
      tone: 'bg-[#eaf8f2] text-[#007a5a]',
      href: '/opportunities?mode=exit',
      featured: true,
    },
    {
      title: isRtl ? 'شقق تمليك جاهزة' : 'Ready Apartments',
      count: '320+ وحدة',
      icon: Building2,
      tone: 'bg-blue-50 text-blue-600',
      href: '/opportunities?type=apartment',
    },
    {
      title: isRtl ? 'فيلل ومنازل فاخرة' : 'Luxury Villas',
      count: '85+ فيلا',
      icon: Home,
      tone: 'bg-amber-50 text-amber-600',
      href: '/opportunities?type=villa',
    },
    {
      title: isRtl ? 'شقق للإيجار الشهري' : 'Monthly Rentals',
      count: '210+ وحدة',
      icon: KeyRound,
      tone: 'bg-purple-50 text-purple-600',
      href: '/opportunities?mode=rent',
    },
    {
      title: isRtl ? 'حجز وإيجار يومي' : 'Daily Stays',
      count: '190+ شقة',
      icon: CalendarDays,
      tone: 'bg-rose-50 text-rose-600',
      href: '/opportunities?mode=daily',
    },
    {
      title: isRtl ? 'مشاريع قيد الإنشاء' : 'New Developments',
      count: '45+ مشروع',
      icon: Landmark,
      tone: 'bg-teal-50 text-teal-700',
      href: '/opportunities?mode=projects',
    },
    {
      title: isRtl ? 'إطلالة بحرية مباشرة' : 'Seafront Units',
      count: '110+ وحدة',
      icon: Waves,
      tone: 'bg-cyan-50 text-cyan-600',
      href: '/opportunities?tag=sea',
    },
    {
      title: isRtl ? 'أراضي استثمارية' : 'Land Plots',
      count: '64+ قطعة',
      icon: Trees,
      tone: 'bg-emerald-50 text-emerald-700',
      href: '/opportunities?type=land',
    },
    {
      title: isRtl ? 'مكاتب ومحلات تجارية' : 'Commercial Spaces',
      count: '52+ مقر',
      icon: Building,
      tone: 'bg-indigo-50 text-indigo-600',
      href: '/opportunities?type=commercial',
    },
    {
      title: isRtl ? 'منتجعات جبلية وتزلج' : 'Mountain & Ski Resorts',
      count: '38+ شاليه',
      icon: Palmtree,
      tone: 'bg-orange-50 text-orange-600',
      href: '/opportunities?tag=resort',
    },
    {
      title: isRtl ? 'عقارات تمنح الإقامة' : 'Residency Eligible',
      count: '95+ عقار',
      icon: ShieldCheck,
      tone: 'bg-slate-100 text-[#0a1122]',
      href: '/opportunities?tag=residency',
    },
    {
      title: isRtl ? 'أضف إعلانك العقاري' : 'Post Your Ad',
      count: isRtl ? 'وصول فوري' : 'Instant Reach',
      icon: Megaphone,
      tone: 'bg-[#0a1122] text-[#2ee59d]',
      href: '/sell',
    },
  ]

  return (
    <section className="mx-auto max-w-[1340px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-block rounded-full bg-[#eaf8f2] px-3.5 py-1 text-xs font-extrabold text-[#007a5a]">
            {isRtl ? 'تصفح حسب الهدف العقاري' : 'EXPLORE BY CATEGORY'}
          </span>
          <h2 className="heading-section mt-3">
            {isRtl ? 'عن ماذا تبحث اليوم؟' : 'What are you looking for today?'}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 sm:text-base">
            {isRtl
              ? 'من فرص التخارج الحصرية بدون خسارة، إلى التمليك الكاش، الإيجار الشهري واليومي، والترويج الإعلاني.'
              : 'From exclusive zero-loss installment exits to direct sales, monthly/daily rentals, and property promotion.'}
          </p>
        </div>

        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
        >
          <span>{isRtl ? 'عرض كل الأقسام' : 'All Categories'}</span>
          {isRtl ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <Link
              key={cat.title}
              href={cat.href}
              className={`aqar-card group flex flex-col justify-between border p-5 text-start ${
                cat.featured
                  ? 'border-[#007a5a]/40 bg-gradient-to-b from-[#eaf8f2]/60 to-white ring-1 ring-[#007a5a]/20'
                  : 'border-gray-200/80 bg-white'
              }`}
            >
              <div
                className={`flex size-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${cat.tone}`}
              >
                <Icon className="size-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-sm font-extrabold text-[#0a1128] group-hover:text-[#007a5a]">
                  {cat.title}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-gray-400">
                  {cat.count}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function FeaturedMarketplaceCarousel({ dir = 'rtl' }: { dir?: 'rtl' | 'ltr' }) {
  const isRtl = dir === 'rtl'
  const scrollRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | MarketMode>('all')
  const [favorites, setFavorites] = useState<string[]>([])

  const allListings: ListingItem[] = [
    {
      id: 'exit-1',
      mode: 'exit',
      badge: isRtl ? 'تخارج وتكملة أقساط • 0% عمولة' : 'Installment Exit • 0% Fee',
      badgeTone: 'emerald',
      title: isRtl
        ? 'شقة بانورامية غرفتين وصالة - استلام قريب بتسهيلات مطور'
        : '2-Bedroom Panoramic Apartment — Developer Installment Exit',
      location: 'Saburtalo, Tbilisi',
      subLocation: isRtl ? 'متبقي 24 شهر تقسيط بدون فوائد' : '24 months 0% installment remaining',
      price: '$42,000',
      secondaryPrice: isRtl ? 'المدفوع للتنازل (إجمالي العقد $115,000)' : 'Paid Equity (Total $115,000)',
      pricePerSqm: '$1,350/m²',
      area: 85,
      beds: 2,
      baths: 2,
      views: 342,
      postedAgo: isRtl ? 'منذ يومين' : '2 days ago',
      image: PROPERTY_IMAGES.project,
      isVip: true,
      installmentProgress: 38,
    },
    {
      id: 'sale-1',
      mode: 'sale',
      badge: isRtl ? 'للبيع كاش أو تمويل • SUPER VIP' : 'For Sale • SUPER VIP',
      badgeTone: 'amber',
      title: isRtl
        ? 'فيلا مودرن مستقلة مع حديقة وحمام سباحة خاص'
        : 'Modern Standalone Villa with Private Pool & Garden',
      location: 'Digomi Massive, Tbilisi',
      subLocation: isRtl ? 'مؤهلة للحصول على الإقامة العقارية فوراً' : 'Immediate Residency Permit Eligible',
      price: '$265,000',
      secondaryPrice: isRtl ? 'متاح دفع 50% مقدم والباقي على سنتين' : '50% Downpayment available',
      pricePerSqm: '$1,260/m²',
      area: 210,
      beds: 4,
      baths: 3,
      views: 518,
      postedAgo: isRtl ? 'منذ 3 ساعات' : '3 hours ago',
      image: PROPERTY_IMAGES.villa,
      isVip: true,
    },
    {
      id: 'rent-1',
      mode: 'rent',
      badge: isRtl ? 'للإيجار الشهري • مفروش بالكامل' : 'Monthly Rent • Fully Furnished',
      badgeTone: 'blue',
      title: isRtl
        ? 'شقة فندقية فاخرة 3 غرف في قلب حي فاكي الراقي'
        : 'Luxury 3-Bedroom Serviced Apartment in Vake Park',
      location: 'Vake, Tbilisi',
      subLocation: isRtl ? 'خطوات من حديقة فاكي والمترو' : 'Steps from Vake Park',
      price: '$1,650 / شهر',
      secondaryPrice: isRtl ? 'شامل الصيانة وموقف سيارة خاص' : 'Includes parking & maintenance',
      pricePerSqm: 'تشطيب الترا لوكس',
      area: 125,
      beds: 3,
      baths: 2,
      views: 219,
      postedAgo: isRtl ? 'منذ يوم' : '1 day ago',
      image: PROPERTY_IMAGES.park,
    },
    {
      id: 'daily-1',
      mode: 'daily',
      badge: isRtl ? 'إيجار يومي • إطلالة بحر مباشرة' : 'Daily Stay • Direct Sea View',
      badgeTone: 'purple',
      title: isRtl
        ? 'جناح فندقي بإطلالة مفتوحة على البحر الأسود في أوربي سيتي'
        : 'Seafront Executive Suite in Orbi City Batumi',
      location: 'First Line, Batumi',
      subLocation: isRtl ? 'دخول ذاتي ذكي 24/7' : '24/7 Smart Self Check-in',
      price: '$75 / ليلة',
      secondaryPrice: isRtl ? 'خصم 20% للحجز الأسبوعي والشهري' : '20% Weekly Discount',
      pricePerSqm: 'تقييم 4.9 ★',
      area: 55,
      beds: 1,
      baths: 1,
      views: 640,
      postedAgo: isRtl ? 'متاح اليوم' : 'Available Today',
      image: PROPERTY_IMAGES.coast,
    },
    {
      id: 'exit-2',
      mode: 'exit',
      badge: isRtl ? 'فرصة تخارج بسعر العقد القديم' : 'Original Contract Price Exit',
      badgeTone: 'emerald',
      title: isRtl
        ? 'وحدة فندقية قيد التسليم في باتومي بسعر أقل من المطور بـ 18%'
        : 'Batumi Coastal Unit — 18% Below Current Developer Price',
      location: 'New Boulevard, Batumi',
      subLocation: isRtl ? 'تسليم الربع القادم • عقد موثق' : 'Handover Next Quarter • Verified',
      price: '$29,500',
      secondaryPrice: isRtl ? 'المدفوع حالياً (قسط شهري $620)' : 'Paid Amount ($620/mo installment)',
      pricePerSqm: '$1,180/m²',
      area: 62,
      beds: 1,
      baths: 1,
      views: 410,
      postedAgo: isRtl ? 'منذ 4 أيام' : '4 days ago',
      image: PROPERTY_IMAGES.coast,
      isVip: true,
      installmentProgress: 45,
    },
  ]

  const visibleListings =
    filter === 'all' ? allListings : allListings.filter((item) => item.mode === filter)

  const toggleFav = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const scrollCarousel = (direction: 'next' | 'prev') => {
    if (!scrollRef.current) return
    const amount = direction === 'next' ? (isRtl ? -400 : 400) : isRtl ? 400 : -400
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const badgeStyles = {
    emerald: 'bg-[#0a1122]/90 text-[#2ee59d] border border-[#2ee59d]/30',
    amber: 'bg-amber-500 text-slate-950',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1340px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="text-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-black text-amber-600">
              <Sparkles className="size-3.5" />
              <span>{isRtl ? 'إعلانات SUPER VIP والفرص المميزة' : 'SUPER VIP & FEATURED DEALS'}</span>
            </div>
            <h2 className="heading-section mt-3">
              {isRtl
                ? 'أحدث عروض البيع، الإيجار، وفرص تكملة الأقساط'
                : 'Featured Sales, Rentals & Installment Exits'}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 sm:text-base">
              {isRtl
                ? 'وحدات تم فحصها قانونياً ومالياً لضمان أعلى عائد وأفضل سعر في السوق.'
                : 'Legally and financially verified properties offering top market value.'}
            </p>
          </div>

          {/* أزرار الفلترة السريعة */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: isRtl ? 'الكل' : 'All Offers' },
              { id: 'exit', label: isRtl ? 'تكملة أقساط وتخارج' : 'Installment Exits' },
              { id: 'sale', label: isRtl ? 'للبيع كاش/تقسيط' : 'For Sale' },
              { id: 'rent', label: isRtl ? 'إيجار شهري' : 'Monthly Rent' },
              { id: 'daily', label: isRtl ? 'إيجار يومي' : 'Daily Stay' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  filter === tab.id
                    ? 'bg-[#0a1122] text-[#2ee59d] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* الكاروسيل */}
        <div className="relative mt-10">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
          >
            {visibleListings.map((item) => {
              const isFav = favorites.includes(item.id)
              return (
                <article
                  key={item.id}
                  className="aqar-card flex w-[min(88vw,375px)] shrink-0 flex-col justify-between border border-gray-200/85 bg-white shadow-sm"
                >
                  <div>
                    {/* صورة العقار */}
                    <div className="relative h-[245px] overflow-hidden bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1122]/80 via-transparent to-black/20" />

                      <span
                        className={`absolute start-3.5 top-3.5 rounded-full px-3 py-1 text-[11px] font-extrabold backdrop-blur-md ${
                          badgeStyles[item.badgeTone]
                        }`}
                      >
                        {item.badge}
                      </span>

                      <div className="absolute end-3.5 top-3.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFav(item.id)}
                          aria-label="Favorite"
                          className="flex size-8 items-center justify-center rounded-full bg-white/95 text-[#0a1122] shadow-sm transition hover:scale-110"
                        >
                          <Heart
                            className={`size-4 ${
                              isFav ? 'fill-red-500 text-red-500' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          aria-label="Share"
                          className="flex size-8 items-center justify-center rounded-full bg-white/95 text-[#0a1122] shadow-sm transition hover:scale-110"
                        >
                          <Share2 className="size-4" />
                        </button>
                      </div>

                      {/* شريط تقدم الأقساط لو كانت فرصة تخارج */}
                      {item.installmentProgress && (
                        <div className="absolute inset-x-3.5 bottom-3 rounded-xl bg-[#0a1122]/90 px-3 py-2 text-white backdrop-blur-md">
                          <div className="flex items-center justify-between text-[10.5px] font-bold">
                            <span className="text-[#2ee59d]">
                              {isRtl ? 'نسبة المدفوع من العقد' : 'Contract Paid Ratio'}
                            </span>
                            <span dir="ltr">{item.installmentProgress}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                            <div
                              style={{ width: `${item.installmentProgress}%` }}
                              className="h-full rounded-full bg-[#2ee59d]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* تفاصيل السعر والعنوان */}
                    <div className="p-5 text-start">
                      <div className="flex items-baseline justify-between gap-2">
                        <strong
                          dir="ltr"
                          className="text-2xl font-black tracking-tight text-[#0a1128]"
                        >
                          {item.price}
                        </strong>
                        <span
                          dir="ltr"
                          className="rounded-lg bg-[#eaf8f2] px-2.5 py-1 text-xs font-extrabold text-[#007a5a]"
                        >
                          {item.pricePerSqm}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-[#007a5a]">
                        {item.secondaryPrice}
                      </p>

                      <h3 className="mt-3.5 line-clamp-2 text-[15px] font-extrabold leading-snug text-[#0a1128]">
                        {item.title}
                      </h3>

                      <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        <MapPin className="size-3.5 shrink-0 text-[#007a5a]" />
                        <span>{item.location}</span>
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-gray-400">
                        ✦ {item.subLocation}
                      </p>
                    </div>
                  </div>

                  {/* الفوتر الخاص بالكارت */}
                  <div className="px-5 pb-5">
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 text-xs font-bold text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="size-3.5 text-[#007a5a]" />
                        <span dir="ltr">{item.area} m²</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="size-3.5 text-[#007a5a]" />
                        <span>
                          {item.beds} {isRtl ? 'غرف' : 'Beds'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath className="size-3.5 text-[#007a5a]" />
                        <span>
                          {item.baths} {isRtl ? 'حمام' : 'Bath'}
                        </span>
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3" />
                          {item.postedAgo}
                        </span>
                        <span className="inline-flex items-center gap-1" dir="ltr">
                          <Eye className="size-3" />
                          {item.views}
                        </span>
                      </div>

                      <Link
                        href="/opportunities"
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0a1122] px-4 text-xs font-extrabold text-white transition hover:bg-[#007a5a]"
                      >
                        {isRtl ? 'التفاصيل والتواصل' : 'View Deal'}
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* أزرار تحريك الكاروسيل */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel('prev')}
                aria-label="Previous"
                className="flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0a1122] shadow-xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
              >
                {isRtl ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('next')}
                aria-label="Next"
                className="flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0a1122] shadow-xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
              >
                {isRtl ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
              </button>
            </div>

            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f2] px-5 py-2.5 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white"
            >
              <span>{isRtl ? 'تصفح كل العقارات والفرص المتاحة' : 'Browse All Properties'}</span>
              {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}