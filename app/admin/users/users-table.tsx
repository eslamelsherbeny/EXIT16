"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import {
  createAdminOrUserAction,
  deleteUserByAdminAction,
  updateUserRoleAndStatusAction,
} from "../actions"

export type AdminUserRow = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  created_at: string
  sellCount: number
  buyCount: number
}

const ROLE_OPTIONS = [
  { value: "admin", label: "مدير نظام (Admin)", badge: "bg-[#0a1122] text-white" },
  { value: "moderator", label: "مشرف مبيعات (Moderator)", badge: "bg-purple-100 text-purple-800" },
  { value: "user", label: "عميل (بائع / مشتري)", badge: "bg-gray-100 text-gray-700" },
]

function getRoleLabel(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || "عميل"
}

// نوع العملية المطلوب تأكيدها قبل التنفيذ
type ConfirmActionState =
  | {
      type: "role"
      user: AdminUserRow
      newRole: string
    }
  | {
      type: "status"
      user: AdminUserRow
      newStatus: string
    }
  | {
      type: "delete"
      user: AdminUserRow
    }

export default function UsersClientTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [openAddModal, setOpenAddModal] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmActionState | null>(null)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  // تنفيذ العملية بعد ضغط المدير على زر "تأكيد" في النافذة
  function executeConfirmedAction() {
    if (!confirmState) return
    setNotice(null)
    const targetUser = confirmState.user
    setActiveUserId(targetUser.id)

    startTransition(async () => {
      try {
        if (confirmState.type === "role") {
          const res = await updateUserRoleAndStatusAction(
            targetUser.id,
            confirmState.newRole,
            targetUser.status
          )
          if (res.success) {
            setNotice({
              text: `تم تغيير صلاحية "${targetUser.name}" إلى (${getRoleLabel(confirmState.newRole)}) بنجاح.`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || "تعذر تحديث الصلاحية.", isError: true })
          }
        } else if (confirmState.type === "status") {
          const res = await updateUserRoleAndStatusAction(
            targetUser.id,
            targetUser.role,
            confirmState.newStatus
          )
          if (res.success) {
            const statusText =
              confirmState.newStatus === "active" ? "تفعيل حساب" : "إيقاف حساب"
            setNotice({
              text: `تم ${statusText} "${targetUser.name}" بنجاح.`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || "تعذر تحديث حالة الحساب.", isError: true })
          }
        } else if (confirmState.type === "delete") {
          const res = await deleteUserByAdminAction(targetUser.id)
          if (res.success) {
            setNotice({
              text: `تم حذف حساب "${targetUser.name}" وجميع طلباته نهائياً.`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || "تعذر حذف الحساب.", isError: true })
          }
        }
      } finally {
        setConfirmState(null)
        setActiveUserId(null)
      }
    })
  }

  function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNotice(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createAdminOrUserAction(fd)
      if (res.success) {
        setNotice({ text: "تم إنشاء الحساب الجديد وتفعيل صلاحياته بنجاح." })
        setOpenAddModal(false)
        router.refresh()
      } else {
        setNotice({ text: res.error || "تعذر إنشاء الحساب.", isError: true })
      }
    })
  }

  const filtered = users.filter((u) => {
    if (roleFilter === "admins" && u.role !== "admin" && u.role !== "moderator") {
      return false
    }
    if (roleFilter === "sellers" && u.sellCount === 0) return false
    if (roleFilter === "buyers" && u.buyCount === 0) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      return `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div>
      {/* الهيدر العلوي */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">
            المجتمع والصلاحيات
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
            المستخدمين وفريق الإدارة ({users.length})
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            عيّن مديرين ومشرفين معك في المنصة، وراجع حسابات البائعين والمشترين.
          </p>
        </div>

        <Button
          onClick={() => setOpenAddModal(true)}
          className="h-10 w-full rounded-xl bg-[#105C50] px-4 text-xs font-bold text-white hover:bg-[#0c483f] sm:w-auto"
        >
          <UserPlus className="ml-1.5 size-4" />
          إضافة أدمن / مستخدم جديد
        </Button>
      </div>

      {/* شريط الإشعارات الواضح بعد كل عملية */}
      {notice && (
        <div
          className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-bold shadow-xs transition-all sm:text-sm ${
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
            className="rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* شريط البحث والفلترة */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:min-w-[250px] sm:flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الموبايل..."
            className="h-10 w-full rounded-xl border border-gray-200 pr-10 pl-4 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {[
            { id: "all", label: `الكل (${users.length})` },
            {
              id: "admins",
              label: `الإدارة (${users.filter((u) => u.role === "admin" || u.role === "moderator").length})`,
            },
            {
              id: "sellers",
              label: `البائعين (${users.filter((u) => u.sellCount > 0).length})`,
            },
            {
              id: "buyers",
              label: `المشترين (${users.filter((u) => u.buyCount > 0).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`rounded-xl px-3 py-2 text-center text-xs font-bold transition ${
                roleFilter === tab.id
                  ? "bg-[#105C50] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 1. عرض الموبايل والتابلت الصغير (كروت احترافية بدون تمرير أفقي) ==================== */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            لا توجد حسابات مطابقة للبحث.
          </div>
        ) : (
          filtered.map((user) => {
            const isSuspended = user.status === "suspended"
            const isRowLoading = pending && activeUserId === user.id
            const firstLetter = user.name.trim().charAt(0) || "م"

            return (
              <div
                key={user.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isRowLoading
                    ? "border-[#105C50] opacity-75"
                    : "border-gray-200/90"
                }`}
              >
                {/* طبقة التحميل فوق الكارت لو جاري تعديله */}
                {isRowLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-4 py-2 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span>جاري تنفيذ التعديل...</span>
                    </div>
                  </div>
                )}

                {/* الصف العلوي للكارت: الأفاتار + الاسم + شارة الحالة */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#105C50]/10 text-sm font-extrabold text-[#105C50]">
                      {firstLetter}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-[#0a1122]">
                        <span className="text-sm">{user.name}</span>
                        {user.role === "admin" && (
                          <ShieldCheck className="size-4 shrink-0 text-[#105C50]" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {user.sellCount > 0 && (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            بائع ({user.sellCount} وحدة)
                          </span>
                        )}
                        {user.buyCount > 0 && (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            مشتري ({user.buyCount} طلب)
                          </span>
                        )}
                        {user.sellCount === 0 && user.buyCount === 0 && (
                          <span className="text-[11px] text-gray-400">
                            حساب مسجل
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={`shrink-0 text-[10px] ${
                      !isSuspended
                        ? "bg-teal-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {!isSuspended ? (
                      <CheckCircle2 className="ml-1 size-3" />
                    ) : (
                      <Ban className="ml-1 size-3" />
                    )}
                    {!isSuspended ? "نشط" : "موقوف"}
                  </Badge>
                </div>

                {/* تفاصيل الاتصال وتاريخ الانضمام */}
                <div className="mt-3.5 grid grid-cols-1 gap-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Mail className="size-3.5" />
                      <span>البريد:</span>
                    </span>
                    <span dir="ltr" className="truncate font-medium text-[#0a1122]">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Phone className="size-3.5" />
                      <span>الهاتف:</span>
                    </span>
                    <span dir="ltr" className="font-medium text-[#0a1122]">
                      {user.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="size-3.5" />
                      <span>الانضمام:</span>
                    </span>
                    <span className="font-medium text-[#0a1122]">
                      {new Date(user.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>

                {/* التحكم في الصلاحية */}
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">
                    الصلاحية (تتطلب تأكيد قبل الحفظ):
                  </label>
                  <select
                    disabled={pending}
                    value={user.role}
                    onChange={(e) => {
                      const nextRole = e.target.value
                      if (nextRole !== user.role) {
                        setConfirmState({
                          type: "role",
                          user,
                          newRole: nextRole,
                        })
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* أزرار الإجراءات السفلية المريحة للمس */}
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      setConfirmState({
                        type: "status",
                        user,
                        newStatus: isSuspended ? "active" : "suspended",
                      })
                    }
                    className={`h-9 flex-1 rounded-xl text-xs font-bold ${
                      isSuspended
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100"
                        : "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {isSuspended ? "تفعيل الحساب" : "إيقاف مؤقت"}
                  </Button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      setConfirmState({
                        type: "delete",
                        user,
                      })
                    }
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="size-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ==================== 2. عرض الكمبيوتر والتابلت الكبير (الجدول الكامل) ==================== */}
      <Card className="hidden border-gray-200/80 bg-white shadow-sm md:block">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            قائمة الحسابات المسجلة ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            أي تعديل في الصلاحية أو حالة الحساب سيطلب منك التأكيد أولاً قبل التنفيذ.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">الاسم والبيانات</th>
                  <th className="px-5 py-4 font-bold">نشاط العميل</th>
                  <th className="px-5 py-4 font-bold">الصلاحية (Role)</th>
                  <th className="px-5 py-4 font-bold">تاريخ الانضمام</th>
                  <th className="px-5 py-4 font-bold">الحالة</th>
                  <th className="px-5 py-4 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      لا توجد حسابات مطابقة.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const isSuspended = user.status === "suspended"
                    const isRowLoading = pending && activeUserId === user.id

                    return (
                      <tr
                        key={user.id}
                        className={`border-t border-gray-100 transition ${
                          isRowLoading
                            ? "bg-emerald-50/40 opacity-70"
                            : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                            <span>{user.name}</span>
                            {user.role === "admin" && (
                              <ShieldCheck className="size-4 text-[#105C50]" />
                            )}
                            {isRowLoading && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#105C50] px-2 py-0.5 text-[10px] font-bold text-white">
                                <Loader2 className="size-3 animate-spin" />
                                جاري الحفظ...
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {user.email}
                          </div>
                          <div
                            dir="ltr"
                            className="text-right text-[11px] text-gray-400"
                          >
                            {user.phone}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.sellCount > 0 && (
                              <Badge className="bg-emerald-50 text-emerald-800">
                                بائع ({user.sellCount} وحدة)
                              </Badge>
                            )}
                            {user.buyCount > 0 && (
                              <Badge className="bg-blue-50 text-blue-800">
                                مشتري ({user.buyCount} طلب)
                              </Badge>
                            )}
                            {user.sellCount === 0 && user.buyCount === 0 && (
                              <span className="text-xs text-gray-400">
                                حساب مسجل
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            disabled={pending}
                            value={user.role}
                            onChange={(e) => {
                              const nextRole = e.target.value
                              if (nextRole !== user.role) {
                                setConfirmState({
                                  type: "role",
                                  user,
                                  newRole: nextRole,
                                })
                              }
                            }}
                            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString("ar-EG")}
                        </td>

                        <td className="px-5 py-4">
                          <Badge
                            className={
                              !isSuspended
                                ? "bg-teal-600 text-white"
                                : "bg-red-600 text-white"
                            }
                          >
                            {!isSuspended ? (
                              <CheckCircle2 className="ml-1 size-3.5" />
                            ) : (
                              <Ban className="ml-1 size-3.5" />
                            )}
                            {!isSuspended ? "نشط" : "موقوف"}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() =>
                                setConfirmState({
                                  type: "status",
                                  user,
                                  newStatus: isSuspended ? "active" : "suspended",
                                })
                              }
                              className={`h-8 rounded-lg text-xs font-bold ${
                                isSuspended
                                  ? "text-emerald-700 hover:bg-emerald-50"
                                  : "text-amber-700 hover:bg-amber-50"
                              }`}
                            >
                              {isSuspended ? "تفعيل الحساب" : "إيقاف مؤقت"}
                            </Button>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                setConfirmState({
                                  type: "delete",
                                  user,
                                })
                              }
                              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ==================== نافذة التأكيد الموحدة لجميع عمليات المستخدم ==================== */}
      <Dialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmState(null)
        }}
      >
        <DialogContent dir="rtl" className="max-w-md">
          {confirmState && (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      confirmState.type === "delete"
                        ? "bg-red-100 text-red-600"
                        : confirmState.type === "status" &&
                            confirmState.newStatus === "suspended"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-emerald-100 text-[#105C50]"
                    }`}
                  >
                    {confirmState.type === "delete" ? (
                      <Trash2 className="size-5" />
                    ) : (
                      <ShieldAlert className="size-5" />
                    )}
                  </span>
                  <DialogTitle className="text-base font-extrabold text-[#0a1122]">
                    {confirmState.type === "role" && "تأكيد تغيير صلاحية الحساب"}
                    {confirmState.type === "status" &&
                      (confirmState.newStatus === "active"
                        ? "تأكيد تفعيل الحساب"
                        : "تأكيد إيقاف الحساب مؤقتاً")}
                    {confirmState.type === "delete" && "تأكيد حذف الحساب نهائياً"}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                  {confirmState.type === "role" && (
                    <>
                      هل أنت متأكد من تغيير صلاحية المستخدم{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmState.user.name}"
                      </strong>{" "}
                      من{" "}
                      <span className="font-bold">
                        ({getRoleLabel(confirmState.user.role)})
                      </span>{" "}
                      إلى{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getRoleLabel(confirmState.newRole)})
                      </span>
                      ؟
                    </>
                  )}

                  {confirmState.type === "status" && (
                    <>
                      هل أنت متأكد من{" "}
                      <strong className="text-[#0a1122]">
                        {confirmState.newStatus === "active"
                          ? "إعادة تفعيل"
                          : "إيقاف"}
                      </strong>{" "}
                      حساب المستخدم{" "}
                      <strong className="text-[#0a1122]">
                        "{confirmState.user.name}"
                      </strong>
                      ؟
                      {confirmState.newStatus === "suspended" &&
                        " لن يتمكن هذا المستخدم من تسجيل الدخول لحين إعادة تفعيله."}
                    </>
                  )}

                  {confirmState.type === "delete" && (
                    <>
                      هل أنت متأكد من حذف حساب{" "}
                      <strong className="text-red-600">
                        "{confirmState.user.name}"
                      </strong>{" "}
                      وجميع طلبات البيع والشراء المرتبطة به نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmState(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  إلغاء التغيير
                </Button>

                <Button
                  type="button"
                  disabled={pending}
                  onClick={executeConfirmedAction}
                  className={`rounded-xl text-xs font-bold text-white ${
                    confirmState.type === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmState.type === "status" &&
                          confirmState.newStatus === "suspended"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-[#105C50] hover:bg-[#0c483f]"
                  }`}
                >
                  {pending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-4 animate-spin" />
                      جاري التنفيذ...
                    </span>
                  ) : (
                    "نعم، تأكيد التنفيذ"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== نافذة إضافة أدمن أو مستخدم جديد ==================== */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold">
              إضافة عضو إدارة أو مستخدم جديد
            </DialogTitle>
            <DialogDescription className="text-xs">
              أضف مدير نظام أو مشرف مبيعات جديد ليتمكن من الدخول والمشاركة في الإدارة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="mt-2 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold">الاسم الكامل</label>
              <input
                name="name"
                required
                placeholder="مثال: أحمد محمود"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                البريد الإلكتروني
              </label>
              <input
                name="email"
                type="email"
                dir="ltr"
                required
                placeholder="admin@darak.com"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-left text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">رقم الهاتف</label>
              <input
                name="phone"
                type="tel"
                dir="ltr"
                required
                placeholder="010xxxxxxxx"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-left text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">كلمة المرور</label>
              <input
                name="password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                placeholder="8 أحرف على الأقل"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-left text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                الصلاحية (الدور)
              </label>
              <select
                name="role"
                defaultValue="admin"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
              >
                <option value="admin">مدير نظام (صلاحية كاملة)</option>
                <option value="moderator">مشرف مبيعات (متابعة الطلبات)</option>
                <option value="user">عميل عادي</option>
              </select>
            </div>

            <DialogFooter className="mt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpenAddModal(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-[#105C50] text-white hover:bg-[#0c483f]"
              >
                {pending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-4 animate-spin" />
                    جاري الإنشاء...
                  </span>
                ) : (
                  "إنشاء الحساب الآن"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}