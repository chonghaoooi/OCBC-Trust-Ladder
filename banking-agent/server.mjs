import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// One local demo process serves two separate sites and relays their live events.
const history = []
const subscribers = new Set()
let nextId = 0
let fixed = false
const dashboardRoot = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const frame = (event) => `id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`

function publish(data) {
  const event = { ...data, id: ++nextId }
  history.push(event)
  if (history.length > 500) history.shift()
  for (const response of subscribers) response.write(frame(event))
}

function handler(site) {
  return async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname
    res.setHeader('Cache-Control', 'no-store')
    if (path === '/demo-bridge.js') {
      const script = await readFile(new URL('../public/demo-bridge.js', import.meta.url))
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }).end(script); return
    }

    if (path === '/api/demo') {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ fixed })); return
      }
      if (site === 'engineer' && req.method === 'DELETE') {
        fixed = false; history.length = 0; publish({ reset: true })
        res.writeHead(204).end(); return
      }
      if (site === 'engineer' && req.method === 'POST') {
        try {
          let body = ''
          for await (const chunk of req) { body += chunk; if (body.length > 1024) { res.writeHead(413).end(); return } }
          const data = JSON.parse(body)
          if (typeof data.fixed !== 'boolean') { res.writeHead(400).end(); return }
          fixed = data.fixed; res.writeHead(204).end()
        } catch { res.writeHead(400).end() }
        return
      }
      res.writeHead(405).end(); return
    }

    if (site === 'engineer' && path === '/api/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' })
      res.write(': connected\n\n')
      const lastId = Number(req.headers['last-event-id'] || 0)
      for (const event of history) if (event.id > lastId) res.write(frame(event))
      subscribers.add(res)
      const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000)
      res.on('close', () => { clearInterval(heartbeat); subscribers.delete(res) })
      return
    }

    if (site === 'chat' && path === '/api/events' && req.method === 'POST') {
      try {
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (body.length > 16384) { res.writeHead(413).end(); return }
        }
        const data = JSON.parse(body)
        const agentId = ['card-servicing', 'payments', 'policy'].includes(data.agentId) ? data.agentId : 'card-servicing'
        const meta = { agentId, runId: typeof data.runId === 'string' ? data.runId.slice(0, 128) : null }
        if (data.state === 'idle' || data.state === 'working…') {
          publish({ ...meta, state: data.state })
        } else if (['info', 'req', 'res', 'success', 'fail', 'warn', 'notify'].includes(data.cls)
          && typeof data.text === 'string' && typeof data.ts === 'string') {
          publish({ ...meta, cls: data.cls, text: data.text, ts: data.ts })
        } else { res.writeHead(400).end(); return }
        res.writeHead(204).end()
      } catch { res.writeHead(400).end() }
      return
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
    // Keep old bookmarks working while each site's home is now its own app.
    if (site === 'chat' && path === '/engineer.html') {
      res.writeHead(302, { Location: 'http://localhost:4181/' }).end(); return
    }
    if (site === 'engineer') {
      try {
        const relative = ['/', '/index.html', '/engineer.html'].includes(path) ? 'index.html' : decodeURIComponent(path).replace(/^\/+/, '')
        const target = resolve(dashboardRoot, relative)
        if (!target.startsWith(dashboardRoot + sep) && target !== resolve(dashboardRoot, 'index.html')) { res.writeHead(403).end(); return }
        const data = await readFile(target)
        const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.json': 'application/json' }
        res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' })
        res.end(req.method === 'HEAD' ? undefined : data)
      } catch { res.writeHead(404).end('Dashboard asset not found. Run npm run build first.') }
      return
    }
    if (!['/', '/index.html', '/chat.html'].includes(path)) {
      res.writeHead(404).end('Not found'); return
    }
    try {
      const file = './index.html'
      const html = await readFile(new URL(file, import.meta.url))
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(req.method === 'HEAD' ? undefined : html)
    } catch { res.writeHead(500).end('Unable to load site') }
  }
}

const servers = [[4180, 'chat'], [4181, 'engineer']].map(([port, site]) => {
  const server = http.createServer(handler(site))
  server.on('error', (error) => {
    console.error(`Cannot start ${site} site on port ${port}: ${error.message}`)
    process.exit(1)
  })
  server.listen(port, '127.0.0.1', () => console.log(`${site}: http://localhost:${port}/`))
  return server
})

function shutdown() {
  for (const response of subscribers) response.end()
  for (const server of servers) server.close()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
