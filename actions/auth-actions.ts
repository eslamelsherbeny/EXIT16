"use server"

import { cookies } from "next/headers"
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { revalidatePath } from "next/cache"
import {
  extractUserIdFromCookie,
  parseAndVerifySessionCookie,
} from "@/lib/session-security"
import { upsertUserVerificationMeta } from "@/lib/form-action-helpers"
import {
  DEFAULT_SITE_URL,
  formatPrimaryPhone,
  getAuthActionsDict,
  getPhoneVariants,
  getSupabase,
  hashPassword,
  normalizeEmail,
  sanitizeText,
  sendSystemEmail,
  setUserSessionCookie,
  signOtpToken,
  verifyPassword,
  verifySignedOtpToken,
  verifyTurnstileOnServer,
} from "@/lib/admin-auth-helpers"

const OTP_MAX_ATTEMPTS = 5
const otpFailedAttemptsMap = new Map<
  string,
  { count: number; resetAt: number }
>()

function generateSecureOTP(): string {
  return String(randomInt(100000, 1000000))
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8")
  const bufB = Buffer.from(b, "utf8")
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function isSuspendedStatus(status?: string | null): boolean {
  return String(status || "active").trim().toLowerCase() === "suspended"
}

function isOtpLockedOut(key: string): boolean {
  const rec = otpFailedAttemptsMap.get(key)
  if (!rec) return false
  if (Date.now() > rec.resetAt) {
    otpFailedAttemptsMap.delete(key)
    return false
  }
  return rec.count >= OTP_MAX_ATTEMPTS
}

function recordOtpFailure(key: string): number {
  const now = Date.now()
  const rec = otpFailedAttemptsMap.get(key)
  if (!rec || now > rec.resetAt) {
    otpFailedAttemptsMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return 1
  }
  rec.count += 1
  return rec.count
}

function clearOtpFailures(key: string) {
  otpFailedAttemptsMap.delete(key)
}

async function getVerifiedAuthSessionUser(supabase: any) {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get("user_session")?.value
  const sessionUserId = extractUserIdFromCookie(rawSession)

  if (!rawSession || !sessionUserId) return null

  const { data: user } = await supabase
    .from("users")
    .select(
      "id, name, email, phone, role, status, password_hash, is_verified, phone_verified, otp_code, otp_expiry"
    )
    .eq("id", sessionUserId)
    .maybeSingle()

  if (!user || isSuspendedStatus(user.status)) return null

  const check = parseAndVerifySessionCookie(rawSession, user.password_hash)
  if (!check.valid) return null

  return user
}

export type AuthResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthActionsDict()
  const turnstileToken = formData.get("cf_turnstile_response") as string | null
  const isHuman = await verifyTurnstileOnServer(turnstileToken)
  if (!isHuman) {
    return {
      success: false,
      error: msg.turnstile,
    }
  }

  const rawInput = sanitizeText(
    formData.get("emailOrPhone") || formData.get("email"),
    160
  )
  const password = String(formData.get("password") || "").slice(0, 128)
  const nextUrl = sanitizeText(formData.get("nextUrl"), 120)

  if (!rawInput || !password) {
    return {
      success: false,
      error: msg.missingLogin,
    }
  }

  const supabase = await getSupabase()
  let candidates: any[] = []

  if (rawInput.includes("@")) {
    const cleanEmail = normalizeEmail(rawInput)
    const { data } = await supabase
      .from("users")
      .select("id, name, email, phone, password_hash, status, role")
      .ilike("email", cleanEmail)
      .order("created_at", { ascending: false })
    candidates = data || []
  } else {
    const phoneVariants = getPhoneVariants(rawInput)
    const { data } = await supabase
      .from("users")
      .select("id, name, email, phone, password_hash, status, role")
      .in("phone", phoneVariants)
      .order("created_at", { ascending: false })
    candidates = data || []

    if (candidates.length === 0) {
      const pureDigits = rawInput.replace(/\D/g, "")
      if (pureDigits.length >= 8) {
        const tail = pureDigits.slice(-8)
        const { data: tailData } = await supabase
          .from("users")
          .select("id, name, email, phone, password_hash, status, role")
          .ilike("phone", `%${tail}`)
          .limit(5)
        candidates = tailData || []
      }
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      error: msg.notRegistered,
    }
  }

  const matchedUser = candidates.find((u) =>
    verifyPassword(password, u.password_hash)
  )

  if (!matchedUser) {
    return {
      success: false,
      error: msg.wrongPassword,
    }
  }

  if (isSuspendedStatus(matchedUser.status)) {
    return {
      success: false,
      error: msg.suspended,
    }
  }

  const cleanRole = String(matchedUser.role || "user")
    .replace(/[\r\n\s]+/g, "")
    .toLowerCase()
  const isStaff =
    cleanRole === "owner" ||
    cleanRole === "admin" ||
    cleanRole === "moderator" ||
    cleanRole === "sales"

  if (nextUrl.startsWith("/admin") && !isStaff) {
    return {
      success: false,
      error: msg.noAdminAccess,
    }
  }

  await setUserSessionCookie(matchedUser.id, matchedUser.password_hash)

  if (matchedUser.email) {
    sendSystemEmail({
      to: matchedUser.email.trim(),
      senderName: msg.emailSenderName,
      subject: msg.loginEmailSubject,
      html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #101A2B;">${msg.loginEmailGreeting} ${matchedUser.name || msg.dearUser} 👋</h2>
              <p>${msg.loginEmailBody}</p>
             </div>`,
    }).catch(() => {})
  }

  const isSafeInternalUrl =
    Boolean(nextUrl) &&
    nextUrl.startsWith("/") &&
    !nextUrl.startsWith("//") &&
    !nextUrl.startsWith("/\\")
  const targetRedirect = isSafeInternalUrl ? nextUrl : "/account"

  revalidatePath("/", "layout")
  revalidatePath("/account", "layout")
  revalidatePath("/admin", "layout")

  return {
    success: true,
    redirectTo: targetRedirect,
  }
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthActionsDict()
  const turnstileToken = formData.get("cf_turnstile_response") as string | null
  const isHuman = await verifyTurnstileOnServer(turnstileToken)
  if (!isHuman) {
    return {
      success: false,
      error: msg.turnstile,
    }
  }

  const name = sanitizeText(
    formData.get("name") || formData.get("full-name"),
    120
  )
  const email = normalizeEmail(String(formData.get("email") || ""))
  const rawPhone = sanitizeText(formData.get("phone"), 30)
  const password = String(formData.get("password") || "").slice(0, 128)
  const country = sanitizeText(formData.get("country") || "GE", 5).toUpperCase()

  const formattedPhone = formatPrimaryPhone(rawPhone)
  const phoneVariants = getPhoneVariants(rawPhone)
  const phoneDigitsLen = formattedPhone.replace(/\D/g, "").length

  if (
    !name ||
    name.length < 2 ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !formattedPhone ||
    phoneDigitsLen < 7 ||
    !password ||
    password.length < 8
  ) {
    return {
      success: false,
      error: msg.fillAllRegister,
    }
  }

  const supabase = await getSupabase()

  const [{ data: existingEmails }, { data: existingPhones }] =
    await Promise.all([
      supabase.from("users").select("id").ilike("email", email).limit(1),
      supabase.from("users").select("id").in("phone", phoneVariants).limit(1),
    ])

  if ((existingEmails?.length || 0) > 0) {
    return {
      success: false,
      error: msg.emailExists,
    }
  }
  if ((existingPhones?.length || 0) > 0) {
    return {
      success: false,
      error: msg.phoneExists,
    }
  }

  const hash = hashPassword(password)
  const verifyToken = randomBytes(24).toString("hex")
  const verifyExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      name,
      email,
      phone: formattedPhone,
      password_hash: hash,
      country,
      role: "user",
      status: "active",
    })
    .select("id")
    .single()

  if (error || !newUser) {
    return {
      success: false,
      error: msg.registerFailed,
    }
  }

  try {
    await supabase
      .from("users")
      .update({
        otp_code: verifyToken,
        otp_expiry: verifyExpiry,
        is_verified: false,
        status: "active",
        country,
      })
      .eq("id", newUser.id)
  } catch {}

  await setUserSessionCookie(newUser.id, hash)

  const verifyLink = `${DEFAULT_SITE_URL}/login?verified=1&email=${encodeURIComponent(email)}&token=${verifyToken}`

  sendSystemEmail({
    to: email,
    senderName: msg.emailSenderName,
    subject: msg.welcomeEmailSubject,
    html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.7; color: #0a1122;">
            <h2 style="color: #101A2B;">${msg.welcomeEmailGreeting} ${name} 🏠</h2>
            <p>${msg.welcomeEmailBody}</p>
            <div style="margin: 22px 0;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #007a5a; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                ${msg.welcomeEmailBtn}
              </a>
            </div>
           </div>`,
  }).catch(() => {})

  revalidatePath("/", "layout")
  revalidatePath("/account", "layout")
  return {
    success: true,
    redirectTo: "/account",
  }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<AuthResult> {
  const { t: msg, dir } = await getAuthActionsDict()
  const turnstileToken = formData.get("cf_turnstile_response") as string | null
  if (turnstileToken !== null) {
    const isHuman = await verifyTurnstileOnServer(turnstileToken)
    if (!isHuman) {
      return { success: false, error: msg.turnstile }
    }
  }

  const email = normalizeEmail(String(formData.get("email") || ""))

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: msg.enterEmail }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, status, otp_code, otp_expiry")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return { success: false, error: msg.emailNotFound }
  }

  if (isSuspendedStatus(user.status)) {
    return { success: false, error: msg.suspended }
  }

  // حماية من إغراق البريد (Cooldown لمدة 60 ثانية بين كل كود والآخر)
  if (user.otp_expiry) {
    const remainingMs = new Date(user.otp_expiry).getTime() - Date.now()
    if (remainingMs > 14 * 60 * 1000 && remainingMs <= 15 * 60 * 1000) {
      return { success: true }
    }
  }

  const otp = generateSecureOTP()
  const expiresAt = Date.now() + 15 * 60 * 1000
  const expiryIso = new Date(expiresAt).toISOString()

  clearOtpFailures(`reset:${email}`)

  const cookieStore = await cookies()
  const signedToken = signOtpToken(email, otp, expiresAt)
  const isProd = process.env.NODE_ENV === "production"

  cookieStore.set("reset_otp_session", signedToken, {
    path: "/",
    maxAge: 15 * 60,
    sameSite: "lax",
    secure: isProd,
    httpOnly: true,
  })

  try {
    const hadPhoneOk = String(user.otp_code || "").includes("PHONE_OK")
    await supabase
      .from("users")
      .update({
        otp_code: hadPhoneOk ? `PHONE_OK|${otp}` : otp,
        otp_expiry: expiryIso,
      })
      .eq("id", user.id)
  } catch {}

  const emailSent = await sendSystemEmail({
    to: user.email || email,
    senderName: msg.emailSenderName,
    subject: `${otp} — ${msg.otpEmailSubject}`,
    html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #101A2B;">${msg.otpEmailGreeting} ${user.name || msg.dearUser}</h2>
            <p>${msg.otpEmailBody}</p>
            <div style="background: #f4f6f8; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <h1 style="color: #105C50; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
            </div>
           </div>`,
  })

  if (!emailSent) {
    return { success: false, error: msg.emailSendFailed }
  }

  return { success: true }
}

export async function verifyOtpAction(
  email: string,
  otp: string
): Promise<AuthResult> {
  const { t: msg } = await getAuthActionsDict()
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = sanitizeText(otp, 10).replace(/\D/g, "")

  if (!cleanEmail || cleanOtp.length !== 6) {
    return { success: false, error: msg.enterValidOtp }
  }

  const attemptKey = `reset:${cleanEmail}`
  if (isOtpLockedOut(attemptKey)) {
    return { success: false, error: msg.otpExpired }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from("users")
    .select("id, status, otp_code, otp_expiry")
    .ilike("email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user) {
    return {
      success: false,
      error: msg.emailNotFound,
    }
  }

  if (isSuspendedStatus(user.status)) {
    return { success: false, error: msg.suspended }
  }

  const cookieStore = await cookies()
  const otpCookie = cookieStore.get("reset_otp_session")?.value
  const cookieCheck = verifySignedOtpToken(cleanEmail, cleanOtp, otpCookie)

  if (cookieCheck.expired) {
    return {
      success: false,
      error: msg.otpExpired,
    }
  }

  if (cookieCheck.valid) {
    clearOtpFailures(attemptKey)
    return { success: true }
  }

  const storedOtpClean = String(user.otp_code || "")
    .replace("PHONE_OK|", "")
    .trim()

  if (
    storedOtpClean.length === 6 &&
    safeEqualString(storedOtpClean, cleanOtp)
  ) {
    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
      return {
        success: false,
        error: msg.otpExpired,
      }
    }
    clearOtpFailures(attemptKey)
    return { success: true }
  }

  const fails = recordOtpFailure(attemptKey)
  if (fails >= OTP_MAX_ATTEMPTS) {
    const hadPhoneOk = String(user.otp_code || "").includes("PHONE_OK")
    try {
      await supabase
        .from("users")
        .update({
          otp_code: hadPhoneOk ? "PHONE_OK" : null,
          otp_expiry: null,
        })
        .eq("id", user.id)
    } catch {}
    cookieStore.delete("reset_otp_session")
    return { success: false, error: msg.otpExpired }
  }

  return { success: false, error: msg.invalidOtp }
}

export async function resetPasswordAction(
  email: string,
  otp: string,
  newPassword: string
): Promise<AuthResult> {
  const { t: msg } = await getAuthActionsDict()
  const cleanEmail = normalizeEmail(email)
  const cleanOtp = sanitizeText(otp, 10).replace(/\D/g, "")
  const cleanPass = String(newPassword || "").slice(0, 128)

  if (!cleanPass || cleanPass.length < 8) {
    return {
      success: false,
      error: msg.shortPassword,
    }
  }

  const otpVerification = await verifyOtpAction(cleanEmail, cleanOtp)
  if (!otpVerification.success) return otpVerification

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from("users")
    .select("id, status, otp_code")
    .ilike("email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(1)

  const targetUser = users?.[0]
  if (!targetUser || isSuspendedStatus(targetUser.status)) {
    return {
      success: false,
      error: msg.updatePassFailed,
    }
  }

  const newHash = hashPassword(cleanPass)
  const hadPhoneOk = String(targetUser.otp_code || "").includes("PHONE_OK")

  const { error } = await supabase
    .from("users")
    .update({
      password_hash: newHash,
      otp_code: hadPhoneOk ? "PHONE_OK" : null,
      otp_expiry: null,
      is_verified: true,
    })
    .eq("id", targetUser.id)

  if (error) {
    return {
      success: false,
      error: msg.updatePassFailed,
    }
  }

  try {
    await upsertUserVerificationMeta(supabase, targetUser.id, {
      emailVerified: true,
    })
  } catch {}

  clearOtpFailures(`reset:${cleanEmail}`)

  const cookieStore = await cookies()
  cookieStore.delete("reset_otp_session")
  cookieStore.delete("user_session")
  cookieStore.delete("session_hint")

  return { success: true }
}

export async function verifyAccountAction(
  email: string,
  token?: string
): Promise<AuthResult> {
  const { t: msg } = await getAuthActionsDict()
  const cleanEmail = normalizeEmail(email)
  const cleanToken = sanitizeText(token, 100)
  if (!cleanEmail || !cleanToken || cleanToken.length < 6) {
    return { success: false, error: msg.invalidLink }
  }

  const supabase = await getSupabase()
  const { data: users } = await supabase
    .from("users")
    .select("id, status, otp_code, otp_expiry, is_verified")
    .ilike("email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(1)

  const user = users?.[0]
  if (!user || isSuspendedStatus(user.status)) {
    return { success: false, error: msg.accountNotFound }
  }

  if (user.is_verified) {
    return { success: true }
  }

  const rawStored = String(user.otp_code || "")
    .replace("PHONE_OK|", "")
    .trim()

  if (!rawStored || !safeEqualString(rawStored, cleanToken)) {
    return { success: false, error: msg.invalidLink }
  }

  if (user.otp_expiry && new Date(user.otp_expiry) < new Date()) {
    return { success: false, error: msg.otpExpired }
  }

  const hadPhoneOk = String(user.otp_code || "").includes("PHONE_OK")
  await supabase
    .from("users")
    .update({
      is_verified: true,
      otp_code: hadPhoneOk ? "PHONE_OK" : null,
      otp_expiry: null,
      status: "active",
    })
    .eq("id", user.id)

  await upsertUserVerificationMeta(supabase, user.id, {
    emailVerified: true,
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/properties")
  revalidatePath("/admin/leads")
  revalidatePath("/account")
  return { success: true }
}

export async function sendInlineEmailOtpAction(
  _targetEmail?: string
): Promise<{
  success: boolean
  maskedEmail?: string
  error?: string
}> {
  const { t: msg, dir } = await getAuthActionsDict()
  try {
    const supabase = await getSupabase()
    // إغلاق ثغرة الاستيلاء على الحسابات: إلزام وجود جلسة موقّعة وإرسال الكود لإيميل صاحب الجلسة فقط
    const user = await getVerifiedAuthSessionUser(supabase)

    if (!user) {
      return {
        success: false,
        error: msg.accountNotFound,
      }
    }

    const emailToUse = normalizeEmail(user.email || "")
    if (!emailToUse) {
      return {
        success: false,
        error: msg.emailNotFound,
      }
    }

    // حماية من تكرار الإرسال السريع (Cooldown لمدة 60 ثانية)
    if (user.otp_expiry) {
      const remainingMs = new Date(user.otp_expiry).getTime() - Date.now()
      if (remainingMs > 14 * 60 * 1000 && remainingMs <= 15 * 60 * 1000) {
        return { success: true }
      }
    }

    const otp = generateSecureOTP()
    const expiresAt = Date.now() + 15 * 60 * 1000
    const expiryIso = new Date(expiresAt).toISOString()

    clearOtpFailures(`inline:${user.id}`)

    const cookieStore = await cookies()
    const signedToken = signOtpToken(emailToUse, otp, expiresAt)
    const isProd = process.env.NODE_ENV === "production"

    cookieStore.set("reset_otp_session", signedToken, {
      path: "/",
      maxAge: 15 * 60,
      sameSite: "lax",
      secure: isProd,
      httpOnly: true,
    })

    const hadPhoneOk = String(user.otp_code || "").includes("PHONE_OK")
    try {
      await supabase
        .from("users")
        .update({
          otp_code: hadPhoneOk ? `PHONE_OK|${otp}` : otp,
          otp_expiry: expiryIso,
        })
        .eq("id", user.id)
    } catch {}

    const verifyLink = `${DEFAULT_SITE_URL}/login?verified=1&email=${encodeURIComponent(emailToUse)}&token=${otp}`
    const subject = `${otp} — ${msg.otpEmailSubject}`

    const html = `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.8; color: #0a1122; max-width: 540px; margin: 0 auto;">
      <h2 style="color: #0a1122;">${msg.otpEmailGreeting} ${user.name || ""} 👋</h2>
      <p>${msg.otpEmailBody}</p>
      <div style="background: #eaf8f2; border: 2px solid #007a5a; padding: 16px; border-radius: 14px; text-align: center; margin: 20px 0;">
        <h1 style="color: #007a5a; letter-spacing: 8px; margin: 0; font-size: 32px; font-family: monospace;">${otp}</h1>
      </div>
      <p style="font-size: 13px; color: #475569;">${msg.inlineOneClickHint || msg.welcomeEmailBody}</p>
      <p style="margin: 16px 0;">
        <a href="${verifyLink}" style="display: inline-block; background: #0a1122; color: #ffffff; padding: 10px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 13px;">
          ${msg.welcomeEmailBtn}
        </a>
      </p>
    </div>`

    const sent = await sendSystemEmail({
      to: emailToUse,
      senderName: msg.emailSenderName,
      subject,
      html,
    })

    if (!sent) {
      return {
        success: false,
        error: msg.emailSendFailed,
      }
    }

    return {
      success: true,
    }
  } catch {
    return {
      success: false,
      error: msg.emailSendFailed,
    }
  }
}

export async function verifyInlineEmailOtpAction(
  otp: string,
  _targetEmail?: string
): Promise<{
  success: boolean
  error?: string
}> {
  const { t: msg } = await getAuthActionsDict()
  try {
    const cleanOtp = sanitizeText(otp, 10).replace(/\D/g, "")
    if (cleanOtp.length !== 6) {
      return {
        success: false,
        error: msg.enterValidOtp,
      }
    }

    const supabase = await getSupabase()
    // إلزام وجود جلسة موقّعة وتوثيق صاحب الجلسة فقط
    const user = await getVerifiedAuthSessionUser(supabase)

    if (!user) {
      return {
        success: false,
        error: msg.accountNotFound,
      }
    }

    const attemptKey = `inline:${user.id}`
    if (isOtpLockedOut(attemptKey)) {
      return { success: false, error: msg.otpExpired }
    }

    const emailToUse = normalizeEmail(user.email || "")
    const cookieStore = await cookies()
    const otpCookie = cookieStore.get("reset_otp_session")?.value
    const cookieCheck = verifySignedOtpToken(emailToUse, cleanOtp, otpCookie)

    let isValid = cookieCheck.valid

    if (!isValid) {
      const storedOtpClean = String(user.otp_code || "")
        .replace("PHONE_OK|", "")
        .trim()
      if (
        storedOtpClean.length === 6 &&
        safeEqualString(storedOtpClean, cleanOtp) &&
        user.otp_expiry &&
        new Date(user.otp_expiry) >= new Date()
      ) {
        isValid = true
      }
    }

    if (!isValid) {
      const fails = recordOtpFailure(attemptKey)
      if (fails >= OTP_MAX_ATTEMPTS) {
        const hadPhoneOk = String(user.otp_code || "").includes("PHONE_OK")
        await supabase
          .from("users")
          .update({
            otp_code: hadPhoneOk ? "PHONE_OK" : null,
            otp_expiry: null,
          })
          .eq("id", user.id)
        cookieStore.delete("reset_otp_session")
        return { success: false, error: msg.otpExpired }
      }
      return {
        success: false,
        error: msg.invalidOtp,
      }
    }

    clearOtpFailures(attemptKey)

    const hadPhoneOk =
      Boolean(user.phone_verified) ||
      String(user.otp_code || "").includes("PHONE_OK")

    await supabase
      .from("users")
      .update({
        is_verified: true,
        otp_code: hadPhoneOk ? "PHONE_OK" : null,
        otp_expiry: null,
      })
      .eq("id", user.id)

    await upsertUserVerificationMeta(supabase, user.id, {
      emailVerified: true,
    })
    cookieStore.delete("reset_otp_session")

    revalidatePath("/sell")
    revalidatePath("/account")
    revalidatePath("/admin/properties")
    revalidatePath("/admin/leads")
    revalidatePath("/admin/users")

    return { success: true }
  } catch {
    return {
      success: false,
      error: msg.invalidOtp,
    }
  }
}

export async function markUserPhoneVerifiedAction(payload?: {
  userId?: string
  unitId?: string
  leadId?: string
}): Promise<{ success: boolean }> {
  try {
    const supabase = await getSupabase()
    const caller = await getVerifiedAuthSessionUser(supabase)

    if (!caller) return { success: false }

    const callerRole = String(caller.role || "user")
      .trim()
      .toLowerCase()
    const isStaff =
      callerRole === "owner" ||
      callerRole === "admin" ||
      callerRole === "moderator" ||
      callerRole === "sales"

    if (!isStaff) {
      return { success: false }
    }

    let targetUserId = payload?.userId || ""

    if (!targetUserId && payload?.unitId) {
      const { data: unit } = await supabase
        .from("sell_requests")
        .select("user_id")
        .eq("id", payload.unitId)
        .maybeSingle()
      if (unit?.user_id) targetUserId = String(unit.user_id)
    }

    if (!targetUserId && payload?.leadId) {
      const { data: lead } = await supabase
        .from("buy_requests")
        .select("user_id")
        .eq("id", payload.leadId)
        .maybeSingle()
      if (lead?.user_id) targetUserId = String(lead.user_id)
    }

    if (!targetUserId) return { success: false }

    const { data: user } = await supabase
      .from("users")
      .select("id, otp_code")
      .eq("id", targetUserId)
      .maybeSingle()

    if (user) {
      const currentOtp = String(user.otp_code || "").trim()
      const nextOtpCode = currentOtp
        ? currentOtp.includes("PHONE_OK")
          ? currentOtp
          : `PHONE_OK|${currentOtp}`
        : "PHONE_OK"

      const { error: err1 } = await supabase
        .from("users")
        .update({
          phone_verified: true,
          otp_code: nextOtpCode,
        })
        .eq("id", user.id)

      if (err1) {
        await supabase
          .from("users")
          .update({ otp_code: nextOtpCode })
          .eq("id", user.id)
      }
    }

    await upsertUserVerificationMeta(supabase, targetUserId, {
      phoneVerified: true,
    })

    revalidatePath("/sell")
    revalidatePath("/buy")
    revalidatePath("/account")
    revalidatePath("/admin/properties")
    revalidatePath("/admin/leads")
    revalidatePath("/admin/users")

    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getUserVerificationStatusAction(): Promise<{
  isLoggedIn: boolean
  userId: string
  email: string
  phone: string
  emailVerified: boolean
  phoneVerified: boolean
}> {
  try {
    const supabase = await getSupabase()
    const user = await getVerifiedAuthSessionUser(supabase)

    if (!user) {
      return {
        isLoggedIn: false,
        userId: "",
        email: "",
        phone: "",
        emailVerified: false,
        phoneVerified: false,
      }
    }

    let emailVerified = Boolean(user.is_verified)
    let phoneVerified =
      Boolean(user.phone_verified) ||
      String(user.otp_code || "").includes("PHONE_OK")

    const { data: metaNotif } = await supabase
      .from("notifications")
      .select("message")
      .eq("user_id", user.id)
      .eq("title", "__USER_VERIFICATION_META__")
      .maybeSingle()

    if (metaNotif?.message) {
      try {
        const parsed = JSON.parse(metaNotif.message)
        if (parsed.emailVerified) emailVerified = true
        if (parsed.phoneVerified) phoneVerified = true
      } catch {}
    }

    return {
      isLoggedIn: true,
      userId: user.id,
      email: user.email || "",
      phone: user.phone || "",
      emailVerified,
      phoneVerified,
    }
  } catch {
    return {
      isLoggedIn: false,
      userId: "",
      email: "",
      phone: "",
      emailVerified: false,
      phoneVerified: false,
    }
  }
}

export async function getSessionUserAction() {
  try {
    const cookieStore = await cookies()
    const rawSession = cookieStore.get("user_session")?.value
    const candidateUserId = extractUserIdFromCookie(rawSession)

    if (!rawSession || !candidateUserId) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const supabase = await getSupabase()
    const { data: user } = await supabase
      .from("users")
      .select("id, name, role, status, password_hash")
      .eq("id", candidateUserId)
      .maybeSingle()

    if (!user) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const check = parseAndVerifySessionCookie(rawSession, user.password_hash)

    if (!check.valid || isSuspendedStatus(user.status)) {
      return { isLoggedIn: false, isAdmin: false, name: null, role: null }
    }

    const role = String(user.role || "user")
      .replace(/[\r\n\s]+/g, "")
      .toLowerCase()
    const isAdmin =
      role === "owner" ||
      role === "admin" ||
      role === "moderator" ||
      role === "sales"

    return {
      isLoggedIn: true,
      isAdmin,
      name: user.name || null,
      role,
      userId: user.id,
    }
  } catch {
    return { isLoggedIn: false, isAdmin: false, name: null, role: null }
  }
}