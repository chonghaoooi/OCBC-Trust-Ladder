import { useEffect, useRef, useState } from 'react'
import { CASES, useStore, versionOf } from './store'
import { Badge, LABEL, Rung, STATUS } from './ui'
import Icon from './Icon'
import SourceDrawer from './SourceDrawer'

const CHECKS = [['grounded', 'Grounded', 'Every claim has a source'], ['correct', 'Correct', 'Matches the account and policy'], ['current', 'Current', 'Uses the latest policy version'], ['complete', 'Complete', 'Every needed step was taken'], ['onTarget', 'On target', 'Answers the customer’s question']]

function Details({ v, customer, onEvidence }) {
  return <div className="details"><div className="details-grid"><section><h3>The 5 checks</h3><table><tbody>{CHECKS.map(([key, name, description]) => <tr key={key}><td><b>{name}</b><span className="small">{description}</span></td><td className={!v.checks ? 'off' : v.checks[key] === 'pass' ? 'ok' : 'bad'}>{!v.checks ? '○ Not checked' : v.checks[key] === 'pass' ? '✓ Pass' : '✗ Fail'}</td></tr>)}</tbody></table></section><section><h3>Agent’s steps</h3><ol className="agent-steps">{v.steps.map((step, i) => <li key={i} className={step.skipped ? 'skipped' : ''}><span>{step.skipped ? '○' : '✓'}</span><div><code>{step.tool}({step.input})</code><p>{step.skipped ? 'never called' : step.result}</p></div></li>)}</ol>{!v.steps.length && <p className="small">No steps recorded. The check timed out.</p>}</section></div>
    <h3>Every claim & source</h3>{v.claims.map((c, i) => <button key={i} className="claim-source" onClick={() => onEvidence(c)}><span className={LABEL[c.label][2]}>{LABEL[c.label][0]} {LABEL[c.label][1]}</span><span>{c.text}</span><Icon name="external" size={14} /></button>)}{!v.claims.length && <p className="small">No claims were checked.</p>}
    {v.status === 'VERIFIED' && <div className="customer-context"><h3>Customer asked</h3><p>{customer}</p></div>}
  </div>
}

export default function Review({ id, role, back }) {
  const { s, d } = useStore()
  const c = CASES[id]
  const [busy, setBusy] = useState(!s.seen.includes(id))
  const [claim, setClaim] = useState(null)
  const [open, setOpen] = useState(false)
  const rerunning = useRef(false)
  const fixDone = s.fix === 'done'
  useEffect(() => {
    if (!busy) return
    const next = rerunning.current && fixDone && c.versions.afterFix ? c.versions.afterFix : versionOf(s, id)
    d({ t: 'ACTIVITY', cls: 'info', text: `[review] ${id}: displaying scripted five-check assessment` })
    const timers = next.steps.map((step, i) => setTimeout(() => d({ t: 'ACTIVITY', cls: step.skipped ? 'warn' : 'req', text: step.skipped ? `${step.tool}(${step.input}) — never called` : `→ ${step.tool}(${step.input}) → ${step.result} · scripted` }), 100 + i * 120))
    timers.push(setTimeout(() => {
      if (rerunning.current) { d({ t: 'RERUN', id }); rerunning.current = false }
      else d({ t: 'ACTIVITY', cls: next.status === 'VERIFIED' ? 'success' : 'fail', text: `[${next.status === 'VERIFIED' ? 'success' : 'fail'}] ${id}: ${next.reason}` })
      d({ t: 'SEEN', id }); setBusy(false)
    }, 800))
    return () => timers.forEach(clearTimeout)
    // The displayed script is captured when a review starts, not on every feed event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, id, d, fixDone])
  const v = versionOf(s, id)
  const m = STATUS[v.status]
  const sent = s.sent.includes(id)
  const problems = v.claims.filter((x) => x.label !== 'CHECKED')
  const passed = v.claims.length - problems.length
  const sug = v.suggestedReply
  const send = () => d({ t: 'SENT', id })
  const resolve = (kind) => d({ t: 'RESOLVE', id, kind })
  return <div className="review-page">
    <div className="review-bar"><button className="link back-link" onClick={back}>← {role === 'supervisor' ? 'Review queue' : 'Inbox'}</button><button className="btn quiet" disabled={busy} onClick={() => { rerunning.current = true; setBusy(true) }}><Icon name="reset" size={15} />Re-run agent</button></div>
    <div className="review-title"><div><span className="eyebrow">{id} / {c.accountId}</span><h1>{c.customer}</h1><p>{c.subject}</p></div><span className="small">{c.time} · Synthetic customer</span></div>
    {busy ? <section className="banner off"><div><h2>Checking…</h2><p>Playing the scripted five-check assessment.</p></div><Rung mood="thinking" /></section> : <>
      <section className={`banner ${m.cls}`}><div><div className="status-title"><h2>{m.icon} {m.word}</h2><span>{m.action}</span></div><p>{v.reason}</p>{c.baselineScore != null && v.status === 'REJECTED' && <div className="baseline"><span>Scripted baseline comparison</span><p>A standard checker would score this reply <b>{c.baselineScore.toFixed(1)}</b>.</p></div>}</div><Rung mood={m.mood} /></section>
      <section className={`surface message-comparison ${v.status === 'VERIFIED' ? 'verified-message' : ''}`}>
        {v.status !== 'VERIFIED' && <div className="customer-message"><h3>Customer asked</h3><p>{c.email}</p><span className="message-caption">Customer email · {c.accountId}</span></div>}
        <div className="agent-message"><h3>Agent’s reply</h3><p>{v.reply}</p><span className="message-caption">Banking assistant · scripted response</span></div>
      </section>
      {problems.length > 0 && <section className="surface findings"><div className="section-head"><h2>What’s wrong</h2><span className="small">{problems.length} findings</span></div>{problems.map((finding, i) => <div className="finding-row" key={i}><span className={`lab ${LABEL[finding.label][2]}`}>{LABEL[finding.label][0]} {LABEL[finding.label][1]}</span><span>“{finding.text}”</span><button className="link" aria-label={`View evidence: ${finding.text}`} onClick={() => setClaim(finding)}>View →</button></div>)}{passed > 0 && <div className="passing-claims">✓ {passed} other claim{passed > 1 ? 's' : ''} checked out</div>}</section>}
      {sug && <section className="suggested-reply"><div className="section-head"><h2><Icon name="shield" size={18} /> Suggested reply</h2><Badge status="VERIFIED" /></div><p>{sug.text}</p><span className="small">Scripted alternative checked against the demo sources.</span></section>}
      <div className="review-actions"><div className="small">{sent ? 'This reply is marked sent in the prototype.' : role === 'supervisor' ? 'Does the checker’s assessment match your judgement?' : sug ? 'Send the reviewed alternative, then move to the next case.' : v.status === 'VERIFIED' ? 'Ready for an officer to send.' : 'A supervisor must review this case.'}</div><div className="actions">{role === 'supervisor' ? <><button className="btn primary" onClick={() => resolve('agree')}>Agree</button><button className="btn" onClick={() => resolve('disagree')}>Disagree</button><button className="btn" onClick={() => resolve('unclear')}>Policy unclear</button></> : sug || v.status === 'VERIFIED' ? <button className="btn primary" disabled={sent} onClick={send}>{sent ? 'Sent ✓' : sug ? 'Send suggested reply' : 'Send reply'}{!sent && <Icon name="arrow" size={16} />}</button> : <button className="btn primary" onClick={() => { d({ t: 'TAB', tab: 'queue' }); d({ t: 'OPEN', id }) }}>Ask your supervisor <Icon name="arrow" size={16} /></button>}</div></div>
      <section className="surface details-section"><button className="details-toggle" aria-expanded={open} onClick={() => setOpen(!open)}><span><Icon name="book" size={17} /><b>{open ? 'Hide details' : 'Show details'}</b><span className="small">5 checks · agent’s steps · all sources</span></span><span>{open ? '−' : '+'}</span></button>{open && <Details v={v} customer={c.email} onEvidence={setClaim} />}</section>
    </>}
    {claim && <SourceDrawer claim={claim} onClose={() => setClaim(null)} />}
  </div>
}
