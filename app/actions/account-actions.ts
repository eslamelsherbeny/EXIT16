'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import nodemailer from 'nodemailer'

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
      from: `"عقار إكزت - Aqar Exit" <${user}>`,
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
  const stripped = digits.replace(/^\+?20/, '').replace(/^0+/, '')
  return `+20${stripped}`
}

// 1. تسجيل الخروج
export async function logoutAccountAction() {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')
  redirect('/login')
}

// 2. تحديث الاسم ورقم الموبايل (مع رسالة تأكيد)
export async function updatePersonalInfoAction(payload: {
  name: string
  phone: string
}) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول.' }

    const cleanName = (payload.name || '').trim()
    const formattedPhone = formatPrimaryPhone(payload.phone)

    if (!cleanName || !formattedPhone || formattedPhone.length < 11) {
      return { success: false, error: 'يرجى إدخال اسم صحيح ورقم موبايل مكون من 11 رقم.' }
    }

    const supabase = await getSupabase()

    // التأكد أن الرقم غير مستخدم لحساب شخص آخر
    const { data: conflictPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', formattedPhone)
      .neq('id', sessionId)
      .limit(1)

    if (conflictPhone && conflictPhone.length > 0) {
      return { success: false, error: 'رقم الموبايل هذا مسجل بالفعل لحساب آخر.' }
    }

    const { error } = await supabase
      .from('users')
      .update({ name: cleanName, phone: formattedPhone })
      .eq('id', sessionId)

    if (error) return { success: false, error: 'تعذر تحديث البيانات حالياً.' }

    // تحديث الاسم والرقم في طلبات البيع والشراء المرتبطة بالحساب
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
      message: 'تم حفظ وتحديث اسمك ورقم موبايلك بنجاح ✓',
    }
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع.' }
  }
}

// 3. تحديث البريد الإلكتروني (بدون أخطاء ومع التحقق من عدم التكرار)
export async function updateEmailInfoAction(payload: { email: string }) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول.' }

    const cleanEmail = (payload.email || '').trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'يرجى كتابة بريد إلكتروني صحيح.' }
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
        error: 'هذا البريد الإلكتروني مسجل بالفعل لحساب آخر.',
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
      return { success: false, error: 'تعذر تغيير الإيميل، يرجى المحاولة مرة أخرى.' }
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

    // إرسال إيميل تأكيدي للبريد الجديد
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
      message: `تم تغيير بريدك الإلكتروني بنجاح إلى ${cleanEmail} ✓`,
    }
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع.' }
  }
}

// 4. إرسال طلب حذف الحساب (يحول الوحدات إلى موقوفة مؤقتاً ويرسل إيميل تأكيد)
export async function requestAccountDeletionAction(payload: { reason?: string }) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { success: false, error: 'يرجى تسجيل الدخول.' }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .eq('id', sessionId)
      .maybeSingle()

    if (!user) return { success: false, error: 'الحساب غير موجود.' }

    const nowIso = new Date().toISOString()

    // تحديث حالة المستخدم
    await supabase
      .from('users')
      .update({
        deletion_requested: true,
        deletion_reason: payload.reason || 'بدون سبب محدد',
        deletion_requested_at: nowIso,
        status: 'deletion_pending',
      })
      .eq('id', sessionId)

    // إخفاء وحدات المستخدم من السوق العام فوراً
    await supabase
      .from('sell_requests')
      .update({ status: 'paused_deletion' })
      .eq('user_id', sessionId)
      .in('status', ['active', 'approved', 'published', 'pending'])

    // إشعار للإدارة بطلب الحذف
    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `طلب حذف حساب: ${user.name || 'عميل'}`,
        message: `السبب: ${payload.reason || 'لم يذكر سبب'} · الهاتف: ${user.phone || '—'}`,
        type: 'admin_alert',
        link: '/admin/users',
        is_read: false,
      })
    } catch {}

    // إرسال إيميل للعميل بتأكيد استلام طلب الحذف
    if (user.email) {
      sendAccountEmail({
        to: user.email,
        subject: 'استلمنا طلب حذف حسابك — عقار إكزت',
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.8; color: #0a1122;">
                <h3 style="color: #0a1122;">أهلاً ${user.name || 'عميلنا العزيز'}،</h3>
                <p>استلمنا طلبك لحذف حسابك وهو الآن تحت المراجعة.</p>
                <p>وحداتك اتشالت من السوق دلوقتي، فمحدش هيشوفها أو يسأل عنها. لو مرجعناش خلال 30 يوم، الحساب هيتحذف تلقائياً بالكامل.</p>
                <p>غيّرت رأيك؟ تقدر تدخل على حسابك في أي وقت وتضغط على <strong>"الغِ الطلب"</strong> وهترجع وحداتك للسوق زي ما كانت.</p>
               </div>`,
      }).catch(() => {})
    }

    revalidatePath('/account')
    revalidatePath('/opportunities')
    revalidatePath('/admin/users')
    return { success: true }
  } catch {
    return { success: false, error: 'تعذر تسجيل طلب الحذف.' }
  }
}

// 5. إلغاء طلب حذف الحساب واستعادة الوحدات
export async function cancelAccountDeletionAction() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
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

    await supabase
      .from('sell_requests')
      .update({ status: 'pending' })
      .eq('user_id', sessionId)
      .eq('status', 'paused_deletion')

    revalidatePath('/account')
    revalidatePath('/opportunities')
    return { success: true }
  } catch {
    return { success: false }
  }
}

// 6. حفظ مستند مرفوع للوحدة (عقد، إيصالات، كشف حساب، بطاقة)
export async function saveUnitDocumentAction(payload: {
  unitId: string
  docKey: 'contract' | 'receipts' | 'statement' | 'national_id'
  fileUrl: string
  fileName: string
}) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { success: false, error: 'يرجى تسجيل الدخول.' }

    const supabase = await getSupabase()
    const { data: unit } = await supabase
      .from('sell_requests')
      .select('id, project_name, documents, name')
      .eq('id', payload.unitId)
      .maybeSingle()

    if (!unit) return { success: false, error: 'لم يتم العثور على الوحدة.' }

    const currentDocs =
      unit.documents && typeof unit.documents === 'object' ? unit.documents : {}

    const updatedDocs = {
      ...currentDocs,
      [payload.docKey]: {
        url: payload.fileUrl,
        name: payload.fileName,
        uploaded_at: new Date().toLocaleDateString('en-GB'), // مثال: 19/10/2026
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
        error: 'تأكد من تشغيل أمر إضافة عمود documents في قاعدة البيانات.',
      }
    }

    // إشعار للأدمن برفع مستند جديد
    try {
      await supabase.from('notifications').insert({
        user_id: null,
        title: `مستند جديد مرفوع لوحدة: ${unit.project_name || 'وحدة'}`,
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
    return { success: false, error: 'تعذر حفظ المستند.' }
  }
}

// 7. تحديث ميزانية وتفضيلات المشتري من صفحة "عدّل ميزانيتك"
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
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    if (!sessionId) return { success: false, error: 'يرجى تسجيل الدخول.' }

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
    return { success: false, error: 'تعذر حفظ التفضيلات.' }
  }
}