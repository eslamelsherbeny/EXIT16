'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Eye, EyeOff, Check } from 'lucide-react'
import { AuthCard, AuthLayout } from '@/components/auth-layout'
import { registerAction } from '@/app/actions/auth-actions'

const COUNTRIES = [
  { iso: 'EG', code: '+20', flag: '🇪🇬', name: 'مصر', nameEn: 'Egypt' },
  { iso: 'AE', code: '+971', flag: '🇦🇪', name: 'الإمارات', nameEn: 'UAE' },
  { iso: 'RU', code: '+7', flag: '🇷🇺', name: 'روسيا', nameEn: 'Russia' },
  { iso: 'GE', code: '+995', flag: '🇬🇪', name: 'جورجيا', nameEn: 'Georgia' },
  { iso: 'SA', code: '+966', flag: '🇸🇦', name: 'السعودية', nameEn: 'Saudi Arabia' },
  { iso: 'KW', code: '+965', flag: '🇰🇼', name: 'الكويت', nameEn: 'Kuwait' },
  { iso: 'QA', code: '+974', flag: '🇶🇦', name: 'قطر', nameEn: 'Qatar' },
  { iso: 'BH', code: '+973', flag: '🇧🇭', name: 'البحرين', nameEn: 'Bahrain' },
  { iso: 'OM', code: '+968', flag: '🇴🇲', name: 'عمان', nameEn: 'Oman' },
  { iso: 'JO', code: '+962', flag: '🇯🇴', name: 'الأردن', nameEn: 'Jordan' },
]

function normalizeArText(s: string) {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
}

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  // حالة الدولة المختارة للحساب + البحث بالحرف الأول
  const [userCountryIso, setUserCountryIso] = useState('EG')
  const [countrySearch, setCountrySearch] = useState('')
  const [countrySelectOpen, setCountrySelectOpen] = useState(false)
  const countrySelectRef = useRef<HTMLDivElement>(null)

  // حالات خاصة برقم الموبايل والقائمة المنسدلة
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
    COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0]
  const selectedUserCountry =
    COUNTRIES.find((c) => c.iso === userCountryIso) || COUNTRIES[0]

  const filteredCountries = COUNTRIES.filter((c) => {
    if (!countrySearch.trim()) return true
    const q = normalizeArText(countrySearch)
    return (
      normalizeArText(c.name).includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q)
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
      setError('كلمتا السر غير متطابقتين.')
      return
    }

    startTransition(async () => {
      const result = await registerAction(formData)
      if (result.success) {
        window.location.href = '/'
      } else {
        setError(result.error || 'حدث خطأ أثناء إنشاء الحساب.')
      }
    })
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">إنشاء حساب</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            ابدأ رحلتك العقارية مع دارك
          </p>
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
              الاسم
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-right text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#105C50]"
              placeholder="الاسم الكامل"
            />
          </div>

          {/* حقل اختيار الدولة بالبحث السريع بالحرف الأول */}
          <div ref={countrySelectRef} className="relative">
            <label className="mb-2 block text-xs font-bold text-foreground">
              الدولة / محل الإقامة
            </label>
            <div className="relative">
              <input
                type="text"
                dir="rtl"
                value={
                  countrySelectOpen
                    ? countrySearch
                    : `${selectedUserCountry.flag}  ${selectedUserCountry.name}`
                }
                placeholder="اكتب أول حرف من اسم الدولة (مصر، الإمارات، روسيا، جورجيا)..."
                onFocus={() => {
                  setCountrySelectOpen(true)
                  setCountrySearch('')
                }}
                onChange={(e) => {
                  setCountrySearch(e.target.value)
                  setCountrySelectOpen(true)
                }}
                className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background pr-4 pl-10 text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#105C50]"
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
                    لا توجد دولة مطابقة للبحث
                  </p>
                ) : (
                  filteredCountries.map((c) => (
                    <button
                      key={c.iso}
                      type="button"
                      onClick={() => {
                        setUserCountryIso(c.iso)
                        setCountryCode(c.code)
                        setCountrySelectOpen(false)
                        setCountrySearch('')
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right transition-colors hover:bg-gray-50 ${
                        userCountryIso === c.iso ? 'bg-[#eff8f6]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{c.flag}</span>
                        <span
                          className={`text-sm ${
                            userCountryIso === c.iso
                              ? 'font-bold text-[#105C50]'
                              : 'font-medium text-gray-700'
                          }`}
                        >
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400">
                          {c.iso}
                        </span>
                        {userCountryIso === c.iso && (
                          <Check className="size-3.5 text-[#105C50]" />
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
              رقم الموبايل
            </label>
            <div className="relative flex gap-2">
              <input
                id="phone"
                type="tel"
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#105C50]"
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
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#105C50]"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{selectedPhoneCountry.flag}</span>
                    <span dir="ltr">{selectedPhoneCountry.code}</span>
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-[54px] right-0 z-50 max-h-56 w-[220px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code + c.name}
                        type="button"
                        onClick={() => {
                          setCountryCode(c.code)
                          setIsDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right transition-colors hover:bg-gray-50 ${
                          countryCode === c.code ? 'bg-[#eff8f6]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{c.flag}</span>
                          <span
                            className={`text-sm ${
                              countryCode === c.code
                                ? 'font-bold text-[#105C50]'
                                : 'font-medium text-gray-700'
                            }`}
                          >
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            dir="ltr"
                            className="text-[11px] font-bold text-gray-500"
                          >
                            {c.code}
                          </span>
                          {countryCode === c.code && (
                            <Check className="size-3.5 text-[#105C50]" />
                          )}
                        </div>
                      </button>
                    ))}
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
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#105C50]"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-bold text-foreground"
            >
              كلمة السر
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#105C50] ${
                  showPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder="8 أحرف على الأقل"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
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
              تأكيد كلمة السر
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                dir="ltr"
                required
                minLength={8}
                className={`h-12 w-full rounded-xl border border-input bg-background pr-11 pl-4 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#105C50] ${
                  showConfirmPassword ? 'tracking-normal' : 'tracking-widest'
                }`}
                placeholder="أعد إدخال كلمة السر"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={
                  showConfirmPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'
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
            className="mt-2 h-12 rounded-xl bg-[#105C50] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0c483f] disabled:opacity-50"
          >
            {pending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
          بإنشاء حساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية.
        </p>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          عندك حساب؟{' '}
          <Link
            href="/login"
            className="font-bold text-[#105C50] hover:underline"
          >
            ادخل من هنا
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}