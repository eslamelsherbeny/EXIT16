"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, Info } from "lucide-react"
import { useTranslation, getCurrencySymbol, type LocaleCode } from "@/lib/i18n"

function formatNumberInput(val: string) {
  const digits = val.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("en-US")
}

function parseNumberInput(val: string) {
  return Number(val.replace(/,/g, "")) || 0
}

const CALC_FALLBACK_I18N: Record<LocaleCode, Record<string, string>> = {
  ar: {
    title: "حاسبة الخروج والمكسب الفوري",
    subtitle:
      "احسب بدقة الفرق بين فسخ العقد مع المطور وبين التنازل المباشر عبر المنصة بدون أوفر",
    ownerTab: "أنا مالك (عايز أبيع)",
    buyerTab: "أنا مشتري (عايز أشتري)",
    contractPriceLabel: "إجمالي سعر العقد الأصلي مع المطور",
    contractPriceHint: "السعر الإجمالي المكتوب في عقد شراء الوحدة",
    paidSoFarLabel: "إجمالي المبلغ المدفوع حتى الآن",
    paidSoFarHint: "مجموع الدفعة المقدمة والأقساط المسددة للمطور",
    yearsPaidLabel: "عدد السنوات المنقضية من العقد",
    yearsPaidHint: "المدة التي دفعت فيها الأقساط حتى اليوم",
    yearUnit: "سنة",
    yearsWord: "سنوات",
    calcOwnerBtn: "احسب موقفي الآن",
    devPriceTodayLabel: "سعر نفس الوحدة عند المطور اليوم",
    devPriceTodayHint: "سعر السوق أو المطور الحالي لنفس المساحة والمشروع",
    oldContractPriceLabel: "إجمالي سعر العقد المعروض للتنازل",
    oldContractPriceHint: "السعر الأصلي في عقد المالك الحالي",
    calcBuyerBtn: "احسب مكسبي الفوري",
    ownerEmptyPrompt:
      "أدخل سعر العقد والمبلغ المدفوع على اليمين لمقارنة الفسخ مع التنازل المباشر",
    buyerEmptyPrompt:
      "أدخل سعر المطور اليوم وسعر العقد المعروض لحساب صافي مكسبك الفوري",
    lossAlertTitle: "تنبيه مهم قبل فسخ العقد مع المطور",
    lossAlertPrefix: "فسخ العقد المباشر قد يعرضك لخصم يصل إلى",
    lossAlertMiddle: "بالإضافة للانتظار حوالي",
    cancelScenarioTitle: "البديل الأول: فسخ العقد مع شركة التطوير",
    expectedPenaltyLabel: "الخصم المتوقع من المطور (غرامة الفسخ)",
    penaltyBasisHint: "تُحسب كنسبة من إجمالي سعر العقد الأصلي",
    refundedAmountLabel: "الصافي الذي سيسترده المالك بعد الخصم",
    expectedDurationLabel: "المدة المتوقعة لاسترداد المبلغ من المطور",
    aroundWord: "حوالي",
    sameDurationSuffix: "(أو حتى إعادة بيع الوحدة بمعرفة المطور)",
    assignScenarioTitle: "البديل الثاني: التنازل المباشر عبر DualDealz",
    recoveredViaAssignLabel: "المبلغ المسترد كاش في يدك عبر المنصة",
    recoveredViaAssignHint: "تسترد كامل مدفوعاتك كاش بدون خصم غرامة الفسخ",
    commissionLabel: "عمولة المنصة على البائع",
    netDiffInFavorLabel: "صافي التوفير لصالحك مقارنة بفسخ العقد",
    estimateBadge: "تقديري",
    estimateNote: "الأرقام تقريبية وفق متوسط شروط عقود المطورين في جورجيا",
    requestFreeReportBtn: "اعرض وحدتك للتنازل الآن مجاناً ←",
    requestFreeReportSub: "عمولة 0% على البائع — مراجعة وتوثيق العقود مجاناً",
    dayOneGainLabel: "صافي مكسبك الفوري من اليوم الأول",
    dayOneGainSub: "بعد خصم عمولة المنصة على المشتري",
    registerViewOppsBtn: "تصفح الفرص المتاحة بهذه الميزانية ←",
    disclaimer:
      "* هذه الحاسبة استرشادية وتعتمد على النسب المعتادة في عقود شركات التطوير العقاري في جورجيا.",
    millionWord: "مليون",
    thousandWord: "ألف",
    paidExceedsContractError:
      "المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي سعر العقد الأصلي.",
  },
  en: {
    title: "Exit & Instant Gain Calculator",
    subtitle:
      "Compare cancelling your contract with the developer vs. direct exit takeover via DualDealz",
    ownerTab: "I'm an Owner (Selling)",
    buyerTab: "I'm a Buyer (Buying)",
    contractPriceLabel: "Original Total Contract Price",
    contractPriceHint: "Total unit price stated in your developer contract",
    paidSoFarLabel: "Total Amount Paid So Far",
    paidSoFarHint: "Down payment plus installments paid to the developer",
    yearsPaidLabel: "Years Elapsed Since Contract",
    yearsPaidHint: "How many years you have been paying installments",
    yearUnit: "yr",
    yearsWord: "years",
    calcOwnerBtn: "Calculate My Position",
    devPriceTodayLabel: "Developer Price Today for Same Unit",
    devPriceTodayHint: "Current developer or market price for the same unit",
    oldContractPriceLabel: "Original Contract Price Offered for Exit",
    oldContractPriceHint: "Original contract total of the unit you are buying",
    calcBuyerBtn: "Calculate Instant Gain",
    ownerEmptyPrompt:
      "Enter your contract price and paid amount to compare cancellation vs. direct exit",
    buyerEmptyPrompt:
      "Enter today's developer price and the exit contract price to calculate your net gain",
    lossAlertTitle: "Important Notice Before Cancelling with Developer",
    lossAlertPrefix: "Direct contract cancellation can cost you up to",
    lossAlertMiddle: "plus a waiting period of around",
    cancelScenarioTitle: "Option 1: Cancel Contract with Developer",
    expectedPenaltyLabel: "Expected Developer Penalty",
    penaltyBasisHint: "Calculated as a percentage of total contract price",
    refundedAmountLabel: "Net Amount Refunded After Penalty",
    expectedDurationLabel: "Expected Refund Waiting Time",
    aroundWord: "Around",
    sameDurationSuffix: "(or until developer resells the unit)",
    assignScenarioTitle: "Option 2: Direct Exit via DualDealz",
    recoveredViaAssignLabel: "Cash Recovered in Hand via Platform",
    recoveredViaAssignHint: "Recover 100% of your paid cash without cancellation penalties",
    commissionLabel: "Platform Fee for Seller",
    netDiffInFavorLabel: "Net Savings in Your Favor vs. Cancellation",
    estimateBadge: "Estimate",
    estimateNote: "Figures are based on standard developer contract terms in Georgia",
    requestFreeReportBtn: "List Your Unit for Exit Now (Free) →",
    requestFreeReportSub: "0% seller commission — free contract verification",
    dayOneGainLabel: "Your Net Instant Gain from Day One",
    dayOneGainSub: "After deducting buyer platform commission",
    registerViewOppsBtn: "Browse Opportunities with This Budget →",
    disclaimer:
      "* This calculator is indicative and based on standard real estate developer terms in Georgia.",
    millionWord: "Million",
    thousandWord: "K",
    paidExceedsContractError:
      "Paid amount cannot exceed the original total contract price.",
  },
  ru: {
    title: "Калькулятор переуступки и выгоды",
    subtitle:
      "Сравните расторжение договора с застройщиком и прямую переуступку через DualDealz",
    ownerTab: "Я собственник (Продать)",
    buyerTab: "Я покупатель (Купить)",
    contractPriceLabel: "Полная стоимость по договору с застройщиком",
    contractPriceHint: "Общая стоимость объекта, указанная в вашем договоре",
    paidSoFarLabel: "Выплаченная сумма на сегодняшний день",
    paidSoFarHint: "Первоначальный взнос + выплаченные платежи по рассрочке",
    yearsPaidLabel: "Сколько лет вы платите рассрочку",
    yearsPaidHint: "Период с момента заключения договора",
    yearUnit: "г.",
    yearsWord: "лет",
    calcOwnerBtn: "Рассчитать результат",
    devPriceTodayLabel: "Цена такого объекта у застройщика сегодня",
    devPriceTodayHint: "Текущая рыночная цена аналогичной квартиры в проекте",
    oldContractPriceLabel: "Цена договора по переуступке",
    oldContractPriceHint: "Исходная цена в договоре текущего собственника",
    calcBuyerBtn: "Рассчитать мою выгоду",
    ownerEmptyPrompt:
      "Введите цену договора и выплаченную сумму для сравнения расторжения и переуступки",
    buyerEmptyPrompt:
      "Введите текущую цену застройщика и цену договора для расчета чистой выгоды",
    lossAlertTitle: "Важно знать перед расторжением договора",
    lossAlertPrefix: "При расторжении договора штраф застройщика составит до",
    lossAlertMiddle: "а возврат средств займет около",
    cancelScenarioTitle: "Вариант 1: Расторжение договора с застройщиком",
    expectedPenaltyLabel: "Штраф застройщика при расторжении",
    penaltyBasisHint: "Рассчитывается как процент от полной стоимости договора",
    refundedAmountLabel: "Сумма к возврату после вычета штрафа",
    expectedDurationLabel: "Ожидаемый срок возврата средств",
    aroundWord: "Около",
    sameDurationSuffix: "(или до перепродажи квартиры застройщиком)",
    assignScenarioTitle: "Вариант 2: Прямая переуступка через DualDealz",
    recoveredViaAssignLabel: "Сумма на руки через платформу",
    recoveredViaAssignHint: "Вы возвращаете 100% выплаченных средств без штрафа застройщика",
    commissionLabel: "Комиссия платформы для продавца",
    netDiffInFavorLabel: "Чистая выгода в вашу пользу",
    estimateBadge: "Расчет",
    estimateNote: "Показатели основаны на стандартных договорах застройщиков Грузии",
    requestFreeReportBtn: "Разместить объект на продажу бесплатно →",
    requestFreeReportSub: "0% комиссия для продавца — бесплатная проверка договора",
    dayOneGainLabel: "Ваша чистая выгода с первого дня",
    dayOneGainSub: "После вычета комиссии платформы для покупателя",
    registerViewOppsBtn: "Смотреть объекты в этом бюджете →",
    disclaimer:
      "* Расчет носит ознакомительный характер и основан на стандартных условиях застройщиков Грузии.",
    millionWord: "млн",
    thousandWord: "тыс.",
    paidExceedsContractError:
      "Выплаченная сумма не может превышать полную стоимость договора.",
  },
  ka: {
    title: "გადაბარების და სარგებლის კალკულატორი",
    subtitle:
      "შეადარეთ ხელშეკრულების გაუქმება დეველოპერთან და პირდაპირი გადაბარება DualDealz-ით",
    ownerTab: "მესაკუთრე ვარ (გაყიდვა)",
    buyerTab: "მყიდველი ვარ (ყიდვა)",
    contractPriceLabel: "ხელშეკრულების სრული საწყისი ფასი",
    contractPriceHint: "ბინის სრული ღირებულება დეველოპერის კონტრაქტით",
    paidSoFarLabel: "დღემდე გადახდილი თანხა",
    paidSoFarHint: "პირველადი შენატანი და გადახდილი განვადება",
    yearsPaidLabel: "რამდენი წელია იხდით განვადებას",
    yearsPaidHint: "ხელშეკრულების გაფორმებიდან გასული პერიოდი",
    yearUnit: "წ.",
    yearsWord: "წელი",
    calcOwnerBtn: "შედეგის გამოთვლა",
    devPriceTodayLabel: "დეველოპერის მიმდინარე ფასი დღეს",
    devPriceTodayHint: "ამავე ბინის დღევანდელი საბაზრო ფასი",
    oldContractPriceLabel: "გადასაბარებელი კონტრაქტის ფასი",
    oldContractPriceHint: "მესაკუთრის თავდაპირველი კონტრაქტის ფასი",
    calcBuyerBtn: "სარგებლის გამოთვლა",
    ownerEmptyPrompt:
      "შეიყვანეთ კონტრაქტის ფასი და გადახდილი თანხა შედეგის სანახავად",
    buyerEmptyPrompt:
      "შეიყვანეთ დეველოპერის დღევანდელი ფასი და კონტრაქტის ფასი მოგების გამოსათვლელად",
    lossAlertTitle: "მნიშვნელოვანი გაფრთხილება კონტრაქტის გაუქმებამდე",
    lossAlertPrefix: "კონტრაქტის გაუქმებისას ჯარიმა შეადგენს",
    lossAlertMiddle: "ხოლო თანხის დაბრუნებას დასჭირდება დაახლოებით",
    cancelScenarioTitle: "ვარიანტი 1: კონტრაქტის გაუქმება დეველოპერთან",
    expectedPenaltyLabel: "მოსალოდნელი ჯარიმა დეველოპერისგან",
    penaltyBasisHint: "გამოითვლება კონტრაქტის სრული ღირებულებიდან",
    refundedAmountLabel: "დასაბრუნებელი თანხა ჯარიმის გამოკლებით",
    expectedDurationLabel: "თანხის დაბრუნების სავარაუდო ვადა",
    aroundWord: "დაახლოებით",
    sameDurationSuffix: "(ან ბინის ხელახლა გაყიდვამდე)",
    assignScenarioTitle: "ვარიანტი 2: პირდაპირი გადაბარება DualDealz-ით",
    recoveredViaAssignLabel: "ხელზე მისაღები თანხა პლატფორმით",
    recoveredViaAssignHint: "იბრუნებთ გადახდილ თანხას სრულად ჯარიმის გარეშე",
    commissionLabel: "პლატფორმის საკომისიო გამყიდველისთვის",
    netDiffInFavorLabel: "სუფთა დანაზოგი თქვენს სასარგებლოდ",
    estimateBadge: "სავარაუდო",
    estimateNote: "მონაცემები ეფუძნება საქართველოს დეველოპერების სტანდარტულ პირობებს",
    requestFreeReportBtn: "განათავსეთ ქონება უფასოდ →",
    requestFreeReportSub: "0% საკომისიო გამყიდველისთვის — უფასო შემოწმება",
    dayOneGainLabel: "თქვენი სუფთა მოგება პირველივე დღიდან",
    dayOneGainSub: "მყიდველის საკომისიოს გამოკლების შემდეგ",
    registerViewOppsBtn: "ნახეთ შეთავაზებები ამ ბიუჯეტით →",
    disclaimer:
      "* კალკულატორი საორიენტაციოა და ეფუძნება საქართველოს სამშენებლო კომპანიების პირობებს.",
    millionWord: "მლნ",
    thousandWord: "ათასი",
    paidExceedsContractError:
      "გადახდილი თანხა არ შეიძლება აღემატებოდეს კონტრაქტის სრულ ფასს.",
  },
}

export default function CalculatorPage() {
  const { t: dict, locale, dir, siteSettings } = useTranslation()
  const activeLocale = (locale as LocaleCode) || "ar"
  const cur = getCurrencySymbol("GE", activeLocale)

  const baseT = CALC_FALLBACK_I18N[activeLocale] || CALC_FALLBACK_I18N.ar
  const dictT = ((dict as Record<string, any>).calculatorPage || {}) as Record<
    string,
    string
  >
  const t = { ...baseT, ...dictT }

  // قراءة نسب الخصم والعمولة ديناميكياً من إعدادات الأدمن
  const rawMinPenaltyPct = Number(
    (siteSettings as Record<string, any>)?.developerPenaltyMin
  )
  const rawMaxPenaltyPct = Number(
    (siteSettings as Record<string, any>)?.developerPenaltyMax
  )
  const rawCommissionPct = Number(siteSettings?.buyerCommission)

  const minPenaltyPct =
    Number.isFinite(rawMinPenaltyPct) && rawMinPenaltyPct > 0
      ? rawMinPenaltyPct
      : 10
  const maxPenaltyPct =
    Number.isFinite(rawMaxPenaltyPct) && rawMaxPenaltyPct >= minPenaltyPct
      ? rawMaxPenaltyPct
      : Math.max(minPenaltyPct, 15)
  const commissionPct =
    Number.isFinite(rawCommissionPct) && rawCommissionPct >= 0
      ? rawCommissionPct
      : 1.25

  function getAmountHint(num: number) {
    if (!num || num < 10000) return null
    if (num >= 1_000_000) {
      const m = +(num / 1_000_000).toFixed(2)
      return `${m} ${t.millionWord} ${cur}`
    }
    const k = Math.round(num / 1000)
    return `${k} ${t.thousandWord} ${cur}`
  }

  const [mode, setMode] = useState<"seller" | "buyer">("seller")

  const [contractPriceStr, setContractPriceStr] = useState("")
  const [paidAmountStr, setPaidAmountStr] = useState("")
  const [yearsPaidStr, setYearsPaidStr] = useState("")
  const [sellerCalculated, setSellerCalculated] = useState(false)

  const [developerTodayStr, setDeveloperTodayStr] = useState("")
  const [oldContractStr, setOldContractStr] = useState("")
  const [buyerCalculated, setBuyerCalculated] = useState(false)

  const contractPrice = parseNumberInput(contractPriceStr)
  const paidAmount = parseNumberInput(paidAmountStr)
  const yearsPaid = Number(yearsPaidStr) || 2

  const developerToday = parseNumberInput(developerTodayStr)
  const oldContract = parseNumberInput(oldContractStr)

  const isPaidExceedingContract =
    contractPrice > 0 && paidAmount > contractPrice

  const minPenalty = Math.round(contractPrice * (minPenaltyPct / 100))
  const maxPenalty = Math.round(contractPrice * (maxPenaltyPct / 100))
  const minRefund = Math.max(0, paidAmount - maxPenalty)
  const maxRefund = Math.max(0, paidAmount - minPenalty)

  const rawDiff = Math.max(0, developerToday - oldContract)
  const buyerCommission = Math.round(oldContract * (commissionPct / 100))
  const netBuyerGain = Math.max(0, rawDiff - buyerCommission)

  const canCalcSeller =
    contractPrice > 0 && paidAmount > 0 && !isPaidExceedingContract
  const canCalcBuyer = developerToday > 0 && oldContract > 0

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[#f5f6f8] py-10 text-[#0a1122] sm:py-16"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-[#0a1122] sm:text-4xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
            {t.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-7 grid max-w-[420px] grid-cols-2 rounded-2xl border border-gray-200/90 bg-white p-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setMode("seller")}
            className={`rounded-xl py-3 text-xs font-extrabold transition sm:text-sm ${
              mode === "seller"
                ? "bg-[#0a1122] text-white shadow-xs"
                : "text-gray-600 hover:text-[#0a1122]"
            }`}
          >
            {t.ownerTab}
          </button>
          <button
            type="button"
            onClick={() => setMode("buyer")}
            className={`rounded-xl py-3 text-xs font-extrabold transition sm:text-sm ${
              mode === "buyer"
                ? "bg-[#0a1122] text-white shadow-xs"
                : "text-gray-600 hover:text-[#0a1122]"
            }`}
          >
            {t.buyerTab}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="rounded-[22px] border border-gray-200/85 bg-white p-5 shadow-xs sm:p-7 lg:col-span-6">
            {mode === "seller" ? (
              <div className="space-y-5 text-start">
                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {t.contractPriceLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div dir="ltr" className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {cur}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="100,000"
                      value={contractPriceStr}
                      onChange={(e) => {
                        setContractPriceStr(formatNumberInput(e.target.value))
                        setSellerCalculated(false)
                      }}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-9 text-right text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                    />
                  </div>
                  {getAmountHint(contractPrice) && (
                    <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                      {getAmountHint(contractPrice)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t.contractPriceHint}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {t.paidSoFarLabel} <span className="text-red-500">*</span>
                  </label>
                  <div dir="ltr" className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {cur}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="35,000"
                      value={paidAmountStr}
                      onChange={(e) => {
                        setPaidAmountStr(formatNumberInput(e.target.value))
                        setSellerCalculated(false)
                      }}
                      className={`h-12 w-full rounded-xl border bg-white pr-4 pl-9 text-right text-sm font-bold text-[#0a1122] focus:outline-none ${
                        isPaidExceedingContract
                          ? "border-red-500 bg-red-50/20"
                          : "border-gray-200 focus:border-[#0b6954]"
                      }`}
                    />
                  </div>
                  {isPaidExceedingContract && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-600">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>{t.paidExceedsContractError}</span>
                    </p>
                  )}
                  {!isPaidExceedingContract && getAmountHint(paidAmount) && (
                    <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                      {getAmountHint(paidAmount)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t.paidSoFarHint}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {t.yearsPaidLabel} <span className="text-red-500">*</span>
                  </label>
                  <div dir="ltr" className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {t.yearUnit}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      dir="ltr"
                      placeholder="2"
                      value={yearsPaidStr}
                      onChange={(e) => {
                        setYearsPaidStr(e.target.value)
                        setSellerCalculated(false)
                      }}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-12 text-right text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t.yearsPaidHint}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canCalcSeller}
                  onClick={() => setSellerCalculated(true)}
                  className={`h-12 w-full rounded-xl text-sm font-extrabold text-white transition ${
                    canCalcSeller
                      ? "bg-[#0a1122] hover:bg-[#16223f]"
                      : "cursor-not-allowed bg-gray-400/80"
                  }`}
                >
                  {t.calcOwnerBtn}
                </button>
              </div>
            ) : (
              <div className="space-y-5 text-start">
                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {t.devPriceTodayLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div dir="ltr" className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {cur}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="125,000"
                      value={developerTodayStr}
                      onChange={(e) => {
                        setDeveloperTodayStr(formatNumberInput(e.target.value))
                        setBuyerCalculated(false)
                      }}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-9 text-right text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                    />
                  </div>
                  {getAmountHint(developerToday) && (
                    <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                      {getAmountHint(developerToday)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t.devPriceTodayHint}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0a1122] sm:text-sm">
                    {t.oldContractPriceLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div dir="ltr" className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {cur}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="95,000"
                      value={oldContractStr}
                      onChange={(e) => {
                        setOldContractStr(formatNumberInput(e.target.value))
                        setBuyerCalculated(false)
                      }}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-9 text-right text-sm font-bold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                    />
                  </div>
                  {getAmountHint(oldContract) && (
                    <p className="mt-1.5 text-xs font-bold text-[#0b6954]">
                      {getAmountHint(oldContract)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t.oldContractPriceHint}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canCalcBuyer}
                  onClick={() => setBuyerCalculated(true)}
                  className={`h-12 w-full rounded-xl text-sm font-extrabold text-white transition ${
                    canCalcBuyer
                      ? "bg-[#0a1122] hover:bg-[#16223f]"
                      : "cursor-not-allowed bg-gray-400/80"
                  }`}
                >
                  {t.calcBuyerBtn}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-6">
            {mode === "seller" ? (
              !sellerCalculated ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-[22px] border border-dashed border-gray-300 bg-white/60 p-8 text-center text-xs font-semibold text-gray-500 sm:text-sm">
                  {t.ownerEmptyPrompt}
                </div>
              ) : (
                <div className="space-y-4 text-start">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-sky-900">
                      <Info className="size-4 shrink-0 text-sky-700" />
                      <span>{t.lossAlertTitle}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed font-semibold text-sky-950">
                      {t.lossAlertPrefix}{" "}
                      <span dir="ltr">
                        {maxPenalty.toLocaleString("en-US")}
                      </span>{" "}
                      {cur}، {t.lossAlertMiddle} {yearsPaid} {t.yearsWord}.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-[#0a1122]">
                        {t.cancelScenarioTitle}
                      </h3>
                      <span
                        dir="ltr"
                        className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#c81e1e]"
                      >
                        {minPenaltyPct === maxPenaltyPct
                          ? `${minPenaltyPct}%`
                          : `${minPenaltyPct}% – ${maxPenaltyPct}%`}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {t.expectedPenaltyLabel}
                      </p>
                      <p className="mt-1 text-xl font-black text-[#c81e1e] tabular-nums sm:text-2xl">
                        {minPenalty === maxPenalty ? (
                          <>
                            <span dir="ltr">
                              {maxPenalty.toLocaleString("en-US")}
                            </span>{" "}
                            {cur}
                          </>
                        ) : (
                          <>
                            <span dir="ltr">
                              {minPenalty.toLocaleString("en-US")}
                            </span>{" "}
                            {cur} –{" "}
                            <span dir="ltr">
                              {maxPenalty.toLocaleString("en-US")}
                            </span>{" "}
                            {cur}
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {t.penaltyBasisHint} (
                        <span dir="ltr">
                          {minPenaltyPct === maxPenaltyPct
                            ? `${minPenaltyPct}%`
                            : `${minPenaltyPct}% - ${maxPenaltyPct}%`}
                        </span>
                        )
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {t.refundedAmountLabel}
                      </p>
                      <p className="mt-1 text-lg font-black text-[#0a1122] tabular-nums sm:text-xl">
                        {minRefund === maxRefund ? (
                          <>
                            <span dir="ltr">
                              {maxRefund.toLocaleString("en-US")}
                            </span>{" "}
                            {cur}
                          </>
                        ) : (
                          <>
                            <span dir="ltr">
                              {minRefund.toLocaleString("en-US")}
                            </span>{" "}
                            {cur} –{" "}
                            <span dir="ltr">
                              {maxRefund.toLocaleString("en-US")}
                            </span>{" "}
                            {cur}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {t.expectedDurationLabel}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-amber-800">
                        {t.aroundWord} {yearsPaid} {t.yearsWord}{" "}
                        {t.sameDurationSuffix}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[20px] border-2 border-[#a7e3cb] bg-white p-5 shadow-xs">
                    <h3 className="text-sm font-black text-[#0a1122]">
                      {t.assignScenarioTitle}
                    </h3>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {t.recoveredViaAssignLabel}
                      </p>
                      <p className="mt-1 text-2xl font-black text-[#0b6954] tabular-nums sm:text-3xl">
                        <span dir="ltr">
                          {paidAmount.toLocaleString("en-US")}
                        </span>{" "}
                        {cur}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {t.recoveredViaAssignHint}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {t.commissionLabel}
                      </p>
                      <p className="mt-1 text-base font-black text-[#0a1122]">
                        0 {cur}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#eaf8f2] p-3.5">
                      <p className="text-xs font-bold text-[#0b6954]">
                        {t.netDiffInFavorLabel}
                      </p>
                      <p className="mt-1 text-lg font-black text-[#0b6954] tabular-nums sm:text-xl">
                        {minPenalty === maxPenalty ? (
                          <>
                            <span dir="ltr">
                              {maxPenalty.toLocaleString("en-US")}
                            </span>{" "}
                            {cur}
                          </>
                        ) : (
                          <>
                            <span dir="ltr">
                              {minPenalty.toLocaleString("en-US")}
                            </span>{" "}
                            {cur} –{" "}
                            <span dir="ltr">
                              {maxPenalty.toLocaleString("en-US")}
                            </span>{" "}
                            {cur}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
                    <span className="shrink-0 rounded-md bg-sky-200/70 px-2 py-0.5 text-[10px] font-extrabold">
                      {t.estimateBadge}
                    </span>
                    <span className="font-semibold">{t.estimateNote}</span>
                  </div>

                  <div className="rounded-[20px] bg-[#0a1122] p-6 text-center text-white shadow-lg">
                    <Link
                      href={`/sell?contract=${contractPrice}&paid=${paidAmount}`}
                      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0b6954] px-6 text-sm font-extrabold text-white transition hover:bg-[#095342]"
                    >
                      {t.requestFreeReportBtn}
                    </Link>
                    <p className="mt-3 text-xs text-gray-300">
                      {t.requestFreeReportSub}
                    </p>
                  </div>
                </div>
              )
            ) : !buyerCalculated ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-[22px] border border-dashed border-gray-300 bg-white/60 p-8 text-center text-xs font-semibold text-gray-500 sm:text-sm">
                {t.buyerEmptyPrompt}
              </div>
            ) : (
              <div className="space-y-4 text-start">
                <div className="rounded-[20px] border-2 border-[#a7e3cb] bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-gray-500">
                      {t.dayOneGainLabel}
                    </p>
                    <span
                      dir="ltr"
                      className="rounded-full bg-[#eaf8f2] px-2.5 py-0.5 text-[11px] font-extrabold text-[#0b6954]"
                    >
                      {commissionPct}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-3xl font-black text-[#0b6954] tabular-nums sm:text-4xl">
                    <span dir="ltr">
                      {netBuyerGain.toLocaleString("en-US")}
                    </span>{" "}
                    {cur}
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {t.dayOneGainSub} ({commissionPct}%:{" "}
                    <span dir="ltr">
                      {buyerCommission.toLocaleString("en-US")}
                    </span>{" "}
                    {cur})
                  </p>

                  <hr className="my-5 border-gray-100" />

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400">
                        {t.devPriceTodayLabel}
                      </span>
                      <strong className="mt-1 block text-sm font-black text-[#0a1122] tabular-nums sm:text-base">
                        <span dir="ltr">
                          {developerToday.toLocaleString("en-US")}
                        </span>{" "}
                        {cur}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">
                        {t.oldContractPriceLabel}
                      </span>
                      <strong className="mt-1 block text-sm font-black text-[#0a1122] tabular-nums sm:text-base">
                        <span dir="ltr">
                          {oldContract.toLocaleString("en-US")}
                        </span>{" "}
                        {cur}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] bg-[#0a1122] p-6 text-center text-white shadow-lg">
                  <Link
                    href={`/buy?budget=${oldContract}`}
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0b6954] px-6 text-sm font-extrabold text-white transition hover:bg-[#095342]"
                  >
                    {t.registerViewOppsBtn}
                  </Link>
                </div>
              </div>
            )}

            <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-400">
              {t.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}