'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  cancelAccountDeletionAction,
  logoutAccountAction,
  requestAccountDeletionAction,
} from '@/app/actions/account-actions'

export function AccountActionLinks({
  unitsCount = 0,
  initialDeletionRequested = false,
  position = 'bottom',
}: {
  unitsCount?: number
  initialDeletionRequested?: boolean
  position?: 'top' | 'bottom'
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [deletionRequested, setDeletionRequested] = useState(
    initialDeletionRequested
  )
  const [reason, setReason] = useState('')
  const [confirmWord, setConfirmWord] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const isConfirmReady = confirmWord.trim() === 'حذف'

  const handleRequestDeletion = () => {
    if (!isConfirmReady) return
    setError('')
    startTransition(async () => {
      const res = await requestAccountDeletionAction({ reason })
      if (res.success) {
        setDeletionRequested(true)
      } else {
        setError(res.error || 'تعذر إرسال الطلب')
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
        className={`flex flex-wrap items-center gap-3 text-xs font-bold ${
          position === 'bottom'
            ? 'mt-10 justify-start border-t border-gray-200/80 pt-6'
            : 'justify-end'
        }`}
      >
        <Link
          href="/account/details"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[#0a1122] shadow-2xs transition hover:bg-gray-50"
        >
          بياناتي
        </Link>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-2 py-1.5 text-xs font-bold text-red-600 transition hover:text-red-700 hover:underline"
        >
          {deletionRequested ? 'طلب الحذف قيد المراجعة' : 'حذف الحساب'}
        </button>

        <form action={logoutAccountAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[#0a1122] shadow-2xs transition hover:bg-gray-50"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>

      {/* نافذة حذف الحساب المطابقة للصور 43 و 44 و 45 */}
      {modalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-2xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-[22px] bg-white p-6 text-right shadow-2xl sm:p-7"
          >
            {!deletionRequested ? (
              <>
                <h3 className="text-xl font-black text-[#0a1122]">
                  حذف الحساب
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  هنسجّل طلب بحذف حسابك، والفريق هيراجعه. وحداتك هتتشال من السوق
                  فوراً.
                </p>
                {unitsCount > 0 && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                    لما الطلب يتقبل هيتم حذف {unitsCount} وحدة سجلتها بالكامل،
                    بالصور والمستندات — والخطوة دي مش بترجع.
                  </p>
                )}

                <div className="mt-5">
                  <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                    ليه حابب تمشي؟ (اختياري)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold text-[#0a1122]">
                    اكتب «حذف» للتأكيد
                  </label>
                  <input
                    type="text"
                    value={confirmWord}
                    onChange={(e) => setConfirmWord(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-[#0a1122] focus:border-[#0b6954] focus:outline-none"
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
                        ? 'bg-[#dc2626] hover:bg-red-700'
                        : 'cursor-not-allowed bg-[#f49797]'
                    }`}
                  >
                    {isPending ? 'جاري الإرسال...' : 'ابعت طلب الحذف'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
                  >
                    رجوع
                  </button>
                </div>
              </>
            ) : (
              /* المرحلة الثانية بعد إرسال طلب الحذف (الصورة 45) */
              <>
                <h3 className="text-xl font-black text-[#0a1122]">
                  طلب حذف الحساب
                </h3>
                <p className="mt-3 text-xs font-extrabold text-[#0a1122] sm:text-[13px]">
                  استلمنا طلبك وهو تحت المراجعة.
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  وحداتك اتشالت من السوق دلوقتي، فمحدش هيشوفها أو يسأل عنها.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  لو مرجعناش خلال 30 يوم، الحساب هيتحذف تلقائياً.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  غيّرت رأيك؟ الغِ الطلب وهترجع وحداتك للسوق زي ما كانت.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleCancelDeletion}
                    className="h-11 flex-1 rounded-xl bg-[#0b6954] text-xs font-bold text-white transition hover:bg-[#095443]"
                  >
                    {isPending ? 'جاري الإلغاء...' : 'الغِ الطلب'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[#0a1122] hover:bg-gray-50"
                  >
                    رجوع
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