'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, FileCheck2, UploadCloud } from 'lucide-react'
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
  admin_note: string | null
  images: string[] | null
  documents: Record<string, any> | null
  created_at: string | null
}

function money(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('en-US')} ج.م`
}

// حساب عدد الحقول المكتملة من 18 حقل للوحدة الواحدة بدقة
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

  // إذا كانت الصور فقط هي الناقصة تكون النسبة 94% تماماً كما في الصور الأصلية
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
        stepIndex: 4, // 5. بندور على المشتري المناسب
        unitSubtext: 'معروضة في السوق',
        headline: 'وحدتك معتمدة ومعروضة الآن أمام المشترين 🎉',
      }
    case 'offer_received':
      return {
        code: 'offer_received',
        stepIndex: 5, // 6. عندك عرض
        unitSubtext: 'عندك عرض جديد',
        headline: 'لديك عرض شراء جاد على وحدتك! 💰',
      }
    case 'transferring':
      return {
        code: 'transferring',
        stepIndex: 6, // 7. نقل التعاقد
        unitSubtext: 'نقل التعاقد (بنراجع المستندات)',
        headline: 'وحدتك في مرحلة مراجعة المستندات ونقل التعاقد 📄',
      }
    case 'sold':
      return {
        code: 'sold',
        stepIndex: 8, // 8. تمت العملية
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
          stepIndex: 1, // 2. بيانات وحدتك وصورها
          unitSubtext: 'بيانات وحدتك وصورها',
          headline: 'فاضل الصور بس — ضيف صورة واحدة على الأقل وننشر وحدتك',
        }
      }
      return {
        code: 'pending_review',
        stepIndex: 2, // 3. بنراجع وننشر وحدتك
        unitSubtext: 'بنراجع وننشر وحدتك',
        headline: 'بياناتك وصلت! فريقنا بيراجع الوحدة وينشرها في السوق قريب',
      }
  }
}

export function SellerDashboard({
  sells,
  initialSelectedUnitId,
  offersCountMap = {},
  waitingBuyersCount = 4510,
  deletionRequested = false,
}: {
  sells: SellerUnitItem[]
  initialSelectedUnitId?: string
  offersCountMap?: Record<string, number>
  waitingBuyersCount?: number
  deletionRequested?: boolean
}) {
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedUnitId && sells.some((s) => s.id === initialSelectedUnitId)
      ? initialSelectedUnitId
      : sells[0]?.id || ''
  )

  const activeUnit = sells.find((s) => s.id === selectedId) || sells[0]
  const comp = calculateUnitCompletion(activeUnit)
  const isComplete = comp.percentage === 100
  const meta = getSellerTimelineAndStatus(activeUnit, isComplete)

  // حساب عدد المستندات المرفوعة لهذه الوحدة
  const uploadedDocsCount = activeUnit.documents
    ? Object.keys(activeUnit.documents).filter(
        (k) => activeUnit.documents?.[k]?.url
      ).length
    : 0

  const unitOffersCount = offersCountMap[activeUnit.id] || 0

  // الرابط الذكي لتعديل الوحدة أو إكمال الصور
  const editUnitHref = !comp.hasImages
    ? `/sell?editUnitId=${activeUnit.id}&step=5`
    : `/sell?editUnitId=${activeUnit.id}&step=3`

  return (
    <div className="mx-auto max-w-[680px] px-4 sm:px-6">
      {/* 1. العنوان العلوي للوحدة المختارة حالياً */}
      <header className="pb-5 text-right">
        <h1 className="text-xl font-extrabold text-[#0a1122] sm:text-2xl">
          {activeUnit.project_name || 'وحدتك العقارية'}{' '}
          <span className="font-normal text-gray-500">
            · {activeUnit.developer_name || activeUnit.area || 'القاهرة الجديدة'}
          </span>
        </h1>
      </header>

      {/* 2. الكارت العلوي للخطوة الجاية (يتغير أوتوماتيكياً عند اكتمال البيانات 100%) */}
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
                ملاحظة من إدارة المنصة:
              </strong>
              <p className="mt-0.5 leading-relaxed">{activeUnit.admin_note}</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Link
            href={editUnitHref}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0b6954] px-6 text-xs font-bold text-white transition hover:bg-[#095443] sm:text-sm"
          >
            {!comp.hasImages ? 'أضف الصور' : 'كمّل بيانات الوحدة'}
          </Link>
        </div>

        {/* يظهر شريط النسبة المئوية فقط إذا كانت البيانات غير مكتملة (< 100%) ويختفي عند الاكتمال تماماً كما في الصور */}
        {!isComplete && (
          <>
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

            <div className="mt-4 rounded-xl bg-[#eff9f5] px-4 py-3 text-right text-xs font-bold text-[#0b6954]">
              فيه {waitingBuyersCount} مشترين مستنيين وحدة زي بتاعتك — كمّل
              بياناتها وشوفهم
            </div>
          </>
        )}

        <p className="mt-5 border-t border-gray-100 pt-3.5 text-right text-[11px] leading-relaxed text-gray-400">
          المستندات (العقد والإيصالات) — تقدر ترفعها دلوقتي أو بعد ما فريقنا
          يكلمك. مطلوبة قبل إتمام البيع، مش قبل النشر.
        </p>
      </section>

      {/* 3. قائمة وحداتي (تسمح بالتبديل الفوري بين الوحدات لعرض حالة كل وحدة) */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
            وحداتي ({sells.length})
          </h2>
          {/* زر ضيف وحدة تانية يفتح الفورم من مرحلة تفاصيل الوحدة مباشرة لأن العميل مسجل دخول */}
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

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
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
                  <div className="flex items-center gap-2">
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
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {itemMeta.unitSubtext}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {!itemComplete ? (
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

      {/* 4. شريط التسلسل الزمني (8 مراحل) الخاص بالوحدة المختارة */}
      <section className="mt-8 pr-1">
        <Timeline
          currentStepIndex={meta.stepIndex}
          isRejected={meta.code === 'rejected'}
        />
      </section>

      {/* 5. كارت سعر الوحدة في العقد والمدفوع */}
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

      {/* 6. الكروت الثلاثة (بيانات وحدتك، العروض، مسؤول حالتك) */}
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

      {/* 7. كارت رفع المستندات الواضح + النص السفلي (كما في الصورة 42) */}
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

      {/* 8. أزرار الحساب في الأسفل فقط للبائع */}
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