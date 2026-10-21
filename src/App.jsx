import { useCallback, useEffect, useReducer, useState } from 'react'
import { BANKER_URL, CASES, Ctx, INBOX_ORDER, initState, reducer, RELAY, versionOf } from './store'
import { Badge } from './ui'
import Icon from './Icon'
import Review from './Review'
import AgentHealth from './AgentHealth'
import LiveFeed, { ActivityPreview } from './LiveFeed'
import JudgementTest from './JudgementTest'

const TABS = [['inbox', 'Inbox', 'Officer'], ['queue', 'Review queue', 'Supervisor'], ['health', 'Agent health', 'Risk team'], ['feed', 'Live activity', 'Bank operations']]
const KIND = { needs_review: ['⚠ Needs review', 'warn'], not_checked: ['○ Not checked', 'off'], spot_check: ['⚠ Spot-check', 'warn'], rejected: ['✗ Rejected', 'bad'] }
const queueOf = (s) => Object.values(CASES).filter((c) => c.queue && !s.done.includes(c.id)).sort((a, b) => a.queue.rank - b.queue.rank)
const matches = (c, search) => `${c.customer} ${c.subject} ${c.id} ${c.accountId}`.toLowerCase().includes(search.toLowerCase())

function Summary({ s }) {
  const statuses = INBOX_ORDER.map((id) => versionOf(s, id).status)
  const cards = [
    ['Replies in inbox', INBOX_ORDER.length, '7 synthetic customer cases', 'inbox', ''],
    ['Need attention', statuses.filter((x) => x !== 'VERIFIED').length, 'Review before sending', 'shield', 'warn'],
    ['Verified', statuses.filter((x) => x === 'VERIFIED').length, 'Ready for an officer to send', 'queue', 'ok'],
    ['Awaiting supervisor', queueOf(s).length, `${s.done.length} decisions saved`, 'clock', ''],
  ]
  return <div className="metric-grid">{cards.map(([label, value, note, icon, color]) => <div className="metric" key={label}>
    <div className="metric-label">{label}<Icon name={icon} size={17} /></div><strong className={color}>{value.toString().padStart(2, '0')}</strong><span className="small">{note}</span>
  </div>)}</div>
}

function Inbox({ s, d, search }) {
  const [filter, setFilter] = useState('all')
  const rows = INBOX_ORDER.filter((id) => matches(CASES[id], search) && (filter === 'all' || (filter === 'attention' ? versionOf(s, id).status !== 'VERIFIED' : versionOf(s, id).status === 'VERIFIED')))
  return <>
    <Summary s={s} />
    <div className="inbox-grid">
      <section className="surface case-list">
        <div className="section-head"><div><h2>Drafts for banker review <span className="count">7</span></h2><p className="small">Problems first. Review each draft before it is sent.</p></div><span className="small">Today</span></div>
        <div className="filters" aria-label="Filter inbox">{[['all', 'All replies'], ['attention', 'Needs attention'], ['verified', 'Verified']].map(([key, label]) => <button key={key} aria-pressed={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div>
        <div className="list-label"><span>Customer & request</span><span>Decision</span></div>
        <ul className="case-rows">{rows.map((id) => { const c = CASES[id]; const v = versionOf(s, id); return <li key={id}>
          <button className="case-row" onClick={() => d({ t: 'OPEN', id })}>
            <span className={`avatar ${v.status.toLowerCase()}`}>{c.customer.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
            <span className="case-person"><b>{c.customer}</b><span>{c.subject}</span></span>
            <span className="case-meta"><Badge status={v.status} /><span className="small">{s.sent.includes(id) ? <span className="ok">Sent ✓</span> : c.time}</span></span>
            <Icon name="chevron" size={16} />
          </button>
        </li> })}</ul>
        {!rows.length && <div className="empty"><Icon name="search" /><h3>No matching replies</h3><p>Try another name or filter.</p></div>}
        <div className="table-foot"><span>{rows.length} of 7 replies</span><span>Synthetic accounts · SGD</span></div>
      </section>
      <aside className="overview-rail">
        <section className="surface story-card"><div className="eyebrow">FEATURED CASE</div><div className="story-icon"><Icon name="shield" size={26} /></div><h2>The right source.<br />The wrong decision.</h2><p>The reply promises a waiver. The account is 70 days overdue. See what a citation alone misses.</p><button className="btn primary" onClick={() => d({ t: 'OPEN', id: 'C-001' })}>Review Tan Wei Ling <Icon name="arrow" size={17} /></button><span className="small">C-001 · Late fee waiver</span></section>
        <ActivityPreview />
      </aside>
    </div>
  </>
}

function Queue({ s, d, search }) {
  const rows = queueOf(s).filter((c) => matches(c, search))
  return <>
    <div className="callout"><Icon name="shield" /><div><b>Human judgement closes the loop.</b><p>Review uncertain replies, catch missed issues, and turn corrections into new test cases.</p></div><span className="pill">{queueOf(s).length} pending</span></div>
    <section className="surface"><div className="section-head"><div><h2>Flagged for review</h2><p className="small">Ordered by the scripted risk priority.</p></div><span className="small">Highest priority first</span></div>
      <ul className="queue-rows">{rows.map((c, i) => <li key={c.id}><button className="queue-row" onClick={() => d({ t: 'OPEN', id: c.id })}>
        <span className="priority">{(i + 1).toString().padStart(2, '0')}</span><span className="queue-person"><b>{c.customer}</b><span>{c.queue.reason}</span></span><span className={`badge ${KIND[c.queue.kind][1]}`}>{KIND[c.queue.kind][0]}</span><b className="amount">S${c.queue.amount}</b><Icon name="chevron" size={16} />
      </button></li>)}</ul>
      {!rows.length && <div className="empty"><Icon name="queue" size={32} /><h2>{search ? 'No matching cases' : 'You’re all caught up'}</h2><p>{search ? 'Try another customer name.' : 'Every flagged reply has a saved decision.'}</p></div>}
      <div className="table-foot"><span>{s.done.length} reviewed · {s.added} added to the test suite</span><span>5% random spot-check included</span></div>
    </section>
    <div className="review-explainer"><Icon name="book" /><p><b>Disagree with the checker?</b> Your correction becomes a test case. “Policy unclear” saves the uncertainty for a human follow-up.</p></div>
  </>
}

export default function App() {
  const [s, rawDispatch] = useReducer(reducer, undefined, initState)
  const [search, setSearch] = useState('')
  const mode = new URLSearchParams(window.location.search).get('mode')
  const d = useCallback((action) => rawDispatch({ ...action, at: Date.now(), ts: new Date().toLocaleTimeString('en-GB') }), [])
  const reset = useCallback(() => {
    if (RELAY) fetch('/api/demo', { method: 'DELETE' }).catch(() => {})
    else window.TrustLadderDemo?.reset()
    setSearch(''); d({ t: 'RESET' })
  }, [d])
  useEffect(() => {
    const key = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 'r' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); reset() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [reset])
  useEffect(() => {
    if (!s.toast) return
    const timer = setTimeout(() => d({ t: 'TOAST_CLEAR' }), 4500)
    return () => clearTimeout(timer)
  }, [s.toast, d])
  useEffect(() => {
    if (s.fix !== 'running') return
    const timer = setTimeout(() => d({ t: 'FIX_DONE' }), Math.max(0, 3000 - (Date.now() - s.fixStarted)))
    return () => clearTimeout(timer)
  }, [s.fix, s.fixStarted, d])
  useEffect(() => {
    if (RELAY && !mode) fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fixed: s.fix === 'done' }) }).catch(() => {})
    else if (!mode) window.TrustLadderDemo?.setFixed(s.fix === 'done')
  }, [s.fix, mode])
  useEffect(() => {
    if (mode) return
    if (!RELAY) {
      if (window.TrustLadderDemo) {
        const unsubscribe = window.TrustLadderDemo.subscribe((event) => d({ t: 'FEED_EVENT', event }))
        d({ t: 'CONNECTION', value: 'connected' })
        return unsubscribe
      }
      return
    }
    const feed = new EventSource('/api/events')
    feed.onopen = () => d({ t: 'CONNECTION', value: 'connected' })
    feed.onerror = () => d({ t: 'CONNECTION', value: 'reconnecting' })
    feed.onmessage = ({ data }) => {
      try { d({ t: 'FEED_EVENT', event: JSON.parse(data) }) } catch { /* Ignore malformed transport data. */ }
    }
    return () => feed.close()
  }, [d, mode])

  const [, title, role] = TABS.find((t) => t[0] === s.tab)
  const descriptions = { inbox: 'A clear decision before every customer reply.', queue: 'The right cases, in front of the right people.', health: 'Earn trust by topic. Improve it with evidence.', feed: 'Follow the agent from request to reviewed result.' }
  const context = { s, d, reset }
  if (mode === 'plain' || mode === 'assisted') return <Ctx.Provider value={context}><JudgementTest mode={mode} /></Ctx.Provider>
  return <Ctx.Provider value={context}>
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href={window.location.pathname} aria-label="TrustLadder home"><span className="brand-mark"><i /><i /><i /></span><span>TrustLadder<span className="brand-sub">AGENT ASSURANCE</span></span></a>
        <div className="workspace"><span className="workspace-icon">T</span><div><b>Banking workspace</b><span>OCBC Ignite · Prototype</span></div><span className="small">⌄</span></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Dashboard">{TABS.slice(0, 3).map(([key, label]) => <button key={key} className={s.tab === key ? 'active' : ''} aria-current={s.tab === key ? 'page' : undefined} onClick={() => { setSearch(''); d({ t: 'TAB', tab: key }) }}><Icon name={key} /><span>{label}</span>{key === 'queue' && <span className="nav-count">{queueOf(s).length}</span>}</button>)}</nav>
        <div className="nav-caption">OBSERVABILITY</div>
        <nav aria-label="Observability"><button className={s.tab === 'feed' ? 'active' : ''} aria-current={s.tab === 'feed' ? 'page' : undefined} onClick={() => d({ t: 'TAB', tab: 'feed' })}><Icon name="feed" /><span>Live activity</span><span className={`connection-dot ${s.connection === 'reconnecting' ? 'offline' : ''}`} /></button></nav>
        <div className="sidebar-bottom"><div className="agent-mini"><span className="agent-symbol"><Icon name="shield" /></span><div><b>3 banking agents</b><span>Internal staff workspace</span></div></div><button className="sidebar-reset" onClick={reset}><Icon name="reset" size={16} /> Reset demo <kbd>⇧ R</kbd></button><a className="test-link" href="?mode=plain">Open judgement test <Icon name="external" size={12} /></a></div>
      </aside>
      <div className="workspace-main">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>{title}</b>{s.caseId && <><span>/</span><b>{s.caseId}</b></>}</div><div className="topbar-right"><span className="prototype-pill"><span /> Scripted prototype</span><a className="icon-link" href={BANKER_URL} target="_blank" rel="noreferrer" aria-label="Open banker assistant"><Icon name="external" size={17} /></a><span className="user-avatar">{role === 'Officer' ? 'ML' : role === 'Supervisor' ? 'SL' : 'RT'}</span></div></header>
        <main id="main-content">
          {!s.caseId && <div className="page-heading"><div><p className="eyebrow">TRUSTLADDER / {s.tab === 'feed' ? 'OBSERVABILITY' : 'WORKSPACE'}</p><h1>{title}</h1><p className="page-description">{descriptions[s.tab]}</p><p className="viewing">Viewing as: <b>{role}</b></p></div>{(s.tab === 'inbox' || s.tab === 'queue') && <label className="search-box"><Icon name="search" size={17} /><input aria-label="Search customers or case ID" placeholder="Search name or case ID…" value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>⌕</kbd></label>}</div>}
          <div key={s.epoch}>
            {s.caseId ? <><p className="viewing">Viewing as: <b>{role}</b></p><Review key={s.caseId + s.tab} id={s.caseId} role={s.tab === 'queue' ? 'supervisor' : 'officer'} back={() => d({ t: 'OPEN', id: null })} /></>
              : s.tab === 'inbox' ? <Inbox s={s} d={d} search={search} />
              : s.tab === 'queue' ? <Queue s={s} d={d} search={search} />
              : s.tab === 'health' ? <AgentHealth /> : <LiveFeed />}
          </div>
        </main>
        <footer className="app-footer"><span><span className="footer-dot" />Prototype · demo data <span className="footer-extra">· Scripted checks, simulated tool calls</span></span><button className="link muted-link" onClick={reset}>Reset demo <kbd>Shift + R</kbd></button></footer>
      </div>
    </div>
    {s.toast && <div className="toast" role="status"><span>✓</span>{s.toast.text}</div>}
  </Ctx.Provider>
}
