import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile('public/demo-bridge.js', 'utf8')
function visitor() {
  const values = new Map(), tabs = [], channels = []
  return () => {
    const listeners = []
    const window = { addEventListener: (type, fn) => { if (type === 'storage') listeners.push(fn) } }
    const tab = { window, listeners }; tabs.push(tab)
    const localStorage = {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => { values.set(key, value); tabs.filter((t) => t !== tab).forEach((t) => t.listeners.forEach((fn) => fn({ key }))) },
      removeItem: (key) => values.delete(key),
    }
    class BroadcastChannel {
      constructor() { channels.push(this) }
      postMessage(data) { channels.filter((c) => c !== this).forEach((c) => c.onmessage?.({ data })) }
    }
    vm.runInNewContext(source, { window, localStorage, BroadcastChannel, Date, Math, Set, JSON })
    return window.TrustLadderDemo
  }
}
const createTab = visitor()
const dashboard = createTab(), banker = createTab(), received = []
dashboard.subscribe((e) => received.push(e))
banker.publish({ agentId: 'payments', cls: 'req', text: 'quote_transfer' })
assert.equal(received.length, 1, 'storage and BroadcastChannel delivery must not duplicate events')
assert.equal(received[0].agentId, 'payments')
dashboard.setFixed(true); assert.equal(banker.getState().fixed, true)
const replays = []; createTab().subscribe((e) => replays.push(e))
assert.equal(replays.length, 1, 'opening the dashboard later replays the history')
const stranger = visitor()(), isolated = []; stranger.subscribe((e) => isolated.push(e))
assert.equal(isolated.length, 0, 'another visitor must have an independent demo')
dashboard.reset(); assert.equal(banker.getState().fixed, false)
assert.equal(received.at(-1).reset, true)
const afterReset = []; createTab().subscribe((e) => afterReset.push(e))
assert.equal(afterReset.length, 1); assert.equal(afterReset[0].reset, true)
console.log('PASS: hosted cross-tab delivery, replay, deduplication, fix state, reset, and visitor isolation.')
