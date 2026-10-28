'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ImagePlus,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  cancelUnitPromotionBySellerAction,
  deleteUnitBySellerAction,
  requestUnitPromotionAction,
  toggleSellerUnitStatusAction,
} from '@/actions/account-actions'
import {
  getCurrentSellerProfileAction,
  markUserPhoneVerifiedAction,
} from '@/actions/submit-forms'
import {
  SUPPORTED_COUNTRIES,
  type CountryCode,
} from '@/components/layouts/site-shell'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { AccountActionLinks } from './delete-account-modal'
import {
  calculateUnitCompletion,
  getSellerTimelineAndStatus,
  type ConfirmModalState,
  type SellerUnitItem,
} from './seller-unit-helpers'
import {
  SellerConfirmModal,
  SellerPromoSection,
  Timeline,
} from './seller-promo-timeline'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

export type { SellerUnitItem } from './seller-unit-helpers'

const INITIAL_VISIBLE_UNITS = 3
const SELLER_WA_SENT_STORAGE_KEY = 'aqar_seller_wa_fasttrack_sent'

export function SellerDashboard({
  sells,
  initialSelectedUnitId,
  offersCountMap = {},
  matchedBuyersCountMap = {},
  deletionRequested = false,
}: {
  sells: SellerUnitItem[]
  initialSelectedUnitId?: string
  offersCountMap?: Record<string, number>
  matchedBuyersCountMap?: Record<string, number>
  deletionRequested?: boolean
}) {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.accountComponents.seller as Record<string, any>

  const [localSells, setLocalSells] = useState<SellerUnitItem[]>(sells)
  useEffect(() => {
    setLocalSells(sells)
  }, [sells])

  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedUnitId && sells.some((s) => s.id === initialSelectedUnitId)
      ? initialSelectedUnitId
      : sells[0]?.id || ''
  )

  const [isUnitsExpanded, setIsUnitsExpanded] = useState(false)
  const [unitSearchQuery, setUnitSearchQuery] = useState('')

  const [isPromoCollapsed, setIsPromoCollapsed] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null)
  const [copiedAdRef, setCopiedAdRef] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const [currentUserId, setCurrentUserId] = useState('')
  const [userPhoneVerified, setUserPhoneVerified] = useState(false)
  const [hiddenWaUnitIds, setHiddenWaUnitIds] = useState<Record<string, boolean>>(
    {}
  )

  const activeUnit =
    localSells.find((s) => s.id === selectedId) || localSells[0]

  useEffect(() => {
    getCurrentSellerProfileAction().then((res) => {
      if (res.isLoggedIn && res.user) {
        setCurrentUserId(res.user.id)
        if (res.user.phoneVerified) {
          setUserPhoneVerified(true)
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!activeUnit?.id) return
    try {
      const sentFlag = localStorage.getItem(
        `${SELLER_WA_SENT_STORAGE_KEY}_${activeUnit.id}`
      )
      if (sentFlag === '1') {
        setHiddenWaUnitIds((prev) => ({ ...prev, [activeUnit.id]: true }))
      }
    } catch {}
  }, [activeUnit?.id])

  const orderedUnits = useMemo(() => {
    if (!activeUnit) return localSells
    const others = localSells.filter((u) => u.id !== activeUnit.id)
    return [activeUnit, ...others]
  }, [localSells, activeUnit])

  const filteredOrderedUnits = useMemo(() => {
    if (!unitSearchQuery.trim()) return orderedUnits
    const q = unitSearchQuery.trim().toLowerCase()
    return orderedUnits.filter((u) =>
      `${u.project_name || ''} ${u.area || ''} ${u.developer_name || ''} ${u.unit_type || ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [orderedUnits, unitSearchQuery])

  const displayedUnits = isUnitsExpanded
    ? filteredOrderedUnits
    : orderedUnits.slice(0, INITIAL_VISIBLE_UNITS)

  const hiddenUnitsCount = Math.max(
    0,
    orderedUnits.length - INITIAL_VISIBLE_UNITS
  )

  if (!activeUnit) return null

  const unitCountryCode: CountryCode = 'GE'
  const unitCountryCfg = SUPPORTED_COUNTRIES.GE
  const currencySymbol = getCurrencySymbol(unitCountryCode, locale)
  const pkgPrices = unitCountryCfg.defaultPackages
  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )

  const dynamicPackages: Array<{
    days: 7 | 14 | 30
    price: number
    label: string
  }> = [
    { days: 7, price: pkgPrices.days7, label: `7 ${t.daysWord}` },
    { days: 14, price: pkgPrices.days14, label: `14 ${t.daysWord}` },
    { days: 30, price: pkgPrices.days30, label: `30 ${t.daysWord}` },
  ]

  const money = (value: number | null | undefined) =>
    `${Number(value || 0).toLocaleString('en-US')} ${currencySymbol}`

  const comp = calculateUnitCompletion(activeUnit, t)
  const meta = getSellerTimelineAndStatus(activeUnit, comp, t)
  const isPausedBySeller = meta.code === 'paused_by_seller'

  const realMatchedBuyersCount = matchedBuyersCountMap[activeUnit.id] ?? 0
  const uploadedDocsCount = comp.uploadedDocsCount
  const unitOffersCount = offersCountMap[activeUnit.id] || 0

  const activeUnitRawArea =
    activeUnit.area || activeUnit.documents?.__unit_meta?.area
  const activeUnitLocalizedArea = activeUnitRawArea
    ? getLocalizedGeorgiaAreaName(activeUnitRawArea, locale)
    : t.defaultAreaName
  const activeUnitType =
    activeUnit.unit_type || activeUnit.documents?.__unit_meta?.unit_type

  const editUnitHref = `/sell?editUnitId=${activeUnit.id}&step=3`

  const siteOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://exit-16.vercel.app'
  const unitRef = `AE-${activeUnit.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
  const targetSellerUserId = activeUnit.user_id || currentUserId
  const adminVerifyUnitLink = `${siteOrigin}/admin/properties?verifyPhoneUserId=${encodeURIComponent(targetSellerUserId)}&unitId=${encodeURIComponent(activeUnit.id)}`

  const sellerFastTrackWaMsg = `${t.waFastTrackSellerMsgPrefix} (${unitRef}) — ${activeUnit.project_name || t.defaultProjectName} (${activeUnitLocalizedArea}) — ${t.paidAmountLabel}: ${money(activeUnit.paid_amount)}.\n${adminVerifyUnitLink}`

  const isWaFastTrackHidden =
    userPhoneVerified ||
    comp.isUnitPhoneVerified ||
    Boolean(hiddenWaUnitIds[activeUnit.id]) ||
    meta.code === 'active' ||
    meta.code === 'sold' ||
    meta.code === 'transferring'

  // بمجرد الضغط على زر الواتساب وفتح التطبيق يختفي الصندوق فوراً ويُحفظ ذلك
  const handleSellerFastTrackWaClick = () => {
    setHiddenWaUnitIds((prev) => ({ ...prev, [activeUnit.id]: true }))
    try {
      localStorage.setItem(
        `${SELLER_WA_SENT_STORAGE_KEY}_${activeUnit.id}`,
        '1'
      )
    } catch {}
    markUserPhoneVerifiedAction({
      userId: targetSellerUserId,
      unitId: activeUnit.id,
    }).catch(() => {})
  }

  const isCurrentlyFeatured =
    Boolean(activeUnit.is_featured) &&
    activeUnit.featured_status !== 'cancelled_by_seller' &&
    activeUnit.featured_status !== 'none' &&
    (!activeUnit.featured_until ||
      new Date(activeUnit.featured_until) > new Date())

  const isPendingPromo =
    !isCurrentlyFeatured && activeUnit.featured_status === 'pending_payment'

  const remainingFeaturedDays =
    isCurrentlyFeatured && activeUnit.featured_until
      ? Math.max(
          1,
          Math.ceil(
            (new Date(activeUnit.featured_until).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : activeUnit.featured_days || 0

  const currentAdRef =
    isCurrentlyFeatured || isPendingPromo
      ? activeUnit.featured_fawry_code ||
        `AD-${activeUnit.id.slice(0, 6).toUpperCase()}`
      : null

  const activePromoDays = (activeUnit.featured_days as 7 | 14 | 30) || 14
  const activePromoPrice =
    dynamicPackages.find((p) => p.days === activePromoDays)?.price ||
    activeUnit.featured_price ||
    pkgPrices.days14

  const executeConfirmedAction = () => {
    if (!confirmModal) return
    setActionMessage('')

    startTransition(async () => {
      if (confirmModal.type === 'pause' || confirmModal.type === 'resume') {
        const nextAction = confirmModal.type
        const res = await toggleSellerUnitStatusAction({
          unitId: activeUnit.id,
          action: nextAction,
        })
        setConfirmModal(null)
        if (res.success) {
          setLocalSells((prev) =>
            prev.map((u) =>
              u.id === activeUnit.id
                ? {
                    ...u,
                    status:
                      nextAction === 'pause' ? 'paused_by_seller' : 'pending',
                  }
                : u
            )
          )
          setActionMessage(
            nextAction === 'pause' ? t.msgPausedSuccess : t.msgResumedSuccess
          )
          router.refresh()
        }
      } else if (confirmModal.type === 'delete') {
        const res = await deleteUnitBySellerAction(activeUnit.id)
        setConfirmModal(null)
        if (res.success) {
          const remaining = localSells.filter((s) => s.id !== activeUnit.id)
          setLocalSells(remaining)
          if (remaining[0]) setSelectedId(remaining[0].id)
          router.refresh()
        }
      } else if (confirmModal.type === 'promote') {
        const pkg = confirmModal.pkg
        const res = await requestUnitPromotionAction({
          unitId: activeUnit.id,
          days: pkg.days,
          price: pkg.price,
        })
        setConfirmModal(null)
        if (res.success) {
          const code =
            res.fawryCode || `AD-${activeUnit.id.slice(0, 6).toUpperCase()}`
          setLocalSells((prev) =>
            prev.map((u) =>
              u.id === activeUnit.id
                ? {
                    ...u,
                    featured_days: pkg.days,
                    featured_price: pkg.price,
                    featured_status: 'pending_payment',
                    featured_fawry_code: code,
                  }
                : u
            )
          )
          setActionMessage(`${t.msgPromoSuccessPrefix} ${code}`)
          router.refresh()
        } else {
          setActionMessage(res.error || t.msgPromoError)
        }
      } else if (confirmModal.type === 'cancel_promo') {
        const res = await cancelUnitPromotionBySellerAction(activeUnit.id)
        setConfirmModal(null)
        if (res.success) {
          setLocalSells((prev) =>
            prev.map((u) =>
              u.id === activeUnit.id
                ? {
                    ...u,
                    is_featured: false,
                    featured_status: 'none',
                    featured_fawry_code: null,
                    featured_days: 0,
                    featured_price: 0,
                    featured_until: null,
                  }
                : u
            )
          )
          setActionMessage(t.msgPromoCancelled)
          router.refresh()
        } else {
          setActionMessage(res.error || t.msgPromoCancelError)
        }
      }
    })
  }

  return (
    <div dir={dir} className="mx-auto max-w-[680px] px-4 sm:px-6">
      {localSells.length > 1 && (
        <ScrollReveal>
          <section className="mb-4 rounded-[20px] border border-gray-200/90 bg-white p-4 text-start shadow-2xs sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
                  <Building2 className="size-4" />
                </span>
                <h1 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                  {t.myUnitsHeader} ({localSells.length})
                </h1>
              </div>

              <Link
                href="/sell?new=1"
                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[var(--brand-navy,#0a1122)] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--brand-navy-hover,#16223f)]"
              >
                <Plus className="size-3.5" />
                <span>{t.addUnitBtn.replace('+ ', '')}</span>
              </Link>
            </div>

            {isUnitsExpanded && localSells.length > 5 && (
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute top-1/2 end-3 size-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  placeholder={t.searchMyUnitsPlaceholder}
                  className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50/70 ps-3 pe-9 text-xs font-semibold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div
              className={`mt-3.5 flex flex-col gap-2 ${
                isUnitsExpanded && localSells.length > 5
                  ? 'max-h-[340px] overflow-y-auto pe-0.5'
                  : ''
              }`}
            >
              {displayedUnits.map((item, idx) => {
                const itemComp = calculateUnitCompletion(item, t)
                const itemMeta = getSellerTimelineAndStatus(item, itemComp, t)
                const isSelected = item.id === activeUnit.id
                const itemRawArea =
                  item.area || item.documents?.__unit_meta?.area
                const itemAreaName = itemRawArea
                  ? getLocalizedGeorgiaAreaName(itemRawArea, locale)
                  : t.defaultAreaName

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id)
                      setActionMessage('')
                      setIsUnitsExpanded(false)
                      setUnitSearchQuery('')
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-start transition ${
                      isSelected
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)]/60 ring-2 ring-[var(--brand-primary,#007a5a)]/15'
                        : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                          isSelected
                            ? 'bg-[var(--brand-primary,#007a5a)] text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                            {item.project_name || t.defaultProjectName}
                          </span>
                          <span className="truncate text-[11px] text-gray-500">
                            · {itemAreaName}
                          </span>
                          {item.is_featured && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <Star className="size-2.5 fill-amber-400 text-amber-500" />
                              {t.featuredShortBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${itemMeta.listBadge.cls}`}
                    >
                      {itemMeta.listBadge.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {localSells.length > INITIAL_VISIBLE_UNITS && (
              <div className="mt-3 border-t border-gray-100 pt-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnitsExpanded((prev) => !prev)
                    setUnitSearchQuery('')
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 px-4 py-1.5 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] transition hover:bg-[var(--brand-primary-light,#eaf8f2)]"
                >
                  {isUnitsExpanded ? (
                    <>
                      <span>{t.showOnly3UnitsBtn}</span>
                      <ChevronUp className="size-3.5" />
                    </>
                  ) : (
                    <>
                      <span>
                        {t.showRemainingUnitsPrefix} (+{hiddenUnitsCount})
                      </span>
                      <ChevronDown className="size-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        </ScrollReveal>
      )}

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-[var(--brand-primary-light,#eaf8f2)] p-3.5 text-center text-xs font-bold text-[var(--brand-primary,#007a5a)]">
          {actionMessage}
        </div>
      )}

      <ScrollReveal delay={60}>
        <section className="rounded-[20px] border border-gray-200/90 bg-white p-5 text-start shadow-xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
                <Building2 className="size-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-[var(--brand-navy,#0a1122)] sm:text-lg">
                    {activeUnit.project_name || t.defaultProjectName}
                  </h2>
                  {meta.headerBadge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${meta.headerBadge.cls}`}
                    >
                      {meta.headerBadge.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {activeUnitLocalizedArea}
                  {activeUnitType ? ` · ${activeUnitType}` : ''}
                </p>
              </div>
            </div>

            {localSells.length === 1 && (
              <Link
                href="/sell?new=1"
                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-[var(--brand-navy,#0a1122)] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--brand-navy-hover,#16223f)]"
              >
                <Plus className="size-3.5" />
                <span>{t.addUnitBtn.replace('+ ', '')}</span>
              </Link>
            )}
          </div>

          <div className="mt-4">
            <span className="text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
              {t.nextStepLabel}
            </span>
            <h3 className="mt-1 text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
              {meta.headline}
            </h3>
          </div>

          <div className="mt-3.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600">
                {t.completionLabel} ({comp.completedCount}/{comp.total})
              </span>
              <strong
                dir="ltr"
                className="font-extrabold text-[var(--brand-primary,#007a5a)]"
              >
                {comp.percentage}%
              </strong>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[var(--brand-primary,#007a5a)] transition-all duration-500"
                style={{ width: `${comp.percentage}%` }}
              />
            </div>

            {comp.missingItems.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                {comp.missingItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-950 shadow-2xs transition hover:bg-amber-100"
                  >
                    {item.key === 'photos' ? (
                      <ImagePlus className="size-3.5 shrink-0 text-amber-700" />
                    ) : item.key === 'docs' ? (
                      <UploadCloud className="size-3.5 shrink-0 text-amber-700" />
                    ) : (
                      <AlertCircle className="size-3.5 shrink-0 text-amber-700" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* شريط تسريع مراجعة ونشر الوحدة وإيجاد مشتري عبر واتساب (يختفي فور الضغط عليه) */}
          {!isWaFastTrackHidden && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#25D366]/40 bg-[#f0fdf4] p-3.5 sm:flex-row sm:items-center">
              <p className="text-xs leading-relaxed font-extrabold text-[#0a1122]">
                {t.fastTrackSellerWaTitle}
              </p>
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(sellerFastTrackWaMsg)}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleSellerFastTrackWaClick}
                className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>{t.fastTrackSellerWaBtn}</span>
              </a>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-[#f8faf9] p-3.5">
            <div>
              <p className="text-[11px] font-semibold text-gray-500">
                {t.contractPriceLabel}
              </p>
              <strong className="mt-0.5 block text-base font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-lg">
                {money(activeUnit.contract_price)}
              </strong>
            </div>
            <div className="border-s border-gray-200/80 ps-3">
              <p className="text-[11px] font-semibold text-gray-500">
                {t.paidAmountLabel}
              </p>
              <strong className="mt-0.5 block text-base font-black text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-lg">
                {money(activeUnit.paid_amount)}
              </strong>
            </div>
          </div>

          {activeUnit.admin_note && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <strong className="block font-extrabold">
                  {t.adminNoteLabel}
                </strong>
                <p className="mt-0.5 leading-relaxed">
                  {activeUnit.admin_note}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={editUnitHref}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-4 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)] sm:flex-none sm:px-5"
            >
              {t.editDataBtn}
            </Link>

            {meta.code !== 'sold' && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  setConfirmModal({
                    type: isPausedBySeller ? 'resume' : 'pause',
                  })
                }
                className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition ${
                  isPausedBySeller
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isPausedBySeller ? (
                  <>
                    <PlayCircle className="size-4" />
                    <span>{t.resumeBtn}</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="size-4 text-amber-600" />
                    <span>{t.pauseBtn}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmModal({ type: 'delete' })}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50/50 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 className="size-3.5" />
              <span>{t.deleteBtn}</span>
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-3.5 py-2.5 text-start text-[11.5px] font-bold text-[var(--brand-primary,#007a5a)]">
            {realMatchedBuyersCount > 0 ? (
              <>
                🎯 {t.matchedBuyersPrefix}{' '}
                {realMatchedBuyersCount.toLocaleString('en-US')}{' '}
                {t.matchedBuyersMiddle} ({activeUnitLocalizedArea})
              </>
            ) : (
              <>
                {t.radarNotePrefix} ({activeUnitLocalizedArea})
              </>
            )}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href={`/sell?editUnitId=${activeUnit.id}&step=3`}
            className="flex flex-col justify-between rounded-[16px] border border-gray-200/80 bg-white p-4 text-start shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)]"
          >
            <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.cardUnitData}
            </p>
            <p className="mt-1.5 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]">
              {comp.completedCount}/{comp.total} {t.cardUnitDataSub}
            </p>
          </Link>

          <Link
            href={`/account/documents?unitId=${activeUnit.id}`}
            className={`flex flex-col justify-between rounded-[16px] border bg-white p-4 text-start shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] ${
              uploadedDocsCount < 4
                ? 'border-amber-300 ring-1 ring-amber-200/60'
                : 'border-gray-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                {t.cardDocuments}
              </p>
              {uploadedDocsCount === 4 ? (
                <FileCheck2 className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
              ) : (
                <UploadCloud className="size-3.5 text-amber-500" />
              )}
            </div>
            <p
              className={`mt-1.5 text-[11px] font-semibold ${
                uploadedDocsCount === 4
                  ? 'text-[var(--brand-primary,#007a5a)] font-extrabold'
                  : 'text-amber-700'
              }`}
            >
              {uploadedDocsCount > 0
                ? `${uploadedDocsCount}/4 ${t.cardDocumentsUploaded}`
                : t.cardDocumentsEmpty}
            </p>
          </Link>

          <Link
            href={`/account/offers?role=seller&unitId=${activeUnit.id}`}
            className={`flex flex-col justify-between rounded-[16px] border bg-white p-4 text-start shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] ${
              unitOffersCount > 0 || meta.code === 'offer_received'
                ? 'border-emerald-300 bg-[#eaf8f2]/40'
                : 'border-gray-200/80'
            }`}
          >
            <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.cardOffers}
            </p>
            <p
              className={`mt-1.5 text-[11px] font-extrabold ${
                unitOffersCount > 0 || meta.code === 'offer_received'
                  ? 'text-[var(--brand-primary,#007a5a)]'
                  : 'font-semibold text-gray-500'
              }`}
            >
              {unitOffersCount > 0 || meta.code === 'offer_received'
                ? `${unitOffersCount || 1} ${t.cardOffersAvailable}`
                : t.cardOffersEmpty}
            </p>
          </Link>

          <a
            href={`https://wa.me/${supportWhatsApp}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col justify-between rounded-[16px] bg-[var(--brand-navy,#0a1122)] p-4 text-start text-white shadow-2xs transition hover:bg-[var(--brand-navy-hover,#16223f)]"
          >
            <p className="text-xs font-extrabold text-white">{t.cardSupport}</p>
            <p className="mt-1.5 text-[11px] text-gray-300">
              {t.cardSupportSub}
            </p>
          </a>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={140}>
        <section className="mt-5 rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-2xs sm:p-6">
          <h3 className="mb-4 text-start text-xs font-extrabold text-gray-500">
            {t.timelineTitle} ({activeUnit.project_name || t.defaultProjectName}
            ):
          </h3>
          <div className="ps-1">
            <Timeline
              currentStepIndex={meta.stepIndex}
              isRejected={meta.code === 'rejected'}
              stepTitles={t.timelineSteps}
            />
          </div>
        </section>

        <SellerPromoSection
          t={t}
          activeUnit={activeUnit}
          supportWhatsApp={supportWhatsApp}
          isPromoCollapsed={isPromoCollapsed}
          setIsPromoCollapsed={setIsPromoCollapsed}
          isCurrentlyFeatured={isCurrentlyFeatured}
          isPendingPromo={isPendingPromo}
          remainingFeaturedDays={remainingFeaturedDays}
          activePromoDays={activePromoDays}
          activePromoPrice={activePromoPrice}
          currentAdRef={currentAdRef}
          copiedAdRef={copiedAdRef}
          setCopiedAdRef={setCopiedAdRef}
          dynamicPackages={dynamicPackages}
          currencySymbol={currencySymbol}
          isPending={isPending}
          onSelectPackage={(pkg) => setConfirmModal({ type: 'promote', pkg })}
          onCancelPromo={() => setConfirmModal({ type: 'cancel_promo' })}
        />
      </ScrollReveal>

      <div className="mt-8 flex justify-center border-t border-gray-200/80 pt-6 [&>*]:justify-center [&_div]:justify-center [&_form]:hidden">
        <AccountActionLinks
          unitsCount={localSells.length}
          initialDeletionRequested={deletionRequested}
          position="bottom"
        />
      </div>

      <SellerConfirmModal
        dir={dir}
        t={t}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        currencySymbol={currencySymbol}
        isPending={isPending}
        onConfirm={executeConfirmedAction}
      />
    </div>
  )
}
