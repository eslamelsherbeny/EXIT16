'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { CheckCircle2, Download, Globe, Smartphone, X } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '@/components/layouts/site-shell'
import { useTranslation, type LocaleCode } from '@/lib/i18n'

const CONSENT_STORAGE_KEY = 'aqar_cookie_consent_v2'
const LANG_PROMPT_DISMISSED_KEY = 'aqar_lang_prompt_dismissed_v2'
const PWA_PROMPT_DISMISSED_KEY = 'aqar_pwa_prompt_dismissed_v2'

const LANGUAGE_NAMES_DISPLAY: Record<LocaleCode, string> = {
  ar: 'العربية',
  en: 'English',
  ru: 'Русский',
  ka: 'ქართული',
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
    manualInstallHint: string
    iosInstallHint: string
  }
> = {
  ar: {
    consentText:
      'نحن نقيس الزيارات وأداء الإعلانات فقط إذا سمحت بذلك. لا يتم تحميل أي أدوات تتبع قبل قرارك — يمكنك تغيير اختيارك في أي وقت من الفوتر.',
    allowBtn: 'سماح (Allow)',
    declineBtn: 'رفض',
    privacyLink: 'سياسة الخصوصية',
    languageWord: 'اللغة:',
    switchBtn: 'Switch',
    pwaTitle: 'نزّل تطبيق Aqar Exit على جهازك',
    pwaSub:
      'تصفح فرص التنازل وتابع عروضك وإشعاراتك فوراً من الشاشة الرئيسية كأنه تطبيق موبايل.',
    installBtn: 'تثبيت التطبيق الآن',
    manualInstallHint:
      'لتثبيت التطبيق الآن: اضغط على قائمة المتصفح (⋮) بالأعلى ثم اختر «تثبيت التطبيق / Install App» أو «إضافة إلى الشاشة الرئيسية».',
    iosInstallHint:
      'لتثبيت التطبيق على آيفون: اضغط على زر المشاركة (Share ⬆️) بالأسفل ثم اختر «إضافة إلى الشاشة الرئيسية / Add to Home Screen».',
  },
  en: {
    consentText:
      'We measure visits and ad performance only if you allow it. Nothing loads before you decide — change your choice anytime from the footer.',
    allowBtn: 'Allow',
    declineBtn: 'Decline',
    privacyLink: 'Privacy policy',
    languageWord: 'Language:',
    switchBtn: 'Switch',
    pwaTitle: 'Install Aqar Exit App',
    pwaSub:
      'Access installment exit deals and track your offers faster from your home screen.',
    installBtn: 'Install App',
    manualInstallHint:
      'To install now: Tap your browser menu (⋮) and select "Install App" or "Add to Home Screen".',
    iosInstallHint:
      'To install on iPhone: Tap the Share button (⬆️) below and select "Add to Home Screen".',
  },
  ru: {
    consentText:
      'Мы анализируем посещения и эффективность рекламы только с вашего согласия. Ничего не загружается до вашего решения.',
    allowBtn: 'Разрешить',
    declineBtn: 'Отклонить',
    privacyLink: 'Конфиденциальность',
    languageWord: 'Язык:',
    switchBtn: 'Switch',
    pwaTitle: 'Установите приложение Aqar Exit',
    pwaSub: 'Быстрый доступ к объектам переуступки прямо с главного экрана.',
    installBtn: 'Установить',
    manualInstallHint:
      'Для установки: откройте меню браузера (⋮) и выберите «Установить приложение» или «На экран Домой».',
    iosInstallHint:
      'На iPhone: нажмите кнопку «Поделиться» (⬆️) внизу и выберите «На экран Домой».',
  },
  ka: {
    consentText:
      'ჩვენ ვზომავთ ვიზიტებს და რეკლამის ეფექტურობას მხოლოდ თქვენი თანხმობით. არაფერი იტვირთება თქვენს გადაწყვეტილებამდე.',
    allowBtn: 'დაშვება',
    declineBtn: 'უარყოფა',
    privacyLink: 'კონფიდენციალურობა',
    languageWord: 'ენა:',
    switchBtn: 'Switch',
    pwaTitle: 'დააინსტალირეთ Aqar Exit აპლიკაცია',
    pwaSub: 'სწრაფი წვდომა ყველა შეთავაზებაზე თქვენი ტელეფონის ეკრანიდან.',
    installBtn: 'ინსტალაცია',
    manualInstallHint:
      'ინსტალაციისთვის: გახსენით ბრაუზერის მენიუ (⋮) და აირჩიეთ "Install App" ან "Add to Home Screen".',
    iosInstallHint:
      'iPhone-ზე: დააჭირეთ გაზიარების ღილაკს (⬆️) და აირჩიეთ "Add to Home Screen".',
  },
}

export function trackFbEvent(
  eventName: string,
  options: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return
  try {
    if (typeof (window as any).fbq === 'function') {
      ;(window as any).fbq('track', eventName, options)
    }
    if (typeof (window as any).gtag === 'function') {
      ;(window as any).gtag('event', eventName, options)
    }
    if (typeof (window as any).posthog?.capture === 'function') {
      ;(window as any).posthog.capture(eventName, options)
    }
  } catch {}
}

export function FacebookPixel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { locale, dir, siteSettings } = useTranslation() as Record<string, any>
  const pT = PROMPTS_I18N[locale as LocaleCode] || PROMPTS_I18N.ar

  const fbPixelId =
    siteSettings?.fbPixelId || process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''
  const gaMeasurementId =
    siteSettings?.gaMeasurementId ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    ''
  const gtmId = siteSettings?.gtmId || process.env.NEXT_PUBLIC_GTM_ID || ''
  const posthogKey =
    siteSettings?.posthogKey || process.env.NEXT_PUBLIC_POSTHOG_KEY || ''

  const [mounted, setMounted] = useState(false)
  const [consentStatus, setConsentStatus] = useState<
    'pending' | 'granted' | 'declined'
  >('pending')
  const [showConsentBanner, setShowConsentBanner] = useState(false)

  const [geoSuggestion, setGeoSuggestion] = useState<{
    countryLabel: string
    suggestedLocale: LocaleCode
  } | null>(null)

  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null)
  const [showPwaBanner, setShowPwaBanner] = useState(false)
  const [showManualPwaGuide, setShowManualPwaGuide] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)

  useEffect(() => {
    setMounted(true)

    // 1. فحص الموافقة على الكوكيز
    try {
      const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (!savedConsent) {
        setConsentStatus('pending')
        setShowConsentBanner(true)
      } else {
        setConsentStatus(savedConsent === 'granted' ? 'granted' : 'declined')
        setShowConsentBanner(false)
      }
    } catch {
      setShowConsentBanner(true)
    }

    // 2. فحص اقتراح اللغة
    try {
      const langDismissed = localStorage.getItem(LANG_PROMPT_DISMISSED_KEY)
      if (!langDismissed) {
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() || ''
        const browserLang = (navigator.language || '').toLowerCase()

        let detectedCountry = 'Egypt'
        let targetLocale: LocaleCode = locale === 'ar' ? 'en' : 'ar'

        if (timeZone.includes('tbilisi') || browserLang.startsWith('ka')) {
          detectedCountry = 'Georgia'
          targetLocale = locale === 'ka' ? 'en' : 'ka'
        } else if (
          timeZone.includes('moscow') ||
          browserLang.startsWith('ru')
        ) {
          detectedCountry = 'Russia'
          targetLocale = locale === 'ru' ? 'en' : 'ru'
        } else if (timeZone.includes('riyadh')) {
          detectedCountry = 'Saudi Arabia'
          targetLocale = locale === 'ar' ? 'en' : 'ar'
        } else if (timeZone.includes('dubai')) {
          detectedCountry = 'UAE'
          targetLocale = locale === 'ar' ? 'en' : 'ar'
        } else {
          detectedCountry = 'Egypt'
          targetLocale = locale === 'ar' ? 'en' : 'ar'
        }

        setGeoSuggestion({
          countryLabel: detectedCountry,
          suggestedLocale: targetLocale,
        })
      }
    } catch {}

    // 3. فحص تثبيت التطبيق الرسمي (PWA)
    try {
      const ua = window.navigator.userAgent.toLowerCase()
      const ios = /iphone|ipad|ipod/.test(ua)
      setIsIosDevice(ios)

      const pwaDismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true

      // التقاط الحدث إذا كان قد تم حفظه مبكراً في window.__deferredPwaPrompt
      if ((window as any).__deferredPwaPrompt) {
        setDeferredPwaPrompt((window as any).__deferredPwaPrompt)
      }

      if (!pwaDismissed && !isStandalone) {
        setShowPwaBanner(true)
      }
    } catch {}

    const syncEarlyPrompt = () => {
      if ((window as any).__deferredPwaPrompt) {
        setDeferredPwaPrompt((window as any).__deferredPwaPrompt)
        setShowPwaBanner(true)
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      ;(window as any).__deferredPwaPrompt = e
      setDeferredPwaPrompt(e)
      setShowPwaBanner(true)
    }

    const handleAppInstalled = () => {
      ;(window as any).__deferredPwaPrompt = null
      setDeferredPwaPrompt(null)
      setShowPwaBanner(false)
      try {
        localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1')
      } catch {}
    }

    window.addEventListener('pwa-prompt-ready', syncEarlyPrompt)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('pwa-prompt-ready', syncEarlyPrompt)
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [locale])

  useEffect(() => {
    if (consentStatus !== 'granted') return
    trackFbEvent('PageView', { page_path: pathname })
  }, [pathname, searchParams, consentStatus])

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

  const handleInstallPwaClick = async () => {
    const activePrompt =
      deferredPwaPrompt || (window as any).__deferredPwaPrompt

    if (activePrompt && typeof activePrompt.prompt === 'function') {
      try {
        await activePrompt.prompt()
        const choiceResult = await activePrompt.userChoice
        if (choiceResult?.outcome === 'accepted') {
          ;(window as any).__deferredPwaPrompt = null
          setDeferredPwaPrompt(null)
          setShowPwaBanner(false)
          localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1')
        }
      } catch {
        setShowManualPwaGuide(true)
      }
    } else {
      setShowManualPwaGuide(true)
    }
  }

  if (!mounted) return null

  const isAdminRoute = pathname?.startsWith('/admin')
  const activeHintText = isIosDevice ? pT.iosInstallHint : pT.manualInstallHint

  return (
    <>
      {consentStatus === 'granted' && (
        <>
          {fbPixelId && (
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
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
                `,
              }}
            />
          )}

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

          {posthogKey && (
            <Script id="posthog-init" strategy="afterInteractive">
              {`
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${posthogKey}', { api_host: 'https://eu.i.posthog.com' });
              `}
            </Script>
          )}
        </>
      )}

      {!isAdminRoute && (
        <div
          dir={dir}
          className="pointer-events-none fixed inset-x-3 bottom-4 z-[999] mx-auto flex max-w-md flex-col gap-2.5 sm:bottom-6"
        >
          {/* الرسالة 1: شريط الدولة وتبديل اللغة */}
          {geoSuggestion && (
            <div className="pointer-events-auto flex items-center justify-between gap-2.5 rounded-[22px] border border-slate-200/90 bg-white/98 px-4 py-3 shadow-[0_14px_38px_rgba(15,29,64,0.16)] backdrop-blur-md">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                  <Globe className="size-4" />
                </span>
                <p
                  dir="ltr"
                  className="truncate text-xs font-extrabold text-[#0f1d40] sm:text-[13px]"
                >
                  <span>{geoSuggestion.countryLabel}</span>
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="font-semibold text-slate-500">
                    Language:{' '}
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
                  className="rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-4 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:opacity-95"
                >
                  {pT.switchBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeoSuggestion(null)
                    try {
                      localStorage.setItem(LANG_PROMPT_DISMISSED_KEY, '1')
                    } catch {}
                  }}
                  aria-label="Close"
                  className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* الرسالة 2: شريط تثبيت الموقع كتطبيق (PWA) */}
          {showPwaBanner && !showConsentBanner && (
            <div className="pointer-events-auto rounded-[22px] border border-slate-200/90 bg-white/98 p-4 shadow-[0_14px_38px_rgba(15,29,64,0.16)] backdrop-blur-md">
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
                      {showManualPwaGuide ? activeHintText : pT.pwaSub}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPwaBanner(false)
                    try {
                      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1')
                    } catch {}
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>

              {!showManualPwaGuide ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleInstallPwaClick}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700"
                  >
                    <Download className="size-3.5" />
                    <span>{pT.installBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-[#007a5a]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>{activeHintText}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* الرسالة 3: شريط الموافقة على قياس الزيارات والإعلانات */}
          {showConsentBanner && (
            <div className="pointer-events-auto rounded-[24px] border border-slate-200/90 bg-white/98 p-4 text-start shadow-[0_18px_45px_rgba(15,29,64,0.18)] backdrop-blur-md sm:p-5">
              <p className="text-xs leading-relaxed font-medium text-slate-600 sm:text-[13px]">
                {pT.consentText}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleConsentDecision('granted')}
                  className="h-10 flex-1 rounded-full bg-[#2563eb] px-6 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700 sm:flex-none"
                >
                  {pT.allowBtn}
                </button>

                <button
                  type="button"
                  onClick={() => handleConsentDecision('declined')}
                  className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-6 text-xs font-extrabold text-[#0f1d40] transition hover:bg-slate-50 sm:flex-none"
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
      )}
    </>
  )
}