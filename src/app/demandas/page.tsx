import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import DemandasList from '@/components/DemandasList'
import CardComoFunciona from '@/components/CardComoFunciona'
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

  const [condoResult, cicloResult, rowsResult] = await Promise.all([
    supabase.from('condominios').select('nome').eq('id', profile?.condominio_id).single(),
    supabase
      .from('ciclos')
      .select('id, nome, fase, prazo_demandas, prazo_votacao')
      .eq('condominio_id', profile?.condominio_id)
      .neq('fase', 'encerrado')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('demandas')
      .select(
        `id, titulo, categoria, total_apoios, created_at, ciclo_id, custo_estimado,
         autor:profiles!autor_id(nome, apartamento)`
      )
      .eq('condominio_id', profile?.condominio_id)
      .order('total_apoios', { ascending: false }),
  ])

  const condoData = condoResult.data
  const ciclo = cicloResult.data
  const rows = rowsResult.data

  const demandaIds = (rows ?? []).map((r) => r.id)
  const { data: meusApoios } = demandaIds.length
    ? await supabase
        .from('apoios')
        .select('demanda_id')
        .eq('morador_id', user.id)
        .in('demanda_id', demandaIds)
    : { data: [] }

  const apoiadosSet = new Set((meusApoios ?? []).map((a) => a.demanda_id))

  // Mapa server-side: ciclo_id → demanda_id que o morador já apoiou naquele ciclo
  const cicloApoiadoMapInicial: Record<string, string> = {}
  ;(rows ?? []).forEach((r) => {
    if (r.ciclo_id && apoiadosSet.has(r.id)) {
      cicloApoiadoMapInicial[r.ciclo_id] = r.id
    }
  })

  const demandas: DemandaCardData[] = (rows ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    categoria: r.categoria,
    total_apoios: r.total_apoios,
    created_at: r.created_at,
    autor: Array.isArray(r.autor) ? r.autor[0] : r.autor,
    apoiado_por_mim: apoiadosSet.has(r.id),
    ciclo_id: r.ciclo_id ?? null,
    custo_estimado: r.custo_estimado ?? null,
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '96px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40,
        padding: '16px 20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)', lineHeight: 1.2 }}>
              Demandas
            </h1>
            {condoData?.nome && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                {condoData.nome}
              </p>
            )}
          </div>
          <Link
            href="/nova-demanda"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--navy)', color: '#fff',
              padding: '10px 20px', borderRadius: '12px',
              fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(30,58,95,0.2)',
              transition: 'transform 0.15s var(--ease-spring), box-shadow 0.2s',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Nova
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Ciclo Banner */}
        {(() => {
          if (!ciclo) {
            return (
              <div style={{
                background: 'var(--gray-100)', borderRadius: '14px',
                padding: '14px 18px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '1rem' }}>💤</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  Não há ciclo ativo no momento. Aguarde o síndico abrir um novo ciclo.
                </p>
              </div>
            )
          }

          if (ciclo.fase === 'demandas') {
            const prazo = ciclo.prazo_demandas
              ? format(new Date(ciclo.prazo_demandas), "dd/MM", { locale: ptBR })
              : null
            return (
              <div style={{
                background: 'var(--mint-pale)', border: '1px solid var(--mint)',
                borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>📝</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--mint-dark)', fontFamily: 'var(--font-body)', margin: 0, fontWeight: 500 }}>
                    Ciclo aberto{prazo ? ` até ${prazo}` : ''}! Registre suas demandas.
                  </p>
                </div>
                <Link
                  href="/nova-demanda"
                  style={{
                    padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem',
                    fontWeight: 700, background: 'var(--mint-dark)', color: '#fff',
                    textDecoration: 'none', fontFamily: 'var(--font-body)', flexShrink: 0,
                  }}
                >
                  Nova Demanda
                </Link>
              </div>
            )
          }

          if (ciclo.fase === 'votacao') {
            const prazo = ciclo.prazo_votacao
              ? format(new Date(ciclo.prazo_votacao), "dd/MM", { locale: ptBR })
              : null
            return (
              <div style={{
                background: 'var(--navy-pale)', border: '1px solid rgba(30,58,95,0.2)',
                borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🗳️</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--navy)', fontFamily: 'var(--font-body)', margin: 0, fontWeight: 500 }}>
                    Votação aberta{prazo ? ` até ${prazo}` : ''}! Vote nas suas prioridades.
                  </p>
                </div>
                <Link
                  href={`/votacao-ciclo/${ciclo.id}`}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem',
                    fontWeight: 700, background: 'var(--navy)', color: '#fff',
                    textDecoration: 'none', fontFamily: 'var(--font-body)', flexShrink: 0,
                  }}
                >
                  Votar Agora
                </Link>
              </div>
            )
          }

          if (ciclo.fase === 'resultado' || ciclo.fase === 'execucao') {
            return (
              <div style={{
                background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>📊</span>
                  <p style={{ fontSize: '0.85rem', color: '#c2410c', fontFamily: 'var(--font-body)', margin: 0, fontWeight: 500 }}>
                    {ciclo.fase === 'resultado' ? 'O resultado do ciclo está disponível.' : 'Demandas aprovadas em execução.'}
                  </p>
                </div>
                {isSindico && (
                  <Link
                    href={`/dashboard/ciclo/${ciclo.id}`}
                    style={{
                      padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem',
                      fontWeight: 700, background: '#c2410c', color: '#fff',
                      textDecoration: 'none', fontFamily: 'var(--font-body)', flexShrink: 0,
                    }}
                  >
                    Ver Ciclo
                  </Link>
                )}
              </div>
            )
          }

          return null
        })()}

        {ciclo && !isSindico && <CardComoFunciona />}

        <DemandasList demandas={demandas} userId={user.id} cicloApoiadoMapInicial={cicloApoiadoMapInicial} />
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
