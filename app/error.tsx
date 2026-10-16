'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[v0] app error boundary', error) }, [error])
  return <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-muted/35 px-6 py-20 text-center"><div className="max-w-md rounded-2xl bg-card p-8 shadow-lg"><p className="text-sm font-bold text-primary">حصلت مشكلة</p><h1 className="mt-3 text-3xl font-black">خلينا نجرب تاني</h1><p className="mt-3 text-muted-foreground">حصل خطأ مؤقت. اضغط الزر وحاول مرة أخرى.</p><Button type="button" className="mt-7 rounded-xl" onClick={() => reset()}>حاول مرة أخرى</Button></div></main>
}
