import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import type { SellerUnitItem } from '@/components/features/account/seller-dashboard'
import type { BuyerRequestItem } from '@/components/features/account/buyer-dashboard'
import { AccountActionLinks } from '@/components/features/account/delete-account-modal'
import { AccountViewSwitcher } from '@/components/features/account/account-view-switcher'
import { AccountTopBar } from '@/components/features/account/account-top-bar'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { getServerI18n } from '@/lib/get-server-dictionary'
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import {
  calculateSmartMatch,
  isNonGeorgianLegacyArea,
} from '@/lib/smart-matcher'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; unitId?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const sessionId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !sessionId) {
    redirect('/login')
  }

  const supabase = await getSupabase()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (!profile) {
    redirect('/login')
  }

  // التحقق الأمني الصارم من التوقيع المشفر للكوكي وعدم إيقاف الحساب
  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    profile.password_hash
  )
  const userStatus = String(profile.status || 'active').trim().toLowerCase()

  if (!sessionCheck.valid || userStatus === 'suspended') {
    redirect('/login')
  }

  const { dict, dir } = await getServerI18n()
  const tMain = dict.accountPages.main

  const cleanEmail = (profile.email || '').trim().toLowerCase()
  const cleanPhone = (profile.phone || '').trim()

  const [
    { data: allSells },
    { data: allBuys },
    { data: activeMarketUnits },
    { data: allOffers },
  ] = await Promise.all([
    supabase
      .from('sell_requests')
      .select('*')
      .neq('status', 'deleted_by_seller')
      .order('created_at', { ascending: false }),
    supabase
      .from('buy_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('sell_requests')
      .select('*')
      .in('status', ['active', 'approved', 'published'])
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('property_offers')
      .select('id, property_id, lead_id, buyer_user_id, seller_user_id, status')
      .neq('status', 'rejected'),
  ])

  const sells = ((allSells as SellerUnitItem[]) || []).filter(
    (s: any) =>
      s.status !== 'deleted_by_seller' &&
      (s.user_id === profile.id ||
        (cleanEmail &&
          String(s.email || '').trim().toLowerCase() === cleanEmail) ||
        (cleanPhone && String(s.phone || '').trim() === cleanPhone))
  )

  const buys = ((allBuys as BuyerRequestItem[]) || []).filter(
    (b: any) =>
      b.user_id === profile.id ||
      (cleanEmail &&
        String(b.email || '').trim().toLowerCase() === cleanEmail) ||
      (cleanPhone && String(b.phone || '').trim() === cleanPhone)
  )

  const georgiaMarketUnits = (
    (activeMarketUnits as SellerUnitItem[]) || []
  ).filter((u) => !isNonGeorgianLegacyArea(u.area))

  const offersCountMap: Record<string, number> = {}
  ;(allOffers || []).forEach((o: any) => {
    if (o.property_id && o.status !== 'recommended') {
      offersCountMap[o.property_id] = (offersCountMap[o.property_id] || 0) + 1
    }
  })

  const myLeadIds = new Set(buys.map((b) => b.id))
  const myUnitIds = new Set(sells.map((s) => s.id))
  const directBuyerOffers = (allOffers || []).filter(
    (o: any) =>
      o.buyer_user_id === profile.id ||
      (o.lead_id && myLeadIds.has(o.lead_id))
  )
  const offeredUnitIds = new Set(
    directBuyerOffers.map((o: any) => String(o.property_id))
  )

  const mainBuyerReq = buys[0] || null
  let smartMatchesForBuyerCount = 0
  if (mainBuyerReq) {
    georgiaMarketUnits.forEach((u) => {
      if (myUnitIds.has(u.id) || offeredUnitIds.has(String(u.id))) return
      const m = calculateSmartMatch(u, mainBuyerReq)
      if (m.score >= 70) {
        smartMatchesForBuyerCount++
      }
    })
  }
  const totalBuyerOffersCount =
    directBuyerOffers.length + smartMatchesForBuyerCount

  const matchedBuyersCountMap: Record<string, number> = {}
  const buyersList = (allBuys as any[]) || []

  sells.forEach((unit) => {
    const matchingBuyers = buyersList.filter((b) => {
      if (b.user_id && b.user_id === profile.id) return false
      const res = calculateSmartMatch(unit, b)
      return res.score >= 65
    })

    matchedBuyersCountMap[unit.id] = matchingBuyers.length
  })

  const hasSells = sells.length > 0
  const hasBuys = buys.length > 0

  const initialView: 'seller' | 'buyer' =
    resolvedParams.view === 'seller' && hasSells
      ? 'seller'
      : resolvedParams.view === 'buyer' && hasBuys
        ? 'buyer'
        : hasSells
          ? 'seller'
          : 'buyer'

  const deletionRequested = Boolean(profile.deletion_requested)

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 pb-24 text-[var(--brand-navy,#0a1122)] sm:py-10"
    >
      <AccountTopBar />

      {hasSells || hasBuys ? (
        <AccountViewSwitcher
          userName={profile.name || ''}
          initialView={initialView}
          sells={sells}
          buys={buys}
          activeMarketUnits={georgiaMarketUnits}
          initialSelectedUnitId={resolvedParams.unitId}
          offersCountMap={offersCountMap}
          buyerOffersCount={totalBuyerOffersCount}
          matchedBuyersCountMap={matchedBuyersCountMap}
          deletionRequested={deletionRequested}
        />
      ) : (
        <ScrollReveal>
          <div className="mx-auto max-w-[680px] px-4 sm:px-6">
            <section className="rounded-[20px] border border-gray-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
              <h2 className="text-lg font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-xl">
                {tMain.emptyWelcomePrefix}{' '}
                {profile.name?.split(' ')[0] || tMain.emptyWelcomeFallbackName}{' '}
                {tMain.emptyWelcomeSuffix}
              </h2>
              <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
                {tMain.emptyDesc}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/sell?new=1"
                  className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
                >
                  {tMain.sellCta}
                </Link>
                <Link
                  href="/buy"
                  className="rounded-xl bg-[var(--brand-navy,#0a1122)] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--brand-navy-hover,#16223f)] sm:text-sm"
                >
                  {tMain.buyCta}
                </Link>
              </div>
            </section>

            <div className="mt-8 flex justify-center [&>*]:justify-center [&_div]:justify-center [&_form]:hidden">
              <AccountActionLinks
                unitsCount={0}
                initialDeletionRequested={deletionRequested}
                position="bottom"
              />
            </div>
          </div>
        </ScrollReveal>
      )}
    </main>
  )
}