import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = Redis.fromEnv()

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'paused'
  isAdmin: boolean
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const user = await redis.get<User>(`user:email:${email.toLowerCase()}`)
  return user || undefined
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const user = await redis.get<User>(`user:username:${username.toLowerCase()}`)
  return user || undefined
}

export async function findUserById(id: string): Promise<User | undefined> {
  const user = await redis.get<User>(`user:id:${id}`)
  return user || undefined
}

export async function getAllUsers(): Promise<User[]> {
  const idKeys = await redis.keys('user:id:*')
  const emailKeys = await redis.keys('user:email:*')

  const allUsers: User[] = []
  const seenIds = new Set<string>()

  if (idKeys.length) {
    const users = await Promise.all(idKeys.map(k => redis.get<User>(k)))
    for (const u of users) {
      if (u && !seenIds.has(u.id)) {
        seenIds.add(u.id)
        allUsers.push(u)
      }
    }
  }

  if (emailKeys.length) {
    const users = await Promise.all(emailKeys.map(k => redis.get<User>(k)))
    for (const u of users) {
      if (u && u.id && !seenIds.has(u.id)) {
        seenIds.add(u.id)
        const fixed: User = {
          ...u,
          status: u.status || 'approved',
          isAdmin: u.email?.toLowerCase() === 'simeonadigun0@gmail.com',
        }
        allUsers.push(fixed)
        await redis.set(`user:id:${u.id}`, fixed)
      }
    }
  }

  return allUsers
}

export async function updateUserStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'paused'
): Promise<void> {
  let user = await findUserById(id)

  if (!user) {
    const emailKeys = await redis.keys('user:email:*')
    const users = await Promise.all(emailKeys.map(k => redis.get<User>(k)))
    user = users.find(u => u?.id === id) as User | undefined
  }

  if (!user) return

  const updated = { ...user, status }
  await redis.set(`user:id:${id}`, updated)
  await redis.set(`user:email:${user.email.toLowerCase()}`, updated)
  await redis.set(`user:username:${user.username.toLowerCase()}`, updated)
}

export async function deleteUser(id: string): Promise<void> {
  let user = await findUserById(id)

  if (!user) {
    const emailKeys = await redis.keys('user:email:*')
    const users = await Promise.all(emailKeys.map(k => redis.get<User>(k)))
    user = users.find(u => u?.id === id) as User | undefined
  }

  if (!user) return

  await redis.del(`user:id:${id}`)
  await redis.del(`user:email:${user.email.toLowerCase()}`)
  await redis.del(`user:username:${user.username.toLowerCase()}`)
}

export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const passwordHash = bcrypt.hashSync(password, 10)
  const isAdmin = email.toLowerCase() === 'simeonadigun0@gmail.com'

  const user: User = {
    id: Date.now().toString(),
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
    status: isAdmin ? 'approved' : 'pending',
    isAdmin,
  }

  await redis.set(`user:email:${email.toLowerCase()}`, user)
  await redis.set(`user:username:${username.toLowerCase()}`, user)
  await redis.set(`user:id:${user.id}`, user)
  return user
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash)
}

export async function updateLastSeen(userId: string): Promise<void> {
  try {
    await redis.set(`user:lastseen:${userId}`, new Date().toISOString())
  } catch { /* non-critical */ }
}

export async function getLastSeen(userId: string): Promise<string | null> {
  try {
    return await redis.get<string>(`user:lastseen:${userId}`)
  } catch { return null }
}