import bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'

const JWT_SECRET = 'expense-tracker-secret-key-2024'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createToken(payload: { userId: string; email: string }): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }))

  const signatureInput = `${header}.${body}`
  const sig = createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64url')

  return `${header}.${body}.${sig}`
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp < Date.now()) return null

    const signatureInput = `${parts[0]}.${parts[1]}`
    const expectedSig = createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64url')

    if (parts[2] !== expectedSig) return null

    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}

export function getUserFromRequest(request: Request): { userId: string; email: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  return verifyToken(token)
}