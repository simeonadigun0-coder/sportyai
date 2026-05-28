import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = Redis.fromEnv()

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
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
  const keys = await redis.keys('user:id:*')
  if (!keys.length) return []
  const users = await Promise.all(keys.map(k => redis.get<User>(k)))
  return users.filter(Boolean) as User[]
}

export async function updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  const updated = { ...user, status }
  await redis.set(`user:id:${id}`, updated)
  await redis.set(`user:email:${user.email.toLowerCase()}`, updated)
  await redis.set(`user:username:${user.username.toLowerCase()}`, updated)
}

export async function createUser(username: string, email: string, password: string): Promise<User> {
  const passwordHash = bcrypt.hashSync(password, 10)

  // Check if this is the admin account
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