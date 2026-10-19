'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Check,
  FileCheck2,
  Loader2,
  PauseCircle,
  PlayCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  deleteUnitBySellerAction,
  toggleSellerUnitStatusAction,
} from '@/app/actions/account-actions'
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
  created_at: string | null
}

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
        unitSubtext: 'معروضة في السوق الآن',
        headline: 'وحدتك معتمدة ومعروضة الآن أمام المشترين 🎉',
      }
    case 'paused_by_seller':
      return {
        code: 'paused_by_seller',
        stepIndex: 2,
        unitSubtext: 'متوقفة مؤقتاً بواسطتك',
        headline: 'أوقفت عرض هذه الوحدة مؤقتاً — يمكنك إعادة عرضها في أي وقت',
      }
    case 'paused_deletion':
      return {
        code: 'paused_deletion',
        stepIndex: 2,
        unitSubtext: 'مخفية بسبب طلب حذف الحساب',
        headline: 'الوحدة مخفية حالياً من السوق بسبب طلب حذف الحساب',
      }
    case 'offer_received':
      return {
        code: 'offer_received',
        stepIndex: 5,
        unitSubtext: 'عندك عرض جديد',
        headline: 'لديك عرض شراء جاد على وحدتك! 💰',
      }
    case 'transferring':
      return {
        code: 'transferring',
        stepIndex: 6,
        unitSubtext: 'نقل التعاقد (بنراجع المستندات)',
        headline: 'وحدتك في مرحلة مراجعة المستندات ونقل التعاقد 📄',
      }
    case 'sold':
      return {
        code: 'sold',
        stepIndex: 8,
        unitSubtext: 'تمت العملية',
        headline: 'مبروك! تمت عملية بيع وحدتك ونقل التعاقد بنجاح 🏆',
      }
    case 'rejected':
      return {
        code: 'rejected',
        stepIndex: 1,
        unitSubtext: 'تحتاج لمراجعة البيانات',
        headline: 'يرجى مراجعة وتحديث بيانات وحدتك لإعادة النشر',
      }
    default:
      if (!isComplete) {
        return {
          code: 'incomplete',
          stepIndex: 1,
          unitSubtext: 'بيانات وحدتك وصورها',
          headline: 'فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك',
        }
      }
      return {
        code: 'pending_review',
        stepIndex: 2,
        unitSubtext:
          unit.submission_type === 'resumed_by_seller'
            ? 'معاد عرضها — قيد مراجعة الإدارة'
            : unit.submission_type === 'edited_by_seller'
              ? 'معدّلة — قيد مراجعة الإدارة'
              : 'بنراجع وننشر وحدتك',
        headline: 'بياناتك وصلت! فريقنا بيراجع الوحدة وينشرها في السوق قريب',
      }
  }
}

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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeUnit = sells.find((s) => s.id === selectedId) || sells[0]
  if (!activeUnit) return null

  const comp = calculateUnitCompletion(activeUnit)
  const isComplete = comp.percentage === 100
  const meta = getSellerTimelineAndStatus(activeUnit, isComplete)
  const isPausedBySeller = meta.code === 'paused_by_seller'

  // العدد الحقيقي للمشترين المطابقين لهذه الوحدة تحديداً من قاعدة البيانات
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

  const handleTogglePause = () => {
    setActionMessage('')
    startTransition(async () => {
      const nextAction = isPausedBySeller ? 'resume' : 'pause'
      const res = await toggleSellerUnitStatusAction({
        unitId: activeUnit.id,
        action: nextAction,
      })
      if (res.success) {
        setActionMessage(
          nextAction === 'pause'
            ? 'تم إيقاف عرض الوحدة مؤقتاً وإخفاؤها من السوق.'
            : 'تم إرسال طلب إعادة عرض الوحدة للإدارة للمراجعة والنشر ✓'
        )
      }
    })
  }

  const handleDeleteUnit = () => {
    startTransition(async () => {
      const res = await deleteUnitBySellerAction(activeUnit.id)
      if (res.success) {
        setConfirmDeleteOpen(false)
        const remaining = sells.filter((s) => s.id !== activeUnit.id)
        if (remaining[0]) setSelectedId(remaining[0].id)
      }
    })
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 sm:px-6">
      {/* 1. العنوان العلوي للوحدة المختارة */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-5 text-right">
        <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
          {activeUnit.project_name || 'وحدتك العقارية'}{' '}
          <span className="font-normal text-gray-500">
            · {activeUnit.developer_name || activeUnit.area || 'القاهرة الجديدة'}
          </span>
        </h1>

        {isPausedBySeller && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
            ⏸ متوقفة مؤقتاً بواسطتك
          </span>
        )}
      </header>

      {actionMessage && (
        <div className="mb-4 rounded-xl bg-[#eff9f5] p-3.5 text-center text-xs font-bold text-[#0b6954]">
          {actionMessage}
        </div>
      )}

      {/* 2. الكارت العلوي للخطوة الجاية */}
      <section className="rounded-[20px] border border-[#0b6954]/25 bg-white p-5 text-right shadow-xs sm:p-7">
        <p className="text-xs font-bold text-[#0b6954]">الخطوة الجاية</p>
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

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Link
            href={editUnitHref}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0b6954] px-6 text-xs font-bold text-white transition hover:bg-[#095443] sm:text-sm"
          >
            {!comp.hasImages ? 'أضف الصور' : 'كمّل / عدّل بيانات الوحدة'}
          </Link>

          {/* زر إيقاف العرض مؤقتاً أو إعادة عرضه */}
          {meta.code !== 'sold' && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleTogglePause}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition ${
                isPausedBySeller
                  ? 'border-[#0b6954] bg-[#eff9f5] text-[#0b6954] hover:bg-[#e0f3ec]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPausedBySeller ? (
                <>
                  <PlayCircle className="size-4" />
                  <span>إعادة عرض الوحدة في السوق</span>
                </>
              ) : (
                <>
                  <PauseCircle className="size-4 text-amber-600" />
                  <span>إيقاف العرض مؤقتاً</span>
                </>
              )}
            </button>
          )}

          {/* زر حذف الوحدة */}
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50/50 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
            title="حذف هذه الوحدة"
          >
            <Trash2 className="size-3.5" />
            <span>حذف الوحدة</span>
          </button>
        </div>

        {/* شريط نسبة الاكتمال يظهر إذا كانت البيانات غير مكتملة */}
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

            {comp.missingTags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {comp.missingTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-amber-50 px-3 py-0.5 text-[11px] font-bold text-amber-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* شريط العدد الحقيقي للمشترين المطابقين لهذه الوحدة من الداتابيز */}
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

        <p className="mt-5 border-t border-gray-100 pt-3.5 text-right text-[11px] leading-relaxed text-gray-400">
          المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا
          يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
        </p>
      </section>

      {/* نافذة تأكيد حذف الوحدة */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs"
          onClick={() => setConfirmDeleteOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-right shadow-2xl"
          >
            <h3 className="text-base font-black text-[#0a1122]">
              حذف وحدة ({activeUnit.project_name || 'وحدتك'})؟
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              هل أنت متأكد من حذف هذه الوحدة نهائياً من حسابك؟ يمكنك بدلاً من
              ذلك الضغط على «إيقاف العرض مؤقتاً» والاحتفاظ ببياناتها.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteUnit}
                className="h-10 flex-1 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
              >
                {isPending ? 'جاري الحذف...' : 'نعم، احذف الوحدة نهائياً'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="h-10 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-700"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. قائمة وحداتي */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
            وحداتي ({sells.length})
          </h2>
          <Link
            href="/sell?new=1"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a1122] px-4 text-xs font-bold text-white transition hover:bg-[#16223f]"
          >
            + ضيف وحدة تانية
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {sells.map((item) => {
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
                  setActionMessage('')
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedId(item.id)
                }}
                className={`flex cursor-pointer items-center justify-between rounded-[16px] border bg-white px-5 py-4 text-right transition ${
                  isSelected
                    ? 'border-[#0b6954] ring-2 ring-[#0b6954]/15'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-extrabold text-[#0a1122] sm:text-sm">
                      {item.project_name || 'وحدة سكنية'}{' '}
                      <span className="font-normal text-gray-500">
                        · {item.area || 'القاهرة الجديدة'}
                      </span>
                    </p>
                    {sells.length > 1 && isSelected && (
                      <span className="rounded-md bg-[#eff9f5] px-2 py-0.5 text-[10px] font-bold text-[#0b6954]">
                        معروضة الآن
                      </span>
                    )}
                    {itemMatchedBuyers > 0 && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {itemMatchedBuyers} مشتري مطابق
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {itemMeta.unitSubtext}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {item.status === 'paused_by_seller' ? (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">
                      متوقفة مؤقتاً
                    </span>
                  ) : !itemComplete ? (
                    <span
                      dir="ltr"
                      className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700"
                    >
                      {itemComp.percentage}%
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-[#0b6954]">
                      مكتملة
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-2.5 text-right text-[11px] text-gray-400">
          عندك أكتر من وحدة عايز تخرج منها؟ ضيفها هنا — كل وحدة ليها ملفها
          ومشترينها وبتتتابع لوحدها.
        </p>
      </section>

      {/* 4. شريط التسلسل الزمني */}
      <section className="mt-8 pr-1">
        <Timeline
          currentStepIndex={meta.stepIndex}
          isRejected={meta.code === 'rejected'}
        />
      </section>

      {/* 5. كارت السعر والمدفوع */}
      <section className="mt-8 grid grid-cols-2 gap-4 rounded-[18px] border border-gray-200/80 bg-white p-5 text-right shadow-2xs sm:p-6">
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

      {/* 6. الكروت الثلاثة السفلية */}
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

      {/* 7. كارت رفع المستندات */}
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

      <p className="mt-3 text-right text-[11px] leading-relaxed text-gray-400">
        <Link
          href={`/account/documents?unitId=${activeUnit.id}`}
          className="font-bold text-[#1e3a8a] underline hover:text-[#0b6954]"
        >
          {uploadedDocsCount > 0
            ? `مستنداتك (${uploadedDocsCount} ✓)`
            : 'مستنداتك'}
        </Link>{' '}
        — المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا
        يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
      </p>

      {/* 8. أزرار الحساب في الأسفل */}
      <AccountActionLinks
        unitsCount={sells.length}
        initialDeletionRequested={deletionRequested}
        position="bottom"
      />
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
            className="relative flex items-start gap-3.5 pb-6 last:pb-0"
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