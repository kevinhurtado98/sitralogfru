export default function Loading() {
  return (
    <div>
      <div className="tc">
        <div style={{ padding: '11px 15px', borderBottom: '1px solid var(--bl)' }}>
          <div style={{ height: 14, width: 200, background: 'var(--bl)', borderRadius: 4 }} className="pulse" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '11px 11px', borderBottom: '1px solid var(--bl)' }}>
            <div style={{ height: 13, width: 80, background: 'var(--bl)', borderRadius: 4 }} className="pulse" />
            <div style={{ height: 13, width: 100, background: 'var(--bl)', borderRadius: 4 }} className="pulse" />
            <div style={{ height: 13, width: 120, background: 'var(--bl)', borderRadius: 4 }} className="pulse" />
            <div style={{ height: 13, flex: 1, background: 'var(--bl)', borderRadius: 4 }} className="pulse" />
            <div style={{ height: 20, width: 60, background: 'var(--bl)', borderRadius: 20 }} className="pulse" />
          </div>
        ))}
      </div>
      <style>{`
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
