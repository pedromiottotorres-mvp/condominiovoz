import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <Building2 size={32} className="text-white" />
      </div>

      <h1 className="text-6xl font-bold mb-2" style={{ color: '#1e3a5f' }}>
        404
      </h1>
      <p className="text-lg font-semibold text-gray-700 mb-2">
        Página não encontrada
      </p>
      <p className="text-sm text-gray-400 max-w-xs mb-8">
        A página que você procura não existe ou foi movida.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <ArrowLeft size={16} />
        Voltar para demandas
      </Link>
    </div>
  )
}
