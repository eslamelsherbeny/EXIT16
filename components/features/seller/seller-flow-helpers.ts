import arDict from '@/dictionaries/ar.json'
import enDict from '@/dictionaries/en.json'
import kaDict from '@/dictionaries/ka.json'
import ruDict from '@/dictionaries/ru.json'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import type { LocaleCode } from '@/lib/i18n'
import {
  ACTIVE_PLATFORM_COUNTRY,
  DEFAULT_PHONE_CODE,
  type UploadedDocEntry,
} from './seller-i18n'
import { toEnglishDigits, type LocalizedOptionItem } from './seller-shared'

export type MissingCoreFieldItem = {
  key: string
  label: string
  scrollId: string
  errMsg?: string
}

export type FlowLoadingLabels = typeof arDict.sell.flowLoading

export const FLOW_LOADING_LABELS: Record<LocaleCode, FlowLoadingLabels> = {
  ar: arDict.sell.flowLoading,
  en: enDict.sell.flowLoading,
  ru: ruDict.sell.flowLoading,
  ka: kaDict.sell.flowLoading,
}

const KNOWN_PHONE_CODES = [
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
]

export function parsePhoneCodeAndLocal(rawPhone?: string | null): {
  code: string
  local: string
} {
  const digitsOnly = toEnglishDigits(rawPhone || '').replace(/[^0-9]/g, '')
  let detectedCode = DEFAULT_PHONE_CODE
  let localPart = digitsOnly

  for (const c of KNOWN_PHONE_CODES) {
    if (digitsOnly.startsWith(c) && digitsOnly.length > c.length + 6) {
      detectedCode = c
      localPart = digitsOnly.slice(c.length).replace(/^0+/, '')
      break
    }
  }
  return { code: detectedCode, local: localPart }
}

export function getDynamicBuildingStatusOptions(
  propertyKind: string
): Array<LocalizedOptionItem<string>> {
  const arB = arDict.sell.buildingStatuses
  const enB = enDict.sell.buildingStatuses
  const ruB = ruDict.sell.buildingStatuses
  const kaB = kaDict.sell.buildingStatuses

  if (propertyKind === 'Hotel' || propertyKind === 'Commercial') {
    return [
      {
        id: 'Under construction',
        ar: arB.underConstruction,
        en: enB.underConstruction,
        ru: ruB.underConstruction,
        ka: kaB.underConstruction,
        labelAr: arB.underConstruction,
        labelEn: enB.underConstruction,
      },
      {
        id: 'Completed',
        ar: arB.completedReady,
        en: enB.completedReady,
        ru: ruB.completedReady,
        ka: kaB.completedReady,
        labelAr: arB.completedReady,
        labelEn: enB.completedReady,
      },
    ]
  }
  return [
    {
      id: 'Newly built',
      ar: arB.newlyBuiltReady,
      en: enB.newlyBuiltReady,
      ru: ruB.newlyBuiltReady,
      ka: kaB.newlyBuiltReady,
      labelAr: arB.newlyBuiltReady,
      labelEn: enB.newlyBuiltReady,
    },
    {
      id: 'Under construction',
      ar: arB.underConstructionSub,
      en: enB.underConstructionSub,
      ru: ruB.underConstructionSub,
      ka: kaB.underConstructionSub,
      labelAr: arB.underConstructionSub,
      labelEn: enB.underConstructionSub,
    },
    {
      id: 'Old built',
      ar: arB.oldBuiltReady,
      en: enB.oldBuiltReady,
      ru: ruB.oldBuiltReady,
      ka: kaB.oldBuiltReady,
      labelAr: arB.oldBuiltReady,
      labelEn: enB.oldBuiltReady,
    },
  ]
}

export function computeMissingCoreItems(params: {
  propertyKind: string
  buildingStatus: string
  form: Record<string, string>
  loggedUser: { id: string; name: string; email: string; phone: string } | null
  authMode: string
  agreedTerms: boolean
  fT: any
  contactStepDict: any
}): MissingCoreFieldItem[] {
  const {
    propertyKind,
    buildingStatus,
    form,
    loggedUser,
    authMode,
    agreedTerms,
    fT,
    contactStepDict,
  } = params

  const list: MissingCoreFieldItem[] = []
  const valT = fT.contactSection.validation

  if (!propertyKind) {
    list.push({
      key: 'propertyKind',
      label: fT.typeSection.whatKindLabel.replace(' *', ''),
      scrollId: 'field-wrap-propertyKind',
    })
  } else if (propertyKind !== 'Land' && !buildingStatus) {
    list.push({
      key: 'buildingStatus',
      label: fT.typeSection.statusLabel.replace(' *', ''),
      scrollId: 'field-wrap-buildingStatus',
    })
  }

  if (!form.location) {
    list.push({
      key: 'location',
      label: fT.locationSection.cityDistrictLabel.replace(' *', ''),
      scrollId: 'field-wrap-location',
    })
  }
  if (!form.project.trim()) {
    list.push({
      key: 'project',
      label: fT.locationSection.projectLabel.replace(' *', ''),
      scrollId: 'field-wrap-project',
    })
  }
  if (!form.exactStreet.trim()) {
    list.push({
      key: 'exactStreet',
      label: fT.locationSection.streetLabel.replace(' *', ''),
      scrollId: 'field-wrap-exactStreet',
    })
  }

  if (!form.areaSize || Number(toEnglishDigits(form.areaSize)) <= 0) {
    list.push({
      key: 'areaSize',
      label: fT.detailsSection.areaLabel.replace(' *', ''),
      scrollId: 'field-wrap-areaSize',
    })
  }

  if (propertyKind !== 'Land') {
    const rNum = parseInt(form.rooms || '0', 10)
    const bNum = parseInt(form.bedrooms || '0', 10)
    if (!rNum || rNum <= 0) {
      list.push({
        key: 'rooms',
        label: fT.detailsSection.roomsLabel.replace(' *', ''),
        scrollId: 'field-wrap-rooms',
      })
    }
    if (!bNum || bNum <= 0) {
      list.push({
        key: 'bedrooms',
        label: fT.detailsSection.bedroomsLabel.replace(' *', ''),
        scrollId: 'field-wrap-bedrooms',
      })
    } else if (rNum > 0 && bNum > rNum) {
      list.push({
        key: 'bedrooms',
        label: fT.detailsSection.bedroomsLabel.replace(' *', ''),
        scrollId: 'field-wrap-bedrooms',
        errMsg: valT.bedroomsExceedRooms,
      })
    }

    const flNum = parseInt(form.floor || '', 10)
    const totFlNum = parseInt(form.totalFloors || '', 10)
    if (
      Number.isFinite(flNum) &&
      Number.isFinite(totFlNum) &&
      totFlNum > 0 &&
      flNum > totFlNum
    ) {
      list.push({
        key: 'floor',
        label: fT.detailsSection.floorLabel,
        scrollId: 'field-wrap-floor',
        errMsg: valT.floorExceedsTotalFloors,
      })
    }
  }

  const contractPriceNum = Number(
    toEnglishDigits(form.contractPrice || '0').replace(/,/g, '')
  )
  const paidAmountNum = Number(
    toEnglishDigits(form.paidAmount || '0').replace(/,/g, '')
  )

  if (!contractPriceNum || contractPriceNum <= 0) {
    list.push({
      key: 'contractPrice',
      label: fT.pricingSection.contractPriceLabel.replace(' *', ''),
      scrollId: 'field-wrap-contractPrice',
    })
  }
  if (!paidAmountNum || paidAmountNum <= 0) {
    list.push({
      key: 'paidAmount',
      label: fT.pricingSection.paidAmountLabel.replace(' *', ''),
      scrollId: 'field-wrap-paidAmount',
    })
  } else if (contractPriceNum > 0 && paidAmountNum > contractPriceNum) {
    list.push({
      key: 'paidAmount',
      label: fT.pricingSection.paidAmountLabel.replace(' *', ''),
      scrollId: 'field-wrap-paidAmount',
      errMsg: valT.paidExceedsContract,
    })
  }

  if (!loggedUser) {
    if (authMode === 'register') {
      if (!form.name.trim()) {
        list.push({
          key: 'name',
          label: contactStepDict.nameLabel.replace(' *', ''),
          scrollId: 'field-wrap-name',
        })
      }
      if (!form.phone.trim()) {
        list.push({
          key: 'phone',
          label: contactStepDict.phoneLabel.replace(' *', ''),
          scrollId: 'field-wrap-phone',
        })
      }
      if (!form.email.trim()) {
        list.push({
          key: 'email',
          label: contactStepDict.emailLabel.replace(' *', ''),
          scrollId: 'field-wrap-email',
        })
      }
      if (!form.password || form.password.length < 8) {
        list.push({
          key: 'password',
          label: contactStepDict.passwordLabel,
          scrollId: 'field-wrap-password',
        })
      }
    } else if (authMode === 'login') {
      if (
        !form.loginIdentifier.trim() ||
        (!form.password && !form.loginPassword)
      ) {
        list.push({
          key: 'loginIdentifier',
          label: contactStepDict.loginIdLabel.replace(' *', ''),
          scrollId: 'field-wrap-loginIdentifier',
        })
      }
    }
  } else {
    if (!form.name.trim()) {
      list.push({
        key: 'name',
        label: contactStepDict.nameLabel.replace(' *', ''),
        scrollId: 'field-wrap-name',
      })
    }
    if (!form.phone.trim()) {
      list.push({
        key: 'phone',
        label: contactStepDict.phoneLabel.replace(' *', ''),
        scrollId: 'field-wrap-phone',
      })
    }
  }

  if (!agreedTerms) {
    list.push({
      key: 'agreedTerms',
      label: contactStepDict.ownerDeclaration,
      scrollId: 'field-wrap-agreedTerms',
    })
  }

  return list
}

export function createSellerFormData(params: {
  activeUnitId?: string
  activeUserId?: string
  unitId: string
  loggedUser: { id: string; name: string; email: string; phone: string } | null
  propertyKind: string
  buildingStatus: string
  form: Record<string, string>
  selected: Record<string, string[]>
  flags: { allowOnlineViewing: boolean }
  unitDocs: Record<string, UploadedDocEntry>
  images: string[]
}): FormData {
  const {
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
  } = params

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

  if (cleanDev) put('developer_name', cleanDev)
  put('project_name', fallbackProjectTitle)
  put('area', effectiveArea)
  if (form.locationDisplay) put('location_display', form.locationDisplay)
  put('exact_street', form.exactStreet)
  put('house_number', form.houseNumber)
  put('cadastral_code', form.cadastralCode)
  if (form.hideCadastral === 'true') put('hide_cadastral', 'true')
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
  const bedsNum = Math.min(roomsNum, parseInt(form.bedrooms || '1', 10) || 1)

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
}