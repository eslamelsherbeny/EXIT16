import Link from 'next/link'
import { Home } from 'lucide-react'
import arDict from '@/dictionaries/ar.json'

const t = arDict.systemPages

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[var(--brand-navy,#0a1122)] px-6 py-20 text-center text-white"
    >
      <div className="flex max-w-xl flex-col items-center">
        <span className="mb-7 flex size-20 items-center justify-center rounded-3xl bg-teal-500/15 text-[var(--brand-accent,#2ee59d)]">
          <Home aria-hidden="true" className="size-10" />
        </span>
        <p className="text-8xl font-black tracking-tight text-[var(--brand-accent,#2ee59d)]">
          404
        </p>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">
          {t.notFoundTitle}
        </h1>
        <p className="mt-4 text-slate-300">{t.notFoundDesc}</p>
        <Link
          href="/opportunities"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-6 text-sm font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
        >
          {t.notFoundBtn}
        </Link>
      </div>
    </main>
  )
}
