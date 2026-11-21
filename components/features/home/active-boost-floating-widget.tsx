'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Clock,
  Crown,
  Eye,
  Flame,
  Minus,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type MyActiveBoostItem = {
  unitId: string
  unitCode: string
  headline: string
  tier: 'super_vip' | 'vip_plus'
  isPendingActivation: boolean
  featuredUntil: string | null
  viewsCount: number
}

const STORAGE_KEY = 'dualdealz_home_boost_widget_min'

function formatTimeLeft(
  untilIso: string | null,
  dayWord: string,
  hourWord: string
) {
  if (!untilIso) return '—'
  const diffMs = new Date(untilIso).getTime() - Date.now()
  if (diffMs <= 0) return `0 ${hourWord}`
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) {
    return hours > 0
      ? `${days} ${dayWord} · ${hours} ${hourWord}`
      : `${days} ${dayWord}`
  }
  return `${Math.max(1, hours)} ${hourWord}`
}

export function ActiveBoostFloatingWidget({
  items,
}: {
  items: MyActiveBoostItem[]
}) {
  const { t: dict, dir } = useTranslation()
  const wT = ((dict.home as Record<string, any>)?.activeBoostWidget ||
    {}) as Record<string, string>

  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setMinimized(true)
      }
    } catch {}
  }, [])

  if (!items || items.length === 0) return null

  const primary = items[0]
  const isVipPlus = primary.tier === 'vip_plus'

  const toggleMinimized = (next: boolean) => {
    setMinimized(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {}
  }

  // في العربي يظهر أعلى اليسار، وفي الإنجليزي أعلى اليمين (end-3 / sm:end-5)
  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => toggleMinimized(false)}
        aria-label={wT.expandAria}
        className="fixed top-20 end-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white/95 px-3 py-2 text-[11px] font-black text-[#0f1d40] shadow-lg backdrop-blur-md transition hover:scale-105 sm:end-5"
      >
        <span
          className={`flex size-5 items-center justify-center rounded-full text-white ${
            primary.isPendingActivation
              ? 'bg-amber-500'
              : isVipPlus
                ? 'bg-indigo-600'
                : 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69]'
          }`}
        >
          {primary.isPendingActivation ? (
            <Clock className="size-3" />
          ) : isVipPlus ? (
            <Flame className="size-3" />
          ) : (
            <Crown className="size-3" />
          )}
        </span>
        <span>{isVipPlus ? '+VIP' : 'SUPER VIP'}</span>
      </button>
    )
  }

  return (
    <aside
      dir={dir}
      className="fixed top-20 end-3 z-40 w-[260px] rounded-2xl border border-amber-300/90 bg-white/95 p-3 text-start shadow-xl backdrop-blur-md sm:end-5 sm:w-[285px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
              primary.isPendingActivation
                ? 'bg-amber-500'
                : isVipPlus
                  ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]'
                  : 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69]'
            }`}
          >
            {primary.isPendingActivation ? (
              <Clock className="size-3.5" />
            ) : isVipPlus ? (
              <Flame className="size-3.5" />
            ) : (
              <Crown className="size-3.5" />
            )}
          </span>
          <div className="min-w-0">
            <span className="block text-[10px] font-extrabold text-[#007a5a]">
              {primary.isPendingActivation ? wT.pendingLabel : wT.activeLabel}
            </span>
            <p className="truncate text-xs font-black text-[#0f1d40]">
              {primary.headline}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleMinimized(true)}
          aria-label={wT.minimizeAria}
          className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <Minus className="size-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 text-[10.5px]">
        <span className="inline-flex items-center gap-1 font-extrabold text-amber-800">
          <Sparkles className="size-3 text-amber-500" />
          <span>{isVipPlus ? '+VIP' : 'SUPER VIP'}</span>
        </span>

        {!primary.isPendingActivation && (
          <span className="font-bold text-[#007a5a]">
            {wT.remainingPrefix}:{' '}
            {formatTimeLeft(
              primary.featuredUntil,
              wT.dayWord || 'd',
              wT.hourWord || 'h'
            )}
          </span>
        )}

        <span className="inline-flex items-center gap-1 font-bold text-[#2563eb]">
          <Eye className="size-3" />
          <span dir="ltr" className="inline-block tabular-nums">
            {primary.viewsCount}
          </span>
        </span>
      </div>

      <Link
        href={`/account?view=seller&unitId=${primary.unitId}#promo-section`}
        className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#006248]"
      >
        <span>{wT.viewStatsBtn}</span>
        <ArrowUpRight className="size-3.5" />
      </Link>

      {items.length > 1 && (
        <p className="mt-1.5 text-center text-[10px] font-bold text-slate-400">
          +{items.length - 1} {wT.moreUnitsSuffix}
        </p>
      )}
    </aside>
  )
}