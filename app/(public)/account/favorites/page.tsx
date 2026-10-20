'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowRight, Heart, Star, Trash2 } from 'lucide-react'

const FAVORITES_STORAGE_KEY = 'darak_favorites'

export default function AccountFavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true)
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
        const ids: string[] = stored ? JSON.parse(stored) : []
        setFavoriteIds(ids)

        if (ids.length === 0) {
          setUnits([])
          setLoading(false)
          return
        }

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data } = await supabase
          .from('sell_requests')
          .select('*')
          .in('id', ids)
          .neq('status', 'deleted_by_seller')

        setUnits(data || [])
      } catch (e) {
        console.error('Error loading favorites:', e)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const removeFromFavorites = (unitId: string) => {
    const nextIds = favoriteIds.filter((id) => String(id) !== String(unitId))
    setFavoriteIds(nextIds)
    setUnits((prev) => prev.filter((u) => String(u.id) !== String(unitId)))
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextIds))
      window.dispatchEvent(new Event('favorites-updated'))
    } catch {}
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f5f6f8] py-8 pb-20 text-[#0a1122] sm:py-12"
    >
      <div className="mx-auto max-w-[980px] px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-extrabold text-[#0a1122] shadow-2xs transition hover:border-[#0b6954] hover:text-[#0b6954]"
          >
            <ArrowRight className="size-4" />
            <span>رجوع لحسابي</span>
          </Link>

          <Link
            href="/opportunities"
            className="text-xs font-bold text-[#0b6954] hover:underline"
          >
            تصفح كل الفرص ←
          </Link>
        </div>

        <header className="mb-6 text-right">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            <Heart className="size-3.5 fill-current" />
            <span>قائمة المفضلة</span>
          </div>
          <h1 className="mt-2 text-xl font-extrabold text-[#0a1122] sm:text-2xl">
            الوحدات المحفوظة في مفضلتك ({units.length})
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            يمكنك الرجوع لهذه الوحدات في أي وقت ومقارنتها بسهولة.
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-xs font-bold text-gray-500">
            جاري تحميل وحداتك المفضلة...
          </div>
        ) : units.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center shadow-2xs">
            <Heart className="mx-auto mb-3 size-10 text-gray-300" />
            <p className="text-sm font-extrabold text-[#0a1122]">
              لم تقم بإضافة أي وحدات للمفضلة حتى الآن
            </p>
            <p className="mt-1 text-xs text-gray-500">
              اضغط على علامة القلب أعلى أي وحدة في صفحة الفرص لحفظها هنا.
            </p>
            <Link
              href="/opportunities"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#0b6954] px-6 text-xs font-bold text-white hover:bg-[#095443]"
            >
              تصفح الفرص المتاحة
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3">
            {units.map((u) => {
              const paid = Number(u.paid_amount) || 0
              const discount = u.willing_to_discount
                ? Number(u.discount_amount) || 0
                : 0
              const requiredCash = Math.max(0, paid - discount)
              const isFeat =
                Boolean(u.is_featured) &&
                (!u.featured_until || new Date(u.featured_until) > new Date())
              const img =
                Array.isArray(u.images) && u.images[0]
                  ? u.images[0]
                  : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'

              return (
                <div
                  key={u.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-[16px] border border-gray-200 bg-white shadow-2xs transition hover:shadow-md"
                >
                  <div>
                    <div className="relative h-[125px] w-full overflow-hidden bg-gray-100 sm:h-[175px]">
                      <Link
                        href={`/opportunities/${u.id}`}
                        className="block h-full w-full"
                      >
                        <img
                          src={img}
                          alt={u.project_name || 'وحدة'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      {isFeat && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 shadow-xs">
                          <Star className="size-3 fill-amber-400 text-amber-500" />
                          <span>مميزة</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromFavorites(u.id)}
                        title="إزالة من المفضلة"
                        className="absolute top-2 left-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md transition hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <Link
                      href={`/opportunities/${u.id}`}
                      className="block p-3.5 text-right sm:p-4"
                    >
                      <h3 className="line-clamp-1 text-xs font-extrabold text-[#0a1122] group-hover:text-[#0b6954] sm:text-sm">
                        {u.project_name || 'وحدة سكنية'}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-400 sm:text-xs">
                        {u.area || '—'} · {u.unit_type || 'شقة'} ·{' '}
                        {u.rooms || 3} غرف
                      </p>

                      <div className="mt-3">
                        <p className="text-[10px] text-gray-400">
                          المطلوب كاش دلوقتي
                        </p>
                        <p className="text-sm font-extrabold text-[#0b6954] tabular-nums sm:text-lg">
                          {requiredCash.toLocaleString('en-US')} ج.م
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="px-3.5 pb-3.5">
                    <Link
                      href={`/opportunities/${u.id}`}
                      className="flex h-9 w-full items-center justify-center rounded-xl bg-[#0a1122] text-xs font-bold text-white hover:bg-[#16223f]"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}