'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  FileCheck2,
  FileText,
  ImagePlus,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Star,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import {
  getCurrentSellerProfileAction,
  saveSellProgress,
  submitSellRequest,
  verifyMagicTokenAction,
} from '@/actions/submit-forms'
import {
  deleteUnitDocumentAction,
  requestUnitPromotionAction,
  saveUnitDocumentAction,
} from '@/actions/account-actions'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TurnstileBox } from '@/components/layouts/funnel-shell'
import {
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'
import {
  Field,
  formatAmount,
  getCountryConfig,
  getLocalizedDeliveries,
  getLocalizedFeatures,
  getLocalizedFinishings,
  getLocalizedUnitTypes,
  isReadyDeliveryOption,
  isUnderConstructionDeliveryOption,
  MoneyField,
  MonthYearSelector,
  Pills,
  RequiredLabel,
  toEnglishDigits,
  ToggleSection,
  years,
} from './seller-shared'
import { ContactStep } from './seller-contact-step'

const ACTIVE_PLATFORM_COUNTRY = 'GE'
const DEFAULT_PHONE_CODE = '995'

export type SellerDocKey = 'contract' | 'receipts' | 'statement' | 'passport'

export type UploadedDocEntry = {
  url: string
  name: string
  uploaded_at: string
  status?: string
}

function isImageFileUrl(url?: string, name?: string) {
  const target = `${url || ''} ${name || ''}`.toLowerCase()
  if (target.includes('.pdf')) return false
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)/i.test(target) || Boolean(url)
}

function StepValidationBanner({
  missingFields,
  prefixText,
}: {
  missingFields: string[]
  prefixText: string
}) {
  if (!missingFields.length) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-start text-xs leading-relaxed text-red-800 shadow-2xs"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      <div>
        <strong className="font-extrabold">{prefixText} </strong>
        <span className="font-bold">{missingFields.join(' ، ')}</span>
      </div>
    </div>
  )
}

export function SellerFlow() {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const valDict = s.validation as Record<string, any>

  const localizedDeliveries = getLocalizedDeliveries(dict, locale)
  const localizedUnitTypes = getLocalizedUnitTypes(dict, locale)

  const [step, setStep] = useState(1)
  const [isMagicResume, setIsMagicResume] = useState(false)
  const [unitId, setUnitId] = useState<string>('')
  const [orderRef, setOrderRef] = useState<string>('AE-X5QUKE')

  const [form, setForm] = useState<Record<string, string>>({
    countryCode: DEFAULT_PHONE_CODE,
    unitCountry: ACTIVE_PLATFORM_COUNTRY,
    contractMonth: '',
    contractYear: '',
    deliveryRemainingMonths: '',
    remainingMonths: '',
    annualInstallmentAmount: '',
    overdueTotal: '',
  })
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [unitDocs, setUnitDocs] = useState<Record<string, UploadedDocEntry>>({})
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{
    url: string
    title: string
  } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      unitCountry: ACTIVE_PLATFORM_COUNTRY,
    }))

    async function initFlow() {
      const profileRes = await getCurrentSellerProfileAction()
      if (profileRes.isLoggedIn && profileRes.user) {
        setLoggedUser(profileRes.user)
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const magicToken = params.get('magic')
        const editUnitId = params.get('editUnitId') || params.get('resume')
        const isNewUnit = params.get('new') === '1'
        const targetStep = Number(params.get('step')) || 3

        const parseSavedDelivery = (rawStatus?: string | null) => {
          const str = String(rawStatus || '')
          const monthsMatch =
            str.match(/(\d+)\s*(?:months|شهر|мес|თვე)/i) ||
            str.match(/\((\d+)\)/)
          const baseStatus = str.replace(/\s*\([^)]*\)/g, '').trim()
          return {
            baseStatus: baseStatus || localizedDeliveries[0],
            delMonths: monthsMatch ? monthsMatch[1] : '',
          }
        }

        const hydrateUnitIntoState = (u: any, stepToOpen: number) => {
          const meta =
            u.documents && typeof u.documents === 'object'
              ? u.documents.__unit_meta || {}
              : {}

          const parsedDel = parseSavedDelivery(
            u.delivery_status || meta.delivery_status
          )
          setUnitId(String(u.id))
          setOrderRef(
            `AE-${String(u.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
          )
          setForm((prev) => ({
            ...prev,
            unitCountry: ACTIVE_PLATFORM_COUNTRY,
            developer: u.developer_name || '',
            developerDetails: u.developer_name || '',
            project: u.project_name || '',
            projectDetails: u.project_name || '',
            location: u.area || meta.area || '',
            areaSize: u.size || meta.size ? String(u.size || meta.size) : '',
            garden:
              u.garden_size || meta.garden_size
                ? String(u.garden_size || meta.garden_size)
                : '',
            rooms: u.rooms || meta.rooms ? String(u.rooms || meta.rooms) : '',
            bathrooms:
              u.bathrooms || meta.bathrooms
                ? String(u.bathrooms || meta.bathrooms)
                : '',
            floor:
              u.floor_number !== null && u.floor_number !== undefined
                ? String(u.floor_number)
                : meta.floor_number
                  ? String(meta.floor_number)
                  : '',
            description: u.description || '',
            contractPrice: u.contract_price ? String(u.contract_price) : '',
            contractPrice2: u.contract_price ? String(u.contract_price) : '',
            paidAmount: u.paid_amount ? String(u.paid_amount) : '',
            paidAmount2: u.paid_amount ? String(u.paid_amount) : '',
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
                : meta.years_left
                  ? String(meta.years_left)
                  : '',
            contractMonth:
              u.contract_month || meta.contract_month
                ? String(u.contract_month || meta.contract_month)
                : '',
            contractYear:
              u.contract_year || meta.contract_year
                ? String(u.contract_year || meta.contract_year)
                : '',
            deliveryRemainingMonths:
              u.delivery_month || meta.delivery_month
                ? String(u.delivery_month || meta.delivery_month)
                : parsedDel.delMonths,
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
            name: u.name || profileRes.user?.name || '',
            phone: u.phone || profileRes.user?.phone || '',
            email: u.email || profileRes.user?.email || '',
            owner: 'yes',
            confirmed: 'yes',
          }))
          setSelected({
            type:
              u.unit_type || meta.unit_type
                ? [u.unit_type || meta.unit_type]
                : [],
            finishing:
              u.finishing || meta.finishing
                ? [u.finishing || meta.finishing]
                : [],
            delivery: parsedDel.baseStatus ? [parsedDel.baseStatus] : [],
            features:
              Array.isArray(u.features) && u.features.length > 0
                ? u.features
                : Array.isArray(meta.features)
                  ? meta.features
                  : [],
            year:
              u.contract_year || meta.contract_year
                ? [String(u.contract_year || meta.contract_year)]
                : [],
            frequency:
              u.installment_frequency || meta.installment_frequency
                ? [u.installment_frequency || meta.installment_frequency]
                : [],
            annualInstallment: [u.has_annual_installment ? 'yes' : 'no'],
            discountOffer: [u.willing_to_discount ? 'yes' : 'no'],
            overdueInstallments: [u.has_overdue_installments ? 'yes' : 'no'],
          })
          if (Array.isArray(u.images)) {
            setImages(u.images)
          }
          if (u.documents && typeof u.documents === 'object') {
            const rawDocs = { ...u.documents }
            delete rawDocs.__unit_meta
            if (rawDocs.national_id && !rawDocs.passport) {
              rawDocs.passport = rawDocs.national_id
              delete rawDocs.national_id
            }
            setUnitDocs(rawDocs)
          }
          setIsMagicResume(true)
          setStep(stepToOpen)
        }

        if (magicToken) {
          const res = await verifyMagicTokenAction(magicToken)
          if (res.valid && res.unit) {
            hydrateUnitIntoState(res.unit, 3)
            return
          }
        }

        if (editUnitId) {
          const supabase = createClient()
          const { data: u } = await supabase
            .from('sell_requests')
            .select('*')
            .eq('id', editUnitId)
            .maybeSingle()

          if (u) {
            hydrateUnitIntoState(u, targetStep)
            return
          }
        }

        if (isNewUnit && profileRes.isLoggedIn && profileRes.user) {
          setForm((prev) => ({
            ...prev,
            unitCountry: ACTIVE_PLATFORM_COUNTRY,
            name: profileRes.user?.name || '',
            phone: profileRes.user?.phone || '',
            email: profileRes.user?.email || '',
            owner: 'yes',
            confirmed: 'yes',
          }))
          setIsMagicResume(false)
          setStep(1)
        }
      }
    }

    initFlow()
  }, [])

  const update = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setMissingFieldsList([])
  }

  const toggle = (group: string, value: string) => {
    setErrors((current) => ({ ...current, [group]: '' }))
    setMissingFieldsList([])
    setSelected((current) => ({
      ...current,
      [group]: [
        'annualInstallment',
        'discountOffer',
        'overdueInstallments',
        'type',
        'finishing',
        'delivery',
        'year',
        'frequency',
      ].includes(group)
        ? [value]
        : current[group]?.includes(value)
          ? current[group].filter((item) => item !== value)
          : [...(current[group] ?? []), value],
    }))
  }

  const cleanFieldLabel = (raw?: string) =>
    String(raw || '')
      .replace(/\*/g, '')
      .replace(/:/g, '')
      .trim()

  const composeDeliveryStatus = () => {
    const base = selected.delivery?.[0] || ''
    const delMonths = toEnglishDigits(form.deliveryRemainingMonths || '').trim()
    const monthsWord =
      (s.reviewStep as Record<string, any>)?.monthsUnit || 'شهر'
    if (
      isUnderConstructionDeliveryOption(base) &&
      delMonths &&
      Number(delMonths) > 0
    ) {
      return `${base} (${delMonths} ${monthsWord})`
    }
    return base
  }

  const go = (next: number) => {
    if (next <= step) {
      setMissingFieldsList([])
      return setStep(next)
    }

    const amount = (key: string) =>
      Number(toEnglishDigits(form[key] ?? '').replace(/,/g, '')) || 0
    const nextErrors: Record<string, string> = {}
    const missingNames: string[] = []
    const tBasic = s.basicStep
    const tDetails = s.detailsStep as Record<string, any>
    const tPricing = s.pricingStep as Record<string, any>

    if (step === 1) {
      if (!form.developer) {
        nextErrors.developer = s.validation.required
        missingNames.push(cleanFieldLabel(tBasic.developer))
      }
      if (!form.project) {
        nextErrors.project = s.validation.required
        missingNames.push(cleanFieldLabel(tBasic.project))
      }
      if (!form.contractPrice) {
        nextErrors.contractPrice = s.validation.required
        missingNames.push(cleanFieldLabel(tBasic.contractPrice))
      }
      if (!form.paidAmount) {
        nextErrors.paidAmount = s.validation.required
        missingNames.push(cleanFieldLabel(tBasic.paidAmount))
      }
      if (form.confirmed !== 'yes') {
        nextErrors.confirmed = s.validation.confirmRequired
        missingNames.push(cleanFieldLabel(tBasic.confirmLabel))
      }
      if (amount('paidAmount') > amount('contractPrice')) {
        nextErrors.paidAmount = s.validation.paidExceedsContract
        if (!missingNames.includes(cleanFieldLabel(tBasic.paidAmount))) {
          missingNames.push(cleanFieldLabel(tBasic.paidAmount))
        }
      }
    }

    if (step === 3) {
      if (isMagicResume) {
        if (!form.developerDetails && !form.developer) {
          nextErrors.developerDetails = s.validation.required
          missingNames.push(cleanFieldLabel(tBasic.developer))
        }
        if (!form.projectDetails && !form.project) {
          nextErrors.projectDetails = s.validation.required
          missingNames.push(cleanFieldLabel(tBasic.project))
        }
      }
      if (!form.location) {
        nextErrors.location = s.validation.required
        missingNames.push(
          cleanFieldLabel(
            tDetails.georgiaLocationLabel || tDetails.locationLabelPrefix
          )
        )
      }
      if (!selected.type?.[0]) {
        nextErrors.type = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.unitTypeLabel))
      }
      if (!form.areaSize) {
        nextErrors.areaSize = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.areaSizeLabel))
      }
      if (!form.rooms) {
        nextErrors.rooms = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.roomsLabel))
      }
      if (!form.bathrooms) {
        nextErrors.bathrooms = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.bathroomsLabel))
      }
      if (selected.type?.[0] === localizedUnitTypes[0] && !form.floor) {
        nextErrors.floor = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.floorLabel))
      }
      if (!selected.finishing?.[0]) {
        nextErrors.finishing = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.finishingLabel))
      }
      if (!selected.delivery?.[0]) {
        nextErrors.delivery = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.deliveryLabel))
      } else if (
        isUnderConstructionDeliveryOption(selected.delivery?.[0]) &&
        (!form.deliveryRemainingMonths ||
          form.deliveryRemainingMonths.trim() === '')
      ) {
        nextErrors.deliveryDate = s.validation.required
        missingNames.push(
          cleanFieldLabel(
            tDetails.deliveryMonthsLabel || tDetails.deliveryDateLabel
          )
        )
      }
      if (!form.description) {
        nextErrors.description = s.validation.required
        missingNames.push(cleanFieldLabel(tDetails.descriptionLabel))
      }
    }

    if (step === 4) {
      const resolvedContractYear = form.contractYear || selected.year?.[0] || ''
      if (isMagicResume && !form.contractPrice) {
        nextErrors.contractPrice = s.validation.required
        missingNames.push(cleanFieldLabel(tBasic.contractPrice))
      }
      if (!form.contractMonth || !resolvedContractYear) {
        nextErrors.year = s.validation.required
        missingNames.push(
          cleanFieldLabel(
            tPricing.contractMonthYearLabel || tPricing.contractYearLabel
          )
        )
      }
      if (isMagicResume && !form.paidAmount) {
        nextErrors.paidAmount = s.validation.required
        missingNames.push(cleanFieldLabel(tBasic.paidAmount))
      }
      if (!form.marketPrice && !form.currentDeveloperPrice) {
        nextErrors.marketPrice = s.validation.required
        missingNames.push(cleanFieldLabel(tPricing.marketPriceLabel))
      }
      if (!form.installment) {
        nextErrors.installment = s.validation.required
        missingNames.push(cleanFieldLabel(tPricing.installmentLabel))
      }
      if (!selected.frequency?.[0]) {
        nextErrors.frequency = s.validation.selectFrequency
        missingNames.push(cleanFieldLabel(tPricing.frequencyLabel))
      }
      if (
        form.remainingMonths === undefined ||
        form.remainingMonths.trim() === ''
      ) {
        nextErrors.remainingMonths = s.validation.required
        missingNames.push(
          cleanFieldLabel(
            tPricing.remainingMonthsLabel || tPricing.remainingYearsLabel
          )
        )
      }
      if (!selected.annualInstallment?.[0]) {
        nextErrors.annualInstallment = s.validation.selectYesNo
        missingNames.push(cleanFieldLabel(tPricing.annualInstallmentQuestion))
      }
      if (!selected.discountOffer?.[0]) {
        nextErrors.discountOffer = s.validation.selectYesNo
        missingNames.push(cleanFieldLabel(tPricing.discountQuestion))
      }
      if (!selected.overdueInstallments?.[0]) {
        nextErrors.overdueInstallments = s.validation.selectYesNo
        missingNames.push(cleanFieldLabel(tPricing.overdueQuestion))
      }
      if (amount('paidAmount') > amount('contractPrice')) {
        nextErrors.paidAmount = s.validation.paidExceedsContract
        if (!missingNames.includes(cleanFieldLabel(tBasic.paidAmount))) {
          missingNames.push(cleanFieldLabel(tBasic.paidAmount))
        }
      }
      if (amount('installment') > amount('contractPrice')) {
        nextErrors.installment = s.validation.paidExceedsContract
        if (
          !missingNames.includes(cleanFieldLabel(tPricing.installmentLabel))
        ) {
          missingNames.push(cleanFieldLabel(tPricing.installmentLabel))
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMissingFieldsList(missingNames)
      return
    }

    setErrors({})
    setMissingFieldsList([])

    if (next === 3)
      setForm((current) => ({
        ...current,
        developerDetails: current.developerDetails || current.developer,
        projectDetails: current.projectDetails || current.project,
      }))
    if (next === 4)
      setForm((current) => ({
        ...current,
        contractPrice2: current.contractPrice,
        paidAmount2: current.paidAmount,
        marketPrice:
          current.marketPrice ||
          current.currentDeveloperPrice ||
          current.contractPrice,
      }))

    setStep(next)
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

      let publicUrl = `https://storage.aqarexit.com/${path}`
      if (!uploadErr) {
        publicUrl = supabase.storage.from('unit-images').getPublicUrl(path)
          .data.publicUrl
      }

      const newEntry: UploadedDocEntry = {
        url: publicUrl,
        name: file.name,
        uploaded_at: new Date().toLocaleDateString('en-GB'),
        status: 'pending_review',
      }

      setUnitDocs((prev) => ({
        ...prev,
        [docKey]: newEntry,
      }))

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
      if (unitId) {
        await deleteUnitDocumentAction({ unitId, docKey })
      }
    } finally {
      setUploadingDocKey(null)
    }
  }

  const saveProgress = async () => {
    const data = new FormData()
    const put = (key: string, value?: string) => {
      if (value !== undefined && value !== '') data.set(key, value)
    }
    if (unitId) put('unit_id', unitId)
    put('country', ACTIVE_PLATFORM_COUNTRY)
    put('developer_name', form.developerDetails || form.developer)
    put('project_name', form.projectDetails || form.project)
    put('area', form.location)
    put('unit_type', selected.type?.[0])
    put('size', form.areaSize)
    put('garden_size', form.garden)
    put('rooms', form.rooms)
    put('bathrooms', form.bathrooms)
    put('floor_number', form.floor)
    put('finishing', selected.finishing?.[0])
    put('delivery_status', composeDeliveryStatus())
    put('delivery_month', form.deliveryRemainingMonths)
    selected.features?.forEach((f) => data.append('feature', f))
    put('description', form.description)
    put('contract_price', form.contractPrice2 || form.contractPrice)
    put('paid_amount', form.paidAmount2 || form.paidAmount)
    put(
      'market_price',
      form.marketPrice || form.currentDeveloperPrice || form.contractPrice
    )
    put('installment_amount', form.installment)
    put('installment_frequency', selected.frequency?.[0])
    put('contract_month', form.contractMonth)
    put('contract_year', form.contractYear || selected.year?.[0])
    put('years_left', form.remainingMonths)
    if (selected.annualInstallment?.[0] === 'yes') {
      data.set('has_annual_installment', 'on')
    }
    put('annual_installment_amount', form.annualInstallmentAmount)
    if (selected.discountOffer?.[0] === 'yes') {
      data.set('willing_to_discount', 'on')
    }
    put('discount_amount', form.discountAmount)
    if (selected.overdueInstallments?.[0] === 'yes') {
      data.set('has_overdue_installments', 'on')
    }
    put('overdue_installments', form.overdueCount)
    put('overdue_total_amount', form.overdueTotal)
    if (Object.keys(unitDocs).length > 0) {
      put('documents_json', JSON.stringify(unitDocs))
    }
    images.forEach((image) => data.append('image', image))

    const result = await saveSellProgress(data)
    if (result.success) {
      if (result.unitId) setUnitId(result.unitId)
      router.push('/account')
    } else {
      setError(result.error ?? s.validation.saveFailed)
    }
  }

  const submit = () => {
    const data = new FormData()
    const setValue = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== '') data.set(key, String(value))
    }
    const selectedValue = (group: string) => selected[group]?.[0] ?? ''
    const setList = (key: string, values: string[] | undefined) =>
      values?.forEach((value) => data.append(key, value))
    const setToggle = (key: string, group: string) => {
      if (selected[group]?.[0] === 'yes') data.set(key, 'on')
    }

    if (unitId) setValue('unit_id', unitId)
    setValue('country', ACTIVE_PLATFORM_COUNTRY)
    setValue('developer_name', form.developerDetails || form.developer)
    setValue('project_name', form.projectDetails || form.project)
    setValue('area', form.location)
    setValue('unit_type', selected.type?.join(', '))
    setValue('size', form.areaSize)
    setValue('contract_price', form.contractPrice2 || form.contractPrice)
    setValue('paid_amount', form.paidAmount2 || form.paidAmount)
    setValue(
      'market_price',
      form.marketPrice || form.currentDeveloperPrice || form.contractPrice
    )
    setValue('installment_amount', form.installment)
    setValue('years_left', form.remainingMonths)
    setValue('garden_size', form.garden)
    setValue('rooms', form.rooms)
    setValue('bathrooms', form.bathrooms)
    setValue('floor_number', form.floor)
    setValue('finishing', selectedValue('finishing'))
    setValue('delivery_status', composeDeliveryStatus())
    setValue('delivery_month', form.deliveryRemainingMonths)
    setList('feature', selected.features)
    setValue('description', form.description)
    setValue('contract_month', form.contractMonth)
    setValue('contract_year', form.contractYear || selectedValue('year'))
    setValue('installment_frequency', selectedValue('frequency'))
    setToggle('has_annual_installment', 'annualInstallment')
    setValue('annual_installment_amount', form.annualInstallmentAmount)
    setToggle('willing_to_discount', 'discountOffer')
    setToggle('has_overdue_installments', 'overdueInstallments')
    setValue('discount_amount', form.discountAmount)
    setValue('overdue_installments', form.overdueCount)
    setValue('overdue_total_amount', form.overdueTotal)
    if (Object.keys(unitDocs).length > 0) {
      setValue('documents_json', JSON.stringify(unitDocs))
    }
    setValue('name', form.name || loggedUser?.name || '')
    const cleanPhone = toEnglishDigits(form.phone || '').trim()
    setValue(
      'phone',
      cleanPhone
        ? cleanPhone.startsWith('+')
          ? cleanPhone
          : `+${(form.countryCode ?? DEFAULT_PHONE_CODE).replace('+', '')}${cleanPhone.replace(/^0+/, '')}`
        : loggedUser?.phone || ''
    )
    setValue('email', form.email || loggedUser?.email)
    setValue('password', form.password)
    setValue('is_original_owner', form.owner === 'yes' ? 'on' : '')
    setValue('is_confirmed', form.confirmed === 'yes' ? 'on' : '')
    setList('image', images)
    setError('')

    startTransition(async () => {
      const result = await submitSellRequest(data)
      if (result.success) {
        if (result.unitId) setUnitId(result.unitId)
        if (result.orderRef) setOrderRef(result.orderRef)
        setSubmitted(true)
      } else {
        setError(result.error ?? s.validation.submitFailed)
      }
    })
  }

  const totalStepsCount = isMagicResume ? 4 : 6
  const currentDisplayStep = isMagicResume ? Math.max(1, step - 2) : step
  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )
  const missingBannerPrefix =
    valDict.missingBannerPrefix || valDict.required || ''

  const realDocsCount = ['contract', 'receipts', 'statement', 'passport'].filter(
    (k) => Boolean(unitDocs[k]?.url)
  ).length

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-3 py-8 text-[var(--brand-navy-text,#0a1128)] sm:px-5 md:py-12"
    >
      <div className="mx-auto max-w-3xl">
        {!submitted && (
          <ScrollReveal>
            <header className="mb-7 text-center">
              <h1 className="text-3xl font-black tracking-tight text-[#123c35] sm:text-4xl">
                {isMagicResume ? s.header.resumeTitle : s.header.mainTitle}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {isMagicResume ? s.header.resumeDesc : s.header.mainDesc}
              </p>
            </header>
          </ScrollReveal>
        )}

        {step <= 2 && !isMagicResume && !submitted && (
          <ScrollReveal delay={70}>
            <div className="mb-4 grid gap-3">
              {s.header.highlights.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-xl border bg-white px-5 py-3 text-sm ${
                    index === 3
                      ? 'border-teal-300 bg-emerald-50 font-bold text-teal-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Check className="size-4 shrink-0 text-teal-700" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mb-7 rounded-xl border border-slate-500 bg-transparent px-5 py-4 text-center text-sm font-semibold">
              {s.header.ownersOnlyBanner}
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={120}>
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-6 md:p-7">
              {!submitted && (
                <div className="mb-6 rounded-2xl border border-slate-600 px-4 py-4 text-center text-sm leading-7">
                  <div className="mb-1 flex items-center justify-center gap-2 font-bold">
                    <UserRound className="size-4" />{' '}
                    {s.header.ownersOnlyCardTitle}
                  </div>
                  {s.header.ownersOnlyCardDesc}
                </div>
              )}

              {!submitted && (
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex flex-1 gap-1.5">
                    {Array.from({ length: totalStepsCount }, (_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 flex-1 rounded-full ${
                          index < currentDisplayStep
                            ? 'bg-teal-700'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className="shrink-0 rounded-full bg-slate-100 text-slate-700">
                    {s.header.stepWord} {currentDisplayStep} {s.header.ofWord}{' '}
                    {totalStepsCount}
                  </Badge>
                </div>
              )}

              {!submitted && (
                <h2 className="mb-6 text-2xl font-black text-[#102238]">
                  {s.header.stepTitles[step - 1]}
                </h2>
              )}

              {step === 1 && (
                <BasicStep
                  form={form}
                  update={update}
                  go={go}
                  errors={errors}
                  missingFields={missingFieldsList}
                  missingPrefix={missingBannerPrefix}
                />
              )}
              {step === 2 && (
                <ContactStep
                  form={form}
                  update={update}
                  go={go}
                  errors={errors}
                  setErrors={setErrors}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  loggedUser={loggedUser}
                  unitId={unitId}
                  setUnitId={setUnitId}
                  setOrderRef={setOrderRef}
                />
              )}
              {step === 3 && (
                <DetailsStep
                  form={form}
                  update={update}
                  selected={selected}
                  toggle={toggle}
                  go={go}
                  errors={errors}
                  showBasicFields={isMagicResume}
                  missingFields={missingFieldsList}
                  missingPrefix={missingBannerPrefix}
                  onSave={saveProgress}
                />
              )}
              {step === 4 && (
                <PricingStep
                  form={form}
                  update={update}
                  selected={selected}
                  toggle={toggle}
                  go={go}
                  errors={errors}
                  setErrors={setErrors}
                  showBasicPriceFields={isMagicResume}
                  missingFields={missingFieldsList}
                  missingPrefix={missingBannerPrefix}
                  onSave={saveProgress}
                />
              )}
              {step === 5 && (
                <PhotosStep
                  go={go}
                  images={images}
                  setImages={setImages}
                  uploading={uploading}
                  setUploading={setUploading}
                  unitDocs={unitDocs}
                  uploadingDocKey={uploadingDocKey}
                  onUploadDoc={handleUploadUnitDocument}
                  onRemoveDoc={handleRemoveUnitDocument}
                  onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
                  onSave={saveProgress}
                />
              )}
              {step === 6 && (
                <ReviewStep
                  form={form}
                  selected={selected}
                  pending={pending}
                  submitted={submitted}
                  error={error}
                  submit={submit}
                  go={go}
                  onSave={saveProgress}
                  imagesLength={images.length}
                  docsCount={realDocsCount}
                  orderRef={orderRef}
                  unitId={unitId}
                />
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        {step <= 2 && !submitted && (
          <ScrollReveal delay={160}>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-[var(--brand-navy,#0a1122)] px-5 py-4 text-sm text-white">
              <span>{s.header.whatsappBarText}</span>
              <a
                href={`https://wa.me/${supportWhatsApp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-green-500 px-4 py-2 font-bold text-white"
              >
                {s.header.whatsappBarBtn}
              </a>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* نافذة تكبير الصورة (Lightbox) عند الضغط على الصورة المصغرة */}
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

function BasicStep({
  form,
  update,
  go,
  errors,
  missingFields,
  missingPrefix,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  missingFields: string[]
  missingPrefix: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const t = s.basicStep
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)

  return (
    <div className="flex flex-col gap-6">
      <Field
        error={errors.developer}
        label={t.developer}
        id="developer"
        value={form.developer}
        update={(value) => {
          update('developer', value)
          update('developerDetails', value)
        }}
      />
      <Field
        error={errors.project}
        label={t.project}
        id="project"
        value={form.project}
        update={(value) => {
          update('project', value)
          update('projectDetails', value)
        }}
      />
      <MoneyField
        error={errors.contractPrice}
        label={t.contractPrice}
        value={form.contractPrice}
        currencySymbol={currency}
        update={(value) => {
          update('contractPrice', value)
          update('contractPrice2', value)
        }}
      />
      <MoneyField
        error={errors.paidAmount}
        label={t.paidAmount}
        value={form.paidAmount}
        currencySymbol={currency}
        update={(value) => {
          update('paidAmount', value)
          update('paidAmount2', value)
        }}
      />
      <div className="rounded-xl bg-sky-50 p-4 text-sm font-semibold text-sky-700">
        {t.receiveBoxPrefix}{' '}
        <span dir="ltr">
          {Number(toEnglishDigits(form.paidAmount || '0')).toLocaleString(
            'en-US'
          )}
        </span>{' '}
        {currency} {t.receiveBoxSuffix}
      </div>
      <div>
        <label
          dir={dir}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-start text-sm leading-7 ${
            errors.confirmed
              ? 'border-red-500 bg-red-50/30'
              : 'border-slate-200'
          }`}
        >
          <Checkbox
            className="m-0 shrink-0"
            checked={form.confirmed === 'yes'}
            onCheckedChange={(checked) =>
              update('confirmed', checked ? 'yes' : '')
            }
          />
          {t.confirmLabel}
        </label>
        {errors.confirmed && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.confirmed}
          </p>
        )}
      </div>
      <Field
        label={t.currentDevPrice}
        id="currentDeveloperPrice"
        type="number"
        helper={
          form.currentDeveloperPrice
            ? formatAmount(form.currentDeveloperPrice, currency, locale)
            : t.currentDevPriceHelper
        }
        value={form.currentDeveloperPrice}
        update={(value) => {
          update('currentDeveloperPrice', value)
          if (!form.marketPrice) update('marketPrice', value)
        }}
      />
      <TurnstileBox />

      <StepValidationBanner
        missingFields={missingFields}
        prefixText={missingPrefix}
      />

      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
        onClick={() => go(2)}
      >
        {s.shared.nextBtn}
      </Button>
    </div>
  )
}

function DetailsStep({
  form,
  update,
  selected,
  toggle,
  go,
  errors,
  showBasicFields,
  missingFields,
  missingPrefix,
  onSave,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  showBasicFields: boolean
  missingFields: string[]
  missingPrefix: string
  onSave: () => void
}) {
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const t = s.detailsStep as Record<string, any>

  const localizedUnitTypes = getLocalizedUnitTypes(dict, locale)
  const localizedFinishings = getLocalizedFinishings(dict, locale)
  const localizedDeliveries = getLocalizedDeliveries(dict, locale)
  const localizedFeatures = getLocalizedFeatures(dict, locale)

  const chosenDelivery = selected.delivery?.[0] || ''
  const needsDeliveryMonths = isUnderConstructionDeliveryOption(chosenDelivery)

  return (
    <div className="flex flex-col gap-6">
      {showBasicFields && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.developerDetails}
            label={s.basicStep.developer}
            id="developerDetails"
            value={form.developerDetails ?? form.developer}
            update={(value) => {
              update('developerDetails', value)
              update('developer', value)
            }}
          />
          <Field
            error={errors.projectDetails}
            label={s.basicStep.project}
            id="projectDetails"
            value={form.projectDetails ?? form.project}
            update={(value) => {
              update('projectDetails', value)
              update('project', value)
            }}
          />
        </div>
      )}

      {/* القائمة المنسدلة الموحدة لمناطق جورجيا من @/components/shared/georgia-areas */}
      <GeorgiaAreaSelect
        label={t.georgiaLocationLabel || `${t.locationLabelPrefix} *`}
        value={form.location ?? ''}
        onChange={(area) => update('location', area)}
        error={errors.location}
        placeholder={t.georgiaLocationPlaceholder}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">
          <RequiredLabel>{t.unitTypeLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.type}
          items={localizedUnitTypes}
          selected={selected.type ?? []}
          onToggle={(value) => toggle('type', value)}
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Field
          error={errors.areaSize}
          label={t.areaSizeLabel}
          id="areaSize"
          type="number"
          value={form.areaSize}
          update={(value) => update('areaSize', value)}
        />
        <Field
          label={t.gardenLabel}
          id="garden"
          type="number"
          value={form.garden}
          update={(value) => update('garden', value)}
        />
        <Field
          error={errors.rooms}
          label={t.roomsLabel}
          id="rooms"
          type="number"
          value={form.rooms}
          update={(value) => update('rooms', value)}
        />
        <Field
          error={errors.bathrooms}
          label={t.bathroomsLabel}
          id="bathrooms"
          type="number"
          value={form.bathrooms}
          update={(value) => update('bathrooms', value)}
        />
      </div>

      {selected.type?.[0] === localizedUnitTypes[0] && (
        <Field
          error={errors.floor}
          label={t.floorLabel}
          id="floor"
          type="number"
          helper={t.floorHelper}
          value={form.floor}
          update={(value) => update('floor', value)}
        />
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">
          <RequiredLabel>{t.finishingLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.finishing}
          items={localizedFinishings}
          selected={selected.finishing ?? []}
          onToggle={(value) => toggle('finishing', value)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">
          <RequiredLabel>{t.deliveryLabel}</RequiredLabel>
        </legend>
        <Pills
          error={errors.delivery}
          items={localizedDeliveries}
          selected={selected.delivery ?? []}
          onToggle={(value) => {
            toggle('delivery', value)
            if (isReadyDeliveryOption(value)) {
              update('deliveryRemainingMonths', '0')
            }
          }}
        />
      </fieldset>

      {needsDeliveryMonths && (
        <Field
          error={errors.deliveryDate}
          label={t.deliveryMonthsLabel || t.deliveryDateLabel}
          id="deliveryRemainingMonths"
          type="number"
          helper={t.deliveryMonthsHelper || t.deliveryDateHelper}
          value={form.deliveryRemainingMonths}
          update={(value) => update('deliveryRemainingMonths', value)}
        />
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-start font-bold">{t.featuresLabel}</legend>
        <Pills
          items={localizedFeatures}
          selected={selected.features ?? []}
          onToggle={(value) => toggle('features', value)}
          multi
        />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-start">
          <RequiredLabel>{t.descriptionLabel}</RequiredLabel>
        </Label>
        <Textarea
          id="description"
          dir={dir}
          value={form.description ?? ''}
          onChange={(event) => update('description', event.target.value)}
          className={`min-h-32 rounded-xl text-start ${
            errors.description ? 'border-red-500 bg-red-50/20' : ''
          }`}
        />
        {errors.description && (
          <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <StepValidationBanner
        missingFields={missingFields}
        prefixText={missingPrefix}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(4)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

function PricingStep({
  form,
  update,
  selected,
  toggle,
  go,
  errors,
  setErrors,
  showBasicPriceFields,
  missingFields,
  missingPrefix,
  onSave,
}: {
  form: Record<string, string>
  update: (key: string, value: string) => void
  selected: Record<string, string[]>
  toggle: (group: string, value: string) => void
  go: (step: number) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  showBasicPriceFields: boolean
  missingFields: string[]
  missingPrefix: string
  onSave: () => void
}) {
  const { t: dict, locale } = useTranslation()
  const s = dict.sell
  const t = s.pricingStep as Record<string, any>
  const yes = (group: string) => selected[group]?.[0] === 'yes'
  const setAnswer = (group: string, value: string) => toggle(group, value)
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)

  return (
    <div className="flex flex-col gap-6">
      {showBasicPriceFields && (
        <>
          <MoneyField
            error={errors.contractPrice}
            label={s.basicStep.contractPrice}
            value={form.contractPrice ?? form.contractPrice2}
            currencySymbol={currency}
            update={(value) => {
              update('contractPrice', value)
              update('contractPrice2', value)
            }}
          />

          <MoneyField
            error={errors.paidAmount}
            label={s.basicStep.paidAmount}
            value={form.paidAmount ?? form.paidAmount2}
            currencySymbol={currency}
            update={(value) => {
              update('paidAmount', value)
              update('paidAmount2', value)
            }}
          />
        </>
      )}

      <MonthYearSelector
        label={t.contractMonthYearLabel || t.contractYearLabel}
        monthValue={form.contractMonth || ''}
        yearValue={form.contractYear || selected.year?.[0] || ''}
        yearsList={years}
        error={errors.year}
        onMonthChange={(m) => {
          update('contractMonth', m)
          setErrors((curr) => ({ ...curr, year: '' }))
        }}
        onYearChange={(y) => {
          update('contractYear', y)
          toggle('year', y)
          setErrors((curr) => ({ ...curr, year: '' }))
        }}
      />

      {(!form.currentDeveloperPrice || showBasicPriceFields) && (
        <MoneyField
          error={errors.marketPrice}
          label={t.marketPriceLabel}
          value={form.marketPrice}
          currencySymbol={currency}
          update={(value) => update('marketPrice', value)}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyField
          error={errors.installment}
          label={t.installmentLabel}
          value={form.installment}
          currencySymbol={currency}
          update={(value) => update('installment', value)}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="text-start font-bold">
            <RequiredLabel>{t.frequencyLabel}</RequiredLabel>
          </legend>
          <Pills
            error={errors.frequency}
            items={t.frequencies}
            selected={selected.frequency ?? []}
            onToggle={(value) => toggle('frequency', value)}
          />
        </fieldset>
      </div>

      <Field
        error={errors.remainingMonths}
        label={t.remainingMonthsLabel || `${t.remainingYearsLabel} *`}
        id="remainingMonths"
        type="number"
        helper={t.remainingMonthsHelper || t.remainingYearsHelper}
        value={form.remainingMonths}
        update={(value) => update('remainingMonths', value)}
      />

      <ToggleSection
        error={errors.annualInstallment}
        title={t.annualInstallmentQuestion}
        group="annualInstallment"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('annualInstallment') && (
        <MoneyField
          label={t.annualInstallmentAmountLabel}
          value={form.annualInstallmentAmount}
          currencySymbol={currency}
          update={(value) => update('annualInstallmentAmount', value)}
        />
      )}

      <ToggleSection
        error={errors.discountOffer}
        title={t.discountQuestion}
        group="discountOffer"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('discountOffer') && (
        <MoneyField
          label={t.discountAmountLabel}
          value={form.discountAmount}
          currencySymbol={currency}
          update={(value) => update('discountAmount', value)}
        />
      )}

      <ToggleSection
        error={errors.overdueInstallments}
        title={t.overdueQuestion}
        group="overdueInstallments"
        selected={selected}
        toggle={setAnswer}
      />
      {yes('overdueInstallments') && (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Field
            label={t.overdueCountLabel}
            id="overdueCount"
            type="number"
            value={form.overdueCount}
            update={(value) => update('overdueCount', value)}
          />
          <MoneyField
            label={t.overdueTotalLabel}
            value={form.overdueTotal}
            currencySymbol={currency}
            update={(value) => update('overdueTotal', value)}
          />
        </div>
      )}

      <StepValidationBanner
        missingFields={missingFields}
        prefixText={missingPrefix}
      />

      <div className="mt-2 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(3)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(5)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

function PhotosStep({
  go,
  images,
  setImages,
  uploading,
  setUploading,
  unitDocs,
  uploadingDocKey,
  onUploadDoc,
  onRemoveDoc,
  onPreviewDoc,
  onSave,
}: {
  go: (step: number) => void
  images: string[]
  setImages: (images: string[]) => void
  uploading: boolean
  setUploading: (value: boolean) => void
  unitDocs: Record<string, UploadedDocEntry>
  uploadingDocKey: string | null
  onUploadDoc: (docKey: SellerDocKey, files: FileList | null) => void
  onRemoveDoc: (docKey: SellerDocKey) => void
  onPreviewDoc: (url: string, title: string) => void
  onSave: () => void
}) {
  const { t: dict } = useTranslation()
  const s = dict.sell
  const t = s.photosStep as Record<string, any>
  const docDict = dict.accountPages?.documents as Record<string, any>

  const docSections: Array<{ key: SellerDocKey; title: string }> = [
    { key: 'contract', title: docDict?.sections?.contract },
    { key: 'receipts', title: docDict?.sections?.receipts },
    { key: 'statement', title: docDict?.sections?.statement },
    { key: 'passport', title: docDict?.sections?.passport },
  ]

  const uploadedDocsCount = docSections.filter((sec) =>
    Boolean(unitDocs[sec.key]?.url)
  ).length

  const [showDocsBox, setShowDocsBox] = useState(uploadedDocsCount > 0)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    const supabase = createClient()
    const uploaded: string[] = []
    for (const file of Array.from(files).slice(0, 10 - images.length)) {
      const path = `units/${crypto.randomUUID()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        '-'
      )}`
      const result = await supabase.storage
        .from('unit-images')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (!result.error)
        uploaded.push(
          supabase.storage.from('unit-images').getPublicUrl(path).data.publicUrl
        )
    }
    setImages([...images, ...uploaded])
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 text-center transition hover:bg-slate-50">
        <ImagePlus className="size-8 text-slate-500" />
        <p className="font-bold">{t.uploadTitle}</p>
        <p className="text-sm text-slate-500">{t.uploadSub}</p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => upload(event.target.files)}
        />
      </label>
      {uploading && (
        <p className="text-start text-sm font-semibold text-teal-700">
          {t.uploadingText}
        </p>
      )}
      {images.length > 0 && (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
            >
              <img
                src={url}
                alt=""
                onClick={() => onPreviewDoc(url, t.uploadTitle)}
                className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() =>
                  setImages(images.filter((_, idx) => idx !== index))
                }
                className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* قسم رفع مستندات الوحدة وصورة جواز السفر */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-start sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  {t.optionalDocsBoxTitle}
                </h3>
                <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-950">
                  {t.optionalNowBadge}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-amber-950/90">
                {t.optionalDocsBoxDesc}
              </p>
            </div>
          </div>

          <span
            dir="ltr"
            className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#007a5a] shadow-2xs"
          >
            {uploadedDocsCount}/4
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDocsBox(true)}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-extrabold transition ${
              showDocsBox
                ? 'bg-[#007a5a] text-white shadow-xs'
                : 'bg-[#0a1122] text-white hover:bg-[#16223f]'
            }`}
          >
            <UploadCloud className="size-4 text-emerald-300" />
            <span>{t.uploadDocsNowBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowDocsBox(false)
              go(6)
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            {t.uploadDocsLaterBtn}
          </button>
        </div>

        {showDocsBox && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-amber-200/80 pt-4 sm:grid-cols-2">
            {docSections.map((sec) => {
              const entry = unitDocs[sec.key]
              const isUploadingThis = uploadingDocKey === sec.key
              const hasDoc = Boolean(entry?.url)
              const isImg = hasDoc && isImageFileUrl(entry.url, entry.name)

              return (
                <div
                  key={sec.key}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#0a1122]">
                      {sec.title}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#007a5a] px-3 text-[11px] font-bold text-white transition hover:bg-[#006248]">
                        {isUploadingThis ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : hasDoc ? (
                          <>
                            <RefreshCw className="size-3" />
                            <span>{docDict?.changeFileBtn}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="size-3" />
                            <span>{docDict?.uploadBtn}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          disabled={isUploadingThis}
                          onChange={(e) => onUploadDoc(sec.key, e.target.files)}
                        />
                      </label>

                      {hasDoc && (
                        <button
                          type="button"
                          onClick={() => onRemoveDoc(sec.key)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title={docDict?.removeFileBtn}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {hasDoc ? (
                    <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-slate-50 p-2">
                      {isImg ? (
                        <button
                          type="button"
                          onClick={() => onPreviewDoc(entry.url, sec.title)}
                          className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <img
                            src={entry.url}
                            alt={sec.title}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                            <Eye className="size-3.5 text-white" />
                          </span>
                        </button>
                      ) : (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-teal-50 text-[10px] font-bold text-teal-800"
                        >
                          <FileText className="size-4" />
                          <span>PDF</span>
                        </a>
                      )}
                      <div className="min-w-0 flex-1 text-start">
                        <p className="truncate text-[11px] font-bold text-[#0a1122]">
                          {entry.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => onPreviewDoc(entry.url, sec.title)}
                          className="mt-0.5 text-[10.5px] font-bold text-[#007a5a] hover:underline"
                        >
                          {docDict?.viewFullImageBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400">
                      {docDict?.emptySection}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(4)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-xl bg-[var(--brand-navy,#0a1122)] font-bold transition active:scale-[0.98]"
          onClick={() => go(6)}
        >
          {s.shared.nextBtn}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}

function ReviewStep({
  form,
  selected,
  pending,
  submitted,
  error,
  submit,
  go,
  onSave,
  imagesLength,
  docsCount,
  orderRef,
  unitId,
}: {
  form: Record<string, string>
  selected: Record<string, string[]>
  pending: boolean
  submitted: boolean
  error: string
  submit: () => void
  go: (step: number) => void
  onSave: () => void
  imagesLength: number
  docsCount: number
  orderRef: string
  unitId: string
}) {
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const t = s.reviewStep as Record<string, any>
  const listSep = dir === 'rtl' ? '، ' : ', '

  const [selectedPromo, setSelectedPromo] = useState<7 | 14 | 30 | null>(null)
  const [fawryCode, setFawryCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [promoPending, startPromoTransition] = useTransition()

  const countryObj = getCountryConfig(ACTIVE_PLATFORM_COUNTRY)
  const currency = getCurrencySymbol(ACTIVE_PLATFORM_COUNTRY, locale)
  const pkgPrices = countryObj.defaultPackages || {
    days7: 29,
    days14: 49,
    days30: 69,
  }

  const dynamicPackages: Array<{
    days: 7 | 14 | 30
    price: number
    label: string
  }> = [
    { days: 7, price: pkgPrices.days7, label: `7 ${t.daysWord}` },
    { days: 14, price: pkgPrices.days14, label: `14 ${t.daysWord}` },
    { days: 30, price: pkgPrices.days30, label: `30 ${t.daysWord}` },
  ]

  const handleSelectPackage = (pkg: {
    days: 7 | 14 | 30
    price: number
    label: string
  }) => {
    setSelectedPromo(pkg.days)
    if (!unitId) {
      setFawryCode(`AD-${Math.floor(100000 + Math.random() * 900000)}`)
      return
    }
    startPromoTransition(async () => {
      const res = await requestUnitPromotionAction({
        unitId,
        days: pkg.days,
        price: pkg.price,
      })
      if (res.success && res.fawryCode) {
        setFawryCode(res.fawryCode)
      }
    })
  }

  if (submitted)
    return (
      <div className="flex flex-col items-center py-4 sm:py-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl text-white shadow-xs">
          ✓
        </div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-2xl">
          {t.successTitle}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500 sm:text-sm">
          {t.successSubtitle}
        </p>

        <span className="mt-3.5 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-700">
          {t.orderRefLabel} <strong className="font-mono">{orderRef}</strong>
        </span>

        <div className="mt-5 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-start sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="flex-1 text-xs leading-relaxed text-amber-950">
              <strong className="block text-sm font-extrabold">
                {t.docsRequiredBannerTitle}
              </strong>
              <p className="mt-1 opacity-90">{t.docsRequiredBannerDesc}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Link
                  href={
                    unitId
                      ? `/account/documents?unitId=${unitId}`
                      : '/account/documents'
                  }
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0a1122] px-5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#16223f]"
                >
                  <UploadCloud className="size-4 text-emerald-300" />
                  <span>{t.uploadDocsNowBtn}</span>
                </Link>
                <Link
                  href="/account"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-xs font-bold text-amber-950 hover:bg-amber-100/60"
                >
                  {s.photosStep?.uploadDocsLaterBtn || t.goToAccountBtn}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 w-full rounded-[20px] border border-[#aae3cb] bg-[#effaf5] p-5 text-start sm:p-6">
          <div className="flex items-center justify-start gap-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)]">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>{t.optionalBadge}</span>
          </div>

          <h3 className="mt-1 text-base font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-lg">
            {t.promoTitle}
          </h3>

          <ul className="mt-3 space-y-2 text-xs font-medium text-[#1e3a34]">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.promoPoint1}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>
                {t.promoPoint2Prefix}{' '}
                <Star className="inline size-3 fill-amber-400 text-amber-500" />{' '}
                {t.promoPoint2Suffix}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-[var(--brand-primary,#007a5a)]" />
              <span>{t.promoPoint3}</span>
            </li>
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
            {dynamicPackages.map((pkg) => {
              const isSelected = selectedPromo === pkg.days
              return (
                <button
                  key={pkg.days}
                  type="button"
                  disabled={promoPending}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`flex flex-col items-center justify-center rounded-2xl border bg-white p-3.5 text-center transition hover:shadow-md sm:p-4 ${
                    isSelected
                      ? 'border-[var(--brand-primary,#007a5a)] ring-2 ring-[var(--brand-primary,#007a5a)]/20'
                      : 'border-gray-200/90 hover:border-[var(--brand-primary,#007a5a)]/50'
                  }`}
                >
                  <span className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-sm">
                    {pkg.label}
                  </span>
                  <span className="mt-1 text-xs font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums sm:text-sm">
                    <span dir="ltr">{pkg.price.toLocaleString('en-US')}</span>{' '}
                    {currency}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-[#2b584d]">
            {t.promoFreeNote}
          </p>

          {promoPending ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white p-3.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              <Loader2 className="size-4 animate-spin" />
              <span>{t.issuingCode}</span>
            </div>
          ) : fawryCode ? (
            <div className="mt-3 rounded-xl border border-[var(--brand-primary,#007a5a)]/30 bg-white p-4 text-start shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
                    {t.adOrderCodeLabel} ({selectedPromo} {t.daysWord}):
                  </p>
                  <p className="mt-1 font-mono text-lg font-black tracking-wider text-[var(--brand-primary,#007a5a)]">
                    {fawryCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(fawryCode)
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-100"
                >
                  <Copy className="size-3.5" />
                  <span>{copiedCode ? t.copiedBtn : t.copyCodeBtn}</span>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                {t.adCodeInstruction}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-white p-3.5 text-[11px] leading-relaxed text-gray-600">
              {t.selectPackageHint}
            </div>
          )}
        </div>

        <Link
          href="/account"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-7 text-xs font-extrabold text-white shadow-sm transition hover:bg-[var(--brand-primary-hover,#006248)] sm:text-sm"
        >
          {t.goToAccountBtn}
        </Link>

        <p className="mt-2.5 text-center text-[11px] text-gray-400">
          {t.editAnytimeNote}
        </p>
      </div>
    )

  const baseDel = selected.delivery?.join(listSep) || '—'
  const deliveryFormatted =
    form.deliveryRemainingMonths && Number(form.deliveryRemainingMonths) > 0
      ? `${baseDel} (${form.deliveryRemainingMonths} ${t.monthsUnit || ''})`
      : baseDel

  const contractDateFormatted =
    form.contractMonth && (form.contractYear || selected.year?.[0])
      ? `${form.contractMonth}/${form.contractYear || selected.year?.[0]}`
      : form.contractYear || selected.year?.[0] || '—'

  const rows = [
    [
      t.rowDevProject,
      `${form.developerDetails || form.developer || '—'} · ${
        form.projectDetails || form.project || '—'
      }`,
    ],
    [t.rowArea, getLocalizedGeorgiaAreaName(form.location, locale)],
    [t.rowType, selected.type?.join(listSep) || '—'],
    [t.rowSize, `${form.areaSize || '—'} ${t.sqmUnit}`],
    [t.rowRoomsBath, `${form.rooms || '—'} / ${form.bathrooms || '—'}`],
    [t.rowFinishing, selected.finishing?.join(listSep) || '—'],
    [t.rowDelivery, deliveryFormatted],
    [
      t.rowContractDate || s.pricingStep.contractYearLabel,
      contractDateFormatted,
    ],
    [
      t.rowRemainingMonths || s.pricingStep.remainingYearsLabel,
      form.remainingMonths
        ? `${form.remainingMonths} ${t.monthsUnit || ''}`
        : '0',
    ],
    [t.rowPhotos, String(imagesLength)],
    [t.rowUploadedDocs || t.docsRequiredBannerTitle, `${docsCount}/4`],
    [
      t.rowContractPrice,
      `${Number(
        toEnglishDigits(form.contractPrice2 || form.contractPrice || '0')
      ).toLocaleString('en-US')} ${currency}`,
    ],
    [
      t.rowPaidAmount,
      `${Number(
        toEnglishDigits(form.paidAmount2 || form.paidAmount || '0')
      ).toLocaleString('en-US')} ${currency}`,
    ],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-4 py-3 text-sm">
            <span className="text-start text-slate-500">{label}</span>
            <strong className="text-end">{value}</strong>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-start text-xs leading-relaxed text-teal-900">
        <div className="flex items-start gap-2.5">
          <FileCheck2 className="mt-0.5 size-4 shrink-0 text-teal-700" />
          <span>{t.docsPreSubmitNote}</span>
        </div>
        <button
          type="button"
          onClick={() => go(5)}
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800"
        >
          {t.uploadDocsNowBtn}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => go(5)}
        >
          {s.shared.backBtn}
        </Button>
        <Button
          type="button"
          disabled={pending || submitted}
          className="h-12 flex-1 rounded-xl bg-teal-700 font-bold transition active:scale-[0.98]"
          onClick={submit}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>{t.submittingBtn}</span>
            </span>
          ) : (
            t.submitFinalBtn
          )}
        </Button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <button
          type="button"
          className="text-center text-sm font-bold text-blue-800 hover:underline"
          onClick={onSave}
        >
          {s.shared.saveLaterBtn}
        </button>
      </div>
    </div>
  )
}