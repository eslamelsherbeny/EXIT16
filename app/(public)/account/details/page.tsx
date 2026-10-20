'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { getCurrentSellerProfileAction } from '@/app/actions/submit-forms'
import {
  updateEmailInfoAction,
  updatePersonalInfoAction,
} from '@/app/actions/account-actions'
import arDict from '@/dictionaries/ar.json'

const t = arDict.accountPages.details
const tCommon = arDict.accountPages.common

export default function AccountDetailsPage() {
  const [name, setName] = useState('')
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
        let rawP = res.user.phone || ''
        if (rawP.startsWith('+20')) rawP = '0' + rawP.substring(3)
        else if (rawP.startsWith('20')) rawP = '0' + rawP.substring(2)
        setPhone(rawP)
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault()
    setPersonalMsg(null)
    startPersonal(async () => {
      const res = await updatePersonalInfoAction({ name, phone })
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
      dir="rtl"
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] pb-24 text-[var(--brand-navy-text,#0a1128)]"
    >
      <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 md:py-16">
        <header className="mb-8 text-right">
          <h1 className="text-[28px] font-black tracking-tight text-[var(--brand-navy-text,#0a1128)]">
            {t.title}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">{t.subtitle}</p>
        </header>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-xs font-bold text-gray-500">
            {t.loading}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-2xs sm:p-8">
              <h2 className="text-right text-[16px] font-black text-[var(--brand-navy-text,#0a1128)]">
                {t.personalCardTitle}
              </h2>
              <p className="mt-1 text-right text-[11.5px] text-slate-500">
                {t.personalCardSub}
              </p>

              <form
                onSubmit={handleSavePersonal}
                className="mt-6 flex flex-col gap-5"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-right text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)]"
                  >
                    {t.nameLabel}
                  </label>
                  <input
                    id="name"
                    type="text"
                    dir="rtl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-[13px] font-semibold text-[var(--brand-navy-text,#0a1128)] transition focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-right text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)]"
                  >
                    {t.phoneLabel}
                  </label>
                  <div className="flex flex-row-reverse items-center gap-2">
                    <input
                      id="phone"
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-left text-[13px] font-semibold text-[var(--brand-navy-text,#0a1128)] transition focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                    />
                    <div className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 text-[13px] font-semibold text-[var(--brand-navy-text,#0a1128)]">
                      <ChevronDown className="size-3.5 text-gray-500" />
                      <span>{t.countryCodeLabel}</span>
                      <span className="text-sm">🇪🇬</span>
                    </div>
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

                <div className="mt-1 flex justify-end">
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

            <section className="rounded-[20px] border border-gray-200/80 bg-white p-6 shadow-2xs sm:p-8">
              <h2 className="text-right text-[16px] font-black text-[var(--brand-navy-text,#0a1128)]">
                {t.emailCardTitle}
              </h2>
              <p className="mt-1 text-right text-[11.5px] text-slate-500">
                {t.emailCardSub}
              </p>

              <form
                onSubmit={handleSaveEmail}
                className="mt-6 flex flex-col gap-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-right text-[13px] font-bold text-[var(--brand-navy-text,#0a1128)]"
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

                <div className="mt-1 flex justify-end">
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
