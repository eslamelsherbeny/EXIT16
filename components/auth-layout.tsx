import { Navbar } from '@/components/site-shell'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f8]" dir="rtl">
      <Navbar />
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-12 sm:px-8">
        {children}
      </main>
    </div>
  )
}

export function AuthCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_14px_45px_rgba(20,20,24,0.06)] sm:p-9 ${className}`}>{children}</section>
}

export function TurnstileBox() {
  return (
    <div className="flex min-h-[66px] items-center gap-3 rounded-md border border-[#d9d9dc] bg-[#fafafa] px-4 text-sm text-muted-foreground" aria-label="Cloudflare Turnstile verification">
      <span className="flex size-7 items-center justify-center rounded border border-[#c9c9cc] bg-white text-xs text-[#555]">✓</span>
      <span>تحقق من أنك لست روبوتًا</span>
      <span className="mr-auto text-[10px] leading-3 text-[#8b8b91]">CLOUDFLARE<br />Turnstile</span>
    </div>
  )
}

export function AuthInput({ label, type = 'text', highlighted = false, placeholder }: { label: string; type?: string; highlighted?: boolean; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
      {label}
      <input type={type} placeholder={placeholder} className={`h-12 rounded-lg border border-border px-4 text-sm font-normal outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 ${highlighted ? 'bg-[#fff9e8]' : 'bg-white'}`} />
    </label>
  )
}
