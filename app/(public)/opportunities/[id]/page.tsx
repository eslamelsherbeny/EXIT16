'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Building2, ShieldCheck } from 'lucide-react'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import { UnitInterestForm } from '@/components/features/opportunities/unit-interest-form'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import { isNonGeorgianLegacyArea } from '@/lib/smart-matcher'

// استدعاء مكونات الـ UI النظيفة التي أنشأناها
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

const PUBLIC_UNIT_DETAIL_COLUMNS =
  'id, user_id, project_name, developer_name, area, unit_type, size, garden_size, rooms, bathrooms, floor_number, finishing, delivery_status, delivery_month, delivery_year, features, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_month, contract_year, years_left, willing_to_discount, discount_amount, images, status, is_featured, featured_until, created_at'

const CORE_UNIT_DETAIL_COLUMNS =
  'id, user_id, project_name, developer_name, area, unit_type, size, rooms, bathrooms, finishing, delivery_status, description, contract_price, paid_amount, market_price, installment_amount, installment_frequency, contract_year, years_left, willing_to_discount, discount_amount, images, status, created_at'

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

export default function PropertyDetailsPage() {
  const { t: dict, locale, dir, siteSettings, isStaff } = useTranslation()
  const t = dict.unitDetailsPage
  const c = dict.opportunitiesPage.card
  const filtersT = dict.opportunitiesPage.filters
  const oT = (dict.accountPages?.offers as Record<string, any>) || {}
  const monthsWord =
    (dict.sell?.reviewStep as Record<string, any>)?.monthsUnit ||
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
      const uCurrency = getCurrencySymbol('GE', locale)
      const reqCash = parseSafeNumber(u.paid_amount)
      const rawDel = String(u.delivery_status || '').trim()
      const isReady =
        rawDel.includes('جاهز') ||
        rawDel.includes('فوري') ||
        rawDel.includes('مستلم') ||
        rawDel.toLowerCase().includes('ready') ||
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

      const roomsCount = parseSafeNumber(u.rooms, 2)
      const sizeVal = parseSafeNumber(u.size, 75)

      return {
        id: u.id,
        name: u.project_name || c.defaultProject,
        area: localizedArea,
        specs: `${u.unit_type || c.defaultType} · ${roomsCount} ${c.roomsWord} · ${sizeVal} ${c.sqmUnit} · ${t.similarSection.deliveryPrefix} ${delivDisplay}`,
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
    const currency = getCurrencySymbol('GE', locale)

    const projectName = row.project_name || c.defaultProject
    const rawArea = row.area || ''
    const areaName = rawArea
      ? getLocalizedGeorgiaAreaName(rawArea, locale)
      : c.defaultArea
    const developerName = row.developer_name || ''
    const subtitle = developerName ? `${developerName} · ${areaName}` : areaName

    const numericId = String(row.id || '')
      .replace(/\D/g, '')
      .slice(0, 5)
    const fallbackId = String(row.id || '')
      .slice(0, 5)
      .toUpperCase()
    const code =
      row.code ||
      `U-${numericId.length >= 4 ? numericId : fallbackId || '1001'}`

    const unitType = row.unit_type || c.defaultType
    const isStudio =
      unitType.includes('استوديو') ||
      unitType.toLowerCase().includes('studio') ||
      unitType.toLowerCase().includes('студия') ||
      unitType.includes('სტუდიო')

    const size = parseSafeNumber(row.size, 75)
    const rawFloor = row.floor_number
    const floor =
      rawFloor !== null &&
      rawFloor !== undefined &&
      String(rawFloor).trim() !== ''
      ? String(rawFloor)
      : t.specs.typicalFloor

    const rooms = parseSafeNumber(row.rooms, isStudio ? 1 : 2)
    const bathrooms = parseSafeNumber(row.bathrooms, 1)
    const finishing = row.finishing || t.specs.defaultFinishing
    const deliveryStatus = row.delivery_status || t.specs.defaultStatus

    const contractYear = parseSafeNumber(row.contract_year, 2024)
    const contractMonth = row.contract_month
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
    const installmentAmount = parseSafeNumber(row.installment_amount)
    const installmentFreq = row.installment_frequency || c.defaultFreq
    const remainingInstallmentMonths = parseSafeNumber(row.years_left, 0)

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
      rawDelStr.includes(filtersT.deliveryStatuses[1])

    const parenMatch = rawDelStr.match(/\(([^)]+)\)/)
    const yearMatch = rawDelStr.match(/20\d{2}/)
    const delivMonth = row.delivery_month

    const deliveryDisplay = isReadyDelivery
      ? t.specs.readyForDelivery
      : parenMatch
        ? parenMatch[1]
        : delivMonth
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
      { label: t.specs.rooms, value: String(rooms) },
      {
        label: t.specs.bathrooms,
        value: String(bathrooms),
      },
      { label: t.specs.finishing, value: finishing },
      { label: t.specs.status, value: deliveryStatus },
      { label: t.specs.contractYear, value: contractDateFormatted },
      {
        label: t.specs.pricePerMeter,
        value:
          pricePerMeter > 0
            ? `${pricePerMeter.toLocaleString('en-US')} ${currency}`
            : `${Math.round((paidAmount || 35000) / size).toLocaleString('en-US')} ${currency}`,
      },
    ]

    const tags: string[] =
      Array.isArray(row.features) && row.features.length > 0 ? row.features : []
    const descriptionText = row.description || `${projectName} — ${subtitle}`

    const isFeaturedActive =
      Boolean(row.is_featured) &&
      (!row.featured_until || new Date(row.featured_until) > new Date())

    const isOwner = Boolean(
      currentUserId && row.user_id && row.user_id === currentUserId
    )
    const hasActiveOffer =
      String(row.status || '').toLowerCase() === 'offer_received'

    return {
      id: String(row.id),
      isOwner,
      hasActiveOffer,
      projectName,
      areaName,
      rawArea, // تمرير الـ rawArea لاستخدامه في الخريطة
      subtitle,
      code,
      unitType,
      currency,
      featured: isFeaturedActive,
      gallery: unitGallery,
      specs,
      tags,
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

  if (loading) {
    return (
      <main
        dir={dir}
        className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] py-10 text-[var(--brand-navy,#0a1122)]"
      >
        <div className="mx-auto w-full max-w-[780px] px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm font-bold text-gray-500 shadow-xs">
            {t.loading}
          </div>
        </div>
      </main>
    )
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
        
        {/* 1. Header & Gallery */}
        <UnitDetailsHeader
          computedUnit={computedUnit}
          t={t}
          liked={liked}
          onToggleFavorite={handleToggleFavorite}
          copied={copied}
          onCopyCode={copyUnitCode}
        />

        {/* 2. Specs & Description */}
        <UnitSpecsAndDescription computedUnit={computedUnit} />

        {/* 3. Financials Card */}
        <UnitFinancialsCard
          computedUnit={computedUnit}
          fin={t.financials}
          oT={oT}
          t={t}
          monthsWord={monthsWord}
          onMakeOffer={scrollToOfferSection}
        />

        {/* 4. السحر الجديد: الخريطة الـ 3D والأماكن القريبة ومخطط الشمس */}
        <UnitLocationInsights areaId={computedUnit.rawArea} t={t} />

        {/* 5. Same Area Banner (if applicable) */}
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

        {/* 6. Similar Units */}
        <SimilarUnitsSection similarDbUnits={similarDbUnits} t={t} c={c} />

        {/* 7. Contact / Action Form */}
        {computedUnit.isOwner ? (
          <section className="mt-8 rounded-[20px] border border-emerald-200 bg-[#eaf8f2] p-6 text-center shadow-xs">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-[#007a5a] text-white">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#0a1122]">
              {locale === 'ar'
                ? 'هذه وحدتك المعروضة على المنصة'
                : locale === 'ru'
                  ? 'Это ваш объект на платформе'
                  : locale === 'ka'
                    ? 'ეს თქვენი ობიექტია პლატფორმაზე'
                    : 'This is your listed unit on the platform'}
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={`/account?view=seller&unitId=${computedUnit.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white hover:bg-[#006248]"
              >
                {locale === 'ar'
                  ? 'إدارة وحدتي في حسابي'
                  : locale === 'ru'
                    ? 'Управление объектом'
                    : locale === 'ka'
                      ? 'ობიექტის მართვა'
                      : 'Manage Unit in My Account'}
              </Link>
              <Link
                href={`/sell?editUnitId=${computedUnit.id}&step=3`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
              >
                {dict.accountComponents?.seller?.editDataBtn || 'تعديل البيانات'}
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