'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type PhoneCountryOption = {
  code: string
  phoneCode: string
  flag: string
  nameAr: string
  nameEn: string
  nameRu: string
  nameKa: string
}

export const WORLD_PHONE_COUNTRIES: PhoneCountryOption[] = [
  { code: 'GE', phoneCode: '995', flag: '🇬🇪', nameAr: 'جورجيا', nameEn: 'Georgia', nameRu: 'Грузия', nameKa: 'საქართველო' },
  { code: 'EG', phoneCode: '20', flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt', nameRu: 'Египет', nameKa: 'ეგვიპტე' },
  { code: 'SA', phoneCode: '966', flag: '🇸🇦', nameAr: 'السعودية', nameEn: 'Saudi Arabia', nameRu: 'Саудовская Аравия', nameKa: 'საუდის არაბეთი' },
  { code: 'AE', phoneCode: '971', flag: '🇦🇪', nameAr: 'الإمارات', nameEn: 'UAE', nameRu: 'ОАЭ', nameKa: 'არაბთა გაერთიანებული საამიროები' },
  { code: 'KW', phoneCode: '965', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait', nameRu: 'Кувейт', nameKa: 'ქუვეითი' },
  { code: 'QA', phoneCode: '974', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar', nameRu: 'Катар', nameKa: 'ყატარი' },
  { code: 'BH', phoneCode: '973', flag: '🇧🇭', nameAr: 'البحرين', nameEn: 'Bahrain', nameRu: 'Бахрейн', nameKa: 'ბაჰრეინი' },
  { code: 'OM', phoneCode: '968', flag: '🇴🇲', nameAr: 'سلطنة عمان', nameEn: 'Oman', nameRu: 'Оман', nameKa: 'ომანი' },
  { code: 'JO', phoneCode: '962', flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan', nameRu: 'Иордания', nameKa: 'იორდანია' },
  { code: 'LB', phoneCode: '961', flag: '🇱🇧', nameAr: 'لبنان', nameEn: 'Lebanon', nameRu: 'Ливан', nameKa: 'ლიბანი' },
  { code: 'IQ', phoneCode: '964', flag: '🇮🇶', nameAr: 'العراق', nameEn: 'Iraq', nameRu: 'Ирак', nameKa: 'ერაყი' },
  { code: 'PS', phoneCode: '970', flag: '🇵🇸', nameAr: 'فلسطين', nameEn: 'Palestine', nameRu: 'Палестина', nameKa: 'პალესტინა' },
  { code: 'SY', phoneCode: '963', flag: '🇸🇾', nameAr: 'سوريا', nameEn: 'Syria', nameRu: 'Сирия', nameKa: 'სირია' },
  { code: 'YE', phoneCode: '967', flag: '🇾🇪', nameAr: 'اليمن', nameEn: 'Yemen', nameRu: 'Йемен', nameKa: 'იემენი' },
  { code: 'LY', phoneCode: '218', flag: '🇱🇾', nameAr: 'ليبيا', nameEn: 'Libya', nameRu: 'Ливия', nameKa: 'ლიბია' },
  { code: 'TN', phoneCode: '216', flag: '🇹🇳', nameAr: 'تونس', nameEn: 'Tunisia', nameRu: 'Тунис', nameKa: 'ტუნისი' },
  { code: 'DZ', phoneCode: '213', flag: '🇩🇿', nameAr: 'الجزائر', nameEn: 'Algeria', nameRu: 'Алжир', nameKa: 'ალჟირი' },
  { code: 'MA', phoneCode: '212', flag: '🇲🇦', nameAr: 'المغرب', nameEn: 'Morocco', nameRu: 'Марокко', nameKa: 'მაროკო' },
  { code: 'SD', phoneCode: '249', flag: '🇸🇩', nameAr: 'السودان', nameEn: 'Sudan', nameRu: 'Судан', nameKa: 'სუდანი' },
  { code: 'RU', phoneCode: '7', flag: '🇷🇺', nameAr: 'روسيا', nameEn: 'Russia', nameRu: 'Россия', nameKa: 'რუსეთი' },
  { code: 'TR', phoneCode: '90', flag: '🇹🇷', nameAr: 'تركيا', nameEn: 'Turkey', nameRu: 'Турция', nameKa: 'თურქეთი' },
  { code: 'UA', phoneCode: '380', flag: '🇺🇦', nameAr: 'أوكرانيا', nameEn: 'Ukraine', nameRu: 'Украина', nameKa: 'უკრაინა' },
  { code: 'BY', phoneCode: '375', flag: '🇧🇾', nameAr: 'بيلاروسيا', nameEn: 'Belarus', nameRu: 'Беларусь', nameKa: 'ბელარუსი' },
  { code: 'KZ', phoneCode: '77', flag: '🇰🇿', nameAr: 'كازاخستان', nameEn: 'Kazakhstan', nameRu: 'Казахстан', nameKa: 'ყაზახეთი' },
  { code: 'AZ', phoneCode: '994', flag: '🇦🇿', nameAr: 'أذربيجان', nameEn: 'Azerbaijan', nameRu: 'Азербайджан', nameKa: 'აზერბაიჯანი' },
  { code: 'AM', phoneCode: '374', flag: '🇦🇲', nameAr: 'أرمينيا', nameEn: 'Armenia', nameRu: 'Армения', nameKa: 'სომხეთი' },
  { code: 'IL', phoneCode: '972', flag: '🇮🇱', nameAr: 'إسرائيل', nameEn: 'Israel', nameRu: 'Израиль', nameKa: 'ისრაელი' },
  { code: 'CY', phoneCode: '357', flag: '🇨🇾', nameAr: 'قبرص', nameEn: 'Cyprus', nameRu: 'Кипр', nameKa: 'კვიპროსი' },
  { code: 'GR', phoneCode: '30', flag: '🇬🇷', nameAr: 'اليونان', nameEn: 'Greece', nameRu: 'Греция', nameKa: 'საბერძნეთი' },
  { code: 'DE', phoneCode: '49', flag: '🇩🇪', nameAr: 'ألمانيا', nameEn: 'Germany', nameRu: 'Германия', nameKa: 'გერმანია' },
  { code: 'GB', phoneCode: '44', flag: '🇬🇧', nameAr: 'بريطانيا', nameEn: 'United Kingdom', nameRu: 'Великобритания', nameKa: 'დიდი ბრიტანეთი' },
  { code: 'FR', phoneCode: '33', flag: '🇫🇷', nameAr: 'فرنسا', nameEn: 'France', nameRu: 'Франция', nameKa: 'საფრანგეთი' },
  { code: 'IT', phoneCode: '39', flag: '🇮🇹', nameAr: 'إيطاليا', nameEn: 'Italy', nameRu: 'Италия', nameKa: 'იტალია' },
  { code: 'ES', phoneCode: '34', flag: '🇪🇸', nameAr: 'إسبانيا', nameEn: 'Spain', nameRu: 'Испания', nameKa: 'ესპანეთი' },
  { code: 'NL', phoneCode: '31', flag: '🇳🇱', nameAr: 'هولندا', nameEn: 'Netherlands', nameRu: 'Нидерланды', nameKa: 'ნიდერლანდები' },
  { code: 'BE', phoneCode: '32', flag: '🇧🇪', nameAr: 'بلجيكا', nameEn: 'Belgium', nameRu: 'Бельгия', nameKa: 'ბელგია' },
  { code: 'CH', phoneCode: '41', flag: '🇨🇭', nameAr: 'سويسرا', nameEn: 'Switzerland', nameRu: 'Швейцария', nameKa: 'შვეიცარია' },
  { code: 'AT', phoneCode: '43', flag: '🇦🇹', nameAr: 'النمسا', nameEn: 'Austria', nameRu: 'Австрия', nameKa: 'ავსტრია' },
  { code: 'SE', phoneCode: '46', flag: '🇸🇪', nameAr: 'السويد', nameEn: 'Sweden', nameRu: 'Швеция', nameKa: 'შვედეთი' },
  { code: 'NO', phoneCode: '47', flag: '🇳🇴', nameAr: 'النرويج', nameEn: 'Norway', nameRu: 'Норвегия', nameKa: 'ნორვეგია' },
  { code: 'PL', phoneCode: '48', flag: '🇵🇱', nameAr: 'بولندا', nameEn: 'Poland', nameRu: 'Польша', nameKa: 'პოლონეთი' },
  { code: 'US', phoneCode: '1', flag: '🇺🇸', nameAr: 'أمريكا / كندا', nameEn: 'USA / Canada', nameRu: 'США / Канада', nameKa: 'აშშ / კანადა' },
  { code: 'AU', phoneCode: '61', flag: '🇦🇺', nameAr: 'أستراليا', nameEn: 'Australia', nameRu: 'Австралия', nameKa: 'ავსტრალია' },
  { code: 'IN', phoneCode: '91', flag: '🇮🇳', nameAr: 'الهند', nameEn: 'India', nameRu: 'Индия', nameKa: 'ინდოეთი' },
  { code: 'CN', phoneCode: '86', flag: '🇨🇳', nameAr: 'الصين', nameEn: 'China', nameRu: 'Китай', nameKa: 'ჩინეთი' },
]

export function CountrySelector({
  value,
  onChange,
  heightClass = 'h-12',
}: {
  value: string
  onChange: (phoneCode: string, countryIso?: string) => void
  heightClass?: string
}) {
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const c = dict.authPages.common as Record<string, any>

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const cleanVal = String(value || '995').replace(/^\+/, '')
  const selected =
    WORLD_PHONE_COUNTRIES.find((item) => item.phoneCode === cleanVal) ??
    WORLD_PHONE_COUNTRIES[0]

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const getCountryName = (item: PhoneCountryOption) =>
    locale === 'ar'
      ? item.nameAr
      : locale === 'ru'
        ? item.nameRu
        : locale === 'ka'
          ? item.nameKa
          : item.nameEn

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return WORLD_PHONE_COUNTRIES
    return WORLD_PHONE_COUNTRIES.filter(
      (item) =>
        item.nameAr.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.nameRu.toLowerCase().includes(q) ||
        item.nameKa.toLowerCase().includes(q) ||
        item.phoneCode.includes(q.replace('+', '')) ||
        item.code.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="relative shrink-0" ref={containerRef} dir="ltr">
      {/* الزر الخارجي المدمج: يعرض العلم + الكود فقط ليكون بحجم متناسق */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((curr) => !curr)
          setSearch('')
        }}
        className={`flex ${heightClass} w-[108px] items-center justify-between gap-1.5 rounded-xl border border-input bg-background px-3 text-sm font-bold text-[var(--brand-navy,#0a1122)] transition hover:border-[var(--brand-primary,#007a5a)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] sm:w-[114px]`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-base leading-none">{selected.flag}</span>
          <span dir="ltr" className="font-mono text-xs font-extrabold sm:text-sm">
            +{selected.phoneCode}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* القائمة المنسدلة: تعرض البحث + العلم + اسم الدولة + الكود */}
      {open && (
        <div
          dir={dir}
          className={`absolute top-[calc(100%+6px)] z-50 w-[265px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
            isRtl ? 'right-0' : 'left-0'
          }`}
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 end-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={c.searchCountryPlaceholder || c.popularCountriesHeader}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 ps-2.5 pe-8 text-xs font-semibold text-[#0a1122] focus:border-[#007a5a] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5">
            {filteredCountries.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                {c.noCountryFound || '—'}
              </p>
            ) : (
              filteredCountries.map((item) => {
                const isSelected = item.phoneCode === selected.phoneCode
                return (
                  <button
                    type="button"
                    key={`${item.code}-${item.phoneCode}`}
                    onClick={() => {
                      onChange(item.phoneCode, item.code)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-start text-xs transition hover:bg-slate-50 ${
                      isSelected
                        ? 'bg-[var(--brand-primary-light,#eaf8f2)] font-extrabold text-[#007a5a]'
                        : 'font-medium text-[var(--brand-navy,#0a1122)]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{item.flag}</span>
                      <span className="truncate">{getCountryName(item)}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        dir="ltr"
                        className="font-mono text-[11px] font-bold text-slate-500"
                      >
                        +{item.phoneCode}
                      </span>
                      {isSelected && (
                        <Check className="size-3.5 text-[#007a5a]" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}