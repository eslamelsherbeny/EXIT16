import Link from 'next/link'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#0a1128] px-6 py-20 text-center text-white"><div className="flex max-w-xl flex-col items-center"><span className="mb-7 flex size-20 items-center justify-center rounded-3xl bg-teal-500/15 text-teal-300"><Home aria-hidden="true" className="size-10" /></span><p className="text-8xl font-black tracking-tight text-teal-400">404</p><h1 className="mt-5 text-2xl font-bold sm:text-3xl">عفواً، العقار أو الصفحة اللي بتدور عليها مش موجودة</h1><p className="mt-4 text-slate-300">ممكن تكون الصفحة اتمسحت أو الرابط اتكتب غلط.</p><Button asChild className="mt-8 rounded-xl bg-teal-600 hover:bg-teal-500"><Link href="/opportunities">الفرص المتاحة</Link></Button></div></main>
}
