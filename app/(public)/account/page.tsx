import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import type { SellerUnitItem } from '@/components/features/account/seller-dashboard'
import type {
  BuyerRequestItem,
  PurchasedUnitSummary,
} from '@/components/features/account/buyer-dashboard'
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

const PENDING_ADMIN_TAG = '__PENDING_ADMIN_VERIFICATION__'
const AUTO_PUBLISH_MATCH_THRESHOLD = 80

function normalizeOfferStatus(raw: any): string {
  const rawDiffs = Array.isArray(raw?.diff_reasons) ? raw.diff_reasons : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)
  if (
    raw?.status === 'pending_admin' ||
    (raw?.status === 'recommended' &&
      (raw?.initiated_by === 'buyer' || hasPendingAdminTag))
  ) {
    return 'pending_admin'
  }
  return String(raw?.status || 'pending_admin')
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    redirect('/login?expired=1')
  }

  const supabase = await getSupabase()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (!profile) {
    redirect('/login?expired=1')
  }

  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    profile.password_hash
  )
  const userStatus = String(profile.status || 'active').trim().toLowerCase()

  if (!sessionCheck.valid || userStatus === 'suspended') {
    redirect('/login?expired=1')
  }

  const { dict, dir, locale } = await getServerI18n()
  const tMain = dict.accountPages.main

  let mySellsData: any[] = []
  let myBuysData: any[] = []
  let allBuyersForMatch: any[] = []
  let activeMarketUnits: any[] = []
  let allOffers: any[] = []
  let myBoostRows: any[] = []

  try {
    const [mySellsRes, myBuysRes, allBuysRes, marketRes, offersRes, boostsRes] =
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
          .neq('status', 'closed')
          .neq('status', 'archived')
          .order('created_at', { ascending: false }),
        supabase
          .from('sell_requests')
          .select('*')
          .in('status', [
            'active',
            'approved',
            'published',
            'offer_received',
            'sold',
          ])
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('property_offers')
          .select(
            'id, property_id, lead_id, buyer_user_id, seller_user_id, offered_cash, status, initiated_by, diff_reasons, updated_at'
          ),
        supabase
          .from('boost_requests')
          .select('*')
          .eq('user_id', profile.id)
          .neq('status', 'awaiting_payment')
          .order('created_at', { ascending: false }),
      ])

    mySellsData = mySellsRes.data || []
    myBuysData = myBuysRes.data || []
    allBuyersForMatch = allBuysRes.data || []
    activeMarketUnits = marketRes.data || []
    allOffers = offersRes.data || []
    myBoostRows = boostsRes.data || []
  } catch (dbErr) {
    console.error('Account page queries error:', dbErr)
  }

  // إثراء كل وحدة ببيانات التمييز ومزامنة المراحل (4 و 5) مع جدول العروض مباشرة لتطابق 100% مع لوحة الأدمن
  const sells = (mySellsData as any[])
    .filter((s) => s && s.status !== 'deleted_by_seller')
    .map((unit) => {
      const unitIdStr = String(unit.id)
      const unitBoosts = myBoostRows.filter(
        (b) => String(b.unit_id || '') === unitIdStr
      )
      const latestPendingBoost = unitBoosts.find(
        (b) =>
          b.status === 'paid_pending_approval' ||
          b.status === 'pending_admin_approval'
      )
      const latestApprovedBoost = unitBoosts.find(
        (b) => b.status === 'approved'
      )

      const existingDocs =
        unit.documents && typeof unit.documents === 'object'
          ? { ...unit.documents }
          : {}
      const existingMeta =
        existingDocs.__unit_meta && typeof existingDocs.__unit_meta === 'object'
          ? { ...existingDocs.__unit_meta }
          : {}

      const isCurrentlyLiveBoost =
        Boolean(unit.is_featured) &&
        (!unit.featured_until || new Date(unit.featured_until) > new Date())

      if (latestPendingBoost) {
        const tierCode = String(latestPendingBoost.package_tier || '')
          .toUpperCase()
          .includes('VIP+')
          ? 'vip_plus'
          : 'super_vip'

        existingMeta.boost_pending = {
          ...(existingMeta.boost_pending || {}),
          order_ref:
            latestPendingBoost.order_ref ||
            existingMeta.boost_pending?.order_ref ||
            unit.featured_fawry_code ||
            null,
          paid_via:
            latestPendingBoost.payment_method ||
            existingMeta.boost_pending?.paid_via ||
            'flitt',
          paid_at:
            existingMeta.boost_pending?.paid_at ||
            latestPendingBoost.created_at ||
            null,
          tier: tierCode,
          days: Number(latestPendingBoost.duration_days) || 1,
          amount_gel: Number(latestPendingBoost.amount_gel) || 0,
          is_renewal: isCurrentlyLiveBoost,
        }
      }

      if (isCurrentlyLiveBoost && latestApprovedBoost) {
        existingMeta.boost_active = {
          ...(existingMeta.boost_active || {}),
          started_at:
            existingMeta.boost_active?.started_at ||
            latestApprovedBoost.approved_at ||
            latestApprovedBoost.created_at ||
            null,
          ends_at:
            unit.featured_until || existingMeta.boost_active?.ends_at || null,
          order_ref:
            existingMeta.boost_active?.order_ref ||
            latestApprovedBoost.order_ref ||
            unit.featured_fawry_code ||
            null,
          amount_gel:
            existingMeta.boost_active?.amount_gel ??
            Number(latestApprovedBoost.amount_gel || unit.featured_price || 0),
        }
      }

      existingDocs.__unit_meta = existingMeta

      // مزامنة المرحلة مع العروض الفعلية المعتمدة للبائع
      const unitLiveOffers = allOffers
        .filter((o: any) => o && String(o.property_id) === unitIdStr)
        .map((o: any) => ({ ...o, status: normalizeOfferStatus(o) }))
        .filter(
          (o: any) => o.status !== 'recommended' && o.status !== 'rejected'
        )

      let syncedStatus = String(unit.status || 'pending').trim().toLowerCase()
      const isLiveInMarket = [
        'active',
        'approved',
        'published',
        'offer_received',
        'transferring',
      ].includes(syncedStatus)

      if (isLiveInMarket && syncedStatus !== 'sold') {
        if (unitLiveOffers.some((o: any) => o.status === 'accepted')) {
          syncedStatus = 'transferring'
        } else if (
          unitLiveOffers.some(
            (o: any) =>
              o.status === 'pending_seller' || o.status === 'counter_offered'
          )
        ) {
          syncedStatus = 'offer_received'
        } else if (
          syncedStatus === 'offer_received' ||
          syncedStatus === 'transferring'
        ) {
          syncedStatus = 'active'
        }
      }

      return {
        ...unit,
        status: syncedStatus,
        documents: existingDocs,
      } as SellerUnitItem
    })

  const buys = (myBuysData as BuyerRequestItem[]).filter(Boolean)
  const myUnitIds = new Set(sells.map((s) => String(s.id)))
  const myLeadIds = new Set(buys.map((b) => String(b.id)))

  const georgiaMarketUnits = (activeMarketUnits as SellerUnitItem[]).filter(
    (u) =>
      u &&
      String(u.status || '').toLowerCase() !== 'sold' &&
      !isNonGeorgianLegacyArea(u.area) &&
      !myUnitIds.has(String(u.id))
  )

  const soldUnitsMap = new Map<string, any>(
    (activeMarketUnits || [])
      .filter((u: any) => String(u.status || '').toLowerCase() === 'sold')
      .map((u: any) => [String(u.id), u])
  )

  const purchasedUnits: PurchasedUnitSummary[] = allOffers
    .filter((o: any) => {
      if (!o || normalizeOfferStatus(o) !== 'accepted') return false
      const isMyBuy =
        String(o.buyer_user_id || '') === String(profile.id) ||
        (o.lead_id && myLeadIds.has(String(o.lead_id)))
      return isMyBuy && soldUnitsMap.has(String(o.property_id))
    })
    .map((o: any) => {
      const u = soldUnitsMap.get(String(o.property_id))
      const numericCode = String(u.id || '')
        .replace(/\D/g, '')
        .slice(0, 5)
      const fallbackCode = String(u.id || '')
        .slice(0, 5)
        .toUpperCase()
      return {
        id: String(u.id),
        code:
          u.code && String(u.code).trim()
            ? String(u.code).trim()
            : `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`,
        projectName: u.project_name || '—',
        area: u.area || '',
        unitType: u.unit_type || '',
        rooms: Number(u.rooms) || 1,
        size: Number(u.size) || 0,
        paidAmount: Number(o.offered_cash || u.paid_amount) || 0,
        contractPrice: Number(u.contract_price || u.paid_amount) || 0,
        image:
          Array.isArray(u.images) && u.images[0] ? u.images[0] : undefined,
        purchasedAt: o.updated_at || u.created_at,
      }
    })

  const offersCountMap: Record<string, number> = {}
  const matchedBuyersCountMap: Record<string, number> = {}

  sells.forEach((unit) => {
    const unitIdStr = String(unit.id)

    const unitApprovedOffers = allOffers.filter((o: any) => {
      if (!o || String(o.property_id) !== unitIdStr) return false
      const st = normalizeOfferStatus(o)
      return (
        st !== 'recommended' && st !== 'pending_admin' && st !== 'rejected'
      )
    })
    offersCountMap[unit.id] = unitApprovedOffers.length

    let totalMatchingBuyersCount = 0
    const unitPhoneDigits = String((unit as any).phone || '').replace(/\D/g, '')

    allBuyersForMatch.forEach((b: any) => {
      if (!b || !b.id) return
      if (b.user_id && String(b.user_id) === String(profile.id)) return
      const bPhoneDigits = String(b.phone || '').replace(/\D/g, '')
      if (
        bPhoneDigits.length >= 8 &&
        unitPhoneDigits.length >= 8 &&
        bPhoneDigits.slice(-8) === unitPhoneDigits.slice(-8)
      ) {
        return
      }
      try {
        const res = calculateSmartMatch(unit, b, undefined, locale)
        if (res.score >= 60) {
          totalMatchingBuyersCount++
        }
      } catch {}
    })
    matchedBuyersCountMap[unit.id] = totalMatchingBuyersCount
  })

  const directBuyerOffers = allOffers.filter((o: any) => {
    if (!o) return false
    const st = normalizeOfferStatus(o)
    return (
      st !== 'recommended' &&
      st !== 'rejected' &&
      (String(o.buyer_user_id || '') === String(profile.id) ||
        (o.lead_id && myLeadIds.has(String(o.lead_id))))
    )
  })
  const offeredUnitIds = new Set(
    directBuyerOffers.map((o: any) => String(o.property_id))
  )

  const adminRecUnitIds = new Set(
    allOffers
      .filter(
        (o: any) =>
          o &&
          normalizeOfferStatus(o) === 'recommended' &&
          (String(o.buyer_user_id || '') === String(profile.id) ||
            (o.lead_id && myLeadIds.has(String(o.lead_id))))
      )
      .map((o: any) => String(o.property_id))
  )

  const mainBuyerReq =
    buys.find((b) => {
      const st = String(b.status || '').toLowerCase()
      if (st === 'closed' || st === 'archived') return false
      const areasStr = Array.isArray(b.preferred_areas)
        ? b.preferred_areas.join(' ')
        : String(b.preferred_areas || '')
      return !areasStr.includes('🎯')
    }) || null

  let smartMatchesForBuyerCount = 0
  if (mainBuyerReq) {
    const seenSignatures = new Set<string>()
    georgiaMarketUnits.forEach((u) => {
      try {
        const uIdStr = String(u.id)
        if (myUnitIds.has(uIdStr) || offeredUnitIds.has(uIdStr)) return
        const m = calculateSmartMatch(u, mainBuyerReq, undefined, locale)
        const isFromAdmin = adminRecUnitIds.has(uIdStr)
        if (isFromAdmin || m.score >= AUTO_PUBLISH_MATCH_THRESHOLD) {
          const sig = `${u.project_name || ''}_${u.area || ''}_${u.paid_amount || 0}_${u.unit_type || ''}`
          if (isFromAdmin || !seenSignatures.has(sig)) {
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
  const hasBuys = buys.length > 0 || purchasedUnits.length > 0

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
          purchasedUnits={purchasedUnits}
          advisorPickedUnitIds={Array.from(adminRecUnitIds)}
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