import { createContext, useContext } from 'react'
import cases from './data/cases.json'
import health from './data/agentHealth.json'
import agents from './data/agents.json'

export const CASES = Object.fromEntries(cases.map((c) => [c.id, c]))
export const INBOX_ORDER = ['C-001', 'C-014', 'C-022', 'C-009', 'C-040', 'C-031', 'C-052']
export const H = health
export const AGENTS = agents
export const RELAY = window.location.port === '4181'
export const BANKER_URL = RELAY || window.location.protocol === 'file:' ? 'http://localhost:4180/' : '/banker/'
export const initState = () => ({
  tab: 'inbox', caseId: null, epoch: 0,
  seen: [], sent: [], done: [], rerun: [], decisions: {},
  added: 0, fix: 'idle', fixStarted: null, toast: null,
  events: [], connection: RELAY ? 'connecting' : 'local', agentState: 'idle', agentStates: {},
})
const toast = (s, text) => ({ ...s, toast: { text, n: (s.toast?.n || 0) + 1 } })
const activity = (s, a, cls, text) => ({ ...s, events: [...s.events, {
  key: `dashboard-${a.at}-${s.events.length}`, cls, text, ts: a.ts || 'Demo', origin: 'Dashboard', agentId: a.agentId || 'card-servicing',
}].slice(-500) })

export function reducer(s, a) {
  switch (a.t) {
    case 'TAB': return { ...s, tab: a.tab, caseId: null }
    case 'OPEN': return { ...s, caseId: a.id }
    case 'SEEN': return s.seen.includes(a.id) ? s : { ...s, seen: [...s.seen, a.id] }
    case 'RERUN': {
      const next = s.fix === 'done' && CASES[a.id]?.versions.afterFix
        ? { ...s, rerun: [...new Set([...s.rerun, a.id])], sent: s.sent.filter((x) => x !== a.id) } : s
      return activity(next, a, versionOf(next, a.id).status === 'VERIFIED' ? 'success' : 'fail',
        `[${versionOf(next, a.id).status === 'VERIFIED' ? 'success' : 'fail'}] ${a.id}: scripted re-run → ${versionOf(next, a.id).status === 'VERIFIED' ? 'Verified' : 'Rejected'}`)
    }
    case 'SENT': {
      if (s.sent.includes(a.id)) return s
      return toast(activity({ ...s, sent: [...s.sent, a.id] }, a, 'notify', `[notify] ${a.id}: reviewed reply marked sent (demo)`), 'Reply sent · demo only')
    }
    case 'RESOLVE': {
      if (s.done.includes(a.id)) return s
      const next = activity({ ...s, done: [...s.done, a.id], caseId: null,
        decisions: { ...s.decisions, [a.id]: a.kind }, added: s.added + (a.kind === 'disagree' ? 1 : 0),
      }, a, 'info', `[review] ${a.id}: supervisor chose ${a.kind}`)
      if (a.kind !== 'disagree') return toast(next, 'Saved')
      const note = CASES[a.id].queue?.disagreeNote
      return toast(next, `Added as test case #${H.tests.base + next.added}${note ? ` · ${note}` : ''}`)
    }
    case 'FIX_START': return s.fix !== 'idle' ? s : activity({ ...s, fix: 'running', fixStarted: a.at }, a, 'req', '[re-test] Applying instruction fix. Re-running all scripted test cases…')
    case 'FIX_DONE': return s.fix !== 'running' ? s : activity({ ...s, fix: 'done' }, a, 'success', `[success] Re-test: ${H.tests.passBefore} → ${H.tests.passAfter} of ${H.tests.base + s.added} · Fixed 6 · Broke 0 (demo data)`)
    case 'ACTIVITY': return activity(s, a, a.cls, a.text)
    case 'FEED_EVENT': {
      const e = a.event
      if (e.reset) return { ...s, events: [], agentState: 'idle', agentStates: {} }
      if (e.state) return { ...s, agentState: e.state, agentStates: { ...s.agentStates, [e.agentId || 'card-servicing']: e.state } }
      if (s.events.some((x) => x.key === `chat-${e.id}`)) return s
      return { ...s, events: [...s.events, { ...e, key: `chat-${e.id}`, origin: e.origin || 'Banker workspace', agentId: e.agentId || 'card-servicing' }].slice(-500) }
    }
    case 'CONNECTION': return { ...s, connection: a.value }
    case 'TOAST_CLEAR': return { ...s, toast: null }
    case 'RESET': return { ...initState(), epoch: s.epoch + 1, connection: s.connection }
    default: return s
  }
}
export const Ctx = createContext()
export const useStore = () => useContext(Ctx)
export const versionOf = (s, id) => {
  const v = CASES[id].versions
  return s.fix === 'done' && s.rerun.includes(id) && v.afterFix ? v.afterFix : v.before
}
