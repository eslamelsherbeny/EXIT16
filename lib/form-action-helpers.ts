import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import nodemailer from 'nodemailer'
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from '@/lib/session-security'
import { getServerI18n } from '@/lib/get-server-dictionary'
import type { LocaleCode } from '@/lib/i18n-config'

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-16.vercel.app'
export const ACTIVE_COUNTRY_CODE = 'GE'
export const ACTIVE_CURRENCY_CODE = 'USD'

export type ListingCategoryType =
  | 'exit'
  | 'sale'
  | 'rent_monthly'
  | 'rent_daily'
  | 'pledge'

// القاموس الموحد للمميزات المقسمة إلى 6 مجموعات (Space, Building, Utilities, Comfort, Views, Extra)
export const SIVRCE_FEATURE_GROUPS = [
  {
    key: 'space',
    labelEn: 'Space',
    labelAr: 'المساحات والتقسيم',
    items: [
      { id: 'Balcony', labelEn: 'Balcony', labelAr: 'بلكونة (شرفة)' },
      { id: 'Loggia', labelEn: 'Loggia', labelAr: 'لوجيا (شرفة مغلقة)' },
      { id: 'Terrace', labelEn: 'Terrace', labelAr: 'تراس مفتوح' },
      { id: 'Yard', labelEn: 'Yard', labelAr: 'حديقة / فناء خاص' },
      { id: 'Storage', labelEn: 'Storage', labelAr: 'غرفة تخزين' },
      { id: 'Cellar', labelEn: 'Cellar', labelAr: 'قبو (بدروم)' },
      { id: 'Walk-in closet', labelEn: 'Walk-in closet', labelAr: 'غرفة ملابس (Dressing)' },
      { id: 'Separate kitchen', labelEn: 'Separate kitchen', labelAr: 'مطبخ منفصل' },
    ],
  },
  {
    key: 'building',
    labelEn: 'Building',
    labelAr: 'المبنى والحماية',
    items: [
      { id: 'Elevator', labelEn: 'Elevator', labelAr: 'مصعد حديث' },
      { id: 'Parking', labelEn: 'Parking', labelAr: 'موقف سيارات' },
      { id: 'Underground parking', labelEn: 'Underground parking', labelAr: 'جراج تحت الأرض' },
      { id: 'Garage', labelEn: 'Garage', labelAr: 'جراج خاص مغلق' },
      { id: 'Security', labelEn: 'Security', labelAr: 'أمن وحراسة 24/7' },
      { id: 'Concierge', labelEn: 'Concierge', labelAr: 'استقبال (كونسيرج)' },
      { id: 'Intercom', labelEn: 'Intercom', labelAr: 'إنتركم مرئي' },
      { id: 'Backup generator', labelEn: 'Backup generator', labelAr: 'مولد كهرباء احتياطي' },
      { id: 'Iron door', labelEn: 'Iron door', labelAr: 'باب مصفح' },
      { id: 'Double glazing', labelEn: 'Double glazing', labelAr: 'نوافذ زجاج مزدوج عازل' },
      { id: 'Penthouse', labelEn: 'Penthouse', labelAr: 'بنتهاوس' },
      { id: 'Step-free access', labelEn: 'Step-free access', labelAr: 'مدخل مهيأ بدون درجات' },
    ],
  },
  {
    key: 'utilities',
    labelEn: 'Utilities',
    labelAr: 'المرافق والأساسيات',
    items: [
      { id: 'Underfloor heating', labelEn: 'Underfloor heating', labelAr: 'تدفئة أرضية' },
      { id: 'Natural gas', labelEn: 'Natural gas', labelAr: 'غاز طبيعي' },
      { id: 'Hot water', labelEn: 'Hot water', labelAr: 'مياه ساخنة مركزية' },
      { id: 'Internet', labelEn: 'Internet', labelAr: 'إنترنت فايبر' },
      { id: 'Cable TV', labelEn: 'Cable TV', labelAr: 'قنوات كابل وتلفاز' },
    ],
  },
  {
    key: 'comfort',
    labelEn: 'Comfort',
    labelAr: 'الراحة والأجهزة',
    items: [
      { id: 'Furniture', labelEn: 'Furniture', labelAr: 'مفروش بالكامل' },
      { id: 'Appliances', labelEn: 'Appliances', labelAr: 'أجهزة كهربائية كاملة' },
      { id: 'Air conditioning', labelEn: 'Air conditioning', labelAr: 'تكييف هواء' },
      { id: 'Dishwasher', labelEn: 'Dishwasher', labelAr: 'غسالة أطباق' },
      { id: 'Washing machine', labelEn: 'Washing machine', labelAr: 'غسالة ملابس' },
      { id: 'Dryer', labelEn: 'Dryer', labelAr: 'مجفف ملابس' },
      { id: 'Fireplace', labelEn: 'Fireplace', labelAr: 'مدفأة (Fireplace)' },
      { id: 'Kitchen', labelEn: 'Kitchen', labelAr: 'مطبخ مجهز' },
      { id: 'TV', labelEn: 'TV', labelAr: 'شاشة تلفاز ذكية' },
    ],
  },
  {
    key: 'views',
    labelEn: 'Views',
    labelAr: 'الإطلالة والإضاءة',
    items: [
      { id: 'Panoramic view', labelEn: 'Panoramic view', labelAr: 'إطلالة بانورامية مفتوحة' },
      { id: 'Sea view', labelEn: 'Sea view', labelAr: 'إطلالة بحرية' },
      { id: 'Mountain view', labelEn: 'Mountain view', labelAr: 'إطلالة على الجبال' },
      { id: 'Yard view', labelEn: 'Yard view', labelAr: 'إطلالة على الحديقة' },
      { id: 'Street view', labelEn: 'Street view', labelAr: 'إطلالة على الشارع الرئيسي' },
      { id: 'Beachfront', labelEn: 'Beachfront', labelAr: 'صف أول على البحر' },
      { id: 'Bright', labelEn: 'Bright', labelAr: 'مشمس ومضيء طبيعياً' },
      { id: 'Quiet', labelEn: 'Quiet', labelAr: 'منطقة هادئة' },
    ],
  },
  {
    key: 'extra',
    labelEn: 'Extra',
    labelAr: 'مميزات إضافية وفاخرة',
    items: [
      { id: 'Pool', labelEn: 'Pool', labelAr: 'حمام سباحة (مسبح)' },
      { id: 'Jacuzzi', labelEn: 'Jacuzzi', labelAr: 'جاكوزي' },
      { id: 'Sauna', labelEn: 'Sauna', labelAr: 'ساونا' },
      { id: 'Gym', labelEn: 'Gym', labelAr: 'صالة جيم رياضية' },
      { id: 'BBQ grill', labelEn: 'BBQ grill', labelAr: 'منطقة شواء (BBQ)' },
      { id: 'EV charger', labelEn: 'EV charger', labelAr: 'شاحن سيارات كهربائية' },
      { id: 'Ski access', labelEn: 'Ski access', labelAr: 'قريب من مسارات التزلج' },
    ],
  },
] as const

const FORMS_MESSAGES_FALLBACK: Record<LocaleCode, Record<string, string>> = {
  ar: {
    expiredLink: 'انتهت صلاحية هذا الرابط أو أنه غير صالح.',
    invalidLink: 'الرابط غير صالح.',
    verifyFailed: 'تعذر التحقق من الرابط.',
    unitOwnerFallback: 'مالك وحدة',
    buyerFallback: 'مشتري',
    unitWord: 'وحدة',
    newDraftUnitAdminTitle: 'وحدة جديدة قيد الاستكمال',
    unitSubmittedSellerTitle: 'تم استلام بيانات وحدتك المبدئية ✓',
    unitSubmittedSellerMsg: 'يمكنك استكمال تفاصيل وصور ومستندات وحدتك في أي وقت',
    editedUnitAdminTitle: 'تعديل وحدة من البائع',
    completedUnitAdminTitle: 'وحدة مكتملة جاهزة للمراجعة',
    newUnitReviewAdminTitle: 'وحدة جديدة للمراجعة',
    newBuyRequestAdminTitle: 'طلب شراء جديد',
    radarActivatedBuyerTitle: 'تم تفعيل رادار الفرص العقارية لحسابك 🎯',
    radarActivatedBuyerMsg: 'سنقوم بإشعارك فور توفر وحدات مطابقة لميزانيتك',
    emailSenderName: 'Aqar Exit',
    orderReceivedSubjectPrefix: 'تم استلام طلب عرض وحدتك رقم',
    buyOrderSubjectPrefix: 'تم تسجيل طلب الشراء الخاص بك رقم',
    greetingWord: 'أهلاً',
    orderRefLabel: 'رقم مرجع الطلب',
    orderPaidConfirmText: 'السعر / المبلغ المسجل',
    registeredCashLabel: 'ميزانية الكاش المسجلة',
    orderMagicLinkPrompt:
      'اضغط على الرابط التالي لتأكيد بريدك الإلكتروني ومتابعة طلبك مباشرة على الموقع',
    sessionExpired: 'انتهت الجلسة أو لا تملك صلاحية تعديل هذه الوحدة.',
    enterLogin: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور.',
    notRegistered: 'هذا الحساب غير مسجل لدينا. اختر "تسجيل حساب جديد".',
    wrongPassword: 'كلمة المرور غير صحيحة.',
    fillAll:
      'يرجى استكمال كافة البيانات والتأكد أن كلمة المرور 8 أحرف على الأقل.',
    createAccountFailed:
      'تعذر إنشاء الحساب، قد يكون البريد أو الهاتف مسجلاً مسبقاً.',
    unexpected: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
    emailNotFound: 'لم يتم العثور على بريد إلكتروني مسجل لهذا الحساب.',
    recoveryEmailSubject: 'استعادة الدخول واستكمال طلبك — Aqar Exit',
    recoveryEmailPrompt:
      'اضغط على الرابط التالي لتعيين كلمة مرور جديدة والدخول لحسابك',
    sendLinkFailed: 'تعذر إرسال الرابط حالياً، يرجى المحاولة لاحقاً.',
    shortPassword: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
    updatePassFailed: 'تعذر تحديث كلمة المرور.',
    saveProgressFailed: 'تعذر حفظ التقدم حالياً.',
    submitUnitFailed: 'تعذر إرسال طلب الإعلان حالياً، يرجى المحاولة مرة أخرى.',
    defaultMonthly: 'شهري',
    defaultReady: 'جاهز للاستلام',
    enterNamePhone: 'يرجى إدخال الاسم ورقم الهاتف.',
    investorFailed: 'تعذر إرسال الطلب حالياً.',
    otpSubjectPrefix: 'كود التأكيد الخاص بك في عقار إكزت هو:',
    otpInvalid: 'كود التأكيد غير صحيح أو منتهي الصلاحية.',
    otpSendError: 'تعذر إرسال الكود حالياً، يرجى المحاولة مرة أخرى.',
  },
  en: {
    expiredLink: 'This link has expired or is invalid.',
    invalidLink: 'Invalid link.',
    verifyFailed: 'Could not verify the link.',
    unitOwnerFallback: 'Unit Owner',
    buyerFallback: 'Buyer',
    unitWord: 'Unit',
    newDraftUnitAdminTitle: 'New Draft Unit',
    unitSubmittedSellerTitle: 'Your initial unit details were received ✓',
    unitSubmittedSellerMsg:
      'You can complete your unit details and documents anytime',
    editedUnitAdminTitle: 'Unit Edited by Seller',
    completedUnitAdminTitle: 'Completed Unit Ready for Review',
    newUnitReviewAdminTitle: 'New Unit for Review',
    newBuyRequestAdminTitle: 'New Buy Request',
    radarActivatedBuyerTitle: 'Smart Opportunity Radar Activated 🎯',
    radarActivatedBuyerMsg:
      'We will notify you as soon as matching units are available',
    emailSenderName: 'Aqar Exit',
    orderReceivedSubjectPrefix: 'Unit Listing Request Received #',
    buyOrderSubjectPrefix: 'Your Buy Request is Registered #',
    greetingWord: 'Hello',
    orderRefLabel: 'Order Reference',
    orderPaidConfirmText: 'Registered Price / Amount',
    registeredCashLabel: 'Registered Cash Budget',
    orderMagicLinkPrompt:
      'Click the link below to confirm your email and access your request on the website',
    sessionExpired:
      'Your session has expired or you do not have permission to edit this unit.',
    enterLogin: 'Please enter your email or phone number and password.',
    notRegistered:
      'No account found with these details. Please choose "New Account".',
    wrongPassword: 'Incorrect password.',
    fillAll:
      'Please complete all required fields and use at least 8 characters for password.',
    createAccountFailed:
      'Could not create account. Email or phone may already be registered.',
    unexpected: 'An unexpected error occurred. Please try again.',
    emailNotFound: 'No registered email address found for this account.',
    recoveryEmailSubject: 'Reset Password & Continue Your Request — Aqar Exit',
    recoveryEmailPrompt:
      'Click the link below to set a new password and access your account',
    sendLinkFailed: 'Could not send recovery link right now.',
    shortPassword: 'Password must be at least 8 characters.',
    updatePassFailed: 'Could not update password.',
    saveProgressFailed: 'Could not save progress right now.',
    submitUnitFailed:
      'Could not submit your unit right now. Please try again.',
    defaultMonthly: 'Monthly',
    defaultReady: 'Ready to Move',
    enterNamePhone: 'Please enter your name and phone number.',
    investorFailed: 'Could not submit request right now.',
    otpSubjectPrefix: 'Your Aqar Exit verification code is:',
    otpInvalid: 'Invalid or expired verification code.',
    otpSendError: 'Could not send verification code right now.',
  },
  ru: {
    expiredLink: 'Срок действия ссылки истек или она недействительна.',
    invalidLink: 'Недействительная ссылка.',
    verifyFailed: 'Не удалось проверить ссылку.',
    unitOwnerFallback: 'Владелец',
    buyerFallback: 'Покупатель',
    unitWord: 'Объект',
    newDraftUnitAdminTitle: 'Новый черновик объекта',
    unitSubmittedSellerTitle: 'Предварительные данные объекта получены ✓',
    unitSubmittedSellerMsg:
      'Вы можете дополнить описание и документы в любое время',
    editedUnitAdminTitle: 'Объект обновлен продавцом',
    completedUnitAdminTitle: 'Объект заполнен и готов к проверке',
    newUnitReviewAdminTitle: 'Новый объект на проверку',
    newBuyRequestAdminTitle: 'Новая заявка на покупку',
    radarActivatedBuyerTitle: 'Радар выгодных объектов активирован 🎯',
    radarActivatedBuyerMsg:
      'Мы уведомим вас при появлении подходящих вариантов',
    emailSenderName: 'Aqar Exit',
    orderReceivedSubjectPrefix: 'Заявка на продажу объекта получена №',
    buyOrderSubjectPrefix: 'Ваша заявка на покупку зарегистрирована №',
    greetingWord: 'Здравствуйте,',
    orderRefLabel: 'Номер заявки',
    orderPaidConfirmText: 'Зарегистрированная сумма',
    registeredCashLabel: 'Зарегистрированный бюджет наличными',
    orderMagicLinkPrompt:
      'Перейдите по ссылке ниже для подтверждения email и входа на сайт',
    sessionExpired:
      'Сессия истекла или у вас нет прав на редактирование этого объекта.',
    enterLogin: 'Введите ваш email или номер телефона и пароль.',
    notRegistered: 'Аккаунт не найден. Выберите «Регистрация».',
    wrongPassword: 'Неверный пароль.',
    fillAll:
      'Заполните все обязательные поля (пароль не менее 8 символов).',
    createAccountFailed:
      'Не удалось создать аккаунт. Email или телефон уже используется.',
    unexpected: 'Произошла ошибка. Пожалуйста, попробуйте снова.',
    emailNotFound: 'Для этого аккаунта не найден зарегистрированный email.',
    recoveryEmailSubject: 'Восстановление доступа — Aqar Exit',
    recoveryEmailPrompt:
      'Перейдите по ссылке ниже для установки нового пароля',
    sendLinkFailed: 'Не удалось отправить ссылку.',
    shortPassword: 'Пароль должен содержать не менее 8 символов.',
    updatePassFailed: 'Не удалось обновить пароль.',
    saveProgressFailed: 'Не удалось сохранить черновик.',
    submitUnitFailed: 'Не удалось отправить заявку. Попробуйте снова.',
    defaultMonthly: 'Ежемесячно',
    defaultReady: 'Готов к заселению',
    enterNamePhone: 'Введите имя и номер телефона.',
    investorFailed: 'Не удалось отправить запрос.',
    otpSubjectPrefix: 'Ваш код подтверждения Aqar Exit:',
    otpInvalid: 'Неверный или просроченный код подтверждения.',
    otpSendError: 'Не удалось отправить код подтверждения.',
  },
  ka: {
    expiredLink: 'ბმულს ვადა გაუვიდა ან არასწორია.',
    invalidLink: 'არასწორი ბმული.',
    verifyFailed: 'ბმულის გადამოწმება ვერ მოხერხდა.',
    unitOwnerFallback: 'მესაკუთრე',
    buyerFallback: 'მყიდველი',
    unitWord: 'ობიექტი',
    newDraftUnitAdminTitle: 'ახალი ობიექტის მონახაზი',
    unitSubmittedSellerTitle: 'ობიექტის პირველადი მონაცემები მიღებულია ✓',
    unitSubmittedSellerMsg:
      'დეტალებისა და დოკუმენტების შევსება ნებისმიერ დროს შეგიძლიათ',
    editedUnitAdminTitle: 'ობიექტი განახლდა გამყidველის მიერ',
    completedUnitAdminTitle: 'ობიექტი მზადაა შესამოწმებლად',
    newUnitReviewAdminTitle: 'ახალი ობიექტი შესამოწმებლად',
    newBuyRequestAdminTitle: 'ახალი შეძენის მოთხოვნა',
    radarActivatedBuyerTitle: 'შეთავაზებების რადარი გააქტიურებულია 🎯',
    radarActivatedBuyerMsg:
      'შეგატყობინებთ შესაბამისი ვარიანტების გამოჩენისთანავე',
    emailSenderName: 'Aqar Exit',
    orderReceivedSubjectPrefix: 'განაცხადი მიღებულია #',
    buyOrderSubjectPrefix: 'შეძენის მოთხოვნა რეგისტრირებულია #',
    greetingWord: 'გამარჯობა',
    orderRefLabel: 'განაცხადის ნომერი',
    orderPaidConfirmText: 'დაფიქსირებული თანხა',
    registeredCashLabel: 'დაფიქსირებული ბიუჯეტი',
    orderMagicLinkPrompt:
      'ელ-ფოსტის დასადასტურებლად და საიტზე შესასვლელად გადადით ბმულზე',
    sessionExpired: 'სესიის ვადა ამოიწურა ან არ გაქვთ რედაქტირების უფლება.',
    enterLogin: 'შეიყვანეთ ელ-ფოსტა ან ტელეფონის ნომერი და პაროლი.',
    notRegistered: 'ანგარიში ვერ მოიძებნა. აირჩიეთ „ახალი რეგისტრაცია“.',
    wrongPassword: 'პაროლი არასწორია.',
    fillAll: 'გთხოვთ შეავსოთ ყველა ველი (პაროლი მინიმუმ 8 სიმბოლო).',
    createAccountFailed:
      'ანგარიშის შექმნა ვერ მოხერხდა. ელ-ფოსტა ან ტელეფონი უკვე რეგისტრირებულია.',
    unexpected: 'მოხდა შეცდომა, გთხოვთ სცადოთ თავიდან.',
    emailNotFound: 'ელ-ფოსტა ვერ მოიძებნა.',
    recoveryEmailSubject: 'პაროლის აღდგენა — Aqar Exit',
    recoveryEmailPrompt: 'ახალი პაროლის დასაყენებლად გადადით ბმულზე',
    sendLinkFailed: 'ბმულის გაგზავნა ვერ მოხერხდა.',
    shortPassword: 'პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან.',
    updatePassFailed: 'პაროლის განახლება ვერ მოხერხდა.',
    saveProgressFailed: 'მონაცემების შენახვა ვერ მოხერხდა.',
    submitUnitFailed: 'განაცხადის გაგზავნა ვერ მოხერხდა.',
    defaultMonthly: 'ყოველთვიური',
    defaultReady: 'ჩაბარებული',
    enterNamePhone: 'შეიყვანეთ სახელი და ტელეფონის ნომერი.',
    investorFailed: 'მოთხოვნის გაგზავნა ვერ მოხერხდა.',
    otpSubjectPrefix: 'თქვენი Aqar Exit დადასტურების კოდია:',
    otpInvalid: 'კოდი არასწორია ან ვადა გაუვიდა.',
    otpSendError: 'კოდის გაგზავნა ვერ მოხერხდა.',
  },
}

export async function getFormsDict() {
  const { dict, locale, dir } = await getServerI18n()
  const raw =
    (dict as Record<string, any>)?.serverActions?.forms ||
    (dict as Record<string, any>)?.serverActions?.submitForms ||
    {}
  const fb = FORMS_MESSAGES_FALLBACK[locale] || FORMS_MESSAGES_FALLBACK.en
  const t: Record<string, string> = { ...fb }

  for (const key of Object.keys(fb)) {
    const val = raw[key]
    if (typeof val === 'string' && val.trim()) {
      if (locale !== 'ar' && /[\u0600-\u06FF]/.test(val)) {
        t[key] = fb[key]
      } else {
        t[key] = val
      }
    }
  }

  return { t, locale, dir }
}

export async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export function getSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'aqar-exit-enterprise-secret-key-2026'
  )
}

export async function getVerifiedSellerSession(supabase: any) {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get('user_session')?.value
  const sessionId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !sessionId) return null

  const { data: user } = await supabase
    .from('users')
    .select(
      'id, name, email, phone, country, role, status, is_verified, password_hash'
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (!user) return null
  const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
  const status = String(user.status || 'active').trim().toLowerCase()
  if (!check.valid || status === 'suspended') return null

  return user
}

export async function setUserSession(
  userId: string,
  passwordHash?: string | null
) {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  cookieStore.delete('session_hint')

  const isProd = process.env.NODE_ENV === 'production'
  const token = createSignedSessionToken(userId, passwordHash)

  cookieStore.set('user_session', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isProd,
    httpOnly: true,
  })
  cookieStore.set('session_hint', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: isProd,
  })
}

export async function upsertUserVerificationMeta(
  supabase: any,
  userId: string,
  updates: { emailVerified?: boolean; phoneVerified?: boolean }
) {
  if (!userId) return

  try {
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id, message')
      .eq('user_id', userId)
      .eq('title', '__USER_VERIFICATION_META__')
      .maybeSingle()

    let currentMeta = { emailVerified: false, phoneVerified: false }
    if (existingNotif?.message) {
      try {
        currentMeta = { ...currentMeta, ...JSON.parse(existingNotif.message) }
      } catch {}
    }

    const nextMeta = {
      emailVerified:
        updates.emailVerified !== undefined
          ? updates.emailVerified
          : currentMeta.emailVerified,
      phoneVerified:
        updates.phoneVerified !== undefined
          ? updates.phoneVerified
          : currentMeta.phoneVerified,
      updatedAt: new Date().toISOString(),
    }

    if (existingNotif?.id) {
      await supabase
        .from('notifications')
        .update({ message: JSON.stringify(nextMeta), is_read: true })
        .eq('id', existingNotif.id)
    } else {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '__USER_VERIFICATION_META__',
        message: JSON.stringify(nextMeta),
        type: 'system_verification',
        link: '/account',
        is_read: true,
      })
    }
  } catch {}

  if (updates.emailVerified !== undefined) {
    try {
      await supabase
        .from('users')
        .update({
          is_verified: updates.emailVerified,
          ...(updates.emailVerified ? { otp_code: null } : {}),
        })
        .eq('id', userId)
    } catch {}
  }

  if (updates.phoneVerified !== undefined) {
    try {
      await supabase
        .from('users')
        .update({ phone_verified: updates.phoneVerified })
        .eq('id', userId)
    } catch {}
  }
}

export async function sendNotificationEmail({
  to,
  subject,
  html,
  senderName,
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '')

  if (!user || !pass || !to) return false

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    await transporter.sendMail({
      from: `"${senderName || 'Aqar Exit'}" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Notification email error:', error)
    return false
  }
}

export function normalizeDigits(str: string): string {
  return String(str || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

export function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function number(formData: FormData, key: string, fallback = 0) {
  const rawValue = normalizeDigits(text(formData, key))
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '')
  if (!rawValue) return fallback
  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function integer(formData: FormData, key: string, fallback = 0) {
  const rawValue = normalizeDigits(text(formData, key))
    .replace(/,/g, '')
    .replace(/[^0-9]/g, '')
  if (!rawValue) return fallback
  const value = Number.parseInt(rawValue, 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function list(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    )
}

export function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase()
}

export function getPhoneVariants(rawPhone: string) {
  const digits = normalizeDigits(rawPhone || '')
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return []
  if (digits.startsWith('+')) {
    const noPlus = digits.slice(1)
    return Array.from(new Set([digits, noPlus, `0${noPlus}`]))
  }
  const stripped = digits.replace(/^0+/, '')
  return Array.from(
    new Set([
      digits,
      `+${stripped}`,
      `0${stripped}`,
      `+995${stripped}`,
      `+20${stripped}`,
      `+966${stripped}`,
      `+971${stripped}`,
    ])
  )
}

export function formatPrimaryPhone(rawPhone: string) {
  const digits = normalizeDigits(rawPhone || '')
    .replace(/\s+/g, '')
    .replace(/[^0-9+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/^0+/, '')}`
  const stripped = digits.replace(/^0+/, '')
  if (
    stripped.startsWith('995') ||
    stripped.startsWith('20') ||
    stripped.startsWith('966') ||
    stripped.startsWith('971') ||
    stripped.startsWith('965') ||
    stripped.startsWith('974')
  ) {
    return `+${stripped}`
  }
  return `+995${stripped}`
}

export function generateOrderRef(id?: string) {
  if (id) {
    const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (clean.length >= 6) return `AE-${clean.slice(0, 6)}`
  }
  return `AE-${randomBytes(3).toString('hex').toUpperCase()}`
}

export function createMagicToken(
  userId: string,
  unitId: string,
  expiresAt: number
) {
  const payload = `${userId}:${unitId}:${expiresAt}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false
  const cleanStored = stored.trim()
  const cleanPass = password.trim()
  try {
    if (cleanStored.startsWith('scrypt$')) {
      const [, salt, expected] = cleanStored.split('$')
      if (!salt || !expected) return false
      const actual1 = scryptSync(password, salt, 64).toString('hex')
      if (
        actual1.length === expected.length &&
        timingSafeEqual(Buffer.from(actual1), Buffer.from(expected))
      ) {
        return true
      }
      const actual2 = scryptSync(cleanPass, salt, 64).toString('hex')
      return (
        actual2.length === expected.length &&
        timingSafeEqual(Buffer.from(actual2), Buffer.from(expected))
      )
    }
    const actual = createHash('sha256').update(password).digest('hex')
    if (
      actual.length === cleanStored.length &&
      timingSafeEqual(Buffer.from(actual), Buffer.from(cleanStored))
    ) {
      return true
    }
    return cleanStored === password || cleanStored === cleanPass
  } catch {
    return false
  }
}

export function parseDeliveryDateFromStatus(rawStatus: string) {
  const str = normalizeDigits(String(rawStatus || ''))
  const monthYearMatch = str.match(/(0[1-9]|1[0-2])\/(20\d{2})/)
  const yearOnlyMatch = str.match(/(20\d{2})/)
  const monthsCountMatch = str.match(/\((\d+)\s*/)
  return {
    deliveryMonth: monthYearMatch
      ? monthYearMatch[1]
      : monthsCountMatch
        ? monthsCountMatch[1]
        : null,
    deliveryYear: monthYearMatch
      ? Number.parseInt(monthYearMatch[2], 10)
      : yearOnlyMatch
        ? Number.parseInt(yearOnlyMatch[1], 10)
        : null,
  }
}

export function stripExtendedSellColumns(payload: Record<string, any>) {
  const clone = { ...payload }
  delete clone.contract_month
  delete clone.delivery_month
  delete clone.delivery_year
  delete clone.annual_installment_amount
  delete clone.overdue_total_amount
  delete clone.currency_code
  delete clone.floor_number
  delete clone.garden_size
  delete clone.has_annual_installment
  delete clone.has_overdue_installments
  delete clone.overdue_installments
  delete clone.submission_type
  delete clone.last_seller_edit_at
  // الأعمدة الجديدة في حال لم يشغّل المستخدم الـ SQL بعد (تبقى محفوظة في documents.__unit_meta)
  delete clone.listing_category
  delete clone.rent_price
  delete clone.rent_period
  delete clone.price_per_sqm
  delete clone.exact_street
  delete clone.house_number
  delete clone.cadastral_code
  delete clone.building_status
  delete clone.building_series
  delete clone.floor_type
  delete clone.heating_type
  delete clone.building_material
  delete clone.year_built
  delete clone.total_floors
  delete clone.bedrooms
  delete clone.max_guests
  delete clone.kitchen_area
  delete clone.balcony_area
  delete clone.loggia_area
  delete clone.terrace_area
  delete clone.video_url
  delete clone.tour_3d_url
  delete clone.allow_online_viewing
  delete clone.installment_sale_possible
  delete clone.exchange_possible
  delete clone.is_exclusive
  delete clone.contact_messengers
  return clone
}

export function stripToCoreSellColumns(payload: Record<string, any>) {
  const coreKeys = [
    'user_id',
    'project_name',
    'developer_name',
    'area',
    'unit_type',
    'size',
    'rooms',
    'bathrooms',
    'finishing',
    'delivery_status',
    'features',
    'description',
    'contract_price',
    'paid_amount',
    'market_price',
    'installment_amount',
    'installment_frequency',
    'years_left',
    'contract_year',
    'willing_to_discount',
    'discount_amount',
    'images',
    'documents',
    'name',
    'phone',
    'email',
    'status',
  ]
  const clean: Record<string, any> = {}
  for (const key of coreKeys) {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  }
  return clean
}