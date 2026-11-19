'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  HelpCircle,
  MessageCircle,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type TermsSection = {
  title: string
  body: string
}

export default function TermsPage() {
  const { t: dict, dir } = useTranslation()
  const content = (dict?.publicPages as Record<string, any>)?.terms || {}
  const sections: TermsSection[] = Array.isArray(content.sections)
    ? content.sections
    : []

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f6f8fc] py-10 text-[#0f1d40] sm:py-16"
    >
      <div className="mx-auto max-w-[780px] px-4 sm:px-6">
        <div className="rounded-[26px] border border-slate-200/85 bg-white p-6 shadow-2xs sm:p-10 md:p-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2563eb] transition hover:underline"
          >
            {dir === 'rtl' ? (
              <ArrowRight className="size-3.5" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{content.backHome}</span>
          </Link>

          <h1 className="mt-4 text-start text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
            {content.title}
          </h1>

          <p className="mt-2 text-start text-xs font-semibold text-slate-400">
            {content.lastUpdated}
          </p>

          {content.intro && (
            <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-[#eaf8f2]/60 p-4 text-start text-xs font-bold leading-relaxed text-[#0f1d40] sm:text-[13.5px]">
              <div className="flex items-start gap-2.5">
                <FileCheck2 className="mt-0.5 size-4 shrink-0 text-[#007a5a]" />
                <span>{content.intro}</span>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-7 text-start">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-base font-extrabold text-[#0f1d40] sm:text-lg">
                  {section.title}
                </h2>
                <p className="text-xs leading-[1.95] text-slate-600 sm:text-[14px]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 text-start">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                  {content.bottomCtaTitle}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {content.bottomCtaSub}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/faq"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#0f1d40] transition hover:border-[#2563eb] hover:text-[#2563eb]"
                >
                  <HelpCircle className="size-3.5" />
                  <span>{content.faqBtn}</span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#007a5a] px-5 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
                >
                  <MessageCircle className="size-3.5" />
                  <span>{content.contactBtn}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}