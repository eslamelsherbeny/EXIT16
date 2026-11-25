import { Resend } from 'resend'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeHeaderLine(val: unknown, maxLen = 200): string {
  return String(val || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

function getFromHeader(senderName?: string) {
  const rawFrom =
    process.env.EMAIL_FROM?.trim() || 'DualDealz <noreply@dualdealz.com>'
  const match = rawFrom.match(/<([^>]+)>/)
  const emailAddress = (match ? match[1] : rawFrom)
    .replace(/[\r\n<>"]/g, '')
    .trim()

  const cleanSenderName = sanitizeHeaderLine(senderName, 80).replace(
    /[<>"]/g,
    ''
  )

  if (!cleanSenderName) {
    return `DualDealz <${emailAddress}>`
  }

  return `${cleanSenderName} <${emailAddress}>`
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
  const cleanTo = sanitizeHeaderLine(to, 160).toLowerCase()
  const cleanSubject = sanitizeHeaderLine(subject, 240)

  if (!apiKey || !cleanTo || !EMAIL_REGEX.test(cleanTo) || !cleanSubject) {
    console.error('Resend skipped: missing RESEND_API_KEY or invalid recipient')
    return false
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: getFromHeader(senderName),
      to: cleanTo,
      subject: cleanSubject,
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