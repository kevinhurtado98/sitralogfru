import { IconTruck, IconDeviceLaptop, IconDeviceMobileOff } from '@tabler/icons-react'

export function DesktopOnlyGate() {
  return (
    <div className="dog">
      <div className="dog-card">
        <div className="dog-logo">
          <IconTruck size={17} color="#fff" />
        </div>

        <div className="dog-icons">
          <IconDeviceLaptop size={26} color="var(--t1)" />
          <IconDeviceMobileOff size={20} color="var(--t3)" />
        </div>

        <h1>Solo disponible en computadora</h1>
        <p>
          SITRALOGFRU está diseñado para pantallas grandes. Ingresa desde una
          laptop o computadora de escritorio para continuar.
        </p>
      </div>
    </div>
  )
}
