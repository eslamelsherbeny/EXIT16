"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  Crown,
  Download,
  FileText,
  Info,
  Loader2,
  Lock,
  Mail,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  downloadExcelCsv,
  downloadOfficialPdfReport,
  EXPORT_LABELS,
} from "@/lib/export-csv"
import { useTranslation } from "@/lib/i18n"
import {
  createAdminOrUserAction,
  deleteUserByAdminAction,
  updateUserRoleAndStatusAction,
  verifyUserContactByAdminAction,
} from "../../../actions/admin-actions"
import { AddUserDialog, UserConfirmDialog } from "./users-modals"

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
  emailVerified?: boolean
  phoneVerified?: boolean
  isOwnerAdmin?: boolean
}

export type ConfirmActionState =
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

export default function UsersClientTable({
  users,
  currentAdminId = "",
  isCurrentUserOwner = false,
}: {
  users: AdminUserRow[]
  currentAdminId?: string
  isCurrentUserOwner?: boolean
}) {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.admin.usersPage as Record<string, any>
  const propBadges = dict.admin?.propertiesAdmin?.badges || {}
  const expL = EXPORT_LABELS[locale] || EXPORT_LABELS.ar

  const ownerRoleLabel = t.roles?.owner || `👑 SUPER ADMIN (${t.roles?.admin || "Owner"})`

  const allRoleOptions = [
    { value: "owner", label: ownerRoleLabel },
    { value: "admin", label: t.roles.admin },
    { value: "moderator", label: t.roles.moderator },
    { value: "sales", label: t.roles.sales },
    { value: "user", label: t.roles.user },
  ]

  // إذا كان المستخدم الحالي مالكاً للمشروع (Owner) يرى جميع الرتب، أما الأدمن العادي فيعيّن المشرفين والمبيعات فقط
  const assignableRoleOptions = isCurrentUserOwner
    ? allRoleOptions
    : allRoleOptions.filter((r) => r.value !== "owner" && r.value !== "admin")

  function getRoleLabel(role: string) {
    return allRoleOptions.find((r) => r.value === role)?.label || t.roles.user
  }

  /**
   * قواعد الحماية القياسية (RBAC):
   * 1. لا يمكن لأحد تعديل أو حذف حسابه الشخصي من الجدول
   * 2. لا يمكن لأي شخص غير المالك تعديل أو حذف حساب مالك (Owner) أو حساب مدير (Admin) آخر
   */
  function canManageUser(target: AdminUserRow): boolean {
    if (String(target.id) === String(currentAdminId)) return false
    const targetRole = String(target.role || "user").trim().toLowerCase()
    if (
      (target.isOwnerAdmin || targetRole === "owner" || targetRole === "admin") &&
      !isCurrentUserOwner
    ) {
      return false
    }
    return true
  }

  function canDeleteOrSuspendUser(target: AdminUserRow): boolean {
    if (!canManageUser(target)) return false
    // حساب المالك (Owner) محمي من الحذف أو الإيقاف المباشر حتى يتم خفض رتبته أولاً
    if (target.isOwnerAdmin || String(target.role).toLowerCase() === "owner") {
      return false
    }
    return true
  }

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openAddModal, setOpenAddModal] = useState(false)
  const [confirmState, setConfirmState] =
    useState<ConfirmActionState | null>(null)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [])

  function handleVerifyUserContact(user: AdminUserRow) {
    setNotice(null)
    setActiveUserId(user.id)
    startTransition(async () => {
      try {
        const res = await verifyUserContactByAdminAction({
          userId: user.id,
          type: "both",
        })
        if (res.success) {
          setNotice({
            text: `${dict.admin?.propertiesAdmin?.notices?.sellerVerifiedSuccess || t.statusUpdatedSuccess} (${user.name})`,
          })
          router.refresh()
        } else {
          setNotice({ text: res.error || t.emptyText, isError: true })
        }
      } finally {
        setActiveUserId(null)
      }
    })
  }

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
            setNotice({ text: res.error || t.emptyText, isError: true })
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
            setNotice({ text: res.error || t.emptyText, isError: true })
          }
        } else if (confirmState.type === "delete") {
          const res = await deleteUserByAdminAction(targetUser.id)
          if (res.success) {
            setNotice({
              text: `${t.userDeletedSuccess} (${targetUser.name})`,
            })
            router.refresh()
          } else {
            setNotice({ text: res.error || t.emptyText, isError: true })
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
        setNotice({ text: res.error || t.emptyText, isError: true })
      }
    })
  }

  const isStaffMember = (role: string) =>
    role === "owner" || role === "admin" || role === "moderator" || role === "sales"

  const filtered = users.filter((u) => {
    if (roleFilter === "admins" && !isStaffMember(u.role)) {
      return false
    }
    if (roleFilter === "sellers" && u.sellCount === 0) return false
    if (roleFilter === "buyers" && u.buyCount === 0) return false

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const qDigits = q.replace(/\D/g, "")
      const phoneDigits = String(u.phone || "").replace(/\D/g, "")
      return (
        `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q) ||
        (qDigits.length >= 5 && phoneDigits.includes(qDigits))
      )
    }
    return true
  })

  function exportUsersReport(
    rowsToExport: AdminUserRow[],
    format: "excel" | "pdf" = "excel",
    prefix = "AqarExit_Users",
    customTitle?: string
  ) {
    const c = expL.cols
    const resolvedTitle =
      customTitle ||
      (rowsToExport.length === 1
        ? `${expL.singleUserReportTitle} — ${rowsToExport[0].name}`
        : expL.usersReportTitle)

    const columns = [
      { header: c.index, accessor: (_: AdminUserRow, idx: number) => idx + 1 },
      { header: c.buyerName, accessor: (u: AdminUserRow) => u.name },
      {
        header: c.buyerPhone,
        accessor: (u: AdminUserRow) => u.phone,
        isPhone: true,
      },
      { header: c.buyerEmail, accessor: (u: AdminUserRow) => u.email },
      {
        header: c.userRole,
        accessor: (u: AdminUserRow) => getRoleLabel(u.role),
      },
      { header: c.sellUnitsCount, accessor: (u: AdminUserRow) => u.sellCount },
      { header: c.buyRequestsCount, accessor: (u: AdminUserRow) => u.buyCount },
      {
        header: c.verification,
        accessor: (u: AdminUserRow) =>
          u.emailVerified || u.phoneVerified
            ? expL.verified
            : expL.unverified,
      },
      {
        header: c.status,
        accessor: (u: AdminUserRow) =>
          u.status === "suspended"
            ? expL.suspendedStatus
            : expL.activeStatus,
      },
      {
        header: c.createdAt,
        accessor: (u: AdminUserRow) =>
          new Date(u.created_at).toLocaleDateString("en-GB"),
      },
    ]

    if (format === "pdf") {
      downloadOfficialPdfReport({
        filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
        reportTitle: resolvedTitle,
        locale,
        columns,
        data: rowsToExport,
      })
    } else {
      downloadExcelCsv({
        filenamePrefix: `${prefix}_${locale.toUpperCase()}`,
        reportTitle: resolvedTitle,
        locale,
        columns,
        data: rowsToExport,
      })
    }
  }

  function renderThreeDotsMenu(user: AdminUserRow, isSuspended: boolean) {
    const isMenuOpen = openMenuId === user.id
    const canDeleteOrSuspend = canDeleteOrSuspendUser(user)
    const canGrantOwner =
      isCurrentUserOwner &&
      String(user.id) !== String(currentAdminId) &&
      String(user.role).toLowerCase() !== "owner"

    return (
      <div
        className="relative"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <button
          type="button"
          aria-label={expL.moreActionsAria}
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenuId(isMenuOpen ? null : user.id)
          }}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-[#105C50] hover:bg-white hover:text-[#0a1122]"
        >
          <MoreVertical className="size-4" />
        </button>

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute end-0 top-9 z-50 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl"
          >
            {canGrantOwner && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(null)
                    setConfirmState({
                      type: "role",
                      user,
                      newRole: "owner",
                    })
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-extrabold text-amber-900 transition hover:bg-amber-50"
                >
                  <Crown className="size-3.5 text-amber-600" />
                  <span>{ownerRoleLabel}</span>
                </button>
                <div className="my-1 border-t border-gray-100" />
              </>
            )}

            {canDeleteOrSuspend && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(null)
                    setConfirmState({
                      type: "status",
                      user,
                      newStatus: isSuspended ? "active" : "suspended",
                    })
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold transition ${
                    isSuspended
                      ? "text-emerald-700 hover:bg-emerald-50"
                      : "text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  {isSuspended ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : (
                    <Ban className="size-3.5 text-amber-600" />
                  )}
                  <span>{isSuspended ? t.activateBtn : t.suspendBtn}</span>
                </button>

                <div className="my-1 border-t border-gray-100" />
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportUsersReport(
                  [user],
                  "excel",
                  `AqarExit_User_${user.id.slice(0, 6)}`,
                  `${expL.singleUserReportTitle} (${user.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              <Download className="size-3.5 text-[#105C50]" />
              <span>{expL.exportRowBtn}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(null)
                exportUsersReport(
                  [user],
                  "pdf",
                  `AqarExit_User_${user.id.slice(0, 6)}`,
                  `${expL.singleUserReportTitle} (${user.name})`
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <FileText className="size-3.5 text-blue-600" />
              <span>{expL.exportRowPdfBtn}</span>
            </button>

            {canDeleteOrSuspend && (
              <>
                <div className="my-1 border-t border-gray-100" />

                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(null)
                    setConfirmState({
                      type: "delete",
                      user,
                    })
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="size-3.5 text-red-600" />
                  <span>{t.deleteBtn}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

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

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              exportUsersReport(
                filtered,
                "excel",
                "AqarExit_Users_Directory",
                expL.usersReportTitle
              )
            }
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-extrabold text-[#105C50] transition hover:bg-[#105C50] hover:text-white disabled:opacity-40 sm:flex-none"
          >
            <Download className="size-4" />
            <span>{expL.exportAllBtn}</span>
          </button>

          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              exportUsersReport(
                filtered,
                "pdf",
                "AqarExit_Users_Directory",
                expL.usersReportTitle
              )
            }
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-[#0a1122] px-3.5 text-xs font-extrabold text-white transition hover:bg-[#16223f] disabled:opacity-40 sm:flex-none"
          >
            <FileText className="size-4 text-emerald-400" />
            <span>{expL.exportPdfBtn}</span>
          </button>

          <Button
            onClick={() => setOpenAddModal(true)}
            className="h-10 flex-1 rounded-xl bg-[#105C50] px-4 text-xs font-bold text-white hover:bg-[#0c483f] sm:flex-none"
          >
            <UserPlus className="me-1.5 size-4" />
            {t.addBtn}
          </Button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[#105C50]/20 bg-[#eff8f6] p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-[#105C50]">
          <Info className="size-4 shrink-0" />
          <span>{t.rolesGuideTitle}</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {t.rolesGuide.map((item: any) => (
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
            const manageable = canManageUser(user)
            const roleListForRow =
              isCurrentUserOwner ||
              user.role === "admin" ||
              user.role === "owner"
                ? allRoleOptions
                : assignableRoleOptions

            return (
              <div
                key={user.id}
                className={`relative rounded-2xl border bg-white p-4 shadow-xs transition ${
                  isRowLoading
                    ? "border-[#105C50] opacity-75"
                    : user.isOwnerAdmin
                      ? "border-amber-300 bg-amber-50/10"
                      : "border-gray-200/90"
                }`}
              >
                {isRowLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-[#0a1122] px-4 py-2 text-xs font-bold text-white shadow-md">
                      <Loader2 className="size-4 animate-spin text-emerald-400" />
                      <span>{t.updatingText}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#105C50]/10 text-sm font-extrabold text-[#105C50]">
                      {firstLetter}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 font-extrabold text-[#0a1122]">
                        <span className="truncate text-sm">{user.name}</span>
                        {user.isOwnerAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">
                            <Crown className="size-3 text-amber-600" />
                            <span>SUPER ADMIN</span>
                          </span>
                        ) : (
                          isStaffMember(user.role) && (
                            <ShieldCheck className="size-4 shrink-0 text-[#105C50]" />
                          )
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

                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`shrink-0 text-[10px] ${
                        !isSuspended
                          ? "bg-teal-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {!isSuspended ? t.activeBadge : t.suspendedBadge}
                    </Badge>
                    {renderThreeDotsMenu(user, isSuspended)}
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Mail className="size-3.5" />
                      <span>{t.emailLabel}</span>
                    </span>
                    <span
                      dir="ltr"
                      className="flex items-center gap-1 truncate font-medium text-[#0a1122]"
                    >
                      <span className="truncate">{user.email}</span>
                      {user.emailVerified && (
                        <CheckCircle2 className="size-3.5 shrink-0 text-[#105C50]" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Phone className="size-3.5" />
                      <span>{t.phoneLabel}</span>
                    </span>
                    <span
                      dir="ltr"
                      className="flex items-center gap-1 font-medium text-[#0a1122]"
                    >
                      <span>{user.phone}</span>
                      {user.phoneVerified && (
                        <CheckCircle2 className="size-3.5 shrink-0 text-[#105C50]" />
                      )}
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
                  <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-gray-500">
                    <span>{t.roleSelectLabel}</span>
                    {!manageable && (
                      <Lock className="size-3.5 text-amber-600" />
                    )}
                  </label>
                  <select
                    disabled={pending || !manageable}
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
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-75"
                  >
                    {roleListForRow.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(!user.emailVerified || !user.phoneVerified) && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleVerifyUserContact(user)}
                      className="h-9 w-full rounded-xl border-emerald-200 bg-emerald-50 text-xs font-bold text-[#105C50] hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="me-1 size-3.5" />
                      {dict.admin?.propertiesAdmin?.actions?.verifySellerBtn ||
                        t.activateBtn}
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 2. عرض الكمبيوتر الاحترافي */}
      <div className="hidden md:block">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200/85 bg-white px-5 py-3.5 shadow-2xs">
          <div>
            <h3 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
              {t.tableTitle} ({filtered.length})
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">{t.tableDesc}</p>
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-12 items-center gap-4 rounded-xl border border-slate-200/90 bg-slate-100/90 px-5 py-3 text-[11px] font-extrabold text-slate-600">
          <div className="col-span-3">{t.colUser}</div>
          <div className="col-span-3">{t.colActivity}</div>
          <div className="col-span-2">{t.colRole}</div>
          <div className="col-span-2">{t.colStatus}</div>
          <div className="col-span-2 text-end">{t.colAction}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs font-bold text-gray-400">
            {t.emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user, index) => {
              const isSuspended = user.status === "suspended"
              const isRowLoading = pending && activeUserId === user.id
              const manageable = canManageUser(user)
              const roleListForRow =
                isCurrentUserOwner ||
                user.role === "admin" ||
                user.role === "owner"
                  ? allRoleOptions
                  : assignableRoleOptions

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-12 items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 shadow-2xs transition-all hover:shadow-md ${
                    isRowLoading
                      ? "border-[#105C50] bg-emerald-50/40 opacity-70"
                      : isSuspended
                        ? "border-red-200 bg-red-50/20"
                        : user.isOwnerAdmin
                          ? "border-amber-300 border-s-4 border-s-amber-500 bg-amber-50/10"
                          : isStaffMember(user.role)
                            ? "border-emerald-200/90 border-s-4 border-s-[#105C50]"
                            : "border-slate-200/90"
                  }`}
                >
                  <div className="col-span-3 min-w-0 pe-2">
                    <div className="flex items-center gap-2 font-extrabold text-[#0a1122]">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm">{user.name}</span>
                      {user.isOwnerAdmin ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">
                          <Crown className="size-3 text-amber-600" />
                          <span>SUPER ADMIN</span>
                        </span>
                      ) : (
                        isStaffMember(user.role) && (
                          <ShieldCheck className="size-4 shrink-0 text-[#105C50]" />
                        )
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 truncate ps-8 text-xs text-gray-500">
                      <span className="truncate">{user.email}</span>
                      {user.emailVerified && (
                        <span
                          title={propBadges.emailVerifiedBadge}
                          className="inline-flex shrink-0 text-[#105C50]"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </span>
                      )}
                    </div>
                    <div
                      dir="ltr"
                      className="mt-0.5 flex items-center justify-start gap-1 ps-8 text-start font-mono text-[11.5px] font-bold text-slate-700"
                    >
                      <span>{user.phone}</span>
                      {user.phoneVerified && (
                        <span
                          title={propBadges.phoneVerifiedBadge}
                          className="inline-flex text-[#105C50]"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3 border-s border-slate-100 ps-4">
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
                    <div
                      dir="ltr"
                      className="mt-1.5 text-start font-mono text-[11px] text-slate-400"
                    >
                      📅 {new Date(user.created_at).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <div className="col-span-2 border-s border-slate-100 ps-4">
                    <select
                      disabled={pending || !manageable}
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
                      className="h-9 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-[#0a1122] focus:border-[#105C50] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    >
                      {roleListForRow.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 border-s border-slate-100 ps-4">
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
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5 border-s border-slate-100 ps-3">
                    {(!user.emailVerified || !user.phoneVerified) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleVerifyUserContact(user)}
                        className="h-8 rounded-lg border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-[#105C50] hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="me-1 size-3.5" />
                        {dict.admin?.propertiesAdmin?.actions
                          ?.verifySellerBtn || t.activateBtn}
                      </Button>
                    )}

                    {renderThreeDotsMenu(user, isSuspended)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <UserConfirmDialog
        dir={dir}
        t={t}
        confirmState={confirmState}
        pending={pending}
        getRoleLabel={getRoleLabel}
        onClose={() => setConfirmState(null)}
        onExecute={executeConfirmedAction}
      />

      <AddUserDialog
        dir={dir}
        t={t}
        open={openAddModal}
        onOpenChange={setOpenAddModal}
        roleOptions={assignableRoleOptions}
        pending={pending}
        onSubmit={handleCreateUser}
      />
    </div>
  )
}