'use server'

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { getServerI18n } from '@/lib/get-server-dictionary'

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
    const { asOf, chunk, isFirstChunk } = params
    if (!Array.isArray(chunk)) {
      return {
        success: false,
        savedCount: 0,
        error: sDict.mapInvalidChunkData || sDict.mapSaveChunkError,
      }
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

    accumulatedItems.push(...chunk)

    const filePayload = {
      asOf: asOf || new Date().toISOString().slice(0, 10),
      totalCount: accumulatedItems.length,
      items: accumulatedItems,
    }

    await fs.writeFile(
      targetPath,
      JSON.stringify(filePayload),
      'utf-8'
    )

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