import type { LocaleCode } from '@/lib/i18n'

export type SellerUnitItem = {
  id: string
  code?: string | null
  user_id?: string | null
  name?: string | null
  project_name: string | null
  developer_name: string | null
  area: string | null
  exact_street?: string | null
  house_number?: string | null
  cadastral_code?: string | null
  unit_type: string | null
  building_status?: string | null
  size: number | null
  rooms: number | null
  bedrooms?: number | null
  bathrooms: number | null
  floor_number?: number | null
  total_floors?: number | null
  finishing: string | null
  delivery_status: string | null
  delivery_month?: string | null
  delivery_year?: number | null
  description: string | null
  contract_price: number | null
  paid_amount: number | null
  market_price: number | null
  installment_amount: number | null
  installment_frequency: string | null
  contract_month?: string | null
  contract_year: number | null
  years_left?: number | null
  willing_to_discount: boolean | null
  discount_amount?: number | null
  has_overdue_installments: boolean | null
  video_url?: string | null
  tour_3d_url?: string | null
  allow_online_viewing?: boolean | null
  features?: string[] | null
  status: string | null
  submission_type?: string | null
  admin_note: string | null
  images: string[] | null
  documents: Record<string, any> | null
  country?: string | null
  country_code?: string | null
  currency_code?: string | null
  is_featured?: boolean | null
  boost_tier?: 'super_vip' | 'vip_plus' | null
  featured_days?: number | null
  featured_price?: number | null
  featured_status?: string | null
  featured_fawry_code?: string | null
  featured_until?: string | null
  views_count?: number | null
  approved_at?: string | null
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
      pkg: {
        days: number
        price: number
        label: string
        tier?: 'SUPER VIP' | 'VIP+' | 'super_vip' | 'vip_plus'
      }
    }
  | { type: 'cancel_promo' }
  | null

export const REAL_DOC_KEYS = [
  'contract',
  'receipts',
  'statement',
  'passport',
] as const

const STAGE_SYNC_I18N: Record<
  LocaleCode,
  {
    steps: [string, string, string, string, string, string]
    underReviewBadge: string
    underReviewHeadline: string
  }
> = {
  ar: {
    steps: [
      '١. في انتظار المراجعة',
      '٢. جاري مراجعة المستندات',
      '٣. معتمد ومعروض بالسوق',
      '٤. يوجد عرض شراء',
      '٥. مرحلة نقل التعاقد',
      '٦. تمت عملية البيع',
    ],
    underReviewBadge: '٢. جاري مراجعة المستندات',
    underReviewHeadline:
      'يقوم فريق المراجعة القانونية حالياً بفحص بيانات ومستندات وحدتك لاعتمادها ونشرها بالسوق',
  },
  en: {
    steps: [
      '1. Pending Review',
      '2. Reviewing Documents',
      '3. Approved & Live in Market',
      '4. Purchase Offer Received',
      '5. Contract Transfer Stage',
      '6. Unit Sold',
    ],
    underReviewBadge: '2. Reviewing Documents',
    underReviewHeadline:
      'Our verification team is currently reviewing your unit details & documents for market approval',
  },
  ru: {
    steps: [
      '1. Ожидает проверки',
      '2. Проверка документов',
      '3. Одобрено и на рынке',
      '4. Получено предложение',
      '5. Переоформление договора',
      '6. Объект продан',
    ],
    underReviewBadge: '2. Проверка документов',
    underReviewHeadline:
      'Юридический отдел проверяет данные и документы вашего объекта перед публикацией',
  },
  ka: {
    steps: [
      '1. განხილვის მოლოდინში',
      '2. დოკუმენტების შემოწმება',
      '3. დამტკიცებულია ბაზარზე',
      '4. მიღებულია შეთავაზება',
      '5. კონტრაქტის გადაფორმება',
      '6. გაყიდულია',
    ],
    underReviewBadge: '2. დოკუმენტების შემოწმება',
    underReviewHeadline:
      'ჩვენი გუნდი ამოწმებს თქვენი ობიექტის მონაცემებსა და დოკუმენტებს გამოსაქვეყნებლად',
  },
}

/**
 * استخراج الملاحظة الفعلية التي كتبها الأدمن للبائع فقط (واستبعاد ملاحظات النظام الآلية)
 */
export function getVisibleSellerAdminNote(
  rawNote?: string | null
): string | null {
  if (!rawNote) return null
  const clean = String(rawNote).trim()
  if (!clean || clean.startsWith('__')) return null

  const systemSubstrings = [
    'أعاد المالك عرض هذه الوحدة',
    'حذفها المالك بتاريخ',
    'Owner resumed this unit',
    'Deleted by owner on',
    'Собственник возобновил показ',
    'Удалено собственником',
    'მესაკუთრემ განაახლა',
    'წაშლილია მესაკუთრის მიერ',
  ]

  for (const sys of systemSubstrings) {
    if (clean.includes(sys)) return null
  }

  return clean
}

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
  const streetVal = unit.exact_street || meta.exact_street
  const typeVal = unit.unit_type || meta.unit_type
  const isLand = String(typeVal || '').toLowerCase() === 'land'
  const sizeVal = Number(unit.size ?? meta.size) || 0
  const roomsVal = Number(unit.rooms ?? meta.rooms) || 0
  const bedroomsVal = Number(unit.bedrooms ?? meta.bedrooms ?? roomsVal) || 0
  const bathsVal = Number(unit.bathrooms ?? meta.bathrooms) || 1
  const finishingVal = unit.finishing || meta.finishing
  const deliveryVal = unit.delivery_status || meta.delivery_status
  const contractYrVal =
    Number(unit.contract_year ?? meta.contract_year) || 2024
  const instFreqVal =
    unit.installment_frequency || meta.installment_frequency || 'شهري'

  const dataChecks = [
    Boolean(unit.project_name),
    Boolean(areaVal),
    Boolean(streetVal),
    Boolean(typeVal),
    sizeVal > 0,
    isLand ? true : roomsVal > 0,
    isLand ? true : bedroomsVal > 0,
    isLand ? true : bathsVal > 0,
    isLand ? true : Boolean(finishingVal),
    Boolean(deliveryVal),
    Number(unit.contract_price) > 0,
    Number(unit.paid_amount) > 0,
    Boolean(instFreqVal && contractYrVal > 0),
  ]

  const completedDataCount = dataChecks.filter(Boolean).length
  const hasAllCoreDetails = Boolean(
    areaVal &&
      typeVal &&
      sizeVal > 0 &&
      Number(unit.contract_price) > 0 &&
      Number(unit.paid_amount) > 0 &&
      (isLand || roomsVal > 0)
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
      href: `/sell?editUnitId=${unit.id}`,
    })
  }
  if (!hasImages) {
    missingItems.push({
      key: 'photos',
      label: t.addPhotosAction,
      href: `/sell?editUnitId=${unit.id}`,
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

  const cleanStatus = String(unit.status || 'pending').trim().toLowerCase()
  const isAlreadyPublishedOrApproved = [
    'active',
    'approved',
    'published',
    'offer_received',
    'transferring',
    'sold',
  ].includes(cleanStatus)

  return {
    completedCount,
    total,
    percentage,
    hasImages,
    hasAllDocuments,
    hasAllCoreDetails,
    uploadedDocsCount,
    missingItems,
    isUnitPhoneVerified: Boolean(
      meta.phone_verified || isAlreadyPublishedOrApproved
    ),
    isUnitEmailVerified: Boolean(
      meta.email_verified ||
        isAlreadyPublishedOrApproved ||
        cleanStatus !== 'draft_unverified'
    ),
    isDraftUnverified: cleanStatus === 'draft_unverified',
  }
}

export function getSellerTimelineAndStatus(
  unit: SellerUnitItem,
  comp: ReturnType<typeof calculateUnitCompletion>,
  t: Record<string, any>,
  locale: LocaleCode = 'ar'
) {
  const clean = (unit.status || 'pending').trim().toLowerCase()
  const isComplete =
    comp.hasAllCoreDetails && comp.hasImages && comp.hasAllDocuments
  const stageSync = STAGE_SYNC_I18N[locale] || STAGE_SYNC_I18N.ar
  const timelineSteps = stageSync.steps

  switch (clean) {
    case 'draft_unverified':
      return {
        code: 'draft_unverified',
        stepIndex: 0,
        timelineSteps,
        listBadge: {
          label: t.statusDraftUnverifiedBadge || t.notPublishedYet,
          cls: 'bg-amber-100 text-amber-900 border border-amber-300',
        },
        headerBadge: {
          label: t.statusDraftUnverifiedBadge || t.notPublishedYet,
          cls: 'bg-amber-100 text-amber-900 border border-amber-300',
        } as StatusBadgeItem | null,
        headline:
          t.statusDraftUnverifiedHeadline || t.incompleteNextStepHeadline,
      }

    // المرحلة ٢ في قائمة الأدمن: جاري مراجعة المستندات
    case 'under_review':
      return {
        code: 'under_review',
        stepIndex: 1,
        timelineSteps,
        listBadge: {
          label: t.statusUnderReviewBadge || stageSync.underReviewBadge,
          cls: 'bg-blue-100 text-blue-900 border border-blue-300',
        },
        headerBadge: {
          label: t.statusUnderReviewBadge || stageSync.underReviewBadge,
          cls: 'bg-blue-100 text-blue-900 border border-blue-300',
        } as StatusBadgeItem | null,
        headline: t.statusUnderReviewHeadline || stageSync.underReviewHeadline,
      }

    // المرحلة ٣ في قائمة الأدمن: معتمد ومعروض بالسوق
    case 'active':
    case 'approved':
    case 'published':
      return {
        code: 'active',
        stepIndex: 2,
        timelineSteps,
        listBadge: {
          label: t.statusActiveBadge || timelineSteps[2],
          cls: 'bg-emerald-100 text-[var(--brand-primary,#007a5a)]',
        },
        headerBadge: {
          label: t.statusActiveBadge || timelineSteps[2],
          cls: 'bg-emerald-100 text-[var(--brand-primary,#007a5a)]',
        } as StatusBadgeItem | null,
        headline: t.statusActiveHeadline,
      }

    // المرحلة ٤ في قائمة الأدمن: يوجد عرض شراء
    case 'offer_received':
      return {
        code: 'offer_received',
        stepIndex: 3,
        timelineSteps,
        listBadge: {
          label: t.statusOfferBadge || timelineSteps[3],
          cls: 'bg-purple-100 text-purple-800',
        },
        headerBadge: {
          label: t.statusOfferBadge || timelineSteps[3],
          cls: 'bg-purple-100 text-purple-800',
        } as StatusBadgeItem | null,
        headline: t.statusOfferHeadline,
      }

    // المرحلة ٥ في قائمة الأدمن: مرحلة نقل التعاقد
    case 'transferring':
      return {
        code: 'transferring',
        stepIndex: 4,
        timelineSteps,
        listBadge: {
          label: t.statusTransferBadge || timelineSteps[4],
          cls: 'bg-indigo-100 text-indigo-900',
        },
        headerBadge: {
          label: t.statusTransferBadge || timelineSteps[4],
          cls: 'bg-indigo-100 text-indigo-900',
        } as StatusBadgeItem | null,
        headline: t.statusTransferHeadline,
      }

    // المرحلة ٦ في قائمة الأدمن: تمت عملية البيع
    case 'sold':
      return {
        code: 'sold',
        stepIndex: 5,
        timelineSteps,
        listBadge: {
          label: t.statusSoldBadge || timelineSteps[5],
          cls: 'bg-teal-700 text-white',
        },
        headerBadge: {
          label: t.statusSoldBadge || timelineSteps[5],
          cls: 'bg-teal-700 text-white',
        } as StatusBadgeItem | null,
        headline: t.statusSoldHeadline,
      }

    // متوقفة مؤقتاً (من البائع أو الأدمن)
    case 'paused_by_seller':
      return {
        code: 'paused_by_seller',
        stepIndex: 2,
        timelineSteps,
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
        timelineSteps,
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

    // المرحلة ٧ في قائمة الأدمن: مرفوض
    case 'rejected':
      return {
        code: 'rejected',
        stepIndex: 1,
        timelineSteps,
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

    // المرحلة ١ في قائمة الأدمن: في انتظار المراجعة (pending)
    default:
      if (!isComplete) {
        return {
          code: 'incomplete',
          stepIndex: 0,
          timelineSteps,
          listBadge: {
            label: `${t.statusPendingBadge || timelineSteps[0]} · ${comp.percentage}%`,
            cls: 'bg-amber-50 text-amber-800 border border-amber-200',
          },
          headerBadge: {
            label: t.statusPendingBadge || timelineSteps[0],
            cls: 'bg-amber-50 text-amber-800 border border-amber-200',
          } as StatusBadgeItem | null,
          headline: t.incompleteNextStepHeadline,
        }
      }
      return {
        code: 'pending_review',
        stepIndex: 0,
        timelineSteps,
        listBadge: {
          label: t.statusPendingBadge || timelineSteps[0],
          cls: 'bg-amber-50 text-amber-800 border border-amber-200',
        },
        headerBadge: {
          label: t.statusPendingBadge || timelineSteps[0],
          cls: 'bg-amber-50 text-amber-800 border border-amber-200',
        } as StatusBadgeItem | null,
        headline: t.statusPendingHeadline,
      }
  }
}