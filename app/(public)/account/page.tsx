import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import {
  SellerDashboard,
  type SellerUnitItem,
} from '@/components/account/seller-dashboard'
import {
  BuyerDashboard,
  type BuyerRequestItem,
} from '@/components/account/buyer-dashboard'
import { AccountActionLinks } from '@/components/account/delete-account-modal'

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
  const sessionId = cookieStore.get('user_session')?.value

  if (!sessionId) {
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
      .order('created_at', { ascending: false }),
    supabase
      .from('buy_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('sell_requests')
      .select('*')
      .in('status', ['active', 'approved', 'published'])
      .order('created_at', { ascending: false }),
    supabase.from('property_offers').select('property_id'),
  ])

  const sells = ((allSells as SellerUnitItem[]) || []).filter(
    (s: any) =>
      s.user_id === profile.id ||
      (cleanEmail &&
        String(s.email || '').trim().toLowerCase() === cleanEmail) ||
      (cleanPhone && String(s.phone || '').trim() === cleanPhone)
  )

  const buys = ((allBuys as BuyerRequestItem[]) || []).filter(
    (b: any) =>
      b.user_id === profile.id ||
      (cleanEmail &&
        String(b.email || '').trim().toLowerCase() === cleanEmail) ||
      (cleanPhone && String(b.phone || '').trim() === cleanPhone)
  )

  const offersCountMap: Record<string, number> = {}
  ;(allOffers || []).forEach((o: any) => {
    if (o.property_id) {
      offersCountMap[o.property_id] = (offersCountMap[o.property_id] || 0) + 1
    }
  })

  const hasSells = sells.length > 0
  const hasBuys = buys.length > 0

  const isSellerView =
    resolvedParams.view === 'seller'
      ? true
      : resolvedParams.view === 'buyer'
        ? false
        : hasSells
  const isBuyerView =
    resolvedParams.view === 'buyer' ? true : !isSellerView && hasBuys

  const deletionRequested = Boolean(profile.deletion_requested)

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f6f8] py-8 pb-24 text-[#0a1122] sm:py-12"
    >
      {/* شريط التبديل في حال كان لدى العميل وحدات للبيع وطلب شراء في نفس الوقت */}
      {hasSells && hasBuys && (
        <div className="mx-auto mb-6 flex max-w-[680px] justify-center gap-2 px-4">
          <Link
            href="/account?view=seller"
            className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
              isSellerView
                ? 'bg-[#0b6954] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            لوحة البائع ({sells.length})
          </Link>
          <Link
            href="/account?view=buyer"
            className={`rounded-xl px-5 py-2 text-xs font-bold transition ${
              isBuyerView
                ? 'bg-[#0b6954] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            لوحة المشتري
          </Link>
        </div>
      )}

      {isSellerView && hasSells ? (
        <SellerDashboard
          sells={sells}
          initialSelectedUnitId={resolvedParams.unitId}
          offersCountMap={offersCountMap}
          waitingBuyersCount={4510 + (allBuys?.length || 0)}
          deletionRequested={deletionRequested}
        />
      ) : isBuyerView && hasBuys ? (
        <BuyerDashboard
          buyReq={buys[0]}
          marketUnits={(activeMarketUnits as SellerUnitItem[]) || []}
          deletionRequested={deletionRequested}
        />
      ) : (
        <div className="mx-auto max-w-[680px] px-4 sm:px-6">
          <section className="rounded-[20px] border border-gray-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
            <h2 className="text-lg font-extrabold text-[#0a1122] sm:text-xl">
              أهلاً يا {profile.name?.split(' ')[0] || 'صاحب الحساب'} — ليس لديك
              أي طلبات حالياً
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
              ابدأ الآن بعرض وحدتك للتنازل بدون أوفر واسترداد ما دفعته كاش، أو
              سجل ميزانيتك كمشتري لتصلك الفرص المناسبة.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/sell?new=1"
                className="rounded-xl bg-[#0b6954] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#095443] sm:text-sm"
              >
                عايز أبيع وحدتي
              </Link>
              <Link
                href="/buy"
                className="rounded-xl bg-[#0a1122] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-[#16223f] sm:text-sm"
              >
                عايز أشتري وحدة
              </Link>
            </div>
          </section>

          <AccountActionLinks
            unitsCount={0}
            initialDeletionRequested={deletionRequested}
            position="bottom"
          />
        </div>
      )}
    </main>
  )
}