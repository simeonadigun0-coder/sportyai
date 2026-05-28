import jwt from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'

const SECRET = process.env.JWT_SECRET || 'fallback_secret_change_this'

export function signToken(payload: { userId: string; username: string; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; username: string; email: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: string; username: string; email: string }
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const cookie = req.headers.cookie
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): { userId: string; username: string; email: string } | null {
  const token = getTokenFromRequest(req)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - please login' })
    return null
  }
  const decoded = verifyToken(token)
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token - please login again' })
    return null
  }
  return decoded
}
