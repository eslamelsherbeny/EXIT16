'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  Loader2,
} from 'lucide-react'
import {
  getUserNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from '@/actions/notification-actions'
import { useTranslation } from '@/lib/i18n'

type AdminNotifItem = {
  id: string
  title: string
  message: string
  type?: string | null
  link?: string | null
  is_read: boolean
  created_at: string
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const nT = (dict.accountPages as Record<string, any>)?.notifications || {}
  const d = (dict.admin?.dealsPage as Record<string, any>) || {}

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AdminNotifItem[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all')
  const [isPending, startTransition] = useTransition()

  async function loadAdminNotifs() {
    setLoading(true)
    const res = await getUserNotificationsAction('admin', 120)
    setItems((res.notifications || []) as AdminNotifItem[])
    setLoading(false)
  }

  useEffect(() => {
    loadAdminNotifs()
  }, [locale])

  const unreadCount = useMemo(
    () => items.filter((i) => !i.is_read).length,
    [items]
  )

  const displayedItems = useMemo(() => {
    if (filterTab === 'unread') {
      return items.filter((i) => !i.is_read)
    }
    return items
  }, [items, filterTab])

  const formatNotifDate = (iso: string) => {
    try {
      const date = new Date(iso)
      const localeTag =
        locale === 'ar'
          ? 'ar-EG'
          : locale === 'ru'
            ? 'ru-RU'
            : locale === 'ka'
              ? 'ka-GE'
              : 'en-US'
      return new Intl.DateTimeFormat(localeTag, {
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
    } catch {
      return iso
    }
  }

  const handleItemClick = (notif: AdminNotifItem) => {
    if (!notif.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === notif.id ? { ...x, is_read: true } : x))
      )
      markNotificationAsReadAction(notif.id).catch(() => {})
    }
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })))
    startTransition(async () => {
      await markAllNotificationsAsReadAction('admin')
    })
  }

  return (
    <div dir={dir} className="mx-auto max-w-4xl space-y-4 text-start">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-2xs">
        <div>
          <h1 className="text-lg font-black text-[#0f1d40] sm:text-xl">
            {nT.title} ({items.length})
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">{nT.adminSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkAllRead}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#eaf8f2] px-3.5 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white"
            >
              <CheckCheck className="size-4" />
              <span>{nT.markAllReadBtn}</span>
            </button>
          )}

          <Link
            href="/admin"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#0f1d40] hover:bg-slate-50"
          >
            {isRtl ? (
              <ArrowRight className="size-3.5" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{d.backToDashboardBtn}</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
            filterTab === 'all'
              ? 'bg-[#007a5a] text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          {d.tabAll} ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('unread')}
          className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
            filterTab === 'unread'
              ? 'bg-[#007a5a] text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          {nT.newSectionHeader} ({unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white p-10">
          <Loader2 className="size-5 animate-spin text-[#007a5a]" />
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Bell className="mx-auto mb-3 size-8 text-slate-300" />
          <p className="text-sm font-extrabold text-[#0f1d40]">
            {nT.emptyTitle}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`cursor-pointer p-4 text-start transition sm:p-5 ${
                !item.is_read
                  ? 'bg-[#f4fbf8] hover:bg-[#eaf8f2]/80'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {!item.is_read && (
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#007a5a]" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-[#0f1d40]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-600">
                    {item.message}
                  </p>
                  <span className="mt-2 block text-[11px] font-semibold text-slate-400">
                    {formatNotifDate(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}