import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import { Heart, LogOut } from 'lucide-react'
import { logoutAccountAction } from '@/app/actions/account-actions'
import type { SellerUnitItem } from '@/components/account/seller-dashboard'
import type { BuyerRequestItem } from '@/components/account/buyer-dashboard'
import { AccountActionLinks } from '@/components/account/delete-account-modal'
import { AccountViewSwitcher } from '@/components/account/account-view-switcher'

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

  const offersCountMap: Record<string, number> = {}
  ;(allOffers || []).forEach((o: any) => {
    if (o.property_id) {
      offersCountMap[o.property_id] = (offersCountMap[o.property_id] || 0) + 1
    }
  })

  // حساب عدد المشترين الحقيقيين المطابقين لكل وحدة من وحدات البائع
  const matchedBuyersCountMap: Record<string, number> = {}
  const buyersList = (allBuys as any[]) || []

  sells.forEach((unit) => {
    const unitCash = Number(unit.paid_amount) || 0
    const unitArea = (unit.area || '').trim()
    const unitType = (unit.unit_type || '').trim()

    const matchingBuyers = buyersList.filter((b) => {
      if (b.user_id && b.user_id === profile.id) return false
      const bCash = Number(b.available_cash || b.budget || 0)
      const bAreas: string[] = Array.isArray(b.preferred_areas)
        ? b.preferred_areas
        : []
      const bTypes: string[] = Array.isArray(b.unit_types) ? b.unit_types : []

      const cashOk = bCash === 0 || unitCash === 0 || unitCash <= bCash * 1.25
      const areaOk =
        !unitArea ||
        bAreas.length === 0 ||
        bAreas.some((a) => unitArea.includes(a) || a.includes(unitArea))
      const typeOk =
        !unitType ||
        bTypes.length === 0 ||
        bTypes.some((t) => unitType.includes(t) || t.includes(unitType))

      return cashOk && (areaOk || typeOk)
    })

    matchedBuyersCountMap[unit.id] = matchingBuyers.length
  })

  const hasSells = sells.length > 0
  const hasBuys = buys.length > 0

  const initialView: 'seller' | 'buyer' =
    resolvedParams.view === 'buyer'
      ? 'buyer'
      : resolvedParams.view === 'seller'
        ? 'seller'
        : hasSells
          ? 'seller'
          : 'buyer'

  const deletionRequested = Boolean(profile.deletion_requested)

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f6f8] py-6 pb-24 text-[#0a1122] sm:py-10"
    >
      {/* شريط علوي موحد ونظيف للبائع والمشتري (المفضلة + تسجيل الخروج فقط) */}
      <div className="mx-auto mb-5 flex max-w-[1020px] items-center justify-between px-3 sm:px-6">
        <Link
          href="/account/favorites"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-red-200 hover:bg-red-50/40"
        >
          <Heart className="size-3.5 fill-red-500 text-red-500" />
          <span>المفضلة</span>
        </Link>

        <form action={logoutAccountAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-600 shadow-2xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="size-3.5" />
          </button>
        </form>
      </div>

      {hasSells || hasBuys ? (
        <AccountViewSwitcher
          initialView={initialView}
          sells={sells}
          buys={buys}
          activeMarketUnits={(activeMarketUnits as SellerUnitItem[]) || []}
          initialSelectedUnitId={resolvedParams.unitId}
          offersCountMap={offersCountMap}
          matchedBuyersCountMap={matchedBuyersCountMap}
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

          <div className="mt-8 flex justify-center [&>*]:justify-center [&_div]:justify-center">
            <AccountActionLinks
              unitsCount={0}
              initialDeletionRequested={deletionRequested}
              position="bottom"
            />
          </div>
        </div>
      )}
    </main>
  )
}