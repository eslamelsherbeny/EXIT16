"use client"

import { Loader2, ShieldAlert, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AdminUserRow, ConfirmActionState } from "./users-table"

export function UserConfirmDialog({
  dir,
  t,
  confirmState,
  pending,
  getRoleLabel,
  onClose,
  onExecute,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  confirmState: ConfirmActionState | null
  pending: boolean
  getRoleLabel: (role: string) => string
  onClose: () => void
  onExecute: () => void
}) {
  return (
    <Dialog
      open={Boolean(confirmState)}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
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
                  &ldquo;{confirmState.user.name}&rdquo;
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
                onClick={onClose}
                className="rounded-xl text-xs font-bold"
              >
                {t.cancelBtn}
              </Button>

              <Button
                type="button"
                disabled={pending}
                onClick={onExecute}
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
  )
}

export function AddUserDialog({
  dir,
  t,
  open,
  onOpenChange,
  roleOptions,
  pending,
  onSubmit,
}: {
  dir: "rtl" | "ltr"
  t: Record<string, any>
  open: boolean
  onOpenChange: (val: boolean) => void
  roleOptions: Array<{ value: string; label: string }>
  pending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md text-start">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {t.addModalTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t.addModalDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-4">
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
              onClick={() => onOpenChange(false)}
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
  )
}