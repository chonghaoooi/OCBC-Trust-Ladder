import { useEffect, useRef, useState } from 'react'
import { AGENTS, BANKER_URL, useStore } from './store'
import Icon from './Icon'

const KIND = { info: 'AGENT', req: 'REQUEST', res: 'RESPONSE', success: 'SUCCESS', fail: 'BLOCKED', warn: 'WARNING', notify: 'NOTIFY' }
const isCheck = (e) => /✓ pass|✗ FAIL|Scripted.*review|five-check assessment/.test(e.text)
const isTool = (e) => e.cls === 'req' || (e.cls === 'res' && /^←/.test(e.text))
const EXAMPLE = [
  ['info', '── new request ── banker: "Assess A-1001’s S$100 late-fee waiver" · scripted example'],
  ['req', '→ POST /tools/get_account {"id":"A-1001"}'],
  ['res', '← 200 {"days_overdue":70,"late_fee":100} · simulated response'],
  ['req', '→ POST /tools/search_policy {"q":"late fee waiver"}'],
  ['res', '← 200 {"document":"G1 v4 §2.1"} · simulated response'],
  ['warn', 'get_waiver_history(A-1001) — never called'],
  ['info', 'Draft: "Yes, you’re eligible. We’ll process the waiver."'],
  ['info', 'Scripted review: grounded ✗ · correct ✗ · current ✓ · complete ✗ · on target ✓'],
  ['fail', '[fail] draft blocked: 70 days overdue exceeds the 60-day policy limit'],
  ['notify', '[notify] → banker: Not verified. Do not use this draft; review the evidence.'],
]
const SCRIPTS = {
  'card-servicing': EXAMPLE,
  payments: [
    ['info', '── new request ── banker: "Prepare a S$500 payment from A-1001 to Ahmad" · scripted example'],
    ['req', '→ POST /tools/get_account {"id":"A-1001"}'], ['res', '← 200 {"balance":4820.55} · simulated response'],
    ['req', '→ POST /tools/check_limit {"amount":500}'], ['res', '← 200 {"daily_limit":5000,"allowed":true} · simulated response'],
    ['req', '→ POST /tools/quote_transfer {"to":"Ahmad","amount":500}'], ['res', '← 200 {"fee":0,"new_balance":4320.55} · simulated response'],
    ['info', 'Scripted review: grounded ✓ · correct ✓ · current ✓ · complete ✓ · on target ✓'],
    ['success', '[success] payment preparation Verified. No payment has been executed.'],
    ['notify', '[notify] → banker: Verified. Review the prepared payment details before proceeding.'],
  ],
  policy: [
    ['info', '── new request ── banker: "Find the current late-fee waiver policy" · scripted example'],
    ['req', '→ POST /tools/search_policy {"q":"late fee waiver"}'], ['res', '← 200 {"document":"G1 v4","clauses":["§2.1","§3.2"]} · simulated response'],
    ['req', '→ POST /tools/get_policy_version {"document":"G1"}'], ['res', '← 200 {"current":"v4","effective":"2026-09-01"} · simulated response'],
    ['info', 'Policy: one waiver every 24 months; accounts over 60 days overdue are ineligible.'],
    ['info', 'Scripted review: grounded ✓ · correct ✓ · current ✓ · complete ✓ · on target ✓'],
    ['success', '[success] policy summary Verified against the supplied demo documents'],
    ['notify', '[notify] → banker: Verified. The current source and eligibility rule are ready to review.'],
  ],
}

export function ActivityPreview() {
  const { s, d } = useStore()
  const events = s.events.slice(-3).reverse()
  return <section className="surface activity-preview"><div className="section-head"><h2><span className="connection-dot" /> Activity feed</h2><span className="small">{s.events.length}</span></div>
    {events.length ? <div className="recent-events">{events.map((e) => <div key={e.key}><span className={`event-dot ${e.cls}`} /><div><p>{e.text}</p><span>{e.ts} · {AGENTS.find((a) => a.id === e.agentId)?.shortName || e.origin}</span></div></div>)}</div>
      : <div className="feed-waiting"><Icon name="feed" size={25} /><b>Ready for the next request</b><p>Banker requests and review decisions appear here as they happen.</p></div>}
    <button className="feed-open" onClick={() => d({ t: 'TAB', tab: 'feed' })}>Open full activity <Icon name="arrow" size={15} /></button>
  </section>
}

export default function LiveFeed() {
  const { s, d } = useStore()
  const [agentId, setAgentId] = useState('card-servicing')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [paused, setPaused] = useState(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [running, setRunning] = useState(false)
  const timers = useRef([])
  const end = useRef(null)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { if (autoScroll && paused === null) end.current?.scrollIntoView({ block: 'nearest' }) }, [s.events.length, autoScroll, paused])
  const sample = () => {
    if (running) return
    setRunning(true)
    const script = SCRIPTS[agentId]
    timers.current = script.map(([cls, text], i) => setTimeout(() => {
      d({ t: 'ACTIVITY', cls, text, agentId })
      if (i === script.length - 1) setRunning(false)
    }, i * 420))
  }
  const agent = AGENTS.find((a) => a.id === agentId)
  const agentEvents = s.events.filter((e) => e.agentId === agentId)
  const events = (paused === null ? s.events : paused).filter((e) => e.agentId === agentId)
  const rows = events.filter((e) => (filter === 'all' || (filter === 'tools' ? isTool(e) : filter === 'verdicts' ? isCheck(e) || ['success', 'fail', 'warn'].includes(e.cls) : e.cls === 'notify')) && `${e.text} ${e.origin}`.toLowerCase().includes(search.toLowerCase()))
  const stats = [
    ['Tool requests', agentEvents.filter((e) => e.cls === 'req').length],
    ['Successful outcomes', agentEvents.filter((e) => e.cls === 'success').length],
    ['Blocked outcomes', agentEvents.filter((e) => e.cls === 'fail' && /\[fail\]|draft blocked/.test(e.text)).length],
    ['Banker notifications', agentEvents.filter((e) => e.cls === 'notify').length],
  ]
  return <>
    <div className="callout feed-callout"><Icon name="feed" /><div><b>{s.connection === 'connected' ? 'Connected to the banker workspace' : s.connection === 'reconnecting' ? 'Reconnecting to the banker workspace…' : 'Local prototype activity'}</b><p>Choose an agent to inspect its requests, responses, checks, and notifications to the banker. All tool activity is scripted.</p></div><a className="btn" href={BANKER_URL} target="_blank" rel="noreferrer">Open banker assistant <Icon name="external" size={14} /></a></div>
    <div className="agent-selector" aria-label="Choose an agent">{AGENTS.map((a) => <button key={a.id} className={a.id === agentId ? 'selected-agent' : ''} aria-pressed={a.id === agentId} onClick={() => { setAgentId(a.id); setPaused(null); setSearch(''); setFilter('all') }}><span className="agent-initials">{a.initials}</span><span><b>{a.name}</b><small>{a.topic}</small></span><span className="agent-event-count">{s.events.filter((e) => e.agentId === a.id).length} events</span></button>)}</div>
    <div className="metric-grid feed-metrics">{stats.map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><strong>{value.toString().padStart(2, '0')}</strong><span className="small">Events in this demo session</span></div>)}</div>
    <section className="surface feed-surface"><div className="section-head"><div><h2>{agent.name} <span className={`live-pill ${paused ? 'paused' : ''}`}>{paused ? 'Ⅱ Paused view' : '● Streaming'}</span></h2><p className="small">{s.agentStates[agentId] && s.agentStates[agentId] !== 'idle' ? 'Agent working' : 'Agent idle'} · Scripted demo</p></div><button className="btn primary" disabled={running} onClick={sample}>{running ? 'Playing example…' : 'Run scripted example'}</button></div><div className="agent-detail"><p>{agent.description}</p><div>{agent.tools.map((tool) => <code key={tool}>{tool}</code>)}</div></div>
      <div className="feed-toolbar"><div className="filters">{[['all', 'All events'], ['tools', 'Tool calls'], ['verdicts', 'Checks & verdicts'], ['notify', 'Notifications']].map(([key, label]) => <button key={key} aria-pressed={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div><label className="feed-search"><Icon name="search" size={15} /><input aria-label="Search activity" placeholder="Search activity…" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>
      <div className="terminal" aria-label="Live agent feed" role="log" aria-live="off"><div className="terminal-heading"><span>TIME</span><span>EVENT</span><span>ACTIVITY</span></div>
        {rows.length ? rows.map((e) => <div key={e.key} className={`activity-row ${e.cls}`}><time>{e.ts}</time><span className="event-kind">{isCheck(e) ? 'CHECK' : KIND[e.cls] || 'EVENT'}</span><div><pre>{e.text}</pre><span className="event-origin">{e.origin}</span></div></div>) : <div className="terminal-empty"><Icon name="feed" size={30} /><h3>{agentEvents.length ? 'No matching events' : `Waiting for ${agent.shortName} activity`}</h3><p>{agentEvents.length ? 'Choose another filter or search.' : 'Ask this agent in the banker workspace or run its scripted example.'}</p></div>}
        <div ref={end} />
      </div>
      <div className="feed-footer"><span>{rows.length} events{paused && ` · ${agentEvents.length - events.length} new while paused`}</span><label><input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} /> Auto-scroll</label><button className="link" onClick={() => setPaused(paused === null ? s.events : null)}>{paused ? 'Resume view' : 'Pause view'}</button></div>
    </section>
  </>
}
