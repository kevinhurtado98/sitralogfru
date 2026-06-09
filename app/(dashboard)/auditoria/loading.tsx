export default function Loading() {
  return (
    <div>
      <div className="fc">
        <div style={{ display: "flex", gap: 9 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 32,
                flex: 1,
                background: "var(--bl)",
                borderRadius: "var(--r)",
              }}
              className="pulse"
            />
          ))}
        </div>
      </div>
      <div className="tc">
        <div
          style={{ padding: "11px 15px", borderBottom: "1px solid var(--bl)" }}
        >
          <div
            style={{
              height: 14,
              width: 220,
              background: "var(--bl)",
              borderRadius: 4,
            }}
            className="pulse"
          />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="ar">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bl)",
                flexShrink: 0,
              }}
              className="pulse"
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 13,
                  width: "60%",
                  background: "var(--bl)",
                  borderRadius: 4,
                  marginBottom: 8,
                }}
                className="pulse"
              />
              <div
                style={{
                  height: 11,
                  width: "40%",
                  background: "var(--bl)",
                  borderRadius: 4,
                }}
                className="pulse"
              />
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
