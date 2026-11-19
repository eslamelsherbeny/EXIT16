import nodemailer from 'nodemailer'

export const AUTO_PUBLISH_MATCH_THRESHOLD = 80
export const MAX_ACTIVE_BUYER_OFFERS = 3
export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://exit-16.vercel.app'

export const REOPENED_PROMPT_TAG = '__REOPENED_PROMPT__'
export const PRIORITY_RETURNED_TAG = '__PRIORITY_FROM_BACKUP__'
export const ADMIN_SYNCED_PRICE_TAG = '__ADMIN_SYNCED_PRICE__'
export const BUYER_HIDDEN_TAG = '__BUYER_HIDDEN__'
export const SELLER_DELAYED_UNAVAILABLE_TAG = '__SELLER_UNAVAILABLE_NOW__'
export const BUYER_PAUSED_FOR_DEAL_TAG = '__PAUSED_FOR_ACTIVE_DEAL__'

export async function sendOfferTransactionalEmail({
  to,
  subject,
  heading,
  bodyLines,
  ctaText,
  ctaUrl,
  dir = 'rtl',
}: {
  to?: string | null
  subject: string
  heading: string
  bodyLines: string[]
  ctaText: string
  ctaUrl: string
  dir?: 'rtl' | 'ltr'
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '')
  const cleanTo = String(to || '').trim()
  if (
    !user ||
    !pass ||
    !cleanTo ||
    !cleanTo.includes('@') ||
    cleanTo.endsWith('@aqarexit.ge')
  ) {
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    })

    const htmlBody = `
      <div dir="${dir}" style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background: #ffffff; color: #0a1122;">
        <div style="background: #0a1122; padding: 18px 24px; color: #ffffff; font-weight: bold; font-size: 16px;">
          Aqar Exit
        </div>
        <div style="padding: 24px; line-height: 1.8; font-size: 14px;">
          <h2 style="margin-top: 0; color: #007a5a; font-size: 18px;">${heading}</h2>
          ${bodyLines.map((line) => `<p style="margin: 10px 0;">${line}</p>`).join('')}
          <div style="margin-top: 24px; text-align: center;">
            <a href="${ctaUrl}" style="display: inline-block; background: #007a5a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 10px; font-size: 14px;">
              ${ctaText}
            </a>
          </div>
        </div>
      </div>
    `

    await transporter.sendMail({
      from: `"Aqar Exit" <${user}>`,
      to: cleanTo,
      subject,
      html: htmlBody,
    })
    return true
  } catch (e) {
    console.error('sendOfferTransactionalEmail error:', e)
    return false
  }
}

export async function resolveSellerEmail(
  supabase: any,
  unit: any
): Promise<{ email: string | null; name: string }> {
  if (unit?.user_id) {
    const { data: sellerProfile } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', unit.user_id)
      .maybeSingle()
    if (sellerProfile?.email) {
      return {
        email: sellerProfile.email,
        name: sellerProfile.name || unit.name || '',
      }
    }
  }
  return {
    email: unit?.email ? String(unit.email).trim() : null,
    name: unit?.name || '',
  }
}

export async function resolveBuyerEmail(
  supabase: any,
  offer: any
): Promise<{ email: string | null; name: string }> {
  if (offer?.buyer_user_id) {
    const { data: buyerProfile } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', offer.buyer_user_id)
      .maybeSingle()
    if (buyerProfile?.email) {
      return {
        email: buyerProfile.email,
        name: buyerProfile.name || offer.buyer_name || '',
      }
    }
  }
  if (offer?.lead_id) {
    const { data: leadRow } = await supabase
      .from('buy_requests')
      .select('email, name')
      .eq('id', offer.lead_id)
      .maybeSingle()
    if (leadRow?.email) {
      return {
        email: leadRow.email,
        name: leadRow.name || offer.buyer_name || '',
      }
    }
  }
  return { email: null, name: offer?.buyer_name || '' }
}

/**
 * تجميد عروض المشتري الأخرى مؤقتاً بمجرد قبول صفقة له (حتى لا يوافق مالك آخر على نفس المشتري)
 */
export async function freezeBuyerOtherPendingOffers(
  supabase: any,
  acceptedOffer: any
) {
  if (!acceptedOffer?.buyer_user_id && !acceptedOffer?.lead_id) return
  try {
    let query = supabase
      .from('property_offers')
      .select('id, property_id, status, diff_reasons')
      .neq('id', acceptedOffer.id)
      .in('status', ['pending_admin', 'pending_seller', 'counter_offered'])

    if (acceptedOffer.buyer_user_id) {
      query = query.eq('buyer_user_id', acceptedOffer.buyer_user_id)
    } else {
      query = query.eq('lead_id', acceptedOffer.lead_id)
    }

    const { data: otherOffers } = await query
    if (!otherOffers || otherOffers.length === 0) return

    const affectedUnitIds = new Set<string>()
    for (const o of otherOffers) {
      const diffs = Array.isArray(o.diff_reasons) ? o.diff_reasons : []
      const nextDiffs = Array.from(
        new Set([...diffs, BUYER_PAUSED_FOR_DEAL_TAG])
      )
      await supabase
        .from('property_offers')
        .update({
          status: 'unit_locked',
          diff_reasons: nextDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', o.id)
      if (o.property_id) affectedUnitIds.add(String(o.property_id))
    }

    for (const uId of affectedUnitIds) {
      const { data: rem } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', uId)
        .in('status', ['pending_seller', 'counter_offered', 'accepted'])
      if (!rem || rem.length === 0) {
        await supabase
          .from('sell_requests')
          .update({ status: 'active' })
          .eq('id', uId)
          .eq('status', 'offer_received')
      }
    }
  } catch (e) {
    console.error('freezeBuyerOtherPendingOffers error:', e)
  }
}

/**
 * حذف وتنظيف عروض المشتري الأخرى نهائياً عند تأكيد إتمام البيع (mark_unit_sold)
 */
export async function purgeBuyerOtherOffersOnSale(
  supabase: any,
  soldOffer: any
) {
  if (!soldOffer?.buyer_user_id && !soldOffer?.lead_id) return
  try {
    let query = supabase
      .from('property_offers')
      .select('id, property_id')
      .neq('id', soldOffer.id)
      .in('status', [
        'pending_admin',
        'pending_seller',
        'counter_offered',
        'unit_locked',
        'recommended',
      ])

    if (soldOffer.buyer_user_id) {
      query = query.eq('buyer_user_id', soldOffer.buyer_user_id)
    } else {
      query = query.eq('lead_id', soldOffer.lead_id)
    }

    const { data: otherOffers } = await query
    if (!otherOffers || otherOffers.length === 0) return

    const idsToDelete = otherOffers.map((o: any) => String(o.id))
    const affectedUnitIds = Array.from(
      new Set(
        otherOffers.map((o: any) => String(o.property_id)).filter(Boolean)
      )
    )

    await supabase.from('property_offers').delete().in('id', idsToDelete)

    for (const oId of idsToDelete) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .ilike('link', `%offerId=${oId}%`)
      } catch {}
    }

    for (const uId of affectedUnitIds) {
      const { data: rem } = await supabase
        .from('property_offers')
        .select('id')
        .eq('property_id', uId)
        .in('status', ['pending_seller', 'counter_offered', 'accepted'])
      if (!rem || rem.length === 0) {
        await supabase
          .from('sell_requests')
          .update({ status: 'active' })
          .eq('id', uId)
          .eq('status', 'offer_received')
      }
    }
  } catch (e) {
    console.error('purgeBuyerOtherOffersOnSale error:', e)
  }
}

/**
 * فك تجميد عروض المشتري الأخرى إذا تعثرت صفقته الأولى، مع إظهار خيار إعادة الإرسال بدون إرسال تلقائي
 */
export async function unfreezeBuyerPausedOffers(
  supabase: any,
  cancelledOffer: any
) {
  if (!cancelledOffer?.buyer_user_id && !cancelledOffer?.lead_id) return
  try {
    let query = supabase
      .from('property_offers')
      .select('id, property_id, diff_reasons')
      .neq('id', cancelledOffer.id)
      .eq('status', 'unit_locked')

    if (cancelledOffer.buyer_user_id) {
      query = query.eq('buyer_user_id', cancelledOffer.buyer_user_id)
    } else {
      query = query.eq('lead_id', cancelledOffer.lead_id)
    }

    const { data: lockedOffers } = await query
    if (!lockedOffers || lockedOffers.length === 0) return

    for (const o of lockedOffers) {
      const diffs = Array.isArray(o.diff_reasons) ? o.diff_reasons : []
      if (!diffs.includes(BUYER_PAUSED_FOR_DEAL_TAG)) continue

      const { data: targetUnit } = await supabase
        .from('sell_requests')
        .select('id, status')
        .eq('id', o.property_id)
        .maybeSingle()

      const uSt = String(targetUnit?.status || '').toLowerCase()
      if (!targetUnit || uSt === 'sold' || uSt === 'deleted_by_seller') {
        await supabase.from('property_offers').delete().eq('id', o.id)
        continue
      }

      const cleanedDiffs = diffs.filter(
        (d: string) => d !== BUYER_PAUSED_FOR_DEAL_TAG
      )
      const nextDiffs =
        uSt === 'transferring'
          ? cleanedDiffs
          : Array.from(new Set([...cleanedDiffs, REOPENED_PROMPT_TAG]))

      await supabase
        .from('property_offers')
        .update({
          diff_reasons: nextDiffs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', o.id)
    }
  } catch (e) {
    console.error('unfreezeBuyerPausedOffers error:', e)
  }
}