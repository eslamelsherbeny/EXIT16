'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { getCurrentSellerProfileAction } from '@/actions/submit-forms'
import {
  updateEmailInfoAction,
  updatePersonalInfoAction,
} from '@/actions/account-actions'
import {
  COUNTRY_PHONE_OPTIONS,
  CountrySelector,
} from '@/components/shared/country-selector'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import { useTranslation } from '@/lib/i18n'

export default function AccountDetailsPage() {
  const { t: dict, dir } = useTranslation()
  const t = dict.accountPages.details
  const tCommon = dict.accountPages.common

  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('995')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const [personalMsg, setPersonalMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [emailMsg, setEmailMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [pendingPersonal, startPersonal] = useTransition()
  const [pendingEmail, startEmail] = useTransition()

  useEffect(() => {
    async function loadProfile() {
      const res = await getCurrentSellerProfileAction()
      if (res.isLoggedIn && res.user) {
        setName(res.user.name || '')
        setEmail(res.user.email || '')
        const rawP = toEnglishDigits(res.user.phone || '').trim()

        if (rawP.startsWith('+')) {
          const withoutPlus = rawP.slice(1)
          const matchedCountry = [...COUNTRY_PHONE_OPTIONS]
            .sort((a, b) => b.code.length - a.code.length)
            .find((c) => withoutPlus.startsWith(c.code))

          if (matchedCountry) {
            setCountryCode(matchedCountry.code)
            setPhone(withoutPlus.slice(matchedCountry.code.length))
          } else {
            setPhone(withoutPlus)
          }
        } else {
          setPhone(rawP)
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault()
    setPersonalMsg(null)
    startPersonal(async () => {
      const cleanDigits = toEnglishDigits(phone)
        .replace(/^0+/, '')
        .replace(/\D/g, '')
        .trim()
      const fullPhone = `+${countryCode.replace('+', '')}${cleanDigits}`
      const res = await updatePersonalInfoAction({ name, phone: fullPhone })
      if (res.success) {
        setPersonalMsg({
          type: 'success',
          text: res.message || t.personalSaveSuccess,
        })
      } else {
        setPersonalMsg({
          type: 'error',
          text: res.error || t.personalSaveError,
        })
      }
    })
  }

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg(null)
    startEmail(async () => {
      const res = await updateEmailInfoAction({ email })
      if (res.success) {
        setEmailMsg({
          type: 'success',
          text: res.message || t.emailSaveSuccess,
        })
      } else {
        setEmailMsg({
          type: 'error',
          text: res.error || t.emailSaveError,
        })
      }
    })
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] pb-24 text-[var(--brand-navy-text,#0a1128)]"
    >
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 md:py-16">
        <ScrollReveal>
          <header className="mb-8 text-start">
            <h1 className="text-[28px] font-black tracking-tight text-[var(--brand-navy-text,#0a1128)]">
              {t.title}
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">{t.subtitle}</p>
          </header>
        </ScrollReveal>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-xs font-bold text-gray-500">
            {t.loading}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ScrollReveal delay={60}>
              <section className="rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-2xs sm:p-8">
                <h2 className="text-start text-[16px] font-black text-[var(--brand-navy-text,#0a1128)]">
                  {t.personalCardTitle}
                </h2>
                <p className="mt-1 text-start text-[11.5px] text-slate-500">
                  {t.personalCardSub}
                </p>

                <form
                  onSubmit={handleSavePersonal}
                  className="mt-6 flex flex-col gap-5"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-start text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)]"
                    >
                      {t.nameLabel}
                    </label>
                    <input
                      id="name"
                      type="text"
                      dir={dir}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-start text-[13px] font-semibold text-[var(--brand-navy-text,#0a1128)] transition focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-start text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)]"
                    >
                      {t.phoneLabel}
                    </label>
                    <div dir="ltr" className="flex items-center gap-2">
                      <CountrySelector
                        value={countryCode}
                        onChange={(code) => setCountryCode(code)}
                        heightClass="h-11"
                      />
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) =>
                          setPhone(toEnglishDigits(e.target.value))
                        }
                        placeholder="5xx xx xx xx"
                        required
                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-left text-[13px] font-semibold text-[var(--brand-navy-text,#0a1128)] transition focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {personalMsg && (
                    <div
                      className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
                        personalMsg.type === 'success'
                          ? 'bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {personalMsg.type === 'success' && (
                        <CheckCircle2 className="size-4 shrink-0" />
                      )}
                      <span>{personalMsg.text}</span>
                    </div>
                  )}

                  <div className="mt-1 flex justify-start">
                    <button
                      type="submit"
                      disabled={pendingPersonal}
                      className="h-[42px] min-w-[90px] rounded-[10px] bg-[var(--brand-navy,#0a1122)] px-5 text-[13px] font-bold text-white shadow-2xs transition hover:bg-[var(--brand-navy-hover,#16223f)]"
                    >
                      {pendingPersonal ? t.savingBtn : t.saveBtn}
                    </button>
                  </div>
                </form>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <section className="rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-2xs sm:p-8">
                <h2 className="text-start text-[16px] font-black text-[var(--brand-navy-text,#0a1128)]">
                  {t.emailCardTitle}
                </h2>
                <p className="mt-1 text-start text-[11.5px] text-slate-500">
                  {t.emailCardSub}
                </p>

                <form
                  onSubmit={handleSaveEmail}
                  className="mt-6 flex flex-col gap-5"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-start text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)]"
                    >
                      {t.emailLabel}
                    </label>
                    <input
                      id="email"
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-left text-[13px] font-semibold text-[var(--brand-navy-text,#0a1128)] transition focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                    />
                  </div>

                  {emailMsg && (
                    <div
                      className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
                        emailMsg.type === 'success'
                          ? 'bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {emailMsg.type === 'success' && (
                        <CheckCircle2 className="size-4 shrink-0" />
                      )}
                      <span>{emailMsg.text}</span>
                    </div>
                  )}

                  <div className="mt-1 flex justify-start">
                    <button
                      type="submit"
                      disabled={pendingEmail}
                      className="flex h-[42px] items-center justify-center rounded-[10px] border border-gray-200 bg-white px-5 text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)] shadow-2xs transition hover:bg-gray-50"
                    >
                      {pendingEmail ? t.updatingBtn : t.changeEmailBtn}
                    </button>
                  </div>
                </form>
              </section>
            </ScrollReveal>
          </div>
        )}

        <div className="mt-8 flex justify-start">
          <Link
            href="/account"
            className="text-[13px] font-bold text-[var(--brand-primary,#007a5a)] transition hover:underline"
          >
            {tCommon.backShort}
          </Link>
        </div>
      </div>
    </main>
  )
}