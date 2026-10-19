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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateAdminProfileDataAction, changeAdminPasswordAction } from "../actions"

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
  const [pending, startTransition] = useTransition()
  
  // حالات الـ Modals
  const [authModal, setAuthModal] = useState<{ formData: FormData } | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  
  // إشعارات
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null)

  // 1. معالجة تعديل البيانات الأساسية (تطلب باسورد قبل الحفظ)
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
    
    // دمج الباسورد مع بيانات البروفايل
    authModal.formData.set("currentPassword", currentPassword)

    startTransition(async () => {
      try {
        const res = await updateAdminProfileDataAction(authModal.formData)
        if (res.success) {
          setNotice({ text: res.message || "تم تحديث بيانات حسابك الإداري بنجاح." })
          setAuthModal(null)
          router.refresh()
        } else {
          setNotice({ text: res.error || "كلمة المرور غير صحيحة أو تعذر التحديث.", isError: true })
        }
      } catch {
        setNotice({ text: "حدث خطأ غير متوقع.", isError: true })
      }
    })
  }

  // 2. معالجة تغيير الباسورد المستقل
  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNotice(null)
    const fd = new FormData(e.currentTarget)
    
    const newPassword = fd.get("newPassword") as string
    const confirmPassword = fd.get("confirmNewPassword") as string
    
    if (newPassword !== confirmPassword) {
      setNotice({ text: "كلمتا المرور الجديدتان غير متطابقتين.", isError: true })
      return
    }

    startTransition(async () => {
      try {
        const res = await changeAdminPasswordAction(fd)
        if (res.success) {
          setNotice({ text: "تم تغيير كلمة المرور بنجاح. حسابك الآن في أمان." })
          setPasswordModalOpen(false)
          router.refresh()
        } else {
          setNotice({ text: res.error || "كلمة المرور الحالية غير صحيحة.", isError: true })
        }
      } catch {
        setNotice({ text: "حدث خطأ غير متوقع.", isError: true })
      }
    })
  }

  return (
    <div className="pb-10">
      {/* الهيدر */}
      <div className="mb-6">
        <p className="text-xs font-extrabold text-[#105C50]">الملف الشخصي</p>
        <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
          حسابي الإداري
        </h2>
        <p className="mt-1.5 text-xs text-gray-500 sm:text-sm">
          إدارة بياناتك الشخصية وحماية حسابك.
        </p>
      </div>

      {/* الإشعارات */}
      {notice && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold shadow-sm sm:items-center ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex flex-1 items-center gap-2.5">
            {notice.isError ? (
              <AlertTriangle className="size-5 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            )}
            <span className="leading-relaxed">{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="rounded-lg p-1.5 opacity-70 hover:bg-black/5">
            <X className="size-4.5" />
          </button>
        </div>
      )}

      {/* الكارت الأول: البيانات الأساسية */}
      <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-6">
        <Card className="overflow-hidden rounded-3xl border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5 pt-6">
            <CardTitle className="flex items-center gap-2.5 text-lg font-extrabold">
              <UserCog className="size-5 text-[#105C50]" />
              <span>البيانات الأساسية</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              تعديل هذه البيانات يتطلب إدخال كلمة المرور الحالية للحفاظ على أمان حسابك.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#0a1122]">الاسم الكامل</label>
                <input
                  name="name"
                  required
                  defaultValue={adminProfile.name}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm font-bold transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0a1122]">رقم الموبايل</label>
                <input
                  name="phone"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.phone}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-sm font-bold transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-[#0a1122]">البريد الإلكتروني</label>
                  {adminProfile.is_verified === false ? (
                    <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                      <MailWarning className="size-3.5" />
                      غير موثق (يرجى مراجعة بريدك)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      <MailCheck className="size-3.5" />
                      موثق
                    </span>
                  )}
                </div>
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.email}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-sm font-bold transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
                />
                <p className="mt-2 text-xs text-gray-500">
                  إذا قمت بتغيير البريد الإلكتروني، سيتم إرسال رابط تأكيد جديد إليه.
                </p>
              </div>
            </div>

            {(adminProfile.personalSellCount > 0 || adminProfile.personalBuyCount > 0) && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-extrabold text-red-900">
                      تنظيف حساب الإدارة (Danger Zone)
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-red-800">
                      يوجد لديك ({adminProfile.personalSellCount} طلب بيع و {adminProfile.personalBuyCount} طلب شراء) مسجلين على حسابك الإداري للتجربة. حدد الخيار أدناه لحذفها نهائياً لتجنب اختلاط البيانات.
                    </p>
                    <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm font-bold text-red-700 transition hover:text-red-900">
                      <input type="checkbox" name="clearAdminRequests" value="1" className="size-4.5 accent-red-600 rounded" />
                      <span>نعم، احذف طلبات التجربة من حسابي</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 border-t border-gray-100 pt-6 text-left">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#105C50] px-8 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0c483f] sm:w-auto"
              >
                <Save className="ml-2 size-4.5" />
                حفظ البيانات الأساسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* الكارت الثاني: الأمان وكلمة المرور (مفصول تماماً) */}
      <Card className="mt-6 overflow-hidden rounded-3xl border-gray-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-5 pt-6">
          <CardTitle className="flex items-center gap-2.5 text-lg font-extrabold">
            <ShieldCheck className="size-5 text-[#105C50]" />
            <span>الأمان وكلمة المرور</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            إدارة كلمة المرور الخاصة بحسابك لحماية لوحة الإدارة.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-[#0a1122]">كلمة المرور</p>
            <p className="mt-1 text-xs text-gray-500">تم تعيين كلمة مرور قوية لحسابك.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setNotice(null); setPasswordModalOpen(true) }}
            className="h-12 w-full rounded-xl border-gray-200 text-sm font-bold text-[#0a1122] hover:bg-gray-50 sm:w-auto"
          >
            <KeyRound className="ml-2 size-4.5 text-gray-500" />
            تغيير كلمة المرور
          </Button>
        </CardContent>
      </Card>

      {/* ==================== Modal 1: تأكيد الهوية قبل حفظ البيانات ==================== */}
      <Dialog open={Boolean(authModal)} onOpenChange={(open) => { if (!open && !pending) setAuthModal(null) }}>
        <DialogContent dir="rtl" className="w-[92vw] max-w-[400px] gap-0 overflow-hidden rounded-[24px] p-0 shadow-2xl">
          <div className="bg-gray-50/80 px-6 py-5 text-right border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-[#0a1122]">
              <Lock className="size-5 text-[#105C50]" />
              مصادقة أمنية
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              يرجى إدخال كلمة المرور الحالية لتأكيد حفظ التعديلات على حسابك.
            </DialogDescription>
          </div>

          <form onSubmit={executeProfileSave} className="flex flex-col gap-5 bg-white p-6">
            <div>
              <input
                name="verifyPassword"
                type="password"
                dir="ltr"
                required
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-base tracking-[0.2em] transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
              />
            </div>
            <DialogFooter className="flex flex-row gap-3">
              <Button type="submit" disabled={pending} className="h-12 flex-1 rounded-xl bg-[#105C50] text-sm font-bold text-white hover:bg-[#0c483f]">
                {pending ? <Loader2 className="size-5 animate-spin" /> : "تأكيد الحفظ"}
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setAuthModal(null)} className="h-12 flex-1 rounded-xl text-sm font-bold hover:bg-gray-50">
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== Modal 2: تغيير كلمة المرور ==================== */}
      <Dialog open={passwordModalOpen} onOpenChange={(open) => { if (!open && !pending) setPasswordModalOpen(false) }}>
        <DialogContent dir="rtl" className="w-[92vw] max-w-[420px] gap-0 overflow-hidden rounded-[24px] p-0 shadow-2xl">
          <div className="bg-gray-50/80 px-6 py-5 text-right border-b border-gray-100 flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-[#0a1122]">
                <KeyRound className="size-5 text-[#105C50]" />
                تغيير كلمة المرور
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-xs text-gray-500">
                اختر كلمة مرور قوية لحماية حسابك.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5 bg-white p-6">
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-gray-500 transition hover:bg-gray-100 hover:text-[#0a1122]"
              >
                {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                <span>{showPasswords ? "إخفاء" : "إظهار"} الحروف</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-600">كلمة المرور الحالية</label>
                <input
                  name="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-sm tracking-widest transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">كلمة المرور الجديدة</label>
                <input
                  name="newPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-sm tracking-widest transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-bold text-[#0a1122]">تأكيد كلمة المرور الجديدة</label>
                <input
                  name="confirmNewPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  minLength={8}
                  placeholder="أعد إدخال كلمة المرور"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-sm tracking-widest transition-colors focus:border-[#105C50] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#105C50]"
                />
              </div>
            </div>

            <DialogFooter className="mt-2 flex flex-row gap-3">
              <Button type="submit" disabled={pending} className="h-12 flex-1 rounded-xl bg-[#0a1122] text-sm font-bold text-white hover:bg-[#16223f]">
                {pending ? <Loader2 className="size-5 animate-spin" /> : "تحديث كلمة المرور"}
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setPasswordModalOpen(false)} className="h-12 flex-1 rounded-xl text-sm font-bold hover:bg-gray-50">
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}