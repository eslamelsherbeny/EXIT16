import { NextResponse, type NextRequest } from 'next/server'
import {
  getSupabase,
  getVerifiedSellerSession,
  upsertUserVerificationMeta,
} from '@/lib/form-action-helpers'
import { verifyMagicTokenAction } from '@/actions/submit-forms'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') || 'phone'
  const token = searchParams.get('token') || ''
  const targetUserId = searchParams.get('u') || searchParams.get('userId') || ''
  const unitId = searchParams.get('unitId') || ''
  const offerId = searchParams.get('offerId') || ''
  const leadId = searchParams.get('leadId') || ''
  const nextUrl = searchParams.get('next') || '/account'

  const safeNext =
    nextUrl.startsWith('/') &&
    !nextUrl.startsWith('//') &&
    !nextUrl.startsWith('/admin')
      ? nextUrl
      : '/account'

  try {
    const supabase = await getSupabase()

    // 1. إذا كان الرابط لتأكيد الإيميل عبر التوكن السحري المرسل في الإيميل
    if (type === 'email' && token) {
      const verified = await verifyMagicTokenAction(token)
      if (verified.valid && verified.userId) {
        return NextResponse.redirect(new URL(safeNext, request.url))
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. فحص هوية الشخص الذي ضغط على رابط الواتساب
    const sessionUser = await getVerifiedSellerSession(supabase)
    const role = String(sessionUser?.role || 'user')
      .trim()
      .toLowerCase()
    const isStaff =
      Boolean(sessionUser) &&
      (role === 'admin' || role === 'moderator' || role === 'sales')

    // إذا كان الذي ضغط على الرابط هو الأدمن نفسه -> نوثق رقم العميل فوراً ونفتح للأدمن الكارت في لوحة الإدارة!
    if (isStaff) {
      let resolvedUserId = targetUserId

      if (unitId) {
        const { data: unit } = await supabase
          .from('sell_requests')
          .select('user_id, documents')
          .eq('id', unitId)
          .maybeSingle()

        if (!resolvedUserId && unit?.user_id) {
          resolvedUserId = String(unit.user_id)
        }
        if (unit) {
          const docs =
            unit.documents && typeof unit.documents === 'object'
              ? { ...unit.documents }
              : {}
          docs.__unit_meta = {
            ...(docs.__unit_meta || {}),
            phone_verified: true,
          }
          await supabase
            .from('sell_requests')
            .update({ documents: docs })
            .eq('id', unitId)
        }
      }

      if (offerId && !resolvedUserId) {
        const { data: offer } = await supabase
          .from('property_offers')
          .select('buyer_user_id')
          .eq('id', offerId)
          .maybeSingle()
        if (offer?.buyer_user_id) {
          resolvedUserId = String(offer.buyer_user_id)
        }
      }

      if (leadId && !resolvedUserId) {
        const { data: lead } = await supabase
          .from('buy_requests')
          .select('user_id')
          .eq('id', leadId)
          .maybeSingle()
        if (lead?.user_id) {
          resolvedUserId = String(lead.user_id)
        }
      }

      if (resolvedUserId) {
        await upsertUserVerificationMeta(supabase, resolvedUserId, {
          phoneVerified: true,
        })
      }

      // توجيه الأدمن مباشرة إلى الكارت المناسب في لوحة الإدارة
      if (offerId) {
        return NextResponse.redirect(
          new URL(`/admin/deals?offerId=${encodeURIComponent(offerId)}`, request.url)
        )
      }
      if (unitId) {
        return NextResponse.redirect(
          new URL(
            `/admin/properties?unitId=${encodeURIComponent(unitId)}`,
            request.url
          )
        )
      }
      if (leadId) {
        return NextResponse.redirect(
          new URL(`/admin/leads?leadId=${encodeURIComponent(leadId)}`, request.url)
        )
      }
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // 3. أما إذا ضغط العميل نفسه (أو أي زائر غير الأدمن) على الرابط في رسالة الواتساب:
    // لا نسمح له بتوثيق نفسه، ولا نُظهر له صفحة دخول الأدمن أبداً، بل نأخذه لصفحة حسابه أو الوحدة بهدوء!
    if (unitId && !sessionUser) {
      return NextResponse.redirect(
        new URL(`/opportunities/${encodeURIComponent(unitId)}`, request.url)
      )
    }
    return NextResponse.redirect(new URL(safeNext, request.url))
  } catch {
    return NextResponse.redirect(new URL('/account', request.url))
  }
}
