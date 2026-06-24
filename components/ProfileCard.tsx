import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { findUserByEmail, updateUserProfile, getSubscriptionTier } from '@/lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  const user = await findUserByEmail(auth.email)
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (req.method === 'GET') {
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      phone: user.phone || '',
      subscriptionTier: getSubscriptionTier(user),
      joinDate: user.createdAt,
      slipsOptimised: user.slipsOptimised || 0,
      lastActive: user.lastActive || user.createdAt,
    })
  }

  if (req.method === 'POST') {
    const { fullName, phone } = req.body
    await updateUserProfile(user.id, {
      fullName: fullName?.trim() || user.fullName,
      phone: phone?.trim() || user.phone,
    })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
