import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import DemandasList from '@/components/DemandasList'
import type { DemandaCardData } from '@/components/DemandaCard'

export default async function DemandasPage() {
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

  const { data: rows } = await supabase
    .from('demandas')
    .select(
      `id, titulo, categoria, total_apoios, created_at,
       autor:profiles!autor_id(nome, apartamento)`
    )
    .eq('condominio_id', profile?.condominio_id)
    .order('total_apoios', { ascending: false })

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

  const primeiroNome = profile?.nome?.split(' ')[0] ?? ''

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.375rem',
                color: 'var(--navy)',
                lineHeight: 1.2,
              }}
            >
              Demandas
            </h1>
            {primeiroNome && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '1px' }}>
                Olá, {primeiroNome}
              </p>
            )}
          </div>
          <Link
            href="/nova-demanda"
            className="flex items-center gap-2"
            style={{
              background: 'var(--navy)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8375rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Nova
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        <DemandasList demandas={demandas} userId={user.id} />
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
