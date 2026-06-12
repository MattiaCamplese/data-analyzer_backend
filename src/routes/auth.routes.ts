import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import z from 'zod'
import db from '../db/index.js'
import { users } from '../db/schema.js'
import { generateJwt } from '../lib/utils.js'
import { type AuthContext, authMiddleware } from '../middleware/auth.middleware.js'

const authRoute = new Hono<AuthContext>().basePath('auth')

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRoute.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) {
    throw new HTTPException(401, { message: 'Email o password non validi' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new HTTPException(401, { message: 'Email o password non validi' })
  }

  const token = generateJwt(user.email)
  const { password: _, ...userSafe } = user
  return c.json({ token, user: userSafe })
})

authRoute.get('/me', authMiddleware(), async (c) => {
  const user = c.get('authUser')
  const { password: _, ...userSafe } = user
  return c.json(userSafe)
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

authRoute.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const [existing] = await db.select().from(users).where(eq(users.email, email))
  if (existing) {
    throw new HTTPException(409, { message: 'Email già registrata' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const [user] = await db.insert(users).values({ email, password: hashed }).returning()
  const { password: _, ...userSafe } = user
  const token = generateJwt(user.email)

  return c.json({ token, user: userSafe }, 201)
})

export default authRoute
