import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import summariesRoute from './routes/summaries.route.js'
import authRoute from './routes/auth.routes.js'
import { authMiddleware } from './middleware/auth.middleware.js'

const app = new Hono()

app.use('/api/*', cors({ origin: '*' }))

app.route('/api', authRoute)
app.use('/api/summaries/*', authMiddleware())
app.route('/api', summariesRoute)

app.onError((error, c) => {
  console.error(error)
  if (error instanceof HTTPException) {
    return c.json({ message: error.message }, error.status)
  }
  return c.json({ message: 'Errore del server' }, 500)
})

export default app
