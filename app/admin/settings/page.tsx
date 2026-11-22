import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import SettingsClient from "./settings-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const initialTab = resolvedParams.tab === "system" ? "system" : "general"

  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) {
    redirect("/login?next=/admin/settings")
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  const { data: currentStaff } = await supabase
    .from("users")
    .select("id, role, status, password_hash")
    .eq("id", candidateId)
    .maybeSingle()

  if (
    !currentStaff ||
    currentStaff.status === "suspended" ||
    !parseAndVerifySessionCookie(rawSession, currentStaff.password_hash).valid
  ) {
    redirect("/login?next=/admin/settings")
  }

  const role = String(currentStaff.role || "user").trim().toLowerCase()
  if (role !== "admin" && role !== "owner") {
    redirect("/admin/leads")
  }

  const { dict, siteSettings: runtimeSettings } = await getServerI18n()

  let savedSettings = {
    siteName:
      runtimeSettings?.siteName || dict.admin?.shell?.brand || "DualDealz",
    whatsappNumber:
      runtimeSettings?.whatsappNumber || dict.footer?.phone || "+201018595959",
    supportEmail:
      runtimeSettings?.supportEmail ||
      process.env.EMAIL_USER ||
      dict.footer?.email ||
      "info@dualdealz.com",
    buyerCommission: runtimeSettings?.buyerCommission || "1.25",
    developerPenaltyMin:
      (runtimeSettings as Record<string, any>)?.developerPenaltyMin || "10",
    developerPenaltyMax:
      (runtimeSettings as Record<string, any>)?.developerPenaltyMax || "15",
    vipPlusDailyGel:
      (runtimeSettings as Record<string, any>)?.vipPlusDailyGel || "5",
    superVipDailyGel:
      (runtimeSettings as Record<string, any>)?.superVipDailyGel || "10",
    fbPixelId: (runtimeSettings as Record<string, any>)?.fbPixelId || "",
    gaMeasurementId:
      (runtimeSettings as Record<string, any>)?.gaMeasurementId || "",
    gtmId: (runtimeSettings as Record<string, any>)?.gtmId || "",
    maintenanceMode: Boolean(runtimeSettings?.maintenanceMode),
    allowNewSells: runtimeSettings?.allowNewSells ?? true,
    allowNewBuys: runtimeSettings?.allowNewBuys ?? true,
    emailNotifications: runtimeSettings?.emailNotifications ?? true,
  }

  try {
    const { data: dbSettings } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle()

    if (dbSettings) {
      savedSettings = { ...savedSettings, ...dbSettings }
    }
  } catch {}

  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const hasEmail = Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  )

  const flittMerchantId = process.env.FLITT_MERCHANT_ID?.trim() || ""
  const flittSecretKey = process.env.FLITT_SECRET_KEY?.trim() || ""
  const flittMode: "live" | "sandbox" | "missing" =
    !flittMerchantId || !flittSecretKey
      ? "missing"
      : flittMerchantId === "1549901" || flittSecretKey === "test"
        ? "sandbox"
        : "live"

  return (
    <div className="mx-auto max-w-5xl">
      <SettingsClient
        initialTab={initialTab}
        initialSettings={savedSettings}
        hasSupabase={hasSupabase}
        hasEmail={hasEmail}
        flittMode={flittMode}
      />
    </div>
  )
}