import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getServerI18n } from "@/lib/get-server-dictionary"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getUnifiedUnitCode } from "@/lib/unit-display-helpers"

const FLITT_API_URL =
  process.env.FLITT_API_URL || "https://pay.flitt.com/api/checkout/url"
const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://dualdealz.com"

function buildFlittSignature(
  params: Record<string, string | number>,
  secretKey: string
): string {
  const orderedValues = Object.keys(params)
    .filter(
      (k) =>
        k !== "signature" &&
        k !== "response_signature_string" &&
        params[k] !== "" &&
        params[k] !== null &&
        params[k] !== undefined
    )
    .sort()
    .map((k) => String(params[k]))

  const signatureString = [secretKey, ...orderedValues].join("|")
  return createHash("sha1").update(signatureString, "utf8").digest("hex")
}

// إعادة حساب الباقة وعدد الأيام على السيرفر حصراً بناءً على أسعار الإعدادات لمنع أي تلاعب من المتصفح
function resolveServerBoostPackage(
  rawAmountGel: number,
  vipPlusDaily: number,
  superVipDaily: number
): {
  amountGel: number
  tier: "super_vip" | "vip_plus"
  durationDays: number
} {
  const vipPlusRate = Math.max(1, Math.round(vipPlusDaily || 5))
  const superVipRate = Math.max(
    vipPlusRate + 1,
    Math.round(superVipDaily || 10)
  )

  const amountGel = Math.max(
    vipPlusRate,
    Math.min(10000, Math.round(rawAmountGel || 0))
  )

  const tier50 = superVipRate * 5
  const tier100 = superVipRate * 10
  const daysAt50 = Math.max(6, Math.round(tier50 / (superVipRate * 0.75)))
  const daysAt100 = Math.max(14, Math.round(tier100 / (superVipRate * 0.7)))

  if (amountGel < superVipRate) {
    return {
      amountGel,
      tier: "vip_plus",
      durationDays: Math.max(1, Math.floor(amountGel / vipPlusRate)),
    }
  }

  if (amountGel < tier50) {
    return {
      amountGel,
      tier: "super_vip",
      durationDays: Math.max(1, Math.floor(amountGel / superVipRate)),
    }
  }

  if (amountGel < tier100) {
    return {
      amountGel,
      tier: "super_vip",
      durationDays: Math.max(
        daysAt50,
        Math.round(amountGel / (superVipRate * 0.75))
      ),
    }
  }

  return {
    amountGel,
    tier: "super_vip",
    durationDays: Math.max(
      daysAt100,
      Math.min(365, Math.round(amountGel / (superVipRate * 0.7)))
    ),
  }
}

export async function POST(req: Request) {
  try {
    const merchantId = process.env.FLITT_MERCHANT_ID?.trim()
    const secretKey = process.env.FLITT_SECRET_KEY?.trim()

    if (!merchantId || !secretKey) {
      return NextResponse.json(
        { error: "FLITT_NOT_CONFIGURED" },
        { status: 503 }
      )
    }

    const cookieStore = await cookies()
    const rawSession = cookieStore.get("user_session")?.value
    const userId = extractUserIdFromCookie(rawSession)

    if (!rawSession || !userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const [{ data: user }, { siteSettings }] = await Promise.all([
      supabase
        .from("users")
        .select("id, email, role, password_hash, status")
        .eq("id", userId)
        .maybeSingle(),
      getServerI18n(),
    ])

    if (
      !user ||
      user.status === "suspended" ||
      !parseAndVerifySessionCookie(rawSession, user.password_hash).valid
    ) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const unitId = String(body.unitId || "").trim()
    const requestedAmount = Number(body.amountGel)

    if (!unitId || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 })
    }

    const vipPlusDaily = Number(
      (siteSettings as Record<string, any>)?.vipPlusDailyGel || 5
    )
    const superVipDaily = Number(
      (siteSettings as Record<string, any>)?.superVipDailyGel || 10
    )

    const { amountGel, tier, durationDays } = resolveServerBoostPackage(
      requestedAmount,
      vipPlusDaily,
      superVipDaily
    )

    const { data: unit } = await supabase
      .from("sell_requests")
      .select("id, user_id, code, project_name, status")
      .eq("id", unitId)
      .maybeSingle()

    const cleanRole = String(user.role || "user").toLowerCase()
    const isStaff = ["owner", "admin", "moderator", "sales"].includes(cleanRole)

    if (!unit || (!isStaff && String(unit.user_id) !== String(user.id))) {
      return NextResponse.json({ error: "UNIT_NOT_FOUND" }, { status: 404 })
    }

    // قاعدة الأمان: لا يُسمح بالدفع للتمييز إلا بعد اعتماد ونشر الوحدة في السوق
    const unitSt = String(unit.status || "").trim().toLowerCase()
    const isLive = [
      "active",
      "approved",
      "published",
      "offer_received",
    ].includes(unitSt)

    if (!isLive) {
      return NextResponse.json(
        { error: "UNIT_MUST_BE_ACTIVE_TO_BOOST" },
        { status: 400 }
      )
    }

    const unitCode = getUnifiedUnitCode(unit.id, unit.code)
    const orderRef = `FL-${Date.now().toString(36).toUpperCase()}-${String(unit.id).slice(0, 4).toUpperCase()}`
    const packageLabel = tier === "vip_plus" ? "VIP+" : "SUPER VIP"

    try {
      await supabase
        .from("boost_requests")
        .update({ status: "expired" })
        .eq("unit_id", unit.id)
        .eq("status", "awaiting_payment")
    } catch {}

    const { data: boostRow, error: insertErr } = await supabase
      .from("boost_requests")
      .insert({
        unit_id: unit.id,
        unit_code: unitCode,
        user_id: user.id,
        package_tier: packageLabel,
        duration_days: durationDays,
        amount_gel: amountGel,
        payment_method: "flitt",
        status: "awaiting_payment",
        order_ref: orderRef,
      })
      .select("id")
      .single()

    if (insertErr || !boostRow) {
      return NextResponse.json(
        { error: "DB_INSERT_FAILED", details: insertErr?.message || null },
        { status: 500 }
      )
    }

    const cleanOrigin = DEFAULT_SITE_URL.replace(/\/$/, "")

    const flittParams: Record<string, string | number> = {
      order_id: orderRef,
      merchant_id: Number(merchantId) || merchantId,
      order_desc: `DualDealz ${packageLabel} (${durationDays}d) - ${unitCode}`,
      amount: Math.round(amountGel * 100),
      currency: "GEL",
      response_url: `${cleanOrigin}/api/payments/flitt/return?unitId=${encodeURIComponent(unit.id)}&ref=${encodeURIComponent(orderRef)}`,
      server_callback_url: `${cleanOrigin}/api/payments/flitt/webhook`,
    }

    if (user.email && user.email.trim()) {
      flittParams.sender_email = user.email.trim()
    }

    const signature = buildFlittSignature(flittParams, secretKey)

    const flittRes = await fetch(FLITT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request: {
          ...flittParams,
          signature,
        },
      }),
    })

    const flittData = await flittRes.json().catch(() => ({}))
    const checkoutUrl = flittData?.response?.checkout_url

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error: "FLITT_INIT_FAILED",
          details:
            flittData?.response?.error_message ||
            flittData?.response?.response_status ||
            null,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      orderRef,
      boostRequestId: boostRow.id,
    })
  } catch (err) {
    console.error("Flitt create payment error:", err)
    return NextResponse.json({ error: "UNEXPECTED_ERROR" }, { status: 500 })
  }
}