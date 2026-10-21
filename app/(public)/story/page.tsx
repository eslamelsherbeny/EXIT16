import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerI18n } from '@/lib/get-server-dictionary'

export const dynamic = 'force-dynamic'

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-s-4 border-teal-600 bg-slate-50 px-6 py-5 text-base font-semibold leading-8 text-[#0a1128]">
      {children}
    </div>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-4 text-sm leading-7 text-slate-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check
            className="mt-1 shrink-0 text-teal-600"
            data-icon="inline-start"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default async function StoryPage() {
  const { dict, dir, isRtl } = await getServerI18n()
  const t = dict.storyPage

  return (
    <div dir={dir} className="bg-[#f6f7f9] text-[#0a1128]">
      <section className="bg-[#0a1128] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
          <div className="relative order-2 mx-auto h-[360px] w-full max-w-[310px] overflow-hidden rounded-2xl bg-slate-800 shadow-2xl lg:order-1">
            <Image
              src="/story-founder.png"
              alt={t.founderName}
              fill
              priority
              className="object-cover object-top grayscale"
            />
          </div>
          <div className="order-1 text-start lg:order-2">
            <p className="text-sm font-semibold text-teal-300">
              {t.heroEyebrow}
            </p>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.45] md:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-6 text-lg font-semibold text-teal-300">
              {t.founderName}
            </p>
            <p className="mt-1 text-xs text-teal-200">{t.founderRole}</p>
            <p className="mt-6 max-w-xl text-sm leading-8 text-slate-300">
              {t.heroDescription}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-5 py-16 lg:px-0 lg:py-20">
        <article className="flex flex-col gap-10 text-start leading-8">
          <div className="flex flex-col gap-6 text-sm text-slate-600">
            <p>{t.introP1}</p>
            <p>{t.introP2}</p>
            <Quote>{t.quote1}</Quote>
          </div>

          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold">{t.sec1Title}</h2>
            <p className="text-sm text-slate-600">{t.sec1P1}</p>
            <p className="text-sm text-slate-600">{t.sec1P2}</p>
            <h3 className="text-xl font-bold text-teal-700">
              {t.sec1SubTitle}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-5 text-sm shadow-sm">
                {t.sec1Card1}
              </div>
              <div className="rounded-xl bg-white p-5 text-sm shadow-sm">
                {t.sec1Card2}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold">{t.sec2Title}</h2>
            <p className="text-sm text-slate-600">{t.sec2Desc}</p>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <CheckList items={t.points || []} />
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold">{t.sec3Title}</h2>
            <p className="text-sm text-slate-600">{t.sec3Desc}</p>
            <Quote>{t.quote2}</Quote>
            <div className="rounded-2xl bg-[#0a1128] p-8 text-white">
              <p className="text-6xl font-bold text-teal-300">{t.zeroWord}</p>
              <h3 className="mt-3 text-xl font-bold">{t.zeroTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {t.zeroDesc}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold">{t.sec4Title}</h2>
            <p className="text-sm text-slate-600">{t.sec4Desc}</p>
            <Quote>{t.quote3}</Quote>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold">{t.sec5Title}</h2>
            <p className="text-sm text-slate-600">{t.sec5Desc}</p>
            <CheckList items={t.standards || []} />
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold">{t.sec6Title}</h2>
            <Quote>{t.quote4}</Quote>
            <p className="text-sm text-slate-600">{t.sec6Desc}</p>
          </section>

          <section className="flex flex-col items-center gap-5 border-t border-slate-200 pt-10 text-center">
            <p className="text-sm font-semibold">{t.founderName}</p>
            <p className="text-xs text-slate-500">{t.founderRoleFull}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                className="bg-teal-700 text-white hover:bg-teal-800"
                render={<Link href="/sell" />}
              >
                {t.sellCta}
              </Button>
              <Button
                variant="outline"
                className="border-teal-700 text-teal-700"
                render={<Link href="/opportunities" />}
              >
                {t.buyCta}{' '}
                {isRtl ? (
                  <ArrowLeft data-icon="inline-end" />
                ) : (
                  <ArrowRight data-icon="inline-end" />
                )}
              </Button>
            </div>
          </section>
        </article>
      </main>
    </div>
  )
}
