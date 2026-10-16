"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Globe, Menu, MessageCircle, Star, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" className={`text-[25px] font-light tracking-[-0.08em] ${inverse ? 'text-white' : 'text-[#101a35]'}`} aria-label="Aqar Exit"><span className="font-serif">Aqar</span><span className={`ml-1 font-serif italic ${inverse ? 'text-teal-300' : 'text-teal-600'}`}>Exit</span></Link>
}

export function Navbar({ dictionary = ar }: { dictionary?: Dictionary }) {
  const [language, setLanguage] = useState('العربية')
  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm"><div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between gap-6 px-5 lg:px-8"><Logo /><nav className="hidden flex-1 items-center justify-center gap-6 lg:flex" aria-label="التنقل الرئيسي">{links.map((link) => <Link key={link.href} href={link.href} className="text-[14px] font-medium text-slate-600 transition-colors hover:text-teal-700">{dictionary.navbar[link.key]}</Link>)}</nav><div className="flex items-center gap-2"><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" className="hidden rounded-xl border-slate-300 px-3 text-sm font-medium text-slate-700 sm:inline-flex" />}><Globe data-icon="inline-start" /> {language}</DropdownMenuTrigger><DropdownMenuContent align="end" className="min-w-36"><DropdownMenuItem onClick={() => setLanguage('العربية')}><Check data-icon="inline-start" /> العربية</DropdownMenuItem><DropdownMenuItem onClick={() => setLanguage('English')}>English</DropdownMenuItem><DropdownMenuItem onClick={() => setLanguage('Русский')}>Русский</DropdownMenuItem><DropdownMenuItem onClick={() => setLanguage('ქართული')}>ქართული</DropdownMenuItem></DropdownMenuContent></DropdownMenu><ThemeToggle className="hidden sm:inline-flex" /><Button variant="ghost" className="hidden px-3 text-sm font-semibold text-slate-700 sm:inline-flex" render={<Link href="/login" />}>{dictionary.navbar.login}</Button><Button variant="outline" className="hidden rounded-xl border-slate-300 px-5 text-sm font-semibold text-slate-800 hover:border-teal-600 hover:bg-teal-50 sm:inline-flex" render={<Link href="/buy" />}>{dictionary.navbar.buy}</Button><Button className="rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800" render={<Link href="/sell" />}>{dictionary.navbar.sellCta}</Button><Sheet><SheetTrigger render={<Button variant="outline" size="icon" className="rounded-xl lg:hidden" aria-label="فتح القائمة"><Menu /></Button>} /><SheetContent side="right" className="w-[min(85vw,22rem)] bg-white"><SheetHeader><SheetTitle className="text-right"><Logo /></SheetTitle></SheetHeader><nav className="mt-8 flex flex-col gap-2">{links.map((link) => <SheetClose key={link.href} render={<Link href={link.href} className="rounded-lg px-3 py-3 text-right text-sm font-semibold text-slate-700 hover:bg-teal-50" />}>{dictionary.navbar[link.key]}</SheetClose>)}</nav></SheetContent></Sheet></div></div></header>
}

const footerGroups = [
  { title: 'المنصة', items: ['الفرص المتاحة', 'حاسبة الخروج', 'المفضلة', 'للبائعين', 'للمشترين'] },
  { title: 'الشركة', items: ['قصتنا', 'التقارير والمؤشرات', 'إزاي بنشتغل', 'كلمنا', 'للمستثمرين'] },
]

export function Footer() {
  return <footer className="bg-[#0a1128] text-white"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.25fr_1fr_1fr_1.4fr] lg:px-8"><div className="lg:order-4"><Logo inverse /><p className="mt-5 max-w-xs text-sm leading-8 text-slate-400">بنساعدك تاخد قرارات عقارية أذكى، من أول خطوة حتى تملك وحدتك.</p><div className="mt-4 flex flex-col gap-1 text-sm text-slate-300"><a href="tel:19999">19999</a><a href="mailto:hello@aqarexit.com">hello@aqarexit.com</a></div><div className="mt-6 flex gap-2"><span className="rounded-lg border border-white/15 px-3 py-2 text-xs">Google Play ↓</span><span className="rounded-lg border border-white/15 px-3 py-2 text-xs">App Store ↓</span></div></div>{footerGroups.map((group) => <div key={group.title}><h3 className="font-bold text-white">{group.title}</h3><div className="mt-5 flex flex-col gap-4 text-sm text-slate-400">{group.items.map((item) => <Link key={item} href="#" className="transition-colors hover:text-teal-300">{item}</Link>)}</div></div>)}<div className="lg:order-1"><h3 className="font-bold text-white">هل تحتاج مساعدة؟</h3><p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">فريقنا جاهز يرد عليك ويساعدك في كل خطوة.</p><Button className="mt-5 rounded-lg bg-teal-700 text-white hover:bg-teal-600" render={<Link href="/contact" />}>كلمنا</Button><div className="mt-7 flex gap-2 text-slate-300"><span className="rounded-full bg-white/10 p-2"><Globe /></span><span className="rounded-full bg-white/10 p-2"><MessageCircle /></span><span className="rounded-full bg-white/10 p-2"><Star /></span></div></div></div><div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-xs text-slate-500 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><span>مصر · السعودية · قريباً</span><span>باستخدامك للمنصة أنت توافق على الشروط وسياسة الخصوصية.</span></div><div className="flex justify-between gap-3"><span>© 2025 عقار إكزت. جميع الحقوق محفوظة.</span><span>الشروط والأحكام · الخصوصية</span></div></div></div></footer>
}

export function PublicLayout({ children }: { children: React.ReactNode }) { return <><Navbar dictionary={ar} /><main>{children}</main><Footer /></> }
