export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // position fixed para salirse del flex del body y cubrir toda la pantalla
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      background: '#f0ede8',
    }}>
      {children}
    </div>
  )
}
