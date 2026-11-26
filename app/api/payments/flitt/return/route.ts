import { NextResponse } from "next/server"

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const SAFE_REF_REGEX = /^[a-zA-Z0-9_-]{4,64}$/

function buildAccountRedirect(req: Request) {
  const url = new URL(req.url)
  const rawUnitId = (url.searchParams.get("unitId") || "").trim()
  const rawRef = (url.searchParams.get("ref") || "").trim()

  const unitId = UUID_REGEX.test(rawUnitId) ? rawUnitId : ""
  const ref = SAFE_REF_REGEX.test(rawRef) ? rawRef : ""

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://dualdealz.com"
  ).replace(/\/$/, "")

  const target = new URL(`${siteUrl}/account`)
  target.searchParams.set("view", "seller")
  if (unitId) target.searchParams.set("unitId", unitId)
  target.searchParams.set("payment", "returned")
  if (ref) target.searchParams.set("ref", ref)

  // 303 يحوّل POST القادم من Flitt إلى GET عادي فيحافظ المتصفح على جلسة المستخدم
  return NextResponse.redirect(target, 303)
}

export async function POST(req: Request) {
  return buildAccountRedirect(req)
}

export async function GET(req: Request) {
  return buildAccountRedirect(req)
}