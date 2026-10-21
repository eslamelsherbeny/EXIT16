'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function OffersPage() {
  const router = useRouter()
  const { t: dict, dir } = useTranslation()
  const t = dict.accountPages.offers
  const tCommon = dict.accountPages.common

  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'seller' | 'buyer' | null>(null)

  useEffect(() => {
    async function checkUserStatus() {
      const supabase = createClient()
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single()

      if (userData) {
        const { data: sellData } = await supabase
          .from('sell_requests')
          .select('id')
          .eq('user_id', userData.id)
          .limit(1)
          .maybeSingle()
        if (sellData) {
          setUserRole('seller')
        } else {
          const { data: buyData } = await supabase
            .from('buy_requests')
            .select('id')
            .eq('user_id', userData.id)
            .limit(1)
            .maybeSingle()
          if (buyData) {
            setUserRole('buyer')
          }
        }
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    checkUserStatus()
  }, [router])

  if (loading)
    return (
      <div
        dir={dir}
        className="flex h-screen items-center justify-center bg-[var(--brand-surface,#f5f6f8)]"
      >
        <div className="font-bold text-[var(--brand-primary,#007a5a)]">
          {t.loading}
        </div>
      </div>
    )

  if (userRole === 'seller') {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] text-[var(--brand-navy-text,#0a1128)]"
      >
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {t.sellerTitle}
            </h1>
          </header>

          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">{t.sellerEmpty}</p>
          </div>

          <p className="mt-8 text-center text-sm leading-6 text-slate-500">
            {t.sellerDisclaimer}
          </p>

          <div className="mt-10 text-center">
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {tCommon.backToAccount}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (userRole === 'buyer') {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] text-[var(--brand-navy-text,#0a1128)]"
      >
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight">
              {t.buyerTitle}
            </h1>
            <p className="mt-2 text-slate-500">{t.buyerSubtitle}</p>
          </header>

          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">{t.buyerEmpty}</p>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/account"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {tCommon.backToAccount}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return null
}
