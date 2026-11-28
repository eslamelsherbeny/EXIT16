'use server'

import { createHmac } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getServerI18n } from '@/lib/get-server-dictionary'
import { validateInternationalE164Phone } from '@/lib/phone-validation'
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
  integer,
  list,
  normalizeEmail,
  number,
  sendNotificationEmail,
  setUserSession,
  text,
  verifyPassword,
} from '@/lib/form-action-helpers'
import type { Step2AuthResponse, SubmitResult } from './submit-forms'

export type BuyRequestPayload = {
  country?: string
  userCountry?: string
  available_cash: number
  max_installment: number
  payment_plan: string
  budget: number
  unit_types: string[]
  min_rooms: number
  delivery_status: string
  preferred_areas: string[]
  name: string
  phone: string
  email: string
  password: string
  contactMessengers?: string[]
}

function isSuspendedStatus(status?: string | null): boolean {
  return String(status || 'active').trim().toLowerCase() === 'suspended'
}

function escapeEmailHtml(val: unknown): string {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// مقبض مؤقت موقّع (15 دقيقة) لطلب استعادة كلمة المرور بدون كشف UUID أو بيانات صاحب الحساب
function createSignedRecoveryHandle(userId: string): string {
  const expiresAt = Date.now() + 15 * 60 * 1000
  const payload = `${userId}:${expiresAt}`
  const sig = createHmac('sha256', getSecret())
    .update(`rec_handle:${payload}`)
    .digest('hex')
    .slice(0, 32)
  const encoded = Buffer.from(`${payload}:${sig}`, 'utf8').toString('base64url')
  return `rh.${encoded}`
}

export async function processBuyerStep3Action(payload: {
  mode: 'session' | 'login' | 'register'
  country?: string
  userCountry?: string
  available_cash: number
  max_installment: number
  payment_plan: string
  budget: number
  unit_types: string[]
  min_rooms: number
  delivery_status: string
  preferred_areas: string[]
  name?: string
  phone?: string
  email?: string
  password?: string
  loginIdentifier?: string
  contactMessengers?: string[]
}): Promise<Step2AuthResponse> {
  const [{ t: msg, dir }, { locale, dict }] = await Promise.all([
    getFormsDict(),
    getServerI18n(),
  ])
  const phoneMessages = (dict.common as Record<string, any>)?.phoneValidation

  try {
    const supabase = await getSupabase()
    const siteUrl = DEFAULT_SITE_URL

    const targetCountry = ACTIVE_COUNTRY_CODE
    const buyerResidenceCountry = (payload.userCountry || ACTIVE_COUNTRY_CODE)
      .trim()
      .slice(0, 5)
      .toUpperCase()

    const activeMessengers =
      Array.isArray(payload.contactMessengers) &&
      payload.contactMessengers.length > 0
        ? payload.contactMessengers
            .map((m) => String(m || '').trim().slice(0, 20))
            .filter(Boolean)
            .slice(0, 5)
        : ['whatsapp']

    const cleanUnitTypes = Array.isArray(payload.unit_types)
      ? payload.unit_types
          .map((t) => String(t || '').trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 20)
      : []

    const cleanPreferredAreas = Array.isArray(payload.preferred_areas)
      ? payload.preferred_areas
          .map((a) => String(a || '').trim().slice(0, 120))
          .filter(Boolean)
          .slice(0, 25)
      : []

    const safeAvailableCash = Math.max(
      0,
      Number(payload.available_cash) || 0
    )
    const safeMaxInstallment = Math.max(
      0,
      Number(payload.max_installment) || 0
    )
    const safeBudget = Math.max(
      safeAvailableCash,
      Number(payload.budget) || 0
    )
    const safeMinRooms = Math.max(
      0,
      Math.min(20, Math.round(Number(payload.min_rooms) || 0))
    )

    async function syncBuyerUserMessengers(
      userId: string,
      currentPhone?: string | null,
      newPhone?: string
    ) {
      try {
        const updates: Record<string, any> = {
          contact_messengers: activeMessengers,
        }
        if (!currentPhone && newPhone && newPhone.trim().length >= 8) {
          const formatted = formatPrimaryPhone(newPhone)
          const { data: phoneConflict } = await supabase
            .from('users')
            .select('id')
            .eq('phone', formatted)
            .neq('id', userId)
            .limit(1)
          if (!phoneConflict || phoneConflict.length === 0) {
            updates.phone = formatted
          }
        }
        await supabase.from('users').update(updates).eq('id', userId)
      } catch {}
    }

    async function insertBuyRequestRecord(
      userId: string,
      contact: {
        name: string
        phone: string
        email: string
        currentPhone?: string | null
      }
    ) {
      await syncBuyerUserMessengers(userId, contact.currentPhone, contact.phone)

      const buyRow: Record<string, any> = {
        user_id: userId,
        country: targetCountry,
        country_code: targetCountry,
        currency_code: 'USD',
        target_category: 'exit',
        available_cash: safeAvailableCash,
        max_installment: safeMaxInstallment,
        payment_plan: String(
          payload.payment_plan || msg.defaultMonthly
        ).slice(0, 60),
        budget: safeBudget,
        unit_types: cleanUnitTypes,
        min_rooms: safeMinRooms,
        delivery_status: String(
          payload.delivery_status || msg.defaultReady
        ).slice(0, 60),
        preferred_areas: cleanPreferredAreas,
        name: (contact.name || msg.buyerFallback).slice(0, 120),
        phone: (contact.phone || '').slice(0, 30),
        email: contact.email || null,
      }

      let { data: inserted, error } = await supabase
        .from('buy_requests')
        .insert(buyRow)
        .select('id')
        .single()

      if (error) {
        const {
          currency_code: _cc,
          target_category: _tc,
          ...fallbackRow
        } = buyRow
        const retry = await supabase
          .from('buy_requests')
          .insert(fallbackRow)
          .select('id')
          .single()
        inserted = retry.data
      }

      const reqId = inserted?.id ? String(inserted.id) : ''
      const cashFormatted = Number(
        safeAvailableCash || safeBudget || 0
      ).toLocaleString('en-US')
      const comma = dir === 'rtl' ? '،' : ','
      const listSep = dir === 'rtl' ? '، ' : ', '

      try {
        await supabase.from('notifications').insert([
          {
            user_id: null,
            role: 'admin',
            title: `${msg.newBuyRequestAdminTitle} (${targetCountry}): ${contact.name || msg.buyerFallback}`,
            message: `$${cashFormatted} · ${cleanPreferredAreas.slice(0, 2).join(listSep)}`,
            type: 'lead',
            link: `/admin/leads${reqId ? `?leadId=${reqId}` : ''}`,
            is_read: false,
          },
          {
            user_id: userId,
            role: 'client',
            title: msg.radarActivatedBuyerTitle,
            message: `${msg.radarActivatedBuyerMsg} ($${cashFormatted})`,
            type: 'property_match',
            link: '/account?view=buyer',
            is_read: false,
          },
        ])
      } catch {}

      if (contact.email) {
        const orderRef = generateOrderRef(reqId)
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
        // تمرير '' للـ unitId لأن هذا طلب شراء وليس وحدة بيع في sell_requests
        const verifyToken = createMagicToken(userId, '', expiresAt)
        const verifyAndOpenBuyerLink = `${siteUrl}/api/verify-contact?type=email&token=${encodeURIComponent(verifyToken)}&next=${encodeURIComponent('/account?view=buyer')}`

        sendNotificationEmail({
          to: contact.email,
          senderName: msg.emailSenderName,
          subject: `${msg.buyOrderSubjectPrefix} ${orderRef}`,
          html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
                  <p style="font-size: 16px;">${msg.greetingWord} <strong>${escapeEmailHtml(contact.name)}</strong>${comma}</p>
                  <p>${msg.orderRefLabel}: <strong>${orderRef}</strong>.</p>
                  <p>${msg.registeredCashLabel}: <strong>$${cashFormatted}</strong>.</p>
                  <p>${msg.orderMagicLinkPrompt}:</p>
                  <p style="margin: 18px 0;">
                    <a href="${verifyAndOpenBuyerLink}" style="color: #0b6954; font-weight: bold; word-break: break-all;">${verifyAndOpenBuyerLink}</a>
                  </p>
                 </div>`,
        }).catch(() => {})
      }

      return reqId
    }

    if (payload.mode === 'session') {
      const currentUser = await getVerifiedSellerSession(supabase)
      if (!currentUser) {
        return { status: 'error', error: msg.sessionExpired }
      }

      let resolvedPhone = currentUser.phone || ''
      if (payload.phone && payload.phone.trim()) {
        const phoneCheck = validateInternationalE164Phone(
          formatPrimaryPhone(payload.phone),
          buyerResidenceCountry,
          locale,
          phoneMessages
        )
        if (!phoneCheck.valid) {
          return { status: 'error', error: phoneCheck.error || msg.fillAll }
        }
        resolvedPhone = phoneCheck.e164
      }

      const reqId = await insertBuyRequestRecord(currentUser.id, {
        name: payload.name || currentUser.name || msg.buyerFallback,
        phone: resolvedPhone,
        email: currentUser.email || '',
        currentPhone: currentUser.phone,
      })

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')

      return {
        status: 'ok',
        userId: currentUser.id,
        unitId: reqId,
        orderRef: generateOrderRef(reqId),
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: resolvedPhone || currentUser.phone,
      }
    }

    if (payload.mode === 'login') {
      const rawIdentifier = (payload.loginIdentifier || '').trim().slice(0, 160)
      const password = String(payload.password || '').slice(0, 128)

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

      if (isSuspendedStatus(matched.status)) {
        return {
          status: 'error',
          error: msg.unauthorized || msg.wrongPassword,
        }
      }

      await setUserSession(matched.id, matched.password_hash)
      const reqId = await insertBuyRequestRecord(matched.id, {
        name: matched.name || msg.buyerFallback,
        phone: matched.phone || '',
        email: matched.email || '',
        currentPhone: matched.phone,
      })

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')

      return {
        status: 'ok',
        userId: matched.id,
        unitId: reqId,
        orderRef: generateOrderRef(reqId),
        userName: matched.name,
        userEmail: matched.email,
        userPhone: matched.phone,
      }
    }

    const cleanName = (payload.name || '').trim().slice(0, 120)
    const cleanEmail = normalizeEmail(payload.email || '')
    const password = String(payload.password || '').slice(0, 128)

    if (
      cleanName.length < 2 ||
      !cleanEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 8
    ) {
      return {
        status: 'error',
        error: msg.fillAll,
      }
    }

    const rawFormattedPhone = formatPrimaryPhone(payload.phone || '')
    const phoneCheck = validateInternationalE164Phone(
      rawFormattedPhone,
      buyerResidenceCountry,
      locale,
      phoneMessages
    )

    if (!phoneCheck.valid) {
      return {
        status: 'error',
        error: phoneCheck.error || msg.fillAll,
      }
    }

    const formattedPhone = phoneCheck.e164
    const phoneVariants = getPhoneVariants(formattedPhone)

    const [{ data: emailMatches }, { data: phoneMatches }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash, status')
        .ilike('email', cleanEmail)
        .limit(1),
      supabase
        .from('users')
        .select('id, name, phone, email, password_hash, status')
        .in('phone', phoneVariants)
        .limit(1),
    ])

    const emailUser = emailMatches?.[0] || null
    const phoneUser = phoneMatches?.[0] || null

    if (emailUser) {
      if (isSuspendedStatus(emailUser.status)) {
        return {
          status: 'error',
          error: msg.unauthorized || msg.wrongPassword,
        }
      }
      if (verifyPassword(password, emailUser.password_hash)) {
        await setUserSession(emailUser.id, emailUser.password_hash)
        const reqId = await insertBuyRequestRecord(emailUser.id, {
          name: emailUser.name || cleanName,
          phone: emailUser.phone || formattedPhone,
          email: emailUser.email,
          currentPhone: emailUser.phone,
        })
        revalidatePath('/account', 'page')
        revalidatePath('/admin', 'layout')
        return {
          status: 'ok',
          userId: emailUser.id,
          unitId: reqId,
          orderRef: generateOrderRef(reqId),
          userName: emailUser.name,
          userEmail: emailUser.email,
          userPhone: emailUser.phone || formattedPhone,
        }
      }

      // منع تسريب UUID أو اسم صاحب الحساب — نرجع فقط الإيميل الذي أدخله المستخدم ومقبض استعادة موقّع
      return {
        status: 'email_exists_need_password',
        userId: createSignedRecoveryHandle(emailUser.id),
        orderRef: 'DD-VERIFY',
        userEmail: cleanEmail,
      }
    }

    if (phoneUser && !emailUser) {
      if (isSuspendedStatus(phoneUser.status)) {
        return {
          status: 'error',
          error: msg.unauthorized || msg.wrongPassword,
        }
      }
      if (verifyPassword(password, phoneUser.password_hash)) {
        await setUserSession(phoneUser.id, phoneUser.password_hash)
        const reqId = await insertBuyRequestRecord(phoneUser.id, {
          name: phoneUser.name || cleanName,
          phone: phoneUser.phone,
          email: phoneUser.email,
          currentPhone: phoneUser.phone,
        })
        revalidatePath('/account', 'page')
        revalidatePath('/admin', 'layout')
        return {
          status: 'ok',
          userId: phoneUser.id,
          unitId: reqId,
          orderRef: generateOrderRef(reqId),
          userName: phoneUser.name,
          userEmail: phoneUser.email,
          userPhone: phoneUser.phone,
        }
      }

      // منع تسريب بريد أو رقم أو UUID صاحب الحساب عند تعارض رقم الموبايل
      return {
        status: 'phone_exists_different_email',
        userId: createSignedRecoveryHandle(phoneUser.id),
        orderRef: 'DD-VERIFY',
      }
    }

    const hash = hashPassword(password)
    const userInsertPayload: Record<string, any> = {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
      password_hash: hash,
      country: buyerResidenceCountry,
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
      return {
        status: 'error',
        error: msg.createAccountFailed,
      }
    }

    await setUserSession(createdUser.id, hash)
    const reqId = await insertBuyRequestRecord(createdUser.id, {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
      currentPhone: formattedPhone,
    })

    revalidatePath('/account', 'page')
    revalidatePath('/admin', 'layout')

    return {
      status: 'ok',
      userId: createdUser.id,
      unitId: reqId,
      orderRef: generateOrderRef(reqId),
      userName: createdUser.name,
      userEmail: createdUser.email,
      userPhone: createdUser.phone,
    }
  } catch (e) {
    console.error('processBuyerStep3Action error:', e)
    return { status: 'error', error: msg.unexpected }
  }
}

export async function submitBuyRequest(
  input: BuyRequestPayload | FormData
): Promise<SubmitResult> {
  const { t: msg } = await getFormsDict()
  if (input instanceof FormData) {
    let parsedTypes: string[] = []
    let parsedAreas: string[] = []
    try {
      parsedTypes = JSON.parse(text(input, 'unit_types') || '[]')
    } catch {
      parsedTypes = list(input, 'unit_types')
    }
    try {
      parsedAreas = JSON.parse(text(input, 'preferred_areas') || '[]')
    } catch {
      parsedAreas = list(input, 'preferred_areas')
    }

    const res = await processBuyerStep3Action({
      mode: 'register',
      country: ACTIVE_COUNTRY_CODE,
      available_cash: number(input, 'available_cash'),
      max_installment: number(input, 'max_installment'),
      payment_plan: text(input, 'payment_plan'),
      budget: number(input, 'budget'),
      unit_types: parsedTypes,
      min_rooms: integer(input, 'min_rooms'),
      delivery_status: text(input, 'delivery_status'),
      preferred_areas: parsedAreas,
      name: text(input, 'name'),
      phone: text(input, 'phone'),
      email: text(input, 'email'),
      password: text(input, 'password'),
    })
    if (res.status === 'ok') {
      return { success: true, orderRef: res.orderRef }
    }
    return { success: false, error: res.error || msg.unexpected }
  }

  const res = await processBuyerStep3Action({
    mode: 'register',
    ...input,
  })
  if (res.status === 'ok') return { success: true, orderRef: res.orderRef }
  return {
    success: false,
    error: res.error || msg.unexpected,
  }
}

export async function submitInvestorLead(_formData: FormData) {
  return { success: true }
}