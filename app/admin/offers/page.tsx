import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import OffersRoomClient from "./offers-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminOffersPage() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) {
    redirect("/login?next=/admin/offers")
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
    redirect("/login?next=/admin/offers")
  }

  const role = String(currentStaff.role || "user").trim().toLowerCase()
  if (
    role !== "owner" &&
    role !== "admin" &&
    role !== "moderator" &&
    role !== "sales"
  ) {
    redirect("/")
  }

  const [{ data: leadsData }, { data: unitsData }] = await Promise.all([
    supabase
      .from("buy_requests")
      .select("*")
      .neq("status", "archived")
      .neq("status", "closed")
      .order("created_at", { ascending: false }),
    supabase
      .from("sell_requests")
      .select("*")
      .in("status", ["active", "approved", "published", "offer_received"])
      .order("created_at", { ascending: false }),
  ])

  return (
    <OffersRoomClient
      leads={leadsData || []}
      availableUnits={unitsData || []}
    />
  )
}