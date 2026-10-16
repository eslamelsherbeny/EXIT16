import Link from 'next/link'
import { Building2, Globe, Menu, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ar from '@/dictionaries/ar.json'

type Dictionary = typeof ar

const links = [
  { href: '/sell', key: 'sell' as const },
  { href: '/opportunities', key: 'opportunities' as const },
  { href: '/story', key: 'story' as const },
  { href: '/story#how-it-works', key: 'howItWorks' as const },
  { href: '/contact', key: 'contact' as const },
  { href: '/investors', key: 'investors' as const },
]

export function Logo() {
  return <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 /></span><span>دارك<span className="text-primary">.</span></span></Link>
}

export function Navbar({ dictionary = ar }: { dictionary?: Dictionary }) {
  return <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 shadow-sm backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8"><Logo /><nav className="hidden items-center gap-7 lg:flex" aria-label="التنقل الرئيسي">{links.map((link) => <Link key={link.href} href={link.href} className="text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-primary">{dictionary.navbar[link.key]}</Link>)}</nav><div className="flex items-center gap-2"><label className="sr-only" htmlFor="language">{dictionary.navbar.languageLabel}</label><select id="language" defaultValue="ar" className="hidden h-10 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm outline-none transition-all duration-200 hover:border-primary sm:block"><option value="en">English</option><option value="ar">العربية</option><option value="ru">Русский</option><option value="ka">ქართული</option></select><Button variant="ghost" className="hidden font-semibold sm:inline-flex" render={<Link href="/dashboard" />}>{dictionary.navbar.login}</Button><Button variant="outline" className="hidden rounded-full px-5 font-semibold shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary/5 sm:inline-flex" render={<Link href="/buy" />}>{dictionary.navbar.buy}</Button><Button className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md" render={<Link href="/sell" />}>{dictionary.navbar.sellCta}</Button><Sheet><SheetTrigger render={<Button variant="outline" size="icon" className="rounded-full shadow-sm lg:hidden" aria-label={dictionary.navbar.menuLabel}><Menu /></Button>} /><SheetContent side="right" className="w-[min(85vw,22rem)] bg-card"><SheetHeader><SheetTitle className="text-right text-xl font-bold">{dictionary.navbar.menuTitle}</SheetTitle></SheetHeader><nav className="flex flex-col gap-2 px-4" aria-label="التنقل على الهاتف">{links.map((link) => <SheetClose key={link.href} render={<Link href={link.href} className="rounded-xl px-4 py-3 text-right font-semibold transition-colors hover:bg-muted hover:text-primary" />}>{dictionary.navbar[link.key]}</SheetClose>)}<label className="mt-4 border-t border-border px-4 pt-4 text-sm font-semibold" htmlFor="mobile-language">{dictionary.navbar.languageLabel}</label><select id="mobile-language" defaultValue="ar" className="mx-4 h-11 rounded-xl border border-border bg-background px-3 text-sm"><option value="en">English</option><option value="ar">العربية</option><option value="ru">Русский</option><option value="ka">ქართული</option></select></nav></SheetContent></Sheet></div></div></header>
}

export function Footer({ dictionary = ar }: { dictionary?: Dictionary }) {
  return <footer className="border-t border-white/10 bg-[#0a1128] text-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8"><div><Logo /><p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">{dictionary.footer.description}</p><div className="mt-5 flex gap-2"><span className="rounded-full bg-muted p-2 text-muted-foreground"><Globe /></span><span className="rounded-full bg-muted p-2 text-muted-foreground"><MessageCircle /></span><span className="rounded-full bg-muted p-2 text-muted-foreground"><Star /></span></div></div><div><h3 className="font-semibold">{dictionary.footer.discover}</h3><div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground"><Link href="/opportunities">{dictionary.navbar.opportunities}</Link><Link href="/buy">{dictionary.footer.buyHow}</Link><Link href="/sell">{dictionary.footer.sellHow}</Link></div></div><div><h3 className="font-semibold">{dictionary.footer.about}</h3><div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground"><Link href="#">{dictionary.footer.aboutUs}</Link><Link href="#">{dictionary.footer.faq}</Link><Link href="/contact">{dictionary.navbar.contact}</Link></div></div><div><h3 className="font-semibold">{dictionary.footer.needHelp}</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">{dictionary.footer.helpText}</p><Button variant="outline" className="mt-4 rounded-full" render={<Link href="/contact" />}>{dictionary.footer.contactCta}</Button></div></div><div className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>{dictionary.footer.copyright}</span><span>{dictionary.footer.privacy}</span></div></div></footer>
}

export function PublicLayout({ children }: { children: React.ReactNode }) { return <><Navbar dictionary={ar} /><main>{children}</main><Footer dictionary={ar} /></> }
