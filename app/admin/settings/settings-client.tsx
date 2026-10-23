"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Mail,
  Power,
  Save,
  ShieldCheck,
  Smartphone,
  Star,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n"
import { saveSiteSettingsAction } from "../actions"

type SiteSettings = {
  siteName: string
  whatsappNumber: string
  supportEmail: string
  buyerCommission: string
  promo7Price?: string
  promo14Price?: string
  promo30Price?: string
  promo_RU_7?: string
  promo_RU_14?: string
  promo_RU_30?: string
  promo_GE_7?: string
  promo_GE_14?: string
  promo_GE_30?: string
  promo_AE_7?: string
  promo_AE_14?: string
  promo_AE_30?: string
  maintenanceMode: boolean
  allowNewSells: boolean
  allowNewBuys: boolean
  emailNotifications: boolean
}

export default function SettingsClient({
  initialTab,
  initialSettings,
  hasSupabase,
  hasEmail,
}: {
  initialTab: "general" | "system"
  initialSettings: SiteSettings
  hasSupabase: boolean
  hasEmail: boolean
}) {
  const router = useRouter()
  const { t: dict, dir } = useTranslation()
  const t = dict.admin.settings

  const pricingCountries = [
    { code: "EG" as const, name: t.countries.EG, flag: "🇪🇬" },
    { code: "RU" as const, name: t.countries.RU, flag: "🇷🇺" },
    { code: "GE" as const, name: t.countries.GE, flag: "🇬🇪" },
    { code: "AE" as const, name: t.countries.AE, flag: "🇦🇪" },
  ]

  const [activeTab, setActiveTab] = useState<"general" | "system">(initialTab)
  const [selectedPricingCountry, setSelectedPricingCountry] = useState<
    "EG" | "RU" | "GE" | "AE"
  >("EG")

  const [maintenanceMode, setMaintenanceMode] = useState(
    initialSettings.maintenanceMode
  )
  const [allowNewSells, setAllowNewSells] = useState(
    initialSettings.allowNewSells
  )
  const [allowNewBuys, setAllowNewBuys] = useState(initialSettings.allowNewBuys)
  const [emailNotifications, setEmailNotifications] = useState(
    initialSettings.emailNotifications
  )

  const [confirmModal, setConfirmModal] = useState<{
    formData: FormData
  } | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setConfirmModal({ formData: fd })
  }

  function executeConfirmedSave() {
    if (!confirmModal) return
    setNotice(null)

    startTransition(async () => {
      try {
        const res = await saveSiteSettingsAction(confirmModal.formData)
        if (res.success) {
          window.dispatchEvent(new Event("site-settings-changed"))
          setNotice({ text: t.savedSuccess })
          router.refresh()
        } else {
          setNotice({ text: res.error || t.savedError, isError: true })
        }
      } finally {
        setConfirmModal(null)
      }
    })
  }

  return (
    <div dir={dir} className="text-start">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/85 bg-white p-4 shadow-2xs">
        <div>
          <p className="text-[11px] font-extrabold text-[#105C50]">
            {t.eyebrow}
          </p>
          <h2 className="mt-0.5 text-base font-extrabold text-[#0a1122] sm:text-lg">
            {t.title}
          </h2>
          <p className="mt-0.5 text-[11px] text-gray-500">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "general"
                ? "bg-[#105C50] text-white shadow-2xs"
                : "text-gray-600 hover:bg-white"
            }`}
          >
            <Globe className="size-3.5 shrink-0" />
            <span>{t.tabGeneral}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "system"
                ? "bg-[#105C50] text-white shadow-2xs"
                : "text-gray-600 hover:bg-white"
            }`}
          >
            <Database className="size-3.5 shrink-0" />
            <span>{t.tabSystem}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xs ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 opacity-70 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {activeTab === "general" && (
        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
              <CardHeader className="border-b border-gray-100 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                  <Smartphone className="size-4 text-[#105C50]" />
                  <span>{t.contactCardTitle}</span>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {t.contactCardDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 p-5 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-[#0a1122]">
                    {t.siteNameLabel}
                  </label>
                  <input
                    name="siteName"
                    defaultValue={initialSettings.siteName}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#0a1122]">
                    {t.whatsappLabel}
                  </label>
                  <input
                    name="whatsappNumber"
                    dir="ltr"
                    defaultValue={initialSettings.whatsappNumber}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#0a1122]">
                    {t.supportEmailLabel}
                  </label>
                  <input
                    name="supportEmail"
                    type="email"
                    dir="ltr"
                    defaultValue={initialSettings.supportEmail}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#0a1122]">
                    {t.commissionLabel}
                  </label>
                  <input
                    name="buyerCommission"
                    type="number"
                    step="0.05"
                    defaultValue={initialSettings.buyerCommission}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-[#0a1122]">
                    <Star className="size-3.5 fill-amber-400 text-amber-500" />
                    <span>{t.promoPricesTitle}</span>
                  </div>

                  <div className="mb-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {pricingCountries.map((c) => {
                      const active = selectedPricingCountry === c.code
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSelectedPricingCountry(c.code)}
                          className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-bold transition ${
                            active
                              ? "border-[#105C50] bg-[#105C50] text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div
                    className={
                      selectedPricingCountry === "EG" ? "block" : "hidden"
                    }
                  >
                    <p className="mb-1.5 text-[11px] font-bold text-[#105C50]">
                      {t.egPackagesTitle}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days7}
                        </label>
                        <input
                          name="promo7Price"
                          type="number"
                          defaultValue={initialSettings.promo7Price || "1199"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days14}
                        </label>
                        <input
                          name="promo14Price"
                          type="number"
                          defaultValue={initialSettings.promo14Price || "1999"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days30}
                        </label>
                        <input
                          name="promo30Price"
                          type="number"
                          defaultValue={initialSettings.promo30Price || "2799"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      selectedPricingCountry === "RU" ? "block" : "hidden"
                    }
                  >
                    <p className="mb-1.5 text-[11px] font-bold text-[#105C50]">
                      {t.ruPackagesTitle}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days7}
                        </label>
                        <input
                          name="promo_RU_7"
                          type="number"
                          defaultValue={initialSettings.promo_RU_7 || "2500"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days14}
                        </label>
                        <input
                          name="promo_RU_14"
                          type="number"
                          defaultValue={initialSettings.promo_RU_14 || "4200"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days30}
                        </label>
                        <input
                          name="promo_RU_30"
                          type="number"
                          defaultValue={initialSettings.promo_RU_30 || "5900"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      selectedPricingCountry === "GE" ? "block" : "hidden"
                    }
                  >
                    <p className="mb-1.5 text-[11px] font-bold text-[#105C50]">
                      {t.gePackagesTitle}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days7}
                        </label>
                        <input
                          name="promo_GE_7"
                          type="number"
                          defaultValue={initialSettings.promo_GE_7 || "29"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days14}
                        </label>
                        <input
                          name="promo_GE_14"
                          type="number"
                          defaultValue={initialSettings.promo_GE_14 || "49"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days30}
                        </label>
                        <input
                          name="promo_GE_30"
                          type="number"
                          defaultValue={initialSettings.promo_GE_30 || "69"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      selectedPricingCountry === "AE" ? "block" : "hidden"
                    }
                  >
                    <p className="mb-1.5 text-[11px] font-bold text-[#105C50]">
                      {t.aePackagesTitle}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days7}
                        </label>
                        <input
                          name="promo_AE_7"
                          type="number"
                          defaultValue={initialSettings.promo_AE_7 || "99"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days14}
                        </label>
                        <input
                          name="promo_AE_14"
                          type="number"
                          defaultValue={initialSettings.promo_AE_14 || "179"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-gray-600">
                          {t.days30}
                        </label>
                        <input
                          name="promo_AE_30"
                          type="number"
                          defaultValue={initialSettings.promo_AE_30 || "249"}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
              <CardHeader className="border-b border-gray-100 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                  <Power className="size-4 text-[#105C50]" />
                  <span>{t.statusCardTitle}</span>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {t.statusCardDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-xs">
                <label
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition ${
                    maintenanceMode
                      ? "border-red-300 bg-red-50/70"
                      : "border-gray-200 bg-gray-50/60"
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      {t.maintenanceTitle}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {t.maintenanceDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="mt-1 size-4 accent-red-600"
                  />
                </label>

                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      {t.allowSellsTitle}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {t.allowSellsDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowNewSells"
                    checked={allowNewSells}
                    onChange={(e) => setAllowNewSells(e.target.checked)}
                    className="mt-1 size-4 accent-[#105C50]"
                  />
                </label>

                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      {t.allowBuysTitle}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {t.allowBuysDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowNewBuys"
                    checked={allowNewBuys}
                    onChange={(e) => setAllowNewBuys(e.target.checked)}
                    className="mt-1 size-4 accent-[#105C50]"
                  />
                </label>

                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      {t.emailNotifsTitle}
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {t.emailNotifsDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="mt-1 size-4 accent-[#105C50]"
                  />
                </label>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-xl bg-[#105C50] px-6 text-xs font-extrabold text-white shadow-2xs hover:bg-[#0c483f] sm:w-auto"
            >
              <Save className="me-1.5 size-4" />
              {t.saveBtn}
            </Button>
          </div>
        </form>
      )}

      {activeTab === "system" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
            <CardHeader className="border-b border-gray-100 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <Database className="size-4 text-[#105C50]" />
                <span>{t.envCardTitle}</span>
              </CardTitle>
              <CardDescription className="text-[11px]">
                {t.envCardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <div className="font-bold text-[#0a1122]">
                    {t.supabaseTitle}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {t.supabaseDesc}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    hasSupabase
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <CheckCircle2 className="size-3.5" />
                  {hasSupabase ? t.connected : t.disconnected}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <div className="font-bold text-[#0a1122]">{t.smtpTitle}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {t.smtpDesc}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    hasEmail
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <Mail className="size-3.5" />
                  {hasEmail ? t.smtpActive : t.smtpMissing}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
            <CardHeader className="border-b border-gray-100 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <ShieldCheck className="size-4 text-[#105C50]" />
                <span>{t.rolesCardTitle}</span>
              </CardTitle>
              <CardDescription className="text-[11px]">
                {t.rolesCardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-xs leading-relaxed text-gray-600">
              <div className="rounded-xl border border-gray-100 p-3">
                <strong className="text-[#0a1122]">{t.rule1Bold}</strong>{" "}
                {t.rule1Text}
              </div>
              <div className="pt-1">
                <Link
                  href="/admin/users"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0a1122] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]"
                >
                  {t.manageAdminsBtn}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={Boolean(confirmModal)}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmModal(null)
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[390px]"
        >
          {confirmModal && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="text-sm font-extrabold text-[#0a1122]">
                  {t.modalTitle}
                </DialogTitle>
                <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                  {t.modalDesc}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmModal(null)}
                  className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
                >
                  {t.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={executeConfirmedSave}
                  className="h-9 flex-1 rounded-xl bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f] sm:flex-none"
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t.savingBtn}
                    </span>
                  ) : (
                    t.confirmSaveBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}