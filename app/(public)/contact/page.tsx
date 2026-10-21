'use client'

import { useState } from 'react'
import { Clock3, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CountrySelector } from '@/components/country-selector'
import { TurnstileBox } from '@/components/auth-layout'
import arDict from '@/dictionaries/ar.json'

const t = arDict.publicPages.contact
const required = <span className="text-red-500">*</span>

export default function ContactPage() {
  const [message, setMessage] = useState('')
  const [countryCode, setCountryCode] = useState('20')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-5 pt-14 pb-12 text-center lg:px-8 lg:pt-16">
        <p className="text-sm font-bold text-[var(--brand-primary,#007a5a)]">
          {t.eyebrow}
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[var(--brand-navy,#0a1122)] sm:text-4xl md:text-5xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-slate-500 sm:text-base">
          {t.subtitle}
        </p>
      </section>

      <section className="bg-[var(--brand-surface,#f5f6f8)] py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-12 lg:px-8">
          <aside className="order-1 lg:col-span-4">
            <h2 className="mb-4 text-center text-lg font-extrabold text-[var(--brand-navy,#0a1122)] lg:text-right">
              {t.channelsTitle}
            </h2>
            <div className="flex flex-col gap-4">
              <Info
                icon={<MessageCircle />}
                title={t.whatsappTitle}
                value={t.whatsappValue}
                detail={t.whatsappDetail}
              />
              <Info
                icon={<Mail />}
                title={t.emailTitle}
                value={t.emailValue}
              />
              <Info
                icon={<Clock3 />}
                title={t.hoursTitle}
                value={t.hoursValue}
                detail={t.hoursDetail}
              />
            </div>
            <p className="mt-5 rounded-2xl bg-white px-5 py-4 text-center text-xs leading-7 text-slate-500 shadow-sm sm:text-sm">
              {t.channelsFooterNote}
            </p>
          </aside>

          <div className="order-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-8">
            <h2 className="text-2xl font-extrabold text-[var(--brand-navy,#0a1122)]">
              {t.formTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{t.formSubtitle}</p>

            {sent ? (
              <div className="mt-8 rounded-2xl bg-[var(--brand-primary-light,#eaf8f2)] p-6 text-center text-sm font-bold text-[var(--brand-primary,#007a5a)]">
                {t.sentSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
                <Field
                  label={
                    <>
                      {t.nameLabel} {required}
                    </>
                  }
                >
                  <Input required placeholder={t.namePlaceholder} />
                </Field>

                <Field
                  label={
                    <>
                      {t.phoneLabel} {required}
                    </>
                  }
                >
                  <div dir="ltr" className="flex gap-2">
                    <CountrySelector
                      value={countryCode}
                      onChange={setCountryCode}
                    />
                    <Input
                      required
                      className="flex-1 text-left"
                      type="tel"
                      dir="ltr"
                      placeholder={t.phonePlaceholder}
                    />
                  </div>
                </Field>

                <Field label={t.emailLabel}>
                  <Input
                    type="email"
                    dir="ltr"
                    className="text-left"
                    placeholder="name@example.com"
                  />
                </Field>

                <Field
                  label={
                    <>
                      {t.subjectLabel} {required}
                    </>
                  }
                >
                  <div className="relative">
                    <select className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-[var(--brand-primary,#007a5a)]">
                      {t.subjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-3 left-4 size-4 text-slate-400" />
                  </div>
                </Field>

                <Field
                  label={
                    <>
                      {t.messageLabel} {required}
                    </>
                  }
                >
                  <Textarea
                    required
                    rows={5}
                    maxLength={4000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t.messagePlaceholder}
                  />
                  <div className="text-left text-xs text-slate-400">
                    {message.length} / 4000
                  </div>
                </Field>

                <TurnstileBox />

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[var(--brand-primary,#007a5a)] font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
                >
                  {t.sendBtn}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  {t.privacyNote}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--brand-navy,#0a1122)]">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Info({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode
  title: string
  value: string
  detail?: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <span className="order-2 flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]">
        {icon}
      </span>
      <div className="order-1 flex-1 text-right">
        <p className="text-xs text-slate-400">{title}</p>
        <p dir="ltr" className="mt-1 text-right font-bold text-[var(--brand-navy,#0a1122)]">
          {value}
        </p>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      </div>
    </div>
  )
}
