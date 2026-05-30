const variants = {
  POR_VENCER: 'bg-red-100 text-red-700 border-red-200',
  PENDIENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAGADA: 'bg-green-100 text-green-700 border-green-200',
  VENCIDA: 'bg-red-200 text-red-800 border-red-300',
  ATENDIDO_TOTAL: 'bg-green-100 text-green-700 border-green-200',
  ATENDIDO_PARCIAL: 'bg-orange-100 text-orange-700 border-orange-200',
  NO_ATENDIDO: 'bg-red-100 text-red-700 border-red-200',
} as const

const labels: Record<string, string> = {
  POR_VENCER: 'Por vencer',
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ATENDIDO_TOTAL: 'Atendido',
  ATENDIDO_PARCIAL: 'Parcial',
  NO_ATENDIDO: 'No atendido',
}

interface StatusBadgeProps {
  status: keyof typeof variants
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = variants[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {labels[status] ?? status}
    </span>
  )
}
