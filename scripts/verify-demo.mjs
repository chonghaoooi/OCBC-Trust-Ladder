import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'

const bundle = await build({ entryPoints: ['src/store.js'], bundle: true, write: false, platform: 'node', format: 'esm', define: { 'window.location.port': '""', 'window.location.protocol': '"https:"' } })
const { initState, reducer, versionOf, CASES, H } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
assert.equal(Object.keys(CASES).length, 7)
for (const c of Object.values(CASES)) for (const v of Object.values(c.versions)) {
  if (v.status === 'NOT_CHECKED') assert.equal(v.checks, null)
  else assert.deepEqual(Object.keys(v.checks).sort(), ['complete', 'correct', 'current', 'grounded', 'onTarget'])
  if (v.status === 'VERIFIED') assert.ok(Object.values(v.checks).every((x) => x === 'pass'))
}
for (let round = 0; round < 3; round++) {
  let s = initState()
  const send = (a) => { s = reducer(s, { ...a, at: Date.now(), ts: 'Demo test' }) }
  assert.equal(versionOf(s, 'C-001').status, 'REJECTED')
  send({ t: 'SENT', id: 'C-001' }); assert.deepEqual(s.sent, ['C-001'])
  send({ t: 'RESOLVE', id: 'C-014', kind: 'agree' }); assert.ok(s.done.includes('C-014'))
  send({ t: 'RESOLVE', id: 'C-022', kind: 'disagree' }); assert.equal(H.tests.base + s.added, 46)
  send({ t: 'RESOLVE', id: 'C-022', kind: 'disagree' }); assert.equal(s.added, 1)
  send({ t: 'FIX_START' }); send({ t: 'TAB', tab: 'inbox' }); send({ t: 'FIX_DONE' })
  assert.equal(s.fix, 'done'); assert.equal(versionOf(s, 'C-001').status, 'REJECTED')
  send({ t: 'RERUN', id: 'C-001' }); assert.equal(versionOf(s, 'C-001').status, 'VERIFIED')
  assert.ok(!s.sent.includes('C-001'))
  send({ t: 'FEED_EVENT', event: { id: 1, cls: 'req', text: 'payment', agentId: 'payments' } })
  assert.equal(s.events.at(-1).agentId, 'payments')
  send({ t: 'RESET' }); assert.deepEqual({ ...s, epoch: 0 }, initState())
}
const replies = JSON.parse(await readFile('src/data/judgement.json', 'utf8'))
assert.equal(replies.length, 10); assert.equal(replies.filter((r) => r.correct).length, 5)
assert.ok(replies.every((r) => r.sourceText && r.reason))
console.log('PASS: 7 cases, five-check verdicts, 3 complete state walkthroughs, duplicate-decision guard, reset, per-agent events, 10 judgement replies (5 correct / 5 flawed).')
