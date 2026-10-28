'use client'

import { Suspense, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Handshake,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import {
  adminGetDealsRoomDataAction,
  adminManageOfferLifecycleAction,
} from '@/actions/offer-actions'
import { getLocalizedGeorgiaAreaName } from '@/components/shared/georgia-areas'
import { getCurrencySymbol, useTranslation } from '@/lib/i18n'

const PENDING_ADMIN_TAG = '__PENDING_ADMIN_VERIFICATION__'

function generateOfferRefCode(offerId: string): string {
  const clean = String(offerId || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  return `OF-${clean.slice(0, 6) || '1001'}`
}

function deriveUnitCode(id: string) {
  const digits = String(id || '').replace(/\D/g, '')
  const num = digits ? Number(digits.slice(-4)) : 100
  return `U-${String(num).padStart(5, '0')}`
}

function cleanAreaDisplay(rawArea: string | null | undefined, locale: string) {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale as any)
  if (locale === 'ar') {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, '').trim()
  }
  return localized
}

function isSelfOfferClient(offer: any, unit: any): boolean {
  if (!offer || !unit) return false
  if (
    offer.buyer_user_id &&
    unit.user_id &&
    String(offer.buyer_user_id) === String(unit.user_id)
  ) {
    return true
  }
  const bPhone = String(offer.buyer_phone || '').replace(/\D/g, '')
  const sPhone = String(unit.phone || '').replace(/\D/g, '')
  if (
    bPhone.length >= 8 &&
    sPhone.length >= 8 &&
    bPhone.slice(-8) === sPhone.slice(-8)
  ) {
    return true
  }
  return false
}

function normalizeDealOffer(raw: any) {
  const rawDiffs = Array.isArray(raw?.diff_reasons) ? raw.diff_reasons : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)
  let effectiveStatus = raw?.status || 'pending_admin'

  if (
    raw?.status === 'pending_admin' ||
    (raw?.status === 'recommended' &&
      (raw?.initiated_by === 'buyer' || hasPendingAdminTag))
  ) {
    effectiveStatus = 'pending_admin'
  }

  return {
    ...raw,
    id: String(raw.id),
    property_id: String(raw.property_id),
    status: effectiveStatus,
  }
}

function AdminDealsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetOfferId = searchParams.get('offerId')
  const initialTabParam = searchParams.get('tab')

  const { t: dict, locale, dir, isRtl, siteSettings } = useTranslation()
  const adminDict = (dict?.admin as Record<string, any>) || {}
  const d = (adminDict.dealsPage as Record<string, any>) || {}
  const sm = (adminDict.smartMatch as Record<string, any>) || {}

  const cur = getCurrencySymbol('GE', locale)
  const commPct = Number(siteSettings?.buyerCommission) || 1.25

  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<any[]>([])
  const [unitsMap, setUnitsMap] = useState<Record<string, any>>({})
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending_admin' | 'accepted' | 'negotiating' | 'backup_rejected'
  >(
    initialTabParam === 'accepted'
      ? 'accepted'
      : initialTabParam === 'pending_admin'
        ? 'pending_admin'
        : 'all'
  )

  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadDeals() {
    setLoading(true)
    try {
      const res = await adminGetDealsRoomDataAction()

      const uMap: Record<string, any> = {}
      ;(res.units || []).forEach((u: any) => {
        uMap[String(u.id)] = u
      })

      const normalizedOffers = (res.offers || [])
        .map(normalizeDealOffer)
        .filter((o: any) => {
          if (o.status === 'recommended') return false
          const u = uMap[String(o.property_id)]
          if (!u || isSelfOfferClient(o, u)) return false
          return true
        })

      setUnitsMap(uMap)
      setOffers(normalizedOffers)

      if (targetOfferId && normalizedOffers.length > 0) {
        const found = normalizedOffers.find(
          (o: any) => String(o.id) === String(targetOfferId)
        )
        if (found) {
          setActiveTab('all')
          setTimeout(() => {
            const el = document.getElementById(`deal-card-${targetOfferId}`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 250)
        }
      }
    } catch (e) {
      console.error('Error loading deals:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
  }, [targetOfferId])

  const handleLifecycleAction = (
    offerId: string,
    action:
      | 'approve_to_seller'
      | 'reopen_unit_offers'
      | 'mark_unit_sold'
      | 'reject_offer',
    successText: string
  ) => {
    setProcessingId(offerId)
    setNotice(null)
    startTransition(async () => {
      try {
        const res = await adminManageOfferLifecycleAction({
          offerId,
          action,
        })
        if (res.success) {
          setNotice({ text: successText })
          await loadDeals()
          router.refresh()
        } else {
          setNotice({
            text: res.error || d.actionErrorFallback,
            isError: true,
          })
        }
      } finally {
        setProcessingId(null)
      }
    })
  }

  const counts = useMemo(() => {
    return {
      all: offers.length,
      pending_admin: offers.filter((o) => o.status === 'pending_admin').length,
      accepted: offers.filter(
        (o) =>
          o.status === 'accepted' &&
          unitsMap[String(o.property_id)]?.status !== 'sold'
      ).length,
      negotiating: offers.filter(
        (o) => o.status === 'pending_seller' || o.status === 'counter_offered'
      ).length,
      backup_rejected: offers.filter(
        (o) =>
          o.status === 'unit_locked' ||
          o.status === 'rejected' ||
          (o.status === 'accepted' &&
            unitsMap[String(o.property_id)]?.status === 'sold')
      ).length,
    }
  }, [offers, unitsMap])

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const unit = unitsMap[String(o.property_id)]
      if (!unit) return false

      if (activeTab === 'pending_admin' && o.status !== 'pending_admin')
        return false
      if (
        activeTab === 'accepted' &&
        (o.status !== 'accepted' || unit.status === 'sold')
      )
        return false
      if (
        activeTab === 'negotiating' &&
        o.status !== 'pending_seller' &&
        o.status !== 'counter_offered'
      )
        return false
      if (
        activeTab === 'backup_rejected' &&
        o.status !== 'unit_locked' &&
        o.status !== 'rejected' &&
        !(o.status === 'accepted' && unit.status === 'sold')
      )
        return false

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const qDigits = q.replace(/\D/g, '')
        const buyerDigits = String(o.buyer_phone || '').replace(/\D/g, '')
        const sellerDigits = String(unit.phone || '').replace(/\D/g, '')
        const refCode = generateOfferRefCode(o.id).toLowerCase()
        const uCode = deriveUnitCode(unit.id).toLowerCase()
        const haystack =
          `${o.id} ${refCode} ${uCode} ${o.buyer_name || ''} ${o.buyer_phone || ''} ${unit.project_name || ''} ${unit.name || ''} ${unit.phone || ''}`.toLowerCase()
        const phoneMatched =
          qDigits.length >= 5 &&
          (buyerDigits.includes(qDigits) || sellerDigits.includes(qDigits))

        if (!haystack.includes(q) && !phoneMatched) return false
      }

      return true
    })
  }, [offers, unitsMap, activeTab, search])

  return (
    <div dir={dir} className="mx-auto max-w-6xl text-start">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-[#105C50]">
            <Handshake className="size-3.5" />
            <span>{d.eyebrow}</span>
          </div>
          <h1 className="mt-1.5 text-xl font-black text-[#0a1122] sm:text-2xl">
            {d.title}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{d.subtitle}</p>
        </div>

        <Link
          href="/admin"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-extrabold text-[#0a1122] shadow-2xs hover:bg-gray-50"
        >
          {isRtl ? (
            <ArrowRight className="size-3.5" />
          ) : (
            <ArrowLeft className="size-3.5" />
          )}
          <span>{d.backToDashboardBtn}</span>
        </Link>
      </div>

      {notice && (
        <div
          className={`mb-5 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-extrabold shadow-xs sm:text-sm ${
            notice.isError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-[#105C50]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0" />
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

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200/85 bg-white p-3.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={d.searchPlaceholder}
            className="h-9 w-full rounded-xl border border-gray-200 ps-3 pe-9 text-xs font-semibold focus:border-[#105C50] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all' as const, label: `${d.tabAll} (${counts.all})` },
            {
              id: 'pending_admin' as const,
              label: `${d.tabPendingAdmin} (${counts.pending_admin})`,
              alert: counts.pending_admin > 0,
            },
            {
              id: 'accepted' as const,
              label: `🔥 ${d.tabAccepted} (${counts.accepted})`,
              highlight: counts.accepted > 0,
            },
            {
              id: 'negotiating' as const,
              label: `${d.tabNegotiating} (${counts.negotiating})`,
            },
            {
              id: 'backup_rejected' as const,
              label: `${d.tabBackupRejected} (${counts.backup_rejected})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                activeTab === tab.id
                  ? 'bg-[#0a1122] text-white shadow-2xs'
                  : tab.alert
                    ? 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                    : tab.highlight
                      ? 'bg-emerald-100 text-[#105C50] hover:bg-emerald-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-gray-200 bg-white p-10">
          <div className="flex items-center gap-2 text-xs font-bold text-[#105C50]">
            <Loader2 className="size-5 animate-spin" />
            <span>{d.loadingText}</span>
          </div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <Wallet className="mx-auto mb-3 size-9 text-gray-300" />
          <p className="text-sm font-extrabold text-[#0a1122]">{d.emptyText}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const unit = unitsMap[String(offer.property_id)]
            if (!unit) return null

            const offerRef = generateOfferRefCode(offer.id)
            const uCode = deriveUnitCode(unit.id)
            const areaName = cleanAreaDisplay(unit.area, locale)
            const offeredCash = Number(offer.offered_cash) || 0
            const requiredCash =
              Number(unit.paid_amount || offer.required_cash) || 0
            const contractPrice = Number(unit.contract_price) || requiredCash
            const commissionAmount = Math.round(
              contractPrice * (commPct / 100)
            )
            const isHighlighted = String(targetOfferId) === String(offer.id)
            const isCardBusy = isPending && processingId === offer.id

            const buyerWaMsg = `${d.waBuyerGreetingPrefix} ${offer.buyer_name || ''}، ${d.waBuyerBodyPrefix} (${offerRef}) — (${unit.project_name || ''} - ${uCode}) — (${offeredCash.toLocaleString('en-US')} ${cur}).`
            const sellerWaMsg = `${d.waSellerGreetingPrefix} ${unit.name || ''}، ${d.waSellerBodyPrefix} (${offerRef}) — (${unit.project_name || ''} - ${uCode}) — (${offeredCash.toLocaleString('en-US')} ${cur}).`

            return (
              <div
                id={`deal-card-${offer.id}`}
                key={offer.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition ${
                  isHighlighted
                    ? 'border-2 border-[#105C50] ring-4 ring-[#105C50]/15'
                    : offer.status === 'accepted'
                      ? 'border-2 border-[#105C50] bg-emerald-50/15'
                      : offer.status === 'pending_admin'
                        ? 'border-2 border-amber-400 bg-amber-50/10'
                        : 'border-gray-200/90'
                }`}
              >
                {isCardBusy && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                    <Loader2 className="size-6 animate-spin text-[#105C50]" />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#0a1122] px-2.5 py-1 font-mono text-xs font-black text-emerald-300">
                      #{offerRef}
                    </span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-[11px] font-bold text-gray-700">
                      {uCode}
                    </span>
                    <Link
                      href={`/admin/properties?unitId=${unit.id}`}
                      className="text-sm font-black text-[#0a1122] hover:text-[#105C50] hover:underline sm:text-base"
                    >
                      {unit.project_name || d.unitFallback} · {areaName}
                    </Link>
                    <Link
                      href={`/opportunities/${unit.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10.5px] font-bold text-gray-600 hover:text-[#105C50]"
                    >
                      <ExternalLink className="size-3" />
                      <span>{sm.viewUnitBtn || d.previewBtn}</span>
                    </Link>
                  </div>

                  <div>
                    {offer.status === 'pending_admin' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-extrabold text-white shadow-2xs">
                        <Clock className="size-3.5" />
                        <span>{d.statusPendingAdmin}</span>
                      </span>
                    )}
                    {offer.status === 'pending_seller' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-extrabold text-blue-900">
                        <Flame className="size-3.5 text-blue-700" />
                        <span>{d.statusPendingSeller}</span>
                      </span>
                    )}
                    {offer.status === 'counter_offered' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-extrabold text-purple-900">
                        <RefreshCw className="size-3.5" />
                        <span>
                          {d.statusCounterPrefix} (
                          <span dir="ltr">
                            {Number(offer.counter_cash || 0).toLocaleString(
                              'en-US'
                            )}{' '}
                            {cur}
                          </span>
                          )
                        </span>
                      </span>
                    )}
                    {offer.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#105C50] px-4 py-1 text-xs font-extrabold text-white shadow-sm">
                        <Handshake className="size-3.5" />
                        <span>
                          {unit.status === 'sold'
                            ? d.statusSoldDone
                            : d.statusAcceptedReady}
                        </span>
                      </span>
                    )}
                    {offer.status === 'unit_locked' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        <Lock className="size-3" />
                        <span>{d.statusBackupWaiting}</span>
                      </span>
                    )}
                    {offer.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        <span>{d.statusRejected}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5">
                    <span className="block text-[10.5px] font-extrabold text-gray-400">
                      👤 {d.buyerPartyHeader}
                    </span>
                    <strong className="mt-1 block text-sm font-black text-[#0a1122]">
                      {offer.buyer_name || d.buyerFallback}
                    </strong>
                    <p
                      dir="ltr"
                      className="mt-0.5 text-start font-mono text-xs font-bold text-gray-700"
                    >
                      {offer.buyer_phone || '—'}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-gray-500">
                      ⚡ {d.readinessLabel}:{' '}
                      {offer.payment_readiness === '48h'
                        ? d.readiness48h
                        : offer.payment_readiness === '1_week'
                          ? d.readiness1Week
                          : d.readiness2Weeks}{' '}
                      ·{' '}
                      {offer.payment_method === 'bank_check'
                        ? d.methodCheck
                        : d.methodTransfer}
                    </p>
                    {offer.buyer_phone && (
                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(offer.buyer_phone).replace(/\D/g, '')}?text=${encodeURIComponent(buyerWaMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-extrabold text-white hover:opacity-95"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>{sm.contactBuyerWa || d.buyerWaBtn}</span>
                      </a>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5">
                    <span className="block text-[10.5px] font-extrabold text-gray-400">
                      🏠 {d.sellerPartyHeader}
                    </span>
                    <strong className="mt-1 block text-sm font-black text-[#0a1122]">
                      {unit.name || d.sellerFallback}
                    </strong>
                    <p
                      dir="ltr"
                      className="mt-0.5 text-start font-mono text-xs font-bold text-gray-700"
                    >
                      {unit.phone || '—'}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-gray-500">
                      {d.originalRequiredCashLabel}:{' '}
                      <strong dir="ltr" className="text-[#0a1122]">
                        {requiredCash.toLocaleString('en-US')} {cur}
                      </strong>
                    </p>
                    {unit.phone && (
                      <a
                        data-admin-client-wa="true"
                        href={`https://wa.me/${String(unit.phone).replace(/\D/g, '')}?text=${encodeURIComponent(sellerWaMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0a1122] px-3 text-xs font-extrabold text-white hover:bg-[#16223f]"
                      >
                        <MessageCircle className="size-3.5 text-[#25D366]" />
                        <span>{sm.contactSellerWa || d.sellerWaBtn}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-[#effaf5] p-3.5">
                    <div>
                      <span className="block text-[10.5px] font-extrabold text-[#105C50]">
                        💰 {d.offeredCashHeader}
                      </span>
                      <strong
                        dir="ltr"
                        className="mt-1 block text-xl font-black text-[#105C50] tabular-nums"
                      >
                        {offeredCash.toLocaleString('en-US')} {cur}
                      </strong>
                      {offer.counter_cash && (
                        <p className="mt-1 text-[11px] font-extrabold text-purple-800">
                          🔄 {d.counterOfferLabel}:{' '}
                          <span dir="ltr">
                            {Number(offer.counter_cash).toLocaleString('en-US')}{' '}
                            {cur}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 border-t border-emerald-200/70 pt-2 text-xs">
                      <span className="text-gray-600">
                        {sm.commissionDueLabel || d.platformCommissionLabel} (
                        {commPct}%):{' '}
                      </span>
                      <strong
                        dir="ltr"
                        className="font-black text-[#0a1122] tabular-nums"
                      >
                        {commissionAmount.toLocaleString('en-US')} {cur}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-gray-100 pt-3.5">
                  <span className="text-[11px] text-gray-400">
                    {d.offerDateLabel}:{' '}
                    <span dir="ltr">
                      {offer.created_at
                        ? new Date(offer.created_at).toLocaleDateString('en-GB')
                        : '—'}
                    </span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {offer.status === 'pending_admin' && (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleLifecycleAction(
                              offer.id,
                              'approve_to_seller',
                              `${d.noticeApprovedToSeller} (${offerRef}) ✓`
                            )
                          }
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#105C50] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0c483f]"
                        >
                          <Send className="size-3.5" />
                          <span>{d.approveToSellerBtn}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleLifecycleAction(
                              offer.id,
                              'reject_offer',
                              `${d.noticeOfferRejected} (${offerRef})`
                            )
                          }
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <XCircle className="size-3.5" />
                          <span>{d.rejectOfferBtn}</span>
                        </button>
                      </>
                    )}

                    {offer.status === 'accepted' && unit.status !== 'sold' && (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleLifecycleAction(
                              offer.id,
                              'mark_unit_sold',
                              `🎉 ${d.noticeUnitMarkedSold} (${unit.project_name || ''})`
                            )
                          }
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#105C50] px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0c483f]"
                        >
                          <Check className="size-4" />
                          <span>{d.markUnitSoldBtn}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleLifecycleAction(
                              offer.id,
                              'reopen_unit_offers',
                              `${d.noticeReopenedBackups} (${offer.buyer_name || ''}) ✓`
                            )
                          }
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-extrabold text-amber-900 transition hover:bg-amber-100"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>{d.reopenBackupOffersBtn}</span>
                        </button>
                      </>
                    )}

                    {(offer.status === 'pending_seller' ||
                      offer.status === 'counter_offered') && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleLifecycleAction(
                            offer.id,
                            'reject_offer',
                            `${d.noticeOfferRejected} (${offerRef})`
                          )
                        }
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        <XCircle className="size-3.5" />
                        <span>{d.cancelOfferBtn}</span>
                      </button>
                    )}

                    {(offer.status === 'unit_locked' ||
                      offer.status === 'rejected') && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleLifecycleAction(
                            offer.id,
                            'approve_to_seller',
                            `${d.noticeApprovedToSeller} (${offerRef}) ✓`
                          )
                        }
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-extrabold text-[#105C50] hover:bg-emerald-100"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>{d.reactivateToSellerBtn}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminDealsPage() {
  return (
    <Suspense fallback={null}>
      <AdminDealsContent />
    </Suspense>
  )
}