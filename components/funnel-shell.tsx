'use client'

import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserRound } from 'lucide-react'

type FunnelShellProps = {
  title: string
  benefits: string[]
  step: string
  totalSteps: number
  children: ReactNode
}

export function FunnelShell({ title, benefits, step, totalSteps, children }: FunnelShellProps) {
  return (
    <section dir="rtl" className="min-h-[calc(100vh-5rem)] bg-background px-3 py-8 sm:px-5 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-10">
          <header className="pt-2 lg:sticky lg:top-28 lg:pt-4">
            <Badge variant="secondary" className="mb-5 rounded-full bg-[#e5eee8] px-4 py-2 text-primary">منصة دارك العقارية</Badge>
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-[#193d32] md:text-5xl">{title}</h1>
            <ul className="mt-8 flex flex-col gap-4 text-sm font-medium text-muted-foreground">
              {benefits.map((benefit) => <li key={benefit} className="flex items-center gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><ShieldCheck /></span>{benefit}</li>)}
            </ul>
          </header>
          <Card className="overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="gap-6 border-b border-border/70 bg-[#fbfcfa] p-4 sm:p-6 md:p-8">
              <div className="flex items-start gap-3 rounded-xl border border-[#eadfbe] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#725d24]"><UserRound className="shrink-0" /> <span>بنتعامل مع {title.includes('اشتري') ? 'المشتري النهائي' : 'مالك الوحدة نفسه بس'}</span></div>
              <div className="flex flex-wrap items-center justify-between gap-3"><Badge className="rounded-full bg-primary px-4 py-2 text-primary-foreground">{step}</Badge><span className="text-sm text-muted-foreground">خطوات بسيطة وآمنة</span></div>
              <div className="flex gap-2" aria-label={`التقدم، ${step}`}>
                {Array.from({ length: totalSteps }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index === 0 ? 'bg-primary' : 'bg-[#dce5df]'}`} />)}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-8"><div className="animate-in fade-in duration-300">{children}</div></CardContent>
            <CardFooter className="flex-row-reverse justify-start gap-3 border-t border-border/70 bg-muted/30 p-4 sm:p-5 md:p-8"><Button type="button" onClick={() => toast.success('تم استلام طلبك بنجاح، هنتواصل معاك قريباً')} className="min-w-32 rounded-full bg-primary shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md">كمّل</Button><Button variant="outline" className="min-w-24 rounded-full bg-transparent shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary/5">ارجع</Button></CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-5"><h2 className="text-xl font-bold text-foreground">{title}</h2>{children}</section>
}

export function TurnstileBox() {
  return <div className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-[#fafafa] px-4 text-sm text-muted-foreground"><span className="flex size-6 items-center justify-center rounded border-2 border-[#c7d1ca] bg-white" />أنا لست روبوتًا<span className="mr-auto text-[10px] leading-4 text-muted-foreground">Cloudflare<br />Turnstile</span></div>
}
