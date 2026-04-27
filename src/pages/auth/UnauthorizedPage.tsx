import { useNavigate } from "react-router-dom"
import { ShieldX } from "lucide-react"

export function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX size={32} className="text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Acesso negado</h1>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Não tem permissão para aceder a esta página. Contacte o administrador se
          precisar de acesso.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
