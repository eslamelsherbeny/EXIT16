'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { SellerDashboard, type SellerUnitItem } from './seller-dashboard'
import { BuyerDashboard, type BuyerRequestItem } from './buyer-dashboard'
import { AccountActionLinks } from './delete-account-modal'
import { useTranslation } from '@/lib/i18n'

export function AccountViewSwitcher({
  initialView,
  sells,
  buys,
  activeMarketUnits,
  initialSelectedUnitId,
  offersCountMap,
  matchedBuyersCountMap,
  deletionRequested,
}: {
  initialView: 'seller' | 'buyer'
  sells: SellerUnitItem[]
  buys: BuyerRequestItem[]
  activeMarketUnits: SellerUnitItem[]
  initialSelectedUnitId?: string
  offersCountMap: Record<string, number>
  matchedBuyersCountMap: Record<string, number>
  deletionRequested: boolean
}) {
  const { t: dict, dir } = useTranslation()
  const t = dict.accountComponents.switcher

  const [currentView, setCurrentView] = useState<'seller' | 'buyer'>(
    initialView
  )
  const [switching, setSwitching] = useState(false)

  const mainBuyerRequest =
    buys.find((b) => {
      const areasStr = Array.isArray(b.preferred_areas)
        ? b.preferred_areas.join(' ')
        : String(b.preferred_areas || '')
      return !areasStr.includes('🎯')
    }) ||
    buys[0] ||
    null

  const handleSwitch = (target: 'seller' | 'buyer') => {
    if (target === currentView) return
    setSwitching(true)
    setCurrentView(target)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('view', target)
      window.history.replaceState({}, '', url.toString())
    }
    setTimeout(() => setSwitching(false), 180)
  }

  return (
    <div dir={dir}>
      {sells.length > 0 && buys.length > 0 && (
        <div className="mx-auto mb-6 flex max-w-[680px] justify-center gap-2 px-4">
          <button
            type="button"
            onClick={() => handleSwitch('seller')}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              currentView === 'seller'
                ? 'bg-[var(--brand-primary,#007a5a)] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>
              {t.sellerTab} ({sells.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('buyer')}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              currentView === 'buyer'
                ? 'bg-[var(--brand-primary,#007a5a)] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{t.buyerTab}</span>
          </button>
        </div>
      )}

      {switching ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
          <Loader2 className="size-6 animate-spin" />
          <span>{t.loading}</span>
        </div>
      ) : currentView === 'seller' && sells.length > 0 ? (
        <SellerDashboard
          sells={sells}
          initialSelectedUnitId={initialSelectedUnitId}
          offersCountMap={offersCountMap}
          matchedBuyersCountMap={matchedBuyersCountMap}
          deletionRequested={deletionRequested}
        />
      ) : currentView === 'buyer' && buys.length > 0 ? (
        <BuyerDashboard
          buyReq={mainBuyerRequest}
          marketUnits={activeMarketUnits}
          deletionRequested={deletionRequested}
        />
      ) : (
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          <section className="rounded-[20px] border border-gray-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
            <h2 className="text-lg font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xl">
              {t.emptyTitle}
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
              {t.emptyDesc}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/sell?new=1"
                className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
              >
                {t.sellCta}
              </Link>
              {buys.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleSwitch('buyer')}
                  className="rounded-xl bg-[var(--brand-navy,#0a1122)] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--brand-navy-hover,#16223f)] sm:text-sm"
                >
                  {t.openBuyerCta}
                </button>
              ) : (
                <Link
                  href="/buy"
                  className="rounded-xl bg-[var(--brand-navy,#0a1122)] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--brand-navy-hover,#16223f)] sm:text-sm"
                >
                  {t.buyCta}
                </Link>
              )}
            </div>
          </section>

          <div className="mt-8 flex justify-center [&>*]:justify-center [&_div]:justify-center [&_form]:hidden">
            <AccountActionLinks
              unitsCount={sells.length}
              initialDeletionRequested={deletionRequested}
              position="bottom"
            />
          </div>
        </div>
      )}
    </div>
  )
}
