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
    exportPdfBtn: string
    exportRowBtn: string
    exportRowPdfBtn: string
    moreActionsAria: string
    brandSubtitle: string
    marketLocationLabel: string
    marketLocationValue: string
    generatedAtLabel: string
    totalRecordsLabel: string
    officialDocBadge: string
    footerDisclaimer: string
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
    exportAllBtn: 'تصدير Excel',
    exportPdfBtn: 'تصدير PDF رسمي',
    exportRowBtn: 'تصدير السجل (Excel)',
    exportRowPdfBtn: 'طباعة / حفظ كـ PDF',
    moreActionsAria: 'خيارات إضافية',
    brandSubtitle: 'منصة التنازل واستكمال الأقساط العقارية الموثقة — جورجيا',
    marketLocationLabel: 'السوق العقاري',
    marketLocationValue: 'جورجيا (تبليسي · باتومي · غودوري) — العملة ($)',
    generatedAtLabel: 'تاريخ التحرير',
    totalRecordsLabel: 'إجمالي السجلات',
    officialDocBadge: 'وثيقة رسمية مستخرجة من نظام إدارة Aqar Exit',
    footerDisclaimer:
      'تم إصدار هذا المستند إلكترونياً من لوحة تحكم إدارة Aqar Exit — جميع البيانات موثقة وسرية.',
    propertiesReportTitle: 'قائمة الوحدات المعروضة وطلبات البيع (البائعين)',
    promotionsReportTitle: 'قائمة الإعلانات المميزة وباقات الترويج (VIP)',
    singlePropertyReportTitle: 'استمارة بيانات وحدة عقارية رسمية',
    leadsReportTitle: 'قائمة المشترين وطلبات الشراء المسجلة',
    singleLeadReportTitle: 'استمارة بيانات مشتري وطلب شراء',
    usersReportTitle: 'قائمة المستخدمين والعملاء المسجلين بالمنصة',
    singleUserReportTitle: 'بطاقة بيانات حساب عميل',
    dealsReportTitle: 'سجل غرفة الصفقات والعروض والعمولات',
    singleDealReportTitle: 'استمارة تفاصيل صفقة وعرض شراء',
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
    exportAllBtn: 'Export Excel',
    exportPdfBtn: 'Export PDF',
    exportRowBtn: 'Export Record (Excel)',
    exportRowPdfBtn: 'Save / Print as PDF',
    moreActionsAria: 'More actions',
    brandSubtitle: 'Verified Real Estate Installment Exit Platform — Georgia',
    marketLocationLabel: 'Market / Location',
    marketLocationValue: 'Georgia (Tbilisi · Batumi · Gudauri) — Currency ($)',
    generatedAtLabel: 'Issued On',
    totalRecordsLabel: 'Total Records',
    officialDocBadge: 'Official Document Generated by Aqar Exit Admin System',
    footerDisclaimer:
      'This document was electronically generated by Aqar Exit Admin Dashboard — Confidential & Verified.',
    propertiesReportTitle: 'Listed Properties & Seller Requests Directory',
    promotionsReportTitle: 'Featured Listings & VIP Promotions Report',
    singlePropertyReportTitle: 'Official Property & Seller Dossier',
    leadsReportTitle: 'Registered Buyers & Purchase Leads Directory',
    singleLeadReportTitle: 'Official Buyer Lead Dossier',
    usersReportTitle: 'Registered Platform Users & Clients Directory',
    singleUserReportTitle: 'Client Account Dossier',
    dealsReportTitle: 'Deals Room, Offers & Commissions Registry',
    singleDealReportTitle: 'Official Deal & Purchase Offer Dossier',
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
    exportAllBtn: 'Экспорт Excel',
    exportPdfBtn: 'Экспорт PDF',
    exportRowBtn: 'Экспорт (Excel)',
    exportRowPdfBtn: 'Сохранить в PDF',
    moreActionsAria: 'Действия',
    brandSubtitle: 'Платформа переуступки недвижимости в рассрочку — Грузия',
    marketLocationLabel: 'Рынок / Локация',
    marketLocationValue: 'Грузия (Тбилиси · Батуми · Гудаури) — Валюта ($)',
    generatedAtLabel: 'Дата выпуска',
    totalRecordsLabel: 'Всего записей',
    officialDocBadge: 'Официальный документ системы управления Aqar Exit',
    footerDisclaimer:
      'Документ сформирован автоматически в панели администратора Aqar Exit.',
    propertiesReportTitle: 'Список объектов и заявок продавцов',
    promotionsReportTitle: 'Список VIP-объектов и продвижения',
    singlePropertyReportTitle: 'Официальная карточка объекта недвижимости',
    leadsReportTitle: 'Список покупателей и заявок на покупку',
    singleLeadReportTitle: 'Официальная карточка покупателя',
    usersReportTitle: 'Список пользователей и клиентов платформы',
    singleUserReportTitle: 'Карточка аккаунта клиента',
    dealsReportTitle: 'Реестр сделок, офферов и комиссий',
    singleDealReportTitle: 'Официальная карточка сделки',
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
    exportAllBtn: 'Excel ექსპორტი',
    exportPdfBtn: 'PDF ექსპორტი',
    exportRowBtn: 'Excel-ში ჩამოტვირთვა',
    exportRowPdfBtn: 'PDF-ში შენახვა',
    moreActionsAria: 'დამატებითი მოქმედებები',
    brandSubtitle: 'უძრავი ქონების გადაბარების ვერიფიცირებული პლატფორმა',
    marketLocationLabel: 'ბაზარი / მდებარეობა',
    marketLocationValue: 'საქართველო (თბილისი · ბათუმი · გუდაური) — ვალუტა ($)',
    generatedAtLabel: 'გაცემის თარიღი',
    totalRecordsLabel: 'სულ ჩანაწერები',
    officialDocBadge: 'Aqar Exit-ის ოფიციალური დოკუმენტი',
    footerDisclaimer:
      'დოკუმენტი გენერირებულია Aqar Exit-ის ადმინისტრაციული პანელიდან.',
    propertiesReportTitle: 'ობიექტებისა და გამყიდველების სია',
    promotionsReportTitle: 'VIP რეკლამებისა და პაკეტების სია',
    singlePropertyReportTitle: 'უძრავი ქონების ოფიციალური ბარათი',
    leadsReportTitle: 'მყიდველებისა და მოთხოვნების სია',
    singleLeadReportTitle: 'მყიდველის მოთხოვნის ოფიციალური ბარათი',
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
 * 1. تصدير ملف إكسيل رسمي منسق بالكامل (.xls)
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

/**
 * 2. تصدير وثيقة PDF رسمية مرسومة باللوجو والتسطير الاحترافي
 * - إذا كان السجل واحداً (1 Row): يرسمه كاستمارة / بطاقة عقارية فخمة مسطرة (Dossier View)
 * - إذا كان عدة سجلات: يرسمه كجدول تقرير رسمي مسطر (Landscape Official Table)
 */
export function downloadOfficialPdfReport<T>({
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
  const resolvedTitle = reportTitle || L.propertiesReportTitle
  const isSingleDossier = data.length === 1
  const nowFormatted = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const docSerial = `DOC-${Date.now().toString(36).toUpperCase().slice(-6)}`

  // اللوجو الرسمي لـ Aqar Exit بصيغة SVG Vector عالية الدقة
  const logoSvgHtml = `
    <svg width="118" height="52" viewBox="0 0 116 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 30L17.5 5.5C18.2 4.1 19.8 4.1 20.5 5.5L33 30" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="46.5" cy="20" r="9.2" stroke="#ffffff" stroke-width="3.3"/>
      <path d="M55.7 10.8V35.5C55.7 37.5 56.8 38.8 58.8 38.8" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round"/>
      <circle cx="72" cy="20" r="9.2" stroke="#ffffff" stroke-width="3.3"/>
      <path d="M81.2 10.8V29.5" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round"/>
      <path d="M90.5 29.5V17.5C90.5 13.2 93.8 10.8 98 10.8H100.5" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round"/>
      <path d="M66 35.5C61 34.5 56.5 36.8 56.5 39.8C56.5 42.2 59.5 43.2 63 42.8C58.5 43.5 54.5 45.8 55 48.8C55.5 51.8 60.5 52.5 65.5 50.2" stroke="#2ee59d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M69 42.5L76.5 50M77 42.2C73.5 45 70.5 48 67.5 50.8" stroke="#2ee59d" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M81.5 43.2L79.5 49.5C79.2 50.3 79.8 50.8 80.8 50.3" stroke="#2ee59d" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="82.5" cy="39.5" r="1.2" fill="#2ee59d"/>
      <path d="M90.5 34.5L86 50.5" stroke="#2ee59d" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M83 41.2C88 40.5 94 39.8 100 39.2" stroke="#2ee59d" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `

  let contentHtml = ''

  if (isSingleDossier) {
    // تصميم استمارة / وثيقة رسمية مسطرة لسجل واحد
    const singleRow = data[0]
    const dossierFields = columns
      .filter((_, idx) => idx !== 0)
      .map((col) => {
        const rawVal = col.accessor(singleRow, 0)
        const formattedVal =
          typeof rawVal === 'number' && Number.isFinite(rawVal)
            ? Number(rawVal).toLocaleString('en-US')
            : escapeHtml(rawVal)

        return `
          <div class="dossier-cell">
            <div class="dossier-label">${escapeHtml(col.header)}</div>
            <div class="dossier-value" ${col.isPhone || typeof rawVal === 'number' ? 'dir="ltr"' : ''}>${formattedVal}</div>
          </div>
        `
      })
      .join('')

    contentHtml = `
      <div class="dossier-container">
        <div class="dossier-grid">
          ${dossierFields}
        </div>
      </div>
    `
  } else {
    // تصميم جدول رسمي مسطر لقائمة كاملة
    const thHtml = columns
      .map((col) => `<th>${escapeHtml(col.header)}</th>`)
      .join('')

    const trsHtml = data
      .map((row, rIdx) => {
        const tds = columns
          .map((col, cIdx) => {
            const rawVal = col.accessor(row, rIdx)
            const isNum = typeof rawVal === 'number' && Number.isFinite(rawVal)
            const text = isNum
              ? Number(rawVal).toLocaleString('en-US')
              : escapeHtml(rawVal)
            const cls =
              cIdx === 0
                ? 'col-idx'
                : col.isPhone
                  ? 'col-phone'
                  : isNum
                    ? 'col-num'
                    : ''
            const dirCell = col.isPhone || isNum ? 'dir="ltr"' : ''
            return `<td class="${cls}" ${dirCell}>${text}</td>`
          })
          .join('')
        return `<tr>${tds}</tr>`
      })
      .join('')

    contentHtml = `
      <table class="official-table">
        <thead>
          <tr>${thHtml}</tr>
        </thead>
        <tbody>
          ${trsHtml}
        </tbody>
      </table>
    `
  }

  const pdfDocumentHtml = `<!DOCTYPE html>
<html lang="${locale}" dir="${dirAttr}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(filenamePrefix)}_${new Date().toISOString().slice(0, 10)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${isSingleDossier ? 'A4 portrait' : 'A4 landscape'};
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #0a1122;
      background: #ffffff;
      direction: ${dirAttr};
    }
    .page-sheet {
      width: 100%;
      border: 2px solid #0a1122;
      border-radius: 14px;
      overflow: hidden;
      background: #ffffff;
    }
    .letterhead {
      background: linear-gradient(135deg, #0a1122 0%, #172554 60%, #105C50 100%);
      color: #ffffff;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 4px solid #2ee59d;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-text h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.3;
    }
    .brand-text p {
      margin: 4px 0 0;
      font-size: 11.5px;
      color: #a7f3d0;
      font-weight: 600;
    }
    .doc-badge-box {
      text-align: ${isRtl ? 'left' : 'right'};
      font-size: 11px;
      line-height: 1.6;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 10px;
      padding: 8px 14px;
    }
    .doc-serial {
      font-family: Consolas, monospace;
      color: #2ee59d;
      font-weight: 800;
      font-size: 12px;
    }
    .meta-strip {
      background: #f0fdf4;
      border-bottom: 1.5px solid #bbf7d0;
      padding: 10px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 11.5px;
      font-weight: 700;
      color: #105C50;
    }
    .content-wrapper {
      padding: 18px 20px;
    }
    /* تنسيق جدول القوائم المسطر */
    .official-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .official-table th {
      background-color: #0a1122;
      color: #ffffff;
      font-weight: 800;
      padding: 9px 8px;
      border: 1px solid #0a1122;
      text-align: center;
      white-space: nowrap;
    }
    .official-table td {
      padding: 8px 8px;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-weight: 600;
      vertical-align: middle;
    }
    .official-table tbody tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .col-idx {
      text-align: center;
      font-weight: 800;
      color: #64748b;
      width: 32px;
    }
    .col-phone {
      text-align: center;
      font-family: Consolas, monospace;
      font-weight: 800;
      color: #0a1122;
      white-space: nowrap;
    }
    .col-num {
      text-align: center;
      font-weight: 800;
      color: #105C50;
      white-space: nowrap;
    }
    /* تنسيق الاستمارة المفردة (Dossier) */
    .dossier-container {
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
    }
    .dossier-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
    .dossier-cell {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      border-inline-end: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .dossier-cell:nth-child(4n+3),
    .dossier-cell:nth-child(4n+4) {
      background: #f8fafc;
    }
    .dossier-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
    }
    .dossier-value {
      font-size: 13.5px;
      font-weight: 800;
      color: #0a1122;
      word-break: break-word;
    }
    .sheet-footer {
      border-top: 1.5px solid #e2e8f0;
      background: #f8fafc;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
    }
    .stamp-badge {
      color: #105C50;
      border: 1.5px dashed #105C50;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="page-sheet">
    <header class="letterhead">
      <div class="brand-box">
        ${logoSvgHtml}
        <div class="brand-text">
          <h1>${escapeHtml(resolvedTitle)}</h1>
          <p>${escapeHtml(L.brandSubtitle)}</p>
        </div>
      </div>
      <div class="doc-badge-box">
        <div class="doc-serial">REF: #${docSerial}</div>
        <div>${escapeHtml(L.generatedAtLabel)}: <span dir="ltr">${escapeHtml(nowFormatted)}</span></div>
      </div>
    </header>

    <div class="meta-strip">
      <span>📍 ${escapeHtml(L.marketLocationLabel)}: ${escapeHtml(L.marketLocationValue)}</span>
      <span>📊 ${escapeHtml(L.totalRecordsLabel)}: ${data.length}</span>
    </div>

    <div class="content-wrapper">
      ${contentHtml}
    </div>

    <footer class="sheet-footer">
      <span>${escapeHtml(L.footerDisclaimer)}</span>
      <span class="stamp-badge">✓ AQAR EXIT VERIFIED</span>
    </footer>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`

  const printWin = window.open('', '_blank', 'width=1120,height=820')
  if (!printWin) return
  printWin.document.open()
  printWin.document.write(pdfDocumentHtml)
  printWin.document.close()
}
