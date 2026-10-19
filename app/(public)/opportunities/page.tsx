import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import OpportunitiesClient, { type OpportunityUnit } from "./opportunities-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

export default async function OpportunitiesPage() {
  const supabase = await getSupabase()

  // جلب الوحدات الحقيقية المعتمدة فقط (status = 'active') من قاعدة البيانات
  const { data: rows } = await supabase
    .from("sell_requests")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const units: OpportunityUnit[] = (rows || []).map((row: any) => {
    const contractPrice = Number(row.contract_price) || 0
    const paidAmount = Number(row.paid_amount) || 0
    const discountAmount = row.willing_to_discount
      ? Number(row.discount_amount) || 0
      : 0

    // المطلوب كاش دلوقتي (المدفوع ناقص أي خصم يقدمه البائع)
    const requiredCash = Math.max(0, paidAmount - discountAmount)

    // المتبقي للمطور
    const remainingForDeveloper = Math.max(0, contractPrice - paidAmount)

    // سعر السوق اليوم
    const marketPrice =
      Number(row.market_price) > 0 ? Number(row.market_price) : contractPrice

    // عمولة المنصة على المشتري (1.25% من إجمالي سعر التعاقد)
    const buyerCommission = Math.round(contractPrice * 0.0125)

    // إجمالي تكلفة الوحدة على المشتري شاملة العمولة
    const totalBuyerCost = requiredCash + remainingForDeveloper + buyerCommission

    // صافي مكسب المشتري عن سعر السوق اليوم بعد خصم عمولة 1.25%
    const netBuyerGain = Math.max(0, marketPrice - totalBuyerCost)

    // كود الوحدة المميز
    const shortCode = `U-${String(row.id)
      .replace(/[^0-9a-zA-Z]/g, "")
      .slice(0, 5)
      .toUpperCase()}`

    // تحديد سنة الاستلام أو حالة الاستلام
    const currentYear = new Date().getFullYear()
    const yearsLeft = Number(row.years_left) || 0
    let deliveryText = String(row.delivery_status || "").trim()
    if (!deliveryText || /^\d{4}$/.test(deliveryText) === false) {
      if (deliveryText.includes("فوري") || deliveryText.includes("مستلم")) {
        deliveryText = "استلام فوري"
      } else if (yearsLeft > 0) {
        deliveryText = String(currentYear + Math.min(yearsLeft, 4))
      } else {
        deliveryText = String(currentYear + 1)
      }
    }

    const images: string[] = Array.isArray(row.images)
      ? row.images.filter(Boolean)
      : []

    return {
      id: String(row.id),
      code: shortCode,
      projectName: row.project_name || "مشروع سكني",
      developerName: row.developer_name || "مطور عقاري",
      area: row.area || "القاهرة الجديدة",
      unitType: row.unit_type || "شقة",
      rooms: Number(row.rooms) || 0,
      bathrooms: Number(row.bathrooms) || 0,
      size: Number(row.size) || 0,
      finishing: row.finishing || "نصف تشطيب",
      requiredCash,
      paidAmount,
      contractPrice,
      marketPrice,
      remainingForDeveloper,
      installmentAmount: Number(row.installment_amount) || 0,
      installmentFrequency: row.installment_frequency || "ربع سنوي",
      yearsLeft,
      deliveryText,
      willingToDiscount: Boolean(row.willing_to_discount),
      discountAmount,
      netBuyerGain,
      image:
        images[0] ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
      createdAt: row.created_at || new Date().toISOString(),
    }
  })

  return <OpportunitiesClient initialUnits={units} />
}