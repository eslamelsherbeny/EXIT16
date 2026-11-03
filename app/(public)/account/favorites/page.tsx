'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react'
import {
  mapDbRowToProperty,
  OpportunityCard,
} from '@/components/features/opportunities/opportunities-shared'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'
import { useTranslation } from '@/lib/i18n'

const FAVORITES_STORAGE_KEY = 'darak_favorites'
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function AccountFavoritesPage() {
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const t = dict.accountPages.favorites
  const tCommon = dict.accountPages.common
  const oppDict = dict.opportunitiesPage

  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [rawUnits, setRawUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true)
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
        const parsedIds: string[] = stored ? JSON.parse(stored) : []

        // الاحتفاظ فقط بالمعرفات الرسمية الصالحة (UUID) واستبعاد أي معرفات وهمية قديمة
        const validUuidIds = parsedIds
          .map((id) => String(id).trim())
          .filter((id) => UUID_REGEX.test(id))

        if (validUuidIds.length !== parsedIds.length) {
          localStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(validUuidIds)
          )
        }

        setFavoriteIds(validUuidIds)

        if (validUuidIds.length === 0) {
          setRawUnits([])
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
          .in('id', validUuidIds)
          .neq('status', 'deleted_by_seller')

        const validDbUnits = (data || []).filter(
          (u) => !isNonGeorgianLegacyArea(u.area)
        )

        // مزامنة الـ localStorage مع الوحدات الموجودة فعلياً في قاعدة البيانات
        const existingIds = validDbUnits.map((u) => String(u.id))
        setFavoriteIds(existingIds)
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(existingIds)
        )

        setRawUnits(validDbUnits)
      } catch (e) {
        console.error('Error loading favorites:', e)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const mappedUnits = useMemo(() => {
    return rawUnits.map((row) => mapDbRowToProperty(row, locale, oppDict))
  }, [rawUnits, locale, oppDict])

  const removeFromFavorites = (unitId: string) => {
    const idStr = String(unitId)
    const nextIds = favoriteIds.filter((id) => String(id) !== idStr)
    setFavoriteIds(nextIds)
    setRawUnits((prev) => prev.filter((u) => String(u.id) !== idStr))
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
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
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
            {t.titlePrefix} ({mappedUnits.length})
          </h1>
          <p className="mt-1 text-xs text-gray-500">{t.subtitle}</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[380px] animate-pulse rounded-[20px] border border-gray-200 bg-white p-4"
              >
                <div className="h-[190px] w-full rounded-xl bg-slate-200" />
                <div className="mt-4 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mt-2 h-3.5 w-1/2 rounded bg-slate-100" />
                <div className="mt-6 h-8 w-1/3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : mappedUnits.length === 0 ? (
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
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {mappedUnits.map((property) => (
              <OpportunityCard
                key={property.id}
                property={property}
                liked={true}
                onToggleLike={removeFromFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
