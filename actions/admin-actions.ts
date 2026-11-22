"use server"

import { cookies } from "next/headers"
import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { createSignedSessionToken } from "@/lib/session-security"
import {
  getServerI18n,
  type GlobalSiteSettings,
} from "@/lib/get-server-dictionary"
import { upsertUserVerificationMeta } from "@/lib/form-action-helpers"
import {
  DEFAULT_SITE_URL,
  formatPrimaryPhone,
  getAdminActionsDict,
  hashPassword,
  requireAdminAuth,
  resolveOwnerUserIds,
  revalidateAdminAll,
  sanitizeText,
  sendSystemEmail,
  verifyPassword,
  type StaffRoleCode,
} from "@/lib/admin-auth-helpers"
import {
  purgeBuyerOtherOffersOnSale,
  unfreezeBuyerPausedOffers,
} from "@/lib/offer-lifecycle-helpers"
import {
  getUnifiedUnitCode,
  getUnitImagesCount,
  getUnitMetaObject,
  getUnitUploadedDocsCount,
  isUnitDocsSatisfied,
  type UnitDocKey,
} from "@/lib/unit-display-helpers"

export type { StaffRoleCode }

const ALLOWED_USER_ROLES = new Set([
  "owner",
  "admin",
  "moderator",
  "sales",
  "user",
])
const ALLOWED_USER_STATUSES = new Set([
  "active",
  "suspended",
  "deletion_pending",
])
const ALLOWED_MANUAL_LEAD_STATUSES = new Set([
  "new",
  "contacted",
  "matched",
  "archived",
])

const REOPENED_PROMPT_TAG = "__REOPENED_PROMPT__"
const PENDING_ADMIN_TAG = "__PENDING_ADMIN_VERIFICATION__"

function resolveRawOfferStatus(offer: any): string {
  const diffs = Array.isArray(offer?.diff_reasons) ? offer.diff_reasons : []
  if (
    offer?.status === "pending_admin" ||
    (offer?.status === "recommended" &&
      (offer?.initiated_by === "buyer" || diffs.includes(PENDING_ADMIN_TAG)))
  ) {
    return "pending_admin"
  }
  return String(offer?.status || "")
}

export async function getPublicSiteRuntimeConfigAction(): Promise<{
  siteSettings: GlobalSiteSettings
  isStaff: boolean
}> {
  const { siteSettings, isStaff } = await getServerI18n()
  return { siteSettings, isStaff }
}

export async function logoutAdminAction() {
  const cookieStore = await cookies()
  cookieStore.delete("user_session")
  cookieStore.delete("session_hint")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function verifyUserContactByAdminAction(payload: {
  userId: string
  type: "email" | "phone" | "both"
}) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])
    if (!payload.userId) {
      return { success: false, error: msg.unauthorizedAction }
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, otp_code, is_verified")
      .eq("id", payload.userId)
      .maybeSingle()

    if (!user) {
      return { success: false, error: msg.unauthorizedNotFound }
    }

    const updates: Record<string, any> = {}
    const metaUpdates: { emailVerified?: boolean; phoneVerified?: boolean } = {}

    if (payload.type === "email" || payload.type === "both") {
      updates.is_verified = true
      metaUpdates.emailVerified = true
    }

    if (payload.type === "phone" || payload.type === "both") {
      const currentOtp = String(user.otp_code || "").trim()
      updates.otp_code = currentOtp.includes("PHONE_OK")
        ? currentOtp
        : currentOtp
          ? `PHONE_OK|${currentOtp}`
          : "PHONE_OK"
      updates.phone_verified = true
      metaUpdates.phoneVerified = true
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", payload.userId)

    if (error && updates.phone_verified !== undefined) {
      delete updates.phone_verified
      await supabase.from("users").update(updates).eq("id", payload.userId)
    }

    await upsertUserVerificationMeta(supabase, payload.userId, metaUpdates)

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updatePropertyStatusAction(
  propertyId: string,
  status: string,
  reason?: string,
  options?: { allowWhatsAppDocsVerify?: boolean }
) {
  const [{ t: msg, dir }, { dict }] = await Promise.all([
    getAdminActionsDict(),
    getServerI18n(),
  ])
  const oDict = ((dict as Record<string, any>)?.accountPages?.offers ||
    {}) as Record<string, string>

  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])
    const cleanReason =
      reason !== undefined ? sanitizeText(reason, 600) : undefined

    const { data: prop } = await supabase
      .from("sell_requests")
      .select(
        "id, code, user_id, status, project_name, area, unit_type, paid_amount, contract_price, name, email, documents, images"
      )
      .eq("id", propertyId)
      .maybeSingle()

    if (!prop) {
      return { success: false, error: msg.updatePropertyFailed }
    }

    const cleanStatus = sanitizeText(status, 40).toLowerCase()
    const currentUnitStatus = String(prop?.status || "").trim().toLowerCase()
    const unitCode = getUnifiedUnitCode(prop.id, prop.code)

    if (currentUnitStatus === "sold" && cleanStatus !== "sold") {
      return {
        success: false,
        error: msg.unitSoldLocked,
      }
    }

    if (
      [
        "pending",
        "under_review",
        "rejected",
        "paused_by_seller",
        "paused_by_admin",
        "deleted_by_seller",
      ].includes(cleanStatus)
    ) {
      const { data: activeDeal } = await supabase
        .from("property_offers")
        .select("id")
        .eq("property_id", propertyId)
        .eq("status", "accepted")
        .limit(1)
        .maybeSingle()

      if (activeDeal) {
        return {
          success: false,
          error: msg.unitHasActiveDealBlocked,
        }
      }
    }

    const currentDocsObj =
      prop.documents && typeof prop.documents === "object"
        ? { ...prop.documents }
        : {}

    if (cleanStatus === "active") {
      const docsSatisfied = isUnitDocsSatisfied(prop)
      if (!docsSatisfied && !options?.allowWhatsAppDocsVerify) {
        return {
          success: false,
          code: "DOCS_INCOMPLETE",
          uploadedDocsCount: getUnitUploadedDocsCount(prop.documents),
          error: msg.docsIncompletePublishBlocked,
        }
      }
    }

    const updatePayload: Record<string, any> = {
      status: cleanStatus,
    }

    if (cleanStatus === "active") {
      updatePayload.docs_verified = true
      updatePayload.approved_at = new Date().toISOString()
      updatePayload.admin_note = null

      if (options?.allowWhatsAppDocsVerify) {
        currentDocsObj.__unit_meta = {
          ...getUnitMetaObject(currentDocsObj),
          whatsapp_docs_verified: true,
          whatsapp_docs_verified_at: new Date().toISOString(),
          whatsapp_docs_verified_by:
            adminUser.name || adminUser.email || "Admin",
          ready_for_admin_review: true,
        }
        updatePayload.documents = currentDocsObj
      }
    } else if (cleanStatus === "sold") {
      updatePayload.admin_note = null
    } else if (cleanReason !== undefined) {
      updatePayload.admin_note = cleanReason || null
    }

    const { error } = await supabase
      .from("sell_requests")
      .update(updatePayload)
      .eq("id", propertyId)

    if (error) {
      const fallbackPayload: Record<string, any> = { status: cleanStatus }
      if (cleanStatus === "active" || cleanStatus === "sold") {
        fallbackPayload.admin_note = null
      } else if (cleanReason !== undefined) {
        fallbackPayload.admin_note = cleanReason || null
      }
      const { error: fallbackError } = await supabase
        .from("sell_requests")
        .update(fallbackPayload)
        .eq("id", propertyId)

      if (fallbackError) {
        return {
          success: false,
          error: msg.updatePropertyFailed,
        }
      }
    }

    const projectLabel = prop?.project_name || msg.defaultProjectWord
    const resolvedArea =
      prop?.area || prop?.documents?.__unit_meta?.area || ""

    try {
      if (
        cleanStatus === "pending" ||
        cleanStatus === "under_review" ||
        cleanStatus === "rejected" ||
        cleanStatus === "paused_by_seller" ||
        cleanStatus === "paused_by_admin" ||
        cleanStatus === "deleted_by_seller"
      ) {
        await supabase
          .from("property_offers")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("property_id", propertyId)
          .neq("status", "recommended")
      } else if (cleanStatus === "active") {
        const { data: prevAccepted } = await supabase
          .from("property_offers")
          .select("id, buyer_user_id, lead_id")
          .eq("property_id", propertyId)
          .eq("status", "accepted")
          .limit(1)
          .maybeSingle()

        await supabase
          .from("property_offers")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("property_id", propertyId)
          .eq("status", "accepted")

        if (prevAccepted) {
          await unfreezeBuyerPausedOffers(supabase, prevAccepted)
        }

        const { data: waitlistOffers } = await supabase
          .from("property_offers")
          .select("id, buyer_user_id, diff_reasons")
          .eq("property_id", propertyId)
          .eq("status", "unit_locked")

        if (waitlistOffers && waitlistOffers.length > 0) {
          for (const wOffer of waitlistOffers) {
            const wDiffs = Array.isArray(wOffer.diff_reasons)
              ? wOffer.diff_reasons
              : []
            const nextDiffs = Array.from(
              new Set([...wDiffs, REOPENED_PROMPT_TAG])
            )
            await supabase
              .from("property_offers")
              .update({
                diff_reasons: nextDiffs,
                updated_at: new Date().toISOString(),
              })
              .eq("id", wOffer.id)

            if (wOffer.buyer_user_id) {
              try {
                await supabase.from("notifications").insert({
                  user_id: wOffer.buyer_user_id,
                  role: "client",
                  title: `🔥 ${oDict.reopenedUnitBuyerNotifTitle || msg.notifActiveTitle} (${projectLabel})`,
                  message: oDict.reopenedUnitBuyerNotifMsg || msg.notifActiveMsg,
                  type: "status_update",
                  link: "/account/offers?role=buyer",
                  is_read: false,
                })
              } catch {}
            }
          }
        }
      } else if (cleanStatus === "sold") {
        const { data: winningOffer } = await supabase
          .from("property_offers")
          .select("id, buyer_user_id, lead_id")
          .eq("property_id", propertyId)
          .eq("status", "accepted")
          .limit(1)
          .maybeSingle()

        if (winningOffer) {
          if (winningOffer.lead_id) {
            await supabase
              .from("buy_requests")
              .update({ status: "closed" })
              .eq("id", winningOffer.lead_id)
          } else if (winningOffer.buyer_user_id) {
            await supabase
              .from("buy_requests")
              .update({ status: "closed" })
              .eq("user_id", winningOffer.buyer_user_id)
              .neq("status", "closed")
          }
          await purgeBuyerOtherOffersOnSale(supabase, winningOffer)
        }

        await supabase
          .from("property_offers")
          .update({
            status: "unit_locked",
            updated_at: new Date().toISOString(),
          })
          .eq("property_id", propertyId)
          .in("status", ["pending_admin", "pending_seller", "counter_offered"])

        const { data: nonAcceptedBuyers } = await supabase
          .from("property_offers")
          .select("buyer_user_id")
          .eq("property_id", propertyId)
          .neq("status", "accepted")

        const buyerIds = Array.from(
          new Set(
            (nonAcceptedBuyers || [])
              .map((o: any) => o.buyer_user_id)
              .filter(Boolean)
          )
        ) as string[]

        if (buyerIds.length > 0) {
          try {
            await supabase.from("notifications").insert(
              buyerIds.map((bId) => ({
                user_id: bId,
                role: "client",
                title: `ℹ️ ${oDict.unitSoldToOtherNotifTitle || msg.notifSoldTitle} (${projectLabel})`,
                message: oDict.unitSoldToOtherNotifMsg || msg.notifSoldMsg,
                type: "status_update",
                link: "/account/offers?role=buyer",
                is_read: false,
              }))
            )
          } catch {}
        }
      }
    } catch {}

    if (prop?.user_id) {
      const sellerNotifMap: Record<
        string,
        { title: string; message: string; type: string }
      > = {
        active: {
          title: msg.notifActiveTitle,
          message: `${msg.notifActiveMsg} (${projectLabel} · ${unitCode})`,
          type: "status_update",
        },
        under_review: {
          title: `${msg.notifUnderReviewTitle} (${projectLabel})`,
          message: cleanReason
            ? `${msg.reasonWord}: ${cleanReason}`
            : `${msg.notifUnderReviewMsg} (${projectLabel} · ${unitCode})`,
          type: "status_update",
        },
        pending: {
          title: `${msg.notifPendingTitle} (${projectLabel})`,
          message: cleanReason
            ? `${msg.reasonWord}: ${cleanReason}`
            : `${msg.notifPendingMsg} (${projectLabel} · ${unitCode})`,
          type: "status_update",
        },
        paused_by_admin: {
          title: `${msg.notifPausedAdminTitle} (${projectLabel})`,
          message: cleanReason
            ? `${msg.reasonWord}: ${cleanReason}`
            : `${msg.notifPausedAdminMsg} (${projectLabel} · ${unitCode})`,
          type: "status_update",
        },
        offer_received: {
          title: msg.notifOfferTitle,
          message: `${msg.notifOfferMsg} (${projectLabel})`,
          type: "new_offer",
        },
        transferring: {
          title: msg.notifTransferTitle,
          message: `${msg.notifTransferMsg} (${projectLabel})`,
          type: "status_update",
        },
        sold: {
          title: msg.notifSoldTitle,
          message: `${msg.notifSoldMsg} (${projectLabel})`,
          type: "status_update",
        },
        rejected: {
          title: msg.notifRejectedTitle,
          message: cleanReason
            ? `${msg.notifRejectedReasonPrefix}: ${cleanReason}`
            : `${msg.notifRejectedMsg} (${projectLabel})`,
          type: "status_update",
        },
      }

      const sellerNotif = sellerNotifMap[cleanStatus]
      if (sellerNotif) {
        try {
          await supabase.from("notifications").insert({
            user_id: prop.user_id,
            role: "client",
            title: sellerNotif.title,
            message: sellerNotif.message,
            type: sellerNotif.type,
            link: `/account?view=seller&unitId=${prop.id}`,
            is_read: false,
          })
        } catch {}
      }
    }

    if (cleanStatus === "active" && prop) {
      try {
        const unitCash = Number(prop.paid_amount || 0)
        const unitArea = String(resolvedArea).trim()

        const { data: buyers } = await supabase
          .from("buy_requests")
          .select("user_id, available_cash, budget, preferred_areas, status")
          .not("user_id", "is", null)

        const matchedBuyerIds = new Set<string>()

        ;(buyers || []).forEach((b: any) => {
          const bStatus = String(b.status || "new").trim().toLowerCase()
          if (bStatus === "closed" || bStatus === "archived") return
          if (!b.user_id || b.user_id === prop.user_id) return
          const buyerMaxCash = Number(b.available_cash || b.budget || 0)
          const areas: string[] = Array.isArray(b.preferred_areas)
            ? b.preferred_areas
            : []

          const cashMatches =
            buyerMaxCash === 0 ||
            unitCash === 0 ||
            unitCash <= buyerMaxCash * 1.25
          const areaMatches =
            areas.length === 0 ||
            !unitArea ||
            areas.some((a) => unitArea.includes(a) || a.includes(unitArea))

          if (cashMatches && areaMatches) {
            matchedBuyerIds.add(b.user_id)
          }
        })

        if (matchedBuyerIds.size > 0) {
          const cashFormatted = unitCash.toLocaleString("en-US")
          const buyerNotifs = Array.from(matchedBuyerIds).map(
            (buyerUserId) => ({
              user_id: buyerUserId,
              role: "client",
              title: `${msg.matchBuyerTitle} ${unitArea} 🎯`,
              message: `(${projectLabel}) — $${cashFormatted}`,
              type: "property_match",
              link: `/opportunities/${prop.id}`,
              is_read: false,
            })
          )

          await supabase.from("notifications").insert(buyerNotifs)
        }
      } catch (e) {
        console.error("Smart Match Notification Error:", e)
      }
    }

    if (prop?.email) {
      const accountUrl = `${DEFAULT_SITE_URL}/account?view=seller&unitId=${prop.id}`
      const reasonBlock = cleanReason
        ? `<div style="margin: 14px 0; padding: 12px 16px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; color: #78350f;"><strong>${msg.reasonWord}:</strong> ${cleanReason}</div>`
        : ""

      const statusMessages: Record<string, { subject: string; body: string }> =
        {
          active: {
            subject: msg.emailActiveSubject,
            body: `${msg.emailActiveBody} <strong>${projectLabel} (${unitCode})</strong>.`,
          },
          under_review: {
            subject: `${msg.emailUnderReviewSubject} (${projectLabel})`,
            body: `${msg.emailUnderReviewBody} <strong>${projectLabel} (${unitCode})</strong>.${reasonBlock}`,
          },
          pending: {
            subject: `${msg.emailPendingSubject} (${projectLabel})`,
            body: `${msg.emailPendingBody} <strong>${projectLabel} (${unitCode})</strong>.${reasonBlock}`,
          },
          paused_by_admin: {
            subject: `${msg.emailPausedAdminSubject} (${projectLabel})`,
            body: `${msg.emailPausedAdminBody} <strong>${projectLabel} (${unitCode})</strong>.${reasonBlock}`,
          },
          offer_received: {
            subject: msg.emailOfferSubject,
            body: `${msg.emailOfferBody} <strong>${projectLabel} (${unitCode})</strong>.`,
          },
          transferring: {
            subject: msg.emailTransferSubject,
            body: `${msg.emailTransferBody} <strong>${projectLabel} (${unitCode})</strong>.`,
          },
          sold: {
            subject: msg.emailSoldSubject,
            body: `${msg.emailSoldBody} <strong>${projectLabel} (${unitCode})</strong>.`,
          },
          rejected: {
            subject: msg.emailRejectedSubject,
            body: `${msg.emailRejectedBody} <strong>${projectLabel} (${unitCode})</strong>.${reasonBlock}`,
          },
        }

      const emailObj = statusMessages[cleanStatus]
      if (emailObj) {
        await sendSystemEmail({
          to: prop.email,
          senderName: "DualDealz",
          subject: emailObj.subject,
          html: `<div dir="${dir}" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #ffffff; color: #0f1d40;">
                  <div style="background: #0f1d40; padding: 16px 22px; color: #ffffff; font-weight: bold; font-size: 16px;">DualDealz</div>
                  <div style="padding: 22px; line-height: 1.8; font-size: 14px;">
                    <h2 style="margin-top: 0; color: #0f1d40; font-size: 17px;">${msg.greetingWord} ${prop.name || msg.dearClient}</h2>
                    <p>${emailObj.body}</p>
                    <div style="margin-top: 20px; text-align: center;">
                      <a href="${accountUrl}" style="display: inline-block; background: #007a5a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 11px 24px; border-radius: 10px; font-size: 13px;">${msg.emailTrackUnitBtn}</a>
                    </div>
                  </div>
                 </div>`,
        })
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function verifyUnitDocsViaWhatsAppAction(payload: {
  propertyId: string
  verified?: boolean
  publishImmediately?: boolean
}) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const { data: prop } = await supabase
      .from("sell_requests")
      .select("id, code, user_id, project_name, status, documents, images")
      .eq("id", payload.propertyId)
      .maybeSingle()

    if (!prop) {
      return { success: false, error: msg.updatePropertyFailed }
    }

    const markVerified = payload.verified !== false
    const currentDocs =
      prop.documents && typeof prop.documents === "object"
        ? { ...prop.documents }
        : {}
    const currentMeta = getUnitMetaObject(currentDocs)

    currentDocs.__unit_meta = {
      ...currentMeta,
      whatsapp_docs_verified: markVerified,
      whatsapp_docs_verified_at: markVerified ? new Date().toISOString() : null,
      whatsapp_docs_verified_by: markVerified
        ? adminUser.name || adminUser.email || "Admin"
        : null,
      ready_for_admin_review:
        markVerified || getUnitUploadedDocsCount(currentDocs) >= 4,
    }

    const { error } = await supabase
      .from("sell_requests")
      .update({
        documents: currentDocs,
        docs_verified:
          markVerified || getUnitUploadedDocsCount(currentDocs) >= 4,
      })
      .eq("id", payload.propertyId)

    if (error) {
      const { error: fbErr } = await supabase
        .from("sell_requests")
        .update({ documents: currentDocs })
        .eq("id", payload.propertyId)
      if (fbErr) return { success: false, error: msg.updatePropertyFailed }
    }

    if (markVerified && payload.publishImmediately) {
      return updatePropertyStatusAction(
        payload.propertyId,
        "active",
        undefined,
        { allowWhatsAppDocsVerify: true }
      )
    }

    if (markVerified && prop.user_id) {
      try {
        await supabase.from("notifications").insert({
          user_id: prop.user_id,
          role: "client",
          title: `${msg.notifWaDocsVerifiedTitle} (${prop.project_name || msg.defaultProjectWord})`,
          message: `${msg.notifWaDocsVerifiedMsg} (${getUnifiedUnitCode(prop.id, prop.code)})`,
          type: "status_update",
          link: `/account?view=seller&unitId=${prop.id}`,
          is_read: false,
        })
      } catch {}
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function adminUploadUnitDocumentAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const propertyId = sanitizeText(formData.get("propertyId"), 120)
    const rawDocKey = sanitizeText(formData.get("docKey"), 40)
    const docKey: UnitDocKey =
      rawDocKey === "contract" ||
      rawDocKey === "receipts" ||
      rawDocKey === "statement" ||
      rawDocKey === "passport"
        ? rawDocKey
        : "contract"

    const directUrl = sanitizeText(formData.get("fileUrl") || "", 1000)
    const file = formData.get("file") as File | null

    if (!propertyId) {
      return { success: false, error: msg.updatePropertyFailed }
    }

    const { data: prop } = await supabase
      .from("sell_requests")
      .select("id, user_id, project_name, documents, images")
      .eq("id", propertyId)
      .maybeSingle()

    if (!prop) {
      return { success: false, error: msg.updatePropertyFailed }
    }

    let finalUrl = directUrl
    let finalFileName = sanitizeText(
      formData.get("fileName") || `${docKey}.pdf`,
      180
    )

    if (!finalUrl && file && file.size > 0) {
      if (file.size > 12 * 1024 * 1024) {
        return {
          success: false,
          error: msg.fileTooLargeError,
        }
      }

      finalFileName = file.name || finalFileName
      const ext = (file.name.split(".").pop() || "bin")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
      const storagePath = `admin-uploads/${propertyId}/${docKey}-${Date.now()}.${ext || "bin"}`
      const arrayBuffer = await file.arrayBuffer()
      const fileBytes = new Uint8Array(arrayBuffer)

      const candidateBuckets = new Set<string>()
      const existingUrls: string[] = []
      if (prop.documents && typeof prop.documents === "object") {
        Object.values(prop.documents).forEach((v: any) => {
          if (v && typeof v === "object" && typeof v.url === "string") {
            existingUrls.push(v.url)
          }
        })
      }
      if (Array.isArray(prop.images)) {
        prop.images.forEach((img: any) => {
          if (typeof img === "string") existingUrls.push(img)
        })
      }

      for (const u of existingUrls) {
        const m = u.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\//)
        if (m?.[1]) candidateBuckets.add(m[1])
      }
      ;[
        "documents",
        "property-documents",
        "unit-documents",
        "properties",
        "uploads",
        "property-images",
        "images",
      ].forEach((b) => candidateBuckets.add(b))

      let uploadSucceeded = false
      for (const bucket of candidateBuckets) {
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(storagePath, fileBytes, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          })

        if (!upErr) {
          const { data: pubData } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath)
          if (pubData?.publicUrl) {
            finalUrl = pubData.publicUrl
            uploadSucceeded = true
            break
          }
        }
      }

      if (!uploadSucceeded) {
        return {
          success: false,
          error: msg.storageUploadError,
        }
      }
    }

    if (!finalUrl) {
      return { success: false, error: msg.missingFileOrUrlError }
    }

    const currentDocs =
      prop.documents && typeof prop.documents === "object"
        ? { ...prop.documents }
        : {}

    currentDocs[docKey] = {
      url: finalUrl,
      name: finalFileName,
      uploaded_at: new Date().toLocaleDateString("en-GB"),
      uploaded_by: adminUser.name || "Admin",
      status: "verified",
    }
    if (docKey === "passport") delete currentDocs.national_id

    const docsReady =
      getUnitUploadedDocsCount(currentDocs) >= 4 ||
      Boolean(getUnitMetaObject(currentDocs).whatsapp_docs_verified)
    const hasPhotos = getUnitImagesCount(prop) > 0

    currentDocs.__unit_meta = {
      ...getUnitMetaObject(currentDocs),
      ready_for_admin_review: docsReady && hasPhotos,
    }

    const { error } = await supabase
      .from("sell_requests")
      .update({
        documents: currentDocs,
        docs_verified: docsReady,
      })
      .eq("id", propertyId)

    if (error) {
      await supabase
        .from("sell_requests")
        .update({ documents: currentDocs })
        .eq("id", propertyId)
    }

    revalidateAdminAll()
    return {
      success: true,
      url: finalUrl,
      documents: currentDocs,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function adminUpdatePropertyDataAction(payload: {
  propertyId: string
  project_name?: string
  developer_name?: string
  area?: string
  exact_street?: string
  house_number?: string
  cadastral_code?: string
  unit_type?: string
  size?: number | null
  rooms?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  floor_number?: number | null
  total_floors?: number | null
  finishing?: string
  delivery_status?: string
  contract_price?: number | null
  paid_amount?: number | null
  market_price?: number | null
  installment_amount?: number | null
  installment_frequency?: string
  years_left?: number | null
  description?: string
}) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const { data: prop } = await supabase
      .from("sell_requests")
      .select("id, documents")
      .eq("id", payload.propertyId)
      .maybeSingle()

    if (!prop) {
      return { success: false, error: msg.updatePropertyFailed }
    }

    const numOrNull = (val: unknown) => {
      if (val === "" || val === null || val === undefined) return null
      const n = Number(val)
      return Number.isFinite(n) && n >= 0 ? n : null
    }

    const cleanProject = sanitizeText(payload.project_name || "", 160)
    const cleanDeveloper = sanitizeText(payload.developer_name || "", 140)
    const cleanArea = sanitizeText(payload.area || "", 140)
    const cleanStreet = sanitizeText(payload.exact_street || "", 180)
    const cleanHouse = sanitizeText(payload.house_number || "", 40)
    const cleanCadastral = sanitizeText(payload.cadastral_code || "", 80)
    const cleanUnitType = sanitizeText(payload.unit_type || "", 80)
    const cleanFinishing = sanitizeText(payload.finishing || "", 80)
    const cleanDelivery = sanitizeText(payload.delivery_status || "", 80)
    const cleanFreq = sanitizeText(payload.installment_frequency || "", 60)
    const cleanDesc = sanitizeText(payload.description || "", 2000)

    const currentDocs =
      prop.documents && typeof prop.documents === "object"
        ? { ...prop.documents }
        : {}

    const nextMeta = {
      ...getUnitMetaObject(currentDocs),
      developer_name: cleanDeveloper || null,
      area: cleanArea || null,
      exact_street: cleanStreet || null,
      house_number: cleanHouse || null,
      cadastral_code: cleanCadastral || null,
      unit_type: cleanUnitType || null,
      size: numOrNull(payload.size),
      rooms: numOrNull(payload.rooms),
      bedrooms: numOrNull(payload.bedrooms),
      bathrooms: numOrNull(payload.bathrooms),
      floor_number: numOrNull(payload.floor_number),
      total_floors: numOrNull(payload.total_floors),
      finishing: cleanFinishing || null,
      delivery_status: cleanDelivery || null,
      installment_amount: numOrNull(payload.installment_amount),
      installment_frequency: cleanFreq || null,
      years_left: numOrNull(payload.years_left),
    }

    currentDocs.__unit_meta = nextMeta

    const fullUpdate: Record<string, any> = {
      project_name: cleanProject || null,
      developer_name: cleanDeveloper || null,
      area: cleanArea || null,
      exact_street: cleanStreet || null,
      house_number: cleanHouse || null,
      cadastral_code: cleanCadastral || null,
      unit_type: cleanUnitType || null,
      size: numOrNull(payload.size),
      rooms: numOrNull(payload.rooms),
      bedrooms: numOrNull(payload.bedrooms),
      bathrooms: numOrNull(payload.bathrooms),
      floor_number: numOrNull(payload.floor_number),
      total_floors: numOrNull(payload.total_floors),
      finishing: cleanFinishing || null,
      delivery_status: cleanDelivery || null,
      contract_price: numOrNull(payload.contract_price),
      paid_amount: numOrNull(payload.paid_amount),
      market_price: numOrNull(payload.market_price),
      installment_amount: numOrNull(payload.installment_amount),
      installment_frequency: cleanFreq || null,
      years_left: numOrNull(payload.years_left),
      description: cleanDesc || null,
      documents: currentDocs,
    }

    const { error } = await supabase
      .from("sell_requests")
      .update(fullUpdate)
      .eq("id", payload.propertyId)

    if (error) {
      const coreUpdate: Record<string, any> = {
        project_name: cleanProject || null,
        developer_name: cleanDeveloper || null,
        area: cleanArea || null,
        unit_type: cleanUnitType || null,
        size: numOrNull(payload.size),
        rooms: numOrNull(payload.rooms),
        bathrooms: numOrNull(payload.bathrooms),
        finishing: cleanFinishing || null,
        delivery_status: cleanDelivery || null,
        contract_price: numOrNull(payload.contract_price),
        paid_amount: numOrNull(payload.paid_amount),
        market_price: numOrNull(payload.market_price),
        installment_amount: numOrNull(payload.installment_amount),
        installment_frequency: cleanFreq || null,
        years_left: numOrNull(payload.years_left),
        description: cleanDesc || null,
        documents: currentDocs,
      }
      const { error: fbErr } = await supabase
        .from("sell_requests")
        .update(coreUpdate)
        .eq("id", payload.propertyId)

      if (fbErr) {
        return { success: false, error: msg.updatePropertyFailed }
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function savePropertyAdminNoteAction(payload: {
  propertyId: string
  adminNote: string
}) {
  const { t: msg, dir } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])
    const cleanNote = sanitizeText(payload.adminNote || "", 600)

    const { data: prop } = await supabase
      .from("sell_requests")
      .select("id, code, user_id, project_name, name, email")
      .eq("id", payload.propertyId)
      .maybeSingle()

    const { error } = await supabase
      .from("sell_requests")
      .update({ admin_note: cleanNote || null })
      .eq("id", payload.propertyId)

    if (error) {
      return { success: false, error: msg.updatePropertyFailed }
    }

    if (cleanNote && prop?.user_id) {
      const projectLabel = prop.project_name || msg.defaultProjectWord
      try {
        await supabase.from("notifications").insert({
          user_id: prop.user_id,
          role: "client",
          title: `📝 ${msg.notifAdminNoteTitle || msg.notifRejectedTitle} (${projectLabel})`,
          message: cleanNote,
          type: "status_update",
          link: `/account?view=seller&unitId=${prop.id}`,
          is_read: false,
        })
      } catch {}

      if (prop.email) {
        const unitCode = getUnifiedUnitCode(prop.id, prop.code)
        const accountUrl = `${DEFAULT_SITE_URL}/account?view=seller&unitId=${prop.id}`
        await sendSystemEmail({
          to: prop.email,
          senderName: "DualDealz",
          subject: `${msg.emailAdminNoteSubject} (${projectLabel})`,
          html: `<div dir="${dir}" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #ffffff; color: #0f1d40;">
                  <div style="background: #0f1d40; padding: 16px 22px; color: #ffffff; font-weight: bold; font-size: 16px;">DualDealz</div>
                  <div style="padding: 22px; line-height: 1.8; font-size: 14px;">
                    <h2 style="margin-top: 0; color: #0f1d40; font-size: 17px;">${msg.greetingWord} ${prop.name || msg.dearClient}</h2>
                    <p>${msg.emailAdminNoteIntro} <strong>${projectLabel} (${unitCode})</strong></p>
                    <div style="margin: 14px 0; padding: 12px 16px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; color: #78350f;">${cleanNote}</div>
                    <div style="margin-top: 20px; text-align: center;">
                      <a href="${accountUrl}" style="display: inline-block; background: #007a5a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 11px 24px; border-radius: 10px; font-size: 13px;">${msg.emailReviewEditBtn}</a>
                    </div>
                  </div>
                 </div>`,
        })
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deletePropertyAction(propertyId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    try {
      await supabase
        .from("property_offers")
        .delete()
        .eq("property_id", propertyId)
    } catch {}

    const { error } = await supabase
      .from("sell_requests")
      .delete()
      .eq("id", propertyId)
    if (error) return { success: false, error: msg.deletePropertyFailed }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateBuyerLeadStatusAction(
  leadId: string,
  status: string
) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])
    const cleanStatus = sanitizeText(status, 40).toLowerCase()

    if (!ALLOWED_MANUAL_LEAD_STATUSES.has(cleanStatus)) {
      return {
        success: false,
        error: msg.leadManualClosedNotAllowed,
      }
    }

    const { data: lead } = await supabase
      .from("buy_requests")
      .select("id, user_id, name, status")
      .eq("id", leadId)
      .maybeSingle()

    if (!lead) {
      return { success: false, error: msg.updateLeadFailed }
    }

    const currentStatus = String(lead.status || "new").trim().toLowerCase()

    if (currentStatus === "closed") {
      return {
        success: false,
        error: msg.leadClosedLocked,
      }
    }

    if (
      cleanStatus === "new" ||
      cleanStatus === "contacted" ||
      cleanStatus === "archived"
    ) {
      let offerQuery = supabase
        .from("property_offers")
        .select("id, status, initiated_by, diff_reasons")

      if (lead.user_id) {
        offerQuery = offerQuery.or(
          `lead_id.eq.${lead.id},buyer_user_id.eq.${lead.user_id}`
        )
      } else {
        offerQuery = offerQuery.eq("lead_id", lead.id)
      }

      const { data: leadOffers } = await offerQuery
      const normalizedStatuses = (leadOffers || []).map(resolveRawOfferStatus)

      if (normalizedStatuses.includes("accepted")) {
        return {
          success: false,
          error: msg.leadHasActiveDealBlocked,
        }
      }

      const activeOffersCount = normalizedStatuses.filter((st) =>
        ["pending_admin", "pending_seller", "counter_offered"].includes(st)
      ).length

      if (activeOffersCount > 0) {
        return {
          success: false,
          error: String(msg.leadHasActiveOffersBlocked || "").replace(
            "{count}",
            String(activeOffersCount)
          ),
        }
      }
    }

    const { error } = await supabase
      .from("buy_requests")
      .update({ status: cleanStatus })
      .eq("id", leadId)

    if (error) {
      return {
        success: false,
        error: msg.updateLeadFailed,
      }
    }

    if (lead?.user_id) {
      const buyerStatusText: Record<string, string> = {
        contacted: msg.leadContactedNotifMsg,
        qualified: msg.leadQualifiedNotifMsg,
        matched: msg.leadQualifiedNotifMsg,
      }
      if (buyerStatusText[cleanStatus]) {
        try {
          await supabase.from("notifications").insert({
            user_id: lead.user_id,
            role: "client",
            title: msg.leadUpdateNotifTitle,
            message: buyerStatusText[cleanStatus],
            type: "status_update",
            link: "/account?view=buyer",
            is_read: false,
          })
        } catch {}
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deleteBuyerLeadAction(leadId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    try {
      await supabase.from("property_offers").delete().eq("lead_id", leadId)
    } catch {}

    const { error } = await supabase
      .from("buy_requests")
      .delete()
      .eq("id", leadId)
    if (error) return { success: false, error: msg.deleteLeadFailed }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateUserRoleAndStatusAction(
  userId: string,
  role: string,
  status: string
) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth(["admin"])

    const cleanRoleRaw = sanitizeText(role || "user", 20).toLowerCase()
    const cleanStatusRaw = sanitizeText(status || "active", 20).toLowerCase()

    const cleanRole = ALLOWED_USER_ROLES.has(cleanRoleRaw)
      ? cleanRoleRaw
      : "user"
    const cleanStatus = ALLOWED_USER_STATUSES.has(cleanStatusRaw)
      ? cleanStatusRaw
      : "active"

    if (
      String(userId) === String(adminUser.id) &&
      ((cleanRole !== "admin" && cleanRole !== "owner") ||
        cleanStatus === "suspended")
    ) {
      return {
        success: false,
        error: msg.cannotDeleteSelf,
      }
    }

    const ownerIds = await resolveOwnerUserIds(supabase)
    const isCallerOwner = ownerIds.has(String(adminUser.id))
    const isTargetOwner = ownerIds.has(String(userId))

    if (isTargetOwner && (cleanStatus === "suspended" || !isCallerOwner)) {
      return {
        success: false,
        error: msg.cannotModifyOwnerAdmin || msg.unauthorizedAction,
      }
    }

    const { data: targetUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle()

    if (!targetUser) {
      return { success: false, error: msg.unauthorizedNotFound }
    }

    const targetCurrentRole = String(targetUser.role || "user")
      .trim()
      .toLowerCase()

    if (
      !isCallerOwner &&
      (targetCurrentRole === "admin" ||
        targetCurrentRole === "owner" ||
        cleanRole === "admin" ||
        cleanRole === "owner")
    ) {
      return {
        success: false,
        error: msg.onlyOwnerCanManageAdmins || msg.unauthorizedAction,
      }
    }

    const { error } = await supabase
      .from("users")
      .update({
        role: cleanRole,
        status: cleanStatus,
      })
      .eq("id", userId)

    if (error) {
      return {
        success: false,
        error: msg.updateRoleFailed,
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function createAdminOrUserAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth(["admin"])

    const name = sanitizeText(formData.get("name"), 120)
    const email = sanitizeText(formData.get("email"), 160).toLowerCase()
    const rawPhone = sanitizeText(formData.get("phone"), 30)
    const password = String(formData.get("password") || "").slice(0, 128)
    const rawRole = sanitizeText(
      formData.get("role") || "sales",
      20
    ).toLowerCase()
    const role = ALLOWED_USER_ROLES.has(rawRole) ? rawRole : "sales"

    if (!name || !email || !rawPhone || password.length < 8) {
      return {
        success: false,
        error: msg.fillAllUserFields,
      }
    }

    const ownerIds = await resolveOwnerUserIds(supabase)
    const isCallerOwner = ownerIds.has(String(adminUser.id))
    if (!isCallerOwner && (role === "admin" || role === "owner")) {
      return {
        success: false,
        error: msg.onlyOwnerCanManageAdmins || msg.unauthorizedAction,
      }
    }

    const formattedPhone = formatPrimaryPhone(rawPhone)
    const hash = hashPassword(password)

    const { data: insertedUser, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        phone: formattedPhone,
        password_hash: hash,
        country: "GE",
        role,
        status: "active",
        is_verified: true,
        otp_code: "PHONE_OK",
      })
      .select("id")
      .maybeSingle()

    if (error) {
      return {
        success: false,
        error: msg.emailOrPhoneTaken,
      }
    }

    if (insertedUser?.id) {
      await upsertUserVerificationMeta(supabase, String(insertedUser.id), {
        emailVerified: true,
        phoneVerified: true,
      })
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function deleteUserByAdminAction(userId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth(["admin"])

    if (String(userId) === String(adminUser.id)) {
      return { success: false, error: msg.cannotDeleteSelf }
    }

    const ownerIds = await resolveOwnerUserIds(supabase)
    const isCallerOwner = ownerIds.has(String(adminUser.id))
    const isTargetOwner = ownerIds.has(String(userId))

    if (isTargetOwner) {
      return {
        success: false,
        error: msg.cannotModifyOwnerAdmin || msg.unauthorizedAction,
      }
    }

    const { data: targetUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle()

    if (!targetUser) {
      return { success: false, error: msg.unauthorizedNotFound }
    }

    const targetRole = String(targetUser.role || "user").trim().toLowerCase()

    if ((targetRole === "admin" || targetRole === "owner") && !isCallerOwner) {
      return {
        success: false,
        error: msg.onlyOwnerCanManageAdmins || msg.unauthorizedAction,
      }
    }

    try {
      await supabase
        .from("property_offers")
        .delete()
        .or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`)
      await supabase.from("notifications").delete().eq("user_id", userId)
    } catch {}

    await supabase.from("sell_requests").delete().eq("user_id", userId)
    await supabase.from("buy_requests").delete().eq("user_id", userId)
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) return { success: false, error: msg.deleteUserFailed }
    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function updateAdminProfileDataAction(formData: FormData) {
  const { t: msg, dir } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const name = sanitizeText(formData.get("name"), 120)
    const email = sanitizeText(formData.get("email"), 160).toLowerCase()
    const rawPhone = sanitizeText(formData.get("phone"), 30)
    const currentPassword = String(formData.get("currentPassword") || "").trim()

    if (!name || !email || !rawPhone || !currentPassword) {
      return {
        success: false,
        error: msg.completeProfileFields,
      }
    }

    if (!verifyPassword(currentPassword, adminUser.password_hash)) {
      return {
        success: false,
        error: msg.wrongCurrentPassword,
      }
    }

    const formattedPhone = formatPrimaryPhone(rawPhone)

    const updateData: Record<string, any> = {
      name,
      phone: formattedPhone,
    }

    let successMessage = msg.profileUpdatedSuccess

    if (email !== adminUser.email) {
      updateData.email = email
      updateData.is_verified = false

      const verifyToken = randomBytes(24).toString("hex")
      updateData.otp_code = verifyToken

      const verifyLink = `${DEFAULT_SITE_URL}/login?verified=1&email=${encodeURIComponent(email)}&token=${verifyToken}`
      const comma = dir === "rtl" ? "،" : ","

      await sendSystemEmail({
        to: email,
        senderName: "DualDealz",
        subject: msg.confirmNewEmailSubject,
        html: `<div dir="${dir}" style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #101A2B;">${msg.greetingWord} ${name}${comma}</h2>
                <p>${msg.confirmNewEmailBody}</p>
                <div style="margin: 20px 0;">
                  <a href="${verifyLink}" style="display: inline-block; background-color: #105C50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                    ${msg.confirmNewEmailBtn}
                  </a>
                </div>
               </div>`,
      })

      successMessage = msg.profileUpdatedCheckEmail
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", adminUser.id)

    if (error) {
      return {
        success: false,
        error: msg.emailOrPhoneTaken,
      }
    }

    if (formData.get("clearAdminRequests") === "1") {
      await supabase.from("sell_requests").delete().eq("user_id", adminUser.id)
      await supabase.from("buy_requests").delete().eq("user_id", adminUser.id)
    }

    revalidateAdminAll()
    return { success: true, message: successMessage }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function changeAdminPasswordAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase, adminUser } = await requireAdminAuth([
      "admin",
      "moderator",
      "sales",
    ])

    const currentPassword = String(formData.get("currentPassword") || "").trim()
    const newPassword = String(formData.get("newPassword") || "").trim()

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: msg.enterCurrentAndNewPass,
      }
    }

    if (!verifyPassword(currentPassword, adminUser.password_hash)) {
      return { success: false, error: msg.wrongCurrentPassword }
    }

    const newHash = hashPassword(newPassword)
    const { error } = await supabase
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", adminUser.id)

    if (error) return { success: false, error: msg.changePassFailed }

    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === "production"
    const newToken = createSignedSessionToken(adminUser.id, newHash)
    cookieStore.set("user_session", newToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: isProd,
      httpOnly: true,
    })

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function saveSiteSettingsAction(formData: FormData) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const cookieStore = await cookies()

    const vipPlusNum = Math.max(
      1,
      Math.min(500, Math.round(Number(formData.get("vipPlusDailyGel")) || 5))
    )
    const superVipNum = Math.max(
      vipPlusNum + 1,
      Math.min(
        1000,
        Math.round(Number(formData.get("superVipDailyGel")) || 10)
      )
    )

    const ge7 = String(superVipNum * 2)
    const ge14 = String(superVipNum * 5)
    const ge30 = String(superVipNum * 10)

    const settingsPayload: GlobalSiteSettings & Record<string, any> = {
      siteName: sanitizeText(formData.get("siteName") || "DualDealz", 80),
      whatsappNumber: sanitizeText(
        formData.get("whatsappNumber") || "+201018595959",
        30
      ),
      supportEmail: sanitizeText(
        formData.get("supportEmail") || "info@dualdealz.com",
        120
      ),
      buyerCommission: sanitizeText(
        formData.get("buyerCommission") || "1.25",
        10
      ),
      developerPenaltyMin: sanitizeText(
        formData.get("developerPenaltyMin") || "10",
        10
      ),
      developerPenaltyMax: sanitizeText(
        formData.get("developerPenaltyMax") || "15",
        10
      ),
      boostPaymentUrl: sanitizeText(
        formData.get("boostPaymentUrl") || "",
        300
      ),
      bankIbanGe: sanitizeText(
        formData.get("bankIbanGe") || "GE00TB0000000000000000",
        60
      ),
      bankNameGe: sanitizeText(
        formData.get("bankNameGe") || "TBC Bank / Bank of Georgia",
        80
      ),
      vipPlusDailyGel: String(vipPlusNum),
      superVipDailyGel: String(superVipNum),
      fbPixelId: sanitizeText(formData.get("fbPixelId") || "", 80),
      gaMeasurementId: sanitizeText(formData.get("gaMeasurementId") || "", 80),
      gtmId: sanitizeText(formData.get("gtmId") || "", 80),
      promo7Price: ge7,
      promo14Price: ge14,
      promo30Price: ge30,
      promo_RU_7: sanitizeText(formData.get("promo_RU_7") || "2500", 12),
      promo_RU_14: sanitizeText(formData.get("promo_RU_14") || "4200", 12),
      promo_RU_30: sanitizeText(formData.get("promo_RU_30") || "5900", 12),
      promo_GE_7: ge7,
      promo_GE_14: ge14,
      promo_GE_30: ge30,
      promo_AE_7: sanitizeText(formData.get("promo_AE_7") || "99", 12),
      promo_AE_14: sanitizeText(formData.get("promo_AE_14") || "179", 12),
      promo_AE_30: sanitizeText(formData.get("promo_AE_30") || "249", 12),
      maintenanceMode: formData.get("maintenanceMode") === "on",
      allowNewSells: formData.get("allowNewSells") === "on",
      allowNewBuys: formData.get("allowNewBuys") === "on",
      emailNotifications: formData.get("emailNotifications") === "on",
    }

    cookieStore.delete("darak_site_settings")

    try {
      const { error: upsertErr } = await supabase.from("site_settings").upsert({
        id: "global",
        ...settingsPayload,
        updated_at: new Date().toISOString(),
      })
      if (upsertErr) {
        await supabase.from("site_settings").upsert({
          id: "global",
          siteName: settingsPayload.siteName,
          whatsappNumber: settingsPayload.whatsappNumber,
          supportEmail: settingsPayload.supportEmail,
          buyerCommission: settingsPayload.buyerCommission,
          maintenanceMode: settingsPayload.maintenanceMode,
          allowNewSells: settingsPayload.allowNewSells,
          allowNewBuys: settingsPayload.allowNewBuys,
          emailNotifications: settingsPayload.emailNotifications,
          updated_at: new Date().toISOString(),
        })
      }
    } catch {}

    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("type", "system")
        .eq("title", "__GLOBAL_SITE_CONFIG__")

      await supabase.from("notifications").insert({
        user_id: null,
        role: "admin",
        title: "__GLOBAL_SITE_CONFIG__",
        message: JSON.stringify(settingsPayload),
        type: "system",
        link: "/admin/settings",
        is_read: true,
      })
    } catch {}

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function managePropertyPromotionAction(
  propertyId: string,
  action: "activate" | "cancel",
  days: number = 7,
  tier?: "super_vip" | "vip_plus",
  options?: {
    orderRef?: string | null
    amountGel?: number | null
    boostRequestId?: string | null
    paymentMethod?: "flitt" | "cash_manual" | string | null
  }
) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin", "moderator"])

    const { data: prop } = await supabase
      .from("sell_requests")
      .select(
        "id, code, user_id, status, project_name, name, is_featured, featured_days, featured_price, featured_until, boost_tier, views_count, documents"
      )
      .eq("id", propertyId)
      .maybeSingle()

    if (!prop) {
      return { success: false, error: msg.unauthorizedNotFound }
    }

    const currentDocs =
      prop.documents && typeof prop.documents === "object"
        ? { ...prop.documents }
        : {}
    const currentMeta = getUnitMetaObject(currentDocs)

    if (action === "activate") {
      const unitSt = String(prop.status || "").trim().toLowerCase()
      if (
        unitSt !== "active" &&
        unitSt !== "approved" &&
        unitSt !== "published" &&
        unitSt !== "offer_received"
      ) {
        return {
          success: false,
          code: "UNIT_NOT_PUBLISHED",
          error: msg.boostUnitNotPublishedError,
        }
      }

      const addDays = Math.max(1, Number(days || prop.featured_days) || 7)
      const nowMs = Date.now()
      const nowIso = new Date(nowMs).toISOString()

      const existingUntilMs = prop.featured_until
        ? new Date(prop.featured_until).getTime()
        : 0
      const isExtendingActive =
        Boolean(prop.is_featured) && existingUntilMs > nowMs

      const baseMs = isExtendingActive ? existingUntilMs : nowMs
      const untilIso = new Date(
        baseMs + addDays * 24 * 60 * 60 * 1000
      ).toISOString()

      const requestedTier: "super_vip" | "vip_plus" =
        tier || (prop.boost_tier === "vip_plus" ? "vip_plus" : "super_vip")

      const resolvedTier: "super_vip" | "vip_plus" =
        isExtendingActive && prop.boost_tier === "super_vip"
          ? "super_vip"
          : requestedTier

      const totalDays = isExtendingActive
        ? (Number(prop.featured_days) || 0) + addDays
        : addDays

      const existingActiveMeta =
        currentMeta.boost_active && typeof currentMeta.boost_active === "object"
          ? currentMeta.boost_active
          : null

      const currentViews = Math.max(0, Number(prop.views_count) || 0)
      const unitCode = getUnifiedUnitCode(prop.id, prop.code)
      const isManualActivation = !options?.boostRequestId
      const resolvedPaymentMethod =
        options?.paymentMethod ||
        (isManualActivation ? "cash_manual" : "flitt")

      const generatedManualRef = `MN-${Date.now().toString(36).toUpperCase().slice(-5)}-${String(prop.id).slice(0, 4).toUpperCase()}`
      const resolvedOrderRef =
        options?.orderRef ||
        currentMeta.boost_pending?.order_ref ||
        (isManualActivation
          ? generatedManualRef
          : existingActiveMeta?.order_ref) ||
        generatedManualRef

      const resolvedAmountGel =
        options?.amountGel !== undefined && options?.amountGel !== null
          ? Math.max(0, Number(options.amountGel) || 0)
          : currentMeta.boost_pending?.amount_gel ?? prop.featured_price ?? 0

      currentDocs.__unit_meta = {
        ...currentMeta,
        boost_pending: null,
        boost_last_rejected: null,
        boost_active: {
          started_at:
            isExtendingActive && existingActiveMeta?.started_at
              ? existingActiveMeta.started_at
              : nowIso,
          last_extended_at: isExtendingActive ? nowIso : null,
          ends_at: untilIso,
          total_days: totalDays,
          last_added_days: addDays,
          tier: resolvedTier,
          views_baseline:
            isExtendingActive &&
            typeof existingActiveMeta?.views_baseline === "number"
              ? existingActiveMeta.views_baseline
              : currentViews,
          order_ref: resolvedOrderRef,
          amount_gel: resolvedAmountGel,
          payment_method: resolvedPaymentMethod,
        },
      }

      const { error } = await supabase
        .from("sell_requests")
        .update({
          is_featured: true,
          boost_tier: resolvedTier,
          featured_days: totalDays,
          featured_price: resolvedAmountGel,
          featured_fawry_code: resolvedOrderRef,
          featured_status: "active",
          featured_until: untilIso,
          documents: currentDocs,
        })
        .eq("id", propertyId)

      if (error) {
        return {
          success: false,
          error: msg.promoColumnsMissing,
        }
      }

      try {
        if (options?.boostRequestId) {
          await supabase
            .from("boost_requests")
            .update({
              status: "approved",
              approved_at: nowIso,
            })
            .eq("id", options.boostRequestId)
        } else {
          const { data: updatedPending } = await supabase
            .from("boost_requests")
            .update({
              status: "approved",
              approved_at: nowIso,
            })
            .eq("unit_id", propertyId)
            .in("status", ["pending_admin_approval", "paid_pending_approval"])
            .select("id")

          if (!updatedPending || updatedPending.length === 0) {
            await supabase.from("boost_requests").insert({
              unit_id: prop.id,
              unit_code: unitCode,
              user_id: prop.user_id || null,
              package_tier:
                resolvedTier === "vip_plus" ? "VIP+" : "SUPER VIP",
              duration_days: addDays,
              amount_gel: resolvedAmountGel,
              payment_method: resolvedPaymentMethod,
              status: "approved",
              order_ref: resolvedOrderRef,
              approved_at: nowIso,
            })
          }
        }
      } catch {}

      if (prop.user_id) {
        try {
          const notifTitle = isExtendingActive
            ? `⭐ ${msg.boostExtendedNotifTitle || msg.promoActivatedNotifTitle} (+${addDays}d)`
            : `⭐ ${msg.promoActivatedNotifTitle} (${resolvedTier === "vip_plus" ? "VIP+" : "SUPER VIP"} · ${addDays}d)`
          const notifBody = isExtendingActive
            ? `${msg.boostExtendedNotifMsg || msg.promoActivatedNotifMsg} (${prop.project_name || msg.defaultProjectWord})`
            : `${msg.promoActivatedNotifMsg} (${prop.project_name || msg.defaultProjectWord})`

          await supabase.from("notifications").insert({
            user_id: prop.user_id,
            role: "client",
            title: notifTitle,
            message: notifBody,
            type: "status_update",
            link: `/account?view=seller&unitId=${prop.id}`,
            is_read: false,
          })
        } catch {}
      }
    } else {
      currentDocs.__unit_meta = {
        ...currentMeta,
        boost_pending: null,
        boost_active: null,
      }

      const { error } = await supabase
        .from("sell_requests")
        .update({
          is_featured: false,
          boost_tier: null,
          featured_status: "none",
          featured_until: null,
          documents: currentDocs,
        })
        .eq("id", propertyId)

      if (error) {
        return { success: false, error: msg.cancelPromoFailed }
      }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function approveBoostRequestByAdminAction(boostRequestId: string) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin", "moderator"])

    const { data: reqRow } = await supabase
      .from("boost_requests")
      .select("*")
      .eq("id", boostRequestId)
      .maybeSingle()

    if (!reqRow) {
      return { success: false, error: msg.unauthorizedNotFound }
    }

    if (!reqRow.unit_id) {
      return { success: false, error: msg.boostUnitNotPublishedError }
    }

    const tierCode: "super_vip" | "vip_plus" = String(
      reqRow.package_tier || ""
    )
      .toUpperCase()
      .includes("VIP+")
      ? "vip_plus"
      : "super_vip"

    return managePropertyPromotionAction(
      String(reqRow.unit_id),
      "activate",
      Number(reqRow.duration_days) || 1,
      tierCode,
      {
        orderRef: reqRow.order_ref || null,
        amountGel: Number(reqRow.amount_gel) || null,
        boostRequestId: String(reqRow.id),
        paymentMethod: reqRow.payment_method || "flitt",
      }
    )
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function rejectBoostRequestByAdminAction(
  boostRequestId: string,
  reason?: string
) {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin", "moderator"])

    const { data: reqRow } = await supabase
      .from("boost_requests")
      .select("*")
      .eq("id", boostRequestId)
      .maybeSingle()

    const rejectedAtIso = new Date().toISOString()

    await supabase
      .from("boost_requests")
      .update({
        status: "rejected",
        admin_note: reason || null,
        rejected_at: rejectedAtIso,
      })
      .eq("id", boostRequestId)

    if (reqRow?.unit_id) {
      const { data: unitRow } = await supabase
        .from("sell_requests")
        .select("id, is_featured, featured_until, documents")
        .eq("id", reqRow.unit_id)
        .maybeSingle()

      const isCurrentlyActive =
        Boolean(unitRow?.is_featured) &&
        (!unitRow?.featured_until ||
          new Date(unitRow.featured_until) > new Date())

      const currentDocs =
        unitRow?.documents && typeof unitRow.documents === "object"
          ? { ...unitRow.documents }
          : {}
      const currentMeta = getUnitMetaObject(currentDocs)

      currentDocs.__unit_meta = {
        ...currentMeta,
        boost_pending: null,
        boost_last_rejected: {
          order_ref: reqRow.order_ref || null,
          rejected_at: rejectedAtIso,
          reason: reason || null,
          paid_via: reqRow.payment_method || null,
        },
      }

      const unitUpdate: Record<string, any> = {
        documents: currentDocs,
      }

      if (!isCurrentlyActive) {
        unitUpdate.featured_status = "none"
        unitUpdate.boost_tier = null
      }

      await supabase
        .from("sell_requests")
        .update(unitUpdate)
        .eq("id", reqRow.unit_id)
    }

    if (reqRow?.user_id) {
      try {
        await supabase.from("notifications").insert({
          user_id: reqRow.user_id,
          role: "client",
          title: `${msg.boostRejectedNotifTitle || msg.notifRejectedTitle} (${reqRow.package_tier})`,
          message:
            reason ||
            msg.boostRejectedDefaultReason ||
            msg.notifRejectedMsg,
          type: "status_update",
          link: reqRow.unit_id
            ? `/account?view=seller&unitId=${reqRow.unit_id}`
            : "/account?view=seller",
          is_read: false,
        })
      } catch {}
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}

export async function purgeSellerDeletedPropertiesAction() {
  const { t: msg } = await getAdminActionsDict()
  try {
    const { supabase } = await requireAdminAuth(["admin"])
    const { data: deletedRows } = await supabase
      .from("sell_requests")
      .select("id")
      .eq("status", "deleted_by_seller")

    const ids = (deletedRows || []).map((r: any) => r.id)
    if (ids.length > 0) {
      try {
        await supabase
          .from("property_offers")
          .delete()
          .in("property_id", ids)
      } catch {}
    }

    const { error } = await supabase
      .from("sell_requests")
      .delete()
      .eq("status", "deleted_by_seller")

    if (error) {
      return { success: false, error: msg.purgeDeletedFailed }
    }

    revalidateAdminAll()
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : msg.unauthorizedAction,
    }
  }
}