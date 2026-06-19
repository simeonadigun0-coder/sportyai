import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'

const BSD_BASE = 'https://sports.bzzoiro.com/api'
const BSD_TOKEN = process.env.BSD_API_KEY || ''
const bsdHeaders = { 'Authorization': `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = requireAuth(req, res)
  if (!auth) return

  const { dateFrom, dateTo, limit = 100 } = req.body
  const today = new Date().toISOString().split('T')[0]

  try {
    const url = `${BSD_BASE}/events/?date_from=${dateFrom || today}&date_to=${dateTo || today}&limit=${limit}&sport=1`
    const res2 = await fetch(url, { headers: bsdHeaders, signal: AbortSignal.timeout(10000) })
    if (!res2.ok) return res.status(502).json({ error: 'BSD API error' })
    const data = await res2.json()
    return res.status(200).json({ fixtures: data.results || [], total: data.count || 0 })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch fixtures' })
  }
}