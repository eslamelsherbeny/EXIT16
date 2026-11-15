import {
  ACTIVE_COUNTRY_CODE,
  ACTIVE_CURRENCY_CODE,
  list,
  parseDeliveryDateFromStatus,
  text,
} from '@/lib/form-action-helpers'

export const REQUIRED_DOC_KEYS = [
  'contract',
  'receipts',
  'statement',
  'passport',
] as const

export function generateOfficialUnitCode(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000)
  return `U-${randomFiveDigits}`
}

export function safeInt(val: unknown): number | null {
  if (val === null || val === undefined || String(val).trim() === '') return null
  const parsed = parseInt(String(val).replace(/[^0-9-]/g, ''), 10)
   return Number.isFinite(parsed) ? parsed : null
}

export function safeNum(
  val: unknown,
  fallback: number | null = 0
): number | null {
  if (val === null || val === undefined || String(val).trim() === '') {
    return fallback
  }
  const parsed = parseFloat(
    String(val)
      .replace(/,/g, '')
      .replace(/[^0-9.-]/g, '')
  )
  return Number.isFinite(parsed) ? parsed : fallback
}

export function extractCanonicalCityAndDistrict(
  areaRaw: string | null,
  locationDisplayRaw: string | null
): {
  cityKey: string
  districtKey: string
  locationDisplay: string
} {
  const area = (areaRaw || '').trim()
  const display = (locationDisplayRaw || '').trim()

  let cityKey = 'Tbilisi'
  let districtKey = ''

  if (display.includes(',')) {
    const parts = display.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      districtKey = parts[0].replace(/\s*\(.*?\)\s*/g, '').trim()
      cityKey = parts[parts.length - 1].replace(/\s*\(.*?\)\s*/g, '').trim()
    }
  } else if (area.includes(' - ')) {
    const [cPart, dPart] = area.split(' - ').map((s) => s.trim())
    if (cPart) cityKey = cPart
    if (dPart) districtKey = dPart
  } else if (area) {
    cityKey = area
  }

  if (cityKey.toLowerCase().includes('kakheti')) {
    cityKey = 'Telavi'
  }

  return {
    cityKey: cityKey || 'Tbilisi',
    districtKey: districtKey || cityKey || 'Saburtalo',
    locationDisplay:
      display || (districtKey ? `${districtKey}, ${cityKey}` : cityKey),
  }
}

export function checkUnitHasCompleteMediaAndDetails(
  payload: Record<string, any>
): {
  hasCoreDetails: boolean
  hasPhotos: boolean
  hasAllDocs: boolean
  isFullyCompleteForAdmin: boolean
} {
  const meta = payload.documents?.__unit_meta || {}
  const areaVal = payload.area || meta.area
  const streetVal = payload.exact_street || meta.exact_street
  const projectVal = payload.project_name
  const typeVal = payload.unit_type || meta.unit_type
  const isLand = String(typeVal || '').toLowerCase() === 'land'
  const sizeVal = Number(payload.size ?? meta.size) || 0
  const roomsVal = Number(payload.rooms ?? meta.rooms) || 0
  const contractVal = Number(payload.contract_price) || 0
  const paidVal = Number(payload.paid_amount) || 0

  const hasCoreDetails = Boolean(
    areaVal &&
      streetVal &&
      projectVal &&
      typeVal &&
      sizeVal > 0 &&
      contractVal > 0 &&
      paidVal > 0 &&
      (isLand || roomsVal > 0)
  )

  const imgs = Array.isArray(payload.images) ? payload.images : []
  const hasPhotos =
    imgs.filter((img: any) => Boolean(img && String(img).trim())).length > 0

  const docsObj =
    payload.documents && typeof payload.documents === 'object'
      ? payload.documents
      : {}
  const normalizedDocs: Record<string, any> = { ...docsObj }
  if (normalizedDocs.national_id && !normalizedDocs.passport) {
    normalizedDocs.passport = normalizedDocs.national_id
  }

  const uploadedDocsCount = REQUIRED_DOC_KEYS.filter((k) =>
    Boolean(normalizedDocs[k]?.url)
  ).length
  const hasAllDocs = uploadedDocsCount === REQUIRED_DOC_KEYS.length

  return {
    hasCoreDetails,
    hasPhotos,
    hasAllDocs,
    isFullyCompleteForAdmin: Boolean(
      hasCoreDetails && hasPhotos && hasAllDocs
    ),
  }
}

export function buildUnitPayloadWithMetaBackup(
  formData: FormData,
  existingDocuments?: Record<string, any> | null,
  existingCode?: string | null
) {
  let parsedDocuments: Record<string, any> =
    existingDocuments && typeof existingDocuments === 'object'
      ? { ...existingDocuments }
      : {}

  const existingMeta =
    existingDocuments &&
    typeof existingDocuments === 'object' &&
    existingDocuments.__unit_meta &&
    typeof existingDocuments.__unit_meta === 'object'
      ? { ...existingDocuments.__unit_meta }
      : {}

  const rawDocsJson = text(formData, 'documents_json')
  if (rawDocsJson) {
    try {
      const parsed = JSON.parse(rawDocsJson)
      if (parsed && typeof parsed === 'object') {
        parsedDocuments = {
          ...parsedDocuments,
          ...parsed,
          __unit_meta: {
            ...existingMeta,
            ...(parsed.__unit_meta || {}),
          },
        }
      }
    } catch {}
  }

  let preFetchedNearbyPlaces: any[] | null = null
  const rawNearbyJson =
    text(formData, 'nearby_places_json') || text(formData, 'nearbyPlacesJson')
  if (rawNearbyJson) {
    try {
      const parsedPlaces = JSON.parse(rawNearbyJson)
      if (Array.isArray(parsedPlaces) && parsedPlaces.length >= 5) {
        preFetchedNearbyPlaces = parsedPlaces.slice(0, 200)
      }
    } catch {}
  }

  const officialCode =
    existingCode ||
    parsedDocuments.__unit_meta?.code ||
    existingMeta.code ||
    generateOfficialUnitCode()

  const listingCategoryVal =
    text(formData, 'listing_category') ||
    parsedDocuments.__unit_meta?.listing_category ||
    'exit'
  const isRent =
    listingCategoryVal === 'rent_monthly' || listingCategoryVal === 'rent_daily'
  const isDirectSale =
    listingCategoryVal === 'sale' || listingCategoryVal === 'pledge'

  const deliveryStatusRaw = text(formData, 'delivery_status')
  const parsedDel = parseDeliveryDateFromStatus(deliveryStatusRaw)

  const sizeVal = safeNum(formData.get('size'), 0) || 0
  const kitchenAreaVal = safeNum(formData.get('kitchen_area'), null)
  const balconyAreaVal = safeNum(formData.get('balcony_area'), null)
  const loggiaAreaVal = safeNum(formData.get('loggia_area'), 0) ?? 0
  const terraceAreaVal = safeNum(formData.get('terrace_area'), 0) ?? 0
  const gardenVal = safeNum(formData.get('garden_size'), null)

  const rawRooms = safeInt(formData.get('rooms'))
  const rawBedrooms = safeInt(formData.get('bedrooms'))

  const roomsVal =
    rawRooms !== null && rawRooms > 0
      ? rawBedrooms !== null && rawBedrooms > rawRooms
        ? rawBedrooms
        : rawRooms
      : rawBedrooms !== null && rawBedrooms > 0
        ? rawBedrooms
        : null

  const bedroomsVal =
    rawBedrooms !== null && rawBedrooms > 0
      ? roomsVal !== null && rawBedrooms > roomsVal
        ? roomsVal
        : rawBedrooms
      : roomsVal !== null && roomsVal > 0
        ? Math.max(1, roomsVal - 1)
        : null

  const bathsVal = safeInt(formData.get('bathrooms'))
  const floorVal = safeInt(formData.get('floor_number'))
  const rawTotalFloors = safeInt(formData.get('total_floors'))
  const totalFloorsVal =
    rawTotalFloors !== null && floorVal !== null && rawTotalFloors < floorVal
      ? floorVal
      : rawTotalFloors
  const maxGuestsVal = safeInt(formData.get('max_guests'))

  const finishingVal = text(formData, 'finishing') || null
  const buildingStatusVal = text(formData, 'building_status') || null
  const buildingSeriesVal = text(formData, 'building_series') || null
  const floorTypeVal = text(formData, 'floor_type') || null
  const heatingTypeVal = text(formData, 'heating_type') || null
  const buildingMaterialVal = text(formData, 'building_material') || null
  const yearBuiltVal = safeInt(formData.get('year_built'))

  const areaVal =
    text(formData, 'area') ||
    text(formData, 'location') ||
    parsedDocuments.__unit_meta?.area ||
    null
  const locationDisplayVal =
    text(formData, 'location_display') ||
    text(formData, 'locationDisplay') ||
    parsedDocuments.__unit_meta?.location_display ||
    null

  const { cityKey, districtKey, locationDisplay } =
    extractCanonicalCityAndDistrict(areaVal, locationDisplayVal)

  const exactStreetVal =
    text(formData, 'exact_street') || text(formData, 'exactStreet') || null
  const houseNumberVal =
    text(formData, 'house_number') || text(formData, 'houseNumber') || null
  const cadastralCodeVal =
    text(formData, 'cadastral_code') || text(formData, 'cadastralCode') || null
  const hideCadastralVal =
    formData.get('hide_cadastral') === 'on' ||
    formData.get('hide_cadastral') === 'true' ||
    formData.get('hide_cadastral') === '1' ||
    formData.get('hideCadastral') === 'true'

  const latVal =
    safeNum(formData.get('lat'), null) ??
    parsedDocuments.__unit_meta?.lat ??
    existingMeta.lat ??
    null
  const lngVal =
    safeNum(formData.get('lng'), null) ??
    parsedDocuments.__unit_meta?.lng ??
    existingMeta.lng ??
    null

  const rawDeveloper =
    text(formData, 'developer_name') || text(formData, 'developer')
  const invalidDevNames = [
    'newly built',
    'under construction',
    'old built',
    'completed',
  ]
  const developerNameVal =
    rawDeveloper && !invalidDevNames.includes(rawDeveloper.trim().toLowerCase())
      ? rawDeveloper.trim()
      : null

  const videoUrlVal = text(formData, 'video_url') || null
  const tour3dUrlVal = text(formData, 'tour_3d_url') || null
  const allowOnlineViewingVal =
    formData.get('allow_online_viewing') === 'on' ||
    formData.get('allow_online_viewing') === 'true'
  const installmentSalePossibleVal =
    formData.get('installment_sale_possible') === 'on' ||
    formData.get('installment_sale_possible') === 'true'
  const exchangePossibleVal =
    formData.get('exchange_possible') === 'on' ||
    formData.get('exchange_possible') === 'true'
  const isExclusiveVal = false

  const unitTypeVal = text(formData, 'unit_type') || null
  const contractMonthVal = text(formData, 'contract_month') || null
  const contractYearVal = safeInt(formData.get('contract_year'))
  const yearsLeftVal = safeInt(formData.get('years_left')) ?? 0
  const instAmountVal = safeNum(formData.get('installment_amount'), 0) ?? 0
  const instFreqVal = text(formData, 'installment_frequency') || null
  const featuresList = list(formData, 'feature')
  const messengersList = list(formData, 'contact_messenger')

  const rentPriceVal = safeNum(formData.get('rent_price'), 0) ?? 0
  const rentPeriodVal =
    text(formData, 'rent_period') ||
    (listingCategoryVal === 'rent_daily' ? 'daily' : 'monthly')

  const rawContractPrice = safeNum(formData.get('contract_price'), 0) ?? 0
  const rawPaidAmount = safeNum(formData.get('paid_amount'), 0) ?? 0

  const effectiveContractPrice = isRent
    ? rentPriceVal || rawPaidAmount || rawContractPrice
    : Math.max(rawContractPrice, rawPaidAmount)
  const effectivePaidAmount = isRent
    ? rentPriceVal || rawPaidAmount || rawContractPrice
    : isDirectSale
      ? rawPaidAmount || rawContractPrice
      : Math.min(rawPaidAmount, effectiveContractPrice)

  const pricePerSqmVal =
    sizeVal > 0 && effectiveContractPrice > 0
      ? Math.round(effectiveContractPrice / sizeVal)
      : safeNum(formData.get('price_per_sqm'), 0) ?? 0

  const deliveryMonthResolved =
    text(formData, 'delivery_month') || parsedDel.deliveryMonth || null
  const deliveryYearResolved =
    safeInt(formData.get('delivery_year')) || parsedDel.deliveryYear || null

  const imagesList = list(formData, 'image')

  const finalCachedPlaces =
    preFetchedNearbyPlaces ||
    parsedDocuments.__unit_meta?.cached_nearby_places_v5 ||
    existingMeta.cached_nearby_places_v5 ||
    null

  parsedDocuments.__unit_meta = {
    ...existingMeta,
    ...(parsedDocuments.__unit_meta || {}),
    code: officialCode,
    listing_category: listingCategoryVal,
    rent_price: isRent ? effectivePaidAmount : rentPriceVal,
    rent_period: rentPeriodVal,
    price_per_sqm: pricePerSqmVal,
    developer_name: developerNameVal,
    city_key: cityKey,
    district_key: districtKey,
    location_display: locationDisplay,
    exact_street: exactStreetVal,
    house_number: houseNumberVal,
    cadastral_code: cadastralCodeVal,
    hide_cadastral: hideCadastralVal,
    lat: latVal,
    lng: lngVal,
    ...(finalCachedPlaces
      ? {
          cached_nearby_places_v5: finalCachedPlaces,
          cached_nearby_coords:
            latVal && lngVal
              ? `${Number(latVal).toFixed(4)}_${Number(lngVal).toFixed(4)}`
              : existingMeta.cached_nearby_coords,
        }
      : {}),
    building_status: buildingStatusVal,
    building_series: buildingSeriesVal,
    floor_type: floorTypeVal,
    heating_type: heatingTypeVal,
    building_material: buildingMaterialVal,
    year_built: yearBuiltVal,
    total_floors: totalFloorsVal,
    bedrooms: bedroomsVal,
    max_guests: maxGuestsVal,
    kitchen_area: kitchenAreaVal,
    balcony_area: balconyAreaVal,
    loggia_area: loggiaAreaVal,
    terrace_area: terraceAreaVal,
    video_url: videoUrlVal,
    tour_3d_url: tour3dUrlVal,
    allow_online_viewing: allowOnlineViewingVal,
    installment_sale_possible: installmentSalePossibleVal,
    exchange_possible: exchangePossibleVal,
    is_exclusive: isExclusiveVal,
    contact_messengers:
      messengersList.length > 0 ? messengersList : ['whatsapp'],
    area: areaVal,
    unit_type: unitTypeVal,
    size: sizeVal,
    rooms: roomsVal,
    bathrooms: bathsVal,
    floor_number: floorVal,
    garden_size: gardenVal,
    finishing: finishingVal,
    delivery_status: deliveryStatusRaw || null,
    delivery_month: deliveryMonthResolved,
    delivery_year: deliveryYearResolved,
    contract_month: contractMonthVal,
    contract_year: contractYearVal,
    years_left: yearsLeftVal,
    installment_amount: instAmountVal,
    installment_frequency: instFreqVal,
    features: featuresList,
    images: imagesList,
  }

  const payload: Record<string, any> = {
    code: officialCode,
    country: ACTIVE_COUNTRY_CODE,
    country_code: ACTIVE_COUNTRY_CODE,
    currency_code: text(formData, 'currency_code') || ACTIVE_CURRENCY_CODE,
    listing_category: listingCategoryVal,
    rent_price: isRent ? effectivePaidAmount : rentPriceVal,
    rent_period: rentPeriodVal,
    price_per_sqm: pricePerSqmVal,
    exact_street: exactStreetVal,
    house_number: houseNumberVal,
    cadastral_code: cadastralCodeVal,
    building_status: buildingStatusVal,
    building_series: buildingSeriesVal,
    floor_type: floorTypeVal,
    heating_type: heatingTypeVal,
    building_material: buildingMaterialVal,
    year_built: yearBuiltVal,
    total_floors: totalFloorsVal,
    bedrooms: bedroomsVal,
    max_guests: maxGuestsVal,
    kitchen_area: kitchenAreaVal,
    balcony_area: balconyAreaVal,
    loggia_area: loggiaAreaVal,
    terrace_area: terraceAreaVal,
    video_url: videoUrlVal,
    tour_3d_url: tour3dUrlVal,
    allow_online_viewing: allowOnlineViewingVal,
    installment_sale_possible: installmentSalePossibleVal,
    exchange_possible: exchangePossibleVal,
    is_exclusive: isExclusiveVal,
    contact_messengers:
      messengersList.length > 0 ? messengersList : ['whatsapp'],
    developer_name: developerNameVal,
    project_name:
      text(formData, 'project_name') || text(formData, 'project') || null,
    area: areaVal,
    unit_type: unitTypeVal,
    size: sizeVal,
    rooms: roomsVal,
    bathrooms: bathsVal,
    floor_number: floorVal,
    garden_size: gardenVal,
    finishing: finishingVal,
    delivery_status: deliveryStatusRaw || null,
    delivery_month: deliveryMonthResolved,
    delivery_year: deliveryYearResolved,
    features: featuresList,
    description: text(formData, 'description') || null,
    contract_price: effectiveContractPrice,
    paid_amount: effectivePaidAmount,
    market_price:
      safeNum(formData.get('market_price'), effectiveContractPrice) ||
      effectiveContractPrice,
    installment_amount: isRent ? 0 : instAmountVal,
    installment_frequency: isRent ? null : instFreqVal,
    contract_month: contractMonthVal,
    contract_year: contractYearVal,
    years_left: isRent ? 0 : yearsLeftVal,
    has_annual_installment:
      !isRent && formData.get('has_annual_installment') === 'on',
    annual_installment_amount:
      safeNum(formData.get('annual_installment_amount'), 0) ?? 0,
    willing_to_discount:
      formData.get('willing_to_discount') === 'on' ||
      formData.get('willing_to_discount') === 'true',
    discount_amount: safeNum(formData.get('discount_amount'), 0) ?? 0,
    has_overdue_installments:
      !isRent && formData.get('has_overdue_installments') === 'on',
    overdue_installments:
      safeNum(formData.get('overdue_installments'), 0) ?? 0,
    overdue_total_amount:
      safeNum(formData.get('overdue_total_amount'), 0) ?? 0,
    images: imagesList,
    documents: parsedDocuments,
  }

  return payload
}