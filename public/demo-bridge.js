// Browser-only transport for the hosted scripted prototype. Nothing leaves the visitor's browser.
;(() => {
  const EVENT_KEY = 'trustladder.demo.events.v1'
  const FIX_KEY = 'trustladder.demo.fix.v1'
  const MAX_AGE = 60 * 60 * 1000
  const listeners = new Set()
  let memory = []
  let memoryFixed = false
  let counter = 0
  const source = Math.random().toString(36).slice(2)
  let channel
  try { channel = new BroadcastChannel('trustladder-demo-v1') } catch { /* Storage events remain available. */ }
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]')
      return Array.isArray(value) ? value.filter((e) => e && Date.now() - e.createdAt < MAX_AGE).slice(-500) : []
    } catch { return memory }
  }
  const seen = new Set(read().map((e) => e.id))
  const receive = (event) => {
    if (!event || seen.has(event.id)) return
    seen.add(event.id)
    if (seen.size > 1500) { seen.clear(); read().forEach((e) => seen.add(e.id)) }
    listeners.forEach((listener) => listener(event))
  }
  if (channel) channel.onmessage = ({ data }) => receive(data)
  window.addEventListener('storage', (event) => { if (event.key === EVENT_KEY) read().forEach(receive) })
  const publish = (data) => {
    const event = { ...data, id: `${Date.now()}-${source}-${++counter}`, createdAt: Date.now() }
    memory = [...read(), event].slice(-500)
    try { localStorage.setItem(EVENT_KEY, JSON.stringify(memory)) } catch { /* Keep working in this tab. */ }
    receive(event)
    channel?.postMessage(event)
    return event
  }
  window.TrustLadderDemo = {
    publish,
    subscribe(listener) {
      read().forEach(listener)
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState() {
      try { return { fixed: localStorage.getItem(FIX_KEY) === 'true' } } catch { return { fixed: memoryFixed } }
    },
    setFixed(fixed) {
      memoryFixed = Boolean(fixed)
      try { localStorage.setItem(FIX_KEY, String(memoryFixed)) } catch { /* Browser storage can be disabled. */ }
    },
    reset() {
      memory = []; this.setFixed(false)
      try { localStorage.removeItem(EVENT_KEY) } catch { /* Keep working in this tab. */ }
      publish({ reset: true })
    },
  }
})()
