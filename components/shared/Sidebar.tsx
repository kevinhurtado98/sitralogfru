'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  ClipboardList,
  Activity,
  BarChart2,
  LogOut,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/indicadores', label: 'Indicadores', icon: BarChart2 },
  { href: '/comprobantes', label: 'Comprobantes', icon: FileText },
  { href: '/requerimientos', label: 'Requerimientos', icon: ClipboardList },
  { href: '/auditoria', label: 'Auditoría', icon: Activity },
]

interface SidebarProps {
  user: { name: string; role: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <Building2 className="h-8 w-8 text-blue-400 shrink-0" />
        <div>
          <p className="font-bold text-sm leading-tight">SITRALOGFRU</p>
          <p className="text-xs text-slate-400 leading-tight">Fruchincha</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="mb-3">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-slate-400 capitalize">
            {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
