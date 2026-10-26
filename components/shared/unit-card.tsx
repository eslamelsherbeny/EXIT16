'use client'

import Link from 'next/link'
import { Star, Trash2 } from 'lucide-react'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

export type SharedUnitCardItem = {
  id: string
  project_name?: string | null
  area?: string | null
  unit_type?: string | null
  rooms?: number | null
  paid_amount?: number | null
  willing_to_discount?: boolean | null
  discount_amount?: number | null
  is_featured?: boolean | null
  featured_until?: string | null
  images?: string[] | null
  documents?: Record<string, any> | null
  country_code?: string | null
  country?: string | null
}

const DEFAULT_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'

export function SharedUnitCard({
  unit,
  onRemoveFavorite,
  removeTooltip,
}: {
  unit: SharedUnitCardItem
  onRemoveFavorite?: (id: string) => void
  removeTooltip?: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.accountPages.common

  const meta =
    unit.documents && typeof unit.documents === 'object'
      ? unit.documents.__unit_meta || {}
      : {}

  const resolvedArea = unit.area || meta.area || ''
  const resolvedType = unit.unit_type || meta.unit_type || t.defaultUnitType
  const resolvedRooms = unit.rooms ?? meta.rooms ?? 2

  const paid = Number(unit.paid_amount) || 0
  const discount = unit.willing_to_discount
    ? Number(unit.discount_amount) || 0
    : 0
  const requiredCash = Math.max(0, paid - discount)

  const isFeaturedActive =
    Boolean(unit.is_featured) &&
    (!unit.featured_until || new Date(unit.featured_until) > new Date())

  const coverImage =
    Array.isArray(unit.images) && unit.images[0]
      ? unit.images[0]
      : DEFAULT_PROPERTY_IMAGE

  const currency = getCurrencySymbol('GE', locale)
  const localizedArea = resolvedArea
    ? getLocalizedGeorgiaAreaName(resolvedArea, locale)
    : '—'

  return (
    <div
      dir={dir}
      className="group flex flex-col justify-between overflow-hidden rounded-[16px] border border-gray-200 bg-white text-start shadow-2xs transition hover:shadow-md"
    >
      <div>
        <div className="relative h-[125px] w-full overflow-hidden bg-gray-100 sm:h-[175px]">
          <Link
            href={`/opportunities/${unit.id}`}
            className="block h-full w-full"
          >
            <img
              src={coverImage}
              alt={unit.project_name || t.defaultUnitTitle}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {isFeaturedActive && (
            <span className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 shadow-xs">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              <span>{t.featuredBadge}</span>
            </span>
          )}

          {onRemoveFavorite && (
            <button
              type="button"
              onClick={() => onRemoveFavorite(unit.id)}
              title={removeTooltip}
              className="absolute top-2 start-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md transition hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        <Link
          href={`/opportunities/${unit.id}`}
          className="block p-3.5 text-start sm:p-4"
        >
          <h3 className="line-clamp-1 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] group-hover:text-[var(--brand-primary,#007a5a)] sm:text-sm">
            {unit.project_name || t.defaultUnitTitle}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-400 sm:text-xs">
            {localizedArea} · {resolvedType} · {resolvedRooms} {t.roomsWord}
          </p>

          <div className="mt-3">
            <p className="text-[10px] text-gray-400">{t.requiredCashNow}</p>
            <p className="text-sm font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-lg">
              <span dir="ltr">{requiredCash.toLocaleString('en-US')}</span>{' '}
              {currency}
            </p>
          </div>
        </Link>
      </div>

      <div className="px-3.5 pb-3.5">
        <Link
          href={`/opportunities/${unit.id}`}
          className="flex h-9 w-full items-center justify-center rounded-xl bg-[var(--brand-navy,#0a1122)] text-xs font-bold text-white hover:bg-[var(--brand-navy-hover,#16223f)]"
        >
          {t.viewDetails}
        </Link>
      </div>
    </div>
  )
}