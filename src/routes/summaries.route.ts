import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { eq, desc, count, ilike, max, and, getTableColumns } from 'drizzle-orm'
import db from '../db/index.js'
import { summaries } from '../db/schema.js'
import { runSeed } from '../db/seed.js'

const summariesRoute = new Hono().basePath('summaries')

// GET / — list; ?latest=true returns only the most recent scan per domain
summariesRoute.get('/', async (c) => {
  const domain  = c.req.query('domain')
  const search  = c.req.query('search')
  const latest  = c.req.query('latest') === 'true'
  const page    = c.req.query('page')    ? +c.req.query('page')!    : undefined
  const perPage = c.req.query('perPage') ? +c.req.query('perPage')! : undefined

  const nameFilter = domain
    ? eq(summaries.domain_name, domain)
    : search
    ? ilike(summaries.domain_name, `%${search}%`)
    : undefined

  if (latest) {
    // Subquery: one row per domain = the one with the highest creation_date
    const sub = db
      .select({
        domain_name: summaries.domain_name,
        max_date: max(summaries.creation_date).as('max_date'),
      })
      .from(summaries)
      .where(nameFilter)
      .groupBy(summaries.domain_name)
      .as('sub')

    const allItems = await db
      .select(getTableColumns(summaries))
      .from(summaries)
      .innerJoin(sub, and(
        eq(summaries.domain_name, sub.domain_name),
        eq(summaries.creation_date, sub.max_date),
      ))
      .orderBy(desc(summaries.risk_score))

    const totalItems = allItems.length
    const totalPages = perPage ? Math.ceil(totalItems / perPage) : 1
    const items = perPage && page
      ? allItems.slice((page - 1) * perPage, page * perPage)
      : allItems

    return c.json({
      items,
      totalItems,
      page,
      perPage,
      totalPages,
      hasNextPage: (page && perPage) ? page < totalPages : false,
      hasPrevPage: (page && perPage) ? page > 1 : false,
    })
  }

  // Default: all scans (no deduplication)
  const where = nameFilter
  const items = perPage
    ? await db.select().from(summaries).where(where).orderBy(desc(summaries.risk_score))
        .limit(perPage).offset(page ? (page - 1) * perPage : 0)
    : await db.select().from(summaries).where(where).orderBy(desc(summaries.risk_score))

  const [{ count: totalItems }] = await db.select({ count: count() }).from(summaries).where(where)
  const totalPages = perPage ? Math.ceil(totalItems / perPage) : 1

  return c.json({
    items,
    totalItems,
    page,
    perPage,
    totalPages,
    hasNextPage: (page && perPage) ? page < totalPages : false,
    hasPrevPage: (page && perPage) ? page > 1 : false,
  })
})

// GET /history/:domain — all scans for a given domain, newest first
// Must be defined BEFORE /:id to avoid being swallowed by the wildcard
summariesRoute.get('/history/:domain', async (c) => {
  const domain = decodeURIComponent(c.req.param('domain'))
  const items = await db
    .select()
    .from(summaries)
    .where(eq(summaries.domain_name, domain))
    .orderBy(desc(summaries.creation_date))
  return c.json({ items, total: items.length })
})

// GET /:id — single scan by UUID or domain name
summariesRoute.get('/:id', async (c) => {
  const { id } = c.req.param()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const where = isUUID
    ? eq(summaries.idsummary, id)
    : eq(summaries.domain_name, decodeURIComponent(id))
  const result = await db.select().from(summaries).where(where)
  if (!result.length) throw new HTTPException(404, { message: 'Summary non trovato' })
  return c.json(result[0])
})

summariesRoute.post('/', async (c) => {
  const body = await c.req.json()
  const items: unknown[] = Array.isArray(body) ? body : [body]

  if (items.length === 0) {
    throw new HTTPException(400, { message: 'Nessun record da inserire' })
  }

  const firstItem = items[0] as Record<string, unknown>
  if (!firstItem?.idsummary) {
    const keys = Object.keys(firstItem ?? {}).slice(0, 10).join(', ')
    throw new HTTPException(422, {
      message: `Campo "idsummary" mancante. Chiavi ricevute: [${keys || 'nessuna'}]`,
    })
  }

  const intFields = [
    'risk_score', 'servizi_esposti_score', 'dataleak_score', 'rapporto_leak_email_score',
    'spoofing_score', 'open_ports_score', 'blacklist_score', 'vulnerability_score_active',
    'vulnerability_score_passive', 'certificate_score', 'n_cert_attivi', 'n_cert_scaduti',
    'n_asset', 'n_similar_domains', 'unique_ipv4', 'unique_ipv6',
  ]

  let inserted = 0
  for (const raw of items) {
    const item = { ...(raw as Record<string, unknown>) }
    for (const f of intFields) {
      if (typeof item[f] === 'string') item[f] = parseInt(item[f] as string, 10)
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(summaries).values(item as any).onConflictDoNothing()
      inserted++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new HTTPException(422, { message: `Errore inserimento record: ${msg}` })
    }
  }

  return c.json({ status: 'success', inserted })
})

summariesRoute.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const result = await db
    .delete(summaries)
    .where(eq(summaries.idsummary, id))
    .returning({ idsummary: summaries.idsummary })
  if (!result.length) throw new HTTPException(404, { message: 'Summary non trovato' })
  return c.json({ status: 'success', deleted: id })
})

summariesRoute.post('/seed', async (c) => {
  await runSeed()
  return c.json({ status: 'success', message: 'Database seeded' })
})

export default summariesRoute
