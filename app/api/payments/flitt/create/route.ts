import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"

const FLITT_API_URL =
  process.env.FLITT_API_URL || "https://pay.flitt.com/api/checkout/url"
const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://exit-16.vercel.app"

function buildFlittSignature(
  params: Record<string, string | number>,
  secretKey: string
): string {
  const orderedValues = Object.keys(params)
    .sort()
    .map((k) => String(params[k] ?? ""))
    .filter((v) => v.length > 0)

  const signatureString = [secretKey, ...orderedValues].join("|")
  return createHash("sha1").update(signatureString, "utf8").digest("hex")
}

export async function POST(req: Request) {
  try {
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

    const { data: user } = await supabase
      .from("users")
      .select("id, email, password_hash, status")
      .eq("id", userId)
      .maybeSingle()

    if (
      !user ||
      user.status === "suspended" ||
      !parseAndVerifySessionCookie(rawSession, user.password_hash).valid
    ) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await req.json()
    const unitId = String(body.unitId || "").trim()
    const tier: "super_vip" | "vip_plus" =
      body.tier === "vip_plus" ? "vip_plus" : "super_vip"
    const durationDays = Math.max(1, Math.min(90, Number(body.days) || 7))
    const amountGel = Math.max(5, Math.min(10000, Number(body.amountGel) || 0))

    if (!unitId || !Number.isFinite(amountGel) || amountGel <= 0) {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 })
    }

    // قاعدة الأمان: لا يُسمح بالدفع أو التمييز إلا لوحدة منشورة (active) يملكها المستخدم
    const { data: unit } = await supabase
      .from("sell_requests")
      .select("id, user_id, code, project_name, status")
      .eq("id", unitId)
      .maybeSingle()

    if (!unit || String(unit.user_id) !== String(user.id)) {
      return NextResponse.json({ error: "UNIT_NOT_FOUND" }, { status: 404 })
    }

    const unitSt = String(unit.status || "").trim().toLowerCase()
    if (
      unitSt !== "active" &&
      unitSt !== "approved" &&
      unitSt !== "published" &&
      unitSt !== "offer_received"
    ) {
      return NextResponse.json(
        { error: "UNIT_MUST_BE_ACTIVE_TO_BOOST" },
        { status: 400 }
      )
    }

    const orderRef = `FL-${Date.now().toString(36).toUpperCase()}-${String(unit.id).slice(0, 4).toUpperCase()}`
    const packageLabel = tier === "vip_plus" ? "VIP+" : "SUPER VIP"

    // تسجيل طلب مؤقت بحالة awaiting_payment (لا يظهر للأدمن إلا بعد تأكيد الدفع من Webhook)
    const { data: boostRow, error: insertErr } = await supabase
      .from("boost_requests")
      .insert({
        unit_id: unit.id,
        unit_code: unit.code || null,
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
        { error: "DB_INSERT_FAILED" },
        { status: 500 }
      )
    }

    const merchantId = process.env.FLITT_MERCHANT_ID?.trim()
    const secretKey = process.env.FLITT_SECRET_KEY?.trim()

    if (!merchantId || !secretKey) {
      return NextResponse.json(
        { error: "FLITT_NOT_CONFIGURED" },
        { status: 503 }
      )
    }

    const flittParams: Record<string, string | number> = {
      order_id: orderRef,
      merchant_id: Number(merchantId),
      order_desc: `Aqar Exit ${packageLabel} (${durationDays}d) - ${unit.project_name || unit.code || unit.id}`,
      amount: Math.round(amountGel * 100), // المبلغ بالتيتري (1 GEL = 100)
      currency: "GEL",
      response_url: `${DEFAULT_SITE_URL}/account?view=seller&unitId=${unit.id}&payment=returned&ref=${encodeURIComponent(orderRef)}`,
      server_callback_url: `${DEFAULT_SITE_URL}/api/payments/flitt/webhook`,
      sender_email: user.email || "",
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

    const flittData = await flittRes.json()
    const checkoutUrl = flittData?.response?.checkout_url

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error:
            flittData?.response?.error_message || "FLITT_CHECKOUT_INIT_FAILED",
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