export default function Loading() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="dc">
          <div style={{ height: 11, width: 180, background: 'var(--bl)', borderRadius: 4, marginBottom: 16 }} className="pulse" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} style={{ height: 13, width: j % 2 === 0 ? '80%' : '60%', background: 'var(--bl)', borderRadius: 4, marginBottom: 10 }} className="pulse" />
          ))}
        </div>
      ))}
      <style>{`
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
