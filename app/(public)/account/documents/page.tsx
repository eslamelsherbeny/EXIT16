'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { saveUnitDocumentAction } from '@/app/actions/account-actions'
import { Loader2 } from 'lucide-react'

const DOCUMENT_SECTIONS = [
  { key: 'contract' as const, title: 'عقد الوحدة' },
  { key: 'receipts' as const, title: 'إيصالات السداد' },
  { key: 'statement' as const, title: 'آخر كشف حساب من المطور' },
  { key: 'national_id' as const, title: 'بطاقة الرقم القومي' },
]

export default function AccountDocumentsPage() {
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
        setMessage('تم رفع المستند بنجاح وهو الآن قيد المراجعة ✓')
      }
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f6f8] px-4 py-12 pb-24 text-[#0a1122]"
    >
      <div className="mx-auto max-w-[660px]">
        <header className="mb-8 text-right">
          <h1 className="text-2xl font-black text-[#0a1122]">مستندات حالتك</h1>
          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            ارفع صور واضحة أو PDF — كل مستند بيتراجع من فريقنا وبنعلّم عليه لما
            يتقبل
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded-xl bg-[#eff9f5] p-3.5 text-center text-xs font-bold text-[#0b6954]">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-xs font-bold text-gray-500">
            جاري تحميل المستندات...
          </div>
        ) : (
          <div className="space-y-4">
            {DOCUMENT_SECTIONS.map((sec) => {
              const docInfo = docs[sec.key]
              const isUploading = uploadingKey === sec.key

              return (
                <div
                  key={sec.key}
                  className="rounded-[18px] border border-gray-200/80 bg-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-extrabold text-[#0a1122] sm:text-base">
                      {sec.title}
                    </h2>

                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#0b6954] px-5 text-xs font-bold text-white transition hover:bg-[#095443]">
                      {isUploading ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          جاري الرفع...
                        </span>
                      ) : (
                        'ارفع الملف'
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
                          ? 'تم القبول ✓'
                          : 'وصل — قيد المراجعة'}
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
                    <p className="mt-3 text-right text-xs text-gray-400">
                      مفيش ملفات مرفوعة في القسم ده
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
            className="text-xs font-bold text-[#0b6954] hover:underline"
          >
            رجوع لحسابي
          </Link>
        </div>
      </div>
    </main>
  )
}