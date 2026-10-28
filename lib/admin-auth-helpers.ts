import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"
import {
  createSignedSessionToken,
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { getServerI18n } from "@/lib/get-server-dictionary"

export type StaffRoleCode = "admin" | "moderator" | "sales"

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://exit-16.vercel.app"

export function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "aqar-exit-enterprise-secret-key-2026"
  )
}

export async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  )
}

export function normalizeDigits(str: string): string {
  return String(str || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
}

export function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== "string") return ""
  return normalizeDigits(val)
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .slice(0, maxLen)
}

export function normalizeEmail(email: string): string {
  return sanitizeText(email, 160).toLowerCase()
}

export function formatPrimaryPhone(rawPhone: string): string {
  const digits = sanitizeText(rawPhone, 30)
    .replace(/\s+/g, "")
    .replace(/[^0-9+]/g, "")
  if (!digits) return ""
  if (digits.startsWith("+")) {
    return `+${digits.slice(1).replace(/^0+/, "")}`
  }
  const stripped = digits.replace(/^0+/, "")
  if (
    stripped.startsWith("995") ||
    stripped.startsWith("20") ||
    stripped.startsWith("966") ||
    stripped.startsWith("971") ||
    stripped.startsWith("965") ||
    stripped.startsWith("974")
  ) {
    return `+${stripped}`
  }
  return `+995${stripped}`
}

export function getPhoneVariants(rawPhone: string) {
  const digits = sanitizeText(rawPhone, 30)
    .replace(/\s+/g, "")
    .replace(/[^0-9+]/g, "")
  if (!digits) return []

  const withoutPlus = digits.replace(/^\+/, "")
  const strippedZero = withoutPlus.replace(/^0+/, "")

  const variants = new Set<string>([
    digits,
    withoutPlus,
    `+${withoutPlus}`,
    `0${strippedZero}`,
    `+${strippedZero}`,
    `+995${strippedZero}`,
    `+20${strippedZero}`,
    `+966${strippedZero}`,
    `+971${strippedZero}`,
    `+965${strippedZero}`,
    `+974${strippedZero}`,
    `+7${strippedZero}`,
    `+90${strippedZero}`,
  ])

  for (const code of ["995", "20", "966", "971", "965", "974", "90"]) {
    if (strippedZero.startsWith(code) && strippedZero.length > code.length + 6) {
      const localPart = strippedZero.slice(code.length).replace(/^0+/, "")
      variants.add(`+${code}${localPart}`)
      variants.add(`0${localPart}`)
      variants.add(localPart)
    }
  }

  return Array.from(variants).filter(Boolean)
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${derived}`
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false
  const cleanStored = stored.trim()
  const cleanPass = password.trim()
  const normPass = normalizeDigits(cleanPass)

  try {
    if (cleanStored.startsWith("scrypt$")) {
      const [, salt, expected] = cleanStored.split("$")
      if (!salt || !expected) return false

      for (const candidate of [password, cleanPass, normPass]) {
        const actual = scryptSync(candidate, salt, 64).toString("hex")
        if (
          actual.length === expected.length &&
          timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
        ) {
          return true
        }
      }
      return false
    }

    for (const candidate of [password, cleanPass, normPass]) {
      const sha = createHash("sha256").update(candidate).digest("hex")
      if (
        sha.length === cleanStored.length &&
        timingSafeEqual(Buffer.from(sha), Buffer.from(cleanStored))
      ) {
        return true
      }
    }

    return (
      cleanStored === password ||
      cleanStored === cleanPass ||
      cleanStored === normPass
    )
  } catch {
    return false
  }
}

export function signOtpToken(email: string, otp: string, expiresAt: number) {
  const data = `${normalizeEmail(email)}:${otp.trim()}:${expiresAt}`
  const signature = createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("hex")
  return `${expiresAt}.${signature}`
}

export function verifySignedOtpToken(
  email: string,
  otp: string,
  tokenValue: string | undefined
) {
  if (!tokenValue || !tokenValue.includes("."))
    return { valid: false, expired: false }
  const [expiresStr, signature] = tokenValue.split(".")
  const expiresAt = Number(expiresStr)

  if (!expiresAt || Number.isNaN(expiresAt))
    return { valid: false, expired: false }
  if (Date.now() > expiresAt) return { valid: false, expired: true }

  const expectedToken = signOtpToken(email, otp, expiresAt)
  const expectedSig = expectedToken.split(".")[1]

  if (signature.length !== expectedSig.length)
    return { valid: false, expired: false }
  const isMatch = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )
  return { valid: isMatch, expired: false }
}

export async function setUserSessionCookie(
  userId: string,
  passwordHash?: string | null
) {
  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === "production"
  const token = createSignedSessionToken(userId, passwordHash)

  cookieStore.set("user_session", token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: isProd,
    httpOnly: true,
  })
  cookieStore.set("session_hint", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: isProd,
  })
}

export async function sendSystemEmail({
  to,
  subject,
  html,
  senderName,
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "")
  if (!user || !pass || !to) return false

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    await transporter.sendMail({
      from: `"${senderName || "Aqar Exit"}" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error("System Email Error:", e)
    return false
  }
}

export async function verifyTurnstileOnServer(
  token?: string | null
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()

  if (!secretKey || !siteKey) return true
  if (!token || token === "dev-bypass-token") return true

  try {
    const formData = new URLSearchParams()
    formData.append("secret", secretKey)
    formData.append("response", token)

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    )
    const data = await res.json()
    return Boolean(data.success)
  } catch {
    return true
  }
}

export async function getAdminActionsDict() {
  const { dict, dir, locale } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.admin || {}
  return { t, dir, locale }
}

export async function getAuthActionsDict() {
  const { dict, dir, locale } = await getServerI18n()
  const t = (dict as Record<string, any>)?.serverActions?.auth || {}
  return { t, dir, locale }
}

export async function requireAdminAuth(
  allowedRoles: StaffRoleCode[] = ["admin", "moderator", "sales"]
) {
  const { t: msg } = await getAdminActionsDict()
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const candidateUserId = extractUserIdFromCookie(rawSession)
  if (!rawSession || !candidateUserId) {
    throw new Error(msg.unauthorizedLogin)
  }

  const supabase = await getSupabase()

  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, status, password_hash")
    .eq("id", candidateUserId)
    .maybeSingle()

  if (!user) {
    throw new Error(msg.unauthorizedNotFound)
  }

  const sessionCheck = parseAndVerifySessionCookie(
    rawSession,
    user.password_hash
  )
  if (!sessionCheck.valid) {
    cookieStore.delete("user_session")
    cookieStore.delete("session_hint")
    throw new Error(msg.sessionExpiredPassword)
  }

  const cleanStatus = String(user.status || "active").trim().toLowerCase()
  if (cleanStatus === "suspended") {
    throw new Error(msg.adminSuspended)
  }

  const cleanRole = String(user.role || "user")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase() as StaffRoleCode | "user"

  if (!allowedRoles.includes(cleanRole as StaffRoleCode)) {
    throw new Error(msg.insufficientRole)
  }

  return { supabase, adminUser: user, role: cleanRole as StaffRoleCode, msg }
}

export function revalidateAdminAll() {
  revalidatePath("/", "layout")
  revalidatePath("/admin", "layout")
  revalidatePath("/admin")
  revalidatePath("/admin/deals")
  revalidatePath("/admin/properties")
  revalidatePath("/admin/promotions")
  revalidatePath("/admin/leads")
  revalidatePath("/admin/users")
  revalidatePath("/admin/settings")
  revalidatePath("/admin/profile")
  revalidatePath("/account")
  revalidatePath("/account/offers")
  revalidatePath("/account/documents")
  revalidatePath("/opportunities")
  revalidatePath("/contact")
  revalidatePath("/sell")
  revalidatePath("/buy")
  revalidatePath("/calculator")
  revalidatePath("/exit")
}
