'use client'

import { ArrowDown, ChevronDown, ListFilter, Search, X } from 'lucide-react'
import { toEnglishDigits } from '@/components/features/seller/seller-shared'
import {
  GeorgiaAreaSelect,
  getLocalizedGeorgiaAreaName,
} from '@/components/shared/georgia-areas'
import { type LocaleCode } from '@/lib/i18n'

export function BuyerFiltersBar({
  t,
  oppFilters,
  locale,
  currency,
  activePills,
  togglePill,
  searchQuery,
  setSearchQuery,
  filterPanelOpen,
  setFilterPanelOpen,
  activeFiltersCount,
  onlyNegotiable,
  setOnlyNegotiable,
  totalAvailableCount,
  sortBy,
  setSortBy,
  areaFilter,
  setAreaFilter,
  maxCashFilter,
  setMaxCashFilter,
  maxInstFilter,
  setMaxInstFilter,
  maxContractFilter,
  setMaxContractFilter,
  selectedTypes,
  toggleFilterType,
  localizedUnitTypes,
  delStatusFilter,
  setDelStatusFilter,
  delYearFilter,
  setDelYearFilter,
  conYearFilter,
  setConYearFilter,
  minRoomsFilter,
  setMinRoomsFilter,
  clearAllFilters,
}: {
  t: Record<string, any>
  oppFilters: Record<string, any>
  locale: LocaleCode
  currency: string
  activePills: string[]
  togglePill: (p: string) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  filterPanelOpen: boolean
  setFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  activeFiltersCount: number
  onlyNegotiable: boolean
  setOnlyNegotiable: (v: boolean) => void
  totalAvailableCount: number
  sortBy: string
  setSortBy: (v: string) => void
  areaFilter: string
  setAreaFilter: (v: string) => void
  maxCashFilter: string
  setMaxCashFilter: (v: string) => void
  maxInstFilter: string
  setMaxInstFilter: (v: string) => void
  maxContractFilter: string
  setMaxContractFilter: (v: string) => void
  selectedTypes: string[]
  toggleFilterType: (tp: string) => void
  localizedUnitTypes: string[]
  delStatusFilter: string
  setDelStatusFilter: (v: string) => void
  delYearFilter: string
  setDelYearFilter: (v: string) => void
  conYearFilter: string
  setConYearFilter: (v: string) => void
  minRoomsFilter: string
  setMinRoomsFilter: (v: string) => void
  clearAllFilters: () => void
}) {
  return (
    <>
      <section className="mt-4 text-start">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <span className="me-1 text-xs font-extrabold text-[var(--brand-navy,#0a1122)]">
            {t.filterByRequestLabel}
          </span>
          {t.filterPills.map((pill: string) => {
            const isSelected = activePills.includes(pill)
            return (
              <button
                key={pill}
                type="button"
                onClick={() => togglePill(pill)}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                  isSelected
                    ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[var(--brand-primary,#007a5a)]'
                }`}
              >
                {pill}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-gray-200/80 bg-white p-3.5 shadow-2xs sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 end-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-3 pe-10 text-xs text-[var(--brand-navy,#0a1122)] placeholder:text-gray-400 focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:text-sm"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-expanded={filterPanelOpen}
              onClick={() => setFilterPanelOpen((prev) => !prev)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                filterPanelOpen || activeFiltersCount > 0
                  ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary-light,#eaf8f2)] text-[var(--brand-primary,#007a5a)]'
                  : 'border-gray-200 bg-white text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
              }`}
            >
              <ListFilter className="size-3.5" />
              <span>{t.filterBtn}</span>
              {activeFiltersCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--brand-primary,#007a5a)] text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOnlyNegotiable(!onlyNegotiable)}
              className={`inline-flex h-9 items-center gap-1 rounded-xl border px-3.5 text-xs font-bold transition sm:h-10 ${
                onlyNegotiable
                  ? 'border-[#d97706] bg-amber-50/70 text-[#b45309]'
                  : 'border-gray-200 bg-white text-[var(--brand-navy,#0a1122)] hover:bg-gray-50'
              }`}
            >
              <span>{t.negotiableBtn}</span>
              <ArrowDown className="size-3 text-[#d97706]" />
            </button>

            <span className="text-[11px] font-medium text-gray-500 sm:text-xs">
              {totalAvailableCount} {t.availableUnitsWord}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 sm:text-xs">
              {t.sortByLabel}
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 min-w-[135px] appearance-none rounded-xl border border-gray-200 bg-white pr-3 pl-7 text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none sm:h-10 sm:min-w-[155px]"
              >
                {t.sorts.map((s: string) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-start gap-2 border-t border-gray-100 pt-2.5">
            {onlyNegotiable && (
              <button
                type="button"
                onClick={() => setOnlyNegotiable(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>{t.negotiableBtn}</span>
                <X className="size-3" />
              </button>
            )}
            {areaFilter.trim() && (
              <button
                type="button"
                onClick={() => setAreaFilter('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>
                  {oppFilters.areaBadgePrefix}{' '}
                  {getLocalizedGeorgiaAreaName(areaFilter, locale)}
                </span>
                <X className="size-3" />
              </button>
            )}
            {maxCashFilter.trim() && (
              <button
                type="button"
                onClick={() => setMaxCashFilter('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>
                  {oppFilters.cashUpToPrefix}{' '}
                  {Number(toEnglishDigits(maxCashFilter)).toLocaleString(
                    'en-US'
                  )}{' '}
                  {currency}
                </span>
                <X className="size-3" />
              </button>
            )}
            {maxInstFilter.trim() && (
              <button
                type="button"
                onClick={() => setMaxInstFilter('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>
                  {oppFilters.instUpToPrefix}{' '}
                  {Number(toEnglishDigits(maxInstFilter)).toLocaleString(
                    'en-US'
                  )}{' '}
                  {currency}
                </span>
                <X className="size-3" />
              </button>
            )}
            {maxContractFilter.trim() && (
              <button
                type="button"
                onClick={() => setMaxContractFilter('')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>
                  {oppFilters.contractUpToPrefix}{' '}
                  {Number(toEnglishDigits(maxContractFilter)).toLocaleString(
                    'en-US'
                  )}{' '}
                  {currency}
                </span>
                <X className="size-3" />
              </button>
            )}
            {selectedTypes.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => toggleFilterType(tp)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#eaf8f2)] px-3 py-1 text-[11px] font-bold text-[var(--brand-primary,#007a5a)]"
              >
                <span>{tp}</span>
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="ms-1 text-[11px] font-bold text-gray-400 underline hover:text-gray-700"
            >
              {t.clearFiltersBtn || oppFilters.clearAllBtn}
            </button>
          </div>
        )}
      </section>

      {filterPanelOpen && (
        <section className="mt-3 rounded-[18px] border border-gray-200/85 bg-white p-4 text-start shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <GeorgiaAreaSelect
                label={oppFilters.areasLabel || t.preferredAreasLabel}
                value={areaFilter}
                onChange={(val) => setAreaFilter(val)}
                placeholder={
                  oppFilters.areasPlaceholder || t.areaInputPlaceholder
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.maxCashLabel || t.availableCashLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={maxCashFilter}
                  onChange={(e) =>
                    setMaxCashFilter(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-left text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                  {currency}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.maxInstLabel || t.maxInstallmentLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={maxInstFilter}
                  onChange={(e) =>
                    setMaxInstFilter(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-left text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
              {oppFilters.unitTypeLabel || t.unitTypeLabel}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {localizedUnitTypes.map((tp: string) => {
                const active = selectedTypes.includes(tp)
                return (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => toggleFilterType(tp)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {tp}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.deliveryLabel || t.deliveryLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.deliveryStatuses.map((status: string) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDelStatusFilter(status)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      delStatusFilter === status
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.deliveryYearLabel || t.deliveryLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.deliveryYears.map((yr: string) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setDelYearFilter(yr)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      delYearFilter === yr
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.contractYearLabel || t.contractYearLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.contractYears.map((yr: string) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setConYearFilter(yr)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      conYearFilter === yr
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.minRoomsLabel || t.minRoomsLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.roomOptions.map((rm: string) => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => setMinRoomsFilter(rm)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      minRoomsFilter === rm
                        ? 'border-[var(--brand-primary,#007a5a)] bg-[var(--brand-primary,#007a5a)] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span dir="ltr">{rm}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--brand-navy,#0a1122)]">
                {oppFilters.maxContractPriceLabel || t.targetBudgetLabel}
              </label>
              <div className="relative max-w-sm">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={maxContractFilter}
                  onChange={(e) =>
                    setMaxContractFilter(
                      toEnglishDigits(e.target.value).replace(/[^0-9]/g, '')
                    )
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 pr-3.5 pl-12 text-left text-xs font-bold text-[var(--brand-navy,#0a1122)] focus:border-[var(--brand-primary,#007a5a)] focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="rounded-xl bg-[var(--brand-primary,#007a5a)] px-5 py-2 text-xs font-bold text-white transition hover:bg-[var(--brand-primary-hover,#006248)]"
              >
                {oppFilters.showResultsBtn || t.showResultsBtn} (
                {totalAvailableCount})
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-gray-500 hover:text-[var(--brand-navy,#0a1122)]"
              >
                {t.clearFiltersBtn || oppFilters.clearAllBtn}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFilterPanelOpen(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-700"
            >
              {oppFilters.hideBtn || t.cancelBtn}
            </button>
          </div>
        </section>
      )}
    </>
  )
}
