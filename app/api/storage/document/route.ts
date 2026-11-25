import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  getSecret,
  getSupabase,
  getVerifiedSellerSession,
} from '@/lib/form-action-helpers'

const SAFE_DOC_PATH_REGEX =
  /^documents\/[a-zA-Z0-9_-]{4,64}\/[a-zA-Z0-9._-]{4,120}$/
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const DRAFT_COOKIE_NAME = 'sell_draft_upload_id'

function parseSignedDraftFolderCookie(raw?: string): string | null {
  if (!raw || !raw.includes('.')) return null
  const [folderId, sig] = raw.split('.')
  if (!folderId || !folderId.startsWith('draft_') || !sig) return null
  const expected = createHmac('sha256', getSecret())
    .update(`draft_folder:${folderId}`)
    .digest('hex')
    .slice(0, 24)
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null
  }
  return folderId
}

export async function GET(request: NextRequest) {
  try {
    const rawPath = String(request.nextUrl.searchParams.get('path') || '').trim()

    if (
      !rawPath ||
      rawPath.includes('..') ||
      rawPath.includes('\\') ||
      !SAFE_DOC_PATH_REGEX.test(rawPath)
    ) {
      return NextResponse.json({ error: 'Invalid document path' }, { status: 400 })
    }

    const folderId = rawPath.split('/')[1]
    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)

    let authorized = false

    if (sessionUser) {
      const role = String(sessionUser.role || 'user').trim().toLowerCase()
      const isStaff =
        role === 'owner' ||
        role === 'admin' ||
        role === 'moderator' ||
        role === 'sales'

      if (isStaff) {
        authorized = true
      } else if (
        folderId ===
        `user_${String(sessionUser.id).replace(/-/g, '').slice(0, 16)}`
      ) {
        authorized = true
      } else if (UUID_REGEX.test(folderId)) {
        const { data: unit } = await supabase
          .from('sell_requests')
          .select('id, user_id')
          .eq('id', folderId)
          .maybeSingle()
        if (unit && String(unit.user_id) === String(sessionUser.id)) {
          authorized = true
        }
      } else if (folderId.startsWith('draft_')) {
        // لو العميل رفع المستند كمسودة ثم سجّل حسابه وحفظ الوحدة، نتحقق من وجود الرابط داخل وحداته
        const { data: userUnits } = await supabase
          .from('sell_requests')
          .select('id, documents')
          .eq('user_id', sessionUser.id)
          .limit(30)

        const expectedRef = `/api/storage/document?path=${encodeURIComponent(rawPath)}`
        for (const u of userUnits || []) {
          const docs = u?.documents
          if (!docs || typeof docs !== 'object') continue
          for (const k of ['contract', 'receipts', 'statement', 'passport']) {
            const urlVal = String((docs as any)[k]?.url || '')
            if (urlVal === expectedRef || urlVal.includes(rawPath)) {
              authorized = true
              break
            }
          }
          if (authorized) break
        }
      }
    }

    if (!authorized && folderId.startsWith('draft_')) {
      const cookieStore = await cookies()
      const verifiedDraftFolder = parseSignedDraftFolderCookie(
        cookieStore.get(DRAFT_COOKIE_NAME)?.value
      )
      if (verifiedDraftFolder && verifiedDraftFolder === folderId) {
        authorized = true
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // إصدار رابط موقّت صالح لـ 60 ثانية فقط للوصول للملف من الـ Bucket الخاص
    const { data: signedData, error } = await supabase.storage
      .from('unit-documents')
      .createSignedUrl(rawPath, 60)

    if (error || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const res = NextResponse.redirect(signedData.signedUrl, 307)
    res.headers.set('Cache-Control', 'private, no-store, max-age=0')
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}