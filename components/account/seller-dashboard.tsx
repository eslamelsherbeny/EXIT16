'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Copy,
  FileCheck2,
  Loader2,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import {
  cancelUnitPromotionBySellerAction,
  deleteUnitBySellerAction,
  requestUnitPromotionAction,
  toggleSellerUnitStatusAction,
} from '@/app/actions/account-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AccountActionLinks } from './delete-account-modal'

export type SellerUnitItem = {
  id: string
  project_name: string | null
  developer_name: string | null
  area: string | null
  unit_type: string | null
  size: number | null
  rooms: number | null
  bathrooms: number | null
  finishing: string | null
  delivery_status: string | null
  description: string | null
  contract_price: number | null
  paid_amount: number | null
  market_price: number | null
  installment_amount: number | null
  installment_frequency: string | null
  contract_year: number | null
  willing_to_discount: boolean | null
  has_overdue_installments: boolean | null
  status: string | null
  submission_type?: string | null
  admin_note: string | null
  images: string[] | null
  documents: Record<string, any> | null
  is_featured?: boolean | null
  featured_days?: number | null
  featured_price?: number | null
  featured_status?: string | null
  featured_fawry_code?: string | null
  featured_until?: string | null
  created_at: string | null
}

const PROMO_PACKAGES: Array<{ days: 7 | 14 | 30; price: number; label: string }> = [
  { days: 7, price: 1199, label: '7 أيام' },
  { days: 14, price: 1999, label: '14 أيام' },
  { days: 30, price: 2799, label: '30 أيام' },
]

function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('en-US')} ج.م`
}

function calculateUnitCompletion(unit: SellerUnitItem) {
  const checks = [
    Boolean(unit.developer_name),
    Boolean(unit.project_name),
    Boolean(unit.area),
    Boolean(unit.unit_type),
    Number(unit.size) > 0,
    Number(unit.rooms) > 0,
    Number(unit.bathrooms) > 0,
    Boolean(unit.finishing),
    Boolean(unit.delivery_status),
    Boolean(unit.description),
    Number(unit.contract_price) > 0,
    Number(unit.paid_amount) > 0,
    Number(unit.market_price) > 0,
    Number(unit.installment_amount) >= 0 && unit.installment_amount !== null,
    Boolean(unit.installment_frequency),
    Number(unit.contract_year) > 0,
    unit.willing_to_discount !== null && unit.willing_to_discount !== undefined,
    Array.isArray(unit.images) && unit.images.length > 0,
  ]

  const total = 18
  const completedCount = checks.filter(Boolean).length
  const hasImages = Array.isArray(unit.images) && unit.images.length > 0

  const percentage = hasImages
    ? Math.round((completedCount / total) * 100)
    : Math.min(94, Math.round((completedCount / total) * 100))

  const missingTags: string[] = []
  if (!hasImages) missingTags.push('الصور')
  if (!unit.area || !unit.unit_type || !unit.size)
    missingTags.push('تفاصيل الوحدة')

  return {
    completedCount: hasImages ? 18 : Math.min(17, Math.max(16, completedCount)),
    total,
    percentage: hasImages && completedCount >= 16 ? 100 : percentage,
    hasImages,
    missingTags,
  }
}

function getSellerTimelineAndStatus(unit: SellerUnitItem, isComplete: boolean) {
  const clean = (unit.status || 'pending').trim().toLowerCase()

  switch (clean) {
    case 'active':
    case 'approved':
    case 'published':
      return {
        code: 'active',
        stepIndex: 4,
        marketBadge: '🟢 منشورة في السوق',
        marketBadgeCls: 'bg-emerald-100 text-[#0b6954]',
        unitSubtext: 'منشورة في السوق أمام المشترين',
        headline: 'وحدتك معتمدة ومنشورة الآن أمام المشترين في السوق 🎉',
      }
    case 'paused_by_seller':
      return {
        code: 'paused_by_seller',
        stepIndex: 2,
        marketBadge: '⏸ متوقفة مؤقتاً بواسطتك',
        marketBadgeCls: 'bg-amber-100 text-amber-800',
        unitSubtext: 'متوقفة مؤقتاً بواسطتك (غير ظاهرة بالسوق)',
        headline: 'أوقفت عرض هذه الوحدة مؤقتاً — يمكنك إعادة عرضها في أي وقت',
      }
    case 'paused_deletion':
      return {
        code: 'paused_deletion',
        stepIndex: 2,
        marketBadge: 'مخفية مؤقتاً',
        marketBadgeCls: 'bg-gray-100 text-gray-600',
        unitSubtext: 'مخفية بسبب طلب حذف الحساب',
        headline: 'الوحدة مخفية حالياً من السوق بسبب طلب حذف الحساب',
      }
    case 'offer_received':
      return {
        code: 'offer_received',
        stepIndex: 5,
        marketBadge: '💰 عليها عرض شراء',
        marketBadgeCls: 'bg-purple-100 text-purple-800',
        unitSubtext: 'عندك عرض شراء جاد',
        headline: 'لديك عرض شراء جاد على وحدتك! 💰',
      }
    case 'transferring':
      return {
        code: 'transferring',
        stepIndex: 6,
        marketBadge: '📄 مرحلة نقل التعاقد',
        marketBadgeCls: 'bg-blue-100 text-blue-800',
        unitSubtext: 'نقل التعاقد (بنراجع المستندات)',
        headline: 'وحدتك في مرحلة مراجعة المستندات ونقل التعاقد 📄',
      }
    case 'sold':
      return {
        code: 'sold',
        stepIndex: 8,
        marketBadge: '🏆 تم البيع',
        marketBadgeCls: 'bg-teal-700 text-white',
        unitSubtext: 'تمت عملية البيع بنجاح',
        headline: 'مبروك! تمت عملية بيع وحدتك ونقل التعاقد بنجاح 🏆',
      }
    case 'rejected':
      return {
        code: 'rejected',
        stepIndex: 1,
        marketBadge: '⚠️ تحتاج تعديل بيانات',
        marketBadgeCls: 'bg-red-100 text-red-700',
        unitSubtext: 'تحتاج لمراجعة وتعديل البيانات',
        headline: 'يرجى مراجعة وتحديث بيانات وحدتك لإعادة النشر',
      }
    default:
      if (!isComplete) {
        return {
          code: 'incomplete',
          stepIndex: 1,
          marketBadge: '📝 بانتظار استكمال الصور',
          marketBadgeCls: 'bg-amber-100 text-amber-800',
          unitSubtext: 'غير منشورة بعد — بانتظار استكمال الصور',
          headline: 'فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك',
        }
      }
      return {
        code: 'pending_review',
        stepIndex: 2,
        marketBadge: '⏳ قيد مراجعة الإدارة',
        marketBadgeCls: 'bg-amber-50 text-amber-800 border border-amber-200',
        unitSubtext:
          unit.submission_type === 'resumed_by_seller'
            ? 'معاد عرضها — قيد مراجعة الإدارة (غير منشورة بعد)'
            : unit.submission_type === 'edited_by_seller'
              ? 'معدّلة — قيد مراجعة الإدارة (غير منشورة بعد)'
              : 'قيد المراجعة — لم تُنشر في السوق بعد',
        headline: 'بياناتك وصلت! فريقنا بيراجع الوحدة وينشرها في السوق قريب',
      }
  }
}

type ConfirmModalState =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'delete' }
  | { type: 'promote'; pkg: { days: 7 | 14 | 30; price: number; label: string } }
  | { type: 'cancel_promo' }
  | null

export function SellerDashboard({
  sells,
  initialSelectedUnitId,
  offersCountMap = {},
  matchedBuyersCountMap = {},
  deletionRequested = false,
}: {
  sells: SellerUnitItem[]
  initialSelectedUnitId?: string
  offersCountMap?: Record<string, number>
  matchedBuyersCountMap?: Record<string, number>
  deletionRequested?: boolean
}) {
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedUnitId && sells.some((s) => s.id === initialSelectedUnitId)
      ? initialSelectedUnitId
      : sells[0]?.id || ''
  )
  const [showAllUnitsList, setShowAllUnitsList] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null)
  const [selectedPromoDays, setSelectedPromoDays] = useState<7 | 14 | 30 | null>(
    null
  )
  const [generatedAdRef, setGeneratedAdRef] = useState<string | null>(null)
  const [copiedAdRef, setCopiedAdRef] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeUnit = sells.find((s) => s.id === selectedId) || sells[0]
  if (!activeUnit) return null

  const comp = calculateUnitCompletion(activeUnit)
  const isComplete = comp.percentage === 100
  const meta = getSellerTimelineAndStatus(activeUnit, isComplete)
  const isPausedBySeller = meta.code === 'paused_by_seller'

  const realMatchedBuyersCount = matchedBuyersCountMap[activeUnit.id] ?? 0

  const uploadedDocsCount = activeUnit.documents
    ? Object.keys(activeUnit.documents).filter(
        (k) => activeUnit.documents?.[k]?.url
      ).length
    : 0

  const unitOffersCount = offersCountMap[activeUnit.id] || 0

  const editUnitHref = !comp.hasImages
    ? `/sell?editUnitId=${activeUnit.id}&step=5`
    : `/sell?editUnitId=${activeUnit.id}&step=3`

  const isCurrentlyFeatured =
    Boolean(activeUnit.is_featured) &&
    (!activeUnit.featured_until ||
      new Date(activeUnit.featured_until) > new Date())

  const isPendingPromo =
    !isCurrentlyFeatured && activeUnit.featured_status === 'pending_payment'

  const remainingFeaturedDays =
    isCurrentlyFeatured && activeUnit.featured_until
      ? Math.max(
          1,
          Math.ceil(
            (new Date(activeUnit.featured_until).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : activeUnit.featured_days || 0

  const currentAdRef =
    generatedAdRef || activeUnit.featured_fawry_code || null

  const activePromoDays =
    selectedPromoDays || (activeUnit.featured_days as 7 | 14 | 30) || 14
  const activePromoPrice =
    PROMO_PACKAGES.find((p) => p.days === activePromoDays)?.price ||
    activeUnit.featured_price ||
    1999

  const executeConfirmedAction = () => {
    if (!confirmModal) return
    setActionMessage('')

    startTransition(async () => {
      if (confirmModal.type === 'pause' || confirmModal.type === 'resume') {
        const nextAction = confirmModal.type
        const res = await toggleSellerUnitStatusAction({
          unitId: activeUnit.id,
          action: nextAction,
        })
        setConfirmModal(null)
        if (res.success) {
          setActionMessage(
            nextAction === 'pause'
              ? 'تم إيقاف عرض الوحدة مؤقتاً وإخفاؤها من السوق.'
              : 'تم إرسال طلب إعادة عرض الوحدة للإدارة للمراجعة والنشر ✓'
          )
        }
      } else if (confirmModal.type === 'delete') {
        const res = await deleteUnitBySellerAction(activeUnit.id)
        setConfirmModal(null)
        if (res.success) {
          const remaining = sells.filter((s) => s.id !== activeUnit.id)
          if (remaining[0]) setSelectedId(remaining[0].id)
        }
      } else if (confirmModal.type === 'promote') {
        const res = await requestUnitPromotionAction({
          unitId: activeUnit.id,
          days: confirmModal.pkg.days,
          price: confirmModal.pkg.price,
        })
        setConfirmModal(null)
        if (res.success && res.fawryCode) {
          setGeneratedAdRef(res.fawryCode)
          setSelectedPromoDays(confirmModal.pkg.days)
          setActionMessage(
            `تم تسجيل طلب تمييز الوحدة (${confirmModal.pkg.label}) — رقم طلب الإعلان: ${res.fawryCode} ⭐`
          )
        }
      } else if (confirmModal.type === 'cancel_promo') {
        const res = await cancelUnitPromotionBySellerAction(activeUnit.id)
        setConfirmModal(null)
        if (res.success) {
          setGeneratedAdRef(null)
          setSelectedPromoDays(null)
          setActionMessage('تم إلغاء طلب الإعلان / إيقاف تمييز الوحدة بنجاح.')
        }
      }
    })
  }

  const visibleUnitsInList = showAllUnitsList ? sells : sells.slice(0, 2)

  return (
    <div className="mx-auto max-w-[680px] px-4 sm:px-6">
      {/* 1. شريط اختيار الوحدة الواضح */}
      <section className="mb-5 rounded-[18px] border border-gray-200/90 bg-white p-4 text-right shadow-2xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#eff9f5] text-[#0b6954]">
              <Building2 className="size-4" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-gray-400">
                الوحدة المفتوحة أمامك الآن:
              </p>
              <h1 className="text-base font-extrabold text-[#0a1122] sm:text-xl">
                {activeUnit.project_name || 'وحدتك العقارية'}{' '}
                <span className="text-xs font-normal text-gray-500 sm:text-sm">
                  ·{' '}
                  {activeUnit.developer_name ||
                    activeUnit.area ||
                    'القاهرة الجديدة'}
                </span>
              </h1>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${meta.marketBadgeCls}`}
          >
            {meta.marketBadge}
          </span>
        </div>

        {sells.length > 1 && (
          <div className="mt-3.5 border-t border-gray-100 pt-3">
            <label className="mb-1.5 block text-[11px] font-extrabold text-[#0b6954]">
              لديك ({sells.length}) وحدات مسجلة — اختر الوحدة التي تريد متابعتها:
            </label>
            <div className="relative">
              <select
                value={activeUnit.id}
                onChange={(e) => {
                  setSelectedId(e.target.value)
                  setGeneratedAdRef(null)
                  setSelectedPromoDays(null)
                  setActionMessage('')
                }}
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/80 pr-3.5 pl-9 text-xs font-extrabold text-[#0a1122] focus:border-[#0b6954] focus:bg-white focus:outline-none sm:text-sm"
              >
                {sells.map((u, idx) => {
                  const uComp = calculateUnitCompletion(u)
                  const uMeta = getSellerTimelineAndStatus(
                    u,
                    uComp.percentage === 100
                  )
                  return (
                    <option key={u.id} value={u.id}>
                      {idx + 1}. {u.project_name || 'وحدة سكنية'} (
                      {u.area || 'القاهرة الجديدة'}) — [{uMeta.marketBadge}]
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        )}
      </section>

      {actionMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-[#eff9f5] p-3.5 text-center text-xs font-bold text-[#0b6954]">
          {actionMessage}
        </div>
      )}

      {/* 2. الكارت العلوي للخطوة الجاية */}
      <section className="rounded-[20px] border border-[#0b6954]/25 bg-white p-5 text-right shadow-xs sm:p-7">
        <p className="text-xs font-bold text-[#0b6954]">
          الخطوة الجاية لهذه الوحدة
        </p>
        <h2 className="mt-1.5 text-base font-extrabold text-[#0a1122] sm:text-[19px]">
          {meta.headline}
        </h2>

        {activeUnit.admin_note && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <strong className="block font-extrabold">
                حالة المراجعة / ملاحظة الإدارة:
              </strong>
              <p className="mt-0.5 leading-relaxed">{activeUnit.admin_note}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={editUnitHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0b6954] px-5 text-xs font-bold text-white transition hover:bg-[#095443] sm:h-11 sm:px-6"
          >
            {!comp.hasImages ? 'أضف الصور' : 'كمّل / عدّل بيانات الوحدة'}
          </Link>

          {meta.code !== 'sold' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                setConfirmModal({
                  type: isPausedBySeller ? 'resume' : 'pause',
                })
              }
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition sm:h-11 sm:px-4 ${
                isPausedBySeller
                  ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954] hover:bg-[#e0f3ec]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isPausedBySeller ? (
                <>
                  <PlayCircle className="size-4" />
                  <span>إعادة عرض الوحدة</span>
                </>
              ) : (
                <>
                  <PauseCircle className="size-4 text-amber-600" />
                  <span>إيقاف العرض مؤقتاً</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmModal({ type: 'delete' })}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50/50 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-100 sm:h-11"
            title="حذف هذه الوحدة"
          >
            <Trash2 className="size-3.5" />
            <span>حذف الوحدة</span>
          </button>
        </div>

        {!isComplete && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600">
                اكتمال بيانات وحدتك
              </span>
              <strong dir="ltr" className="font-extrabold text-[#0a1122]">
                {comp.percentage}%
              </strong>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#0b6954] transition-all duration-300"
                style={{ width: `${comp.percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-[#eff9f5] px-4 py-3 text-right text-xs font-bold text-[#0b6954]">
          {realMatchedBuyersCount > 0 ? (
            <>
              فيه {realMatchedBuyersCount.toLocaleString('en-US')} مشترين
              مسجلين حالياً في قاعدة البيانات مستنيين وحدة بنفس مواصفات وميزانية
              وحدتك{' '}
              {!isComplete
                ? '— كمّل بياناتها وشوفهم'
                : '— فريقنا يرشح وحدتك لهم'}
            </>
          ) : (
            <>
              بمجرد اعتماد وحدتك، سيقوم رادار المنصة بترشيحها تلقائياً لأي مشتري
              يسجل ميزانية مطابقة لمنطقتك ({activeUnit.area || 'منطقتك'})
            </>
          )}
        </div>
      </section>

      {/* 3. شريط التسلسل الزمني */}
      <section className="mt-6 rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-2xs sm:p-6">
        <h3 className="mb-4 text-right text-xs font-extrabold text-gray-500">
          مراحل طلب الوحدة ({activeUnit.project_name || 'وحدتك'}):
        </h3>
        <div className="pr-1">
          <Timeline
            currentStepIndex={meta.stepIndex}
            isRejected={meta.code === 'rejected'}
          />
        </div>
      </section>

      {/* ==================== 4. صندوق الترويج والتمييز (برقم طلب الإعلان + واتساب + تعديل أو إلغاء الباقة) ==================== */}
      <section className="mt-6 rounded-[20px] border border-[#aae3cb] bg-[#effaf5] p-5 text-right shadow-xs sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0b6954]">
            <Star className="size-3.5 fill-amber-400 text-amber-500" />
            <span>اختياري — الترويج والتمييز</span>
          </span>

          {isCurrentlyFeatured && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
              ⭐ وحدتك مميزة حالياً (متبقي {remainingFeaturedDays} يوم)
            </span>
          )}

          {isPendingPromo && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-extrabold text-blue-800">
              ⏳ طلب تمييز بانتظار التفعيل ({activePromoDays} أيام)
            </span>
          )}
        </div>

        <h3 className="mt-1.5 text-base font-extrabold text-[#0a1122] sm:text-lg">
          عايز وحدتك تبقى أول اللي المشتري يشوفه؟
        </h3>

        <ul className="mt-3 space-y-2 text-xs font-medium text-[#1e3a34]">
          <li className="flex items-center gap-2">
            <Check className="size-3.5 shrink-0 text-[#0b6954]" />
            <span>ظهور في «فرص مميزة» في أول السوق وفي أول نتائج البحث</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-3.5 shrink-0 text-[#0b6954]" />
            <span>
              شارة{' '}
              <Star className="inline size-3 fill-amber-400 text-amber-500" />{' '}
              مميزة على كارت وحدتك تجذب المشترين الجادين
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-3.5 shrink-0 text-[#0b6954]" />
            <span>تقرير أسبوعي بأرقام حقيقية لعدد المشاهدات والعروض</span>
          </li>
        </ul>

        {/* الباقات الثلاث (يمكنه اختيار باقة أو تغيير باقته الحالية بضغطة واحدة) */}
        <p className="mt-4 mb-2 text-[11px] font-extrabold text-[#0b6954]">
          {isCurrentlyFeatured || isPendingPromo
            ? 'يمكنك الضغط على أي باقة أخرى لتغيير أو تجديد اشتراكك:'
            : 'اختر الباقة المناسبة لوحدتك:'}
        </p>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {PROMO_PACKAGES.map((pkg) => {
            const isSelected =
              (isCurrentlyFeatured || isPendingPromo || generatedAdRef) &&
              activePromoDays === pkg.days
            return (
              <button
                key={pkg.days}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setConfirmModal({ type: 'promote', pkg })
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border bg-white p-3.5 text-center transition hover:shadow-md sm:p-4 ${
                  isSelected
                    ? 'border-[#0b6954] ring-2 ring-[#0b6954]/25'
                    : 'border-gray-200/90 hover:border-[#0b6954]/50'
                }`}
              >
                <span className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                  {pkg.label}
                </span>
                <span className="mt-1 text-xs font-extrabold text-[#0b6954] tabular-nums sm:text-sm">
                  {pkg.price.toLocaleString('en-US')} ج.م
                </span>
                {isSelected && (
                  <span className="mt-1 rounded-full bg-[#eff9f5] px-2 py-0.5 text-[9px] font-extrabold text-[#0b6954]">
                    باقتك المختارة ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-[#2b584d]">
          نشر وحدتك مجاني بالكامل وهيفضل مجاني — ده اختياري بس لو عايز ظهور
          أكتر، والأيام بتتحسب من لحظة التفعيل والنشر في السوق.
        </p>

        {/* صندوق رقم طلب الإعلان + زر واتساب + زر إلغاء الاشتراك */}
        {(currentAdRef || isCurrentlyFeatured || isPendingPromo) && (
          <div className="mt-4 rounded-xl border border-[#0b6954]/30 bg-white p-4 text-right shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-[#0a1122]">
                  رقم طلب الإعلان المميز لوحدتك (باقة {activePromoDays} أيام):
                </p>
                <p className="mt-1 font-mono text-lg font-black tracking-wider text-[#0b6954]">
                  {currentAdRef ||
                    `AD-${activeUnit.id.slice(0, 6).toUpperCase()}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const codeToCopy =
                    currentAdRef ||
                    `AD-${activeUnit.id.slice(0, 6).toUpperCase()}`
                  navigator.clipboard?.writeText(codeToCopy)
                  setCopiedAdRef(true)
                  setTimeout(() => setCopiedAdRef(false), 2000)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[#0a1122] hover:bg-gray-100"
              >
                <Copy className="size-3.5" />
                <span>{copiedAdRef ? 'تم النسخ ✓' : 'نسخ رقم الطلب'}</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              {!isCurrentlyFeatured && (
                <a
                  href={`https://wa.me/201018595959?text=${encodeURIComponent(
                    `أهلاً إدارة منصة دارك، أرغب في تفعيل باقة تمييز (${activePromoDays} أيام - ${activePromoPrice.toLocaleString('en-US')} ج.م) لوحدتي في مشروع (${activeUnit.project_name || 'وحدتي'}) — رقم طلب الإعلان: ${currentAdRef || `AD-${activeUnit.id.slice(0, 6).toUpperCase()}`}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-95"
                >
                  <MessageCircle className="size-4" />
                  <span>تواصل واتساب لتأكيد وتفعيل الإعلان</span>
                </a>
              )}

              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmModal({ type: 'cancel_promo' })}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                <XCircle className="size-3.5" />
                <span>
                  {isCurrentlyFeatured
                    ? 'إيقاف اشتراك التمييز'
                    : 'إلغاء طلب الإعلان'}
                </span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. كارت السعر والمدفوع */}
      <section className="mt-6 grid grid-cols-2 gap-4 rounded-[18px] border border-gray-200/80 bg-white p-5 text-right shadow-2xs sm:p-6">
        <div>
          <p className="text-[11px] text-gray-400">سعر الوحدة في العقد</p>
          <strong className="mt-1 block text-lg font-extrabold text-[#0a1122] tabular-nums sm:text-xl">
            {money(activeUnit.contract_price)}
          </strong>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">
            اللي دفعته (هدف الاسترداد)
          </p>
          <strong className="mt-1 block text-lg font-extrabold text-[#0b6954] tabular-nums sm:text-xl">
            {money(activeUnit.paid_amount)}
          </strong>
        </div>
      </section>

      {/* 6. الكروت الثلاثة السفلية + المستندات */}
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href={`/sell?editUnitId=${activeUnit.id}&step=3`}
          className="flex flex-col justify-center rounded-[16px] border border-gray-200/80 bg-white p-4 text-right shadow-2xs transition hover:border-[#0b6954]"
        >
          <p className="text-xs font-extrabold text-[#0a1122]">بيانات وحدتك</p>
          <p className="mt-1 text-[11px] text-gray-400">
            {comp.completedCount}/{comp.total} مكتملة
          </p>
        </Link>

        <Link
          href={`/account/offers?unitId=${activeUnit.id}`}
          className="flex flex-col justify-center rounded-[16px] border border-gray-200/80 bg-white p-4 text-right shadow-2xs transition hover:border-[#0b6954]"
        >
          <p className="text-xs font-extrabold text-[#0a1122]">العروض</p>
          <p className="mt-1 text-[11px] text-gray-400">
            {unitOffersCount > 0 || meta.code === 'offer_received'
              ? `لديك ${unitOffersCount || 1} عرض متاح 💰`
              : 'لسه مفيش'}
          </p>
        </Link>

        <a
          href="https://wa.me/201018595959"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col justify-center rounded-[16px] bg-[#0a1122] p-4 text-right text-white shadow-2xs transition hover:bg-[#16223f]"
        >
          <p className="text-xs font-extrabold text-white">مسؤول حالتك</p>
          <p className="mt-1 text-[11px] text-gray-300">
            كلمنا على واتساب في أي وقت
          </p>
        </a>
      </section>

      <div className="mt-4 flex flex-col justify-between gap-3 rounded-[16px] border border-dashed border-[#0b6954]/40 bg-[#eff9f5]/60 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 text-right">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0b6954]/10 text-[#0b6954]">
            {uploadedDocsCount > 0 ? (
              <FileCheck2 className="size-4" />
            ) : (
              <UploadCloud className="size-4" />
            )}
          </span>
          <div>
            <p className="text-xs font-extrabold text-[#0a1122]">
              مستندات الوحدة (العقد، الإيصالات، كشف الحساب)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {uploadedDocsCount > 0
                ? `تم رفع ${uploadedDocsCount} من 4 مستندات لهذه الوحدة`
                : 'ارفع مستنداتك لتسريع مراجعة العقد وإجراءات النقل'}
            </p>
          </div>
        </div>
        <Link
          href={`/account/documents?unitId=${activeUnit.id}`}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-[#0b6954] shadow-2xs ring-1 ring-[#0b6954]/20 transition hover:bg-[#0b6954] hover:text-white"
        >
          {uploadedDocsCount > 0
            ? `مستنداتك (${uploadedDocsCount} ✓)`
            : 'ارفع المستندات'}
        </Link>
      </div>

      {/* 7. قائمة وحداتي المختصرة */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
            وحداتي المسجلة ({sells.length})
          </h2>
          <Link
            href="/sell?new=1"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0a1122] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]"
          >
            + ضيف وحدة تانية
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {visibleUnitsInList.map((item) => {
            const itemComp = calculateUnitCompletion(item)
            const itemComplete = itemComp.percentage === 100
            const itemMeta = getSellerTimelineAndStatus(item, itemComplete)
            const isSelected = item.id === activeUnit.id
            const itemMatchedBuyers = matchedBuyersCountMap[item.id] ?? 0

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id)
                  setGeneratedAdRef(null)
                  setSelectedPromoDays(null)
                  setActionMessage('')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedId(item.id)
                }}
                className={`flex cursor-pointer items-center justify-between rounded-[16px] border bg-white px-4 py-3.5 text-right transition sm:px-5 sm:py-4 ${
                  isSelected
                    ? 'border-[#0b6954] ring-2 ring-[#0b6954]/15'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                      {item.project_name || 'وحدة سكنية'}{' '}
                      <span className="font-normal text-gray-500">
                        · {item.area || 'القاهرة الجديدة'}
                      </span>
                    </p>
                    {isSelected && (
                      <span className="rounded-md bg-[#0a1122] px-2 py-0.5 text-[10px] font-bold text-white">
                        مفتوحة أمامك ✓
                      </span>
                    )}
                    {item.is_featured && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Star className="size-2.5 fill-amber-400 text-amber-500" />
                        مميزة
                      </span>
                    )}
                    {itemMatchedBuyers > 0 && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {itemMatchedBuyers} مشتري مطابق
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {itemMeta.unitSubtext}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${itemMeta.marketBadgeCls}`}
                  >
                    {itemMeta.marketBadge}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {sells.length > 2 && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowAllUnitsList((prev) => !prev)}
              className="text-xs font-extrabold text-[#0b6954] hover:underline"
            >
              {showAllUnitsList
                ? 'عرض آخر وحدتين فقط ↑'
                : `عرض كل وحداتي (${sells.length} وحدات) ↓`}
            </button>
          </div>
        )}
      </section>

      {/* 8. أزرار الحساب في الأسفل متوسطة */}
      <div className="mt-8 flex justify-center border-t border-gray-200/80 pt-6 [&>*]:justify-center [&_div]:justify-center [&_form]:hidden">
        <AccountActionLinks
          unitsCount={sells.length}
          initialDeletionRequested={deletionRequested}
          position="bottom"
        />
      </div>

      {/* 9. نافذة التأكيد الموحدة لجميع أزرار لوحة البائع */}
      <Dialog
        open={Boolean(confirmModal)}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmModal(null)
        }}
      >
        <DialogContent
          dir="rtl"
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
        >
          {confirmModal && (
            <>
              <DialogHeader className="text-right">
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      confirmModal.type === 'delete' ||
                      confirmModal.type === 'cancel_promo'
                        ? 'bg-red-100 text-red-600'
                        : confirmModal.type === 'pause'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-[#0b6954]'
                    }`}
                  >
                    {confirmModal.type === 'delete' ? (
                      <Trash2 className="size-4" />
                    ) : confirmModal.type === 'promote' ? (
                      <Sparkles className="size-4" />
                    ) : (
                      <ShieldAlert className="size-4" />
                    )}
                  </span>
                  <DialogTitle className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                    {confirmModal.type === 'pause' &&
                      'تأكيد إيقاف عرض الوحدة مؤقتاً'}
                    {confirmModal.type === 'resume' &&
                      'تأكيد إعادة عرض الوحدة في السوق'}
                    {confirmModal.type === 'delete' &&
                      'تأكيد حذف الوحدة نهائياً'}
                    {confirmModal.type === 'promote' &&
                      `تأكيد باقة التمييز (${confirmModal.pkg.label})`}
                    {confirmModal.type === 'cancel_promo' &&
                      'تأكيد إلغاء طلب الإعلان / التمييز'}
                  </DialogTitle>
                </div>

                <DialogDescription className="text-right text-xs leading-relaxed text-gray-600">
                  {confirmModal.type === 'pause' && (
                    <>
                      هل تريد إيقاف عرض وحدة{' '}
                      <strong className="text-[#0a1122]">
                        "{activeUnit.project_name || 'وحدتك'}"
                      </strong>{' '}
                      مؤقتاً؟ ستختفي الوحدة من صفحة الفرص العامة ولن يراها
                      المشترون حتى تعيد تفعيلها.
                    </>
                  )}
                  {confirmModal.type === 'resume' && (
                    <>
                      هل تريد إعادة عرض وحدة{' '}
                      <strong className="text-[#0a1122]">
                        "{activeUnit.project_name || 'وحدتك'}"
                      </strong>{' '}
                      في السوق؟ سيقوم فريق الإدارة بمراجعتها ونشرها أمام
                      المشترين.
                    </>
                  )}
                  {confirmModal.type === 'delete' && (
                    <>
                      هل أنت متأكد من حذف وحدة{' '}
                      <strong className="text-red-600">
                        "{activeUnit.project_name || 'وحدتك'}"
                      </strong>{' '}
                      من حسابك؟
                    </>
                  )}
                  {confirmModal.type === 'promote' && (
                    <>
                      سيتم تسجيل طلب تمييز لوحدتك لمدة{' '}
                      <strong className="text-[#0a1122]">
                        {confirmModal.pkg.label}
                      </strong>{' '}
                      بتكلفة{' '}
                      <strong className="text-[#0b6954]">
                        {confirmModal.pkg.price.toLocaleString('en-US')} ج.م
                      </strong>{' '}
                      وإصدار رقم طلب الإعلان للتواصل مع الإدارة وتفعيله.
                    </>
                  )}
                  {confirmModal.type === 'cancel_promo' && (
                    <>
                      هل أنت متأكد من إلغاء طلب الإعلان وإيقاف ميزة النجمة
                      الذهبية لوحدة{' '}
                      <strong className="text-red-600">
                        "{activeUnit.project_name || 'وحدتك'}"
                      </strong>
                      ؟ ستظل وحدتك معروضة بشكل مجاني عادي.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirmModal(null)}
                  className="h-9 flex-1 rounded-xl text-xs font-bold"
                >
                  تراجع
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={executeConfirmedAction}
                  className={`h-9 flex-1 rounded-xl text-xs font-bold text-white ${
                    confirmModal.type === 'delete' ||
                    confirmModal.type === 'cancel_promo'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmModal.type === 'pause'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-[#0b6954] hover:bg-[#095443]'
                  }`}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      جاري التنفيذ...
                    </span>
                  ) : (
                    'نعم، تأكيد'
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

function Timeline({
  currentStepIndex,
  isRejected,
}: {
  currentStepIndex: number
  isRejected?: boolean
}) {
  const stepTitles = [
    'بدأنا طلبك',
    'بيانات وحدتك وصورها',
    'بنراجع وننشر وحدتك',
    'معروضة في السوق',
    'بندور على المشتري المناسب',
    'عندك عرض',
    'نقل التعاقد (بنراجع المستندات)',
    'تمت العملية',
  ]

  return (
    <ol className="relative flex flex-col items-start">
      {stepTitles.map((title, index) => {
        const isLast = index === stepTitles.length - 1
        const status: 'done' | 'current' | 'upcoming' =
          index < currentStepIndex
            ? 'done'
            : index === currentStepIndex
              ? 'current'
              : 'upcoming'

        return (
          <li
            key={title}
            className="relative flex items-start gap-3.5 pb-5 last:pb-0"
          >
            {!isLast && (
              <span
                className={`absolute top-6 right-[11px] h-full w-[1.5px] ${
                  status === 'done' ? 'bg-[#0b6954]' : 'bg-gray-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                status === 'done'
                  ? 'bg-[#0b6954] text-white'
                  : status === 'current'
                    ? isRejected
                      ? 'bg-red-600 text-white'
                      : 'bg-[#0a1122] text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {status === 'done' ? (
                <Check className="size-3.5 stroke-[2.5]" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`pt-0.5 text-xs ${
                status === 'current'
                  ? isRejected
                    ? 'font-extrabold text-red-600'
                    : 'font-extrabold text-[#0a1122]'
                  : status === 'done'
                    ? 'font-medium text-gray-600'
                    : 'font-normal text-gray-400'
              }`}
            >
              {title}
            </span>
          </li>
        )
      })}
    </ol>
  )
}