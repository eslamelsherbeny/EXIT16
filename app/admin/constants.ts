import {
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
} from "lucide-react"

export const adminLinks = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/properties", label: "طلبات البيع", icon: Building2 },
  { href: "/admin/leads", label: "طلبات الشراء", icon: FileText },
  { href: "/admin/users", label: "المستخدمين والصلاحيات", icon: Users },
  { href: "/admin/investors", label: "المستثمرين", icon: WalletCards },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
]
