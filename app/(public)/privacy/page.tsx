'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

const CONSENT_STORAGE_KEY = 'aqar_cookie_consent_v2'
const LEGACY_CONSENT_KEY = 'aqar_cookie_consent'

type PolicySection = {
  title: string
  body: string
}

type PrivacyPageLocaleData = {
  backHome: string
  title: string
  lastUpdated: string
  sections: PolicySection[]
  cookieResetTitle: string
  cookieResetDesc: string
  cookieResetBtn: string
  cookieResetDone: string
}

const PRIVACY_POLICY_CONTENT: Record<LocaleCode, PrivacyPageLocaleData> = {
  ar: {
    backHome: 'الرئيسية',
    title: 'سياسة الخصوصية',
    lastUpdated: 'آخر تحديث: نوفمبر 2026',
    sections: [
      {
        title: '1. معلومات عامة',
        body: 'تدير منصة Aqar Exit (عقار إكزت) سوقاً إلكترونياً متخصصاً في إعادة بيع العقارات بالتقسيط والتنازل عن العقود واستكمال الأقساط في جورجيا بسعر العقد الأصلي وبدون أوفر. توضح سياسة الخصوصية هذه ماهية البيانات الشخصية والمستندات التي نجمعها من الملاك والمشترين، وكيفية استخدامها وحمايتها وفقاً لقوانين حماية البيانات المعمول بها في جورجيا.',
      },
      {
        title: '2. البيانات التي نقوم بجمعها',
        body: 'نجمع البيانات التي تقدمها طواعيةً عند إنشاء حساب أو إضافة وحدة للبيع أو تقديم طلب شراء أو عرض رسمي، وتشمل: الاسم الكامل، رقم الهاتف (وتطبيقات المراسلة المفضلة مثل WhatsApp و Viber و Telegram)، عنوان البريد الإلكتروني، تفاصيل الوحدة العقارية (اسم المشروع، المطور، المنطقة، المساحة، سعر العقد الأصلي، المبلغ المدفوع، والأقساط المتبقية)، بالإضافة إلى البيانات التقنية الأساسية مثل عنوان IP ونوع المتصفح والجهاز.',
      },
      {
        title: '3. كيف نستخدم البيانات',
        body: 'تُستخدم البيانات المجمعة لتشغيل المنصة ومطابقة المشترين الجادين مع وحدات التنازل المناسبة عبر الرادار العقاري الذكي، والتواصل معك بخصوص حالة إعلانك أو عروض الشراء المقدمة، وإرسال رموز التحقق (OTP) وإشعارات الحساب، وتحسين جودة وأمان الخدمة. نحن لا نبيع بياناتك الشخصية أبداً لأي طرف ثالث.',
      },
      {
        title: '4. مشاركة البيانات وحماية معلومات التواصل',
        body: 'حفاظاً على خصوصية الملاك ومنعاً للإزعاج أو الوسطاء غير المعتمدين، لا تقوم منصة Aqar Exit بعرض رقم هاتف البائع أو بريده الإلكتروني أو رقم الشقة الدقيق في صفحات الإعلانات العامة؛ بل يظهر فقط وصف العقار وتفاصيله المالية والهندسية. تتم مشاركة بيانات التفاوض وترتيب إجراءات التنازل ونقل الملكية حصرياً تحت إشراف إدارة المنصة عند وجود عرض شراء رسمي وموثق، وبالتنسيق مع المطور العقاري والسجل العام الجورجي (NAPR). قد نستخدم مزودي خدمات تقنية موثوقين (مثل خدمات الاستضافة السحابية وقواعد البيانات وأدوات التحليل بموافقتك) ضمن التزامات سرية صارمة.',
      },
      {
        title: '5. ملفات تعريف الارتباط والتخزين المحلي (Cookies & Local Storage)',
        body: 'نستخدم ملفات تعريف الارتباط الضرورية (Cookies) والتخزين المحلي (localStorage) لحفظ جلسة تسجيل الدخول الخاصة بك، وتذكر اللغة المفضلة، وحفظ قائمة الوحدات المفضلة. كما نستخدم — بعد موافقتك الصريحة فقط — أدوات قياس الأداء والإعلانات (مثل Google Analytics و Google Tag Manager و Meta Pixel و PostHog) لتحليل الزيارات وتحسين الحملات الإعلانية. لا يتم تحميل أي من أدوات التتبع هذه قبل موافقتك عبر شريط الخصوصية، ويمكنك تغيير قرارك في أي وقت من الزر الموجود أسفل هذه الصفحة.',
      },
      {
        title: '6. مستندات العقار والتحقق القانوني',
        body: 'عند قيام البائع برفع مستندات إثبات الملكية والسداد (مثل عقد الشراء من المطور، إيصالات الدفع، كشف الحساب، أو جواز السفر)، يتم حفظ هذه الملفات في مساحة تخزين سحابية مشفرة ومحمية. يقتصر الاطلاع على هذه المستندات على فريق المراجعة والتحقق المختص في المنصة لمطابقة الأرقام المالية ومنح الإعلان شارة «موثّق بالمستندات»، ولا يُسمح لأي زائر عام بتحميلها أو الاطلاع عليها.',
      },
      {
        title: '7. تخزين البيانات وأمن المعلومات',
        body: 'يتم تأمين كافة الاتصالات عبر بروتوكول التشفير (HTTPS / TLS)، وتُشفر كلمات المرور باستخدام خوارزميات قياسية متقدمة (Scrypt Hashing) مع جلسات موقعة رقمياً، كما يتم فلترة وعزل بيانات الملاك الحساسة على الخادم (Server-Side) قبل إرسال الصفحات للمتصفح. يتم الاحتفاظ ببيانات الحساب والإعلانات طالما كان حسابك نشطاً، وعند طلب حذف الحساب يتم إيقاف جميع الإعلانات المرتبطة به فوراً وإزالتها من العرض العام.',
      },
      {
        title: '8. حقوقك القانونية',
        body: 'بموجب قانون جورجيا لحماية البيانات الشخصية، يحق لك طلب الوصول إلى بياناتك الشخصية المسجلة لدينا، أو تصحيحها وتحديثها من خلال إعدادات حسابك (/account)، أو إيقاف وحذف إعلاناتك، أو سحب موافقتك على معالجة البيانات وأدوات التتبع، أو تقديم طلب حذف الحساب نهائياً من داخل لوحة التحكم الخاصة بك.',
      },
      {
        title: '9. التعديلات والتواصل معنا',
        body: 'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لمواكبة التطورات القانونية أو التقنية، وسيتم نشر أي تحديث على هذه الصفحة مع تاريخ المراجعة. لأي استفسارات تتعلق بالخصوصية وحماية البيانات، يمكنك التواصل معنا عبر صفحة «كلمنا» (/contact) أو عبر البريد الإلكتروني الرسمي للمنصة.',
      },
    ],
    cookieResetTitle: 'إدارة موافقة الكوكيز وأدوات القياس',
    cookieResetDesc:
      'يمكنك في أي وقت إعادة تعيين اختيارك الخاص بأدوات قياس الزيارات والإعلانات (Allow / Decline) ليظهر لك شريط الاختيار من جديد.',
    cookieResetBtn: 'تغيير إعدادات موافقة الكوكيز',
    cookieResetDone: 'تمت إعادة التعيين بنجاح! سيظهر لك شريط الاختيار أسفل الشاشة.',
  },

  en: {
    backHome: 'Home',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: November 2026',
    sections: [
      {
        title: '1. General information',
        body: 'Aqar Exit operates an online real estate platform specialized in installment property resales and contract assignments (exit deals) in Georgia at original contract prices with zero overprice. This Privacy Policy explains what personal data and property documents we collect from sellers and buyers, how we use them, and how we protect them in accordance with Georgian data protection laws.',
      },
      {
        title: '2. What data we collect',
        body: 'We collect information you voluntarily provide when registering an account, listing a unit for sale, submitting a buy request, or making an official offer. This includes: full name, phone number (and preferred messengers such as WhatsApp, Viber, Telegram), email address, property details (project name, developer, district, area size, contract price, paid amount, and remaining installments), as well as technical data such as IP address, browser type, and device information.',
      },
      {
        title: '3. How data is used',
        body: 'Collected data is used to operate the platform, match serious buyers with suitable exit units through our Smart Property Radar, communicate regarding listing statuses and purchase offers, send verification codes (OTP) and notifications, and improve platform security and performance. We never sell your personal data to third parties.',
      },
      {
        title: '4. Data sharing and contact protection',
        body: 'To protect owner privacy and prevent spam or unauthorized solicitation, Aqar Exit does not publicly display the seller’s phone number, email address, or exact unit number on public listing pages; only property specifications and financial figures are shown publicly. Contact details and assignment procedures are coordinated strictly through our verification team when a serious, verified purchase offer is submitted, in cooperation with the developer and the National Agency of Public Registry (NAPR). We may use trusted infrastructure providers (cloud hosting, databases, and consented analytics tools) under strict confidentiality obligations.',
      },
      {
        title: '5. Cookies and local storage',
        body: 'We use essential cookies and browser localStorage to maintain your login session, store your language preference, and save your favorite units. Only with your explicit consent, we also use analytics and ad measurement tools (Google Analytics, Google Tag Manager, Meta Pixel, and PostHog) to measure traffic and ad performance. None of these tracking scripts load before you grant consent, and you can change your choice anytime using the button at the bottom of this page.',
      },
      {
        title: '6. Property documents and verification',
        body: 'When sellers upload ownership and payment verification documents (developer contract, payment receipts, account statement, or passport/ID), these files are stored in encrypted cloud storage with restricted access. They are reviewed exclusively by our verification specialists to validate financial figures and grant the "Verified Documents" badge, and are never accessible to public visitors.',
      },
      {
        title: '7. Storage and protection',
        body: 'All data transmission is encrypted via HTTPS / TLS. Passwords are encrypted using Scrypt hashing with cryptographically signed session tokens, and sensitive owner fields are filtered on the server before reaching the client browser. Data is retained while your account remains active; if you request account deletion, your active listings are immediately paused and removed from public view.',
      },
      {
        title: '8. Your rights',
        body: 'Under the Law of Georgia on Personal Data Protection, you have the right to access your personal data, update or correct it via your account dashboard (/account), pause or delete your property listings, withdraw consent for analytics tracking, or request permanent account deletion.',
      },
      {
        title: '9. Changes and contact',
        body: 'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. For privacy-related inquiries, please reach out via our Contact page (/contact) or our official support email.',
      },
    ],
    cookieResetTitle: 'Cookie & Tracking Consent Preferences',
    cookieResetDesc:
      'You can reset your analytics and ad measurement consent choice (Allow / Decline) at any time to reopen the consent prompt.',
    cookieResetBtn: 'Change Cookie Consent Settings',
    cookieResetDone: 'Preferences reset! The consent banner will appear at the bottom.',
  },

  ru: {
    backHome: 'Главная',
    title: 'Политика конфиденциальности',
    lastUpdated: 'Последнее обновление: Ноябрь 2026',
    sections: [
      {
        title: '1. Общая информация',
        body: 'Платформа Aqar Exit управляет специализированным сервисом переуступки прав требования (продажи недвижимости в рассрочку без наценки по первоначальной цене договора) в Грузии. Настоящая Политика конфиденциальности объясняет, какие персональные данные и документы мы собираем, как их используем и защищаем в соответствии с законодательством Грузии.',
      },
      {
        title: '2. Какие данные мы собираем',
        body: 'Мы собираем данные, которые вы добровольно предоставляете при регистрации, размещении объекта, подаче заявки на покупку или отправке оферты: имя, номер телефона (и мессенджеры WhatsApp, Viber, Telegram), email, параметры объекта (ЖК, застройщик, район, площадь, цена по договору, выплаченная сумма и остаток рассрочки), а также технические данные (IP-адрес, тип браузера и устройства).',
      },
      {
        title: '3. Как используются данные',
        body: 'Данные используются для работы платформы, подбора подходящих объектов через Умный Радар, связи с вами по вопросам объявлений и оферт, отправки кодов подтверждения (OTP) и уведомлений, а также обеспечения безопасности сервиса. Мы никогда не продаем ваши персональные данные третьим лицам.',
      },
      {
        title: '4. Передача данных и защита контактов',
        body: 'Для защиты собственников от спама и нежелательных посредников Aqar Exit не публикует телефон, email или точный номер квартиры продавца в открытом доступе; отображаются только характеристики и финансовые условия объекта. Координация сделки и переоформление договора у застройщика и в Публичном реестре Грузии (NAPR) осуществляются при участии команды платформы после получения официальной оферты от проверенного покупателя.',
      },
      {
        title: '5. Файлы Cookie и локальное хранилище',
        body: 'Мы используем необходимые файлы Cookie и localStorage для сохранения сессии входа, выбранного языка и списка избранных объектов. Только с вашего явного согласия мы подключаем аналитические и рекламные инструменты (Google Analytics, Google Tag Manager, Meta Pixel, PostHog). Ни один скрипт отслеживания не загружается до вашего решения, и вы можете изменить свой выбор в любое время внизу этой страницы.',
      },
      {
        title: '6. Документы на недвижимость и верификация',
        body: 'Загружаемые продавцом документы (договор с застройщиком, квитанции об оплате, выписка, паспорт) хранятся в зашифрованном облачном хранилище с ограниченным доступом. Они проверяются исключительно специалистами платформы для подтверждения сумм и присвоения статуса «Проверено документально» и никогда не публикуются в открытом доступе.',
      },
      {
        title: '7. Хранение и защита данных',
        body: 'Передача данных защищена протоколом HTTPS / TLS. Пароли хешируются алгоритмом Scrypt, а приватные данные собственников фильтруются на сервере до отправки страницы в браузер. При подаче запроса на удаление аккаунта все активные объявления пользователя немедленно снимаются с публикации.',
      },
      {
        title: '8. Ваши права',
        body: 'В соответствии с Законом Грузии «О защите персональных данных» вы имеете право запросить доступ к своим данным, изменить их в личном кабинете (/account), приостановить или удалить свои объявления, отозвать согласие на аналитику или запросить полное удаление аккаунта.',
      },
      {
        title: '9. Изменения и контакты',
        body: 'Мы можем периодически обновлять настоящую Политику. Актуальная версия всегда доступна на этой странице. По всем вопросам конфиденциальности свяжитесь с нами через страницу «Контакты» (/contact) или по электронной почте поддержки.',
      },
    ],
    cookieResetTitle: 'Управление согласием на файлы Cookie',
    cookieResetDesc:
      'Вы можете в любой момент сбросить свой выбор в отношении аналитики и рекламы (Разрешить / Отклонить), чтобы заново открыть панель настроек.',
    cookieResetBtn: 'Изменить настройки Cookie',
    cookieResetDone: 'Настройки сброшены! Панель выбора появится внизу экрана.',
  },

  ka: {
    backHome: 'მთავარი',
    title: 'კონფიდენციალურობის პოლიტიკა',
    lastUpdated: 'ბოლო განახლება: ნოემბერი 2026',
    sections: [
      {
        title: '1. ზოგადი ინფორმაცია',
        body: 'Aqar Exit წარმოადგენს უძრავი ქონების პლატფორმას საქართველოში, რომელიც სპეციალიზებულია მშენებარე და დასრულებული ბინების განვადების გადაბარებასა და კონტრაქტის პირვანდელ ფასად გაყიდვაზე. წინამდებარე კონფიდენციალურობის პოლიტიკა განმარტავს, თუ რა პერსონალურ მონაცემებს ვაგროვებთ, როგორ ვიყენებთ და როგორ ვიცავთ მათ საქართველოს კანონმდებლობის შესაბამისად.',
      },
      {
        title: '2. რა მონაცემებს ვაგროვებთ',
        body: 'ჩვენ ვაგროვებთ მონაცემებს, რომლებსაც ნებაყოფლობით გვაწვდით რეგისტრაციის, განცხადების განთავსების ან შეთავაზების გაგზავნის დროს: სახელი, ტელეფონის ნომერი (WhatsApp, Viber, Telegram), ელ-ფოსტის მისამართი, ქონების დეტალები (პროექტი, დეველოპერი, უბანი, ფართობი, კონტრაქტის ფასი, გადახდილი თანხა და დარჩენილი განვადება), აგრეთვე ტექნიკური მონაცემები (IP მისამართი, ბრაუზერის და მოწყობილობის ტიპი).',
      },
      {
        title: '3. როგორ გამოიყენება მონაცემები',
        body: 'შეგროვებული მონაცემები გამოიყენება პლატფორმის ფუნქციონირებისთვის, მყიდველებისა და გამყიდველების დაკავშირებისთვის ჭკვიანი რადარის მეშვეობით, ვერიფიკაციის კოდებისა (OTP) და შეტყობინებების გასაგზავნად და უსაფრთხოების უზრუნველსაყოფად. ჩვენ არასდროს ვყიდით თქვენს პერსონალურ მონაცემებს მესამე პირებზე.',
      },
      {
        title: '4. მონაცემთა გაზიარება და კონტაქტების დაცვა',
        body: 'მესაკუთრეთა კონფიდენციალურობის დაცვისა და არასასურველი ზარების თავიდან აცილების მიზნით, Aqar Exit საჯაროდ არ აქვეყნებს გამყიდველის ტელეფონის ნომერს, ელ-ფოსტას ან ბინის ზუსტ ნომერს; საჯაროდ ჩანს მხოლოდ ქონების პარამეტრები და ფინანსური პირობები. ოფიციალური შეთავაზების შემთხვევაში, გადაბარების პროცესს კოორდინაციას უწევს პლატფორმის გუნდი დეველოპერთან და საჯარო რეესტრთან (NAPR) ერთად.',
      },
      {
        title: '5. Cookie ფაილები და ლოკალური მეხსიერება',
        body: 'ჩვენ ვიყენებთ აუცილებელ Cookie ფაილებს და localStorage-ს ავტორიზაციის სესიის, ენის პარამეტრებისა და რჩეული ობიექტების შესანახად. მხოლოდ თქვენი თანხმობის შემთხვევაში ვიყენებთ ანალიტიკურ და სარეკლამო ხელსაწყოებს (Google Analytics, Google Tag Manager, Meta Pixel, PostHog). თქვენს გადაწყვეტილებამდე არცერთი სარეკლამო სკრიპტი არ იტვირთება და არჩევანის შეცვლა ნებისმიერ დროს შეგიძლიათ ამ გვერდის ბოლოში.',
      },
      {
        title: '6. ქონების დოკუმენტები და ვერიფიკაცია',
        body: 'ატვირთული დოკუმენტები (დეველოპერის კონტრაქტი, გადახდის ქვითრები, ამონაწერი, პასპორტი) ინახება დაშიფრულ ღრუბლოვან საცავში შეზღუდული წვდომით. დოკუმენტებს ამოწმებს მხოლოდ ჩვენი ვერიფიკაციის გუნდი ფინანსური მონაცემების დასადასტურებლად და ისინი არასდროს არის ხელმისაწვდომი საჯარო ვიზიტორებისთვის.',
      },
      {
        title: '7. მონაცემთა შენახვა და უსაფრთხოება',
        body: 'მონაცემთა გადაცემა დაცულია HTTPS / TLS პროტოკოლით. პაროლები დაშიფრულია Scrypt ალგორითმით, ხოლო კონფიდენციალური ველები იფილტრება სერვერზე. ანგარიშის წაშლის მოთხოვნისას ყველა აქტიური განცხადება მყისიერად იხსნება საჯარო სივრციდან.',
      },
      {
        title: '8. თქვენი უფლებები',
        body: '„პერსონალურ მონაცემთა დაცვის შესახებ“ საქართველოს კანონის თანახმად, თქვენ გაქვთ უფლება მოითხოვოთ წვდომა თქვენს მონაცემებზე, განაახლოთ ისინი პირاد კაბინეტში (/account), შეაჩეროთ ან წაშალოთ განცხადება, გააუქმოთ ანალიტიკაზე თანხმობა ან მოითხოვოთ ანგარიშის სრული წაშლა.',
      },
      {
        title: '9. ცვლილებები და კონტაქტი',
        body: 'ჩვენ შესაძლოა პერიოდულად განვაახლოთ წინამდებარე პოლიტიკა. ნებისმიერი ცვლილება გამოქვეყნდება ამ გვერდზე. კითხვების შემთხვევაში დაგვიკავშირდით კონტაქტის გვერდიდან (/contact) ან ოფიციალურ ელ-ფოსტაზე.',
      },
    ],
    cookieResetTitle: 'Cookie და ტრეკინგის პარამეტრების მართვა',
    cookieResetDesc:
      'ნებისმიერ დროს შეგიძლიათ განაახლოთ თქვენი არჩევანი ანალიტიკისა და რეკლამის შესახებ (დაშვება / უარყოფა).',
    cookieResetBtn: 'Cookie პარამეტრების შეცვლა',
    cookieResetDone: 'პარამეტრები განახლდა!',
  },
}

export default function PrivacyPolicyPage() {
  const { locale, dir } = useTranslation()
  const activeLocale = (locale as LocaleCode) || 'ar'
  const content =
    PRIVACY_POLICY_CONTENT[activeLocale] || PRIVACY_POLICY_CONTENT.ar
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleResetCookieConsent = () => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
      localStorage.removeItem(LEGACY_CONSENT_KEY)
      setResetSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 600)
    } catch {}
  }

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[#f6f8fc] py-10 text-[#0f1d40] sm:py-16"
    >
      <div className="mx-auto max-w-[780px] px-4 sm:px-6">
        <div className="rounded-[26px] border border-slate-200/85 bg-white p-6 shadow-2xs sm:p-10 md:p-12">
          {/* رابط العودة للرئيسية بنفس أسلوب الصورة */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2563eb] transition hover:underline"
          >
            {dir === 'rtl' ? (
              <ArrowRight className="size-3.5" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{content.backHome}</span>
          </Link>

          <h1 className="mt-4 text-start text-2xl font-black tracking-tight text-[#0f1d40] sm:text-4xl">
            {content.title}
          </h1>

          <p className="mt-2 text-start text-xs font-semibold text-slate-400">
            {content.lastUpdated}
          </p>

          <div className="mt-8 space-y-7 text-start">
            {content.sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-base font-extrabold text-[#0f1d40] sm:text-lg">
                  {section.title}
                </h2>
                <p className="text-xs leading-[1.95] text-slate-600 sm:text-[14px]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* صندوق إعادة تعيين موافقة الكوكيز (الذي وعدنا به الزائر في شريط Allow / Decline) */}
          <div className="mt-10 rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 text-start">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                  <ShieldCheck className="size-4 text-[#007a5a]" />
                  <span>{content.cookieResetTitle}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {content.cookieResetDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCookieConsent}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-xs font-extrabold text-white shadow-2xs transition hover:bg-blue-700 active:scale-95"
              >
                <RefreshCw className="size-3.5" />
                <span>{content.cookieResetBtn}</span>
              </button>
            </div>

            {resetSuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#007a5a]">
                <CheckCircle2 className="size-4" />
                <span>{content.cookieResetDone}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}