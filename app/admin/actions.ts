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
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"

export type StaffRoleCode = "admin" | "moderator" | "sales"

async function getAdminActionsDict() {
  const { dict, dir } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.admin || {}
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

function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== "string") return ""
  return val
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .slice(0, maxLen)
}

async function requireAdminAuth(
  allowedRoles: StaffRoleCode[] = ["admin", "moderator", "sales"]
) {
  const { t: msg } = await getAdminActionsDict()
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateUserId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !candidateUserId) {
    throw new Error(msg.unauthorizedLogin)
  }

  const supabase = await getSupabase()

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, status, password_hash")
    .eq("id", candidateUserId)
    .maybeSingle()

  if (!user) {
    throw new Error(msg.unauthorizedNotFound)
  }

  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    user.password_hash
  )
  if (!sessionCheck.valid) {
    cookieStore.delete("user_session")
    cookieStore.delete("session_hint")
    throw new Error(msg.sessionExpiredPassword)
  }

  const cleanStatus = String(user.status || "active").trim().toLowerCase()
  if (cleanStatus === "suspended") {
    throw new Error(msg.adminSuspended)
  }

  const cleanRole = String(user.role || "user")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase() as StaffRoleCode | "user"

  if (!allowedRoles.includes(cleanRole as StaffRoleCode)) {
    throw new Error(msg.insufficientRole)
  }

  return { supabase, adminUser: user, role: cleanRole as StaffRoleCode, msg }
}

async function sendAdminEmail({
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
      from: `"${senderName || "Aqar Exit Admin"}" <${user}>`,
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

export async function updatePropertyStatusAction(
  propertyId: string,
  status: string,
  reason?: string
) {
  const { t: msg, dir } = await getAdminActionsDict()
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
          error: msg.updatePropertyFailed,
        }
      }
    }

    const projectLabel = prop?.project_name || msg.defaultProjectWord

    if (prop?.user_id) {
      const sellerNotifMap: Record<
        string,
        { title: string; message: string; type: string }
      > = {
        active: {
          title: msg.notifActiveTitle,
          message: `${msg.notifActiveMsg} (${projectLabel})`,
          type: "status_update",
        },
        offer_received: {
          title: msg.notifOfferTitle,
          message: `${msg.notifOfferMsg} (${projectLabel})`,
          type: "new_offer",
        },
        transferring: {
          title: msg.notifTransferTitle,
          message: `${msg.notifTransferMsg} (${projectLabel})`,
          type: "status_update",
        },
        sold: {
          title: msg.notifSoldTitle,
          message: `${msg.notifSoldMsg} (${projectLabel})`,
          type: "status_update",
        },
        rejected: {
          title: msg.notifRejectedTitle,
          message: cleanReason
            ? `${msg.notifRejectedReasonPrefix}: ${cleanReason}`
            : `${msg.notifRejectedMsg} (${projectLabel})`,
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
              title: `${msg.matchBuyerTitle} ${unitArea} 🎯`,
              message: `(${projectLabel}) — ${cashFormatted}`,
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
            subject: msg.emailActiveSubject,
            body: `${msg.emailActiveBody} <strong>${projectLabel}</strong>.`,
          },
          offer_received: {
            subject: msg.emailOfferSubject,
            body: `${msg.emailOfferBody} <strong>${projectLabel}</strong>.`,
          },
          transferring: {
            subject: msg.emailTransferSubject,
            body: `${msg.emailTransferBody} <strong>${projectLabel}</strong>.`,
          },
          sold: {
            subject: msg.emailSoldSubject,
            body: `${msg.emailSoldBody} <strong>${projectLabel}</strong>.`,
          },
          rejected: {
            subject: msg.emailRejectedSubject,
            body: `${msg.emailRejectedBody} <strong>${projectLabel}</strong>.${cleanReason ? `<br/><strong>${msg.reasonWord}:</strong> ${cleanReason}` : ""}`,
          },
        }

      const emailObj = statusMessages[status]
      if (emailObj) {
        await sendAdminEmail({
          to: prop.email,
          senderName: msg.adminSenderName,
          subject: emailObj.subject,
          html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.7;">
                  <h2 style="color: #101A2B;">${msg.greetingWord} ${prop.name || msg.dearClient}</h2>
                  <p>${emailObj.body}</p>
                 </div>`,
        })
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deletePropertyAction(propertyId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { error } = await supabase
      .from("sell_requests")
      .delete()
      .eq("id", propertyId)
    if (error) return { success: false, error: msg.deletePropertyFailed }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateBuyerLeadStatusAction(
  leadId: string,
  status: string
) {
  const { t: msg } = await getAdminActionsDict()
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
        error: msg.updateLeadFailed,
      }
    }

    if (lead?.user_id) {
      const buyerStatusText: Record<string, string> = {
        contacted: msg.leadContactedNotifMsg,
        qualified: msg.leadQualifiedNotifMsg,
        closed: msg.leadClosedNotifMsg,
      }
      if (buyerStatusText[cleanStatus]) {
        try {
          await supabase.from("notifications").insert({
            user_id: lead.user_id,
            title: msg.leadUpdateNotifTitle,
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
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deleteBuyerLeadAction(leadId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { error } = await supabase
      .from("buy_requests")
      .delete()
      .eq("id", leadId)
    if (error) return { success: false, error: msg.deleteLeadFailed }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateInvestorStatusAction(
  investorId: string,
  status: string
) {
  const { t: msg } = await getAdminActionsDict()
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
        error: msg.updateInvestorFailed,
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deleteInvestorAction(investorId: string) {
  const { t: msg } = await getAdminActionsDict()
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
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateUserRoleAndStatusAction(
  userId: string,
  role: string,
  status: string
) {
  const { t: msg } = await getAdminActionsDict()
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
        error: msg.updateRoleFailed,
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function createAdminOrUserAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
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
        error: msg.fillAllUserFields,
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
        error: msg.emailOrPhoneTaken,
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deleteUserByAdminAction(userId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth(["admin"])
    if (userId === adminUser.id) {
      return { success: false, error: msg.cannotDeleteSelf }
    }

    await supabase.from("sell_requests").delete().eq("user_id", userId)
    await supabase.from("buy_requests").delete().eq("user_id", userId)
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) return { success: false, error: msg.deleteUserFailed }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateAdminProfileDataAction(formData: FormData) {
  const { t: msg, dir } = await getAdminActionsDict()
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
        error: msg.completeProfileFields,
      }
    }

    if (!verifyPassword(currentPassword, adminUser.password_hash)) {
      return {
        success: false,
        error: msg.wrongCurrentPassword,
      }
    }

    const stripped = rawPhone.replace(/^\+?20/, "").replace(/^0+/, "")
    const formattedPhone = `+20${stripped}`

    const updateData: Record<string, any> = {
      name,
      phone: formattedPhone,
    }

    let successMessage = msg.profileUpdatedSuccess

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
        senderName: msg.adminSenderName,
        subject: msg.confirmNewEmailSubject,
        html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #101A2B;">${msg.greetingWord} ${name}،</h2>
                <p>${msg.confirmNewEmailBody}</p>
                <div style="margin: 20px 0;">
                  <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                    ${msg.confirmNewEmailBtn}
                  </a>
                </div>
               </div>`,
      })

      successMessage = msg.profileUpdatedCheckEmail
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", adminUser.id)

    if (error) {
      return {
        success: false,
        error: msg.emailOrPhoneTaken,
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
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function changeAdminPasswordAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
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
        error: msg.enterCurrentAndNewPass,
      }
    }

    if (!verifyPassword(currentPassword, adminUser.password_hash)) {
      return { success: false, error: msg.wrongCurrentPassword }
    }

    const newHash = hashPassword(newPassword)
    const { error } = await supabase
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", adminUser.id)

    if (error) return { success: false, error: msg.changePassFailed }

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
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function saveSiteSettingsAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === "production"

    const settingsPayload = {
      siteName: sanitizeText(formData.get("siteName") || "Aqar Exit", 80),
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
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function managePropertyPromotionAction(
  propertyId: string,
  action: "activate" | "cancel",
  days: number = 14
) {
  const { t: msg } = await getAdminActionsDict()
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
          error: msg.promoColumnsMissing,
        }
      }

      if (prop?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: prop.user_id,
            title: `⭐ ${msg.promoActivatedNotifTitle} (${days})`,
            message: `${msg.promoActivatedNotifMsg} (${prop.project_name || msg.defaultProjectWord})`,
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
        return { success: false, error: msg.cancelPromoFailed }
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function purgeSellerDeletedPropertiesAction() {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { error } = await supabase
      .from("sell_requests")
      .delete()
      .eq("status", "deleted_by_seller")

    if (error) {
      return { success: false, error: msg.purgeDeletedFailed }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}