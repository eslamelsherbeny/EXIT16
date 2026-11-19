'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  HelpCircle,
  MessageCircle,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

type FaqItem = {
  category: 'general' | 'sellers' | 'buyers' | 'deals'
  q: string
  a: string
}

export default function FaqPage() {
  const { t: dict, dir } = useTranslation()
  const content = (dict?.publicPages as Record<string, any>)?.faq || {}
  const categories = (content.categories as Record<string, string>) || {}
  const allItems: FaqItem[] = Array.isArray(content.items) ? content.items : []

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const filteredItems =
    activeCategory === 'all'
      ? allItems
      : allItems.filter((item) => item.category === activeCategory)

  const categoryTabs = [
    { id: 'all', label: categories.all },
    { id: 'general', label: categories.general },
    { id: 'sellers', label: categories.sellers },
    { id: 'buyers', label: categories.buyers },
    { id: 'deals', label: categories.deals },
  ]

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f6f8fc] py-10 text-[#0f1d40] sm:py-16"
    >
      <div className="mx-auto max-w-[860px] px-4 sm:px-6">
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

          <div className="mt-4 text-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f2] px-3 py-1 text-[11px] font-extrabold text-[#007a5a]">
              <HelpCircle className="size-3.5" />
              <span>{content.eyebrow}</span>
            </span>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
              {content.title}
            </h1>

            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
              {content.subtitle}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-5">
            {categoryTabs.map((tab) => {
              const isSelected = activeCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(tab.id)
                    setOpenIndex(0)
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    isSelected
                      ? 'bg-[#007a5a] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#0f1d40]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="mt-6 space-y-3 text-start">
            {filteredItems.map((item, idx) => {
              const isOpen = openIndex === idx
              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-2xl border transition ${
                    isOpen
                      ? 'border-[#007a5a]/40 bg-[#eaf8f2]/25 shadow-2xs'
                      : 'border-slate-200/85 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                  >
                    <span className="text-xs font-black text-[#0f1d40] sm:text-[15px]">
                      {item.q}
                    </span>
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full transition ${
                        isOpen
                          ? 'bg-[#007a5a] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100/80 px-5 pt-3 pb-4 text-xs leading-[1.95] text-slate-600 sm:text-[14px]">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 text-start">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                  {content.bottomTitle}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {content.bottomSub}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/opportunities"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#0f1d40] transition hover:border-[#007a5a] hover:text-[#007a5a]"
                >
                  <Building2 className="size-3.5" />
                  <span>{content.browseBtn}</span>
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