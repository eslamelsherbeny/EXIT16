import type { LocaleCode } from '@/lib/i18n'

export type CsvColumnDef<T> = {
  header: string
  accessor: (
    row: T,
    index: number
  ) => string | number | boolean | null | undefined
  isPhone?: boolean
}

export const EXPORT_LABELS: Record<
  LocaleCode,
  {
    exportAllBtn: string
    exportRowBtn: string
    moreActionsAria: string
    brandSubtitle: string
    marketLocationLabel: string
    marketLocationValue: string
    generatedAtLabel: string
    totalRecordsLabel: string
    propertiesReportTitle: string
    promotionsReportTitle: string
    singlePropertyReportTitle: string
    leadsReportTitle: string
    singleLeadReportTitle: string
    usersReportTitle: string
    singleUserReportTitle: string
    dealsReportTitle: string
    singleDealReportTitle: string
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
    exportAllBtn: 'تصدير Excel منسق',
    exportRowBtn: 'تصدير هذا السجل (Excel)',
    moreActionsAria: 'خيارات إضافية',
    brandSubtitle: 'منصة التنازل واستكمال الأقساط العقارية الموثقة',
    marketLocationLabel: 'السوق / المكان',
    marketLocationValue: 'جورجيا (تبليسي · باتومي · غودوري) — العملة ($)',
    generatedAtLabel: 'تاريخ التصدير',
    totalRecordsLabel: 'إجمالي السجلات',
    propertiesReportTitle: 'قائمة الوحدات المعروضة وطلبات البيع (البائعين)',
    promotionsReportTitle: 'قائمة الإعلانات المميزة وباقات الترويج (VIP)',
    singlePropertyReportTitle: 'بطاقة بيانات وحدة عقارية وبائع',
    leadsReportTitle: 'قائمة المشترين وطلبات الشراء المسجلة',
    singleLeadReportTitle: 'بطاقة بيانات مشتري وطلب شراء',
    usersReportTitle: 'قائمة المستخدمين والعملاء المسجلين بالمنصة',
    singleUserReportTitle: 'بطاقة بيانات حساب عميل',
    dealsReportTitle: 'سجل غرفة الصفقات والعروض والعمولات',
    singleDealReportTitle: 'بطاقة تفاصيل صفقة وعرض شراء',
    yes: 'نعم',
    no: 'لا',
    normalTier: 'عادي',
    unitLeadType: 'طلب على وحدة محددة',
    generalLeadType: 'طلب بحث عام',
    activeStatus: 'نشط',
    suspendedStatus: 'موقوف',
    verified: 'موثق ✓',
    unverified: 'غير موثق',
    cols: {
      index: '#',
      unitCode: 'كود الوحدة',
      projectName: 'اسم المشروع',
      developer: 'المطور العقاري',
      area: 'المنطقة / الحي',
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
      sellUnitsCount: 'وحدات البيع',
      buyRequestsCount: 'طلبات الشراء',
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
    exportAllBtn: 'Export Styled Excel',
    exportRowBtn: 'Export This Record (Excel)',
    moreActionsAria: 'More actions',
    brandSubtitle: 'Verified Real Estate Installment Exit Platform',
    marketLocationLabel: 'Market / Location',
    marketLocationValue: 'Georgia (Tbilisi · Batumi · Gudauri) — Currency ($)',
    generatedAtLabel: 'Exported On',
    totalRecordsLabel: 'Total Records',
    propertiesReportTitle: 'Listed Properties & Seller Requests Directory',
    promotionsReportTitle: 'Featured Listings & VIP Promotions Report',
    singlePropertyReportTitle: 'Property & Seller Record Sheet',
    leadsReportTitle: 'Registered Buyers & Purchase Leads Directory',
    singleLeadReportTitle: 'Buyer Lead Record Sheet',
    usersReportTitle: 'Registered Platform Users & Clients Directory',
    singleUserReportTitle: 'Client Account Record Sheet',
    dealsReportTitle: 'Deals Room, Offers & Commissions Registry',
    singleDealReportTitle: 'Deal & Purchase Offer Record Sheet',
    yes: 'Yes',
    no: 'No',
    normalTier: 'Standard',
    unitLeadType: 'Specific Unit Lead',
    generalLeadType: 'General Search Lead',
    activeStatus: 'Active',
    suspendedStatus: 'Suspended',
    verified: 'Verified ✓',
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
    exportAllBtn: 'Экспорт в Excel',
    exportRowBtn: 'Экспорт записи (Excel)',
    moreActionsAria: 'Действия',
    brandSubtitle: 'Платформа переуступки недвижимости в рассрочку',
    marketLocationLabel: 'Рынок / Локация',
    marketLocationValue: 'Грузия (Тбилиси · Батуми · Гудаури) — Валюта ($)',
    generatedAtLabel: 'Дата выгрузки',
    totalRecordsLabel: 'Всего записей',
    propertiesReportTitle: 'Список объектов и заявок продавцов',
    promotionsReportTitle: 'Список VIP-объектов и продвижения',
    singlePropertyReportTitle: 'Карточка объекта недвижимости',
    leadsReportTitle: 'Список покупателей и заявок на покупку',
    singleLeadReportTitle: 'Карточка заявки покупателя',
    usersReportTitle: 'Список пользователей и клиентов платформы',
    singleUserReportTitle: 'Карточка аккаунта клиента',
    dealsReportTitle: 'Реестр сделок, офферов и комиссий',
    singleDealReportTitle: 'Карточка сделки и оффера',
    yes: 'Да',
    no: 'Нет',
    normalTier: 'Обычный',
    unitLeadType: 'Запрос по объекту',
    generalLeadType: 'Общий запрос',
    activeStatus: 'Активен',
    suspendedStatus: 'Заблокирован',
    verified: 'Подтвержден ✓',
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
    exportAllBtn: 'Excel-ში ექსპორტი',
    exportRowBtn: 'ჩანაწერის ექსპორტი (Excel)',
    moreActionsAria: 'დამატებითი მოქმედებები',
    brandSubtitle: 'უძრავი ქონების გადაბარების ვერიფიცირებული პლატფორმა',
    marketLocationLabel: 'ბაზარი / მდებარეობა',
    marketLocationValue: 'საქართველო (თბილისი · ბათუმი · გუდაური) — ვალუტა ($)',
    generatedAtLabel: 'ექსპორტის თარიღი',
    totalRecordsLabel: 'სულ ჩანაწერები',
    propertiesReportTitle: 'ობიექტებისა და გამყიდველების სია',
    promotionsReportTitle: 'VIP რეკლამებისა და პაკეტების სია',
    singlePropertyReportTitle: 'უძრავი ქონების ობიექტის ბარათი',
    leadsReportTitle: 'მყიდველებისა და მოთხოვნების სია',
    singleLeadReportTitle: 'მყიდველის მოთხოვნის ბარათი',
    usersReportTitle: 'პლატფორმის მომხმარებლების სია',
    singleUserReportTitle: 'მომხმარებლის ანგარიშის ბარათი',
    dealsReportTitle: 'გარიგებების, ოფერების და საკომისიოს რეესტრი',
    singleDealReportTitle: 'გარიგების დეტალური ბარათი',
    yes: 'დიახ',
    no: 'არა',
    normalTier: 'სტანდარტული',
    unitLeadType: 'კონკრეტული ობიექტის მოთხოვნა',
    generalLeadType: 'ზოგადი მოთხოვნა',
    activeStatus: 'აქტიური',
    suspendedStatus: 'შეჩერებული',
    verified: 'ვერიფიცირებული ✓',
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

function escapeHtml(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return '—'
  const str = String(raw).trim()
  if (!str) return '—'
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * تصدير نموذج وجدول إكسيل رسمي منسق بالكامل (يفتح في Microsoft Excel و Google Sheets و Numbers على الكمبيوتر والموبايل)
 */
export function downloadExcelCsv<T>({
  filenamePrefix,
  reportTitle,
  locale = 'ar',
  columns,
  data,
}: {
  filenamePrefix: string
  reportTitle?: string
  locale?: LocaleCode
  columns: CsvColumnDef<T>[]
  data: T[]
}) {
  if (typeof window === 'undefined' || !data || data.length === 0) return

  const L = EXPORT_LABELS[locale] || EXPORT_LABELS.ar
  const isRtl = locale === 'ar'
  const dirAttr = isRtl ? 'rtl' : 'ltr'
  const alignAttr = isRtl ? 'right' : 'left'
  const colSpanCount = Math.max(2, columns.length)
  const resolvedTitle = reportTitle || L.propertiesReportTitle
  const nowFormatted = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const headerCellsHtml = columns
    .map(
      (col) =>
        `<th style="background-color:#105C50; color:#ffffff; font-weight:bold; font-size:12pt; padding:12px 14px; border:1px solid #0a3d35; text-align:center; vertical-align:middle; white-space:nowrap;">${escapeHtml(col.header)}</th>`
    )
    .join('')

  const bodyRowsHtml = data
    .map((row, rowIdx) => {
      const rowBg = rowIdx % 2 === 0 ? '#ffffff' : '#f4f8f7'
      const cells = columns
        .map((col, colIdx) => {
          const rawVal = col.accessor(row, rowIdx)
          const cleanVal = escapeHtml(rawVal)

          if (col.isPhone) {
            return `<td dir="ltr" style="background-color:${rowBg}; color:#0a1122; font-family:Consolas,monospace; font-weight:bold; font-size:11pt; padding:10px 12px; border:1px solid #cbd5e1; text-align:center; vertical-align:middle; mso-number-format:'\\@';">${cleanVal}</td>`
          }

          if (colIdx === 0) {
            return `<td style="background-color:${rowBg}; color:#475569; font-weight:bold; font-size:11pt; padding:10px 12px; border:1px solid #cbd5e1; text-align:center; vertical-align:middle;">${cleanVal}</td>`
          }

          const isNumericCurrency =
            typeof rawVal === 'number' && Number.isFinite(rawVal)
          if (isNumericCurrency) {
            return `<td dir="ltr" style="background-color:${rowBg}; color:#105C50; font-weight:bold; font-size:11pt; padding:10px 12px; border:1px solid #cbd5e1; text-align:center; vertical-align:middle;">${Number(rawVal).toLocaleString('en-US')}</td>`
          }

          return `<td style="background-color:${rowBg}; color:#0f172a; font-size:11pt; padding:10px 12px; border:1px solid #cbd5e1; text-align:${alignAttr}; vertical-align:middle;">${cleanVal}</td>`
        })
        .join('')

      return `<tr>${cells}</tr>`
    })
    .join('')

  const fullExcelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" dir="${dirAttr}">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>AqarExit Report</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
          ${isRtl ? '<x:DisplayRightToLeft/>' : ''}
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body, table { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
  br { mso-data-placement: same-cell; }
</style>
</head>
<body dir="${dirAttr}">
  <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; direction:${dirAttr};">
    <thead>
      <tr>
        <td colspan="${colSpanCount}" style="background-color:#0a1122; color:#ffffff; font-size:16pt; font-weight:bold; padding:16px 20px; text-align:center; border:2px solid #0a1122;">
          AQAR EXIT &mdash; ${escapeHtml(resolvedTitle)}
        </td>
      </tr>
      <tr>
        <td colspan="${colSpanCount}" style="background-color:#effaf5; color:#105C50; font-size:11pt; font-weight:bold; padding:10px 16px; text-align:center; border:1px solid #a7f3d0;">
          📍 ${escapeHtml(L.marketLocationLabel)}: ${escapeHtml(L.marketLocationValue)} &nbsp;&nbsp;|&nbsp;&nbsp; 📅 ${escapeHtml(L.generatedAtLabel)}: ${escapeHtml(nowFormatted)} &nbsp;&nbsp;|&nbsp;&nbsp; 📊 ${escapeHtml(L.totalRecordsLabel)}: ${data.length}
        </td>
      </tr>
      <tr>
        <td colspan="${colSpanCount}" style="height:10px; background-color:#ffffff; border:none;"></td>
      </tr>
      <tr>
        ${headerCellsHtml}
      </tr>
    </thead>
    <tbody>
      ${bodyRowsHtml}
    </tbody>
  </table>
</body>
</html>`

  const blob = new Blob(['\uFEFF' + fullExcelHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  const safePrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fullFilename = `${safePrefix}_${dateStr}.xls`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fullFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
