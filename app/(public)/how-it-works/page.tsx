import Link from 'next/link'
import { Check, Plus, ShieldCheck } from 'lucide-react'
import { getServerI18n } from '@/lib/get-server-dictionary'

export const dynamic = 'force-dynamic'

function JourneyCard({
  title,
  steps,
  button,
  href,
}: {
  title: string
  steps: string[][]
  button: string
  href: string
}) {
  return (
    <section className="sivrce-card flex flex-col justify-between rounded-[24px] border border-slate-200/90 bg-white p-7 text-start shadow-xs md:p-9">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
          {title}
        </h2>
        <div className="mt-7 flex flex-col gap-6">
          {steps.map(([stepTitle, description], index) => (
            <div key={stepTitle} className="relative flex gap-4 text-start">
              {index < steps.length - 1 && (
                <span
                  className="absolute top-9 start-[15px] h-[calc(100%+1.5rem)] w-px bg-slate-200"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy,#0a1122)] text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-[var(--brand-navy,#0a1122)]">
                  {stepTitle}
                </h3>
                <p className="mt-1.5 text-sm leading-7 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Link
          href={href}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-navy,#0a1122)] px-7 text-xs font-bold text-white transition hover:bg-[var(--brand-navy-hover,#16223f)] sm:text-sm"
        >
          {button}
        </Link>
      </div>
    </section>
  )
}

export default async function HowItWorksPage() {
  const { dict, dir } = await getServerI18n()
  const t = dict.publicPages.howItWorks
  const h = dict.home
  const fairStandards = h?.standards?.items || []
  const USD = '$'

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f6f8fc)] text-[var(--brand-navy-text,#0f1d40)]"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* 1. عنوان الصفحة الرئيسي */}
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0f1d40] sm:text-4xl md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-500 sm:text-base">
            {t.subtitle}
          </p>
        </header>

        {/* 2. في أول الصفحة: طرف محتاج يبيع، وطرف مستني الفرصة — وإحنا بنوصّلهم */}
        <section className="mt-12">
          <div className="max-w-2xl text-start">
            <h2 className="heading-section">{h?.audience?.title}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-500 sm:text-base">
              {h?.audience?.subtitle}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* كارت البائع */}
            <div className="sivrce-card flex h-full flex-col justify-between rounded-[24px] border border-emerald-200/80 bg-white p-6 text-start shadow-xs sm:p-9">
              <div>
                <span className="inline-block rounded-full bg-[#e6f4f1] px-3.5 py-1 text-xs font-bold text-[#007a5a]">
                  {h?.audience?.sellerBadge}
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#0f1d40] sm:text-2xl">
                  {h?.audience?.sellerTitle}
                </h3>
                <p className="mt-3 text-xs leading-[1.9] text-gray-500 sm:text-sm">
                  {h?.audience?.sellerDesc}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                    <span>{h?.audience?.sellerPoint1}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                    <span>{h?.audience?.sellerPoint2}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                    <span>{h?.audience?.sellerPoint3}</span>
                  </li>
                </ul>

                <div className="mt-6 rounded-xl border border-[#b8e6d5] bg-[#eaf8f2] px-4 py-3 text-xs font-bold text-[#007a5a] sm:text-sm">
                  {h?.audience?.sellerFreeNote}
                </div>
              </div>

              <div className="mt-7">
                <Link
                  href="/sell"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-xs font-bold text-white shadow-xs transition hover:opacity-95 sm:text-sm"
                >
                  {h?.audience?.sellerBtn}
                </Link>
              </div>
            </div>

            {/* كارت المشتري */}
            <div className="sivrce-card flex h-full flex-col justify-between rounded-[24px] border border-blue-200/80 bg-gradient-to-br from-white via-[#f4f8ff] to-[#eef6ff] p-6 text-start text-[#0f1d40] shadow-xs sm:p-9">
              <div>
                <span className="inline-block rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-[#2563eb]">
                  {h?.audience?.buyerBadge}
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#0f1d40] sm:text-2xl">
                  {h?.audience?.buyerTitle}
                </h3>
                <p className="mt-3 text-xs leading-[1.9] text-slate-600 sm:text-sm">
                  {h?.audience?.buyerDesc}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
                    <span>{h?.audience?.buyerPoint1}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
                    <span>{h?.audience?.buyerPoint2}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs font-semibold text-[#0f1d40] sm:text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#2563eb]" />
                    <span>{h?.audience?.buyerPoint3}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/opportunities"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-7 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 sm:text-sm"
                >
                  {h?.audience?.buyerBtn}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. خطوات البائع وخطوات المشتري التفصيلية */}
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <JourneyCard
            title={t.ownerTitle}
            steps={t.ownerSteps}
            button={t.ownerBtn}
            href="/sell"
          />
          <JourneyCard
            title={t.buyerTitle}
            steps={t.buyerSteps}
            button={t.buyerBtn}
            href="/buy"
          />
        </div>

        {/* 4. قسم مثال بالأرقام (منقول من الصفحة الرئيسية) */}
        <section className="mt-14 rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-xs sm:p-10">
          <div className="text-start">
            <h2 className="heading-section">{h?.example?.title}</h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {h?.example?.subtitle}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-[#f8fafc] p-6 text-start shadow-2xs sm:p-8">
              <div>
                <div className="flex items-center justify-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecee] text-xs font-bold text-[#d9383a]">
                    ✕
                  </span>
                  <h3 className="text-base font-bold text-[#0f1d40]">
                    {h?.example?.lossTitle}
                  </h3>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400">
                    {h?.example?.lossDiscountLabel}
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold text-[#d9383a] tabular-nums sm:text-3xl">
                    <span dir="ltr">- {h?.example?.lossDiscountAmount}</span>
                    <span>{USD}</span>
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-200/70 pt-5">
                  <div className="text-start">
                    <p className="text-xs text-gray-400">
                      {h?.example?.lossReturnLabel}
                    </p>
                    <p className="mt-1 flex items-baseline gap-1 text-lg font-bold text-[#0f1d40] tabular-nums sm:text-xl">
                      <span dir="ltr">{h?.example?.lossReturnAmount}</span>
                      <span>{USD}</span>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-gray-400">
                      {h?.example?.lossDurationLabel}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#b45309] sm:text-xl">
                      {h?.example?.lossDurationValue}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-[#fef2f2] px-4 py-3 text-center text-xs font-bold text-[#d9383a]">
                {h?.example?.lossFooter}
              </div>
            </div>

            <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border-2 border-[#a7e3cb] bg-white p-6 text-start shadow-2xs sm:p-8">
              <div>
                <div className="flex items-center justify-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e3f7ed] text-xs font-bold text-[#007a5a]">
                    ✓
                  </span>
                  <h3 className="text-base font-bold text-[#0f1d40]">
                    {h?.example?.winTitle}
                  </h3>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400">
                    {h?.example?.winReturnLabel}
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold text-[#007a5a] tabular-nums sm:text-3xl">
                    <span dir="ltr">{h?.example?.winReturnAmount}</span>
                    <span>{USD}</span>
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#0f1d40]">
                    {h?.example?.winReturnSub}
                  </p>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">
                    {h?.example?.winCommissionLabel}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#007a5a]">
                    {h?.example?.winCommissionValue}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#0f1d40]">
                    {h?.example?.winCommissionSub}
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-[#eaf8f2] px-4 py-3 text-center text-xs font-bold text-[#007a5a]">
                {h?.example?.winFooter}
              </div>
            </div>
          </div>

          <p className="mt-5 text-start text-xs leading-relaxed text-gray-400">
            {h?.example?.disclaimer}
          </p>
        </section>

        {/* 5. قسم معايير الخروج العادل (منقول من الصفحة الرئيسية) */}
        <section className="mt-14 rounded-[26px] border border-slate-200/80 bg-white p-6 text-start shadow-xs sm:p-10">
          <h2 className="heading-section">{h?.standards?.title}</h2>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            {h?.standards?.subtitle}
          </p>

          <div className="mt-9 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            {fairStandards.map((item: any) => (
              <div key={item.title} className="flex items-start gap-4 text-start">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0f1d40]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-[1.85] text-gray-500 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. صندوق العمولة والشفافية */}
        <section className="mt-10 rounded-[24px] border border-slate-200 bg-white p-7 text-start shadow-xs md:p-9">
          <h2 className="text-xl font-extrabold text-[#0f1d40] sm:text-2xl">
            {t.commissionTitle}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-8 text-slate-600">
            {t.commissionDesc}
          </p>
          <div className="mt-6 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-5 py-4 text-xs font-semibold leading-7 text-[var(--brand-primary,#007a5a)] sm:text-sm">
            {t.disclaimerBox}
          </div>
        </section>

        {/* 7. كارتا الختام ("مش قادر تكمّل أقساطك؟ / بتدور على فرصة حقيقية؟") */}
        <section className="mt-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-9">
              <div>
                <h3 className="text-xl font-bold text-[#0f1d40] sm:text-2xl">
                  {h?.bottomCta?.sellerTitle}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  {h?.bottomCta?.sellerDesc}
                </p>
              </div>
              <div className="mt-7">
                <Link
                  href="/sell"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-7 text-xs font-bold text-white transition hover:opacity-95 sm:text-sm"
                >
                  <Plus className="me-1.5 size-4" />
                  <span>{h?.bottomCta?.sellerBtn}</span>
                </Link>
              </div>
            </div>

            <div className="sivrce-card flex h-full flex-col justify-between rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-9">
              <div>
                <h3 className="text-xl font-bold text-[#0f1d40] sm:text-2xl">
                  {h?.bottomCta?.buyerTitle}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  {h?.bottomCta?.buyerDesc}
                </p>
              </div>
              <div className="mt-7">
                <Link
                  href="/buy"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-xs font-bold text-[#0f1d40] transition hover:border-[#2563eb] hover:bg-blue-50/40 hover:text-[#2563eb] sm:text-sm"
                >
                  {h?.bottomCta?.buyerBtn}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}