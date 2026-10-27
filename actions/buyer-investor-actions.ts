'use server'

import { revalidatePath } from 'next/cache'
import {
  ACTIVE_COUNTRY_CODE,
  createMagicToken,
  DEFAULT_SITE_URL,
  formatPrimaryPhone,
  generateOrderRef,
  getFormsDict,
  getPhoneVariants,
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
}): Promise<Step2AuthResponse> {
  const { t: msg, dir } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const siteUrl = DEFAULT_SITE_URL

    const targetCountry = ACTIVE_COUNTRY_CODE
    const buyerResidenceCountry = (payload.userCountry || ACTIVE_COUNTRY_CODE)
      .trim()
      .toUpperCase()

    async function insertBuyRequestRecord(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const buyRow: Record<string, any> = {
        user_id: userId,
        country: targetCountry,
        country_code: targetCountry,
        available_cash: Number(payload.available_cash) || 0,
        max_installment: Number(payload.max_installment) || 0,
        payment_plan: payload.payment_plan || msg.defaultMonthly,
        budget: Number(payload.budget) || 0,
        unit_types: payload.unit_types || [],
        min_rooms: Number(payload.min_rooms) || 0,
        delivery_status: payload.delivery_status || msg.defaultReady,
        preferred_areas: payload.preferred_areas || [],
        name: contact.name || msg.buyerFallback,
        phone: contact.phone || '',
        email: contact.email || null,
      }

      const { data: inserted, error } = await supabase
        .from('buy_requests')
        .insert(buyRow)
        .select('id')
        .single()

      if (error) {
        console.error('Insert Buy Request Error:', error)
      }

      const reqId = inserted?.id ? String(inserted.id) : ''
      const cashFormatted = Number(
        payload.available_cash || payload.budget || 0
      ).toLocaleString('en-US')

      try {
        await supabase.from('notifications').insert([
          {
            user_id: null,
            title: `${msg.newBuyRequestAdminTitle} (${targetCountry}): ${contact.name || msg.buyerFallback}`,
            message: `${cashFormatted} · ${(payload.preferred_areas || []).slice(0, 2).join('، ')}`,
            type: 'lead',
            link: `/admin/leads${reqId ? `?leadId=${reqId}` : ''}`,
            is_read: false,
          },
          {
            user_id: userId,
            title: msg.radarActivatedBuyerTitle,
            message: `${msg.radarActivatedBuyerMsg} (${cashFormatted})`,
            type: 'property_match',
            link: '/account?view=buyer',
            is_read: false,
          },
        ])
      } catch {}

      if (contact.email) {
        const orderRef = generateOrderRef(reqId)
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
        const verifyToken = createMagicToken(userId, reqId, expiresAt)
        const verifyAndOpenBuyerLink = `${siteUrl}/api/verify-contact?type=email&token=${encodeURIComponent(verifyToken)}&next=${encodeURIComponent('/account?view=buyer')}`

        sendNotificationEmail({
          to: contact.email,
          senderName: msg.emailSenderName,
          subject: `${msg.buyOrderSubjectPrefix} ${orderRef}`,
          html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
                  <p style="font-size: 16px;">${msg.greetingWord} <strong>${contact.name}</strong>،</p>
                  <p>${msg.orderRefLabel}: <strong>${orderRef}</strong>.</p>
                  <p>${msg.registeredCashLabel}: <strong>${cashFormatted}</strong>.</p>
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

      const reqId = await insertBuyRequestRecord(currentUser.id, {
        name: currentUser.name || msg.buyerFallback,
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      })

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')

      return {
        status: 'ok',
        userId: currentUser.id,
        unitId: reqId,
        orderRef: generateOrderRef(reqId),
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
          .select('id, name, email, phone, password_hash')
          .ilike('email', normalizeEmail(rawIdentifier))
        candidates = data || []
      } else {
        const variants = getPhoneVariants(rawIdentifier)
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, password_hash')
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
      const reqId = await insertBuyRequestRecord(matched.id, {
        name: matched.name || msg.buyerFallback,
        phone: matched.phone || '',
        email: matched.email || '',
      })

      revalidatePath('/account', 'page')
      revalidatePath('/admin', 'layout')

      return {
        status: 'ok',
        userId: matched.id,
        unitId: reqId,
        orderRef: generateOrderRef(reqId),
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
        const reqId = await insertBuyRequestRecord(emailUser.id, {
          name: emailUser.name || cleanName,
          phone: emailUser.phone || formattedPhone,
          email: emailUser.email,
        })
        revalidatePath('/account', 'page')
        revalidatePath('/admin', 'layout')
        return {
          status: 'ok',
          userId: emailUser.id,
          unitId: reqId,
          orderRef: generateOrderRef(reqId),
        }
      }

      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        orderRef: 'AE-VERIFY',
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

    if (phoneUser && !emailUser) {
      if (verifyPassword(password, phoneUser.password_hash)) {
        await setUserSession(phoneUser.id, phoneUser.password_hash)
        const reqId = await insertBuyRequestRecord(phoneUser.id, {
          name: phoneUser.name || cleanName,
          phone: phoneUser.phone,
          email: phoneUser.email,
        })
        revalidatePath('/account', 'page')
        revalidatePath('/admin', 'layout')
        return {
          status: 'ok',
          userId: phoneUser.id,
          unitId: reqId,
          orderRef: generateOrderRef(reqId),
        }
      }

      return {
        status: 'phone_exists_different_email',
        userId: phoneUser.id,
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
        country: buyerResidenceCountry,
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
    const reqId = await insertBuyRequestRecord(createdUser.id, {
      name: cleanName,
      phone: formattedPhone,
      email: cleanEmail,
    })

    revalidatePath('/account', 'page')
    revalidatePath('/admin', 'layout')

    return {
      status: 'ok',
      userId: createdUser.id,
      unitId: reqId,
      orderRef: generateOrderRef(reqId),
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
    if (res.status === 'ok' || res.orderRef) {
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

export async function submitInvestorLead(formData: FormData) {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()

    const name = String(formData.get('name') || '').trim()
    const phone = formatPrimaryPhone(String(formData.get('phone') || '').trim())
    const email = String(formData.get('email') || '').trim()
    const company = String(formData.get('company') || '').trim()
    const country = ACTIVE_COUNTRY_CODE
    const investor_type = String(formData.get('investor_type') || '').trim()
    const years_experience = String(
      formData.get('years_experience') || ''
    ).trim()
    const investment_range = String(
      formData.get('investment_range') || ''
    ).trim()
    const exact_amount = Number(formData.get('exact_amount') || 0)
    const preferred_structure = String(
      formData.get('preferred_structure') || ''
    ).trim()
    const holding_period = String(formData.get('holding_period') || '').trim()
    const participation_level = String(
      formData.get('participation_level') || ''
    ).trim()
    const target_roi = String(formData.get('target_roi') || '').trim()
    const signature_name = String(formData.get('signature_name') || name).trim()
    const notes = String(formData.get('notes') || '').trim()
    const sectors = formData.getAll('sectors').map(String).filter(Boolean)

    if (!name || !phone) {
      return { success: false, error: msg.enterNamePhone }
    }

    const finalRange =
      investment_range ||
      (exact_amount > 0 ? `$${exact_amount.toLocaleString('en-US')}` : '')
    const finalSectors =
      sectors.length > 0 ? sectors : [investor_type].filter(Boolean)

    const leadPayload: Record<string, any> = {
      name,
      phone,
      email: email || null,
      company: company || null,
      country,
      investor_type: investor_type || null,
      years_experience: years_experience || null,
      preferred_sectors: finalSectors,
      investment_range: finalRange,
      exact_amount,
      preferred_structure: preferred_structure || null,
      holding_period: holding_period || null,
      participation_level: participation_level || null,
      target_roi: target_roi || null,
      signature_name,
      notes: notes || null,
      status: 'new',
    }

    let { error } = await supabase.from('investor_leads').insert(leadPayload)

    if (error) {
      const basicLead = {
        name,
        phone,
        email: email || null,
        investor_type: investor_type || null,
        preferred_sectors: finalSectors,
        investment_range: finalRange,
        preferred_structure: preferred_structure || null,
        participation_level: participation_level || null,
        status: 'new',
      }
      const retry = await supabase.from('investor_leads').insert(basicLead)
      error = retry.error
    }

    if (error) {
      const fallbackTable = await supabase.from('investor_requests').insert({
        name,
        phone,
        email: email || null,
        investor_type,
        investment_range: finalRange,
        preferred_structure,
        participation_level,
        target_roi,
        signature_name,
        status: 'new',
      })
      error = fallbackTable.error
    }

    if (error) {
      console.error('Error inserting investor lead:', error)
      return {
        success: false,
        error: msg.investorFailed,
      }
    }

    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error in submitInvestorLead:', err)
    return {
      success: false,
      error: msg.investorFailed,
    }
  }
}
