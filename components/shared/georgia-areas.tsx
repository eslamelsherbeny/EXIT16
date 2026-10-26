'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, MapPin, Search } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type GeorgiaAreaItem = {
  id: string
  cityCode: 'tbilisi' | 'batumi' | 'kutaisi' | 'resorts'
  ar: string
  en: string
  ru: string
  ka: string
}

export const GEORGIA_CITIES_AND_DISTRICTS: GeorgiaAreaItem[] = [
  { id: 'Tbilisi - Saburtalo', cityCode: 'tbilisi', ar: 'تبليسي — سابورتالو (Saburtalo)', en: 'Tbilisi — Saburtalo', ru: 'Тбилиси — Сабуртало', ka: 'თბილისი — საბურთალო' },
  { id: 'Tbilisi - Vake', cityCode: 'tbilisi', ar: 'تبليسي — فاكي (Vake)', en: 'Tbilisi — Vake', ru: 'Тбилиси — Ваке', ka: 'თბილისი — ვაკე' },
  { id: 'Tbilisi - Vera', cityCode: 'tbilisi', ar: 'تبليسي — فيرا (Vera)', en: 'Tbilisi — Vera', ru: 'Тбилиси — Вера', ka: 'თბილისი — ვერა' },
  { id: 'Tbilisi - Mtatsminda', cityCode: 'tbilisi', ar: 'تبليسي — متاتسميندا (Mtatsminda)', en: 'Tbilisi — Mtatsminda', ru: 'Тбилиси — Мтацминда', ka: 'თბილისი — მთაწმინდა' },
  { id: 'Tbilisi - Old Tbilisi', cityCode: 'tbilisi', ar: 'تبليسي — تبليسي القديمة (Old Tbilisi)', en: 'Tbilisi — Old Tbilisi', ru: 'Тбилиси — Старый Тбилиси', ka: 'თბილისი — ძველი თბილისი' },
  { id: 'Tbilisi - Ortachala', cityCode: 'tbilisi', ar: 'تبليسي — أورتاشالا (Ortachala)', en: 'Tbilisi — Ortachala', ru: 'Тбилиси — Ортачала', ka: 'თბილისი — ორთაჭალა' },
  { id: 'Tbilisi - Krtsanisi', cityCode: 'tbilisi', ar: 'تبليسي — كرتسانيسي (Krtsanisi)', en: 'Tbilisi — Krtsanisi', ru: 'Тбилиси — Крцаниси', ka: 'თბილისი — კრწანისი' },
  { id: 'Tbilisi - Isani', cityCode: 'tbilisi', ar: 'تبليسي — إيساني (Isani)', en: 'Tbilisi — Isani', ru: 'Тбилиси — Исани', ka: 'თბილისი — ისანი' },
  { id: 'Tbilisi - Samgori', cityCode: 'tbilisi', ar: 'تبليسي — سامغوري (Samgori)', en: 'Tbilisi — Samgori', ru: 'Тбилиси — Самгори', ka: 'თბილისი — სამგორი' },
  { id: 'Tbilisi - Varketili', cityCode: 'tbilisi', ar: 'تبليسي — فاركيتيلي (Varketili)', en: 'Tbilisi — Varketili', ru: 'Тбилиси — Варкетили', ka: 'თბილისი — ვარკეთილი' },
  { id: 'Tbilisi - Didi Digomi', cityCode: 'tbilisi', ar: 'تبليسي — ديدي ديغومي (Didi Digomi)', en: 'Tbilisi — Didi Digomi', ru: 'Тбилиси — Диди Дигоми', ka: 'თბილისი — დიდი დიღომი' },
  { id: 'Tbilisi - Digomi Massive', cityCode: 'tbilisi', ar: 'تبليسي — ديغومي ماسيف (Digomi)', en: 'Tbilisi — Digomi Massive', ru: 'Тбилиси — Дигомский массив', ka: 'თბილისი — დიღმის მასივი' },
  { id: 'Tbilisi - Didube', cityCode: 'tbilisi', ar: 'تبليسي — ديدوبي (Didube)', en: 'Tbilisi — Didube', ru: 'Тбилиси — Дидубе', ka: 'თბილისი — დიდუბე' },
  { id: 'Tbilisi - Chugureti / Marjanishvili', cityCode: 'tbilisi', ar: 'تبليسي — تشوغوريتي / مارجانيشفيلي', en: 'Tbilisi — Chugureti / Marjanishvili', ru: 'Тбилиси — Чугурети / Марджанишвили', ka: 'თბილისი — ჩუღურეთი / მარჯანიშვილი' },
  { id: 'Tbilisi - Nadzaladevi', cityCode: 'tbilisi', ar: 'تبليسي — نادزالاديفي (Nadzaladevi)', en: 'Tbilisi — Nadzaladevi', ru: 'Тбилиси — Надзаладеви', ka: 'თბილისი — ნაძალადევი' },
  { id: 'Tbilisi - Gldani', cityCode: 'tbilisi', ar: 'تبليسي — غلداني (Gldani)', en: 'Tbilisi — Gldani', ru: 'Тбилиси — Глдани', ka: 'თბილისი — გლდანი' },
  { id: 'Tbilisi - Avlabari', cityCode: 'tbilisi', ar: 'تبليسي — أفلاباري (Avlabari)', en: 'Tbilisi — Avlabari', ru: 'Тбилиси — Авлабари', ka: 'თბილისი — ავლაბარი' },
  { id: 'Tbilisi - Lisi Lake', cityCode: 'tbilisi', ar: 'تبليسي — بحيرة ليسي (Lisi Lake)', en: 'Tbilisi — Lisi Lake', ru: 'Тбилиси — Озеро Лиси', ka: 'თბილისი — ლისის ტბა' },
  { id: 'Tbilisi - Tbilisi Sea', cityCode: 'tbilisi', ar: 'تبليسي — بحر تبليسي (Tbilisi Sea)', en: 'Tbilisi — Tbilisi Sea', ru: 'Тбилиси — Тбилисское море', ka: 'თბილისი — თბილისის ზღვა' },
  { id: 'Tbilisi - Tabakhmela / Kojori', cityCode: 'tbilisi', ar: 'تبليسي — تاباخميلا / كوجوري', en: 'Tbilisi — Tabakhmela / Kojori', ru: 'Тбилиси — Табахмела / Коджори', ka: 'თბილისი — ტაბახმელა / კოჯორი' },
  { id: 'Batumi - New Boulevard', cityCode: 'batumi', ar: 'باتومي — نيو بوليفارد (New Boulevard)', en: 'Batumi — New Boulevard', ru: 'Батуми — Новый Бульвар', ka: 'ბათუმი — ახალი ბულვარი' },
  { id: 'Batumi - Alley of Heroes', cityCode: 'batumi', ar: 'باتومي — ممر الأبطال (Alley of Heroes)', en: 'Batumi — Alley of Heroes', ru: 'Батуми — Аллея Героев', ka: 'ბათუმი — გმირთა ხეივანი' },
  { id: 'Batumi - Old Boulevard / Center', cityCode: 'batumi', ar: 'باتومي — البوليفارد القديم / وسط المدينة', en: 'Batumi — Old Boulevard / City Center', ru: 'Батуми — Старый Бульвар / Центр', ka: 'ბათუმი — ძველი ბულვარი / ცენტრი' },
  { id: 'Batumi - Rustaveli Avenue', cityCode: 'batumi', ar: 'باتومي — شارع روستافيلي (Rustaveli)', en: 'Batumi — Rustaveli Avenue', ru: 'Батуми — Проспект Руставели', ka: 'ბათუმი — რუსთაველის გამზირი' },
  { id: 'Batumi - Khimshiashvili', cityCode: 'batumi', ar: 'باتومي — خيمشياشفيلي (Khimshiashvili)', en: 'Batumi — Khimshiashvili', ru: 'Батуми — Химшиашвили', ka: 'ბათუმი — ხიმშიაშვილი' },
  { id: 'Batumi - Bagrationi', cityCode: 'batumi', ar: 'باتومي — باغراتيوني (Bagrationi)', en: 'Batumi — Bagrationi', ru: 'Батуми — Багратиони', ka: 'ბათუმი — ბაგრატიონი' },
  { id: 'Batumi - Airport District', cityCode: 'batumi', ar: 'باتومي — منطقة المطار (Airport Area)', en: 'Batumi — Airport District', ru: 'Батуми — Район Аэропорта', ka: 'ბათუმი — აეროპორტის უბანი' },
  { id: 'Batumi - Gonio / Kvariati', cityCode: 'batumi', ar: 'باتومي — غونيو / كفارياتي (Gonio)', en: 'Batumi — Gonio / Kvariati', ru: 'Батуми — Гонио / Квариати', ka: 'ბათუმი — გონიო / კვარიათი' },
  { id: 'Batumi - Makhinjauri', cityCode: 'batumi', ar: 'باتومي — ماخينجاوري (Makhinjauri)', en: 'Batumi — Makhinjauri', ru: 'Батуми — Махинджаури', ka: 'ბათუმი — მახინჯაური' },
  { id: 'Batumi - Chakvi / Green Cape', cityCode: 'batumi', ar: 'باتومي — تشاكفي / غرين كيب (Chakvi)', en: 'Batumi — Chakvi / Mtsvane Kontskhi', ru: 'Батуми — Чакви / Зелёный Мыс', ka: 'ბათუმი — ჩაქვი / მწვანე კონცხი' },
  { id: 'Kobuleti / Shekvetili', cityCode: 'batumi', ar: 'كوبوليتي / شيكفيتيلي (Kobuleti)', en: 'Kobuleti / Shekvetili', ru: 'Кобулети / Шекветили', ka: 'ქობულეთი / შეკვეთილი' },
  { id: 'Kutaisi', cityCode: 'kutaisi', ar: 'كوتايسي (Kutaisi)', en: 'Kutaisi', ru: 'Кутаиси', ka: 'ქუთაისი' },
  { id: 'Gudauri', cityCode: 'resorts', ar: 'غودوري — منتجع التزلج (Gudauri)', en: 'Gudauri Ski Resort', ru: 'Гудаури', ka: 'გუდაური' },
  { id: 'Bakuriani', cityCode: 'resorts', ar: 'باكورياني (Bakuriani)', en: 'Bakuriani Resort', ru: 'Бакуриани', ka: 'ბაკურიანი' },
  { id: 'Borjomi', cityCode: 'resorts', ar: 'بورجومي (Borjomi)', en: 'Borjomi', ru: 'Боржоми', ka: 'ბორჯომი' },
  { id: 'Kakheti - Telavi / Kvareli', cityCode: 'resorts', ar: 'كاخيتي — تيلافي / كفاريلي', en: 'Kakheti — Telavi / Kvareli', ru: 'Кахетия — Телави / Кварели', ka: 'კახეთი — თელავი / ყვარელი' },
  { id: 'Mtskheta / Saguramo', cityCode: 'resorts', ar: 'متسخيتا / ساجورامو (Saguramo)', en: 'Mtskheta / Saguramo', ru: 'Мцхета / Сагурамо', ka: 'მცხეთა / საგურამო' },
  { id: 'Rustavi', cityCode: 'resorts', ar: 'روستافي (Rustavi)', en: 'Rustavi', ru: 'Рустави', ka: 'რუსთავი' },
]

export function getLocalizedGeorgiaAreaName(
  areaValue: string | null | undefined,
  locale: string
): string {
  if (!areaValue) return '—'
  const found = GEORGIA_CITIES_AND_DISTRICTS.find(
    (item) =>
      item.id.toLowerCase() === areaValue.trim().toLowerCase() ||
      item.ar === areaValue ||
      item.en.toLowerCase() === areaValue.trim().toLowerCase() ||
      item.ru.toLowerCase() === areaValue.trim().toLowerCase() ||
      item.ka === areaValue
  )
  if (!found) return areaValue
  return locale === 'ar'
    ? found.ar
    : locale === 'ru'
      ? found.ru
      : locale === 'ka'
        ? found.ka
        : found.en
}

export function GeorgiaAreaSelect({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string
  value: string
  onChange: (areaId: string) => void
  error?: string
  placeholder?: string
}) {
  const { t: dict, locale, dir, isRtl } = useTranslation()
  const tDetails = dict.sell?.detailsStep as Record<string, any>

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const getItemLabel = (item: GeorgiaAreaItem) =>
    locale === 'ar'
      ? item.ar
      : locale === 'ru'
        ? item.ru
        : locale === 'ka'
          ? item.ka
          : item.en

  const selectedObj = useMemo(
    () =>
      GEORGIA_CITIES_AND_DISTRICTS.find(
        (item) =>
          item.id === value ||
          item.ar === value ||
          item.en === value ||
          item.ru === value ||
          item.ka === value
      ) || null,
    [value]
  )

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return GEORGIA_CITIES_AND_DISTRICTS
    return GEORGIA_CITIES_AND_DISTRICTS.filter(
      (item) =>
        item.ar.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        item.ru.toLowerCase().includes(q) ||
        item.ka.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    )
  }, [search])

  const displayValue = selectedObj
    ? getItemLabel(selectedObj)
    : value || ''

  const cleanLabel = (label || '').replace(/\s*\*\s*$/, '')
  const isRequired = (label || '').includes('*')

  const defaultSelectPlaceholder =
    tDetails?.georgiaLocationPlaceholder ||
    (locale === 'ar'
      ? 'اختر المدينة أو الحي في جورجيا (تبليسي، باتومي...)'
      : locale === 'ru'
        ? 'Выберите город или район Грузии (Тбилиси, Батуми...)'
        : locale === 'ka'
          ? 'აირჩიეთ ქალაქი ან უბანი (თბილისი, ბათუმი...)'
          : 'Select City or District in Georgia (Tbilisi, Batumi...)')

  const defaultSearchPlaceholder =
    tDetails?.georgiaLocationSearchPlaceholder ||
    (locale === 'ar'
      ? 'ابحث باسم الحي أو المدينة...'
      : locale === 'ru'
        ? 'Поиск района или города...'
        : locale === 'ka'
          ? 'მოძებნეთ უბანი ან ქალაქი...'
          : 'Search district or city...')

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      <label className="text-start text-sm font-bold text-[var(--brand-navy,#0a1122)]">
        {cleanLabel}
        {isRequired && <span className="ms-1 text-red-600">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen((prev) => !prev)
            setSearch('')
          }}
          className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 text-start text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#007a5a)] ${
            error
              ? 'border-red-500 bg-red-50/20 text-red-900'
              : displayValue
                ? 'border-slate-200 text-[var(--brand-navy,#0a1122)]'
                : 'border-slate-200 text-slate-400'
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-[var(--brand-primary,#007a5a)]" />
            <span className="truncate">
              {displayValue || placeholder || defaultSelectPlaceholder}
            </span>
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-slate-400 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div
            dir={dir}
            className={`absolute top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
              isRtl ? 'right-0' : 'left-0'
            }`}
          >
            <div className="border-b border-slate-100 p-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={defaultSearchPlaceholder}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 ps-3 pe-9 text-xs font-semibold text-[#0a1122] focus:border-[#007a5a] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-1.5">
              {filteredList.length === 0 ? (
                <p className="py-5 text-center text-xs font-semibold text-slate-400">
                  {tDetails?.noAreaMatch || '—'}
                </p>
              ) : (
                filteredList.map((item) => {
                  const itemLabel = getItemLabel(item)
                  const isSelected =
                    value === item.id || value === itemLabel

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        onChange(item.id)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-xs transition hover:bg-slate-50 sm:text-sm ${
                        isSelected
                          ? 'bg-[var(--brand-primary-light,#eaf8f2)] font-extrabold text-[#007a5a]'
                          : 'font-medium text-[var(--brand-navy,#0a1122)]'
                      }`}
                    >
                      <span className="truncate">{itemLabel}</span>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-[#007a5a]" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-start text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  )
}