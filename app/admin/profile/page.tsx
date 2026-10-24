import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { extractUserIdFromCookie } from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"
import ProfileClient from "./profile-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateUserId = extractUserIdFromCookie(rawSession)
  const { dict } = await getServerI18n()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )

  let adminProfile = {
    id: candidateUserId || "",
    name: dict.admin?.shell?.roles?.ADMIN || "Admin",
    email: "info@aqarexit.com",
    phone: "+995500000000",
    role: "admin",
    is_verified: true,
    personalSellCount: 0,
    personalBuyCount: 0,
  }

  if (candidateUserId) {
    const [{ data: user }, { count: sellCount }, { count: buyCount }] =
      await Promise.all([
        supabase
          .from("users")
          .select("*")
          .eq("id", candidateUserId)
          .maybeSingle(),
        supabase
          .from("sell_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", candidateUserId),
        supabase
          .from("buy_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", candidateUserId),
      ])

    if (user) {
      adminProfile = {
        id: user.id,
        name: user.name || dict.admin?.shell?.roles?.ADMIN || "Admin",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "admin",
        is_verified: user.is_verified !== false,
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

/* ============================================================================
   ARCHIVED OLD EGYPT DEFAULT ADMIN PROFILE (COMMENTED FOR FUTURE REFERENCE)
   ============================================================================
   // let adminProfile = {
   //   id: sessionId || "",
   //   name: "مدير النظام",
   //   email: "admin@darak.com",
   //   phone: "+201018595959",
   //   role: "admin",
   //   personalSellCount: 0,
   //   personalBuyCount: 0,
   // }
============================================================================ */
