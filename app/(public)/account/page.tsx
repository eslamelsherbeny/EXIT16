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

function deriveUnitCode(id: string) {
  const numericCode = String(id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(id || '')
    .slice(0, 5)
    .toUpperCase()
  return `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`
}

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
  searchParams?:
    | Promise<{ view?: string; unitId?: string }>
    | { view?: string; unitId?: string }
}) {
  let resolvedParams: { view?: string; unitId?: string } = {}
  try {
    resolvedParams = searchParams ? await Promise.resolve(searchParams) : {}
  } catch {
    resolvedParams = {}
  }

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

  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    profile.password_hash
  )
  const userStatus = String(profile.status || 'active').trim().toLowerCase()

  if (!sessionCheck.valid || userStatus === 'suspended') {
    redirect('/login')
  }

  const { dict, dir, locale } = await getServerI18n()
  const tMain = dict.accountPages.main

  const cleanEmail = String(profile.email || '').trim().toLowerCase()
  const cleanPhone = String(profile.phone || '').trim()

  try {
    if (cleanEmail) {
      await Promise.all([
        supabase
          .from('sell_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .ilike('email', cleanEmail),
        supabase
          .from('buy_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .ilike('email', cleanEmail),
      ])
    }
    if (cleanPhone) {
      await Promise.all([
        supabase
          .from('sell_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .eq('phone', cleanPhone),
        supabase
          .from('buy_requests')
          .update({ user_id: profile.id })
          .is('user_id', null)
          .eq('phone', cleanPhone),
      ])
    }
  } catch {}

  let mySellsData: any[] = []
  let myBuysData: any[] = []
  let allBuyersForMatch: any[] = []
  let activeMarketUnits: any[] = []
  let allOffers: any[] = []

  try {
    const [mySellsRes, myBuysRes, allBuysRes, marketRes, offersRes] =
      await Promise.all([
        supabase
          .from('sell_requests')
          .select('*')
          .eq('user_id', profile.id)
          .neq('status', 'deleted_by_seller')
          .order('created_at', { ascending: false }),
        supabase
          .from('buy_requests')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('buy_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('sell_requests')
          .select('*')
          .in('status', ['active', 'approved', 'published', 'offer_received'])
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('property_offers')
          .select(
            'id, property_id, lead_id, buyer_user_id, seller_user_id, status'
          ),
      ])

    mySellsData = mySellsRes.data || []
    myBuysData = myBuysRes.data || []
    allBuyersForMatch = allBuysRes.data || []
    activeMarketUnits = marketRes.data || []
    allOffers = offersRes.data || []
  } catch (dbErr) {
    console.error('Account page queries error:', dbErr)
  }

  const sells = (mySellsData as SellerUnitItem[]).filter(
    (s: any) => s && s.status !== 'deleted_by_seller'
  )
  const buys = (myBuysData as BuyerRequestItem[]).filter(Boolean)
  const myUnitIds = new Set(sells.map((s) => String(s.id)))

  const georgiaMarketUnits = (activeMarketUnits as SellerUnitItem[]).filter(
    (u) => u && !isNonGeorgianLegacyArea(u.area) && !myUnitIds.has(String(u.id))
  )

  // حساب عروض البائع لكل وحدة (العروض المباشرة + المشترين المتوافقين وحاجزي الوحدة)
  const offersCountMap: Record<string, number> = {}
  const matchedBuyersCountMap: Record<string, number> = {}

  sells.forEach((unit) => {
    const unitIdStr = String(unit.id)
    const uCode = deriveUnitCode(unitIdStr)

    const unitAllOffers = allOffers.filter(
      (o: any) => o && String(o.property_id) === unitIdStr
    )
    const activeDirectOffers = unitAllOffers.filter(
      (o: any) => o.status !== 'rejected'
    )

    const coveredLeadIds = new Set(
      unitAllOffers.map((o: any) => String(o.lead_id || '')).filter(Boolean)
    )
    const coveredBuyerUserIds = new Set(
      unitAllOffers
        .map((o: any) => String(o.buyer_user_id || ''))
        .filter(Boolean)
    )

    let unbridgedMatchingLeadsCount = 0
    let totalMatchingBuyersCount = 0

    allBuyersForMatch.forEach((b: any) => {
      if (!b || !b.id) return
      if (b.user_id && String(b.user_id) === String(profile.id)) return

      try {
        const areasStr = Array.isArray(b.preferred_areas)
          ? b.preferred_areas.join(' ')
          : String(b.preferred_areas || '')
        const planStr = String(b.payment_plan || '')

        const isDirectUnitBooking =
          areasStr.includes(uCode) ||
          planStr.includes(uCode) ||
          (unit.project_name &&
            areasStr.includes('🎯') &&
            areasStr.toLowerCase().includes(unit.project_name.toLowerCase()))

        const res = calculateSmartMatch(unit, b, undefined, locale)
        if (isDirectUnitBooking || res.score >= 65) {
          totalMatchingBuyersCount++
          const isAlreadyInOffers =
            coveredLeadIds.has(String(b.id)) ||
            (b.user_id && coveredBuyerUserIds.has(String(b.user_id)))
          if (!isAlreadyInOffers) {
            unbridgedMatchingLeadsCount++
          }
        }
      } catch {}
    })

    matchedBuyersCountMap[unit.id] = totalMatchingBuyersCount
    offersCountMap[unit.id] =
      activeDirectOffers.length + unbridgedMatchingLeadsCount
  })

  // حساب عروض المشتري (العروض المقدمة + الترشيحات المطابقة في صفحة عروضي)
  const myLeadIds = new Set(buys.map((b) => String(b.id)))
  const directBuyerOffers = allOffers.filter(
    (o: any) =>
      o &&
      o.status !== 'recommended' &&
      o.status !== 'rejected' &&
      (String(o.buyer_user_id || '') === String(profile.id) ||
        (o.lead_id && myLeadIds.has(String(o.lead_id))))
  )
  const offeredUnitIds = new Set(
    directBuyerOffers.map((o: any) => String(o.property_id))
  )

  const mainBuyerReq =
    buys.find((b) => {
      const areasStr = Array.isArray(b.preferred_areas)
        ? b.preferred_areas.join(' ')
        : String(b.preferred_areas || '')
      return !areasStr.includes('🎯')
    }) ||
    buys[0] ||
    null

  let smartMatchesForBuyerCount = 0
  if (mainBuyerReq) {
    const seenSignatures = new Set<string>()
    georgiaMarketUnits.forEach((u) => {
      try {
        if (myUnitIds.has(String(u.id)) || offeredUnitIds.has(String(u.id)))
          return
        const m = calculateSmartMatch(u, mainBuyerReq, undefined, locale)
        if (m.score >= 70) {
          const sig = `${u.project_name || ''}_${u.area || ''}_${u.paid_amount || 0}_${u.unit_type || ''}`
          if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig)
            smartMatchesForBuyerCount++
          }
        }
      } catch {}
    })
  }

  const totalBuyerOffersCount =
    directBuyerOffers.length + smartMatchesForBuyerCount

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
      <AccountTopBar userName={profile.name || ''} />

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