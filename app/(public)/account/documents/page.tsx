'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { saveUnitDocumentAction } from '@/app/actions/account-actions'
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { ScrollReveal } from '@/components/scroll-reveal'
import { useTranslation } from '@/lib/i18n'

export default function AccountDocumentsPage() {
  const { t: dict, dir } = useTranslation()
  const t = dict.accountPages.documents as Record<string, any>
  const tCommon = dict.accountPages.common

  const DOCUMENT_SECTIONS = [
    { key: 'contract' as const, title: t.sections?.contract },
    { key: 'receipts' as const, title: t.sections?.receipts },
    { key: 'statement' as const, title: t.sections?.statement },
    // استخدام مفتاح passport (صورة جواز السفر المعتمدة في جورجيا) مع دعم التوافق مع القاموس الحالي
    {
      key: 'national_id' as const,
      title: t.sections?.passport || t.sections?.national_id,
    },
  ]

  const searchParams = useSearchParams()
  const unitIdParam = searchParams.get('unitId')

  const [unitId, setUnitId] = useState<string>(unitIdParam || '')
  const [docs, setDocs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadDocs() {
      const supabase = createClient()
      let query = supabase
        .from('sell_requests')
        .select('id, documents')
        .order('created_at', { ascending: false })

      if (unitIdParam) {
        query = query.eq('id', unitIdParam)
      }

      const { data } = await query.limit(1).maybeSingle()
      if (data) {
        setUnitId(String(data.id))
        setDocs(
          data.documents && typeof data.documents === 'object'
            ? data.documents
            : {}
        )
      }
      setLoading(false)
    }
    loadDocs()
  }, [unitIdParam])

  const handleFileUpload = async (
    docKey: 'contract' | 'receipts' | 'statement' | 'national_id',
    files: FileList | null
  ) => {
    const file = files?.[0]
    if (!file || !unitId) return

    setUploadingKey(docKey)
    setMessage('')

    try {
      const supabase = createClient()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
      const path = `documents/${unitId}/${docKey}-${Date.now()}-${cleanName}`

      const { error: uploadErr } = await supabase.storage
        .from('unit-images')
        .upload(path, file, { contentType: file.type, upsert: true })

      let publicUrl = `https://storage.aqarexit.com/${path}`
      if (!uploadErr) {
        publicUrl = supabase.storage.from('unit-images').getPublicUrl(path)
          .data.publicUrl
      }

      const res = await saveUnitDocumentAction({
        unitId,
        docKey,
        fileUrl: publicUrl,
        fileName: file.name,
      })

      if (res.success && res.documents) {
        setDocs(res.documents)
        setMessage(t.uploadSuccess)
      }
    } finally {
      setUploadingKey(null)
    }
  }

  const uploadedCount = DOCUMENT_SECTIONS.filter(
    (s) => Boolean(docs[s.key]?.url)
  ).length

  return (
    <main
      dir={dir}
      className="min-h-screen bg-[var(--brand-surface,#f5f6f8)] px-4 py-12 pb-24 text-[var(--brand-navy,#0a1122)]"
    >
      <div className="mx-auto max-w-[660px]">
        <ScrollReveal>
          <header className="mb-6 text-start">
            <h1 className="text-2xl font-black text-[var(--brand-navy,#0a1122)]">
              {t.title}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
              {t.subtitle}
            </p>
          </header>

          {/* تنبيه إلزامية رفع المستندات وجواز السفر لنشر الوحدة في السوق */}
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-start ${
              uploadedCount > 0
                ? 'border-emerald-200 bg-[#eaf8f2] text-[#007a5a]'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {uploadedCount > 0 ? (
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
        </ScrollReveal>

        {message && (
          <div className="mb-6 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] p-3.5 text-center text-xs font-bold text-[var(--brand-primary,#007a5a)]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-xs font-bold text-gray-500">
            {t.loading}
          </div>
        ) : (
          <div className="space-y-4">
            {DOCUMENT_SECTIONS.map((sec, idx) => {
              const docInfo = docs[sec.key]
              const isUploading = uploadingKey === sec.key

              return (
                <ScrollReveal key={sec.key} delay={idx * 60}>
                  <div className="rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-2xs sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                        {sec.title}
                      </h2>

                      <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]">
                        {isUploading ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="size-3.5 animate-spin" />
                            {t.uploading}
                          </span>
                        ) : (
                          t.uploadBtn
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          disabled={isUploading}
                          onChange={(e) =>
                            handleFileUpload(sec.key, e.target.files)
                          }
                        />
                      </label>
                    </div>

                    {docInfo?.url ? (
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f8f9fb] px-4 py-2.5 text-xs">
                        <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-[11px] font-bold text-[#0369a1]">
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
                    ) : (
                      <p className="mt-3 text-start text-xs text-gray-400">
                        {t.emptySection}
                      </p>
                    )}
                  </div>
                </ScrollReveal>
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
    </main>
  )
}