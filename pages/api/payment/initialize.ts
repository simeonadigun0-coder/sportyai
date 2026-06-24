import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail } from '@/lib/users'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  // tier: 'basic' (₦1,500/month) or 'pro' (₦2,500/month)
  const { tier = 'pro' } = req.body

  const isBasic = tier === 'basic'
  const amount = isBasic ? 150000 : 250000 // kobo
  const planCode = isBasic
    ? process.env.PAYSTACK_BASIC_PLAN_CODE
    : process.env.PAYSTACK_PRO_PLAN_CODE || process.env.PAYSTACK_PLAN_CODE

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        plan: planCode,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&tier=${tier}`,
        metadata: {
          userId: user.id,
          username: user.username,
          tier,
        },
      }),
    })

    const data = await response.json()
    if (!data.status) {
      console.log('Paystack error:', JSON.stringify(data))
      return res.status(400).json({ error: data.message || 'Payment initialization failed' })
    }

    return res.status(200).json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initialize payment' })
  }
}