import { Resend } from 'resend'

function getFromHeader(senderName?: string) {
  const rawFrom = process.env.EMAIL_FROM?.trim() || 'DualDealz <noreply@dualdealz.com>'
  if (!senderName) return rawFrom

  // استخراج الإيميل فقط لو EMAIL_FROM مكتوب بصيغة "Name <email>"
  const match = rawFrom.match(/<([^>]+)>/)
  const emailAddress = match ? match[1].trim() : rawFrom
  return `${senderName} <${emailAddress}>`
}

export async function sendEmail({
  to,
  subject,
  html,
  senderName = 'DualDealz',
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const cleanTo = String(to || '').trim()

  if (!apiKey || !cleanTo || !cleanTo.includes('@')) {
    console.error('Resend skipped: missing RESEND_API_KEY or invalid recipient')
    return false
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: getFromHeader(senderName),
      to: cleanTo,
      subject,
      html,
    })

    if (error) {
      console.error('Resend email error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email via Resend:', error)
    return false
  }
}