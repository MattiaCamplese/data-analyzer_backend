import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export function generateAccessToken(email: string): string {
  return jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
