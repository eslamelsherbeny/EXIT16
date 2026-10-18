import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, // ضيف ده في ملف .env (مثال: info@aqarexit.com)
      pass: process.env.EMAIL_PASS, // ضيف ده في ملف .env (باسورد الإيميل)
    },
  });

  try {
    await transporter.sendMail({
      from: `"دارك للعقارات" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}