'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import { createBoostRequestAction } from '@/actions/account-actions'

const MARKET_SECTIONS_I18N: Record<
  LocaleCode,
  {
    bannerBadge: string
    bannerTitle: string
    bannerDesc: string
    bannerPill1: string
    bannerPill2: string
    bannerPill3: string
    bannerBtn: string
    devBadge: string
    devTitle: string
    devSub: string
    devAllBtn: string
    devProjectsWord: string
    devActiveWord: string
    devProjectsLink: string
    tbilisi: string
    batumi: string
    walletBadge: string
    walletTitlePrefix: string
    walletTitleAccent: string
    walletDesc: string
    feature1Title: string
    feature1Desc: string
    feature2Title: string
    feature2Desc: string
    feature3Title: string
    feature3Desc: string
    quickAmounts: string
    starterBadge: string
    recommendedBadge: string
    popularBadge: string
    customAmountLabel: string
    anyWord: string
    daySingular: string
    dayPlural: string
    creditedToBalance: string
    zeroFeeBadge: string
    instantCreditBadge: string
    upsellAdvice: (target: number, discount: string, days: number) => string
    topUpToBtn: (target: number) => string
    unitCodePlaceholder: string
    neverExpires: string
    fullyRefundable: string
    payWithCardBtn: (amt: number) => string
    bankTransferBtn: (amt: number) => string
    boostRecordedMsg: (
      tier: string,
      amt: number,
      days: number,
      code?: string | null
    ) => string
    coversLabel: (tier: string, days: number) => string
  }
> = {
  ar: {
    bannerBadge: 'مساحة ترويجية مميزة · AQAR EXIT SPOTLIGHT',
    bannerTitle: 'هل تريد بيع وحدتك أو تسويق مشروعك أسرع؟',
    bannerDesc:
      'ضع وحدتك في صدارة الصفحة الرئيسية أمام آلاف المستثمرين والمشترين الجادين الباحثين عن فرص استكمال الأقساط في جورجيا.',
    bannerPill1: 'ظهور في الصدارة',
    bannerPill2: 'مشترون جادون بدون وسطاء',
    bannerPill3: 'تفعيل فوري',
    bannerBtn: 'اختر باقة تمييز إعلانك الآن ←',
    devBadge: 'أفضل المطورين',
    devTitle: 'شركات التطوير الرائدة',
    devSub: 'ترتيب حسب الإعلانات النشطة — استعرض المشاريع والعقارات',
    devAllBtn: 'كل المطورين (1399) ←',
    devProjectsWord: 'مشروع',
    devActiveWord: 'نشطة',
    devProjectsLink: 'المشاريع ←',
    tbilisi: 'تبليسي',
    batumi: 'باتومي',
    walletBadge: 'رصيد المحفظة والترقية',
    walletTitlePrefix: 'اشحن رصيدك',
    walletTitleAccent: 'بأي مبلغ',
    walletDesc:
      'رقِّ إعلان التنازل الخاص بك لباقات SUPER VIP و VIP+ ليظهر في صدارة الصفحة الرئيسية والفرص المتاحة. بمجرد الدفع عبر الرابط ومراجعة الأدمن للإعلان والدفع، يتم تفعيل باقتك تلقائياً بالمدة المحددة.',
    feature1Title: 'كل وسائل الدفع',
    feature1Desc:
      'دفع مباشر سريع عبر رابط الدفع الآمن بالبطاقة أو التحويل البنكي.',
    feature2Title: 'قابل للاسترداد 100%',
    feature2Desc:
      'إذا لم تتم الموافقة على الإعلان من الأدمن، يُسترد المبلغ بالكامل فوراً.',
    feature3Title: 'تفعيل فوري بعد المراجعة',
    feature3Desc:
      '0% رسوم إضافية — تُحسب أيام الترقية تلقائياً حسب قيمة الباقة المدفوعة.',
    quickAmounts: 'مبالغ سريعة',
    starterBadge: 'بداية',
    recommendedBadge: 'موصى به 🔥',
    popularBadge: 'الأكثر طلباً',
    customAmountLabel: 'مبلغ مخصص',
    anyWord: 'حر',
    daySingular: 'يوم',
    dayPlural: 'أيام',
    creditedToBalance: 'تُضاف لرصيد إعلانك',
    zeroFeeBadge: 'عمولة 0%',
    instantCreditBadge: 'رصيد فوري 1:1',
    upsellAdvice: (target, discount, days) =>
      `نصيحة: شحن ${target} ₾ يفتح لك خصم ${discount} على باقة SUPER VIP (${days} يوماً)`,
    topUpToBtn: (target) => `اشحن ${target} ₾`,
    unitCodePlaceholder:
      'كود إعلانك (اختياري — لتفعيله فور مراجعة الأدمن للدفع)',
    neverExpires: 'لا تنتهي صلاحيته',
    fullyRefundable: 'قابل للاسترداد بالكامل',
    payWithCardBtn: (amt) => `ادفع ${amt} ₾ بالبطاقة البنكية`,
    bankTransferBtn: (amt) => `تحويل بنكي ${amt} ₾`,
    boostRecordedMsg: (tier, amt, days, code) =>
      `تم تسجيل طلب تفعيل باقة (${tier} — ${amt} ₾ لمدة ${days} يوم)${code ? ` للوحدة ${code}` : ''}. بمجرد إتمام الدفع ومراجعة الأدمن للإعلان والدفع سيتم التفعيل تلقائياً.`,
    coversLabel: (tier, days) =>
      `تغطي باقة ${tier} لمدة ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : 'أيام'}`,
  },
  en: {
    bannerBadge: 'PREMIUM SPOTLIGHT · AQAR EXIT',
    bannerTitle: 'Want to Exit Your Unit or Promote Your Project Faster?',
    bannerDesc:
      'Place your property at the top of the homepage in front of thousands of serious investors.',
    bannerPill1: 'Top placement',
    bannerPill2: 'Direct serious buyers',
    bannerPill3: 'Instant activation',
    bannerBtn: 'Boost your listing now →',
    devBadge: 'TOP DEVELOPERS',
    devTitle: 'Leading development companies',
    devSub: 'Ranked by active exit listings — explore projects and units',
    devAllBtn: 'All developers (1399) →',
    devProjectsWord: 'projects',
    devActiveWord: 'active',
    devProjectsLink: 'Projects →',
    tbilisi: 'Tbilisi',
    batumi: 'Batumi',
    walletBadge: 'Wallet & Boost Balance',
    walletTitlePrefix: 'Top Up Your Balance',
    walletTitleAccent: 'With Any Amount',
    walletDesc:
      'Promote your listings with SUPER VIP and VIP+ boosts. Once paid and verified by Admin, your listing boost activates automatically.',
    feature1Title: 'All Payment Methods',
    feature1Desc:
      'Apple Pay · Mastercard · Visa · BOG · TBC · Bank Transfer.',
    feature2Title: '100% Refundable',
    feature2Desc:
      'Any unspent balance is fully refundable at any time upon request.',
    feature3Title: 'Instant 1:1 Credit',
    feature3Desc: '0% fees. Every 1 GEL goes directly to your listing boost.',
    quickAmounts: 'Quick amounts',
    starterBadge: 'Starter',
    recommendedBadge: 'Recommended 🔥',
    popularBadge: 'Popular',
    customAmountLabel: 'Custom amount',
    anyWord: 'Any',
    daySingular: 'day',
    dayPlural: 'days',
    creditedToBalance: 'credited to your balance',
    zeroFeeBadge: '0% fee',
    instantCreditBadge: 'Instant 1:1 credit',
    upsellAdvice: (target, discount, days) =>
      `Recommendation: ${target} ₾ unlocks ${discount} volume discount on SUPER VIP (${days} days)`,
    topUpToBtn: (target) => `Top up to ${target} ₾`,
    unitCodePlaceholder:
      'Your unit code (optional — for instant admin activation)',
    neverExpires: 'Never expires',
    fullyRefundable: 'Fully refundable',
    payWithCardBtn: (amt) => `Pay ${amt} ₾ with Card`,
    bankTransferBtn: (amt) => `Bank Transfer ${amt} ₾`,
    boostRecordedMsg: (tier, amt, days, code) =>
      `Boost request (${tier} — ${amt} ₾ for ${days} days)${code ? ` for unit ${code}` : ''} recorded. It will activate automatically once payment and listing are approved by Admin.`,
    coversLabel: (tier, days) =>
      `Covers ${tier} for ${days} ${days === 1 ? 'day' : 'days'}`,
  },
  ru: {
    bannerBadge: 'ПРЕМИУМ РАЗМЕЩЕНИЕ · AQAR EXIT',
    bannerTitle: 'Хотите быстрее продать объект или продвинуть проект?',
    bannerDesc:
      'Разместите ваш объект в топе главной страницы перед тысячами реальных покупателей и инвесторов в Грузии.',
    bannerPill1: 'Топ-позиции в выдаче',
    bannerPill2: 'Прямые покупатели без посредников',
    bannerPill3: 'Мгновенная активация',
    bannerBtn: 'Выбрать пакет продвижения →',
    devBadge: 'ЛУЧШИЕ ЗАСТРОЙЩИКИ',
    devTitle: 'Ведущие строительные компании',
    devSub: 'Рейтинг по активным объектам — изучайте ЖК и квартиры',
    devAllBtn: 'Все застройщики (1399) →',
    devProjectsWord: 'проектов',
    devActiveWord: 'активных',
    devProjectsLink: 'Проекты →',
    tbilisi: 'Тбилиси',
    batumi: 'Батуми',
    walletBadge: 'Баланс и продвижение',
    walletTitlePrefix: 'Пополните баланс',
    walletTitleAccent: 'на любую сумму',
    walletDesc:
      'Продвигайте объявления с пакетами SUPER VIP и VIP+. После оплаты и проверки администратором продвижение активируется автоматически.',
    feature1Title: 'Все способы оплаты',
    feature1Desc:
      'Apple Pay · Mastercard · Visa · BOG · TBC · Банковский перевод.',
    feature2Title: '100% возврат средств',
    feature2Desc:
      'Неиспользованный баланс полностью возвращается по первому запросу.',
    feature3Title: 'Зачисление 1:1 без комиссии',
    feature3Desc:
      '0% комиссия — каждый 1 ₾ идет напрямую на продвижение вашего объекта.',
    quickAmounts: 'Быстрый выбор',
    starterBadge: 'Старт',
    recommendedBadge: 'Рекомендуем 🔥',
    popularBadge: 'Популярный',
    customAmountLabel: 'Другая сумма',
    anyWord: 'Любая',
    daySingular: 'день',
    dayPlural: 'дн.',
    creditedToBalance: 'зачисляется на баланс',
    zeroFeeBadge: '0% комиссия',
    instantCreditBadge: 'Зачисление 1:1',
    upsellAdvice: (target, discount, days) =>
      `Совет: пополнение на ${target} ₾ открывает скидку ${discount} на пакет SUPER VIP (${days} дн.)`,
    topUpToBtn: (target) => `Пополнить ${target} ₾`,
    unitCodePlaceholder:
      'Код вашего объекта (необязательно — для быстрой активации)',
    neverExpires: 'Без срока действия',
    fullyRefundable: '100% возврат',
    payWithCardBtn: (amt) => `Оплатить ${amt} ₾ картой`,
    bankTransferBtn: (amt) => `Банковский перевод ${amt} ₾`,
    boostRecordedMsg: (tier, amt, days, code) =>
      `Заявка на продвижение (${tier} — ${amt} ₾ на ${days} дн.)${code ? ` для объекта ${code}` : ''} сохранена и будет активирована после проверки оплаты.`,
    coversLabel: (tier, days) =>
      `Покрывает пакет ${tier} на ${days} ${days === 1 ? 'день' : 'дн.'}`,
  },
  ka: {
    bannerBadge: 'პრემიუმ განთავსება · AQAR EXIT',
    bannerTitle: 'გსურთ უფრო სწრაფად გაყიდოთ ქონება ან პროექტი?',
    bannerDesc:
      'განათავსეთ თქვენი ობიექტი მთავარი გვერდის სათავეში ათასობით რეალური მყიდველისა და ინვესტორის წინაშე.',
    bannerPill1: 'ტოპ პოზიცია მთავარ გვერდზე',
    bannerPill2: 'პირდაპირი მყიდველები',
    bannerPill3: 'მყისიერი აქტივაცია',
    bannerBtn: 'აირჩიეთ რეკლამის პაკეტი →',
    devBadge: 'საუკეთესო დეველოპერები',
    devTitle: 'წამყვანი სამშენებლო კომპანიები',
    devSub: 'რეიტინგი აქტიური განცხადებებით — ნახეთ პროექტები და ბინები',
    devAllBtn: 'ყველა დეველოპერი (1399) →',
    devProjectsWord: 'პროექტი',
    devActiveWord: 'აქტიური',
    devProjectsLink: 'პროექტები →',
    tbilisi: 'თბილისი',
    batumi: 'ბათუმი',
    walletBadge: 'ბალანსი და რეკლამირება',
    walletTitlePrefix: 'შეავსეთ ბალანსი',
    walletTitleAccent: 'ნებისმიერი თანხით',
    walletDesc:
      'გაააქტიურეთ SUPER VIP და VIP+ პაკეტები. გადახდისა და ადმინისტრაციის დადასტურებისთანავე სტატუსი ჩაირთვება ავტომატურად.',
    feature1Title: 'ყველა გადახდის მეთოდი',
    feature1Desc:
      'Apple Pay · Mastercard · Visa · BOG · TBC · საბანკო გადარიცხვა.',
    feature2Title: '100% დაბრუნებადი',
    feature2Desc:
      'გამოუყენებელი ბალანსი სრულად ბრუნდება მოთხოვნისთანავე.',
    feature3Title: 'მყისიერი 1:1 ჩარიცხვა',
    feature3Desc:
      '0% საკომისიო — ყოველი 1 ₾ პირდაპირ ხმარდება თქვენი განცხადების წინ წაწევას.',
    quickAmounts: 'სწრაფი თანხები',
    starterBadge: 'სტარტი',
    recommendedBadge: 'რეკომენდებული 🔥',
    popularBadge: 'პოპულარული',
    customAmountLabel: 'სხვა თანხა',
    anyWord: 'სხვა',
    daySingular: 'დღე',
    dayPlural: 'დღე',
    creditedToBalance: 'დაირიცხება თქვენს ბალანსზე',
    zeroFeeBadge: '0% საკომისიო',
    instantCreditBadge: '1:1 ჩარიცხვა',
    upsellAdvice: (target, discount, days) =>
      `რჩევა: ${target} ₾-ით შევსება ხსნის ${discount} ფასდაკლებას SUPER VIP პაკეტზე (${days} დღე)`,
    topUpToBtn: (target) => `შეავსეთ ${target} ₾-მდე`,
    unitCodePlaceholder:
      'განცხადების კოდი (არასავალდებულო — სწრაფი აქტივაციისთვის)',
    neverExpires: 'უვადო ბალანსი',
    fullyRefundable: '100% დაბრუნებადი',
    payWithCardBtn: (amt) => `გადაიხადეთ ${amt} ₾ ბარათით`,
    bankTransferBtn: (amt) => `საბანკო გადარიცხვა ${amt} ₾`,
    boostRecordedMsg: (tier, amt, days, code) =>
      `მოთხოვნა (${tier} — ${amt} ₾, ${days} დღე)${code ? ` ობიექტზე ${code}` : ''} მიღებულია და ჩაირთვება გადახდის დადასტურებისთანავე.`,
    coversLabel: (tier, days) => `ფარავს ${tier} პაკეტს ${days} დღით`,
  },
}

export function calculateGelBoostPackage(
  amount: number,
  localeOrIsAr: LocaleCode | boolean
) {
  const lang: LocaleCode =
    typeof localeOrIsAr === 'boolean'
      ? localeOrIsAr
        ? 'ar'
        : 'en'
      : ['ar', 'en', 'ru', 'ka'].includes(localeOrIsAr)
        ? localeOrIsAr
        : 'en'

  const mT = MARKET_SECTIONS_I18N[lang] || MARKET_SECTIONS_I18N.ar
  const cleanAmt = Math.max(5, Math.round(amount || 5))

  let tier: 'VIP+' | 'SUPER VIP' = cleanAmt < 10 ? 'VIP+' : 'SUPER VIP'
  let days = 1
  let discountBadge = ''
  let upsellTarget = 60
  let upsellDiscount = '-25%'
  let upsellDays = 10

  if (cleanAmt < 10) {
    tier = 'VIP+'
    days = Math.max(1, Math.floor(cleanAmt / 5))
  } else if (cleanAmt < 20) {
    tier = 'SUPER VIP'
    days = Math.max(1, Math.floor(cleanAmt / 10))
  } else if (cleanAmt < 50) {
    tier = 'SUPER VIP'
    days = Math.max(2, Math.floor(cleanAmt / 10))
  } else if (cleanAmt < 60) {
    tier = 'SUPER VIP'
    days = 7
  } else if (cleanAmt < 100) {
    tier = 'SUPER VIP'
    days = Math.max(10, Math.round(cleanAmt / 6))
    discountBadge = '-25%'
    upsellTarget = 100
    upsellDiscount = '-30%'
    upsellDays = 17
  } else if (cleanAmt < 200) {
    tier = 'SUPER VIP'
    days = Math.max(17, Math.round(cleanAmt / 5.88))
    discountBadge = '-30%'
    upsellTarget = 200
    upsellDiscount = '-33%'
    upsellDays = 30
  } else {
    tier = 'SUPER VIP'
    days = Math.max(30, Math.round(cleanAmt / 6.6))
    discountBadge = '-33%'
    upsellTarget = 0
  }

  return {
    amount: cleanAmt,
    tier,
    days,
    discountBadge,
    upsellTarget,
    upsellDiscount,
    upsellDays,
    coverLabel: mT.coversLabel(tier, days),
  }
}

export function SponsoredRightAlignedBanner() {
  const { locale } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const mT = MARKET_SECTIONS_I18N[activeLocale] || MARKET_SECTIONS_I18N.ar

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="aqar-wave-banner rounded-[30px] border border-amber-400/20 bg-gradient-to-r from-[#0d2b26] via-[#132a4a] to-[#2d1b4e] p-8 text-center text-white shadow-xl transition duration-300 hover:shadow-2xl sm:p-12">
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
            <span className="inline-block rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-1 text-[11px] font-bold text-amber-300">
              ✦ {mT.bannerBadge}
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-4xl">
              {mT.bannerTitle}
            </h2>
            <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-white/80 sm:text-sm">
              {mT.bannerDesc}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[mT.bannerPill1, mT.bannerPill2, mT.bannerPill3].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-white/90"
                >
                  <span className="me-1 text-[#2ee59d]">•</span>
                  {pill}
                </span>
              ))}
            </div>
            <Link
              href="#boost-packages-section"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-8 text-xs font-bold text-white shadow-lg transition hover:scale-105 hover:opacity-95 sm:text-sm"
            >
              <span>{mT.bannerBtn}</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

export function LeadingDevelopersSection({
  realUnitCount: _realUnitCount = 0,
}: {
  realUnitCount?: number
}) {
  const { locale } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const mT = MARKET_SECTIONS_I18N[activeLocale] || MARKET_SECTIONS_I18N.ar
  const isAr = activeLocale === 'ar'

  const topDevelopers = [
    {
      rank: 1,
      name: isAr ? 'آرتشي' : 'Archi',
      nameEn: 'Archi',
      city: mT.tbilisi,
      projectsCount: 55,
      activeCount: 33,
      logoType: 'archi',
    },
    {
      rank: 2,
      name: isAr ? 'أركون للتطوير' : 'Arcon Development',
      nameEn: 'Arcon',
      city: mT.tbilisi,
      projectsCount: 18,
      activeCount: 23,
      logoType: 'arcon',
    },
    {
      rank: 3,
      name: isAr ? 'مجموعة أوربي' : 'ORBI Group',
      nameEn: 'ORBI Group',
      city: mT.batumi,
      projectsCount: 30,
      activeCount: 18,
      logoType: 'orbi',
    },
    {
      rank: 4,
      name: isAr ? 'نكست جروب' : 'NEXT Group',
      nameEn: 'NEXT Group',
      city: mT.tbilisi,
      projectsCount: 65,
      activeCount: 17,
      logoType: 'next',
    },
    {
      rank: 5,
      name: isAr ? 'إم سكوير' : 'm² Real Estate',
      nameEn: 'm²',
      city: mT.tbilisi,
      projectsCount: 28,
      activeCount: 14,
      logoType: 'm2',
    },
  ]

  const renderDeveloperLogo = (type: string) => {
    if (type === 'archi') {
      return (
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#009fe3] text-white shadow-2xs">
          <svg viewBox="0 0 24 24" className="size-6" fill="none">
            <path
              d="M6 19L12 5L18 19M9 14H15"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )
    }
    if (type === 'arcon') {
      return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="rounded border-2 border-[#e11d48] px-1.5 py-0.5 text-[11px] font-black tracking-tighter text-[#0f1d40]">
            MG
          </span>
        </div>
      )
    }
    if (type === 'orbi') {
      return (
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/70 text-[#15803d] shadow-2xs">
          <Building2 className="size-5" />
          <span className="mt-0.5 text-[7px] font-black uppercase">ORBI</span>
        </div>
      )
    }
    if (type === 'next') {
      return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] font-black tracking-wider text-[#0f1d40]">
            NEXT
          </span>
        </div>
      )
    }
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1e293b] text-amber-400 shadow-2xs">
        <span className="text-sm font-black">m²</span>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold text-[#2563eb]">
              🏢 {mT.devBadge}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
              {mT.devTitle}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {mT.devSub}
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
          >
            {mT.devAllBtn}
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 no-scrollbar lg:grid lg:grid-cols-5 lg:overflow-visible">
          {topDevelopers.map((dev) => (
            <Link
              key={dev.name}
              href={`/opportunities?q=${encodeURIComponent(dev.nameEn)}`}
              className="sivrce-card flex w-[250px] shrink-0 snap-start flex-col justify-between rounded-[22px] border border-slate-200/85 bg-white p-4 text-start shadow-2xs lg:w-auto"
            >
              <div className="flex items-center gap-3.5">
                {renderDeveloperLogo(dev.logoType)}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <strong className="truncate text-sm font-bold text-[#0f1d40]">
                      {dev.name}
                    </strong>
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#2563eb]">
                      {dev.rank}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-[11px] font-medium text-slate-400">
                    {dev.city} · {dev.projectsCount} {mT.devProjectsWord}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                <span className="text-slate-500">
                  {dev.activeCount} {mT.devActiveWord}
                </span>
                <span className="text-[#2563eb]">{mT.devProjectsLink}</span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </section>
  )
}

export function TopUpBalanceGelSection() {
  const { locale, siteSettings } = useTranslation() as Record<string, any>
  const activeLocale = (locale as LocaleCode) || 'ar'
  const mT = MARKET_SECTIONS_I18N[activeLocale] || MARKET_SECTIONS_I18N.ar
  const GEL = '₾'

  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(10)
  const [topUpAmount, setTopUpAmount] = useState<number>(10)
  const [unitCodeInput, setUnitCodeInput] = useState<string>('')
  const [submittingBoost, setSubmittingBoost] = useState(false)
  const [boostNotice, setBoostNotice] = useState<string | null>(null)

  const pkgDetails = useMemo(
    () => calculateGelBoostPackage(topUpAmount, activeLocale),
    [topUpAmount, activeLocale]
  )

  const presets = [
    {
      id: 5,
      val: 5,
      topBadge: mT.starterBadge,
      subText: `VIP+ · 1 ${mT.daySingular}`,
    },
    {
      id: 10,
      val: 10,
      topBadge: mT.recommendedBadge,
      subText: 'SUPER VIP',
      isRecommended: true,
    },
    {
      id: 20,
      val: 20,
      topBadge: '',
      subText: 'SUPER VIP',
    },
    {
      id: 50,
      val: 50,
      topBadge: mT.popularBadge,
      subText: 'SUPER VIP',
    },
    {
      id: 100,
      val: 100,
      topBadge: 'PRO -30%',
      subText: 'SUPER VIP',
    },
    {
      id: 'custom' as const,
      val: 0,
      topBadge: mT.customAmountLabel,
      subText: mT.anyWord,
    },
  ]

  const handleProceedToPayment = async (method: 'card' | 'bank') => {
    setSubmittingBoost(true)
    setBoostNotice(null)

    const res = await createBoostRequestAction({
      amountGel: pkgDetails.amount,
      packageTier: pkgDetails.tier,
      durationDays: pkgDetails.days,
      paymentMethod: method,
      unitCode: unitCodeInput.trim() || undefined,
    })

    setSubmittingBoost(false)

    const configuredPaymentUrl =
      res?.paymentUrl ||
      siteSettings?.boostPaymentUrl ||
      process.env.NEXT_PUBLIC_BOOST_PAYMENT_URL ||
      ''

    if (configuredPaymentUrl) {
      const sep = configuredPaymentUrl.includes('?') ? '&' : '?'
      window.open(
        `${configuredPaymentUrl}${sep}amount=${pkgDetails.amount}&currency=GEL&tier=${encodeURIComponent(pkgDetails.tier)}&days=${pkgDetails.days}&reqId=${encodeURIComponent(res?.boostRequestId || '')}`,
        '_blank'
      )
    }

    setBoostNotice(
      mT.boostRecordedMsg(
        pkgDetails.tier,
        pkgDetails.amount,
        pkgDetails.days,
        res?.unitCode || undefined
      )
    )
  }

  return (
    <section
      id="boost-packages-section"
      className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8"
    >
      <ScrollReveal>
        <div className="grid grid-cols-1 items-center gap-10 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-10 lg:grid-cols-12">
          <div className="text-start lg:col-span-7">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#2563eb]">
              ✦ {mT.walletBadge}
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-[#0f1d40] sm:text-4xl">
              {mT.walletTitlePrefix}{' '}
              <span className="text-[#2563eb]">{mT.walletTitleAccent}</span>
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {mT.walletDesc}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-orange-50 text-[#ff6437]">
                  <CreditCard className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {mT.feature1Title}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {mT.feature1Desc}
                </p>
              </div>

              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#007a5a]">
                  <Check className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {mT.feature2Title}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {mT.feature2Desc}
                </p>
              </div>

              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Sparkles className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {mT.feature3Title}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {mT.feature3Desc}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 text-start shadow-md sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#ff6437]">
                1:1 ⚡
              </span>
              <div className="flex items-center gap-2.5">
                <div className="text-end">
                  <strong className="block text-xs font-bold text-[#0f1d40]">
                    {mT.quickAmounts}
                  </strong>
                  <span dir="ltr" className="text-[10px] text-slate-400">
                    Min 5 {GEL} · Max 10,000 {GEL}
                  </span>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Wallet className="size-4" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {presets.map((item) => {
                const isActive =
                  item.id === 'custom'
                    ? selectedPreset === 'custom'
                    : selectedPreset === item.val && topUpAmount === item.val

                return (
                  <button
                    key={String(item.id)}
                    type="button"
                    onClick={() => {
                      if (item.id === 'custom') {
                        setSelectedPreset('custom')
                      } else {
                        setSelectedPreset(item.val)
                        setTopUpAmount(item.val)
                      }
                      setBoostNotice(null)
                    }}
                    className={`relative flex min-h-[68px] flex-col items-center justify-center rounded-2xl border px-1.5 py-2 text-center transition ${
                      isActive
                        ? 'border-2 border-[#2563eb] bg-blue-50/40 text-[#0f1d40] shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.topBadge && (
                      <span
                        className={`-mt-1 mb-1 max-w-full truncate rounded-full px-1.5 py-0.5 text-[7.5px] font-bold ${
                          item.isRecommended
                            ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-2xs'
                            : isActive
                              ? 'text-[#2563eb]'
                              : 'text-slate-400'
                        }`}
                      >
                        {item.topBadge}
                      </span>
                    )}

                    <strong dir="ltr" className="text-xs font-bold sm:text-sm">
                      {item.id === 'custom' ? '...' : `${item.val} ${GEL}`}
                    </strong>
                    <span className="mt-0.5 text-[8.5px] font-semibold text-slate-400">
                      {item.subText}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-end text-[11px] font-semibold text-slate-500">
                {mT.customAmountLabel}
              </span>
              <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom')
                      setTopUpAmount((prev) => Math.min(10000, prev + 5))
                    }}
                    className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    {GEL}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset(10)
                      setTopUpAmount(10)
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                    title="Reset"
                  >
                    ×
                  </button>
                </div>

                <input
                  type="number"
                  dir="ltr"
                  value={topUpAmount}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setTopUpAmount(Math.max(5, Number(e.target.value) || 5))
                  }}
                  className="w-full bg-transparent text-center text-base font-bold text-[#0f1d40] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('custom')
                    setTopUpAmount((prev) => Math.max(5, prev - 5))
                  }}
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  -
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f5f8ff] p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-100/80 text-[#2563eb]">
                  <Zap className="size-4" />
                </span>
                <div className="text-end">
                  <strong
                    dir="ltr"
                    className="block text-xs font-bold text-[#0f1d40] sm:text-sm"
                  >
                    {pkgDetails.amount} {GEL} {mT.creditedToBalance}
                  </strong>
                  <span className="mt-0.5 block text-[11px] font-bold text-[#2563eb]">
                    {pkgDetails.coverLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                  ✓ {mT.zeroFeeBadge}
                </span>
                <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                  ✓ {mT.instantCreditBadge}
                </span>
              </div>

              {pkgDetails.upsellTarget > 0 && (
                <div className="mt-3 border-t border-blue-200/60 pt-3 text-end">
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {mT.upsellAdvice(
                      pkgDetails.upsellTarget,
                      pkgDetails.upsellDiscount,
                      pkgDetails.upsellDays
                    )}{' '}
                    ✨
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom')
                      setTopUpAmount(pkgDetails.upsellTarget)
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-2xs transition hover:opacity-95"
                  >
                    <span>{mT.topUpToBtn(pkgDetails.upsellTarget)}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={unitCodeInput}
                onChange={(e) => setUnitCodeInput(e.target.value)}
                placeholder={mT.unitCodePlaceholder}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-[#0f1d40] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-1 text-[10.5px] font-semibold text-slate-500">
              <span>⚡ {mT.zeroFeeBadge}</span>
              <span>✓ {mT.neverExpires}</span>
              <span>🛡️ {mT.fullyRefundable}</span>
            </div>

            <button
              type="button"
              disabled={submittingBoost}
              onClick={() => handleProceedToPayment('card')}
              className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,100,55,0.3)] transition hover:opacity-95 disabled:opacity-60 sm:text-sm"
            >
              <CreditCard className="size-4" />
              <span>{mT.payWithCardBtn(pkgDetails.amount)}</span>
            </button>

            <button
              type="button"
              disabled={submittingBoost}
              onClick={() => handleProceedToPayment('bank')}
              className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#0f1d40] transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Landmark className="size-3.5 text-slate-500" />
              <span>{mT.bankTransferBtn(pkgDetails.amount)}</span>
            </button>

            {boostNotice && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#eaf8f2] p-3 text-xs font-semibold text-[#007a5a]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{boostNotice}</span>
              </div>
            )}

            <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400">
              <span>Visa · Mastercard · Apple Pay · TBC · BOG</span>
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" /> 256-bit SSL
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}