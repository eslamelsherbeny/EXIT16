"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

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

// 1. جلب الإشعارات للمستخدم الحالي (سواء كان أدمن أو بائع أو مشتري)
export async function getUserNotificationsAction() {
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

    if (isAdmin) {
      query = query.or(`user_id.eq.${sessionId},user_id.is.null`)
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

    revalidatePath("/admin", "layout")
    revalidatePath("/account", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

// 3. تعليم جميع الإشعارات كمقروءة بضغطة واحدة (تخفي النقطة الحمراء نهائياً)
export async function markAllNotificationsAsReadAction() {
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

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", sessionId)
      .eq("is_read", false)

    if (isAdmin) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .is("user_id", null)
        .eq("is_read", false)
    }

    revalidatePath("/admin", "layout")
    revalidatePath("/account", "layout")
    return { success: true }
  } catch {
    return { success: false }
  }
}

// 4. إنشاء إشعار جديد في قاعدة البيانات
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