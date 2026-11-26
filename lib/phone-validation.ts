import { DICTIONARIES, type LocaleCode } from '@/lib/i18n-config'

export type PhoneValidationMessages = {
  empty: string
  fake: string
  invalidPrefix: string
  invalidLength: string
}

export type PhoneCountryRule = {
  iso: string
  dialCode: string
  placeholder: string
  minLength: number // عدد الأرقام بدون الصفر الافتتاحي (National Significant Number)
  maxLength: number
  hasTrunkZero: boolean // هل يكتب السكان صفراً في بداية الرقم محلياً مثل 010 أو 05
  mobilePrefixes?: string[] // البادئات المسموحة بعد إزالة الصفر الافتتاحي
  displayPrefixes?: string[] // البادئات للعرض في رسالة الخطأ للمستخدم
}

export const PHONE_COUNTRY_RULES: Record<string, PhoneCountryRule> = {
  GE: {
    iso: 'GE',
    dialCode: '995',
    placeholder: '5xx xx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: false,
    mobilePrefixes: ['5'],
    displayPrefixes: ['5'],
  },
  EG: {
    iso: 'EG',
    dialCode: '20',
    placeholder: '010 1234 5678',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: true,
    mobilePrefixes: ['10', '11', '12', '15'],
    displayPrefixes: ['010', '011', '012', '015'],
  },
  SA: {
    iso: 'SA',
    dialCode: '966',
    placeholder: '05x xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['50', '51', '53', '54', '55', '56', '57', '58', '59'],
    displayPrefixes: ['05'],
  },
  AE: {
    iso: 'AE',
    dialCode: '971',
    placeholder: '05x xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['50', '52', '54', '55', '56', '58'],
    displayPrefixes: ['050', '052', '054', '055', '056', '058'],
  },
  KW: {
    iso: 'KW',
    dialCode: '965',
    placeholder: '5xxx xxxx',
    minLength: 8,
    maxLength: 8,
    hasTrunkZero: false,
    mobilePrefixes: ['41', '5', '6', '9'],
    displayPrefixes: ['5', '6', '9'],
  },
  QA: {
    iso: 'QA',
    dialCode: '974',
    placeholder: '5xxx xxxx',
    minLength: 8,
    maxLength: 8,
    hasTrunkZero: false,
    mobilePrefixes: ['3', '5', '6', '7'],
    displayPrefixes: ['3', '5', '6', '7'],
  },
  BH: {
    iso: 'BH',
    dialCode: '973',
    placeholder: '3xxx xxxx',
    minLength: 8,
    maxLength: 8,
    hasTrunkZero: false,
    mobilePrefixes: ['3', '6'],
    displayPrefixes: ['3', '6'],
  },
  OM: {
    iso: 'OM',
    dialCode: '968',
    placeholder: '9xxx xxxx',
    minLength: 8,
    maxLength: 8,
    hasTrunkZero: false,
    mobilePrefixes: ['7', '9'],
    displayPrefixes: ['7', '9'],
  },
  JO: {
    iso: 'JO',
    dialCode: '962',
    placeholder: '079 xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['77', '78', '79'],
    displayPrefixes: ['077', '078', '079'],
  },
  IQ: {
    iso: 'IQ',
    dialCode: '964',
    placeholder: '077x xxx xxxx',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: true,
    mobilePrefixes: ['73', '74', '75', '76', '77', '78', '79'],
    displayPrefixes: ['07'],
  },
  LB: {
    iso: 'LB',
    dialCode: '961',
    placeholder: '71 xxx xxx',
    minLength: 7,
    maxLength: 8,
    hasTrunkZero: true,
    mobilePrefixes: ['3', '70', '71', '76', '78', '79', '81'],
    displayPrefixes: ['03', '70', '71', '76', '78', '79', '81'],
  },
  PS: {
    iso: 'PS',
    dialCode: '970',
    placeholder: '059 xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['56', '59'],
    displayPrefixes: ['056', '059'],
  },
  IL: {
    iso: 'IL',
    dialCode: '972',
    placeholder: '05x xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['5'],
    displayPrefixes: ['05'],
  },
  SY: {
    iso: 'SY',
    dialCode: '963',
    placeholder: '09xx xxx xxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['9'],
    displayPrefixes: ['09'],
  },
  YE: {
    iso: 'YE',
    dialCode: '967',
    placeholder: '7xx xxx xxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['7'],
    displayPrefixes: ['7'],
  },
  LY: {
    iso: 'LY',
    dialCode: '218',
    placeholder: '09x xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['9'],
    displayPrefixes: ['09'],
  },
  TN: {
    iso: 'TN',
    dialCode: '216',
    placeholder: '2x xxx xxx',
    minLength: 8,
    maxLength: 8,
    hasTrunkZero: false,
    mobilePrefixes: ['2', '4', '5', '9'],
    displayPrefixes: ['2', '4', '5', '9'],
  },
  DZ: {
    iso: 'DZ',
    dialCode: '213',
    placeholder: '05xx xx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['5', '6', '7'],
    displayPrefixes: ['05', '06', '07'],
  },
  MA: {
    iso: 'MA',
    dialCode: '212',
    placeholder: '06xx xx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['6', '7'],
    displayPrefixes: ['06', '07'],
  },
  SD: {
    iso: 'SD',
    dialCode: '249',
    placeholder: '09x xxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['1', '9'],
    displayPrefixes: ['09', '01'],
  },
  TR: {
    iso: 'TR',
    dialCode: '90',
    placeholder: '05xx xxx xx xx',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: true,
    mobilePrefixes: ['5'],
    displayPrefixes: ['05'],
  },
  RU: {
    iso: 'RU',
    dialCode: '7',
    placeholder: '9xx xxx xx xx',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: false,
    mobilePrefixes: ['7', '9'],
    displayPrefixes: ['9', '7'],
  },
  KZ: {
    iso: 'KZ',
    dialCode: '7',
    placeholder: '7xx xxx xx xx',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: false,
    mobilePrefixes: ['7'],
    displayPrefixes: ['7'],
  },
  UA: {
    iso: 'UA',
    dialCode: '380',
    placeholder: '067 xxx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: [
      '39',
      '50',
      '63',
      '66',
      '67',
      '68',
      '73',
      '75',
      '77',
      '91',
      '92',
      '93',
      '94',
      '95',
      '96',
      '97',
      '98',
      '99',
    ],
    displayPrefixes: ['050', '063', '066', '067', '068', '073', '09x'],
  },
  BY: {
    iso: 'BY',
    dialCode: '375',
    placeholder: '29 xxx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: false,
    mobilePrefixes: ['25', '29', '33', '44'],
    displayPrefixes: ['25', '29', '33', '44'],
  },
  AZ: {
    iso: 'AZ',
    dialCode: '994',
    placeholder: '050 xxx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['10', '50', '51', '55', '70', '77', '99'],
    displayPrefixes: ['050', '051', '055', '070', '077', '099'],
  },
  AM: {
    iso: 'AM',
    dialCode: '374',
    placeholder: '091 xx xx xx',
    minLength: 8,
    maxLength: 8,
    hasTrunkZero: true,
    mobilePrefixes: [
      '33',
      '41',
      '43',
      '44',
      '49',
      '55',
      '77',
      '91',
      '93',
      '94',
      '95',
      '96',
      '97',
      '98',
      '99',
    ],
    displayPrefixes: ['033', '041', '043', '044', '055', '077', '09x'],
  },
  DE: {
    iso: 'DE',
    dialCode: '49',
    placeholder: '015x xxxx xxxx',
    minLength: 10,
    maxLength: 11,
    hasTrunkZero: true,
    mobilePrefixes: ['15', '16', '17'],
    displayPrefixes: ['015', '016', '017'],
  },
  GB: {
    iso: 'GB',
    dialCode: '44',
    placeholder: '07xxx xxxxxx',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: true,
    mobilePrefixes: ['7'],
    displayPrefixes: ['07'],
  },
  FR: {
    iso: 'FR',
    dialCode: '33',
    placeholder: '06 xx xx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['6', '7'],
    displayPrefixes: ['06', '07'],
  },
  IT: {
    iso: 'IT',
    dialCode: '39',
    placeholder: '3xx xxx xxxx',
    minLength: 9,
    maxLength: 10,
    hasTrunkZero: false,
    mobilePrefixes: ['3'],
    displayPrefixes: ['3'],
  },
  ES: {
    iso: 'ES',
    dialCode: '34',
    placeholder: '6xx xx xx xx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: false,
    mobilePrefixes: ['6', '7'],
    displayPrefixes: ['6', '7'],
  },
  NL: {
    iso: 'NL',
    dialCode: '31',
    placeholder: '06 xxxx xxxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: true,
    mobilePrefixes: ['6'],
    displayPrefixes: ['06'],
  },
  PL: {
    iso: 'PL',
    dialCode: '48',
    placeholder: '5xx xxx xxx',
    minLength: 9,
    maxLength: 9,
    hasTrunkZero: false,
    mobilePrefixes: ['45', '5', '6', '7', '88'],
    displayPrefixes: ['45', '5', '6', '7', '88'],
  },
  US: {
    iso: 'US',
    dialCode: '1',
    placeholder: '201 555 0123',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: false,
    mobilePrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'],
    displayPrefixes: ['2-9'],
  },
  CA: {
    iso: 'CA',
    dialCode: '1',
    placeholder: '416 555 0123',
    minLength: 10,
    maxLength: 10,
    hasTrunkZero: false,
    mobilePrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'],
    displayPrefixes: ['2-9'],
  },
}

const DEFAULT_FALLBACK_RULE: PhoneCountryRule = {
  iso: 'INTL',
  dialCode: '',
  placeholder: 'xxx xxx xxxx',
  minLength: 7,
  maxLength: 13,
  hasTrunkZero: true,
}

function toAsciiDigits(raw: string): string {
  return String(raw || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

function resolveDictionaryMessages(
  locale?: string,
  override?: Partial<PhoneValidationMessages>
): Partial<PhoneValidationMessages> {
  const safeLocale: LocaleCode =
    locale === 'ar' || locale === 'en' || locale === 'ru' || locale === 'ka'
      ? locale
      : 'ar'
  const dict = (DICTIONARIES[safeLocale] || DICTIONARIES.ar) as Record<
    string,
    any
  >
  const fromDict = (dict?.common?.phoneValidation ||
    {}) as Partial<PhoneValidationMessages>
  return {
    ...fromDict,
    ...(override || {}),
  }
}

function formatPhoneErrorFromDict(
  reason: 'empty' | 'length' | 'prefix' | 'fake',
  rule: PhoneCountryRule,
  locale?: string,
  override?: Partial<PhoneValidationMessages>
): string {
  const msgs = resolveDictionaryMessages(locale, override)

  const expectedDisplayMin = rule.hasTrunkZero
    ? rule.minLength + 1
    : rule.minLength
  const expectedDisplayMax = rule.hasTrunkZero
    ? rule.maxLength + 1
    : rule.maxLength
  const lenText =
    expectedDisplayMin === expectedDisplayMax
      ? String(expectedDisplayMin)
      : `${expectedDisplayMin}-${expectedDisplayMax}`
  const prefixesText = rule.displayPrefixes?.join(' / ') || ''

  if (reason === 'empty') {
    return msgs.empty || ''
  }
  if (reason === 'fake') {
    return msgs.fake || msgs.empty || ''
  }
  if (reason === 'prefix' && prefixesText && msgs.invalidPrefix) {
    return msgs.invalidPrefix.replace('{prefixes}', prefixesText)
  }
  return (msgs.invalidLength || msgs.empty || '')
    .replace('{length}', lenText)
    .replace('{example}', rule.placeholder)
}

export function getPhoneRule(
  countryIso?: string | null,
  dialCode?: string | null
): PhoneCountryRule {
  const cleanIso = String(countryIso || '').trim().toUpperCase()
  const cleanDial = toAsciiDigits(String(dialCode || '')).replace(/\D/g, '')

  if (
    cleanIso &&
    PHONE_COUNTRY_RULES[cleanIso] &&
    (!cleanDial || PHONE_COUNTRY_RULES[cleanIso].dialCode === cleanDial)
  ) {
    return PHONE_COUNTRY_RULES[cleanIso]
  }

  if (cleanDial) {
    if (cleanDial === '7') {
      return PHONE_COUNTRY_RULES.RU
    }
    const found = Object.values(PHONE_COUNTRY_RULES).find(
      (r) => r.dialCode === cleanDial
    )
    if (found) return found
  }

  return {
    ...DEFAULT_FALLBACK_RULE,
    dialCode: cleanDial,
  }
}

export function getPhonePlaceholder(
  countryIso?: string | null,
  dialCode?: string | null
): string {
  return getPhoneRule(countryIso, dialCode).placeholder
}

export function getPhoneInputMaxLength(
  currentValue: string,
  countryIso?: string | null,
  dialCode?: string | null
): number {
  const rule = getPhoneRule(countryIso, dialCode)
  const digits = toAsciiDigits(currentValue).replace(/\D/g, '')
  const extraZero = rule.hasTrunkZero && digits.startsWith('0') ? 1 : 0
  return rule.maxLength + extraZero + 4
}

export function sanitizePhoneInputForCountry(
  rawInput: string,
  countryIso?: string | null,
  dialCode?: string | null
): string {
  const rule = getPhoneRule(countryIso, dialCode)
  const cleanDial = toAsciiDigits(
    String(dialCode || rule.dialCode || '')
  ).replace(/\D/g, '')

  let digits = toAsciiDigits(rawInput).replace(/\D/g, '')

  if (cleanDial && digits.startsWith(`00${cleanDial}`)) {
    digits = digits.slice(2 + cleanDial.length)
  } else if (
    cleanDial &&
    digits.startsWith(cleanDial) &&
    digits.length > rule.maxLength + (rule.hasTrunkZero ? 1 : 0)
  ) {
    digits = digits.slice(cleanDial.length)
  }

  const maxAllowed =
    rule.hasTrunkZero && digits.startsWith('0')
      ? rule.maxLength + 1
      : rule.maxLength

  return digits.slice(0, maxAllowed)
}

export function validatePhoneForCountry(params: {
  rawPhone: string
  dialCode: string
  countryIso?: string | null
  locale?: string
  messages?: Partial<PhoneValidationMessages>
}): {
  valid: boolean
  e164: string
  nationalDigits: string
  error?: string
} {
  const rule = getPhoneRule(params.countryIso, params.dialCode)
  const cleanDial = toAsciiDigits(
    String(params.dialCode || rule.dialCode || '')
  ).replace(/\D/g, '')

  let digits = toAsciiDigits(params.rawPhone).replace(/\D/g, '')

  if (!digits) {
    return {
      valid: false,
      e164: '',
      nationalDigits: '',
      error: formatPhoneErrorFromDict(
        'empty',
        rule,
        params.locale,
        params.messages
      ),
    }
  }

  if (cleanDial && digits.startsWith(`00${cleanDial}`)) {
    digits = digits.slice(2 + cleanDial.length)
  } else if (
    cleanDial &&
    digits.startsWith(cleanDial) &&
    digits.length > rule.maxLength + (rule.hasTrunkZero ? 1 : 0)
  ) {
    digits = digits.slice(cleanDial.length)
  }

  if (rule.hasTrunkZero && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '')
  }

  if (digits.length < rule.minLength || digits.length > rule.maxLength) {
    return {
      valid: false,
      e164: '',
      nationalDigits: digits,
      error: formatPhoneErrorFromDict(
        'length',
        rule,
        params.locale,
        params.messages
      ),
    }
  }

  if (rule.mobilePrefixes && rule.mobilePrefixes.length > 0) {
    const matchesPrefix = rule.mobilePrefixes.some((p) => digits.startsWith(p))
    if (!matchesPrefix) {
      return {
        valid: false,
        e164: '',
        nationalDigits: digits,
        error: formatPhoneErrorFromDict(
          'prefix',
          rule,
          params.locale,
          params.messages
        ),
      }
    }
  }

  const subscriberPart = digits.slice(2)
  if (subscriberPart.length >= 5 && new Set(subscriberPart).size === 1) {
    return {
      valid: false,
      e164: '',
      nationalDigits: digits,
      error: formatPhoneErrorFromDict(
        'fake',
        rule,
        params.locale,
        params.messages
      ),
    }
  }

  const e164 = cleanDial ? `+${cleanDial}${digits}` : `+${digits}`
  return {
    valid: true,
    e164,
    nationalDigits: digits,
  }
}

export function validateInternationalE164Phone(
  fullPhone: string,
  countryIso?: string | null,
  locale: string = 'ar',
  messages?: Partial<PhoneValidationMessages>
): { valid: boolean; e164: string; error?: string } {
  const digits = toAsciiDigits(fullPhone).replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) {
    const fallbackRule = getPhoneRule(countryIso, '')
    return {
      valid: false,
      e164: '',
      error: formatPhoneErrorFromDict('length', fallbackRule, locale, messages),
    }
  }

  const cleanIso = String(countryIso || '').trim().toUpperCase()
  if (cleanIso && PHONE_COUNTRY_RULES[cleanIso]) {
    const rule = PHONE_COUNTRY_RULES[cleanIso]
    if (digits.startsWith(rule.dialCode)) {
      const localPart = digits.slice(rule.dialCode.length)
      return validatePhoneForCountry({
        rawPhone: localPart,
        dialCode: rule.dialCode,
        countryIso: cleanIso,
        locale,
        messages,
      })
    }
  }

  const sortedRules = Object.values(PHONE_COUNTRY_RULES).sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )
  for (const rule of sortedRules) {
    if (digits.startsWith(rule.dialCode)) {
      const localPart = digits.slice(rule.dialCode.length)
      return validatePhoneForCountry({
        rawPhone: localPart,
        dialCode: rule.dialCode,
        countryIso: rule.dialCode === '7' ? 'RU' : rule.iso,
        locale,
        messages,
      })
    }
  }

  return {
    valid: true,
    e164: `+${digits}`,
  }
}