"use client"

import { useState, useTransition } from "react"
import {
  Ban,
  CheckCircle2,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
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

export default function UsersClientTable({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [openAddModal, setOpenAddModal] = useState(false)
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleUpdateUser(userId: string, newRole: string, newStatus: string) {
    setNotice(null)
    startTransition(async () => {
      const res = await updateUserRoleAndStatusAction(userId, newRole, newStatus)
      if (res.success) {
        setNotice({ text: "تم تحديث صلاحيات وحالة الحساب بنجاح." })
      } else {
        setNotice({ text: res.error || "تعذر تحديث الحساب.", isError: true })
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
      } else {
        setNotice({ text: res.error || "تعذر إنشاء الحساب.", isError: true })
      }
    })
  }

  function handleDeleteUser(userId: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف حساب "${name}" وجميع طلباته نهائياً؟`)) return
    setNotice(null)
    startTransition(async () => {
      const res = await deleteUserByAdminAction(userId)
      if (res.success) {
        setNotice({ text: "تم حذف الحساب بنجاح." })
      } else {
        setNotice({ text: res.error || "تعذر الحذف.", isError: true })
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">
            المجتمع والصلاحيات
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#0a1122] sm:text-3xl">
            المستخدمين وفريق الإدارة ({users.length})
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            عيّن مديرين ومشرفين معك في المنصة، وراجع حسابات البائعين والمشترين.
          </p>
        </div>

        <Button
          onClick={() => setOpenAddModal(true)}
          className="h-10 rounded-xl bg-[#105C50] px-4 text-xs font-bold text-white hover:bg-[#0c483f]"
        >
          <UserPlus className="ml-1.5 size-4" />
          إضافة أدمن / مستخدم جديد
        </Button>
      </div>

      {notice && (
        <div
          className={`mb-5 rounded-xl border p-4 text-xs font-bold ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* شريط البحث والفلترة */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
        <div className="relative min-w-[250px] flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الموبايل..."
            className="h-10 w-full rounded-xl border border-gray-200 pr-10 pl-4 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: `الكل (${users.length})` },
            {
              id: "admins",
              label: `فريق الإدارة (${users.filter((u) => u.role === "admin" || u.role === "moderator").length})`,
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
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                roleFilter === tab.id
                  ? "bg-[#105C50] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-gray-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            قائمة الحسابات المسجلة ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            يمكنك ترقية أي حساب إلى (مدير نظام) أو (مشرف مبيعات) أو إيقاف الحساب مؤقتاً.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right text-xs sm:text-sm">
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
                    return (
                      <tr
                        key={user.id}
                        className="border-t border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                            <span>{user.name}</span>
                            {user.role === "admin" && (
                              <ShieldCheck className="size-4 text-[#105C50]" />
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
                            onChange={(e) =>
                              handleUpdateUser(
                                user.id,
                                e.target.value,
                                user.status
                              )
                            }
                            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none"
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
                                handleUpdateUser(
                                  user.id,
                                  user.role,
                                  isSuspended ? "active" : "suspended"
                                )
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
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
                onClick={() => setOpenAddModal(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-[#105C50] text-white hover:bg-[#0c483f]"
              >
                {pending ? "جاري الإنشاء..." : "إنشاء الحساب الآن"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
