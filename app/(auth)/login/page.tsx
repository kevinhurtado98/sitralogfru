import { LoginForm } from '@/components/auth/LoginForm'
import { Building2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
          <Building2 className="h-9 w-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">SITRALOGFRU</h1>
        <p className="text-slate-400 text-sm mt-1">Sistema de Gestión Logística – Fruchincha</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
        <LoginForm />
      </div>
    </div>
  )
}
