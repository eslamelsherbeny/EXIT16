'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import nodemailer from 'nodemailer'
import { extractUserIdFromCookie } from '@/lib/session-security'
import { normalizeLocale, type LocaleCode } from '@/lib/i18n-config'

const ACCOUNT_MESSAGES: Record<LocaleCode, Record<string, string>> = {
  ar: {
    sessionExpired: 'انتهت الجلسة، يرجى تسجيل الدخول.',
    invalidNamePhone: 'يرجى إدخال اسم صحيح ورقم موبايل صحيح.',
    phoneConflict: 'رقم الموبايل هذا مسجل بالفعل لحساب آخر.',
    updateFailed: 'تعذر تحديث البيانات حالياً.',
    personalSaved: 'تم حفظ وتحديث اسمك ورقم موبايلك بنجاح ✓',
    unexpected: 'حدث خطأ غير متوقع.',
    invalidEmail: 'يرجى كتابة بريد إلكتروني صحيح.',
    emailConflict: 'هذا البريد الإلكتروني مسجل بالفعل لحساب آخر.',
    emailSavedPrefix: 'تم تغيير بريدك الإلكتروني بنجاح إلى',
    unitNotFound: 'الوحدة غير موجودة.',
    pauseFailed: 'تعذر إيقاف عرض الوحدة.',
    resumeFailed: 'تعذر إعادة عرض الوحدة.',
    deleteFailed: 'تعذر حذف الوحدة حالياً.',
    docSaveFailed: 'تعذر حفظ المستند.',
    prefSaveFailed: 'تعذر حفظ التفضيلات.',
    promoFailed: 'حدث خطأ أثناء تسجيل طلب الإعلان.',
    cancelPromoFailed: 'تعذر إلغاء طلب التمييز.',
  },
  en: {
    sessionExpired: 'Session expired, please sign in.',
    invalidNamePhone: 'Please enter a valid name and phone number.',
    phoneConflict: 'This phone number is already linked to another account.',
    updateFailed: 'Could not update details right now.',
    personalSaved: 'Your name and phone number have been saved ✓',
    unexpected: 'An unexpected error occurred.',
    invalidEmail: 'Please enter a valid email address.',
    emailConflict: 'This email is already linked to another account.',
    emailSavedPrefix: 'Your email has been updated to',
    unitNotFound: 'Unit not found.',
    pauseFailed: 'Could not pause unit listing.',
    resumeFailed: 'Could not resume unit listing.',
    deleteFailed: 'Could not delete unit right now.',
    docSaveFailed: 'Could not save document.',
    prefSaveFailed: 'Could not save preferences.',
    promoFailed: 'Error registering promotion request.',
    cancelPromoFailed: 'Could not cancel promotion request.',
  },
  ru: {
    sessionExpired: 'Сессия истекла, пожалуйста, войдите снова.',
    invalidNamePhone: 'Введите корректное имя и номер телефона.',
    phoneConflict: 'Этот номер телефона уже привязан к другому аккаунту.',
    updateFailed: 'Не удалось обновить данные.',
    personalSaved: 'Ваше имя и номер телефона успешно сохранены ✓',
    unexpected: 'Произошла непредвиденная ошибка.',
    invalidEmail: 'Введите корректный email.',
    emailConflict: 'Этот email уже используется другим аккаунтом.',
    emailSavedPrefix: 'Ваш email успешно изменен на',
    unitNotFound: 'Объект не найден.',
    pauseFailed: 'Не удалось приостановить показ объекта.',
    resumeFailed: 'Не удалось возобновить показ объекта.',
    deleteFailed: 'Не удалось удалить объект.',
    docSaveFailed: 'Не удалось сохранить документ.',
    prefSaveFailed: 'Не удалось сохранить настройки.',
    promoFailed: 'Ошибка при создании заявки на продвижение.',
    cancelPromoFailed: 'Не удалось отменить продвижение.',
  },
  ka: {
    sessionExpired: 'სესიის ვადა გავიდა, გთხოვთ შეხვიდეთ თავიდან.',
    invalidNamePhone: 'შეიყვანეთ სწორი სახელი და ტელეფონის ნომერი.',
    phoneConflict: 'ეს ნომერი უკვე რეგისტრირებულია სხვა ანგარიშზე.',
    updateFailed: 'მონაცემების განახლება ვერ მოხერხდა.',
    personalSaved: 'სახელი და ტელეფონის ნომერი წარმატებით შეინახა ✓',
    unexpected: 'დაფიქსირდა შეცდომა.',
    invalidEmail: 'შეიყვანეთ სწორი ელ.ფოსტა.',
    emailConflict: 'ეს ელ.ფოსტა უკვე გამოიყენება სხვა ანგარიშზე.',
    emailSavedPrefix: 'თქვენი ელ.ფოსტა შეიცვალა:',
    unitNotFound: 'ობიექტი ვერ მოიძებნა.',
    pauseFailed: 'ჩვენების შეჩერება ვერ მოხერხდა.',
    resumeFailed: 'ჩვენების აღდგენა ვერ მოხერხდა.',
    deleteFailed: 'ობიექტის წაშლა ვერ მოხერხდა.',
    docSaveFailed: 'დოკუმენტის შენახვა ვერ მოხერხდა.',
    prefSaveFailed: 'პარამეტრების შენახვა ვერ მოხერხდა.',
    promoFailed: 'VIP მოთხოვნის შენახვა ვერ მოხერხდა.',
    cancelPromoFailed: 'VIP მოთხოვნის გაუქმება ვერ მოხერხდა.',
  },
}

async function getAccMsg() {
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get('locale')?.value)
  return ACCOUNT_MESSAGES[locale] || ACCOUNT_MESSAGES.ar
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

async function sendAccountEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
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
      from: `"Aqar Exit - عقار إكزت" <${user}>`,
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
  const digits = (rawPhone || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+') && !digits.startsWith('+20')) return digits
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return `+20${stripped}`
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const cleanName = (payload.name || '').trim()
    const formattedPhone = formatPrimaryPhone(payload.phone)

    if (!cleanName || !formattedPhone || formattedPhone.length < 10) {
      return {
        success: false,
        error: msg.invalidNamePhone,
      }
    }

    const supabase = await getSupabase()

    const { data: conflictPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', formattedPhone)
      .neq('id', sessionId)
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
      .eq('id', sessionId)

    if (error) return { success: false, error: msg.updateFailed }

    await Promise.all([
      supabase
        .from('sell_requests')
        .update({ name: cleanName, phone: formattedPhone })
        .eq('user_id', sessionId),
      supabase
        .from('buy_requests')
        .update({ name: cleanName, phone: formattedPhone })
        .eq('user_id', sessionId),
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const cleanEmail = (payload.email || '').trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: msg.invalidEmail }
    }

    const supabase = await getSupabase()

    const { data: conflictEmail } = await supabase
      .from('users')
      .select('id')
      .ilike('email', cleanEmail)
      .neq('id', sessionId)
      .limit(1)

    if (conflictEmail && conflictEmail.length > 0) {
      return {
        success: false,
        error: msg.emailConflict,
      }
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', sessionId)
      .maybeSingle()

    const { error } = await supabase
      .from('users')
      .update({ email: cleanEmail })
      .eq('id', sessionId)

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
        .eq('user_id', sessionId),
      supabase
        .from('buy_requests')
        .update({ email: cleanEmail })
        .eq('user_id', sessionId),
    ])

    sendAccountEmail({
      to: cleanEmail,
      subject: 'تم تحديث بريدك الإلكتروني — عقار إكزت',
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.8; color: #0a1122;">
              <p>أهلاً <strong>${currentUser?.name || 'عميلنا العزيز'}</strong>،</p>
              <p>تم تغيير البريد الإلكتروني المرتبط بحسابك في منصة عقار إكزت بنجاح إلى: <strong>${cleanEmail}</strong>.</p>
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) return { success: false, error: msg.sessionExpired }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://next-js-rtl-platform-structure.vercel.app'
    const nowIso = new Date().toISOString()

    const { data: userUnits } = await supabase
      .from('sell_requests')
      .select('id, status')
      .eq('user_id', sessionId)

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
        )
      )
    }

    await supabase
      .from('users')
      .update({
        deletion_requested: true,
        deletion_reason: payload.reason || 'بدون سبب محدد',
        deletion_requested_at: nowIso,
        status: 'deletion_pending',
      })
      .eq('id', sessionId)

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `طلب حذف حساب: ${user.name || 'عميل'}`,
        message: `السبب: ${payload.reason || 'لم يذكر سبب'} · تم إيقاف (${unitsCount}) وحدة مؤقتاً`,
        type: 'admin_alert',
        link: '/admin/users',
        is_read: false,
      })
    } catch {}

    if (user.email) {
      sendAccountEmail({
        to: user.email,
        subject: 'استلمنا طلب حذف حسابك',
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.9; color: #0a1122;">
                <p>استلمنا طلبك بحذف حسابك من عقار إكزت.</p>
                ${
                  unitsCount > 0
                    ? `<p>وحداتك (${unitsCount}) اتشالت من السوق دلوقتي حالاً، فمحدش هيقدر يشوفها أو يسأل عنها.</p>`
                    : ''
                }
                <p>الفريق هيراجع الطلب. لو غيرت رأيك تقدر تلغي الطلب في أي وقت من حسابك — ولو ألغيته هترجع وحداتك للسوق زي ما كانت.</p>
                <p style="margin-top: 18px;">لو عندك أي سؤال، كلمنا: <a href="${siteUrl}/contact">${siteUrl}/contact</a></p>
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
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false }

    const supabase = await getSupabase()

    await supabase
      .from('users')
      .update({
        deletion_requested: false,
        deletion_reason: null,
        deletion_requested_at: null,
        status: 'active',
      })
      .eq('id', sessionId)

    const { data: pausedUnits } = await supabase
      .from('sell_requests')
      .select('id, previous_status')
      .eq('user_id', sessionId)
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('id, project_name, area, name, status')
      .eq('id', payload.unitId)
      .maybeSingle()

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
          title: `⏸ أوقف المالك عرض وحدة: ${unit.project_name || 'وحدة'}`,
          message: `قام البائع (${unit.name || 'المالك'}) بإيقاف عرض وحدته في ${unit.area || ''} مؤقتاً.`,
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
          admin_note:
            'أعاد المالك عرض هذه الوحدة بعد إيقافها — بانتظار مراجعة الإدارة',
        })
        .eq('id', payload.unitId)

      if (error) return { success: false, error: msg.resumeFailed }

      try {
        await supabase.from('notifications').insert({
          user_id: null,
          title: `🔄 إعادة عرض وحدة للمراجعة: ${unit.project_name || 'وحدة'}`,
          message: `أعاد البائع (${unit.name || 'المالك'}) تفعيل وحدته في ${unit.area || ''} وبانتظار مراجعتك لنشرها.`,
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('id, project_name, area, name, status')
      .eq('id', unitId)
      .maybeSingle()

    const nowIso = new Date().toISOString()

    const { error } = await supabase
      .from('sell_requests')
      .update({
        previous_status: unit?.status || 'pending',
        status: 'deleted_by_seller',
        submission_type: 'deleted_by_seller',
        last_seller_edit_at: nowIso,
        admin_note: `حذفها المالك بتاريخ ${new Date().toLocaleDateString('ar-EG')}`,
      })
      .eq('id', unitId)

    if (error) {
      const { error: fallbackErr } = await supabase
        .from('sell_requests')
        .update({
          status: 'deleted_by_seller',
          admin_note: `حذفها المالك بتاريخ ${new Date().toLocaleDateString('ar-EG')}`,
        })
        .eq('id', unitId)

      if (fallbackErr) {
        return { success: false, error: msg.deleteFailed }
      }
    }

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `🗑 حذف البائع وحدة: ${unit?.project_name || 'وحدة'}`,
        message: `قام المالك (${unit?.name || 'البائع'}) بحذف وحدته في (${unit?.area || '—'}) — اضغط لمراجعتها في قسم المحذوفات.`,
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
  docKey: 'contract' | 'receipts' | 'statement' | 'national_id'
  fileUrl: string
  fileName: string
}) {
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('id, project_name, documents, name')
      .eq('id', payload.unitId)
      .maybeSingle()

    if (!unit) return { success: false, error: msg.unitNotFound }

    const currentDocs =
      unit.documents && typeof unit.documents === 'object' ? unit.documents : {}

    const updatedDocs = {
      ...currentDocs,
      [payload.docKey]: {
        url: payload.fileUrl,
        name: payload.fileName,
        uploaded_at: new Date().toLocaleDateString('en-GB'),
        status: 'pending_review',
      },
    }

    const { error } = await supabase
      .from('sell_requests')
      .update({ documents: updatedDocs })
      .eq('id', payload.unitId)

    if (error) {
      return {
        success: false,
        error: msg.docSaveFailed,
      }
    }

    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `📄 مستند جديد مرفوع لوحدة: ${unit.project_name || 'وحدة'}`,
        message: `قام ${unit.name || 'البائع'} برفع مستند للمراجعة والتوثيق.`,
        type: 'property',
        link: '/admin/properties',
        is_read: false,
      })
    } catch {}

    revalidatePath('/account')
    revalidatePath('/account/documents')
    return { success: true, documents: updatedDocs }
  } catch {
    return { success: false, error: msg.docSaveFailed }
  }
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const supabase = await getSupabase()

    const updateData = {
      available_cash: Number(payload.available_cash) || 0,
      max_installment: Number(payload.max_installment) || 0,
      payment_plan: payload.payment_plan || 'شهري',
      budget: Number(payload.budget) || 0,
      unit_types: payload.unit_types,
      min_rooms: Number(payload.min_rooms) || 0,
      delivery_status: payload.delivery_status || 'جاهزة للاستلام',
      preferred_areas: payload.preferred_areas,
      notify_exact_match: payload.notify_exact_match,
      notify_featured: payload.notify_featured,
    }

    if (payload.buyRequestId) {
      await supabase
        .from('buy_requests')
        .update(updateData)
        .eq('id', payload.buyRequestId)
    } else {
      const { data: user } = await supabase
        .from('users')
        .select('name, phone, email')
        .eq('id', sessionId)
        .maybeSingle()

      await supabase.from('buy_requests').insert({
        ...updateData,
        user_id: sessionId,
        name: user?.name || 'مشتري',
        phone: user?.phone || '',
        email: user?.email || '',
      })
    }

    revalidatePath('/account')
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
  const msg = await getAccMsg()
  try {
    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select(
        'id, project_name, area, name, phone, status, featured_fawry_code, featured_status'
      )
      .eq('id', payload.unitId)
      .maybeSingle()

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
          ? `🔄 تعديل باقة إعلان (${payload.days} يوم) — كود: ${adOrderRef}`
          : `📢 طلب إعلان وتمييز جديد (${payload.days} يوم) — كود: ${adOrderRef}`,
        message: `المالك: ${unit.name || 'البائع'} (${unit.phone || ''}) · الوحدة: ${unit.project_name || 'وحدة'} · اضغط لتفعيل التمييز فوراً.`,
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
  const msg = await getAccMsg()
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get('user_session')?.value
    )
    if (!sessionId) return { success: false, error: msg.sessionExpired }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select(
        'id, project_name, name, is_featured, featured_fawry_code, featured_status'
      )
      .eq('id', unitId)
      .maybeSingle()

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
          ? `⏹ أوقف البائع اشتراك تمييز وحدته (${adRef})`
          : `✕ ألغى البائع طلب إعلان وحدته (${adRef})`,
        message: `قام المالك (${unit.name || 'البائع'}) بحذف وإلغاء طلب التمييز لوحدته في (${unit.project_name || 'مشروعه'}).`,
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
