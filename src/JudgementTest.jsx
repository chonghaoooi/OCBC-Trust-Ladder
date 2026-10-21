import { useRef, useState } from 'react'
import replies from './data/judgement.json'
import SourceDrawer from './SourceDrawer'
import Icon from './Icon'

export default function JudgementTest({ mode }) {
  const [started, setStarted] = useState(false)
  const [participant, setParticipant] = useState('')
  const [results, setResults] = useState([])
  const [source, setSource] = useState(false)
  const start = useRef(0)
  const decided = useRef(new Set())
  const item = replies[results.length]
  const assisted = mode === 'assisted'
  const decide = (decision) => {
    if (decided.current.has(item.id)) return
    decided.current.add(item.id)
    const record = { id: item.id, decision, correctReply: item.correct, seconds: Number(((performance.now() - start.current) / 1000).toFixed(2)) }
    setResults((rows) => [...rows, record])
    start.current = performance.now(); setSource(false)
  }
  const download = () => {
    const data = { participant: participant || 'anonymous', mode, capturedAt: new Date().toISOString(), replies: results,
      flawedRepliesSent: results.filter((r) => !r.correctReply && r.decision === 'send').length,
      correctRepliesHeld: results.filter((r) => r.correctReply && r.decision === 'hold').length,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `trustladder-judgement-${mode}.json`; link.click(); URL.revokeObjectURL(url)
  }
  return <div className="test-page"><header className="test-header"><a className="brand" href={window.location.pathname}>TrustLadder</a><span className="prototype-pill">Judgement test · {assisted ? 'TrustLadder panel' : 'Plain screen'}</span></header><main className="test-main">
    {!started ? <section className="surface test-intro"><div className="story-icon"><Icon name="book" size={28} /></div><p className="eyebrow">VOLUNTEER JUDGEMENT TEST</p><h1>Would you send this reply?</h1><p>Review 10 synthetic replies. Choose whether you would send each reply or hold it for review. You can open the supplied source at any time.</p><p className="small">Your choices and time per reply are recorded in this browser session. Download the results at the end. No results have been measured yet.</p><label className="test-participant">Participant code (optional)<input value={participant} onChange={(e) => setParticipant(e.target.value)} placeholder="e.g. V01 · no personal information" /></label><button className="btn primary" onClick={() => { start.current = performance.now(); setStarted(true) }}>Start test <Icon name="arrow" size={16} /></button><a className="link" href={assisted ? '?mode=plain' : '?mode=assisted'}>Switch to {assisted ? 'plain screen' : 'TrustLadder panel'}</a></section>
      : item ? <><div className="test-progress"><span>Reply {results.length + 1} of {replies.length}</span><span>{assisted ? 'TrustLadder panel' : 'Plain screen'}</span></div><progress max={replies.length} value={results.length} aria-label="Replies reviewed" /><section className="surface test-reply"><span className="eyebrow">{item.id} / {item.subject}</span><h2>Customer asked</h2><p>{item.question}</p><h2>Agent’s reply</h2><blockquote>{item.reply}</blockquote>{assisted && <div className={`test-assessment ${item.correct ? 'ok' : 'warn'}`}><b>{item.correct ? '✓ Verified' : '⚠ Needs review'}</b><p>{item.reason}</p></div>}<button className="link" onClick={() => setSource(true)}>Source: {item.source} ↗</button></section><div className="test-decisions"><button className="btn primary" onClick={() => decide('send')}>Send reply</button><button className="btn" onClick={() => decide('hold')}>Hold for review</button></div>{source && <SourceDrawer claim={{ text: item.source, evidence: [{ type: 'clause', ref: item.source, text: item.sourceText }] }} onClose={() => setSource(false)} />}</>
        : <section className="surface test-intro"><span className="story-icon"><Icon name="queue" size={28} /></span><h1>Session complete</h1><p>These results come from your {results.length} choices in this session.</p><div className="test-results"><div><b>{results.filter((r) => !r.correctReply && r.decision === 'send').length}</b><span>Flawed replies you would send</span></div><div><b>{results.filter((r) => r.correctReply && r.decision === 'hold').length}</b><span>Correct replies held for review</span></div><div><b>{(results.reduce((sum, r) => sum + r.seconds, 0) / results.length).toFixed(1)}s</b><span>Mean time per reply</span></div></div><button className="btn primary" onClick={download}>Download session results</button><a className="link" href={window.location.pathname}>Back to dashboard</a></section>}
  </main><footer className="test-footer">Prototype · demo data · Synthetic replies and sources · Session results are measured from your choices</footer></div>
}
