import {
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Star,
  Users,
} from "lucide-react"

export const adminLinks = [
  { href: "/admin", navKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/admin/properties", navKey: "properties" as const, icon: Building2 },
  { href: "/admin/promotions", navKey: "promotions" as const, icon: Star },
  { href: "/admin/leads", navKey: "leads" as const, icon: FileText },
  { href: "/admin/users", navKey: "users" as const, icon: Users },
  { href: "/admin/settings", navKey: "settings" as const, icon: Settings },
]