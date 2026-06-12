import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'
import type { users } from '../db/schema.js'

export type AuthContext = {
  Variables: {
    authUser: typeof users.$inferSelect
  }
}

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    let bearerToken = c.req.header('Authorization')
    bearerToken = bearerToken?.replace('Bearer ', '')

    if (!bearerToken) {
      throw new HTTPException(401, { message: 'Token mancante o non valido' })
    }

    try {
      jwt.verify(bearerToken, process.env.JWT_SECRET!) as JwtPayload
      await next()
    } catch {
      throw new HTTPException(401, { message: 'Token mancante o non valido' })
    }
  }
}
