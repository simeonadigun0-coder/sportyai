import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = Redis.fromEnv()

export type SubscriptionTier = 'free' | 'basic' | 'pro'

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'paused'
  isAdmin: boolean
  // Subscription
  subscriptionWaived?: boolean
  subscriptionExpiry?: string | null
  subscriptionTier?: SubscriptionTier
  // Profile
  fullName?: string
  phone?: string
  // Usage tracking
  freeAnalysisUsed?: boolean
  freeValueBetsUsed?: number
  freeBuilderUsed?: number
  slipsOptimised?: number
  lastActive?: string
}

// ─── FIND HELPERS ──────────────────────────────────────────────────────────
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

async function saveUser(user: User): Promise<void> {
  await redis.set(`user:id:${user.id}`, user)
  await redis.set(`user:email:${user.email.toLowerCase()}`, user)
  await redis.set(`user:username:${user.username.toLowerCase()}`, user)
}

export async function getAllUsers(): Promise<User[]> {
  const idKeys = await redis.keys('user:id:*')
  const emailKeys = await redis.keys('user:email:*')
  const allUsers: User[] = []
  const seenIds = new Set<string>()

  if (idKeys.length) {
    const users = await Promise.all(idKeys.map(k => redis.get<User>(k)))
    for (const u of users) {
      if (u && !seenIds.has(u.id)) { seenIds.add(u.id); allUsers.push(u) }
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

// ─── SUBSCRIPTION HELPERS ──────────────────────────────────────────────────
export function isSubscriptionActive(user: User): boolean {
  if (user.isAdmin) return true
  if (user.subscriptionWaived) return true
  if (!user.subscriptionExpiry) return false
  return new Date(user.subscriptionExpiry) > new Date()
}

export function getSubscriptionTier(user: User): SubscriptionTier {
  if (user.isAdmin) return 'pro'
  if (user.subscriptionWaived) return 'pro'
  if (!isSubscriptionActive(user)) return 'free'
  // Existing subscribers before tier system get Pro automatically
  if (!user.subscriptionTier) return 'pro'
  return user.subscriptionTier
}

export function canAccessProFeatures(user: User): boolean {
  return getSubscriptionTier(user) === 'pro'
}

export function canAccessBasicFeatures(user: User): boolean {
  const tier = getSubscriptionTier(user)
  return tier === 'basic' || tier === 'pro'
}

// ─── UPDATE HELPERS ────────────────────────────────────────────────────────
export async function updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'paused'): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, status })
}

export async function updateUserSubscription(
  id: string,
  data: { subscriptionExpiry?: string | null; subscriptionWaived?: boolean; subscriptionTier?: SubscriptionTier }
): Promise<void> {
  const user = await findUserById(id)
  if (!user) {
    const emailKeys = await redis.keys('user:email:*')
    const users = await Promise.all(emailKeys.map(k => redis.get<User>(k)))
    const found = users.find(u => u?.id === id) as User | undefined
    if (!found) return
    await saveUser({ ...found, ...data })
    return
  }
  await saveUser({ ...user, ...data })
}

export async function updateUserProfile(
  id: string,
  data: { fullName?: string; phone?: string }
): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, ...data })
}

export async function updateLastActive(id: string): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, lastActive: new Date().toISOString() })
}

export async function incrementSlipsOptimised(id: string): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, slipsOptimised: (user.slipsOptimised || 0) + 1 })
}

export async function deleteUser(id: string): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await redis.del(`user:id:${id}`)
  await redis.del(`user:email:${user.email.toLowerCase()}`)
  await redis.del(`user:username:${user.username.toLowerCase()}`)
}

export async function createUser(username: string, email: string, password: string): Promise<User> {
  const passwordHash = bcrypt.hashSync(password, 10)
  const isAdmin = email.toLowerCase() === 'simeonadigun0@gmail.com'
  const user: User = {
    id: Date.now().toString(),
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
    status: 'approved',
    isAdmin,
    subscriptionWaived: isAdmin,
    subscriptionExpiry: null,
    subscriptionTier: isAdmin ? 'pro' : 'free',
    slipsOptimised: 0,
    freeAnalysisUsed: false,
    freeValueBetsUsed: 0,
    freeBuilderUsed: 0,
    lastActive: new Date().toISOString(),
  }
  await saveUser(user)
  return user
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash)
}

export async function updateLastSeen(userId: string): Promise<void> {
  try {
    await redis.set(`user:lastseen:${userId}`, new Date().toISOString())
    await updateLastActive(userId)
  } catch { }
}

export async function getLastSeen(userId: string): Promise<string | null> {
  try { return await redis.get<string>(`user:lastseen:${userId}`) } catch { return null }
}

export async function markFreeAnalysisUsed(id: string): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, freeAnalysisUsed: true })
}

export async function incrementFreeValueBetsUsed(id: string): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, freeValueBetsUsed: (user.freeValueBetsUsed || 0) + 1 })
}

export async function incrementFreeBuilderUsed(id: string): Promise<void> {
  const user = await findUserById(id)
  if (!user) return
  await saveUser({ ...user, freeBuilderUsed: (user.freeBuilderUsed || 0) + 1 })
}