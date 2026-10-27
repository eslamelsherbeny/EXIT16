'use server'

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import {
  ACTIVE_COUNTRY_CODE,
  ACTIVE_CURRENCY_CODE,
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
  integer,
  list,
  normalizeDigits,
  normalizeEmail,
  number,
  parseDeliveryDateFromStatus,
  sendNotificationEmail,
  setUserSession,
  stripExtendedSellColumns,
  stripToCoreSellColumns,
  text,
  upsertUserVerificationMeta,
  verifyPassword,
} from '@/lib/form-action-helpers'
import {
  processBuyerStep3Action as _processBuyerStep3Action,
  submitBuyRequest as _submitBuyRequest,
  submitInvestorLead as _submitInvestorLead,
  type BuyRequestPayload,
} from './buyer-investor-actions'

export type { BuyRequestPayload }

export type SubmitResult = {
  success: boolean
  error?: string
  unitId?: string
  orderRef?: string
}

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

/**
 * توثيق رقم الهاتف أصبح محصوراً بالأدمن فقط (عندما يفتح الأدمن الرابط المرسل له على واتساب أو يضغط زر التوثيق في لوحة الإدارة)
 * لا يُسمح للمستخدم العادي بتوثيق هاتفه لنفسه بمجرد الضغط على الزر!
 */
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

    // إذا لم يكن المتصل أدمن/موظف، نرفض توثيق الهاتف فوراً!
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
}) {
  const { t: msg, dir } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)
    const targetEmail = normalizeEmail(
      payload?.email || sessionUser?.email || ''
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

    if (sessionUser?.id) {
      try {
        await supabase
          .from('users')
          .update({ otp_code: otp, otp_expiry: expiryIso })
          .eq('id', sessionUser.id)
      } catch {}
    }

    const sent = await sendNotificationEmail({
      to: targetEmail,
      senderName: msg.emailSenderName,
      subject: `${otp} — ${msg.otpSubjectPrefix} ${otp}`,
      html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
              <p style="font-size: 15px;">${msg.greetingWord} <strong>${sessionUser?.name || ''}</strong>،</p>
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
}) {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)
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

    if (!isValid && sessionUser?.id) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('otp_code, otp_expiry')
        .eq('id', sessionUser.id)
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

    if (sessionUser?.id) {
      await upsertUserVerificationMeta(supabase, sessionUser.id, {
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

    return {
      isLoggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        emailVerified: userVer.emailVerified,
        phoneVerified: userVer.phoneVerified,
      },
    }
  } catch {
    return { isLoggedIn: false, user: null }
  }
}

export async function processSellerStep2Action(payload: {
  mode: 'session' | 'login' | 'register'
  unitCountry?: string
  userCountry?: string
  developer: string
  project: string
  contractPrice: number
  paidAmount: number
  marketPrice?: number
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

    async function upsertDraftUnit(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const unitData: Record<string, any> = {
        user_id: userId,
        country: unitCountryCode,
        country_code: unitCountryCode,
        developer_name: payload.developer || null,
        project_name: payload.project || null,
        contract_price: Number(payload.contractPrice) || 0,
        paid_amount: Number(payload.paidAmount) || 0,
        market_price:
          Number(payload.marketPrice) || Number(payload.contractPrice) || 0,
        name: contact.name || msg.unitOwnerFallback,
        phone: contact.phone,
        email: contact.email || null,
        is_original_owner: true,
        status: 'pending',
      }

      if (payload.existingUnitId) {
        const { data: existingRow } = await supabase
          .from('sell_requests')
          .select('id, user_id')
          .eq('id', payload.existingUnitId)
          .maybeSingle()

        if (existingRow && existingRow.user_id === userId) {
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

      const newUnitId = inserted?.id ? String(inserted.id) : ''

      try {
        await supabase.from('notifications').insert([
          {
            user_id: null,
            title: `${msg.newDraftUnitAdminTitle} (${unitCountryCode}): ${payload.project || msg.unitWord}`,
            message: `${contact.name} · ${Number(payload.paidAmount || 0).toLocaleString('en-US')}`,
            type: 'property',
            link: '/admin/properties',
            is_read: false,
          },
          {
            user_id: userId,
            title: msg.unitSubmittedSellerTitle,
            message: `${msg.unitSubmittedSellerMsg} (${payload.project || msg.unitWord})`,
            type: 'status_update',
            link: '/account?view=seller',
            is_read: false,
          },
        ])
      } catch {}

      return newUnitId
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
      const paidFormatted = Number(payload.paidAmount || 0).toLocaleString(
        'en-US'
      )

      await sendNotificationEmail({
        to: userEmail,
        senderName: msg.emailSenderName,
        subject: `${msg.orderReceivedSubjectPrefix} ${orderRef}`,
        html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
                <p style="font-size: 16px;">${msg.greetingWord} <strong>${userName}</strong>،</p>
                <p>${msg.orderRefLabel}: <strong>${orderRef}</strong>.</p>
                <p>${msg.orderPaidConfirmText}: <strong>${paidFormatted}</strong>.</p>
                <p>${msg.orderMagicLinkPrompt}:</p>
                <p style="margin: 18px 0;">
                  <a href="${magicLink}" style="color: #0b6954; font-weight: bold; word-break: break-all;">${magicLink}</a>
                </p>
               </div>`,
      }).catch(() => {})
    }

    if (payload.mode === 'session') {
      const currentUser = await getVerifiedSellerSession(supabase)
      if (!currentUser) {
        return { status: 'error', error: msg.sessionExpired }
      }

      const unitId = await upsertDraftUnit(currentUser.id, {
        name: currentUser.name || msg.unitOwnerFallback,
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      })

      const orderRef = generateOrderRef(unitId)
      if (currentUser.email) {
        sendOrderConfirmationMagicEmail(
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
        userPhone: currentUser.phone,
      }
    }

    if (payload.mode === 'login') {
      const rawIdentifier = (payload.loginIdentifier || '').trim()
      const password = payload.password || ''

      if (!rawIdentifier || !password) {
        return {
          status: 'error',
          error: msg.enterLogin,
        }
      }

      let candidates: any[] = []
      if (rawIdentifier.includes('@')) {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash, status')
          .ilike('email', normalizeEmail(rawIdentifier))
        candidates = data || []
      } else {
        const variants = getPhoneVariants(rawIdentifier)
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash, status')
          .in('phone', variants)
        candidates = data || []
      }

      if (candidates.length === 0) {
        return {
          status: 'error',
          error: msg.notRegistered,
        }
      }

      const matched = candidates.find((u) =>
        verifyPassword(password, u.password_hash)
      )
      if (!matched) {
        return {
          status: 'error',
          error: msg.wrongPassword,
        }
      }

      await setUserSession(matched.id, matched.password_hash)
      const unitId = await upsertDraftUnit(matched.id, {
        name: matched.name || msg.unitOwnerFallback,
        phone: matched.phone || '',
        email: matched.email || '',
      })

      const orderRef = generateOrderRef(unitId)
      if (matched.email) {
        sendOrderConfirmationMagicEmail(
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
      }
    }

    const cleanName = (payload.name || '').trim()
    const cleanEmail = normalizeEmail(payload.email || '')
    const formattedPhone = formatPrimaryPhone(payload.phone || '')
    const phoneVariants = getPhoneVariants(payload.phone || '')
    const password = payload.password || ''

    if (!cleanName || !cleanEmail || !formattedPhone || password.length < 8) {
      return {
        status: 'error',
        error: msg.fillAll,
      }
    }

    const [{ data: emailMatches }, { data: phoneMatches }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash')
        .ilike('email', cleanEmail)
        .limit(1),
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash')
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
          userPhone: emailUser.phone,
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
    const { data: createdUser, error: createErr } = await supabase
      .from('users')
      .insert({
        name: cleanName,
        phone: formattedPhone,
        email: cleanEmail,
        password_hash: hash,
        country: userCountryCode,
        role: 'user',
        status: 'active',
        is_verified: false,
      })
      .select('id, name, email, phone')
      .single()

    if (createErr || !createdUser) {
      return {
        status: 'error',
        error: msg.createAccountFailed,
      }
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
      .select('id, name, email, phone, password_hash')
      .ilike('email', cleanEmail)

    const matched = (users || []).find((u) =>
      verifyPassword(payload.password, u.password_hash)
    )

    if (!matched) {
      return {
        success: false,
        error: msg.wrongPassword,
      }
    }

    await setUserSession(matched.id, matched.password_hash)
    return {
      success: true,
      user: {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
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
      return {
        success: false,
        error: msg.shortPassword,
      }
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

    // بما أنه استلم الرابط على إيميله وعيّن كلمة المرور، يتم توثيق بريده الإلكتروني أوتوماتيكياً
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

function buildUnitPayloadWithMetaBackup(
  formData: FormData,
  existingDocuments?: Record<string, any> | null
) {
  let parsedDocuments: Record<string, any> =
    existingDocuments && typeof existingDocuments === 'object'
      ? { ...existingDocuments }
      : {}

  const rawDocsJson = text(formData, 'documents_json')
  if (rawDocsJson) {
    try {
      const parsed = JSON.parse(rawDocsJson)
      if (parsed && typeof parsed === 'object') {
        parsedDocuments = { ...parsedDocuments, ...parsed }
      }
    } catch {}
  }

  const deliveryStatusRaw = text(formData, 'delivery_status')
  const parsedDel = parseDeliveryDateFromStatus(deliveryStatusRaw)

  const sizeVal = number(formData, 'size')
  const roomsVal = number(formData, 'rooms')
  const bathsVal = number(formData, 'bathrooms')
  const floorVal = text(formData, 'floor_number')
  const gardenVal = number(formData, 'garden_size')
  const finishingVal = text(formData, 'finishing') || null
  const areaVal = text(formData, 'area') || null
  const unitTypeVal = text(formData, 'unit_type') || null
  const contractMonthVal = text(formData, 'contract_month') || null
  const contractYearVal = integer(formData, 'contract_year')
  const yearsLeftVal = integer(formData, 'years_left')
  const instAmountVal = number(formData, 'installment_amount')
  const instFreqVal = text(formData, 'installment_frequency') || null
  const featuresList = list(formData, 'feature')

  parsedDocuments.__unit_meta = {
    ...(parsedDocuments.__unit_meta || {}),
    area: areaVal,
    unit_type: unitTypeVal,
    size: sizeVal,
    rooms: roomsVal,
    bathrooms: bathsVal,
    floor_number: floorVal || null,
    garden_size: gardenVal,
    finishing: finishingVal,
    delivery_status: deliveryStatusRaw || null,
    delivery_month: text(formData, 'delivery_month') || parsedDel.deliveryMonth,
    delivery_year:
      integer(formData, 'delivery_year') || parsedDel.deliveryYear,
    contract_month: contractMonthVal,
    contract_year: contractYearVal,
    years_left: yearsLeftVal,
    installment_amount: instAmountVal,
    installment_frequency: instFreqVal,
    features: featuresList,
  }

  const payload: Record<string, any> = {
    country: ACTIVE_COUNTRY_CODE,
    country_code: ACTIVE_COUNTRY_CODE,
    currency_code: ACTIVE_CURRENCY_CODE,
    developer_name: text(formData, 'developer_name') || null,
    project_name: text(formData, 'project_name') || null,
    area: areaVal,
    unit_type: unitTypeVal,
    size: sizeVal,
    rooms: roomsVal,
    bathrooms: bathsVal,
    floor_number: floorVal ? integer(formData, 'floor_number') : null,
    garden_size: gardenVal,
    finishing: finishingVal,
    delivery_status: deliveryStatusRaw || null,
    delivery_month:
      text(formData, 'delivery_month') || parsedDel.deliveryMonth,
    delivery_year:
      integer(formData, 'delivery_year') || parsedDel.deliveryYear,
    features: featuresList,
    description: text(formData, 'description') || null,
    contract_price: number(formData, 'contract_price'),
    paid_amount: number(formData, 'paid_amount'),
    market_price:
      number(formData, 'market_price') || number(formData, 'contract_price'),
    installment_amount: instAmountVal,
    installment_frequency: instFreqVal,
    contract_month: contractMonthVal,
    contract_year: contractYearVal,
    years_left: yearsLeftVal,
    has_annual_installment: formData.get('has_annual_installment') === 'on',
    annual_installment_amount: number(formData, 'annual_installment_amount'),
    willing_to_discount: formData.get('willing_to_discount') === 'on',
    discount_amount: number(formData, 'discount_amount'),
    has_overdue_installments:
      formData.get('has_overdue_installments') === 'on',
    overdue_installments: number(formData, 'overdue_installments'),
    overdue_total_amount: number(formData, 'overdue_total_amount'),
    images: list(formData, 'image'),
    documents: parsedDocuments,
  }

  return payload
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

export async function saveSellProgress(
  formData: FormData
): Promise<SubmitResult> {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)
    const unitId = text(formData, 'unit_id')

    if (!sessionUser) {
      return {
        success: false,
        error: msg.sessionExpired,
      }
    }

    let targetUnitId = unitId

    if (!targetUnitId) {
      const { data: existing } = await supabase
        .from('sell_requests')
        .select('id')
        .eq('user_id', sessionUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      targetUnitId = existing?.id ? String(existing.id) : ''
    }

    if (!targetUnitId) {
      return { success: false, error: msg.saveProgressFailed }
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
      existingUnit?.documents
    )
    payload.user_id = existingUnit?.user_id || sessionUser.id

    const { error } = await resilientUpdateUnit(
      supabase,
      targetUnitId,
      payload
    )

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
    const sessionUser = await getVerifiedSellerSession(supabase)
    let existingUnitId = text(formData, 'unit_id')
    const projectName = text(formData, 'project_name')
    const unitCountry = ACTIVE_COUNTRY_CODE
    const customSubType = text(formData, 'submission_type') || 'new'

    if (!sessionUser) {
      return {
        success: false,
        error: msg.sessionExpired,
      }
    }

    if (!existingUnitId) {
      const { data: recentDraft } = await supabase
        .from('sell_requests')
        .select('id, size, area, project_name')
        .eq('user_id', sessionUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (
        recentDraft &&
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

      const payload = buildUnitPayloadWithMetaBackup(
        formData,
        prevUnit?.documents
      )
      payload.user_id = prevUnit.user_id || sessionUser.id
      payload.name = text(formData, 'name') || prevUnit.name || sessionUser.name
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
      payload.status = 'pending'

      const wasPreviouslySubmitted = Boolean(
        prevUnit?.area ||
          prevUnit?.size ||
          prevUnit?.status === 'active' ||
          prevUnit?.status === 'paused_by_seller'
      )

      if (wasPreviouslySubmitted) {
        payload.submission_type = 'edited_by_seller'
        payload.last_seller_edit_at = new Date().toISOString()
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
        await supabase.from('notifications').insert({
          user_id: null,
          title: wasPreviouslySubmitted
            ? `🔄 ${msg.editedUnitAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`
            : `✅ ${msg.completedUnitAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`,
          message: `${payload.name || ''} · (${payload.area || '—'})`,
          type: 'property',
          link: `/admin/properties?unitId=${existingUnitId}`,
          is_read: false,
        })
      } catch {}

      revalidatePath('/account', 'page')
      revalidatePath('/opportunities', 'page')
      revalidatePath(`/opportunities/${existingUnitId}`, 'page')
      revalidatePath('/admin', 'layout')
      return {
        success: true,
        unitId: existingUnitId,
        orderRef: generateOrderRef(existingUnitId),
      }
    }

    const payload = buildUnitPayloadWithMetaBackup(formData, null)
    payload.name = text(formData, 'name') || sessionUser.name || ''
    payload.phone =
      formatPrimaryPhone(text(formData, 'phone')) || sessionUser.phone || ''
    payload.email =
      normalizeEmail(text(formData, 'email')) || sessionUser.email || null
    payload.is_original_owner = true
    payload.status = 'pending'

    const insertPayload = {
      ...payload,
      user_id: sessionUser.id,
      submission_type: customSubType,
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
      await supabase.from('notifications').insert({
        user_id: null,
        title: `${msg.newUnitReviewAdminTitle} (${unitCountry}): ${projectName || msg.unitWord}`,
        message: `${payload.name} · ${payload.area || '—'}`,
        type: 'property',
        link: `/admin/properties?unitId=${finalId}`,
        is_read: false,
      })
    } catch {}

    revalidatePath('/account', 'page')
    revalidatePath('/opportunities', 'page')
    revalidatePath(`/opportunities/${finalId}`, 'page')
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

export const submitSellRequestAction = submitSellRequest
export const createSellRequestAction = submitSellRequest

export async function processBuyerStep3Action(
  payload: Parameters<typeof _processBuyerStep3Action>[0]
) {
  return _processBuyerStep3Action(payload)
}

export async function submitBuyRequest(input: BuyRequestPayload | FormData) {
  return _submitBuyRequest(input)
}

export const submitBuyRequestAction = submitBuyRequest
export const createBuyRequestAction = submitBuyRequest

export async function submitInvestorLead(formData: FormData) {
  return _submitInvestorLead(formData)
}
