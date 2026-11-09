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
  BookmarkCheck,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldAlert,
  X,
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
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation, type LocaleCode } from '@/lib/i18n'
import {
  ACTIVE_PLATFORM_COUNTRY,
  DEFAULT_PHONE_CODE,
  getSellerExtraLabels,
  getSellerFormTranslations,
  maskEmailDisplay,
  type SellerDocKey,
  type UploadedDocEntry,
} from './seller-i18n'
import {
  getOptionLabel,
  PROPERTY_KINDS,
  toEnglishDigits,
  type DealCategory,
  type LocalizedOptionItem,
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

export type { SellerDocKey, UploadedDocEntry }

const FLOW_LOADING_LABELS: Record<
  LocaleCode,
  {
    loadingUnitTitle: string
    loadingUnitSub: string
    loadErrorTitle: string
    loadErrorDesc: string
    retryBtn: string
    backToAccountBtn: string
    oneTimeVerifyBadge: string
    oneTimeVerifyNote: string
  }
> = {
  ar: {
    loadingUnitTitle: 'جاري استرجاع بيانات وحدتك المحفوظة...',
    loadingUnitSub: 'يرجى الانتظار لحظات حتى نجهز كافة الحقول للتعديل',
    loadErrorTitle: 'تعذر تحميل بيانات الوحدة',
    loadErrorDesc:
      'يبدو أن هناك ضعفاً في الاتصال بالإنترنت أو أن الجلسة انتهت. يرجى إعادة المحاولة.',
    retryBtn: 'إعادة المحاولة',
    backToAccountBtn: 'العودة لحسابي',
    oneTimeVerifyBadge: 'تأكيد لمرة واحدة فقط لتفعيل حسابك',
    oneTimeVerifyNote:
      'تأكيد البريد الإلكتروني شرط أساسي في أول مرة فقط لإرسال وحدتك إلى الإدارة ومراجعتها. في المرات القادمة ستُرسل وحداتك مباشرة.',
  },
  en: {
    loadingUnitTitle: 'Restoring your saved unit details...',
    loadingUnitSub: 'Please wait a moment while we prepare all fields',
    loadErrorTitle: 'Could not load unit details',
    loadErrorDesc: 'Please check your internet connection and try again.',
    retryBtn: 'Retry Loading',
    backToAccountBtn: 'Back to My Account',
    oneTimeVerifyBadge: 'One-time account verification',
    oneTimeVerifyNote:
      'Email verification is required only once on your first listing before sending your unit to Admin for review.',
  },
  ru: {
    loadingUnitTitle: 'Восстановление сохраненных данных объекта...',
    loadingUnitSub: 'Пожалуйста, подождите пару секунд',
    loadErrorTitle: 'Не удалось загрузить данные объекта',
    loadErrorDesc: 'Проверьте подключение к интернету и попробуйте снова.',
    retryBtn: 'Повторить попытку',
    backToAccountBtn: 'Вернуться в кабинет',
    oneTimeVerifyBadge: 'Единоразовое подтверждение аккаунта',
    oneTimeVerifyNote:
      'Подтверждение Email требуется только один раз при первом размещении для отправки объекта на проверку администрации.',
  },
  ka: {
    loadingUnitTitle: 'თქვენი ობიექტის მონაცემები იტვირთება...',
    loadingUnitSub: 'გთხოვთ დაელოდოთ რამდენიმე წამს',
    loadErrorTitle: 'მონაცემების ჩატვირთვა ვერ მოხერხდა',
    loadErrorDesc: 'შეამოწმეთ ინტერნეტ კავშირი და სცადეთ თავიდან.',
    retryBtn: 'თავიდან ცდა',
    backToAccountBtn: 'ანგარიშზე დაბრუნება',
    oneTimeVerifyBadge: 'ანგარიშის ერთჯერადი დადასტურება',
    oneTimeVerifyNote:
      'ელ-ფოსტის დადასტურება საჭიროა მხოლოდ ერთხელ პირველი განცხადებისას, რათა ობიექტი გადაეგზავნოს ადმინისტრაციას.',
  },
}

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

  // لا نظهر شاشة التحميل أبداً عند إضافة وحدة جديدة! تظهر فقط عند تعديل وحدة موجودة فعلياً
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

  // حالة الـ Validation البصري (البرواز الأحمر + نافذة التنبيه المنبثقة مثل evisa.gov.ge)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [validationPopupOpen, setValidationPopupOpen] = useState(false)
  const [firstMissingScrollId, setFirstMissingScrollId] = useState<string>('')

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
  const [autoSaveTime, setAutoSaveTime] = useState<string>('')
  const [savingDraftLoading, setSavingDraftLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  const isExitDeal = true
  const isRentDeal = false
  const isDirectSale = false

  const clearSingleFieldError = (fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev
      const next = { ...prev }
      delete next[fieldKey]
      return next
    })
  }

  const handleToggleDealCategory = (_cat: DealCategory | '') => {
    setDealCategory('exit')
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
      if (kindId === 'Land') {
        setActiveTab(2)
      }
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
        const rect = sec.el.getBoundingClientRect()
        if (rect.top <= viewportLine) {
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

  const loadInitialData = useCallback(async () => {
    const params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams()
    const magicToken = params.get('magic')
    const editUnitId = params.get('editUnitId') || params.get('resume')
    const shouldOpenVerifyModal = params.get('verifyEmail') === '1'
    const isEditingExistingUnit = Boolean(magicToken || editUnitId)

    if (isEditingExistingUnit) {
      setInitialLoading(true)
    }
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

        const rawUserPhone = profileRes.user.phone || ''
        const digitsOnly = toEnglishDigits(rawUserPhone).replace(/[^0-9]/g, '')
        let detectedCode = DEFAULT_PHONE_CODE
        let localPart = digitsOnly

        for (const c of [
          '995',
          '966',
          '971',
          '965',
          '974',
          '973',
          '968',
          '962',
          '20',
          '90',
          '44',
          '7',
          '1',
        ]) {
          if (digitsOnly.startsWith(c) && digitsOnly.length > c.length + 6) {
            detectedCode = c
            localPart = digitsOnly.slice(c.length).replace(/^0+/, '')
            break
          }
        }

        setForm((prev) => ({
          ...prev,
          countryCode: prev.phone ? prev.countryCode : detectedCode,
          name: prev.name || profileRes.user?.name || '',
          phone: prev.phone || localPart || '',
          email: prev.email || profileRes.user?.email || '',
        }))

        const savedUserMessengers = (profileRes.user as any)?.contactMessengers
        if (
          Array.isArray(savedUserMessengers) &&
          savedUserMessengers.length > 0
        ) {
          setSelected((prev) => ({
            ...prev,
            messengers: savedUserMessengers,
          }))
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
          const rawUnitPhone = u.phone || profileRes.user?.phone || ''
          const digitsOnly = toEnglishDigits(rawUnitPhone).replace(
            /[^0-9]/g,
            ''
          )
          let detectedCode = DEFAULT_PHONE_CODE
          let localPart = digitsOnly

          for (const c of [
            '995',
            '966',
            '971',
            '965',
            '974',
            '973',
            '968',
            '962',
            '20',
            '90',
            '44',
            '7',
            '1',
          ]) {
            if (digitsOnly.startsWith(c) && digitsOnly.length > c.length + 6) {
              detectedCode = c
              localPart = digitsOnly.slice(c.length).replace(/^0+/, '')
              break
            }
          }

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
            countryCode: detectedCode,
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
            kitchenArea:
              u.kitchen_area || meta.kitchen_area
                ? String(u.kitchen_area || meta.kitchen_area)
                : '',
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
            phone: localPart || '',
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

          // إذا كان قادماً من صفحة حسابي لاستكمال الصور، نمرره تلقائياً لقسم الصور
          const focusTarget = params.get('focus')
          if (focusTarget === 'photos') {
            setTimeout(() => {
              secPhotosRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }, 350)
          }
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
      if (isEditingExistingUnit) {
        setInitLoadError(loadT.loadErrorDesc)
      }
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

  const dynamicStatusOptions = useMemo<
    Array<LocalizedOptionItem<string>>
  >(() => {
    if (propertyKind === 'Hotel' || propertyKind === 'Commercial') {
      return [
        {
          id: 'Under construction',
          ar: 'تحت الإنشاء',
          en: 'Under construction',
          ru: 'Строится',
          ka: 'მშენებარე',
          labelAr: 'تحت الإنشاء',
          labelEn: 'Under construction',
        },
        {
          id: 'Completed',
          ar: 'مكتمل وجاهز للاستلام',
          en: 'Completed & Ready',
          ru: 'Завершен и готов',
          ka: 'დასრულებული',
          labelAr: 'مكتمل وجاهز للاستلام',
          labelEn: 'Completed & Ready',
        },
      ]
    }
    return [
      {
        id: 'Newly built',
        ar: 'مبنى حديث (جاهز للاستلام)',
        en: 'Newly built (Ready)',
        ru: 'Новостройка (Готово)',
        ka: 'ახალი აშენებული (მზადაა)',
        labelAr: 'مبنى حديث (جاهز للاستلام)',
        labelEn: 'Newly built (Ready)',
      },
      {
        id: 'Under construction',
        ar: 'قيد الإنشاء (تحت الإنشاء)',
        en: 'Under construction',
        ru: 'Строится',
        ka: 'მშენებარე',
        labelAr: 'قيد الإنشاء (تحت الإنشاء)',
        labelEn: 'Under construction',
      },
      {
        id: 'Old built',
        ar: 'مبنى قائم (جاهز للاستلام)',
        en: 'Existing building (Ready)',
        ru: 'Вторичное жилье (Готово)',
        ka: 'ძველი აშენებული',
        labelAr: 'مبنى قائم (جاهز للاستلام)',
        labelEn: 'Existing building (Ready)',
      },
    ]
  }, [propertyKind])

  const uploadedDocsCount = useMemo(() => {
    return (['contract', 'receipts', 'statement', 'passport'] as const).filter(
      (k) => Boolean(unitDocs[k]?.url)
    ).length
  }, [unitDocs])

  const hasAllPhotosAndDocs = images.length > 0 && uploadedDocsCount === 4

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
    const activePrice = Number(form.paidAmount)
    const contractPrice = Number(form.contractPrice)
    const s5 = Boolean(activePrice > 0 && contractPrice > 0)
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
    form.location,
    form.project,
    form.exactStreet,
    form.areaSize,
    form.rooms,
    form.bedrooms,
    form.contractPrice,
    form.paidAmount,
    form.name,
    form.phone,
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
  }, [
    fT.previewSidebar,
    form.project,
    form.location,
    form.locationDisplay,
    form.paidAmount,
    form.contractPrice,
    propertyKind,
    locale,
  ])

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const supabase = createClient()
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, 22 - images.length)) {
        const path = `units/${crypto.randomUUID()}-${file.name.replace(
          /[^a-zA-Z0-9.-]/g,
          '-'
        )}`
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
    (activeUnitId?: string, activeUserId?: string) => {
      const data = new FormData()
      const put = (k: string, v?: string | number | boolean) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          data.set(k, String(v).trim())
        }
      }

      const targetId = activeUnitId || unitId
      if (targetId) put('unit_id', targetId)

      const targetUser = activeUserId || loggedUser?.id
      if (targetUser) put('user_id', targetUser)

      const effectiveKind = propertyKind || 'Apartment'
      const effectiveArea = form.location || 'Tbilisi - Saburtalo'
      const effectiveStatus = buildingStatus || 'Newly built'
      const isUnderConstruction = effectiveStatus === 'Under construction'

      put('country', ACTIVE_PLATFORM_COUNTRY)
      put('currency_code', 'USD')
      put('listing_category', 'exit')
      put('unit_type', effectiveKind)
      put('building_status', effectiveStatus)

      const cleanDev = form.developer.trim()
      const fallbackProjectTitle =
        form.project.trim() ||
        (cleanDev
          ? `${cleanDev} Residence`
          : `${effectiveKind} — ${getLocalizedGeorgiaAreaName(effectiveArea, 'en')}`)

      if (cleanDev) {
        put('developer_name', cleanDev)
      }
      put('project_name', fallbackProjectTitle)
      put('area', effectiveArea)
      put('exact_street', form.exactStreet)
      put('house_number', form.houseNumber)
      put('cadastral_code', form.cadastralCode)
      if (form.lat) put('lat', form.lat)
      if (form.lng) put('lng', form.lng)

      if (!isUnderConstruction && form.yearBuilt) {
        put('year_built', form.yearBuilt)
      }
      put('size', form.areaSize)
      put('kitchen_area', form.kitchenArea)
      put('balcony_area', form.balconyArea)
      put('loggia_area', form.loggiaArea)
      put('terrace_area', form.terraceArea)
      put('garden_size', form.garden)

      const roomsNum = parseInt(form.rooms || '2', 10) || 2
      const bedsNum = Math.min(
        roomsNum,
        parseInt(form.bedrooms || '1', 10) || 1
      )

      put('rooms', roomsNum)
      put('bedrooms', bedsNum)
      put('bathrooms', form.bathrooms || '1')
      put('floor_number', form.floor)
      put('total_floors', form.totalFloors)

      put('finishing', selected.finishing?.[0] || 'Newly renovated')
      put('building_series', selected.buildingSeries?.[0])
      put('floor_type', selected.floorType?.[0])
      put('heating_type', selected.heatingType?.[0])
      put('building_material', selected.buildingMaterial?.[0])

      const resolvedDelivYear = isUnderConstruction
        ? Number(form.deliveryYear) || 2026
        : Number(form.yearBuilt) || new Date().getFullYear()

      const delStatus = isUnderConstruction
        ? `Under Construction (${resolvedDelivYear})`
        : `Ready to Move (${resolvedDelivYear})`

      put('delivery_status', delStatus)
      put(
        'delivery_month',
        isUnderConstruction ? form.deliveryRemainingMonths || '12' : '0'
      )
      put('delivery_year', resolvedDelivYear)

      selected.features?.forEach((f) => data.append('feature', f))
      selected.messengers?.forEach((m) => data.append('contact_messenger', m))

      put('video_url', form.videoUrl)
      put('tour_3d_url', form.tour3dUrl)
      if (flags.allowOnlineViewing) data.set('allow_online_viewing', 'on')

      put('contract_price', form.contractPrice || form.paidAmount)
      put('paid_amount', form.paidAmount || form.contractPrice)
      put(
        'market_price',
        form.marketPrice || form.contractPrice || form.paidAmount
      )
      put('installment_amount', form.installment || '0')
      put('installment_frequency', selected.frequency?.[0] || 'شهري')
      put('contract_month', form.contractMonth)
      put('contract_year', form.contractYear)
      put('years_left', form.remainingMonths || '0')

      if (selected.annualInstallment?.[0] === 'yes') {
        data.set('has_annual_installment', 'on')
      }
      put('annual_installment_amount', form.annualInstallmentAmount)

      if (selected.overdueInstallments?.[0] === 'yes') {
        data.set('has_overdue_installments', 'on')
      }
      put('overdue_installments', form.overdueCount)
      put('overdue_total_amount', form.overdueTotal)

      if (selected.discountOffer?.[0] === 'yes') {
        data.set('willing_to_discount', 'on')
      }
      put('discount_amount', form.discountAmount)
      put('description', form.description)

      if (Object.keys(unitDocs).length > 0) {
        put('documents_json', JSON.stringify(unitDocs))
      }
      images.forEach((img) => data.append('image', img))

      put('name', form.name || loggedUser?.name || '')
      const cleanPhone = toEnglishDigits(form.phone || '').trim()
      put(
        'phone',
        cleanPhone
          ? cleanPhone.startsWith('+')
            ? cleanPhone
            : `+${(form.countryCode ?? DEFAULT_PHONE_CODE).replace('+', '')}${cleanPhone.replace(/^0+/, '')}`
          : loggedUser?.phone || ''
      )
      put('email', form.email || loggedUser?.email || '')
      data.set('is_original_owner', 'on')
      data.set('is_confirmed', 'on')

      return data
    },
    [
      buildingStatus,
      flags.allowOnlineViewing,
      form,
      images,
      loggedUser,
      propertyKind,
      selected,
      unitDocs,
      unitId,
    ]
  )

  // حفظ كمسودة والانتقال لصفحة حسابي لاستكمالها لاحقاً (بدون اشتراط الصور والمستندات)
  const handleSaveDraftAndGoToAccount = async () => {
    setError('')
    setSavingDraftLoading(true)

    try {
      let resolvedUserId = loggedUser?.id || ''
      let resolvedUnitId = unitId

      if (!loggedUser) {
        const cleanPhone = toEnglishDigits(form.phone || '').trim()
        const fullPhone = cleanPhone
          ? cleanPhone.startsWith('+')
            ? cleanPhone
            : `+${(form.countryCode || DEFAULT_PHONE_CODE).replace('+', '')}${cleanPhone.replace(/^0+/, '')}`
          : ''

        if (
          authMode === 'register' &&
          (!form.name.trim() ||
            !cleanPhone ||
            !form.email.trim() ||
            form.password.length < 8)
        ) {
          setError(fT.contactSection.signInToSaveDraftError)
          secContactRef.current?.scrollIntoView({ behavior: 'smooth' })
          return
        }

        const step2Res = await processSellerStep2Action({
          mode: authMode === 'login' ? 'login' : 'register',
          listingCategory: 'exit',
          unitCountry: ACTIVE_PLATFORM_COUNTRY,
          userCountry: form.userCountry || ACTIVE_PLATFORM_COUNTRY,
          developer: form.developer.trim() || '',
          project: form.project.trim() || 'Draft Unit',
          contractPrice:
            Number(toEnglishDigits(form.contractPrice || '0')) || 0,
          paidAmount: Number(toEnglishDigits(form.paidAmount || '0')) || 0,
          marketPrice: Number(toEnglishDigits(form.marketPrice || '0')) || 0,
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
        setAutoSaveTime(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        )
        router.push(`/account?view=seller&unitId=${res.unitId || resolvedUnitId}`)
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
      setVerifyModalOpen(false)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setError(result.error || s.validation.submitFailed)
    }
  }

  // فحص كافة الحقول الإجبارية وتلوين الناقص بالأحمر وإظهار نافذة التنبيه مثل evisa.gov.ge
 const handlePublishListing = () => {
    const missing: string[] = []
    const nextFieldErrors: Record<string, string> = {}
    let firstScrollTarget = ''

    const markMissing = (
      fieldKey: string,
      labelName: string,
      scrollId: string,
      customErrMsg?: string
    ) => {
      missing.push(labelName)
      nextFieldErrors[fieldKey] = customErrMsg || fT.fieldRequiredError
      if (!firstScrollTarget) {
        firstScrollTarget = scrollId
      }
    }

    const valT = fT.contactSection.validation

    // 1. فحص قسم نوع العقار وحالة البناء
    if (!propertyKind) {
      markMissing(
        'propertyKind',
        fT.typeSection.whatKindLabel.replace(' *', ''),
        'field-wrap-propertyKind'
      )
    } else if (propertyKind !== 'Land' && !buildingStatus) {
      markMissing(
        'buildingStatus',
        fT.typeSection.statusLabel.replace(' *', ''),
        'field-wrap-buildingStatus'
      )
    }

    // 2. فحص قسم الموقع والمشروع والشارع
    if (!form.location) {
      markMissing(
        'location',
        fT.locationSection.cityDistrictLabel.replace(' *', ''),
        'field-wrap-location'
      )
    }
    if (!form.project.trim()) {
      markMissing(
        'project',
        fT.locationSection.projectLabel.replace(' *', ''),
        'field-wrap-project'
      )
    }
    if (!form.exactStreet.trim()) {
      markMissing(
        'exactStreet',
        fT.locationSection.streetLabel.replace(' *', ''),
        'field-wrap-exactStreet'
      )
    }

    // 3. فحص قسم المواصفات (المساحة والغرف والطوابق)
    if (!form.areaSize || Number(toEnglishDigits(form.areaSize)) <= 0) {
      markMissing(
        'areaSize',
        fT.detailsSection.areaLabel.replace(' *', ''),
        'field-wrap-areaSize'
      )
    }

    if (propertyKind !== 'Land') {
      const rNum = parseInt(form.rooms || '0', 10)
      const bNum = parseInt(form.bedrooms || '0', 10)
      if (!rNum || rNum <= 0) {
        markMissing(
          'rooms',
          fT.detailsSection.roomsLabel.replace(' *', ''),
          'field-wrap-rooms'
        )
      }
      if (!bNum || bNum <= 0) {
        markMissing(
          'bedrooms',
          fT.detailsSection.bedroomsLabel.replace(' *', ''),
          'field-wrap-bedrooms'
        )
      } else if (rNum > 0 && bNum > rNum) {
        markMissing(
          'bedrooms',
          fT.detailsSection.bedroomsLabel.replace(' *', ''),
          'field-wrap-bedrooms',
          valT.bedroomsExceedRooms
        )
      }

      const flNum = parseInt(form.floor || '', 10)
      const totFlNum = parseInt(form.totalFloors || '', 10)
      if (
        Number.isFinite(flNum) &&
        Number.isFinite(totFlNum) &&
        totFlNum > 0 &&
        flNum > totFlNum
      ) {
        markMissing(
          'floor',
          fT.detailsSection.floorLabel,
          'field-wrap-floor',
          valT.floorExceedsTotalFloors
        )
      }
    }

    // 4. فحص قسم السعر والأقساط
    const contractPriceNum = Number(
      toEnglishDigits(form.contractPrice || '0').replace(/,/g, '')
    )
    const paidAmountNum = Number(
      toEnglishDigits(form.paidAmount || '0').replace(/,/g, '')
    )

    if (!contractPriceNum || contractPriceNum <= 0) {
      markMissing(
        'contractPrice',
        fT.pricingSection.contractPriceLabel.replace(' *', ''),
        'field-wrap-contractPrice'
      )
    }
    if (!paidAmountNum || paidAmountNum <= 0) {
      markMissing(
        'paidAmount',
        fT.pricingSection.paidAmountLabel.replace(' *', ''),
        'field-wrap-paidAmount'
      )
    } else if (contractPriceNum > 0 && paidAmountNum > contractPriceNum) {
      markMissing(
        'paidAmount',
        fT.pricingSection.paidAmountLabel.replace(' *', ''),
        'field-wrap-paidAmount',
        valT.paidExceedsContract
      )
    }

    // 5. فحص قسم بيانات المالك والحساب
    if (!loggedUser) {
      if (authMode === 'register') {
        if (!form.name.trim()) {
          markMissing(
            'name',
            s.contactStep.nameLabel.replace(' *', ''),
            'field-wrap-name'
          )
        }
        if (!form.phone.trim()) {
          markMissing(
            'phone',
            s.contactStep.phoneLabel.replace(' *', ''),
            'field-wrap-phone'
          )
        }
        if (!form.email.trim()) {
          markMissing(
            'email',
            s.contactStep.emailLabel.replace(' *', ''),
            'field-wrap-email'
          )
        }
        if (!form.password || form.password.length < 8) {
          markMissing(
            'password',
            s.contactStep.passwordLabel,
            'field-wrap-password'
          )
        }
      } else if (authMode === 'login') {
        if (
          !form.loginIdentifier.trim() ||
          (!form.password && !form.loginPassword)
        ) {
          markMissing(
            'loginIdentifier',
            s.contactStep.loginIdLabel.replace(' *', ''),
            'field-wrap-loginIdentifier'
          )
        }
      }
    } else {
      if (!form.name.trim()) {
        markMissing(
          'name',
          s.contactStep.nameLabel.replace(' *', ''),
          'field-wrap-name'
        )
      }
      if (!form.phone.trim()) {
        markMissing(
          'phone',
          s.contactStep.phoneLabel.replace(' *', ''),
          'field-wrap-phone'
        )
      }
    }

    if (!flags.agreedTerms) {
      markMissing(
        'agreedTerms',
        s.contactStep.ownerDeclaration,
        'field-wrap-agreedTerms'
      )
    }

    // عند وجود حقول إجبارية ناقصة: نلوّنها بالأحمر، ونظهر شريط الأزرار التفاعلي، وننتقل لأول حقل ناقص بنعومة
    if (missing.length > 0) {
      setFieldErrors(nextFieldErrors)
      setMissingFields(missing)
      setError(s.validation.missingBannerPrefix)
      setFirstMissingScrollId(firstScrollTarget)
      setValidationPopupOpen(false)

      if (firstScrollTarget) {
        setTimeout(() => {
          document.getElementById(firstScrollTarget)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }, 100)
      }
      return
    }

    setFieldErrors({})
    setError('')
    setMissingFields([])

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

      // فحص لحظي من السيرفر للتأكد من حالة توثيق البريد الإلكتروني
      const freshVerStatus = await getUserVerificationStatusAction()
      if (freshVerStatus.isLoggedIn && freshVerStatus.emailVerified) {
        isCurrentlyVerified = true
        setEmailVerified(true)
      }

      // إذا لم يكن الإيميل موثقاً بعد (في أول مرة يعرض فيها وحدة): نحفظ كل البيانات كاملة في المسودة ونفتح ديالوج الكود
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

  const handleCloseValidationPopupAndScroll = () => {
    setValidationPopupOpen(false)
    if (firstMissingScrollId) {
      setTimeout(() => {
        const el = document.getElementById(firstMissingScrollId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 120)
    }
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
      if (res.success) {
        setOtpSent(true)
      } else {
        setOtpError(res.error || s.validation.submitFailed)
      }
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
    {
      id: 2,
      label: fT.tabs.photos,
      ref: secPhotosRef,
      hasError: false,
    },
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

  const activeModalEmail =
    pendingPublishIds?.email || form.email || loggedUser?.email || ''

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

        {/* شريط الخطوات العلوي الذكي: يوضح المكتمل بالأخضر، والناقص بالأحمر، والحالي بالبرتقالي */}
        <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-slate-200/70 bg-[#f4f6f9]/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {navTabs.map((tab) => {
              const isDone =
                sectionCompletion[tab.id as 1 | 2 | 3 | 4 | 5 | 6]
              const isCurrent = activeTab === tab.id
              const cleanName = tab.label.replace(/^[0-9]+\s*/, '')

              return (
                <button
                  key={tab.id}
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
              setDealCategory={handleToggleDealCategory}
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
              isExitDeal={isExitDeal}
              isDirectSale={isDirectSale}
              isRentDeal={isRentDeal}
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
              isExitDeal={isExitDeal}
              isDirectSale={isDirectSale}
              isRentDeal={isRentDeal}
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
              onUserAuthenticated={(
                u: {
                  id: string
                  name: string
                  email: string
                  phone: string
                },
                createdUnitId?: string
              ) => {
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

           {/* ==============================================================
                صندوق الإرسال النهائي + شريط الحقول الناقصة القابلة للضغط (بدون Popup مزعج)
            ============================================================== */}
            <section className="rounded-[26px] border-2 border-[#007a5a]/30 bg-white p-5 shadow-md sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-[#0a1122] sm:text-lg">
                  {fT.bottomBar.finalSectionTitle}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f2] px-3 py-1 text-xs font-extrabold text-[#007a5a]">
                  <CheckCircle2 className="size-3.5" />
                  <span>
                    {autoSaveTime
                      ? `${fT.bottomBar.savedAtPrefix} ${autoSaveTime}`
                      : `${fT.bottomBar.autoSavedPrefix} ${sectionCompletion.completedCount}/6`}
                  </span>
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-600 sm:text-sm">
                {hasAllPhotosAndDocs
                  ? fT.bottomBar.finalSectionDescComplete
                  : fT.bottomBar.finalSectionDescMissingMedia}
              </p>

              {/* شريط الحقول الإجبارية الناقصة: يظهر فوق الزر مباشرةً وكل حقل عبارة عن زر يوديه للحقل الناقص */}
              {missingFields.length > 0 && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50/90 p-4 text-start animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2 text-xs font-black text-red-900 sm:text-sm">
                    <AlertCircle className="size-4 shrink-0 text-red-600" />
                    <span>{fT.validationModalSubtitle}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(fieldErrors).map(([fKey]) => {
                      const scrollMap: Record<
                        string,
                        { label: string; targetId: string }
                      > = {
                        propertyKind: {
                          label: fT.typeSection.whatKindLabel.replace(' *', ''),
                          targetId: 'field-wrap-propertyKind',
                        },
                        buildingStatus: {
                          label: fT.typeSection.statusLabel.replace(' *', ''),
                          targetId: 'field-wrap-buildingStatus',
                        },
                        location: {
                          label: fT.locationSection.cityDistrictLabel.replace(
                            ' *',
                            ''
                          ),
                          targetId: 'field-wrap-location',
                        },
                        project: {
                          label: fT.locationSection.projectLabel.replace(
                            ' *',
                            ''
                          ),
                          targetId: 'field-wrap-project',
                        },
                        exactStreet: {
                          label: fT.locationSection.streetLabel.replace(
                            ' *',
                            ''
                          ),
                          targetId: 'field-wrap-exactStreet',
                        },
                        areaSize: {
                          label: fT.detailsSection.areaLabel.replace(' *', ''),
                          targetId: 'field-wrap-areaSize',
                        },
                        rooms: {
                          label: fT.detailsSection.roomsLabel.replace(' *', ''),
                          targetId: 'field-wrap-rooms',
                        },
                        bedrooms: {
                          label: fT.detailsSection.bedroomsLabel.replace(
                            ' *',
                            ''
                          ),
                          targetId: 'field-wrap-bedrooms',
                        },
                        floor: {
                          label: fT.detailsSection.floorLabel,
                          targetId: 'field-wrap-floor',
                        },
                        contractPrice: {
                          label: fT.pricingSection.contractPriceLabel.replace(
                            ' *',
                            ''
                          ),
                          targetId: 'field-wrap-contractPrice',
                        },
                        paidAmount: {
                          label: fT.pricingSection.paidAmountLabel.replace(
                            ' *',
                            ''
                          ),
                          targetId: 'field-wrap-paidAmount',
                        },
                        name: {
                          label: s.contactStep.nameLabel.replace(' *', ''),
                          targetId: 'field-wrap-name',
                        },
                        phone: {
                          label: s.contactStep.phoneLabel.replace(' *', ''),
                          targetId: 'field-wrap-phone',
                        },
                        email: {
                          label: s.contactStep.emailLabel.replace(' *', ''),
                          targetId: 'field-wrap-email',
                        },
                        password: {
                          label: s.contactStep.passwordLabel,
                          targetId: 'field-wrap-password',
                        },
                        loginIdentifier: {
                          label: s.contactStep.loginIdLabel.replace(' *', ''),
                          targetId: 'field-wrap-loginIdentifier',
                        },
                        agreedTerms: {
                          label: s.contactStep.ownerDeclaration,
                          targetId: 'field-wrap-agreedTerms',
                        },
                      }

                      const itemInfo = scrollMap[fKey]
                      if (!itemInfo) return null

                      return (
                        <button
                          key={fKey}
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(
                              itemInfo.targetId
                            )
                            el?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            })
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 shadow-2xs transition hover:border-red-500 hover:bg-red-600 hover:text-white"
                        >
                          <span>• {itemInfo.label}</span>
                          <span className="text-[10px]">↗</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={pending || savingDraftLoading}
                  onClick={handlePublishListing}
                  className="inline-flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60 sm:text-sm"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{fT.bottomBar.publishingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4 shrink-0" />
                      <span>
                        {hasAllPhotosAndDocs
                          ? fT.bottomBar.publishBtn
                          : fT.bottomBar.submitAndCompleteDocsLaterBtn}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={pending || savingDraftLoading}
                  onClick={handleSaveDraftAndGoToAccount}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-3 text-xs font-extrabold text-[#0a1122] transition hover:border-[#007a5a] hover:bg-[#eaf8f2]/40 hover:text-[#007a5a] disabled:opacity-60 sm:text-sm"
                >
                  {savingDraftLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#007a5a]" />
                      <span>{fT.bottomBar.savingDraftBtn}</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="size-4 shrink-0 text-[#007a5a]" />
                      <span>{fT.bottomBar.saveDraftBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </section>          </div>

          <LivePreviewSidebar
            images={images}
            livePreviewData={livePreviewData}
            form={form}
            propertyKind={propertyKind}
            strength={sectionCompletion.strength}
          />
        </div>
      </div>

      {/* =====================================================================
          نافذة تنبيه الحقول الإجبارية الناقصة (مطابقة لـ evisa.gov.ge مع Scroll تلقائي لأول حقل أحمر)
      ===================================================================== */}
      {validationPopupOpen && (
        <div
          dir={dir}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
          onClick={handleCloseValidationPopupAndScroll}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-red-50/70 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="size-5" />
                </span>
                <h3 className="text-sm font-black text-red-950 sm:text-base">
                  {fT.validationModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseValidationPopupAndScroll}
                className="rounded-full p-1 text-slate-400 hover:bg-red-100 hover:text-red-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 text-start">
              <p className="text-xs leading-relaxed font-bold text-slate-700 sm:text-sm">
                {fT.validationModalSubtitle}
              </p>

              <ul className="mt-3.5 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl border border-red-200 bg-red-50/40 p-3.5 text-xs font-extrabold text-red-800">
                {missingFields.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-center gap-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseValidationPopupAndScroll}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#007a5a] px-6 text-xs font-black text-white shadow-sm transition hover:bg-[#006248] sm:w-auto sm:text-sm"
                >
                  {fT.validationModalOkBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ديالوج توثيق البريد الإلكتروني (لمرة واحدة فقط في أول وحدة) */}
      {verifyModalOpen && (
        <div
          dir={dir}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-start shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-4 end-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#007a5a]">
                <ShieldAlert className="size-6" />
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-[#2563eb]">
                {loadT.oneTimeVerifyBadge}
              </span>
            </div>

            <h3 className="mt-3.5 text-lg font-black text-[#0a1122]">
              {extraT.verifyBoxTitle}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {extraT.verifyBoxDescPrefix}{' '}
              <strong dir="ltr" className="font-mono text-[#0a1122]">
                {maskEmailDisplay(activeModalEmail)}
              </strong>{' '}
              {extraT.verifyBoxDescSuffix}
            </p>

            <div className="mt-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-xs font-bold text-[#007a5a]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{extraT.savedBadge}</span>
              </div>
              <p className="mt-1 font-medium leading-relaxed text-slate-600">
                {loadT.oneTimeVerifyNote}
              </p>
            </div>

            <div className="mt-5">
              {!otpSent ? (
                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={handleSendOtpInModal}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-60 sm:text-sm"
                >
                  {otpLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  <span>{extraT.sendCodeBtn}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <strong className="block font-bold text-[#0a1122]">
                      {extraT.codeSentToPrefix}
                    </strong>
                    <span className="mt-0.5 block">{extraT.codeSentBody}</span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="text"
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(
                          toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                        )
                      }
                      placeholder="• • • • • •"
                      className="h-12 flex-1 rounded-xl border-slate-300 bg-white text-center font-mono text-lg font-black tracking-[0.35em]"
                    />
                    <button
                      type="button"
                      disabled={otpLoading || otpCode.length < 6}
                      onClick={handleVerifyOtpAndPublish}
                      className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#006248] disabled:opacity-50 sm:text-sm"
                    >
                      {otpLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      <span>{extraT.confirmCodeBtn}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={handleSendOtpInModal}
                      className="text-xs font-bold text-[#2563eb] hover:underline"
                    >
                      {extraT.resendCodeBtn}
                    </button>
                  </div>
                </div>
              )}

              {otpError && (
                <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                  {otpError}
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={otpLoading}
                onClick={handleSaveAndContinueLater}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100"
              >
                {s.shared.saveLaterBtn || extraT.continueUploadLaterBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-bold text-[#0a1122]">
                {previewDoc.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex max-h-[80vh] items-center justify-center overflow-auto bg-slate-950/5 p-2">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[76vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}