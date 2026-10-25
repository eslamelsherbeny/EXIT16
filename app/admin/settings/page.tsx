import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
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
  const { dict, siteSettings: runtimeSettings } = await getServerI18n()

  let savedSettings = {
    siteName: runtimeSettings?.siteName || dict.admin?.shell?.brand || "Aqar Exit",
    whatsappNumber:
      runtimeSettings?.whatsappNumber || dict.footer?.phone || "+201018595959",
    supportEmail:
      runtimeSettings?.supportEmail ||
      process.env.EMAIL_USER ||
      dict.footer?.email ||
      "info@aqarexit.com",
    buyerCommission: runtimeSettings?.buyerCommission || "1.25",
    developerPenaltyMin:
      (runtimeSettings as Record<string, any>)?.developerPenaltyMin || "10",
    developerPenaltyMax:
      (runtimeSettings as Record<string, any>)?.developerPenaltyMax || "15",
    promo7Price: runtimeSettings?.promo7Price || "29",
    promo14Price: runtimeSettings?.promo14Price || "49",
    promo30Price: runtimeSettings?.promo30Price || "69",
    promo_RU_7: runtimeSettings?.promo_RU_7 || "2500",
    promo_RU_14: runtimeSettings?.promo_RU_14 || "4200",
    promo_RU_30: runtimeSettings?.promo_RU_30 || "5900",
    promo_GE_7: runtimeSettings?.promo_GE_7 || "29",
    promo_GE_14: runtimeSettings?.promo_GE_14 || "49",
    promo_GE_30: runtimeSettings?.promo_GE_30 || "69",
    promo_AE_7: runtimeSettings?.promo_AE_7 || "99",
    promo_AE_14: runtimeSettings?.promo_AE_14 || "179",
    promo_AE_30: runtimeSettings?.promo_AE_30 || "249",
    maintenanceMode: Boolean(runtimeSettings?.maintenanceMode),
    allowNewSells: runtimeSettings?.allowNewSells ?? true,
    allowNewBuys: runtimeSettings?.allowNewBuys ?? true,
    emailNotifications: runtimeSettings?.emailNotifications ?? true,
  }

  try {
    const cookieVal = cookieStore.get("darak_site_settings")?.value
    if (cookieVal) {
      savedSettings = { ...savedSettings, ...JSON.parse(cookieVal) }
    }
  } catch {}

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
      }
    )
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
  const hasEmail = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)

  return (
    <div className="mx-auto max-w-5xl">
      <SettingsClient
        initialTab={initialTab}
        initialSettings={savedSettings}
        hasSupabase={hasSupabase}
        hasEmail={hasEmail}
      />
    </div>
  )
}