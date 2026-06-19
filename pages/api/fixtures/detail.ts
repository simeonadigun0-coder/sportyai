import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = requireAuth(req, res)
  if (!auth) return

  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'Event ID required' })

  try {
    const res2 = await fetch(`${BSD_BASE}/events/${id}/`, { headers: bsdHeaders, signal: AbortSignal.timeout(8000) })
    if (!res2.ok) return res.status(502).json({ error: 'BSD API error' })
    const data = await res2.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch event detail' })
  }
}