'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SellerDashboard, type SellerUnitItem } from './seller-dashboard'
import { BuyerDashboard, type BuyerRequestItem } from './buyer-dashboard'

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
  const [currentView, setCurrentView] = useState<'seller' | 'buyer'>(
    initialView
  )
  const [switching, setSwitching] = useState(false)

  const mainBuyerRequest =
    buys.find((b) => {
      const areasStr = Array.isArray(b.preferred_areas)
        ? b.preferred_areas.join(' ')
        : String(b.preferred_areas || '')
      return !areasStr.includes('🎯') && !areasStr.includes('حجز وحدة')
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
    <div>
      {sells.length > 0 && buys.length > 0 && (
        <div className="mx-auto mb-6 flex max-w-[680px] justify-center gap-2 px-4">
          <button
            type="button"
            onClick={() => handleSwitch('seller')}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              currentView === 'seller'
                ? 'bg-[#0b6954] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>لوحة البائع ({sells.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitch('buyer')}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              currentView === 'buyer'
                ? 'bg-[#0b6954] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>لوحة المشتري</span>
          </button>
        </div>
      )}

      {switching ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-xs font-bold text-[#0b6954]">
          <Loader2 className="size-6 animate-spin" />
          <span>جاري فتح اللوحة...</span>
        </div>
      ) : currentView === 'seller' ? (
        <SellerDashboard
          sells={sells}
          initialSelectedUnitId={initialSelectedUnitId}
          offersCountMap={offersCountMap}
          matchedBuyersCountMap={matchedBuyersCountMap}
          deletionRequested={deletionRequested}
        />
      ) : (
        <BuyerDashboard
          buyReq={mainBuyerRequest}
          marketUnits={activeMarketUnits}
          deletionRequested={deletionRequested}
        />
      )}
    </div>
  )
}