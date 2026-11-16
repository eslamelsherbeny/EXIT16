'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  LocateFixed,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RequiredLabel } from '@/components/features/seller/seller-shared'
import { getInstantLocalGeorgiaSuggestions } from '@/lib/georgia-uber-search'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

export type BuyerSelectedLocationItem = {
  areaId: string
  displayLabel: string
}

export const SIVRCE_BUYER_POPULAR_CITIES = [
  'Tbilisi',
  'Batumi',
  'Kutaisi',
  'Rustavi',
  'Kobuleti',
  'Bakuriani',
  'Gudauri',
  'Borjomi',
  'Telavi',
  'Gori',
]

export const SIVRCE_BUYER_SIDEBAR_CITIES = [
  'Tbilisi',
  'Batumi',
  'Kutaisi',
  'Rustavi',
  'Kobuleti',
  'Bakuriani',
  'Gudauri',
  'Borjomi',
  'Telavi',
  'Gori',
  'Mtskheta',
  'Zugdidi',
  'Poti',
  'Tskaltubo',
  'Mestia',
  'Sighnaghi',
  'Kvareli',
  'Kazbegi',
  'Gonio',
  'Chakvi',
  'Abastumani',
  'Abasha',
  'Agara',
  'Adigeni',
  'Ambrolauri',
  'Aspindza',
  'Akhaltsikhe',
  'Akhmeta',
  'Baghdati',
  'Bolnisi',
  'Gardabani',
  'Gurjaani',
  'Dedoplistsqaro',
  'Dmanisi',
  'Dusheti',
  'Vani',
  'Zestafoni',
  'Tetritsqaro',
  'Terjola',
  'Tianeti',
  'Kaspi',
  'Lagodekhi',
  'Lanchkhuti',
  'Marneuli',
  'Martvili',
  'Ozurgeti',
  'Sagarejo',
  'Samtredia',
  'Senaki',
  'Tkibuli',
  'Kareli',
  'Keda',
  'Chiatura',
  'Chokhatauri',
  'Khashuri',
  'Khelvachauri',
  'Khobi',
  'Khoni',
]

export const SIVRCE_CITY_DISTRICT_COLUMNS: Record<
  string,
  Array<{ title: string; keys: string[] }>
> = {
  Tbilisi: [
    {
      title: 'Vake-Saburtalo',
      keys: [
        'Vake',
        'Saburtalo',
        'Vashlijvari',
        'Vedzisi',
        'Tkhinvali',
        'Kus Tba',
        'Lisi',
        'Lisis Tba',
        'Mukhatgverdi',
        'Mukhattsqaro',
        'Bagebi',
        'Sop. Dighomi',
        'Dighmis Chala',
        'Koshigora',
        'Dighomi 1-9',
        'Nutsubidzis Perdobi',
        'Didgori',
        'Didi Dighomi',
        'Vazha-Pshavelas Kvartlebi',
        'Zurgovana',
      ],
    },
    {
      title: 'Isani-Samgori',
      keys: [
        'Varketili',
        'Isani',
        'Lilo',
        'Mesame Masivi',
        'Moskovis Ave.',
        'Aprika',
        'Aeroportis Dasakhleba',
        'Dampalos Dasakhleba',
        'Vazisubani',
        'Navtlughi',
        'Orkhevi',
        'Samgori',
        'Ponichala',
        'Varketilis Meurneoba',
      ],
    },
    {
      title: 'Gldani-Nadzaladevi',
      keys: [
        'Gldani',
        'Gldanula',
        'Tbilisis Zghva',
        'Temka',
        'Koniakis Dasakhleba',
        'Lotkini',
        'Mukhiani',
        'Nadzaladevi',
        'Sanzona',
        'Avshniani',
        'Avchala',
        'Zahesi',
        'Giorgitsminda',
        'Zghvisubani',
        'Gldanis Masivi',
      ],
    },
    {
      title: 'Didube-Chughureti',
      keys: [
        'Didube',
        'Dighmis Masivi',
        'Kukia',
        'Chughureti',
        'Ivertubani',
        'Svanetis Ubani',
      ],
    },
    {
      title: 'Dzveli Tbilisi',
      keys: [
        'Dzveli Tbilisi',
        'Vera',
        'Krtsanisi',
        'Mtatsminda',
        'Sololaki',
        'Tsavkisis Veli',
        'Abanotubani',
        'Avlabari',
        'Elia',
        'Ortachala',
        'Metekhi',
        'Okrokana',
        'Tsqneti',
        'Tabakhmela',
        'Kojori',
        'Shindisi',
        'Tsavkisi',
        'Kiketi',
        'Betania',
        'Akhaldaba',
        'Kaklebi',
        'Tsveri',
        'Mskhaldidi',
        'Tsodoreti',
      ],
    },
  ],
  Batumi: [
    {
      title: 'Boulevard & Coast',
      keys: [
        'New Boulevard',
        'Old Boulevard',
        'Alley of Heroes',
        'Rustaveli Ave',
        'Khimshiashvili',
      ],
    },
    {
      title: 'City & Central',
      keys: [
        'Bagrationi',
        'Chavchavadze',
        'Gorgiladze',
        'Pushkin',
        'Airport District',
      ],
    },
    {
      title: 'Suburbs & Resorts',
      keys: [
        'Gonio',
        'Kvariati',
        'Sarpi',
        'Makhinjauri',
        'Green Cape',
        'Chakvi',
      ],
    },
  ],
  Kutaisi: [
    {
      title: 'Kutaisi Districts',
      keys: [
        'City Center',
        'Chavchavadze',
        'Balakhvani',
        'Nikea',
        'Avtokarkhana',
        'Akhali Gza',
        'Sapichkhia',
        'Gora',
      ],
    },
  ],
  Rustavi: [
    {
      title: 'Rustavi Districts',
      keys: [
        'New Rustavi',
        'Old Rustavi',
        'Shartava',
        'Megobroba',
        'Leonidze',
        'Tavisupleba',
      ],
    },
  ],
  Kobuleti: [
    {
      title: 'Kobuleti & Coast',
      keys: [
        'Agmashenebeli Ave',
        'Rustaveli St',
        'Shekvetili',
        'Tsikhisdziri',
        'Bobokvati',
        'Chakvi',
      ],
    },
  ],
  Gudauri: [
    {
      title: 'Gudauri Zones',
      keys: [
        'New Gudauri',
        'Upper Gudauri',
        'Central Gudauri',
        'Lower Gudauri',
        'Kumlistsikhe',
      ],
    },
  ],
  Bakuriani: [
    {
      title: 'Bakuriani Zones',
      keys: [
        'Didveli',
        'Kokhta',
        'Mitarbi',
        'Amirani Park',
        '25-ianebi',
        'Tsriuli',
      ],
    },
  ],
  Borjomi: [
    {
      title: 'Borjomi Zones',
      keys: ['Central Park', 'Likani', 'Plateau', 'Tsagveri', 'Sadgeri'],
    },
  ],
  Telavi: [
    {
      title: 'Telavi & Kakheti',
      keys: [
        'Telavi Center',
        'Tsinandali',
        'Lopota',
        'Kvareli',
        'Sighnaghi',
        'Alazani Valley',
      ],
    },
  ],
  Gori: [
    {
      title: 'Gori Districts',
      keys: [
        'City Center',
        'Stalin Ave',
        'Tsminda Tskali',
        'Verkhvebi',
        'Kombinali',
      ],
    },
  ],
}

export type DistrictAZEntry = {
  district: string
  city: string
  areaId: string
}

/**
 * دليل الأحياء والمناطق فقط مرتبة أبجدياً (A–Z) بدون أسماء المدن
 */
export const SIVRCE_DISTRICTS_AZ_DIRECTORY: Record<string, DistrictAZEntry[]> =
  (() => {
    const all: DistrictAZEntry[] = []
    const seen = new Set<string>()

    for (const [city, cols] of Object.entries(SIVRCE_CITY_DISTRICT_COLUMNS)) {
      for (const col of cols) {
        for (const dKey of col.keys) {
          const uniqueKey = `${dKey.toLowerCase()}_${city.toLowerCase()}`
          if (seen.has(uniqueKey)) continue
          seen.add(uniqueKey)

          const defaultAreaId =
            city === 'Batumi'
              ? 'Batumi - New Boulevard'
              : city === 'Kutaisi'
                ? 'Kutaisi'
                : city === 'Rustavi'
                  ? 'Rustavi'
                  : city === 'Gudauri'
                    ? 'Gudauri'
                    : city === 'Bakuriani'
                      ? 'Bakuriani'
                      : city === 'Borjomi'
                        ? 'Borjomi'
                        : city === 'Kobuleti'
                          ? 'Kobuleti / Shekvetili'
                          : city === 'Telavi'
                            ? 'Kakheti - Telavi / Kvareli'
                            : 'Tbilisi - Saburtalo'

          all.push({
            district: dKey,
            city,
            areaId: defaultAreaId,
          })
        }
      }
    }

    all.sort((a, b) => a.district.localeCompare(b.district))

    const grouped: Record<string, DistrictAZEntry[]> = {}
    for (const item of all) {
      const firstChar = (item.district[0] || 'A').toUpperCase()
      const letter = /[A-Z]/.test(firstChar) ? firstChar : 'A'
      if (!grouped[letter]) grouped[letter] = []
      grouped[letter].push(item)
    }
    return grouped
  })()

export const SIVRCE_BUYER_MUNICIPALITIES_AZ: Record<string, string[]> =
  Object.fromEntries(
    Object.entries(SIVRCE_DISTRICTS_AZ_DIRECTORY).map(([letter, items]) => [
      letter,
      items.map((i) => `${i.district}, ${i.city}`),
    ])
  )

const BUYER_UI_TEXT: Record<
  LocaleCode,
  {
    triggerEmpty: string
    triggerSelected: (count: number) => string
    modalTitle: string
    searchPlaceholder: string
    nearbyTitle: string
    nearbySub: string
    popularCitiesTitle: string
    browseAllCitiesBtn: string
    districtsAZTitle: string
    districtsTab: string
    citiesHeader: string
    wholeCityBtn: string
    clearBtn: string
    selectBtn: string
  }
> = {
  ar: {
    triggerEmpty: 'اضغط لاختيار المدينة أو الحي في جورجيا...',
    triggerSelected: (c) =>
      `اضغط لإضافة مدينة أو منطقة أخرى (${c} مناطق محددة)`,
    modalTitle: 'الموقع',
    searchPlaceholder: 'مدينة أو حي أو منطقة',
    nearbyTitle: 'بالقرب منك',
    nearbySub: 'المدينة من هذا الموقع',
    popularCitiesTitle: 'مدن شائعة',
    browseAllCitiesBtn: 'تصفح كل المدن ←',
    districtsAZTitle: 'الأحياء والمناطق (A–Z)',
    districtsTab: 'الأحياء والمناطق',
    citiesHeader: 'كل المدن',
    wholeCityBtn: 'كل المدينة',
    clearBtn: 'مسح',
    selectBtn: 'اختيار',
  },
  en: {
    triggerEmpty: 'Click to select city or district in Georgia...',
    triggerSelected: (c) => `Click to add another area (${c} selected)`,
    modalTitle: 'Location',
    searchPlaceholder: 'City or district',
    nearbyTitle: 'Nearby',
    nearbySub: 'City from this location',
    popularCitiesTitle: 'Popular cities',
    browseAllCitiesBtn: 'Browse all cities →',
    districtsAZTitle: 'Districts & Areas (A–Z)',
    districtsTab: 'Districts',
    citiesHeader: 'All Cities',
    wholeCityBtn: 'Whole city',
    clearBtn: 'Clear',
    selectBtn: 'Select',
  },
  ru: {
    triggerEmpty: 'Нажмите для выбора города или района в Грузии...',
    triggerSelected: (c) => `Добавить еще район (выбрано: ${c})`,
    modalTitle: 'Локация',
    searchPlaceholder: 'Город или район',
    nearbyTitle: 'Рядом с вами',
    nearbySub: 'Город по геолокации',
    popularCitiesTitle: 'Популярные города',
    browseAllCitiesBtn: 'Все города →',
    districtsAZTitle: 'Районы и зоны (A–Z)',
    districtsTab: 'Районы',
    citiesHeader: 'Все города',
    wholeCityBtn: 'Весь город',
    clearBtn: 'Сбросить',
    selectBtn: 'Выбрать',
  },
  ka: {
    triggerEmpty: 'დააჭირეთ ქალაქის ან უბნის ასარჩევად...',
    triggerSelected: (c) => `სხვა უბნის დამატება (არჩეულია ${c})`,
    modalTitle: 'მდებარეობა',
    searchPlaceholder: 'ქალაქი ან უბანი',
    nearbyTitle: 'თქვენთან ახლოს',
    nearbySub: 'ქალაქი ამ მდებარეობიდან',
    popularCitiesTitle: 'პოპულარული ქალაქები',
    browseAllCitiesBtn: 'ყველა ქალაქი →',
    districtsAZTitle: 'უბნები და ზონები (A–Z)',
    districtsTab: 'უბნები',
    citiesHeader: 'ყველა ქალაქი',
    wholeCityBtn: 'მთელი ქალაქი',
    clearBtn: 'გასუფთავება',
    selectBtn: 'არჩევა',
  },
}

export function BuyerLocationModalPicker({
  label,
  selectedAreas,
  areaDisplayLabels,
  onChangeAreas,
  error,
}: {
  label: string
  selectedAreas: string[]
  areaDisplayLabels: Record<string, string>
  onChangeAreas: (
    nextIds: string[],
    nextLabels: Record<string, string>
  ) => void
  error?: string
}) {
  const { locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const uT = BUYER_UI_TEXT[activeLocale] || BUYER_UI_TEXT.ar

  const [open, setOpen] = useState(false)
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draftList, setDraftList] = useState<BuyerSelectedLocationItem[]>([])

  useEffect(() => {
    if (open) {
      setDraftList(
        selectedAreas.map((id) => ({
          areaId: id,
          displayLabel: areaDisplayLabels[id] || id,
        }))
      )
      setSearchQuery('')
    }
  }, [open, selectedAreas, areaDisplayLabels])

  const isSelected = (key: string) => {
    const clean = key.trim().toLowerCase()
    return draftList.some((x) => x.areaId.trim().toLowerCase() === clean)
  }

  const toggleSelection = (areaId: string, displayLabel?: string) => {
    const clean = areaId.trim()
    if (!clean) return
    const labelToSave = (displayLabel || clean).trim()

    setDraftList((prev) => {
      const exists = prev.some(
        (x) => x.areaId.trim().toLowerCase() === clean.toLowerCase()
      )
      if (exists) {
        return prev.filter(
          (x) => x.areaId.trim().toLowerCase() !== clean.toLowerCase()
        )
      }
      return [...prev, { areaId: clean, displayLabel: labelToSave }]
    })
  }

  const quickSearchSuggestions = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return []
    return getInstantLocalGeorgiaSuggestions(q, activeLocale, activeCity).slice(
      0,
      15
    )
  }, [searchQuery, activeLocale, activeCity])

  const activeCityColumns = useMemo(() => {
    if (!activeCity) return []
    const foundKey = Object.keys(SIVRCE_CITY_DISTRICT_COLUMNS).find(
      (k) => k.toLowerCase() === activeCity.toLowerCase()
    )
    return foundKey ? SIVRCE_CITY_DISTRICT_COLUMNS[foundKey] : []
  }, [activeCity])

  const handleConfirm = () => {
    let finalItems = [...draftList]
    if (finalItems.length === 0 && activeCity) {
      finalItems = [{ areaId: activeCity, displayLabel: activeCity }]
    }
    const nextIds: string[] = []
    const nextLabels: Record<string, string> = { ...areaDisplayLabels }
    for (const item of finalItems) {
      if (!nextIds.includes(item.areaId)) {
        nextIds.push(item.areaId)
        nextLabels[item.areaId] = item.displayLabel
      }
    }
    onChangeAreas(nextIds, nextLabels)
    setOpen(false)
  }

  return (
    <div className="text-start">
      <Label className="mb-2 block text-start text-sm font-bold">
        <RequiredLabel>{label.replace(/\s*\*\s*$/, '')}</RequiredLabel>
      </Label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 text-start text-xs font-bold transition sm:text-sm ${
          error
            ? 'border-red-500 bg-red-50/20 text-red-700'
            : selectedAreas.length > 0
              ? 'border-[var(--brand-primary,#007a5a)] bg-[#eaf8f2]/40 text-[#0a1122] hover:bg-[#eaf8f2]/70'
              : 'border-slate-200 bg-white text-slate-500 hover:border-[#2563eb]'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <MapPin
            className={`size-4 shrink-0 ${
              selectedAreas.length > 0
                ? 'text-[var(--brand-primary,#007a5a)]'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">
            {selectedAreas.length > 0
              ? uT.triggerSelected(selectedAreas.length)
              : uT.triggerEmpty}
          </span>
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <Plus className="size-4 text-[var(--brand-primary,#007a5a)]" />
          <ChevronDown className="size-4" />
        </span>
      </button>

      {error && (
        <p className="mt-1.5 text-start text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {selectedAreas.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedAreas.map((areaId) => {
            const displayLabel = areaDisplayLabels[areaId] || areaId
            return (
              <span
                key={areaId}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary,#007a5a)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChangeAreas(
                      selectedAreas.filter((item) => item !== areaId),
                      areaDisplayLabels
                    )
                  }
                  className="ms-0.5 rounded-full p-0.5 hover:bg-black/20"
                >
                  <X className="size-3" />
                </button>
              </span>
            )
          })}

          {selectedAreas.length > 1 && (
            <button
              type="button"
              onClick={() => onChangeAreas([], areaDisplayLabels)}
              className="ms-1 text-xs font-bold text-red-600 underline hover:text-red-700"
            >
              {uT.clearBtn}
            </button>
          )}
        </div>
      )}

      {open && (
        <div
          dir={dir}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[20px] bg-white shadow-2xl sm:h-[630px] sm:rounded-[20px]"
          >
            {/* الهيدر */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2.5 sm:px-6">
              <div className="flex items-center gap-2">
                {activeCity && (
                  <button
                    type="button"
                    onClick={() => setActiveCity(null)}
                    className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                  </button>
                )}
                <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                  {uT.modalTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* شريط الشارات المختارة */}
            {draftList.length > 0 && (
              <div className="flex max-h-16 flex-wrap items-center gap-1.5 overflow-y-auto px-5 pb-2 sm:px-6">
                {draftList.map((sel) => (
                  <span
                    key={sel.areaId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]"
                  >
                    <span>{sel.displayLabel}</span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleSelection(sel.areaId, sel.displayLabel)
                      }
                      className="hover:text-blue-900"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* شريط البحث */}
            <div className="px-5 pb-3 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={uT.searchPlaceholder}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white ps-10 pe-9 text-start text-xs text-slate-800 transition focus:border-[#2563eb] focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 end-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {searchQuery.trim().length >= 1 &&
                quickSearchSuggestions.length > 0 && (
                  <div className="mt-1.5 max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    {quickSearchSuggestions.map((item) => {
                      const labelStr = item.displayAreaLabel || item.primaryText
                      const checked = isSelected(labelStr)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleSelection(labelStr, labelStr)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-xs hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin className="size-3.5 text-[#2563eb]" />
                            <span className="font-semibold text-slate-800">
                              {labelStr}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="size-3.5 rounded border-slate-300 accent-[#2563eb]"
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
            </div>

            {/* المحتوى الرئيسي */}
            {!activeCity ? (
              <div className="flex-1 overflow-y-auto px-5 py-1 sm:px-6">
                {/* كارت بالقرب منك */}
                <button
                  type="button"
                  onClick={() => toggleSelection('Tbilisi', 'Tbilisi')}
                  className="flex w-full flex-col items-start justify-center rounded-xl bg-[#f8f9fb] p-4 text-start transition hover:bg-[#f1f4f9]"
                >
                  <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-2xs">
                    <LocateFixed className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {uT.nearbyTitle}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-400">
                    {uT.nearbySub}
                  </span>
                </button>

                {/* 1. المدن الشائعة (قابلة للضغط لفتح الأحياء + زر تصفح كل المدن) */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      {uT.popularCitiesTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCity('Tbilisi')}
                      className="text-[11px] font-semibold text-[#2563eb] hover:underline"
                    >
                      {uT.browseAllCitiesBtn}
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {SIVRCE_BUYER_POPULAR_CITIES.map((cityEn) => {
                      const checked = isSelected(cityEn)
                      return (
                        <div
                          key={cityEn}
                          onClick={() => setActiveCity(cityEn)}
                          className={`group flex h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 transition ${
                            checked
                              ? 'bg-blue-50/90 ring-1 ring-[#2563eb]'
                              : 'bg-[#f8f9fb] hover:bg-[#eef2f6]'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleSelection(cityEn, cityEn)}
                              title={uT.wholeCityBtn}
                              className="size-3.5 shrink-0 cursor-pointer rounded border-slate-300 accent-[#2563eb]"
                            />
                            <span className="truncate text-xs font-semibold text-slate-800 group-hover:text-[#2563eb]">
                              {cityEn}
                            </span>
                          </div>

                          {/* سهم يوضح أن كارت المدينة قابل للضغط للدخول لأحيائها */}
                          <ChevronLeft className="size-3.5 shrink-0 text-slate-400 transition group-hover:text-[#2563eb] ltr:rotate-180" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. الأحياء والمناطق فقط مرتبة أبجدياً (A–Z) — اختيار مباشر بدون انضغاط */}
                <div className="mt-6 pb-5">
                  <span className="block text-[11px] font-medium text-slate-400">
                    {uT.districtsAZTitle}
                  </span>

                  <div className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                    {Object.entries(SIVRCE_DISTRICTS_AZ_DIRECTORY).map(
                      ([letter, list]) => (
                        <div key={letter} className="text-start">
                          <div className="mb-2 rounded-lg bg-[#f8f9fb] px-3 py-1 text-xs font-semibold text-slate-500">
                            {letter}
                          </div>
                          <ul className="space-y-1.5 px-1">
                            {list.map((item) => {
                              const fullKey = `${item.district}, ${item.city}`
                              const checked = isSelected(fullKey)

                              return (
                                <li key={fullKey}>
                                  <label
                                    onClick={() =>
                                      toggleSelection(fullKey, fullKey)
                                    }
                                    className="flex cursor-pointer items-center justify-between gap-2 py-0.5 text-start text-xs font-normal text-slate-700 hover:text-[#2563eb]"
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        readOnly
                                        className="size-3.5 shrink-0 cursor-pointer rounded border-slate-300 accent-[#2563eb]"
                                      />
                                      <span className="truncate">
                                        {item.district}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-[10px] text-slate-400">
                                      {item.city}
                                    </span>
                                  </label>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* الشاشة الداخلية: قائمة كل المدن على الجنب + الأحياء (قابلة للتحديد فقط بدون شوارع) */
              <div className="flex flex-1 flex-col overflow-hidden border-t border-slate-100">
                <div className="grid flex-1 grid-cols-1 overflow-hidden sm:grid-cols-12">
                  {/* العمود الجانبي لكل المدن */}
                  <div className="flex max-h-36 flex-col overflow-hidden border-b border-slate-100 sm:col-span-3 sm:max-h-none sm:border-e sm:border-b-0">
                    <div className="border-b border-slate-100 px-5 py-2.5 text-start text-xs font-semibold text-slate-500">
                      {uT.citiesHeader}
                    </div>
                    <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
                      {SIVRCE_BUYER_SIDEBAR_CITIES.map((cityItem) => {
                        const isCurrent =
                          activeCity.toLowerCase() === cityItem.toLowerCase()
                        return (
                          <button
                            key={cityItem}
                            type="button"
                            onClick={() => setActiveCity(cityItem)}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-start text-xs transition ${
                              isCurrent
                                ? 'bg-blue-50/80 font-bold text-[#2563eb]'
                                : 'font-normal text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <MapPin
                              className={`size-3.5 shrink-0 ${
                                isCurrent ? 'text-[#2563eb]' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{cityItem}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* أعمدة الأحياء داخل المدينة */}
                  <div className="flex flex-1 flex-col overflow-hidden sm:col-span-9">
                    <div className="flex items-center border-b border-slate-100 px-5 pt-2.5">
                      <span className="border-b-2 border-[#2563eb] pb-2 text-xs font-bold text-[#2563eb]">
                        {uT.districtsTab}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 text-start">
                      <button
                        type="button"
                        onClick={() => toggleSelection(activeCity, activeCity)}
                        className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
                          isSelected(activeCity)
                            ? 'bg-[#007a5a]'
                            : 'bg-[#2563eb] hover:bg-blue-700'
                        }`}
                      >
                        <span>
                          {uT.wholeCityBtn} ({activeCity})
                        </span>
                      </button>

                      {activeCityColumns.length > 0 ? (
                        <div
                          className={`grid grid-cols-2 gap-5 text-start ${
                            activeCityColumns.length >= 5
                              ? 'sm:grid-cols-3 md:grid-cols-5'
                              : 'sm:grid-cols-3'
                          }`}
                        >
                          {activeCityColumns.map((col) => (
                            <div key={col.title}>
                              <strong className="mb-2.5 block text-xs font-bold text-slate-800">
                                {col.title}
                              </strong>
                              <div className="space-y-2">
                                {col.keys.map((dKey) => {
                                  const fullKey = `${dKey}, ${activeCity}`
                                  const checked = isSelected(fullKey)
                                  return (
                                    <label
                                      key={dKey}
                                      onClick={() =>
                                        toggleSelection(fullKey, fullKey)
                                      }
                                      className="flex cursor-pointer items-center gap-2 text-start text-xs font-normal text-slate-600 hover:text-[#2563eb]"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        readOnly
                                        className="size-3.5 shrink-0 rounded border-slate-300 accent-[#2563eb]"
                                      />
                                      <span className="leading-snug">
                                        {dKey}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {activeCity} — {uT.wholeCityBtn}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* الفوتر */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setDraftList([])
                  setActiveCity(null)
                  setSearchQuery('')
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                {uT.clearBtn}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex min-w-[100px] items-center justify-center rounded-full bg-[#2563eb] px-6 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
              >
                <span>
                  {draftList.length > 0
                    ? `${uT.selectBtn} (${draftList.length})`
                    : uT.selectBtn}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}