import { NextApiRequest, NextApiResponse } from 'next'
import { findUserByEmail, verifyPassword } from '@/lib/users'
import { signToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = findUserByEmail(email)
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken({ userId: user.id, username: user.username, email: user.email })

  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`)
  return res.status(200).json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  })
}
