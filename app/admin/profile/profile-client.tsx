"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MailCheck,
  MailWarning,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCog,
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
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n"
import {
  changeAdminPasswordAction,
  updateAdminProfileDataAction,
} from "../../../actions/admin-actions"

type AdminProfile = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  is_verified?: boolean
  personalSellCount: number
  personalBuyCount: number
}

export default function ProfileClient({
  adminProfile,
}: {
  adminProfile: AdminProfile
}) {
  const router = useRouter()
  const { t: dict, dir } = useTranslation()
  const t = dict.admin.profile

  const [pending, startTransition] = useTransition()
  const [authModal, setAuthModal] = useState<{ formData: FormData } | null>(
    null
  )
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setAuthModal({ formData: fd })
  }

  function executeProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!authModal) return
    setNotice(null)

    const authFd = new FormData(e.currentTarget)
    const currentPassword = authFd.get("verifyPassword") as string
    authModal.formData.set("currentPassword", currentPassword)

    startTransition(async () => {
      try {
        const res = await updateAdminProfileDataAction(authModal.formData)
        if (res.success) {
          setNotice({ text: res.message || t.profileUpdatedSuccess })
          setAuthModal(null)
          router.refresh()
        } else {
          setNotice({
            text: res.error || t.profileUpdateError,
            isError: true,
          })
        }
      } catch {
        setNotice({ text: t.unexpectedError, isError: true })
      }
    })
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNotice(null)
    const fd = new FormData(e.currentTarget)

    const newPassword = fd.get("newPassword") as string
    const confirmPassword = fd.get("confirmNewPassword") as string

    if (newPassword !== confirmPassword) {
      setNotice({ text: t.mismatchError, isError: true })
      return
    }

    startTransition(async () => {
      try {
        const res = await changeAdminPasswordAction(fd)
        if (res.success) {
          setNotice({ text: t.passUpdatedSuccess })
          setPasswordModalOpen(false)
          router.refresh()
        } else {
          setNotice({ text: res.error || t.passUpdateError, isError: true })
        }
      } catch {
        setNotice({ text: t.unexpectedError, isError: true })
      }
    })
  }

  return (
    <div dir={dir} className="pb-10 text-start">
      <div className="mb-4 rounded-xl border border-gray-200/85 bg-white p-4 shadow-2xs">
        <p className="text-[11px] font-extrabold text-[#105C50]">{t.eyebrow}</p>
        <h2 className="mt-0.5 text-base font-extrabold text-[#0a1122] sm:text-lg">
          {t.title}
        </h2>
        <p className="mt-0.5 text-[11px] text-gray-500">{t.subtitle}</p>
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
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 opacity-70 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <form
        id="profile-form"
        onSubmit={handleProfileSubmit}
        className="space-y-4"
      >
        <Card className="overflow-hidden rounded-xl border-gray-200/80 bg-white shadow-2xs">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
              <UserCog className="size-4 text-[#105C50]" />
              <span>{t.basicCardTitle}</span>
            </CardTitle>
            <CardDescription className="text-[11px]">
              {t.basicCardDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                  {t.fullNameLabel}
                </label>
                <input
                  name="name"
                  required
                  defaultValue={adminProfile.name}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-bold focus:border-[#105C50] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                  {t.phoneLabel}
                </label>
                <input
                  name="phone"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.phone}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0a1122]">
                    {t.emailLabel}
                  </label>
                  {adminProfile.is_verified === false ? (
                    <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <MailWarning className="size-3" />
                      {t.unverifiedBadge}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <MailCheck className="size-3" />
                      {t.verifiedBadge}
                    </span>
                  )}
                </div>
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.email}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:bg-white focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {t.emailChangeHint}
                </p>
              </div>
            </div>

            {(adminProfile.personalSellCount > 0 ||
              adminProfile.personalBuyCount > 0) && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
                  <div>
                    <p className="text-xs font-extrabold text-red-900">
                      {t.dangerZoneTitle}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-red-800">
                      {t.dangerZoneDesc1} ({adminProfile.personalSellCount}{" "}
                      {t.dangerZoneSellWord} {adminProfile.personalBuyCount}{" "}
                      {t.dangerZoneBuyWord}
                    </p>
                    <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-xs font-bold text-red-700">
                      <input
                        type="checkbox"
                        name="clearAdminRequests"
                        value="1"
                        className="size-4 rounded accent-red-600"
                      />
                      <span>{t.dangerZoneCheckbox}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-gray-100 pt-4 text-end">
              <Button
                type="submit"
                className="h-10 w-full rounded-xl bg-[#105C50] px-6 text-xs font-bold text-white shadow-2xs hover:bg-[#0c483f] sm:w-auto"
              >
                <Save className="me-1.5 size-4" />
                {t.saveBasicBtn}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="mt-4 overflow-hidden rounded-xl border-gray-200/80 bg-white shadow-2xs">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
            <ShieldCheck className="size-4 text-[#105C50]" />
            <span>{t.securityCardTitle}</span>
          </CardTitle>
          <CardDescription className="text-[11px]">
            {t.securityCardDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold text-[#0a1122]">
              {t.passwordLabel}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">{t.passwordSub}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setNotice(null)
              setPasswordModalOpen(true)
            }}
            className="h-9 w-full rounded-xl border-gray-200 text-xs font-bold text-[#0a1122] hover:bg-gray-50 sm:w-auto"
          >
            <KeyRound className="me-1.5 size-3.5 text-gray-500" />
            {t.changePasswordBtn}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(authModal)}
        onOpenChange={(open) => {
          if (!open && !pending) setAuthModal(null)
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[92vw] max-w-[380px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl"
        >
          <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 text-start">
            <DialogTitle className="flex items-center gap-2 text-sm font-extrabold text-[#0a1122]">
              <Lock className="size-4 text-[#105C50]" />
              {t.authModalTitle}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed text-gray-600">
              {t.authModalDesc}
            </DialogDescription>
          </div>

          <form
            onSubmit={executeProfileSave}
            className="flex flex-col gap-4 bg-white p-5"
          >
            <input
              name="verifyPassword"
              type="password"
              dir="ltr"
              required
              placeholder="••••••••"
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-left text-sm tracking-[0.2em] focus:border-[#105C50] focus:bg-white focus:outline-none"
            />
            <DialogFooter className="flex flex-row gap-2">
              <Button
                type="submit"
                disabled={pending}
                className="h-9 flex-1 rounded-xl bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f]"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t.confirmSaveBtn
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setAuthModal(null)}
                className="h-9 flex-1 rounded-xl text-xs font-bold"
              >
                {t.cancelBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordModalOpen}
        onOpenChange={(open) => {
          if (!open && !pending) setPasswordModalOpen(false)
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[92vw] max-w-[400px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl"
        >
          <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 text-start">
            <DialogTitle className="flex items-center gap-2 text-sm font-extrabold text-[#0a1122]">
              <KeyRound className="size-4 text-[#105C50]" />
              {t.passModalTitle}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-gray-500">
              {t.passModalDesc}
            </DialogDescription>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="flex flex-col gap-4 bg-white p-5"
          >
            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100"
              >
                {showPasswords ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                <span>{showPasswords ? t.hideChars : t.showChars}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">
                  {t.currentPassLabel}
                </label>
                <input
                  name="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-left text-xs tracking-widest focus:border-[#105C50] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#0a1122]">
                  {t.newPassLabel}
                </label>
                <input
                  name="newPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  minLength={8}
                  placeholder={t.newPassPlaceholder}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-left text-xs tracking-widest focus:border-[#105C50] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#0a1122]">
                  {t.confirmPassLabel}
                </label>
                <input
                  name="confirmNewPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  minLength={8}
                  placeholder={t.confirmPassPlaceholder}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 text-left text-xs tracking-widest focus:border-[#105C50] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-1 flex flex-row gap-2">
              <Button
                type="submit"
                disabled={pending}
                className="h-9 flex-1 rounded-xl bg-[#0a1122] text-xs font-bold text-white hover:bg-[#16223f]"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t.updatePassBtn
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setPasswordModalOpen(false)}
                className="h-9 flex-1 rounded-xl text-xs font-bold"
              >
                {t.cancelBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
