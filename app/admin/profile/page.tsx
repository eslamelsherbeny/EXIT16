import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import SettingsClient from "../settings/settings-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminProfilePage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("user_session")?.value

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  let adminProfile = {
    id: sessionId || "",
    name: "مدير النظام",
    email: "admin@darak.com",
    phone: "+201018595959",
    role: "admin",
    personalSellCount: 0,
    personalBuyCount: 0,
  }

  if (sessionId) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle()

    if (user) {
      adminProfile = {
        id: user.id,
        name: user.name || "مدير النظام",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "admin",
        personalSellCount: 0,
        personalBuyCount: 0,
      }
    }
  }

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

  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const hasEmail = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)

  return (
    <div className="mx-auto max-w-4xl">
      <SettingsClient
        initialTab="profile"
        adminProfile={adminProfile}
        initialSettings={savedSettings}
        hasSupabase={hasSupabase}
        hasEmail={hasEmail}
      />
    </div>
  )
}