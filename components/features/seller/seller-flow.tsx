'use client'

import { useEffect, useState, useTransition } from 'react'
import { Check, UserRound, X } from 'lucide-react'
import {
  getAuthorizedUnitForEditAction,
  getCurrentSellerProfileAction,
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import {
  ACTIVE_PLATFORM_COUNTRY,
  DEFAULT_PHONE_CODE,
  getSellerExtraLabels,
  type SellerDocKey,
  type UploadedDocEntry,
} from './seller-i18n'
import {
  getLocalizedDeliveries,
  getLocalizedUnitTypes,
  isUnderConstructionDeliveryOption,
  toEnglishDigits,
} from './seller-shared'
import { ContactStep } from './seller-contact-step'
import {
  BasicStep,
  DetailsStep,
  DocumentsStep,
  PhotosStep,
  PricingStep,
} from './seller-form-steps'
import { ReviewStep } from './seller-review-step'

export type { SellerDocKey, UploadedDocEntry }

export function SellerFlow() {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const s = dict.sell
  const valDict = s.validation as Record<string, any>
  const extraT = getSellerExtraLabels(locale, dict)

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

  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      unitCountry: ACTIVE_PLATFORM_COUNTRY,
    }))

    async function initFlow() {
      const [profileRes, verStatus] = await Promise.all([
        getCurrentSellerProfileAction(),
        getUserVerificationStatusAction(),
      ])

      if (profileRes.isLoggedIn && profileRes.user) {
        setLoggedUser(profileRes.user)
      }
      if (verStatus.isLoggedIn) {
        setEmailVerified(verStatus.emailVerified)
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
          const authUnitRes = await getAuthorizedUnitForEditAction(editUnitId)
          if (authUnitRes.allowed && authUnitRes.unit) {
            hydrateUnitIntoState(authUnitRes.unit, targetStep)
            return
          } else {
            router.replace('/account')
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
  }, [router])

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
      (s.reviewStep as Record<string, any>)?.monthsUnit || extraT.monthsUnit
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
            tDetails.georgiaLocationLabel || extraT.georgiaLocationLabel
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
            tDetails.deliveryMonthsLabel || extraT.deliveryMonthsLabel
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
            tPricing.contractMonthYearLabel || extraT.contractMonthYearLabel
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
            tPricing.remainingMonthsLabel || extraT.remainingMonthsLabel
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

    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(result.error ?? s.validation.submitFailed)
      }
    })
  }

  const baseTitles = s.header.stepTitles || []
  const sevenStepTitles = [
    baseTitles[0] || 'البيانات الأساسية',
    baseTitles[1] || 'بيانات التواصل',
    baseTitles[2] || 'تفاصيل الوحدة',
    baseTitles[3] || 'الأسعار والأقساط',
    baseTitles[4] || 'صور الوحدة',
    extraT.docsStepTitle,
    baseTitles[5] || 'مراجعة وإرسال الطلب',
  ]

  const totalStepsCount = isMagicResume ? 5 : 7
  const currentDisplayStep = isMagicResume ? Math.max(1, step - 2) : step
  const supportWhatsApp = String(dict.footer?.phone || '+201018595959').replace(
    /\D/g,
    ''
  )
  const missingBannerPrefix =
    valDict.missingBannerPrefix || valDict.required || ''

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-3 py-8 text-[var(--brand-navy-text,#0a1128)] sm:px-5 md:py-12"
    >
      <div className="mx-auto max-w-3xl">
        {!submitted && (
          <header className="mb-7 text-center">
            <h1 className="text-3xl font-black tracking-tight text-[#123c35] sm:text-4xl">
              {isMagicResume ? s.header.resumeTitle : s.header.mainTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {isMagicResume ? s.header.resumeDesc : s.header.mainDesc}
            </p>
          </header>
        )}

        {step <= 2 && !isMagicResume && !submitted && (
          <div>
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
          </div>
        )}

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
                {sevenStepTitles[step - 1]}
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
                extraT={extraT}
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
                extraT={extraT}
              />
            )}
            {step === 5 && (
              <PhotosStep
                go={go}
                images={images}
                setImages={setImages}
                uploading={uploading}
                setUploading={setUploading}
                onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
                onSave={saveProgress}
              />
            )}
            {step === 6 && (
              <DocumentsStep
                go={go}
                unitDocs={unitDocs}
                uploadingDocKey={uploadingDocKey}
                onUploadDoc={handleUploadUnitDocument}
                onRemoveDoc={handleRemoveUnitDocument}
                onPreviewDoc={(url, title) => setPreviewDoc({ url, title })}
                onSave={saveProgress}
                extraT={extraT}
              />
            )}
            {step === 7 && (
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
                orderRef={orderRef}
                unitId={unitId}
                userId={loggedUser?.id || ''}
                userEmail={form.email || loggedUser?.email || ''}
                emailVerified={emailVerified}
                setEmailVerified={setEmailVerified}
                supportWhatsApp={supportWhatsApp}
                extraT={extraT}
              />
            )}
          </CardContent>
        </Card>

        {step <= 2 && !submitted && (
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
        )}
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
