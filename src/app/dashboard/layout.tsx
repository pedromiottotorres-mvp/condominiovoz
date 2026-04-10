import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import BottomNav from '@/components/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, condominio_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'sindico') redirect('/demandas')

  const { data: condo } = await supabase
    .from('condominios')
    .select('nome')
    .eq('id', profile.condominio_id)
    .single()

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar — desktop only */}
      <DashboardSidebar condominioNome={condo?.nome ?? 'Condomínio'} />

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0 md:ml-56 pb-20 md:pb-0">
        {children}
      </div>

      {/* BottomNav — mobile only */}
      <div className="md:hidden">
        <BottomNav isSindico={true} />
      </div>
    </div>
  )
}
