import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import {
  ArrowLeft,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  Handshake,
  Send,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  isSelfDealOffer,
  sanitizeGeorgiaProjectTitle,
} from "@/lib/offer-helpers"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getLocalizedGeorgiaAreaName } from "@/lib/smart-matcher"
import { getServerI18n } from "@/lib/get-server-dictionary"

export const dynamic = "force-dynamic"
export const revalidate = 0

const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"

function WhatsAppOfficialIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.473 1.332 4.988L2 22l5.188-1.361c1.469.801 3.125 1.225 4.843 1.225 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.82 14.129c-.244.688-1.422 1.314-1.977 1.396-.508.076-1.152.109-1.859-.115-.43-.137-.98-.32-1.688-.625-2.973-1.283-4.914-4.275-5.062-4.473-.148-.197-1.209-1.609-1.209-3.07 0-1.461.766-2.18 1.037-2.477.271-.297.592-.371.791-.371.197 0 .395.002.568.01.182.008.426-.068.666.508.246.592.84 2.049.914 2.197.074.148.123.32.025.518-.098.197-.148.32-.297.494-.148.172-.312.385-.445.518-.148.148-.303.309-.131.605.172.297.768 1.268 1.648 2.053 1.133 1.01 2.088 1.322 2.385 1.471.297.148.469.123.643-.074.172-.197.74-.863.938-1.16.197-.297.395-.246.666-.148.271.098 1.729.814 2.025.963.297.148.494.223.568.346.074.123.074.715-.17 1.403z" />
    </svg>
  )
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  under_review: "border-blue-200 bg-blue-50 text-blue-800",
  active: "border-emerald-200 bg-[#eaf8f2] text-[#007a5a]",
  offer_received: "border-purple-200 bg-purple-50 text-purple-800",
  transferring: "border-indigo-200 bg-indigo-50 text-indigo-800",
  sold: "border-[#007a5a] bg-[#007a5a] text-white",
  rejected: "border-red-200 bg-red-50 text-red-700",
}

const DASHBOARD_SECTIONS_TEXT: Record<
  string,
  {
    sec1Title: string
    sec1Sub: string
    sec1EmptyShort: string
    sec1Empty: string
    sec1Btn: string
    sec2Title: string
    sec2Sub: string
    sec2EmptyShort: string
    sec2Empty: string
    sec2Btn: string
    colUnit: string
    colSeller: string
    colBuyer: string
    colAgreedCash: string
    colOfferedCash: string
    colOriginalCash: string
    colCommission: string
    colReadiness: string
    colAction: string
    readiness48h: string
    readiness1Week: string
    readiness2Weeks: string
    methodCheck: string
    methodTransfer: string
    btnApproveOffer: string
    btnCloseDeal: string
    specificUnitLeadBadge: string
    generalLeadBadge: string
  }
> = {
  ar: {
    sec1Title: "١. صفقات متفق عليها جاهزة للتعاقد",
    sec1Sub:
      "البائع والمشتري وافقا رسمياً على السعر وتم قفل الوحدة — تواصل مع الطرفين لتوقيع التنازل وتحصيل العمولة",
    sec1EmptyShort: "لا توجد صفقات تنتظر الإغلاق حالياً",
    sec1Empty: "لا توجد صفقات متفق عليها تنتظر الإغلاق حالياً.",
    sec1Btn: "فتح الصفقات الجاهزة",
    sec2Title: "٢. عروض شراء جديدة بانتظار موافقتك",
    sec2Sub:
      "عروض جديدة قدمها مشترون على وحدات محددة ولم تظهر للبائع بعد — راجع جدية المشتري ثم أرسل العرض لحساب البائع",
    sec2EmptyShort: "لا توجد عروض جديدة معلقة حالياً",
    sec2Empty: "لا توجد عروض شراء جديدة تنتظر موافقتك حالياً.",
    sec2Btn: "فتح غرفة الصفقات والعروض",
    colUnit: "الوحدة والمشروع",
    colSeller: "البائع (المالك)",
    colBuyer: "المشتري (مقدم العرض)",
    colAgreedCash: "المبلغ المتفق عليه",
    colOfferedCash: "المبلغ المعروض",
    colOriginalCash: "المطلوب الأصلي",
    colCommission: "عمولة المنصة",
    colReadiness: "جاهزية الدفع وطريقة السداد",
    colAction: "الإجراء المطلوب",
    readiness48h: "خلال 48 ساعة",
    readiness1Week: "خلال أسبوع",
    readiness2Weeks: "خلال أسبوعين",
    methodCheck: "شيك بنكي",
    methodTransfer: "تحويل بنكي",
    btnApproveOffer: "مراجعة وإرسال للبائع",
    btnCloseDeal: "إتمام البيع",
    specificUnitLeadBadge: "مهتم بوحدة محددة",
    generalLeadBadge: "طلب توفير عقار",
  },
  en: {
    sec1Title: "1. Agreed Deals Ready for Contract Transfer",
    sec1Sub:
      "Both seller and buyer agreed on the price and the unit is locked — contact both parties to close & collect fee",
    sec1EmptyShort: "No deals awaiting closing",
    sec1Empty: "No agreed deals awaiting closing right now.",
    sec1Btn: "Open Ready Deals",
    sec2Title: "2. New Purchase Offers Awaiting Your Approval",
    sec2Sub:
      "New offers submitted by buyers on specific units and not yet visible to the seller — verify buyer & forward to seller",
    sec2EmptyShort: "All caught up — no pending offers",
    sec2Empty: "No new purchase offers awaiting your approval right now.",
    sec2Btn: "Open Deals & Offers Room",
    colUnit: "Unit & Project",
    colSeller: "Seller (Owner)",
    colBuyer: "Buyer",
    colAgreedCash: "Agreed Cash",
    colOfferedCash: "Offered Cash",
    colOriginalCash: "Original Ask",
    colCommission: "Platform Fee",
    colReadiness: "Payment Readiness & Method",
    colAction: "Next Action",
    readiness48h: "Within 48 Hours",
    readiness1Week: "Within 1 Week",
    readiness2Weeks: "Within 2 Weeks",
    methodCheck: "Bank Check",
    methodTransfer: "Bank Transfer",
    btnApproveOffer: "Review & Send to Seller",
    btnCloseDeal: "Complete Sale",
    specificUnitLeadBadge: "Specific Unit Inquiry",
    generalLeadBadge: "General Budget Request",
  },
  ru: {
    sec1Title: "1. Согласованные сделки (Готовы к переоформлению)",
    sec1Sub:
      "Продавец и покупатель подтвердили цену — свяжитесь со сторонами для подписания переуступки и получения комиссии",
    sec1EmptyShort: "Нет сделок к закрытию",
    sec1Empty: "Сейчас нет согласованных сделок, ожидающих закрытия.",
    sec1Btn: "Открыть готовые сделки",
    sec2Title: "2. Новые предложения о покупке (Ждут вашего одобрения)",
    sec2Sub:
      "Новые предложения от покупателей по конкретным объектам, которые еще не отправлены продавцу",
    sec2EmptyShort: "Новых предложений нет",
    sec2Empty: "Новых предложений, ожидающих вашего одобрения, сейчас нет.",
    sec2Btn: "Открыть комнату сделок",
    colUnit: "Объект и ЖК",
    colSeller: "Продавец (Владелец)",
    colBuyer: "Покупатель",
    colAgreedCash: "Согласованная сумма",
    colOfferedCash: "Предложенная сумма",
    colOriginalCash: "Цена продавца",
    colCommission: "Комиссия",
    colReadiness: "Готовность и способ оплаты",
    colAction: "Действие",
    readiness48h: "За 48 часов",
    readiness1Week: "За 1 неделю",
    readiness2Weeks: "За 2 недели",
    methodCheck: "Банковский чек",
    methodTransfer: "Банковский перевод",
    btnApproveOffer: "Проверить и отправить",
    btnCloseDeal: "Завершить продажу",
    specificUnitLeadBadge: "Запрос по объекту",
    generalLeadBadge: "Подбор под бюджет",
  },
  ka: {
    sec1Title: "1. შეთანხმებული გარიგებები (მზადაა გადასაფორმებლად)",
    sec1Sub:
      "გამყიდველი და მყიდველი შეთანხმდნენ ფასზე — დაუკავშირდით მხარეებს გადაფორმების დასასრულებლად",
    sec1EmptyShort: "დასასრულებელი გარიგებები არ არის",
    sec1Empty: "ამჟამად დასასრულებელი შეთანხმებული გარიგებები არ არის.",
    sec1Btn: "მზა გარიგებები",
    sec2Title: "2. ახალი შესყიდვის შეთავაზებები (ელოდება თქვენს დასტურს)",
    sec2Sub:
      "მყიდველების მიერ კონკრეტულ ობიექტებზე გამოგზავნილი ახალი შეთავაზებები — გადაამოწმეთ და გაუგზავნეთ გამყიდველს",
    sec2EmptyShort: "ახალი შეთავაზებები არ არის",
    sec2Empty: "ახალი დასადასტურებელი შეთავაზებები ამჟამად არ არის.",
    sec2Btn: "გარიგებების ოთახის გახსნა",
    colUnit: "ობიექტი და პროექტი",
    colSeller: "გამყიდველი (მესაკუთრე)",
    colBuyer: "მყიდველი",
    colAgreedCash: "შეთანხმებული თანხა",
    colOfferedCash: "შეთავაზებული თანხა",
    colOriginalCash: "საწყისი ფასი",
    colCommission: "საკომისიო",
    colReadiness: "გადახდის მზაობა და მეთოდი",
    colAction: "მოქმედება",
    readiness48h: "48 საათში",
    readiness1Week: "1 კვირაში",
    readiness2Weeks: "2 კვირაში",
    methodCheck: "საბანკო ჩეკი",
    methodTransfer: "საბანკო გადარიცხვა",
    btnApproveOffer: "გადამოწმება და გაგზავნა",
    btnCloseDeal: "გაყიდვის დასრულება",
    specificUnitLeadBadge: "კონკრეტული ობიექტი",
    generalLeadBadge: "ზოგადი მოთხოვნა",
  },
}

function normalizeUnitStatus(rawStatus?: string | null): string {
  const clean = String(rawStatus || "pending").trim().toLowerCase()
  if (clean === "approved" || clean === "published") return "active"
  return clean
}

function isUnitEligibleForOffers(status?: string | null): boolean {
  const st = normalizeUnitStatus(status)
  return (
    st === "active" ||
    st === "offer_received" ||
    st === "transferring" ||
    st === "sold"
  )
}

function deriveUnitCode(id: string, dbCode?: string | null) {
  if (dbCode && String(dbCode).trim()) return String(dbCode).trim()
  const numericCode = String(id || "")
    .replace(/\D/g, "")
    .slice(0, 5)
  const fallbackCode = String(id || "")
    .slice(0, 5)
    .toUpperCase()
  return `U-${numericCode.length >= 4 ? numericCode : fallbackCode}`
}

function cleanAreaDisplay(rawArea: string | null | undefined, locale: string) {
  const localized = getLocalizedGeorgiaAreaName(rawArea, locale)
  if (locale === "ar") {
    return localized.replace(/\s*\([A-Za-z0-9\s/-]+\)\s*$/g, "").trim()
  }
  return localized
}

function normalizeDashboardOffer(raw: any) {
  const rawDiffs = Array.isArray(raw.diff_reasons) ? raw.diff_reasons : []
  const hasPendingAdminTag = rawDiffs.includes(PENDING_ADMIN_TAG)

  let effectiveStatus = raw.status || "pending_admin"
  if (
    raw.status === "pending_admin" ||
    (raw.status === "recommended" &&
      (raw.initiated_by === "buyer" || hasPendingAdminTag))
  ) {
    effectiveStatus = "pending_admin"
  }

  return {
    ...raw,
    id: String(raw.id),
    property_id: String(raw.property_id),
    status: effectiveStatus,
  }
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !candidateId) {
    redirect("/login?next=/admin")
  }

  const supabase = await getSupabase()

  const { data: currentStaff } = await supabase
    .from("users")
    .select("role, status, password_hash")
    .eq("id", candidateId)
    .maybeSingle()

  if (
    !currentStaff ||
    currentStaff.status === "suspended" ||
    !parseAndVerifySessionCookie(rawSession, currentStaff.password_hash).valid
  ) {
    redirect("/login?expired=1")
  }

  const staffRole = String(currentStaff.role || "user").trim().toLowerCase()
  if (
    staffRole !== "owner" &&
    staffRole !== "admin" &&
    staffRole !== "moderator" &&
    staffRole !== "sales"
  ) {
    redirect("/account")
  }

  const { dict, locale, dir, siteSettings } = await getServerI18n()
  const t = (dict?.admin?.dashboard as Record<string, any>) || {}
  const statusesDict = (t.statuses as Record<string, string>) || {}
  const leadsDict = (dict?.admin?.leads as Record<string, any>) || {}
  const exportLabels = (dict?.admin?.exportLabels as Record<string, any>) || {}
  const cols = (exportLabels.cols as Record<string, string>) || {}
  const sm =
    ((dict?.admin as Record<string, any>)?.smartMatch as Record<string, any>) ||
    {}
  const L = DASHBOARD_SECTIONS_TEXT[locale] || DASHBOARD_SECTIONS_TEXT.en

  const georgiaLabel = t.countries?.GE || ""
  const georgiaCurrency = "$"
  const commPct = Number(siteSettings?.buyerCommission) || 1.25
  const listSep = dir === "rtl" ? "، " : ", "

  let propertiesData: any[] = []
  let leadsData: any[] = []
  let allOffersData: any[] = []

  try {
    const [propsRes, leadsRes, offersRes] = await Promise.all([
      supabase
        .from("sell_requests")
        .select("*")
        .not("status", "in", '("deleted_by_seller","draft_unverified")')
        .order("created_at", { ascending: false }),
      supabase
        .from("buy_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_offers")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(60),
    ])

    propertiesData = (propsRes.data || []).filter(
      (p: any) =>
        p.status !== "deleted_by_seller" && p.status !== "draft_unverified"
    )
    leadsData = leadsRes.data || []
    allOffersData = offersRes.data || []
  } catch (err) {
    console.error("Error loading AdminPage data:", err)
  }

  const properties = propertiesData.map((p: any) => {
    const meta =
      p.documents && typeof p.documents === "object"
        ? p.documents.__unit_meta || {}
        : {}
    return {
      ...p,
      id: String(p.id),
      status: normalizeUnitStatus(p.status),
      project_name: sanitizeGeorgiaProjectTitle(p.project_name),
      area: p.area || meta.area || null,
      unit_type: p.unit_type || meta.unit_type || null,
      size: p.size ?? meta.size ?? null,
    }
  })

  const propsMap = new Map(properties.map((p: any) => [String(p.id), p]))
  const leads = leadsData

  const allOffers = allOffersData
    .map(normalizeDashboardOffer)
    .filter((o: any) => {
      if (o.status === "recommended" || o.status === "rejected") return false
      const unit = propsMap.get(String(o.property_id))
      if (!unit || isSelfDealOffer(o, unit)) return false
      if (!isUnitEligibleForOffers(unit.status)) return false
      return true
    })

  const unitsWithAcceptedOffer = new Set(
    allOffers
      .filter((o: any) => o.status === "accepted")
      .map((o: any) => String(o.property_id))
  )

  const unitsWithSellerPendingOffer = new Set(
    allOffers
      .filter(
        (o: any) =>
          o.status === "pending_seller" || o.status === "counter_offered"
      )
      .map((o: any) => String(o.property_id))
  )

  function resolveEffectiveUnitStatus(unit: any): string {
    const rawSt = normalizeUnitStatus(unit.status)
    if (!isUnitEligibleForOffers(rawSt) || rawSt === "sold") {
      return rawSt
    }
    const uid = String(unit.id)
    if (unitsWithAcceptedOffer.has(uid)) return "transferring"
    if (unitsWithSellerPendingOffer.has(uid)) return "offer_received"
    return "active"
  }

  /* 1. الصفقات المتفق عليها الجاهزة للتعاقد */
  const readyDeals = allOffers
    .filter((o: any) => o.status === "accepted")
    .map((offer: any) => ({
      offer,
      unit: propsMap.get(String(offer.property_id)),
    }))
    .filter((item) => Boolean(item.unit) && item.unit.status !== "sold")

  /* 2. عروض الشراء الجديدة فقط التي تنتظر موافقة الأدمن لإرسالها للبائع */
  const newPendingAdminOffers = allOffers
    .filter(
      (o: any) =>
        o.status === "pending_admin" &&
        !unitsWithAcceptedOffer.has(String(o.property_id))
    )
    .map((offer: any) => ({
      offer,
      unit: propsMap.get(String(offer.property_id)),
    }))
    .filter((item) => Boolean(item.unit) && item.unit.status !== "sold")

  const totalActiveDealsRoomCount = allOffers.filter((o: any) => {
    const u = propsMap.get(String(o.property_id))
    if (!u || u.status === "sold") return false
    return (
      o.status === "accepted" ||
      o.status === "pending_admin" ||
      o.status === "pending_seller" ||
      o.status === "counter_offered"
    )
  }).length

  const pendingAdminOffersCount = newPendingAdminOffers.length

  const pendingProperties = properties.filter(
    (p) => !p.status || p.status === "pending" || p.status === "under_review"
  )

  const activeProperties = properties.filter(
    (p) =>
      p.status === "active" ||
      p.status === "offer_received" ||
      p.status === "transferring"
  )

  const pendingAdRequests = properties.filter(
    (p) => !p.is_featured && p.featured_status === "pending_payment"
  )
  const activeFeaturedUnits = properties.filter((p) => p.is_featured)

  const kpis = [
    {
      label: `${t.unitsIn || ""} ${georgiaLabel}`,
      value: properties.length.toLocaleString("en-US"),
      note: `${activeProperties.length.toLocaleString("en-US")} ${t.publishedNote || ""}`,
      icon: Building2,
      href: "/admin/properties",
      iconWrap: "bg-[#eaf8f2] text-[#007a5a]",
      noteClass: "text-slate-500",
    },
    {
      label: t.pendingReview || "",
      value: pendingProperties.length.toLocaleString("en-US"),
      note:
        pendingProperties.length > 0
          ? t.pendingNeedAction || ""
          : t.allReviewed || "",
      icon: Clock3,
      href: "/admin/properties?tab=pending",
      iconWrap: "bg-amber-50 text-amber-600",
      noteClass:
        pendingProperties.length > 0 ? "text-amber-700" : "text-slate-500",
    },
    {
      label: t.dealsRoomKpiLabel || sm.dealsRoomTitle || "",
      value: totalActiveDealsRoomCount.toLocaleString("en-US"),
      note:
        pendingAdminOffersCount > 0
          ? `${pendingAdminOffersCount} ${t.offersPendingYourApprovalNote || ""}`
          : `${readyDeals.length} ${t.dealsReadyToCloseNote || ""}`,
      icon: Handshake,
      href: "/admin/deals",
      iconWrap: "bg-[#eaf8f2] text-[#007a5a]",
      noteClass: "text-[#007a5a]",
    },
    {
      label: t.adRequests || "",
      value: pendingAdRequests.length.toLocaleString("en-US"),
      note:
        pendingAdRequests.length > 0
          ? `${pendingAdRequests.length} ${t.adPendingNote || ""}`
          : `${activeFeaturedUnits.length} ${t.adActiveNote || ""}`,
      icon: Star,
      href: "/admin/promotions",
      iconWrap: "bg-amber-50 text-amber-600",
      noteClass:
        pendingAdRequests.length > 0 ? "text-amber-700" : "text-slate-500",
    },
    {
      label: t.totalBuyerLeads || dict?.admin?.shell?.nav?.leads || "",
      value: leads.length.toLocaleString("en-US"),
      note: `${leads.length.toLocaleString("en-US")} ${t.buyRequestsWord || t.generalRequestsNote || ""}`,
      icon: FileText,
      href: "/admin/leads",
      iconWrap: "bg-blue-50 text-blue-600",
      noteClass: "text-slate-500",
    },
  ]

  return (
    <div dir={dir} className="mx-auto max-w-7xl space-y-5 text-start">
      {/* صف الإحصائيات السريعة (5 كروت بأرقام في المنتصف تماماً) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map(
          ({ label, value, note, icon: Icon, href, iconWrap, noteClass }) => (
            <Link
              key={href}
              href={href}
              className="group block h-full transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Card className="h-full rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all hover:border-[#007a5a]/40 hover:shadow-sm">
                <CardContent className="flex h-full flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-extrabold text-slate-600 group-hover:text-[#0f1d40]">
                      {label}
                    </p>
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}
                    >
                      <Icon className="size-4 shrink-0" />
                    </span>
                  </div>

                  <div
                    dir="ltr"
                    className="my-3 text-center text-3xl font-black tracking-tight text-[#0f1d40] tabular-nums"
                  >
                    {value}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span
                      className={`line-clamp-1 text-[11px] font-bold ${noteClass}`}
                    >
                      {note}
                    </span>
                    <ArrowLeft className="size-3 shrink-0 text-slate-300 transition-colors group-hover:text-[#007a5a] rtl:rotate-0 ltr:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>

      {/* السيكشن الأول (قابل للطي والفتح، ويفتح تلقائياً عند وجود صفقات جاهزة) */}
      <details
        open={readyDeals.length > 0}
        className={`group overflow-hidden rounded-2xl bg-white shadow-2xs transition-all ${
          readyDeals.length > 0
            ? "border-2 border-emerald-200"
            : "border border-slate-200/90"
        }`}
      >
        <summary
          className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition select-none [&::-webkit-details-marker]:hidden ${
            readyDeals.length > 0
              ? "bg-[#eaf8f2]/65 group-open:border-b group-open:border-emerald-100"
              : "bg-white hover:bg-slate-50/70 group-open:border-b group-open:border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
                readyDeals.length > 0 ? "bg-[#007a5a]" : "bg-slate-400"
              }`}
            >
              <Handshake className="size-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-[#0f1d40] sm:text-base">
                  {L.sec1Title}
                </span>
                <span
                  dir="ltr"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black text-white ${
                    readyDeals.length > 0 ? "bg-[#007a5a]" : "bg-slate-400"
                  }`}
                >
                  {readyDeals.length}
                </span>
                {readyDeals.length === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>{L.sec1EmptyShort}</span>
                  </span>
                )}
              </div>
              {readyDeals.length > 0 && (
                <p className="mt-0.5 text-[11.5px] font-semibold text-[#007a5a]">
                  {L.sec1Sub}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/deals?tab=accepted"
              className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold transition ${
                readyDeals.length > 0
                  ? "bg-[#007a5a] text-white hover:bg-[#006248]"
                  : "border border-slate-200 bg-white text-[#0f1d40] hover:border-[#007a5a] hover:text-[#007a5a]"
              }`}
            >
              <span>{L.sec1Btn}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
            <span className="flex size-8.5 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition group-hover:text-[#0f1d40]">
              <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div>
          {readyDeals.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-slate-400">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>{L.sec1Empty}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-500">
                    <th className="px-5 py-3 text-start">{L.colUnit}</th>
                    <th className="px-3 py-3 text-start">{L.colSeller}</th>
                    <th className="px-3 py-3 text-start">{L.colBuyer}</th>
                    <th className="px-3 py-3 text-start">{L.colAgreedCash}</th>
                    <th className="px-3 py-3 text-start">
                      {L.colCommission} ({commPct}%)
                    </th>
                    <th className="px-5 py-3 text-end">{L.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readyDeals.map(({ offer, unit }) => {
                    const uCode = deriveUnitCode(unit.id, unit.code)
                    const cur = georgiaCurrency
                    const agreedCash = Number(offer.offered_cash) || 0
                    const commissionBase =
                      Number(unit.contract_price) || agreedCash || 0
                    const platformCommission = Math.round(
                      commissionBase * (commPct / 100)
                    )
                    const localizedArea = cleanAreaDisplay(unit.area, locale)

                    const sellerWa = `${leadsDict.waGeneralPrefix || ""} ${unit.name}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${agreedCash.toLocaleString("en-US")} ${cur}`
                    const buyerWa = `${leadsDict.waUnitLeadPrefix || ""} ${offer.buyer_name || ""}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${agreedCash.toLocaleString("en-US")} ${cur}`

                    return (
                      <tr
                        key={offer.id}
                        className="transition hover:bg-[#eaf8f2]/25"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-[#eaf8f2] px-2 py-0.5 font-mono text-[10.5px] font-black text-[#007a5a]">
                              {uCode}
                            </span>
                            <span className="font-extrabold text-[#0f1d40]">
                              {unit.project_name || t.defaultUnit}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            {localizedArea}
                          </p>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <a
                              data-admin-client-wa="true"
                              href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                              target="_blank"
                              rel="noreferrer"
                              title={sm.contactSellerWa}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                            >
                              <WhatsAppOfficialIcon className="size-4" />
                            </a>
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-[#0f1d40]">
                                {unit.name || "—"}
                              </p>
                              <p
                                dir="ltr"
                                className="text-start font-mono text-[11px] text-slate-400"
                              >
                                {unit.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <a
                              data-admin-client-wa="true"
                              href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                              target="_blank"
                              rel="noreferrer"
                              title={sm.contactBuyerWa}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                            >
                              <WhatsAppOfficialIcon className="size-4" />
                            </a>
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-[#0f1d40]">
                                {offer.buyer_name || "—"}
                              </p>
                              <p
                                dir="ltr"
                                className="text-start font-mono text-[11px] text-slate-400"
                              >
                                {offer.buyer_phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <strong
                            dir="ltr"
                            className="text-sm font-black text-[#007a5a] tabular-nums"
                          >
                            {cur}
                            {agreedCash.toLocaleString("en-US")}
                          </strong>
                        </td>

                        <td className="px-3 py-3.5">
                          <strong
                            dir="ltr"
                            className="rounded-md bg-[#eaf8f2] px-2.5 py-1 text-xs font-black text-[#007a5a] tabular-nums"
                          >
                            {cur}
                            {platformCommission.toLocaleString("en-US")}
                          </strong>
                        </td>

                        <td className="px-5 py-3.5 text-end">
                          <Link
                            href={`/admin/deals?offerId=${offer.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#007a5a] px-3.5 text-[11px] font-extrabold text-white transition hover:bg-[#006248]"
                          >
                            <span>{L.btnCloseDeal}</span>
                            <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      {/* السيكشن الثاني (يطوى تلقائياً في سطر واحد نظيف عندما يكون العدد 0، ويفتح تلقائياً عند وصول عرض جديد) */}
      <details
        open={pendingAdminOffersCount > 0}
        className={`group overflow-hidden rounded-2xl bg-white shadow-2xs transition-all ${
          pendingAdminOffersCount > 0
            ? "border-2 border-amber-300"
            : "border border-slate-200/90"
        }`}
      >
        <summary
          className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition select-none [&::-webkit-details-marker]:hidden ${
            pendingAdminOffersCount > 0
              ? "bg-amber-50/60 group-open:border-b group-open:border-amber-100"
              : "bg-white hover:bg-slate-50/70 group-open:border-b group-open:border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${
                pendingAdminOffersCount > 0 ? "bg-amber-500" : "bg-slate-400"
              }`}
            >
              <BellRing className="size-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-[#0f1d40] sm:text-base">
                  {L.sec2Title}
                </span>
                <span
                  dir="ltr"
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black text-white ${
                    pendingAdminOffersCount > 0
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                >
                  {newPendingAdminOffers.length}
                </span>
                {pendingAdminOffersCount === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>{L.sec2EmptyShort}</span>
                  </span>
                )}
              </div>
              {pendingAdminOffersCount > 0 && (
                <p className="mt-0.5 text-[11.5px] font-semibold text-amber-900">
                  {L.sec2Sub}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/deals"
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#0f1d40] transition hover:border-[#007a5a] hover:text-[#007a5a]"
            >
              <span>{L.sec2Btn}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
            <span className="flex size-8.5 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition group-hover:text-[#0f1d40]">
              <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div>
          {newPendingAdminOffers.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs font-bold text-slate-400">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>{L.sec2Empty}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500">
                    <th className="px-5 py-3 text-start">{L.colUnit}</th>
                    <th className="px-3 py-3 text-start">{L.colBuyer}</th>
                    <th className="px-3 py-3 text-start">{L.colSeller}</th>
                    <th className="px-3 py-3 text-start">{L.colOfferedCash}</th>
                    <th className="px-3 py-3 text-start">{L.colReadiness}</th>
                    <th className="px-5 py-3 text-end">{L.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newPendingAdminOffers.slice(0, 6).map(({ offer, unit }) => {
                    const uCode = deriveUnitCode(unit.id, unit.code)
                    const cur = georgiaCurrency
                    const offeredCash = Number(offer.offered_cash) || 0
                    const originalCash =
                      Number(unit.paid_amount || offer.required_cash) || 0
                    const localizedArea = cleanAreaDisplay(unit.area, locale)

                    const readinessText =
                      offer.payment_readiness === "48h"
                        ? L.readiness48h
                        : offer.payment_readiness === "1_week"
                          ? L.readiness1Week
                          : L.readiness2Weeks
                    const methodText =
                      offer.payment_method === "bank_check"
                        ? L.methodCheck
                        : L.methodTransfer

                    const buyerWa = `${leadsDict.waUnitLeadPrefix || ""} ${offer.buyer_name || ""}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${offeredCash.toLocaleString("en-US")} ${cur}`
                    const sellerWa = `${leadsDict.waGeneralPrefix || ""} ${unit.name}${listSep}(${unit.project_name || t.defaultUnit || ""} - ${uCode}) — ${sm.agreedCashLabel || ""}: ${offeredCash.toLocaleString("en-US")} ${cur}`

                    return (
                      <tr
                        key={offer.id}
                        className="bg-amber-50/20 transition hover:bg-amber-50/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/deals?offerId=${offer.id}`}
                            className="block"
                          >
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                                {uCode}
                              </span>
                              <span className="font-extrabold text-[#0f1d40] hover:text-[#007a5a]">
                                {unit.project_name || t.defaultUnit}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                              {localizedArea}
                            </p>
                          </Link>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <a
                              data-admin-client-wa="true"
                              href={`https://wa.me/${String(offer.buyer_phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWa)}`}
                              target="_blank"
                              rel="noreferrer"
                              title={sm.contactBuyerWa}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                            >
                              <WhatsAppOfficialIcon className="size-4" />
                            </a>
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-[#0f1d40]">
                                {offer.buyer_name || "—"}
                              </p>
                              <p
                                dir="ltr"
                                className="text-start font-mono text-[11px] text-slate-400"
                              >
                                {offer.buyer_phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <a
                              data-admin-client-wa="true"
                              href={`https://wa.me/${String(unit.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWa)}`}
                              target="_blank"
                              rel="noreferrer"
                              title={sm.contactSellerWa}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                            >
                              <WhatsAppOfficialIcon className="size-4" />
                            </a>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-700">
                                {unit.name || "—"}
                              </p>
                              <p
                                dir="ltr"
                                className="text-start font-mono text-[11px] text-slate-400"
                              >
                                {unit.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <strong
                            dir="ltr"
                            className="text-sm font-black text-[#007a5a] tabular-nums"
                          >
                            {cur}
                            {offeredCash.toLocaleString("en-US")}
                          </strong>
                          <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400">
                            {L.colOriginalCash}:{" "}
                            <span dir="ltr">
                              {cur}
                              {originalCash.toLocaleString("en-US")}
                            </span>
                          </p>
                        </td>

                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
                            <span>⚡ {readinessText}</span>
                            <span>·</span>
                            <span>{methodText}</span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-end">
                          <Link
                            href={`/admin/deals?offerId=${offer.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 text-[11px] font-extrabold text-white shadow-2xs transition hover:bg-amber-600"
                          >
                            <Send className="size-3" />
                            <span>{L.btnApproveOffer}</span>
                            <ArrowLeft className="size-3 rtl:rotate-0 ltr:rotate-180" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      {/* السيكشن الثالث: أحدث الوحدات المضافة (يمين) وأحدث طلبات المشترين (يسار) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#eaf8f2] text-[#007a5a]">
                <Building2 className="size-4" />
              </span>
              <CardTitle className="text-sm font-black text-[#0f1d40]">
                {t.latestProperties} ({georgiaLabel})
              </CardTitle>
            </div>
            <Link
              href="/admin/properties"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#007a5a] hover:underline"
            >
              <span>{t.viewAll}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {properties.length === 0 ? (
              <div className="py-10 text-center text-xs font-semibold text-slate-400">
                {t.noProperties}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold text-slate-500">
                      <th className="px-5 py-3 text-start">{L.colUnit}</th>
                      <th className="hidden px-3 py-3 text-start sm:table-cell">
                        {cols.sellerName || L.colSeller}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {cols.requiredCash || ""}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {cols.status || ""}
                      </th>
                      <th className="px-5 py-3 text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {properties.slice(0, 6).map((prop) => {
                      const stKey = resolveEffectiveUnitStatus(prop)
                      const stLabel =
                        statusesDict[stKey] || statusesDict.active || stKey
                      const stCls =
                        STATUS_BADGE_CLASSES[stKey] ||
                        STATUS_BADGE_CLASSES.active
                      const uCode = deriveUnitCode(prop.id, prop.code)
                      const localizedArea = cleanAreaDisplay(prop.area, locale)

                      const sellerWaMsg = `${leadsDict.waGeneralPrefix || ""} ${prop.name}${listSep}(${prop.project_name || t.defaultUnit || ""} - ${localizedArea} - ${uCode}) — $${Number(prop.paid_amount || 0).toLocaleString("en-US")}`

                      return (
                        <tr
                          key={prop.id}
                          className="group transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/admin/properties?unitId=${prop.id}`}
                              className="block"
                            >
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-[#0f1d40]">
                                  {uCode}
                                </span>
                                <span className="font-extrabold text-[#0f1d40] group-hover:text-[#007a5a]">
                                  {prop.project_name || t.defaultUnit}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                {localizedArea}
                              </p>
                            </Link>
                          </td>

                          <td className="hidden px-3 py-3.5 sm:table-cell">
                            <p className="font-bold text-slate-700">
                              {prop.name || "—"}
                            </p>
                            <p
                              dir="ltr"
                              className="text-start font-mono text-[11px] text-slate-400"
                            >
                              {prop.phone || "—"}
                            </p>
                          </td>

                          <td className="px-3 py-3.5">
                            <span
                              dir="ltr"
                              className="font-black text-[#007a5a] tabular-nums"
                            >
                              {prop.paid_amount
                                ? `$${Number(prop.paid_amount).toLocaleString("en-US")}`
                                : "—"}
                            </span>
                          </td>

                          <td className="px-3 py-3.5">
                            <Badge
                              className={`border text-[10px] font-extrabold ${stCls}`}
                            >
                              {stLabel}
                            </Badge>
                          </td>

                          <td className="px-5 py-3.5 text-end">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Link
                                href={`/opportunities/${prop.id}`}
                                target="_blank"
                                title={t.viewAll}
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007a5a] hover:text-[#007a5a]"
                              >
                                <ExternalLink className="size-3.5" />
                              </Link>
                              <a
                                data-admin-client-wa="true"
                                href={`https://wa.me/${String(prop.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(sellerWaMsg)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex size-8 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                              >
                                <WhatsAppOfficialIcon className="size-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FileText className="size-4" />
              </span>
              <CardTitle className="text-sm font-black text-[#0f1d40]">
                {t.latestLeads} ({georgiaLabel})
              </CardTitle>
            </div>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#007a5a] hover:underline"
            >
              <span>{t.allShort}</span>
              <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {leads.length === 0 ? (
              <div className="py-10 text-center text-xs font-semibold text-slate-400">
                {t.noLeads}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 6).map((lead) => {
                  const areasList = Array.isArray(lead.preferred_areas)
                    ? lead.preferred_areas
                    : lead.preferred_areas
                      ? [String(lead.preferred_areas)]
                      : []
                  const isSpecificUnitBooker = areasList.some(
                    (a: string) =>
                      String(a).includes("🎯") ||
                      String(a).includes("U-") ||
                      Boolean(lead.target_unit_id)
                  )
                  const cleanTarget =
                    areasList
                      .map((a: string) =>
                        cleanAreaDisplay(
                          a.replace(/الرحاب/g, "King David Residences"),
                          locale
                        )
                      )
                      .join(listSep) || t.allAreas
                  const cashFormatted = Number(
                    lead.available_cash || lead.budget || 0
                  ).toLocaleString("en-US")
                  const leadInitial = (
                    String(lead.name || "B").trim().charAt(0) || "B"
                  ).toUpperCase()

                  const buyerWaMsg = `${leadsDict.waGeneralPrefix || ""} ${lead.name}${listSep}${leadsDict.waGeneralMiddle || ""} (${cleanTarget || t.allAreas || ""}) — ${leadsDict.cashShort || ""} $${cashFormatted}. ${leadsDict.waGeneralSuffix || ""}`

                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/80"
                    >
                      <Link
                        href={`/admin/leads?leadId=${lead.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f2] text-xs font-black text-[#007a5a]">
                          {leadInitial}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-extrabold text-[#0f1d40]">
                              {lead.name}
                            </p>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-extrabold ${
                                isSpecificUnitBooker
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isSpecificUnitBooker
                                ? L.specificUnitLeadBadge
                                : L.generalLeadBadge}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                            {cleanTarget}
                          </p>
                        </div>
                      </Link>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          dir="ltr"
                          className="rounded-md bg-[#eaf8f2] px-2 py-1 text-[11px] font-black text-[#007a5a] tabular-nums"
                        >
                          ${cashFormatted}
                        </span>
                        <a
                          data-admin-client-wa="true"
                          href={`https://wa.me/${String(lead.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(buyerWaMsg)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-2xs transition hover:bg-[#1ebe5d]"
                        >
                          <WhatsAppOfficialIcon className="size-4" />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}