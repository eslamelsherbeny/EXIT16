'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { verifyUserContactByAdminAction } from '@/actions/admin-actions'
import { useTranslation } from '@/lib/i18n'

export function AdminAutoVerifyFromWhatsAppLink() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t: dict } = useTranslation()
  const cv = (dict.admin as Record<string, any>)?.contactVerification || {}
  const [bannerMsg, setBannerMsg] = useState('')

  useEffect(() => {
    const verifyPhoneUserId = searchParams.get('verifyPhoneUserId')
    const verifyEmailUserId = searchParams.get('verifyEmailUserId')

    if (!verifyPhoneUserId && !verifyEmailUserId) return

    const targetUserId = verifyPhoneUserId || verifyEmailUserId || ''
    const type =
      verifyPhoneUserId && verifyEmailUserId
        ? 'both'
        : verifyPhoneUserId
          ? 'phone'
          : 'email'

    verifyUserContactByAdminAction({ userId: targetUserId, type }).then(
      (res) => {
        if (res.success) {
          setBannerMsg(cv.waLinkVerifiedBanner || '')
          router.refresh()
        }
      }
    )
  }, [searchParams, router, cv.waLinkVerifiedBanner])

  if (!bannerMsg) return null

  return (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-[#007a5a] shadow-2xs">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>{bannerMsg}</span>
      </div>
      <button
        type="button"
        onClick={() => setBannerMsg('')}
        className="text-xs font-bold underline"
      >
        {cv.closeBtn || '✕'}
      </button>
    </div>
  )
}

export function AdminContactVerificationBadge({
  userId,
  type,
  isVerified,
}: {
  userId?: string | null
  type: 'email' | 'phone'
  isVerified?: boolean
}) {
  const router = useRouter()
  const { t: dict } = useTranslation()
  const cv = (dict.admin as Record<string, any>)?.contactVerification || {}
  const [verified, setVerified] = useState(Boolean(isVerified))
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setVerified(Boolean(isVerified))
  }, [isVerified])

  const handleManualVerify = () => {
    if (!userId || verified) return
    startTransition(async () => {
      const res = await verifyUserContactByAdminAction({
        userId,
        type,
      })
      if (res.success) {
        setVerified(true)
        router.refresh()
      }
    })
  }

  if (verified) {
    return (
      <span
        title={
          type === 'email' ? cv.emailVerifiedTitle : cv.phoneVerifiedTitle
        }
        className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-[#007a5a]"
      >
        <CheckCircle2 className="size-3 shrink-0" />
        <span>{cv.verifiedBadge}</span>
      </span>
    )
  }

  if (!userId) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
        {cv.unverifiedBadge}
      </span>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleManualVerify}
      title={cv.clickToVerifyTitle}
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-[#007a5a]"
    >
      {isPending ? (
        <Loader2 className="size-2.5 animate-spin" />
      ) : (
        <ShieldCheck className="size-3" />
      )}
      <span>{cv.verifyNowBtn}</span>
    </button>
  )
}