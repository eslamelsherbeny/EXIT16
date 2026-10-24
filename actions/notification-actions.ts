"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { extractUserIdFromCookie } from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"
import arDict from "@/dictionaries/ar.json"
import enDict from "@/dictionaries/en.json"
import ruDict from "@/dictionaries/ru.json"
import kaDict from "@/dictionaries/ka.json"

const ALL_DICTS = [arDict, enDict, ruDict, kaDict] as Record<string, any>[]

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

export type NotificationType =
  | "property"
  | "lead"
  | "investor"
  | "property_match"
  | "new_offer"
  | "status_update"
  | "admin_alert"
  | "system"

/**
 * دالة ذكية لترجمة الإشعارات المخزنة في قاعدة البيانات بأي لغة
 * إلى لغة المستخدم/الأدمن الحالية لحظياً مع الحفاظ على الأسماء والأكواد بين الأقواس
 */
export async function localizeNotificationItem(
  item: { title?: string | null; message?: string | null; link?: string | null; type?: string | null },
  targetDict: Record<string, any>
): Promise<{ title: string; message: string }> {
  let title = String(item.title || "")
  let message = String(item.message || "")

  const tAdmin = targetDict?.serverActions?.admin || {}
  const tOffers = targetDict?.serverActions?.offers || {}
  const tAccount = targetDict?.serverActions?.account || {}
  const tSubmit = targetDict?.serverActions?.submitForms || {}

  // استخراج أي اسم مشروع أو كود بين قوسين مثل (Orbi City)
  const parenMatches = message.match(/\([^)]+\)/g) || []
  const lastParen = parenMatches[parenMatches.length - 1] || ""

  // 1. مطابقة وترجمة عناوين الإشعارات عبر جميع اللغات الأربع
  const titleKeys: Array<{
    getVal: (d: Record<string, any>) => string | undefined
    targetVal: string | undefined
  }> = [
    { getVal: (d) => d?.serverActions?.admin?.notifActiveTitle, targetVal: tAdmin.notifActiveTitle },
    { getVal: (d) => d?.serverActions?.admin?.notifOfferTitle, targetVal: tAdmin.notifOfferTitle },
    { getVal: (d) => d?.serverActions?.admin?.notifTransferTitle, targetVal: tAdmin.notifTransferTitle },
    { getVal: (d) => d?.serverActions?.admin?.notifSoldTitle, targetVal: tAdmin.notifSoldTitle },
    { getVal: (d) => d?.serverActions?.admin?.notifRejectedTitle, targetVal: tAdmin.notifRejectedTitle },
    { getVal: (d) => d?.serverActions?.admin?.leadUpdateNotifTitle, targetVal: tAdmin.leadUpdateNotifTitle },
    { getVal: (d) => d?.serverActions?.admin?.promoActivatedNotifTitle, targetVal: tAdmin.promoActivatedNotifTitle },
    { getVal: (d) => d?.serverActions?.admin?.matchBuyerTitle, targetVal: tAdmin.matchBuyerTitle },
    { getVal: (d) => d?.serverActions?.offers?.newOfferSellerTitle, targetVal: tOffers.newOfferSellerTitle },
    { getVal: (d) => d?.serverActions?.offers?.newOfferAdminTitle, targetVal: tOffers.newOfferAdminTitle },
    { getVal: (d) => d?.serverActions?.offers?.offerAcceptedBuyerTitle, targetVal: tOffers.offerAcceptedBuyerTitle },
    { getVal: (d) => d?.serverActions?.offers?.offerAcceptedAdminTitle, targetVal: tOffers.offerAcceptedAdminTitle },
    { getVal: (d) => d?.serverActions?.offers?.counterOfferBuyerTitle, targetVal: tOffers.counterOfferBuyerTitle },
    { getVal: (d) => d?.serverActions?.offers?.counterOfferAdminTitle, targetVal: tOffers.counterOfferAdminTitle },
    { getVal: (d) => d?.serverActions?.offers?.counterAcceptedSellerTitle, targetVal: tOffers.counterAcceptedSellerTitle },
    { getVal: (d) => d?.serverActions?.offers?.counterAcceptedAdminTitle, targetVal: tOffers.counterAcceptedAdminTitle },
    { getVal: (d) => d?.serverActions?.offers?.offerRejectedBuyerTitle, targetVal: tOffers.offerRejectedBuyerTitle },
    { getVal: (d) => d?.serverActions?.offers?.recBuyerTitle, targetVal: tOffers.recBuyerTitle },
    { getVal: (d) => d?.serverActions?.account?.adminEditNotifTitle, targetVal: tAccount.adminEditNotifTitle },
    { getVal: (d) => d?.serverActions?.account?.adminPauseNotifTitle, targetVal: tAccount.adminPauseNotifTitle },
    { getVal: (d) => d?.serverActions?.account?.adminResumeNotifTitle, targetVal: tAccount.adminResumeNotifTitle },
    { getVal: (d) => d?.serverActions?.account?.adminDeleteNotifTitle, targetVal: tAccount.adminDeleteNotifTitle },
    { getVal: (d) => d?.serverActions?.account?.adminDocsNotifTitle, targetVal: tAccount.adminDocsNotifTitle },
    { getVal: (d) => d?.serverActions?.account?.adminPromoNotifTitle, targetVal: tAccount.adminPromoNotifTitle },
    { getVal: (d) => d?.serverActions?.submitForms?.adminNewSellNotifTitle, targetVal: tSubmit.adminNewSellNotifTitle },
    { getVal: (d) => d?.serverActions?.submitForms?.adminEditSellNotifTitle, targetVal: tSubmit.adminEditSellNotifTitle },
    { getVal: (d) => d?.serverActions?.submitForms?.adminNewBuyNotifTitle, targetVal: tSubmit.adminNewBuyNotifTitle },
    { getVal: (d) => d?.serverActions?.submitForms?.adminUnitBookNotifTitle, targetVal: tSubmit.adminUnitBookNotifTitle },
  ]

  for (const entry of titleKeys) {
    if (!entry.targetVal) continue
    for (const d of ALL_DICTS) {
      const candidate = entry.getVal(d)
      if (candidate && title.includes(candidate)) {
        title = title.replace(candidate, entry.targetVal)
        break
      }
    }
  }

  // 2. مطابقة وترجمة رسائل الإشعارات
  const messageKeys: Array<{
    getVal: (d: Record<string, any>) => string | undefined
    targetVal: string | undefined
    keepParen?: boolean
  }> = [
    { getVal: (d) => d?.serverActions?.admin?.notifActiveMsg, targetVal: tAdmin.notifActiveMsg, keepParen: true },
    { getVal: (d) => d?.serverActions?.admin?.notifOfferMsg, targetVal: tAdmin.notifOfferMsg, keepParen: true },
    { getVal: (d) => d?.serverActions?.admin?.notifTransferMsg, targetVal: tAdmin.notifTransferMsg, keepParen: true },
    { getVal: (d) => d?.serverActions?.admin?.notifSoldMsg, targetVal: tAdmin.notifSoldMsg, keepParen: true },
    { getVal: (d) => d?.serverActions?.admin?.notifRejectedMsg, targetVal: tAdmin.notifRejectedMsg, keepParen: true },
    { getVal: (d) => d?.serverActions?.admin?.notifRejectedReasonPrefix, targetVal: tAdmin.notifRejectedReasonPrefix },
    { getVal: (d) => d?.serverActions?.admin?.promoActivatedNotifMsg, targetVal: tAdmin.promoActivatedNotifMsg, keepParen: true },
    { getVal: (d) => d?.serverActions?.admin?.leadContactedNotifMsg, targetVal: tAdmin.leadContactedNotifMsg },
    { getVal: (d) => d?.serverActions?.admin?.leadQualifiedNotifMsg, targetVal: tAdmin.leadQualifiedNotifMsg },
    { getVal: (d) => d?.serverActions?.admin?.leadClosedNotifMsg, targetVal: tAdmin.leadClosedNotifMsg },
    { getVal: (d) => d?.serverActions?.offers?.newOfferSellerMsg, targetVal: tOffers.newOfferSellerMsg },
    { getVal: (d) => d?.serverActions?.offers?.offerAcceptedBuyerMsg, targetVal: tOffers.offerAcceptedBuyerMsg },
    { getVal: (d) => d?.serverActions?.offers?.counterOfferBuyerMsg, targetVal: tOffers.counterOfferBuyerMsg },
    { getVal: (d) => d?.serverActions?.offers?.counterAcceptedSellerMsg, targetVal: tOffers.counterAcceptedSellerMsg },
    { getVal: (d) => d?.serverActions?.offers?.offerRejectedBuyerMsg, targetVal: tOffers.offerRejectedBuyerMsg },
    { getVal: (d) => d?.serverActions?.offers?.recBuyerMsgPrefix, targetVal: tOffers.recBuyerMsgPrefix },
    { getVal: (d) => d?.serverActions?.account?.adminEditNotifMsg, targetVal: tAccount.adminEditNotifMsg },
    { getVal: (d) => d?.serverActions?.account?.adminPauseNotifMsg, targetVal: tAccount.adminPauseNotifMsg },
    { getVal: (d) => d?.serverActions?.account?.adminResumeNotifMsg, targetVal: tAccount.adminResumeNotifMsg },
    { getVal: (d) => d?.serverActions?.account?.adminDeleteNotifMsg, targetVal: tAccount.adminDeleteNotifMsg },
    { getVal: (d) => d?.serverActions?.account?.adminDocsNotifMsg, targetVal: tAccount.adminDocsNotifMsg },
    { getVal: (d) => d?.serverActions?.account?.adminPromoNotifMsg, targetVal: tAccount.adminPromoNotifMsg },
  ]

  for (const entry of messageKeys) {
    if (!entry.targetVal) continue
    for (const d of ALL_DICTS) {
      const candidate = entry.getVal(d)
      if (candidate && message.includes(candidate)) {
        if (entry.keepParen && lastParen) {
          message = `${entry.targetVal} ${lastParen}`
        } else {
          message = message.replace(candidate, entry.targetVal)
        }
        break
      }
    }
  }

  return { title, message }
}

export async function getUserNotificationsAction(
  context: "client" | "admin" = "client"
) {
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get("user_session")?.value
    )

    if (!sessionId) {
      return { success: false, notifications: [], unreadCount: 0 }
    }

    const [{ dict }, supabase] = await Promise.all([
      getServerI18n(),
      getSupabase(),
    ])

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionId)
      .maybeSingle()

    const role = String(user?.role || "user")
      .replace(/[\r\n\s]+/g, "")
      .toLowerCase()
    const isAdmin =
      role === "admin" || role === "moderator" || role === "sales"

    let query = supabase
      .from("notifications")
      .select("*")
      .neq("title", "__GLOBAL_SITE_CONFIG__")
      .order("created_at", { ascending: false })
      .limit(25)

    if (context === "admin" && isAdmin) {
      query = query.is("user_id", null)
    } else {
      query = query.eq("user_id", sessionId)
    }

    const { data: notifications, error } = await query

    if (error) {
      return { success: false, notifications: [], unreadCount: 0 }
    }

    const rawList = (notifications || []).filter(
      (n) => n.title !== "__GLOBAL_SITE_CONFIG__"
    )

    // ترجمة كل إشعار لحظياً إلى لغة المستخدم الحالية
    const localizedList = await Promise.all(
      rawList.map(async (n) => {
        const localized = await localizeNotificationItem(n, dict)
        return {
          ...n,
          title: localized.title,
          message: localized.message,
        }
      })
    )

    const unreadCount = localizedList.filter((n) => !n.is_read).length

    return {
      success: true,
      notifications: localizedList,
      unreadCount,
    }
  } catch {
    return { success: false, notifications: [], unreadCount: 0 }
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    if (!notificationId) return { success: false }
    const supabase = await getSupabase()

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)

    revalidatePath("/", "layout")
    revalidatePath("/admin", "layout")
    revalidatePath("/account", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function markAllNotificationsAsReadAction(
  context: "client" | "admin" = "client"
) {
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get("user_session")?.value
    )
    if (!sessionId) return { success: false }

    const supabase = await getSupabase()

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionId)
      .maybeSingle()

    const role = String(user?.role || "user")
      .replace(/[\r\n\s]+/g, "")
      .toLowerCase()
    const isAdmin =
      role === "admin" || role === "moderator" || role === "sales"

    if (context === "admin" && isAdmin) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .is("user_id", null)
        .neq("title", "__GLOBAL_SITE_CONFIG__")
        .eq("is_read", false)
    } else {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", sessionId)
        .eq("is_read", false)
    }

    revalidatePath("/", "layout")
    revalidatePath("/admin", "layout")
    revalidatePath("/account", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    if (!notificationId) return { success: false }
    const supabase = await getSupabase()

    await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .neq("title", "__GLOBAL_SITE_CONFIG__")

    revalidatePath("/", "layout")
    revalidatePath("/admin", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function clearAllNotificationsAction(
  context: "client" | "admin" = "client"
) {
  try {
    const cookieStore = await cookies()
    const sessionId = extractUserIdFromCookie(
      cookieStore.get("user_session")?.value
    )
    if (!sessionId) return { success: false }

    const supabase = await getSupabase()

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionId)
      .maybeSingle()

    const role = String(user?.role || "user")
      .replace(/[\r\n\s]+/g, "")
      .toLowerCase()
    const isAdmin =
      role === "admin" || role === "moderator" || role === "sales"

    if (context === "admin" && isAdmin) {
      await supabase
        .from("notifications")
        .delete()
        .is("user_id", null)
        .neq("title", "__GLOBAL_SITE_CONFIG__")
    } else {
      await supabase.from("notifications").delete().eq("user_id", sessionId)
    }

    revalidatePath("/", "layout")
    revalidatePath("/admin", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function createNotification(payload: {
  userId?: string | null
  title: string
  message: string
  type: NotificationType
  link?: string
}) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.from("notifications").insert({
      user_id: payload.userId || null,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link || "/",
      is_read: false,
    })

    if (error) {
      console.error("Notification Creation Error:", error)
      return { success: false }
    }

    return { success: true }
  } catch (e) {
    console.error("Notification Exception:", e)
    return { success: false }
  }
}
