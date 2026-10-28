export type SellerUnitItem = {
  id: string
  user_id?: string | null
  name?: string | null
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

export type MissingCompletionItem = {
  key: 'photos' | 'docs' | 'details'
  label: string
  href: string
}

export type StatusBadgeItem = {
  label: string
  cls: string
}

export type ConfirmModalState =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'delete' }
  | {
      type: 'promote'
      pkg: { days: 7 | 14 | 30; price: number; label: string }
    }
  | { type: 'cancel_promo' }
  | null

export const REAL_DOC_KEYS = [
  'contract',
  'receipts',
  'statement',
  'passport',
] as const

export function calculateUnitCompletion(
  unit: SellerUnitItem,
  t: Record<string, any>
) {
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
    rawImages.filter((img: any) => Boolean(img && String(img).trim())).length >
    0

  const docsObj =
    unit.documents && typeof unit.documents === 'object' ? unit.documents : {}
  const normalizedDocs: Record<string, any> = { ...docsObj }
  if (normalizedDocs.national_id && !normalizedDocs.passport) {
    normalizedDocs.passport = normalizedDocs.national_id
  }

  const uploadedDocsCount = REAL_DOC_KEYS.filter((k) =>
    Boolean(normalizedDocs[k]?.url)
  ).length
  const totalDocsRequired = REAL_DOC_KEYS.length // 4
  const hasAllDocuments = uploadedDocsCount === totalDocsRequired
  const remainingDocsCount = Math.max(0, totalDocsRequired - uploadedDocsCount)

  const areaVal = unit.area || meta.area
  const typeVal = unit.unit_type || meta.unit_type
  const sizeVal = Number(unit.size ?? meta.size) || 0
  const roomsVal = Number(unit.rooms ?? meta.rooms) || 0
  const bathsVal = Number(unit.bathrooms ?? meta.bathrooms) || 0
  const finishingVal = unit.finishing || meta.finishing
  const deliveryVal = unit.delivery_status || meta.delivery_status
  const contractYrVal = Number(unit.contract_year ?? meta.contract_year) || 0
  const instFreqVal = unit.installment_frequency || meta.installment_frequency

  // 13 حقل بيانات أساسي + 1 صور + 4 مستندات = 18
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
    Boolean(instFreqVal && contractYrVal > 0),
  ]

  const completedDataCount = dataChecks.filter(Boolean).length
  const hasAllCoreDetails = Boolean(
    areaVal && typeVal && sizeVal > 0 && completedDataCount === dataChecks.length
  )

  const total = dataChecks.length + 1 + totalDocsRequired // 18
  const completedCount =
    completedDataCount + (hasImages ? 1 : 0) + uploadedDocsCount

  const dataScore = Math.round((completedDataCount / dataChecks.length) * 65)
  const photosScore = hasImages ? 15 : 0
  const docsScore = Math.round((uploadedDocsCount / totalDocsRequired) * 20)
  const percentage = Math.min(100, dataScore + photosScore + docsScore)

  const missingItems: MissingCompletionItem[] = []
  if (!hasAllCoreDetails) {
    missingItems.push({
      key: 'details',
      label: t.completeDetailsAction,
      href: `/sell?editUnitId=${unit.id}&step=3`,
    })
  }
  if (!hasImages) {
    missingItems.push({
      key: 'photos',
      label: t.addPhotosAction,
      href: `/sell?editUnitId=${unit.id}&step=5`,
    })
  }
  if (!hasAllDocuments) {
    missingItems.push({
      key: 'docs',
      label:
        uploadedDocsCount === 0
          ? t.addDocsAction
          : `${t.completeDocsPrefix} (${uploadedDocsCount}/4 — ${t.remainingDocsWord} ${remainingDocsCount})`,
      href: `/account/documents?unitId=${unit.id}`,
    })
  }

  return {
    completedCount,
    total,
    percentage,
    hasImages,
    hasAllDocuments,
    hasAllCoreDetails,
    uploadedDocsCount,
    missingItems,
    isUnitPhoneVerified: Boolean(meta.phone_verified),
  }
}

export function getSellerTimelineAndStatus(
  unit: SellerUnitItem,
  comp: ReturnType<typeof calculateUnitCompletion>,
  t: Record<string, any>
) {
  const clean = (unit.status || 'pending').trim().toLowerCase()
  const isComplete =
    comp.hasAllCoreDetails && comp.hasImages && comp.hasAllDocuments

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
            label: `${t.notPublishedYet} · ${comp.percentage}%`,
            cls: 'bg-slate-100 text-slate-600 border border-slate-200/80',
          },
          headerBadge: null,
          headline: t.incompleteNextStepHeadline,
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
