'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import {
  getAuthorizedUnitForEditAction,
  getCurrentSellerProfileAction,
  processSellerStep2Action,
  saveSellProgress,
  submitSellRequest,
  verifyMagicTokenAction,
} from '@/actions/submit-forms'
import { getUserVerificationStatusAction } from '@/actions/auth-actions'
import {
  deleteUnitDocumentAction,
  saveUnitDocumentAction,
} from '@/actions/account-actions'
import { createClient } from '@/lib/supabase/client'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { useTranslation } from '@/lib/i18n'
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

export function SellerFlow() {
  const { t: dict, locale, dir } = useTranslation()
  const isAr = locale === 'ar'
  const s = dict.sell
  const extraT = getSellerExtraLabels(locale, dict)
  const fT = getSellerFormTranslations(locale)

  const secTypeRef = useRef<HTMLElement | null>(null)
  const secPhotosRef = useRef<HTMLElement | null>(null)
  const secLocationRef = useRef<HTMLElement | null>(null)
  const secDetailsRef = useRef<HTMLElement | null>(null)
  const secPriceRef = useRef<HTMLElement | null>(null)
  const secContactRef = useRef<HTMLElement | null>(null)
  const isManualScrollingRef = useRef(false)

  const [activeTab, setActiveTab] = useState<number>(1)
  const [unitId, setUnitId] = useState<string>('')
  const [orderRef, setOrderRef] = useState<string>('AE-1001')

  // جميع الاختيارات تبدأ فارغة تماماً بدون أي تحديد تلقائي
  const [dealCategory, setDealCategory] = useState<DealCategory | ''>('')
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

  // جميع الفلاتر تبدأ فارغة تماماً ليختار المستخدم بنفسه
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
  >('sivrce_default')

  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [autoSaveTime, setAutoSaveTime] = useState<string>('')
  const [pending, startTransition] = useTransition()

  const isExitDeal = dealCategory === 'exit'
  const isRentDeal =
    dealCategory === 'rent_monthly' || dealCategory === 'rent_daily'
  const isDirectSale = dealCategory === 'sale' || !dealCategory

  // دالة اختيار أو إلغاء تحديد نوع العملية عند الضغط مرة ثانية
  const handleToggleDealCategory = (cat: DealCategory | '') => {
    if (dealCategory === cat) {
      setDealCategory('')
      setPropertyKind('')
      setBuildingStatus('')
    } else {
      setDealCategory(cat)
    }
  }

  // دالة اختيار أو إلغاء تحديد نوع العقار عند الضغط مرة ثانية
  const handleTogglePropertyKind = (kindId: string) => {
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

  // دالة اختيار أو إلغاء تحديد حالة البناء + نقل التاب العلوي تلقائياً لـ 2 Photos كما في الصورة 9
  const handleToggleBuildingStatus = (statusId: string) => {
    if (buildingStatus === statusId) {
      setBuildingStatus('')
    } else {
      setBuildingStatus(statusId)
      setActiveTab(2)
    }
  }

  // تتبع السكرول الذكي (Scroll-Spy) لتنير التابات العلوية بدقة أثناء النزول والصعود
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

      // إذا وصل المستخدم لآخر الصفحة نضيء تاب 6 Contact
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

  useEffect(() => {
    async function init() {
      const [profileRes, verStatus] = await Promise.all([
        getCurrentSellerProfileAction(),
        getUserVerificationStatusAction(),
      ])

      if (profileRes.isLoggedIn && profileRes.user) {
        setLoggedUser(profileRes.user)
        setForm((prev) => ({
          ...prev,
          name: prev.name || profileRes.user?.name || '',
          phone: prev.phone || profileRes.user?.phone || '',
          email: prev.email || profileRes.user?.email || '',
        }))
      }
      if (verStatus.isLoggedIn) {
        setEmailVerified(verStatus.emailVerified)
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const magicToken = params.get('magic')
        const editUnitId = params.get('editUnitId') || params.get('resume')

        const hydrateUnit = (u: any) => {
          const meta = u.documents?.__unit_meta || {}
          setUnitId(String(u.id))
          setOrderRef(
            `AE-${String(u.id)
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(0, 6)
              .toUpperCase()}`
          )
          const rawCat = u.listing_category || meta.listing_category || 'exit'
          const savedCat = (rawCat === 'pledge' ? 'sale' : rawCat) as DealCategory
          setDealCategory(savedCat)
          setPropertyKind(u.unit_type || meta.unit_type || 'Apartment')
          setBuildingStatus(
            u.building_status || meta.building_status || 'Newly built'
          )

          const savedArea = u.area || meta.area || 'Tbilisi - Saburtalo'
          setForm((prev) => ({
            ...prev,
            developer: u.developer_name || '',
            project: u.project_name || '',
            location: savedArea,
            locationDisplay: getLocalizedGeorgiaAreaName(savedArea, locale),
            exactStreet: u.exact_street || meta.exact_street || '',
            houseNumber: u.house_number || meta.house_number || '',
            cadastralCode: u.cadastral_code || meta.cadastral_code || '',
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
            maxGuests: String(u.max_guests || meta.max_guests || ''),
            description: u.description || '',
            contractPrice: u.contract_price ? String(u.contract_price) : '',
            paidAmount: u.paid_amount ? String(u.paid_amount) : '',
            marketPrice:
              u.market_price || u.contract_price
                ? String(u.market_price || u.contract_price)
                : '',
            rentPrice:
              u.rent_price || meta.rent_price
                ? String(u.rent_price || meta.rent_price)
                : u.paid_amount
                  ? String(u.paid_amount)
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
            phone: u.phone || profileRes.user?.phone || '',
            email: u.email || profileRes.user?.email || '',
          }))

          setSelected((prev) => ({
            ...prev,
            finishing: u.finishing || meta.finishing ? [u.finishing || meta.finishing] : [],
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
        }

        if (magicToken) {
          const res = await verifyMagicTokenAction(magicToken)
          if (res.valid && res.unit) hydrateUnit(res.unit)
        } else if (editUnitId) {
          const authUnitRes = await getAuthorizedUnitForEditAction(editUnitId)
          if (authUnitRes.allowed && authUnitRes.unit) {
            hydrateUnit(authUnitRes.unit)
          }
        }
      }
    }
    init()
  }, [locale])

  // إذا ضغط المستخدم على نفس الرقم في الغرف/الحمامات يتم إلغاء تحديده
  const update = (key: string, value: string) => {
    setForm((curr) => ({ ...curr, [key]: value }))
    setError('')
    setMissingFields([])
  }

  // إذا ضغط المستخدم على نفس الخيار مرة ثانية يتم إلغاء تحديده
  const toggleSingle = (group: string, value: string) => {
    setSelected((curr) => {
      const currentVal = curr[group]?.[0]
      if (
        currentVal === value &&
        ['finishing', 'buildingSeries', 'floorType', 'heatingType', 'buildingMaterial'].includes(
          group
        )
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

  const dynamicStatusOptions = useMemo<Array<LocalizedOptionItem<string>>>(() => {
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
          ar: 'مكتمل وجاهز',
          en: 'Completed',
          ru: 'Завершен',
          ka: 'დასრულებული',
          labelAr: 'مكتمل وجاهز',
          labelEn: 'Completed',
        },
      ]
    }
    return [
      {
        id: 'Newly built',
        ar: 'مبنى حديث',
        en: 'Newly built',
        ru: 'Новостройка',
        ka: 'ახალი აშენებული',
        labelAr: 'مبنى حديث',
        labelEn: 'Newly built',
      },
      {
        id: 'Old built',
        ar: 'مبنى قديم',
        en: 'Old built',
        ru: 'Старая постройка',
        ka: 'ძველი აშენებული',
        labelAr: 'مبنى قديم',
        labelEn: 'Old built',
      },
      {
        id: 'Under construction',
        ar: 'تحت الإنشاء',
        en: 'Under construction',
        ru: 'Строится',
        ka: 'მშენებარე',
        labelAr: 'تحت الإنشاء',
        labelEn: 'Under construction',
      },
    ]
  }, [propertyKind])

  const sectionCompletion = useMemo(() => {
    const s1 = Boolean(
      dealCategory &&
        propertyKind &&
        (propertyKind === 'Land' || buildingStatus)
    )
    const s2 = images.length > 0
    const s3 = Boolean(form.location)
    const s4 = Boolean(s1 && form.areaSize && (propertyKind === 'Land' || form.rooms))
    const activePrice = isRentDeal
      ? Number(form.rentPrice)
      : isDirectSale
        ? Number(form.contractPrice || form.paidAmount || form.pricePerSqm)
        : Number(form.paidAmount)
    const s5 = Boolean(activePrice > 0 && form.description.trim().length >= 10)
    const s6 = Boolean(
      loggedUser?.id || (form.name.trim() && form.phone.trim())
    )

    let strength = 5
    if (dealCategory) strength += 2
    if (propertyKind) strength += 2
    if (images.length >= 1) strength += 16
    if (images.length >= 5) strength += 15
    if (form.location) strength += 15
    if (form.areaSize) strength += 15
    if (activePrice > 0) strength += 15
    if (form.description.trim().length >= 40) strength += 15

    return {
      1: s1,
      2: s2,
      3: s3,
      4: s4,
      5: s5,
      6: s6,
      completedCount: [s1, s2, s3, s4, s5, s6].filter(Boolean).length,
      strength: Math.min(100, strength),
    }
  }, [
    dealCategory,
    propertyKind,
    buildingStatus,
    images.length,
    form.location,
    form.areaSize,
    form.rooms,
    form.rentPrice,
    form.contractPrice,
    form.paidAmount,
    form.pricePerSqm,
    form.description,
    form.name,
    form.phone,
    isRentDeal,
    isDirectSale,
    loggedUser,
  ])

  const livePreviewData = useMemo(() => {
    const pvT = fT.previewSidebar
    const localizedArea =
      form.locationDisplay ||
      (form.location ? getLocalizedGeorgiaAreaName(form.location, locale) : '')
    const kindObj =
      PROPERTY_KINDS.find((k) => k.id === propertyKind) || PROPERTY_KINDS[0]
    const kindName = getOptionLabel(kindObj, locale)

    const dealActionText =
      locale === 'ar'
        ? dealCategory === 'exit'
          ? 'للتنازل في'
          : isRentDeal
            ? 'للإيجار في'
            : 'للبيع في'
        : locale === 'ru'
          ? dealCategory === 'exit'
            ? 'переуступка в'
            : isRentDeal
              ? 'в аренду в'
              : 'на продажу в'
          : locale === 'ka'
            ? isRentDeal
              ? 'ქირავდება'
              : 'იყიდება'
            : dealCategory === 'exit'
              ? 'for exit in'
              : isRentDeal
                ? 'for rent in'
                : 'for sale in'

    const title = `${kindName} ${dealActionText} ${localizedArea || '—'}`

    const currSym =
      currencyChoice === 'GEL' ? '₾' : currencyChoice === 'EUR' ? '€' : '$'

    let rawPrice = 0
    if (isRentDeal) rawPrice = Number(toEnglishDigits(form.rentPrice || '0'))
    else if (isExitDeal)
      rawPrice = Number(toEnglishDigits(form.paidAmount || '0'))
    else
      rawPrice = Number(
        toEnglishDigits(
          form.contractPrice || form.paidAmount || form.pricePerSqm || '0'
        )
      )

    const priceSuffix =
      dealCategory === 'rent_daily'
        ? pvT.perDay
        : dealCategory === 'rent_monthly'
          ? pvT.perMonth
          : isExitDeal
            ? pvT.cashRequiredSuffix
            : ''

    return {
      title,
      area: localizedArea || '—',
      priceDisplay:
        rawPrice > 0
          ? `${currSym}${rawPrice.toLocaleString('en-US')}${priceSuffix}`
          : pvT.priceOnRequest,
    }
  }, [
    fT.previewSidebar,
    form.location,
    form.locationDisplay,
    form.rentPrice,
    form.paidAmount,
    form.contractPrice,
    form.pricePerSqm,
    propertyKind,
    dealCategory,
    currencyChoice,
    locale,
    isRentDeal,
    isExitDeal,
  ])

  const generateSmartDescription = () => {
    const areaName =
      form.locationDisplay ||
      getLocalizedGeorgiaAreaName(form.location || 'Tbilisi - Saburtalo', locale)
    const sizeStr = form.areaSize || '75'
    const roomsStr = form.rooms || '3'
    const bedsStr = form.bedrooms || '2'
    const floorStr = `${form.floor || '5'}/${form.totalFloors || '12'}`
    const condObj =
      PROPERTY_KINDS.find((k) => k.id === propertyKind) || PROPERTY_KINDS[0]

    if (locale === 'ar') {
      const textAr = `عقار مميز (${getOptionLabel(condObj, 'ar')}) في ${areaName}. المساحة الإجمالية ${sizeStr} م²، يتكون من ${roomsStr} غرف (${bedsStr} غرف نوم)، الطابق ${floorStr}. موقع استراتيجي قريب من كافة الخدمات اليومية والمواصلات.`
      update('description', textAr)
    } else if (locale === 'ru') {
      const textRu = `${bedsStr}-спальная ${getOptionLabel(condObj, 'ru')} (${sizeStr} м²) в районе ${areaName}. Этаж ${floorStr}. Отличная локация рядом со всей инфраструктурой и транспортом.`
      update('description', textRu)
    } else if (locale === 'ka') {
      const textKa = `${bedsStr}-საძინებლიანი ${getOptionLabel(condObj, 'ka')} (${sizeStr} მ²) ${areaName}-ში. სართული ${floorStr}. საუკეთესო მდებარეობა ყველა საჭირო ინფრასტრუქტურასთან ახლოს.`
      update('description', textKa)
    } else {
      const textEn = `${bedsStr}-bedroom ${getOptionLabel(condObj, 'en')} (${sizeStr} m²) in ${areaName}. Located on floor ${floorStr}. Prime location with easy access to daily amenities and public transport.`
      update('description', textEn)
    }
  }

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

  const buildFormData = (activeUnitId?: string) => {
    const data = new FormData()
    const put = (k: string, v?: string | number | boolean) => {
      if (v !== undefined && v !== null && String(v) !== '') {
        data.set(k, String(v))
      }
    }

    const targetId = activeUnitId || unitId
    if (targetId) put('unit_id', targetId)

    const effectiveDeal = (dealCategory || 'exit') as DealCategory
    const effectiveKind = propertyKind || 'Apartment'
    const effectiveArea = form.location || 'Tbilisi - Saburtalo'
    const effectiveStatus = buildingStatus || 'Newly built'

    put('country', ACTIVE_PLATFORM_COUNTRY)
    put('currency_code', currencyChoice)
    put('listing_category', effectiveDeal)
    put('unit_type', effectiveKind)
    put('building_status', effectiveStatus)

    const fallbackProjectTitle =
      form.project.trim() ||
      (form.exactStreet
        ? `${effectiveKind} — ${form.exactStreet}`
        : `${effectiveKind} in ${getLocalizedGeorgiaAreaName(effectiveArea, 'en')}`)

    put('developer_name', form.developer || effectiveStatus)
    put('project_name', fallbackProjectTitle)
    put('area', effectiveArea)
    put('exact_street', form.exactStreet)
    put('house_number', form.houseNumber)
    put('cadastral_code', form.cadastralCode)

    put('year_built', form.yearBuilt)
    put('size', form.areaSize)
    put('kitchen_area', form.kitchenArea)
    put('balcony_area', form.balconyArea)
    put('loggia_area', form.loggiaArea)
    put('terrace_area', form.terraceArea)
    put('garden_size', form.garden)

    put('bedrooms', form.bedrooms || '1')
    put('rooms', form.rooms || '1')
    put('bathrooms', form.bathrooms || '1')
    put('floor_number', form.floor)
    put('total_floors', form.totalFloors)
    put('max_guests', form.maxGuests)

    put('finishing', selected.finishing?.[0] || 'Newly renovated')
    put('building_series', selected.buildingSeries?.[0])
    put('floor_type', selected.floorType?.[0])
    put('heating_type', selected.heatingType?.[0])
    put('building_material', selected.buildingMaterial?.[0])

    const delStatus =
      effectiveStatus === 'Under construction'
        ? form.deliveryRemainingMonths
          ? `Under Construction (${form.deliveryRemainingMonths} months)`
          : 'Under Construction'
        : 'Ready to Move'
    put('delivery_status', delStatus)
    put('delivery_month', form.deliveryRemainingMonths)

    selected.features?.forEach((f) => data.append('feature', f))
    selected.messengers?.forEach((m) => data.append('contact_messenger', m))

    put('video_url', form.videoUrl)
    put('tour_3d_url', form.tour3dUrl)
    if (flags.allowOnlineViewing) data.set('allow_online_viewing', 'on')
    if (flags.installmentSalePossible)
      data.set('installment_sale_possible', 'on')
    if (flags.exchangePossible) data.set('exchange_possible', 'on')
    if (flags.isExclusive) data.set('is_exclusive', 'on')

    const sizeNum = Number(toEnglishDigits(form.areaSize || '0')) || 1
    if (isRentDeal) {
      const rPrice = Number(toEnglishDigits(form.rentPrice || '0'))
      put('rent_price', rPrice)
      put('rent_period', effectiveDeal === 'rent_daily' ? 'daily' : 'monthly')
      put('contract_price', rPrice)
      put('paid_amount', rPrice)
      put('market_price', rPrice)
    } else if (isDirectSale) {
      const rawTotal =
        priceInputMode === 'sqm'
          ? Math.round(
              Number(toEnglishDigits(form.pricePerSqm || '0')) * sizeNum
            )
          : Number(
              toEnglishDigits(form.contractPrice || form.paidAmount || '0')
            )
      put('contract_price', rawTotal)
      put('paid_amount', rawTotal)
      put('market_price', form.marketPrice || rawTotal)
    } else {
      put('contract_price', form.contractPrice)
      put('paid_amount', form.paidAmount)
      put('market_price', form.marketPrice || form.contractPrice)
      put('installment_amount', form.installment)
      put('installment_frequency', selected.frequency?.[0])
      put('contract_month', form.contractMonth)
      put('contract_year', form.contractYear)
      put('years_left', form.remainingMonths)
      if (selected.annualInstallment?.[0] === 'yes') {
        data.set('has_annual_installment', 'on')
      }
      put('annual_installment_amount', form.annualInstallmentAmount)
      if (selected.overdueInstallments?.[0] === 'yes') {
        data.set('has_overdue_installments', 'on')
      }
      put('overdue_installments', form.overdueCount)
      put('overdue_total_amount', form.overdueTotal)
    }

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
  }

  const handleSaveDraft = async () => {
    if (!loggedUser) {
      secContactRef.current?.scrollIntoView({ behavior: 'smooth' })
      setError(
        isAr
          ? 'يرجى تسجيل الدخول أو كتابة بيانات التواصل أولاً لحفظ المسودة'
          : 'Please sign in or fill contact details first to save draft'
      )
      return
    }
    const data = buildFormData()
    const res = await saveSellProgress(data)
    if (res.success) {
      if (res.unitId) setUnitId(res.unitId)
      setAutoSaveTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    } else {
      setError(res.error || 'Could not save draft')
    }
  }

  const handlePublishListing = () => {
    const missing: string[] = []

    if (!dealCategory || !propertyKind) {
      missing.push(fT.typeSection.title)
    }
    if (!form.location) {
      missing.push(fT.locationSection.cityDistrictLabel.replace(' *', ''))
    }
    if (!form.areaSize || Number(toEnglishDigits(form.areaSize)) <= 0) {
      missing.push(fT.detailsSection.areaLabel.replace(' *', ''))
    }

    if (isRentDeal) {
      if (!form.rentPrice || Number(toEnglishDigits(form.rentPrice)) <= 0) {
        missing.push(fT.pricingSection.priceLabel.replace(' *', ''))
      }
    } else if (isDirectSale) {
      const hasPrice =
        Number(toEnglishDigits(form.contractPrice || form.paidAmount)) > 0 ||
        Number(toEnglishDigits(form.pricePerSqm)) > 0
      if (!hasPrice) {
        missing.push(fT.pricingSection.priceLabel.replace(' *', ''))
      }
    } else {
      if (!form.contractPrice)
        missing.push(fT.pricingSection.contractPriceLabel.replace(' *', ''))
      if (!form.paidAmount)
        missing.push(fT.pricingSection.paidAmountLabel.replace(' *', ''))
    }

    if (!loggedUser) {
      if (authMode === 'sivrce_default' || authMode === 'session') {
        setAuthMode('register')
        secContactRef.current?.scrollIntoView({ behavior: 'smooth' })
        setError(
          isAr
            ? 'يرجى إكمال البريد الإلكتروني وكلمة المرور لربط الإعلان بحسابك، أو الضغط على تسجيل الدخول بحسابك'
            : 'Please complete your email & password to link your listing, or sign in'
        )
        return
      }
      if (authMode === 'register') {
        if (!form.name.trim()) missing.push(isAr ? 'الاسم' : 'Name')
        if (!form.phone.trim())
          missing.push(isAr ? 'رقم الموبايل' : 'Mobile number')
        if (!form.email.trim())
          missing.push(isAr ? 'البريد الإلكتروني' : 'Email')
        if (!form.password || form.password.length < 8) {
          missing.push(
            isAr ? 'كلمة المرور (8 أحرف على الأقل)' : 'Password (min 8 chars)'
          )
        }
      } else if (authMode === 'login') {
        if (
          !form.loginIdentifier.trim() ||
          (!form.password && !form.loginPassword)
        ) {
          missing.push(
            isAr ? 'بيانات تسجيل الدخول' : 'Login credentials'
          )
        }
      }
    }

    if (missing.length > 0) {
      setMissingFields(missing)
      setError(s.validation.missingBannerPrefix)
      return
    }

    setError('')
    setMissingFields([])

    startTransition(async () => {
      let resolvedUnitId = unitId
      const effectiveDeal = (dealCategory || 'exit') as DealCategory
      const effectiveKind = propertyKind || 'Apartment'
      const effectiveArea = form.location || 'Tbilisi - Saburtalo'
      const effectiveStatus = buildingStatus || 'Newly built'

      if (!loggedUser) {
        const cleanPhone = toEnglishDigits(form.phone || '').trim()
        const fullPhone = cleanPhone.startsWith('+')
          ? cleanPhone
          : `+${(form.countryCode || DEFAULT_PHONE_CODE).replace('+', '')}${cleanPhone.replace(/^0+/, '')}`

        const step2Res = await processSellerStep2Action({
          mode: authMode === 'login' ? 'login' : 'register',
          listingCategory: effectiveDeal,
          unitCountry: ACTIVE_PLATFORM_COUNTRY,
          userCountry: form.userCountry || ACTIVE_PLATFORM_COUNTRY,
          developer: form.developer || effectiveStatus,
          project:
            form.project ||
            `${effectiveKind} in ${getLocalizedGeorgiaAreaName(effectiveArea, 'en')}`,
          contractPrice:
            Number(
              toEnglishDigits(form.contractPrice || form.rentPrice || '0')
            ) || 0,
          paidAmount:
            Number(
              toEnglishDigits(
                form.paidAmount || form.contractPrice || form.rentPrice || '0'
              )
            ) || 0,
          rentPrice: Number(toEnglishDigits(form.rentPrice || '0')) || 0,
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
          setError(
            step2Res.error ||
              (isAr
                ? 'تعذر التحقق من بيانات الحساب'
                : 'Authentication failed')
          )
          secContactRef.current?.scrollIntoView({ behavior: 'smooth' })
          return
        }

        if (step2Res.unitId) {
          resolvedUnitId = step2Res.unitId
          setUnitId(step2Res.unitId)
        }
        if (step2Res.orderRef) setOrderRef(step2Res.orderRef)
        if (step2Res.userId) {
          setLoggedUser({
            id: step2Res.userId,
            name: step2Res.userName || form.name,
            email: step2Res.userEmail || form.email,
            phone: step2Res.userPhone || fullPhone,
          })
        }
      }

      const data = buildFormData(resolvedUnitId)
      const result = await submitSellRequest(data)
      if (result.success) {
        if (result.unitId) setUnitId(result.unitId)
        if (result.orderRef) setOrderRef(result.orderRef)
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(result.error || s.validation.submitFailed)
      }
    })
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

  if (submitted) {
    return (
      <ReviewStep
        form={form}
        orderRef={orderRef}
        unitId={unitId}
        userId={loggedUser?.id || ''}
        userEmail={form.email || loggedUser?.email || ''}
        emailVerified={emailVerified}
        setEmailVerified={setEmailVerified}
        supportWhatsApp={supportWhatsApp}
        extraT={extraT}
      />
    )
  }

  const navTabs = [
    { id: 1, label: fT.tabs.type, ref: secTypeRef },
    { id: 2, label: fT.tabs.photos, ref: secPhotosRef },
    { id: 3, label: fT.tabs.location, ref: secLocationRef },
    { id: 4, label: fT.tabs.details, ref: secDetailsRef },
    { id: 5, label: fT.tabs.price, ref: secPriceRef },
    { id: 6, label: fT.tabs.contact, ref: secContactRef },
  ]

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f4f6f9] pb-28 pt-6 text-[#0a1122] sm:pt-8"
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <header className="mb-4 text-start">
          <h1 className="text-2xl font-black tracking-tight text-[#0a1122] sm:text-3xl">
            {fT.pageTitle}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {fT.pageSubtitle}
          </p>
        </header>

        {/* شريط التابات العلوي المتفاعل مع السكرول وخطوات الإكمال مطابق لـ sivrce.ge */}
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
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white shadow-md shadow-orange-500/25'
                      : isDone
                        ? 'border border-blue-200/80 bg-blue-50/90 text-[#2563eb]'
                        : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isDone ? (
                    <>
                      <Check
                        className={`size-3.5 stroke-[3] ${
                          isCurrent ? 'text-white' : 'text-[#2563eb]'
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
          {/* العمود الرئيسي للأقسام الستة */}
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
            />

            <PricingSection
              sectionRef={secPriceRef}
              onHover={() => setActiveTab(5)}
              dealCategory={dealCategory}
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
              onGenerateAiDescription={generateSmartDescription}
            />

            <ContactSection
              sectionRef={secContactRef}
              onHover={() => setActiveTab(6)}
              isRentDeal={isRentDeal}
              loggedUser={loggedUser}
              onUserAuthenticated={(u) => setLoggedUser(u)}
              authMode={authMode}
              setAuthMode={setAuthMode}
              form={form}
              update={update}
              selected={selected}
              toggleMulti={toggleMulti}
              agreedTerms={flags.agreedTerms}
              setAgreedTerms={(val) =>
                setFlags((p) => ({ ...p, agreedTerms: val }))
              }
              error={error}
              missingFields={missingFields}
              unitId={unitId}
              setUnitId={setUnitId}
              setOrderRef={setOrderRef}
            />
          </div>

          {/* الشريط الجانبي الثابت للمعاينة الحية وقوة الإعلان */}
          <LivePreviewSidebar
            images={images}
            livePreviewData={livePreviewData}
            form={form}
            propertyKind={propertyKind}
            strength={sectionCompletion.strength}
          />
        </div>
      </div>

      {/* الشريط السفلي الثابت للحفظ والنشر */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="text-emerald-600">✓</span>
            <span>
              {autoSaveTime
                ? `${fT.bottomBar.savedAtPrefix} ${autoSaveTime}`
                : `${fT.bottomBar.autoSavedPrefix} ${sectionCompletion.completedCount}/6`}
            </span>
            {loggedUser && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-[#0a1122] hover:bg-slate-100 sm:inline-block"
              >
                {fT.bottomBar.saveDraftBtn}
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={handlePublishListing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] to-[#f43f5e] px-8 text-sm font-black text-white shadow-md shadow-orange-500/20 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{fT.bottomBar.publishingBtn}</span>
              </>
            ) : (
              <span>{fT.bottomBar.publishBtn}</span>
            )}
          </button>
        </div>
      </div>

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
              <span className="text-xs font-extrabold text-[#0a1122]">
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