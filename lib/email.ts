import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendNewUserNotification(username: string, email: string, userId: string) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'simeonadigun0@gmail.com',
      subject: `🔔 New Groove Slip Registration — ${username}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a3d1e;">New User Registration</h2>
          <p>A new user has registered on Groove Slip.</p>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Username:</td><td>${username}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td>${email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">User ID:</td><td>${userId}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td>${new Date().toLocaleString()}</td></tr>
          </table>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin"
             style="background: #1a3d1e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go to Admin Dashboard →
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error('Email notification failed:', err)
  }
}

export async function sendApprovalNotification(username: string, email: string) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: `✅ Your Groove Slip account is ready!`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a3d1e;">You're in! 🎉</h2>
          <p>Hi ${username},</p>
          <p>Your Groove Slip account is ready. Login now and start cleaning your bet slips.</p>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}"
             style="background: #1a3d1e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Login to Groove Slip →
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error('Approval email failed:', err)
  }
}

// ─── ADMIN ALERT ───────────────────────────────────────────────────────────
// Used for system alerts — API token warnings, critical errors etc.
export async function sendAdminAlert({ subject, text }: { subject: string; text: string }) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'simeonadigun0@gmail.com',
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; border: 2px solid #dc2626; border-radius: 12px; overflow: hidden;">
          <div style="background: #dc2626; padding: 16px 20px;">
            <h2 style="color: #fff; margin: 0; font-size: 18px;">⚠️ Groove Slip System Alert</h2>
          </div>
          <div style="padding: 20px; background: #fff;">
            <pre style="font-family: sans-serif; white-space: pre-wrap; font-size: 14px; color: #1e293b; line-height: 1.6;">${text}</pre>
            <br/>
            <p style="font-size: 12px; color: #94a3b8;">Sent automatically by Groove Slip — ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[sendAdminAlert] Failed:', err)
  }
}