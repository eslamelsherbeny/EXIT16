'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  EyeOff,
  FileCheck2,
  ImagePlus,
  Loader2,
  MessageCircle,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import {
  cancelUnitPromotionBySellerAction,
  deleteUnitBySellerAction,
  requestUnitPromotionAction,
  toggleSellerUnitStatusAction,
} from '@/actions/account-actions'
import {
  SUPPORTED_COUNTRIES,
  type CountryCode,
} from '@/components/layouts/site-shell'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { AccountActionLinks } from './delete-account-modal'
import { getCurrencySymbol, useTranslation, type LocaleCode } from '@/lib/i18n'

export type SellerUnitItem = {
  id: string
  project_name: string | null
  developer_name: string | null
  area: string | null
  unit_type: string | null
  size: number | null
  rooms: number | null
  bathrooms: number | null
  finishing: string | null
  delivery_status: string | null
  description: string | null
  contract_price: number | null
  paid_amount: number | null
  market_price: number | null
  installment_amount: number | null
  installment_frequency: string | null
  contract_year: number | null
  willing_to_discount: boolean | null
  has_overdue_installments: boolean | null
  status: string | null
  submission_type?: string | null
  admin_note: string | null
  images: string[] | null
  documents: Record<string, any> | null
  country?: string | null
  country_code?: string | null
  currency_code?: string | null
  is_featured?: boolean | null
  featured_days?: number | null
  featured_price?: number | null
  featured_status?: string | null
  featured_fawry_code?: string | null
  featured_until?: string | null
  created_at: string | null
}

const INITIAL_VISIBLE_UNITS = 3
const REAL_DOC_KEYS = ['contract', 'receipts', 'statement', 'passport'] as const

function getCompletionLabels(locale: LocaleCode) {
  if (locale === 'en') {
    return {
      notPublishedYet: 'Not published yet',
      addPhotosAction: '+ Add Unit Photos',
      addDocsAction: '+ Add Documents',
      completeDetailsAction: '+ Complete Unit Details',
      incompleteNextStepHeadline:
        'Complete the remaining items below so we can review and publish your unit',
    }
  }
  if (locale === 'ru') {
    return {
      notPublishedYet: 'Еще не опубликовано',
      addPhotosAction: '+ Добавить фото',
      addDocsAction: '+ Добавить документы',
      completeDetailsAction: '+ Заполнить детали',
      incompleteNextStepHeadline:
        'Завершите недостающие шаги ниже для проверки и публикации объекта',
    }
  }
  if (locale === 'ka') {
    return {
      notPublishedYet: 'ჯერ არ გამოქვეყნებულა',
      addPhotosAction: '+ ფოტოების დამატება',
      addDocsAction: '+ დოკუმენტების დამატება',
      completeDetailsAction: '+ მონაცემების შევსება',
      incompleteNextStepHeadline:
        'შეავსეთ ქვემოთ მოცემული ველები ობიექტის შესამოწმებლად და გამოსაქვეყნებლად',
    }
  }
  return {
    notPublishedYet: 'غير منشورة بعد',
    addPhotosAction: '+ إضافة الصور',
    addDocsAction: '+ إضافة المستندات',
    completeDetailsAction: '+ استكمال بيانات الوحدة',
    incompleteNextStepHeadline:
      'كمّل العناصر المتبقية تحت الشريط عشان نراجع وحدتك وننشرها للمشترين',
  }
}

export type MissingCompletionItem = {
  key: 'photos' | 'docs' | 'details'
  label: string
  href: string
}

export type StatusBadgeItem = {
  label: string
  cls: string
}

function calculateUnitCompletion(
  unit: SellerUnitItem,
  locale: LocaleCode
) {
  const cLabels = getCompletionLabels(locale)
  const meta =
    unit.documents && typeof unit.documents === 'object'
      ? unit.documents.__unit_meta || {}
      : {}

  const rawImages = Array.isArray(unit.images)
    ? unit.images
    : Array.isArray(meta.images)
      ? meta.images
      : []

  const hasImages =
    rawImages.filter((img: any) => Boolean(img && String(img).trim())).length > 0

  const docsObj =
    unit.documents && typeof unit.documents === 'object' ? unit.documents : {}
  const normalizedDocs: Record<string, any> = { ...docsObj }
  if (normalizedDocs.national_id && !normalizedDocs.passport) {
    normalizedDocs.passport = normalizedDocs.national_id
  }

  const uploadedDocsCount = REAL_DOC_KEYS.filter((k) =>
    Boolean(normalizedDocs[k]?.url)
  ).length
  const hasDocuments = uploadedDocsCount > 0

  const areaVal = unit.area || meta.area
  const typeVal = unit.unit_type || meta.unit_type
  const sizeVal = Number(unit.size ?? meta.size) || 0
  const roomsVal = Number(unit.rooms ?? meta.rooms) || 0
  const bathsVal = Number(unit.bathrooms ?? meta.bathrooms) || 0
  const finishingVal = unit.finishing || meta.finishing
  const deliveryVal = unit.delivery_status || meta.delivery_status
  const contractYrVal = Number(unit.contract_year ?? meta.contract_year) || 0
  const instFreqVal = unit.installment_frequency || meta.installment_frequency
  const instAmtVal = unit.installment_amount ?? meta.installment_amount

  const dataChecks = [
    Boolean(unit.developer_name),
    Boolean(unit.project_name),
    Boolean(areaVal),
    Boolean(typeVal),
    sizeVal > 0,
    roomsVal > 0,
    bathsVal > 0,
    Boolean(finishingVal),
    Boolean(deliveryVal),
    Boolean(unit.description),
    Number(unit.contract_price) > 0,
    Number(unit.paid_amount) > 0,
    Number(unit.market_price || unit.contract_price) > 0,
    instAmtVal !== null && instAmtVal !== undefined && Number(instAmtVal) >= 0,
    Boolean(instFreqVal),
    contractYrVal > 0,
  ]

  const completedDataCount = dataChecks.filter(Boolean).length
  const hasAllCoreDetails = Boolean(areaVal && typeVal && sizeVal > 0)

  const total = 18
  const completedCount =
    completedDataCount + (hasImages ? 1 : 0) + (hasDocuments ? 1 : 0)

  const dataScore = Math.round((completedDataCount / 16) * 70)
  const photosScore = hasImages ? 15 : 0
  const docsScore = hasDocuments ? 15 : 0
  const percentage = Math.min(100, dataScore + photosScore + docsScore)

  const missingItems: MissingCompletionItem[] = []
  if (!hasAllCoreDetails) {
    missingItems.push({
      key: 'details',
      label: cLabels.completeDetailsAction,
      href: `/sell?editUnitId=${unit.id}&step=3`,
    })
  }
  if (!hasImages) {
    missingItems.push({
      key: 'photos',
      label: cLabels.addPhotosAction,
      href: `/sell?editUnitId=${unit.id}&step=5`,
    })
  }
  if (!hasDocuments) {
    missingItems.push({
      key: 'docs',
      label: cLabels.addDocsAction,
      href: `/account/documents?unitId=${unit.id}`,
    })
  }

  return {
    completedCount,
    total,
    percentage,
    hasImages,
    hasDocuments,
    hasAllCoreDetails,
    uploadedDocsCount,
    missingItems,
    cLabels,
  }
}

function getSellerTimelineAndStatus(
  unit: SellerUnitItem,
  comp: ReturnType<typeof calculateUnitCompletion>,
  t: Record<string, any>
) {
  const clean = (unit.status || 'pending').trim().toLowerCase()
  const isComplete =
    comp.hasAllCoreDetails && comp.hasImages && comp.hasDocuments

  switch (clean) {
    case 'active':
    case 'approved':
    case 'published':
      return {
        code: 'active',
        stepIndex: 4,
        listBadge: {
          label: t.statusActiveBadge,
          cls: 'bg-emerald-100 text-[var(--brand-primary,#007a5a)]',
        },
        headerBadge: {
          label: t.statusActiveBadge,
          cls: 'bg-emerald-100 text-[var(--brand-primary,#007a5a)]',
        } as StatusBadgeItem | null,
        headline: t.statusActiveHeadline,
      }
    case 'paused_by_seller':
      return {
        code: 'paused_by_seller',
        stepIndex: 2,
        listBadge: {
          label: t.statusPausedBadge,
          cls: 'bg-amber-100 text-amber-800',
        },
        headerBadge: {
          label: t.statusPausedBadge,
          cls: 'bg-amber-100 text-amber-800',
        } as StatusBadgeItem | null,
        headline: t.statusPausedHeadline,
      }
    case 'paused_deletion':
      return {
        code: 'paused_deletion',
        stepIndex: 2,
        listBadge: {
          label: t.statusPausedDeletionBadge,
          cls: 'bg-gray-100 text-gray-600',
        },
        headerBadge: {
          label: t.statusPausedDeletionBadge,
          cls: 'bg-gray-100 text-gray-600',
        } as StatusBadgeItem | null,
        headline: t.statusPausedDeletionHeadline,
      }
    case 'offer_received':
      return {
        code: 'offer_received',
        stepIndex: 5,
        listBadge: {
          label: t.statusOfferBadge,
          cls: 'bg-purple-100 text-purple-800',
        },
        headerBadge: {
          label: t.statusOfferBadge,
          cls: 'bg-purple-100 text-purple-800',
        } as StatusBadgeItem | null,
        headline: t.statusOfferHeadline,
      }
    case 'transferring':
      return {
        code: 'transferring',
        stepIndex: 6,
        listBadge: {
          label: t.statusTransferBadge,
          cls: 'bg-blue-100 text-blue-800',
        },
        headerBadge: {
          label: t.statusTransferBadge,
          cls: 'bg-blue-100 text-blue-800',
        } as StatusBadgeItem | null,
        headline: t.statusTransferHeadline,
      }
    case 'sold':
      return {
        code: 'sold',
        stepIndex: 8,
        listBadge: {
          label: t.statusSoldBadge,
          cls: 'bg-teal-700 text-white',
        },
        headerBadge: {
          label: t.statusSoldBadge,
          cls: 'bg-teal-700 text-white',
        } as StatusBadgeItem | null,
        headline: t.statusSoldHeadline,
      }
    case 'rejected':
      return {
        code: 'rejected',
        stepIndex: 1,
        listBadge: {
          label: t.statusRejectedBadge,
          cls: 'bg-red-100 text-red-700',
        },
        headerBadge: {
          label: t.statusRejectedBadge,
          cls: 'bg-red-100 text-red-700',
        } as StatusBadgeItem | null,
        headline: t.statusRejectedHeadline,
      }
    default:
      if (!isComplete) {
        return {
          code: 'incomplete',
          stepIndex: 1,
          listBadge: {
            label: `${comp.cLabels.notPublishedYet} · ${comp.percentage}%`,
            cls: 'bg-slate-100 text-slate-600 border border-slate-200/80',
          },
          headerBadge: null,
          headline: comp.cLabels.incompleteNextStepHeadline,
        }
      }
      return {
        code: 'pending_review',
        stepIndex: 2,
        listBadge: {
          label: t.statusPendingBadge,
          cls: 'bg-amber-50 text-amber-800 border border-amber-200',
        },
        headerBadge: {
          label: t.statusPendingBadge,
          cls: 'bg-amber-50 text-amber-800 border border-amber-200',
        } as StatusBadgeItem | null,
        headline: t.statusPendingHeadline,
      }
  }
}

type ConfirmModalState =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'delete' }
  | { type: 'promote'; pkg: { days: 7 | 14 | 30; price: number; label: string } }
  | { type: 'cancel_promo' }
  | null

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

  const activeUnit =
    localSells.find((s) => s.id === selectedId) || localSells[0]

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

  const comp = calculateUnitCompletion(activeUnit, locale)
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
                const itemComp = calculateUnitCompletion(item, locale)
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

      {/* ==================== الكارت الموحد للوحدة النشطة والخطوة الجاية والأسعار ==================== */}
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
                {t.completionLabel}
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
              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
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

      {/* ==================== الكروت الأربعة السريعة ==================== */}
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
              uploadedDocsCount === 0
                ? 'border-amber-300 ring-1 ring-amber-200/60'
                : 'border-gray-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                {t.cardDocuments}
              </p>
              {uploadedDocsCount > 0 ? (
                <FileCheck2 className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
              ) : (
                <UploadCloud className="size-3.5 text-amber-500" />
              )}
            </div>
            <p
              className={`mt-1.5 text-[11px] font-semibold ${
                uploadedDocsCount > 0 ? 'text-gray-500' : 'text-amber-700'
              }`}
            >
              {uploadedDocsCount > 0
                ? `${uploadedDocsCount}/4 ${t.cardDocumentsUploaded}`
                : t.cardDocumentsEmpty}
            </p>
          </Link>

          {/* كارت عروض البائع: يفتح عروض البائع فقط لهذه الوحدة */}
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

      {/* ==================== مراحل بيع الوحدة (Timeline) + الترويج ==================== */}
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

      <Dialog
        open={Boolean(confirmModal)}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmModal(null)
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
        >
          {confirmModal && (
            <>
              <DialogHeader className="text-start">
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      confirmModal.type === 'delete' ||
                      confirmModal.type === 'cancel_promo'
                        ? 'bg-red-100 text-red-600'
                        : confirmModal.type === 'pause'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-[var(--brand-primary,#007a5a)]'
                    }`}
                  >
                    {confirmModal.type === 'delete' ? (
                      <Trash2 className="size-4" />
                    ) : confirmModal.type === 'promote' ? (
                      <Sparkles className="size-4" />
                    ) : (
                      <ShieldAlert className="size-4" />
                    )}
                  </span>
                  <DialogTitle className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                    {confirmModal.type === 'pause' && t.modalPauseTitle}
                    {confirmModal.type === 'resume' && t.modalResumeTitle}
                    {confirmModal.type === 'delete' && t.modalDeleteTitle}
                    {confirmModal.type === 'promote' &&
                      `${t.modalPromoteTitle} (${confirmModal.pkg.label})`}
                    {confirmModal.type === 'cancel_promo' &&
                      t.modalCancelPromoTitle}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                  {confirmModal.type === 'pause' && t.modalPauseDesc}
                  {confirmModal.type === 'resume' && t.modalResumeDesc}
                  {confirmModal.type === 'delete' && t.modalDeleteDesc}
                  {confirmModal.type === 'promote' && (
                    <>
                      {t.modalPromoteDescPrefix}{' '}
                      <strong className="text-[var(--brand-navy,#0a1122)]">
                        {confirmModal.pkg.label}
                      </strong>{' '}
                      {t.modalPromoteDescMiddle}{' '}
                      <strong className="text-[var(--brand-primary,#007a5a)]">
                        {confirmModal.pkg.price.toLocaleString('en-US')}{' '}
                        {currencySymbol}
                      </strong>{' '}
                      {t.modalPromoteDescSuffix}
                    </>
                  )}
                  {confirmModal.type === 'cancel_promo' &&
                    t.modalCancelPromoDesc}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirmModal(null)}
                  className="h-9 flex-1 rounded-xl text-xs font-bold"
                >
                  {t.modalBackBtn}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={executeConfirmedAction}
                  className={`h-9 flex-1 rounded-xl text-xs font-bold text-white ${
                    confirmModal.type === 'delete' ||
                    confirmModal.type === 'cancel_promo'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmModal.type === 'pause'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-[var(--brand-primary,#007a5a)] hover:bg-[var(--brand-primary-hover,#006248)]'
                  }`}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t.modalProcessingBtn}
                    </span>
                  ) : (
                    t.modalConfirmBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SellerPromoSection({
  t,
  activeUnit,
  supportWhatsApp,
  isPromoCollapsed,
  setIsPromoCollapsed,
  isCurrentlyFeatured,
  isPendingPromo,
  remainingFeaturedDays,
  activePromoDays,
  activePromoPrice,
  currentAdRef,
  copiedAdRef,
  setCopiedAdRef,
  dynamicPackages,
  currencySymbol,
  isPending,
  onSelectPackage,
  onCancelPromo,
}: {
  t: any
  activeUnit: SellerUnitItem
  supportWhatsApp: string
  isPromoCollapsed: boolean
  setIsPromoCollapsed: (v: boolean) => void
  isCurrentlyFeatured: boolean
  isPendingPromo: boolean
  remainingFeaturedDays: number
  activePromoDays: 7 | 14 | 30
  activePromoPrice: number
  currentAdRef: string | null
  copiedAdRef: boolean
  setCopiedAdRef: (v: boolean) => void
  dynamicPackages: Array<{ days: 7 | 14 | 30; price: number; label: string }>
  currencySymbol: string
  isPending: boolean
  onSelectPackage: (pkg: {
    days: 7 | 14 | 30
    price: number
    label: string
  }) => void
  onCancelPromo: () => void
}) {
  if (isPromoCollapsed) {
    return (
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#aae3cb] bg-[#effaf5] px-4 py-3.5 shadow-2xs">
        <div className="flex items-center gap-2 text-start">
          <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" />
          <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
            {t.promoCollapsedTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsPromoCollapsed(false)}
          className="shrink-0 rounded-xl bg-[var(--brand-primary,#007a5a)] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
        >
          {t.promoCollapsedBtn}
        </button>
      </div>
    )
  }

  const whatsappMessage = `${t.whatsappPromoMsgPrefix} (${activePromoDays} ${t.daysWord} - ${activePromoPrice.toLocaleString('en-US')} ${currencySymbol}) ${t.whatsappPromoMsgMiddle} (${activeUnit.project_name || t.defaultProjectName}) — ${t.whatsappPromoMsgRef} ${currentAdRef}`

  return (
    <section className="mt-5 rounded-[20px] border border-[#aae3cb] bg-[#effaf5] p-5 text-start shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] shadow-2xs">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>{t.promoOptionalBadge}</span>
          </span>

          {isCurrentlyFeatured && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
              {t.promoActiveBadgePrefix} {remainingFeaturedDays} {t.dayWord})
            </span>
          )}

          {isPendingPromo && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-extrabold text-blue-800">
              {t.promoPendingBadgePrefix} ({activePromoDays} {t.daysWord})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsPromoCollapsed(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-bold text-gray-500 transition hover:bg-white hover:text-gray-800"
        >
          <EyeOff className="size-3.5" />
          <span>{t.hidePromoBtn}</span>
        </button>
      </div>

      <h3 className="mt-3 text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
        {t.promoMainTitle}
      </h3>

      <ul className="mt-2.5 space-y-2 text-xs font-medium text-[#1e3a34]">
        <li className="flex items-center gap-2">
          <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
          <span>{t.promoPoint1}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
          <span>{t.promoPoint2}</span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
          <span>{t.promoPoint3}</span>
        </li>
      </ul>

      <div className="mt-4 mb-2.5 flex items-center gap-1.5 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
        <MousePointerClick className="size-4" />
        <span>
          {isCurrentlyFeatured || isPendingPromo
            ? t.promoClickHintActive
            : t.promoClickHintNew}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {dynamicPackages.map((pkg) => {
          const isSelected =
            (isCurrentlyFeatured || isPendingPromo) &&
            activePromoDays === pkg.days
          return (
            <button
              key={pkg.days}
              type="button"
              disabled={isPending}
              onClick={() => onSelectPackage(pkg)}
              className={`group flex cursor-pointer flex-col items-center justify-between rounded-2xl border bg-white p-3 text-center transition-all hover:shadow-md sm:p-4 ${
                isSelected
                  ? 'border-[var(--brand-primary,#007a5a)] ring-2 ring-[var(--brand-primary,#007a5a)]/25'
                  : 'border-gray-200 hover:border-[var(--brand-primary,#007a5a)]'
              }`}
            >
              <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                {pkg.label}
              </span>
              <span className="my-1.5 text-xs font-black text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-base">
                {pkg.price.toLocaleString('en-US')} {currencySymbol}
              </span>
              <span
                className={`w-full rounded-lg py-1 text-[10px] font-extrabold transition sm:text-[11px] ${
                  isSelected
                    ? 'bg-[var(--brand-primary,#007a5a)] text-white'
                    : 'bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)] group-hover:bg-[var(--brand-primary,#007a5a)] group-hover:text-white'
                }`}
              >
                {isSelected ? t.currentPkgBtn : t.choosePkgBtn}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-3.5 text-[11px] leading-relaxed text-[#2b584d]">
        {t.promoFreeNote}
      </p>

      {(isCurrentlyFeatured || isPendingPromo) && currentAdRef && (
        <div className="mt-4 rounded-xl border border-[var(--brand-primary,#007a5a)]/30 bg-white p-4 text-start shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                {t.adOrderCodeTitle} ({activePromoDays} {t.daysWord} —{' '}
                {activePromoPrice.toLocaleString('en-US')} {currencySymbol}):
              </p>
              <p className="mt-1 font-mono text-lg font-black tracking-wider text-[var(--brand-primary,#007a5a)]">
                {currentAdRef}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(currentAdRef)
                setCopiedAdRef(true)
                setTimeout(() => setCopiedAdRef(false), 2000)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-100"
            >
              <Copy className="size-3.5" />
              <span>{copiedAdRef ? t.copiedBtn : t.copyRefBtn}</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            {!isCurrentlyFeatured && (
              <a
                href={`https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
              >
                <MessageCircle className="size-4" />
                <span>{t.whatsappActivateBtn}</span>
              </a>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={onCancelPromo}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
            >
              <XCircle className="size-3.5" />
              <span>
                {isCurrentlyFeatured
                  ? t.cancelActivePromoBtn
                  : t.cancelPendingPromoBtn}
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Timeline({
  currentStepIndex,
  isRejected,
  stepTitles,
}: {
  currentStepIndex: number
  isRejected?: boolean
  stepTitles: string[]
}) {
  return (
    <ol className="relative flex flex-col items-start">
      {stepTitles.map((title, index) => {
        const isLast = index === stepTitles.length - 1
        const status: 'done' | 'current' | 'upcoming' =
          index < currentStepIndex
            ? 'done'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming'

        return (
          <li
            key={title}
            className="relative flex items-start gap-3.5 pb-5 last:pb-0"
          >
            {!isLast && (
              <span
                className={`absolute top-6 start-[11px] h-full w-[1.5px] ${
                  status === 'done'
                    ? 'bg-[var(--brand-primary,#007a5a)]'
                    : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                status === 'done'
                  ? 'bg-[var(--brand-primary,#007a5a)] text-white'
                  : status === 'current'
                    ? isRejected
                      ? 'bg-red-600 text-white'
                      : 'bg-[var(--brand-navy,#0a1122)] text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {status === 'done' ? (
                <Check className="size-3.5 stroke-[2.5]" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`pt-0.5 text-xs ${
                status === 'current'
                  ? isRejected
                    ? 'font-extrabold text-red-600'
                    : 'font-extrabold text-[var(--brand-navy,#0a1122)]'
                  : status === 'done'
                    ? 'font-medium text-gray-600'
                    : 'font-normal text-gray-400'
              }`}
            >
              {title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}