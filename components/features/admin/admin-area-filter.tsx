"use client"

import { useMemo } from "react"
import { ChevronDown, MapPin } from "lucide-react"
import {
  GEORGIA_REGION_DISTRICTS,
  type GeorgiaRegionCode,
} from "@/lib/georgia-districts-data"
import { useTranslation, type LocaleCode } from "@/lib/i18n"

function resolveDistrictNode(raw?: string | null) {
  if (!raw) return null
  const clean = String(raw)
    .replace(/🎯/g, "")
    .replace(/\(U-[^)]+\)/gi, "")
    .trim()
    .toLowerCase()

  if (!clean) return null

  for (const node of GEORGIA_REGION_DISTRICTS) {
    if (
      node.id.toLowerCase() === clean ||
      node.labels.ar.toLowerCase() === clean ||
      node.labels.en.toLowerCase() === clean ||
      node.labels.ru.toLowerCase() === clean ||
      node.labels.ka.toLowerCase() === clean
    ) {
      return node
    }
  }

  for (const node of GEORGIA_REGION_DISTRICTS) {
    if (
      node.keywords.some(
        (kw) =>
          clean.includes(kw.toLowerCase()) || kw.toLowerCase().includes(clean)
      )
    ) {
      return node
    }
  }

  return null
}

function getLocalizedRegionTitle(
  regionCode: GeorgiaRegionCode,
  locale: LocaleCode,
  cityGroupTitles: Record<string, string>
): string {
  if (regionCode === "tbilisi_metro") {
    return (
      cityGroupTitles.tbilisi ||
      GEORGIA_REGION_DISTRICTS.find(
        (d) => d.regionCode === regionCode && d.isCityWide
      )?.labels[locale] ||
      "Tbilisi"
    )
  }
  if (regionCode === "batumi_adjara") {
    return (
      cityGroupTitles.batumi ||
      GEORGIA_REGION_DISTRICTS.find(
        (d) => d.regionCode === regionCode && d.isCityWide
      )?.labels[locale] ||
      "Batumi"
    )
  }
  const cityNode =
    GEORGIA_REGION_DISTRICTS.find(
      (d) => d.regionCode === regionCode && d.isCityWide
    ) || GEORGIA_REGION_DISTRICTS.find((d) => d.regionCode === regionCode)

  return (
    cityNode?.labels[locale] ||
    cityGroupTitles.resorts ||
    String(regionCode)
  )
}

export function matchesAdminAreaSelection(
  rawAreas: Array<string | null | undefined>,
  selectedFilter: string
): boolean {
  if (!selectedFilter || selectedFilter === "ALL") return true

  const resolvedNodes = rawAreas
    .map((a) => resolveDistrictNode(a))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))

  if (selectedFilter.startsWith("REGION:")) {
    const targetRegion = selectedFilter.slice("REGION:".length)
    return resolvedNodes.some((n) => n.regionCode === targetRegion)
  }

  return resolvedNodes.some((n) => n.id === selectedFilter)
}

export function AdminAreaFilter({
  value,
  onChange,
  itemsAreas,
}: {
  value: string
  onChange: (next: string) => void
  itemsAreas: Array<Array<string | null | undefined>>
}) {
  const { t: dict, locale } = useTranslation()
  const af = ((dict.admin as Record<string, any>)?.areaFilter ||
    {}) as Record<string, string>
  const cityGroupTitles = ((dict.sell as Record<string, any>)?.optionsData
    ?.cityGroupTitles || {}) as Record<string, string>

  const { cityOptions, districtOptions, totalCount } = useMemo(() => {
    const regionCounts = new Map<GeorgiaRegionCode, number>()
    const districtCounts = new Map<string, number>()

    for (const areaList of itemsAreas) {
      const seenRegions = new Set<GeorgiaRegionCode>()
      const seenDistricts = new Set<string>()

      for (const raw of areaList) {
        const node = resolveDistrictNode(raw)
        if (!node) continue
        if (!seenRegions.has(node.regionCode)) {
          seenRegions.add(node.regionCode)
          regionCounts.set(
            node.regionCode,
            (regionCounts.get(node.regionCode) || 0) + 1
          )
        }
        if (!node.isCityWide && !seenDistricts.has(node.id)) {
          seenDistricts.add(node.id)
          districtCounts.set(node.id, (districtCounts.get(node.id) || 0) + 1)
        }
      }
    }

    const cities = Array.from(regionCounts.entries())
      .map(([regionCode, count]) => ({
        value: `REGION:${regionCode}`,
        label: getLocalizedRegionTitle(regionCode, locale, cityGroupTitles),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    const districts = Array.from(districtCounts.entries())
      .map(([districtId, count]) => {
        const node = GEORGIA_REGION_DISTRICTS.find((d) => d.id === districtId)
        return {
          value: districtId,
          label: node?.labels[locale] || districtId,
          count,
        }
      })
      .sort((a, b) => b.count - a.count)

    return {
      cityOptions: cities,
      districtOptions: districts,
      totalCount: itemsAreas.length,
    }
  }, [itemsAreas, locale, cityGroupTitles])

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[205px] shrink-0">
      <MapPin className="pointer-events-none absolute top-1/2 start-3 size-3.5 -translate-y-1/2 text-[#007a5a]" />
      <select
        aria-label={af.ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9.5 w-full appearance-none cursor-pointer rounded-xl border ps-9 pe-8 text-xs font-extrabold transition focus:border-[#007a5a] focus:outline-none ${
          value !== "ALL"
            ? "border-[#007a5a] bg-[#eaf8f2] text-[#007a5a]"
            : "border-slate-200 bg-slate-50/60 text-[#0f1d40] hover:bg-white"
        }`}
      >
        <option value="ALL">
          {af.allLocationsOption} ({totalCount})
        </option>

        {cityOptions.length > 0 && (
          <optgroup label={af.citiesGroupLabel}>
            {cityOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} — {af.wholeCitySuffix} ({c.count})
              </option>
            ))}
          </optgroup>
        )}

        {districtOptions.length > 0 && (
          <optgroup label={af.districtsGroupLabel}>
            {districtOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} ({d.count})
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 end-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
}