import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { eq, desc, count, ilike, sql } from 'drizzle-orm'
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

summariesRoute.post('/', async (c) => {
  const body = await c.req.json()
  const items = Array.isArray(body) ? body : [body]

  if (items.length === 0) {
    throw new HTTPException(400, { message: 'Nessun record da inserire' })
  }

  // Upsert: se idsummary esiste aggiorna tutti i campi, altrimenti inserisce
  const result = await db
    .insert(summaries)
    .values(items)
    .onConflictDoUpdate({
      target: summaries.idsummary,
      set: {
        domain_name:                 sql`excluded.domain_name`,
        risk_score:                  sql`excluded.risk_score`,
        creation_date:               sql`excluded.creation_date`,
        last_edit:                   sql`excluded.last_edit`,
        summary_text:                sql`excluded.summary_text`,
        summary_text_en:             sql`excluded.summary_text_en`,
        servizi_esposti_score:       sql`excluded.servizi_esposti_score`,
        dataleak_score:              sql`excluded.dataleak_score`,
        rapporto_leak_email_score:   sql`excluded.rapporto_leak_email_score`,
        spoofing_score:              sql`excluded.spoofing_score`,
        open_ports_score:            sql`excluded.open_ports_score`,
        blacklist_score:             sql`excluded.blacklist_score`,
        vulnerability_score_active:  sql`excluded.vulnerability_score_active`,
        vulnerability_score_passive: sql`excluded.vulnerability_score_passive`,
        certificate_score:           sql`excluded.certificate_score`,
        n_cert_attivi:               sql`excluded.n_cert_attivi`,
        n_cert_scaduti:              sql`excluded.n_cert_scaduti`,
        n_asset:                     sql`excluded.n_asset`,
        n_similar_domains:           sql`excluded.n_similar_domains`,
        unique_ipv4:                 sql`excluded.unique_ipv4`,
        unique_ipv6:                 sql`excluded.unique_ipv6`,
        n_port:                      sql`excluded.n_port`,
        email_security:              sql`excluded.email_security`,
        n_dataleak:                  sql`excluded.n_dataleak`,
        n_vulns:                     sql`excluded.n_vulns`,
        waf:                         sql`excluded.waf`,
        cdn:                         sql`excluded.cdn`,
      },
    })
    .returning({ idsummary: summaries.idsummary })

  return c.json({ status: 'success', inserted: result.length })
})

summariesRoute.post('/seed', async (c) => {
  await runSeed()
  return c.json({ status: 'success', message: 'Database seeded' })
})

export default summariesRoute
