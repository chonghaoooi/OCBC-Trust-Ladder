const paths = {
  inbox: 'M4 4h16v16H4z M4 13h5l2 3h2l2-3h5',
  queue: 'M9 5h11M9 12h11M9 19h11M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2',
  health: 'M3 17l5-5 4 3 8-10M15 5h5v5',
  feed: 'M3 12h4l3-7 4 14 3-7h4',
  search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  shield: 'M12 3l8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6zM8 12l3 3 5-6',
  reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  external: 'M14 3h7v7M21 3L11 13M10 3H3v18h18v-7',
  chevron: 'M9 5l7 7-7 7',
  book: 'M12 5v15M3 4l9 1 9-1v15l-9 1-9-1z',
  clock: 'M12 7v5l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
}
export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.shield} /></svg>
}
