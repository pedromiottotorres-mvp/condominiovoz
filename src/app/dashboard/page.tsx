import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Plus, ChevronRight, Wallet } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import GraficoBarras from '@/components/dashboard/GraficoBarras'
import GraficoPizza from '@/components/dashboard/GraficoPizza'
import SaudeIndicador from '@/components/dashboard/SaudeIndicador'
import CodigoConviteCard from '@/components/dashboard/CodigoConviteCard'
import MetricCard from '@/components/dashboard/MetricCard'

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção', seguranca: 'Segurança', lazer: 'Lazer',
  estetica: 'Estética', estrutural: 'Estrutural', outro: 'Outro',
}

const METRIC_STYLE = [
  { iconBg: 'var(--navy-pale)',  iconColor: 'var(--navy)',      valueColor: 'var(--navy)'      },
  { iconBg: 'var(--mint-pale)',  iconColor: 'var(--mint-dark)', valueColor: 'var(--mint-dark)' },
  { iconBg: '#fef9c3',           iconColor: '#a16207',          valueColor: '#a16207'          },
  { iconBg: '#f3e8ff',           iconColor: '#7e22ce',          valueColor: '#7e22ce'          },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('condominio_id').eq('id', user.id).single()

  const condoId = profile?.condominio_id

  const [
    { count: totalAbertas },
    { count: totalMoradores },
    { count: totalVotacoesAtivas },
    { data: todasDemandas },
    { data: topDemandas },
    { data: ultimaVotacaoRows },
    { data: condo },
    { data: cicloRows },
  ] = await Promise.all([
    supabase.from('demandas').select('id', { count: 'exact', head: true }).eq('condominio_id', condoId).eq('status', 'aberta'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('condominio_id', condoId),
    supabase.from('votacoes').select('id', { count: 'exact', head: true }).eq('condominio_id', condoId).eq('status', 'aberta'),
    supabase.from('demandas').select('categoria, status').eq('condominio_id', condoId),
    supabase.from('demandas').select('id, titulo, categoria, total_apoios').eq('condominio_id', condoId).order('total_apoios', { ascending: false }).limit(10),
    supabase.from('votacoes').select('id').eq('condominio_id', condoId).eq('status', 'encerrada').order('created_at', { ascending: false }).limit(1),
    supabase.from('condominios').select('total_unidades, nome, codigo_convite').eq('id', condoId).single(),
    supabase.from('ciclos').select('id, nome, fase, orcamento_disponivel, prazo_demandas, prazo_votacao').eq('condominio_id', condoId).neq('fase', 'encerrado').order('criado_em', { ascending: false }).limit(1),
  ])

  const cicloAtivo = cicloRows?.[0] ?? null

  // Métricas do ciclo ativo (se houver)
  const [cicloDemandasResult, cicloQualificadasResult, cicloVotosResult] = cicloAtivo
    ? await Promise.all([
        supabase.from('demandas').select('id', { count: 'exact', head: true }).eq('ciclo_id', cicloAtivo.id),
        supabase.from('demandas').select('id', { count: 'exact', head: true }).eq('ciclo_id', cicloAtivo.id).eq('qualificada', true),
        supabase.from('votos_prioridade').select('apartamento').eq('ciclo_id', cicloAtivo.id),
      ])
    : [{ count: 0 }, { count: 0 }, { data: [] as { apartamento: string }[] }]

  const cicloDemandasQtd = cicloDemandasResult.count ?? 0
  const cicloQualificadasQtd = cicloQualificadasResult.count ?? 0
  const cicloApartamentosVotaram = new Set(
    (cicloVotosResult.data ?? []).map((v) => (v as { apartamento: string }).apartamento)
  ).size

  const ultimaVotacaoId = ultimaVotacaoRows?.[0]?.id ?? null
  const totalUnidades = condo?.total_unidades ?? 50
  const codigoConvite = condo?.codigo_convite ?? ''
  const condoNome = condo?.nome ?? 'Condomínio'

  const { count: votosUltimaVotacao } = ultimaVotacaoId
    ? await supabase.from('votos').select('id', { count: 'exact', head: true }).eq('votacao_id', ultimaVotacaoId)
    : { count: 0 }

  const participacao = ultimaVotacaoId
    ? Math.round(((votosUltimaVotacao ?? 0) / totalUnidades) * 100) : null

  // Financeiro do mês atual
  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()
  const { data: finMes } = await supabase
    .from('financeiro_mensal')
    .select('receita_condominial, custos_fixos, saldo_investimento')
    .eq('condominio_id', condoId)
    .eq('mes', mesAtual)
    .eq('ano', anoAtual)
    .maybeSingle()

  const contagemCategoria: Record<string, number> = {}
  ;(todasDemandas ?? []).forEach(({ categoria }) => {
    contagemCategoria[categoria] = (contagemCategoria[categoria] ?? 0) + 1
  })
  const dadosPizza = Object.entries(contagemCategoria).filter(([, t]) => t > 0).map(([categoria, total]) => ({ categoria, total }))

  const totalDemandas = todasDemandas?.length ?? 0
  const concluidas = todasDemandas?.filter((d) => d.status === 'concluida').length ?? 0
  const saude = totalDemandas > 0 ? Math.round((concluidas / totalDemandas) * 100) : 0

  const metricCards = [
    { label: 'Demandas abertas', value: totalAbertas ?? 0,                               icon: 'MessageSquare' },
    { label: 'Moradores ativos', value: totalMoradores ?? 0,                             icon: 'Users'         },
    { label: 'Votações ativas',  value: totalVotacoesAtivas ?? 0,                        icon: 'Vote'          },
    { label: 'Participação',     value: participacao !== null ? `${participacao}%` : '—', icon: 'TrendingUp',
      sub: participacao !== null ? 'última votação' : 'sem votações encerradas' },
  ]

  const cardStyle = {
    background: '#fff', borderRadius: '20px',
    border: '1px solid var(--gray-100)',
    boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
    padding: '24px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative */}
      <div style={{
        position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid var(--gray-100)', padding: '20px 24px',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--navy)' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
            {condoNome}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '960px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {codigoConvite && (
          <CodigoConviteCard codigo={codigoConvite} condoNome={condoNome} />
        )}

        {/* Card de ciclo ativo */}
        {(() => {
          const FASE_CONFIG: Record<string, { label: string; borderColor: string; badgeBg: string; badgeColor: string }> = {
            demandas:  { label: '📝 Demandas Abertas',      borderColor: 'var(--mint)',  badgeBg: 'var(--mint-pale)',  badgeColor: 'var(--mint-dark)' },
            votacao:   { label: '🗳️ Votação em Andamento',  borderColor: 'var(--navy)',  badgeBg: 'var(--navy-pale)',  badgeColor: 'var(--navy)'      },
            resultado: { label: '📊 Resultado Disponível',  borderColor: '#f59e0b',      badgeBg: '#fef9c3',          badgeColor: '#a16207'          },
            execucao:  { label: '🔧 Em Execução',           borderColor: '#3b82f6',      badgeBg: '#dbeafe',          badgeColor: '#1d4ed8'          },
          }

          if (!cicloAtivo) {
            return (
              <div style={{
                background: '#fff', borderRadius: '20px', border: '1px solid var(--gray-100)',
                boxShadow: '0 2px 12px rgba(15,36,64,0.06)', padding: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '4px' }}>
                    Nenhum ciclo ativo
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                    Crie um ciclo para iniciar o processo participativo
                  </p>
                </div>
                <Link
                  href="/dashboard/novo-ciclo"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '12px',
                    background: 'var(--navy)', color: '#fff', textDecoration: 'none',
                    fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  <Plus size={14} />
                  Criar Ciclo
                </Link>
              </div>
            )
          }

          const cfg = FASE_CONFIG[cicloAtivo.fase] ?? FASE_CONFIG.demandas
          const prazoAtual = cicloAtivo.fase === 'demandas' ? cicloAtivo.prazo_demandas : cicloAtivo.prazo_votacao
          const diasRestantes = prazoAtual ? differenceInDays(new Date(prazoAtual), new Date()) : null
          const prazoFormatado = prazoAtual
            ? format(new Date(prazoAtual), "d 'de' MMMM", { locale: ptBR })
            : null
          const orcamentoFmt = Number(cicloAtivo.orcamento_disponivel).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

          return (
            <div style={{
              background: '#fff', borderRadius: '20px',
              border: '1px solid var(--gray-100)',
              borderLeft: `4px solid ${cfg.borderColor}`,
              boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badge fase */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '4px 12px', borderRadius: '50px',
                    fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                    background: cfg.badgeBg, color: cfg.badgeColor,
                    marginBottom: '10px',
                  }}>
                    {cfg.label}
                  </span>
                  {/* Nome + orçamento */}
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: '4px' }}>
                    {cicloAtivo.nome}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--mint-dark)', marginBottom: '10px' }}>
                    {orcamentoFmt} disponível
                  </p>
                  {/* Countdown */}
                  {prazoFormatado && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
                      <Clock size={13} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                        {diasRestantes !== null && diasRestantes >= 0
                          ? `Encerra em ${diasRestantes === 0 ? 'menos de 1 dia' : `${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`} · ${prazoFormatado}`
                          : `Encerrou em ${prazoFormatado}`}
                      </span>
                    </div>
                  )}
                  {/* Mini métricas */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                      <strong style={{ color: 'var(--navy)' }}>{cicloDemandasQtd}</strong> demandas
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                      <strong style={{ color: 'var(--mint-dark)' }}>{cicloQualificadasQtd}</strong> qualificadas
                    </span>
                    {cicloAtivo.fase === 'votacao' && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                        <strong style={{ color: 'var(--navy)' }}>{cicloApartamentosVotaram}</strong> apts votaram
                      </span>
                    )}
                  </div>
                </div>
                {/* Botão gerenciar */}
                <Link
                  href={`/dashboard/ciclo/${cicloAtivo.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 18px', borderRadius: '12px',
                    border: '1.5px solid var(--gray-200)', background: '#fff',
                    color: 'var(--navy)', textDecoration: 'none',
                    fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                    flexShrink: 0, whiteSpace: 'nowrap',
                  }}
                >
                  Gerenciar <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )
        })()}

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
             className="md:grid-cols-4">
          {metricCards.map(({ label, value, icon, sub }, i) => {
            const s = METRIC_STYLE[i]
            return (
              <MetricCard
                key={label}
                label={label}
                value={value}
                sub={sub}
                icon={icon}
                iconBg={s.iconBg}
                iconColor={s.iconColor}
                valueColor={s.valueColor}
              />
            )
          })}
        </div>

        {/* Card Financeiro */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--navy-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Wallet size={18} style={{ color: 'var(--navy)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
                Financeiro: Mês Atual
              </h2>
            </div>
            <Link
              href="/dashboard/financeiro"
              style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
            >
              Ver histórico →
            </Link>
          </div>

          {finMes ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Receita', value: finMes.receita_condominial, color: 'var(--navy)' },
                { label: 'Custos',  value: finMes.custos_fixos,        color: '#dc2626'     },
                { label: 'Saldo',   value: finMes.saldo_investimento ?? (finMes.receita_condominial - finMes.custos_fixos),
                  color: (finMes.saldo_investimento ?? (finMes.receita_condominial - finMes.custos_fixos)) >= 0 ? 'var(--mint-dark)' : '#dc2626' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: 'var(--gray-50)', borderRadius: '12px',
                  padding: '14px 16px', border: '1px solid var(--gray-100)',
                }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color, lineHeight: 1.1 }}>
                    {Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 0' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                Atualize os dados financeiros do mês
              </p>
              <Link
                href="/dashboard/financeiro"
                style={{
                  padding: '8px 18px', borderRadius: '10px',
                  background: 'var(--navy)', color: '#fff',
                  fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                  textDecoration: 'none', flexShrink: 0,
                }}
              >
                Atualizar
              </Link>
            </div>
          )}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="md:grid-cols-2">
          <div style={{ ...cardStyle }} className="md:col-span-2">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '16px' }}>
              Top 10 Demandas por Apoios
            </h2>
            {(topDemandas ?? []).length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)' }}>Nenhuma demanda cadastrada ainda.</p>
            ) : <GraficoBarras dados={topDemandas ?? []} />}
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '16px' }}>
              Demandas por Categoria
            </h2>
            {dadosPizza.length === 0
              ? <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)' }}>Nenhuma demanda cadastrada.</p>
              : <GraficoPizza dados={dadosPizza} />}
          </div>

          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '16px' }}>
              Saúde do Condomínio
            </h2>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
              <SaudeIndicador score={saude} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-100)' }}>
              {[
                { label: 'Abertas',    value: totalAbertas ?? 0, color: 'var(--navy)'      },
                { label: 'Concluídas', value: concluidas,        color: 'var(--mint-dark)' },
                { label: 'Total',      value: totalDemandas,     color: 'var(--gray-500)'  },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '3px' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {dadosPizza.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '16px' }}>
              Distribuição por Categoria
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }} className="md:grid-cols-3">
              {dadosPizza.sort((a, b) => b.total - a.total).map(({ categoria, total }) => (
                <div key={categoria} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', background: 'var(--gray-50)',
                  borderRadius: '10px', border: '1px solid var(--gray-100)',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontFamily: 'var(--font-body)' }}>
                    {CATEGORIA_LABELS[categoria] ?? categoria}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
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
