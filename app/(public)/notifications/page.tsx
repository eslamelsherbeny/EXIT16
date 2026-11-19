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

type NotifItem = {
  id: string
  title: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
}

export default function ClientNotificationsPage() {
  const router = useRouter()
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const tCommon = dict.accountPages.common
  const nT = (dict.accountPages as Record<string, any>)?.notifications || {}

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NotifItem[]>([])
  const [isPending, startTransition] = useTransition()

  async function loadNotifications() {
    setLoading(true)
    const res = await getUserNotificationsAction('client', 100)
    if (!res.success && res.notifications.length === 0) {
      // قد يكون غير مسجل دخول
    }
    setItems((res.notifications || []) as NotifItem[])
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [locale])

  const unreadItems = useMemo(
    () => items.filter((item) => !item.is_read),
    [items]
  )
  const olderItems = useMemo(
    () => items.filter((item) => item.is_read),
    [items]
  )

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

  const handleItemClick = (notif: NotifItem) => {
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
    if (unreadItems.length === 0) return
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })))
    startTransition(async () => {
      await markAllNotificationsAsReadAction('client')
    })
  }

  if (loading) {
    return (
      <main
        dir={dir}
        className="flex min-h-[70vh] items-center justify-center bg-[var(--brand-surface,#f5f6f8)]"
      >
        <div className="flex items-center gap-2 font-bold text-[#007a5a]">
          <Loader2 className="size-5 animate-spin" />
          <span>{nT.loading || tCommon.backShort}</span>
        </div>
      </main>
    )
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-8 pb-20 text-[var(--brand-navy,#0a1122)] sm:py-12"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#007a5a] hover:text-[#007a5a]"
          >
            {isRtl ? (
              <ArrowRight className="size-4" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
            <span>{tCommon.backToAccount}</span>
          </Link>

          {unreadItems.length > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#eaf8f2] px-3.5 py-2 text-xs font-extrabold text-[#007a5a] transition hover:bg-[#007a5a] hover:text-white"
            >
              <CheckCheck className="size-4" />
              <span>{nT.markAllReadBtn}</span>
            </button>
          )}
        </div>

        <header className="mb-6 text-start">
          <h1 className="text-2xl font-black text-[#0a1122] sm:text-3xl">
            {nT.title}
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            {nT.subtitle}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-gray-200/90 bg-white p-12 text-center shadow-2xs">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#007a5a]">
              <Bell className="size-6" />
            </div>
            <p className="text-base font-extrabold text-[#0a1122]">
              {nT.emptyTitle}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500">
              {nT.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {unreadItems.length > 0 && (
              <section>
                <span className="mb-2.5 block px-1 text-start text-xs font-extrabold text-[#007a5a]">
                  {nT.newSectionHeader} ({unreadItems.length})
                </span>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-[22px] border border-emerald-200/90 bg-white shadow-xs">
                  {unreadItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="cursor-pointer bg-[#f6fcf9] p-5 text-start transition hover:bg-[#eaf8f2]/70"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#007a5a]" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm leading-snug font-black text-[#0a1122] sm:text-base">
                            {item.title}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed font-semibold text-gray-600 sm:text-sm">
                            {item.message}
                          </p>
                          <span className="mt-2.5 block text-[11px] font-semibold text-gray-400">
                            {formatNotifDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {olderItems.length > 0 && (
              <section>
                <span className="mb-2.5 block px-1 text-start text-xs font-extrabold text-gray-400">
                  {nT.olderSectionHeader}
                </span>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-[22px] border border-gray-200/90 bg-white shadow-2xs">
                  {olderItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="cursor-pointer p-5 text-start transition hover:bg-gray-50/80"
                    >
                      <h3 className="text-sm leading-snug font-extrabold text-[#0a1122] sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
                        {item.message}
                      </p>
                      <span className="mt-2.5 block text-[11px] font-semibold text-gray-400">
                        {formatNotifDate(item.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}