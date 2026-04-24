import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'admin_token'
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'insecure-default-change-in-production'
)

// Rate limiting simples em memória
// Obs: em serverless cada instância tem seu próprio mapa — funciona bem para uso pessoal
const attempts = new Map<string, { count: number; lockedUntil: number }>()

export function checkRateLimit(ip: string): { allowed: boolean; waitSeconds: number } {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (entry && entry.lockedUntil > now) {
    return { allowed: false, waitSeconds: Math.ceil((entry.lockedUntil - now) / 1000) }
  }

  return { allowed: true, waitSeconds: 0 }
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip) || { count: 0, lockedUntil: 0 }
  entry.count += 1

  if (entry.count >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000 // bloqueia 15 min
    entry.count = 0
  }

  attempts.set(ip, entry)
}

export function clearAttempts(ip: string) {
  attempts.delete(ip)
}

export async function verifyPassword(plain: string): Promise<boolean> {
  // Prioriza hash bcrypt se configurado
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(plain, process.env.ADMIN_PASSWORD_HASH)
  }
  // Fallback para senha em texto simples (compatibilidade)
  return plain === process.env.ADMIN_PASSWORD
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifyAdminToken(token)
}

export { COOKIE_NAME }
