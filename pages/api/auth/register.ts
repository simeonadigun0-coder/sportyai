import { NextApiRequest, NextApiResponse } from 'next'
import { createUser, findUserByEmail, findUserByUsername } from '@/lib/users'
import { signToken } from '@/lib/auth'
import { sendNewUserNotification } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, email, password } = req.body

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Username, email and password are required' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' })

  if (await findUserByEmail(email))
    return res.status(409).json({ error: 'Email already registered' })

  if (await findUserByUsername(username))
    return res.status(409).json({ error: 'Username already taken' })

  const user = await createUser(username.trim(), email.toLowerCase().trim(), password)

  // Send email notification to admin (non-blocking)
  if (!user.isAdmin) {
    sendNewUserNotification(user.username, user.email, user.id)
  }

  // If admin, login immediately
  if (user.isAdmin) {
    const token = signToken({ userId: user.id, username: user.username, email: user.email })
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`)
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, status: user.status },
    })
  }

  // Regular user — account pending
  return res.status(201).json({
    pending: true,
    message: 'Registration successful! Your account is pending admin approval. You will be notified by email once approved.',
  })
}