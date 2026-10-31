'use client'

import { Columns, Heart, ImagePlus, MapPin, Share2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { getSellerFormTranslations } from './seller-i18n'

export function LivePreviewSidebar({
  images,
  livePreviewData,
  form,
  propertyKind,
  strength,
}: {
  images: string[]
  livePreviewData: { title: string; area: string; priceDisplay: string }
  form: Record<string, string>
  propertyKind: string
  strength: number
}) {
  const { locale } = useTranslation()
  const fT = getSellerFormTranslations(locale)
  const pvT = fT.previewSidebar

  return (
    <aside className="space-y-4 lg:sticky lg:top-28 lg:col-span-4">
      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-black text-[#0a1122]">{pvT.title}</h3>
        <p className="text-[11px] text-slate-400">{pvT.subtitle}</p>

        <div className="mt-3.5 overflow-hidden rounded-2xl border border-slate-100 bg-[#f8fafc]">
          {images.length > 0 ? (
            <div className="relative aspect-[4/3] w-full">
              <img
                src={images[0]}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-xs">
                  <Share2 className="size-3.5" />
                </span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-xs">
                  <Columns className="size-3.5" />
                </span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-xs">
                  <Heart className="size-3.5" />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center p-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#2563eb]">
                <ImagePlus className="size-5" />
              </div>
              <strong className="mt-3 text-xs font-extrabold text-[#0a1122]">
                {pvT.emptyPhotoTitle}
              </strong>
              <span className="mt-1 text-[11px] text-slate-400">
                {pvT.emptyPhotoSub}
              </span>
            </div>
          )}

          {(images.length > 0 ||
            form.location ||
            form.areaSize ||
            form.contractPrice ||
            form.paidAmount ||
            form.rentPrice) && (
            <div className="bg-white p-4 text-start">
              <strong
                dir="ltr"
                className="block text-lg font-black text-[#0a1122]"
              >
                {livePreviewData.priceDisplay}
              </strong>
              <p className="mt-2 line-clamp-2 text-xs font-extrabold text-slate-800">
                {livePreviewData.title}
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="size-3 text-[#2563eb]" />
                <span>{livePreviewData.area}</span>
              </p>

              {(form.areaSize || form.bedrooms || form.floor) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 text-[11px] font-bold text-slate-500">
                  {form.areaSize && <span>📐 {form.areaSize} m²</span>}
                  {propertyKind !== 'Land' && form.bedrooms && (
                    <span>
                      🛏 {form.bedrooms} {pvT.bedsShort}
                    </span>
                  )}
                  {propertyKind !== 'Land' && form.floor && (
                    <span>
                      🏢 {form.floor}/{form.totalFloors || 12}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 text-start shadow-2xs">
        <div className="flex items-center justify-between">
          <strong className="text-xs font-black text-[#0a1122] sm:text-sm">
            {pvT.strengthTitle}
          </strong>
          <span className="font-mono text-xs font-black text-[#0a1122]">
            {strength}%
          </span>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#ea580c] transition-all duration-500"
            style={{ width: `${strength}%` }}
          />
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          {strength >= 80 ? pvT.strengthGreat : pvT.strengthGood}
        </p>

        <ul className="mt-3 space-y-1.5 text-[11px] font-bold">
          {images.length < 5 && (
            <li className="text-[#2563eb]">
              +25 <span className="text-slate-700">{pvT.tipPhotos}</span>
            </li>
          )}
          {!form.location && (
            <li className="text-[#2563eb]">
              +10 <span className="text-slate-700">{pvT.tipLocation}</span>
            </li>
          )}
          {!form.areaSize && (
            <li className="text-[#2563eb]">
              +10 <span className="text-slate-700">{pvT.tipDetails}</span>
            </li>
          )}
        </ul>
      </div>
    </aside>
  )
}