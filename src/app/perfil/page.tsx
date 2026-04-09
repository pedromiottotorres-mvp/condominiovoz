import { redirect } from 'next/navigation'
import { User, Home, Building2, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import LogoutButton from './LogoutButton'

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, apartamento, role, created_at, condominio_id')
    .eq('id', user.id)
    .single()

  const { data: condo } = await supabase
    .from('condominios')
    .select('nome')
    .eq('id', profile?.condominio_id)
    .single()

  const isSindico = profile?.role === 'sindico'

  const membroDesde = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-base font-bold" style={{ color: '#1e3a5f' }}>
            Perfil
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Avatar + nome */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {profile?.nome?.charAt(0).toUpperCase() ?? '?'}
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">{profile?.nome}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
          </div>

          {/* Badge de role */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isSindico
                ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isSindico ? <ShieldCheck size={12} /> : <User size={12} />}
            {isSindico ? 'Síndico' : 'Morador'}
          </span>
        </div>

        {/* Dados do perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Informações
            </p>
          </div>

          {[
            { Icon: User,      label: 'Nome completo', value: profile?.nome ?? '—' },
            { Icon: Home,      label: 'Apartamento',   value: `Apto ${profile?.apartamento ?? '—'}` },
            { Icon: Building2, label: 'Condomínio',    value: condo?.nome ?? '—' },
          ].map(({ Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Membro desde */}
        <p className="text-xs text-center text-gray-400">
          Membro desde {membroDesde}
        </p>

        {/* Logout */}
        <LogoutButton />
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
