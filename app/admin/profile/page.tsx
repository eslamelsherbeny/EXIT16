import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import ProfileClient from "./profile-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProfilePage() {
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
    const [{ data: user }, { count: sellCount }, { count: buyCount }] =
      await Promise.all([
        supabase.from("users").select("*").eq("id", sessionId).maybeSingle(),
        supabase
          .from("sell_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", sessionId),
        supabase
          .from("buy_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", sessionId),
      ])

    if (user) {
      adminProfile = {
        id: user.id,
        name: user.name || "مدير النظام",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "admin",
        personalSellCount: sellCount || 0,
        personalBuyCount: buyCount || 0,
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ProfileClient adminProfile={adminProfile} />
    </div>
  )
}