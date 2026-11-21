import { NextResponse } from "next/server"

function buildAccountRedirect(req: Request) {
  const url = new URL(req.url)
  const unitId = url.searchParams.get("unitId") || ""
  const ref = url.searchParams.get("ref") || ""

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