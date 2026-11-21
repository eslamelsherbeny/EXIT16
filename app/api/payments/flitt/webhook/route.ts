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

    const rawBody = (await req.json().catch(() => ({}))) as Record<string, any>
    const payload =
      rawBody?.response && typeof rawBody.response === "object"
        ? rawBody.response
        : rawBody

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
      if (
        reqRow.status === "paid_pending_approval" ||
        reqRow.status === "approved"
      ) {
        return NextResponse.json({ ok: true })
      }

      const paidAtIso = new Date().toISOString()

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

        const { data: unitRow } = await supabase
          .from("sell_requests")
          .select("id, is_featured, featured_until, documents")
          .eq("id", reqRow.unit_id)
          .maybeSingle()

        const isAlreadyActive =
          Boolean(unitRow?.is_featured) &&
          (!unitRow?.featured_until ||
            new Date(unitRow.featured_until) > new Date())

        const currentDocs =
          unitRow?.documents && typeof unitRow.documents === "object"
            ? { ...unitRow.documents }
            : {}
        const currentMeta =
          currentDocs.__unit_meta &&
          typeof currentDocs.__unit_meta === "object"
            ? { ...currentDocs.__unit_meta }
            : {}

        currentDocs.__unit_meta = {
          ...currentMeta,
          boost_pending: {
            order_ref: orderRef,
            paid_via: "flitt",
            paid_at: paidAtIso,
            tier: tierCode,
            days: Number(reqRow.duration_days) || 1,
            amount_gel: Number(reqRow.amount_gel) || 0,
            is_renewal: isAlreadyActive,
          },
          boost_last_rejected: null,
        }

        const unitUpdate: Record<string, any> = {
          documents: currentDocs,
        }

        // لا نعدّل حالة الإعلان النشط حالياً إذا كان الطلب تمديداً لباقة شغالة بالفعل
        if (!isAlreadyActive) {
          unitUpdate.featured_status = "pending_payment"
          unitUpdate.boost_tier = tierCode
          unitUpdate.featured_days = reqRow.duration_days
          unitUpdate.featured_price = reqRow.amount_gel
          unitUpdate.featured_fawry_code = orderRef
        }

        await supabase
          .from("sell_requests")
          .update(unitUpdate)
          .eq("id", reqRow.unit_id)
      }

      try {
        await supabase.from("notifications").insert({
          user_id: null,
          role: "admin",
          title: `💳 Flitt Paid (${reqRow.amount_gel} ₾ · ${reqRow.duration_days}d) — ${reqRow.package_tier}`,
          message: `${reqRow.unit_code || reqRow.unit_id || ""} · Ref: ${orderRef}`,
          type: "property",
          link: "/admin/promotions",
          is_read: false,
        })
      } catch {}
    } else if (orderStatus === "declined" || orderStatus === "expired") {
      await supabase
        .from("boost_requests")
        .update({ status: "rejected" })
        .eq("id", reqRow.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Flitt webhook error:", err)
    return NextResponse.json({ error: "WEBHOOK_ERROR" }, { status: 500 })
  }
}