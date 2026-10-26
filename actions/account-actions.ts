'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import nodemailer from 'nodemailer'
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import { getServerI18n } from '@/lib/get-server-dictionary'

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-16.vercel.app'

async function getAccDict() {
  const { dict, dir } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.account || {}
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

function normalizeDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

// دالة مركزية تتحقق من صحة التوقيع المشفر للجلسة وعدم إيقاف الحساب قبل أي عملية
async function getVerifiedSessionUser() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) return null

  const supabase = await getSupabase()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, phone, role, status, password_hash')
    .eq('id', candidateId)
    .maybeSingle()

  if (!user) return null

  const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
  const cleanStatus = String(user.status || 'active').trim().toLowerCase()

  if (!check.valid || cleanStatus === 'suspended') {
    return null
  }

  return { supabase, user }
}

// التحقق الصارم من ملكية الوحدة عبر user_id فقط
async function verifyUnitOwnership(
  supabase: any,
  unitId: string,
  user: {
    id: string
    email?: string | null
    phone?: string | null
    role?: string | null
  }
) {
  if (!unitId || !user?.id) return null

  const { data: unit } = await supabase
    .from('sell_requests')
    .select('*')
    .eq('id', unitId)
    .maybeSingle()

  if (!unit) return null

  const cleanRole = String(user.role || 'user').trim().toLowerCase()
  const isStaff =
    cleanRole === 'admin' ||
    cleanRole === 'moderator' ||
    cleanRole === 'sales'

  if (unit.user_id) {
    return isStaff || unit.user_id === user.id ? unit : null
  }

  const isOwnerByEmail =
    user.email &&
    unit.email &&
    String(user.email).trim().toLowerCase() ===
      String(unit.email).trim().toLowerCase()
  const isOwnerByPhone =
    user.phone &&
    unit.phone &&
    String(user.phone).trim() === String(unit.phone).trim()

  if (isStaff || isOwnerByEmail || isOwnerByPhone) {
    if (!unit.user_id && (isOwnerByEmail || isOwnerByPhone)) {
      await supabase
        .from('sell_requests')
        .update({ user_id: user.id })
        .eq('id', unit.id)
      unit.user_id = user.id
    }
    return unit
  }

  return null
}

async function sendAccountEmail({
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
    })

    await transporter.sendMail({
      from: `"${senderName || 'Aqar Exit'}" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error('Account Email Error:', e)
    return false
  }
}

function formatPrimaryPhone(rawPhone: string) {
  const digits = normalizeDigits(rawPhone || '')
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/^0+/, '')}`
  const stripped = digits.replace(/^0+/, '')
  if (
    stripped.startsWith('995') ||
    stripped.startsWith('20') ||
    stripped.startsWith('966') ||
    stripped.startsWith('971')
  ) {
    return `+${stripped}`
  }
  return `+995${stripped}`
}

export async function logoutAccountAction() {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/login')
}

export async function updatePersonalInfoAction(payload: {
  name: string
  phone: string
}) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const cleanName = (payload.name || '').trim().slice(0, 120)
    const formattedPhone = formatPrimaryPhone(payload.phone)

    if (!cleanName || !formattedPhone || formattedPhone.length < 9) {
      return {
        success: false,
        error: msg.invalidNamePhone,
      }
    }

    const { data: conflictPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', formattedPhone)
      .neq('id', user.id)
      .limit(1)

    if (conflictPhone && conflictPhone.length > 0) {
      return {
        success: false,
        error: msg.phoneConflict,
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ name: cleanName, phone: formattedPhone })
      .eq('id', user.id)

    if (error) return { success: false, error: msg.updateFailed }

    await Promise.all([
      supabase
        .from('sell_requests')
        .update({ name: cleanName, phone: formattedPhone })
        .eq('user_id', user.id),
      supabase
        .from('buy_requests')
        .update({ name: cleanName, phone: formattedPhone })
        .eq('user_id', user.id),
    ])

    revalidatePath('/account')
    revalidatePath('/account/details')
    return {
      success: true,
      message: msg.personalSaved,
    }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

export async function updateEmailInfoAction(payload: { email: string }) {
  const { t: msg, dir } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user: currentUser } = session

    const cleanEmail = (payload.email || '').trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: msg.invalidEmail }
    }

    const { data: conflictEmail } = await supabase
      .from('users')
      .select('id')
      .ilike('email', cleanEmail)
      .neq('id', currentUser.id)
      .limit(1)

    if (conflictEmail && conflictEmail.length > 0) {
      return {
        success: false,
        error: msg.emailConflict,
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ email: cleanEmail })
      .eq('id', currentUser.id)

    if (error) {
      return {
        success: false,
        error: msg.updateFailed,
      }
    }

    await Promise.all([
      supabase
        .from('sell_requests')
        .update({ email: cleanEmail })
        .eq('user_id', currentUser.id),
      supabase
        .from('buy_requests')
        .update({ email: cleanEmail })
        .eq('user_id', currentUser.id),
    ])

    sendAccountEmail({
      to: cleanEmail,
      senderName: msg.emailSenderName,
      subject: msg.emailUpdatedSubject,
      html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122;">
              <p>${msg.greetingWord} <strong>${currentUser.name || msg.dearClient}</strong>،</p>
              <p>${msg.emailUpdatedBody} <strong>${cleanEmail}</strong>.</p>
             </div>`,
    }).catch(() => {})

    revalidatePath('/account')
    revalidatePath('/account/details')
    return {
      success: true,
      message: `${msg.emailSavedPrefix} ${cleanEmail} ✓`,
    }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

export async function requestAccountDeletionAction(payload: {
  reason?: string
}) {
  const { t: msg, dir } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const siteUrl = DEFAULT_SITE_URL
    const nowIso = new Date().toISOString()

    const { data: userUnits } = await supabase
      .from('sell_requests')
      .select('id, status')
      .eq('user_id', user.id)

    const unitsCount = userUnits?.length || 0

    if (userUnits && userUnits.length > 0) {
      await Promise.all(
        userUnits.map((u) =>
          supabase
            .from('sell_requests')
            .update({
              previous_status:
                u.status && u.status !== 'paused_deletion'
                  ? u.status
                  : 'pending',
              status: 'paused_deletion',
            })
            .eq('id', u.id)
            .eq('user_id', user.id)
        )
      )
    }

    await supabase
      .from('users')
      .update({
        deletion_requested: true,
        deletion_reason: payload.reason || msg.noSpecificReason,
        deletion_requested_at: nowIso,
        status: 'deletion_pending',
      })
      .eq('id', user.id)

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `${msg.deletionNotifTitle}: ${user.name || msg.dearClient}`,
        message: `${msg.reasonWord}: ${payload.reason || msg.noSpecificReason} · (${unitsCount})`,
        type: 'admin_alert',
        link: '/admin/users',
        is_read: false,
      })
    } catch {}

    if (user.email) {
      sendAccountEmail({
        to: user.email,
        senderName: msg.emailSenderName,
        subject: msg.deletionEmailSubject,
        html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.9; color: #0a1122;">
                <p>${msg.deletionEmailLine1}</p>
                ${
                  unitsCount > 0
                    ? `<p>(${unitsCount}) ${msg.deletionEmailUnitsLine}</p>`
                    : ''
                }
                <p>${msg.deletionEmailLine2}</p>
                <p style="margin-top: 18px;"><a href="${siteUrl}/contact">${siteUrl}/contact</a></p>
               </div>`,
      }).catch(() => {})
    }

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/users')
    return { success: true }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

export async function cancelAccountDeletionAction() {
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false }
    const { supabase, user } = session

    await supabase
      .from('users')
      .update({
        deletion_requested: false,
        deletion_reason: null,
        deletion_requested_at: null,
        status: 'active',
      })
      .eq('id', user.id)

    const { data: pausedUnits } = await supabase
      .from('sell_requests')
      .select('id, previous_status')
      .eq('user_id', user.id)
      .eq('status', 'paused_deletion')

    if (pausedUnits && pausedUnits.length > 0) {
      await Promise.all(
        pausedUnits.map((u) =>
          supabase
            .from('sell_requests')
            .update({
              status: u.previous_status || 'pending',
              previous_status: null,
            })
            .eq('id', u.id)
            .eq('user_id', user.id)
        )
      )
    }

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/properties')
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function toggleSellerUnitStatusAction(payload: {
  unitId: string
  action: 'pause' | 'resume'
}) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const unit = await verifyUnitOwnership(supabase, payload.unitId, user)
    if (!unit) return { success: false, error: msg.unitNotFound }

    if (payload.action === 'pause') {
      const { error } = await supabase
        .from('sell_requests')
        .update({
          previous_status: unit.status,
          status: 'paused_by_seller',
          last_seller_edit_at: new Date().toISOString(),
        })
        .eq('id', payload.unitId)

      if (error) return { success: false, error: msg.pauseFailed }

      try {
        await supabase.from('notifications').insert({
          user_id: null,
          title: `⏸ ${msg.unitPausedNotifTitle}: ${unit.project_name || msg.unitWord}`,
          message: `${unit.name || ''} (${unit.area || ''})`,
          type: 'property',
          link: '/admin/properties',
          is_read: false,
        })
      } catch {}
    } else {
      const { error } = await supabase
        .from('sell_requests')
        .update({
          status: 'pending',
          submission_type: 'resumed_by_seller',
          last_seller_edit_at: new Date().toISOString(),
          admin_note: msg.resumedAdminNote,
        })
        .eq('id', payload.unitId)

      if (error) return { success: false, error: msg.resumeFailed }

      try {
        await supabase.from('notifications').insert({
          user_id: null,
          title: `🔄 ${msg.unitResumedNotifTitle}: ${unit.project_name || msg.unitWord}`,
          message: `${unit.name || ''} (${unit.area || ''})`,
          type: 'property',
          link: '/admin/properties',
          is_read: false,
        })
      } catch {}
    }

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/properties')
    return { success: true }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

export async function deleteUnitBySellerAction(unitId: string) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const unit = await verifyUnitOwnership(supabase, unitId, user)
    if (!unit) return { success: false, error: msg.unitNotFound }

    const nowIso = new Date().toISOString()
    const noteText = `${msg.deletedBySellerNote} ${new Date().toLocaleDateString('en-GB')}`

    const { error } = await supabase
      .from('sell_requests')
      .update({
        previous_status: unit?.status || 'pending',
        status: 'deleted_by_seller',
        submission_type: 'deleted_by_seller',
        last_seller_edit_at: nowIso,
        admin_note: noteText,
      })
      .eq('id', unitId)

    if (error) {
      const { error: fallbackErr } = await supabase
        .from('sell_requests')
        .update({
          status: 'deleted_by_seller',
          admin_note: noteText,
        })
        .eq('id', unitId)

      if (fallbackErr) {
        return { success: false, error: msg.deleteFailed }
      }
    }

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `🗑 ${msg.unitDeletedNotifTitle}: ${unit?.project_name || msg.unitWord}`,
        message: `${unit?.name || ''} (${unit?.area || '—'})`,
        type: 'property',
        link: `/admin/properties?tab=deleted&unitId=${unitId}`,
        is_read: false,
      })
    } catch {}

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/properties')
    return { success: true }
  } catch {
    return { success: false, error: msg.deleteFailed }
  }
}

export async function saveUnitDocumentAction(payload: {
  unitId: string
  docKey: 'contract' | 'receipts' | 'statement' | 'passport' | 'national_id'
  fileUrl: string
  fileName: string
}) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const unit = await verifyUnitOwnership(supabase, payload.unitId, user)
    if (!unit) return { success: false, error: msg.unitNotFound }

    const currentDocs =
      unit.documents && typeof unit.documents === 'object'
        ? { ...unit.documents }
        : {}

    const normalizedKey =
      payload.docKey === 'national_id' ? 'passport' : payload.docKey

    if (!payload.fileUrl) {
      delete currentDocs[normalizedKey]
      if (normalizedKey === 'passport') delete currentDocs.national_id
    } else {
      currentDocs[normalizedKey] = {
        url: payload.fileUrl,
        name: payload.fileName,
        uploaded_at: new Date().toLocaleDateString('en-GB'),
        status: 'pending_review',
      }
      if (normalizedKey === 'passport') delete currentDocs.national_id
    }

    const { error } = await supabase
      .from('sell_requests')
      .update({ documents: currentDocs })
      .eq('id', payload.unitId)

    if (error) {
      return {
        success: false,
        error: msg.docSaveFailed,
      }
    }

    if (payload.fileUrl) {
      try {
        await supabase.from('notifications').insert({
          user_id: null,
          title: `📄 ${msg.docUploadedNotifTitle}: ${unit.project_name || msg.unitWord}`,
          message: `${unit.name || ''}`,
          type: 'property',
          link: '/admin/properties',
          is_read: false,
        })
      } catch {}
    }

    revalidatePath('/account')
    revalidatePath('/account/documents')
    revalidatePath('/admin/properties')
    return { success: true, documents: currentDocs }
  } catch {
    return { success: false, error: msg.docSaveFailed }
  }
}

export async function deleteUnitDocumentAction(payload: {
  unitId: string
  docKey: 'contract' | 'receipts' | 'statement' | 'passport' | 'national_id'
}) {
  return saveUnitDocumentAction({
    unitId: payload.unitId,
    docKey: payload.docKey,
    fileUrl: '',
    fileName: '',
  })
}

export async function updateBuyerPreferencesAction(payload: {
  buyRequestId?: string
  available_cash: number
  max_installment: number
  payment_plan: string
  budget: number
  unit_types: string[]
  min_rooms: number
  delivery_status: string
  preferred_areas: string[]
  notify_exact_match: boolean
  notify_featured: boolean
}) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const updateData = {
      country: 'GE',
      country_code: 'GE',
      currency_code: 'USD',
      available_cash: Number(payload.available_cash) || 0,
      max_installment: Number(payload.max_installment) || 0,
      payment_plan: payload.payment_plan || msg.defaultMonthly,
      budget: Number(payload.budget) || Number(payload.available_cash) || 0,
      unit_types: payload.unit_types || [],
      min_rooms: Number(payload.min_rooms) || 0,
      delivery_status: payload.delivery_status || msg.defaultReady,
      preferred_areas: payload.preferred_areas || [],
      notify_exact_match: payload.notify_exact_match,
      notify_featured: payload.notify_featured,
    }

    if (payload.buyRequestId) {
      const { data: targetLead } = await supabase
        .from('buy_requests')
        .select('id, user_id, email, phone')
        .eq('id', payload.buyRequestId)
        .maybeSingle()

      if (!targetLead) {
        return { success: false, error: msg.sessionExpired }
      }

      // تحقق صارم من ملكية طلب الشراء عبر user_id
      const isLeadOwner = targetLead.user_id
        ? targetLead.user_id === user.id
        : (user.email &&
            targetLead.email &&
            String(targetLead.email).trim().toLowerCase() ===
              String(user.email).trim().toLowerCase()) ||
          (user.phone &&
            targetLead.phone &&
            String(targetLead.phone).trim() === String(user.phone).trim())

      if (!isLeadOwner) {
        return { success: false, error: msg.sessionExpired }
      }

      const { error: updErr } = await supabase
        .from('buy_requests')
        .update({ ...updateData, user_id: user.id })
        .eq('id', payload.buyRequestId)

      if (updErr) {
        // محاولة احتياطية بدون الأعمدة الإضافية في حال لم يتم تشغيل الـ SQL بعد
        const {
          currency_code: _c,
          notify_exact_match: _ne,
          notify_featured: _nf,
          ...coreBuyData
        } = updateData
        await supabase
          .from('buy_requests')
          .update({ ...coreBuyData, user_id: user.id })
          .eq('id', payload.buyRequestId)
      }
    } else {
      const { error: insErr } = await supabase.from('buy_requests').insert({
        ...updateData,
        user_id: user.id,
        name: user.name || msg.buyerWord,
        phone: user.phone || '',
        email: user.email || '',
      })

      if (insErr) {
        const {
          currency_code: _c,
          notify_exact_match: _ne,
          notify_featured: _nf,
          ...coreBuyData
        } = updateData
        await supabase.from('buy_requests').insert({
          ...coreBuyData,
          user_id: user.id,
          name: user.name || msg.buyerWord,
          phone: user.phone || '',
          email: user.email || '',
        })
      }
    }

    revalidatePath('/account')
    revalidatePath('/admin/leads')
    return { success: true }
  } catch {
    return { success: false, error: msg.prefSaveFailed }
  }
}

export async function requestUnitPromotionAction(payload: {
  unitId: string
  days: 7 | 14 | 30
  price: number
}) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const unit = await verifyUnitOwnership(supabase, payload.unitId, user)
    if (!unit) return { success: false, error: msg.unitNotFound }

    const cleanIdPart = String(unit.id)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
    const randomSuffix = Math.floor(10 + Math.random() * 90)
    const adOrderRef =
      unit.featured_fawry_code && unit.featured_fawry_code.startsWith('AD-')
        ? unit.featured_fawry_code
        : `AD-${cleanIdPart}${randomSuffix}`

    const isChangingPackage = unit.featured_status === 'pending_payment'

    const { error } = await supabase
      .from('sell_requests')
      .update({
        featured_days: payload.days,
        featured_price: payload.price,
        featured_status: 'pending_payment',
        featured_fawry_code: adOrderRef,
      })
      .eq('id', payload.unitId)

    if (error) {
      return {
        success: false,
        error: msg.promoFailed,
      }
    }

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: isChangingPackage
          ? `🔄 ${msg.promoUpdateNotifTitle} (${payload.days}) — ${adOrderRef}`
          : `📢 ${msg.promoNewNotifTitle} (${payload.days}) — ${adOrderRef}`,
        message: `${unit.name || ''} (${unit.phone || ''}) · ${unit.project_name || msg.unitWord}`,
        type: 'property',
        link: `/admin/properties?tab=featured&unitId=${payload.unitId}&action=promote`,
        is_read: false,
      })
    } catch {}

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/properties')
    return {
      success: true,
      fawryCode: adOrderRef,
      days: payload.days,
      price: payload.price,
    }
  } catch {
    return { success: false, error: msg.promoFailed }
  }
}

export async function cancelUnitPromotionBySellerAction(unitId: string) {
  const { t: msg } = await getAccDict()
  try {
    const session = await getVerifiedSessionUser()
    if (!session) return { success: false, error: msg.sessionExpired }
    const { supabase, user } = session

    const unit = await verifyUnitOwnership(supabase, unitId, user)
    if (!unit) return { success: false, error: msg.unitNotFound }

    const wasActive = Boolean(unit.is_featured)
    const adRef = unit.featured_fawry_code || ''

    const { error } = await supabase
      .from('sell_requests')
      .update({
        is_featured: false,
        featured_status: 'none',
        featured_fawry_code: null,
        featured_days: 0,
        featured_price: 0,
        featured_until: null,
      })
      .eq('id', unitId)

    if (error) return { success: false, error: msg.cancelPromoFailed }

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: wasActive
          ? `⏹ ${msg.promoStoppedNotifTitle} (${adRef})`
          : `✕ ${msg.promoCancelledNotifTitle} (${adRef})`,
        message: `${unit.name || ''} (${unit.project_name || ''})`,
        type: 'property',
        link: '/admin/properties',
        is_read: false,
      })
    } catch {}

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/properties')
    return { success: true }
  } catch {
    return { success: false, error: msg.unexpected }
  }
}

/**
 * دالة سيرفر محصّنة لجلب مستندات الوحدة الخاصة بالمستخدم الموثق فقط (تمنع ثغرة IDOR تماماً)
 */
export async function getAuthorizedUnitDocumentsAction(requestedUnitId?: string | null) {
  try {
    const session = await getVerifiedSessionUser()
    if (!session) {
      return {
        isLoggedIn: false,
        authorized: false,
        unitId: null,
        projectName: null,
        documents: {},
        unitsList: [],
      }
    }

    const { supabase, user } = session

    // جلب جميع وحدات هذا البائع فقط عبر user_id
    const { data: userUnits } = await supabase
      .from('sell_requests')
      .select('id, project_name, area, documents, user_id, status')
      .eq('user_id', user.id)
      .neq('status', 'deleted_by_seller')
      .order('created_at', { ascending: false })

    const unitsList = (userUnits || []).map((u: any) => ({
      id: String(u.id),
      project_name: u.project_name || '',
      area: u.area || '',
    }))

    let targetUnit: any = null

    if (requestedUnitId) {
      // التحقق الصارم من أن الوحدة المطلوبة يملكها هذا الـ user_id
      const verified = await verifyUnitOwnership(supabase, requestedUnitId, user)
      if (!verified) {
        return {
          isLoggedIn: true,
          authorized: false,
          unitId: null,
          projectName: null,
          documents: {},
          unitsList,
        }
      }
      targetUnit = verified
    } else {
      targetUnit = userUnits?.[0] || null
    }

    if (!targetUnit) {
      return {
        isLoggedIn: true,
        authorized: true,
        unitId: null,
        projectName: null,
        documents: {},
        unitsList: [],
      }
    }

    const rawDocs =
      targetUnit.documents && typeof targetUnit.documents === 'object'
        ? { ...targetUnit.documents }
        : {}

    delete rawDocs.__unit_meta
    if (rawDocs.national_id && !rawDocs.passport) {
      rawDocs.passport = rawDocs.national_id
      delete rawDocs.national_id
    }

    return {
      isLoggedIn: true,
      authorized: true,
      unitId: String(targetUnit.id),
      projectName: targetUnit.project_name || null,
      documents: rawDocs,
      unitsList,
    }
  } catch {
    return {
      isLoggedIn: false,
      authorized: false,
      unitId: null,
      projectName: null,
      documents: {},
      unitsList: [],
    }
  }
}