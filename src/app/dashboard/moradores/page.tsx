import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'

const ROLE_LABEL: Record<string, string> = {
  morador: 'Morador',
  sindico: 'Síndico',
}

export default async function MoradoresPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condominio_id')
    .eq('id', user.id)
    .single()

  const { data: moradores } = await supabase
    .from('profiles')
    .select('id, nome, apartamento, role, created_at')
    .eq('condominio_id', profile?.condominio_id)
    .order('apartamento', { ascending: true })

  const total = moradores?.length ?? 0

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
              Moradores
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} {total === 1 ? 'morador cadastrado' : 'moradores cadastrados'}
            </p>
          </div>
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-green-600" />
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-3xl">
        {total === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">Nenhum morador cadastrado ainda.</p>
          </div>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Nome
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Apto
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Perfil
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Cadastro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {moradores?.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {m.nome}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {m.apartamento}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            m.role === 'sindico'
                              ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {format(new Date(m.created_at), "d MMM yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="md:hidden flex flex-col gap-2">
              {moradores?.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">Apto {m.apartamento}</span>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          m.role === 'sindico'
                            ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(m.created_at), "d MMM yy", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
