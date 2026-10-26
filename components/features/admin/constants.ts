import {
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Star,
  Users,
} from "lucide-react"

export const adminLinks = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/properties", label: "طلبات البيع", icon: Building2 },
  { href: "/admin/promotions", label: "طلبات الترويج", icon: Star },
  { href: "/admin/leads", label: "طلبات الشراء", icon: FileText },
  { href: "/admin/users", label: "المستخدمين والصلاحيات", icon: Users },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
]