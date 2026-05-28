import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { getAllUsers, updateUserStatus, findUserByEmail } from '@/lib/users'
import { sendApprovalNotification } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  // Check if admin
  const user = await findUserByEmail(auth.email)
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' })

  if (req.method === 'GET') {
    const users = await getAllUsers()
    const sorted = users.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return res.status(200).json(sorted)
  }

  if (req.method === 'POST') {
    const { userId, action } = req.body
    if (!userId || !action) return res.status(400).json({ error: 'userId and action required' })

    const status = action === 'approve' ? 'approved' : 'rejected'
    await updateUserStatus(userId, status)

    // Send approval email
    const users = await getAllUsers()
    const targetUser = users.find(u => u.id === userId)
    if (targetUser && status === 'approved') {
      sendApprovalNotification(targetUser.username, targetUser.email)
    }

    return res.status(200).json({ success: true, status })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}