'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  cancelAccountDeletionAction,
  logoutAccountAction,
  requestAccountDeletionAction,
} from '@/app/actions/account-actions'
import { useTranslation } from '@/lib/i18n'

export function AccountActionLinks({
  unitsCount = 0,
  initialDeletionRequested = false,
  position = 'bottom',
}: {
  unitsCount?: number
  initialDeletionRequested?: boolean
  position?: 'top' | 'bottom'
}) {
  const { t: dict, dir } = useTranslation()
  const t = dict.accountComponents.deleteModal

  const [modalOpen, setModalOpen] = useState(false)
  const [deletionRequested, setDeletionRequested] = useState(
    initialDeletionRequested
  )
  const [reason, setReason] = useState('')
  const [confirmWord, setConfirmWord] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const isConfirmReady =
    confirmWord.trim().toLowerCase() ===
      (t.confirmWordTarget || 'حذف').trim().toLowerCase() ||
    confirmWord.trim() === 'حذف' ||
    confirmWord.trim().toLowerCase() === 'delete'

  const handleRequestDeletion = () => {
    if (!isConfirmReady) return
    setError('')
    startTransition(async () => {
      const res = await requestAccountDeletionAction({ reason })
      if (res.success) {
        setDeletionRequested(true)
      } else {
        setError(res.error || t.errorFallback)
      }
    })
  }

  const handleCancelDeletion = () => {
    startTransition(async () => {
      const res = await cancelAccountDeletionAction()
      if (res.success) {
        setDeletionRequested(false)
        setConfirmWord('')
        setModalOpen(false)
      }
    })
  }

  return (
    <>
      <div
        dir={dir}
        className={`flex flex-wrap items-center gap-3 text-xs font-bold ${
          position === 'bottom'
            ? 'mt-10 justify-start border-t border-gray-200/80 pt-6'
            : 'justify-end'
        }`}
      >
        <Link
          href="/account/details"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:bg-gray-50"
        >
          {t.myDetailsBtn}
        </Link>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-2 py-1.5 text-xs font-bold text-red-600 transition hover:text-red-700 hover:underline"
        >
          {deletionRequested ? t.deletePendingBtn : t.deleteAccountBtn}
        </button>

        <form action={logoutAccountAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:bg-gray-50"
          >
            {t.logoutBtn}
          </button>
        </form>
      </div>

      {modalOpen && (
        <div
          dir={dir}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-2xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-[22px] bg-white p-6 text-start shadow-2xl sm:p-7"
          >
            {!deletionRequested ? (
              <>
                <h3 className="text-xl font-black text-[var(--brand-navy,#0a1122)]">
                  {t.modalTitle}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  {t.modalDesc1}
                </p>
                {unitsCount > 0 && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                    {t.modalUnitsWarnPrefix} {unitsCount}{' '}
                    {t.modalUnitsWarnSuffix}
                  </p>
                )}

                <div className="mt-5">
                  <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                    {t.reasonLabel}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                    {t.confirmInputLabel}
                  </label>
                  <input
                    type="text"
                    value={confirmWord}
                    onChange={(e) => setConfirmWord(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!isConfirmReady || isPending}
                    onClick={handleRequestDeletion}
                    className={`h-11 flex-1 rounded-xl text-xs font-bold text-white transition ${
                      isConfirmReady
                        ? 'bg-[var(--brand-danger,#d9383a)] hover:bg-red-700'
                        : 'cursor-not-allowed bg-[#f49797]'
                    }`}
                  >
                    {isPending ? t.sendingBtn : t.submitDeleteBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-50"
                  >
                    {t.backBtn}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-[var(--brand-navy,#0a1122)]">
                  {t.pendingTitle}
                </h3>
                <p className="mt-3 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-[13px]">
                  {t.pendingBold}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  {t.pendingLine1}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  {t.pendingLine2}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  {t.pendingLine3}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleCancelDeletion}
                    className="h-11 flex-1 rounded-xl bg-[var(--brand-primary,#007a5a)] text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
                  >
                    {isPending ? t.cancellingBtn : t.cancelRequestBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[var(--brand-navy,#0a1122)] hover:bg-gray-50"
                  >
                    {t.backBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
