import { NextApiRequest, NextApiResponse } from 'next'
import { getAllUsers, updateUserSubscription } from '@/lib/users'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

export const config = { api: { bodyParser: false } }

async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const signature = req.headers['x-paystack-signature'] as string

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'charge.success' || event.event === 'subscription.create') {
    const email = event.data?.customer?.email
    if (email) {
      const users = await getAllUsers()
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (user) {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)
        await updateUserSubscription(user.id, {
          subscriptionExpiry: expiry.toISOString(),
        })
      }
    }
  }

  return res.status(200).json({ received: true })
}