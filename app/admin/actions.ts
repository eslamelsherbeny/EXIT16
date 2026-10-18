"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { randomBytes, scryptSync } from "node:crypto"
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

async function sendAdminEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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

function revalidateAdminAll() {
  revalidatePath("/admin")
  revalidatePath("/admin/properties")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/users")
  revalidatePath("/admin/investors")
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
    // محاولة التحديث بدون admin_note لو العمود غير موجود
    const { error: fallbackError } = await supabase
      .from("sell_requests")
      .update({ status })
      .eq("id", propertyId)

    if (fallbackError) {
      return { success: false, error: "تعذر تحديث حالة العقار في قاعدة البيانات." }
    }
  }

  // إرسال إيميل للبائع عند الموافقة أو الرفض أو وجود عرض
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
  const { error } = await supabase.from("sell_requests").delete().eq("id", propertyId)
  if (error) return { success: false, error: "تعذر حذف العقار." }
  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 2. التحكم في حالات طلبات الشراء (المشترين)
// ==========================================
export async function updateBuyerLeadStatusAction(leadId: string, status: string) {
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
  const { error } = await supabase.from("buy_requests").delete().eq("id", leadId)
  if (error) return { success: false, error: "تعذر حذف طلب الشراء." }
  revalidateAdminAll()
  return { success: true }
}

// ==========================================
// 3. التحكم في حالات طلبات المستثمرين
// ==========================================
export async function updateInvestorStatusAction(investorId: string, status: string) {
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
  const { error } = await supabase.from("investor_leads").delete().eq("id", investorId)
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
  
  const cleanRole = String(role || 'user').trim().toLowerCase()
  const cleanStatus = String(status || 'active').trim().toLowerCase()

  const { error } = await supabase
    .from("users")
    .update({ 
      role: cleanRole, 
      status: cleanStatus 
    })
    .eq("id", userId)

  if (error) {
    console.error("Update User Role Error:", error)
    return {
      success: false,
      error: "تعذر تحديث الصلاحية في قاعدة البيانات. تأكد من تشغيل سكريبت الـ SQL.",
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

  // محاولة الإدخال مع الصلاحية والحالة
  const { error } = await supabase.from("users").insert({
    name,
    email,
    phone: formattedPhone,
    password_hash: hash,
    role,
    status: "active",
  })

  if (error) {
    // محاولة بديلة لو أعمدة role و status غير مضافة بعد
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