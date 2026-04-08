import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import DemandasList from '@/components/DemandasList'
import type { DemandaCardData } from '@/components/DemandaCard'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, apartamento, role, condominio_id')
    .eq('id', user.id)
    .single()

  const isSindico = profile?.role === 'sindico'

  // Busca demandas do condomínio com nome do autor
  const { data: rows } = await supabase
    .from('demandas')
    .select(
      `id, titulo, categoria, total_apoios, created_at,
       autor:profiles!autor_id(nome, apartamento)`
    )
    .eq('condominio_id', profile?.condominio_id)
    .order('total_apoios', { ascending: false })

  // Busca apoios do usuário atual para marcar "apoiado_por_mim"
  const demandaIds = (rows ?? []).map((r) => r.id)
  const { data: meusApoios } = demandaIds.length
    ? await supabase
        .from('apoios')
        .select('demanda_id')
        .eq('morador_id', user.id)
        .in('demanda_id', demandaIds)
    : { data: [] }

  const apoiadosSet = new Set((meusApoios ?? []).map((a) => a.demanda_id))

  const demandas: DemandaCardData[] = (rows ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    categoria: r.categoria,
    total_apoios: r.total_apoios,
    created_at: r.created_at,
    autor: Array.isArray(r.autor) ? r.autor[0] : r.autor,
    apoiado_por_mim: apoiadosSet.has(r.id),
  }))

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold" style={{ color: '#1e3a5f' }}>
              Demandas
            </h1>
            <p className="text-xs text-gray-400">{profile?.nome?.split(' ')[0]}</p>
          </div>
          <Link
            href="/nova-demanda"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: '#10b981' }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        <DemandasList demandas={demandas} userId={user.id} />
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
