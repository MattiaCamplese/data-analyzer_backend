import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { eq, desc, count, ilike } from 'drizzle-orm'
import db from '../db/index.js'
import { summaries } from '../db/schema.js'
import { runSeed } from '../db/seed.js'

const summariesRoute = new Hono().basePath('summaries')

summariesRoute.get('/', async (c) => {
  const domain  = c.req.query('domain')
  const search  = c.req.query('search')
  const page    = c.req.query('page')    ? +c.req.query('page')!    : undefined
  const perPage = c.req.query('perPage') ? +c.req.query('perPage')! : 10

  const where = domain
    ? eq(summaries.domain_name, domain)
    : search
    ? ilike(summaries.domain_name, `%${search}%`)
    : undefined

  const items = await db
    .select()
    .from(summaries)
    .where(where)
    .orderBy(desc(summaries.risk_score))
    .limit(perPage)
    .offset(page ? (page - 1) * perPage : 0)

  const [{ count: totalItems }] = await db
    .select({ count: count() })
    .from(summaries)
    .where(where)

  const totalPages = Math.ceil(totalItems / perPage)

  return c.json({
    items,
    totalItems,
    page,
    perPage,
    totalPages,
    hasNextPage: page ? page < totalPages : false,
    hasPrevPage: page ? page > 1 : false,
  })
})

summariesRoute.get('/:id', async (c) => {
  const { id } = c.req.param()
  const result = await db.select().from(summaries).where(eq(summaries.idsummary, id))
  if (!result.length) throw new HTTPException(404, { message: 'Summary non trovato' })
  return c.json(result[0])
})

summariesRoute.post('/seed', async (c) => {
  await runSeed()
  return c.json({ status: 'success', message: 'Database seeded' })
})

export default summariesRoute
