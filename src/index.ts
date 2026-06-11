import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import summariesRoute from './routes/summaries.route.js'

const app = new Hono()

app.use('/api/*', cors({ origin: '*' }))

app.route('/api', summariesRoute)

app.onError((error, c) => {
  console.error(error)
  if (error instanceof HTTPException) {
    return c.json({ message: error.message }, error.status)
  }
  return c.json({ message: 'Errore del server' }, 500)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
