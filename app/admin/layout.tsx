import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import AdminShell from "./admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminName = "مدير النظام"
  let adminRole = "ADMIN"

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("user_session")?.value

    if (sessionId) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
        }
      )
      const { data: user } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", sessionId)
        .maybeSingle()

      if (user?.name) adminName = user.name
      if (user?.role === "moderator") adminRole = "MODERATOR"
    }
  } catch (error) {
    console.error("Supabase Error in AdminLayout:", error)
  }

  const firstLetter = adminName.trim().charAt(0) || "أ"

  return (
    <AdminShell
      adminName={adminName}
      adminRole={adminRole}
      firstLetter={firstLetter}
    >
      {children}
    </AdminShell>
  )
}