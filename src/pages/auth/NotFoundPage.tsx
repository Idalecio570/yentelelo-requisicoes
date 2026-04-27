import { Link } from "react-router-dom"
import { FileQuestion } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <FileQuestion size={28} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
        <p className="text-sm text-gray-500 mb-6">
          A página que procura não existe ou foi movida.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
