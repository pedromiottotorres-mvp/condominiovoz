import { redirect } from 'next/navigation'
import {
  MessageSquare,
  Users,
  Vote,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import GraficoBarras from '@/components/dashboard/GraficoBarras'
import GraficoPizza from '@/components/dashboard/GraficoPizza'
import SaudeIndicador from '@/components/dashboard/SaudeIndicador'
import CodigoConviteCard from '@/components/dashboard/CodigoConviteCard'

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção',
  seguranca: 'Segurança',
  lazer: 'Lazer',
  estetica: 'Estética',
  estrutural: 'Estrutural',
  outro: 'Outro',
}

const METRIC_STYLE = [
  { iconBg: 'var(--navy-pale)',  iconColor: 'var(--navy)',      valueColor: 'var(--navy)'      },
  { iconBg: 'var(--mint-pale)',  iconColor: 'var(--mint-dark)', valueColor: 'var(--mint-dark)' },
  { iconBg: '#fef9c3',           iconColor: '#a16207',          valueColor: '#a16207'          },
  { iconBg: '#f3e8ff',           iconColor: '#7e22ce',          valueColor: '#7e22ce'          },
]

export default async function DashboardPage() {
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

  const condoId = profile?.condominio_id

  const [
    { count: totalAbertas },
    { count: totalMoradores },
    { count: totalVotacoesAtivas },
    { data: todasDemandas },
    { data: topDemandas },
    { data: ultimaVotacaoRows },
    { data: condo },
  ] = await Promise.all([
    supabase.from('demandas').select('id', { count: 'exact', head: true }).eq('condominio_id', condoId).eq('status', 'aberta'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('condominio_id', condoId),
    supabase.from('votacoes').select('id', { count: 'exact', head: true }).eq('condominio_id', condoId).eq('status', 'aberta'),
    supabase.from('demandas').select('categoria, status').eq('condominio_id', condoId),
    supabase.from('demandas').select('id, titulo, categoria, total_apoios').eq('condominio_id', condoId).order('total_apoios', { ascending: false }).limit(10),
    supabase.from('votacoes').select('id').eq('condominio_id', condoId).eq('status', 'encerrada').order('created_at', { ascending: false }).limit(1),
    supabase.from('condominios').select('total_unidades, nome, codigo_convite').eq('id', condoId).single(),
  ])

  const ultimaVotacaoId = ultimaVotacaoRows?.[0]?.id ?? null
  const totalUnidades = condo?.total_unidades ?? 50
  const codigoConvite = condo?.codigo_convite ?? ''
  const condoNome = condo?.nome ?? 'Condomínio'

  const { count: votosUltimaVotacao } = ultimaVotacaoId
    ? await supabase.from('votos').select('id', { count: 'exact', head: true }).eq('votacao_id', ultimaVotacaoId)
    : { count: 0 }

  const participacao = ultimaVotacaoId
    ? Math.round(((votosUltimaVotacao ?? 0) / totalUnidades) * 100)
    : null

  const contagemCategoria: Record<string, number> = {}
  ;(todasDemandas ?? []).forEach(({ categoria }) => {
    contagemCategoria[categoria] = (contagemCategoria[categoria] ?? 0) + 1
  })
  const dadosPizza = Object.entries(contagemCategoria)
    .filter(([, total]) => total > 0)
    .map(([categoria, total]) => ({ categoria, total }))

  const totalDemandas = todasDemandas?.length ?? 0
  const concluidas = todasDemandas?.filter((d) => d.status === 'concluida').length ?? 0
  const saude = totalDemandas > 0 ? Math.round((concluidas / totalDemandas) * 100) : 0

  const metricCards = [
    { label: 'Demandas abertas', value: totalAbertas ?? 0,                                Icon: MessageSquare },
    { label: 'Moradores',        value: totalMoradores ?? 0,                              Icon: Users        },
    { label: 'Votações ativas',  value: totalVotacoesAtivas ?? 0,                         Icon: Vote         },
    { label: 'Participação',     value: participacao !== null ? `${participacao}%` : '—', Icon: TrendingUp,
      sub: participacao !== null ? 'última votação' : 'sem votações encerradas' },
  ]

  const cardStyle = {
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--gray-100)',
    boxShadow: 'var(--shadow-card)',
    padding: '20px',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    color: 'var(--navy)',
    marginBottom: '16px',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--gray-100)',
          padding: '20px 24px',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
          Visão geral do condomínio
        </p>
      </header>

      <main className="px-4 md:px-8 py-6 flex flex-col gap-6" style={{ maxWidth: '960px' }}>

        {/* Card código de convite */}
        {codigoConvite && (
          <CodigoConviteCard codigo={codigoConvite} condoNome={condoNome} />
        )}

        {/* Metric cards 2×2 / 4×1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCards.map(({ label, value, Icon, sub }, i) => {
            const s = METRIC_STYLE[i]
            return (
              <div key={label} style={cardStyle} className="flex flex-col gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: s.iconBg }}
                >
                  <Icon size={19} style={{ color: s.iconColor }} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.75rem',
                      lineHeight: 1,
                      color: s.valueColor,
                      marginBottom: '4px',
                    }}
                  >
                    {value}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                    {label}
                  </p>
                  {sub && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                      {sub}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Top 10 barras — full width */}
          <div style={{ ...cardStyle, padding: '24px' }} className="md:col-span-2">
            <h2 style={sectionLabelStyle}>Top 10 Demandas por Apoios</h2>
            {(topDemandas ?? []).length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)' }}>
                Nenhuma demanda cadastrada ainda.
              </p>
            ) : (
              <GraficoBarras dados={topDemandas ?? []} />
            )}
          </div>

          {/* Pizza */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h2 style={sectionLabelStyle}>Demandas por Categoria</h2>
            {dadosPizza.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)' }}>
                Nenhuma demanda cadastrada.
              </p>
            ) : (
              <GraficoPizza dados={dadosPizza} />
            )}
          </div>

          {/* Saúde */}
          <div style={{ ...cardStyle, padding: '24px' }} className="flex flex-col">
            <h2 style={sectionLabelStyle}>Saúde do Condomínio</h2>
            <div className="flex-1 flex items-center justify-center py-2">
              <SaudeIndicador score={saude} />
            </div>
            <div
              className="grid grid-cols-3 gap-2 text-center mt-4 pt-4"
              style={{ borderTop: '1px solid var(--gray-100)' }}
            >
              {[
                { label: 'Abertas',   value: totalAbertas ?? 0, color: 'var(--navy)'      },
                { label: 'Concluídas', value: concluidas,       color: 'var(--mint-dark)' },
                { label: 'Total',     value: totalDemandas,     color: 'var(--gray-500)'  },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color, lineHeight: 1 }}>
                    {value}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '3px' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribuição por categoria */}
        {dadosPizza.length > 0 && (
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h2 style={sectionLabelStyle}>Distribuição por Categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dadosPizza
                .sort((a, b) => b.total - a.total)
                .map(({ categoria, total }) => (
                  <div
                    key={categoria}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gray-100)',
                    }}
                  >
                    <span style={{ fontSize: '0.8375rem', color: 'var(--gray-600)', fontFamily: 'var(--font-body)' }}>
                      {CATEGORIA_LABELS[categoria] ?? categoria}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                      {total}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
