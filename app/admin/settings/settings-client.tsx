"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Database,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Power,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Star,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  saveGeorgiaPoisChunkAction,
  type StoredGeorgiaPoiRecord,
} from "@/actions/sync-georgia-map-action"
import {
  GEORGIA_MAP_SNAPSHOT_AS_OF,
  haversineMetersClient,
} from "@/lib/georgia-pois-engine"
import realPoisSnapshot from "@/lib/georgia-real-osm-pois.json"
import { useTranslation } from "@/lib/i18n"
import { saveSiteSettingsAction } from "../../../actions/admin-actions"

type SiteSettings = {
  siteName: string
  whatsappNumber: string
  supportEmail: string
  buyerCommission: string
  developerPenaltyMin?: string
  developerPenaltyMax?: string
  vipPlusDailyGel?: string
  superVipDailyGel?: string
  fbPixelId?: string
  gaMeasurementId?: string
  gtmId?: string
  googleSiteVerification?: string
  maintenanceMode: boolean
  allowNewSells: boolean
  allowNewBuys: boolean
  emailNotifications: boolean
}

const KA_LATIN_MAP: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i",
  კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s",
  ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts",
  ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
}

function transliterateKa(str: string): string {
  const clean = (str || "").trim()
  if (!clean || !/[ა-ჰ]/.test(clean)) return clean
  return Array.from(clean)
    .map((ch) => KA_LATIN_MAP[ch] ?? ch)
    .join("")
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
}

const FALLBACK_LABELS: Record<
  string,
  { ar: string; en: string; ru: string; ka: string }
> = {
  school: { ar: "مدرسة حكومية", en: "Public School", ru: "Школа", ka: "საჯარო სკოლა" },
  kindergarten: { ar: "روضة أطفال", en: "Kindergarten", ru: "Детский сад", ka: "საბავშვო ბაღი" },
  pharmacy: { ar: "صيدلية", en: "Pharmacy", ru: "Аптека", ka: "აფთიაქი" },
  park: { ar: "حديقة عامة", en: "Park", ru: "Парк / Сквер", ka: "პარკი" },
  market: { ar: "سوبرماركت", en: "Supermarket", ru: "Супермаркет", ka: "სუპერმარკეტი" },
  restaurants: { ar: "مطعم / كافيه", en: "Restaurant & Cafe", ru: "Ресторан / Кафе", ka: "რესტორანი" },
  clinic: { ar: "عيادة طبية", en: "Medical Clinic", ru: "Клиника", ka: "კლინიკა" },
  university: { ar: "جامعة / كلية", en: "University", ru: "Университет", ka: "უნივერსიტეტი" },
  bank: { ar: "بنك", en: "Bank", ru: "Банк", ka: "ბანკი" },
  landmark: { ar: "معلم بارز", en: "Landmark", ru: "Достопримечательность", ka: "ღირსშესანიშნაობა" },
  gym: { ar: "صالة رياضية", en: "Fitness Gym", ru: "Фитнес-клуб", ka: "ფიტნეს დარბაზი" },
  bus: { ar: "محطة حافلات", en: "Bus Stop", ru: "Автобусная остановка", ka: "ავტობუსის გაჩერება" },
}

async function fetchOverpassBatchFromEndpoints(query: string): Promise<any[]> {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ]
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${ep}?data=${encodeURIComponent(query)}`)
      if (!res.ok) continue
      const json = await res.json()
      if (Array.isArray(json?.elements) && json.elements.length > 0) {
        return json.elements
      }
    } catch {}
  }
  return []
}

export default function SettingsClient({
  initialTab,
  initialSettings,
  hasSupabase,
  hasEmail,
  flittMode = "missing",
}: {
  initialTab: "general" | "system"
  initialSettings: SiteSettings
  hasSupabase: boolean
  hasEmail: boolean
  flittMode?: "live" | "sandbox" | "missing"
}) {
  const router = useRouter()
  const { t: dict, dir } = useTranslation()
  const t = dict.admin.settings as Record<string, any>

  const [activeTab, setActiveTab] = useState<"general" | "system">(initialTab)

  const [vipPlusDaily, setVipPlusDaily] = useState(
    String(initialSettings.vipPlusDailyGel || "5")
  )
  const [superVipDaily, setSuperVipDaily] = useState(
    String(initialSettings.superVipDailyGel || "10")
  )

  const [maintenanceMode, setMaintenanceMode] = useState(
    initialSettings.maintenanceMode
  )
  const [allowNewSells, setAllowNewSells] = useState(
    initialSettings.allowNewSells
  )
  const [allowNewBuys, setAllowNewBuys] = useState(initialSettings.allowNewBuys)
  const [emailNotifications, setEmailNotifications] = useState(
    initialSettings.emailNotifications
  )

  const [confirmModal, setConfirmModal] = useState<{
    formData: FormData
  } | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    isError?: boolean
  } | null>(null)
  const [pending, startTransition] = useTransition()

  // حالة تحديث خريطة ومرافق جورجيا
  const [syncingMap, setSyncingMap] = useState(false)
  const [syncPercent, setSyncPercent] = useState(0)
  const [syncProgressText, setSyncProgressText] = useState("")
  const [lastMapSyncDate, setLastMapSyncDate] = useState<string>(
    GEORGIA_MAP_SNAPSHOT_AS_OF
  )
  const [totalPoisInJson, setTotalPoisInJson] = useState<number>(
    Array.isArray((realPoisSnapshot as any)?.items)
      ? (realPoisSnapshot as any).items.length
      : 69
  )
  const [mapSyncMessage, setMapSyncMessage] = useState<{
    text: string
    isError?: boolean
  } | null>(null)

  useEffect(() => {
    try {
      const savedDate = localStorage.getItem("aqar_osm_last_sync_date")
      if (savedDate) setLastMapSyncDate(savedDate)
    } catch {}
  }, [])

  const parsedVipPlus = Math.max(1, Math.round(Number(vipPlusDaily) || 5))
  const parsedSuperVip = Math.max(
    parsedVipPlus + 1,
    Math.round(Number(superVipDaily) || 10)
  )
  const previewTier20 = parsedSuperVip * 2
  const previewTier50 = parsedSuperVip * 5
  const previewTier100 = parsedSuperVip * 10
  const previewDays50 = Math.max(
    6,
    Math.round(previewTier50 / (parsedSuperVip * 0.75))
  )
  const previewDays100 = Math.max(
    14,
    Math.round(previewTier100 / (parsedSuperVip * 0.7))
  )

  async function handleSyncGeorgiaMapPois() {
    setSyncingMap(true)
    setSyncPercent(5)
    setMapSyncMessage(null)

    try {
      const batches = [
        {
          targetPct: 22,
          label: t.mapBatch1Label,
          query: `[out:json][timeout:25][bbox:41.65,44.70,41.82,44.91];(node["amenity"~"^(school|kindergarten|childcare|preschool|university|college|pharmacy|clinic|hospital|doctors|dentist|bank)$"];way["amenity"~"^(school|kindergarten|childcare|preschool|university|college|pharmacy|clinic|hospital|doctors|dentist|bank)$"];);out center qt;`,
        },
        {
          targetPct: 44,
          label: t.mapBatch2Label,
          query: `[out:json][timeout:25][bbox:41.65,44.70,41.82,44.91];(node["shop"~"^(supermarket|convenience|mall|bakery|greengrocer)$"];way["shop"~"^(supermarket|convenience|mall|bakery|greengrocer)$"];node["amenity"~"^(restaurant|cafe|place_of_worship)$"];node["leisure"~"^(park|garden|fitness_centre|sports_centre)$"];way["leisure"~"^(park|garden|fitness_centre|sports_centre)$"];node["tourism"~"^(attraction|museum|viewpoint|gallery)$"];node["historic"~"^(monument|memorial|castle)$"];);out center qt;`,
        },
        {
          targetPct: 62,
          label: t.mapBatch3Label,
          query: `[out:json][timeout:25][bbox:41.65,44.70,41.82,44.91];(node["highway"="bus_stop"];);out center qt;`,
        },
        {
          targetPct: 76,
          label: t.mapBatch4Label,
          query: `[out:json][timeout:25][bbox:41.60,41.57,41.68,41.69];(node["amenity"~"^(school|kindergarten|university|pharmacy|clinic|hospital|bank|restaurant|cafe)$"];way["amenity"~"^(school|kindergarten|university|pharmacy|clinic|hospital|bank|restaurant|cafe)$"];node["shop"~"^(supermarket|convenience|mall|bakery)$"];node["leisure"~"^(park|garden|fitness_centre)$"];way["leisure"~"^(park|garden)$"];node["highway"="bus_stop"];);out center qt;`,
        },
      ]

      const allElements: any[] = []
      for (const b of batches) {
        setSyncProgressText(b.label)
        const els = await fetchOverpassBatchFromEndpoints(b.query)
        allElements.push(...els)
        setSyncPercent(b.targetPct)
      }

      setSyncProgressText(t.mapFilteringLabel)
      setSyncPercent(80)

      const parsedItems: StoredGeorgiaPoiRecord[] = []
      const seenSpatial: Array<{
        cat: string
        key: string
        lat: number
        lng: number
      }> = []

      const existingBase: StoredGeorgiaPoiRecord[] = Array.isArray(
        (realPoisSnapshot as any)?.items
      )
        ? (realPoisSnapshot as any).items.slice(0, 78)
        : []

      for (const baseItem of existingBase) {
        parsedItems.push(baseItem)
        seenSpatial.push({
          cat: baseItem.category,
          key: (baseItem.names?.en || "").toLowerCase(),
          lat: baseItem.lat,
          lng: baseItem.lng,
        })
      }

      for (const el of allElements) {
        const tags = el?.tags || {}
        const elLat = Number(el?.lat ?? el?.center?.lat)
        const elLng = Number(el?.lon ?? el?.center?.lon)
        if (!Number.isFinite(elLat) || !Number.isFinite(elLng)) continue

        const am = String(tags.amenity || "").toLowerCase()
        const sh = String(tags.shop || "").toLowerCase()
        const leis = String(tags.leisure || "").toLowerCase()
        const hw = String(tags.highway || "").toLowerCase()
        const tour = String(tags.tourism || "").toLowerCase()
        const hist = String(tags.historic || "").toLowerCase()
        const hint =
          `${tags["name:en"] || ""} ${tags.name || ""} ${tags.brand || ""}`.toLowerCase()

        let category = ""
        if (
          am === "kindergarten" ||
          am === "childcare" ||
          am === "preschool" ||
          hint.includes("sabavshvo") ||
          hint.includes("საბავშვო")
        ) {
          category = "kindergarten"
        } else if (am === "university" || am === "college") {
          category = "university"
        } else if (am === "school") {
          category = "school"
        } else if (am === "pharmacy") {
          category = "pharmacy"
        } else if (leis === "park" || leis === "garden") {
          category = "park"
        } else if (am === "bank") {
          category = "bank"
        } else if (tour || hist || am === "place_of_worship") {
          category = "landmark"
        } else if (
          am === "clinic" ||
          am === "hospital" ||
          am === "doctors" ||
          am === "dentist"
        ) {
          category = "clinic"
        } else if (am === "restaurant" || am === "cafe") {
          category = "restaurants"
        } else if (leis === "fitness_centre" || leis === "sports_centre") {
          category = "gym"
        } else if (hw === "bus_stop") {
          category = "bus"
        } else if (sh) {
          category = "market"
        }

        if (!category) continue

        const nameKa = String(
          tags["name:ka"] ||
            (/[ა-ჰ]/.test(tags.name || "") ? tags.name : "") ||
            tags.brand ||
            ""
        ).trim()

        const rawEn = String(
          tags["name:en"] ||
            tags["brand:en"] ||
            (!/[ა-ჰ]/.test(tags.brand || "") ? tags.brand : "") ||
            (!/[ა-ჰ]/.test(tags.name || "") ? tags.name : "") ||
            transliterateKa(nameKa) ||
            ""
        ).trim()

        const refCode = String(
          tags.ref || tags["addr:housenumber"] || ""
        ).trim()

        if (!rawEn && !nameKa) {
          if (["restaurants", "market", "landmark"].includes(category)) {
            continue
          }
        }

        const fb = FALLBACK_LABELS[category] || FALLBACK_LABELS.market
        const suffix = refCode ? ` #${refCode}` : ""

        const finalEn = rawEn ? `${rawEn}${suffix}` : `${fb.en}${suffix}`
        const finalKa = nameKa ? `${nameKa}${suffix}` : `${fb.ka}${suffix}`
        const finalRu = String(tags["name:ru"] || finalEn).trim()
        const finalAr = String(tags["name:ar"] || finalEn).trim()

        const nameKey = finalEn.toLowerCase()

        const isDup = seenSpatial.some(
          (s) =>
            s.cat === category &&
            s.key === nameKey &&
            haversineMetersClient(s.lat, s.lng, elLat, elLng) < 35
        )
        if (isDup) continue

        seenSpatial.push({
          cat: category,
          key: nameKey,
          lat: elLat,
          lng: elLng,
        })

        parsedItems.push({
          id: `${el.type || "node"}_${el.id}`,
          category,
          lat: Number(elLat.toFixed(6)),
          lng: Number(elLng.toFixed(6)),
          names: {
            ar: finalAr,
            en: finalEn,
            ru: finalRu,
            ka: finalKa,
          },
        })
      }

      const CHUNK_SIZE = 1500
      const totalChunks = Math.max(1, Math.ceil(parsedItems.length / CHUNK_SIZE))
      const todayIso = new Date().toISOString().slice(0, 10)
      let finalSavedCount = 0

      for (let i = 0; i < totalChunks; i++) {
        const slice = parsedItems.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        const savePct = 80 + Math.round(((i + 1) / totalChunks) * 20)
        setSyncPercent(Math.min(99, savePct))
        setSyncProgressText(
          `${t.mapSavingChunkPrefix} ${i + 1} ${t.mapSavingChunkOf} ${totalChunks} (${parsedItems.length.toLocaleString("en-US")} ${t.mapSavingChunkPlacesSuffix}`
        )

        const writeRes = await saveGeorgiaPoisChunkAction({
          asOf: todayIso,
          chunk: slice,
          isFirstChunk: i === 0,
          isLastChunk: i === totalChunks - 1,
          totalExpected: parsedItems.length,
        })

        if (!writeRes.success) {
          throw new Error(writeRes.error || t.mapSaveChunkError)
        }
        finalSavedCount = writeRes.savedCount
      }

      setSyncPercent(100)
      try {
        localStorage.setItem("aqar_osm_last_sync_date", todayIso)
      } catch {}
      setLastMapSyncDate(todayIso)
      setTotalPoisInJson(finalSavedCount)
      setMapSyncMessage({
        text: `${t.mapSyncSuccessPrefix} ${finalSavedCount.toLocaleString("en-US")} ${t.mapSyncSuccessSuffix}`,
      })
      router.refresh()
    } catch (e: any) {
      setMapSyncMessage({
        text: e?.message || t.mapSyncErrorFallback,
        isError: true,
      })
    } finally {
      setTimeout(() => {
        setSyncingMap(false)
        setSyncProgressText("")
      }, 400)
    }
  }

  function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setConfirmModal({ formData: fd })
  }

  function executeConfirmedSave() {
    if (!confirmModal) return
    setNotice(null)

    startTransition(async () => {
      try {
        const res = await saveSiteSettingsAction(confirmModal.formData)
        if (res.success) {
          window.dispatchEvent(new Event("site-settings-changed"))
          setNotice({ text: t.savedSuccess })
          router.refresh()
        } else {
          setNotice({ text: res.error || t.savedError, isError: true })
        }
      } finally {
        setConfirmModal(null)
      }
    })
  }

  const mapEngineCard = (
    <Card className="rounded-xl border-blue-200/85 bg-white shadow-2xs">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-[#0f1d40]">
            <MapPin className="size-4 text-[#2563eb]" />
            <span>{t.mapCardTitle}</span>
          </CardTitle>
          <span className="rounded-full bg-[#eaf8f2] px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#007a5a]">
            {t.mapInstantBadge}
          </span>
        </div>
        <CardDescription className="text-[11px]">
          {t.mapCardDesc}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 p-5 text-xs">
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="font-extrabold text-[#0f1d40]">
              {t.mapTotalPlacesPrefix} {totalPoisInJson.toLocaleString("en-US")}{" "}
              {t.mapTotalPlacesSuffix}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span>
                {t.mapLastUpdatedLabel}{" "}
                <strong className="text-[#0f1d40]">
                  <span dir="ltr" className="inline-block font-mono">
                    {lastMapSyncDate}
                  </span>
                </strong>
              </span>
              <span>·</span>
              <span className="text-[#007a5a]">{t.mapCoverageLabel}</span>
            </div>
          </div>

          <Button
            type="button"
            disabled={syncingMap}
            onClick={handleSyncGeorgiaMapPois}
            className="h-9 shrink-0 rounded-xl bg-[#2563eb] px-4 text-xs font-extrabold text-white shadow-2xs hover:bg-blue-700"
          >
            <RefreshCw
              className={`me-1.5 size-3.5 ${syncingMap ? "animate-spin" : ""}`}
            />
            <span>
              {syncingMap
                ? `${t.mapSyncingBtnPrefix} (${syncPercent}%)...`
                : t.mapSyncNowBtn}
            </span>
          </Button>
        </div>

        {syncingMap && (
          <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-[#2563eb]">
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>{syncProgressText}</span>
              </span>
              <span dir="ltr" className="font-mono text-sm">
                {syncPercent}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-all duration-300"
                style={{ width: `${syncPercent}%` }}
              />
            </div>
          </div>
        )}

        {mapSyncMessage && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold ${
              mapSyncMessage.isError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
            }`}
          >
            {mapSyncMessage.isError ? (
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-[#007a5a]" />
            )}
            <span>{mapSyncMessage.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div dir={dir} className="text-start">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div>
          <p className="text-[11px] font-extrabold text-[#007a5a]">
            {t.eyebrow}
          </p>
          <h2 className="mt-0.5 text-base font-black text-[#0f1d40] sm:text-lg">
            {t.title}
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "general"
                ? "bg-[#007a5a] text-white shadow-2xs"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Globe className="size-3.5 shrink-0" />
            <span>{t.tabGeneral}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "system"
                ? "bg-[#007a5a] text-white shadow-2xs"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Database className="size-3.5 shrink-0" />
            <span>{t.tabSystem}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xs ${
            notice.isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.isError ? (
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-[#007a5a]" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 opacity-70 hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {activeTab === "general" && (
        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
              <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                  <Smartphone className="size-4 text-[#007a5a]" />
                  <span>{t.contactCardTitle}</span>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {t.contactCardDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 p-5 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-[#0f1d40]">
                    {t.siteNameLabel}
                  </label>
                  <input
                    name="siteName"
                    defaultValue={initialSettings.siteName}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-bold focus:border-[#007a5a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#0f1d40]">
                    {t.whatsappLabel}
                  </label>
                  <input
                    name="whatsappNumber"
                    dir="ltr"
                    defaultValue={initialSettings.whatsappNumber}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-left text-xs font-bold focus:border-[#007a5a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#0f1d40]">
                    {t.supportEmailLabel}
                  </label>
                  <input
                    name="supportEmail"
                    type="email"
                    dir="ltr"
                    defaultValue={initialSettings.supportEmail}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-left text-xs font-bold focus:border-[#007a5a] focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-[#eaf8f2]/50 p-3.5">
                  <div className="mb-2.5 flex items-center gap-1.5 text-xs font-extrabold text-[#0f1d40]">
                    <Percent className="size-3.5 text-[#007a5a]" />
                    <span>{t.financialRatesTitle}</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[#0f1d40]">
                      {t.commissionLabel}
                    </label>
                    <input
                      name="buyerCommission"
                      type="number"
                      step="0.05"
                      min="0"
                      max="25"
                      dir="ltr"
                      defaultValue={initialSettings.buyerCommission || "1.25"}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-left text-xs font-bold focus:border-[#007a5a] focus:outline-none"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[10.5px] font-bold text-slate-700">
                        {t.devPenaltyMinLabel}
                      </label>
                      <input
                        name="developerPenaltyMin"
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        dir="ltr"
                        defaultValue={
                          initialSettings.developerPenaltyMin || "10"
                        }
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-bold focus:border-[#007a5a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10.5px] font-bold text-slate-700">
                        {t.devPenaltyMaxLabel}
                      </label>
                      <input
                        name="developerPenaltyMax"
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        dir="ltr"
                        defaultValue={
                          initialSettings.developerPenaltyMax || "15"
                        }
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-bold focus:border-[#007a5a] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* مصدر السعر الموحد لباقات الإعلان في الموقع بالكامل */}
                <div className="rounded-xl border border-amber-200/90 bg-amber-50/45 p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-1.5 text-xs font-extrabold text-[#0f1d40]">
                    <span className="flex items-center gap-1.5">
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                      <span>{t.promoPricesTitle}</span>
                    </span>
                    <span className="rounded-md bg-[#007a5a] px-2 py-0.5 text-[10px] font-bold text-white">
                      🇬🇪 {t.countries.GE} (₾ GEL)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[10.5px] font-bold text-slate-700">
                        {t.vipPlusDailyLabel}
                      </label>
                      <input
                        name="vipPlusDailyGel"
                        type="number"
                        min="1"
                        max="500"
                        dir="ltr"
                        value={vipPlusDaily}
                        onChange={(e) => setVipPlusDaily(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-black text-[#0f1d40]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10.5px] font-bold text-slate-700">
                        {t.superVipDailyLabel}
                      </label>
                      <input
                        name="superVipDailyGel"
                        type="number"
                        min="2"
                        max="1000"
                        dir="ltr"
                        value={superVipDaily}
                        onChange={(e) => setSuperVipDaily(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-black text-[#0f1d40]"
                      />
                    </div>
                  </div>

                  {/* معاينة حية للباقات الناتجة التي تظهر في الصفحة الرئيسية وحساب البائع */}
                  <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px]">
                    <div className="rounded-lg border border-amber-200/80 bg-white px-1 py-1.5">
                      <strong dir="ltr" className="block font-black text-[#0f1d40]">
                        {parsedVipPlus} ₾
                      </strong>
                      <span className="text-[9px] text-slate-500">+VIP · 1d</span>
                    </div>
                    <div className="rounded-lg border border-amber-300 bg-white px-1 py-1.5">
                      <strong dir="ltr" className="block font-black text-[#007a5a]">
                        {parsedSuperVip} ₾
                      </strong>
                      <span className="text-[9px] text-slate-500">VIP · 1d</span>
                    </div>
                    <div className="rounded-lg border border-amber-200/80 bg-white px-1 py-1.5">
                      <strong dir="ltr" className="block font-black text-[#0f1d40]">
                        {previewTier20} ₾
                      </strong>
                      <span className="text-[9px] text-slate-500">VIP · 2d</span>
                    </div>
                    <div className="rounded-lg border border-amber-200/80 bg-white px-1 py-1.5">
                      <strong dir="ltr" className="block font-black text-[#0f1d40]">
                        {previewTier50} ₾
                      </strong>
                      <span className="text-[9px] font-bold text-[#007a5a]">
                        {previewDays50}d (-25%)
                      </span>
                    </div>
                    <div className="rounded-lg border border-amber-200/80 bg-white px-1 py-1.5">
                      <strong dir="ltr" className="block font-black text-[#0f1d40]">
                        {previewTier100} ₾
                      </strong>
                      <span className="text-[9px] font-bold text-[#2563eb]">
                        {previewDays100}d (-30%)
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-[10.5px] leading-relaxed font-medium text-amber-950/80">
                    {t.boostAutoCalcHint}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-2xl border-blue-200/80 bg-white shadow-2xs">
                <CardHeader className="border-b border-slate-100 px-5 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-[#0f1d40]">
                    <BarChart3 className="size-4 text-[#2563eb]" />
                    <span>{t.seoCardTitle}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {t.seoCardDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-5 text-xs">
                  <div>
                    <label className="mb-1 block font-bold text-[#0f1d40]">
                      {t.fbPixelLabel}
                    </label>
                    <input
                      name="fbPixelId"
                      dir="ltr"
                      placeholder="123456789012345"
                      defaultValue={
                        initialSettings.fbPixelId ||
                        process.env.NEXT_PUBLIC_FB_PIXEL_ID ||
                        ""
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-left font-mono text-xs font-bold focus:border-[#2563eb] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-bold text-[#0f1d40]">
                        {t.gaMeasurementLabel}
                      </label>
                      <input
                        name="gaMeasurementId"
                        dir="ltr"
                        placeholder="G-XXXXXXXXXX"
                        defaultValue={
                          initialSettings.gaMeasurementId ||
                          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
                          ""
                        }
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-left font-mono text-xs font-bold focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-bold text-[#0f1d40]">
                        {t.gtmLabel}
                      </label>
                      <input
                        name="gtmId"
                        dir="ltr"
                        placeholder="GTM-XXXXXXX"
                        defaultValue={
                          initialSettings.gtmId ||
                          process.env.NEXT_PUBLIC_GTM_ID ||
                          ""
                        }
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-left font-mono text-xs font-bold focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
                <CardHeader className="border-b border-slate-100 px-5 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                    <Power className="size-4 text-[#007a5a]" />
                    <span>{t.statusCardTitle}</span>
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {t.statusCardDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-5 text-xs">
                  <label
                    className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition ${
                      maintenanceMode
                        ? "border-red-300 bg-red-50/70"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-[#0f1d40]">
                        {t.maintenanceTitle}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {t.maintenanceDesc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="mt-1 size-4 accent-red-600"
                    />
                  </label>

                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div>
                      <div className="font-extrabold text-[#0f1d40]">
                        {t.allowSellsTitle}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {t.allowSellsDesc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="allowNewSells"
                      checked={allowNewSells}
                      onChange={(e) => setAllowNewSells(e.target.checked)}
                      className="mt-1 size-4 accent-[#007a5a]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div>
                      <div className="font-extrabold text-[#0f1d40]">
                        {t.allowBuysTitle}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {t.allowBuysDesc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="allowNewBuys"
                      checked={allowNewBuys}
                      onChange={(e) => setAllowNewBuys(e.target.checked)}
                      className="mt-1 size-4 accent-[#007a5a]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div>
                      <div className="font-extrabold text-[#0f1d40]">
                        {t.emailNotifsTitle}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {t.emailNotifsDesc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="mt-1 size-4 accent-[#007a5a]"
                    />
                  </label>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-xl bg-[#007a5a] px-6 text-xs font-extrabold text-white shadow-2xs hover:bg-[#006248] sm:w-auto"
            >
              <Save className="me-1.5 size-4" />
              {t.saveBtn}
            </Button>
          </div>
        </form>
      )}

      {activeTab === "system" && (
        <div className="space-y-4">
          {mapEngineCard}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
              <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                  <Database className="size-4 text-[#007a5a]" />
                  <span>{t.envCardTitle}</span>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {t.envCardDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-xs">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <div className="font-bold text-[#0f1d40]">
                      {t.supabaseTitle}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {t.supabaseDesc}
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      hasSupabase
                        ? "bg-[#eaf8f2] text-[#007a5a]"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {hasSupabase ? t.connected : t.disconnected}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <div className="font-bold text-[#0f1d40]">
                      {t.smtpTitle}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {t.smtpDesc}
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      hasEmail
                        ? "bg-[#eaf8f2] text-[#007a5a]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <Mail className="size-3.5" />
                    {hasEmail ? t.smtpActive : t.smtpMissing}
                  </span>
                </div>

                {/* حالة بوابة الدفع Flitt (Live / Sandbox / غير مُعدّ) */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <div className="font-bold text-[#0f1d40]">
                      {t.flittTitle}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {t.flittDesc}
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      flittMode === "live"
                        ? "bg-[#eaf8f2] text-[#007a5a]"
                        : flittMode === "sandbox"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    <CreditCard className="size-3.5" />
                    {flittMode === "live"
                      ? t.flittLiveBadge
                      : flittMode === "sandbox"
                        ? t.flittTestBadge
                        : t.flittMissingBadge}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/90 bg-white shadow-2xs">
              <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                  <ShieldCheck className="size-4 text-[#007a5a]" />
                  <span>{t.rolesCardTitle}</span>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {t.rolesCardDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-xs leading-relaxed text-slate-600">
                <div className="rounded-xl border border-slate-100 p-3">
                  <strong className="text-[#0f1d40]">{t.rule1Bold}</strong>{" "}
                  {t.rule1Text}
                </div>
                <div className="pt-1">
                  <Link
                    href="/admin/users"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0f1d40] px-4 text-xs font-bold text-white transition hover:bg-[#1e293b]"
                  >
                    {t.manageAdminsBtn}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(confirmModal)}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmModal(null)
        }}
      >
        <DialogContent
          dir={dir}
          className="w-[90vw] max-w-[360px] rounded-2xl p-5 sm:max-w-[390px]"
        >
          {confirmModal && (
            <>
              <DialogHeader className="text-start">
                <DialogTitle className="text-sm font-extrabold text-[#0f1d40]">
                  {t.modalTitle}
                </DialogTitle>
                <DialogDescription className="text-start text-xs leading-relaxed text-slate-600">
                  {t.modalDesc}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmModal(null)}
                  className="h-9 flex-1 rounded-xl text-xs font-bold sm:flex-none"
                >
                  {t.cancelBtn}
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={executeConfirmedSave}
                  className="h-9 flex-1 rounded-xl bg-[#007a5a] text-xs font-bold text-white hover:bg-[#006248] sm:flex-none"
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t.savingBtn}
                    </span>
                  ) : (
                    t.confirmSaveBtn
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}