import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, apartamento, role')
    .eq('id', user.id)
    .single()

  const isSindico = profile?.role === 'sindico'

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
              CondomínioVoz
            </h1>
            <p className="text-xs text-gray-400">Edifício Moema Park</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">
              {profile?.nome ?? 'Morador'}
            </p>
            <p className="text-xs text-gray-400">Apto {profile?.apartamento}</p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Bem-vindo, {profile?.nome?.split(' ')[0] ?? 'Morador'}!
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {isSindico
              ? 'Você está logado como síndico.'
              : 'Apartamento ' + profile?.apartamento}
          </p>
          <p className="text-xs text-gray-400 mt-4">
            As demandas aparecerão aqui em breve.
          </p>
        </div>
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
