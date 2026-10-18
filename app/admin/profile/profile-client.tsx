"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Save,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateAdminProfileAction } from "../actions"

type AdminProfile = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  personalSellCount: number
  personalBuyCount: number
}

export default function ProfileClient({
  adminProfile,
}: {
  adminProfile: AdminProfile
}) {
  const router = useRouter()
  const [confirmModal, setConfirmModal] = useState<{
    formData: FormData
  } | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setConfirmModal({ formData: fd })
  }

  function executeConfirmedSave() {
    if (!confirmModal) return
    setNotice(null)

    startTransition(async () => {
      try {
        const res = await updateAdminProfileAction(confirmModal.formData)
        if (res.success) {
          setNotice({
            text: "تم تحديث بيانات حسابك الإداري بنجاح.",
          })
          router.refresh()
        } else {
          setNotice({
            text: res.error || "تعذر تحديث البروفايل.",
            isError: true,
          })
        }
      } finally {
        setConfirmModal(null)
      }
    })
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-extrabold text-[#105C50]">
          الملف الشخصي
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
          حسابي الإداري
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          عدّل بياناتك الشخصية كمدير للنظام وكلمة المرور الخاصة بك.
        </p>
      </div>

      {notice && (
        <div
          className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-bold shadow-xs sm:p-4 sm:text-sm ${
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

      <form onSubmit={handleProfileSubmit} className="space-y-5">
        <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold">
              <UserCog className="size-4 text-[#105C50]" />
              <span>بيانات الحساب</span>
            </CardTitle>
            <CardDescription className="text-xs">
              قم بتحديث اسمك وبريدك ورقم هاتفك أو تغيير كلمة المرور.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5 text-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-bold text-[#0a1122]">
                  الاسم الكامل
                </label>
                <input
                  name="name"
                  required
                  defaultValue={adminProfile.name}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-[#0a1122]">
                  رقم الموبايل
                </label>
                <input
                  name="phone"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.phone}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-[#0a1122]">
                  البريد الإلكتروني
                </label>
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.email}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 font-bold text-[#0a1122]">
                  <Lock className="size-3.5 text-gray-400" />
                  <span>كلمة مرور جديدة (اختياري)</span>
                </label>
                <input
                  name="newPassword"
                  type="password"
                  dir="ltr"
                  minLength={8}
                  placeholder="اتركها فارغة إذا لا تريد تغييرها"
                  className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs focus:border-[#105C50] focus:outline-none"
                />
              </div>
            </div>

            {(adminProfile.personalSellCount > 0 ||
              adminProfile.personalBuyCount > 0) && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-extrabold text-amber-900">
                  تنبيه: يوجد لديك ({adminProfile.personalSellCount} طلب بيع و{" "}
                  {adminProfile.personalBuyCount} طلب شراء) مسجلين على حساب الأدمن
                  الشخصي!
                </p>
                <p className="mt-1 text-[11px] text-amber-800">
                  بما أنك مدير النظام، يفضل فصل حساب الإدارة عن طلبات العملاء
                  التجريبية. يمكنك تحديد الخيار أدناه لمسح طلبات البيع/الشراء
                  التجريبية المرتبطة بحسابك الإداري.
                </p>
                <label className="mt-2.5 flex cursor-pointer items-center gap-2 font-bold text-red-700">
                  <input
                    type="checkbox"
                    name="clearAdminRequests"
                    value="1"
                    className="size-4 accent-red-600"
                  />
                  <span>
                    نعم، احذف طلبات البيع والشراء التجريبية من حسابي الإداري
                  </span>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl bg-[#105C50] px-8 text-xs font-extrabold text-white shadow-sm hover:bg-[#0c483f] sm:w-auto"
          >
            <Save className="ml-2 size-4" />
            حفظ بيانات حسابي
          </Button>
        </div>
      </form>

      <Dialog
        open={Boolean(confirmModal)}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmModal(null)
        }}
      >
        <DialogContent
          dir="rtl"
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
        >
          {confirmModal && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  تأكيد تحديث بيانات الأدمن
                </DialogTitle>
                <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                  هل أنت متأكد من تحديث بيانات حسابك الإداري؟
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
                  إلغاء
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
                      جاري الحفظ...
                    </span>
                  ) : (
                    "نعم، تأكيد الحفظ"
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