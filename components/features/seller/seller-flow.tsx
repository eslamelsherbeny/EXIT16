'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  getAuthorizedUnitForEditAction,
  getCurrentSellerProfileAction,
  processSellerStep2Action,
  saveSellProgress,
  sendSellerReviewOtpAction,
  submitSellRequest,
  verifyMagicTokenAction,
  verifySellerReviewOtpAction,
} from '@/actions/submit-forms'
import { getUserVerificationStatusAction } from '@/actions/auth-actions'
import {
  deleteUnitDocumentAction,
  saveUnitDocumentAction,
} from '@/actions/account-actions'
import { createClient } from '@/lib/supabase/client'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  ACTIVE_PLATFORM_COUNTRY,
  DEFAULT_PHONE_CODE,
  getSellerExtraLabels,
  getSellerFormTranslations,
  type SellerDocKey,
  type UploadedDocEntry,
} from './seller-i18n'
import {
  getOptionLabel,
  PROPERTY_KINDS,
  toEnglishDigits,
  type DealCategory,
} from './seller-shared'
import {
  DetailsSection,
  LivePreviewSidebar,
  LocationSection,
  PhotosSection,
  PricingSection,
  TypeSection,
} from './seller-form-steps'
import { ContactSection } from './seller-contact-step'
import { ReviewStep } from './seller-review-step'
import {
  computeMissingCoreItems,
  createSellerFormData,
  FLOW_LOADING_LABELS,
  getDynamicBuildingStatusOptions,
  parsePhoneCodeAndLocal,
} from './seller-flow-helpers'
import {
  SellerDocPreviewModal,
  SellerFinalReadinessCard,
  SellerMissingMediaConfirmModal,
  SellerVerifyEmailModal,
} from './seller-final-card'

export type { SellerDocKey, UploadedDocEntry }

export function SellerFlow() {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const extraT = getSellerExtraLabels(locale as LocaleCode, dict)
  const fT = getSellerFormTranslations(locale as LocaleCode, dict)
  const loadT =
    FLOW_LOADING_LABELS[locale as LocaleCode] || FLOW_LOADING_LABELS.ar

  const secTypeRef = useRef<HTMLElement | null>(null)
  const secPhotosRef = useRef<HTMLElement | null>(null)
  const secLocationRef = useRef<HTMLElement | null>(null)
  const secDetailsRef = useRef<HTMLElement | null>(null)
  const secPriceRef = useRef<HTMLElement | null>(null)
  const secContactRef = useRef<HTMLElement | null>(null)
  const isManualScrollingRef = useRef(false)

  const [initialLoading, setInitialLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const p = new URLSearchParams(window.location.search)
    return Boolean(p.get('editUnitId') || p.get('resume') || p.get('magic'))
  })
  const [initLoadError, setInitLoadError] = useState<string>('')

  const [activeTab, setActiveTab] = useState<number>(1)
  const [unitId, setUnitId] = useState<string>('')
  const [orderRef, setOrderRef] = useState<string>('AE-1001')

  const [dealCategory, setDealCategory] = useState<DealCategory | ''>('exit')
  const [propertyKind, setPropertyKind] = useState<string>('')
  const [buildingStatus, setBuildingStatus] = useState<string>('')
  const [priceInputMode, setPriceInputMode] = useState<'total' | 'sqm'>('total')
  const [currencyChoice, setCurrencyChoice] = useState<'USD' | 'GEL' | 'EUR'>(
    'USD'
  )

  const [form, setForm] = useState<Record<string, string>>({
    countryCode: DEFAULT_PHONE_CODE,
    unitCountry: ACTIVE_PLATFORM_COUNTRY,
    userCountry: ACTIVE_PLATFORM_COUNTRY,
    developer: '',
    project: '',
    location: '',
    locationDisplay: '',
    exactStreet: '',
    houseNumber: '',
    cadastralCode: '',
    lat: '',
    lng: '',
    yearBuilt: '',
    areaSize: '',
    kitchenArea: '',
    balconyArea: '',
    loggiaArea: '',
    terraceArea: '',
    garden: '',
    bedrooms: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    maxGuests: '',
    deliveryRemainingMonths: '',
    deliveryYear: '2026',
    contractPrice: '',
    paidAmount: '',
    marketPrice: '',
    rentPrice: '',
    pricePerSqm: '',
    installment: '',
    remainingMonths: '',
    contractMonth: '05',
    contractYear: '2024',
    annualInstallmentAmount: '',
    discountAmount: '',
    overdueCount: '',
    overdueTotal: '',
    videoUrl: '',
    tour3dUrl: '',
    description: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    loginIdentifier: '',
    loginPassword: '',
    owner: 'yes',
    confirmed: 'yes',
  })

  const [selected, setSelected] = useState<Record<string, string[]>>({
    finishing: [],
    buildingSeries: [],
    floorType: [],
    heatingType: [],
    buildingMaterial: [],
    frequency: ['شهري'],
    annualInstallment: ['no'],
    discountOffer: ['no'],
    overdueInstallments: ['no'],
    features: [],
    messengers: ['whatsapp', 'viber'],
  })

  const [flags, setFlags] = useState({
    allowOnlineViewing: false,
    installmentSalePossible: false,
    exchangePossible: false,
    isExclusive: false,
    agreedTerms: true,
  })

  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [unitDocs, setUnitDocs] = useState<Record<string, UploadedDocEntry>>({})
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{
    url: string
    title: string
  } | null>(null)

  const [authMode, setAuthMode] = useState<
    'sivrce_default' | 'session' | 'register' | 'login'
  >('register')

  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [missingMediaModalOpen, setMissingMediaModalOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [pendingPublishIds, setPendingPublishIds] = useState<{
    unitId: string
    userId: string
    email: string
  } | null>(null)

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [savingDraftLoading, setSavingDraftLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  const clearSingleFieldError = (fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev
      const next = { ...prev }
      delete next[fieldKey]
      return next
    })
  }

  const handleTogglePropertyKind = (kindId: string) => {
    clearSingleFieldError('propertyKind')
    clearSingleFieldError('buildingStatus')
    if (propertyKind === kindId) {
      setPropertyKind('')
      setBuildingStatus('')
    } else {
      setPropertyKind(kindId)
      setBuildingStatus('')
      if (kindId === 'Land') setActiveTab(2)
    }
  }

  const handleToggleBuildingStatus = (statusId: string) => {
    clearSingleFieldError('buildingStatus')
    if (buildingStatus === statusId) {
      setBuildingStatus('')
    } else {
      setBuildingStatus(statusId)
      if (statusId !== 'Under construction') {
        setForm((prev) => ({
          ...prev,
          deliveryRemainingMonths: '0',
          deliveryYear: String(new Date().getFullYear()),
        }))
      }
      setActiveTab(2)
    }
  }

  useEffect(() => {
    const handleScrollSpy = () => {
      if (isManualScrollingRef.current) return
      const sections: Array<{ id: number; el: HTMLElement | null }> = [
        { id: 1, el: secTypeRef.current },
        { id: 2, el: secPhotosRef.current },
        { id: 3, el: secLocationRef.current },
        { id: 4, el: secDetailsRef.current },
        { id: 5, el: secPriceRef.current },
        { id: 6, el: secContactRef.current },
      ]

      const viewportLine = window.innerHeight * 0.32
      let activeId = 1
      for (const sec of sections) {
        if (!sec.el) continue
        if (sec.el.getBoundingClientRect().top <= viewportLine) {
          activeId = sec.id
        }
      }
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 100
      ) {
        activeId = 6
      }
      setActiveTab((prev) => (prev !== activeId ? activeId : prev))
    }

    window.addEventListener('scroll', handleScrollSpy, { passive: true })
    return () => window.removeEventListener('scroll', handleScrollSpy)
  }, [])

  // تحريك شريط الخطوات العلوي أفقياً على الموبايل ليتبع القسم الحالي تلقائياً أثناء النزول
  useEffect(() => {
    const activeTabBtn = document.getElementById(`seller-step-tab-${activeTab}`)
    if (activeTabBtn) {
      activeTabBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeTab])

  const loadInitialData = useCallback(async () => {
    const params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams()
    const magicToken = params.get('magic')
    const editUnitId = params.get('editUnitId') || params.get('resume')
    const shouldOpenVerifyModal = params.get('verifyEmail') === '1'
    const isEditingExistingUnit = Boolean(magicToken || editUnitId)

    if (isEditingExistingUnit) setInitialLoading(true)
    setInitLoadError('')

    try {
      const [profileRes, verStatus] = await Promise.all([
        getCurrentSellerProfileAction(),
        getUserVerificationStatusAction(),
      ])

      let isUserEmailVerified = false
      let currentUserEmail = ''
      let currentUserId = ''

      if (profileRes.isLoggedIn && profileRes.user) {
        setLoggedUser(profileRes.user)
        setAuthMode('session')
        currentUserId = profileRes.user.id
        currentUserEmail = profileRes.user.email || ''
        isUserEmailVerified = Boolean(
          (profileRes.user as any).emailVerified || verStatus.emailVerified
        )
        setEmailVerified(isUserEmailVerified)

        const parsedPhone = parsePhoneCodeAndLocal(profileRes.user.phone)
        setForm((prev) => ({
          ...prev,
          countryCode: prev.phone ? prev.countryCode : parsedPhone.code,
          name: prev.name || profileRes.user?.name || '',
          phone: prev.phone || parsedPhone.local || '',
          email: prev.email || profileRes.user?.email || '',
        }))

        const savedUserMessengers = (profileRes.user as any)?.contactMessengers
        if (
          Array.isArray(savedUserMessengers) &&
          savedUserMessengers.length > 0
        ) {
          setSelected((prev) => ({ ...prev, messengers: savedUserMessengers }))
        }
      } else {
        setLoggedUser(null)
        setAuthMode('register')
      }

      if (isEditingExistingUnit) {
        const hydrateUnit = (u: any) => {
          const meta = u.documents?.__unit_meta || {}
          setUnitId(String(u.id))
          setOrderRef(
            u.code ||
              `AE-${String(u.id)
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 6)
                .toUpperCase()}`
          )
          setDealCategory('exit')
          setPropertyKind(u.unit_type || meta.unit_type || 'Apartment')
          setBuildingStatus(
            u.building_status || meta.building_status || 'Newly built'
          )

          const savedArea = u.area || meta.area || 'Tbilisi - Saburtalo'
          const parsedUnitPhone = parsePhoneCodeAndLocal(
            u.phone || profileRes.user?.phone
          )

          const invalidDevList = [
            'newly built',
            'under construction',
            'old built',
            'completed',
          ]
          const cleanDev =
            u.developer_name &&
            !invalidDevList.includes(
              String(u.developer_name).trim().toLowerCase()
            )
              ? u.developer_name
              : meta.developer_name || ''

          setForm((prev) => ({
            ...prev,
            countryCode: parsedUnitPhone.code,
            developer: cleanDev,
            project: u.project_name || '',
            location: savedArea,
            locationDisplay: getLocalizedGeorgiaAreaName(
              savedArea,
              locale as LocaleCode
            ),
            exactStreet: u.exact_street || meta.exact_street || '',
            houseNumber: u.house_number || meta.house_number || '',
            cadastralCode: u.cadastral_code || meta.cadastral_code || '',
            lat: meta.lat ? String(meta.lat) : '',
            lng: meta.lng ? String(meta.lng) : '',
            yearBuilt: String(u.year_built || meta.year_built || ''),
            areaSize: u.size || meta.size ? String(u.size || meta.size) : '',
            balconyArea:
              u.balcony_area || meta.balcony_area
                ? String(u.balcony_area || meta.balcony_area)
                : '',
            loggiaArea:
              u.loggia_area || meta.loggia_area
                ? String(u.loggia_area || meta.loggia_area)
                : '',
            terraceArea:
              u.terrace_area || meta.terrace_area
                ? String(u.terrace_area || meta.terrace_area)
                : '',
            garden:
              u.garden_size || meta.garden_size
                ? String(u.garden_size || meta.garden_size)
                : '',
            bedrooms: String(u.bedrooms || meta.bedrooms || ''),
            rooms: String(u.rooms || meta.rooms || ''),
            bathrooms: String(u.bathrooms || meta.bathrooms || ''),
            floor:
              u.floor_number !== null && u.floor_number !== undefined
                ? String(u.floor_number)
                : String(meta.floor_number || ''),
            totalFloors: String(u.total_floors || meta.total_floors || ''),
            deliveryRemainingMonths: String(
              u.delivery_month || meta.delivery_month || ''
            ),
            deliveryYear: String(
              u.delivery_year || meta.delivery_year || '2026'
            ),
            description: u.description || '',
            contractPrice: u.contract_price ? String(u.contract_price) : '',
            paidAmount: u.paid_amount ? String(u.paid_amount) : '',
            marketPrice:
              u.market_price || u.contract_price
                ? String(u.market_price || u.contract_price)
                : '',
            installment:
              u.installment_amount || meta.installment_amount
                ? String(u.installment_amount || meta.installment_amount)
                : '',
            remainingMonths:
              u.years_left !== null && u.years_left !== undefined
                ? String(u.years_left)
                : String(meta.years_left || '0'),
            contractMonth: String(
              u.contract_month || meta.contract_month || '05'
            ),
            contractYear: String(
              u.contract_year || meta.contract_year || '2024'
            ),
            annualInstallmentAmount: u.annual_installment_amount
              ? String(u.annual_installment_amount)
              : '',
            discountAmount: u.discount_amount ? String(u.discount_amount) : '',
            overdueCount: u.overdue_installments
              ? String(u.overdue_installments)
              : '',
            overdueTotal: u.overdue_total_amount
              ? String(u.overdue_total_amount)
              : '',
            videoUrl: u.video_url || meta.video_url || '',
            tour3dUrl: u.tour_3d_url || meta.tour_3d_url || '',
            name: u.name || profileRes.user?.name || '',
            phone: parsedUnitPhone.local || '',
            email: u.email || profileRes.user?.email || '',
          }))

          setFlags((prev) => ({
            ...prev,
            allowOnlineViewing: Boolean(
              u.allow_online_viewing ?? meta.allow_online_viewing ?? false
            ),
            installmentSalePossible: Boolean(
              u.installment_sale_possible ??
                meta.installment_sale_possible ??
                false
            ),
            exchangePossible: Boolean(
              u.exchange_possible ?? meta.exchange_possible ?? false
            ),
          }))

          setSelected((prev) => ({
            ...prev,
            finishing:
              u.finishing || meta.finishing
                ? [u.finishing || meta.finishing]
                : [],
            buildingSeries:
              u.building_series || meta.building_series
                ? [u.building_series || meta.building_series]
                : [],
            floorType:
              u.floor_type || meta.floor_type
                ? [u.floor_type || meta.floor_type]
                : [],
            heatingType:
              u.heating_type || meta.heating_type
                ? [u.heating_type || meta.heating_type]
                : [],
            buildingMaterial:
              u.building_material || meta.building_material
                ? [u.building_material || meta.building_material]
                : [],
            frequency:
              u.installment_frequency || meta.installment_frequency
                ? [u.installment_frequency || meta.installment_frequency]
                : ['شهري'],
            features:
              Array.isArray(u.features) && u.features.length > 0
                ? u.features
                : Array.isArray(meta.features)
                  ? meta.features
                  : prev.features,
            messengers:
              Array.isArray(u.contact_messengers) &&
              u.contact_messengers.length > 0
                ? u.contact_messengers
                : Array.isArray(meta.contact_messengers)
                  ? meta.contact_messengers
                  : ['whatsapp', 'viber'],
            discountOffer: [u.willing_to_discount ? 'yes' : 'no'],
            annualInstallment: [u.has_annual_installment ? 'yes' : 'no'],
            overdueInstallments: [u.has_overdue_installments ? 'yes' : 'no'],
          }))

          if (Array.isArray(u.images)) setImages(u.images)
          if (u.documents && typeof u.documents === 'object') {
            const rawDocs = { ...u.documents }
            delete rawDocs.__unit_meta
            setUnitDocs(rawDocs)
          }

          const unitCleanStatus = String(u.status || '').trim().toLowerCase()
          const isAlreadyPublishedOrApproved = [
            'active',
            'approved',
            'published',
            'offer_received',
            'transferring',
            'sold',
          ].includes(unitCleanStatus)

          if (isAlreadyPublishedOrApproved || meta.email_verified) {
            setEmailVerified(true)
          } else if (shouldOpenVerifyModal && !isUserEmailVerified) {
            setPendingPublishIds({
              unitId: String(u.id),
              userId: String(u.user_id || currentUserId),
              email: String(u.email || currentUserEmail),
            })
            setOtpSent(false)
            setOtpCode('')
            setOtpError('')
            setVerifyModalOpen(true)
          }

          const focusTarget = params.get('focus')
          const savedImgs = Array.isArray(u.images)
            ? u.images.filter(Boolean)
            : []
          const savedDocsObj =
            u.documents && typeof u.documents === 'object' ? u.documents : {}
          const savedDocsCount = (
            ['contract', 'receipts', 'statement', 'passport'] as const
          ).filter((k) => Boolean(savedDocsObj[k]?.url)).length

          setTimeout(() => {
            if (
              focusTarget === 'photos' ||
              (savedImgs.length === 0 && u.area && u.size)
            ) {
              secPhotosRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            } else if (
              focusTarget === 'docs' ||
              (savedImgs.length > 0 && savedDocsCount < 4 && u.area && u.size)
            ) {
              secPriceRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
              })
            }
          }, 400)
        }

        if (magicToken) {
          const res = await verifyMagicTokenAction(magicToken)
          if (res.valid && res.unit) {
            setAuthMode('session')
            setEmailVerified(true)
            hydrateUnit(res.unit)
          } else {
            setInitLoadError(res.error || loadT.loadErrorDesc)
          }
        } else if (editUnitId) {
          const authUnitRes = await getAuthorizedUnitForEditAction(editUnitId)
          if (authUnitRes.allowed && authUnitRes.unit) {
            setAuthMode('session')
            hydrateUnit(authUnitRes.unit)
          } else {
            setInitLoadError(loadT.loadErrorDesc)
          }
        }
      }
    } catch {
      if (isEditingExistingUnit) setInitLoadError(loadT.loadErrorDesc)
    } finally {
      setInitialLoading(false)
    }
  }, [locale, loadT.loadErrorDesc])

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

  const update = (key: string, value: string) => {
    clearSingleFieldError(key)
    setForm((curr) => {
      const next = { ...curr, [key]: value }
      if (key === 'rooms' && value) {
        const rNum = parseInt(value, 10)
        const bNum = parseInt(curr.bedrooms || '0', 10)
        if (Number.isFinite(rNum) && Number.isFinite(bNum) && bNum > rNum) {
          next.bedrooms = String(rNum)
        }
      } else if (key === 'bedrooms' && value) {
        const bNum = parseInt(value, 10)
        const rNum = parseInt(curr.rooms || '0', 10)
        if (Number.isFinite(bNum) && (!rNum || bNum > rNum)) {
          next.rooms = String(bNum)
          clearSingleFieldError('rooms')
        }
      }
      return next
    })
    setError('')
    setMissingFields([])
  }

  const toggleSingle = (group: string, value: string) => {
    setSelected((curr) => {
      const currentVal = curr[group]?.[0]
      if (
        currentVal === value &&
        [
          'finishing',
          'buildingSeries',
          'floorType',
          'heatingType',
          'buildingMaterial',
        ].includes(group)
      ) {
        return { ...curr, [group]: [] }
      }
      return { ...curr, [group]: [value] }
    })
  }

  const toggleMulti = (group: string, value: string) => {
    setSelected((curr) => {
      const list = curr[group] || []
      return {
        ...curr,
        [group]: list.includes(value)
          ? list.filter((x) => x !== value)
          : [...list, value],
      }
    })
  }

  const dynamicStatusOptions = useMemo(
    () => getDynamicBuildingStatusOptions(propertyKind),
    [propertyKind]
  )

  const uploadedDocsCount = useMemo(() => {
    return (['contract', 'receipts', 'statement', 'passport'] as const).filter(
      (k) => Boolean(unitDocs[k]?.url)
    ).length
  }, [unitDocs])

  const liveMissingCoreItems = useMemo(
    () =>
      computeMissingCoreItems({
        propertyKind,
        buildingStatus,
        form,
        loggedUser,
        authMode,
        agreedTerms: flags.agreedTerms,
        fT,
        contactStepDict: s.contactStep,
      }),
    [
      propertyKind,
      buildingStatus,
      form,
      loggedUser,
      authMode,
      flags.agreedTerms,
      fT,
      s.contactStep,
    ]
  )

  const hasAllCoreDetails = liveMissingCoreItems.length === 0
  const hasPhotos = images.length > 0
  const hasAllDocs = uploadedDocsCount === 4

  const sectionCompletion = useMemo(() => {
    const s1 = Boolean(
      propertyKind && (propertyKind === 'Land' || buildingStatus)
    )
    const s2 = images.length > 0
    const s3 = Boolean(
      form.location && form.project.trim() && form.exactStreet.trim()
    )
    const s4 = Boolean(
      s1 &&
        Number(form.areaSize) > 0 &&
        (propertyKind === 'Land' ||
          (Number(form.rooms) > 0 && Number(form.bedrooms) > 0))
    )
    const s5 = Boolean(
      Number(form.paidAmount) > 0 && Number(form.contractPrice) > 0
    )
    const s6 = Boolean(
      flags.agreedTerms &&
        (loggedUser?.id || (form.name.trim() && form.phone.trim()))
    )

    let strength = 10
    if (s1) strength += 15
    if (images.length >= 1) strength += 15
    if (uploadedDocsCount === 4) strength += 15
    if (s3) strength += 15
    if (s4) strength += 15
    if (s5) strength += 15

    return {
      1: s1,
      2: s2,
      3: s3,
      4: s4,
      5: s5,
      6: s6,
      hasError1: Boolean(
        fieldErrors.propertyKind || fieldErrors.buildingStatus
      ),
      hasError3: Boolean(
        fieldErrors.location || fieldErrors.project || fieldErrors.exactStreet
      ),
      hasError4: Boolean(
        fieldErrors.areaSize ||
          fieldErrors.rooms ||
          fieldErrors.bedrooms ||
          fieldErrors.floor
      ),
      hasError5: Boolean(fieldErrors.contractPrice || fieldErrors.paidAmount),
      hasError6: Boolean(
        fieldErrors.name ||
          fieldErrors.phone ||
          fieldErrors.email ||
          fieldErrors.password ||
          fieldErrors.agreedTerms
      ),
      completedCount: [s1, s2, s3, s4, s5, s6].filter(Boolean).length,
      strength: Math.min(100, strength),
    }
  }, [
    propertyKind,
    buildingStatus,
    images.length,
    uploadedDocsCount,
    form,
    flags.agreedTerms,
    loggedUser,
    fieldErrors,
  ])

  const livePreviewData = useMemo(() => {
    const pvT = fT.previewSidebar
    const localizedArea =
      form.locationDisplay ||
      (form.location
        ? getLocalizedGeorgiaAreaName(form.location, locale as LocaleCode)
        : '')
    const kindObj =
      PROPERTY_KINDS.find((k) => k.id === propertyKind) || PROPERTY_KINDS[0]
    const kindName = getOptionLabel(kindObj, locale as LocaleCode)
    const title = form.project.trim()
      ? form.project.trim()
      : `${kindName} · ${localizedArea || '—'}`
    const rawPrice = Number(
      toEnglishDigits(form.paidAmount || form.contractPrice || '0')
    )

    return {
      title,
      area: localizedArea || '—',
      priceDisplay:
        rawPrice > 0
          ? `$${rawPrice.toLocaleString('en-US')}${pvT.cashRequiredSuffix}`
          : pvT.priceOnRequest,
    }
  }, [fT.previewSidebar, form, propertyKind, locale])

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const supabase = createClient()
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, 22 - images.length)) {
        const path = `units/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
        const result = await supabase.storage
          .from('unit-images')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (!result.error) {
          uploaded.push(
            supabase.storage.from('unit-images').getPublicUrl(path).data
              .publicUrl
          )
        }
      }
      setImages((prev) => [...prev, ...uploaded])
    } finally {
      setUploading(false)
    }
  }

  const handleUploadUnitDocument = async (
    docKey: SellerDocKey,
    files: FileList | null
  ) => {
    const file = files?.[0]
    if (!file) return
    setUploadingDocKey(docKey)
    try {
      const supabase = createClient()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
      const folderId = unitId || 'draft'
      const path = `documents/${folderId}/${docKey}-${Date.now()}-${cleanName}`
      const { error: uploadErr } = await supabase.storage
        .from('unit-images')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadErr) {
        setError(uploadErr.message)
        return
      }
      const publicUrl = supabase.storage.from('unit-images').getPublicUrl(path)
        .data.publicUrl
      const newEntry: UploadedDocEntry = {
        url: publicUrl,
        name: file.name,
        uploaded_at: new Date().toLocaleDateString('en-GB'),
        status: 'pending_review',
      }
      setUnitDocs((prev) => ({ ...prev, [docKey]: newEntry }))
      if (unitId) {
        await saveUnitDocumentAction({
          unitId,
          docKey,
          fileUrl: publicUrl,
          fileName: file.name,
        })
      }
    } finally {
      setUploadingDocKey(null)
    }
  }

  const handleRemoveUnitDocument = async (docKey: SellerDocKey) => {
    setUploadingDocKey(docKey)
    try {
      setUnitDocs((prev) => {
        const clone = { ...prev }
        delete clone[docKey]
        return clone
      })
      if (unitId) await deleteUnitDocumentAction({ unitId, docKey })
    } finally {
      setUploadingDocKey(null)
    }
  }

  const buildFormData = useCallback(
    (activeUnitId?: string, activeUserId?: string) =>
      createSellerFormData({
        activeUnitId,
        activeUserId,
        unitId,
        loggedUser,
        propertyKind,
        buildingStatus,
        form,
        selected,
        flags,
        unitDocs,
        images,
      }),
    [
      buildingStatus,
      flags,
      form,
      images,
      loggedUser,
      propertyKind,
      selected,
      unitDocs,
      unitId,
    ]
  )

  const highlightMissingCoreFieldsAndScroll = () => {
    const nextFieldErrors: Record<string, string> = {}
    const missingNames: string[] = []
    for (const item of liveMissingCoreItems) {
      missingNames.push(item.label)
      nextFieldErrors[item.key] = item.errMsg || fT.fieldRequiredError
    }
    setFieldErrors(nextFieldErrors)
    setMissingFields(missingNames)

    if (liveMissingCoreItems.length > 0) {
      const firstId = liveMissingCoreItems[0].scrollId
      setTimeout(() => {
        document
          .getElementById(firstId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
    }
  }

  const handleSaveDraftAndGoToAccount = async () => {
    setError('')
    setSavingDraftLoading(true)

    try {
      let resolvedUserId = loggedUser?.id || ''
      let resolvedUnitId = unitId

      const contractPriceNum =
        Number(toEnglishDigits(form.contractPrice || '0').replace(/,/g, '')) ||
        0
      const paidAmountNum =
        Number(toEnglishDigits(form.paidAmount || '0').replace(/,/g, '')) || 0

      if (!loggedUser) {
        const cleanPhone = toEnglishDigits(form.phone || '').trim()
        const fullPhone = cleanPhone
          ? cleanPhone.startsWith('+')
            ? cleanPhone
            : `+${(form.countryCode || DEFAULT_PHONE_CODE).replace('+', '')}${cleanPhone.replace(/^0+/, '')}`
          : ''

        const accountMissing = liveMissingCoreItems.filter((it) =>
          ['name', 'phone', 'email', 'password', 'loginIdentifier'].includes(
            it.key
          )
        )
        if (accountMissing.length > 0) {
          const nextErrs: Record<string, string> = {}
          accountMissing.forEach((it) => {
            nextErrs[it.key] = it.errMsg || fT.fieldRequiredError
          })
          setFieldErrors(nextErrs)
          setError(fT.contactSection.signInToSaveDraftError)
          secContactRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
          return
        }

        const step2Res = await processSellerStep2Action({
          mode: authMode === 'login' ? 'login' : 'register',
          listingCategory: 'exit',
          unitCountry: ACTIVE_PLATFORM_COUNTRY,
          userCountry: form.userCountry || ACTIVE_PLATFORM_COUNTRY,
          developer: form.developer.trim() || '',
          project: form.project.trim() || 'Saved Unit',
          contractPrice: contractPriceNum,
          paidAmount: paidAmountNum,
          marketPrice:
            Number(
              toEnglishDigits(form.marketPrice || '0').replace(/,/g, '')
            ) || contractPriceNum,
          contactMessengers:
            selected.messengers && selected.messengers.length > 0
              ? selected.messengers
              : ['whatsapp'],
          name: form.name,
          phone: fullPhone,
          email: form.email,
          password:
            authMode === 'login'
              ? form.loginPassword || form.password
              : form.password,
          loginIdentifier: form.loginIdentifier,
          existingUnitId: unitId || undefined,
        })

        if (step2Res.status !== 'ok' || !step2Res.userId) {
          setError(step2Res.error || fT.contactSection.signInToSaveDraftError)
          secContactRef.current?.scrollIntoView({ behavior: 'smooth' })
          return
        }

        resolvedUserId = step2Res.userId
        resolvedUnitId = step2Res.unitId || unitId
      }

      const data = buildFormData(resolvedUnitId, resolvedUserId)
      data.set('is_draft_save', '1')
      const res = await saveSellProgress(data)
      if (res.success) {
        if (res.unitId) setUnitId(res.unitId)
        router.push(
          `/account?view=seller&unitId=${res.unitId || resolvedUnitId}`
        )
      } else {
        setError(res.error || s.validation.saveFailed)
      }
    } finally {
      setSavingDraftLoading(false)
    }
  }

  const finalizeUnitPublish = async (
    targetUnitId: string,
    targetUserId: string
  ) => {
    const data = buildFormData(targetUnitId, targetUserId)
    const result = await submitSellRequest(data)
    if (result.success) {
      if (result.unitId) setUnitId(result.unitId)
      if (result.orderRef) setOrderRef(result.orderRef)
      setMissingMediaModalOpen(false)
      setVerifyModalOpen(false)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setError(result.error || s.validation.submitFailed)
    }
  }

  const executeSubmitToAdmin = () => {
    setMissingMediaModalOpen(false)
    setFieldErrors({})
    setError('')
    setMissingFields([])

    const contractPriceNum = Number(
      toEnglishDigits(form.contractPrice || '0').replace(/,/g, '')
    )
    const paidAmountNum = Number(
      toEnglishDigits(form.paidAmount || '0').replace(/,/g, '')
    )

    startTransition(async () => {
      let resolvedUnitId = unitId
      let resolvedUserId = loggedUser?.id || ''
      let resolvedEmail = form.email || loggedUser?.email || ''
      let isCurrentlyVerified = emailVerified

      const effectiveKind = propertyKind || 'Apartment'
      const effectiveArea = form.location || 'Tbilisi - Saburtalo'

      if (!loggedUser) {
        const cleanPhone = toEnglishDigits(form.phone || '').trim()
        const fullPhone = cleanPhone.startsWith('+')
          ? cleanPhone
          : `+${(form.countryCode || DEFAULT_PHONE_CODE).replace('+', '')}${cleanPhone.replace(/^0+/, '')}`

        const step2Res = await processSellerStep2Action({
          mode: authMode === 'login' ? 'login' : 'register',
          listingCategory: 'exit',
          unitCountry: ACTIVE_PLATFORM_COUNTRY,
          userCountry: form.userCountry || ACTIVE_PLATFORM_COUNTRY,
          developer: form.developer.trim() || '',
          project:
            form.project.trim() ||
            `${effectiveKind} — ${getLocalizedGeorgiaAreaName(effectiveArea, 'en')}`,
          contractPrice: contractPriceNum,
          paidAmount: paidAmountNum,
          marketPrice:
            Number(
              toEnglishDigits(
                form.marketPrice || form.contractPrice || '0'
              ).replace(/,/g, '')
            ) || contractPriceNum,
          contactMessengers:
            selected.messengers && selected.messengers.length > 0
              ? selected.messengers
              : ['whatsapp'],
          name: form.name,
          phone: fullPhone,
          email: form.email,
          password:
            authMode === 'login'
              ? form.loginPassword || form.password
              : form.password,
          loginIdentifier: form.loginIdentifier,
          existingUnitId: unitId || undefined,
        })

        if (step2Res.status !== 'ok') {
          setError(step2Res.error || fT.contactSection.authFailedError)
          secContactRef.current?.scrollIntoView({ behavior: 'smooth' })
          return
        }

        if (step2Res.unitId) {
          resolvedUnitId = step2Res.unitId
          setUnitId(step2Res.unitId)
        }
        if (step2Res.orderRef) setOrderRef(step2Res.orderRef)
        if (step2Res.userId) {
          resolvedUserId = step2Res.userId
          resolvedEmail = step2Res.userEmail || form.email
          isCurrentlyVerified = Boolean(step2Res.emailVerified)
          setEmailVerified(isCurrentlyVerified)
          setLoggedUser({
            id: step2Res.userId,
            name: step2Res.userName || form.name,
            email: resolvedEmail,
            phone: step2Res.userPhone || fullPhone,
          })
          setAuthMode('session')
        }
      }

      const freshVerStatus = await getUserVerificationStatusAction()
      if (freshVerStatus.isLoggedIn && freshVerStatus.emailVerified) {
        isCurrentlyVerified = true
        setEmailVerified(true)
      }

      if (!isCurrentlyVerified) {
        const draftData = buildFormData(resolvedUnitId, resolvedUserId)
        const savedDraft = await saveSellProgress(draftData)
        if (savedDraft.unitId) {
          resolvedUnitId = savedDraft.unitId
          setUnitId(savedDraft.unitId)
        }

        setPendingPublishIds({
          unitId: resolvedUnitId,
          userId: resolvedUserId,
          email: resolvedEmail,
        })
        setOtpSent(false)
        setOtpCode('')
        setOtpError('')
        setVerifyModalOpen(true)
        return
      }

      await finalizeUnitPublish(resolvedUnitId, resolvedUserId)
    })
  }

  const handlePublishListing = () => {
    if (!hasAllCoreDetails) {
      highlightMissingCoreFieldsAndScroll()
      return
    }

    if (!hasPhotos || !hasAllDocs) {
      setMissingMediaModalOpen(true)
      return
    }

    executeSubmitToAdmin()
  }

  const handleSendOtpInModal = async () => {
    const targetEmail =
      pendingPublishIds?.email || form.email || loggedUser?.email || ''
    const targetUnit = pendingPublishIds?.unitId || unitId
    const targetUser = pendingPublishIds?.userId || loggedUser?.id || ''

    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await sendSellerReviewOtpAction({
        email: targetEmail,
        unitId: targetUnit,
        userId: targetUser,
      })
      if (res.success) setOtpSent(true)
      else setOtpError(res.error || s.validation.submitFailed)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtpAndPublish = async () => {
    const targetEmail =
      pendingPublishIds?.email || form.email || loggedUser?.email || ''
    const targetUnit = pendingPublishIds?.unitId || unitId
    const targetUser = pendingPublishIds?.userId || loggedUser?.id || ''

    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await verifySellerReviewOtpAction({
        email: targetEmail,
        otp: otpCode,
        unitId: targetUnit,
        userId: targetUser,
      })
      if (!res.success) {
        setOtpError(res.error || '')
        return
      }
      setEmailVerified(true)
      await finalizeUnitPublish(targetUnit, targetUser)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSaveAndContinueLater = async () => {
    const targetUnit = pendingPublishIds?.unitId || unitId
    const targetUser = pendingPublishIds?.userId || loggedUser?.id || ''

    setOtpLoading(true)
    try {
      const draftData = buildFormData(targetUnit, targetUser)
      await saveSellProgress(draftData)
      setVerifyModalOpen(false)
      router.push(`/account?view=seller&unitId=${targetUnit}`)
    } finally {
      setOtpLoading(false)
    }
  }

  const scrollToSection = (
    idx: number,
    ref: React.RefObject<HTMLElement | null>
  ) => {
    isManualScrollingRef.current = true
    setActiveTab(idx)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      isManualScrollingRef.current = false
    }, 850)
  }

  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )

  if (initialLoading) {
    return (
      <main
        dir={dir}
        className="flex min-h-[75vh] items-center justify-center bg-[#f4f6f9] px-4 py-12 text-[#0a1122]"
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#007a5a]">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
            {loadT.loadingUnitTitle}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {loadT.loadingUnitSub}
          </p>
        </div>
      </main>
    )
  }

  if (initLoadError) {
    return (
      <main
        dir={dir}
        className="flex min-h-[75vh] items-center justify-center bg-[#f4f6f9] px-4 py-12 text-[#0a1122]"
      >
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="size-7" />
          </div>
          <h2 className="text-base font-extrabold text-[#0a1122] sm:text-lg">
            {loadT.loadErrorTitle}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {initLoadError}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={loadInitialData}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#006248]"
            >
              <RefreshCw className="size-3.5" />
              <span>{loadT.retryBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/account?view=seller')}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              {loadT.backToAccountBtn}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <ReviewStep
        form={form}
        orderRef={orderRef}
        unitId={unitId}
        userId={loggedUser?.id || ''}
        userEmail={form.email || loggedUser?.email || ''}
        emailVerified={true}
        setEmailVerified={setEmailVerified}
        supportWhatsApp={supportWhatsApp}
        extraT={extraT}
      />
    )
  }

  const navTabs = [
    {
      id: 1,
      label: fT.tabs.type,
      ref: secTypeRef,
      hasError: sectionCompletion.hasError1,
    },
    { id: 2, label: fT.tabs.photos, ref: secPhotosRef, hasError: false },
    {
      id: 3,
      label: fT.tabs.location,
      ref: secLocationRef,
      hasError: sectionCompletion.hasError3,
    },
    {
      id: 4,
      label: fT.tabs.details,
      ref: secDetailsRef,
      hasError: sectionCompletion.hasError4,
    },
    {
      id: 5,
      label: fT.tabs.price,
      ref: secPriceRef,
      hasError: sectionCompletion.hasError5,
    },
    {
      id: 6,
      label: fT.tabs.contact,
      ref: secContactRef,
      hasError: sectionCompletion.hasError6,
    },
  ]

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f4f6f9] pb-16 pt-6 text-[#0a1122] sm:pt-8"
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <header className="mb-4 text-start">
          <h1 className="text-2xl font-bold tracking-tight text-[#0a1122] sm:text-3xl">
            {fT.pageTitle}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {fT.pageSubtitle}
          </p>
        </header>

        <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-slate-200/70 bg-[#f4f6f9]/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar">
            {navTabs.map((tab) => {
              const isDone =
                sectionCompletion[tab.id as 1 | 2 | 3 | 4 | 5 | 6]
              const isCurrent = activeTab === tab.id
              const cleanName = tab.label.replace(/^[0-9]+\s*/, '')

              return (
                <button
                  key={tab.id}
                  id={`seller-step-tab-${tab.id}`}
                  type="button"
                  onClick={() => scrollToSection(tab.id, tab.ref)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    tab.hasError
                      ? 'border-2 border-red-500 bg-red-50 text-red-700 shadow-xs'
                      : isCurrent
                        ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-md shadow-orange-500/25'
                        : isDone
                          ? 'border border-emerald-200/90 bg-[#eaf8f2] text-[#007a5a]'
                          : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.hasError ? (
                    <>
                      <AlertCircle className="size-3.5 text-red-600" />
                      <span>{cleanName}</span>
                    </>
                  ) : isDone ? (
                    <>
                      <Check
                        className={`size-3.5 stroke-[3] ${
                          isCurrent ? 'text-white' : 'text-[#007a5a]'
                        }`}
                      />
                      <span>{cleanName}</span>
                    </>
                  ) : (
                    <span>{tab.label}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <TypeSection
              sectionRef={secTypeRef}
              onHover={() => setActiveTab(1)}
              dealCategory={dealCategory}
              setDealCategory={() => setDealCategory('exit')}
              propertyKind={propertyKind}
              setPropertyKind={handleTogglePropertyKind}
              buildingStatus={buildingStatus}
              setBuildingStatus={handleToggleBuildingStatus}
              dynamicStatusOptions={dynamicStatusOptions}
              fieldErrors={fieldErrors}
            />

            <PhotosSection
              sectionRef={secPhotosRef}
              onHover={() => setActiveTab(2)}
              images={images}
              setImages={setImages}
              uploading={uploading}
              onUploadPhotos={handleUploadPhotos}
              onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
              form={form}
              update={update}
            />

            <LocationSection
              sectionRef={secLocationRef}
              onHover={() => setActiveTab(3)}
              form={form}
              update={update}
              isExitDeal={true}
              isDirectSale={false}
              isRentDeal={false}
              fieldErrors={fieldErrors}
            />

            <DetailsSection
              sectionRef={secDetailsRef}
              onHover={() => setActiveTab(4)}
              propertyKind={propertyKind}
              buildingStatus={buildingStatus}
              dealCategory={dealCategory}
              form={form}
              update={update}
              selected={selected}
              toggleSingle={toggleSingle}
              toggleMulti={toggleMulti}
              flags={flags}
              setFlags={setFlags}
              extraT={extraT}
              fieldErrors={fieldErrors}
            />

            <PricingSection
              sectionRef={secPriceRef}
              onHover={() => setActiveTab(5)}
              dealCategory={dealCategory}
              buildingStatus={buildingStatus}
              isExitDeal={true}
              isDirectSale={false}
              isRentDeal={false}
              currencyChoice={currencyChoice}
              setCurrencyChoice={setCurrencyChoice}
              priceInputMode={priceInputMode}
              setPriceInputMode={setPriceInputMode}
              form={form}
              update={update}
              selected={selected}
              toggleSingle={toggleSingle}
              flags={flags}
              setFlags={setFlags}
              unitDocs={unitDocs}
              uploadingDocKey={uploadingDocKey}
              onUploadDoc={handleUploadUnitDocument}
              onRemoveDoc={handleRemoveUnitDocument}
              onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
              fieldErrors={fieldErrors}
            />

            <ContactSection
              sectionRef={secContactRef}
              onHover={() => setActiveTab(6)}
              isRentDeal={false}
              loggedUser={loggedUser}
              onUserAuthenticated={(u, createdUnitId) => {
                setLoggedUser(u)
                setAuthMode('session')
                void (async () => {
                  const verCheck = await getUserVerificationStatusAction()
                  if (verCheck.isLoggedIn) {
                    setEmailVerified(verCheck.emailVerified)
                  }
                  const targetUnit = createdUnitId || unitId
                  if (targetUnit) {
                    const fullData = buildFormData(targetUnit, u.id)
                    await saveSellProgress(fullData)
                  }
                })()
              }}
              authMode={authMode}
              setAuthMode={setAuthMode}
              form={form}
              update={update}
              selected={selected}
              toggleMulti={toggleMulti}
              agreedTerms={flags.agreedTerms}
              setAgreedTerms={(val) => {
                clearSingleFieldError('agreedTerms')
                setFlags((p) => ({ ...p, agreedTerms: val }))
              }}
              error={error}
              missingFields={missingFields}
              unitId={unitId}
              setUnitId={setUnitId}
              setOrderRef={setOrderRef}
              fieldErrors={fieldErrors}
              buildFullFormData={buildFormData}
            />

            <SellerFinalReadinessCard
              loadT={loadT}
              fT={fT}
              liveMissingCoreItems={liveMissingCoreItems}
              fieldErrors={fieldErrors}
              pending={pending}
              savingDraftLoading={savingDraftLoading}
              onPublishListing={handlePublishListing}
              onSaveDraft={handleSaveDraftAndGoToAccount}
            />
          </div>

          <LivePreviewSidebar
            images={images}
            livePreviewData={livePreviewData}
            form={form}
            propertyKind={propertyKind}
            strength={sectionCompletion.strength}
          />
        </div>
      </div>

      {/* الديالوج الذكي عند الإرسال بدون صور أو مستندات */}
      <SellerMissingMediaConfirmModal
        open={missingMediaModalOpen}
        dir={dir}
        loadT={loadT}
        hasPhotos={hasPhotos}
        hasAllDocs={hasAllDocs}
        uploadedDocsCount={uploadedDocsCount}
        pending={pending}
        onClose={() => setMissingMediaModalOpen(false)}
        onConfirmSubmitAnyway={executeSubmitToAdmin}
        onGoToUploadNow={() => {
          setMissingMediaModalOpen(false)
          if (!hasPhotos) {
            secPhotosRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
          } else {
            secPriceRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
            })
          }
        }}
      />

      <SellerVerifyEmailModal
        open={verifyModalOpen}
        dir={dir}
        activeModalEmail={
          pendingPublishIds?.email || form.email || loggedUser?.email || ''
        }
        loadT={loadT}
        extraT={extraT}
        saveLaterLabel={loadT.saveLaterBtnText}
        otpSent={otpSent}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpLoading={otpLoading}
        otpError={otpError}
        onClose={() => setVerifyModalOpen(false)}
        onSendOtp={handleSendOtpInModal}
        onVerifyOtp={handleVerifyOtpAndPublish}
        onSaveAndContinueLater={handleSaveAndContinueLater}
      />

      <SellerDocPreviewModal
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </main>
  )
}