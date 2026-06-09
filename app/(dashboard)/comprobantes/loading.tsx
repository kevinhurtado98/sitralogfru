export default function Loading() {
  return <ModuleLoading />;
}

function ModuleLoading() {
  return (
    <div>
      {/* Métricas skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 11,
          marginBottom: 16,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mc">
            <div
              style={{
                height: 12,
                width: "60%",
                background: "var(--bl)",
                borderRadius: 4,
                marginBottom: 10,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 28,
                width: "40%",
                background: "var(--bl)",
                borderRadius: 4,
              }}
              className="pulse"
            />
          </div>
        ))}
      </div>

      {/* Tabla skeleton */}
      <div className="tc">
        <div
          style={{
            padding: "11px 15px",
            borderBottom: "1px solid var(--bl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              height: 14,
              width: 160,
              background: "var(--bl)",
              borderRadius: 4,
            }}
            className="pulse"
          />
          <div
            style={{
              height: 27,
              width: 110,
              background: "var(--bl)",
              borderRadius: "var(--r)",
            }}
            className="pulse"
          />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 16,
              padding: "11px 11px",
              borderBottom: "1px solid var(--bl)",
            }}
          >
            <div
              style={{
                height: 13,
                width: 36,
                background: "var(--bl)",
                borderRadius: 4,
                flexShrink: 0,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 13,
                width: 110,
                background: "var(--bl)",
                borderRadius: 4,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 13,
                flex: 1,
                background: "var(--bl)",
                borderRadius: 4,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 13,
                width: 80,
                background: "var(--bl)",
                borderRadius: 4,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 13,
                width: 70,
                background: "var(--bl)",
                borderRadius: 4,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 13,
                width: 90,
                background: "var(--bl)",
                borderRadius: 4,
              }}
              className="pulse"
            />
            <div
              style={{
                height: 20,
                width: 70,
                background: "var(--bl)",
                borderRadius: 20,
              }}
              className="pulse"
            />
          </div>
        ))}
      </div>

      <style>{`
        .pulse {
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
