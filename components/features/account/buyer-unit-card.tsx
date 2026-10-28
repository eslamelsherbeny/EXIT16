'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  ShieldAlert,
  Wallet,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import {
  GEORGIA_CITIES_AND_DISTRICTS,
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { type LocaleCode } from '@/lib/i18n'

export function BuyerUnitCard({
  t,
  unit,
  isLiked,
  onToggleLike,
}: {
  t: Record<string, any>
  unit: any
  isLiked: boolean
  onToggleLike: () => void
}) {
  return (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-[18px] border border-gray-200/90 bg-white shadow-2xs transition hover:shadow-md">
      <div>
        <div className="relative h-[165px] w-full overflow-hidden bg-gray-100 sm:h-[185px]">
          <Link
            href={`/opportunities/${unit.id}`}
            className="block h-full w-full"
          >
            <img
              src={
                unit.image ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
              }
              alt={unit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#0a1122]/90 px-3 py-1 text-[11px] font-black text-emerald-300 shadow-sm backdrop-blur-xs">
            <span>🎯 {t.matchScorePrefix}</span>
            <span dir="ltr">{unit.scorePct}%</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onToggleLike()
            }}
            aria-label={t.addToFavoritesAria}
            className={`absolute top-3 left-3 flex size-8 items-center justify-center rounded-full shadow-md transition ${
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/95 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`size-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2">
            <span className="rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-xs">
              {unit.code}
            </span>
            <span className="rounded-md bg-white/95 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[var(--brand-navy,#0a1122)] shadow-2xs">
              {unit.deliveryStatus}
            </span>
          </div>
        </div>

        <div className="p-4 text-start sm:p-5">
          <Link href={`/opportunities/${unit.id}`}>
            <h3 className="line-clamp-1 text-sm font-extrabold text-[var(--brand-navy,#0a1122)] transition-colors group-hover:text-[var(--brand-primary,#007a5a)] sm:text-base">
              {unit.title}
            </h3>
          </Link>
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
            {unit.developer} · {unit.localizedArea}
          </p>

          <div className="mt-2.5 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-gray-100/80 px-2.5 py-1 text-[11px] font-bold text-[#1e293b]">
            <span>{unit.type}</span>
            <span>·</span>
            <span>
              {unit.rooms} {t.roomsWord}
            </span>
            <span>·</span>
            <span>
              {unit.size} {t.sqmUnit}
            </span>
          </div>

          <div className="mt-3.5 rounded-xl border border-gray-100 bg-[#f8faf9] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[10.5px] font-semibold text-gray-500">
                  {t.cardRequiredCash}
                </p>
                <p className="mt-0.5 text-base font-black text-[var(--brand-navy,#0a1122)] tabular-nums sm:text-lg">
                  <span dir="ltr">{unit.cashStr}</span>{' '}
                  <span className="text-xs font-bold">{unit.currency}</span>
                </p>
              </div>
              {unit.negotiable && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  ↓ {t.negotiableTag}
                </span>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-gray-200/70 pt-2 text-[11px]">
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.installmentShort}
                </span>
                <strong
                  dir="ltr"
                  className="font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums"
                >
                  {unit.monthlyInst > 0
                    ? `${unit.monthlyInstStr} ${unit.currency}`
                    : '—'}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400">
                  {t.remainingLabel}
                </span>
                <strong
                  dir="ltr"
                  className="font-extrabold text-[var(--brand-navy,#0a1122)] tabular-nums"
                >
                  {unit.remainingStr} {unit.currency}
                </strong>
              </div>
            </div>
          </div>

          {unit.gainStr && (
            <div className="mt-2.5 rounded-xl bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-2 text-start">
              <p
                dir="ltr"
                className="text-start text-xs font-extrabold text-[var(--brand-primary,#007a5a)] tabular-nums"
              >
                {unit.gainStr} {unit.currency}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-[#2b8a6e]">
                {t.cardMarketPriceToday} {unit.marketStr} {unit.currency}
              </p>
            </div>
          )}

          {unit.matchTags?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {unit.matchTags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#e3f2ef] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 px-4 py-3 sm:px-5">
        <Link
          href={`/account/offers?role=buyer&applyUnitId=${unit.id}`}
          className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary,#007a5a)] px-2.5 py-2 text-center text-xs font-extrabold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
        >
          <Wallet className="size-3.5 shrink-0" />
          <span className="leading-snug">{t.submitOfferBtn}</span>
        </Link>

        <Link
          href={`/opportunities/${unit.id}`}
          className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-center text-xs font-extrabold text-[var(--brand-navy,#0a1122)] transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="leading-snug">{t.detailsBtn}</span>
        </Link>
      </div>
    </div>
  )
}

export function BuyerEditPreferencesForm({
  t,
  dir,
  isRtl,
  locale,
  currency,
  listSep,
  bCash,
  setBCash,
  bInstallment,
  setBInstallment,
  bPlan,
  setBPlan,
  bBudget,
  setBBudget,
  bTypes,
  setBTypes,
  bRooms,
  setBRooms,
  bDelivery,
  setBDelivery,
  bAreas,
  setBAreas,
  localizedUnitTypes,
  localizedPreferredAreasNames,
  confirmSaveOpen,
  setConfirmSaveOpen,
  isPending,
  onClose,
  onExecuteSave,
}: {
  t: Record<string, any>
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  locale: LocaleCode
  currency: string
  listSep: string
  bCash: number
  setBCash: (v: number) => void
  bInstallment: number
  setBInstallment: (v: number) => void
  bPlan: string
  setBPlan: (v: string) => void
  bBudget: number
  setBBudget: (v: number) => void
  bTypes: string[]
  setBTypes: React.Dispatch<React.SetStateAction<string[]>>
  bRooms: number
  setBRooms: (v: number) => void
  bDelivery: string
  setBDelivery: (v: string) => void
  bAreas: string[]
  setBAreas: React.Dispatch<React.SetStateAction<string[]>>
  localizedUnitTypes: string[]
  localizedPreferredAreasNames: string[]
  confirmSaveOpen: boolean
  setConfirmSaveOpen: (v: boolean) => void
  isPending: boolean
  onClose: () => void
  onExecuteSave: () => void
}) {
  const georgiaQuickAreas = GEORGIA_CITIES_AND_DISTRICTS.slice(0, 10)

  const togglePopularArea = (areaId: string) => {
    setBAreas((prev) =>
      prev.includes(areaId)
        ? prev.length > 1
          ? prev.filter((x) => x !== areaId)
          : prev
        : [...prev, areaId]
    )
  }

  return (
    <div dir={dir} className="mx-auto max-w-[660px] px-4 py-4 sm:px-6">
      <div className="mb-5 flex items-center justify-start">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-[var(--brand-navy,#0a1122)] shadow-2xs transition hover:border-[var(--brand-primary,#007a5a)] hover:text-[var(--brand-primary,#007a5a)]"
        >
          {isRtl ? (
            <ArrowRight className="size-4" />
          ) : (
            <ArrowLeft className="size-4" />
          )}
          <span>{t.backToOpportunitiesBtn}</span>
        </button>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-2xl font-black text-[var(--brand-navy,#0a1122)] sm:text-3xl">
          {t.editHeaderTitle}
        </h1>
        <p className="mt-2 text-xs text-slate-500 sm:text-sm">
          {t.editHeaderSub}
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setConfirmSaveOpen(true)
        }}
        className="space-y-6"
      >
        <div className="space-y-6 rounded-[22px] border border-gray-200/80 bg-white p-6 text-start shadow-xs sm:p-8">
          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.availableCashLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={bCash ? bCash.toLocaleString('en-US') : ''}
              onChange={(e) =>
                setBCash(
                  Number(
                    toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                  ) || 0
                )
              }
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
            />
            <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              {bCash.toLocaleString('en-US')} {currency}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {t.availableCashHelper}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.maxInstallmentLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={bInstallment ? bInstallment.toLocaleString('en-US') : ''}
              onChange={(e) =>
                setBInstallment(
                  Number(
                    toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                  ) || 0
                )
              }
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
            />
            <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              {bInstallment.toLocaleString('en-US')} {currency}
            </p>
          </div>

          <div>
            <label className="mb-2.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.paymentPlanLabel}
            </label>
            <div className="space-y-2">
              {t.paymentPlans.map((plan: string) => (
                <label
                  key={plan}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold transition ${
                    bPlan === plan
                      ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    checked={bPlan === plan}
                    onChange={() => setBPlan(plan)}
                    className="accent-[var(--brand-primary,#007a5a)]"
                  />
                  <span>{plan}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.targetBudgetLabel}
            </label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={bBudget ? bBudget.toLocaleString('en-US') : ''}
              onChange={(e) =>
                setBBudget(
                  Number(
                    toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                  ) || 0
                )
              }
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-left text-sm font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
            />
            <p className="mt-1.5 text-xs font-bold text-[var(--brand-primary,#007a5a)]">
              {bBudget.toLocaleString('en-US')} {currency}
            </p>
          </div>

          <div>
            <label className="mb-2.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.unitTypeLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {localizedUnitTypes.map((typeItem: string) => {
                const active = bTypes.includes(typeItem)
                return (
                  <button
                    key={typeItem}
                    type="button"
                    onClick={() =>
                      setBTypes((prev) =>
                        prev.includes(typeItem)
                          ? prev.filter((x) => x !== typeItem)
                          : [...prev, typeItem]
                      )
                    }
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {active ? `✓ ${typeItem}` : typeItem}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.minRoomsLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={10}
                value={bRooms}
                onChange={(e) => setBRooms(Number(e.target.value) || 0)}
                className="h-11 w-28 rounded-xl border border-gray-200 text-center text-sm font-bold text-[var(--brand-navy,#0a1122)]"
              />
              <span className="text-xs text-gray-500">{t.roomWord}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {t.deliveryLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {t.deliveryPreferences.map((st: string) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBDelivery(st)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                    bDelivery === st
                      ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <GeorgiaAreaSelect
              label={t.preferredAreasLabel}
              value=""
              onChange={(selectedAreaId) => {
                if (!bAreas.includes(selectedAreaId)) {
                  setBAreas((prev) => [...prev, selectedAreaId])
                }
              }}
              placeholder={t.areaInputPlaceholder}
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {bAreas.map((ar: string) => (
                <span
                  key={ar}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-xs font-bold text-[var(--brand-primary,#007a5a)]"
                >
                  <span>{getLocalizedGeorgiaAreaName(ar, locale)}</span>
                  {bAreas.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setBAreas((prev) => prev.filter((x) => x !== ar))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {georgiaQuickAreas.map((item) => {
                const isAdded = bAreas.includes(item.id)
                const label = getLocalizedGeorgiaAreaName(item.id, locale)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePopularArea(item.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      isAdded
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {isAdded ? `✓ ${label}` : `+ ${label}`}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary,#007a5a)] text-sm font-bold text-white transition active:scale-[0.98] hover:bg-[var(--brand-primary-hover,#006248)]"
          >
            {isPending ? t.savingBtn : t.saveAndViewBtn}
          </button>
        </div>
      </form>

      <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[400px]"
        >
          <DialogHeader className="text-start">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[var(--brand-primary,#007a5a)]">
                <ShieldAlert className="size-4" />
              </span>
              <DialogTitle className="text-sm font-extrabold text-[var(--brand-navy,#0a1122)] sm:text-base">
                {t.confirmModalTitle}
              </DialogTitle>
            </div>
            <DialogDescription className="text-start text-xs leading-relaxed text-gray-600">
              {t.confirmModalDesc}{' '}
              <strong className="text-[var(--brand-primary,#007a5a)]">
                ({localizedPreferredAreasNames.join(listSep)})
              </strong>
              ؟
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirmSaveOpen(false)}
              className="h-9 flex-1 rounded-xl text-xs font-bold"
            >
              {t.cancelBtn}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={onExecuteSave}
              className="h-9 flex-1 rounded-xl bg-[var(--brand-primary,#007a5a)] text-xs font-bold text-white hover:bg-[var(--brand-primary-hover,#006248)]"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t.savingBtn}
                </span>
              ) : (
                t.confirmSaveBtn
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
