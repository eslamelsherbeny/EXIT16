"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  Info,
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
import { useTranslation } from "@/lib/i18n"
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
  // سحب الترجمة مباشرة من النظام المركزي (ملفات الـ JSON)
  const { t: dict, dir } = useTranslation()
  const t = dict.admin.usersPage

  const roleOptions = [
    { value: "admin", label: t.roles.admin },
    { value: "moderator", label: t.roles.moderator },
    { value: "sales", label: t.roles.sales },
    { value: "user", label: t.roles.user },
  ]

  function getRoleLabel(role: string) {
    return roleOptions.find((r) => r.value === role)?.label || t.roles.user
  }

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [openAddModal, setOpenAddModal] = useState(false)
  const [confirmState, setConfirmState] =
    useState<ConfirmActionState | null>(null)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

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
              text: `${t.roleUpdatedSuccess} (${targetUser.name} → ${getRoleLabel(confirmState.newRole)})`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || "Error", isError: true })
          }
        } else if (confirmState.type === "status") {
          const res = await updateUserRoleAndStatusAction(
            targetUser.id,
            targetUser.role,
            confirmState.newStatus
          )
          if (res.success) {
            setNotice({
              text: `${t.statusUpdatedSuccess} (${targetUser.name})`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || "Error", isError: true })
          }
        } else if (confirmState.type === "delete") {
          const res = await deleteUserByAdminAction(targetUser.id)
          if (res.success) {
            setNotice({
              text: `${t.userDeletedSuccess} (${targetUser.name})`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || "Error", isError: true })
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
        setNotice({ text: t.userCreatedSuccess })
        setOpenAddModal(false)
        router.refresh()
      } else {
        setNotice({ text: res.error || "Error", isError: true })
      }
    })
  }

  const isStaffMember = (role: string) =>
    role === "admin" || role === "moderator" || role === "sales"

  const filtered = users.filter((u) => {
    if (roleFilter === "admins" && !isStaffMember(u.role)) {
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
    <div dir={dir} className="text-start">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#105C50]">{t.eyebrow}</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#0a1122] sm:text-3xl">
            {t.title} ({users.length})
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">{t.subtitle}</p>
        </div>

        <Button
          onClick={() => setOpenAddModal(true)}
          className="h-10 w-full rounded-xl bg-[#105C50] px-4 text-xs font-bold text-white hover:bg-[#0c483f] sm:w-auto"
        >
          <UserPlus className="me-1.5 size-4" />
          {t.addBtn}
        </Button>
      </div>

      <div className="mb-5 rounded-2xl border border-[#105C50]/20 bg-[#eff8f6] p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-[#105C50]">
          <Info className="size-4 shrink-0" />
          <span>{t.rolesGuideTitle}</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {t.rolesGuide.map((item) => (
            <div
              key={item.role}
              className="rounded-xl border border-white/80 bg-white p-3 shadow-2xs"
            >
              <p className="text-xs font-extrabold text-[#0a1122]">
                {item.role}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

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

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="relative w-full sm:min-w-[250px] sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 end-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-gray-200 ps-4 pe-10 text-xs focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {[
            { id: "all", label: `${t.tabAll} (${users.length})` },
            {
              id: "admins",
              label: `${t.tabStaff} (${users.filter((u) => isStaffMember(u.role)).length})`,
            },
            {
              id: "sellers",
              label: `${t.tabSellers} (${users.filter((u) => u.sellCount > 0).length})`,
            },
            {
              id: "buyers",
              label: `${t.tabBuyers} (${users.filter((u) => u.buyCount > 0).length})`,
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

      {/* 1. عرض الموبايل */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            {t.emptyText}
          </div>
        ) : (
          filtered.map((user) => {
            const isSuspended = user.status === "suspended"
            const isRowLoading = pending && activeUserId === user.id
            const firstLetter = user.name.trim().charAt(0) || "U"

            return (
              <div
                key={user.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isRowLoading
                    ? "border-[#105C50] opacity-75"
                    : "border-gray-200/90"
                }`}
              >
                {isRowLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-4 py-2 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span>{t.updatingText}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#105C50]/10 text-sm font-extrabold text-[#105C50]">
                      {firstLetter}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-[#0a1122]">
                        <span className="text-sm">{user.name}</span>
                        {isStaffMember(user.role) && (
                          <ShieldCheck className="size-4 shrink-0 text-[#105C50]" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {user.sellCount > 0 && (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {t.sellerBadge} ({user.sellCount} {t.unitWord})
                          </span>
                        )}
                        {user.buyCount > 0 && (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            {t.buyerBadge} ({user.buyCount} {t.reqWord})
                          </span>
                        )}
                        {user.sellCount === 0 && user.buyCount === 0 && (
                          <span className="text-[11px] text-gray-400">
                            {t.registeredAcc}
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
                      <CheckCircle2 className="me-1 size-3" />
                    ) : (
                      <Ban className="me-1 size-3" />
                    )}
                    {!isSuspended ? t.activeBadge : t.suspendedBadge}
                  </Badge>
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Mail className="size-3.5" />
                      <span>{t.emailLabel}</span>
                    </span>
                    <span
                      dir="ltr"
                      className="truncate font-medium text-[#0a1122]"
                    >
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Phone className="size-3.5" />
                      <span>{t.phoneLabel}</span>
                    </span>
                    <span dir="ltr" className="font-medium text-[#0a1122]">
                      {user.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="size-3.5" />
                      <span>{t.joinedLabel}</span>
                    </span>
                    <span dir="ltr" className="font-medium text-[#0a1122]">
                      {new Date(user.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-gray-500">
                    {t.roleSelectLabel}
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
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                    {isSuspended ? t.activateBtn : t.suspendBtn}
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
                    <span>{t.deleteBtn}</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 2. عرض الكمبيوتر */}
      <Card className="hidden border-gray-200/80 bg-white shadow-sm md:block">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-extrabold">
            {t.tableTitle} ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">{t.tableDesc}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">{t.colUser}</th>
                  <th className="px-5 py-4 font-bold">{t.colActivity}</th>
                  <th className="px-5 py-4 font-bold">{t.colRole}</th>
                  <th className="px-5 py-4 font-bold">{t.colJoined}</th>
                  <th className="px-5 py-4 font-bold">{t.colStatus}</th>
                  <th className="px-5 py-4 font-bold">{t.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      {t.emptyText}
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
                            {isStaffMember(user.role) && (
                              <ShieldCheck className="size-4 text-[#105C50]" />
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {user.email}
                          </div>
                          <div
                            dir="ltr"
                            className="text-start text-[11px] text-gray-400"
                          >
                            {user.phone}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.sellCount > 0 && (
                              <Badge className="bg-emerald-50 text-emerald-800">
                                {t.sellerBadge} ({user.sellCount} {t.unitWord})
                              </Badge>
                            )}
                            {user.buyCount > 0 && (
                              <Badge className="bg-blue-50 text-blue-800">
                                {t.buyerBadge} ({user.buyCount} {t.reqWord})
                              </Badge>
                            )}
                            {user.sellCount === 0 && user.buyCount === 0 && (
                              <span className="text-xs text-gray-400">
                                {t.registeredAcc}
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
                            {roleOptions.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td
                          dir="ltr"
                          className="px-5 py-4 text-start text-xs text-gray-500"
                        >
                          {new Date(user.created_at).toLocaleDateString("en-GB")}
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
                              <CheckCircle2 className="me-1 size-3.5" />
                            ) : (
                              <Ban className="me-1 size-3.5" />
                            )}
                            {!isSuspended ? t.activeBadge : t.suspendedBadge}
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
                              {isSuspended ? t.activateBtn : t.suspendBtn}
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
                              title={t.deleteBtn}
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

      {/* نافذة التأكيد */}
      <Dialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmState(null)
        }}
      >
        <DialogContent dir={dir} className="max-w-md text-start">
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
                    {confirmState.type === "role" && t.confirmRoleTitle}
                    {confirmState.type === "status" &&
                      (confirmState.newStatus === "active"
                        ? t.confirmActivateTitle
                        : t.confirmSuspendTitle)}
                    {confirmState.type === "delete" && t.confirmDeleteTitle}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
                  <strong className="text-[#0a1122]">
                    "{confirmState.user.name}"
                  </strong>
                  {confirmState.type === "role" && (
                    <>
                      {" "}
                      →{" "}
                      <span className="font-bold text-[#105C50]">
                        ({getRoleLabel(confirmState.newRole)})
                      </span>
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
                  {t.cancelBtn}
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
                      {t.updatingText}
                    </span>
                  ) : (
                    t.confirmBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة عضو إدارة أو مستخدم جديد */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent dir={dir} className="max-w-md text-start">
          <DialogHeader>
            <DialogTitle className="font-extrabold">
              {t.addModalTitle}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t.addModalDesc}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="mt-2 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold">
                {t.fullNameLabel}
              </label>
              <input
                name="name"
                required
                maxLength={120}
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                {t.emailLabel}
              </label>
              <input
                name="email"
                type="email"
                dir="ltr"
                required
                maxLength={160}
                placeholder="staff@aqarexit.com"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-left text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                {t.phoneLabel}
              </label>
              <input
                name="phone"
                type="tel"
                dir="ltr"
                required
                maxLength={25}
                placeholder="+9955xxxxxxxx"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-left text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                {t.passwordLabel}
              </label>
              <input
                name="password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                maxLength={128}
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-left text-xs focus:border-[#105C50] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                {t.colRole}
              </label>
              <select
                name="role"
                defaultValue="sales"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold focus:border-[#105C50] focus:outline-none"
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="mt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpenAddModal(false)}
              >
                {t.cancelBtn}
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-[#105C50] text-white hover:bg-[#0c483f]"
              >
                {pending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-4 animate-spin" />
                    {t.updatingText}
                  </span>
                ) : (
                  t.createNowBtn
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ============================================================================
   ARCHIVED EGYPT PLACEHOLDERS (COMMENTED FOR FUTURE REFERENCE)
   ============================================================================
   // placeholder="staff@darak.com"
   // placeholder="010xxxxxxxx"
============================================================================ */
