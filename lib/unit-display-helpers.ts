export const REAL_UNIT_DOC_KEYS = [
  'contract',
  'receipts',
  'statement',
  'passport',
] as const

export type UnitDocKey = (typeof REAL_UNIT_DOC_KEYS)[number]

/**
 * كود موحّد للوحدة يظهر بنفس الشكل تماماً عند البائع وفي لوحة الأدمن وطلبات الإعلان
 */
export function getUnifiedUnitCode(
  id: string,
  dbCode?: string | null
): string {
  if (dbCode && String(dbCode).trim()) {
    return String(dbCode).trim().toUpperCase()
  }
  const numericCode = String(id || '')
    .replace(/\D/g, '')
    .slice(0, 5)
  const fallbackCode = String(id || '')
    .slice(0, 5)
    .toUpperCase()
  return `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`
}

/**
 * العنوان الرئيسي الموحّد (أول كلمة كبيرة) في حساب البائع وجدول الأدمن والكروت
 */
export function getUnifiedUnitHeadline(
  unit: {
    project_name?: string | null
    unit_type?: string | null
    area?: string | null
    documents?: Record<string, any> | null
  },
  fallback = 'Unit'
): string {
  const proj = String(unit?.project_name || '').trim()
  if (proj) return proj

  const meta =
    unit?.documents && typeof unit.documents === 'object'
      ? unit.documents.__unit_meta || {}
      : {}
  const uType = String(unit?.unit_type || meta.unit_type || '').trim()
  const area = String(unit?.area || meta.area || '').trim()

  if (uType && area) return `${uType} — ${area}`
  if (uType) return uType
  if (area) return area
  return fallback
}

export function getUnitMetaObject(
  documents?: Record<string, any> | null
): Record<string, any> {
  if (!documents || typeof documents !== 'object') return {}
  return documents.__unit_meta && typeof documents.__unit_meta === 'object'
    ? documents.__unit_meta
    : {}
}

export function isUnitWhatsAppDocsVerified(unit: {
  documents?: Record<string, any> | null
}): boolean {
  const meta = getUnitMetaObject(unit?.documents)
  return Boolean(meta.whatsapp_docs_verified)
}

export function getUnitUploadedDocsCount(
  documents?: Record<string, any> | null
): number {
  if (!documents || typeof documents !== 'object') return 0
  const normalized: Record<string, any> = { ...documents }
  if (normalized.national_id && !normalized.passport) {
    normalized.passport = normalized.national_id
  }
  return REAL_UNIT_DOC_KEYS.filter((k) => Boolean(normalized[k]?.url)).length
}

export function isUnitDocsSatisfied(unit: {
  documents?: Record<string, any> | null
}): boolean {
  return (
    isUnitWhatsAppDocsVerified(unit) ||
    getUnitUploadedDocsCount(unit?.documents) >= REAL_UNIT_DOC_KEYS.length
  )
}

export function getUnitImagesCount(unit: {
  images?: string[] | null
  documents?: Record<string, any> | null
}): number {
  const meta = getUnitMetaObject(unit?.documents)
  const rawImages = Array.isArray(unit?.images)
    ? unit.images
    : Array.isArray(meta.images)
      ? meta.images
      : []
  return rawImages.filter((img: any) => Boolean(img && String(img).trim()))
    .length
}

export function hasUnitAllCoreDetails(unit: Record<string, any>): boolean {
  const meta = getUnitMetaObject(unit?.documents)
  const areaVal = unit.area || meta.area
  const streetVal = unit.exact_street || meta.exact_street
  const typeVal = unit.unit_type || meta.unit_type
  const isLand = String(typeVal || '').toLowerCase() === 'land'
  const sizeVal = Number(unit.size ?? meta.size) || 0
  const roomsVal = Number(unit.rooms ?? meta.rooms) || 0

  return Boolean(
    unit.project_name &&
      areaVal &&
      streetVal &&
      typeVal &&
      sizeVal > 0 &&
      Number(unit.contract_price) > 0 &&
      Number(unit.paid_amount) > 0 &&
      (isLand || roomsVal > 0)
  )
}

/**
 * هل الوحدة مكتملة (بيانات + صور + 4 مستندات أو توثيق واتساب) وجاهزة للمراجعة أو النشر؟
 */
export function isUnitCompleteForReview(unit: Record<string, any>): boolean {
  return (
    hasUnitAllCoreDetails(unit) &&
    getUnitImagesCount(unit) > 0 &&
    isUnitDocsSatisfied(unit)
  )
}