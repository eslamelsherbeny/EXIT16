"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  createHash,
  timingSafeEqual,
  randomBytes,
  scryptSync,
} from "node:crypto"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"
import {
  createSignedSessionToken,
  parseAndVerifySessionCookie,
} from "@/app/actions/auth-actions"

export type StaffRoleCode = "admin" | "moderator" | "sales"

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

function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== "string") return ""
  return val
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .slice(0, maxLen)
}

// ==========================================
// حارس الأمان المركزي لكل عمليات الإدارة (RBAC + Session Fingerprint)
// ==========================================
async function requireAdminAuth(
  allowedRoles: StaffRoleCode[] = ["admin", "moderator", "sales"]
) {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  if (!rawSession) {
    throw new Error("غير مصرح: يرجى تسجيل الدخول بحساب الإدارة.")
  }

  const candidateUserId = rawSession.split(".")[0]
  const supabase = await getSupabase()

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, status, password_hash")
    .eq("id", candidateUserId)
    .maybeSingle()

  if (!user) {
    throw new Error("غير مصرح: الحساب غير موجود.")
  }

  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    user.password_hash
  )
  if (!sessionCheck.valid) {
    cookieStore.delete("user_session")
    cookieStore.delete("session_hint")
    throw new Error(
      "انتهت صلاحية الجلسة بسبب تغيير كلمة المرور، يرجى تسجيل الدخول مجدداً."
    )
  }

  const cleanStatus = String(user.status || "active").trim().toLowerCase()
  if (cleanStatus === "suspended") {
    throw new Error("تم إيقاف هذا الحساب الإداري.")
  }

  const cleanRole = String(user.role || "user")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase() as StaffRoleCode | "user"

  if (!allowedRoles.includes(cleanRole as StaffRoleCode)) {
    throw new Error(
      "عذراً، حسابك الحالي لا يمتلك صلاحية لتنفيذ هذا الإجراء."
    )
  }

  return { supabase, adminUser: user, role: cleanRole as StaffRoleCode }
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
    if (cleanStored.startsWith("scrypt$")) {
      const [, salt, expected] = cleanStored.split("$")
      if (!salt || !expected) return false
      const actual1 = scryptSync(password, salt, 64).toString("hex")
      if (
        actual1.length === expected.length &&
        timingSafeEqual(Buffer.from(actual1), Buffer.from(expected))
      ) {
        return true
      }
      const actual2 = scryptSync(cleanPass, salt, 64).toString("hex")
      return (
        actual2.length === expected.length &&
        timingSafeEqual(Buffer.from(actual2), Buffer.from(expected))
      )
    }

    const sha1 = createHash("sha256").update(password).digest("hex")
    if (
      sha1.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(sha1), Buffer.from(cleanStored))
    ) {
      return true
    }
    const sha2 = createHash("sha256").update(cleanPass).digest("hex")
    if (
      sha2.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(sha2), Buffer.from(cleanStored))
    ) {
      return true
    }

    return cleanStored === password || cleanStored === cleanPass
  } catch {
    return false
  }
}

function revalidateAdminAll() {
  revalidatePath("/", "layout")
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
// 1. التحكم في حالات طلبات البيع (مسموح لـ admin + moderator + sales)
// ==========================================
export async function updatePropertyStatusAction(
  propertyId: string,
  status: string,
  reason?: string
) {
  try {
    const { supabase } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])
    const cleanReason =
      reason !== undefined ? sanitizeText(reason, 600) : undefined

    const { data: prop } = await supabase
      .from("sell_requests")
      .select(
        "id, user_id, project_name, area, unit_type, paid_amount, contract_price, name, email"
      )
      .eq("id", propertyId)
      .maybeSingle()

    const updatePayload: Record<string, any> = {
      status: sanitizeText(status, 40),
    }
    if (cleanReason !== undefined) {
      updatePayload.admin_note = cleanReason
    }

    const { error } = await supabase
      .from("sell_requests")
      .update(updatePayload)
      .eq("id", propertyId)

    if (error) {
      const { error: fallbackError } = await supabase
        .from("sell_requests")
        .update({ status: updatePayload.status })
        .eq("id", propertyId)

      if (fallbackError) {
        return {
          success: false,
          error: "تعذر تحديث حالة العقار في قاعدة البيانات.",
        }
      }
    }

    if (prop?.user_id) {
      const sellerNotifMap: Record<
        string,
        { title: string; message: string; type: string }
      > = {
        active: {
          title: "تم نشر وحدتك في السوق 🎉",
          message: `تمت الموافقة على وحدتك في (${prop.project_name || "مشروعك"}) وهي الآن معروضة أمام المشترين.`,
          type: "status_update",
        },
        offer_received: {
          title: "لديك عرض شراء جديد! 💰",
          message: `يوجد مشتري جاد مهتم بوحدتك في (${prop.project_name || "مشروعك"}). تابع التفاصيل من حسابك.`,
          type: "new_offer",
        },
        transferring: {
          title: "بدء إجراءات نقل التعاقد 📄",
          message: `وحدتك في (${prop.project_name || "مشروعك"}) دخلت مرحلة مراجعة المستندات ونقل الملكية.`,
          type: "status_update",
        },
        sold: {
          title: "مبروك! تمت عملية البيع بنجاح 🏆",
          message: `تم إتمام بيع وحدتك ونقل التعاقد في (${prop.project_name || "مشروعك"}) بنجاح.`,
          type: "status_update",
        },
        rejected: {
          title: "ملاحظة بخصوص طلب وحدتك ⚠️",
          message: cleanReason
            ? `يرجى مراجعة وحدتك: ${cleanReason}`
            : `يرجى مراجعة بيانات وحدتك في (${prop.project_name || "مشروعك"}) لإعادة النشر.`,
          type: "status_update",
        },
      }

      const sellerNotif = sellerNotifMap[status]
      if (sellerNotif) {
        try {
          await supabase.from("notifications").insert({
            user_id: prop.user_id,
            title: sellerNotif.title,
            message: sellerNotif.message,
            type: sellerNotif.type,
            link: `/account?view=seller&unitId=${prop.id}`,
            is_read: false,
          })
        } catch {}
      }
    }

    if (status === "active" && prop) {
      try {
        const unitCash = Number(prop.paid_amount || 0)
        const unitArea = String(prop.area || "").trim()

        const { data: buyers } = await supabase
          .from("buy_requests")
          .select("user_id, available_cash, budget, preferred_areas")
          .not("user_id", "is", null)

        const matchedBuyerIds = new Set<string>()

        ;(buyers || []).forEach((b: any) => {
          if (!b.user_id || b.user_id === prop.user_id) return
          const buyerMaxCash = Number(b.available_cash || b.budget || 0)
          const areas: string[] = Array.isArray(b.preferred_areas)
            ? b.preferred_areas
            : []

          const cashMatches =
            buyerMaxCash === 0 ||
            unitCash === 0 ||
            unitCash <= buyerMaxCash * 1.25
          const areaMatches =
            areas.length === 0 ||
            !unitArea ||
            areas.some((a) => unitArea.includes(a) || a.includes(unitArea))

          if (cashMatches && areaMatches) {
            matchedBuyerIds.add(b.user_id)
          }
        })

        if (matchedBuyerIds.size > 0) {
          const cashFormatted = unitCash.toLocaleString("en-US")
          const buyerNotifs = Array.from(matchedBuyerIds).map(
            (buyerUserId) => ({
              user_id: buyerUserId,
              title: `فرصة جديدة تطابق طلبك في ${unitArea || "السوق"} 🎯`,
              message: `نزلت وحدة (${prop.project_name || prop.unit_type || "سكنية"}) بمطلوب كاش ${cashFormatted} ج.م بدون أوفر.`,
              type: "property_match",
              link: `/opportunities/${prop.id}`,
              is_read: false,
            })
          )

          await supabase.from("notifications").insert(buyerNotifs)
        }
      } catch (e) {
        console.error("Smart Match Notification Error:", e)
      }
    }

    if (prop?.email) {
      const statusMessages: Record<string, { subject: string; body: string }> =
        {
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
            body: `نعتذر، لم نتمكن من نشر طلب وحدتك في مشروع <strong>${prop.project_name || "وحدتك"}</strong> حالياً.${cleanReason ? `<br/><strong>السبب:</strong> ${cleanReason}` : ""}`,
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
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "غير مصرح بتنفيذ هذا الإجراء.",
    }
  }
}

export async function deletePropertyAction(propertyId: string) {
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { error } = await supabase
      .from("sell_requests")
      .delete()
      .eq("id", propertyId)
    if (error) return { success: false, error: "تعذر حذف العقار." }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح بحذف العقارات.",
    }
  }
}

// ==========================================
// 2. التحكم في حالات طلبات الشراء (مسموح لـ admin + moderator + sales)
// ==========================================
export async function updateBuyerLeadStatusAction(
  leadId: string,
  status: string
) {
  try {
    const { supabase } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])
    const cleanStatus = sanitizeText(status, 40)

    const { data: lead } = await supabase
      .from("buy_requests")
      .select("id, user_id, name")
      .eq("id", leadId)
      .maybeSingle()

    const { error } = await supabase
      .from("buy_requests")
      .update({ status: cleanStatus })
      .eq("id", leadId)

    if (error) {
      return {
        success: false,
        error: "تأكد من إضافة عمود status في جدول buy_requests.",
      }
    }

    if (lead?.user_id) {
      const buyerStatusText: Record<string, string> = {
        contacted: "قام فريق المبيعات بمراجعة طلبك وجاري التواصل معك.",
        qualified: "تم تجهيز قائمة بالفرص العقارية المطابقة لميزانيتك في حسابك.",
        closed: "مبروك! تم إتمام تعاقدك بنجاح عبر منصة دارك.",
      }
      if (buyerStatusText[cleanStatus]) {
        try {
          await supabase.from("notifications").insert({
            user_id: lead.user_id,
            title: "تحديث بخصوص طلب الشراء الخاص بك 🌟",
            message: buyerStatusText[cleanStatus],
            type: "status_update",
            link: "/account?view=buyer",
            is_read: false,
          })
        } catch {}
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح.",
    }
  }
}

export async function deleteBuyerLeadAction(leadId: string) {
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { error } = await supabase
      .from("buy_requests")
      .delete()
      .eq("id", leadId)
    if (error) return { success: false, error: "تعذر حذف طلب الشراء." }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح.",
    }
  }
}

// ==========================================
// 3. التحكم في حالات طلبات المستثمرين
// ==========================================
export async function updateInvestorStatusAction(
  investorId: string,
  status: string
) {
  try {
    const { supabase } = await requireAdminAuth(["admin", "moderator"])
    const cleanStatus = sanitizeText(status, 40)

    const [{ error: err1 }, { error: err2 }] = await Promise.all([
      supabase
        .from("investor_leads")
        .update({ status: cleanStatus })
        .eq("id", investorId),
      supabase
        .from("investor_requests")
        .update({ status: cleanStatus })
        .eq("id", investorId),
    ])

    if (err1 && err2) {
      return {
        success: false,
        error: "تعذر تحديث حالة المستثمر في قاعدة البيانات.",
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح.",
    }
  }
}

export async function deleteInvestorAction(investorId: string) {
  try {
    const { supabase } = await requireAdminAuth(["admin"])

    await Promise.all([
      supabase.from("investor_leads").delete().eq("id", investorId),
      supabase.from("investor_requests").delete().eq("id", investorId),
    ])

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "غير مصرح بحذف طلب المستثمر.",
    }
  }
}

// ==========================================
// 4. إدارة المستخدمين والصلاحيات (مقصورة على Admin الرئيسي فقط)
// ==========================================
export async function updateUserRoleAndStatusAction(
  userId: string,
  role: string,
  status: string
) {
  try {
    const { supabase } = await requireAdminAuth(["admin"])

    const cleanRole = sanitizeText(role || "user", 20).toLowerCase()
    const cleanStatus = sanitizeText(status || "active", 20).toLowerCase()

    const { error } = await supabase
      .from("users")
      .update({
        role: cleanRole,
        status: cleanStatus,
      })
      .eq("id", userId)

    if (error) {
      return {
        success: false,
        error: "تعذر تحديث الصلاحية في قاعدة البيانات.",
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "غير مصرح بتعديل الصلاحيات.",
    }
  }
}

export async function createAdminOrUserAction(formData: FormData) {
  try {
    const { supabase } = await requireAdminAuth(["admin"])

    const name = sanitizeText(formData.get("name"), 120)
    const email = sanitizeText(formData.get("email"), 160).toLowerCase()
    const rawPhone = sanitizeText(formData.get("phone"), 30)
    const password = String(formData.get("password") || "").slice(0, 128)
    const role = sanitizeText(formData.get("role") || "sales", 20).toLowerCase()

    if (!name || !email || !rawPhone || password.length < 8) {
      return {
        success: false,
        error:
          "يرجى ملء كافة البيانات والتأكد أن كلمة المرور 8 أحرف على الأقل.",
      }
    }

    const stripped = rawPhone.replace(/^\+?20/, "").replace(/^0+/, "")
    const formattedPhone = `+20${stripped}`
    const hash = hashPassword(password)

    const { error } = await supabase.from("users").insert({
      name,
      email,
      phone: formattedPhone,
      password_hash: hash,
      role,
      status: "active",
    })

    if (error) {
      return {
        success: false,
        error: "البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً.",
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "غير مصرح بإنشاء حسابات إدارية.",
    }
  }
}

export async function deleteUserByAdminAction(userId: string) {
  try {
    const { supabase, adminUser } = await requireAdminAuth(["admin"])
    if (userId === adminUser.id) {
      return { success: false, error: "لا يمكنك حذف حسابك الإداري الحالي." }
    }

    await supabase.from("sell_requests").delete().eq("user_id", userId)
    await supabase.from("buy_requests").delete().eq("user_id", userId)
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) return { success: false, error: "تعذر حذف الحساب." }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح بحذف الحسابات.",
    }
  }
}

// ==========================================
// 5. تحديث بيانات البروفايل للإدارة
// ==========================================
export async function updateAdminProfileDataAction(formData: FormData) {
  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const name = sanitizeText(formData.get("name"), 120)
    const email = sanitizeText(formData.get("email"), 160).toLowerCase()
    const rawPhone = sanitizeText(formData.get("phone"), 30)
    const currentPassword = String(formData.get("currentPassword") || "").trim()

    if (!name || !email || !rawPhone || !currentPassword) {
      return {
        success: false,
        error: "الرجاء إكمال جميع الحقول وإدخال كلمة المرور للمصادقة.",
      }
    }

    if (!verifyPassword(currentPassword, adminUser.password_hash)) {
      return {
        success: false,
        error: "كلمة المرور الحالية التي أدخلتها للمصادقة غير صحيحة.",
      }
    }

    const stripped = rawPhone.replace(/^\+?20/, "").replace(/^0+/, "")
    const formattedPhone = `+20${stripped}`

    const updateData: Record<string, any> = {
      name,
      phone: formattedPhone,
    }

    let successMessage = "تم تحديث بياناتك بنجاح."

    if (email !== adminUser.email) {
      updateData.email = email
      updateData.is_verified = false

      const verifyToken = randomBytes(24).toString("hex")
      updateData.otp_code = verifyToken

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://next-js-rtl-platform-structure.vercel.app"
      const verifyLink = `${siteUrl}/login?verified=1&email=${encodeURIComponent(email)}&token=${verifyToken}`

      await sendAdminEmail({
        to: email,
        subject: "دارك — تأكيد البريد الإلكتروني الجديد",
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
                <h2 style="color: #101A2B;">مرحباً ${name}،</h2>
                <p>لقد قمت بتغيير بريدك الإلكتروني في منصة دارك. يرجى تأكيد هذا البريد بالضغط على الرابط أدناه لاستعادة توثيق حسابك:</p>
                <div style="margin: 20px 0;">
                  <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                    تأكيد البريد الإلكتروني
                  </a>
                </div>
               </div>`,
      })

      successMessage =
        "تم تحديث البيانات. يرجى فحص بريدك الجديد لتأكيده وتوثيق الحساب."
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", adminUser.id)

    if (error) {
      return {
        success: false,
        error: "تعذر التحديث، قد يكون الإيميل أو الهاتف مستخدماً لحساب آخر.",
      }
    }

    if (formData.get("clearAdminRequests") === "1") {
      await supabase.from("sell_requests").delete().eq("user_id", adminUser.id)
      await supabase.from("buy_requests").delete().eq("user_id", adminUser.id)
    }

    revalidateAdminAll()
    return { success: true, message: successMessage }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "انتهت الجلسة.",
    }
  }
}

// ==========================================
// 6. تغيير كلمة المرور للأدمن
// ==========================================
export async function changeAdminPasswordAction(formData: FormData) {
  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const currentPassword = String(formData.get("currentPassword") || "").trim()
    const newPassword = String(formData.get("newPassword") || "").trim()

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: "يرجى كتابة الباسورد الحالي والجديد (8 أحرف على الأقل).",
      }
    }

    if (!verifyPassword(currentPassword, adminUser.password_hash)) {
      return { success: false, error: "كلمة المرور الحالية غير صحيحة." }
    }

    const newHash = hashPassword(newPassword)
    const { error } = await supabase
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", adminUser.id)

    if (error) return { success: false, error: "تعذر تغيير كلمة المرور." }

    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === "production"
    const newToken = createSignedSessionToken(adminUser.id, newHash)
    cookieStore.set("user_session", newToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: isProd,
      httpOnly: true,
    })

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "انتهت الجلسة.",
    }
  }
}

// ==========================================
// 7. حفظ إعدادات الموقع العامة (Admin فقط)
// ==========================================
export async function saveSiteSettingsAction(formData: FormData) {
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === "production"

    const settingsPayload = {
      siteName: sanitizeText(formData.get("siteName") || "دارك", 80),
      whatsappNumber: sanitizeText(
        formData.get("whatsappNumber") || "+201018595959",
        30
      ),
      supportEmail: sanitizeText(
        formData.get("supportEmail") || "support@darak.com",
        120
      ),
      buyerCommission: sanitizeText(
        formData.get("buyerCommission") || "1.25",
        10
      ),
      promo7Price: sanitizeText(formData.get("promo7Price") || "1199", 12),
      promo14Price: sanitizeText(formData.get("promo14Price") || "1999", 12),
      promo30Price: sanitizeText(formData.get("promo30Price") || "2799", 12),
      promo_RU_7: sanitizeText(formData.get("promo_RU_7") || "2500", 12),
      promo_RU_14: sanitizeText(formData.get("promo_RU_14") || "4200", 12),
      promo_RU_30: sanitizeText(formData.get("promo_RU_30") || "5900", 12),
      promo_GE_7: sanitizeText(formData.get("promo_GE_7") || "29", 12),
      promo_GE_14: sanitizeText(formData.get("promo_GE_14") || "49", 12),
      promo_GE_30: sanitizeText(formData.get("promo_GE_30") || "69", 12),
      promo_AE_7: sanitizeText(formData.get("promo_AE_7") || "99", 12),
      promo_AE_14: sanitizeText(formData.get("promo_AE_14") || "179", 12),
      promo_AE_30: sanitizeText(formData.get("promo_AE_30") || "249", 12),
      maintenanceMode: formData.get("maintenanceMode") === "on",
      allowNewSells: formData.get("allowNewSells") === "on",
      allowNewBuys: formData.get("allowNewBuys") === "on",
      emailNotifications: formData.get("emailNotifications") === "on",
    }

    cookieStore.set("darak_site_settings", JSON.stringify(settingsPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: isProd,
      httpOnly: false,
    })

    try {
      await supabase.from("site_settings").upsert({
        id: "global",
        ...settingsPayload,
        updated_at: new Date().toISOString(),
      })
    } catch {}

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "غير مصرح بتغيير إعدادات الموقع.",
    }
  }
}

// ==========================================
// 8. تفعيل أو إلغاء تمييز العقار (Admin + Moderator)
// ==========================================
export async function managePropertyPromotionAction(
  propertyId: string,
  action: "activate" | "cancel",
  days: number = 14
) {
  try {
    const { supabase } = await requireAdminAuth(["admin", "moderator"])

    const { data: prop } = await supabase
      .from("sell_requests")
      .select("id, user_id, project_name, name")
      .eq("id", propertyId)
      .maybeSingle()

    if (action === "activate") {
      const untilDate = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000
      ).toISOString()

      const { error } = await supabase
        .from("sell_requests")
        .update({
          is_featured: true,
          featured_days: days,
          featured_status: "active",
          featured_until: untilDate,
        })
        .eq("id", propertyId)

      if (error) {
        return {
          success: false,
          error: "تأكد من تشغيل سكريبت إضافة أعمدة التمييز في Supabase.",
        }
      }

      if (prop?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: prop.user_id,
            title: `⭐ تم تفعيل تمييز وحدتك لمدة ${days} يوم!`,
            message: `وحدتك في (${prop.project_name || "مشروعك"}) تظهر الآن بشارة النجمة الذهبية في أول صفحة الفرص المتاحة.`,
            type: "status_update",
            link: `/account?view=seller&unitId=${prop.id}`,
            is_read: false,
          })
        } catch {}
      }
    } else {
      const { error } = await supabase
        .from("sell_requests")
        .update({
          is_featured: false,
          featured_status: "none",
          featured_until: null,
        })
        .eq("id", propertyId)

      if (error) {
        return { success: false, error: "تعذر إلغاء التمييز." }
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح.",
    }
  }
}

// ==========================================
// 9. مسح جميع الوحدات المحذوفة دفعة واحدة (Admin فقط)
// ==========================================
export async function purgeSellerDeletedPropertiesAction() {
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { error } = await supabase
      .from("sell_requests")
      .delete()
      .eq("status", "deleted_by_seller")

    if (error) {
      return { success: false, error: "تعذر مسح الوحدات المحذوفة." }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "غير مصرح.",
    }
  }
}
