import nodemailer from 'nodemailer'

export async function sendEmail({
  to,
  subject,
  html,
  senderName = 'Aqar Exit',
}: {
  to: string
  subject: string
  html: string
  senderName?: string
}) {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '')

  if (!user || !pass || !to) return false

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: { rejectUnauthorized: false },
  })

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      to: to.trim(),
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}