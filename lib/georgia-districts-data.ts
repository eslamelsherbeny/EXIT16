export type GeorgiaRegionCode =
  | 'tbilisi_metro'
  | 'batumi_adjara'
  | 'kutaisi_imereti'
  | 'mountain_resorts'
  | 'kakheti_region'

export type GeorgiaDistrictNode = {
  id: string
  regionCode: GeorgiaRegionCode
  isCityWide?: boolean
  labels: {
    ar: string
    en: string
    ru: string
    ka: string
  }
  keywords: string[]
}

export const GEORGIA_REGION_DISTRICTS: GeorgiaDistrictNode[] = [
  {
    id: 'Tbilisi - Saburtalo',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - سابورتالو',
      en: 'Tbilisi - Saburtalo',
      ru: 'Тбилиси - Сабуртало',
      ka: 'თბილისი - საბურთალო',
    },
    keywords: ['saburtalo', 'سابورتالو', 'сабуртало', 'საბურთალო'],
  },
  {
    id: 'Tbilisi - Vake',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - فاكي',
      en: 'Tbilisi - Vake',
      ru: 'Тбилиси - Ваке',
      ka: 'თბილისი - ვაკე',
    },
    keywords: ['vake', 'فاكي', 'ваке', 'ვაკე'],
  },
  {
    id: 'Tbilisi - Vera',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - فيرا',
      en: 'Tbilisi - Vera',
      ru: 'Тбилиси - Вера',
      ka: 'თბილისი - ვერა',
    },
    keywords: ['vera', 'فيرا', 'вера', 'ვერა'],
  },
  {
    id: 'Tbilisi - Mtatsminda',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - متاتسميندا',
      en: 'Tbilisi - Mtatsminda',
      ru: 'Тбилиси - Мтацминда',
      ka: 'თბილისი - მთაწმინდა',
    },
    keywords: ['mtatsminda', 'متاتسميندا', 'мтацминда', 'მთაწმინდა'],
  },
  {
    id: 'Tbilisi - Old Tbilisi',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي القديمة',
      en: 'Tbilisi - Old Tbilisi',
      ru: 'Тбилиси - Старый Тбилиси',
      ka: 'თბილისი - ძველი თბილისი',
    },
    keywords: [
      'old tbilisi',
      'تبليسي القديمة',
      'старый тбилиси',
      'ძველი თბილისი',
    ],
  },
  {
    id: 'Tbilisi - Ortachala',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - أورتاشالا',
      en: 'Tbilisi - Ortachala',
      ru: 'Тбилиси - Ортачала',
      ka: 'თბილისი - ორთაჭალა',
    },
    keywords: ['ortachala', 'أورتاشالا', 'اورتاشالا', 'ортачала', 'ორთაჭალა'],
  },
  {
    id: 'Tbilisi - Krtsanisi',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - كرتسانيسي',
      en: 'Tbilisi - Krtsanisi',
      ru: 'Тбилиси - Крцаниси',
      ka: 'თბილისი - კრწანისი',
    },
    keywords: ['krtsanisi', 'كرتسانيسي', 'крцаниси', 'კრწანისი'],
  },
  {
    id: 'Tbilisi - Isani',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - إيساني',
      en: 'Tbilisi - Isani',
      ru: 'Тбилиси - Исани',
      ka: 'თბილისი - ისანი',
    },
    keywords: ['isani', 'إيساني', 'ايساني', 'исани', 'ისანი'],
  },
  {
    id: 'Tbilisi - Samgori',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - سامغوري',
      en: 'Tbilisi - Samgori',
      ru: 'Тбилиси - Самгори',
      ka: 'თბილისი - სამგორი',
    },
    keywords: ['samgori', 'سامغوري', 'самгори', 'სამგორი'],
  },
  {
    id: 'Tbilisi - Varketili',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - فاركيتيلي',
      en: 'Tbilisi - Varketili',
      ru: 'Тбилиси - Варкетили',
      ka: 'თბილისი - ვარკეთილი',
    },
    keywords: ['varketili', 'فاركيتيلي', 'варкетили', 'ვარკეთილი'],
  },
  {
    id: 'Tbilisi - Didi Digomi',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - ديدي ديغومي',
      en: 'Tbilisi - Didi Digomi',
      ru: 'Тбилиси - Диди Дигоми',
      ka: 'თბილისი - დიდი დიღომი',
    },
    keywords: ['didi digomi', 'ديدي ديغومي', 'диди дигоми', 'დიდი დიღომი'],
  },
  {
    id: 'Tbilisi - Digomi Massive',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - ديغومي ماسيف',
      en: 'Tbilisi - Digomi Massive',
      ru: 'Тбилиси - Дигомский массив',
      ka: 'თბილისი - დიღმის მასივი',
    },
    keywords: ['digomi', 'ديغومي', 'дигом', 'დიღმის'],
  },
  {
    id: 'Tbilisi - Didube',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - ديدوبي',
      en: 'Tbilisi - Didube',
      ru: 'Тбилиси - Дидубе',
      ka: 'თბილისი - დიდუბე',
    },
    keywords: ['didube', 'ديدوبي', 'дидубе', 'დიდუბე'],
  },
  {
    id: 'Tbilisi - Chugureti / Marjanishvili',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - مارجانيشفيلي',
      en: 'Tbilisi - Chugureti / Marjanishvili',
      ru: 'Тбилиси - Чугурети / Марджанишвили',
      ka: 'თბილისი - ჩუღურეთი / მარჯანიშვილი',
    },
    keywords: [
      'chugureti',
      'marjanishvili',
      'تشوغوريتي',
      'مارجانيشفيلي',
      'чугурети',
      'марджанишвили',
      'ჩუღურეთი',
      'მარჯანიშვილი',
    ],
  },
  {
    id: 'Tbilisi - Nadzaladevi',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - نادزالاديفي',
      en: 'Tbilisi - Nadzaladevi',
      ru: 'Тбилиси - Надзаладеви',
      ka: 'თბილისი - ნაძალადევი',
    },
    keywords: ['nadzaladevi', 'نادزالاديفي', 'надзаладеви', 'ნაძალადევი'],
  },
  {
    id: 'Tbilisi - Gldani',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - غلداني',
      en: 'Tbilisi - Gldani',
      ru: 'Тбилиси - Глдани',
      ka: 'თბილისი - გლდანი',
    },
    keywords: ['gldani', 'غلداني', 'глдани', 'გლდანი'],
  },
  {
    id: 'Tbilisi - Avlabari',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - أفلاباري',
      en: 'Tbilisi - Avlabari',
      ru: 'Тбилиси - Авлабари',
      ka: 'თბილისი - ავლაბარი',
    },
    keywords: ['avlabari', 'أفلاباري', 'افلاباري', 'авлабари', 'ავლაბარი'],
  },
  {
    id: 'Tbilisi - Lisi Lake',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - بحيرة ليسي',
      en: 'Tbilisi - Lisi Lake',
      ru: 'Тбилиси - Озеро Лиси',
      ka: 'თბილისი - ლისის ტბა',
    },
    keywords: ['lisi', 'ليسي', 'лиси', 'ლისის'],
  },
  {
    id: 'Tbilisi - Tbilisi Sea',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - بحر تبليسي',
      en: 'Tbilisi - Tbilisi Sea',
      ru: 'Тбилиси - Тбилисское море',
      ka: 'თბილისი - თბილისის ზღვა',
    },
    keywords: ['tbilisi sea', 'بحر تبليسي', 'тбилисское море', 'თბილისის ზღვა'],
  },
  {
    id: 'Tbilisi - Tabakhmela / Kojori',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'تبليسي - تاباخميلا / كوجوري',
      en: 'Tbilisi - Tabakhmela / Kojori',
      ru: 'Тбилиси - Табахмела / Коджори',
      ka: 'თბილისი - ტაბახმელა / კოჯორი',
    },
    keywords: [
      'tabakhmela',
      'kojori',
      'تاباخميلا',
      'كوجوري',
      'табахмела',
      'ტაბახმელა',
    ],
  },
  {
    id: 'Mtskheta / Saguramo',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'متسخيتا - ساجورامو',
      en: 'Mtskheta / Saguramo',
      ru: 'Мцхета / Сагурамо',
      ka: 'მცხეთა / საგურამო',
    },
    keywords: [
      'mtskheta',
      'saguramo',
      'متسخيتا',
      'ساجورامو',
      'мцхета',
      'сагурамо',
      'მცხეთა',
      'საგურამო',
    ],
  },
  {
    id: 'Rustavi',
    regionCode: 'tbilisi_metro',
    labels: {
      ar: 'روستافي',
      en: 'Rustavi',
      ru: 'Рустави',
      ka: 'რუსთავი',
    },
    keywords: ['rustavi', 'روستافي', 'рустави', 'რუსთავი'],
  },
  {
    id: 'Batumi - New Boulevard',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - نيو بوليفارد',
      en: 'Batumi - New Boulevard',
      ru: 'Батуми - Новый Бульвар',
      ka: 'ბათუმი - ახალი ბულვარი',
    },
    keywords: [
      'new boulevard',
      'نيو بوليفارد',
      'новый бульвар',
      'ახალი ბულვარი',
    ],
  },
  {
    id: 'Batumi - Alley of Heroes',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - ممر الأبطال',
      en: 'Batumi - Alley of Heroes',
      ru: 'Батуми - Аллея Героев',
      ka: 'ბათუმი - გმირთა ხეივანი',
    },
    keywords: [
      'alley of heroes',
      'ممر الأبطال',
      'ممر الابطال',
      'аллея героев',
      'გმირთა ხეივანი',
    ],
  },
  {
    id: 'Batumi - Old Boulevard / Center',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - البوليفارد القديم',
      en: 'Batumi - Old Boulevard / Center',
      ru: 'Батуми - Старый Бульвар / Центр',
      ka: 'ბათუმი - ძველი ბულვარი / ცენტრი',
    },
    keywords: [
      'old boulevard',
      'البوليفارد القديم',
      'وسط المدينة',
      'старый бульвар',
      'ძველი ბულვარი',
    ],
  },
  {
    id: 'Batumi - Rustaveli Avenue',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - شارع روستافيلي',
      en: 'Batumi - Rustaveli Avenue',
      ru: 'Батуми - Проспект Руставели',
      ka: 'ბათუმი - რუსთაველის გამზირი',
    },
    keywords: ['rustaveli', 'روستافيلي', 'руставели', 'რუსთაველის'],
  },
  {
    id: 'Batumi - Khimshiashvili',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - خيمشياشفيلي',
      en: 'Batumi - Khimshiashvili',
      ru: 'Батуми - Химшиашвили',
      ka: 'ბათუმი - ხიმშიაშვილი',
    },
    keywords: [
      'khimshiashvili',
      'خيمشياشفيلي',
      'химшиашвили',
      'ხიმშიაშვილი',
    ],
  },
  {
    id: 'Batumi - Bagrationi',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - باغراتيوني',
      en: 'Batumi - Bagrationi',
      ru: 'Батуми - Багратиони',
      ka: 'ბათუმი - ბაგრატიონი',
    },
    keywords: ['bagrationi', 'باغراتيوني', 'багратиони', 'ბაგრატიონი'],
  },
  {
    id: 'Batumi - Airport District',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - منطقة المطار',
      en: 'Batumi - Airport District',
      ru: 'Батуми - Район Аэропорта',
      ka: 'ბათუმი - აეროპორტის უბანი',
    },
    keywords: ['airport', 'منطقة المطار', 'аэропорт', 'აეროპორტის'],
  },
  {
    id: 'Batumi - Gonio / Kvariati',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - غونيو / كفارياتي',
      en: 'Batumi - Gonio / Kvariati',
      ru: 'Батуми - Гонио / Квариати',
      ka: 'ბათუმი - გონიო / კვარიათი',
    },
    keywords: ['gonio', 'kvariati', 'غونيو', 'كفارياتي', 'гонио', 'გონიო'],
  },
  {
    id: 'Batumi - Makhinjauri',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - ماخينجاوري',
      en: 'Batumi - Makhinjauri',
      ru: 'Батуми - Махинджаури',
      ka: 'ბათუმი - მახინჯაური',
    },
    keywords: ['makhinjauri', 'ماخينجاوري', 'махинджаури', 'მახინჯაური'],
  },
  {
    id: 'Batumi - Chakvi / Green Cape',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'باتومي - تشاكفي / غرين كيب',
      en: 'Batumi - Chakvi / Green Cape',
      ru: 'Батуми - Чакви / Зеленый Мыс',
      ka: 'ბათუმი - ჩაქვი / მწვანე კონცხი',
    },
    keywords: ['chakvi', 'green cape', 'تشاكفي', 'غرين كيب', 'чакви', 'ჩაქვი'],
  },
  {
    id: 'Kobuleti / Shekvetili',
    regionCode: 'batumi_adjara',
    labels: {
      ar: 'كوبوليتي - شيكفيتيلي',
      en: 'Kobuleti / Shekvetili',
      ru: 'Кобулети / Шекветили',
      ka: 'ქობულეთი / შეკვეთილი',
    },
    keywords: [
      'kobuleti',
      'shekvetili',
      'كوبوليتي',
      'شيكفيتيلي',
      'кобулети',
      'ქობულეთი',
    ],
  },
  {
    id: 'Kutaisi',
    regionCode: 'kutaisi_imereti',
    isCityWide: true,
    labels: {
      ar: 'كوتايسي',
      en: 'Kutaisi',
      ru: 'Кутаиси',
      ka: 'ქუთაისი',
    },
    keywords: ['kutaisi', 'كوتايسي', 'кутаиси', 'ქუთაისი'],
  },
  {
    id: 'Gudauri',
    regionCode: 'mountain_resorts',
    labels: {
      ar: 'منتجع غودوري',
      en: 'Gudauri Resort',
      ru: 'Гудаури',
      ka: 'გუდაური',
    },
    keywords: ['gudauri', 'غودوري', 'جوداوري', 'гудаури', 'გუდაური'],
  },
  {
    id: 'Bakuriani',
    regionCode: 'mountain_resorts',
    labels: {
      ar: 'منتجع باكورياني',
      en: 'Bakuriani Resort',
      ru: 'Бакуриани',
      ka: 'ბაკურიანი',
    },
    keywords: ['bakuriani', 'باكورياني', 'бакуриани', 'ბაკურიანი'],
  },
  {
    id: 'Borjomi',
    regionCode: 'mountain_resorts',
    labels: {
      ar: 'بورجومي',
      en: 'Borjomi',
      ru: 'Боржоми',
      ka: 'ბორჯომი',
    },
    keywords: ['borjomi', 'بورجومي', 'боржоми', 'ბორჯომი'],
  },
  {
    id: 'Kakheti - Telavi / Kvareli',
    regionCode: 'kakheti_region',
    isCityWide: true,
    labels: {
      ar: 'كاخيتي - تيلافي',
      en: 'Kakheti - Telavi / Kvareli',
      ru: 'Кахетия - Телави / Кварели',
      ka: 'კახეთი - თელავი / ყვარელი',
    },
    keywords: [
      'kakheti',
      'telavi',
      'kvareli',
      'كاخيتي',
      'تيلافي',
      'كفاريلي',
      'кахетия',
      'კახეთი',
    ],
  },
]

export const NON_GEORGIAN_LEGACY_KEYWORDS = [
  'التجمع',
  'القاهرة',
  'زايد',
  'أكتوبر',
  'اكتوبر',
  'العاصمة',
  'الساحل',
  'سخنة',
  'الجونة',
  'مدينتي',
  'الرحاب',
  'المستقبل',
  'الشروق',
  'العبور',
  'المعادي',
  'مصر',
  'new cairo',
  'fifth settlement',
  'sheikh zayed',
  'october',
  'north coast',
  'sokhna',
  'new capital',
  'egypt',
]