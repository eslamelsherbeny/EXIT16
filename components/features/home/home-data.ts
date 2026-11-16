import {
  Bath,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Gem,
  Home,
  Hotel,
  MapPin,
  Mountain,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Store,
  Trees,
  Waves,
} from 'lucide-react'
import enDict from '@/dictionaries/en.json'
import { DICTIONARIES, type LocaleCode } from '@/lib/i18n'

export type HomeUnitCardItem = {
  id: string
  code?: string
  title: string
  developer?: string
  area: string
  unitTypeLabel?: string
  category: 'exit'
  price: number
  contractPrice?: number
  marketPrice?: number
  remainingAmount?: number
  gainAmount?: number
  negotiable?: boolean
  installmentAmount?: number
  installmentFreq?: string
  deliveryText?: string
  size: number
  rooms: number
  bedrooms: number
  bathrooms: number
  floor?: number
  totalFloors?: number
  image: string
  images?: string[]
  imagesCount: number
  isFeatured?: boolean
  boostTier?: 'super_vip' | 'vip_plus' | null
  docsVerified?: boolean
  createdAt?: string
  viewsCount?: number
  features?: string[]
}

export const SHOWCASE_IMAGES = {
  villa:
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
  coast:
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
  park: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
  project:
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
  interior:
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
  chalet:
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1000&q=80',
}

export function cleanPureLocaleText(raw: string, locale: string): string {
  if (!raw) return ''
  if (locale === 'ar') {
    return raw.replace(/\s*\([^)]*[a-zA-Z]+[^)]*\)/g, '').trim()
  }
  return raw
}

export function getCleanProjectName(
  unit: HomeUnitCardItem,
  cleanArea: string
): string {
  const raw = (unit.title || '').trim()
  if (!raw) return cleanArea || ''

  const stripped = raw
    .replace(
      /^(للتنازل|للبيع|للإيجار)\s*(شقة|فيلا|استوديو|وحدة|شاليه|منزل)?\s*(\d+\s*(غرف|غرفة)(\s*نوم)?)?\s*[·\-–—]?\s*/i,
      ''
    )
    .trim()

  return stripped || raw
}

export function getLocalizedUnitTitle(
  unit: HomeUnitCardItem,
  _locale: string,
  cleanArea: string
): string {
  return getCleanProjectName(unit, cleanArea)
}

export const FALLBACK_SHOWCASE_UNITS: HomeUnitCardItem[] = []

type CategoryKey = keyof typeof enDict.home.categoriesGrid

export function getHomeCategoriesGrid(localeOrIsAr: LocaleCode | boolean) {
  const lang: LocaleCode =
    typeof localeOrIsAr === 'boolean'
      ? localeOrIsAr
        ? 'ar'
        : 'en'
      : ['ar', 'en', 'ru', 'ka'].includes(localeOrIsAr)
        ? localeOrIsAr
        : 'en'

  const catDict =
    DICTIONARIES[lang]?.home?.categoriesGrid || enDict.home.categoriesGrid

  const lbl = (key: CategoryKey) =>
    catDict[key] || enDict.home.categoriesGrid[key] || key

  const buildUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params)
    return `/opportunities?${sp.toString()}`
  }

  return [
    {
      id: 'exit',
      label: lbl('exit'),
      icon: ShieldCheck,
      href: '/opportunities',
      color: 'bg-emerald-50 text-[#007a5a]',
    },
    {
      id: 'Apartment',
      label: lbl('Apartment'),
      icon: Building2,
      href: buildUrl({
        type: 'Apartment',
        label: lbl('Apartment'),
      }),
      color: 'bg-blue-50 text-[#2563eb]',
    },
    {
      id: 'Private house',
      label: lbl('Private house'),
      icon: Home,
      href: buildUrl({
        type: 'Private house',
        label: lbl('Private house'),
      }),
      color: 'bg-orange-50 text-[#ea580c]',
    },
    {
      id: 'Cottage',
      label: lbl('Cottage'),
      icon: Trees,
      href: buildUrl({
        type: 'Cottage',
        label: lbl('Cottage'),
      }),
      color: 'bg-green-50 text-green-600',
    },
    {
      id: 'Luxury',
      label: lbl('Luxury'),
      icon: Gem,
      href: buildUrl({
        feature: 'Panoramic view',
        label: lbl('Luxury'),
      }),
      color: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'Land',
      label: lbl('Land'),
      icon: MapPin,
      href: buildUrl({
        type: 'Land',
        label: lbl('Land'),
      }),
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      id: 'Commercial',
      label: lbl('Commercial'),
      icon: Store,
      href: buildUrl({
        type: 'Commercial',
        label: lbl('Commercial'),
      }),
      color: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'Ready',
      label: lbl('Ready'),
      icon: Calendar,
      href: buildUrl({
        delivery: 'Ready to Move',
        label: lbl('Ready'),
      }),
      color: 'bg-rose-50 text-rose-500',
    },
    {
      id: 'Sea view',
      label: lbl('Sea view'),
      icon: Waves,
      href: buildUrl({
        feature: 'Sea view',
        label: lbl('Sea view'),
      }),
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      id: 'Pool',
      label: lbl('Pool'),
      icon: Sparkles,
      href: buildUrl({
        feature: 'Pool',
        label: lbl('Pool'),
      }),
      color: 'bg-sky-50 text-sky-600',
    },
    {
      id: 'Jacuzzi',
      label: lbl('Jacuzzi'),
      icon: Bath,
      href: buildUrl({
        feature: 'Jacuzzi',
        label: lbl('Jacuzzi'),
      }),
      color: 'bg-orange-50 text-orange-500',
    },
    {
      id: 'Ski resorts',
      label: lbl('Ski resorts'),
      icon: Mountain,
      href: buildUrl({
        feature: 'Ski access',
        label: lbl('Ski resorts'),
      }),
      color: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'Compounds',
      label: lbl('Compounds'),
      icon: PawPrint,
      href: buildUrl({
        feature: 'Security',
        label: lbl('Compounds'),
      }),
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'Workspace',
      label: lbl('Workspace'),
      icon: Briefcase,
      href: buildUrl({
        type: 'Commercial',
        label: lbl('Workspace'),
      }),
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'Hotel',
      label: lbl('Hotel'),
      icon: Hotel,
      href: buildUrl({
        type: 'Hotel',
        label: lbl('Hotel'),
      }),
      color: 'bg-teal-50 text-teal-600',
    },
    {
      id: 'New projects',
      label: lbl('New projects'),
      icon: Building,
      href: buildUrl({
        delivery: 'Under Construction',
        label: lbl('New projects'),
      }),
      color: 'bg-blue-50 text-blue-600',
    },
  ]
}