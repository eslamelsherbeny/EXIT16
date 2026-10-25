"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Check,
  CheckCircle2,
  EyeOff,
  Loader2,
  MessageCircle,
  TrendingUp,
  User,
} from "lucide-react"
import { useTranslation, getCurrencySymbol } from "@/lib/i18n"
import { TurnstileBox } from "@/components/layouts/auth-layout"
import { CountrySelector } from "@/components/shared/country-selector"
import {
  getCurrentSellerProfileAction,
  processSellerStep2Action,
} from "@/actions/submit-forms"

function formatNumberInput(val: string) {
  const digits = val.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("en-US")
}

function parseNumberInput(val: string) {
  return Number(val.replace(/,/g, "")) || 0
}

export default function ExitReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t: dict, locale, dir, siteSettings } = useTranslation()
  const cur = getCurrencySymbol("GE", locale)

  const t = (dict as Record<string, any>).exitReportPage
  const calcT = (dict as Record<string, any>).calculatorPage || {}
  const formActionsDict = (dict as Record<string, any>).serverActions?.forms
  const waPhone = String(
    siteSettings?.whatsappNumber || dict.footer?.phone || "+201018595959"
  ).replace(/\D/g, "")

  // قراءة نسب خصم المطور عند الفسخ ديناميكياً من إعدادات الأدمن
  const rawMinPct = Number(
    (siteSettings as Record<string, any>)?.developerPenaltyMin
  )
  const rawMaxPct = Number(
    (siteSettings as Record<string, any>)?.developerPenaltyMax
  )
  const minPenaltyPct =
    Number.isFinite(rawMinPct) && rawMinPct > 0 ? rawMinPct : 10
  const maxPenaltyPct =
    Number.isFinite(rawMaxPct) && rawMaxPct >= minPenaltyPct
      ? rawMaxPct
      : Math.max(minPenaltyPct, 15)

  const [step, setStep] = useState<1 | 2>(1)
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [developerName, setDeveloperName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [contractPrice, setContractPrice] = useState(
    searchParams.get("contract")
      ? formatNumberInput(searchParams.get("contract")!)
      : ""
  )
  const [paidAmount, setPaidAmount] = useState(
    searchParams.get("paid")
      ? formatNumberInput(searchParams.get("paid")!)
      : ""
  )

  const [loggedUser, setLoggedUser] = useState<{
    id: string
    name: string
    email: string
    phone: string
  } | null>(null)

  const [name, setName] = useState("")
  const [phoneCode, setPhoneCode] = useState("995")
  const [countryIso, setCountryIso] = useState("GE")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    getCurrentSellerProfileAction().then((res) => {
      if (res.isLoggedIn && res.user) {
        setLoggedUser(res.user)
        setName(res.user.name || "")
        setEmail(res.user.email || "")
      }
    })
  }, [])

  const contractNum = parseNumberInput(contractPrice)
  const paidNum = parseNumberInput(paidAmount)
  const minPenalty = Math.round(contractNum * (minPenaltyPct / 100))
  const maxPenalty = Math.round(contractNum * (maxPenaltyPct / 100))

  function handleNextStep() {
    setErrorMsg(null)
    if (
      !developerName.trim() ||
      !projectName.trim() ||
      !contractPrice ||
      !paidAmount
    ) {
      setErrorMsg(t.errStep1)
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!loggedUser) {
      if (
        !name.trim() ||
        !phone.trim() ||
        !email.trim() ||
        password.length < 8
      ) {
        setErrorMsg(t.errStep2)
        return
      }
    }

    startTransition(async () => {
      try {
        const cleanPhoneDigits = phone.replace(/^0+/, "").replace(/\D/g, "")
        const fullPhone = loggedUser
          ? loggedUser.phone
          : `+${phoneCode.replace("+", "")}${cleanPhoneDigits}`

        const res = await processSellerStep2Action({
          mode: loggedUser ? "session" : "register",
          unitCountry: "GE",
          userCountry: countryIso || "GE",
          developer: developerName.trim(),
          project: projectName.trim(),
          contractPrice: contractNum,
          paidAmount: paidNum,
          marketPrice: contractNum,
          name: loggedUser ? loggedUser.name : name.trim(),
          phone: fullPhone,
          email: loggedUser ? loggedUser.email : email.trim(),
          password,
        })

        if (res.status === "ok" || res.unitId) {
          window.location.href = "/account?view=seller"
          return
        }

        setErrorMsg(res.error || formActionsDict?.unexpected)
      } catch (err: any) {
        setErrorMsg(err?.message || formActionsDict?.unexpected)
      }
    })
  }

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[#f5f6f8] py-10 text-[#0a1122] sm:py-14"
    >
      <div className="mx-auto max-w-[620px] px-4 sm:px-6">
        <div className="text-start">
          <h1 className="text-2xl leading-snug font-black text-[#0a1122] sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-3 text-xs leading-[1.9] text-gray-600 sm:text-sm">
            {t.description}
          </p>

          <div className="mt-5 space-y-2.5">
            {[t.point1, t.point2, t.point3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white px-4 py-3.5 text-xs font-bold text-[#0a1122] shadow-2xs sm:text-sm"
              >
                <Check className="size-4 shrink-0 text-[#0b6954]" />
                <span>{item}</span>
              </div>
            ))}

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#a7e3cb] bg-[#eaf8f2] px-4 py-3.5 text-xs font-extrabold text-[#0b6954] sm:text-sm">
              <Check className="size-4 shrink-0 text-[#0b6954]" />
              <span>{t.point4Highlight}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-900/80 bg-white px-4 py-3 text-xs font-extrabold text-[#0a1122]">
            {t.ownersOnlyBanner}
          </div>
        </div>

        {/* ملخص مالي ذكي حي بناءً على نسبة خصم المطور المحددة في إعدادات الموقع */}
        {contractNum > 0 && paidNum > 0 && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-[#eaf8f2] to-white p-4 text-start shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0b6954]">
                <TrendingUp className="size-4" />
                <span>{calcT.netDiffInFavorLabel || t.point4Highlight}</span>
              </span>
              <span
                dir="ltr"
                className="rounded-full bg-[#0b6954] px-2.5 py-0.5 text-[10.5px] font-extrabold text-white"
              >
                {minPenaltyPct === maxPenaltyPct
                  ? `${minPenaltyPct}%`
                  : `${minPenaltyPct}% – ${maxPenaltyPct}%`}
              </span>
            </div>
            <p className="mt-1.5 text-base font-black text-[#0a1122] tabular-nums sm:text-lg">
              {minPenalty === maxPenalty ? (
                <>
                  <span dir="ltr">{maxPenalty.toLocaleString("en-US")}</span>{" "}
                  {cur}
                </>
              ) : (
                <>
                  <span dir="ltr">{minPenalty.toLocaleString("en-US")}</span>{" "}
                  {cur} –{" "}
                  <span dir="ltr">{maxPenalty.toLocaleString("en-US")}</span>{" "}
                  {cur}
                </>
              )}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmitReport}
          className="mt-6 rounded-[24px] border border-gray-200/90 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-6 rounded-2xl border border-gray-300 bg-gray-50/70 p-4 text-start">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0a1122] sm:text-sm">
              <User className="size-4 shrink-0 text-blue-600" />
              <span>{t.trustBoxTitle}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-gray-600">
              {t.trustBoxDesc}
            </p>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#0a1122] sm:text-lg">
                {step === 1 ? t.step1Title : t.step2Title}
              </h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">
                {t.stepBadgePrefix} {step} {t.stepBadgeOf}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="h-1.5 rounded-full bg-[#0b6954]" />
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step === 2 ? "bg-[#0b6954]" : "bg-gray-200"
                }`}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3.5 text-start text-xs font-bold text-red-800">
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4 text-start">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                  {t.developerLabel}
                </label>
                <input
                  type="text"
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  placeholder={t.developerPlaceholder}
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-bold focus:border-[#0b6954] focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                  {t.projectLabel}
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t.projectPlaceholder}
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-bold focus:border-[#0b6954] focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                  {t.contractPriceLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={contractPrice}
                    onChange={(e) =>
                      setContractPrice(formatNumberInput(e.target.value))
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-end text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2 text-xs font-bold text-gray-500">
                    {cur}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                  {t.paidAmountLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={paidAmount}
                    onChange={(e) =>
                      setPaidAmount(formatNumberInput(e.target.value))
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-end text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2 text-xs font-bold text-gray-500">
                    {cur}
                  </span>
                </div>
              </div>

              <TurnstileBox />

              <button
                type="button"
                onClick={handleNextStep}
                className="h-12 w-full rounded-xl bg-[#0a1122] text-sm font-extrabold text-white transition hover:bg-[#16223f]"
              >
                {t.continueBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-start">
              {loggedUser ? (
                <div className="rounded-2xl border border-[#0b6954]/30 bg-[#eaf8f2] p-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#0b6954]">
                    <CheckCircle2 className="size-4" />
                    <span>{loggedUser.name}</span>
                  </div>
                  <p
                    dir="ltr"
                    className="mt-1 text-start font-mono text-xs text-gray-600"
                  >
                    {loggedUser.phone} · {loggedUser.email}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                      {t.phoneLabel}
                    </label>
                    <div className="flex items-center gap-2" dir="ltr">
                      <CountrySelector
                        value={phoneCode}
                        onChange={(code, iso) => {
                          setPhoneCode(code)
                          if (iso) setCountryIso(iso)
                        }}
                      />
                      <input
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="5xx xx xx xx"
                        className="h-12 flex-1 rounded-xl border border-gray-200 px-3.5 text-left text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {t.phoneHint}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                      {t.emailLabel}
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-left text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      {t.emailHint}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold text-[#0a1122]">
                      {t.passwordLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-left text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-[#0a1122]"
                      >
                        {showPass ? (
                          <EyeOff className="size-4 text-gray-500" />
                        ) : (
                          <span>{t.showWord}</span>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {t.passwordHint}
                    </p>
                  </div>
                </>
              )}

              <p className="text-[11px] leading-relaxed text-gray-500">
                {t.accountConsentNote}
              </p>

              <p className="text-[11px] text-gray-400">{t.ownerPledgeNote}</p>

              <TurnstileBox />

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6954] text-sm font-extrabold text-white transition hover:bg-[#085443] disabled:opacity-60"
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  <span>{t.submitReviewBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-12 rounded-xl border border-gray-200 bg-white px-5 text-xs font-extrabold text-[#0a1122] hover:bg-gray-50"
                >
                  {t.backBtn}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 rounded-[22px] bg-[#0a1122] p-5 text-center text-white shadow-md">
          <p className="text-xs font-bold text-gray-300">
            {t.whatsappBannerTitle}
          </p>
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-xs font-extrabold text-white transition hover:opacity-95 sm:text-sm"
          >
            <MessageCircle className="size-4" />
            <span>{t.whatsappBannerBtn}</span>
          </a>
        </div>
      </div>
    </div>
  )
}