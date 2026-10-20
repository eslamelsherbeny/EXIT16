import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  Bell,
  Check,
  CheckSquare,
  Home,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

// بيانات جدول المقارنة
const comparisonRows = [
  {
    criterion: 'السعر',
    resale: 'أوفر فوق السعر، ومبالغة عشان الفصال',
    exit: 'بدون أوفر — السعر = اللي اتدفع فعلًا، موثق بالإيصالات',
  },
  {
    criterion: 'الأرقام',
    resale: 'كلام البايع والسمسار من غير دليل',
    exit: 'متحققين من العقد والمدفوعات والمتبقي — بالمستندات الرسمية',
  },
  {
    criterion: 'الإجراءات',
    resale: 'السمسار بيوصّلك وبعدين انت وحظك',
    exit: 'بنمشي معاك في كل خطوات التنازل لحد الإمضاء والقبض',
  },
  {
    criterion: 'العمولة',
    resale: 'سعي وسمسرة من الطرفين في كل خطوة ومفاجآت',
    exit: 'مجانًا للبايع — 1.25% على المشتري بس، وعند إتمام التنازل فقط',
  },
]

// بيانات خطوات العمل الخمس
const workSteps = [
  {
    title: 'قيّم عقدك',
    text: 'دخّل بيانات عقدك واعرف موقفك مجانًا — وأول ما تبعت طلبك، حسابك بيتجهز تلقائيًا',
  },
  {
    title: 'ارفع مستنداتك',
    text: 'العقد وإيصالات السداد — بنراجعها ونتحقق منها',
  },
  {
    title: 'بنجهّز فرصتك',
    text: 'بنتحقق من الأرقام بالمستندات ونجهز عرض موثوق للمشترين',
  },
  {
    title: 'بنلاقي المشتري',
    text: 'بنطابق وحدتك مع مشترين قادرين فعلًا يكمّلوا',
  },
  {
    title: 'نقل التعاقد',
    text: 'بنمشي معاك في إجراءات النقل خطوة بخطوة لحد ما تقبض',
  },
]

// بيانات معايير الخروج العادل
const fairStandards = [
  {
    title: 'كل رقم له مصدر',
    text: 'بنوضحلك إيه المؤكد بالمستندات وإيه التقديري — من غير وعود مضللة',
  },
  {
    title: 'مجانًا للبايع بالكامل',
    text: 'مفيش أي عمولة على البايع خالص. المشتري بيدفع 1.25% عند إتمام النقل بس — من غير أي رسوم مخفية',
  },
  {
    title: 'خصوصيتك محفوظة',
    text: 'تقدر تختار الخروج الصامت — مفيش إعلان علني ولا تليفونات مزعجة',
  },
  {
    title: 'من غير ضغط',
    text: 'بنعرض عليك كل الخيارات — حتى لو الأفضل ليك إنك تكمّل تعاقدك',
  },
]

export default async function HomePage() {
  let realUnitCount = 0
  let totalMarketValue = 0
  let activeCountryCode = 'EG'

  const currencyMap: Record<string, string> = {
    EG: 'ج.م',
    RU: '₽',
    GE: '$',
    AE: 'د.إ',
  }

  try {
    const cookieStore = await cookies()
    activeCountryCode =
      cookieStore.get('darak_country')?.value?.trim() || 'EG'

    const supabase = await getSupabase()
    const { data: units } = await supabase
      .from('sell_requests')
      .select('status, country_code, market_price, contract_price, paid_amount')
      .neq('status', 'rejected')
      .neq('status', 'deleted_by_seller')

    if (units && units.length > 0) {
      // فلترة الوحدات حسب الدولة المختارة حالياً (مصر تشمل الوحدات القديمة التي ليس لها country_code)
      const countryUnits = units.filter((u: any) => {
        const uCountry = u.country_code || 'EG'
        return uCountry === activeCountryCode
      })

      realUnitCount = countryUnits.length
      totalMarketValue = countryUnits.reduce((sum, u) => {
        const unitVal =
          Number(u.market_price) ||
          Number(u.contract_price) ||
          Number(u.paid_amount) ||
          0
        return sum + unitVal
      }, 0)
    }
  } catch (err) {
    console.error('Error fetching real stats on HomePage:', err)
  }

  const currencySymbol = currencyMap[activeCountryCode] || 'ج.م'
  let formattedValue = '0'
  let valueUnitLabel = currencySymbol

  if (totalMarketValue >= 1_000_000_000) {
    formattedValue = (totalMarketValue / 1_000_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    })
    valueUnitLabel = `مليار ${currencySymbol}`
  } else if (totalMarketValue >= 1_000_000) {
    formattedValue = (totalMarketValue / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })
    valueUnitLabel = `مليون ${currencySymbol}`
  } else {
    formattedValue = totalMarketValue.toLocaleString('en-US')
    valueUnitLabel = currencySymbol
  }

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-[#f5f6f8] text-[#0a1128]">
      
      {/* ==================== 1. قسم الهيرو (Hero Section) ==================== */}
      <section className="relative flex min-h-[720px] items-center overflow-hidden bg-[#0a1122] text-white lg:min-h-[780px]">
        {/* التوهج الخلفي */}
        <div className="pointer-events-none absolute -left-32 -bottom-40 size-[28rem] rounded-full bg-teal-500/10 blur-[120px] sm:size-[38rem]" />
        <div className="pointer-events-none absolute right-[15%] -top-32 size-[24rem] rounded-full bg-blue-500/10 blur-[120px] sm:size-[32rem]" />

        <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:py-20">
          
          {/* العمود الأيمن: النصوص والأزرار */}
          <div className="text-right">
            {/* البادج العلوي */}
            <span className="mb-6 inline-block rounded-full border border-white/10 bg-[#132230] px-4 py-1.5 text-[11px] font-semibold text-[#2dd4a8] sm:text-xs">
              منصة التنازل عن وحدات التقسيط — بدون أوفر
            </span>

            {/* العنوان الرئيسي */}
            <h1 className="text-[30px] font-black leading-[1.32] tracking-tight text-white sm:text-[40px] md:text-[44px] lg:text-[48px] lg:leading-[1.28]">
              البايع يسترجع كل اللي دفعه
              <br className="hidden sm:inline" />{' '}
              كاش،{' '}
              <span className="text-[#19b394]">
                والمشتري ياخد سعر
                <br className="hidden sm:inline" /> التعاقد القديم
              </span>
            </h1>

            {/* الوصف */}
            <p className="mt-5 max-w-[565px] text-[13.5px] leading-[1.95] text-[#9ba6b8] sm:text-[15px] lg:text-[15.5px]">
              لو مش قادر تكمّل أقساطك: بيع وحدتك بدون أوفر واسترجع فلوسك، بدل ما تخاطر بخسارة ممكن توصل لـ 10%-15% من سعر الوحدة في الإلغاء حسب عقدك. ولو بتدور على وحدة: اشتري بسعر تعاقد قديم أرخص من سعر السوق وكمّل الأقساط. كل الأرقام متحققة بالمستندات — وإحنا معاكم بنسهّل إجراءات التنازل خطوة بخطوة لحد الإتمام.
            </p>

            {/* الأزرار */}
            <div className="mt-7 flex flex-wrap items-center justify-start gap-3.5 sm:mt-8">
              <Button
                size="lg"
                className="h-12 flex-1 rounded-[10px] bg-[#0d6e52] px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0a5942] sm:flex-none sm:px-8 sm:text-[15px]"
                render={<Link href="/sell" />}
              >
                بيع وحدتك
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1 rounded-[10px] border border-white/15 !bg-[#111a2b]/60 px-7 text-sm font-bold text-white transition-all hover:!bg-white/10 hover:text-white sm:flex-none sm:px-8 sm:text-[15px]"
                render={<Link href="/opportunities" />}
              >
                شوف فرص الشراء
              </Button>
            </div>

            {/* سطر الثقة السفلي */}
            <div className="mt-6 flex items-start justify-start gap-2 text-[11px] leading-relaxed text-[#7e8b9f] sm:items-center sm:text-xs">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#19b394] sm:mt-0" />
              <p>للبايع: مجانًا تمامًا — مفيش أي عمولة عليك. للمشتري: أرقام موثقة قبل ما تدفع جنيه</p>
            </div>
          </div>

          {/* العمود الأيسر: بطاقات المقارنة */}
          <div className="relative mx-auto flex w-full max-w-[440px] flex-col items-center gap-4">
            {/* البطاقة العلوية (الداكنة) */}
            <div className="w-full rounded-[20px] border border-white/10 bg-[#162032]/90 p-5 text-white shadow-xl backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#3a1d2b] text-xs font-bold text-[#ff5a65]">
                  ✕
                </span>
                <p className="text-sm font-bold text-gray-200">لو رجّع الوحدة للمطور</p>
              </div>

              <div className="mt-5 flex items-end justify-between gap-2">
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 sm:text-xs">خصم الإلغاء (15% من سعر الوحدة كله)</p>
                  <strong dir="ltr" className="mt-1 block text-xl font-extrabold text-[#ff5a65] tabular-nums sm:text-[26px]">
                    - 1,500,000 ج.م
                  </strong>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-[11px] text-gray-400 sm:text-xs">ياخدها على</p>
                  <p className="mt-1 text-sm font-bold text-gray-200 sm:text-base">3 سنين</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white/[0.04] px-4 py-2.5 text-center text-[11px] text-gray-400 sm:text-xs">
                خسارة 75% من فلوسه + سنين انتظار
              </div>
            </div>

            {/* شارة VS */}
            <div className="z-20 -my-6 flex size-9 items-center justify-center rounded-full border border-white/15 bg-[#0a1122] text-[11px] font-bold uppercase text-gray-300 shadow-md">
              vs
            </div>

            {/* البطاقة السفلية (البيضاء) */}
            <div className="w-full rounded-[20px] bg-white p-5 text-[#0a1128] shadow-2xl sm:p-6">
              <div className="flex items-center justify-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d8f3e5] text-xs font-bold text-[#0f7a58]">
                  ✓
                </span>
                <p className="text-sm font-bold text-[#0a1128]">لو نقل تعاقده عن طريق عقار إكزت</p>
              </div>

              <div className="mt-5 text-right">
                <p className="text-[11px] text-gray-500 sm:text-xs">يسترجع اللي دفعه</p>
                <strong className="mt-1 block text-2xl font-extrabold text-[#007a5a] tabular-nums sm:text-[32px]">
                  <span dir="ltr">2,000,000</span> ج.م
                </strong>
                <p className="mt-1 text-xs font-bold text-[#0a1128]">كاش عند إتمام النقل</p>
              </div>

              <div className="mt-5 rounded-xl bg-[#e3f5ec] px-4 py-2.5 text-center text-[11px] font-semibold text-[#0f7a58] sm:text-xs">
                فلوسه كاملة، والمشتري كسب سعر قديم
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 2. قسم الإحصائيات الحقيقية من الداتابيز (Stats Section) ==================== */}
      <section className="mx-auto max-w-[1060px] px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 divide-y divide-gray-200/80 overflow-hidden rounded-[20px] border border-gray-200/70 border-t-[3px] border-t-[#007a5a] bg-white shadow-sm md:grid-cols-2 md:divide-y-0 md:divide-x md:divide-x-reverse">
          
          {/* الإحصائية الأولى: عدد الوحدات الفعلي في الداتابيز */}
          <div className="p-7 text-right sm:p-10">
            <p className="text-xs font-bold text-gray-500">الوحدات على المنصة</p>
            <div className="mt-3 flex items-baseline justify-start gap-2">
              <span
                dir="ltr"
                className="text-4xl font-extrabold tracking-tight text-[#0a1128] tabular-nums sm:text-5xl"
              >
                {realUnitCount.toLocaleString('en-US')}
              </span>
              <span className="text-base font-medium text-gray-500 sm:text-lg">وحدة</span>
            </div>
            <div className="mt-4 h-[1px] w-10 bg-gray-200" />
            <p className="mt-3 text-xs text-gray-400">منشورة في السوق، وتحت المراجعة</p>
          </div>

          {/* الإحصائية الثانية: إجمالي قيمة الوحدات الفعلية في الداتابيز */}
          <div className="p-7 text-right sm:p-10">
            <div className="flex items-center justify-start gap-2">
              <p className="text-xs font-bold text-gray-500">قيمة الوحدات في السوق</p>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-start gap-2">
              <span
                dir="ltr"
                className="text-4xl font-extrabold tracking-tight text-[#0a1128] tabular-nums sm:text-5xl"
              >
                {formattedValue}
              </span>
              <span className="text-base font-medium text-gray-500 sm:text-lg">
                {valueUnitLabel}
              </span>
            </div>
            <div className="mt-4 h-[1px] w-10 bg-gray-200" />
            <p className="mt-3 text-xs text-gray-400">بسعر السوق الحالي للوحدات المسجلة</p>
          </div>

        </div>
      </section>

      {/* ==================== 3. قسم الجمهور (البايع والمشتري) ==================== */}
      <section className="mx-auto max-w-[1060px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="max-w-xl text-right">
          <h2 className="text-2xl font-extrabold leading-[1.4] text-[#0a1128] sm:text-3xl md:text-[34px]">
            طرف محتاج يبيع، وطرف مستني الفرصة — وإحنا بنوصّلهم
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            ده مش ريسيل عادي: مفيش أوفر خالص. البايع بياخد اللي دفعه بالظبط، والمشتري بياخد سعر التعاقد القديم زي ما هو
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* بطاقة البايع (البيضاء - يمين) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-right shadow-sm sm:p-9">
            <div>
              <span className="inline-block rounded-full bg-[#e6f4f1] px-3.5 py-1 text-xs font-bold text-[#007a5a]">
                البايع – صاحب الوحدة
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[#0a1128] sm:text-2xl">
                بدون أوفر = أسرع بيع في السوق
              </h3>
              <p className="mt-3 text-xs leading-[1.9] text-gray-500 sm:text-sm">
                لأن سعرك هو نفس اللي دفعته من غير أي زيادة، وحدتك بتبقى أحسن فرصة قدام المشترين — فبتتباع أسرع. تسترجع فلوسك كاملة كاش، بدل ما المطور يخصم منك ويقسط لك الباقي على سنين.
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2.5 text-xs font-medium text-[#0a1128] sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                  <span>تسترجع 100% من اللي دفعته — كاش عند إتمام التنازل</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-[#0a1128] sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                  <span>من غير إعلانات علنية ولا تليفونات سماسرة</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-[#0a1128] sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                  <span>بنجهّز معاك ملف التنازل وبنتابع معاك خطوة بخطوة لحد الإمضاء</span>
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-[#b8e6d5] bg-[#eaf8f2] px-4 py-3 text-xs font-bold text-[#007a5a] sm:text-sm">
                مجانًا عليك تمامًا — عقار إكزت مش بتاخد أي عمولة من البايع.
              </div>
            </div>

            <div className="mt-7">
              <Button
                className="h-11 rounded-[10px] bg-[#0a1122] px-6 text-xs font-bold text-white hover:bg-[#16223f] sm:text-sm"
                render={<Link href="/sell" />}
              >
                اعرض وحدتك للتنازل
              </Button>
            </div>
          </div>

          {/* بطاقة المشتري (الداكنة - يسار) */}
          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#0a1122] via-[#0d1b2a] to-[#0c262e] p-6 text-right text-white shadow-lg sm:p-9">
            <div>
              <span className="inline-block rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-[#2ee59d]">
                المشتري
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-white sm:text-2xl">
                وحدة بالتقسيط من غير ما تدفع أوفر لحد
              </h3>
              <p className="mt-3 text-xs leading-[1.9] text-gray-300/85 sm:text-sm">
                بتاخد الوحدة بسعر تعاقدها القديم — أرخص من سعر المطور النهارده بفرق كبير — وتكمّل الأقساط العادية. الفرق ده مكسبك من يوم ما تمضي، ومن غير جنيه أوفر.
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2.5 text-xs font-medium text-gray-200 sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#2ee59d]" />
                  <span>سعر التعاقد القديم زي ما هو — الأوفر ممنوع على المنصة</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-gray-200 sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#2ee59d]" />
                  <span>العقد والمدفوعات والمتبقي متحقق منهم قبل ما تشوف الفرصة</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-medium text-gray-200 sm:text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#2ee59d]" />
                  <span>تنازل رسمي معتمد من المطور — مش توكيلات وكلام</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Button
                className="h-11 rounded-[10px] bg-[#007a5a] px-6 text-xs font-bold text-white hover:bg-[#006248] sm:text-sm"
                render={<Link href="/opportunities" />}
              >
                شوف الفرص المتاحة
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 4. قسم جدول المقارنة (جدول موحد للموبايل والكمبيوتر) ==================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-[1060px] px-3.5 sm:px-6 lg:px-8">
          <div className="text-right">
            <h2 className="text-2xl font-extrabold text-[#0a1128] sm:text-3xl md:text-[34px]">
              إيه الفرق بينا وبين الريسيل العادي؟
            </h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              السوق مليان إعلانات وسماسرة — إحنا بنشتغل بطريقة تانية خالص
            </p>
          </div>

          {/* جدول مقارنة احترافي يعمل كـ Table Grid حقيقي على الموبايل والتابلت والديسكتوب */}
          <div className="mt-8 overflow-hidden rounded-[18px] border border-gray-200/90 shadow-sm sm:mt-10">
            {/* هيدر الجدول */}
            <div className="grid grid-cols-[74px_1fr_1.1fr] text-right text-[11px] font-bold sm:grid-cols-[120px_1fr_1fr] sm:text-xs md:grid-cols-[140px_1fr_1fr] md:text-sm">
              <div className="flex items-center bg-[#f4f5f7] px-2.5 py-3 text-[10px] font-extrabold text-gray-400 sm:p-4 sm:text-xs">
                المقارنة
              </div>
              <div className="flex items-center border-r border-gray-200/80 bg-[#f4f5f7] px-2.5 py-3 text-gray-600 sm:p-4">
                الريسيل العادي
              </div>
              <div className="flex items-center bg-[#0a1122] px-2.5 py-3 text-white sm:p-4">
                عقار إكزت
              </div>
            </div>

            {/* صفوف الجدول */}
            {comparisonRows.map((row) => (
              <div
                key={row.criterion}
                className="grid grid-cols-[74px_1fr_1.1fr] items-stretch border-t border-gray-200/80 text-right text-[11px] leading-relaxed sm:grid-cols-[120px_1fr_1fr] sm:text-xs md:grid-cols-[140px_1fr_1fr] lg:text-sm"
              >
                {/* عمود المعيار */}
                <div className="flex items-center bg-[#f8f9fa] px-2.5 py-3.5 font-extrabold text-[#0a1128] sm:p-4">
                  {row.criterion}
                </div>

                {/* عمود الريسيل العادي */}
                <div className="flex items-start gap-1.5 border-r border-gray-200/80 bg-white px-2.5 py-3.5 text-gray-500 sm:items-center sm:gap-2.5 sm:p-4">
                  <span className="mt-0.5 shrink-0 font-bold text-red-500 sm:mt-0">
                    ✕
                  </span>
                  <span>{row.resale}</span>
                </div>

                {/* عمود عقار إكزت */}
                <div className="flex items-start gap-1.5 bg-[#e3ecec] px-2.5 py-3.5 font-semibold text-[#0a1128] sm:items-center sm:gap-2.5 sm:p-4">
                  <span className="mt-0.5 shrink-0 font-bold text-[#007a5a] sm:mt-0">
                    ✓
                  </span>
                  <span>{row.exit}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==================== 5. قسم مثال بالأرقام (Example Section) ==================== */}
      <section className="bg-[#f5f6f8] py-14 sm:py-20">
        <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-8">
          <div className="text-right">
            <h2 className="text-2xl font-extrabold text-[#0a1128] sm:text-3xl md:text-[34px]">
              مثال بالأرقام
            </h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              وحدة سعرها الإجمالي 10 مليون جنيه، صاحبها دفع منها 2 مليون على 3 سنين وموقف عن السداد
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* البطاقة اليمنى: لو رجّع الوحدة للمطور */}
            <div className="flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-right shadow-sm sm:p-8">
              <div>
                <div className="flex items-center justify-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecee] text-xs font-bold text-[#d9383a]">
                    ✕
                  </span>
                  <h3 className="text-base font-extrabold text-[#0a1128]">لو رجّع الوحدة للمطور</h3>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400">خصم الإلغاء (15% من سعر الوحدة كله)</p>
                  <p dir="ltr" className="mt-1.5 text-right text-2xl font-extrabold text-[#d9383a] tabular-nums sm:text-3xl">
                    - 1,500,000 ج.م
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">اللي هيرجعله</p>
                    <p className="mt-1 text-lg font-extrabold text-[#0a1128] tabular-nums sm:text-xl">
                      <span dir="ltr">500,000</span> ج.م
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">ياخدها على</p>
                    <p className="mt-1 text-lg font-extrabold text-[#b45309] sm:text-xl">
                      3 سنين
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-[#fef2f2] px-4 py-3 text-center text-xs font-bold text-[#d9383a]">
                خسارة 75% من فلوسه + سنين انتظار
              </div>
            </div>

            {/* البطاقة اليسرى: لو نقل تعاقده عن طريق عقار إكزت */}
            <div className="flex flex-col justify-between rounded-[20px] border-2 border-[#a7e3cb] bg-white p-6 text-right shadow-sm sm:p-8">
              <div>
                <div className="flex items-center justify-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e3f7ed] text-xs font-bold text-[#007a5a]">
                    ✓
                  </span>
                  <h3 className="text-base font-extrabold text-[#0a1128]">
                    لو نقل تعاقده عن طريق عقار إكزت
                  </h3>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400">يسترجع اللي دفعه</p>
                  <p className="mt-1.5 text-2xl font-extrabold text-[#007a5a] tabular-nums sm:text-3xl">
                    <span dir="ltr">2,000,000</span> ج.م
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#0a1128]">كاش عند إتمام النقل</p>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">عمولة المنصة عليك كبايع</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#007a5a]">صفر</p>
                  <p className="mt-1 text-xs font-bold text-[#0a1128]">
                    تدفع صفر — تستلم اللي دفعته بالكامل
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-[#eaf8f2] px-4 py-3 text-center text-xs font-bold text-[#007a5a]">
                فلوسه كاملة، والمشتري كسب سعر قديم
              </div>
            </div>

          </div>

          <p className="mt-6 text-right text-xs leading-relaxed text-gray-400">
            الأرقام دي مثال توضيحي. نسبة الخصم وشروط الاسترداد بتختلف من عقد لعقد — وده بالظبط اللي بنراجعه في تقرير الخروج المجاني.
          </p>
        </div>
      </section>

      {/* ==================== 6. قسم إزاي بنشتغل؟ (Steps Section) ==================== */}
      <section className="border-t border-gray-200/60 bg-[#f5f6f8] py-14 sm:py-20">
        <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-8">
          <div className="text-right">
            <h2 className="text-2xl font-extrabold text-[#0a1128] sm:text-3xl md:text-[34px]">
              إزاي بنشتغل؟
            </h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              خمس خطوات واضحة، ومسؤول حالة معاك في كل خطوة
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[18px] border border-gray-200/70 bg-white p-6 text-right shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#0a1122] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-extrabold text-[#0a1128]">{step.title}</h3>
                <p className="mt-2 text-xs leading-[1.8] text-gray-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 7. قسم معايير الخروج العادل (Standards Section) ==================== */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-8">
          <div className="text-right">
            <h2 className="text-2xl font-extrabold text-[#0a1128] sm:text-3xl md:text-[34px]">
              معايير الخروج العادل
            </h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              وضعنا قواعد ملزمة لنفسنا قبل ما نطلبك تثق فينا
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-2 md:gap-y-10">
            {fairStandards.map((item) => (
              <div key={item.title} className="flex items-start gap-4 text-right">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f8] text-[#1e3a8a]">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#0a1128]">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-[1.85] text-gray-500 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 8. القسم الداكن المزدوج (اعرف موقفك + التطبيق) ==================== */}
      <section className="relative overflow-hidden bg-[#0a1122] py-16 text-white sm:py-24">
        {/* توهجات خلفية */}
        <div className="pointer-events-none absolute left-1/2 top-10 size-[28rem] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute left-[15%] bottom-0 size-[30rem] rounded-full bg-teal-500/10 blur-[140px]" />

        <div className="relative mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-8">
          
          {/* الجزء العلوي: اعرف موقفك في دقيقة */}
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
              اعرف موقفك في دقيقة
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-gray-400 sm:text-sm md:text-base">
              دخّل سعر الوحدة واللي دفعته، وشوف الفرق بين الإلغاء ونقل التعاقد
            </p>
            <div className="mt-7">
              <Button
                size="lg"
                className="h-12 rounded-[10px] bg-[#007a5a] px-8 text-sm font-bold text-white hover:bg-[#006248] sm:text-base"
                render={<Link href="/sell" />}
              >
                احسب دلوقتي
              </Button>
            </div>
          </div>

          {/* الجزء السفلي: السوق كله في جيبك (التطبيق) */}
          <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-28 md:grid-cols-2 lg:gap-16">
            
            {/* العمود الأيمن: تفاصيل التطبيق وأزرار التحميل */}
            <div className="text-right">
              <span className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1 text-xs font-bold text-[#2ee59d]">
                التطبيق نزل رسميًا
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                السوق كله في جيبك
              </h2>
              <p className="mt-4 max-w-md text-xs leading-[1.9] text-gray-300/85 sm:text-sm md:text-base">
                أول ما وحدة تنزل السوق، الإشعار يوصلك في ثانيتها — من غير ما تفضل داخل تشوف في جديد ولا لأ.
              </p>

              <ul className="mt-7 space-y-4">
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[#2ee59d]">
                    <Bell className="size-4" />
                  </span>
                  <span>إشعار لحظة نزول وحدة جديدة تطابق طلبك</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[#2ee59d]">
                    <Zap className="size-4" />
                  </span>
                  <span>تصفح أسرع ومن غير تسجيل دخول كل مرة</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-medium text-gray-200 sm:text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-[#2ee59d]">
                    <CheckSquare className="size-4" />
                  </span>
                  <span>تابع وحدتك أو طلبك خطوة بخطوة</span>
                </li>
              </ul>

              {/* أزرار المتاجر */}
              <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
                {/* App Store */}
                <a
                  href="#app-store"
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 text-white transition hover:bg-white/5"
                >
                  <div className="text-right">
                    <span className="block text-[9px] text-gray-400">حمّله من</span>
                    <span className="block text-sm font-bold leading-tight">App Store</span>
                  </div>
                  <svg className="size-6 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                  </svg>
                </a>

                {/* Google Play */}
                <a
                  href="#google-play"
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 text-white transition hover:bg-white/5"
                >
                  <div className="text-right">
                    <span className="block text-[9px] text-gray-400">متوفر على</span>
                    <span className="block text-sm font-bold leading-tight">Google Play</span>
                  </div>
                  <svg className="size-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M3.61 1.814L13.793 12 3.61 22.186a1.96 1.96 0 0 1-.61-1.42V3.234c0-.55.23-1.05.61-1.42z"
                    />
                    <path
                      fill="#34A853"
                      d="M17.22 8.573L13.793 12 3.61 1.814c.42-.4.99-.53 1.56-.21l12.05 6.97z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M20.635 10.548c.98.57.98 1.98 0 2.55l-3.415 1.975L13.793 12l3.427-3.427 3.415 1.975z"
                    />
                    <path
                      fill="#EA4335"
                      d="M17.22 15.427L5.17 22.396c-.57.32-1.14.19-1.56-.21L13.793 12l3.427 3.427z"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* العمود الأيسر: مجسم الموبايل المائل */}
            <div className="hidden justify-center md:flex">
              <div className="w-[270px] -rotate-3 rounded-[40px] border-[6px] border-[#1c283c] bg-[#0b1323] p-4 shadow-2xl transition-transform duration-300 hover:rotate-0 sm:w-[300px]">
                {/* سماعة الموبايل العلوية */}
                <div className="mx-auto mb-4 h-4 w-24 rounded-full bg-black" />

                {/* إشعار داخل شاشة الموبايل */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#131f33] p-3.5 text-right shadow-md">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-[#2ee59d]">
                    <Home className="size-4" />
                  </span>
                  <div className="mr-2.5 flex-1">
                    <p className="text-[11px] font-bold text-white">وحدة جديدة نزلت دلوقتي</p>
                    <p className="mt-0.5 text-[9px] text-gray-400">
                      3 غرف • التجمع الخامس • مطابقة لطلبك
                    </p>
                  </div>
                </div>

                {/* بطاقة عقار هيكلية 1 */}
                <div className="mt-3 rounded-2xl border border-white/5 bg-[#101b2d] p-3">
                  <div className="h-20 w-full rounded-xl bg-gradient-to-b from-teal-900/35 to-teal-950/15" />
                  <div className="mt-3 h-2.5 w-3/4 rounded-full bg-white/10" />
                  <div className="mt-2 h-2 w-1/2 rounded-full bg-white/5" />
                  <div className="mt-3 flex justify-end">
                    <div className="h-4 w-14 rounded-md bg-teal-500/20" />
                  </div>
                </div>

                {/* بطاقة عقار هيكلية 2 */}
                <div className="mt-3 rounded-2xl border border-white/5 bg-[#101b2d] p-3">
                  <div className="h-20 w-full rounded-xl bg-gradient-to-b from-[#17263c] to-[#101b2d]" />
                  <div className="mt-3 h-2.5 w-2/3 rounded-full bg-white/10" />
                  <div className="mt-2 h-2 w-2/5 rounded-full bg-white/5" />
                  <div className="mt-3 flex justify-end">
                    <div className="h-4 w-14 rounded-md bg-teal-500/20" />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== 9. قسم البطاقتين السفليتين قبل الفوتر ==================== */}
      <section className="bg-[#f5f6f8] py-14 sm:py-20">
        <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* البطاقة اليمنى: للبايع */}
            <div className="flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-right shadow-sm sm:p-9">
              <div>
                <h3 className="text-xl font-extrabold text-[#0a1128] sm:text-2xl">
                  مش قادر تكمّل أقساطك؟
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  متتسرعش في قرار الإلغاء. اعرف موقفك الأول — التقييم مجاني ومن غير أي التزام.
                </p>
              </div>
              <div className="mt-7">
                <Button
                  className="h-11 rounded-[10px] bg-[#0a1122] px-6 text-xs font-bold text-white hover:bg-[#16223f] sm:text-sm"
                  render={<Link href="/sell" />}
                >
                  ابدأ تقييم عقدك
                </Button>
              </div>
            </div>

            {/* البطاقة اليسرى: للمشتري */}
            <div className="flex flex-col justify-between rounded-[20px] border border-gray-200/80 bg-white p-6 text-right shadow-sm sm:p-9">
              <div>
                <h3 className="text-xl font-extrabold text-[#0a1128] sm:text-2xl">
                  بتدور على فرصة حقيقية؟
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  سجّل ميزانيتك وهنبعتلك الفرص اللي تناسب الكاش المتاح معاك والقسط اللي يريحك.
                </p>
              </div>
              <div className="mt-7">
                <Button
                  variant="outline"
                  className="h-11 rounded-[10px] border border-gray-300 bg-white px-6 text-xs font-bold text-[#0a1128] hover:bg-gray-50 sm:text-sm"
                  render={<Link href="/buy" />}
                >
                  سجّل كمشتري
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}