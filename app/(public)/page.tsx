import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import {
  HybridHomeClient,
  type HomeUnitCardItem,
} from '@/components/features/home/hybrid-home-client'
import { getServerI18n } from '@/lib/get-server-dictionary'
import { sanitizeGeorgiaProjectTitle } from '@/lib/offer-helpers'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

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

const DEFAULT_FALLBACK_IMG =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'

export default async function HomePage() {
  const { dict } = await getServerI18n()
  const t = dict.home
  const currencySymbol = '₾'

  let realUnitCount = 0
  let totalMarketValue = 0
  const dbUnits: HomeUnitCardItem[] = []

  try {
    const supabase = await getSupabase()
    const { data: units } = await supabase
      .from('sell_requests')
      .select('*')
      .in('status', ['active', 'approved', 'published', 'offer_received'])
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (units && units.length > 0) {
      const georgiaUnits = units.filter((u: any) => {
        const areaVal = u.area || u.documents?.__unit_meta?.area
        return !isNonGeorgianLegacyArea(areaVal)
      })

      realUnitCount = georgiaUnits.length
      totalMarketValue = georgiaUnits.reduce((sum, u: any) => {
        const unitVal =
          Number(u.market_price) ||
          Number(u.contract_price) ||
          Number(u.paid_amount) ||
          0
        return sum + unitVal
      }, 0)

      for (const u of georgiaUnits.slice(0, 12)) {
        const meta = u.documents?.__unit_meta || {}
        const catRaw = u.listing_category || meta.listing_category || 'exit'
        const category = (
          ['exit', 'sale', 'rent_monthly', 'rent_daily'].includes(catRaw)
            ? catRaw
            : 'exit'
        ) as HomeUnitCardItem['category']

        const imgs =
          Array.isArray(u.images) && u.images.length > 0 ? u.images : []
        const priceVal =
          category === 'rent_monthly' || category === 'rent_daily'
            ? Number(u.rent_price || meta.rent_price || u.paid_amount || 0)
            : Number(u.paid_amount || u.contract_price || 0)

        dbUnits.push({
          id: String(u.id),
          title: sanitizeGeorgiaProjectTitle(u.project_name),
          area: u.area || meta.area || 'Tbilisi - Saburtalo',
          category,
          price: priceVal,
          contractPrice: Number(u.contract_price) || priceVal,
          installmentAmount:
            Number(u.installment_amount ?? meta.installment_amount) || 0,
          size: Number(u.size ?? meta.size) || 65,
          rooms: Number(u.rooms ?? meta.rooms) || 2,
          bedrooms: Number(u.bedrooms ?? meta.bedrooms) || 1,
          bathrooms: Number(u.bathrooms ?? meta.bathrooms) || 1,
          floor:
            u.floor_number !== null && u.floor_number !== undefined
              ? Number(u.floor_number)
              : undefined,
          totalFloors: Number(u.total_floors ?? meta.total_floors) || 16,
          image: imgs[0] || DEFAULT_FALLBACK_IMG,
          imagesCount: Math.max(1, imgs.length),
          isFeatured: Boolean(u.is_featured),
          createdAt: u.created_at,
        })
      }
    }
  } catch (err) {
    console.error('Error fetching real stats on HomePage:', err)
  }

  let formattedValue = '0'
  let valueUnitLabel = currencySymbol

  if (totalMarketValue >= 1_000_000_000) {
    formattedValue = (totalMarketValue / 1_000_000_000).toLocaleString(
      'en-US',
      {
        maximumFractionDigits: 2,
      }
    )
    valueUnitLabel = `${t?.stats?.billion || 'B'} ${currencySymbol}`
  } else if (totalMarketValue >= 1_000_000) {
    formattedValue = (totalMarketValue / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })
    valueUnitLabel = `${t?.stats?.million || 'M'} ${currencySymbol}`
  } else {
    formattedValue = totalMarketValue.toLocaleString('en-US')
    valueUnitLabel = currencySymbol
  }

  return (
    <HybridHomeClient
      dbUnits={dbUnits}
      realUnitCount={realUnitCount}
      formattedValue={formattedValue}
      valueUnitLabel={valueUnitLabel}
    />
  )
}