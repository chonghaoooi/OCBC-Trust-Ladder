import { useEffect, useRef } from 'react'
import { LABEL } from './ui'
import Icon from './Icon'

export default function SourceDrawer({ claim, onClose }) {
  const ref = useRef(null)
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close() }, [])
  const label = LABEL[claim.label]
  return <dialog ref={ref} className="source-drawer" aria-labelledby="evidence-title" onCancel={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}>
    <div className="drawer-content"><div className="drawer-heading"><span className="eyebrow">SOURCE EVIDENCE</span><button className="icon-button" aria-label="Close evidence" onClick={onClose}>×</button></div><h2 id="evidence-title">{claim.text}</h2>{label && <p className={`lab ${label[2]}`}>{label[0]} {label[1]}</p>}
      {claim.evidence.map((e, i) => <section className="evidence-card" key={i}><div className="evidence-type"><Icon name={e.type === 'record' ? 'inbox' : 'book'} size={16} />{e.type === 'record' ? 'Account record' : e.type === 'clause' ? 'Policy document' : 'Agent record'}</div><h3>{e.ref}</h3><div className="evidence-highlight"><mark>{e.text}</mark></div><span className="small">Synthetic demo source · relevant {e.type === 'record' ? 'field' : 'passage'} highlighted</span></section>)}
      <div className="source-note"><Icon name="shield" size={18} /><p>Evidence is supplied with this prototype. These are scripted findings, not live checks of bank records.</p></div>
    </div>
  </dialog>
}
