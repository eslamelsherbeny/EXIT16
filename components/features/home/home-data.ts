import {
  Award,
  Bath,
  Briefcase,
  Building,
  Building2,
  Calculator,
  Calendar,
  Camera,
  FileText,
  Gem,
  Home,
  Hotel,
  MapPin,
  Mountain,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Trees,
  Waves,
} from 'lucide-react'

export type HomeUnitCardItem = {
  id: string
  title: string
  area: string
  category: 'exit' | 'sale' | 'rent_monthly' | 'rent_daily'
  price: number
  contractPrice?: number
  installmentAmount?: number
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

export function getLocalizedUnitTitle(
  unit: HomeUnitCardItem,
  locale: string,
  cleanArea: string
): string {
  if (locale !== 'ar') return unit.title
  const hasArabicChars = /[\u0600-\u06FF]/.test(unit.title)
  if (hasArabicChars) return cleanPureLocaleText(unit.title, 'ar')

  const catWord =
    unit.category === 'exit'
      ? 'للبيع شقة'
      : unit.category === 'rent_daily'
        ? 'إيجار يومي شقة'
        : unit.category === 'rent_monthly'
          ? 'للإيجار شقة'
          : 'للبيع شقة'

  return `${catWord} ${unit.bedrooms} غرف نوم · ${cleanArea}`
}

export const FALLBACK_SHOWCASE_UNITS: HomeUnitCardItem[] = [
  {
    id: '12000283',
    title: 'للبيع شقة 2 غرف نوم · ديغومي ماسيف، تبليسي',
    area: 'Tbilisi - Digomi Massive',
    category: 'exit',
    price: 493848,
    contractPrice: 540000,
    installmentAmount: 3200,
    size: 94,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: 11,
    totalFloors: 14,
    image: SHOWCASE_IMAGES.project,
    images: [
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 17,
    isFeatured: true,
    viewsCount: 82,
  },
  {
    id: '10000050',
    title: 'للبيع منزل 3 غرف نوم · متسخيتا، تبليسي',
    area: 'Tbilisi - Vake',
    category: 'sale',
    price: 480852,
    contractPrice: 480852,
    size: 170,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 3,
    floor: 2,
    totalFloors: 3,
    image: SHOWCASE_IMAGES.villa,
    images: [
      SHOWCASE_IMAGES.villa,
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.chalet,
    ],
    imagesCount: 11,
    isFeatured: true,
    viewsCount: 133,
  },
  {
    id: '10000046',
    title: 'للبيع منزل مستقل مع مسبح · سابورتالو، تبليسي',
    area: 'Tbilisi - Saburtalo',
    category: 'exit',
    price: 402876,
    contractPrice: 460000,
    installmentAmount: 2400,
    size: 120,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 1,
    floor: 1,
    totalFloors: 2,
    image: SHOWCASE_IMAGES.coast,
    images: [
      SHOWCASE_IMAGES.coast,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 11,
    isFeatured: true,
    viewsCount: 108,
  },
  {
    id: '10000091',
    title: 'للبيع أرض استثمارية بإطلالة بحرية · كوبوليتي، باتومي',
    area: 'Batumi - Chakvi / Green Cape',
    category: 'sale',
    price: 1247616,
    contractPrice: 1247616,
    size: 3000,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    floor: 1,
    totalFloors: 1,
    image: SHOWCASE_IMAGES.park,
    images: [
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.coast,
      SHOWCASE_IMAGES.chalet,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 14,
    isFeatured: true,
    viewsCount: 94,
  },
  {
    id: '12000194',
    title: 'إيجار يومي شقة فندقية · سابورتالو، تبليسي',
    area: 'Tbilisi - Saburtalo',
    category: 'rent_daily',
    price: 200,
    size: 70,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    floor: 11,
    totalFloors: 23,
    image: SHOWCASE_IMAGES.interior,
    images: [
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.park,
      SHOWCASE_IMAGES.coast,
    ],
    imagesCount: 15,
    isFeatured: true,
    viewsCount: 95,
  },
  {
    id: '12000172',
    title: 'للإيجار منزل 3 غرف نوم · ديدي ديغومي، تبليسي',
    area: 'Tbilisi - Didi Digomi',
    category: 'rent_monthly',
    price: 6498,
    size: 300,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    floor: 2,
    totalFloors: 4,
    image: SHOWCASE_IMAGES.chalet,
    images: [
      SHOWCASE_IMAGES.chalet,
      SHOWCASE_IMAGES.villa,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.park,
    ],
    imagesCount: 10,
    isFeatured: true,
    viewsCount: 69,
  },
  {
    id: '12000148',
    title: 'للبيع شقة بانورامية · البوليفارد الجديد، باتومي',
    area: 'Batumi - New Boulevard',
    category: 'exit',
    price: 185000,
    contractPrice: 245000,
    size: 68,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: 15,
    totalFloors: 28,
    image: SHOWCASE_IMAGES.coast,
    images: [
      SHOWCASE_IMAGES.coast,
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.villa,
    ],
    imagesCount: 12,
    isFeatured: true,
    viewsCount: 142,
  },
  {
    id: '12000112',
    title: 'للبيع شقة فاخرة · تبليسي القديمة',
    area: 'Tbilisi - Old Tbilisi',
    category: 'sale',
    price: 390000,
    contractPrice: 390000,
    size: 88,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 2,
    floor: 4,
    totalFloors: 6,
    image: SHOWCASE_IMAGES.project,
    images: [
      SHOWCASE_IMAGES.project,
      SHOWCASE_IMAGES.villa,
      SHOWCASE_IMAGES.interior,
      SHOWCASE_IMAGES.park,
    ],
    imagesCount: 9,
    isFeatured: true,
    viewsCount: 118,
  },
]

export function getHomeCategoriesGrid(isAr: boolean) {
  return [
    {
      id: 'exit',
      label: isAr ? 'تنازل وأقساط' : 'Installment Exit',
      icon: ShieldCheck,
      href: '/opportunities?category=exit',
      color: 'bg-emerald-50 text-[#007a5a]',
    },
    {
      id: 'Apartment',
      label: isAr ? 'شقق' : 'Apartments',
      icon: Building2,
      href: '/opportunities?type=Apartment',
      color: 'bg-blue-50 text-[#2563eb]',
    },
    {
      id: 'Private house',
      label: isAr ? 'منازل' : 'Houses',
      icon: Home,
      href: '/opportunities?type=Private+house',
      color: 'bg-orange-50 text-[#ea580c]',
    },
    {
      id: 'Cottage',
      label: isAr ? 'أكواخ' : 'Cottages',
      icon: Trees,
      href: '/opportunities?type=Cottage',
      color: 'bg-green-50 text-green-600',
    },
    {
      id: 'Luxury',
      label: isAr ? 'عقارات فاخرة' : 'Luxury homes',
      icon: Gem,
      href: '/opportunities?category=sale',
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
      label: isAr ? 'تجاري' : 'Commercial',
      icon: Store,
      href: '/opportunities?type=Commercial',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'rent_daily',
      label: isAr ? 'شقق يومية' : 'Daily apartments',
      icon: Calendar,
      href: '/opportunities?category=rent_daily',
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
      href: '/opportunities?category=sale',
      color: 'bg-sky-50 text-sky-600',
    },
    {
      id: 'Jacuzzi',
      label: isAr ? 'مع جاكوزي' : 'With Jacuzzi',
      icon: Bath,
      href: '/opportunities?category=rent_daily',
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
      label: isAr ? 'مسموح بالحيوانات' : 'Pet friendly',
      icon: PawPrint,
      href: '/opportunities?category=rent_monthly',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'Workspace',
      label: isAr ? 'مساحة عمل' : 'Workspace',
      icon: Briefcase,
      href: '/opportunities?type=Commercial',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'Hotel',
      label: isAr ? 'فنادق' : 'Hotels',
      icon: Hotel,
      href: '/opportunities?type=Hotel',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      id: 'New projects',
      label: isAr ? 'مشاريع جديدة' : 'New projects',
      icon: Building,
      href: '/opportunities?delivery=Under+Construction',
      color: 'bg-blue-50 text-blue-600',
    },
  ]
}

export function getHomeToolsList(isAr: boolean) {
  return [
    {
      title: isAr ? 'حاسبة التنازل والأقساط' : 'Installment Exit Calculator',
      desc: isAr
        ? 'احسب قيمة المبلغ المسترد والأقساط المتبقية بدقة.'
        : 'Calculate your exact cash recovery and remaining installments.',
      icon: Calculator,
      color: 'bg-emerald-50 text-[#007a5a]',
      href: '/calculator',
    },
    {
      title: isAr ? 'ميزانية التشطيب' : 'Renovation Budget',
      desc: isAr
        ? 'تقدير تكلفة تحويل الشقة من الإطار الأسود أو الأبيض إلى التشطيب الكامل.'
        : 'Estimate White Frame to Turnkey finishing costs.',
      icon: Sparkles,
      color: 'bg-orange-50 text-[#ea580c]',
      href: '/calculator',
    },
    {
      title: isAr ? 'أسعار السوق في جورجيا' : 'Georgia Market Prices',
      desc: isAr
        ? 'متوسط سعر المتر المربع حسب الحي من الإعلانات الحقيقية النشطة.'
        : 'Average price per m² by district from active verified listings.',
      icon: TrendingUp,
      color: 'bg-blue-50 text-[#2563eb]',
      href: '/reports',
    },
    {
      title: isAr ? 'تصوير وجولة ثلاثية الأبعاد' : 'Photo & 3D Tour',
      desc: isAr
        ? 'تصوير عقاري احترافي وجولة افتراضية لبيع أو تأجير وحدتك أسرع.'
        : 'Professional photography and 3D virtual tour for your property.',
      icon: Camera,
      color: 'bg-purple-50 text-purple-600',
      href: '/sell',
    },
    {
      title: isAr ? 'تقييم السعر العادل' : 'Fair Price Valuation',
      desc: isAr
        ? 'مرجع القيمة السوقية ومقارنة وحدتك مع إعلانات مشابهة في نفس المنطقة.'
        : 'Market value benchmark compared with similar active units.',
      icon: Award,
      color: 'bg-indigo-50 text-indigo-600',
      href: '/calculator',
    },
    {
      title: isAr ? 'قوالب العقود المعتمدة' : 'Verified Contract Templates',
      desc: isAr
        ? 'نماذج عقود التنازل والبيع والإيجار المعتمدة في السجل العقاري الجورجي.'
        : 'Ready legal templates for installment assignment, sale, and rent.',
      icon: FileText,
      color: 'bg-cyan-50 text-cyan-600',
      href: '/how-it-works',
    },
  ]
}