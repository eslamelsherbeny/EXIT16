'use client'

import Link from 'next/link'
import { Heart, LogOut } from 'lucide-react'
import { logoutAccountAction } from '@/actions/account-actions'
import { useTranslation } from '@/lib/i18n'

export function AccountTopBar() {
  const { t: dict, dir } = useTranslation()
  const tCommon = dict.accountPages.common

  return (
    <div
      dir={dir}
      className="mx-auto mb-5 flex max-w-[1020px] items-center justify-between px-3 sm:px-6"
    >
      <Link
        href="/account/favorites"
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:border-red-200 hover:bg-red-50/40"
      >
        <Heart className="size-3.5 fill-red-500 text-red-500" />
        <span>{tCommon.favorites}</span>
      </Link>

      <form action={logoutAccountAction}>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-600 shadow-2xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <span>{tCommon.logout}</span>
          <LogOut className="size-3.5" />
        </button>
      </form>
    </div>
  )
}
