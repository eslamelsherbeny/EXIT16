'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
} from '@/lib/session-security'
import { getServerI18n } from '@/lib/get-server-dictionary'

async function getFormsDict() {
  const { dict, dir } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.forms || {}
  return { t, dir }
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

async function sendNotificationEmail({
  to,
  subject,
  html,
  senderName,
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '')

  if (!user || !pass || !to) return false

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    await transporter.sendMail({
      from: `"${senderName || 'Aqar Exit'}" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Notification email error:', error)
    return false
  }
}

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function number(formData: FormData, key: string, fallback = 0) {
  const rawValue = text(formData, key).replace(/,/g, '')
  if (!rawValue) return fallback
  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function integer(formData: FormData, key: string, fallback = 0) {
  const rawValue = text(formData, key).replace(/,/g, '')
  if (!rawValue) return fallback
  const value = Number.parseInt(rawValue, 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function list(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    )
}

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase()
}

function getPhoneVariants(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return []
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return Array.from(new Set([digits, `0${stripped}`, `+20${stripped}`]))
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+') && !digits.startsWith('+20')) return digits
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return `+20${stripped}`
}

function generateOrderRef(id?: string) {
  if (id) {
    const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (clean.length >= 6) return `AE-${clean.slice(0, 6)}`
  }
  return `AE-${randomBytes(3).toString('hex').toUpperCase()}`
}

function createMagicToken(userId: string, unitId: string, expiresAt: number) {
  const secret =
    process.env.EMAIL_PASS ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'darak-secret-key'
  const payload = `${userId}:${unitId}:${expiresAt}`
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export async function verifyMagicTokenAction(token: string) {
  const { t: msg } = await getFormsDict()
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [userId, unitId, expiresStr, sig] = decoded.split(':')
    const expiresAt = Number(expiresStr)
    if (!userId || !expiresAt || Date.now() > expiresAt) {
      return { valid: false, error: msg.expiredLink }
    }

    const secret =
      process.env.EMAIL_PASS ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'darak-secret-key'
    const expectedSig = createHmac('sha256', secret)
      .update(`${userId}:${unitId}:${expiresAt}`)
      .digest('hex')

    if (sig !== expectedSig) return { valid: false, error: msg.invalidLink }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', unitId)
      .maybeSingle()

    const { data: userRow } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle()

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

export type SubmitResult = {
  success: boolean
  error?: string
  unitId?: string
  orderRef?: string
}

async function setUserSession(
  userId: string,
  passwordHash?: string | null
) {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')

  const isProd = process.env.NODE_ENV === 'production'
  const token = createSignedSessionToken(userId, passwordHash)

  cookieStore.set('user_session', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isProd,
    httpOnly: true,
  })
  cookieStore.set('session_hint', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isProd,
  })
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false
  const cleanStored = stored.trim()
  const cleanPass = password.trim()
  try {
    if (cleanStored.startsWith('scrypt$')) {
      const [, salt, expected] = cleanStored.split('$')
      if (!salt || !expected) return false
      const actual1 = scryptSync(password, salt, 64).toString('hex')
      if (
        actual1.length === expected.length &&
        timingSafeEqual(Buffer.from(actual1), Buffer.from(expected))
      ) {
        return true
      }
      const actual2 = scryptSync(cleanPass, salt, 64).toString('hex')
      return (
        actual2.length === expected.length &&
        timingSafeEqual(Buffer.from(actual2), Buffer.from(expected))
      )
    }
    const actual = createHash('sha256').update(password).digest('hex')
    if (
      actual.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(actual), Buffer.from(cleanStored))
    ) {
      return true
    }
    return cleanStored === password || cleanStored === cleanPass
  } catch {
    return false
  }
}

export async function getCurrentSellerProfileAction() {
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { isLoggedIn: false, user: null }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone, country')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) return { isLoggedIn: false, user: null }
    return { isLoggedIn: true, user }
  } catch {
    return { isLoggedIn: false, user: null }
  }
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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'

    const unitCountryCode = (payload.unitCountry || 'EG').trim().toUpperCase()
    const userCountryCode = (
      payload.userCountry ||
      payload.unitCountry ||
      'EG'
    )
      .trim()
      .toUpperCase()

    async function upsertDraftUnit(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const unitData: Record<string, any> = {
        user_id: userId,
        country: unitCountryCode,
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
        await supabase
          .from('sell_requests')
          .update(unitData)
          .eq('id', payload.existingUnitId)
        return payload.existingUnitId
      }

      const { data: inserted } = await supabase
        .from('sell_requests')
        .insert(unitData)
        .select('id')
        .single()

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
      const cookieStore = await cookies()
      const sessionId = extractUserIdFromCookie(
        cookieStore.get('user_session')?.value
      )
      if (!sessionId) {
        return { status: 'error', error: msg.sessionExpired }
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('id', sessionId)
        .maybeSingle()

      if (!currentUser) {
        return { status: 'error', error: msg.accountNotFound }
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
        .ilike('email', `%${cleanEmail}%`)
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
      const unitId = await upsertDraftUnit(emailUser.id, {
        name: cleanName || emailUser.name,
        phone: emailUser.phone || formattedPhone,
        email: emailUser.email,
      })
      const orderRef = generateOrderRef(unitId)

      await sendOrderConfirmationMagicEmail(
        emailUser.id,
        unitId,
        cleanName || emailUser.name || msg.unitOwnerFallback,
        emailUser.email
      )

      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        unitId,
        orderRef,
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

    if (phoneUser && !emailUser) {
      const unitId = await upsertDraftUnit(phoneUser.id, {
        name: cleanName || phoneUser.name,
        phone: phoneUser.phone,
        email: phoneUser.email,
      })
      const orderRef = generateOrderRef(unitId)

      if (phoneUser.email) {
        await sendOrderConfirmationMagicEmail(
          phoneUser.id,
          unitId,
          cleanName || phoneUser.name || msg.unitOwnerFallback,
          phoneUser.email
        )
      }

      return {
        status: 'phone_exists_different_email',
        userId: phoneUser.id,
        unitId,
        orderRef,
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
        status: 'active',
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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'
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

    await setUserSession(verify.userId, newHash)

    return {
      success: true,
      unitId: verify.unitId,
    }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

export async function saveSellProgress(
  formData: FormData
): Promise<SubmitResult> {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()
    const sessionId = extractUserIdFromCookie(
      (await cookies()).get('user_session')?.value
    )
    const unitId = text(formData, 'unit_id')

    if (!sessionId && !unitId) {
      return {
        success: false,
        error: msg.sessionExpired,
      }
    }

    const payload: Record<string, any> = {
      country: text(formData, 'country') || 'EG',
      developer_name: text(formData, 'developer_name') || null,
      project_name: text(formData, 'project_name') || null,
      area: text(formData, 'area') || null,
      unit_type: text(formData, 'unit_type') || null,
      size: number(formData, 'size'),
      rooms: number(formData, 'rooms'),
      bathrooms: number(formData, 'bathrooms'),
      finishing: text(formData, 'finishing') || null,
      delivery_status: text(formData, 'delivery_status') || null,
      description: text(formData, 'description') || null,
      contract_price: number(formData, 'contract_price'),
      paid_amount: number(formData, 'paid_amount'),
      market_price: number(formData, 'market_price'),
      installment_amount: number(formData, 'installment_amount'),
      installment_frequency: text(formData, 'installment_frequency') || null,
      contract_year: integer(formData, 'contract_year'),
      images: list(formData, 'image'),
    }

    let targetUnitId = unitId

    if (!targetUnitId && sessionId) {
      const { data: existing } = await supabase
        .from('sell_requests')
        .select('id')
        .eq('user_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      targetUnitId = existing?.id ? String(existing.id) : ''
    }

    if (!targetUnitId) {
      return { success: false, error: msg.saveProgressFailed }
    }

    const { error } = await supabase
      .from('sell_requests')
      .update(payload)
      .eq('id', targetUnitId)

    revalidatePath('/account', 'page')
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
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    const existingUnitId = text(formData, 'unit_id')
    const projectName = text(formData, 'project_name')
    const unitCountry = (
      text(formData, 'country') ||
      text(formData, 'country_code') ||
      'EG'
    ).toUpperCase()
    const customSubType = text(formData, 'submission_type') || 'new'

    const payload: Record<string, any> = {
      country: unitCountry,
      project_name: projectName || null,
      developer_name: text(formData, 'developer_name') || null,
      area: text(formData, 'area') || null,
      unit_type: text(formData, 'unit_type') || null,
      size: number(formData, 'size'),
      rooms: number(formData, 'rooms'),
      bathrooms: number(formData, 'bathrooms'),
      floor_number: number(formData, 'floor_number'),
      garden_size: number(formData, 'garden_size'),
      finishing: text(formData, 'finishing') || null,
      delivery_status: text(formData, 'delivery_status') || null,
      features: list(formData, 'feature'),
      description: text(formData, 'description') || null,
      contract_price: number(formData, 'contract_price'),
      paid_amount: number(formData, 'paid_amount'),
      market_price:
        number(formData, 'market_price') || number(formData, 'contract_price'),
      installment_amount: number(formData, 'installment_amount'),
      years_left: integer(formData, 'years_left'),
      contract_year: integer(formData, 'contract_year'),
      installment_frequency: text(formData, 'installment_frequency') || null,
      has_annual_installment: formData.get('has_annual_installment') === 'on',
      willing_to_discount: formData.get('willing_to_discount') === 'on',
      discount_amount: number(formData, 'discount_amount'),
      has_overdue_installments:
        formData.get('has_overdue_installments') === 'on',
      overdue_installments: number(formData, 'overdue_installments'),
      name: text(formData, 'name'),
      phone: formatPrimaryPhone(text(formData, 'phone')),
      email: normalizeEmail(text(formData, 'email')) || null,
      is_original_owner: true,
      images: list(formData, 'image'),
      status: 'pending',
    }

    if (existingUnitId) {
      const { data: prevUnit } = await supabase
        .from('sell_requests')
        .select('status, size, area')
        .eq('id', existingUnitId)
        .maybeSingle()

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

      const { error } = await supabase
        .from('sell_requests')
        .update(payload)
        .eq('id', existingUnitId)

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
          link: '/admin/properties',
          is_read: false,
        })
      } catch {}

      revalidatePath('/account', 'page')
      revalidatePath('/opportunities', 'page')
      revalidatePath('/admin', 'layout')
      return {
        success: true,
        unitId: existingUnitId,
        orderRef: generateOrderRef(existingUnitId),
      }
    }

    const targetUserId = sessionId || null
    const { data: inserted, error } = await supabase
      .from('sell_requests')
      .insert({
        ...payload,
        user_id: targetUserId,
        submission_type: customSubType,
      })
      .select('id')
      .single()

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
        link: '/admin/properties',
        is_read: false,
      })
    } catch {}

    revalidatePath('/account', 'page')
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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'

    const targetCountry = (payload.country || 'EG').trim().toUpperCase()
    const buyerResidenceCountry = (
      payload.userCountry ||
      payload.country ||
      'EG'
    )
      .trim()
      .toUpperCase()

    async function insertBuyRequestRecord(
      userId: string,
      contact: { name: string; phone: string; email: string }
    ) {
      const { data: inserted, error } = await supabase
        .from('buy_requests')
        .insert({
          user_id: userId,
          country: targetCountry,
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
        })
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
            link: '/admin/leads',
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
        sendNotificationEmail({
          to: contact.email,
          senderName: msg.emailSenderName,
          subject: `${msg.buyOrderSubjectPrefix} ${orderRef}`,
          html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
                  <p style="font-size: 16px;">${msg.greetingWord} <strong>${contact.name}</strong>،</p>
                  <p>${msg.orderRefLabel}: <strong>${orderRef}</strong>.</p>
                  <p>${msg.registeredCashLabel}: <strong>${cashFormatted}</strong>.</p>
                  <p style="margin: 18px 0;">
                    <a href="${siteUrl}/account?view=buyer" style="color: #0b6954; font-weight: bold;">${siteUrl}/account?view=buyer</a>
                  </p>
                 </div>`,
        }).catch(() => {})
      }

      return reqId
    }

    if (payload.mode === 'session') {
      const cookieStore = await cookies()
      const sessionId = extractUserIdFromCookie(
        cookieStore.get('user_session')?.value
      )
      if (!sessionId) {
        return { status: 'error', error: msg.sessionExpired }
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('id', sessionId)
        .maybeSingle()

      if (!currentUser) {
        return { status: 'error', error: msg.accountNotFound }
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
          .ilike('email', `%${normalizeEmail(rawIdentifier)}%`)
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
        .ilike('email', `%${cleanEmail}%`)
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
      const reqId = await insertBuyRequestRecord(emailUser.id, {
        name: cleanName || emailUser.name,
        phone: emailUser.phone || formattedPhone,
        email: emailUser.email,
      })

      revalidatePath('/admin', 'layout')

      return {
        status: 'email_exists_need_password',
        userId: emailUser.id,
        orderRef: generateOrderRef(reqId),
        userEmail: emailUser.email,
        userName: emailUser.name,
      }
    }

    if (phoneUser && !emailUser) {
      const reqId = await insertBuyRequestRecord(phoneUser.id, {
        name: cleanName || phoneUser.name,
        phone: phoneUser.phone,
        email: phoneUser.email,
      })

      revalidatePath('/admin', 'layout')

      return {
        status: 'phone_exists_different_email',
        userId: phoneUser.id,
        orderRef: generateOrderRef(reqId),
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
        status: 'active',
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
      country: text(input, 'country_code') || text(input, 'country') || 'EG',
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

export const submitBuyRequestAction = submitBuyRequest
export const createBuyRequestAction = submitBuyRequest

export async function submitInvestorLead(formData: FormData) {
  const { t: msg } = await getFormsDict()
  try {
    const supabase = await getSupabase()

    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const company = String(formData.get('company') || '').trim()
    const country = String(formData.get('country') || 'EG').trim()
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

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'investor',
        title: `💼 ${msg.newInvestorAdminTitle} (${country}): ${name}`,
        message: `${investor_type || msg.investorFallback} · ${finalRange || '—'}`,
        link: '/admin/investors',
        is_read: false,
      })
    } catch {}

    revalidatePath('/admin/investors')
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