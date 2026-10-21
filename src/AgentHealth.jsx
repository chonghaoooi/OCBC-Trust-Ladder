import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { H, useStore } from './store'
import Icon from './Icon'

const RUNGS = ['Inform', 'Draft', 'Recommend', 'Act']
const COLORS = ['#19705b', '#6c79a1', '#a5aebd']
const levelOf = (p) => p >= H.thresholds.act ? 3 : p >= H.thresholds.recommend ? 2 : p >= H.thresholds.draft ? 1 : 0

function Problem({ problem }) {
  const { s, d } = useStore()
  const total = H.tests.base + s.added
  const [progress, setProgress] = useState(0)
  const running = problem.demo && s.fix === 'running'
  useEffect(() => {
    if (!running) return
    const update = () => setProgress(Math.min(1, (Date.now() - s.fixStarted) / 3000))
    update()
    const timer = setInterval(update, 60)
    return () => clearInterval(timer)
  }, [running, s.fixStarted])
  return <article className={`problem-card ${problem.demo && s.fix === 'done' ? 'problem-fixed' : ''}`}><div className="problem-top"><span className={`issue-symbol ${problem.demo ? 'bad' : 'warn'}`}>{problem.demo ? '✗' : '⚠'}</span><span className="pill">{problem.count} flagged cases</span></div><h3>{problem.title}</h3><div className="problem-copy"><span>WHY IT HAPPENS</span><p>{problem.why}</p><span>PROPOSED FIX</span><p>{problem.fix}</p></div>
    {problem.demo ? s.fix === 'idle' ? <button className="btn primary" onClick={() => d({ t: 'FIX_START' })}>Apply and re-test <Icon name="arrow" size={15} /></button> : running ? <div role="status"><div className="progress-label"><b>Re-running test cases…</b><span>{Math.min(total, Math.ceil(progress * total))}/{total}</span></div><progress max="1" value={progress} aria-label="Re-test progress" /><span className="small">Scripted animation · every test in the demo suite</span></div> : <div className="fix-result" role="status"><b>Applied ✓</b><p>Score {H.tests.passBefore} → {H.tests.passAfter} of {total}</p><span>Fixed 6 · Broke 0 · Demo data</span></div> : <span className="small backlog-note">Planned improvement · not part of the scripted fix</span>}
  </article>
}

export default function AgentHealth() {
  const { s } = useStore()
  const done = s.fix === 'done'
  const total = H.tests.base + s.added
  const passing = done ? H.tests.passAfter : H.tests.passBefore
  const lateLevel = levelOf(passing / total)
  const rows = H.weeks.map((week, i) => ({ week,
    [H.topics[0].name]: i < 5 ? H.topics[0].trend[i] : i === 5 ? Math.round(H.tests.passBefore / total * 100) : done ? Math.round(H.tests.passAfter / total * 100) : null,
    ...Object.fromEntries(H.topics.slice(1).map((t) => [t.name, t.trend[i] ?? t.trend.at(-1)])),
  }))
  return <>
    <div className="health-section-heading"><div><h2>Trust level by topic</h2><p className="small">Autonomy is earned separately for each kind of request.</p></div><span className="pill">3 topics · Synthetic test data</span></div>
    <div className="topic-grid">{H.topics.map((topic, i) => { const level = i === 0 ? lateLevel : topic.level; return <section className="surface topic-card" key={topic.id}><div className="topic-title"><Icon name={i === 0 ? 'shield' : i === 1 ? 'queue' : 'book'} size={19} /><span className={`level-label ${i === 0 && !done ? 'warn' : 'ok'}`}>{RUNGS[level]}</span></div><h3>{topic.name}</h3><div className="ladder" aria-label={`${topic.name} trust level: ${RUNGS[level]}`}>{RUNGS.map((rung, n) => <span key={rung} className={n === level ? 'rung-on' : n < level ? 'rung-below' : ''}><i>{n < level ? '✓' : n + 1}</i>{rung}</span>)}</div><p className={`topic-note ${i === 0 ? done ? 'ok' : 'warn' : ''}`}>{i === 0 ? done ? `↑ back to Recommend: fix applied, ${passing} of ${total} tests pass` : '↓ dropped from Recommend: G1 v4 published (1 Sep 2026)' : topic.note}</p></section>})}</div>
    <div className="health-chart-grid"><section className="surface chart-card"><div className="section-head"><div><h2>Trust over time</h2><p className="small">Tests passing by topic · synthetic weekly points</p></div><span className="pill">Last 6 weeks</span></div><div className="chart"><ResponsiveContainer width="100%" height={260}><LineChart data={rows} margin={{ top: 22, right: 22, bottom: 0, left: -18 }}><CartesianGrid vertical={false} stroke="#e8ecef" strokeDasharray="3 4" /><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7a8591' }} dy={8} /><YAxis domain={[60, 100]} ticks={[60, 70, 80, 90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7a8591' }} tickFormatter={(v) => `${v}%`} /><Tooltip formatter={(value) => `${value}% (demo)`} contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: '#e3e8ec' }} /><Legend wrapperStyle={{ fontSize: 11, paddingTop: 20 }} iconType="circle" iconSize={7} /><ReferenceLine x="W4" stroke="#b45309" strokeDasharray="4 4" label={{ value: 'G1 v4 published', position: 'insideTopRight', fill: '#9b650f', fontSize: 10 }} />{done && <ReferenceLine x="Now" stroke="#19705b" strokeDasharray="4 4" label={{ value: 'Fix applied', position: 'insideBottomLeft', fill: '#19705b', fontSize: 10 }} />}{H.topics.map((t, i) => <Line key={t.id} dataKey={t.name} stroke={COLORS[i]} strokeWidth={i === 0 ? 3 : 2} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div></section>
      <section className="surface suite-card"><div className="eyebrow">LATE FEE WAIVER / TEST SUITE</div><div className="suite-score"><strong>{passing}</strong><span>/ {total}</span></div><h2>Scripted tests passing</h2><p>These scores illustrate the improvement loop. They are not measured checker accuracy.</p><div className="suite-bar"><span style={{ width: `${passing / total * 100}%` }} /></div><div className="suite-current"><span>Current trust level</span><b>{RUNGS[lateLevel]}</b></div><div className="thresholds"><span>Act ≥ 95%</span><span>Recommend ≥ 85%</span><span>Draft ≥ 70%</span></div></section>
    </div>
    <div className="health-stat-row"><div><Icon name="search" /><strong>{H.stats.spotChecks}</strong><span>Spot-checks <small>{H.stats.missed} missed · demo data</small></span></div><div><Icon name="shield" /><strong>{H.stats.falseAlarms}<small> / {H.stats.falseAlarmOf}</small></strong><span>False alarms <small>Synthetic review outcomes</small></span></div><div><Icon name="queue" /><strong>{s.added}</strong><span>New test cases <small>From supervisor corrections</small></span></div></div>
    <div className="health-section-heading problems-heading"><div><h2>Problems to fix</h2><p className="small">Find the pattern. Fix the cause. Re-test everything.</p></div><span className="pill">{done ? '1 applied · 1 planned' : '2 patterns identified'}</span></div><div className="problem-grid">{H.problems.map((problem) => <Problem key={problem.id} problem={problem} />)}</div>
  </>
}
