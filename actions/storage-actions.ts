'use server'

import { cookies, headers } from 'next/headers'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import {
  getSecret,
  getSupabase,
  getVerifiedSellerSession,
} from '@/lib/form-action-helpers'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const DRAFT_COOKIE_NAME = 'sell_draft_upload_id'

const PHOTO_ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const DOC_ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf'])

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

const ALLOWED_DOC_KEYS = new Set([
  'contract',
  'receipts',
  'statement',
  'passport',
])

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

// حماية من إغراق الرفع للزوار قبل إنشاء الحساب (30 ملف كل 15 دقيقة لكل IP)
const uploadRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkUploadRateLimit(key: string, maxRequests = 30): boolean {
  const now = Date.now()
  const entry = uploadRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    uploadRateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count += 1
  return true
}

function signDraftFolderId(folderId: string): string {
  const sig = createHmac('sha256', getSecret())
    .update(`draft_folder:${folderId}`)
    .digest('hex')
    .slice(0, 24)
  return `${folderId}.${sig}`
}

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

async function getOrCreateDraftFolderId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = parseSignedDraftFolderCookie(
    cookieStore.get(DRAFT_COOKIE_NAME)?.value
  )
  if (existing) return existing

  const freshFolder = `draft_${randomUUID().replace(/-/g, '').slice(0, 16)}`
  const isProd = process.env.NODE_ENV === 'production'
  cookieStore.set(DRAFT_COOKIE_NAME, signDraftFolderId(freshFolder), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: isProd,
    httpOnly: true,
  })
  return freshFolder
}

async function ensurePrivateDocumentsBucket(supabase: any) {
  try {
    const { data: existing } = await supabase.storage.getBucket(
      'unit-documents'
    )
    if (existing) return
    await supabase.storage.createBucket('unit-documents', {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ],
    })
  } catch {}
}

export async function createSignedUploadUrlAction(params: {
  kind: 'unit_photo' | 'unit_document'
  fileName: string
  contentType?: string
  fileSize: number
  unitId?: string
  docKey?: string
}): Promise<{
  success: boolean
  bucket?: 'unit-images' | 'unit-documents'
  path?: string
  token?: string
  contentType?: string
  fileUrl?: string
  error?: string
}> {
  try {
    const size = Number(params.fileSize) || 0
    if (size <= 0 || size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: 'File size must be between 1 byte and 10 MB.',
      }
    }

    const rawName = String(params.fileName || '').trim()
    const ext = (rawName.split('.').pop() || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')

    const allowedExts =
      params.kind === 'unit_document' ? DOC_ALLOWED_EXTS : PHOTO_ALLOWED_EXTS

    if (!allowedExts.has(ext)) {
      return {
        success: false,
        error: 'Unsupported file type.',
      }
    }

    const safeContentType = EXT_TO_MIME[ext]
    const rawMime = String(params.contentType || '').toLowerCase().trim()
    if (
      rawMime &&
      rawMime !== safeContentType &&
      !(ext === 'jpg' && rawMime === 'image/jpg') &&
      !(ext === 'jpeg' && rawMime === 'image/jpg')
    ) {
      // نتأكد أن نوع الملف المعلن يطابق الامتداد
      if (!Object.values(EXT_TO_MIME).includes(rawMime)) {
        return { success: false, error: 'Invalid file content type.' }
      }
    }

    const hdrs = await headers()
    const clientIp =
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      hdrs.get('x-real-ip')?.trim() ||
      'unknown'

    const supabase = await getSupabase()
    const sessionUser = await getVerifiedSellerSession(supabase)

    const rateKey = sessionUser
      ? `user:${sessionUser.id}`
      : `ip:${clientIp}`
    if (!checkUploadRateLimit(rateKey, sessionUser ? 60 : 25)) {
      return {
        success: false,
        error: 'Too many uploads. Please wait a few minutes and try again.',
      }
    }

    const cleanUnitId = String(params.unitId || '').trim()
    let folderSegment = ''

    if (cleanUnitId && cleanUnitId !== 'draft') {
      if (!UUID_REGEX.test(cleanUnitId) || !sessionUser) {
        return { success: false, error: 'Unauthorized upload request.' }
      }

      const role = String(sessionUser.role || 'user').trim().toLowerCase()
      const isStaff =
        role === 'owner' ||
        role === 'admin' ||
        role === 'moderator' ||
        role === 'sales'

      const { data: unit } = await supabase
        .from('sell_requests')
        .select('id, user_id')
        .eq('id', cleanUnitId)
        .maybeSingle()

      if (
        !unit ||
        (!isStaff && String(unit.user_id || '') !== String(sessionUser.id))
      ) {
        return { success: false, error: 'Unauthorized unit access.' }
      }

      folderSegment = cleanUnitId
    } else {
      folderSegment = sessionUser
        ? `user_${String(sessionUser.id).replace(/-/g, '').slice(0, 16)}`
        : await getOrCreateDraftFolderId()
    }

    if (params.kind === 'unit_photo') {
      const path = `units/${folderSegment}/${randomUUID()}.${ext}`
      const { data, error } = await supabase.storage
        .from('unit-images')
        .createSignedUploadUrl(path)

      if (error || !data?.token) {
        return {
          success: false,
          error: error?.message || 'Could not prepare image upload.',
        }
      }

      const publicUrl = supabase.storage.from('unit-images').getPublicUrl(path)
        .data.publicUrl

      return {
        success: true,
        bucket: 'unit-images',
        path,
        token: data.token,
        contentType: safeContentType,
        fileUrl: publicUrl,
      }
    }

    // مستندات الملكية وجواز السفر تُرفع في Bucket خاص (Private) محمي بالكامل
    const cleanDocKey = ALLOWED_DOC_KEYS.has(String(params.docKey || ''))
      ? String(params.docKey)
      : 'contract'

    await ensurePrivateDocumentsBucket(supabase)

    const docPath = `documents/${folderSegment}/${cleanDocKey}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
    const { data, error } = await supabase.storage
      .from('unit-documents')
      .createSignedUploadUrl(docPath)

    if (error || !data?.token) {
      return {
        success: false,
        error: error?.message || 'Could not prepare document upload.',
      }
    }

    return {
      success: true,
      bucket: 'unit-documents',
      path: docPath,
      token: data.token,
      contentType: safeContentType,
      fileUrl: `/api/storage/document?path=${encodeURIComponent(docPath)}`,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Upload preparation failed.',
    }
  }
}