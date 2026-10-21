import Link from 'next/link'
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
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 text-start shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--brand-navy,#0a1122)]">
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
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-navy,#0a1122)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-navy-hover,#16223f)]"
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

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] text-[var(--brand-navy-text,#0a1128)]"
    >
      <div className="layout-container py-14 lg:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-500 sm:text-base">
            {t.subtitle}
          </p>
        </header>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
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

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 text-start shadow-sm md:p-8">
          <h2 className="text-xl font-extrabold sm:text-2xl">
            {t.commissionTitle}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-8 text-slate-600">
            {t.commissionDesc}
          </p>
          <div className="mt-6 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-5 py-4 text-xs font-semibold leading-7 text-[var(--brand-primary,#007a5a)] sm:text-sm">
            {t.disclaimerBox}
          </div>
        </section>
      </div>
    </div>
  )
}
