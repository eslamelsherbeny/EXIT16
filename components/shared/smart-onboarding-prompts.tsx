'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Download, Globe, Smartphone, X } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '@/components/layouts/site-shell'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

const CONSENT_STORAGE_KEY = 'aqar_cookie_consent'
const LANG_PROMPT_DISMISSED_KEY = 'aqar_lang_prompt_dismissed'
const PWA_PROMPT_DISMISSED_KEY = 'aqar_pwa_prompt_dismissed'

const LANGUAGE_NAMES_DISPLAY: Record<LocaleCode, string> = {
  ar: 'العربية (Arabic)',
  en: 'English',
  ru: 'Русский (Russian)',
  ka: 'ქართული (Georgian)',
}

const PROMPTS_I18N: Record<
  LocaleCode,
  {
    consentText: string
    allowBtn: string
    declineBtn: string
    privacyLink: string
    languageWord: string
    switchBtn: string
    pwaTitle: string
    pwaSub: string
    installBtn: string
    iosHint: string
  }
> = {
  ar: {
    consentText:
      'نحن نقيس الزيارات وأداء الإعلانات فقط إذا سمحت بذلك. لا يتم تحميل أي أدوات تتبع قبل قرارك — يمكنك تغيير اختيارك في أي وقت.',
    allowBtn: 'سماح',
    declineBtn: 'رفض',
    privacyLink: 'سياسة الخصوصية',
    languageWord: 'اللغة المقترحة:',
    switchBtn: 'تبديل',
    pwaTitle: 'ثبّت تطبيق Aqar Exit على هاتفك',
    pwaSub: 'تصفح فرص التنازل وتابع عروضك وإشعاراتك بسرعة كأنه تطبيق موبايل.',
    installBtn: 'تثبيت التطبيق',
    iosHint: 'في آيفون: اضغط مشاركة (Share) ثم "إضافة إلى الشاشة الرئيسية"',
  },
  en: {
    consentText:
      'We measure visits and ad performance only if you allow it. Nothing loads before you decide — change your choice anytime from the footer.',
    allowBtn: 'Allow',
    declineBtn: 'Decline',
    privacyLink: 'Privacy policy',
    languageWord: 'Language:',
    switchBtn: 'Switch',
    pwaTitle: 'Install Aqar Exit App on your phone',
    pwaSub: 'Access exit deals and track your offers faster from your home screen.',
    installBtn: 'Install App',
    iosHint: 'On iPhone: Tap Share then "Add to Home Screen"',
  },
  ru: {
    consentText:
      'Мы анализируем посещения и эффективность рекламы только с вашего согласия. Ничего не загружается до вашего решения.',
    allowBtn: 'Разрешить',
    declineBtn: 'Отклонить',
    privacyLink: 'Конфиденциальность',
    languageWord: 'Язык:',
    switchBtn: 'Переключить',
    pwaTitle: 'Установите приложение Aqar Exit',
    pwaSub: 'Быстрый доступ к объектам переуступки прямо с главного экрана.',
    installBtn: 'Установить',
    iosHint: 'На iPhone: Нажмите «Поделиться», затем «На экран Домой»',
  },
  ka: {
    consentText:
      'ჩვენ ვზომავთ ვიზიტებს და რეკლამის ეფექტურობას მხოლოდ თქვენი თანხმობით. არაფერი იტვირთება თქვენს გადაწყვეტილებამდე.',
    allowBtn: 'დაშვება',
    declineBtn: 'უარყოფა',
    privacyLink: 'კონფიდენციალურობა',
    languageWord: 'ენა:',
    switchBtn: 'გადართვა',
    pwaTitle: 'დააინსტალირეთ Aqar Exit აპლიკაცია',
    pwaSub: 'სწრაფი წვდომა ყველა შეთავაზებაზე თქვენი ტელეფონის ეკრანიდან.',
    installBtn: 'ინსტალაცია',
    iosHint: 'iPhone-ზე: დააჭირეთ Share-ს და შემდეგ "Add to Home Screen"',
  },
}

// دالة مساعدة لإرسال الأحداث إلى فيسبوك بيكسل وجوجل أناليتكس و PostHog
export function trackPlatformEvent(
  eventName: string,
  params: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return
  try {
    if (typeof (window as any).gtag === 'function') {
      ;(window as any).gtag('event', eventName, params)
    }
    if (typeof (window as any).fbq === 'function') {
      ;(window as any).fbq('trackCustom', eventName, params)
    }
    if (typeof (window as any).posthog?.capture === 'function') {
      ;(window as any).posthog.capture(eventName, params)
    }
  } catch {}
}

export function SmartOnboardingPrompts() {
  const router = useRouter()
  const { locale, dir } = useTranslation()
  const pT = PROMPTS_I18N[locale] || PROMPTS_I18N.ar

  // 1. حالة الموافقة على الكوكيز والتتبع (Allow / Decline)
  const [consentStatus, setConsentStatus] = useState<
    'pending' | 'granted' | 'declined'
  >('granted')
  const [showConsentBanner, setShowConsentBanner] = useState(false)

  // 2. حالة اقتراح اللغة حسب دولة الزائر (Egypt · Language: Arabic [Switch])
  const [geoSuggestion, setGeoSuggestion] = useState<{
    countryLabel: string
    suggestedLocale: LocaleCode
  } | null>(null)

  // 3. حالة تثبيت التطبيق (PWA Install Prompt)
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null)
  const [showPwaBanner, setShowPwaBanner] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)

  // مفاتيح التتبع من ملف .env.local
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || ''
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (!savedConsent) {
        setConsentStatus('pending')
        setShowConsentBanner(true)
      } else {
        setConsentStatus(savedConsent === 'granted' ? 'granted' : 'declined')
        setShowConsentBanner(false)
      }
    } catch {}
  }, [])

  // كشف الدولة واللغة التلقائي (مطابق للصورة الثانية)
  useEffect(() => {
    try {
      if (localStorage.getItem(LANG_PROMPT_DISMISSED_KEY)) return
    } catch {}

    async function detectVisitorGeo() {
      try {
        const res = await fetch('/api/geo')
        if (!res.ok) return
        const data = await res.json()
        const suggested = data?.suggestedLocale as LocaleCode | undefined

        if (suggested && suggested !== locale && SUPPORTED_LANGUAGES[suggested]) {
          const countryLabel =
            data?.countryName?.[locale] ||
            data?.countryName?.en ||
            data?.countryCode ||
            'Egypt'
          setGeoSuggestion({
            countryLabel,
            suggestedLocale: suggested,
          })
        }
      } catch {}
    }

    detectVisitorGeo()
  }, [locale])

  // التقاط حدث تثبيت التطبيق (PWA) على الموبايل والكمبيوتر
  useEffect(() => {
    try {
      if (localStorage.getItem(PWA_PROMPT_DISMISSED_KEY)) return
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches
      if (isStandalone) return
    } catch {}

    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    setIsIosDevice(ios)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPwaPrompt(e)
      setShowPwaBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // على أجهزة آيفون نعرض التنبيه بعد 6 ثوانٍ إذا لم يكن مثبتاً
    let iosTimer: any
    if (ios) {
      iosTimer = setTimeout(() => {
        setShowPwaBanner(true)
      }, 6000)
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  const handleConsentDecision = (decision: 'granted' | 'declined') => {
    setConsentStatus(decision)
    setShowConsentBanner(false)
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, decision)
    } catch {}
  }

  const handleSwitchSuggestedLanguage = () => {
    if (!geoSuggestion) return
    const targetCode = geoSuggestion.suggestedLocale
    const targetLang = SUPPORTED_LANGUAGES[targetCode]
    if (!targetLang) return

    try {
      localStorage.setItem(LANG_PROMPT_DISMISSED_KEY, '1')
    } catch {}

    setGeoSuggestion(null)
    document.cookie = `locale=${targetCode}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = targetCode
    document.documentElement.dir = targetLang.dir
    window.dispatchEvent(new Event('language-changed'))
    router.refresh()
  }

  const handleDismissGeoSuggestion = () => {
    setGeoSuggestion(null)
    try {
      localStorage.setItem(LANG_PROMPT_DISMISSED_KEY, '1')
    } catch {}
  }

  const handleInstallPwaApp = async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt()
      await deferredPwaPrompt.userChoice.catch(() => {})
      setDeferredPwaPrompt(null)
      setShowPwaBanner(false)
      try {
        localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1')
      } catch {}
    }
  }

  const handleDismissPwaBanner = () => {
    setShowPwaBanner(false)
    try {
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1')
    } catch {}
  }

  return (
    <>
      {/* تحميل سكربتات التتبع (GA4 + GTM + Facebook Pixel + PostHog) فور موافقة الزائر */}
      {consentStatus === 'granted' && (
        <>
          {gaMeasurementId && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
                `}
              </Script>
            </>
          )}

          {gtmId && (
            <Script id="gtm-init" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `}
            </Script>
          )}

          {fbPixelId && (
            <Script id="fb-pixel-init" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
          )}

          {posthogKey && (
            <Script id="posthog-init" strategy="afterInteractive">
              {`
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${posthogKey}', { api_host: '${posthogHost}' });
              `}
            </Script>
          )}
        </>
      )}

      {/* حاوية الرسائل المنبثقة الذكية في أسفل الشاشة بنفس تصميم الصور */}
      <div
        dir={dir}
        className="pointer-events-none fixed inset-x-3 bottom-4 z-[95] mx-auto flex max-w-md flex-col gap-2.5 sm:bottom-6"
      >
        {/* 1. شريط اقتراح اللغة حسب دولة الزائر (مطابق للصورة الثانية: Egypt · Language: Arabic [Switch]) */}
        {geoSuggestion && !showConsentBanner && (
          <div className="pointer-events-auto flex items-center justify-between gap-2.5 rounded-[22px] border border-slate-200/90 bg-white/98 px-4 py-3 shadow-[0_14px_38px_rgba(15,29,64,0.16)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                <Globe className="size-4" />
              </span>
              <p className="truncate text-xs font-extrabold text-[#0f1d40] sm:text-[13px]">
                <span>{geoSuggestion.countryLabel}</span>
                <span className="mx-1 text-slate-300">·</span>
                <span className="font-semibold text-slate-500">
                  {pT.languageWord}{' '}
                </span>
                <span>
                  {LANGUAGE_NAMES_DISPLAY[geoSuggestion.suggestedLocale]}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={handleSwitchSuggestedLanguage}
                className="rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:opacity-95 active:scale-95"
              >
                {pT.switchBtn}
              </button>
              <button
                type="button"
                onClick={handleDismissGeoSuggestion}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. شريط تثبيت الموقع كتطبيق (PWA Install Banner) */}
        {showPwaBanner && !showConsentBanner && !geoSuggestion && (
          <div className="pointer-events-auto rounded-[22px] border border-slate-200/90 bg-white/98 p-4 shadow-[0_14px_38px_rgba(15,29,64,0.16)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 text-start">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-[#2563eb] text-white shadow-sm">
                  <Smartphone className="size-5" />
                </span>
                <div>
                  <strong className="block text-xs font-extrabold text-[#0f1d40] sm:text-sm">
                    {pT.pwaTitle}
                  </strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                    {isIosDevice && !deferredPwaPrompt ? pT.iosHint : pT.pwaSub}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissPwaBanner}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            {deferredPwaPrompt && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleInstallPwaApp}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700"
                >
                  <Download className="size-3.5" />
                  <span>{pT.installBtn}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. شريط الموافقة على قياس الزيارات والإعلانات (مطابق للصورة الأولى بالضبط) */}
        {showConsentBanner && (
          <div className="pointer-events-auto rounded-[24px] border border-slate-200/90 bg-white/98 p-4 text-start shadow-[0_18px_45px_rgba(15,29,64,0.18)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 sm:p-5">
            <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-[13px]">
              {pT.consentText}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleConsentDecision('granted')}
                className="h-10 flex-1 rounded-full bg-[#2563eb] px-6 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700 active:scale-95 sm:flex-none"
              >
                {pT.allowBtn}
              </button>

              <button
                type="button"
                onClick={() => handleConsentDecision('declined')}
                className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-6 text-xs font-extrabold text-[#0f1d40] transition hover:bg-slate-50 active:scale-95 sm:flex-none"
              >
                {pT.declineBtn}
              </button>

              <Link
                href="/privacy"
                className="ms-auto px-2 text-xs font-bold text-slate-500 hover:text-[#0f1d40] hover:underline"
              >
                {pT.privacyLink}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
