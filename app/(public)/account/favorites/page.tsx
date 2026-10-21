'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react'
import { SharedUnitCard } from '@/components/shared/unit-card'
import { useTranslation } from '@/lib/i18n'

const FAVORITES_STORAGE_KEY = 'darak_favorites'

export default function AccountFavoritesPage() {
  const { t: dict, dir, isRtl } = useTranslation()
  const t = dict.accountPages.favorites
  const tCommon = dict.accountPages.common

  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true)
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
        const ids: string[] = stored ? JSON.parse(stored) : []
        setFavoriteIds(ids)

        if (ids.length === 0) {
          setUnits([])
          setLoading(false)
          return
        }

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data } = await supabase
          .from('sell_requests')
          .select('*')
          .in('id', ids)
          .neq('status', 'deleted_by_seller')

        setUnits(data || [])
      } catch (e) {
        console.error('Error loading favorites:', e)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const removeFromFavorites = (unitId: string) => {
    const nextIds = favoriteIds.filter((id) => String(id) !== String(unitId))
    setFavoriteIds(nextIds)
    setUnits((prev) => prev.filter((u) => String(u.id) !== String(unitId)))
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextIds))
      window.dispatchEvent(new Event('favorites-updated'))
    } catch {}
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-8 pb-20 text-[var(--brand-navy,#0a1122)] sm:py-12"
    >
      <div className="mx-auto max-w-[980px] px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] hover:text-[var(--brand-primary,#007a5a)]"
          >
            {isRtl ? (
              <ArrowRight className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
            <span>{tCommon.backToAccount}</span>
          </Link>

          <Link
            href="/opportunities"
            className="text-xs font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
          >
            {t.browseAll}
          </Link>
        </div>

        <header className="mb-6 text-start">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            <Heart className="size-3.5 fill-current" />
            <span>{t.badge}</span>
          </div>
          <h1 className="mt-2 text-xl font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
            {t.titlePrefix} ({units.length})
          </h1>
          <p className="mt-1 text-xs text-gray-500">{t.subtitle}</p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-xs font-bold text-gray-500">
            {t.loading}
          </div>
        ) : units.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
            <Heart className="mx-auto mb-3 size-10 text-gray-300" />
            <p className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.emptyTitle}
            </p>
            <p className="mt-1 text-xs text-gray-500">{t.emptySubtitle}</p>
            <Link
              href="/opportunities"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {t.browseBtn}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3">
            {units.map((u) => (
              <SharedUnitCard
                key={u.id}
                unit={u}
                onRemoveFavorite={removeFromFavorites}
                removeTooltip={t.removeTitle}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
