import Link from "next/link"
import { Bell, Building2, FileText, LayoutDashboard, Settings, Users, WalletCards } from "lucide-react"

const links = [
  { href: "/admin", label: "لوحة القيادة", icon: LayoutDashboard },
  { href: "/admin/properties", label: "إدارة العقارات", icon: Building2 },
  { href: "/admin/leads", label: "طلبات الشراء", icon: FileText },
  { href: "/admin/users", label: "المستخدمين", icon: Users },
  { href: "/admin/investors", label: "المستثمرين", icon: WalletCards },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-muted/30 text-foreground">
      <aside className="fixed inset-y-0 right-0 z-20 hidden w-72 border-l bg-[#0a1128] text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7 text-xl font-bold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white"><Building2 /></span>
          <span>دارك<span className="text-teal-300">.</span></span>
          <span className="mr-auto rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70">ADMIN</span>
        </div>
        <nav aria-label="التنقل الإداري" className="flex flex-col gap-1 p-5">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"><Icon aria-hidden="true" />{label}</Link>)}
        </nav>
        <div className="absolute bottom-6 right-5 left-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-white/70">مساحتك الإدارية<br /><strong className="text-white">إدارة أذكى، نتائج أفضل</strong></div>
      </aside>
      <div className="lg:mr-72">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b bg-background px-5 py-4 lg:px-8">
          <div><p className="text-sm text-muted-foreground">لوحة الإدارة</p><h1 className="mt-1 text-xl font-bold">صباح الخير، أحمد</h1></div>
          <div className="flex items-center gap-3">
            <label className="hidden items-center rounded-xl border bg-muted/40 px-3 md:flex"><span className="sr-only">بحث</span><input className="h-10 w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="ابحث في لوحة التحكم" /></label>
            <button className="relative rounded-full border p-2.5 text-muted-foreground" aria-label="الإشعارات"><Bell /><span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" /></button>
            <div className="flex items-center gap-3 border-r pr-3"><div className="flex size-10 items-center justify-center rounded-full bg-teal-600 font-bold text-white">أ</div><div className="hidden sm:block"><div className="text-sm font-semibold">أحمد محمد</div><div className="text-xs text-muted-foreground">مدير النظام</div></div></div>
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export { links }


/** Mobile navigation is kept compact and visible without changing the public site's shell. */
export function AdminMobileNav() { return <nav className="mb-5 grid grid-cols-3 gap-2 lg:hidden">{links.slice(0, 6).map(({ href, label }) => <Link key={href} href={href} className="rounded-lg border bg-background px-2 py-2 text-center text-xs">{label}</Link>)}</nav> }


// no-op
