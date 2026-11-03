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
  const currencySymbol = '$'

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
      // فلترة رسمية: استبعاد أي صف بدون UUID حقيقي أو من خارج جورجيا
      const validUnits = units.filter((u: any) => {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(u?.id || ''))
        const areaVal = u.area || u.documents?.__unit_meta?.area
        return isUuid && !isNonGeorgianLegacyArea(areaVal)
      })

      realUnitCount = validUnits.length
      totalMarketValue = validUnits.reduce((sum, u: any) => {
        const unitVal =
          Number(u.market_price) ||
          Number(u.contract_price) ||
          Number(u.paid_amount) ||
          0
        return sum + unitVal
      }, 0)

      for (const u of validUnits.slice(0, 24)) {
        const meta = u.documents?.__unit_meta || {}
        const imgs =
          Array.isArray(u.images) && u.images.length > 0 ? u.images : []
        const paidVal = Number(u.paid_amount || 0)
        const contractVal = Number(u.contract_price) || paidVal
        const marketVal = Number(u.market_price) || contractVal
        const remainingVal = Math.max(0, contractVal - paidVal)
        const commission = Math.round(contractVal * 0.0125)
        const gainVal =
          marketVal > contractVal
            ? Math.max(0, marketVal - contractVal - commission)
            : 0

        const delivYearNum = Number(u.delivery_year || meta.delivery_year) || 0
        const rawDelStatus = String(
          u.delivery_status || meta.delivery_status || ''
        ).trim()
        const isReady =
          rawDelStatus.includes('جاهز') ||
          rawDelStatus.includes('فوري') ||
          rawDelStatus.includes('مستلم') ||
          rawDelStatus.toLowerCase().includes('ready')
        const yearMatch = rawDelStatus.match(/20\d{2}/)

        const deliveryText = delivYearNum
          ? isReady
            ? `جاهزة (${delivYearNum})`
            : String(delivYearNum)
          : yearMatch
            ? yearMatch[0]
            : isReady
              ? 'جاهزة'
              : rawDelStatus || '2026'

        const numericCode = String(u.id || '')
          .replace(/\D/g, '')
          .slice(0, 5)
        const fallbackCode = String(u.id || '')
          .slice(0, 5)
          .toUpperCase()
        const code =
          u.code || `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`

        const isFeat =
          Boolean(u.is_featured) &&
          (!u.featured_until || new Date(u.featured_until) > new Date())

        const resolvedBoostTier: 'super_vip' | 'vip_plus' | null = isFeat
          ? u.boost_tier === 'vip_plus'
            ? 'vip_plus'
            : 'super_vip'
          : null

        // الميعاد الرسمي الموحد في كل الموقع: تاريخ موافقة الأدمن (أو تاريخ الرفع كبديل)
        const unifiedPublishedAt =
          u.approved_at || meta.approved_at || u.created_at

        dbUnits.push({
          id: String(u.id),
          code,
          title: sanitizeGeorgiaProjectTitle(u.project_name),
          developer: u.developer_name || '',
          area: u.area || meta.area || 'Tbilisi - Saburtalo',
          unitTypeLabel: u.unit_type || meta.unit_type || 'Apartment',
          category: 'exit',
          price: paidVal,
          contractPrice: contractVal,
          marketPrice: marketVal,
          remainingAmount: remainingVal,
          gainAmount: gainVal,
          negotiable: Boolean(u.willing_to_discount),
          installmentAmount:
            Number(u.installment_amount ?? meta.installment_amount) || 0,
          installmentFreq:
            u.installment_frequency || meta.installment_frequency || 'شهري',
          deliveryText,
          size: Number(u.size ?? meta.size) || 65,
          rooms: Number(u.rooms ?? meta.rooms) || 2,
          bedrooms: Math.max(1, (Number(u.rooms ?? meta.rooms) || 2) - 1),
          bathrooms: Number(u.bathrooms ?? meta.bathrooms) || 1,
          floor:
            u.floor_number !== null && u.floor_number !== undefined
              ? Number(u.floor_number)
              : undefined,
          totalFloors: Number(u.total_floors ?? meta.total_floors) || 16,
          image: imgs[0] || DEFAULT_FALLBACK_IMG,
          images: imgs.length > 0 ? imgs : undefined,
          imagesCount: Math.max(1, imgs.length),
          isFeatured: isFeat,
          boostTier: resolvedBoostTier,
          docsVerified: u.docs_verified ?? true,
          viewsCount: Math.max(1, Number(u.views_count) || 1),
          createdAt: unifiedPublishedAt,
          features: Array.isArray(u.features)
            ? u.features
            : Array.isArray(meta.features)
              ? meta.features
              : [],
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
