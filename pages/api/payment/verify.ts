import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, updateUserSubscription, SubscriptionTier } from '@/lib/users'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const { reference } = req.body
  if (!reference) return res.status(400).json({ error: 'Reference is required' })

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    })
    const data = await response.json()

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed' })
    }

    // Determine tier from amount paid
    const amountPaid = data.data.amount // in kobo
    const tier: SubscriptionTier = amountPaid >= 250000 ? 'pro' : 'basic'

    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)

    const user = await findUserByEmail(auth.email)
    if (!user) return res.status(404).json({ error: 'User not found' })

    await updateUserSubscription(user.id, {
      subscriptionExpiry: expiry.toISOString(),
      subscriptionTier: tier,
    })

    return res.status(200).json({
      success: true,
      subscriptionExpiry: expiry.toISOString(),
      subscriptionTier: tier,
    })
  } catch {
    return res.status(500).json({ error: 'Verification failed' })
  }
}