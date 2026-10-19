"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createHash, timingSafeEqual, randomBytes, scryptSync } from "node:crypto"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"

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

async function sendAdminEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "")
  if (!user || !pass || !to) return false

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from: `"إدارة منصة دارك" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error("Admin Email Error:", e)
    return false
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
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
      if (actual1.length === expected.length && timingSafeEqual(Buffer.from(actual1), Buffer.from(expected))) {
        return true
      }
      const actual2 = scryptSync(cleanPass, salt, 64).toString('hex')
      return actual2.length === expected.length && timingSafeEqual(Buffer.from(actual2), Buffer.from(expected))
    }

    const sha1 = createHash('sha256').update(password).digest('hex')
    if (sha1.length === cleanStored.length && timingSafeEqual(Buffer.from(sha1), Buffer.from(cleanStored))) {
      return true
    }
    const sha2 = createHash('sha256').update(cleanPass).digest('hex')
    if (sha2.length === cleanStored.length && timingSafeEqual(Buffer.from(sha2), Buffer.from(cleanStored))) {
      return true
    }

    return cleanStored === password || cleanStored === cleanPass
  } catch {
    return false
  }
}

function revalidateAdminAll() {
  revalidatePath("/admin", "layout")
  revalidatePath("/admin")
  revalidatePath("/admin/properties")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/users")
  revalidatePath("/admin/investors")
  revalidatePath("/admin/settings")
  revalidatePath("/admin/profile")
  revalidatePath("/account")
  revalidatePath("/opportunities")
}

// ==========================================
// 1. التحكم في حالات طلبات البيع (العقارات)
// ==========================================
export async function updatePropertyStatusAction(
  propertyId: string,
  status: string,
  reason?: string
) {
  const supabase = await getSupabase()

  const { data: prop } = await supabase
    .from("sell_requests")
    .select("id, project_name, name, email")
    .eq("id", propertyId)
    .maybeSingle()

  const updatePayload: Record<string, any> = { status }
  if (reason !== undefined) {
    updatePayload.admin_note = reason
  }

  const { error } = await supabase
    .from("sell_requests")
    .update(updatePayload)
    .eq("id", propertyId)

  if (error) {
    const { error: fallbackError } = await supabase
      .from("sell_requests")
      .update({ status })
      .eq("id", propertyId)

    if (fallbackError) {
      return {
        success: false,
        error: "تعذر تحديث حالة العقار في قاعدة البيانات.",
      }
    }
  }

  if (prop?.email) {
    const statusMessages: Record<string, { subject: string; body: string }> = {
      active: {
        subject: "تمت الموافقة على وحدتك ونشرها في منصة دارك 🎉",
        body: `يسعدنا إبلاغك بأنه تمت مراجعة واعتماد وحدتك في مشروع <strong>${prop.project_name || "وحدتك"}</strong> وهي الآن معروضة أمام المشترين في السوق.`,
      },
      offer_received: {
        subject: "لديك عرض شراء جديد على وحدتك في دارك! 💰",
        body: `تم استلام عرض شراء جاد على وحدتك في مشروع <strong>${prop.project_name || "وحدتك"}</strong>. سيتواصل معك مسؤول حالتك فوراً لإتمام الإجراءات.`,
      },
      transferring: {
        subject: "بدء إجراءات نقل التعاقد لوحدتك - دارك 📄",
        body: `وحدتك في مشروع <strong>${prop.project_name || "وحدتك"}</strong> دخلت الآن مرحلة مراجعة المستندات ونقل التعاقد.`,
      },
      sold: {
        subject: "مبروك! تمت عملية بيع وحدتك بنجاح عبر دارك 🏆",
        body: `تم إتمام عملية التخارج ونقل التعاقد لوحدتك في مشروع <strong>${prop.project_name || "وحدتك"}</strong> بنجاح.`,
      },
      rejected: {
        subject: "تحديث بخصوص طلب عرض وحدتك في دارك",
        body: `نعتذر، لم نتمكن من نشر طلب وحدتك في مشروع <strong>${prop.project_name || "وحدتك"}</strong> حالياً.${reason ? `<br/><strong>السبب:</strong> ${reason}` : ""}`,
      },
    }

    const msg = statusMessages[status]
    if (msg) {
      await sendAdminEmail({
        to: prop.email,
        subject: msg.subject,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.7;">
                <h2 style="color: #101A2B;">أهلاً بك يا ${prop.name || "عميلنا العزيز"}</h2>
                <p>${msg.body}</p>
               </div>`,
      })
    }
  }

  revalidateAdminAll()
  return { success: true }
}

export async function deletePropertyAction(propertyId: string) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("sell_requests")
    .delete()
    .eq("id", propertyId)
  if (error) return { success: false, error: "تعذر حذف العقار." }
  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 2. التحكم في حالات طلبات الشراء (المشترين)
// ==========================================
export async function updateBuyerLeadStatusAction(
  leadId: string,
  status: string
) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("buy_requests")
    .update({ status })
    .eq("id", leadId)

  if (error) {
    return {
      success: false,
      error: "تأكد من إضافة عمود status في جدول buy_requests.",
    }
  }

  revalidateAdminAll()
  return { success: true }
}

export async function deleteBuyerLeadAction(leadId: string) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("buy_requests")
    .delete()
    .eq("id", leadId)
  if (error) return { success: false, error: "تعذر حذف طلب الشراء." }
  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 3. التحكم في حالات طلبات المستثمرين
// ==========================================
export async function updateInvestorStatusAction(
  investorId: string,
  status: string
) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("investor_leads")
    .update({ status })
    .eq("id", investorId)

  if (error) {
    return {
      success: false,
      error: "تأكد من إضافة عمود status في جدول investor_leads.",
    }
  }

  revalidateAdminAll()
  return { success: true }
}

export async function deleteInvestorAction(investorId: string) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("investor_leads")
    .delete()
    .eq("id", investorId)
  if (error) return { success: false, error: "تعذر حذف طلب المستثمر." }
  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 4. إدارة المستخدمين والصلاحيات (Admins & Roles)
// ==========================================
export async function updateUserRoleAndStatusAction(
  userId: string,
  role: string,
  status: string
) {
  const supabase = await getSupabase()

  const cleanRole = String(role || "user").trim().toLowerCase()
  const cleanStatus = String(status || "active").trim().toLowerCase()

  const { error } = await supabase
    .from("users")
    .update({
      role: cleanRole,
      status: cleanStatus,
    })
    .eq("id", userId)

  if (error) {
    console.error("Update User Role Error:", error)
    return {
      success: false,
      error:
        "تعذر تحديث الصلاحية في قاعدة البيانات. تأكد من تشغيل سكريبت الـ SQL.",
    }
  }

  revalidateAdminAll()
  return { success: true }
}

export async function createAdminOrUserAction(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim()
  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const rawPhone = ((formData.get("phone") as string) || "").trim()
  const password = (formData.get("password") as string) || ""
  const role = ((formData.get("role") as string) || "admin").trim()

  if (!name || !email || !rawPhone || password.length < 8) {
    return {
      success: false,
      error: "يرجى ملء كافة البيانات والتأكد أن كلمة المرور 8 أحرف على الأقل.",
    }
  }

  const stripped = rawPhone.replace(/^\+?20/, "").replace(/^0+/, "")
  const formattedPhone = `+20${stripped}`
  const hash = hashPassword(password)

  const supabase = await getSupabase()

  const { error } = await supabase.from("users").insert({
    name,
    email,
    phone: formattedPhone,
    password_hash: hash,
    role,
    status: "active",
  })

  if (error) {
    const { error: fallbackError } = await supabase.from("users").insert({
      name,
      email,
      phone: formattedPhone,
      password_hash: hash,
    })

    if (fallbackError) {
      return {
        success: false,
        error: "البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً.",
      }
    }
  }

  revalidateAdminAll()
  return { success: true }
}

export async function deleteUserByAdminAction(userId: string) {
  const supabase = await getSupabase()
  await supabase.from("sell_requests").delete().eq("user_id", userId)
  await supabase.from("buy_requests").delete().eq("user_id", userId)
  const { error } = await supabase.from("users").delete().eq("id", userId)

  if (error) return { success: false, error: "تعذر حذف الحساب." }
  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 5. تحديث الملف الشخصي للأدمن (مع التحقق من كلمة المرور القديمة)
// ==========================================
export async function updateAdminProfileAction(formData: FormData) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("user_session")?.value
  if (!sessionId) {
    return { success: false, error: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً." }
  }

  const name = ((formData.get("name") as string) || "").trim()
  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const rawPhone = ((formData.get("phone") as string) || "").trim()
  const currentPassword = ((formData.get("currentPassword") as string) || "").trim()
  const newPassword = ((formData.get("newPassword") as string) || "").trim()
  const confirmNewPassword = ((formData.get("confirmNewPassword") as string) || "").trim()

  if (!name || !email || !rawPhone) {
    return { success: false, error: "الاسم والبريد الإلكتروني ورقم الهاتف حقول مطلوبة." }
  }

  const stripped = rawPhone.replace(/^\+?20/, "").replace(/^0+/, "")
  const formattedPhone = `+20${stripped}`

  const updateData: Record<string, any> = {
    name,
    email,
    phone: formattedPhone,
  }

  const supabase = await getSupabase()

  // تأمين تغيير كلمة المرور
  if (newPassword) {
    if (newPassword.length < 8) {
      return { success: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." }
    }
    if (newPassword !== confirmNewPassword) {
      return { success: false, error: "كلمتا المرور الجديدتان غير متطابقتين." }
    }
    if (!currentPassword) {
      return { success: false, error: "يرجى إدخال كلمة المرور الحالية لتتمكن من تغييرها." }
    }

    // جلب الباسورد القديم للتحقق من هوية صاحب الحساب
    const { data: user } = await supabase.from("users").select("password_hash").eq("id", sessionId).single()
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return { success: false, error: "كلمة المرور الحالية التي أدخلتها غير صحيحة." }
    }

    updateData.password_hash = hashPassword(newPassword)
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", sessionId)

  if (error) {
    return {
      success: false,
      error: "تعذر تحديث البيانات، قد يكون البريد أو الهاتف مستخدماً لحساب آخر.",
    }
  }

  // حذف أي طلبات بيع أو شراء تجريبية مسجلة باسم الأدمن إن رغب في تنظيف حسابه
  if (formData.get("clearAdminRequests") === "1") {
    await supabase.from("sell_requests").delete().eq("user_id", sessionId)
    await supabase.from("buy_requests").delete().eq("user_id", sessionId)
  }

  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 6. حفظ إعدادات الموقع العامة وحالة الصيانة
// ==========================================
export async function saveSiteSettingsAction(formData: FormData) {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === "production"

  const settingsPayload = {
    siteName: ((formData.get("siteName") as string) || "دارك").trim(),
    whatsappNumber: ((formData.get("whatsappNumber") as string) || "+201018595959").trim(),
    supportEmail: ((formData.get("supportEmail") as string) || "support@darak.com").trim(),
    buyerCommission: ((formData.get("buyerCommission") as string) || "1.25").trim(),
    maintenanceMode: formData.get("maintenanceMode") === "on",
    allowNewSells: formData.get("allowNewSells") === "on",
    allowNewBuys: formData.get("allowNewBuys") === "on",
    emailNotifications: formData.get("emailNotifications") === "on",
  }

  // حفظ الإعدادات في الكوكيز وفي قاعدة البيانات إن وجد جدول site_settings
  cookieStore.set("darak_site_settings", JSON.stringify(settingsPayload), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: isProd,
  })

  try {
    const supabase = await getSupabase()
    await supabase.from("site_settings").upsert({
      id: "global",
      ...settingsPayload,
      updated_at: new Date().toISOString(),
    })
  } catch {}

  revalidateAdminAll()
  return { success: true }
}