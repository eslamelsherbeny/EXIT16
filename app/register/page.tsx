'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Eye, EyeOff, Check } from 'lucide-react'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { registerAction } from '@/app/actions/auth-actions'
import {
  ALL_RESIDENCE_COUNTRIES,
  normalizeArabicText,
} from '@/components/seller/seller-shared'
import arDict from '@/dictionaries/ar.json'

const t = arDict.authPages.register
const c = arDict.authPages.common

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  const [userCountryIso, setUserCountryIso] = useState('EG')
  const [countrySearch, setCountrySearch] = useState('')
  const [countrySelectOpen, setCountrySelectOpen] = useState(false)
  const countrySelectRef = useRef<HTMLDivElement>(null)

  const [countryCode, setCountryCode] = useState('+20')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
      if (
        countrySelectRef.current &&
        !countrySelectRef.current.contains(event.target as Node)
      ) {
        setCountrySelectOpen(false)
        setCountrySearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedPhoneCountry =
    ALL_RESIDENCE_COUNTRIES.find((item) => `+${item.phoneCode}` === countryCode) ||
    ALL_RESIDENCE_COUNTRIES[0]
  const selectedUserCountry =
    ALL_RESIDENCE_COUNTRIES.find((item) => item.code === userCountryIso) ||
    ALL_RESIDENCE_COUNTRIES[0]

  const filteredCountries = ALL_RESIDENCE_COUNTRIES.filter((item) => {
    if (!countrySearch.trim()) return true
    const q = normalizeArabicText(countrySearch)
    return (
      normalizeArabicText(item.nameAr).includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    )
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    const cleanPhone = phoneNumber.replace(/^0+/, '')
    formData.set('phone', `${countryCode}${cleanPhone}`)
    formData.set('country', userCountryIso)

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError(t.passwordsMismatchError)
      return
    }

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result.success) {
        window.location.href = '/'
      } else {
        setError(result.error || t.genericError)
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-navy,#0a1122)]">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              {t.nameLabel}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-right text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
              placeholder={t.namePlaceholder}
            />
          </div>

          <div ref={countrySelectRef} className="relative">
            <label className="mb-2 block text-xs font-bold text-foreground">
              {t.countryLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                dir="rtl"
                value={
                  countrySelectOpen
                    ? countrySearch
                    : `${selectedUserCountry.flag}  ${selectedUserCountry.nameAr}`
                }
                placeholder={t.countryPlaceholder}
                onFocus={() => {
                  setCountrySelectOpen(true)
                  setCountrySearch('')
                }}
                onChange={(e) => {
                  setCountrySearch(e.target.value)
                  setCountrySelectOpen(true)
                }}
                className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background pr-4 pl-10 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
              />
              <button
                type="button"
                onClick={() => {
                  setCountrySelectOpen(!countrySelectOpen)
                  setCountrySearch('')
                }}
                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            {countrySelectOpen && (
              <div className="absolute top-[76px] z-50 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                {filteredCountries.length === 0 ? (
                  <p className="py-3 text-center text-xs text-gray-400">
                    {c.noCountryMatch}
                  </p>
                ) : (
                  filteredCountries.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setUserCountryIso(item.code)
                        setCountryCode(`+${item.phoneCode}`)
                        setCountrySelectOpen(false)
                        setCountrySearch('')
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right transition-colors hover:bg-gray-50 ${
                        userCountryIso === item.code
                          ? 'bg-[var(--brand-primary-light,#eaf8f2)]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{item.flag}</span>
                        <span
                          className={`text-sm ${
                            userCountryIso === item.code
                              ? 'font-bold text-[var(--brand-primary,#007a5a)]'
                              : 'font-medium text-gray-700'
                          }`}
                        >
                          {item.nameAr}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400">
                          {item.code}
                        </span>
                        {userCountryIso === item.code && (
                          <Check className="size-3.5 text-[var(--brand-primary,#007a5a)]" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              {t.phoneLabel}
            </label>
            <div className="relative flex gap-2">
              <input
                id="phone"
                type="tel"
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
                placeholder="1xxxxxxxxx"
              />

              <div
                className="relative w-[110px] shrink-0"
                ref={dropdownRef}
                dir="ltr"
              >
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{selectedPhoneCountry.flag}</span>
                    <span dir="ltr">+{selectedPhoneCountry.phoneCode}</span>
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-[54px] right-0 z-50 max-h-56 w-[220px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    {ALL_RESIDENCE_COUNTRIES.map((item) => {
                      const codeStr = `+${item.phoneCode}`
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setCountryCode(codeStr)
                            setIsDropdownOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right transition-colors hover:bg-gray-50 ${
                            countryCode === codeStr
                              ? 'bg-[var(--brand-primary-light,#eaf8f2)]'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{item.flag}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {item.nameAr}
                            </span>
                          </div>
                          <span
                            dir="ltr"
                            className="text-[11px] font-bold text-gray-500"
                          >
                            {codeStr}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              {t.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)]"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                  showPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder={t.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? c.hidePassAria : c.showPassAria}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              {t.confirmPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
                  showConfirmPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder={t.confirmPasswordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={
                  showConfirmPassword ? c.hidePassAria : c.showPassAria
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--brand-primary-hover,#006248)] disabled:opacity-50"
          >
            {pending ? t.submittingBtn : t.submitBtn}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
          {t.termsNote}
        </p>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.haveAccountText}{' '}
          <Link
            href="/login"
            className="font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
          >
            {t.loginHereLink}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
