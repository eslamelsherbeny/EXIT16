'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  deleteUnitDocumentAction,
  getAuthorizedUnitDocumentsAction,
  saveUnitDocumentAction,
} from '@/actions/account-actions'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export type DocKeyType = 'contract' | 'receipts' | 'statement' | 'passport'

function isImageUrl(url?: string, name?: string) {
  const target = `${url || ''} ${name || ''}`.toLowerCase()
  if (target.includes('.pdf')) return false
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif)/i.test(target) || Boolean(url)
}

function AccountDocumentsContent() {
  const router = useRouter()
  const { t: dict, locale, dir } = useTranslation()
  const t = dict.accountPages.documents as Record<string, any>
  const tCommon = dict.accountPages.common

  const DOCUMENT_SECTIONS: Array<{ key: DocKeyType; title: string }> = [
    {
      key: 'contract',
      title: t.sections?.contract || 'عقد الوحدة الابتدائي أو النهائي',
    },
    { key: 'receipts', title: t.sections?.receipts || 'إيصالات السداد' },
    {
      key: 'statement',
      title: t.sections?.statement || 'كشف حساب المطور (Statement)',
    },
    {
      key: 'passport',
      title: t.sections?.passport || 'صورة جواز السفر (Passport)',
    },
  ]

  const changeFileLabel =
    t.changeFileBtn ||
    (locale === 'ar'
      ? 'تغيير الملف'
      : locale === 'ru'
        ? 'Изменить'
        : locale === 'ka'
          ? 'შეცვლა'
          : 'Replace File')

  const removeFileLabel =
    t.removeFileBtn ||
    (locale === 'ar'
      ? 'حذف'
      : locale === 'ru'
        ? 'Удалить'
        : locale === 'ka'
          ? 'წაშლა'
          : 'Remove')

  const viewImageLabel =
    t.viewFullImageBtn ||
    (locale === 'ar'
      ? 'معاينة الصورة'
      : locale === 'ru'
        ? 'Просмотр'
        : locale === 'ka'
          ? 'ნახვა'
          : 'View Image')

  const openPdfLabel =
    t.openFileBtn ||
    (locale === 'ar'
      ? 'فتح الملف'
      : locale === 'ru'
        ? 'Открыть'
        : locale === 'ka'
          ? 'გახსნა'
          : 'Open PDF')

  const deleteSuccessLabel =
    t.deleteSuccess ||
    (locale === 'ar'
      ? 'تم حذف المستند بنجاح ✓'
      : locale === 'ru'
        ? 'Документ удален ✓'
        : locale === 'ka'
          ? 'დოკუმენტი წაიშალა ✓'
          : 'Document removed ✓')

  const noUnitsLabel =
    locale === 'ar'
      ? 'لا توجد وحدات مسجلة في حسابك حالياً لرفع مستنداتها.'
      : locale === 'ru'
        ? 'В вашем аккаунте пока нет зарегистрированных объектов.'
        : locale === 'ka'
          ? 'თქვენს ანგარიშზე ობიექტები ვერ მოიძებნა.'
          : 'No registered units found in your account.'

  const searchParams = useSearchParams()
  const unitIdParam = searchParams.get('unitId')

  const [unitId, setUnitId] = useState<string>(unitIdParam || '')
  const [projectName, setProjectName] = useState<string>('')
  const [userUnits, setUserUnits] = useState<
    Array<{ id: string; project_name: string; area: string }>
  >([])
  const [docs, setDocs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [previewDoc, setPreviewDoc] = useState<{
    url: string
    title: string
  } | null>(null)

  async function fetchVerifiedDocs(targetId?: string | null) {
    setLoading(true)
    setErrorMsg('')
    const res = await getAuthorizedUnitDocumentsAction(targetId)

    if (!res.isLoggedIn) {
      router.replace('/login?next=/account/documents')
      return
    }

    if (!res.authorized) {
      // إذا حاول فتح unitId لا يملكه، نعيده فوراً لصفحة حسابه
      router.replace('/account')
      return
    }

    setUserUnits(res.unitsList || [])
    setUnitId(res.unitId || '')
    setProjectName(res.projectName || '')
    setDocs(res.documents || {})
    setLoading(false)
  }

  useEffect(() => {
    fetchVerifiedDocs(unitIdParam)
  }, [unitIdParam])

  const handleFileUpload = async (
    docKey: DocKeyType,
    files: FileList | null
  ) => {
    const file = files?.[0]
    if (!file || !unitId) return

    setUploadingKey(docKey)
    setMessage('')
    setErrorMsg('')

    try {
      const supabase = createClient()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
      const path = `documents/${unitId}/${docKey}-${Date.now()}-${cleanName}`

      const { error: uploadErr } = await supabase.storage
        .from('unit-images')
        .upload(path, file, { contentType: file.type, upsert: true })

      if (uploadErr) {
        setErrorMsg(uploadErr.message)
        return
      }

      const publicUrl = supabase.storage.from('unit-images').getPublicUrl(path)
        .data.publicUrl

      const res = await saveUnitDocumentAction({
        unitId,
        docKey,
        fileUrl: publicUrl,
        fileName: file.name,
      })

      if (res.success && res.documents) {
        const cleanDocs = { ...res.documents }
        delete cleanDocs.__unit_meta
        setDocs(cleanDocs)
        setMessage(t.uploadSuccess)
      } else {
        setErrorMsg(res.error || 'تعذر حفظ المستند')
      }
    } finally {
      setUploadingKey(null)
    }
  }

  const handleRemoveDocument = async (docKey: DocKeyType) => {
    if (!unitId) return
    setDeletingKey(docKey)
    setMessage('')
    setErrorMsg('')

    try {
      const res = await deleteUnitDocumentAction({ unitId, docKey })
      if (res.success && res.documents) {
        const cleanDocs = { ...res.documents }
        delete cleanDocs.__unit_meta
        setDocs(cleanDocs)
        setMessage(deleteSuccessLabel)
      }
    } finally {
      setDeletingKey(null)
    }
  }

  const uploadedCount = DOCUMENT_SECTIONS.filter((s) =>
    Boolean(docs[s.key]?.url)
  ).length

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-4 py-12 pb-24 text-[var(--brand-navy,#0a1122)]"
    >
      <div className="mx-auto max-w-[660px]">
        <header className="mb-6 text-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-black text-[var(--brand-navy,#0a1122)]">
              {t.title}
            </h1>
            {projectName && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a1122] px-3 py-1 text-xs font-extrabold text-white">
                <Building2 className="size-3.5 text-emerald-400" />
                <span>{projectName}</span>
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            {t.subtitle}
          </p>

          {/* إذا كان لدى البائع أكثر من وحدة، نتيح له التبديل بينها بأمان */}
          {userUnits.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {userUnits.map((u) => {
                const active = u.id === unitId
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      router.replace(`/account/documents?unitId=${u.id}`)
                    }
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-extrabold transition ${
                      active
                        ? 'border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {u.project_name || 'وحدة'}
                  </button>
                )
              })}
            </div>
          )}
        </header>

        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-start ${
            uploadedCount === 4
              ? 'border-emerald-200 bg-[#eaf8f2] text-[#007a5a]'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {uploadedCount === 4 ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#007a5a]" />
          ) : (
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
          )}
          <div className="flex-1 text-xs leading-relaxed">
            <strong className="block font-extrabold">
              {t.mandatoryPublishTitle}
            </strong>
            <p className="mt-0.5 opacity-90">{t.mandatoryPublishDesc}</p>
          </div>
          <span
            dir="ltr"
            className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black shadow-2xs"
          >
            {uploadedCount}/4
          </span>
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] p-3.5 text-center text-xs font-bold text-[var(--brand-primary,#007a5a)]">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-center text-xs font-bold text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-xs font-bold text-gray-500">
            {t.loading}
          </div>
        ) : !unitId ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-sm font-bold text-gray-600">{noUnitsLabel}</p>
            <Link
              href="/sell?new=1"
              className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#007a5a] px-5 text-xs font-extrabold text-white"
            >
              <Plus className="size-4" />
              <span>{dict.accountPages.main?.sellCta || 'اعرض وحدتك للبيع'}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {DOCUMENT_SECTIONS.map((sec) => {
              const docInfo = docs[sec.key]
              const isUploading = uploadingKey === sec.key
              const isDeleting = deletingKey === sec.key
              const hasFile = Boolean(docInfo?.url)
              const isImage = hasFile && isImageUrl(docInfo.url, docInfo.name)

              return (
                <div
                  key={sec.key}
                  className="rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                      {sec.title}
                    </h2>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary,#007a5a)] px-4 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]">
                        {isUploading ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="size-3.5 animate-spin" />
                            {t.uploading}
                          </span>
                        ) : hasFile ? (
                          <span className="inline-flex items-center gap-1.5">
                            <RefreshCw className="size-3.5" />
                            {changeFileLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <UploadCloud className="size-3.5" />
                            {t.uploadBtn}
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          disabled={isUploading || isDeleting}
                          onChange={(e) =>
                            handleFileUpload(sec.key, e.target.files)
                          }
                        />
                      </label>

                      {hasFile && (
                        <button
                          type="button"
                          disabled={isDeleting || isUploading}
                          onClick={() => handleRemoveDocument(sec.key)}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          <span>{removeFileLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {hasFile ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-[#f8f9fb] p-3 text-xs">
                      <div className="flex items-center gap-3">
                        {isImage ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                url: docInfo.url,
                                title: sec.title,
                              })
                            }
                            className="group relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
                          >
                            <img
                              src={docInfo.url}
                              alt={sec.title}
                              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                              <Eye className="size-4 text-white" />
                            </span>
                          </button>
                        ) : (
                          <a
                            href={docInfo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50 text-[10px] font-extrabold text-teal-800 hover:bg-teal-100"
                          >
                            <FileText className="size-5 text-teal-700" />
                            <span>PDF</span>
                          </a>
                        )}

                        <div className="text-start">
                          <p className="max-w-[200px] truncate font-bold text-[#0a1122] sm:max-w-[280px]">
                            {docInfo.name || sec.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-[10.5px] font-bold text-[#0369a1]">
                              {docInfo.status === 'approved'
                                ? t.statusApproved
                                : t.statusPending}
                            </span>
                            <span
                              dir="ltr"
                              className="font-mono text-[11px] text-gray-500"
                            >
                              {docInfo.uploaded_at ||
                                new Date().toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isImage ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              url: docInfo.url,
                              title: sec.title,
                            })
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-[#0a1122] hover:bg-slate-50"
                        >
                          <Eye className="size-3.5 text-[#007a5a]" />
                          <span>{viewImageLabel}</span>
                        </button>
                      ) : (
                        <a
                          href={docInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-[#0a1122] hover:bg-slate-50"
                        >
                          <Eye className="size-3.5 text-[#007a5a]" />
                          <span>{openPdfLabel}</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-start text-xs text-gray-400">
                      {t.emptySection}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href={unitId ? `/account?view=seller&unitId=${unitId}` : '/account'}
            className="text-xs font-bold text-[var(--brand-primary,#007a5a)] hover:underline"
          >
            {tCommon.backToAccount}
          </Link>
        </div>
      </div>

      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-extrabold text-[#0a1122]">
                {previewDoc.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex max-h-[80vh] items-center justify-center overflow-auto bg-slate-950/5 p-2">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[76vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function AccountDocumentsPage() {
  return (
    <Suspense fallback={null}>
      <AccountDocumentsContent />
    </Suspense>
  )
}