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
          .select(
            'id, user_id, available_cash, max_installment, payment_plan, budget, unit_types, min_rooms, delivery_status, preferred_areas, status'
          )
          .neq('user_id', profile.id),
        supabase
          .from('sell_requests')
          .select('*')
          .in('status', ['active', 'approved', 'published'])
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('property_offers')
          .select(
            'id, property_id, lead_id, buyer_user_id, seller_user_id, status'
          )
          .neq('status', 'rejected'),
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

  // استبعاد وحدات المستخدم نفسه من رادار الشراء حتى لا يشتري وحدته
  const georgiaMarketUnits = (activeMarketUnits as SellerUnitItem[]).filter(
    (u) => u && !isNonGeorgianLegacyArea(u.area) && !myUnitIds.has(String(u.id))
  )

  const offersCountMap: Record<string, number> = {}
  allOffers.forEach((o: any) => {
    if (o && o.property_id && o.status !== 'recommended') {
      offersCountMap[o.property_id] = (offersCountMap[o.property_id] || 0) + 1
    }
  })

  // عداد عروض المشتري يحسب فقط العروض الحقيقية المقدمة أو المرشحة من الأدمن (بدون تكرار وحدات السوق)
  const myLeadIds = new Set(buys.map((b) => b.id))
  const directBuyerOffers = allOffers.filter(
    (o: any) =>
      o &&
      (o.buyer_user_id === profile.id ||
        (o.lead_id && myLeadIds.has(o.lead_id)))
  )
  const totalBuyerOffersCount = directBuyerOffers.length

  const matchedBuyersCountMap: Record<string, number> = {}

  sells.forEach((unit) => {
    try {
      const matchingBuyers = allBuyersForMatch.filter((b: any) => {
        if (!b || (b.user_id && b.user_id === profile.id)) return false
        const res = calculateSmartMatch(unit, b, undefined, locale)
        return res.score >= 65
      })
      matchedBuyersCountMap[unit.id] = matchingBuyers.length
    } catch {
      matchedBuyersCountMap[unit.id] = 0
    }
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