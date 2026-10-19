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
    // فتح نافذة المصادقة (إدخال الباسورد) قبل الحفظ الفعلي
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
          setNotice({ text: "تم تغيير كلمة المرور بنجاح. أصبحت في أمان الآن." })
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
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">الملف الشخصي</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
            حسابي الإداري
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            إدارة بياناتك الشخصية وحماية حسابك.
          </p>
        </div>
        
        {/* زر تغيير الباسورد المنفصل */}
        <Button
          onClick={() => { setNotice(null); setPasswordModalOpen(true) }}
          className="h-10 rounded-xl bg-[#0a1122] px-4 text-xs font-bold text-white hover:bg-[#16223f]"
        >
          <KeyRound className="ml-1.5 size-4" />
          تغيير كلمة المرور
        </Button>
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
          <button onClick={() => setNotice(null)} className="rounded-lg p-1 opacity-70 hover:bg-black/5">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* الفورم الأساسي للبيانات */}
      <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-5">
        <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base font-extrabold">
              <UserCog className="size-4 text-[#105C50]" />
              <span>البيانات الأساسية</span>
            </CardTitle>
            <CardDescription className="text-xs">
              تعديل هذه البيانات يتطلب إدخال كلمة المرور الحالية للحفاظ على أمان حسابك.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5 text-xs">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-bold text-[#0a1122]">الاسم الكامل</label>
                <input
                  name="name"
                  required
                  defaultValue={adminProfile.name}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-[#0a1122]">رقم الموبايل</label>
                <input
                  name="phone"
                  dir="ltr"
                  required
                  defaultValue={adminProfile.phone}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="font-bold text-[#0a1122]">البريد الإلكتروني</label>
                  {adminProfile.is_verified === false ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <MailWarning className="size-3" />
                      غير موثق (يرجى مراجعة بريدك)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <MailCheck className="size-3" />
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
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                />
                <p className="mt-1.5 text-[10px] text-gray-400">
                  إذا قمت بتغيير البريد الإلكتروني، سيتم إرسال رابط تأكيد جديد إليه.
                </p>
              </div>
            </div>

            {(adminProfile.personalSellCount > 0 || adminProfile.personalBuyCount > 0) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
                  <div>
                    <p className="font-extrabold text-red-900">
                      تنظيف حساب الإدارة (Danger Zone)
                    </p>
                    <p className="mt-1 text-[11px] text-red-800">
                      يوجد لديك ({adminProfile.personalSellCount} طلب بيع و {adminProfile.personalBuyCount} طلب شراء) مسجلين على حسابك الإداري للتجربة. حدد هذا الخيار لحذفها نهائياً.
                    </p>
                    <label className="mt-3 flex cursor-pointer items-center gap-2 font-bold text-red-700">
                      <input type="checkbox" name="clearAdminRequests" value="1" className="size-4 accent-red-600" />
                      <span>نعم، احذف طلبات التجربة من حسابي</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-[#105C50] px-8 text-xs font-extrabold text-white shadow-sm hover:bg-[#0c483f] sm:w-auto"
          >
            <Save className="ml-2 size-4" />
            حفظ البيانات الأساسية
          </Button>
        </div>
      </form>

      {/* ==================== Modal 1: تأكيد الهوية قبل حفظ البيانات ==================== */}
      <Dialog open={Boolean(authModal)} onOpenChange={(open) => { if (!open && !pending) setAuthModal(null) }}>
        <DialogContent dir="rtl" className="w-[90vw] max-w-sm rounded-2xl p-6">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-[#0a1122]">
              <Lock className="size-4 text-[#105C50]" />
              مصادقة أمنية
            </DialogTitle>
            <DialogDescription className="mt-2 text-xs leading-relaxed text-gray-600">
              لتأكيد حفظ التعديلات على بياناتك الشخصية (الاسم، الهاتف، الإيميل)، يرجى إدخال كلمة المرور الحالية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={executeProfileSave} className="mt-4 flex flex-col gap-4">
            <div>
              <input
                name="verifyPassword"
                type="password"
                dir="ltr"
                required
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-left text-sm tracking-widest focus:border-[#105C50] focus:outline-none"
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-start">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setAuthModal(null)} className="h-10 flex-1 rounded-xl text-xs font-bold sm:flex-none">
                إلغاء
              </Button>
              <Button type="submit" disabled={pending} className="h-10 flex-1 rounded-xl bg-[#105C50] text-xs font-bold text-white hover:bg-[#0c483f] sm:flex-none">
                {pending ? <Loader2 className="size-4 animate-spin" /> : "تأكيد وحفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== Modal 2: تغيير كلمة المرور ==================== */}
      <Dialog open={passwordModalOpen} onOpenChange={(open) => { if (!open && !pending) setPasswordModalOpen(false) }}>
        <DialogContent dir="rtl" className="w-[90vw] max-w-md rounded-2xl p-6">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-[#0a1122]">
              <KeyRound className="size-4 text-[#105C50]" />
              تغيير كلمة المرور
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs text-gray-500">
              قم بإدخال كلمة المرور الحالية ثم اختر كلمة مرور جديدة قوية.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="mt-2 flex flex-col gap-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-[#0a1122]"
              >
                {showPasswords ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>{showPasswords ? "إخفاء" : "إظهار"} الحروف</span>
              </button>
            </div>
            
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-gray-600">كلمة المرور الحالية</label>
              <input
                name="currentPassword"
                type={showPasswords ? "text" : "password"}
                dir="ltr"
                required
                className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-left text-sm focus:border-[#105C50] focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#0a1122]">الجديدة</label>
                <input
                  name="newPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  minLength={8}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-left text-sm focus:border-[#105C50] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#0a1122]">تأكيد الجديدة</label>
                <input
                  name="confirmNewPassword"
                  type={showPasswords ? "text" : "password"}
                  dir="ltr"
                  required
                  minLength={8}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-left text-sm focus:border-[#105C50] focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:justify-start">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setPasswordModalOpen(false)} className="h-10 flex-1 rounded-xl text-xs font-bold sm:flex-none">
                إلغاء
              </Button>
              <Button type="submit" disabled={pending} className="h-10 flex-1 rounded-xl bg-[#0a1122] text-xs font-bold text-white hover:bg-[#16223f] sm:flex-none">
                {pending ? <Loader2 className="size-4 animate-spin" /> : "تحديث الباسورد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}