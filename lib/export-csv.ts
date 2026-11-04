import type { LocaleCode } from '@/lib/i18n'

export type CsvColumnDef<T> = {
  header: string
  accessor: (row: T, index: number) => string | number | boolean | null | undefined
  isPhone?: boolean
}

export const EXPORT_LABELS: Record<
  LocaleCode,
  {
    exportAllBtn: string
    exportRowBtn: string
    moreActionsAria: string
    yes: string
    no: string
    normalTier: string
    unitLeadType: string
    generalLeadType: string
    activeStatus: string
    suspendedStatus: string
    verified: string
    unverified: string
    cols: {
      index: string
      unitCode: string
      projectName: string
      developer: string
      area: string
      unitType: string
      sizeSqm: string
      rooms: string
      requiredCash: string
      contractPrice: string
      marketPrice: string
      installment: string
      frequency: string
      negotiable: string
      sellerName: string
      sellerPhone: string
      sellerEmail: string
      status: string
      promoTier: string
      createdAt: string
      buyerName: string
      buyerPhone: string
      buyerEmail: string
      availableCash: string
      maxInstallment: string
      targetAreas: string
      leadType: string
      notes: string
      userRole: string
      sellUnitsCount: string
      buyRequestsCount: string
      verification: string
      offerRef: string
      offeredCash: string
      counterCash: string
      commission: string
      readiness: string
      paymentMethod: string
    }
  }
> = {
  ar: {
    exportAllBtn: 'تصدير Excel (CSV)',
    exportRowBtn: 'تصدير هذا السجل (Excel)',
    moreActionsAria: 'خيارات إضافية',
    yes: 'نعم',
    no: 'لا',
    normalTier: 'عادي',
    unitLeadType: 'طلب على وحدة محددة',
    generalLeadType: 'طلب بحث عام',
    activeStatus: 'نشط',
    suspendedStatus: 'موقوف',
    verified: 'موثق',
    unverified: 'غير موثق',
    cols: {
      index: '#',
      unitCode: 'كود الوحدة',
      projectName: 'اسم المشروع',
      developer: 'المطور العقاري',
      area: 'المنطقة',
      unitType: 'نوع الوحدة',
      sizeSqm: 'المساحة (م²)',
      rooms: 'الغرف',
      requiredCash: 'الكاش المطلوب ($)',
      contractPrice: 'سعر العقد ($)',
      marketPrice: 'سعر السوق ($)',
      installment: 'القسط ($)',
      frequency: 'دورية القسط',
      negotiable: 'قابل للتفاوض',
      sellerName: 'اسم البائع',
      sellerPhone: 'هاتف البائع',
      sellerEmail: 'إيميل البائع',
      status: 'الحالة',
      promoTier: 'باقة التمييز',
      createdAt: 'تاريخ التسجيل',
      buyerName: 'اسم المشتري',
      buyerPhone: 'هاتف المشتري',
      buyerEmail: 'إيميل المشتري',
      availableCash: 'الكاش المتاح ($)',
      maxInstallment: 'أقصى قسط ($)',
      targetAreas: 'المناطق / الوحدة المطلوبة',
      leadType: 'نوع الطلب',
      notes: 'ملاحظات العميل',
      userRole: 'الصلاحية',
      sellUnitsCount: 'عدد وحدات البيع',
      buyRequestsCount: 'عدد طلبات الشراء',
      verification: 'توثيق الحساب',
      offerRef: 'مرجع العرض',
      offeredCash: 'الكاش المعروض ($)',
      counterCash: 'العرض المقابل ($)',
      commission: 'عمولة المنصة ($)',
      readiness: 'جاهزية الدفع',
      paymentMethod: 'طريقة السداد',
    },
  },
  en: {
    exportAllBtn: 'Export Excel (CSV)',
    exportRowBtn: 'Export Row (Excel)',
    moreActionsAria: 'More actions',
    yes: 'Yes',
    no: 'No',
    normalTier: 'Standard',
    unitLeadType: 'Specific Unit Lead',
    generalLeadType: 'General Search Lead',
    activeStatus: 'Active',
    suspendedStatus: 'Suspended',
    verified: 'Verified',
    unverified: 'Unverified',
    cols: {
      index: '#',
      unitCode: 'Unit Code',
      projectName: 'Project Name',
      developer: 'Developer',
      area: 'District / Area',
      unitType: 'Unit Type',
      sizeSqm: 'Area (m²)',
      rooms: 'Rooms',
      requiredCash: 'Required Cash ($)',
      contractPrice: 'Contract Price ($)',
      marketPrice: 'Market Price ($)',
      installment: 'Installment ($)',
      frequency: 'Frequency',
      negotiable: 'Negotiable',
      sellerName: 'Seller Name',
      sellerPhone: 'Seller Phone',
      sellerEmail: 'Seller Email',
      status: 'Status',
      promoTier: 'Boost Tier',
      createdAt: 'Created Date',
      buyerName: 'Buyer Name',
      buyerPhone: 'Buyer Phone',
      buyerEmail: 'Buyer Email',
      availableCash: 'Available Cash ($)',
      maxInstallment: 'Max Installment ($)',
      targetAreas: 'Target Areas / Unit',
      leadType: 'Lead Type',
      notes: 'Customer Notes',
      userRole: 'Role',
      sellUnitsCount: 'Listed Units',
      buyRequestsCount: 'Buy Requests',
      verification: 'Verification',
      offerRef: 'Offer Ref',
      offeredCash: 'Offered Cash ($)',
      counterCash: 'Counter Offer ($)',
      commission: 'Platform Fee ($)',
      readiness: 'Payment Readiness',
      paymentMethod: 'Payment Method',
    },
  },
  ru: {
    exportAllBtn: 'Экспорт Excel (CSV)',
    exportRowBtn: 'Экспорт строки (Excel)',
    moreActionsAria: 'Действия',
    yes: 'Да',
    no: 'Нет',
    normalTier: 'Обычный',
    unitLeadType: 'Запрос по объекту',
    generalLeadType: 'Общий запрос',
    activeStatus: 'Активен',
    suspendedStatus: 'Заблокирован',
    verified: 'Подтвержден',
    unverified: 'Не подтвержден',
    cols: {
      index: '№',
      unitCode: 'Код объекта',
      projectName: 'Проект',
      developer: 'Застройщик',
      area: 'Район',
      unitType: 'Тип объекта',
      sizeSqm: 'Площадь (м²)',
      rooms: 'Комнат',
      requiredCash: 'Нужно наличными ($)',
      contractPrice: 'Цена по договору ($)',
      marketPrice: 'Рыночная цена ($)',
      installment: 'Платеж ($)',
      frequency: 'Периодичность',
      negotiable: 'Торг уместен',
      sellerName: 'Продавец',
      sellerPhone: 'Телефон продавца',
      sellerEmail: 'Email продавца',
      status: 'Статус',
      promoTier: 'Пакет продвижения',
      createdAt: 'Дата создания',
      buyerName: 'Покупатель',
      buyerPhone: 'Телефон покупателя',
      buyerEmail: 'Email покупателя',
      availableCash: 'Бюджет наличными ($)',
      maxInstallment: 'Макс. платеж ($)',
      targetAreas: 'Желаемые районы / Объект',
      leadType: 'Тип заявки',
      notes: 'Заметки',
      userRole: 'Роль',
      sellUnitsCount: 'Объектов на продажу',
      buyRequestsCount: 'Заявок на покупку',
      verification: 'Верификация',
      offerRef: 'Код оффера',
      offeredCash: 'Предложено ($)',
      counterCash: 'Встречный оффер ($)',
      commission: 'Комиссия ($)',
      readiness: 'Готовность к оплате',
      paymentMethod: 'Способ оплаты',
    },
  },
  ka: {
    exportAllBtn: 'Excel-ში ექსპორტი (CSV)',
    exportRowBtn: 'ჩანაწერის ექსპორტი (Excel)',
    moreActionsAria: 'დამატებითი მოქმედებები',
    yes: 'დიახ',
    no: 'არა',
    normalTier: 'სტანდარტული',
    unitLeadType: 'კონკრეტული ობიექტის მოთხოვნა',
    generalLeadType: 'ზოგადი მოთხოვნა',
    activeStatus: 'აქტიური',
    suspendedStatus: 'შეჩერებული',
    verified: 'ვერიფიცირებული',
    unverified: 'არავერიფიცირებული',
    cols: {
      index: '#',
      unitCode: 'ობიექტის კოდი',
      projectName: 'პროექტი',
      developer: 'დეველოპერი',
      area: 'უბანი',
      unitType: 'ტიპი',
      sizeSqm: 'ფართობი (მ²)',
      rooms: 'ოთახები',
      requiredCash: 'საჭირო თანხა ($)',
      contractPrice: 'კონტრაქტის ფასი ($)',
      marketPrice: 'საბაზრო ფასი ($)',
      installment: 'განვადება ($)',
      frequency: 'პერიოდულობა',
      negotiable: 'შეთანხმებით',
      sellerName: 'გამყიდველი',
      sellerPhone: 'გამყიდველის ტელეფონი',
      sellerEmail: 'გამყიდველის ელ-ფოსტა',
      status: 'სტატუსი',
      promoTier: 'VIP პაკეტი',
      createdAt: 'თარიღი',
      buyerName: 'მყიდველი',
      buyerPhone: 'მყიდველის ტელეფონი',
      buyerEmail: 'მყიდველის ელ-ფოსტა',
      availableCash: 'ხელმისაწვდომი თანხა ($)',
      maxInstallment: 'მაქს. განვადება ($)',
      targetAreas: 'სასურველი უბნები',
      leadType: 'მოთხოვნის ტიპი',
      notes: 'შენიშვნები',
      userRole: 'როლი',
      sellUnitsCount: 'გასაყიდი ობიექტები',
      buyRequestsCount: 'შესყიდვის მოთხოვნები',
      verification: 'ვერიფიკაცია',
      offerRef: 'ოფერის კოდი',
      offeredCash: 'შეთავაზებული თანხა ($)',
      counterCash: 'საპასუხო შეთავაზება ($)',
      commission: 'საკომისიო ($)',
      readiness: 'გადახდის მზაობა',
      paymentMethod: 'გადახდის მეთოდი',
    },
  },
}

function escapeCsvCell(
  val: string | number | boolean | null | undefined,
  isPhone = false
): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/\r?\n|\r/g, ' ').trim()
  if (!str) return '""'

  if (isPhone) {
    return `"\t${str.replace(/"/g, '""')}"`
  }

  return `"${str.replace(/"/g, '""')}"`
}

export function downloadExcelCsv<T>({
  filenamePrefix,
  columns,
  data,
}: {
  filenamePrefix: string
  columns: CsvColumnDef<T>[]
  data: T[]
}) {
  if (typeof window === 'undefined') return

  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(',')

  const dataRows = data.map((row, idx) =>
    columns
      .map((col) => escapeCsvCell(col.accessor(row, idx), col.isPhone))
      .join(',')
  )

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n')

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  const fullFilename = `${filenamePrefix}_${dateStr}.csv`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', fullFilename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
