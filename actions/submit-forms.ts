'use server'

import { revalidatePath } from 'next/cache'
import {
  ACTIVE_COUNTRY_CODE,
  formatPrimaryPhone,
  generateOrderRef,
  getFormsDict,
  getSupabase,
  getVerifiedSellerSession,
  normalizeEmail,
  stripExtendedSellColumns,
  stripToCoreSellColumns,
  text,
} from '@/lib/form-action-helpers'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  buildUnitPayloadWithMetaBackup,
  checkUnitHasCompleteMediaAndDetails,
} from '@/lib/sell-payload-builder'
import {
  fetchRealNearbyPlacesAndWeatherAction,
  geocodeGeorgiaBuildingAction,
} from './georgia-geocode-action'
import {
  getCurrentSellerProfileAction as _getCurrentSellerProfileAction,
  getUsersVerificationMapAction as _getUsersVerificationMapAction,
  markUserPhoneVerifiedAction as _markUserPhoneVerifiedAction,
  processSellerStep2Action as _processSellerStep2Action,
  sendSellerRecoveryLinkAction as _sendSellerRecoveryLinkAction,
  sendSellerReviewOtpAction as _sendSellerReviewOtpAction,
  setNewPasswordFromTokenAction as _setNewPasswordFromTokenAction,
  verifyExistingEmailPasswordAction as _verifyExistingEmailPasswordAction,
  verifyMagicTokenAction as _verifyMagicTokenAction,
  verifySellerReviewOtpAction as _verifySellerReviewOtpAction,
  type Step2AuthResponse,
} from './seller-auth-actions'
import {
  processBuyerStep3Action as _processBuyerStep3Action,
  submitBuyRequest as _submitBuyRequest,
  submitInvestorLead as _submitInvestorLead,
  type BuyRequestPayload,
} from './buyer-actions'

export type { BuyRequestPayload, Step2AuthResponse }

export type SubmitResult = {
  success: boolean
  error?: string
  unitId?: string
  orderRef?: string
}

function isValidGeorgiaCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 40.9 &&
    lat <= 43.7 &&
    lng >= 39.8 &&
    lng <= 46.9
  )
}

/**
 * توليد وحفظ إحداثيات المبنى والأماكن المحيطة (150+ مرفق) وقت رفع الوحدة الفعلي
 * كما يفعل sivrce.ge حتى تفتح صفحة الوحدة في 0 ثانية لأي زائر
 */
async function enrichUnitPayloadWithLocationAndNearbyCache(
  formData: FormData,
  payload: Record<string, any>,
  existingDocs?: any
) {
  try {
    const existingMeta =
      existingDocs && typeof existingDocs === 'object'
        ? existingDocs.__unit_meta || {}
        : {}
    const currentMeta = payload.documents?.__unit_meta || {}

    const rawLat = Number(
      text(formData, 'lat') || currentMeta.lat || existingMeta.lat
    )
    const rawLng = Number(
      text(formData, 'lng') || currentMeta.lng || existingMeta.lng
    )

    let finalLat = isValidGeorgiaCoord(rawLat, rawLng) ? rawLat : NaN
    let finalLng = isValidGeorgiaCoord(rawLat, rawLng) ? rawLng : NaN

    const street = String(
      payload.exact_street || currentMeta.exact_street || ''
    ).trim()
    const house = String(
      payload.house_number || currentMeta.house_number || ''
    ).trim()
    const areaId = String(payload.area || currentMeta.area || '').trim()
    const locDisplay = String(
      text(formData, 'location_display') ||
        currentMeta.location_display ||
        existingMeta.location_display ||
        areaId
    ).trim()

    if (!isValidGeorgiaCoord(finalLat, finalLng) && street.length >= 2) {
      const cityPart = locDisplay.includes(',')
        ? locDisplay.split(',').pop()!.trim()
        : locDisplay.split(/[-—]/)[0].trim() || 'Tbilisi'

      const geocoded = await Promise.race([
        geocodeGeorgiaBuildingAction({
          streetEn: street,
          houseNumber: house,
          city: cityPart,
        }),
        new Promise<null>((r) => setTimeout(() => r(null), 2500)),
      ])

      if (geocoded && isValidGeorgiaCoord(geocoded.lat, geocoded.lng)) {
        finalLat = geocoded.lat
        finalLng = geocoded.lng
      }
    }

    if (!isValidGeorgiaCoord(finalLat, finalLng)) {
      const fallback = getCoordinatesForArea(areaId || 'Tbilisi - Saburtalo')
      finalLat = fallback.lat
      finalLng = fallback.lng
    }

    const rLat = Number(finalLat.toFixed(4))
    const rLng = Number(finalLng.toFixed(4))
    const coordsKey = `${rLat}_${rLng}`

    const existingCachedPlaces = Array.isArray(
      existingMeta.cached_nearby_places_v5
    )
      ? existingMeta.cached_nearby_places_v5
      : null

    let nearbyPlaces =
      existingCachedPlaces &&
      existingCachedPlaces.length >= 15 &&
      existingMeta.cached_nearby_coords === coordsKey
        ? existingCachedPlaces
        : null

    if (!nearbyPlaces) {
      const nearbyRes = await Promise.race([
        fetchRealNearbyPlacesAndWeatherAction({
          lat: finalLat,
          lng: finalLng,
          locale: 'en',
        }),
        new Promise<null>((r) => setTimeout(() => r(null), 4500)),
      ])

      if (
        nearbyRes &&
        Array.isArray(nearbyRes.places) &&
        nearbyRes.places.length > 0
      ) {
        nearbyPlaces = nearbyRes.places.slice(0, 200)
      }
    }

    const hideCadastralRaw = text(formData, 'hide_cadastral')
    const hideCadastral =
      hideCadastralRaw === 'true'
        ? true
        : hideCadastralRaw === 'false'
          ? false
          : Boolean(currentMeta.hide_cadastral ?? existingMeta.hide_cadastral)

    payload.documents = {
      ...(payload.documents || {}),
      __unit_meta: {
        ...existingMeta,
        ...currentMeta,
        lat: Number(finalLat.toFixed(6)),
        lng: Number(finalLng.toFixed(6)),
        ...(locDisplay ? { location_display: locDisplay } : {}),
        hide_cadastral: hideCadastral,
        ...(nearbyPlaces
          ? {
              cached_nearby_places_v5: nearbyPlaces,
              cached_nearby_coords: coordsKey,
            }
          : {}),
      },
    }
  } catch {}
}

async function canModifySellUnit(
  supabase: any,
  unitId: string,
  sessionUser: any
): Promise<{ allowed: boolean; unit: any }> {
  if (!unitId || !sessionUser?.id) return { allowed: false, unit: null }

  const { data: unit } = await supabase
    .from('sell_requests')
    .select('*')
    .eq('id', unitId)
    .maybeSingle()

  if (!unit) return { allowed: false, unit: null }

  const role = String(sessionUser.role || 'user').trim().toLowerCase()
  const isStaff = role === 'admin' || role === 'moderator' || role === 'sales'

  if (unit.user_id) {
    return {
      allowed: Boolean(isStaff || unit.user_id === sessionUser.id),
      unit,
    }
  }

  const emailMatch =
    sessionUser.email &&
    unit.email &&
    String(sessionUser.email).trim().toLowerCase() ===
      String(unit.email).trim().toLowerCase()
  const phoneMatch =
    sessionUser.phone &&
    unit.phone &&
    String(sessionUser.phone).trim() === String(unit.phone).trim()

  if (isStaff || emailMatch || phoneMatch) {
    if (!unit.user_id && (emailMatch || phoneMatch)) {
      await supabase
        .from('sell_requests')
        .update({ user_id: sessionUser.id })
        .eq('id', unit.id)
      unit.user_id = sessionUser.id
    }
    return { allowed: true, unit }
  }

  return { allowed: false, unit: null }
}

export async function getAuthorizedUnitForEditAction(unitId: string) {
  try {
    if (!unitId) return { allowed: false, unit: null }
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)
    if (!sessionUser) return { allowed: false, unit: null }

    const { allowed, unit } = await canModifySellUnit(
      supabase,
      unitId,
      sessionUser
    )
    if (!allowed || !unit) return { allowed: false, unit: null }

    return { allowed: true, unit }
  } catch {
    return { allowed: false, unit: null }
  }
}

async function resilientUpdateUnit(
  supabase: any,
  unitId: string,
  payload: Record<string, any>
) {
  let { error } = await supabase
    .from('sell_requests')
    .update(payload)
    .eq('id', unitId)

  if (error) {
    const res2 = await supabase
      .from('sell_requests')
      .update(stripExtendedSellColumns(payload))
      .eq('id', unitId)
    error = res2.error
  }

  if (error) {
    const res3 = await supabase
      .from('sell_requests')
      .update(stripToCoreSellColumns(payload))
      .eq('id', unitId)
    error = res3.error
  }

  return { error }
}

/**
 * تحقق آمن من هوية البائع: لا يقبل fallbackUserId إلا إذا كان يطابق ملكية unit_id الفعلي في قاعدة البيانات
 */
async function resolveSellerUserOrFallback(
  supabase: any,
  formData: FormData
): Promise<any | null> {
  const sessionUser = await getVerifiedSellerSession(supabase)
  if (sessionUser) return sessionUser

  const fallbackUserId = text(formData, 'user_id')
  const fallbackUnitId = text(formData, 'unit_id')

  if (fallbackUserId && fallbackUnitId) {
    const [{ data: dbUser }, { data: unitMatch }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, phone, role, status, is_verified')
        .eq('id', fallbackUserId)
        .maybeSingle(),
      supabase
        .from('sell_requests')
        .select('id, user_id')
        .eq('id', fallbackUnitId)
        .maybeSingle(),
    ])

    if (
      dbUser &&
      String(dbUser.status || 'active').toLowerCase() !== 'suspended' &&
      unitMatch &&
      String(unitMatch.user_id) === String(dbUser.id)
    ) {
      return dbUser
    }
  }

  return null
}

export async function saveSellProgress(
  formData: FormData
): Promise<SubmitResult> {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await resolveSellerUserOrFallback(supabase, formData)
    const unitId = text(formData, 'unit_id')

    if (!sessionUser) {
      return { success: false, error: msg.sessionExpired }
    }

    let targetUnitId = unitId

    if (!targetUnitId) {
      const { data: recentEmptyDraft } = await supabase
        .from('sell_requests')
        .select('id, size, area, status, submission_type')
        .eq('user_id', sessionUser.id)
        .in('submission_type', ['draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (
        recentEmptyDraft &&
        !recentEmptyDraft.size &&
        !recentEmptyDraft.area
      ) {
        targetUnitId = String(recentEmptyDraft.id)
      }
    }

    const rawLat = Number(text(formData, 'lat'))
    const rawLng = Number(text(formData, 'lng'))
    const locDisplay = text(formData, 'location_display')
    const hideCad = text(formData, 'hide_cadastral')

    if (!targetUnitId) {
      const newDraftPayload = buildUnitPayloadWithMetaBackup(
        formData,
        null,
        null
      )
      newDraftPayload.user_id = sessionUser.id
      newDraftPayload.name = text(formData, 'name') || sessionUser.name || ''
      newDraftPayload.phone =
        formatPrimaryPhone(text(formData, 'phone')) || sessionUser.phone || ''
      newDraftPayload.email =
        normalizeEmail(text(formData, 'email')) || sessionUser.email || null
      newDraftPayload.is_original_owner = true
      newDraftPayload.status = sessionUser.is_verified
        ? 'pending'
        : 'draft_unverified'
      newDraftPayload.submission_type = 'draft'
      newDraftPayload.documents.__unit_meta = {
        ...(newDraftPayload.documents.__unit_meta || {}),
        ready_for_admin_review: false,
        ...(isValidGeorgiaCoord(rawLat, rawLng)
          ? { lat: rawLat, lng: rawLng }
          : {}),
        ...(locDisplay ? { location_display: locDisplay } : {}),
        ...(hideCad ? { hide_cadastral: hideCad === 'true' } : {}),
      }

      let { data: inserted, error: insErr } = await supabase
        .from('sell_requests')
        .insert(newDraftPayload)
        .select('id')
        .single()

      if (insErr || !inserted) {
        const fbIns = await supabase
          .from('sell_requests')
          .insert(stripToCoreSellColumns(newDraftPayload))
          .select('id')
          .single()
        inserted = fbIns.data
      }

      if (!inserted?.id) {
        return { success: false, error: msg.saveProgressFailed }
      }

      revalidatePath('/account', 'page')
      return { success: true, unitId: String(inserted.id) }
    }

    const { allowed, unit: existingUnit } = await canModifySellUnit(
      supabase,
      targetUnitId,
      sessionUser
    )
    if (!allowed) {
      return { success: false, error: msg.sessionExpired }
    }

    const payload = buildUnitPayloadWithMetaBackup(
      formData,
      existingUnit?.documents,
      existingUnit?.code
    )
    payload.user_id = existingUnit?.user_id || sessionUser.id

    const prevCleanStatus = String(existingUnit?.status || '')
      .trim()
      .toLowerCase()
    const isAlreadyLiveOrReviewed = [
      'active',
      'approved',
      'published',
      'offer_received',
      'transferring',
      'sold',
    ].includes(prevCleanStatus)

    const completeness = checkUnitHasCompleteMediaAndDetails(payload)

    if (!sessionUser.is_verified && !isAlreadyLiveOrReviewed) {
      payload.status = 'draft_unverified'
    }

    payload.documents.__unit_meta = {
      ...(payload.documents.__unit_meta || {}),
      ready_for_admin_review:
        isAlreadyLiveOrReviewed || completeness.isFullyCompleteForAdmin,
      ...(isValidGeorgiaCoord(rawLat, rawLng)
        ? { lat: rawLat, lng: rawLng }
        : {}),
      ...(locDisplay ? { location_display: locDisplay } : {}),
      ...(hideCad ? { hide_cadastral: hideCad === 'true' } : {}),
    }

    const { error } = await resilientUpdateUnit(
      supabase,
      targetUnitId,
      payload
    )

    try {
      await supabase
        .from('users')
        .update({ contact_messengers: payload.contact_messengers })
        .eq('id', sessionUser.id)
    } catch {}

    revalidatePath('/account', 'page')
    revalidatePath('/opportunities', 'page')
    revalidatePath(`/opportunities/${targetUnitId}`, 'page')
    return error
      ? { success: false, error: msg.saveProgressFailed }
      : { success: true, unitId: targetUnitId }
  } catch {
    return { success: false, error: msg.saveProgressFailed }
  }
}

export async function submitSellRequest(
  formData: FormData
): Promise<SubmitResult> {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await resolveSellerUserOrFallback(supabase, formData)
    let existingUnitId = text(formData, 'unit_id')
    const projectName = text(formData, 'project_name')
    const unitCountry = ACTIVE_COUNTRY_CODE

    if (!sessionUser) {
      return { success: false, error: msg.sessionExpired }
    }

    if (!existingUnitId) {
      const { data: recentDraft } = await supabase
        .from('sell_requests')
        .select('id, size, area, project_name, status, submission_type')
        .eq('user_id', sessionUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (
        recentDraft &&
        (recentDraft.status === 'draft_unverified' ||
          recentDraft.submission_type === 'draft') &&
        !recentDraft.size &&
        !recentDraft.area &&
        (!projectName || recentDraft.project_name === projectName)
      ) {
        existingUnitId = String(recentDraft.id)
      }
    }

    if (existingUnitId) {
      const { allowed, unit: prevUnit } = await canModifySellUnit(
        supabase,
        existingUnitId,
        sessionUser
      )

      if (!allowed || !prevUnit) {
        return { success: false, error: msg.sessionExpired }
      }

      const prevCleanStatus = String(prevUnit?.status || '')
        .trim()
        .toLowerCase()
      const role = String(sessionUser.role || 'user').trim().toLowerCase()
      const isStaff =
        role === 'admin' || role === 'moderator' || role === 'sales'

      const { data: acceptedDealOnUnit } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', existingUnitId)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle()

      const isLockedByDeal =
        prevCleanStatus === 'transferring' ||
        prevCleanStatus === 'sold' ||
        Boolean(acceptedDealOnUnit)

      if (isLockedByDeal && !isStaff) {
        return {
          success: false,
          error:
            msg.unitLockedByDeal ||
            'لا يمكن تعديل بيانات الوحدة بعد قبول العرض وبدء إجراءات التنازل مع الإدارة.',
        }
      }

      const payload = buildUnitPayloadWithMetaBackup(
        formData,
        prevUnit?.documents,
        prevUnit?.code
      )
      const completeness = checkUnitHasCompleteMediaAndDetails(payload)

      payload.user_id = prevUnit.user_id || sessionUser.id
      payload.name =
        text(formData, 'name') || prevUnit.name || sessionUser.name
      payload.phone =
        formatPrimaryPhone(text(formData, 'phone')) ||
        prevUnit.phone ||
        sessionUser.phone
      payload.email =
        normalizeEmail(text(formData, 'email')) ||
        prevUnit.email ||
        sessionUser.email ||
        null
      payload.is_original_owner = true
      payload.status = isLockedByDeal ? prevUnit.status : 'pending'
      payload.docs_verified = Boolean(prevUnit.docs_verified)
      payload.documents.__unit_meta = {
        ...(payload.documents.__unit_meta || {}),
        email_verified: true,
        ready_for_admin_review: completeness.isFullyCompleteForAdmin,
      }

      // توليد وحفظ الأماكن القريبة وإحداثيات المبنى وقت النشر الفعلي
      await enrichUnitPayloadWithLocationAndNearbyCache(
        formData,
        payload,
        prevUnit?.documents
      )

      const wasPreviouslySubmitted =
        prevCleanStatus !== 'draft_unverified' &&
        prevUnit?.submission_type !== 'draft' &&
        Boolean(
          prevUnit?.area ||
            prevUnit?.size ||
            prevCleanStatus === 'active' ||
            prevCleanStatus === 'rejected' ||
            prevCleanStatus === 'paused_by_seller'
        )

      if (wasPreviouslySubmitted) {
        payload.submission_type = 'edited_by_seller'
        payload.last_seller_edit_at = new Date().toISOString()
      } else {
        payload.submission_type = completeness.isFullyCompleteForAdmin
          ? 'new'
          : 'incomplete_media'
      }

      const { error } = await resilientUpdateUnit(
        supabase,
        existingUnitId,
        payload
      )

      if (error) {
        return { success: false, error: msg.submitUnitFailed }
      }

      try {
        await supabase
          .from('users')
          .update({
            contact_messengers: payload.contact_messengers,
            ...(payload.phone ? { phone: payload.phone } : {}),
          })
          .eq('id', sessionUser.id)

        await supabase.from('notifications').insert({
          user_id: null,
          role: 'admin',
          title: completeness.isFullyCompleteForAdmin
            ? `✅ ${msg.completedUnitAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`
            : `📝 ${msg.newDraftUnitAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`,
          message: `${payload.name || ''} · (${payload.documents.__unit_meta?.location_display || payload.area || '—'})`,
          type: 'property',
          link: `/admin/properties?unitId=${existingUnitId}`,
          is_read: false,
        })
      } catch {}

      revalidatePath('/account', 'page')
      revalidatePath('/opportunities', 'page')
      revalidatePath(`/opportunities/${existingUnitId}`, 'page')
      revalidatePath(`/units/${existingUnitId}`, 'page')
      revalidatePath('/admin', 'layout')
      return {
        success: true,
        unitId: existingUnitId,
        orderRef: generateOrderRef(existingUnitId),
      }
    }

    const payload = buildUnitPayloadWithMetaBackup(formData, null, null)
    const completeness = checkUnitHasCompleteMediaAndDetails(payload)

    payload.name = text(formData, 'name') || sessionUser.name || ''
    payload.phone =
      formatPrimaryPhone(text(formData, 'phone')) || sessionUser.phone || ''
    payload.email =
      normalizeEmail(text(formData, 'email')) || sessionUser.email || null
    payload.is_original_owner = true
    payload.status = 'pending'
    payload.views_count = 1
    payload.docs_verified = false
    payload.documents.__unit_meta = {
      ...(payload.documents.__unit_meta || {}),
      email_verified: true,
      ready_for_admin_review: completeness.isFullyCompleteForAdmin,
    }

    // توليد وحفظ الأماكن القريبة وإحداثيات المبنى وقت النشر الفعلي
    await enrichUnitPayloadWithLocationAndNearbyCache(formData, payload, null)

    const insertPayload = {
      ...payload,
      user_id: sessionUser.id,
      submission_type: completeness.isFullyCompleteForAdmin
        ? 'new'
        : 'incomplete_media',
    }

    let { data: inserted, error } = await supabase
      .from('sell_requests')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      const fallbackRes = await supabase
        .from('sell_requests')
        .insert(stripExtendedSellColumns(insertPayload))
        .select('id')
        .single()
      inserted = fallbackRes.data
      error = fallbackRes.error
    }

    if (error) {
      const fallbackCore = await supabase
        .from('sell_requests')
        .insert(stripToCoreSellColumns(insertPayload))
        .select('id')
        .single()
      inserted = fallbackCore.data
      error = fallbackCore.error
    }

    if (error || !inserted) {
      return { success: false, error: msg.submitUnitFailed }
    }

    const finalId = String(inserted.id)
    try {
      await supabase
        .from('users')
        .update({
          contact_messengers: payload.contact_messengers,
          ...(payload.phone ? { phone: payload.phone } : {}),
        })
        .eq('id', sessionUser.id)

      await supabase.from('notifications').insert({
        user_id: null,
        role: 'admin',
        title: completeness.isFullyCompleteForAdmin
          ? `✅ ${msg.newUnitReviewAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`
          : `📝 ${msg.newDraftUnitAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`,
        message: `${payload.name} · ${payload.documents.__unit_meta?.location_display || payload.area || '—'}`,
        type: 'property',
        link: `/admin/properties?unitId=${finalId}`,
        is_read: false,
      })
    } catch {}

    revalidatePath('/account', 'page')
    revalidatePath('/opportunities', 'page')
    revalidatePath(`/opportunities/${finalId}`, 'page')
    revalidatePath(`/units/${finalId}`, 'page')
    revalidatePath('/admin', 'layout')
    return {
      success: true,
      unitId: finalId,
      orderRef: generateOrderRef(finalId),
    }
  } catch {
    return {
      success: false,
      error: msg.submitUnitFailed,
    }
  }
}

export async function submitSellRequestAction(formData: FormData) {
  return submitSellRequest(formData)
}

export async function createSellRequestAction(formData: FormData) {
  return submitSellRequest(formData)
}

export async function getUsersVerificationMapAction(userIds?: string[]) {
  return _getUsersVerificationMapAction(userIds)
}

export async function markUserPhoneVerifiedAction(
  payload: Parameters<typeof _markUserPhoneVerifiedAction>[0]
) {
  return _markUserPhoneVerifiedAction(payload)
}

export async function sendSellerReviewOtpAction(
  payload?: Parameters<typeof _sendSellerReviewOtpAction>[0]
) {
  return _sendSellerReviewOtpAction(payload)
}

export async function verifySellerReviewOtpAction(
  payload: Parameters<typeof _verifySellerReviewOtpAction>[0]
) {
  return _verifySellerReviewOtpAction(payload)
}

export async function verifyMagicTokenAction(token: string) {
  return _verifyMagicTokenAction(token)
}

export async function getCurrentSellerProfileAction() {
  return _getCurrentSellerProfileAction()
}

export async function processSellerStep2Action(
  payload: Parameters<typeof _processSellerStep2Action>[0]
) {
  return _processSellerStep2Action(payload)
}

export async function verifyExistingEmailPasswordAction(
  payload: Parameters<typeof _verifyExistingEmailPasswordAction>[0]
) {
  return _verifyExistingEmailPasswordAction(payload)
}

export async function sendSellerRecoveryLinkAction(
  payload: Parameters<typeof _sendSellerRecoveryLinkAction>[0]
) {
  return _sendSellerRecoveryLinkAction(payload)
}

export async function setNewPasswordFromTokenAction(
  payload: Parameters<typeof _setNewPasswordFromTokenAction>[0]
) {
  return _setNewPasswordFromTokenAction(payload)
}

export async function processBuyerStep3Action(
  payload: Parameters<typeof _processBuyerStep3Action>[0]
) {
  return _processBuyerStep3Action(payload)
}

export async function submitBuyRequest(input: BuyRequestPayload | FormData) {
  return _submitBuyRequest(input)
}

export async function submitBuyRequestAction(
  input: BuyRequestPayload | FormData
) {
  return _submitBuyRequest(input)
}

export async function createBuyRequestAction(
  input: BuyRequestPayload | FormData
) {
  return _submitBuyRequest(input)
}

export async function submitInvestorLead(formData: FormData) {
  return _submitInvestorLead(formData)
}