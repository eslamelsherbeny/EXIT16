import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const COUNTRY_NAMES: Record<
  string,
  {
    ar: string
    en: string
    ru: string
    ka: string
    suggestedLocale: 'ar' | 'en' | 'ru' | 'ka'
  }
> = {
  EG: { ar: 'مصر', en: 'Egypt', ru: 'Египет', ka: 'ეგვიპტე', suggestedLocale: 'ar' },
  SA: { ar: 'السعودية', en: 'Saudi Arabia', ru: 'Саудовская Аравия', ka: 'საუდის არაბეთი', suggestedLocale: 'ar' },
  AE: { ar: 'الإمارات', en: 'UAE', ru: 'ОАЭ', ka: 'საამიროები', suggestedLocale: 'ar' },
  KW: { ar: 'الكويت', en: 'Kuwait', ru: 'Кувейт', ka: 'ქუვეითი', suggestedLocale: 'ar' },
  QA: { ar: 'قطر', en: 'Qatar', ru: 'Катар', ka: 'ყატარი', suggestedLocale: 'ar' },
  BH: { ar: 'البحرين', en: 'Bahrain', ru: 'Бахрейн', ka: 'ბაჰრეინი', suggestedLocale: 'ar' },
  OM: { ar: 'عمان', en: 'Oman', ru: 'Оман', ka: 'ომანი', suggestedLocale: 'ar' },
  JO: { ar: 'الأردن', en: 'Jordan', ru: 'Иордания', ka: 'იორდანია', suggestedLocale: 'ar' },
  IQ: { ar: 'العراق', en: 'Iraq', ru: 'Ирак', ka: 'ერაყი', suggestedLocale: 'ar' },
  LB: { ar: 'لبنان', en: 'Lebanon', ru: 'Ливан', ka: 'ლიბანი', suggestedLocale: 'ar' },
  GE: { ar: 'جورجيا', en: 'Georgia', ru: 'Грузия', ka: 'საქართველო', suggestedLocale: 'ka' },
  RU: { ar: 'روسيا', en: 'Russia', ru: 'Россия', ka: 'რუსეთი', suggestedLocale: 'ru' },
  BY: { ar: 'بيلاروسيا', en: 'Belarus', ru: 'Беларусь', ka: 'ბელარუსი', suggestedLocale: 'ru' },
  KZ: { ar: 'كازاخستان', en: 'Kazakhstan', ru: 'Казахстан', ka: 'ყაზახეთი', suggestedLocale: 'ru' },
  UA: { ar: 'أوكرانيا', en: 'Ukraine', ru: 'Украина', ka: 'უკრაინა', suggestedLocale: 'ru' },
  AZ: { ar: 'أذربيجان', en: 'Azerbaijan', ru: 'Азербайджан', ka: 'აზერბაიჯანი', suggestedLocale: 'ru' },
  AM: { ar: 'أرمينيا', en: 'Armenia', ru: 'Армения', ka: 'სომხეთი', suggestedLocale: 'ru' },
  US: { ar: 'أمريكا', en: 'United States', ru: 'США', ka: 'აშშ', suggestedLocale: 'en' },
  GB: { ar: 'بريطانيا', en: 'United Kingdom', ru: 'Великобритания', ka: 'დიდი ბრიტანეთი', suggestedLocale: 'en' },
}

export async function GET(req: NextRequest) {
  const rawCountry =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    'EG'

  const countryCode = rawCountry.toUpperCase()
  const acceptLang = (req.headers.get('accept-language') || '').toLowerCase()

  const matched = COUNTRY_NAMES[countryCode] || {
    ar: countryCode,
    en: countryCode,
    ru: countryCode,
    ka: countryCode,
    suggestedLocale: acceptLang.startsWith('ar')
      ? 'ar'
      : acceptLang.startsWith('ru')
        ? 'ru'
        : acceptLang.startsWith('ka')
          ? 'ka'
          : 'en',
  }

  return NextResponse.json(
    {
      countryCode,
      countryName: matched,
      suggestedLocale: matched.suggestedLocale,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}