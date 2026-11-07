// ملف: app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqarexit.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/opportunities`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.95 },
    { url: `${baseUrl}/sell`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/buy`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/story`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: units } = await supabase
      .from('sell_requests')
      .select('id, updated_at, created_at')
      .in('status', ['active', 'approved', 'published', 'offer_received'])
      .limit(1000)

    const unitRoutes: MetadataRoute.Sitemap = (units || []).map((u) => ({
      url: `${baseUrl}/opportunities/${u.id}`,
      lastModified: new Date(u.updated_at || u.created_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.85,
    }))

    return [...staticRoutes, ...unitRoutes]
  } catch {
    return staticRoutes
  }
}