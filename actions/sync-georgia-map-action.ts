'use server'

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { getServerI18n } from '@/lib/get-server-dictionary'
import { requireAdminAuth, sanitizeText } from '@/lib/admin-auth-helpers'

export type StoredGeorgiaPoiRecord = {
  id: string
  category: string
  lat: number
  lng: number
  names: {
    ar: string
    en: string
    ru: string
    ka: string
  }
}

const MAX_CHUNK_ITEMS = 5000
const MAX_TOTAL_POIS = 50000
const ALLOWED_POI_CATEGORIES = new Set([
  'metro',
  'school',
  'kindergarten',
  'pharmacy',
  'park',
  'market',
  'restaurants',
  'clinic',
  'university',
  'bank',
  'landmark',
  'gym',
  'bus',
])

function isValidGeorgiaCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 40.9 &&
    lat <= 43.7 &&
    lng >= 39.8 &&
    lng <= 46.9
  )
}

function resolveGeorgiaPoisJsonFilePath(): string {
  const cwd = process.cwd()
  const srcLibDir = path.join(cwd, 'src', 'lib')
  const rootLibDir = path.join(cwd, 'lib')

  if (existsSync(srcLibDir)) {
    return path.join(srcLibDir, 'georgia-real-osm-pois.json')
  }
  if (existsSync(rootLibDir)) {
    return path.join(rootLibDir, 'georgia-real-osm-pois.json')
  }
  return path.join(rootLibDir, 'georgia-real-osm-pois.json')
}

export async function saveGeorgiaPoisChunkAction(params: {
  asOf: string
  chunk: StoredGeorgiaPoiRecord[]
  isFirstChunk: boolean
  isLastChunk: boolean
  totalExpected: number
}): Promise<{
  success: boolean
  savedCount: number
  error?: string
}> {
  const { dict } = await getServerI18n()
  const sDict = (dict.admin as Record<string, any>)?.settings || {}

  try {
    // قصر الكتابة على ملف الخريطة على مدير النظام (Admin / Owner) فقط
    await requireAdminAuth(['admin'])

    const { asOf, chunk, isFirstChunk } = params
    if (!Array.isArray(chunk) || chunk.length > MAX_CHUNK_ITEMS) {
      return {
        success: false,
        savedCount: 0,
        error: sDict.mapInvalidChunkData || sDict.mapSaveChunkError,
      }
    }

    const sanitizedChunk: StoredGeorgiaPoiRecord[] = []
    for (const item of chunk) {
      if (!item || typeof item !== 'object') continue
      const lat = Number(item.lat)
      const lng = Number(item.lng)
      const category = sanitizeText(item.category, 30).toLowerCase()
      const id = sanitizeText(item.id, 80)

      if (
        !id ||
        !ALLOWED_POI_CATEGORIES.has(category) ||
        !isValidGeorgiaCoord(lat, lng)
      ) {
        continue
      }

      const rawNames =
        item.names && typeof item.names === 'object'
          ? item.names
          : { ar: '', en: '', ru: '', ka: '' }

      sanitizedChunk.push({
        id,
        category,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        names: {
          ar: sanitizeText(rawNames.ar, 160),
          en: sanitizeText(rawNames.en, 160),
          ru: sanitizeText(rawNames.ru, 160),
          ka: sanitizeText(rawNames.ka, 160),
        },
      })
    }

    const targetPath = resolveGeorgiaPoisJsonFilePath()
    await fs.mkdir(path.dirname(targetPath), { recursive: true })

    let accumulatedItems: StoredGeorgiaPoiRecord[] = []

    if (!isFirstChunk) {
      try {
        const existingRaw = await fs.readFile(targetPath, 'utf-8')
        const parsed = JSON.parse(existingRaw)
        if (Array.isArray(parsed?.items)) {
          accumulatedItems = parsed.items
        }
      } catch {}
    }

    if (accumulatedItems.length + sanitizedChunk.length > MAX_TOTAL_POIS) {
      return {
        success: false,
        savedCount: accumulatedItems.length,
        error: sDict.mapInvalidChunkData || sDict.mapSaveChunkError,
      }
    }

    accumulatedItems.push(...sanitizedChunk)

    const cleanAsOf = /^\d{4}-\d{2}-\d{2}$/.test(String(asOf || '').trim())
      ? String(asOf).trim()
      : new Date().toISOString().slice(0, 10)

    const filePayload = {
      asOf: cleanAsOf,
      totalCount: accumulatedItems.length,
      items: accumulatedItems,
    }

    await fs.writeFile(targetPath, JSON.stringify(filePayload), 'utf-8')

    return {
      success: true,
      savedCount: accumulatedItems.length,
    }
  } catch (err: any) {
    return {
      success: false,
      savedCount: 0,
      error:
        err?.message ||
        sDict.mapServerWriteError ||
        sDict.mapSyncErrorFallback,
    }
  }
}