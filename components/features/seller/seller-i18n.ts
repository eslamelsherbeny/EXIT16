import type { Dictionary, LocaleCode } from '@/lib/i18n'

export const ACTIVE_PLATFORM_COUNTRY = 'GE'
export const DEFAULT_PHONE_CODE = '995'

export type SellerDocKey = 'contract' | 'receipts' | 'statement' | 'passport'

export type UploadedDocEntry = {
  url: string
  name: string
  uploaded_at: string
  status?: string
}

export type SellerExtraLabels = {
  georgiaLocationLabel: string
  deliveryMonthsLabel: string
  deliveryMonthsHelper: string
  contractMonthYearLabel: string
  remainingMonthsLabel: string
  remainingMonthsHelper: string
  monthsUnit: string
  docsStepTitle: string
  docsConditionTitle: string
  docsConditionDesc: string
  continueUploadLaterBtn: string
  continueToReviewBtn: string
  changeFileBtn: string
  removeFileBtn: string
  viewFullImageBtn: string
  uploadFileBtn: string
  rowContractDate: string
  rowRemainingMonths: string
  rowFeatures: string
  rowMarketPrice: string
  rowInstallment: string
  reviewNoteBeforeSubmit: string
  savedBadge: string
  verifyBoxTitle: string
  verifyBoxDescPrefix: string
  verifyBoxDescSuffix: string
  sendCodeBtn: string
  confirmCodeBtn: string
  resendCodeBtn: string
  codeSentToPrefix: string
  codeSentBody: string
  codeNotReceivedPrefix: string
  codeNotReceivedSuffix: string
  emailVerifiedBadge: string
  waVerifyBtn: string
  waVerifiedBadge: string
}

const SELLER_EXTRA_FALLBACKS: Record<LocaleCode, SellerExtraLabels> = {
  ar: {
    georgiaLocationLabel: 'المدينة / الحي في جورجيا *',
    deliveryMonthsLabel: 'متبقي كام شهر على الاستلام؟ *',
    deliveryMonthsHelper: 'اكتب عدد الشهور المتبقية حتى موعد استلام الوحدة',
    contractMonthYearLabel: 'تاريخ التعاقد (الشهر والسنة) *',
    remainingMonthsLabel: 'فاضل كام شهر تقسيط؟ *',
    remainingMonthsHelper: 'لو التقسيط خلص، اكتب صفر',
    monthsUnit: 'شهر',
    docsStepTitle: 'مستندات الملكية وجواز السفر',
    docsConditionTitle: 'رفع المستندات شرط أساسي لنشر وحدتك على المنصة',
    docsConditionDesc:
      'لضمان الجدية وحماية الملكية، يتم نشر الوحدة أمام المشترين بعد مراجعة العقد وصورة جواز السفر. لو المستندات مش جاهزة معاك دلوقتي، تقدر تكمل طلبك عادي وترفعها في أي وقت من صفحة حسابي.',
    continueUploadLaterBtn: 'كمّل وهرفعها بعدين',
    continueToReviewBtn: 'التالي — مراجعة الطلب',
    changeFileBtn: 'تغيير',
    removeFileBtn: 'حذف',
    viewFullImageBtn: 'معاينة',
    uploadFileBtn: 'ارفع الملف',
    rowContractDate: 'تاريخ التعاقد',
    rowRemainingMonths: 'الأقساط المتبقية (بالشهور)',
    rowFeatures: 'المميزات',
    rowMarketPrice: 'سعر السوق دلوقتي',
    rowInstallment: 'القسط',
    reviewNoteBeforeSubmit:
      'أول ما تبعت، فريقنا بيراجع الوحدة وينشرها في السوق. المستندات (العقد والإيصالات) بنطلبها بعدين قبل إتمام البيع — مش قبل النشر.',
    savedBadge: 'محفوظ ✓',
    verifyBoxTitle: 'خطوة أخيرة — أكّد بريدك الإلكتروني',
    verifyBoxDescPrefix:
      'عشان نحمي المنصة من الحسابات الوهمية، هنبعتلك كود على إيميلك',
    verifyBoxDescSuffix: '— مش على الواتساب. فجهّز إيميلك.',
    sendCodeBtn: 'ابعتلي الكود',
    confirmCodeBtn: 'تأكيد',
    resendCodeBtn: 'ابعت تاني',
    codeSentToPrefix: '✉️ الكود اتبعت على إيميلك',
    codeSentBody:
      'افتح إيميلك دلوقتي. الكود مكتوب في عنوان الرسالة. لو مش لاقيها، بص في Spam أو Promotions — بتوصل هناك أحيانًا.',
    codeNotReceivedPrefix: 'لسه موصلش؟ كلمنا على واتساب',
    codeNotReceivedSuffix: 'وهنكمّل معاك.',
    emailVerifiedBadge: 'تم توثيق بريدك الإلكتروني بنجاح ✓',
    waVerifyBtn: 'تأكيد رقم الموبايل والوحدة عبر واتساب',
    waVerifiedBadge: 'تم تأكيد رقم الموبايل عبر واتساب ✓',
  },
  en: {
    georgiaLocationLabel: 'City / District in Georgia *',
    deliveryMonthsLabel: 'Remaining months until delivery *',
    deliveryMonthsHelper: 'Enter how many months left until handover',
    contractMonthYearLabel: 'Contract Date (Month & Year) *',
    remainingMonthsLabel: 'Remaining installment months *',
    remainingMonthsHelper: 'If fully paid, enter 0',
    monthsUnit: 'months',
    docsStepTitle: 'Ownership Documents & Passport',
    docsConditionTitle: 'Uploading documents is required to publish your unit',
    docsConditionDesc:
      'To protect both buyer and seller, units are published on the marketplace after verifying the contract and passport. If they are not ready right now, you can continue and upload them later from your account.',
    continueUploadLaterBtn: 'Continue & Upload Later',
    continueToReviewBtn: 'Next — Review Request',
    changeFileBtn: 'Replace',
    removeFileBtn: 'Remove',
    viewFullImageBtn: 'Preview',
    uploadFileBtn: 'Upload File',
    rowContractDate: 'Contract Date',
    rowRemainingMonths: 'Remaining Installments',
    rowFeatures: 'Features',
    rowMarketPrice: 'Current Market Price',
    rowInstallment: 'Installment',
    reviewNoteBeforeSubmit:
      'Once submitted, our team reviews the unit to publish it on the marketplace. Ownership documents are verified before publishing.',
    savedBadge: 'Saved ✓',
    verifyBoxTitle: 'Final Step — Confirm Your Email',
    verifyBoxDescPrefix:
      'To protect the platform from fake accounts, we will send a code to your email',
    verifyBoxDescSuffix: '— not on WhatsApp. Please check your inbox.',
    sendCodeBtn: 'Send Me the Code',
    confirmCodeBtn: 'Confirm',
    resendCodeBtn: 'Resend',
    codeSentToPrefix: '✉️ The code was sent to your email',
    codeSentBody:
      'Open your email now. The code is written in the email subject. If you do not see it, check Spam or Promotions.',
    codeNotReceivedPrefix: 'Still not received? Contact us on WhatsApp',
    codeNotReceivedSuffix: 'and we will help you.',
    emailVerifiedBadge: 'Email Verified Successfully ✓',
    waVerifyBtn: 'Confirm Phone & Unit via WhatsApp',
    waVerifiedBadge: 'WhatsApp Confirmation Opened ✓',
  },
  ru: {
    georgiaLocationLabel: 'Город / Район в Грузии *',
    deliveryMonthsLabel: 'Сколько месяцев осталось до сдачи *',
    deliveryMonthsHelper: 'Укажите количество месяцев до завершения строительства',
    contractMonthYearLabel: 'Дата договора (Месяц и Год) *',
    remainingMonthsLabel: 'Осталось месяцев рассрочки *',
    remainingMonthsHelper: 'Если рассрочка выплачена, введите 0',
    monthsUnit: 'мес.',
    docsStepTitle: 'Документы на недвижимость и Паспорт',
    docsConditionTitle: 'Загрузка документов обязательна для публикации объекта',
    docsConditionDesc:
      'Для защиты сторон объект публикуется на витрине после проверки договора и паспорта. Если документов сейчас нет под рукой, вы можете продолжить и загрузить их позже в личном кабинете.',
    continueUploadLaterBtn: 'Продолжить и загрузить позже',
    continueToReviewBtn: 'Далее — Проверка заявки',
    changeFileBtn: 'Заменить',
    removeFileBtn: 'Удалить',
    viewFullImageBtn: 'Просмотр',
    uploadFileBtn: 'Загрузить',
    rowContractDate: 'Дата договора',
    rowRemainingMonths: 'Остаток рассрочки',
    rowFeatures: 'Особенности',
    rowMarketPrice: 'Рыночная цена сейчас',
    rowInstallment: 'Платеж рассрочки',
    reviewNoteBeforeSubmit:
      'После отправки наша команда проверит объект и опубликует его на платформе.',
    savedBadge: 'Сохранено ✓',
    verifyBoxTitle: 'Последний шаг — Подтвердите ваш Email',
    verifyBoxDescPrefix:
      'Для защиты платформы от фейковых аккаунтов мы отправим код на ваш email',
    verifyBoxDescSuffix: '— проверьте вашу почту.',
    sendCodeBtn: 'Отправить код',
    confirmCodeBtn: 'Подтвердить',
    resendCodeBtn: 'Отправить снова',
    codeSentToPrefix: '✉️ Код отправлен на ваш email',
    codeSentBody:
      'Откройте почту. Код указан прямо в теме письма. Если письма нет, проверьте папку Спам или Промоакции.',
    codeNotReceivedPrefix: 'Не пришел код? Напишите нам в WhatsApp',
    codeNotReceivedSuffix: 'и мы поможем вам.',
    emailVerifiedBadge: 'Email успешно подтвержден ✓',
    waVerifyBtn: 'Подтвердить телефон и объект через WhatsApp',
    waVerifiedBadge: 'Подтверждение WhatsApp открыто ✓',
  },
  ka: {
    georgiaLocationLabel: 'ქალაქი / უბანი საქართველოში *',
    deliveryMonthsLabel: 'ჩაბარებამდე დარჩენილი თვეები *',
    deliveryMonthsHelper: 'მიუთითეთ რამდენი თვე დარჩა ჩაბარებამდე',
    contractMonthYearLabel: 'ხელშეკრულების თარიღი (თვე და წელი) *',
    remainingMonthsLabel: 'განვადების დარჩენილი თვეები *',
    remainingMonthsHelper: 'თუ სრულად გადახდილია, ჩაწერეთ 0',
    monthsUnit: 'თვე',
    docsStepTitle: 'საკუთრების დოკუმენტები და პასპორტი',
    docsConditionTitle: 'დოკუმენტების ატვირთვა აუცილებელია გამოსაქვეყნებლად',
    docsConditionDesc:
      'ობიექტი ქვეყნდება კონტრაქტისა და პასპორტის გადამოწმების შემდეგ. თუ ახლა მზად არ გაქვთ, შეგიძლიათ გააგრძელოთ და მოგვიანებით ატვირთოთ თქვენი ანგარიშიდან.',
    continueUploadLaterBtn: 'გაგრძელება და მოგვიანებით ატვირთვა',
    continueToReviewBtn: 'შემდეგი — განაცხადის გადახედვა',
    changeFileBtn: 'შეცვლა',
    removeFileBtn: 'წაშლა',
    viewFullImageBtn: 'ნახვა',
    uploadFileBtn: 'ატვირთვა',
    rowContractDate: 'ხელშეკრულების თარიღი',
    rowRemainingMonths: 'დარჩენილი განვადება',
    rowFeatures: 'მახასიათებლები',
    rowMarketPrice: 'საბაზრო ფასი ახლა',
    rowInstallment: 'განვადების თანხა',
    reviewNoteBeforeSubmit:
      'გაგზავნის შემდეგ ჩვენი გუნდი გადაამოწმებს ობიექტს და გამოაქვეყნებს პლატფორმაზე.',
    savedBadge: 'შენახულია ✓',
    verifyBoxTitle: 'ბოლო ნაბიჯი — დაადასტურეთ ელ-ფოსტა',
    verifyBoxDescPrefix:
      'პლატფორმის დასაცავად კודს გამოგიგზავნით ელ-ფოსტაზე',
    verifyBoxDescSuffix: '— შეამოწმეთ თქვენი ელ-ფოსტა.',
    sendCodeBtn: 'კოდის გაგზავნა',
    confirmCodeBtn: 'დადასტურება',
    resendCodeBtn: 'თავიდან გაგზავნა',
    codeSentToPrefix: '✉️ კოდი გაიგზავნა ელ-ფოსტაზე',
    codeSentBody:
      'გახსენით ელ-ფოსტა. კოდი წერია წერილის სათაურში. შეამოწმეთ Spam ან Promotions საქაღალდე.',
    codeNotReceivedPrefix: 'კოდი არ მოვიდა? მოგვწერეთ WhatsApp-ზე',
    codeNotReceivedSuffix: 'და დაგეხმარებით.',
    emailVerifiedBadge: 'ელ-ფოსტა დადასტურებულია ✓',
    waVerifyBtn: 'ნომრისა და ობიექტის დადასტურება WhatsApp-ით',
    waVerifiedBadge: 'WhatsApp დადასტურება გახსნილია ✓',
  },
}

/**
 * تقرأ المفاتيح أولاً من ملف الترجمة الرسمي (dict.sell) مع الرجوع الآمن لقاموس اللغات الأربع
 */
export function getSellerExtraLabels(
  locale: LocaleCode,
  dict?: Dictionary | Record<string, any>
): SellerExtraLabels {
  const fb = SELLER_EXTRA_FALLBACKS[locale] || SELLER_EXTRA_FALLBACKS.ar
  const customExtra = (dict?.sell as Record<string, any>)?.extraLabels || {}
  return {
    ...fb,
    ...customExtra,
  }
}

export function maskEmailDisplay(email?: string): string {
  const clean = String(email || '').trim()
  if (!clean || !clean.includes('@')) return 'es***@gmail.com'
  const [local, domain] = clean.split('@')
  const prefix = local.slice(0, Math.min(2, local.length))
  return `${prefix}***@${domain}`
}

export function isImageFileUrl(url?: string, name?: string): boolean {
  const target = `${url || ''} ${name || ''}`.toLowerCase()
  if (target.includes('.pdf')) return false
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)/i.test(target) || Boolean(url)
}
