export default function Loading() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 11, marginBottom: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mc">
            <div style={{ height: 11, width: '70%', background: 'var(--bl)', borderRadius: 4, marginBottom: 10 }} className="pulse" />
            <div style={{ height: 28, width: '45%', background: 'var(--bl)', borderRadius: 4 }} className="pulse" />
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 16, marginBottom: 14, height: 200 }} className="pulse" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, height: 140 }} className="pulse" />
        ))}
      </div>
      <style>{`
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
