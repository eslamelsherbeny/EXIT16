'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Building2,
  Check,
  CreditCard,
  Lock,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import enDict from '@/dictionaries/en.json'
import { DICTIONARIES, useTranslation, type LocaleCode } from '@/lib/i18n'

function getMarketDict(localeOrIsAr: LocaleCode | boolean) {
  const lang: LocaleCode =
    typeof localeOrIsAr === 'boolean'
      ? localeOrIsAr
        ? 'ar'
        : 'en'
      : ['ar', 'en', 'ru', 'ka'].includes(localeOrIsAr)
        ? localeOrIsAr
        : 'en'

  return (
    DICTIONARIES[lang]?.home?.marketSections || enDict.home.marketSections
  )
}

function formatCoversLabel(
  mT: typeof enDict.home.marketSections,
  tier: string,
  days: number
) {
  const dayWord =
    days === 1
      ? mT.daySingular
      : days === 2
        ? mT.dayDual || mT.dayPlural
        : mT.dayPlural

  return mT.coversLabelTemplate
    .replace('{tier}', tier)
    .replace('{days}', String(days))
    .replace('{dayWord}', dayWord)
}

export function calculateGelBoostPackage(
  amount: number,
  localeOrIsAr: LocaleCode | boolean
) {
  const mT = getMarketDict(localeOrIsAr)
  const cleanAmt = Math.max(5, Math.round(amount || 5))

  let tier: 'VIP+' | 'SUPER VIP' = cleanAmt < 10 ? 'VIP+' : 'SUPER VIP'
  let days = 1
  let discountBadge = ''
  let upsellTarget = 60
  let upsellDiscount = '-25%'
  let upsellDays = 10

  if (cleanAmt < 10) {
    tier = 'VIP+'
    days = Math.max(1, Math.floor(cleanAmt / 5))
  } else if (cleanAmt < 20) {
    tier = 'SUPER VIP'
    days = Math.max(1, Math.floor(cleanAmt / 10))
  } else if (cleanAmt < 50) {
    tier = 'SUPER VIP'
    days = Math.max(2, Math.floor(cleanAmt / 10))
  } else if (cleanAmt < 60) {
    tier = 'SUPER VIP'
    days = 7
  } else if (cleanAmt < 100) {
    tier = 'SUPER VIP'
    days = Math.max(10, Math.round(cleanAmt / 6))
    discountBadge = '-25%'
    upsellTarget = 100
    upsellDiscount = '-30%'
    upsellDays = 17
  } else if (cleanAmt < 200) {
    tier = 'SUPER VIP'
    days = Math.max(17, Math.round(cleanAmt / 5.88))
    discountBadge = '-30%'
    upsellTarget = 200
    upsellDiscount = '-33%'
    upsellDays = 30
  } else {
    tier = 'SUPER VIP'
    days = Math.max(30, Math.round(cleanAmt / 6.6))
    discountBadge = '-33%'
    upsellTarget = 0
  }

  return {
    amount: cleanAmt,
    tier,
    days,
    discountBadge,
    upsellTarget,
    upsellDiscount,
    upsellDays,
    coverLabel: formatCoversLabel(mT, tier, days),
  }
}

export function SponsoredRightAlignedBanner() {
  const { t: dict } = useTranslation()
  const mT = dict.home.marketSections

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="aqar-wave-banner rounded-[30px] border border-amber-400/20 bg-gradient-to-r from-[#0d2b26] via-[#132a4a] to-[#2d1b4e] p-8 text-center text-white shadow-xl transition duration-300 hover:shadow-2xl sm:p-12">
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
            <span className="inline-block rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-1 text-[11px] font-bold text-amber-300">
              ✦ {mT.bannerBadge}
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-4xl">
              {mT.bannerTitle}
            </h2>
            <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-white/80 sm:text-sm">
              {mT.bannerDesc}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[mT.bannerPill1, mT.bannerPill2, mT.bannerPill3].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-white/90"
                >
                  <span className="me-1 text-[#2ee59d]">•</span>
                  {pill}
                </span>
              ))}
            </div>
            <Link
              href="#boost-packages-section"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-8 text-xs font-bold text-white shadow-lg transition hover:scale-105 hover:opacity-95 sm:text-sm"
            >
              <span>{mT.bannerBtn}</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

export function LeadingDevelopersSection({
  realUnitCount: _realUnitCount = 0,
}: {
  realUnitCount?: number
}) {
  const { t: dict } = useTranslation()
  const mT = dict.home.marketSections

  const topDevelopers = [
    {
      rank: 1,
      name: mT.developers.archi,
      nameEn: 'Archi',
      city: mT.tbilisi,
      projectsCount: 55,
      activeCount: 33,
      logoType: 'archi',
    },
    {
      rank: 2,
      name: mT.developers.arcon,
      nameEn: 'Arcon',
      city: mT.tbilisi,
      projectsCount: 18,
      activeCount: 23,
      logoType: 'arcon',
    },
    {
      rank: 3,
      name: mT.developers.orbi,
      nameEn: 'ORBI Group',
      city: mT.batumi,
      projectsCount: 30,
      activeCount: 18,
      logoType: 'orbi',
    },
    {
      rank: 4,
      name: mT.developers.next,
      nameEn: 'NEXT Group',
      city: mT.tbilisi,
      projectsCount: 65,
      activeCount: 17,
      logoType: 'next',
    },
    {
      rank: 5,
      name: mT.developers.m2,
      nameEn: 'm²',
      city: mT.tbilisi,
      projectsCount: 28,
      activeCount: 14,
      logoType: 'm2',
    },
  ]

  const renderDeveloperLogo = (type: string) => {
    if (type === 'archi') {
      return (
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#009fe3] text-white shadow-2xs">
          <svg viewBox="0 0 24 24" className="size-6" fill="none">
            <path
              d="M6 19L12 5L18 19M9 14H15"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )
    }
    if (type === 'arcon') {
      return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="rounded border-2 border-[#e11d48] px-1.5 py-0.5 text-[11px] font-black tracking-tighter text-[#0f1d40]">
            MG
          </span>
        </div>
      )
    }
    if (type === 'orbi') {
      return (
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/70 text-[#15803d] shadow-2xs">
          <Building2 className="size-5" />
          <span className="mt-0.5 text-[7px] font-black uppercase">ORBI</span>
        </div>
      )
    }
    if (type === 'next') {
      return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] font-black tracking-wider text-[#0f1d40]">
            NEXT
          </span>
        </div>
      )
    }
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1e293b] text-amber-400 shadow-2xs">
        <span className="text-sm font-black">m²</span>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="text-start">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-[11px] font-bold text-[#2563eb]">
              🏢 {mT.devBadge}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1d40] sm:text-3xl">
              {mT.devTitle}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {mT.devSub}
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-bold text-[#2563eb] hover:underline sm:text-sm"
          >
            {mT.devAllBtn}
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 no-scrollbar lg:grid lg:grid-cols-5 lg:overflow-visible">
          {topDevelopers.map((dev) => (
            <Link
              key={dev.name}
              href={`/opportunities?q=${encodeURIComponent(dev.nameEn)}`}
              className="sivrce-card flex w-[250px] shrink-0 snap-start flex-col justify-between rounded-[22px] border border-slate-200/85 bg-white p-4 text-start shadow-2xs lg:w-auto"
            >
              <div className="flex items-center gap-3.5">
                {renderDeveloperLogo(dev.logoType)}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <strong className="truncate text-sm font-bold text-[#0f1d40]">
                      {dev.name}
                    </strong>
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#2563eb]">
                      {dev.rank}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-[11px] font-medium text-slate-400">
                    {dev.city} · {dev.projectsCount} {mT.devProjectsWord}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                <span className="text-slate-500">
                  {dev.activeCount} {mT.devActiveWord}
                </span>
                <span className="text-[#2563eb]">{mT.devProjectsLink}</span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </section>
  )
}

export function TopUpBalanceGelSection() {
  const router = useRouter()
  const i18nCtx = useTranslation() as Record<string, any>
  const dict = i18nCtx.t
  const activeLocale = (i18nCtx.locale as LocaleCode) || 'ar'
  const hasSession = Boolean(i18nCtx.hasSession ?? i18nCtx.isLoggedIn)
  const mT = (dict.home.marketSections || {}) as Record<string, any>
  const GEL = '₾'

  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(10)
  const [topUpAmount, setTopUpAmount] = useState<number>(10)

  const pkgDetails = useMemo(
    () => calculateGelBoostPackage(topUpAmount, activeLocale),
    [topUpAmount, activeLocale]
  )

  const presets = [
    {
      id: 5,
      val: 5,
      topBadge: mT.starterBadge,
      subText: `VIP+ · 1 ${mT.daySingular}`,
    },
    {
      id: 10,
      val: 10,
      topBadge: mT.recommendedBadge,
      subText: 'SUPER VIP',
      isRecommended: true,
    },
    {
      id: 20,
      val: 20,
      topBadge: '',
      subText: 'SUPER VIP',
    },
    {
      id: 50,
      val: 50,
      topBadge: mT.popularBadge,
      subText: 'SUPER VIP',
    },
    {
      id: 100,
      val: 100,
      topBadge: 'PRO -30%',
      subText: 'SUPER VIP',
    },
    {
      id: 'custom' as const,
      val: 0,
      topBadge: mT.customAmountLabel,
      subText: mT.anyWord,
    },
  ]

  const formatUpsellAdvice = (target: number, discount: string, days: number) =>
    String(mT.upsellAdviceTemplate || '')
      .replace('{target}', String(target))
      .replace('{discount}', discount)
      .replace('{days}', String(days))

  const formatTopUpToBtn = (target: number) =>
    String(mT.topUpToBtnTemplate || '').replace('{target}', String(target))

  const handleStartBoostFlow = () => {
    const targetAccountUrl = `/account?view=seller&boostAmount=${pkgDetails.amount}#promo-section`
    if (hasSession) {
      router.push(targetAccountUrl)
    } else {
      router.push(`/login?next=${encodeURIComponent(targetAccountUrl)}`)
    }
  }

  const ctaBtnText = (
    hasSession
      ? String(mT.homeBoostCtaLoggedInTemplate || '')
      : String(mT.homeBoostCtaGuestTemplate || '')
  ).replace('{amount}', String(pkgDetails.amount))

  return (
    <section
      id="boost-packages-section"
      className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8"
    >
      <ScrollReveal>
        <div className="grid grid-cols-1 items-center gap-10 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-10 lg:grid-cols-12">
          <div className="text-start lg:col-span-7">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#2563eb]">
              ✦ {mT.walletBadge}
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-[#0f1d40] sm:text-4xl">
              {mT.walletTitlePrefix}{' '}
              <span className="text-[#2563eb]">{mT.walletTitleAccent}</span>
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {mT.walletDesc}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-orange-50 text-[#ff6437]">
                  <CreditCard className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {mT.feature1Title}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {mT.feature1Desc}
                </p>
              </div>

              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#007a5a]">
                  <Check className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {mT.feature2Title}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {mT.feature2Desc}
                </p>
              </div>

              <div className="sivrce-card rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Sparkles className="size-4" />
                </div>
                <strong className="block text-xs font-bold text-[#0f1d40]">
                  {mT.feature3Title}
                </strong>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {mT.feature3Desc}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 text-start shadow-md sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#ff6437]">
                1:1 ⚡
              </span>
              <div className="flex items-center gap-2.5">
                <div className="text-end">
                  <strong className="block text-xs font-bold text-[#0f1d40]">
                    {mT.quickAmounts}
                  </strong>
                  <span dir="ltr" className="text-[10px] text-slate-400">
                    Min 5 {GEL} · Max 10,000 {GEL}
                  </span>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Wallet className="size-4" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {presets.map((item) => {
                const isActive =
                  item.id === 'custom'
                    ? selectedPreset === 'custom'
                    : selectedPreset === item.val && topUpAmount === item.val

                return (
                  <button
                    key={String(item.id)}
                    type="button"
                    onClick={() => {
                      if (item.id === 'custom') {
                        setSelectedPreset('custom')
                      } else {
                        setSelectedPreset(item.val)
                        setTopUpAmount(item.val)
                      }
                    }}
                    className={`relative flex min-h-[68px] flex-col items-center justify-center rounded-2xl border px-1.5 py-2 text-center transition ${
                      isActive
                        ? 'border-2 border-[#2563eb] bg-blue-50/40 text-[#0f1d40] shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.topBadge && (
                      <span
                        className={`-mt-1 mb-1 max-w-full truncate rounded-full px-1.5 py-0.5 text-[7.5px] font-bold ${
                          item.isRecommended
                            ? 'bg-gradient-to-r from-[#ff6437] to-[#ff4f69] text-white shadow-2xs'
                            : isActive
                              ? 'text-[#2563eb]'
                              : 'text-slate-400'
                        }`}
                      >
                        {item.topBadge}
                      </span>
                    )}

                    <strong dir="ltr" className="text-xs font-bold sm:text-sm">
                      {item.id === 'custom' ? '...' : `${item.val} ${GEL}`}
                    </strong>
                    <span className="mt-0.5 text-[8.5px] font-semibold text-slate-400">
                      {item.subText}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-end text-[11px] font-semibold text-slate-500">
                {mT.customAmountLabel}
              </span>
              <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom')
                      setTopUpAmount((prev) => Math.min(10000, prev + 5))
                    }}
                    className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    {GEL}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset(10)
                      setTopUpAmount(10)
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                    title={dict.locationModal.clearBtn}
                  >
                    ×
                  </button>
                </div>

                <input
                  type="number"
                  dir="ltr"
                  value={topUpAmount}
                  onChange={(e) => {
                    setSelectedPreset('custom')
                    setTopUpAmount(Math.max(5, Number(e.target.value) || 5))
                  }}
                  className="w-full bg-transparent text-center text-base font-bold text-[#0f1d40] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('custom')
                    setTopUpAmount((prev) => Math.max(5, prev - 5))
                  }}
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  -
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f5f8ff] p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-100/80 text-[#2563eb]">
                  <Zap className="size-4" />
                </span>
                <div className="text-end">
                  <strong
                    dir="ltr"
                    className="block text-xs font-bold text-[#0f1d40] sm:text-sm"
                  >
                    {pkgDetails.amount} {GEL} {mT.creditedToBalance}
                  </strong>
                  <span className="mt-0.5 block text-[11px] font-bold text-[#2563eb]">
                    {pkgDetails.coverLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                  ✓ {mT.zeroFeeBadge}
                </span>
                <span className="rounded-full bg-blue-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
                  ✓ {mT.instantCreditBadge}
                </span>
              </div>

              {pkgDetails.upsellTarget > 0 && (
                <div className="mt-3 border-t border-blue-200/60 pt-3 text-end">
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {formatUpsellAdvice(
                      pkgDetails.upsellTarget,
                      pkgDetails.upsellDiscount,
                      pkgDetails.upsellDays
                    )}{' '}
                    ✨
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('custom')
                      setTopUpAmount(pkgDetails.upsellTarget)
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-3 py-1 text-[10.5px] font-bold text-white shadow-2xs transition hover:opacity-95"
                  >
                    <span>{formatTopUpToBtn(pkgDetails.upsellTarget)}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-1 text-[10.5px] font-semibold text-slate-500">
              <span>⚡ {mT.zeroFeeBadge}</span>
              <span>✓ {mT.neverExpires}</span>
              <span>🛡️ {mT.fullyRefundable}</span>
            </div>

            <button
              type="button"
              onClick={handleStartBoostFlow}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6437] to-[#ff4f69] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,100,55,0.3)] transition hover:opacity-95 sm:text-sm"
            >
              <Sparkles className="size-4" />
              <span>{ctaBtnText}</span>
              <ArrowUpRight className="size-4" />
            </button>

            <p className="mt-2.5 text-center text-[11px] leading-relaxed font-medium text-slate-500">
              {mT.homeBoostNote}
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
              <span>TBC Bank · Bank of Georgia · Instant Activation</span>
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" /> 256-bit SSL
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}