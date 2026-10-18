import { cookies } from "next/headers"
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

  // قراءة إعدادات الموقع المحفوظة
  let savedSettings = {
    siteName: "دارك للعقارات",
    whatsappNumber: "+201018595959",
    supportEmail: process.env.EMAIL_USER || "support@darak.com",
    buyerCommission: "1.25",
    maintenanceMode: false,
    allowNewSells: true,
    allowNewBuys: true,
    emailNotifications: true,
  }

  try {
    const cookieVal = cookieStore.get("darak_site_settings")?.value
    if (cookieVal) {
      savedSettings = { ...savedSettings, ...JSON.parse(cookieVal) }
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