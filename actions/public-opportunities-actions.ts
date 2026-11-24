'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

const PUBLIC_SAFE_UNIT_COLUMNS =
  'id, code, user_id, project_name, developer_name, area, exact_street, house_number, cadastral_code, unit_type, size, kitchen_area, balcony_area, loggia_area, terrace_area, garden_size, rooms, bedrooms, bathrooms, floor_number, total_floors, finishing, building_status, heating_type, year_built, delivery_status, delivery_month, delivery_year, features, video_url, tour_3d_url, allow_online_viewing, description, contract_price, paid_amount, market_price, price_per_sqm, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, boost_tier, featured_until, docs_verified, views_count, approved_at, created_at, unit_meta:documents->__unit_meta'

const CORE_SAFE_UNIT_COLUMNS =
  'id, user_id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at'

async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export async function getPublicOpportunitiesListAction() {
  try {
    const supabase = await getServerSupabase()

    const [primaryRes, acceptedOffersRes] = await Promise.all([
      supabase
        .from('sell_requests')
        .select(PUBLIC_SAFE_UNIT_COLUMNS)
        .in('status', ['active', 'approved', 'published', 'offer_received'])
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('property_offers')
        .select('property_id')
        .eq('status', 'accepted'),
    ])

    const lockedUnitIds = new Set(
      (acceptedOffersRes.data || []).map((o: any) => String(o.property_id))
    )

    let rows: any[] | null = primaryRes.data as any[] | null
    let queryError = primaryRes.error

    if (queryError) {
      const fallbackRes = await supabase
        .from('sell_requests')
        .select(CORE_SAFE_UNIT_COLUMNS)
        .in('status', ['active', 'approved', 'published', 'offer_received'])
        .order('created_at', { ascending: false })
        .limit(5000)
      rows = fallbackRes.data as any[] | null
      queryError = fallbackRes.error
    }

    if (queryError || !rows) return { rows: [] }

    const filtered = rows.filter((row: any) => {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(
        String(row?.id || '')
      )
      const cleanSt = String(row?.status || '').toLowerCase()
      return (
        isValidUuid &&
        cleanSt !== 'transferring' &&
        cleanSt !== 'sold' &&
        !lockedUnitIds.has(String(row.id)) &&
        !isNonGeorgianLegacyArea(row.area)
      )
    })

    return { rows: filtered }
  } catch (err) {
    console.error('getPublicOpportunitiesListAction error:', err)
    return { rows: [] }
  }
}

export async function getPublicUnitDetailsAction(
  rawId: string,
  viewerFingerprint?: string
) {
  try {
    const supabase = await getServerSupabase()
    const profileRes = await getCurrentSellerProfileAction()
    const loggedId =
      profileRes.isLoggedIn && profileRes.user?.id ? profileRes.user.id : null
    const loggedEmail =
      profileRes.isLoggedIn && profileRes.user?.email
        ? String(profileRes.user.email).toLowerCase().trim()
        : null

    let isStaff = false
    if (loggedId) {
      const { data: uRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', loggedId)
        .maybeSingle()
      const role = String(uRow?.role || 'user').trim().toLowerCase()
      isStaff = ['owner', 'admin', 'moderator', 'sales'].includes(role)
    }

    const { data: acceptedOffersList } = await supabase
      .from('property_offers')
      .select('id, property_id, buyer_user_id')
      .eq('status', 'accepted')

    const lockedUnitIds = new Set(
      (acceptedOffersList || []).map((o: any) => String(o.property_id))
    )
    const acceptedOfferOnThisUnit = (acceptedOffersList || []).find(
      (o: any) => String(o.property_id) === String(rawId)
    )

    let resolvedUnit: any = null
    let liveViewsCount: number | null = null
    let sameProjectCount = 0

    if (rawId) {
      const primaryUnitRes = await supabase
        .from('sell_requests')
        .select(PUBLIC_SAFE_UNIT_COLUMNS)
        .eq('id', rawId)
        .neq('status', 'deleted_by_seller')
        .maybeSingle()

      let dbUnit: any = primaryUnitRes.data

      if (primaryUnitRes.error) {
        const fallbackUnit = await supabase
          .from('sell_requests')
          .select(CORE_SAFE_UNIT_COLUMNS)
          .eq('id', rawId)
          .neq('status', 'deleted_by_seller')
          .maybeSingle()
        dbUnit = fallbackUnit.data as any
      }

      if (dbUnit) {
        const cleanSt = String(dbUnit.status || '').toLowerCase()
        const isUnderContractDeal =
          cleanSt === 'transferring' || Boolean(acceptedOfferOnThisUnit)
        const isSoldFinal = cleanSt === 'sold'

        const isPublicStatus =
          [
            'active',
            'approved',
            'published',
            'offer_received',
            'transferring',
          ].includes(cleanSt) && !isSoldFinal

        const isOwnerViewing = Boolean(
          loggedId && dbUnit.user_id && dbUnit.user_id === loggedId
        )
        const isAcceptedBuyerViewing = Boolean(
          loggedId &&
            acceptedOfferOnThisUnit?.buyer_user_id &&
            String(acceptedOfferOnThisUnit.buyer_user_id) === String(loggedId)
        )

        if (
          isPublicStatus ||
          isOwnerViewing ||
          isAcceptedBuyerViewing ||
          isStaff
        ) {
          resolvedUnit = {
            ...dbUnit,
            __isUnderContractDeal: isUnderContractDeal,
            __isAcceptedBuyerViewing: isAcceptedBuyerViewing,
          }
          liveViewsCount = Math.max(1, Number(dbUnit.views_count) || 1)

          if (!isOwnerViewing && viewerFingerprint) {
            const viewerIdentity = loggedId
              ? `user_${loggedId}`
              : loggedEmail
                ? `email_${loggedEmail}`
                : viewerFingerprint

            const { data: updatedViews, error: rpcErr } = await supabase.rpc(
              'record_unique_unit_view',
              {
                target_unit_id: rawId,
                p_viewer_key: viewerIdentity,
              }
            )

            if (!rpcErr && typeof updatedViews === 'number') {
              liveViewsCount = updatedViews
            } else if (rpcErr) {
              await supabase.rpc('increment_unit_views', {
                target_unit_id: rawId,
              })
            }
          }

          if (dbUnit.area) {
            const { count } = await supabase
              .from('sell_requests')
              .select('id', { count: 'exact', head: true })
              .in('status', [
                'active',
                'approved',
                'published',
                'offer_received',
              ])
              .eq('area', dbUnit.area)
              .neq('id', rawId)
            sameProjectCount = count || 0
          }
        }
      }
    }

    const primaryOthersRes = await supabase
      .from('sell_requests')
      .select(PUBLIC_SAFE_UNIT_COLUMNS)
      .in('status', ['active', 'approved', 'published', 'offer_received'])
      .neq('id', rawId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12)

    let otherUnits: any[] | null = primaryOthersRes.data as any[] | null

    if (primaryOthersRes.error) {
      const fallbackOthers = await supabase
        .from('sell_requests')
        .select(CORE_SAFE_UNIT_COLUMNS)
        .in('status', ['active', 'approved', 'published', 'offer_received'])
        .neq('id', rawId)
        .order('created_at', { ascending: false })
        .limit(12)
      otherUnits = fallbackOthers.data as any[] | null
    }

    const similarRows = (otherUnits || [])
      .filter(
        (u: any) =>
          !isNonGeorgianLegacyArea(u.area) && !lockedUnitIds.has(String(u.id))
      )
      .slice(0, 6)

    return {
      currentUserId: loggedId,
      unitRow: resolvedUnit,
      liveViewsCount,
      sameProjectCount,
      similarRows,
    }
  } catch (err) {
    console.error('getPublicUnitDetailsAction error:', err)
    return {
      currentUserId: null,
      unitRow: null,
      liveViewsCount: null,
      sameProjectCount: 0,
      similarRows: [],
    }
  }
}