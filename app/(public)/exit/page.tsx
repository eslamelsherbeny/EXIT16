"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Check,
  CheckCircle2,
  EyeOff,
  Loader2,
  MessageCircle,
  User,
} from "lucide-react"
import { useTranslation, getCurrencySymbol } from "@/lib/i18n"
import { SUPPORTED_COUNTRIES, CountryFlag } from "@/components/site-shell"
import * as submitActions from "@/app/actions/submit-forms"
import * as authActions from "@/app/actions/auth-actions"

function formatNumberInput(val: string) {
  const digits = val.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("en-US")
}

export default function ExitReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t: dict, locale, country, dir } = useTranslation()
  const cur = getCurrencySymbol(country, locale)
  const countryCfg = SUPPORTED_COUNTRIES[country] || SUPPORTED_COUNTRIES.EG

  const t = (dict as Record<string, any>).exitReportPage
  const formActionsDict = (dict as Record<string, any>).serverActions?.forms
  const waPhone = String(dict.footer?.phone || "+201018595959").replace(
    /\D/g,
    ""
  )

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

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)

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

    if (!name.trim() || !phone.trim() || !email.trim() || password.length < 8) {
      setErrorMsg(t.errStep2)
      return
    }

    startTransition(async () => {
      try {
        const regFn =
          (authActions as any).registerAction ||
          (authActions as any).registerUserAction ||
          (authActions as any).signUpAction
        if (typeof regFn === "function") {
          const fd = new FormData()
          fd.set("name", name.trim())
          fd.set("phone", `${countryCfg.phoneCode}${phone.replace(/^0+/, "")}`)
          fd.set("email", email.trim())
          fd.set("password", password)
          fd.set("country", country)
          fd.set("role", "SELLER")
          await regFn(fd).catch(() => {})
        }

        const submitFn =
          (submitActions as any).submitSellRequestAction ||
          (submitActions as any).createSellRequestAction

        const formData = new FormData()
        formData.set("developer_name", developerName.trim())
        formData.set("project_name", projectName.trim())
        formData.set("contract_price", contractPrice.replace(/,/g, ""))
        formData.set("paid_amount", paidAmount.replace(/,/g, ""))
        formData.set("name", name.trim())
        formData.set(
          "phone",
          `${countryCfg.phoneCode}${phone.replace(/^0+/, "")}`
        )
        formData.set("email", email.trim())
        formData.set("password", password)
        formData.set("country_code", country)
        formData.set("submission_type", "exit_report")

        if (typeof submitFn === "function") {
          const res = await submitFn(formData)
          if (res?.error) {
            setErrorMsg(res.error)
            return
          }
        }

        router.push("/account")
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

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0b6954]">
                  <CheckCircle2 className="size-5 fill-[#0b6954] text-white" />
                  <span>{t.verifiedBadge}</span>
                </div>
              </div>

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
                <div className="flex gap-2" dir="ltr">
                  <div className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[#0a1122]">
                    <CountryFlag code={country} className="h-3.5 w-5" />
                    <span>{countryCfg.phoneCode}</span>
                  </div>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={
                      dict.publicPages?.contact?.phonePlaceholder || ""
                    }
                    className="h-12 flex-1 rounded-xl border border-gray-200 px-3.5 text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{t.phoneHint}</p>
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
                  className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-400">{t.emailHint}</p>
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
                    className="h-12 w-full rounded-xl border border-gray-200 px-3.5 text-sm font-bold focus:border-[#0b6954] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute top-1/2 start-3 -translate-y-1/2 text-xs font-bold text-[#0a1122]"
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

              <p className="text-[11px] leading-relaxed text-gray-500">
                {t.accountConsentNote}
              </p>

              <p className="text-[11px] text-gray-400">{t.ownerPledgeNote}</p>

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