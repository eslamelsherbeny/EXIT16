'use client'

import { usePathname } from 'next/navigation'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

const WHATSAPP_FLOAT_I18N: Record<
  LocaleCode,
  {
    label: string
    subLabel: string
    prefillMessage: string
  }
> = {
  ar: {
    label: 'خدمة العملاء',
    subLabel: 'تواصل معنا عبر واتساب',
    prefillMessage:
      'مرحباً فريق Aqar Exit، أحتاج إلى مساعدة واستفسار بخصوص المنصة.',
  },
  en: {
    label: 'Customer Support',
    subLabel: 'Chat with us on WhatsApp',
    prefillMessage:
      'Hello Aqar Exit support team, I need assistance regarding the platform.',
  },
  ru: {
    label: 'Служба поддержки',
    subLabel: 'Напишите нам в WhatsApp',
    prefillMessage:
      'Здравствуйте, команда Aqar Exit! Мне нужна консультация по платформе.',
  },
  ka: {
    label: 'მხარდაჭერის გუნდი',
    subLabel: 'მოგვწერეთ WhatsApp-ში',
    prefillMessage:
      'გამარჯობა Aqar Exit-ის გუნდო, მჭირდება დახმარება პლატფორმასთან დაკავშირებით.',
  },
}

export function FloatingWhatsApp() {
  const pathname = usePathname()
  const { locale, dir, siteSettings, t } = useTranslation()

  // إخفاء الزر العائم داخل لوحة تحكم الإدارة فقط
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const activeLocale = (locale as LocaleCode) || 'ar'
  const wT = WHATSAPP_FLOAT_I18N[activeLocale] || WHATSAPP_FLOAT_I18N.ar

  // قراءة رقم الواتساب مباشرة من إعدادات الموقع في لوحة التحكم
  const rawPhone = String(
    siteSettings?.whatsappNumber || t?.footer?.phone || '+201018595959'
  ).trim()
  const cleanPhoneDigits = rawPhone.replace(/\D/g, '')

  if (!cleanPhoneDigits) {
    return null
  }

  const whatsappHref = `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(
    wT.prefillMessage
  )}`

  return (
    <div
      dir={dir}
      className="fixed right-4 bottom-4 z-[85] sm:right-6 sm:bottom-6"
    >
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={wT.subLabel}
        title={wT.subLabel}
        className="group relative flex items-center gap-2.5 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_8px_28px_rgba(37,211,102,0.45)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#20bd5a] hover:shadow-[0_12px_34px_rgba(37,211,102,0.6)] active:scale-95 sm:px-4 sm:py-3"
      >
        {/* موجة نبض خضراء هادئة حول الزر */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-[ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-[#25D366] opacity-25"
        />

        {/* نقطة متصل الآن (Online) */}
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -left-0.5 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 shadow-2xs"
        />

        {/* أيقونة واتساب الرسمية */}
        <svg
          viewBox="0 0 32 32"
          fill="currentColor"
          className="relative z-10 size-6 shrink-0 transition-transform duration-300 group-hover:scale-110 sm:size-[22px]"
          aria-hidden="true"
        >
          <path d="M16.004 3.2c-7.068 0-12.8 5.732-12.8 12.8 0 2.256.59 4.46 1.71 6.404L3.2 28.8l6.56-1.72c1.878 1.026 3.99 1.566 6.244 1.566 7.068 0 12.8-5.732 12.8-12.8s-5.732-12.646-12.8-12.646zm0 23.296c-1.956 0-3.874-.526-5.548-1.52l-.398-.236-3.892 1.02 1.038-3.794-.258-.412a10.57 10.57 0 0 1-1.63-5.654c0-5.894 4.794-10.688 10.688-10.688 5.894 0 10.688 4.794 10.688 10.688 0 5.894-4.794 10.596-10.688 10.596zm5.862-7.988c-.322-.16-1.9-.938-2.194-1.044-.294-.108-.508-.16-.722.16-.214.322-.83 1.044-1.018 1.258-.188.214-.374.242-.696.08-.322-.16-1.356-.5-2.584-1.594-.956-.852-1.6-1.904-1.788-2.226-.188-.322-.02-.496.14-.656.144-.144.322-.374.482-.562.16-.188.214-.322.322-.536.108-.214.054-.402-.026-.562-.08-.16-.722-1.74-.99-2.382-.26-.624-.526-.54-.722-.55-.188-.008-.402-.01-.616-.01-.214 0-.562.08-.856.402-.294.322-1.124 1.098-1.124 2.678s1.15 3.106 1.31 3.32c.16.214 2.264 3.456 5.484 4.846.766.33 1.364.528 1.83.676.768.244 1.468.21 2.02.128.616-.092 1.9-.776 2.168-1.526.268-.75.268-1.392.188-1.526-.08-.134-.294-.214-.616-.374z" />
        </svg>

        {/* نص الزر على الكمبيوتر */}
        <span className="relative z-10 hidden text-xs font-extrabold tracking-wide sm:inline-block">
          {wT.label}
        </span>
      </a>
    </div>
  )
}