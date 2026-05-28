import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = Redis.fromEnv()

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: string
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const user = await redis.get<User>(`user:email:${email.toLowerCase()}`)
  return user || undefined
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const user = await redis.get<User>(`user:username:${username.toLowerCase()}`)
  return user || undefined
}

export async function createUser(username: string, email: string, password: string): Promise<User> {
  const passwordHash = bcrypt.hashSync(password, 10)
  const user: User = {
    id: Date.now().toString(),
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  await redis.set(`user:email:${email.toLowerCase()}`, user)
  await redis.set(`user:username:${username.toLowerCase()}`, user)
  return user
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash)
}