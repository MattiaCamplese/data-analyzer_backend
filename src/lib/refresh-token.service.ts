import { eq } from 'drizzle-orm'
import db from '../db/index.js'
import { refreshTokens } from '../db/schema.js'
import { generateRefreshToken, hashToken } from './utils.js'

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = generateRefreshToken()
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  })
  return token
}

export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ userId: string; refreshToken: string }> {
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashToken(rawToken)))

  if (!row || row.expiresAt < new Date()) {
    throw new Error('Refresh token non valido o scaduto')
  }

  await db.delete(refreshTokens).where(eq(refreshTokens.id, row.id))
  const refreshToken = await issueRefreshToken(row.userId)
  return { userId: row.userId, refreshToken }
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(rawToken)))
}
