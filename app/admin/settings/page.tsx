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
    siteName:
      runtimeSettings?.siteName || dict.admin?.shell?.brand || "Aqar Exit",
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
    vipPlusDailyGel:
      (runtimeSettings as Record<string, any>)?.vipPlusDailyGel || "5",
    superVipDailyGel:
      (runtimeSettings as Record<string, any>)?.superVipDailyGel || "10",
    bankIbanGe:
      (runtimeSettings as Record<string, any>)?.bankIbanGe ||
      "GE00TB0000000000000000",
    bankNameGe:
      (runtimeSettings as Record<string, any>)?.bankNameGe ||
      "TBC Bank / Bank of Georgia",
    promo7Price: runtimeSettings?.promo7Price || "20",
    promo14Price: runtimeSettings?.promo14Price || "50",
    promo30Price: runtimeSettings?.promo30Price || "100",
    promo_GE_7: runtimeSettings?.promo_GE_7 || "20",
    promo_GE_14: runtimeSettings?.promo_GE_14 || "50",
    promo_GE_30: runtimeSettings?.promo_GE_30 || "100",
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
