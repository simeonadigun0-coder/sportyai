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
      subject: `🔔 New SportyAI Registration — ${username}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #22c55e;">New User Registration</h2>
          <p>A new user has registered on SportyAI and needs your approval.</p>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Username:</td><td>${username}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td>${email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">User ID:</td><td>${userId}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td>${new Date().toLocaleString()}</td></tr>
          </table>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
             style="background: #22c55e; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
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
      subject: `✅ Your SportyAI account has been approved!`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #22c55e;">You're approved! 🎉</h2>
          <p>Hi ${username},</p>
          <p>Your SportyAI account has been approved. You can now login and start analysing your bet slips.</p>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
             style="background: #22c55e; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Login to SportyAI →
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error('Approval email failed:', err)
  }
}