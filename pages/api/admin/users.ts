import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuth } from '@/lib/auth'
import { getAllUsers, updateUserStatus, deleteUser } from '@/lib/users'
import { sendApprovalNotification } from '@/lib/email'

const ADMIN_EMAIL = 'simeonadigun0@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  if (auth.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Admin access required' })
  }

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

    // Handle delete separately
    if (action === 'delete') {
      await deleteUser(userId)
      return res.status(200).json({ success: true, action: 'deleted' })
    }

    const statusMap: Record<string, 'approved' | 'rejected' | 'paused' | 'pending'> = {
      approve: 'approved',
      reject: 'rejected',
      pause: 'paused',
      unpause: 'approved',
    }

    const newStatus = statusMap[action]
    if (!newStatus) return res.status(400).json({ error: 'Invalid action' })

    await updateUserStatus(userId, newStatus)

    // Send approval email
    if (action === 'approve') {
      const users = await getAllUsers()
      const targetUser = users.find(u => u.id === userId)
      if (targetUser) sendApprovalNotification(targetUser.username, targetUser.email)
    }

    return res.status(200).json({ success: true, status: newStatus })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}