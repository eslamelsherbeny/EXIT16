'use server'

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import {
  ACTIVE_COUNTRY_CODE,
  createMagicToken,
  DEFAULT_SITE_URL,
  formatPrimaryPhone,
  generateOrderRef,
  getFormsDict,
  getPhoneVariants,
  getSecret,
  getSupabase,
  getVerifiedSellerSession,
  hashPassword,
  normalizeDigits,
  normalizeEmail,
  sendNotificationEmail,
  setUserSession,
  stripToCoreSellColumns,
  upsertUserVerificationMeta,
  verifyPassword,
} from '@/lib/form-action-helpers'
import { generateOfficialUnitCode } from '@/lib/sell-payload-builder'

export type Step2AuthResponse = {
  status:
    | 'ok'
    | 'email_exists_need_password'
    | 'phone_exists_different_email'
    | 'error'
  userId?: string
  unitId?: string
  orderRef?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  emailVerified?: boolean
  error?: string
}

export async function getUsersVerificationMapAction(
  userIds?: string[]
): Promise<
  Record<string, { emailVerified: boolean; phoneVerified: boolean }>
> {
  try {
    const supabase = await getSupabase()
    const result: Record<
      string,
      { emailVerified: boolean; phoneVerified: boolean }
    > = {}

    let usersQuery = supabase
      .from('users')
      .select('id, is_verified, phone_verified')
    if (userIds && userIds.length > 0) {
      usersQuery = usersQuery.in('id', userIds)
    }
    const { data: usersData, error: uErr } = await usersQuery

    if (!uErr && usersData) {
      for (const u of usersData) {
        result[u.id] = {
          emailVerified: Boolean(u.is_verified),
          phoneVerified: Boolean((u as any).phone_verified),
        }
      }
    } else {
      let fallbackQuery = supabase.from('users').select('id, is_verified')
      if (userIds && userIds.length > 0) {
        fallbackQuery = fallbackQuery.in('id', userIds)
      }
      const { data: fbUsers } = await fallbackQuery
      for (const u of fbUsers || []) {
        result[u.id] = {
          emailVerified: Boolean(u.is_verified),
          phoneVerified: false,
        }
      }
    }

    let notifQuery = supabase
      .from('notifications')
      .select('user_id, message')
      .eq('title', '__USER_VERIFICATION_META__')
    if (userIds && userIds.length > 0) {
      notifQuery = notifQuery.in('user_id', userIds)
    }
    const { data: notifData } = await notifQuery

    for (const n of notifData || []) {
      if (!n.user_id) continue
      try {
        const parsed = JSON.parse(n.message || '{}')
        const prev = result[n.user_id] || {
          emailVerified: false,
          phoneVerified: false,
        }
        result[n.user_id] = {
          emailVerified: Boolean(prev.emailVerified || parsed.emailVerified),
          phoneVerified: Boolean(prev.phoneVerified || parsed.phoneVerified),
        }
      } catch {}
    }

    return result
  } catch {
    return {}
  }
}

export async function markUserPhoneVerifiedAction(payload: {
  userId?: string
  unitId?: string
  leadId?: string
}) {
  try {
    const supabase = await getSupabase()
    const currentSessionUser = await getVerifiedSellerSession(supabase)

    if (!currentSessionUser) {
      return { success: false, error: 'Unauthorized' }
    }

    const role = String(currentSessionUser.role || 'user')
      .trim()
      .toLowerCase()
    const isStaff =
      role === 'admin' || role === 'moderator' || role === 'sales'

    if (!isStaff) {
      return { success: false, error: 'Only admin can mark phone verified' }
    }

    let targetUserId = payload.userId || ''

    if (payload.unitId) {
      const { data: unit } = await supabase
        .from('sell_requests')
        .select('user_id, documents')
        .eq('id', payload.unitId)
        .maybeSingle()
      if (!targetUserId && unit?.user_id) {
        targetUserId = String(unit.user_id)
      }
      if (unit) {
        const docs =
          unit.documents && typeof unit.documents === 'object'
            ? { ...unit.documents }
            : {}
        docs.__unit_meta = {
          ...(docs.__unit_meta || {}),
          phone_verified: true,
        }
        await supabase
          .from('sell_requests')
          .update({ documents: docs })
          .eq('id', payload.unitId)
      }
    }

    if (!targetUserId && payload.leadId) {
      const { data: lead } = await supabase
        .from('buy_requests')
        .select('user_id')
        .eq('id', payload.leadId)
        .maybeSingle()
      if (lead?.user_id) targetUserId = String(lead.user_id)
    }

    if (targetUserId) {
      await upsertUserVerificationMeta(supabase, targetUserId, {
        phoneVerified: true,
      })
    }

    revalidatePath('/account', 'page')
    revalidatePath('/admin/properties', 'page')
    revalidatePath('/admin/leads', 'page')
    revalidatePath('/admin/users', 'page')
    return { success: true, userId: targetUserId }
  } catch {
    return { success: false }
  }
}

export async function sendSellerReviewOtpAction(payload?: {
  email?: string
  unitId?: string
  userId?: string
}) {
  const { t: msg, dir } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)

    let targetUser = sessionUser
    if (!targetUser && payload?.userId) {
      const { data: u } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', payload.userId)
        .maybeSingle()
      targetUser = u
    }

    const targetEmail = normalizeEmail(
      payload?.email || targetUser?.email || ''
    )

    if (!targetEmail) {
      return { success: false, error: msg.emailNotFound }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 15 * 60 * 1000
    const expiryIso = new Date(expiresAt).toISOString()

    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === 'production'
    const sig = createHmac('sha256', getSecret())
      .update(`${targetEmail}:${otp}:${expiresAt}`)
      .digest('hex')

    cookieStore.set('sell_verify_otp', `${expiresAt}.${sig}`, {
      path: '/',
      maxAge: 15 * 60,
      sameSite: 'lax',
      secure: isProd,
      httpOnly: true,
    })

    const activeUserId = targetUser?.id || payload?.userId
    if (activeUserId) {
      try {
        await supabase
          .from('users')
          .update({ otp_code: otp, otp_expiry: expiryIso })
          .eq('id', activeUserId)
      } catch {}
    }

    const sent = await sendNotificationEmail({
      to: targetEmail,
      senderName: msg.emailSenderName,
      subject: `${otp} — ${msg.otpSubjectPrefix} ${otp}`,
      html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
               <p style="font-size: 15px;">${msg.greetingWord} <strong>${targetUser?.name || ''}</strong>،</p>
               <p>${msg.otpSubjectPrefix}</p>
               <div style="background: #eaf8f2; border: 1px solid #aae3cb; padding: 16px; border-radius: 12px; text-align: center; margin: 18px 0;">
                 <span style="font-family: monospace; font-size: 30px; font-weight: 900; letter-spacing: 6px; color: #007a5a;">${otp}</span>
               </div>
             </div>`,
    })

    if (!sent) {
      return { success: false, error: msg.otpSendError }
    }

    return { success: true }
  } catch {
    return { success: false, error: msg.otpSendError }
  }
}

export async function verifySellerReviewOtpAction(payload: {
  email?: string
  otp: string
  unitId?: string
  userId?: string
}) {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)
    const activeUserId = sessionUser?.id || payload.userId || ''

    const targetEmail = normalizeEmail(
      payload.email || sessionUser?.email || ''
    )
    const cleanOtp = normalizeDigits(payload.otp || '').replace(/\D/g, '')

    if (!targetEmail || cleanOtp.length !== 6) {
      return { success: false, error: msg.otpInvalid }
    }

    let isValid = false
    const cookieStore = await cookies()
    const rawCookie = cookieStore.get('sell_verify_otp')?.value

    if (rawCookie && rawCookie.includes('.')) {
      const [expStr, sig] = rawCookie.split('.')
      const exp = Number(expStr)
      if (exp && Date.now() <= exp) {
        const expectedSig = createHmac('sha256', getSecret())
          .update(`${targetEmail}:${cleanOtp}:${exp}`)
          .digest('hex')
        if (
          sig.length === expectedSig.length &&
          timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
        ) {
          isValid = true
        }
      }
    }

    if (!isValid && activeUserId) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('otp_code, otp_expiry')
        .eq('id', activeUserId)
        .maybeSingle()

      if (
        dbUser?.otp_code &&
        String(dbUser.otp_code).trim() === cleanOtp &&
        (!dbUser.otp_expiry || new Date(dbUser.otp_expiry) >= new Date())
      ) {
        isValid = true
      }
    }

    if (!isValid) {
      return { success: false, error: msg.otpInvalid }
    }

    cookieStore.delete('sell_verify_otp')

    if (activeUserId) {
      try {
        await supabase
          .from('users')
          .update({ is_verified: true, otp_code: null })
          .eq('id', activeUserId)
      } catch {}

      await upsertUserVerificationMeta(supabase, activeUserId, {
        emailVerified: true,
      })
    }

    if (payload.unitId) {
      try {
        const { data: unit } = await supabase
          .from('sell_requests')
          .select('documents')
          .eq('id', payload.unitId)
          .maybeSingle()
        if (unit) {
          const docs =
            unit.documents && typeof unit.documents === 'object'
              ? { ...unit.documents }
              : {}
          docs.__unit_meta = {
            ...(docs.__unit_meta || {}),
            email_verified: true,
          }
          await supabase
            .from('sell_requests')
            .update({ documents: docs })
            .eq('id', payload.unitId)
        }
      } catch {}
    }

    revalidatePath('/account', 'page')
    revalidatePath('/admin/properties', 'page')
    revalidatePath('/admin/leads', 'page')
    revalidatePath('/admin/users', 'page')

    return { success: true }
  } catch {
    return { success: false, error: msg.otpInvalid }
  }
}

export async function verifyMagicTokenAction(token: string) {
  const { t: msg } = await getFormsDict()
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [userId, unitId, expiresStr, sig] = decoded.split(':')
    const expiresAt = Number(expiresStr)
    if (!userId || !sig || !expiresAt || Date.now() > expiresAt) {
      return { valid: false, error: msg.expiredLink }
    }

    const expectedSig = createHmac('sha256', getSecret())
      .update(`${userId}:${unitId}:${expiresAt}`)
      .digest('hex')

    if (
      sig.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return { valid: false, error: msg.invalidLink }
    }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', unitId)
      .eq('user_id', userId)
      .maybeSingle()

    const { data: userRow } = await supabase
      .from('users')
      .select('password_hash, status')
      .eq('id', userId)
      .maybeSingle()

    if (
      !userRow ||
      !unit ||
      String(userRow.status || 'active').trim().toLowerCase() === 'suspended'
    ) {
      return { valid: false, error: msg.invalidLink }
    }

    try {
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', userId)
    } catch {}

    await upsertUserVerificationMeta(supabase, userId, {
      emailVerified: true,
    })

    await setUserSession(userId, userRow?.password_hash)

    return {
      valid: true,
      userId,
      unitId,
      unit,
    }
  } catch {
    return { valid: false, error: msg.verifyFailed }
  }
}

export async function getCurrentSellerProfileAction() {
  try {
    const supabase = await getSupabase()
    const user = await getVerifiedSellerSession(supabase)
    if (!user) return { isLoggedIn: false, user: null }

    const verMap = await getUsersVerificationMapAction([user.id])
    const userVer = verMap[user.id] || {
      emailVerified: Boolean(user.is_verified),
      phoneVerified: false,
    }

    let contactMessengers: string[] = ['whatsapp', 'viber']
    try {
      const { data: extraUser } = await supabase
        .from('users')
        .select('contact_messengers')
        .eq('id', user.id)
        .maybeSingle()
      if (
        Array.isArray((extraUser as any)?.contact_messengers) &&
        (extraUser as any).contact_messengers.length > 0
      ) {
        contactMessengers = (extraUser as any).contact_messengers
      }
    } catch {}

    return {
      isLoggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        emailVerified: Boolean(user.is_verified || userVer.emailVerified),
        phoneVerified: userVer.phoneVerified,
        contactMessengers,
      },
    }
  } catch {
    return { isLoggedIn: false, user: null }
  }
}

export async function processSellerStep2Action(payload: {
  mode: 'session' | 'login' | 'register'
  listingCategory?: 'exit' | 'sale' | 'rent_monthly' | 'rent_daily' | 'pledge'
  unitCountry?: string
  userCountry?: string
  developer: string
  project: string
  contractPrice: number
  paidAmount: number
  marketPrice?: number
  contactMessengers?: string[]
  rentPrice?: number
  rentPeriod?: string
  name?: string
  phone?: string
  email?: string
  password?: string
  loginIdentifier?: string
  existingUnitId?: string
}): Promise<Step2AuthResponse> {
  const { t: msg, dir } = await getFormsDict()

  try {
    const supabase = await getSupabase()
    const siteUrl = DEFAULT_SITE_URL

    const unitCountryCode = ACTIVE_COUNTRY_CODE
    const userCountryCode = (payload.userCountry || ACTIVE_COUNTRY_CODE)
      .trim()
      .toUpperCase()
    const listingCategory = payload.listingCategory || 'exit'
    const isRent =
      listingCategory === 'rent_monthly' || listingCategory === 'rent_daily'

    const activeMessengers =
      Array.isArray(payload.contactMessengers) &&
      payload.contactMessengers.length > 0
        ? payload.contactMessengers
        : ['whatsapp']

    const invalidDevNames = [
      'newly built',
      'under construction',
      'old built',
      'completed',
    ]
    const cleanDeveloper =
      payload.developer &&
      !invalidDevNames.includes(payload.developer.trim().toLowerCase())
        ? payload.developer.trim()
        : null

    async function syncUserMessengersAndPhone(
      userId: string,
      newPhone?: string
    ) {
      try {
        const userUpdates: Record<string, any> = {
          contact_messengers: activeMessengers,
        }
        if (newPhone && newPhone.trim().length >= 8) {
          userUpdates.phone = formatPrimaryPhone(newPhone)
        }
        await supabase.from('users').update(userUpdates).eq('id', userId)
      } catch {}
    }

    async function upsertDraftUnit(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      await syncUserMessengersAndPhone(userId, contact.phone)

      const effectivePaid = isRent
        ? Number(payload.rentPrice || payload.paidAmount) || 0
        : Number(payload.paidAmount || payload.contractPrice) || 0
      const effectiveContract = isRent
        ? effectivePaid
        : Number(payload.contractPrice || payload.paidAmount) || 0

      const generatedCode = generateOfficialUnitCode()

      const unitData: Record<string, any> = {
        user_id: userId,
        code: generatedCode,
        views_count: 1,
        docs_verified: false,
        country: unitCountryCode,
        country_code: unitCountryCode,
        currency_code: 'USD',
        contact_messengers: activeMessengers,
        listing_category: listingCategory,
        rent_price: isRent ? effectivePaid : 0,
        rent_period:
          payload.rentPeriod ||
          (listingCategory === 'rent_daily' ? 'daily' : 'monthly'),
        developer_name: cleanDeveloper,
        project_name: payload.project || null,
        contract_price: effectiveContract,
        paid_amount: effectivePaid,
        market_price: Number(payload.marketPrice) || effectiveContract,
        name: contact.name || msg.unitOwnerFallback,
        phone: contact.phone,
        email: contact.email || null,
        is_original_owner: true,
        status: 'pending',
        submission_type: 'draft',
        documents: {
          __unit_meta: {
            code: generatedCode,
            listing_category: listingCategory,
            contact_messengers: activeMessengers,
            developer_name: cleanDeveloper,
            rent_price: isRent ? effectivePaid : 0,
            rent_period:
              payload.rentPeriod ||
              (listingCategory === 'rent_daily' ? 'daily' : 'monthly'),
            ready_for_admin_review: false,
          },
        },
      }

      if (payload.existingUnitId) {
        const { data: existingRow } = await supabase
          .from('sell_requests')
          .select('id, code, user_id, documents')
          .eq('id', payload.existingUnitId)
          .maybeSingle()

        if (existingRow && existingRow.user_id === userId) {
          unitData.code = existingRow.code || generatedCode
          unitData.documents = {
            ...(existingRow.documents || {}),
            __unit_meta: {
              ...(existingRow.documents?.__unit_meta || {}),
              ...unitData.documents.__unit_meta,
              code: unitData.code,
              contact_messengers: activeMessengers,
            },
          }
          const { error: updErr } = await supabase
            .from('sell_requests')
            .update(unitData)
            .eq('id', payload.existingUnitId)
            .eq('user_id', userId)

          if (updErr) {
            await supabase
              .from('sell_requests')
              .update(stripToCoreSellColumns(unitData))
              .eq('id', payload.existingUnitId)
              .eq('user_id', userId)
          }
          return payload.existingUnitId
        }
      }

      let { data: inserted, error: insErr } = await supabase
        .from('sell_requests')
        .insert(unitData)
        .select('id')
        .single()

      if (insErr || !inserted) {
        const fallbackIns = await supabase
          .from('sell_requests')
          .insert(stripToCoreSellColumns(unitData))
          .select('id')
          .single()
        inserted = fallbackIns.data
      }

      return inserted?.id ? String(inserted.id) : ''
    }

    async function sendOrderConfirmationMagicEmail(
      userId: string,
      unitId: string,
      userName: string,
      userEmail: string
    ) {
      if (!userEmail || !unitId) return
      const orderRef = generateOrderRef(unitId)
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
      const magicToken = createMagicToken(userId, unitId, expiresAt)
      const magicLink = `${siteUrl}/sell?magic=${encodeURIComponent(magicToken)}`
      const accountLink = `${siteUrl}/account?view=seller&unitId=${encodeURIComponent(unitId)}`
      const paidFormatted = Number(
        payload.paidAmount || payload.rentPrice || payload.contractPrice || 0
      ).toLocaleString('en-US')

      await sendNotificationEmail({
        to: userEmail,
        senderName: msg.emailSenderName,
        subject: `${msg.orderReceivedSubjectPrefix} ${orderRef}`,
        html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
                 <p style="font-size: 16px;">${msg.greetingWord} <strong>${userName}</strong>،</p>
                 <p>${msg.orderRefLabel}: <strong>${orderRef}</strong>.</p>
                 <p>${msg.orderPaidConfirmText}: <strong>$${paidFormatted}</strong>.</p>
                 <p>${msg.orderMagicLinkPrompt}:</p>
                 <p style="margin: 18px 0;">
                   <a href="${accountLink}" style="display: inline-block; background: #007a5a; color: #ffffff; padding: 10px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; margin-inline-end: 10px;">متابعة حالة وحدتي في حسابي</a>
                   <a href="${magicLink}" style="color: #2563eb; font-weight: bold; word-break: break-all;">استكمال أو تعديل بيانات الوحدة</a>
                 </p>
               </div>`,
      }).catch(() => {})
    }

    if (payload.mode === 'session') {
      const currentUser = await getVerifiedSellerSession(supabase)
      if (!currentUser) {
        return { status: 'error', error: msg.sessionExpired }
      }

      const resolvedPhone = payload.phone
        ? formatPrimaryPhone(payload.phone)
        : currentUser.phone || ''

      const unitId = await upsertDraftUnit(currentUser.id, {
        name: payload.name || currentUser.name || msg.unitOwnerFallback,
        phone: resolvedPhone,
        email: currentUser.email || '',
      })

      const orderRef = generateOrderRef(unitId)
      if (currentUser.email && !currentUser.is_verified) {
        void sendOrderConfirmationMagicEmail(
          currentUser.id,
          unitId,
          currentUser.name || msg.unitOwnerFallback,
          currentUser.email
        )
      }

      return {
        status: 'ok',
        userId: currentUser.id,
        unitId,
        orderRef,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: resolvedPhone || currentUser.phone,
        emailVerified: Boolean(currentUser.is_verified),
      }
    }

    if (payload.mode === 'login') {
      const rawIdentifier = (payload.loginIdentifier || '').trim()
      const password = payload.password || ''

      if (!rawIdentifier || !password) {
        return { status: 'error', error: msg.enterLogin }
      }

      let candidates: any[] = []
      if (rawIdentifier.includes('@')) {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash, status, is_verified')
          .ilike('email', normalizeEmail(rawIdentifier))
        candidates = data || []
      } else {
        const variants = getPhoneVariants(rawIdentifier)
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash, status, is_verified')
          .in('phone', variants)
        candidates = data || []
      }

      if (candidates.length === 0) {
        return { status: 'error', error: msg.notRegistered }
      }

      const matched = candidates.find((u) =>
        verifyPassword(password, u.password_hash)
      )
      if (!matched) {
        return { status: 'error', error: msg.wrongPassword }
      }

      await setUserSession(matched.id, matched.password_hash)
      const unitId = await upsertDraftUnit(matched.id, {
        name: matched.name || msg.unitOwnerFallback,
        phone: matched.phone || '',
        email: matched.email || '',
      })

      const orderRef = generateOrderRef(unitId)
      if (matched.email && !matched.is_verified) {
        void sendOrderConfirmationMagicEmail(
          matched.id,
          unitId,
          matched.name || msg.unitOwnerFallback,
          matched.email
        )
      }

      return {
        status: 'ok',
        userId: matched.id,
        unitId,
        orderRef,
        userName: matched.name,
        userEmail: matched.email,
        userPhone: matched.phone,
        emailVerified: Boolean(matched.is_verified),
      }
    }

    const cleanName = (payload.name || '').trim()
    const cleanEmail = normalizeEmail(payload.email || '')
    const formattedPhone = formatPrimaryPhone(payload.phone || '')
    const phoneVariants = getPhoneVariants(payload.phone || '')
    const password = payload.password || ''

    if (!cleanName || !cleanEmail || !formattedPhone || password.length < 8) {
      return { status: 'error', error: msg.fillAll }
    }

    const [{ data: emailMatches }, { data: phoneMatches }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash, is_verified')
        .ilike('email', cleanEmail)
        .limit(1),
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash, is_verified')
        .in('phone', phoneVariants)
        .limit(1),
    ])

    const emailUser = emailMatches?.[0] || null
    const phoneUser = phoneMatches?.[0] || null

    if (emailUser) {
      if (verifyPassword(password, emailUser.password_hash)) {
        await setUserSession(emailUser.id, emailUser.password_hash)
        const unitId = await upsertDraftUnit(emailUser.id, {
          name: emailUser.name || cleanName,
          phone: emailUser.phone || formattedPhone,
          email: emailUser.email,
        })
        return {
          status: 'ok',
          userId: emailUser.id,
          unitId,
          orderRef: generateOrderRef(unitId),
          userName: emailUser.name,
          userEmail: emailUser.email,
          userPhone: emailUser.phone || formattedPhone,
          emailVerified: Boolean(emailUser.is_verified),
        }
      }

      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        unitId: '',
        orderRef: 'AE-VERIFY',
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

    if (phoneUser && !emailUser) {
      if (verifyPassword(password, phoneUser.password_hash)) {
        await setUserSession(phoneUser.id, phoneUser.password_hash)
        const unitId = await upsertDraftUnit(phoneUser.id, {
          name: phoneUser.name || cleanName,
          phone: phoneUser.phone,
          email: phoneUser.email,
        })
        return {
          status: 'ok',
          userId: phoneUser.id,
          unitId,
          orderRef: generateOrderRef(unitId),
          userName: phoneUser.name,
          userEmail: phoneUser.email,
          userPhone: phoneUser.phone,
          emailVerified: Boolean(phoneUser.is_verified),
        }
      }

      return {
        status: 'phone_exists_different_email',
        userId: phoneUser.id,
        unitId: '',
        orderRef: 'AE-VERIFY',
        userEmail: phoneUser.email,
        userPhone: phoneUser.phone,
      }
    }

    const hash = hashPassword(password)
    const userInsertPayload: Record<string, any> = {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
      password_hash: hash,
      country: userCountryCode,
      role: 'user',
      status: 'active',
      is_verified: false,
      contact_messengers: activeMessengers,
    }

    let { data: createdUser, error: createErr } = await supabase
      .from('users')
      .insert(userInsertPayload)
      .select('id, name, email, phone')
      .single()

    if (createErr || !createdUser) {
      const { contact_messengers: _cm, ...basicUserPayload } = userInsertPayload
      const retryUser = await supabase
        .from('users')
        .insert(basicUserPayload)
        .select('id, name, email, phone')
        .single()
      createdUser = retryUser.data
      createErr = retryUser.error
    }

    if (createErr || !createdUser) {
      return { status: 'error', error: msg.createAccountFailed }
    }

    await setUserSession(createdUser.id, hash)
    const unitId = await upsertDraftUnit(createdUser.id, {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
    })
    const orderRef = generateOrderRef(unitId)

    await sendOrderConfirmationMagicEmail(
      createdUser.id,
      unitId,
      cleanName,
      cleanEmail
    )

    return {
      status: 'ok',
      userId: createdUser.id,
      unitId,
      orderRef,
      userName: createdUser.name,
      userEmail: createdUser.email,
      userPhone: createdUser.phone,
      emailVerified: false,
    }
  } catch (e) {
    console.error('processSellerStep2Action error:', e)
    return { status: 'error', error: msg.unexpected }
  }
}

export async function verifyExistingEmailPasswordAction(payload: {
  email: string
  password: string
}) {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const cleanEmail = normalizeEmail(payload.email)
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, phone, password_hash, is_verified')
      .ilike('email', cleanEmail)

    const matched = (users || []).find((u) =>
      verifyPassword(payload.password, u.password_hash)
    )

    if (!matched) {
      return { success: false, error: msg.wrongPassword }
    }

    await setUserSession(matched.id, matched.password_hash)
    return {
      success: true,
      user: {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        emailVerified: Boolean(matched.is_verified),
      },
    }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

export async function sendSellerRecoveryLinkAction(payload: {
  userId?: string
  email?: string
  unitId?: string
}) {
  const { t: msg, dir } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    let targetUser: any = null

    if (payload.userId) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', payload.userId)
        .maybeSingle()
      targetUser = data
    } else if (payload.email) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .ilike('email', normalizeEmail(payload.email))
        .limit(1)
      targetUser = data?.[0]
    }

    if (!targetUser || !targetUser.email) {
      return { success: false, error: msg.emailNotFound }
    }

    const siteUrl = DEFAULT_SITE_URL
    const expiresAt = Date.now() + 60 * 60 * 1000
    const tokenHash = createMagicToken(
      targetUser.id,
      payload.unitId || '',
      expiresAt
    )

    const nextUrl = payload.unitId
      ? `/sell?magic=${encodeURIComponent(tokenHash)}`
      : '/account'
    const resetLink = `${siteUrl}/set-password?token_hash=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(nextUrl)}`

    await sendNotificationEmail({
      to: targetUser.email,
      senderName: msg.emailSenderName,
      subject: msg.recoveryEmailSubject,
      html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
               <p>${msg.recoveryEmailPrompt}:</p>
               <p style="margin: 18px 0;">
                 <a href="${resetLink}" style="color: #0b6954; font-weight: bold; word-break: break-all;">${resetLink}</a>
               </p>
             </div>`,
    })

    return { success: true }
  } catch {
    return { success: false, error: msg.sendLinkFailed }
  }
}

export async function setNewPasswordFromTokenAction(payload: {
  tokenHash: string
  newPassword: string
}) {
  const { t: msg } = await getFormsDict()
  try {
    if (!payload.newPassword || payload.newPassword.length < 8) {
      return { success: false, error: msg.shortPassword }
    }

    const verify = await verifyMagicTokenAction(payload.tokenHash)
    if (!verify.valid || !verify.userId) {
      return {
        success: false,
        error: verify.error || msg.expiredLink,
      }
    }

    const supabase = await getSupabase()
    const newHash = hashPassword(payload.newPassword)

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newHash, is_verified: true, status: 'active' })
      .eq('id', verify.userId)

    if (error) {
      return { success: false, error: msg.updatePassFailed }
    }

    await upsertUserVerificationMeta(supabase, verify.userId, {
      emailVerified: true,
    })

    await setUserSession(verify.userId, newHash)

    return {
      success: true,
      unitId: verify.unitId,
    }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}