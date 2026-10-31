'use client'

import {
  Building2,
  Calendar,
  Home,
  Hotel,
  KeyRound,
  MapPin,
  ShieldCheck,
  Store,
  Trees,
} from 'lucide-react'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  type GeorgiaAreaItem,
} from '@/components/shared/georgia-areas'
import {
  DICTIONARIES,
  getCurrencySymbol,
  type Dictionary,
  type LocaleCode,
} from '@/lib/i18n'

export type PlatformCountryCode = 'EG' | 'RU' | 'GE' | 'AE'

export type DealCategory =
  | 'exit'
  | 'sale'
  | 'rent_monthly'
  | 'rent_daily'

export type LocalizedOptionItem<T = string> = {
  id: T
  ar: string
  en: string
  ru: string
  ka: string
  subAr?: string
  subEn?: string
  subRu?: string
  subKa?: string
  icon?: any
  badgeAr?: string
  badgeEn?: string
  badgeRu?: string
  badgeKa?: string
  titleAr?: string
  titleEn?: string
  labelAr?: string
  labelEn?: string
}

export function toEnglishDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

export function getOptionLabel(
  item: { ar: string; en: string; ru?: string; ka?: string },
  locale: LocaleCode = 'ar'
): string {
  if (locale === 'ar') return item.ar
  if (locale === 'ru') return item.ru || item.en
  if (locale === 'ka') return item.ka || item.en
  return item.en
}

export function getOptionSub(
  item: { subAr?: string; subEn?: string; subRu?: string; subKa?: string },
  locale: LocaleCode = 'ar'
): string {
  if (locale === 'ar') return item.subAr || ''
  if (locale === 'ru') return item.subRu || item.subEn || ''
  if (locale === 'ka') return item.subKa || item.subEn || ''
  return item.subEn || ''
}

export const DEAL_TYPES: Array<LocalizedOptionItem<DealCategory>> = [
  {
    id: 'exit',
    ar: 'تنازل واستكمال أقساط',
    en: 'Installment Exit',
    ru: 'Переуступка рассрочки',
    ka: 'განვადების გადაბარება',
    subAr: 'استرد ما دفعته ويكمل المشتري الأقساط',
    subEn: 'Recover paid cash · Buyer continues',
    subRu: 'Верните вложенное без комиссии',
    subKa: 'დაიბრუნეთ გადახდილი თანხა',
    titleAr: 'تنازل واستكمال أقساط',
    titleEn: 'Installment Exit',
    icon: ShieldCheck,
  },
  {
    id: 'sale',
    ar: 'للبيع',
    en: 'For sale',
    ru: 'Продажа',
    ka: 'იყიდება',
    subAr: 'بيع العقار مباشرة',
    subEn: 'Sell the property',
    subRu: 'Прямая продажа объекта',
    subKa: 'ქონების გაყიდვა',
    titleAr: 'للبيع',
    titleEn: 'For sale',
    icon: Home,
  },
  {
    id: 'rent_monthly',
    ar: 'للإيجار',
    en: 'For rent',
    ru: 'Аренда',
    ka: 'ქირავდება',
    subAr: 'إيجار طويل الأمد، شهرياً',
    subEn: 'Long-term, monthly',
    subRu: 'Долгосрочная, помесячно',
    subKa: 'გრძელვადიანი, თვიურად',
    titleAr: 'للإيجار',
    titleEn: 'For rent',
    icon: KeyRound,
  },
  {
    id: 'rent_daily',
    ar: 'إيجار يومي',
    en: 'Daily rent',
    ru: 'Посуточно',
    ka: 'დღიურად',
    subAr: 'بالليلة، للضيوف والسياح',
    subEn: 'Per night, for guests',
    subRu: 'Посуточно для гостей',
    subKa: 'დღიურად სტუმრებისთვის',
    titleAr: 'إيجار يومي',
    titleEn: 'Daily rent',
    icon: Calendar,
  },
]

export const PROPERTY_KINDS: Array<LocalizedOptionItem<string>> = [
  {
    id: 'Apartment',
    ar: 'شقة',
    en: 'Apartment',
    ru: 'Квартира',
    ka: 'ბინა',
    labelAr: 'شقة',
    labelEn: 'Apartment',
    icon: Building2,
  },
  {
    id: 'Private house',
    ar: 'منزل مستقل',
    en: 'Private house',
    ru: 'Частный дом',
    ka: 'კერძო სახლი',
    labelAr: 'منزل مستقل',
    labelEn: 'Private house',
    icon: Home,
  },
  {
    id: 'Cottage',
    ar: 'كوخ / شاليه',
    en: 'Cottage',
    ru: 'Коттедж',
    ka: 'კოტეჯი',
    labelAr: 'كوخ / شاليه',
    labelEn: 'Cottage',
    icon: Trees,
  },
  {
    id: 'Land',
    ar: 'أرض',
    en: 'Land',
    ru: 'Участок',
    ka: 'მიწის ნაკვეთი',
    labelAr: 'أرض',
    labelEn: 'Land',
    icon: MapPin,
  },
  {
    id: 'Commercial',
    ar: 'تجاري',
    en: 'Commercial',
    ru: 'Коммерческая',
    ka: 'კომერციული',
    labelAr: 'تجاري',
    labelEn: 'Commercial',
    icon: Store,
  },
  {
    id: 'Hotel',
    ar: 'فندق',
    en: 'Hotel',
    ru: 'Отель',
    ka: 'სასტუმრო',
    labelAr: 'فندق',
    labelEn: 'Hotel',
    icon: Hotel,
  },
]

export const CONDITION_OPTIONS: Array<LocalizedOptionItem<string>> = [
  {
    id: 'Newly renovated',
    ar: 'تشطيب جديد',
    en: 'Newly renovated',
    ru: 'Новый ремонт',
    ka: 'ახალი გარემონტებული',
    labelAr: 'تشطيب جديد',
    labelEn: 'Newly renovated',
  },
  {
    id: 'Old renovation',
    ar: 'تشطيب قديم',
    en: 'Old renovation',
    ru: 'Старый ремонт',
    ka: 'ძველი რემონტით',
    labelAr: 'تشطيب قديم',
    labelEn: 'Old renovation',
  },
  {
    id: 'Under renovation',
    ar: 'قيد التشطيب',
    en: 'Under renovation',
    ru: 'В процессе ремонта',
    ka: 'მიმდინარე რემონტი',
    labelAr: 'قيد التشطيب',
    labelEn: 'Under renovation',
  },
  {
    id: 'Needs renovation',
    ar: 'يحتاج تجديد',
    en: 'Needs renovation',
    ru: 'Требует ремонта',
    ka: 'სარემონტო',
    labelAr: 'يحتاج تجديد',
    labelEn: 'Needs renovation',
  },
  {
    id: 'White frame',
    ar: 'إطار أبيض',
    en: 'White frame',
    ru: 'Белый каркас',
    ka: 'თეთრი კარკასი',
    labelAr: 'إطار أبيض',
    labelEn: 'White frame',
  },
  {
    id: 'Black frame',
    ar: 'إطار أسود',
    en: 'Black frame',
    ru: 'Черный каркас',
    ka: 'შავი კარკასი',
    labelAr: 'إطار أسود',
    labelEn: 'Black frame',
  },
  {
    id: 'Green frame',
    ar: 'إطار أخضر',
    en: 'Green frame',
    ru: 'Зеленый каркас',
    ka: 'მწვანე კარკასი',
    labelAr: 'إطار أخضر',
    labelEn: 'Green frame',
  },
  {
    id: 'White plus',
    ar: 'وايت بلس',
    en: 'White plus',
    ru: 'Белый плюс',
    ka: 'თეთრი პლუსი',
    labelAr: 'وايت بلس',
    labelEn: 'White plus',
  },
]

export const BUILDING_SERIES = [
  'Non-standard',
  'Leningrad',
  'Lvov',
  'Kiev',
  'Tbilisi yard',
  'Moscow',
  'City type',
  'Czech',
  'Khrushchev',
  'Tukhareli',
  'Vedzisi',
  'Yugoslav',
  'Metromsheni',
  'Kavlashvili',
  'Other',
]

export const FLOOR_TYPES: Array<LocalizedOptionItem<string>> = [
  {
    id: 'Standard',
    ar: 'طابق قياسي',
    en: 'Standard',
    ru: 'Стандартный',
    ka: 'სტანდარტული',
    labelAr: 'طابق قياسي',
    labelEn: 'Standard',
  },
  {
    id: 'Duplex',
    ar: 'دوبلكس',
    en: 'Duplex',
    ru: 'Дуплекс',
    ka: 'დუპლექსი',
    labelAr: 'دوبلكس',
    labelEn: 'Duplex',
  },
  {
    id: 'Triplex',
    ar: 'تريبلكس',
    en: 'Triplex',
    ru: 'Триплекс',
    ka: 'ტრიპლექსი',
    labelAr: 'تريبلكس',
    labelEn: 'Triplex',
  },
  {
    id: 'Attic',
    ar: 'علية / روف',
    en: 'Attic',
    ru: 'Мансарда',
    ka: 'მანსარდა',
    labelAr: 'علية / روف',
    labelEn: 'Attic',
  },
]

export const HEATING_TYPES: Array<LocalizedOptionItem<string>> = [
  {
    id: 'Central',
    ar: 'تدفئة مركزية',
    en: 'Central',
    ru: 'Центральное',
    ka: 'ცენტრალური',
    labelAr: 'تدفئة مركزية',
    labelEn: 'Central',
  },
  {
    id: 'Own gas boiler',
    ar: 'غلاية غاز خاصة',
    en: 'Own gas boiler',
    ru: 'Газовый котел',
    ka: 'ინდივიდუალური გაზის',
    labelAr: 'غلاية غاز خاصة',
    labelEn: 'Own gas boiler',
  },
  {
    id: 'Electric',
    ar: 'كهربائية',
    en: 'Electric',
    ru: 'Электрическое',
    ka: 'ელექტრო',
    labelAr: 'كهربائية',
    labelEn: 'Electric',
  },
  {
    id: 'None',
    ar: 'بدون تدفئة',
    en: 'None',
    ru: 'Без отопления',
    ka: 'გათბობის გარეშე',
    labelAr: 'بدون تدفئة',
    labelEn: 'None',
  },
]

export const BUILDING_MATERIALS: Array<LocalizedOptionItem<string>> = [
  {
    id: 'Monolithic concrete',
    ar: 'خرسانة مسلحة',
    en: 'Monolithic concrete',
    ru: 'Монолит',
    ka: 'მონოლითი',
    labelAr: 'خرسانة مسلحة',
    labelEn: 'Monolithic concrete',
  },
  {
    id: 'Brick',
    ar: 'طوب',
    en: 'Brick',
    ru: 'Кирпич',
    ka: 'აგური',
    labelAr: 'طوب',
    labelEn: 'Brick',
  },
  {
    id: 'Block',
    ar: 'بلوك',
    en: 'Block',
    ru: 'Блок',
    ka: 'ბლოკი',
    labelAr: 'بلوك',
    labelEn: 'Block',
  },
  {
    id: 'Panel',
    ar: 'بانل',
    en: 'Panel',
    ru: 'Панель',
    ka: 'პანელი',
    labelAr: 'بانل',
    labelEn: 'Panel',
  },
  {
    id: 'Mixed',
    ar: 'مختلط',
    en: 'Mixed',
    ru: 'Смешанный',
    ka: 'შერეული',
    labelAr: 'مختلط',
    labelEn: 'Mixed',
  },
]

export const SIVRCE_FEATURE_GROUPS = [
  {
    key: 'space',
    ar: 'المساحات والتقسيم',
    en: 'Space',
    ru: 'Планировка',
    ka: 'სივრცე',
    labelAr: 'المساحات والتقسيم',
    labelEn: 'Space',
    items: [
      { id: 'Balcony', ar: 'شرفة', en: 'Balcony', ru: 'Балкон', ka: 'აივანი', labelAr: 'شرفة', labelEn: 'Balcony' },
      { id: 'Loggia', ar: 'لوجيا', en: 'Loggia', ru: 'Лоджия', ka: 'ლოჯია', labelAr: 'لوجيا', labelEn: 'Loggia' },
      { id: 'Terrace', ar: 'تراس مفتوح', en: 'Terrace', ru: 'Терраса', ka: 'ტერასა', labelAr: 'تراس مفتوح', labelEn: 'Terrace' },
      { id: 'Yard', ar: 'حديقة خاصة', en: 'Yard', ru: 'Двор', ka: 'ეზო', labelAr: 'حديقة خاصة', labelEn: 'Yard' },
      { id: 'Storage', ar: 'غرفة تخزين', en: 'Storage', ru: 'Кладовая', ka: 'სათავსო', labelAr: 'غرفة تخزين', labelEn: 'Storage' },
      { id: 'Cellar', ar: 'قبو', en: 'Cellar', ru: 'Подвал', ka: 'სარდაფი', labelAr: 'قبو', labelEn: 'Cellar' },
      { id: 'Walk-in closet', ar: 'غرفة ملابس', en: 'Walk-in closet', ru: 'Гардеробная', ka: 'საგარდერობო', labelAr: 'غرفة ملابس', labelEn: 'Walk-in closet' },
      { id: 'Separate kitchen', ar: 'مطبخ منفصل', en: 'Separate kitchen', ru: 'Отдельная кухня', ka: 'იზოლირებული სამზარეულო', labelAr: 'مطبخ منفصل', labelEn: 'Separate kitchen' },
    ],
  },
  {
    key: 'building',
    ar: 'المبنى والحماية',
    en: 'Building',
    ru: 'Здание и безопасность',
    ka: 'შენობა',
    labelAr: 'المبنى والحماية',
    labelEn: 'Building',
    items: [
      { id: 'Elevator', ar: 'مصعد', en: 'Elevator', ru: 'Лифт', ka: 'ლიფტი', labelAr: 'مصعد', labelEn: 'Elevator' },
      { id: 'Parking', ar: 'موقف سيارات', en: 'Parking', ru: 'Парковка', ka: 'პარკინგი', labelAr: 'موقف سيارات', labelEn: 'Parking' },
      { id: 'Underground parking', ar: 'جراج تحت الأرض', en: 'Underground parking', ru: 'Подземный паркинг', ka: 'მიწისქვეშა პარკინგი', labelAr: 'جراج تحت الأرض', labelEn: 'Underground parking' },
      { id: 'Garage', ar: 'جراج خاص', en: 'Garage', ru: 'Гараж', ka: 'ავტოფარეხი', labelAr: 'جراج خاص', labelEn: 'Garage' },
      { id: 'Security', ar: 'أمن وحراسة', en: 'Security', ru: 'Охрана', ka: 'დაცვა', labelAr: 'أمن وحراسة', labelEn: 'Security' },
      { id: 'Concierge', ar: 'كونسيرج', en: 'Concierge', ru: 'Консьерж', ka: 'კონსიერჟი', labelAr: 'كونسيرج', labelEn: 'Concierge' },
      { id: 'Intercom', ar: 'إنتركم', en: 'Intercom', ru: 'Домофон', ka: 'დომოფონი', labelAr: 'إنتركم', labelEn: 'Intercom' },
      { id: 'Backup generator', ar: 'مولد احتياطي', en: 'Backup generator', ru: 'Генератор', ka: 'გენერატორი', labelAr: 'مولد احتياطي', labelEn: 'Backup generator' },
      { id: 'Iron door', ar: 'باب مصفح', en: 'Iron door', ru: 'Железная дверь', ka: 'რკინის კარი', labelAr: 'باب مصفح', labelEn: 'Iron door' },
      { id: 'Double glazing', ar: 'زجاج مزدوج عازل', en: 'Double glazing', ru: 'Стеклопакет', ka: 'მეტალოპლასტმასის ფანჯრები', labelAr: 'زجاج مزدوج عازل', labelEn: 'Double glazing' },
      { id: 'Penthouse', ar: 'بنتهاوس', en: 'Penthouse', ru: 'Пентхаус', ka: 'პენტჰაუსი', labelAr: 'بنتهاوس', labelEn: 'Penthouse' },
      { id: 'Step-free access', ar: 'مدخل لذوي الهمم', en: 'Step-free access', ru: 'Безбарьерный вход', ka: 'ადაპტირებული შესასვლელი', labelAr: 'مدخل لذوي الهمم', labelEn: 'Step-free access' },
    ],
  },
  {
    key: 'utilities',
    ar: 'المرافق الأساسية',
    en: 'Utilities',
    ru: 'Коммуникации',
    ka: 'კომუნიკაციები',
    labelAr: 'المرافق الأساسية',
    labelEn: 'Utilities',
    items: [
      { id: 'Underfloor heating', ar: 'تدفئة أرضية', en: 'Underfloor heating', ru: 'Теплый пол', ka: 'იატაკის გათბობა', labelAr: 'تدفئة أرضية', labelEn: 'Underfloor heating' },
      { id: 'Natural gas', ar: 'غاز طبيعي', en: 'Natural gas', ru: 'Природный газ', ka: 'ბუნებრივი აირი', labelAr: 'غاز طبيعي', labelEn: 'Natural gas' },
      { id: 'Hot water', ar: 'مياه ساخنة', en: 'Hot water', ru: 'Горячая вода', ka: 'ცხელი წყალი', labelAr: 'مياه ساخنة', labelEn: 'Hot water' },
      { id: 'Internet', ar: 'إنترنت فايبر', en: 'Internet', ru: 'Интернет', ka: 'ინტერნეტი', labelAr: 'إنترنت فايبر', labelEn: 'Internet' },
      { id: 'Cable TV', ar: 'تلفاز كابل', en: 'Cable TV', ru: 'Кабельное ТВ', ka: 'საკაბელო ტელევიზია', labelAr: 'تلفاز كابل', labelEn: 'Cable TV' },
    ],
  },
  {
    key: 'comfort',
    ar: 'الراحة والأجهزة',
    en: 'Comfort',
    ru: 'Комфорт и техника',
    ka: 'კომფორტი',
    labelAr: 'الراحة والأجهزة',
    labelEn: 'Comfort',
    items: [
      { id: 'Furniture', ar: 'مفروش بالكامل', en: 'Furniture', ru: 'Мебель', ka: 'ავეჯი', labelAr: 'مفروش بالكامل', labelEn: 'Furniture' },
      { id: 'Appliances', ar: 'أجهزة كهربائية', en: 'Appliances', ru: 'Бытовая техника', ka: 'ტექნიკა', labelAr: 'أجهزة كهربائية', labelEn: 'Appliances' },
      { id: 'Air conditioning', ar: 'تكييف هواء', en: 'Air conditioning', ru: 'Кондиционер', ka: 'კონდიციონერი', labelAr: 'تكييف هواء', labelEn: 'Air conditioning' },
      { id: 'Dishwasher', ar: 'غسالة أطباق', en: 'Dishwasher', ru: 'Посудомоечная машина', ka: 'ჭურჭლის სარეცხი მანქანა', labelAr: 'غسالة أطباق', labelEn: 'Dishwasher' },
      { id: 'Washing machine', ar: 'غسالة ملابس', en: 'Washing machine', ru: 'Стиральная машина', ka: 'სარეცხი მანქანა', labelAr: 'غسالة ملابس', labelEn: 'Washing machine' },
      { id: 'Dryer', ar: 'مجفف ملابس', en: 'Dryer', ru: 'Сушильная машина', ka: 'საშრობი', labelAr: 'مجفف ملابس', labelEn: 'Dryer' },
      { id: 'Fireplace', ar: 'مدفأة', en: 'Fireplace', ru: 'Камин', ka: 'ბუხარი', labelAr: 'مدفأة', labelEn: 'Fireplace' },
      { id: 'Kitchen', ar: 'مطبخ مجهز', en: 'Kitchen', ru: 'Кухонный гарнитур', ka: 'სამზარეულო', labelAr: 'مطبخ مجهز', labelEn: 'Kitchen' },
      { id: 'TV', ar: 'تلفاز ذكي', en: 'TV', ru: 'Телевизор', ka: 'ტელევიზორი', labelAr: 'تلفاز ذكي', labelEn: 'TV' },
    ],
  },
  {
    key: 'views',
    ar: 'الإطلالة والإضاءة',
    en: 'Views',
    ru: 'Вид из окон',
    ka: 'ხედები',
    labelAr: 'الإطلالة والإضاءة',
    labelEn: 'Views',
    items: [
      { id: 'Panoramic view', ar: 'إطلالة بانورامية', en: 'Panoramic view', ru: 'Панорамный вид', ka: 'პანორამული ხედი', labelAr: 'إطلالة بانورامية', labelEn: 'Panoramic view' },
      { id: 'Sea view', ar: 'إطلالة بحرية', en: 'Sea view', ru: 'Вид на море', ka: 'ზღვის ხედი', labelAr: 'إطلالة بحرية', labelEn: 'Sea view' },
      { id: 'Mountain view', ar: 'إطلالة جبلية', en: 'Mountain view', ru: 'Вид на горы', ka: 'მთის ხედი', labelAr: 'إطلالة جبلية', labelEn: 'Mountain view' },
      { id: 'Yard view', ar: 'إطلالة على الحديقة', en: 'Yard view', ru: 'Вид во двор', ka: 'ეზოს ხედი', labelAr: 'إطلالة على الحديقة', labelEn: 'Yard view' },
      { id: 'Street view', ar: 'إطلالة على الشارع', en: 'Street view', ru: 'Вид на улицу', ka: 'ქუჩის ხედი', labelAr: 'إطلالة على الشارع', labelEn: 'Street view' },
      { id: 'Beachfront', ar: 'صف أول على البحر', en: 'Beachfront', ru: 'Первая линия', ka: 'პირველი ზოლი', labelAr: 'صف أول على البحر', labelEn: 'Beachfront' },
      { id: 'Bright', ar: 'مشمس ومضيء', en: 'Bright', ru: 'Светлая', ka: 'ნათელი', labelAr: 'مشمس ومضيء', labelEn: 'Bright' },
      { id: 'Quiet', ar: 'منطقة هادئة', en: 'Quiet', ru: 'Тихий район', ka: 'მშვიდი გარემო', labelAr: 'منطقة هادئة', labelEn: 'Quiet' },
    ],
  },
  {
    key: 'extra',
    ar: 'مميزات إضافية',
    en: 'Extra',
    ru: 'Дополнительно',
    ka: 'დამატებითი',
    labelAr: 'مميزات إضافية',
    labelEn: 'Extra',
    items: [
      { id: 'Pool', ar: 'حمام سباحة', en: 'Pool', ru: 'Бассейн', ka: 'აუზი', labelAr: 'حمام سباحة', labelEn: 'Pool' },
      { id: 'Jacuzzi', ar: 'جاكوزي', en: 'Jacuzzi', ru: 'Джакузи', ka: 'ჯაკუზი', labelAr: 'جاكوزي', labelEn: 'Jacuzzi' },
      { id: 'Sauna', ar: 'ساونا', en: 'Sauna', ru: 'Сауна', ka: 'საუნა', labelAr: 'ساونا', labelEn: 'Sauna' },
      { id: 'Gym', ar: 'صالة رياضية', en: 'Gym', ru: 'Тренажерный зал', ka: 'სპორტდარბაზი', labelAr: 'صالة رياضية', labelEn: 'Gym' },
      { id: 'BBQ grill', ar: 'منطقة شواء', en: 'BBQ grill', ru: 'Зона барбекю', ka: 'ბარბექიუ', labelAr: 'منطقة شواء', labelEn: 'BBQ grill' },
      { id: 'EV charger', ar: 'شاحن سيارات كهربائية', en: 'EV charger', ru: 'Зарядка для электромобиля', ka: 'ელექტრომობილის დამტენი', labelAr: 'شاحن سيارات كهربائية', labelEn: 'EV charger' },
      { id: 'Ski access', ar: 'قريب من مسارات التزلج', en: 'Ski access', ru: 'Рядом с горнолыжным спуском', ka: 'სათხილამურო ტრასასთან', labelAr: 'قريب من مسارات التزلج', labelEn: 'Ski access' },
    ],
  },
] as const

export type PlatformCountryOption = {
  code: PlatformCountryCode | string
  nameAr: string
  nameEn: string
  nameRu?: string
  nameKa?: string
  flag: string
  currencySymbol: string
  phoneCode: string
  defaultPackages?: {
    days7: number
    days14: number
    days30: number
  }
}

export const PLATFORM_COUNTRIES: PlatformCountryOption[] = [
  {
    code: 'GE',
    nameAr: 'جورجيا',
    nameEn: 'Georgia',
    nameRu: 'Грузия',
    nameKa: 'საქართველო',
    flag: '🇬🇪',
    currencySymbol: '$',
    phoneCode: '995',
    defaultPackages: { days7: 29, days14: 49, days30: 69 },
  },
  {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    nameRu: 'Египет',
    nameKa: 'ეგვიპტე',
    flag: '🇪🇬',
    currencySymbol: 'ج.م',
    phoneCode: '20',
    defaultPackages: { days7: 1199, days14: 1999, days30: 2799 },
  },
  {
    code: 'RU',
    nameAr: 'روسيا',
    nameEn: 'Russia',
    nameRu: 'Россия',
    nameKa: 'რუსეთი',
    flag: '🇷🇺',
    currencySymbol: '₽',
    phoneCode: '7',
    defaultPackages: { days7: 2500, days14: 4200, days30: 5900 },
  },
  {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'UAE',
    nameRu: 'ОАЭ',
    nameKa: 'საამიროები',
    flag: '🇦🇪',
    currencySymbol: 'د.إ',
    phoneCode: '971',
    defaultPackages: { days7: 99, days14: 179, days30: 249 },
  },
]

export const ALL_RESIDENCE_COUNTRIES: PlatformCountryOption[] = [
  ...PLATFORM_COUNTRIES,
  {
    code: 'SA',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    nameRu: 'Саудовская Аравия',
    nameKa: 'საუდის არაბეთი',
    flag: '🇸🇦',
    currencySymbol: 'ر.س',
    phoneCode: '966',
  },
  {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    nameRu: 'Кувейт',
    nameKa: 'ქუვეითი',
    flag: '🇰🇼',
    currencySymbol: 'د.ك',
    phoneCode: '965',
  },
  {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    nameRu: 'Катар',
    nameKa: 'ყატარი',
    flag: '🇶🇦',
    currencySymbol: 'ر.ق',
    phoneCode: '974',
  },
  {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    nameRu: 'Бахрейн',
    nameKa: 'ბაჰრეინი',
    flag: '🇧🇭',
    currencySymbol: 'د.ب',
    phoneCode: '973',
  },
  {
    code: 'OM',
    nameAr: 'عمان',
    nameEn: 'Oman',
    nameRu: 'Оман',
    nameKa: 'ომანი',
    flag: '🇴🇲',
    currencySymbol: 'ر.ع',
    phoneCode: '968',
  },
  {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    nameRu: 'Иордания',
    nameKa: 'იორდანია',
    flag: '🇯🇴',
    currencySymbol: 'د.أ',
    phoneCode: '962',
  },
  {
    code: 'TR',
    nameAr: 'تركيا',
    nameEn: 'Turkey',
    nameRu: 'Турция',
    nameKa: 'თურქეთი',
    flag: '🇹🇷',
    currencySymbol: '₺',
    phoneCode: '90',
  },
  {
    code: 'US',
    nameAr: 'أمريكا / كندا',
    nameEn: 'USA / Canada',
    nameRu: 'США / Канада',
    nameKa: 'აშშ / კანადა',
    flag: '🇺🇸',
    currencySymbol: '$',
    phoneCode: '1',
  },
  {
    code: 'GB',
    nameAr: 'بريطانيا',
    nameEn: 'UK',
    nameRu: 'Великобритания',
    nameKa: 'დიდი ბრიტანეთი',
    flag: '🇬🇧',
    currencySymbol: '£',
    phoneCode: '44',
  },
]

export function getLocalizedCountryName(
  country: PlatformCountryOption,
  locale: LocaleCode = 'ar'
): string {
  const dictCountries = (
    DICTIONARIES[locale]?.admin?.propertiesAdmin as Record<string, any>
  )?.countries
  if (dictCountries?.[country.code]) return dictCountries[country.code]
  if (locale === 'ar') return country.nameAr
  if (locale === 'ru') return country.nameRu || country.nameEn
  if (locale === 'ka') return country.nameKa || country.nameEn
  return country.nameEn
}

export function normalizeArabicText(str: string) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
}

export function getHeaderCookieCountry(): PlatformCountryCode {
  return 'GE'
}

export function getCountryConfig(countryCode?: string): PlatformCountryOption {
  return (
    PLATFORM_COUNTRIES.find(
      (c) => c.code === (countryCode || 'GE').toUpperCase()
    ) || PLATFORM_COUNTRIES[0]
  )
}

export function getCurrencyByCountry(
  countryCode?: string,
  locale?: LocaleCode
) {
  return getCurrencySymbol(countryCode || 'GE', locale)
}

const UNIT_TYPES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: [
    'شقة',
    'استوديو (Studio)',
    'دوبلكس',
    'بنتهاوس',
    'تاون هاوس',
    'فيلا مستقلة',
    'شقة فندقية (Aparthotel)',
    'شاليه جبلي / بحري',
    'مكتب تجاري',
    'محل تجاري',
    'أرض',
  ],
  en: [
    'Apartment',
    'Studio',
    'Duplex',
    'Penthouse',
    'Townhouse',
    'Standalone Villa',
    'Aparthotel',
    'Mountain / Sea Chalet',
    'Commercial Office',
    'Retail Shop',
    'Land',
  ],
  ru: [
    'Квартира',
    'Студия (Studio)',
    'Дуплекс',
    'Пентхаус',
    'Таунхаус',
    'Отдельная вилла',
    'Апарт-отель (Aparthotel)',
    'Горное / Морское шале',
    'Коммерческий офис',
    'Торговое помещение',
    'Земельный участок',
  ],
  ka: [
    'ბინა',
    'სტუდიო (Studio)',
    'დუპლექსი',
    'პენტჰაუსი',
    'თაუნჰაუსი',
    'კერძო ვილა',
    'აპარტ-ოტელი (Aparthotel)',
    'მთის / ზღვის შალე',
    'კომერციული ოფისი',
    'სავაჭრო ფართი',
    'მიწის ნაკვეთი',
  ],
}

const FINISHINGS_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: [
    'تشطيب كامل (Turnkey)',
    'بالفرش والأجهزة (Fully Furnished)',
    'نصف تشطيب — إطار أبيض (White Frame)',
    'على الطوب — إطار أسود (Black Frame)',
    'إطار أخضر (Green Frame)',
  ],
  en: [
    'Turnkey (Full Finishing)',
    'Fully Furnished & Equipped',
    'White Frame (Semi-Finished)',
    'Black Frame (Core & Shell)',
    'Green Frame',
  ],
  ru: [
    'Под ключ (Turnkey)',
    'С мебелью и техникой (Fully Furnished)',
    'Белый каркас (White Frame)',
    'Черный каркас (Black Frame)',
    'Зеленый каркас (Green Frame)',
  ],
  ka: [
    'სრული რემონტით (Turnkey)',
    'ავეჯით და ტექნიკით (Fully Furnished)',
    'თეთრი კარკასი (White Frame)',
    'შავი კარკასი (Black Frame)',
    'მწვანე კარკასი (Green Frame)',
  ],
}

const DELIVERIES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: ['جاهزة للاستلام', 'تحت الإنشاء'],
  en: ['Ready to Move', 'Under Construction'],
  ru: ['Готово к заселению', 'Строится'],
  ka: ['მზადაა შესასვლელად', 'მშენებარე'],
}

const FEATURES_BY_LOCALE: Record<LocaleCode, string[]> = {
  ar: [
    'إطلالة بحرية (Sea View)',
    'إطلالة جبلية (Mountain View)',
    'إطلالة بانورامية على المدينة',
    'حمام سباحة',
    'تدفئة مركزية / أرضية',
    'أمن واستقبال 24 ساعة',
    'جراج سيارات تحت الأرض',
    'شرفة واسعة (Balcony)',
    'قريبة من المترو والخدمات',
  ],
  en: [
    'Sea View',
    'Mountain View',
    'Panoramic City View',
    'Swimming Pool',
    'Central / Underfloor Heating',
    '24/7 Security & Reception',
    'Underground Parking',
    'Spacious Balcony',
    'Near Metro & Amenities',
  ],
  ru: [
    'Вид на море (Sea View)',
    'Вид на горы (Mountain View)',
    'Панорамный вид на город',
    'Бассейн',
    'Центральное / Подогрев полов',
    'Охрана и ресепшн 24/7',
    'Подземный паркинг',
    'Просторный балкон',
    'Рядом с метро и инфраструктурой',
  ],
  ka: [
    'ზღვის ხედი (Sea View)',
    'მთის ხედი (Mountain View)',
    'პანორამული ხედი ქალაქზე',
    'აუზი',
    'ცენტრალური / იატაკის გათბობა',
    '24/7 დაცვა და მიმღები',
    'მიწისქვეშა პარკინგი',
    'ფართო აივანი (Balcony)',
    'მეტროსთან და სერვისებთან ახლოს',
  ],
}

export function getLocalizedUnitTypes(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.unitTypes
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  return UNIT_TYPES_BY_LOCALE[locale] || UNIT_TYPES_BY_LOCALE.ar
}

export function getLocalizedFinishings(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.finishings
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  return FINISHINGS_BY_LOCALE[locale] || FINISHINGS_BY_LOCALE.ar
}

export function getLocalizedDeliveries(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.deliveries
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  const filterStatuses = (
    dict?.opportunitiesPage?.filters as Record<string, any>
  )?.deliveryStatuses
  if (Array.isArray(filterStatuses) && filterStatuses.length >= 3) {
    return [filterStatuses[1], filterStatuses[2]]
  }
  return DELIVERIES_BY_LOCALE[locale] || DELIVERIES_BY_LOCALE.ar
}

export function getLocalizedFeatures(
  dict?: Dictionary | Record<string, any>,
  locale: LocaleCode = 'ar'
): string[] {
  const fromDict = (dict?.sell?.detailsStep as Record<string, any>)?.features
  if (Array.isArray(fromDict) && fromDict.length > 0) return fromDict
  return FEATURES_BY_LOCALE[locale] || FEATURES_BY_LOCALE.ar
}

export function isReadyDeliveryOption(val?: string): boolean {
  if (!val) return false
  const allReady = [
    DELIVERIES_BY_LOCALE.ar[0],
    DELIVERIES_BY_LOCALE.en[0],
    DELIVERIES_BY_LOCALE.ru[0],
    DELIVERIES_BY_LOCALE.ka[0],
  ]
  return (
    allReady.includes(val) ||
    val.includes('جاهز') ||
    val.toLowerCase().includes('ready') ||
    val.toLowerCase().includes('готов') ||
    val.includes('მზად')
  )
}

export function isUnderConstructionDeliveryOption(val?: string): boolean {
  if (!val) return false
  return !isReadyDeliveryOption(val)
}

export const unitTypes: string[] = UNIT_TYPES_BY_LOCALE.ar
export const finishings: string[] = FINISHINGS_BY_LOCALE.ar
export const deliveries: string[] = DELIVERIES_BY_LOCALE.ar
export const features: string[] = FEATURES_BY_LOCALE.ar

export const years: string[] = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
]

export const deliveryFutureYears: string[] = [
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
]

export function getLocalizedMonthsList(locale: LocaleCode = 'ar') {
  const localeMap: Record<LocaleCode, string> = {
    ar: 'ar-EG',
    en: 'en-US',
    ru: 'ru-RU',
    ka: 'ka-GE',
  }
  return Array.from({ length: 12 }, (_, idx) => {
    const monthNum = String(idx + 1).padStart(2, '0')
    let monthName = monthNum
    try {
      monthName = new Intl.DateTimeFormat(localeMap[locale] || 'en-US', {
        month: 'short',
      }).format(new Date(2026, idx, 1))
    } catch {}
    return {
      value: monthNum,
      label: `${monthNum} - ${monthName}`,
    }
  })
}

const CITY_GROUP_TITLES: Record<
  GeorgiaAreaItem['cityCode'],
  Record<LocaleCode, string>
> = {
  tbilisi: {
    ar: 'تبليسي',
    en: 'Tbilisi',
    ru: 'Тбилиси',
    ka: 'თბილისი',
  },
  batumi: {
    ar: 'باتومي وساحل البحر الأسود',
    en: 'Batumi & Black Sea Coast',
    ru: 'Батуми и побережье',
    ka: 'ბათუმი და შავი ზღვის სანაპირო',
  },
  kutaisi: {
    ar: 'كوتايسي',
    en: 'Kutaisi',
    ru: 'Кутаиси',
    ka: 'ქუთაისი',
  },
  resorts: {
    ar: 'منتجعات ومدن جورجيا الأخرى',
    en: 'Other Georgian Cities & Resorts',
    ru: 'Другие города и курорты Грузии',
    ka: 'საქართველოს სხვა ქალაქები და კურორტები',
  },
}

export function getLocalizedGeorgiaCatalog(
  locale: LocaleCode = 'ar'
): Array<[string, string[]]> {
  const cityCodes: Array<GeorgiaAreaItem['cityCode']> = [
    'tbilisi',
    'batumi',
    'kutaisi',
    'resorts',
  ]

  return cityCodes.map((code): [string, string[]] => {
    const title =
      CITY_GROUP_TITLES[code][locale] || CITY_GROUP_TITLES[code].en
    const items = GEORGIA_CITIES_AND_DISTRICTS.filter(
      (item: GeorgiaAreaItem) => item.cityCode === code
    ).map((item: GeorgiaAreaItem) =>
      locale === 'ar'
        ? item.ar
        : locale === 'ru'
          ? item.ru
          : locale === 'ka'
            ? item.ka
            : item.en
    )
    return [title, items]
  })
}

export const GEORGIA_AREAS_CATALOG: Array<[string, string[]]> =
  getLocalizedGeorgiaCatalog('ar')

export const areasCatalogByCountry: Record<string, Array<[string, string[]]>> =
  {
    GE: GEORGIA_AREAS_CATALOG,
    EG: GEORGIA_AREAS_CATALOG,
    AE: GEORGIA_AREAS_CATALOG,
    RU: GEORGIA_AREAS_CATALOG,
  }

export const areasCatalog = GEORGIA_AREAS_CATALOG

export function formatAmount(
  value?: string,
  currencySymbol = '$',
  locale: LocaleCode = 'ar'
) {
  const cleanStr = toEnglishDigits(value ?? '').replace(/,/g, '')
  const amount = Number(cleanStr)
  if (!amount) return ''
  const sharedDict =
    DICTIONARIES[locale]?.sell?.shared || DICTIONARIES.ar.sell.shared
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} ${sharedDict.million} ${currencySymbol}`
  if (amount >= 1_000)
    return `${Math.round(amount / 1_000)} ${sharedDict.thousand} ${currencySymbol}`
  return `${amount.toLocaleString('en-US')} ${currencySymbol}`
}