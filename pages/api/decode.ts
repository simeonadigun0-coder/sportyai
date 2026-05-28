import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { code } = req.body
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Booking code is required' })
  }

  const cleanCode = code.trim().toUpperCase()

  const urlsToTry = [
    `https://www.sportybet.com/api/ng/factsCenter/publicShareCode?shareCode=${cleanCode}`,
    `https://www.sportybet.com/api/ng/factsCenter/publicShareCode?shareCode=${cleanCode}&_t=${Date.now()}`,
    `https://www.sportybet.com/api/ng/factsCenter/shareCode?shareCode=${cleanCode}`,
  ]

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.sportybet.com',
    'Referer': 'https://www.sportybet.com/ng/',
    'x-requested-with': 'XMLHttpRequest',
  }

  const debugResults = []

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, { headers: HEADERS })
      const statusCode = response.status
      const responseText = await response.text()

      debugResults.push({
        url,
        status: statusCode,
        response: responseText.substring(0, 500),
      })

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)

          if (data?.bizCode === 0) {
            const outcomeList = data.data?.betInfoData?.betInfoList || []

            if (!outcomeList.length) {
              return res.status(400).json({ error: 'No games found — this booking code may be expired' })
            }

            const games = outcomeList.map((item: Record<string, unknown>) => ({
              eventId: String(item.eventId || item.matchId || item.id || Math.random()),
              homeTeam: (item.homeTeamName as string) || (item.homeName as string) || 'Home',
              awayTeam: (item.awayTeamName as string) || (item.awayName as string) || 'Away',
              market: (item.marketName as string) || '1X2',
              pick: (item.outcomeName as string) || (item.pick as string) || '',
              odds: parseFloat(String(item.odds || item.outcomeOdds || 1)),
              kickoffTime: (item.matchTime as string) || '',
              league: (item.tournamentName as string) || '',
              sport: (item.sport as string) || 'Football',
            }))

            const totalOdds = games.reduce((acc: number, g: { odds: number }) => acc * g.odds, 1)

            return res.status(200).json({
              shareCode: cleanCode,
              totalOdds: parseFloat(totalOdds.toFixed(2)),
              games,
              raw: data,
            })
          }
        } catch {
          // not JSON, continue
        }
      }
    } catch (err) {
      debugResults.push({
        url,
        status: 'network_error',
        response: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  // Return debug info so we can see what's happening
  return res.status(400).json({
    error: 'Could not decode booking code',
    debug: debugResults,
    tip: 'Check the debug field to see what SportyBet returned',
  })
}