import { Navbar } from '@/components/site-shell'
import arDict from '@/dictionaries/ar.json'

const t = arDict.authPages.common

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-surface,#f5f6f8)]" dir="rtl">
      <Navbar />
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-12 sm:px-8">
        {children}
      </main>
    </div>
  )
}

export function AuthCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_14px_45px_rgba(20,20,24,0.06)] sm:p-9 ${className}`}
    >
      {children}
    </section>
  )
}

export function TurnstileBox() {
  return (
    <div
      className="flex min-h-[60px] items-center gap-3 rounded-xl border border-[#d9d9dc] bg-[#fafafa] px-4 text-xs text-muted-foreground"
      aria-label="Cloudflare Turnstile"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        ✓
      </span>
      <span className="font-semibold">{t.turnstileText}</span>
      <span className="mr-auto text-left font-sans text-[10px] leading-3 text-[#8b8b91]">
        CLOUDFLARE
        <br />
        Turnstile
      </span>
    </div>
  )
}
