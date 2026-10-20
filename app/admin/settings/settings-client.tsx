"use client"

import { useState, useTransition } from "react"
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
import { saveSiteSettingsAction } from "../actions"
import Link from "next/link"

type SiteSettings = {
  siteName: string
  whatsappNumber: string
  supportEmail: string
  buyerCommission: string
  maintenanceMode: boolean
  allowNewSells: boolean
  allowNewBuys: boolean
  emailNotifications: boolean
  promo7Price?: string
  promo14Price?: string
  promo30Price?: string
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
  const [activeTab, setActiveTab] = useState<"general" | "system">(initialTab)
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
          setNotice({
            text: "تم حفظ إعدادات الموقع وحالة التشغيل بنجاح.",
          })
          router.refresh()
        } else {
          setNotice({
            text: "تعذر حفظ الإعدادات.",
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
          التحكم المركزي
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
          إعدادات الموقع
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          تحكم في أرقام التواصل، نسبة العمولة، وضع الصيانة، وحالة النظام.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-xs sm:inline-flex">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "general"
              ? "bg-[#105C50] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Globe className="size-4 shrink-0" />
          <span>إعدادات الموقع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            activeTab === "system"
              ? "bg-[#105C50] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Database className="size-4 shrink-0" />
          <span>حالة السيرفر</span>
        </button>
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

      {activeTab === "general" && (
        <form onSubmit={handleSettingsSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                  <Smartphone className="size-4 text-[#105C50]" />
                  <span>بيانات التواصل والعمولة</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  تظهر هذه الأرقام للعملاء في أزرار واتساب وبطاقة مسؤول الحالة.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5 text-xs">
                <div>
                  <label className="mb-1.5 block font-bold text-[#0a1122]">
                    اسم المنصة
                  </label>
                  <input
                    name="siteName"
                    defaultValue={initialSettings.siteName}
                    className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-[#0a1122]">
                    رقم واتساب خدمة العملاء الرسمي
                  </label>
                  <input
                    name="whatsappNumber"
                    dir="ltr"
                    defaultValue={initialSettings.whatsappNumber}
                    placeholder="+201018595959"
                    className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-[#0a1122]">
                    البريد الإلكتروني الرسمي للدعم
                  </label>
                  <input
                    name="supportEmail"
                    type="email"
                    dir="ltr"
                    defaultValue={initialSettings.supportEmail}
                    className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-left text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-[#0a1122]">
                    نسبة عمولة المنصة على المشتري (%)
                  </label>
                  <input
                    name="buyerCommission"
                    type="number"
                    step="0.05"
                    defaultValue={initialSettings.buyerCommission}
                    className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                  />
                </div>

                {/* ==================== الكود المُضاف هنا ==================== */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="mb-2.5 text-xs font-extrabold text-[#105C50]">
                    ⭐ أسعار باقات تمييز الوحدات (تظهر في صفحة البائع):
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#0a1122]">
                        باقة 7 أيام
                      </label>
                      <input
                        name="promo7Price"
                        type="number"
                        defaultValue={(initialSettings as any).promo7Price || "1199"}
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#0a1122]">
                        باقة 14 يوم
                      </label>
                      <input
                        name="promo14Price"
                        type="number"
                        defaultValue={(initialSettings as any).promo14Price || "1999"}
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#0a1122]">
                        باقة 30 يوم
                      </label>
                      <input
                        name="promo30Price"
                        type="number"
                        defaultValue={(initialSettings as any).promo30Price || "2799"}
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                {/* ========================================================== */}
                
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                  <Power className="size-4 text-[#105C50]" />
                  <span>حالة تشغيل الموقع والتحكم</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  تحكم في فتح أو إغلاق الموقع واستقبال الطلبات الجديدة.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-5 text-xs">
                <label
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3.5 transition ${
                    maintenanceMode
                      ? "border-red-300 bg-red-50/70"
                      : "border-gray-200 bg-gray-50/60"
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      وضع الصيانة (إيقاف الموقع مؤقتاً للزوار)
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      عند التفعيل، يظهر للزوار أن الموقع في صيانة بينما تظل لوحة الأدمن متاحة لك.
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

                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      استقبال طلبات عرض العقارات (البائعين)
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      السماح للبائعين بتسجيل وحدات جديدة عبر صفحة "بيع وحدتك".
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

                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      استقبال طلبات الشراء (المشترين)
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      السماح للمشترين بتسجيل ميزانيتهم وطلباتهم الجديدة.
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

                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                  <div>
                    <div className="font-extrabold text-[#0a1122]">
                      إرسال إشعارات البريد الإلكتروني التلقائية
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      إرسال إيميل تلقائي للعميل عند قبول وحدته أو تحديث حالتها.
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
              className="h-11 w-full rounded-xl bg-[#105C50] px-8 text-xs font-extrabold text-white shadow-sm hover:bg-[#0c483f] sm:w-auto"
            >
              <Save className="ml-2 size-4" />
              حفظ إعدادات الموقع
            </Button>
          </div>
        </form>
      )}

      {activeTab === "system" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <Database className="size-4 text-[#105C50]" />
                <span>حالة الربط التقني (Environment)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                فحص تلقائي لمتغيرات البيئة على السيرفر.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <div>
                  <div className="font-bold text-[#0a1122]">
                    قاعدة بيانات Supabase
                  </div>
                  <div className="mt-0.5 text-gray-500">
                    حفظ العقارات، طلبات الشراء، والمستخدمين
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                    hasSupabase
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <CheckCircle2 className="size-3.5" />
                  {hasSupabase ? "متصل بنجاح" : "غير متصل"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <div>
                  <div className="font-bold text-[#0a1122]">
                    خدمة رسائل البريد (Nodemailer / Gmail)
                  </div>
                  <div className="mt-0.5 text-gray-500">
                    إرسال أكواد OTP وإشعارات قبول العقارات
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                    hasEmail
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <Mail className="size-3.5" />
                  {hasEmail ? "مفعّل" : "يحتاج إعداد EMAIL_USER"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <ShieldCheck className="size-4 text-[#105C50]" />
                <span>إدارة الصلاحيات والفريق</span>
              </CardTitle>
              <CardDescription className="text-xs">
                الضوابط المعتمدة في دورة حياة الطلبات.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-xs leading-relaxed text-gray-600">
              <div className="rounded-xl border border-gray-100 p-3.5">
                <strong className="text-[#0a1122]">
                  ١. حماية بيانات البائعين:
                </strong>{" "}
                لا تظهر أرقام هواتف البائعين في صفحات الفرص العامة، وتتم جميع العروض عبر وسطاء المنصة.
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/users"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a1122] px-5 text-xs font-bold text-white transition hover:bg-[#16223f]"
                >
                  إدارة المديرين والمشرفين
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
          dir="rtl"
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
        >
          {confirmModal && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                  تأكيد حفظ إعدادات الموقع
                </DialogTitle>
                <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                  هل أنت متأكد من حفظ التعديلات الجديدة على إعدادات المنصة وحالة التشغيل؟
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