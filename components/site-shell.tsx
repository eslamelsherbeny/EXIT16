import Link from 'next/link'
import { Building2, Globe, Menu, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const links = [
  { href: '/sell', label: 'بيع وحدتك' },
  { href: '/opportunities', label: 'الفرص المتاحة' },
  { href: '#story', label: 'قصتنا' },
  { href: '#how-it-works', label: 'إزاي بنشتغل' },
  { href: '#contact', label: 'كلمنا' },
  { href: '#investors', label: 'للمستثمرين' },
]

export function Logo() {
  return <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 /></span><span>دارك<span className="text-primary">.</span></span></Link>
}

export function Navbar() {
  return <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"><Logo /><nav className="hidden items-center gap-8 lg:flex" aria-label="التنقل الرئيسي">{links.map((link) => <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">{link.label}</Link>)}</nav><div className="flex items-center gap-2"><label className="sr-only" htmlFor="language">اختار اللغة</label><select id="language" defaultValue="ar" className="hidden h-9 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground outline-none sm:block"><option value="en">English</option><option value="ar">العربية</option><option value="ru">Русский</option><option value="ka">ქართული</option></select><Button variant="ghost" className="hidden sm:inline-flex" render={<Link href="/dashboard" />}>دخول</Button><Button variant="outline" className="hidden rounded-full px-5 sm:inline-flex" render={<Link href="/buy" />}>عايز تشتري</Button><Button className="hidden rounded-full bg-primary px-5 text-primary-foreground sm:inline-flex" render={<Link href="/sell" />}>عايز تبيع</Button><Button variant="outline" size="icon" className="rounded-full lg:hidden" aria-label="فتح القائمة"><Menu /></Button></div></div></header>
}

export function Footer() {
  return <footer className="border-t border-border bg-card"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8"><div><Logo /><p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">نساعدك تأخذ قرارات عقارية أذكى، من أول خطوة حتى تملك وحدتك.</p><div className="mt-5 flex gap-2"><span className="rounded-full bg-muted p-2 text-muted-foreground"><Globe /></span><span className="rounded-full bg-muted p-2 text-muted-foreground"><MessageCircle /></span><span className="rounded-full bg-muted p-2 text-muted-foreground"><Star /></span></div></div><div><h3 className="font-semibold">اكتشف دارك</h3><div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground"><Link href="/opportunities">الفرص المتاحة</Link><Link href="/buy">كيف تشتري؟</Link><Link href="/sell">كيف تبيع؟</Link></div></div><div><h3 className="font-semibold">عن المنصة</h3><div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground"><Link href="#">من نحن</Link><Link href="#">الأسئلة الشائعة</Link><Link href="#">تواصل معنا</Link></div></div><div><h3 className="font-semibold">هل تحتاج مساعدة؟</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">فريقنا جاهز يرد عليك ويساعدك في كل خطوة.</p><Button variant="outline" className="mt-4 rounded-full" render={<Link href="#" />}>تواصل معنا</Button></div></div><div className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2025 دارك. جميع الحقوق محفوظة.</span><span>خصوصيتك وأمانك أولويتنا</span></div></div></footer>
}

export function PublicLayout({ children }: { children: React.ReactNode }) { return <><Navbar /><main>{children}</main><Footer /></> }
