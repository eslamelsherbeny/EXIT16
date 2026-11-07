'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Building2, ShieldCheck } from 'lucide-react'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import { UnitInterestForm } from '@/components/features/opportunities/unit-interest-form'
import {
  translateStoredFinishing,
  translateStoredInstallmentFreq,
  translateStoredPropertyKind,
} from '@/components/features/seller/seller-options-data'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

import {
  SimilarUnitsSection,
  UnitDetailsHeader,
  UnitFinancialsCard,
  UnitSpecsAndDescription,
} from '@/components/features/opportunities/unit-details-ui'
import { UnitLocationInsights } from '@/components/features/opportunities/unit-location-insights'

const FALLBACK_UNIT_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'
const FAVORITES_STORAGE_KEY = 'darak_favorites'
const RECENTLY_VIEWED_STORAGE_KEY = 'aqar_recently_viewed'
const DEVICE_VIEWER_KEY_STORAGE = 'aqar_device_viewer_fingerprint'

const PUBLIC_UNIT_DETAIL_COLUMNS =
  'id, code, user_id, project_name, developer_name, area, exact_street, house_number, cadastral_code, unit_type, size, kitchen_area, balcony_area, loggia_area, terrace_area, garden_size, rooms, bedrooms, bathrooms, floor_number, total_floors, finishing, building_status, heating_type, year_built, delivery_status, delivery_month, delivery_year, features, video_url, tour_3d_url, allow_online_viewing, description, contract_price, paid_amount, market_price, price_per_sqm, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, boost_tier, featured_until, docs_verified, views_count, approved_at, created_at, documents'

const CORE_UNIT_DETAIL_COLUMNS =
  'id, user_id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at, documents'

function parseSafeNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val
  if (typeof val === 'string') {
    const normalized = val
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/,/g, '')
      .replace(/[^0-9.]/g, '')
    const num = Number(normalized)
    if (Number.isFinite(num) && num > 0) return num
  }
  return fallback
}

function getOrCreateDeviceFingerprint(): string {
  try {
    let fp = localStorage.getItem(DEVICE_VIEWER_KEY_STORAGE)
    if (!fp) {
      fp = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(DEVICE_VIEWER_KEY_STORAGE, fp)
    }
    document.cookie = `aqar_vfp=${fp}; path=/; max-age=31536000; SameSite=Lax`
    return fp
  } catch {
    return 'anon_device'
  }
}

function UnitDetailsPageSkeleton({ dir }: { dir: 'rtl' | 'ltr' }) {
  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 text-[var(--brand-navy,#0a1122)] sm:py-10"
    >
      <div className="mx-auto w-full max-w-[780px] animate-pulse px-4 sm:px-6">
        <div className="h-4 w-28 rounded-md bg-slate-200/90" />

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2.5">
            <div className="h-8 w-64 rounded-xl bg-slate-200 sm:w-80" />
            <div className="h-4 w-44 rounded-md bg-slate-200/80" />
            <div className="h-6 w-24 rounded-md bg-slate-200/70" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-7 w-28 rounded-full bg-emerald-100/80" />
            <div className="h-8 w-20 rounded-lg bg-slate-200/80" />
            <div className="h-8 w-28 rounded-lg bg-slate-200/80" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <div className="h-[250px] rounded-[20px] bg-slate-200/90 sm:col-span-8 sm:h-[360px]" />
          <div className="grid grid-cols-4 gap-2 sm:col-span-4 sm:h-[360px] sm:grid-cols-2 sm:grid-rows-2">
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
            <div className="h-16 rounded-[14px] bg-slate-200/80 sm:h-full" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-6 w-24 rounded-lg bg-slate-200" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="flex h-24 flex-col justify-between rounded-[18px] border border-gray-200/80 bg-white p-4 shadow-2xs"
            >
              <div className="size-4 rounded bg-blue-100" />
              <div className="space-y-1.5">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-3 w-14 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-2xs">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-3.5 w-full rounded bg-slate-100" />
          <div className="h-3.5 w-4/5 rounded bg-slate-100" />
        </div>
      </div>
    </main>
  )
}

export default function PropertyDetailsPage() {
  const { t: dict, locale, dir, siteSettings, isStaff } = useTranslation()
  const t = dict.unitDetailsPage
  const c = dict.opportunitiesPage.card
  const filtersT = dict.opportunitiesPage.filters
  const oT = (dict.accountPages?.offers as Record<string, any>) || {}
  const monthsWord =
    (dict.sell?.extraLabels as Record<string, any>)?.monthsUnit ||
    (t.financials as Record<string, any>)?.monthWord ||
    t.financials.yearWord

  const rawCommPct = Number(siteSettings?.buyerCommission)
  const commissionRate =
    Number.isFinite(rawCommPct) && rawCommPct >= 0 ? rawCommPct / 100 : 0.0125

  const params = useParams()
  const rawId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string) || ''

  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  const [unitRow, setUnitRow] = useState<any | null>(null)
  const [liveViewsCount, setLiveViewsCount] = useState<number | null>(null)
  const [rawSimilarRows, setRawSimilarRows] = useState<any[]>([])
  const [sameProjectCount, setSameProjectCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!rawId) return
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      const list: string[] = stored ? JSON.parse(stored) : []
      setLiked(list.includes(String(rawId)))

      const recentRaw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY)
      const recentList: string[] = recentRaw ? JSON.parse(recentRaw) : []
      const nextRecent = [
        String(rawId),
        ...recentList.filter((x) => x !== String(rawId)),
      ].slice(0, 8)
      localStorage.setItem(
        RECENTLY_VIEWED_STORAGE_KEY,
        JSON.stringify(nextRecent)
      )
    } catch {}
  }, [rawId])

  const handleToggleFavorite = () => {
    if (!rawId) return
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      const list: string[] = stored ? JSON.parse(stored) : []
      const idStr = String(rawId)
      const next = list.includes(idStr)
        ? list.filter((x) => x !== idStr)
        : [...list, idStr]
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
      setLiked(next.includes(idStr))
      window.dispatchEvent(new Event('favorites-updated'))
    } catch {
      setLiked(!liked)
    }
  }

  useEffect(() => {
    async function fetchPropertyDetails() {
      setLoading(true)
      try {
        const profileRes = await getCurrentSellerProfileAction()
        const loggedId =
          profileRes.isLoggedIn && profileRes.user?.id
            ? profileRes.user.id
            : null
        const loggedEmail =
          profileRes.isLoggedIn && profileRes.user?.email
            ? String(profileRes.user.email).toLowerCase().trim()
            : null
        setCurrentUserId(loggedId)

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        if (rawId) {
          const primaryUnitRes = await supabase
            .from('sell_requests')
            .select(PUBLIC_UNIT_DETAIL_COLUMNS)
            .eq('id', rawId)
            .neq('status', 'deleted_by_seller')
            .maybeSingle()

          let dbUnit: any = primaryUnitRes.data

          if (primaryUnitRes.error) {
            const fallbackUnit = await supabase
              .from('sell_requests')
              .select(CORE_UNIT_DETAIL_COLUMNS)
              .eq('id', rawId)
              .neq('status', 'deleted_by_seller')
              .maybeSingle()
            dbUnit = fallbackUnit.data as any
          }

          if (dbUnit) {
            const isPublicStatus = [
              'active',
              'approved',
              'published',
              'offer_received',
            ].includes(String(dbUnit.status || '').toLowerCase())
            const isOwnerViewing = Boolean(
              loggedId && dbUnit.user_id && dbUnit.user_id === loggedId
            )

            if (isPublicStatus || isOwnerViewing || isStaff) {
              setUnitRow(dbUnit)
              setLiveViewsCount(Math.max(1, Number(dbUnit.views_count) || 1))

              if (!isOwnerViewing) {
                const viewerIdentity = loggedId
                  ? `user_${loggedId}`
                  : loggedEmail
                    ? `email_${loggedEmail}`
                    : getOrCreateDeviceFingerprint()
                const localViewedKey = `aqar_viewed_${rawId}_${viewerIdentity}`

                if (!localStorage.getItem(localViewedKey)) {
                  localStorage.setItem(localViewedKey, '1')
                  const { data: updatedViews, error: rpcErr } =
                    await supabase.rpc('record_unique_unit_view', {
                      target_unit_id: rawId,
                      p_viewer_key: viewerIdentity,
                    })

                  if (!rpcErr && typeof updatedViews === 'number') {
                    setLiveViewsCount(updatedViews)
                  } else if (rpcErr) {
                    await supabase.rpc('increment_unit_views', {
                      target_unit_id: rawId,
                    })
                  }
                }
              }

              const unitArea = dbUnit.area
              if (unitArea) {
                const { count } = await supabase
                  .from('sell_requests')
                  .select('id', { count: 'exact', head: true })
                  .in('status', [
                    'active',
                    'approved',
                    'published',
                    'offer_received',
                  ])
                  .eq('area', unitArea)
                  .neq('id', rawId)

                setSameProjectCount(count || 0)
              }
            } else {
              setUnitRow(null)
            }
          }
        }

        const primaryOthersRes = await supabase
          .from('sell_requests')
          .select(PUBLIC_UNIT_DETAIL_COLUMNS)
          .in('status', ['active', 'approved', 'published', 'offer_received'])
          .neq('id', rawId)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(12)

        let otherUnits: any[] | null = primaryOthersRes.data as any[] | null

        if (primaryOthersRes.error) {
          const fallbackOthers = await supabase
            .from('sell_requests')
            .select(CORE_UNIT_DETAIL_COLUMNS)
            .in('status', ['active', 'approved', 'published', 'offer_received'])
            .neq('id', rawId)
            .order('created_at', { ascending: false })
            .limit(12)
          otherUnits = fallbackOthers.data as any[] | null
        }

        if (otherUnits && otherUnits.length > 0) {
          setRawSimilarRows(
            otherUnits
              .filter((u: any) => !isNonGeorgianLegacyArea(u.area))
              .slice(0, 6)
          )
        }
      } catch (err) {
        console.error('Error loading unit details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [rawId, isStaff])

  const similarDbUnits = useMemo(() => {
    return rawSimilarRows.map((u) => {
      const uCurrency = '$'
      const reqCash = parseSafeNumber(u.paid_amount)
      const rawDel = String(u.delivery_status || '').trim()
      const isReady =
        rawDel.includes('جاهز') ||
        rawDel.includes('فوري') ||
        rawDel.includes('مستلم') ||
        rawDel.toLowerCase().includes('ready') ||
        rawDel.toLowerCase().includes('готов') ||
        rawDel.includes('მზად') ||
        rawDel.includes(filtersT.deliveryStatuses[1])

      const parenMatch = rawDel.match(/\(([^)]+)\)/)
      const yearMatch = rawDel.match(/20\d{2}/)
      const delMonth = u.delivery_month
      const delivDisplay = isReady
        ? filtersT.deliveryStatuses[1]
        : parenMatch
          ? parenMatch[1]
          : delMonth
            ? `${delMonth} ${monthsWord}`
            : yearMatch
              ? yearMatch[0]
              : rawDel || filtersT.deliveryStatuses[2]

      const isFeat =
        Boolean(u.is_featured) &&
        (!u.featured_until || new Date(u.featured_until) > new Date())

      const rawArea = u.area
      const localizedArea = rawArea
        ? getLocalizedGeorgiaAreaName(rawArea, locale)
        : c.defaultArea

      const localizedType = translateStoredPropertyKind(u.unit_type, locale)
      const roomsCount = parseSafeNumber(u.rooms, 2)
      const sizeVal = parseSafeNumber(u.size, 75)

      return {
        id: u.id,
        name: u.project_name || c.defaultProject,
        area: localizedArea,
        specs: `${localizedType} · ${roomsCount} ${c.roomsWord} · ${sizeVal} ${c.sqmUnit} · ${t.similarSection.deliveryPrefix} ${delivDisplay}`,
        cash: reqCash.toLocaleString('en-US'),
        currency: uCurrency,
        featured: isFeat,
        image:
          Array.isArray(u.images) && u.images.length > 0 && u.images[0]
            ? u.images[0]
            : FALLBACK_UNIT_IMAGE,
      }
    })
  }, [rawSimilarRows, locale, c, t, filtersT, monthsWord])

  const computedUnit = useMemo(() => {
    if (!unitRow) return null

    const row = unitRow
    const meta =
      row.documents && typeof row.documents === 'object'
        ? row.documents.__unit_meta || {}
        : {}

    const currency = '$'
    const projectName = row.project_name || c.defaultProject
    const rawArea = row.area || meta.area || ''
    const areaName = rawArea
      ? getLocalizedGeorgiaAreaName(rawArea, locale)
      : c.defaultArea

    const invalidDevNames = [
      'newly built',
      'under construction',
      'old built',
      'completed',
    ]
    const rawDev = row.developer_name || meta.developer_name || ''
    const developerName =
      rawDev && !invalidDevNames.includes(String(rawDev).trim().toLowerCase())
        ? String(rawDev).trim()
        : ''

    const subtitle = developerName ? `${developerName} · ${areaName}` : areaName

    const numericId = String(row.id || '')
      .replace(/\D/g, '')
      .slice(0, 5)
    const fallbackId = String(row.id || '')
      .slice(0, 5)
      .toUpperCase()
    const code =
      row.code ||
      meta.code ||
      `U-${numericId.length >= 4 ? numericId : fallbackId || '1001'}`

    const rawUnitType = row.unit_type || meta.unit_type || c.defaultType
    // ترجمة نوع الوحدة للغة المستخدم الحالية
    const unitType = translateStoredPropertyKind(rawUnitType, locale)

    const isStudio =
      rawUnitType.includes('استوديو') ||
      rawUnitType.toLowerCase().includes('studio') ||
      rawUnitType.toLowerCase().includes('студия') ||
      rawUnitType.includes('სტუდიო')

    const size = parseSafeNumber(row.size ?? meta.size, 75)
    const rawFloor = row.floor_number ?? meta.floor_number
    const rawTotalFloors = parseSafeNumber(
      row.total_floors ?? meta.total_floors,
      0
    )
    const floor =
      rawFloor !== null &&
      rawFloor !== undefined &&
      String(rawFloor).trim() !== ''
        ? rawTotalFloors > 0
          ? `${rawFloor}/${rawTotalFloors}`
          : String(rawFloor)
        : t.specs.typicalFloor

    const rooms = parseSafeNumber(row.rooms ?? meta.rooms, isStudio ? 1 : 2)
    const bedrooms = parseSafeNumber(
      row.bedrooms ?? meta.bedrooms,
      Math.max(1, rooms - 1)
    )
    const bathrooms = parseSafeNumber(row.bathrooms ?? meta.bathrooms, 1)

    const rawFinishing =
      row.finishing || meta.finishing || t.specs.defaultFinishing
    // ترجمة حالة التشطيب للغة المستخدم الحالية
    const finishing = translateStoredFinishing(rawFinishing, locale)

    const deliveryStatus =
      row.delivery_status || meta.delivery_status || t.specs.defaultStatus

    const contractYear = parseSafeNumber(
      row.contract_year ?? meta.contract_year,
      2024
    )
    const contractMonth = row.contract_month || meta.contract_month
    const contractDateFormatted = contractMonth
      ? `${contractMonth}/${contractYear}`
      : String(contractYear)

    const paidAmount = parseSafeNumber(row.paid_amount)
    const contractPrice = parseSafeNumber(row.contract_price, paidAmount)
    const discountAmount = row.willing_to_discount
      ? parseSafeNumber(row.discount_amount)
      : 0

    const requiredCash = paidAmount
    const remainingToDeveloper = Math.max(0, contractPrice - paidAmount)
    const marketPrice = parseSafeNumber(row.market_price)
    const installmentAmount = parseSafeNumber(
      row.installment_amount ?? meta.installment_amount
    )

    const rawInstFreq =
      row.installment_frequency || meta.installment_frequency || c.defaultFreq
    // ترجمة دورية القسط للغة المستخدم الحالية
    const installmentFreq = translateStoredInstallmentFreq(rawInstFreq, locale)

    const remainingInstallmentMonths = parseSafeNumber(
      row.years_left ?? meta.years_left,
      0
    )

    const pricePerMeter =
      size > 0 && contractPrice > 0 ? Math.round(contractPrice / size) : 0
    const commission = Math.round(contractPrice * commissionRate)
    const marketGain =
      marketPrice > contractPrice
        ? Math.max(0, marketPrice - contractPrice - commission)
        : 0
    const totalRequiredNow = requiredCash + commission
    const discountPercentage =
      paidAmount > 0 && discountAmount > 0
        ? Math.max(1, Math.round((discountAmount / paidAmount) * 100))
        : 5

    const rawDelStr = String(deliveryStatus)
    const isReadyDelivery =
      rawDelStr.includes('جاهز') ||
      rawDelStr.includes('فوري') ||
      rawDelStr.includes('مستلم') ||
      rawDelStr.toLowerCase().includes('ready') ||
      rawDelStr.toLowerCase().includes('готов') ||
      rawDelStr.includes('მზად') ||
      rawDelStr.includes(filtersT.deliveryStatuses[1])

    const parenMatch = rawDelStr.match(/\(([^)]+)\)/)
    const yearMatch = rawDelStr.match(/20\d{2}/)
    const delivMonth = row.delivery_month || meta.delivery_month

    const deliveryDisplay = isReadyDelivery
      ? t.specs.readyForDelivery
      : parenMatch
        ? parenMatch[1]
        : delivMonth && String(delivMonth) !== '0'
          ? `${delivMonth} ${monthsWord}`
          : yearMatch
            ? yearMatch[0]
            : rawDelStr || t.specs.soon

    const validUrls = Array.isArray(row.images)
      ? row.images.filter((img: string) => Boolean(img && img.trim()))
      : []

    const unitGallery =
      validUrls.length > 0
        ? validUrls.map((url: string, index: number) => ({
            url,
            caption: `${projectName} — ${t.photoWord} ${index + 1}`,
          }))
        : [
            {
              url: FALLBACK_UNIT_IMAGE,
              caption: `${projectName} — ${t.samplePhotoWord}`,
            },
          ]

    const specs = [
      { label: t.specs.type, value: unitType },
      { label: t.specs.size, value: `${size} ${c.sqmUnit}` },
      { label: t.specs.floor, value: floor },
      { label: t.specs.rooms, value: `${rooms} (${bedrooms} 🛏)` },
      {
        label: t.specs.bathrooms,
        value: String(bathrooms),
      },
      { label: t.specs.finishing, value: finishing },
      { label: t.specs.status, value: deliveryDisplay },
      { label: t.specs.contractYear, value: contractDateFormatted },
      {
        label: t.specs.pricePerMeter,
        value:
          pricePerMeter > 0
            ? `${pricePerMeter.toLocaleString('en-US')} ${currency}`
            : `${Math.round((paidAmount || 35000) / size).toLocaleString('en-US')} ${currency}`,
      },
    ]

    const featuresList: string[] =
      Array.isArray(row.features) && row.features.length > 0
        ? row.features
        : Array.isArray(meta.features)
          ? meta.features
          : []
    const descriptionText = row.description || `${projectName} — ${subtitle}`

    const isFeaturedActive =
      Boolean(row.is_featured) &&
      (!row.featured_until || new Date(row.featured_until) > new Date())

    const isOwner = Boolean(
      currentUserId && row.user_id && row.user_id === currentUserId
    )
    const hasActiveOffer =
      String(row.status || '').toLowerCase() === 'offer_received'

    const unifiedPublishedAt =
      row.approved_at || meta.approved_at || row.created_at

    return {
      id: String(row.id),
      raw: row,
      isOwner,
      hasActiveOffer,
      projectName,
      developerName,
      areaName,
      rawArea,
      exactStreet: row.exact_street || meta.exact_street || '',
      houseNumber: row.house_number || meta.house_number || '',
      cadastralCode: row.cadastral_code || meta.cadastral_code || '',
      videoUrl: row.video_url || meta.video_url || '',
      tour3dUrl: row.tour_3d_url || meta.tour_3d_url || '',
      allowOnlineViewing: Boolean(
        row.allow_online_viewing ?? meta.allow_online_viewing ?? false
      ),
      subtitle,
      code,
      unitType,
      currency,
      featured: isFeaturedActive,
      boostTier: isFeaturedActive
        ? row.boost_tier === 'vip_plus'
          ? 'vip_plus'
          : 'super_vip'
        : null,
      viewsCount:
        liveViewsCount !== null
          ? liveViewsCount
          : Math.max(1, Number(row.views_count) || 1),
      publishedAt: unifiedPublishedAt,
      createdAt: unifiedPublishedAt,
      sizeNum: size,
      roomsNum: rooms,
      bedroomsNum: bedrooms,
      contractPrice,
      gallery: unitGallery,
      specs,
      features: featuresList,
      tags: featuresList,
      descriptionText,
      requiredCash,
      paidAmount,
      willingToDiscount: Boolean(row.willing_to_discount),
      discountAmount: discountAmount || Math.round(paidAmount * 0.05),
      discountPercentage,
      marketPrice,
      marketGain,
      remainingToDeveloper,
      installmentAmount,
      installmentFreq,
      remainingInstallmentMonths,
      deliveryYear: deliveryDisplay,
      commission,
      totalRequiredNow,
    }
  }, [
    unitRow,
    liveViewsCount,
    currentUserId,
    locale,
    c,
    t,
    filtersT,
    monthsWord,
    commissionRate,
  ])

  const copyUnitCode = () => {
    if (!computedUnit) return
    navigator.clipboard?.writeText(computedUnit.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scrollToOfferSection = () => {
    const el = document.getElementById('make-offer-section')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const ownerBannerLabels = {
    title:
      (t as any).ownerUnitBannerTitle ||
      (locale === 'ar'
        ? 'هذه وحدتك المعروضة على المنصة'
        : locale === 'ru'
          ? 'Это ваш объект на платформе'
          : locale === 'ka'
            ? 'ეს თქვენი ობიექტია პლატფორმაზე'
            : 'This is your listed unit on the platform'),
    manageBtn:
      (t as any).manageMyUnitBtn ||
      (locale === 'ar'
        ? 'إدارة وحدتي في حسابي'
        : locale === 'ru'
          ? 'Управление объектом'
          : locale === 'ka'
            ? 'ობიექტის მართვა'
            : 'Manage Unit in My Account'),
    editBtn:
      dict.accountComponents?.seller?.editDataBtn ||
      (locale === 'ar'
        ? 'تعديل البيانات'
        : locale === 'ru'
          ? 'Редактировать'
          : locale === 'ka'
            ? 'რედაქტირება'
            : 'Edit Details'),
  }

  if (loading) {
    return <UnitDetailsPageSkeleton dir={dir} />
  }

  if (!computedUnit) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-10 text-[var(--brand-navy,#0a1122)]"
      >
        <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-xs">
            <h1 className="text-lg font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.notFoundTitle}
            </h1>
            <p className="mt-2 text-xs text-gray-500">{t.notFoundDesc}</p>
            <Link
              href="/opportunities"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {t.browseOpportunitiesBtn}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-6 text-[var(--brand-navy,#0a1122)] sm:py-10"
    >
      <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
        <UnitDetailsHeader
          computedUnit={computedUnit}
          t={t}
          liked={liked}
          onToggleFavorite={handleToggleFavorite}
          copied={copied}
          onCopyCode={copyUnitCode}
        />

        <UnitSpecsAndDescription computedUnit={computedUnit} locale={locale} />

        <UnitFinancialsCard
          computedUnit={computedUnit}
          fin={t.financials}
          oT={oT}
          t={t}
          monthsWord={monthsWord}
          onMakeOffer={scrollToOfferSection}
        />

        <UnitLocationInsights
          areaId={computedUnit.rawArea}
          t={t}
          locale={locale}
        />

        {sameProjectCount > 0 && (
          <section className="mt-4 flex items-center justify-between rounded-[16px] border border-gray-200/80 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3 text-start">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
                <Building2 className="size-4" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-[13px]">
                  {t.sameAreaBanner.prefix} {sameProjectCount}{' '}
                  {t.sameAreaBanner.middle} {computedUnit.areaName}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {t.sameAreaBanner.sub}
                </p>
              </div>
            </div>
            <Link
              href="/opportunities"
              className="shrink-0 text-xs font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
            >
              {t.sameAreaBanner.viewAllBtn}
            </Link>
          </section>
        )}

        <SimilarUnitsSection similarDbUnits={similarDbUnits} t={t} c={c} />

        {computedUnit.isOwner ? (
          <section className="mt-8 rounded-[20px] border border-emerald-200 bg-[#eaf8f2] p-6 text-center shadow-xs">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-[#007a5a] text-white">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#0a1122]">
              {ownerBannerLabels.title}
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={`/account?view=seller&unitId=${computedUnit.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white hover:bg-[#006248]"
              >
                {ownerBannerLabels.manageBtn}
              </Link>
              <Link
                href={`/sell?editUnitId=${computedUnit.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
              >
                {ownerBannerLabels.editBtn}
              </Link>
            </div>
          </section>
        ) : (
          <UnitInterestForm
            unitCode={computedUnit.code}
            projectName={computedUnit.projectName}
            areaName={computedUnit.areaName}
            unitType={computedUnit.unitType}
            deliveryYear={computedUnit.deliveryYear}
            requiredCash={computedUnit.requiredCash}
            totalRequiredNow={computedUnit.totalRequiredNow}
            installmentAmount={computedUnit.installmentAmount}
            currentUserId={currentUserId}
            willingToDiscount={computedUnit.willingToDiscount}
            discountAmount={computedUnit.discountAmount}
          />
        )}
      </div>
    </main>
  )
}