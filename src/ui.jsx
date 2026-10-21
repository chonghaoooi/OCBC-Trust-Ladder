export const STATUS = {
  VERIFIED: { icon: '✓', word: 'Verified', action: 'Safe to send', cls: 'ok', mood: 'happy' },
  NEEDS_REVIEW: { icon: '⚠', word: 'Needs review', action: 'Ask your supervisor', cls: 'warn', mood: 'unsure' },
  REJECTED: { icon: '✗', word: 'Rejected', action: "Don't send this reply", cls: 'bad', mood: 'stern' },
  NOT_CHECKED: { icon: '○', word: 'Not checked', action: 'Ask your supervisor', cls: 'off', mood: 'unsure' },
}

export const LABEL = {
  CHECKED: ['✓', 'Checked out', 'ok'],
  WRONG: ['✗', 'Wrong', 'bad'],
  NO_PROOF: ['?', 'No proof found', 'warn'],
  OLD_POLICY: ['⚠', 'Old policy', 'warn'],
  SKIPPED: ['⚠', 'Agent skipped a check', 'warn'],
  OFF_TARGET: ['⚠', "Doesn't answer the question", 'warn'],
}

export const Badge = ({ status }) => {
  const m = STATUS[status]
  return <span className={`badge ${m.cls}`}>{m.icon} {m.word}</span>
}

const MOUTH = { happy: 'M12 26 Q20 33 28 26', unsure: 'M13 29 H27', stern: 'M12 31 Q20 25 28 31', thinking: 'M16 29 H24' }

// Simple stand-in for the Meet Rung face assets.
export const Rung = ({ mood }) => (
  <svg className={`rung ${mood}`} viewBox="0 0 40 40" width="40" height="40" aria-hidden>
    <circle cx="20" cy="20" r="18" fill="#fff" stroke="currentColor" strokeWidth="2" />
    <circle cx="14" cy="16" r="2" fill="currentColor" />
    <circle cx="26" cy="16" r="2" fill="currentColor" />
    {mood === 'stern' && <path d="M10 11 L17 13 M30 11 L23 13" stroke="currentColor" strokeWidth="2" />}
    <path d={MOUTH[mood]} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
)
