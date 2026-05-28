import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code required' })

  const cleanCode = code.trim().toUpperCase()
  const url = `https://www.sportybet.com/api/ng/orders/share/${cleanCode}?_t=${Date.now()}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en',
        'Origin': 'https://www.sportybet.com',
        'Referer': 'https://www.sportybet.com/ng/',
        'Clientid': 'web',
      }
    })

    const text = await response.text()
    
    // Parse the full JSON properly
    const data = JSON.parse(text)

    return res.status(200).json({
      httpStatus: response.status,
      url,
      rawResponse: text,
      parsed: data,
    })

  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'fetch failed',
      url,
    })
  }
}