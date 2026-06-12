import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app.js'

export const config = { api: { bodyParser: false } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https'
  const host = req.headers['x-forwarded-host'] as string ?? req.headers['host'] as string ?? 'localhost'
  const url = `${proto}://${host}${req.url}`

  const bodyChunks: Buffer[] = []
  for await (const chunk of req as AsyncIterable<Buffer>) {
    bodyChunks.push(chunk)
  }
  const rawBody = Buffer.concat(bodyChunks)

  const webReq = new Request(url, {
    method: req.method ?? 'GET',
    headers: req.headers as HeadersInit,
    body: rawBody.length > 0 ? rawBody : undefined,
  })

  const webRes = await app.fetch(webReq)

  res.status(webRes.status)
  webRes.headers.forEach((value, key) => res.setHeader(key, value))
  const buf = await webRes.arrayBuffer()
  res.send(Buffer.from(buf))
}
