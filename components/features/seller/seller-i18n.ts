import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import kaDict from '@/dictionaries/ka.json'
import ruDict from '@/dictionaries/ru.json'
import type { Dictionary, LocaleCode } from '@/lib/i18n'
import {
  CONDITION_OPTIONS,
  getOptionLabel,
  SIVRCE_FEATURE_GROUPS,
  toEnglishDigits,
  type LocalizedOptionItem,
} from './seller-options-data'

export const ACTIVE_PLATFORM_COUNTRY = 'GE'
export const DEFAULT_PHONE_CODE = '995'

export type SellerDocKey = 'contract' | 'receipts' | 'statement' | 'passport'

export type UploadedDocEntry = {
  url: string
  name: string
  uploaded_at: string
  status?: string
}

const DICTIONARIES_BY_LOCALE: Record<LocaleCode, Record<string, any>> = {
  ar: arDict as Record<string, any>,
  en: enDict as Record<string, any>,
  ru: ruDict as Record<string, any>,
  ka: kaDict as Record<string, any>,
}

export type SellerExtraLabels = typeof arDict.sell.extraLabels
export type SellerFormTranslations = typeof arDict.sell.formUi

export function getSellerFormTranslations(
  locale: LocaleCode = 'ar',
  dict?: Dictionary | Record<string, any>
): SellerFormTranslations {
  const fallbackSell = (DICTIONARIES_BY_LOCALE[locale] || DICTIONARIES_BY_LOCALE.ar)
    .sell
  const base = fallbackSell.formUi as SellerFormTranslations
  const customFormUi = (dict?.sell as Record<string, any>)?.formUi

  if (!customFormUi || typeof customFormUi !== 'object') return base

  return {
    ...base,
    ...customFormUi,
    tabs: { ...base.tabs, ...(customFormUi.tabs || {}) },
    typeSection: { ...base.typeSection, ...(customFormUi.typeSection || {}) },
    photosSection: {
      ...base.photosSection,
      ...(customFormUi.photosSection || {}),
    },
    locationSection: {
      ...base.locationSection,
      ...(customFormUi.locationSection || {}),
    },
    locationModal: {
      ...base.locationModal,
      ...(customFormUi.locationModal || {}),
    },
    detailsSection: {
      ...base.detailsSection,
      ...(customFormUi.detailsSection || {}),
    },
    pricingSection: {
      ...base.pricingSection,
      ...(customFormUi.pricingSection || {}),
    },
    contactSection: {
      ...base.contactSection,
      ...(customFormUi.contactSection || {}),
      validation: {
        ...base.contactSection.validation,
        ...(customFormUi.contactSection?.validation || {}),
      },
    },
    previewSidebar: {
      ...base.previewSidebar,
      ...(customFormUi.previewSidebar || {}),
    },
    reviewSection: {
      ...base.reviewSection,
      ...(customFormUi.reviewSection || {}),
    },
    bottomBar: { ...base.bottomBar, ...(customFormUi.bottomBar || {}) },
  }
}

export function getSellerExtraLabels(
  locale: LocaleCode = 'ar',
  dict?: Dictionary | Record<string, any>
): SellerExtraLabels {
  const fallbackSell = (DICTIONARIES_BY_LOCALE[locale] || DICTIONARIES_BY_LOCALE.ar)
    .sell
  const base = fallbackSell.extraLabels as SellerExtraLabels
  const customExtra = (dict?.sell as Record<string, any>)?.extraLabels || {}
  return { ...base, ...customExtra }
}

export function maskEmailDisplay(email?: string): string {
  const clean = String(email || '').trim()
  if (!clean || !clean.includes('@')) return '***@***'
  const [local, domain] = clean.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}

export function isImageFileUrl(url?: string, name?: string): boolean {
  const target = `${url || ''} ${name || ''}`.toLowerCase()
  if (target.includes('.pdf')) return false
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)/i.test(target) || Boolean(url)
}

export const AI_DESCRIPTION_I18N: Record<
  LocaleCode,
  {
    generateBtn: string
    generatingBtn: string
    generatedBadge: string
    helperHint: string
  }
> = {
  ar: arDict.sell.aiDescription,
  en: enDict.sell.aiDescription,
  ru: ruDict.sell.aiDescription,
  ka: kaDict.sell.aiDescription,
}

export function buildSmartPropertyDescription({
  locale,
  areaName,
  form,
  selected,
  buildingStatus,
}: {
  locale: LocaleCode
  areaName: string
  form: Record<string, string>
  selected: Record<string, string[]>
  buildingStatus?: string
}): string {
  const dictObj = DICTIONARIES_BY_LOCALE[locale] || DICTIONARIES_BY_LOCALE.ar
  const tpl = dictObj.sell.aiDescription.templates

  const streetRaw = form.exactStreet?.trim() || ''
  const houseNo = form.houseNumber?.trim() || ''
  const street = streetRaw
    ? `${streetRaw}${houseNo ? ` ${houseNo}` : ''}`
    : ''
  const project = form.project?.trim() || ''
  const developer = form.developer?.trim() || ''
  const size = form.areaSize?.trim() || ''
  const rooms = form.rooms?.trim() || ''
  const bedrooms = form.bedrooms?.trim() || ''
  const bathrooms = form.bathrooms?.trim() || '1'
  const floor = form.floor?.trim() || ''
  const totalFloors = form.totalFloors?.trim() || ''
  const isUnderConst = buildingStatus === 'Under construction'
  const deliveryYear = form.deliveryYear || '2026'

  const contractPriceNum = Number(
    toEnglishDigits(form.contractPrice || '0').replace(/,/g, '')
  )
  const paidAmountNum = Number(
    toEnglishDigits(form.paidAmount || '0').replace(/,/g, '')
  )
  const installmentNum = Number(
    toEnglishDigits(form.installment || '0').replace(/,/g, '')
  )
  const remainingMonthsNum = Number(
    toEnglishDigits(form.remainingMonths || '0').replace(/[^0-9]/g, '')
  )
  const remainingAmount = Math.max(0, contractPriceNum - paidAmountNum)

  const finishingId = selected.finishing?.[0] || ''
  const conditionObj = (
    CONDITION_OPTIONS as readonly LocalizedOptionItem<string>[]
  ).find((c) => c.id === finishingId)
  const conditionLabel = conditionObj
    ? getOptionLabel(conditionObj, locale)
    : ''

  const allFeatureItems: LocalizedOptionItem<string>[] = []
  for (const grp of SIVRCE_FEATURE_GROUPS) {
    for (const item of grp.items) {
      allFeatureItems.push(item as LocalizedOptionItem<string>)
    }
  }

  const selectedFeatureLabels = (selected.features || [])
    .map((fId) => {
      const found = allFeatureItems.find((it) => it.id === fId)
      return found ? getOptionLabel(found, locale) : fId
    })
    .slice(0, 8)

  const sep = locale === 'ar' ? ' ، ' : ', '
  const lines: string[] = []

  lines.push(
    `${tpl.intro}${project ? ` ${tpl.inProject} (${project})` : ''}${developer ? ` ${tpl.byDeveloper} ${developer}` : ''} ${tpl.locatedIn} ${areaName}${street ? ` — ${street}` : ''}.`
  )

  const specParts: string[] = []
  if (size) specParts.push(`${tpl.totalArea} ${size} ${tpl.sqm}`)
  if (rooms)
    specParts.push(
      `${tpl.roomsPrefix ? `${tpl.roomsPrefix} ` : ''}${rooms}${tpl.roomsWord ? ` ${tpl.roomsWord}` : ''}`
    )
  if (bedrooms)
    specParts.push(
      `${tpl.bedroomsPrefix ? `${tpl.bedroomsPrefix} ` : ''}${bedrooms}${tpl.bedroomsWord ? ` ${tpl.bedroomsWord}` : ''}`
    )
  if (bathrooms) specParts.push(`${bathrooms} ${tpl.bathWord}`)
  if (floor) {
    specParts.push(
      `${tpl.floorPrefix} ${floor}${totalFloors ? ` ${tpl.ofTotalFloors} ${totalFloors}${tpl.floorsWord ? ` ${tpl.floorsWord}` : ''}` : ''}`
    )
  }
  if (conditionLabel) specParts.push(`${tpl.conditionPrefix} ${conditionLabel}`)

  if (specParts.length > 0) {
    lines.push(`${tpl.specsTitle} ${specParts.join(sep)}.`)
  }

  lines.push(
    `${tpl.handoverTitle} ${isUnderConst ? `${tpl.underConstPrefix} ${deliveryYear})` : tpl.readyNow}.`
  )

  if (contractPriceNum > 0 || paidAmountNum > 0) {
    const finParts: string[] = []
    if (contractPriceNum > 0) {
      finParts.push(
        `${tpl.contractPricePrefix} $${contractPriceNum.toLocaleString('en-US')}`
      )
    }
    if (paidAmountNum > 0) {
      finParts.push(
        `${tpl.paidCashPrefix} $${paidAmountNum.toLocaleString('en-US')}`
      )
    }
    if (remainingAmount > 0) {
      finParts.push(
        `${tpl.remainingPrefix} $${remainingAmount.toLocaleString('en-US')}`
      )
    }
    if (installmentNum > 0) {
      finParts.push(
        `${tpl.installmentPrefix} $${installmentNum.toLocaleString('en-US')}${remainingMonthsNum > 0 ? ` (${tpl.forDuration ? `${tpl.forDuration} ` : ''}${remainingMonthsNum} ${tpl.monthsWord})` : ''}`
      )
    }
    lines.push(`${tpl.financialsTitle} ${finParts.join(' — ')}.`)
  }

  if (selectedFeatureLabels.length > 0) {
    lines.push(`${tpl.featuresTitle} ${selectedFeatureLabels.join(sep)}.`)
  }

  if (tpl.closingLine) {
    lines.push(tpl.closingLine)
  }

  return lines.join('\n\n')
}