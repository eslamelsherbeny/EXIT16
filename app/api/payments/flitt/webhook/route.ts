import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

function verifyFlittWebhookSignature(
  payload: Record<string, any>,
  secretKey: string
): boolean {
  const receivedSig = String(payload.signature || "").trim()
  if (!receivedSig || !secretKey) return false

  const ignoredKeys = new Set(["signature", "response_signature_string"])
  const orderedValues = Object.keys(payload)
    .filter((k) => !ignoredKeys.has(k))
    .sort()
    .map((k) => {
      const v = payload[k]
      if (v === null || v === undefined) return ""
      return typeof v === "object" ? JSON.stringify(v) : String(v)
    })
    .filter((v) => v.length > 0)

  const expectedSig = createHash("sha1")
    .update([secretKey, ...orderedValues].join("|"), "utf8")
    .digest("hex")

  if (receivedSig.length !== expectedSig.length) return false
  return timingSafeEqual(
    Buffer.from(receivedSig, "utf8"),
    Buffer.from(expectedSig, "utf8")
  )
}

export async function POST(req: Request) {
  try {
    const secretKey = process.env.FLITT_SECRET_KEY?.trim()
    if (!secretKey) {
      return NextResponse.json(
        { error: "FLITT_SECRET_NOT_CONFIGURED" },
        { status: 503 }
      )
    }

    const payload = (await req.json()) as Record<string, any>

    if (!verifyFlittWebhookSignature(payload, secretKey)) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 })
    }

    const orderRef = String(payload.order_id || "").trim()
    const orderStatus = String(payload.order_status || "").toLowerCase()
    if (!orderRef) {
      return NextResponse.json({ error: "MISSING_ORDER_ID" }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    const { data: reqRow } = await supabase
      .from("boost_requests")
      .select("*")
      .eq("order_ref", orderRef)
      .maybeSingle()

    if (!reqRow) {
      return NextResponse.json({ ok: true })
    }

    if (orderStatus === "approved") {
      // حماية من التكرار (Idempotency)
      if (
        reqRow.status === "paid_pending_approval" ||
        reqRow.status === "approved"
      ) {
        return NextResponse.json({ ok: true })
      }

      await supabase
        .from("boost_requests")
        .update({
          status: "paid_pending_approval",
          payment_method: "flitt",
        })
        .eq("id", reqRow.id)

      if (reqRow.unit_id) {
        const tierCode = String(reqRow.package_tier || "")
          .toUpperCase()
          .includes("VIP+")
          ? "vip_plus"
          : "super_vip"

        await supabase
          .from("sell_requests")
          .update({
            featured_status: "pending_payment",
            boost_tier: tierCode,
            featured_days: reqRow.duration_days,
            featured_price: reqRow.amount_gel,
            featured_fawry_code: orderRef,
          })
          .eq("id", reqRow.unit_id)
      }

      try {
        await supabase.from("notifications").insert({
          user_id: null,
          role: "admin",
          title: `💳 Flitt Paid (${reqRow.amount_gel} ₾) — ${reqRow.package_tier}`,
          message: `${reqRow.unit_code || reqRow.unit_id || ""} · Ref: ${orderRef}`,
          type: "property",
          link: "/admin/promotions",
          is_read: false,
        })
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Flitt webhook error:", err)
    return NextResponse.json({ error: "WEBHOOK_ERROR" }, { status: 500 })
  }
}