'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type CountryPhoneOption = {
  iso: string
  code: string
  nameAr: string
  nameEn: string
  nameRu: string
  nameKa: string
  flag: string
}

export const COUNTRY_PHONE_OPTIONS: CountryPhoneOption[] = [
  { iso: 'GE', code: '995', nameAr: 'جورجيا', nameEn: 'Georgia', nameRu: 'Грузия', nameKa: 'საქართველო', flag: '🇬🇪' },
  { iso: 'EG', code: '20', nameAr: 'مصر', nameEn: 'Egypt', nameRu: 'Египет', nameKa: 'ეგვიპტე', flag: '🇪🇬' },
  { iso: 'SA', code: '966', nameAr: 'السعودية', nameEn: 'Saudi Arabia', nameRu: 'Саудовская Аравия', nameKa: 'საუდის არაბეთი', flag: '🇸🇦' },
  { iso: 'AE', code: '971', nameAr: 'الإمارات', nameEn: 'UAE', nameRu: 'ОАЭ', nameKa: 'არაბთა გაერთიანებული საამიროები', flag: '🇦🇪' },
  { iso: 'KW', code: '965', nameAr: 'الكويت', nameEn: 'Kuwait', nameRu: 'Кувейт', nameKa: 'ქუვეითი', flag: '🇰🇼' },
  { iso: 'QA', code: '974', nameAr: 'قطر', nameEn: 'Qatar', nameRu: 'Катар', nameKa: 'ყატარი', flag: '🇶🇦' },
  { iso: 'BH', code: '973', nameAr: 'البحرين', nameEn: 'Bahrain', nameRu: 'Бахрейн', nameKa: 'ბაჰრეინი', flag: '🇧🇭' },
  { iso: 'OM', code: '968', nameAr: 'سلطنة عمان', nameEn: 'Oman', nameRu: 'Оман', nameKa: 'ომანი', flag: '🇴🇲' },
  { iso: 'JO', code: '962', nameAr: 'الأردن', nameEn: 'Jordan', nameRu: 'Иордания', nameKa: 'იორდანია', flag: '🇯🇴' },
  { iso: 'LB', code: '961', nameAr: 'لبنان', nameEn: 'Lebanon', nameRu: 'Ливан', nameKa: 'ლიბანი', flag: '🇱🇧' },
  { iso: 'IQ', code: '964', nameAr: 'العراق', nameEn: 'Iraq', nameRu: 'Ирак', nameKa: 'ერაყი', flag: '🇮🇶' },
  { iso: 'PS', code: '970', nameAr: 'فلسطين', nameEn: 'Palestine', nameRu: 'Палестина', nameKa: 'პალესტინა', flag: '🇵🇸' },
  { iso: 'IL', code: '972', nameAr: 'عرب 48 / +972', nameEn: '+972', nameRu: '+972', nameKa: '+972', flag: '🌍' },
  { iso: 'SY', code: '963', nameAr: 'سوريا', nameEn: 'Syria', nameRu: 'Сирия', nameKa: 'სირია', flag: '🇸🇾' },
  { iso: 'YE', code: '967', nameAr: 'اليمن', nameEn: 'Yemen', nameRu: 'Йемен', nameKa: 'იემენი', flag: '🇾🇪' },
  { iso: 'LY', code: '218', nameAr: 'ليبيا', nameEn: 'Libya', nameRu: 'Ливия', nameKa: 'ლიბია', flag: '🇱🇾' },
  { iso: 'TN', code: '216', nameAr: 'تونس', nameEn: 'Tunisia', nameRu: 'Тунис', nameKa: 'ტუნისი', flag: '🇹🇳' },
  { iso: 'DZ', code: '213', nameAr: 'الجزائر', nameEn: 'Algeria', nameRu: 'Алжир', nameKa: 'ალჟირი', flag: '🇩🇿' },
  { iso: 'MA', code: '212', nameAr: 'المغرب', nameEn: 'Morocco', nameRu: 'Марокко', nameKa: 'მაროკო', flag: '🇲🇦' },
  { iso: 'SD', code: '249', nameAr: 'السودان', nameEn: 'Sudan', nameRu: 'Судан', nameKa: 'სუდანი', flag: '🇸🇩' },
  { iso: 'TR', code: '90', nameAr: 'تركيا', nameEn: 'Turkey', nameRu: 'Турция', nameKa: 'თურქეთი', flag: '🇹🇷' },
  { iso: 'RU', code: '7', nameAr: 'روسيا / كازاخستان', nameEn: 'Russia / Kazakhstan', nameRu: 'Россия / Казахстан', nameKa: 'რუსეთი / ყაზახეთი', flag: '🇷🇺' },
  { iso: 'UA', code: '380', nameAr: 'أوكرانيا', nameEn: 'Ukraine', nameRu: 'Украина', nameKa: 'უკრაინა', flag: '🇺🇦' },
  { iso: 'BY', code: '375', nameAr: 'بيلاروسيا', nameEn: 'Belarus', nameRu: 'Беларусь', nameKa: 'ბელარუსი', flag: '🇧🇾' },
  { iso: 'AZ', code: '994', nameAr: 'أذربيجان', nameEn: 'Azerbaijan', nameRu: 'Азербайджан', nameKa: 'აზერბაიჯანი', flag: '🇦🇿' },
  { iso: 'AM', code: '374', nameAr: 'أرمينيا', nameEn: 'Armenia', nameRu: 'Армения', nameKa: 'სომხეთი', flag: '🇦🇲' },
  { iso: 'DE', code: '49', nameAr: 'ألمانيا', nameEn: 'Germany', nameRu: 'Германия', nameKa: 'გერმანია', flag: '🇩🇪' },
  { iso: 'GB', code: '44', nameAr: 'بريطانيا', nameEn: 'United Kingdom', nameRu: 'Великобритания', nameKa: 'დიდი ბრიტანეთი', flag: '🇬🇧' },
  { iso: 'FR', code: '33', nameAr: 'فرنسا', nameEn: 'France', nameRu: 'Франция', nameKa: 'საფრანგეთი', flag: '🇫🇷' },
  { iso: 'IT', code: '39', nameAr: 'إيطاليا', nameEn: 'Italy', nameRu: 'Италия', nameKa: 'იტალია', flag: '🇮🇹' },
  { iso: 'ES', code: '34', nameAr: 'إسبانيا', nameEn: 'Spain', nameRu: 'Испания', nameKa: 'ესპანეთი', flag: '🇪🇸' },
  { iso: 'NL', code: '31', nameAr: 'هولندا', nameEn: 'Netherlands', nameRu: 'Нидерланды', nameKa: 'ნიდერლანდები', flag: '🇳🇱' },
  { iso: 'PL', code: '48', nameAr: 'بولندا', nameEn: 'Poland', nameRu: 'Польша', nameKa: 'პოლონეთი', flag: '🇵🇱' },
  { iso: 'US', code: '1', nameAr: 'أمريكا / كندا', nameEn: 'USA / Canada', nameRu: 'США / Канада', nameKa: 'აშშ / კანადა', flag: '🇺🇸' },
]

export function CountrySelector({
  value,
  onChange,
  heightClass = 'h-12',
}: {
  value: string
  onChange: (code: string, iso?: string) => void
  heightClass?: string
}) {
  const { locale, dir } = useTranslation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cleanCode = String(value || '995').replace(/^\+/, '')

  const selectedCountry = useMemo(() => {
    return (
      COUNTRY_PHONE_OPTIONS.find((c) => c.code === cleanCode) ||
      COUNTRY_PHONE_OPTIONS[0]
    )
  }, [cleanCode])

  const getLocalizedName = (item: CountryPhoneOption) => {
    if (locale === 'ar') return item.nameAr
    if (locale === 'ru') return item.nameRu
    if (locale === 'ka') return item.nameKa
    return item.nameEn
  }

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRY_PHONE_OPTIONS
    return COUNTRY_PHONE_OPTIONS.filter(
      (c) =>
        c.code.includes(q.replace(/^\+/, '')) ||
        c.iso.toLowerCase().includes(q) ||
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameRu.toLowerCase().includes(q) ||
        c.nameKa.toLowerCase().includes(q)
    )
  }, [query])

  const searchPlaceholder =
    locale === 'ar'
      ? 'ابحث باسم الدولة أو الكود (+995)...'
      : locale === 'ru'
        ? 'Поиск страны или кода (+995)...'
        : locale === 'ka'
          ? 'ქვეყნის ან კოდის ძიება (+995)...'
          : 'Search country or code (+995)...'

  const modalTitle =
    locale === 'ar'
      ? 'اختر كود الدولة'
      : locale === 'ru'
        ? 'Выберите код страны'
        : locale === 'ka'
          ? 'აირჩიეთ ქვეყნის კოდი'
          : 'Select Country Code'

  return (
    <div className="relative shrink-0" dir="ltr">
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setQuery('')
        }}
        className={`inline-flex ${heightClass} min-w-[104px] items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#007a5a] focus:border-[#007a5a] focus:outline-none`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="font-mono text-xs font-black tracking-tight">
            +{selectedCountry.code}
          </span>
        </span>
        <ChevronDown
          className={`size-3.5 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          >
            <div
              ref={modalRef}
              dir={dir}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
                <span className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {modalTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="border-b border-slate-100 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 end-3 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    autoFocus
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 ps-3.5 pe-9 text-xs font-semibold text-[#0a1122] placeholder:text-slate-400 focus:border-[#007a5a] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-[60vh] divide-y divide-slate-50 overflow-y-auto p-1.5 sm:max-h-72">
                {filteredCountries.map((item) => {
                  const isSelected = item.code === cleanCode
                  return (
                    <button
                      key={`${item.iso}-${item.code}`}
                      type="button"
                      onClick={() => {
                        onChange(item.code, item.iso)
                        setOpen(false)
                        setQuery('')
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-xs transition ${
                        isSelected
                          ? 'bg-[#eaf8f2] font-extrabold text-[#007a5a]'
                          : 'font-semibold text-[#0a1122] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="shrink-0 text-base leading-none">
                          {item.flag}
                        </span>
                        <span className="truncate">
                          {getLocalizedName(item)}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          dir="ltr"
                          className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700"
                        >
                          +{item.code}
                        </span>
                        {isSelected && (
                          <Check className="size-3.5 text-[#007a5a]" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}