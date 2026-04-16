import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import CicloAcoes from './CicloAcoes'
import StatusExecucaoSelect from './StatusExecucaoSelect'
import CustoInput from './CustoInput'

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção', seguranca: 'Segurança', lazer: 'Lazer',
  estetica: 'Estética', estrutural: 'Estrutural', outro: 'Outro',
}

const FASE_CONFIG: Record<string, { label: string; borderColor: string; badgeBg: string; badgeColor: string }> = {
  demandas:  { label: '📝 Demandas Abertas',     borderColor: 'var(--mint)',  badgeBg: 'var(--mint-pale)',  badgeColor: 'var(--mint-dark)' },
  votacao:   { label: '🗳️ Votação em Andamento', borderColor: 'var(--navy)',  badgeBg: 'var(--navy-pale)',  badgeColor: 'var(--navy)'      },
  resultado: { label: '📊 Resultado',            borderColor: '#f59e0b',      badgeBg: '#fef9c3',          badgeColor: '#a16207'          },
  execucao:  { label: '🔧 Em Execução',          borderColor: '#3b82f6',      badgeBg: '#dbeafe',          badgeColor: '#1d4ed8'          },
  encerrado: { label: '✅ Encerrado',            borderColor: 'var(--gray-300)', badgeBg: 'var(--gray-100)', badgeColor: 'var(--gray-500)' },
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function CicloPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, condominio_id').eq('id', user.id).single()
  if (profile?.role !== 'sindico') redirect('/demandas')

  const { data: ciclo } = await supabase
    .from('ciclos')
    .select('id, nome, fase, orcamento_disponivel, prazo_demandas, prazo_votacao, min_apoios_para_votacao, max_prioridades_por_voto')
    .eq('id', id).single()

  if (!ciclo) notFound()

  const { data: condo } = await supabase
    .from('condominios').select('total_unidades').eq('id', profile?.condominio_id).single()

  const totalUnidades = condo?.total_unidades ?? 50
  const fase = ciclo.fase as string
  const cfg = FASE_CONFIG[fase] ?? FASE_CONFIG.demandas
  const orcamentoFmt = fmt(Number(ciclo.orcamento_disponivel))

  // ── Dados por fase ──

  // FASE: demandas
  let todasDemandas: {
    id: string; titulo: string; categoria: string; custo_estimado: number | null
    total_apoios: number
  }[] = []

  // FASE: votacao
  let demandasVotacao: {
    id: string; titulo: string; categoria: string; custo_estimado: number | null; total_apoios: number
  }[] = []
  let apartamentosVotaram = 0

  // FASE: resultado / encerrado
  let ranking: {
    id: string; titulo: string; categoria: string; custo_estimado: number | null
    posicao_ranking: number | null; financiada: boolean
  }[] = []

  // FASE: execucao
  let demandasExecucao: {
    id: string; titulo: string; categoria: string; custo_estimado: number | null
    posicao_ranking: number | null; status_execucao: string | null
  }[] = []

  if (fase === 'demandas') {
    const { data } = await supabase
      .from('demandas')
      .select('id, titulo, categoria, custo_estimado, total_apoios')
      .eq('ciclo_id', id)
      .order('total_apoios', { ascending: false })
    todasDemandas = data ?? []
  }

  if (fase === 'votacao') {
    const [{ data: qualificadas }, { data: votos }] = await Promise.all([
      supabase.from('demandas')
        .select('id, titulo, categoria, custo_estimado, total_apoios')
        .eq('ciclo_id', id).eq('qualificada', true)
        .order('total_apoios', { ascending: false }),
      supabase.from('votos_prioridade').select('apartamento').eq('ciclo_id', id),
    ])
    demandasVotacao = qualificadas ?? []
    apartamentosVotaram = new Set((votos ?? []).map((v) => v.apartamento)).size
  }

  if (fase === 'resultado' || fase === 'encerrado') {
    if (fase === 'resultado') {
      const { data: rpcData } = await supabase.rpc('calcular_alocacao', { p_ciclo_id: id })
      if (Array.isArray(rpcData) && rpcData.length > 0) {
        ranking = rpcData
      }
    }
    if (ranking.length === 0) {
      const { data } = await supabase
        .from('demandas')
        .select('id, titulo, categoria, custo_estimado, posicao_ranking, financiada')
        .eq('ciclo_id', id)
        .not('posicao_ranking', 'is', null)
        .order('posicao_ranking')
      ranking = data ?? []
    }
  }

  if (fase === 'execucao') {
    const { data } = await supabase
      .from('demandas')
      .select('id, titulo, categoria, custo_estimado, posicao_ranking, status_execucao')
      .eq('ciclo_id', id).eq('financiada', true)
      .order('posicao_ranking')
    demandasExecucao = data ?? []
  }

  const totalFinanciado = ranking.filter(d => d.financiada).reduce((s, d) => s + (d.custo_estimado ?? 0), 0)
  const concluidasExec = demandasExecucao.filter(d => d.status_execucao === 'concluida').length

  const cardStyle = {
    background: '#fff', borderRadius: '20px',
    border: '1px solid var(--gray-100)',
    boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
    padding: '24px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '40px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard" style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, textDecoration: 'none',
          }}>
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--navy)', lineHeight: 1.2 }}>
              {ciclo.nome}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 10px', borderRadius: '50px',
                fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                background: cfg.badgeBg, color: cfg.badgeColor,
              }}>
                {cfg.label}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--mint-dark)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                {orcamentoFmt}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Botão de ação de fase */}
        {fase !== 'encerrado' && (
          <div style={{ ...cardStyle, padding: '20px 24px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '12px' }}>
              Ação da fase atual
            </p>
            <CicloAcoes
              cicloId={id}
              faseAtual={fase}
              demandasQualificadasIds={todasDemandas
                .filter(d => (Number(ciclo.min_apoios_para_votacao) - Number(d.total_apoios)) <= 0)
                .map(d => d.id)}
              demandasSemCusto={todasDemandas
                .filter(d => (Number(ciclo.min_apoios_para_votacao) - Number(d.total_apoios)) <= 0 && !(d.custo_estimado && d.custo_estimado > 0))
                .length}
            />
          </div>
        )}

        {/* ═══ FASE: DEMANDAS ═══ */}
        {fase === 'demandas' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
                Demandas do Ciclo
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                <strong style={{ color: 'var(--mint-dark)' }}>
                  {todasDemandas.filter(d => (Number(ciclo.min_apoios_para_votacao) - Number(d.total_apoios)) <= 0).length}
                </strong>
                {' de '}{todasDemandas.length} qualificadas
              </span>
            </div>
            {todasDemandas.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)' }}>
                Nenhuma demanda registrada neste ciclo ainda.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {todasDemandas.map((d, idx) => {
                  const faltando = Number(ciclo.min_apoios_para_votacao) - Number(d.total_apoios)
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                      padding: '14px 0',
                      borderBottom: idx < todasDemandas.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
                          {d.titulo}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                            {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                          </span>
                          {d.custo_estimado && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                              {fmt(d.custo_estimado)}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                            {d.total_apoios} apoios
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <CustoInput demandaId={d.id} custoInicial={d.custo_estimado} />
                        {faltando <= 0 ? (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: '50px',
                            background: 'var(--mint-pale)', color: 'var(--mint-dark)', fontFamily: 'var(--font-body)',
                            whiteSpace: 'nowrap',
                          }}>
                            Qualificada ✓
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: '50px',
                            background: 'var(--gray-100)', color: 'var(--gray-400)', fontFamily: 'var(--font-body)',
                            whiteSpace: 'nowrap',
                          }}>
                            {faltando} faltando
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ FASE: VOTAÇÃO ═══ */}
        {fase === 'votacao' && (
          <div style={cardStyle}>
            {/* Progresso */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
                  Progresso da Votação
                </h2>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                  {apartamentosVotaram} / {totalUnidades}
                </span>
              </div>
              <div style={{ height: '10px', background: 'var(--gray-100)', borderRadius: '50px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '50px',
                  background: 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)',
                  width: `${Math.min((apartamentosVotaram / totalUnidades) * 100, 100)}%`,
                  transition: 'width 0.5s var(--ease-spring)',
                }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
                {Math.round((apartamentosVotaram / totalUnidades) * 100)}% dos apartamentos votaram
              </p>
            </div>
            {/* Demandas qualificadas */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--navy)', marginBottom: '12px' }}>
              Demandas em Votação ({demandasVotacao.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {demandasVotacao.map((d, idx) => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  padding: '12px 0',
                  borderBottom: idx < demandasVotacao.length - 1 ? '1px solid var(--gray-100)' : 'none',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', fontFamily: 'var(--font-body)' }}>
                      {d.titulo}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                      {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                      {d.custo_estimado ? ` · ${fmt(d.custo_estimado)}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                    {d.total_apoios} apoios
                  </span>
                </div>
              ))}
            </div>
            {/* Prazo */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-100)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                Prazo de votação:{' '}
                <strong style={{ color: 'var(--navy)' }}>
                  {format(new Date(ciclo.prazo_votacao), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* ═══ FASE: RESULTADO / ENCERRADO ═══ */}
        {(fase === 'resultado' || fase === 'encerrado') && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
                Ranking de Alocação
              </h2>
              {ranking.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={13} style={{ color: 'var(--mint-dark)' }} />
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-body)', color: 'var(--gray-600)' }}>
                    <strong style={{ color: 'var(--mint-dark)' }}>{fmt(totalFinanciado)}</strong>
                    {' de '}{orcamentoFmt}
                  </span>
                </div>
              )}
            </div>
            {/* Barra de uso do orçamento */}
            {ranking.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '50px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '50px',
                    background: 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)',
                    width: `${Math.min((totalFinanciado / Number(ciclo.orcamento_disponivel)) * 100, 100)}%`,
                  }} />
                </div>
              </div>
            )}
            {/* Lista de demandas */}
            {ranking.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)' }}>
                Resultado ainda não calculado. Avance a fase para gerar o ranking.
              </p>
            ) : (
              <>
                {/* Linha divisória */}
                {ranking.some(d => d.financiada) && ranking.some(d => !d.financiada) && (
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mint-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
                    ✅ Financiadas
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: ranking.some(d => !d.financiada) ? '16px' : '0' }}>
                  {ranking.filter(d => d.financiada).map((d) => (
                    <div key={d.demanda_id || d.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', borderRadius: '14px',
                      background: 'var(--mint-pale)', border: '1.5px solid var(--mint)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--mint-dark)', flexShrink: 0, minWidth: '28px' }}>
                        #{d.posicao_ranking}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', fontFamily: 'var(--font-body)' }}>{d.titulo}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                          {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                          {d.custo_estimado ? ` · ${fmt(d.custo_estimado)}` : ''}
                        </p>
                      </div>
                      <CheckCircle2 size={18} style={{ color: 'var(--mint-dark)', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
                {ranking.some(d => !d.financiada) && (
                  <>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
                      ❌ Não financiadas
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ranking.filter(d => !d.financiada).map((d) => (
                        <div key={d.demanda_id || d.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px 16px', borderRadius: '14px',
                          background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                        }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gray-400)', flexShrink: 0, minWidth: '28px' }}>
                            #{d.posicao_ranking}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-600)', fontFamily: 'var(--font-body)' }}>{d.titulo}</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                              {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                              {d.custo_estimado ? ` · ${fmt(d.custo_estimado)}` : ''}
                            </p>
                          </div>
                          <XCircle size={18} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ FASE: EXECUÇÃO ═══ */}
        {fase === 'execucao' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
                Execução das Demandas
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                <strong style={{ color: 'var(--mint-dark)' }}>{concluidasExec}</strong> de {demandasExecucao.length} concluídas
              </span>
            </div>
            {/* Barra de progresso */}
            {demandasExecucao.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '50px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '50px',
                    background: 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)',
                    width: `${demandasExecucao.length > 0 ? (concluidasExec / demandasExecucao.length) * 100 : 0}%`,
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {demandasExecucao.map((d) => (
                <div key={d.id} style={{
                  padding: '16px', borderRadius: '14px',
                  background: 'var(--gray-50)', border: '1px solid var(--gray-100)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                        {d.titulo}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                        {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                        {d.custo_estimado ? ` · ${fmt(d.custo_estimado)}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                      #{d.posicao_ranking}
                    </span>
                  </div>
                  <StatusExecucaoSelect demandaId={d.id} statusAtual={d.status_execucao} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações do ciclo */}
        <div style={{ ...cardStyle, padding: '20px 24px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '14px' }}>
            Configurações do Ciclo
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Prazo demandas', value: format(new Date(ciclo.prazo_demandas), "d MMM yyyy 'às' HH:mm", { locale: ptBR }) },
              { label: 'Prazo votação', value: format(new Date(ciclo.prazo_votacao), "d MMM yyyy 'às' HH:mm", { locale: ptBR }) },
              { label: 'Mín. apoios para qualificar', value: `${ciclo.min_apoios_para_votacao} apoios` },
              { label: 'Máx. prioridades por voto', value: `${ciclo.max_prioridades_por_voto} demandas` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginBottom: '2px' }}>{label}</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={13} style={{ color: 'var(--gray-400)' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
              Link para votação dos moradores:{' '}
              <span style={{ color: 'var(--navy)', fontWeight: 600 }}>
                /votacao-ciclo/{id}
              </span>
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
