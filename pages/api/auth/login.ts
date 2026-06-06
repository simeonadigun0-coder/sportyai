import { NextApiRequest, NextApiResponse } from 'next'
import { findUserByEmail, verifyPassword, updateLastSeen, isSubscriptionActive } from '@/lib/users'
import { signToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const user = await findUserByEmail(email)
  if (!user || !verifyPassword(user, password))
    return res.status(401).json({ error: 'Invalid email or password' })

  if (user.status === 'pending')
    return res.status(403).json({
      error: 'Your account is pending admin approval. Please check back later.',
      pending: true,
    })

  if (user.status === 'rejected')
    return res.status(403).json({ error: 'Your account has been rejected. Contact admin for help.' })

  if (user.status === 'paused')
    return res.status(403).json({ error: 'Your account has been paused. Contact admin for help.' })

  const subscriptionActive = isSubscriptionActive(user)

  const token = signToken({ userId: user.id, username: user.username, email: user.email })
  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`)

  updateLastSeen(user.id)

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      subscriptionActive,
      subscriptionExpiry: user.subscriptionExpiry,
      subscriptionWaived: user.subscriptionWaived,
      freeAnalysisUsed: user.freeAnalysisUsed || false,
    },
  })
}