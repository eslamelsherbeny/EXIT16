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

// تنظيف اسم المشروع من أي جمل زائدة مثل "للتنازل شقة 2 غرف نوم ·" ليبقى اسم المشروع الصافي فقط
export function getCleanProjectName(
  unit: HomeUnitCardItem,
  cleanArea: string
): string {
  const raw = (unit.title || '').trim()
  if (!raw) return cleanArea || 'Residential Project'

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

export const FALLBACK_SHOWCASE_UNITS: HomeUnitCardItem[] = [
  {
    id: '12000283',
    code: 'U-89716',
    title: 'Krtsanisi Resort Residence',
    developer: 'VR Holding',
    area: 'Tbilisi - Krtsanisi',
    unitTypeLabel: 'شقة',
    category: 'exit',
    price: 110000,
    contractPrice: 175000,
    marketPrice: 205000,
    remainingAmount: 65000,
    gainAmount: 27812,
    negotiable: true,
    installmentAmount: 2500,
    installmentFreq: 'ربع سنوي',
    deliveryText: '2027',
    size: 115,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    floor: 4,
    totalFloors: 16,
    image: SHOWCASE_IMAGES.interior,
    images: [
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 17,
    isFeatured: true,
    boostTier: 'super_vip',
    docsVerified: true,
    viewsCount: 85,
  },
  {
    id: '10000050',
    code: 'U-05009',
    title: 'Old Chugureti Residence',
    developer: 'Marjanishvili Square Dev',
    area: 'Tbilisi - Chugureti',
    unitTypeLabel: 'شقة',
    category: 'exit',
    price: 75000,
    contractPrice: 128000,
    marketPrice: 148000,
    remainingAmount: 53000,
    gainAmount: 18400,
    negotiable: true,
    installmentAmount: 1500,
    installmentFreq: 'شهري',
    deliveryText: '2027',
    size: 88,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 2,
    floor: 4,
    totalFloors: 16,
    image: SHOWCASE_IMAGES.interior,
    images: [
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.villa,
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.chalet,
    ],
    imagesCount: 11,
    isFeatured: true,
    boostTier: 'super_vip',
    docsVerified: true,
    viewsCount: 134,
  },
  {
    id: '10000046',
    code: 'U-59351',
    title: 'La Quinta by Wyndham Batumi',
    developer: 'Elt Building',
    area: 'Batumi - New Boulevard',
    unitTypeLabel: 'شقة',
    category: 'exit',
    price: 46000,
    contractPrice: 84000,
    marketPrice: 98000,
    remainingAmount: 38000,
    gainAmount: 12950,
    negotiable: true,
    installmentAmount: 950,
    installmentFreq: 'شهري',
    deliveryText: '2026',
    size: 64,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    floor: 15,
    totalFloors: 16,
    image: SHOWCASE_IMAGES.coast,
    images: [
      SHOWCASE_IMAGES.coast,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 14,
    isFeatured: true,
    boostTier: 'super_vip',
    docsVerified: true,
    viewsCount: 108,
  },
  {
    id: '10000091',
    code: 'U-46765',
    title: 'ORBI City Batumi',
    developer: 'ORBI Group',
    area: 'Batumi - Alley of Heroes',
    unitTypeLabel: 'شقة فندقية',
    category: 'exit',
    price: 42000,
    contractPrice: 78000,
    marketPrice: 91000,
    remainingAmount: 36000,
    gainAmount: 12025,
    negotiable: false,
    installmentAmount: 850,
    installmentFreq: 'شهري',
    deliveryText: '2026',
    size: 48,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    floor: 18,
    totalFloors: 40,
    image: SHOWCASE_IMAGES.park,
    images: [
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.coast,
      SHOWCASE_IMAGES.chalet,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 12,
    isFeatured: true,
    boostTier: 'super_vip',
    docsVerified: true,
    viewsCount: 144,
  },
  {
    id: '10000303',
    code: 'U-30312',
    title: 'Archi Vake Residence',
    developer: 'Archi',
    area: 'Tbilisi - Vake',
    unitTypeLabel: 'شقة',
    category: 'exit',
    price: 54000,
    contractPrice: 112000,
    marketPrice: 129000,
    remainingAmount: 58000,
    gainAmount: 15600,
    negotiable: true,
    installmentAmount: 1100,
    installmentFreq: 'شهري',
    deliveryText: '2028',
    size: 79,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: 9,
    totalFloors: 18,
    image: SHOWCASE_IMAGES.villa,
    images: [
      SHOWCASE_IMAGES.villa,
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.interior,
    ],
    imagesCount: 9,
    isFeatured: true,
    boostTier: 'vip_plus',
    docsVerified: true,
    viewsCount: 64,
  },
  {
    id: '12000148',
    code: 'U-14820',
    title: 'Alpha Home Didi Digomi',
    developer: 'Alpha Home',
    area: 'Tbilisi - Didi Digomi',
    unitTypeLabel: 'شقة',
    category: 'exit',
    price: 31000,
    contractPrice: 76000,
    marketPrice: 85000,
    remainingAmount: 45000,
    gainAmount: 8050,
    negotiable: true,
    installmentAmount: 750,
    installmentFreq: 'شهري',
    deliveryText: '2026',
    size: 76,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: 7,
    totalFloors: 16,
    image: SHOWCASE_IMAGES.project,
    images: [
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.coast,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 12,
    isFeatured: false,
    boostTier: null,
    docsVerified: true,
    viewsCount: 70,
  },
]

export function getHomeCategoriesGrid(isAr: boolean) {
  return [
    {
      id: 'exit',
      label: isAr ? 'كل عروض التنازل' : 'All Exit Deals',
      icon: ShieldCheck,
      href: '/opportunities',
      color: 'bg-emerald-50 text-[#007a5a]',
    },
    {
      id: 'Apartment',
      label: isAr ? 'شقق بالتقسيط' : 'Apartments',
      icon: Building2,
      href: '/opportunities?type=Apartment',
      color: 'bg-blue-50 text-[#2563eb]',
    },
    {
      id: 'Private house',
      label: isAr ? 'منازل وفيلات' : 'Houses & Villas',
      icon: Home,
      href: '/opportunities?type=Private+house',
      color: 'bg-orange-50 text-[#ea580c]',
    },
    {
      id: 'Cottage',
      label: isAr ? 'أكواخ وشاليهات' : 'Cottages',
      icon: Trees,
      href: '/opportunities?type=Cottage',
      color: 'bg-green-50 text-green-600',
    },
    {
      id: 'Luxury',
      label: isAr ? 'عقارات فاخرة' : 'Luxury homes',
      icon: Gem,
      href: '/opportunities',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'Land',
      label: isAr ? 'قطع أراضٍ' : 'Land plots',
      icon: MapPin,
      href: '/opportunities?type=Land',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      id: 'Commercial',
      label: isAr ? 'تجاري وإداري' : 'Commercial',
      icon: Store,
      href: '/opportunities?type=Commercial',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'Ready',
      label: isAr ? 'استلام فوري' : 'Ready to move',
      icon: Calendar,
      href: '/opportunities',
      color: 'bg-rose-50 text-rose-500',
    },
    {
      id: 'Sea view',
      label: isAr ? 'إطلالة على البحر' : 'Sea view',
      icon: Waves,
      href: '/opportunities?area=Batumi+-+New+Boulevard',
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      id: 'Pool',
      label: isAr ? 'مع حمام سباحة' : 'With pool',
      icon: Sparkles,
      href: '/opportunities',
      color: 'bg-sky-50 text-sky-600',
    },
    {
      id: 'Jacuzzi',
      label: isAr ? 'مع جاكوزي' : 'With Jacuzzi',
      icon: Bath,
      href: '/opportunities',
      color: 'bg-orange-50 text-orange-500',
    },
    {
      id: 'Ski resorts',
      label: isAr ? 'منتجعات تزلج' : 'Ski resorts',
      icon: Mountain,
      href: '/opportunities?area=Gudauri',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'Pet friendly',
      label: isAr ? 'مجمعات سكنية' : 'Compounds',
      icon: PawPrint,
      href: '/opportunities',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'Workspace',
      label: isAr ? 'مكاتب وشركات' : 'Offices',
      icon: Briefcase,
      href: '/opportunities?type=Commercial',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'Hotel',
      label: isAr ? 'شقق فندقية' : 'Hotel units',
      icon: Hotel,
      href: '/opportunities?type=Hotel',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      id: 'New projects',
      label: isAr ? 'قيد الإنشاء' : 'Under construction',
      icon: Building,
      href: '/opportunities?delivery=Under+Construction',
      color: 'bg-blue-50 text-blue-600',
    },
  ]
}