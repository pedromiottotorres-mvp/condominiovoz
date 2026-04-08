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

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção',
  seguranca: 'Segurança',
  lazer: 'Lazer',
  estetica: 'Estética',
  estrutural: 'Estrutural',
  outro: 'Outro',
}

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

  // Todas as queries em paralelo
  const [
    { count: totalAbertas },
    { count: totalMoradores },
    { count: totalVotacoesAtivas },
    { data: todasDemandas },
    { data: topDemandas },
    { data: ultimaVotacaoRows },
    { data: condo },
  ] = await Promise.all([
    supabase
      .from('demandas')
      .select('id', { count: 'exact', head: true })
      .eq('condominio_id', condoId)
      .eq('status', 'aberta'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('condominio_id', condoId),
    supabase
      .from('votacoes')
      .select('id', { count: 'exact', head: true })
      .eq('condominio_id', condoId)
      .eq('status', 'aberta'),
    supabase
      .from('demandas')
      .select('categoria, status')
      .eq('condominio_id', condoId),
    supabase
      .from('demandas')
      .select('id, titulo, categoria, total_apoios')
      .eq('condominio_id', condoId)
      .order('total_apoios', { ascending: false })
      .limit(10),
    supabase
      .from('votacoes')
      .select('id')
      .eq('condominio_id', condoId)
      .eq('status', 'encerrada')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('condominios')
      .select('total_unidades')
      .eq('id', condoId)
      .single(),
  ])

  // Participação na última votação encerrada
  const ultimaVotacaoId = ultimaVotacaoRows?.[0]?.id ?? null
  const totalUnidades = condo?.total_unidades ?? 50

  const { count: votosUltimaVotacao } = ultimaVotacaoId
    ? await supabase
        .from('votos')
        .select('id', { count: 'exact', head: true })
        .eq('votacao_id', ultimaVotacaoId)
    : { count: 0 }

  const participacao = ultimaVotacaoId
    ? Math.round(((votosUltimaVotacao ?? 0) / totalUnidades) * 100)
    : null

  // Agrupamento de demandas por categoria
  const contagemCategoria: Record<string, number> = {}
  ;(todasDemandas ?? []).forEach(({ categoria }) => {
    contagemCategoria[categoria] = (contagemCategoria[categoria] ?? 0) + 1
  })
  const dadosPizza = Object.entries(contagemCategoria)
    .filter(([, total]) => total > 0)
    .map(([categoria, total]) => ({ categoria, total }))

  // Saúde do condomínio
  const totalDemandas = todasDemandas?.length ?? 0
  const concluidas =
    todasDemandas?.filter((d) => d.status === 'concluida').length ?? 0
  const saude =
    totalDemandas > 0 ? Math.round((concluidas / totalDemandas) * 100) : 0

  const metricCards = [
    {
      label: 'Demandas abertas',
      value: totalAbertas ?? 0,
      Icon: MessageSquare,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-700',
    },
    {
      label: 'Moradores',
      value: totalMoradores ?? 0,
      Icon: Users,
      bg: 'bg-green-50',
      iconColor: 'text-green-500',
      textColor: 'text-green-700',
    },
    {
      label: 'Votações ativas',
      value: totalVotacoesAtivas ?? 0,
      Icon: Vote,
      bg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-700',
    },
    {
      label: 'Participação',
      value: participacao !== null ? `${participacao}%` : '—',
      Icon: TrendingUp,
      bg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      textColor: 'text-purple-700',
      sub: participacao !== null ? 'última votação' : 'sem votações encerradas',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4">
        <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
          Dashboard
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Visão geral do condomínio
        </p>
      </header>

      <main className="px-4 md:px-8 py-6 flex flex-col gap-8 max-w-4xl">
        {/* Cards de métricas 2×2 mobile / 4×1 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCards.map(({ label, value, Icon, bg, iconColor, textColor, sub }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div>
                <p className={`text-2xl font-bold leading-none ${textColor}`}>
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
                {sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Gráficos — 2 colunas no desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 10 demandas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Top 10 Demandas por Apoios
            </h2>
            {(topDemandas ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Nenhuma demanda cadastrada ainda.
              </p>
            ) : (
              <GraficoBarras dados={topDemandas ?? []} />
            )}
          </div>

          {/* Pizza de categorias */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              Demandas por Categoria
            </h2>
            {dadosPizza.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Nenhuma demanda cadastrada.
              </p>
            ) : (
              <GraficoPizza dados={dadosPizza} />
            )}
          </div>

          {/* Saúde do condomínio */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Saúde do Condomínio
            </h2>
            <div className="flex-1 flex items-center justify-center py-2">
              <SaudeIndicador score={saude} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center border-t border-gray-50 pt-4">
              {[
                { label: 'Abertas', value: totalAbertas ?? 0, color: 'text-blue-600' },
                { label: 'Concluídas', value: concluidas, color: 'text-green-600' },
                { label: 'Total', value: totalDemandas, color: 'text-gray-600' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda de categorias */}
        {dadosPizza.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Distribuição por Categoria
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dadosPizza
                .sort((a, b) => b.total - a.total)
                .map(({ categoria, total }) => (
                  <div
                    key={categoria}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-xs text-gray-600">
                      {CATEGORIA_LABELS[categoria] ?? categoria}
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
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
