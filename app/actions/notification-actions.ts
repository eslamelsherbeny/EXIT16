"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { extractUserIdFromCookie } from '@/lib/session-security'
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

// 1. جلب الإشعارات بناءً على السياق (قبعة العميل أم قبعة الإدارة)
export async function getUserNotificationsAction(
  context: "client" | "admin" = "client"
) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("user_session")?.value

    if (!sessionId) {
      return { success: false, notifications: [], unreadCount: 0 }
    }

    const supabase = await getSupabase()

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionId)
      .maybeSingle()

    const role = String(user?.role || "user")
      .replace(/[\r\n\s]+/g, "")
      .toLowerCase()
    const isAdmin = role === "admin" || role === "moderator"

    let query = supabase
      .from("notifications")
      .select("*")
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

    const list = notifications || []
    const unreadCount = list.filter((n) => !n.is_read).length

    return {
      success: true,
      notifications: list,
      unreadCount,
    }
  } catch {
    return { success: false, notifications: [], unreadCount: 0 }
  }
}

// 2. تعليم إشعار واحد كمقروء عند الضغط عليه
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

// 3. تعليم جميع الإشعارات كمقروءة بضغطة واحدة
export async function markAllNotificationsAsReadAction(
  context: "client" | "admin" = "client"
) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("user_session")?.value
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
    const isAdmin = role === "admin" || role === "moderator"

    if (context === "admin" && isAdmin) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .is("user_id", null)
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

// 4. حذف إشعار واحد نهائياً من القائمة
export async function deleteNotificationAction(notificationId: string) {
  try {
    if (!notificationId) return { success: false }
    const supabase = await getSupabase()

    await supabase.from("notifications").delete().eq("id", notificationId)

    revalidatePath("/", "layout")
    revalidatePath("/admin", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

// 5. مسح كل الإشعارات نهائياً بحسب السياق (العميل أو الأدمن)
export async function clearAllNotificationsAction(
  context: "client" | "admin" = "client"
) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("user_session")?.value
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
    const isAdmin = role === "admin" || role === "moderator"

    if (context === "admin" && isAdmin) {
      await supabase.from("notifications").delete().is("user_id", null)
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

// 6. إنشاء إشعار جديد في قاعدة البيانات
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
