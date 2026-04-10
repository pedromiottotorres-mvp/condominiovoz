import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, FileText, Users, CheckCircle2, Vote } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import Countdown from '@/components/Countdown'
import VotarButton from '@/components/VotarButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function VotacaoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, apartamento, condominio_id')
    .eq('id', user.id)
    .single()

  const { data: votacao } = await supabase
    .from('votacoes')
    .select(
      'id, titulo, descricao, prazo, status, opcoes, orcamento_estimado, resultado, resultado_parcial_visivel'
    )
    .eq('id', id)
    .single()

  if (!votacao) notFound()

  const isSindico = profile?.role === 'sindico'
  const encerrada = votacao.status === 'encerrada' || isPast(new Date(votacao.prazo))
  const opcoes = votacao.opcoes as string[]

  // Demandas vinculadas
  const { data: vinculos } = await supabase
    .from('votacao_demandas')
    .select('demanda_id, demandas(id, titulo, categoria, total_apoios)')
    .eq('votacao_id', id)

  // Voto do usuário (por apartamento)
  const { data: meuVoto } = await supabase
    .from('votos')
    .select('opcao_escolhida')
    .eq('votacao_id', id)
    .eq('apartamento', profile?.apartamento ?? '')
    .maybeSingle()

  // Votos totais para resultado
  const { data: todosVotos } = await supabase
    .from('votos')
    .select('opcao_escolhida')
    .eq('votacao_id', id)

  const totalVotos = todosVotos?.length ?? 0
  const contagemVotos: Record<string, number> = {}
  opcoes.forEach((op) => { contagemVotos[op] = 0 })
  ;(todosVotos ?? []).forEach(({ opcao_escolhida }) => {
    contagemVotos[opcao_escolhida] = (contagemVotos[opcao_escolhida] ?? 0) + 1
  })

  // Quórum
  const { data: condo } = await supabase
    .from('condominios')
    .select('total_unidades')
    .eq('id', profile?.condominio_id)
    .single()

  const totalUnidades = condo?.total_unidades ?? 50
  const quorumPct = Math.round((totalVotos / totalUnidades) * 100)
  const quorumAtingido = quorumPct >= 50

  const mostrarResultado =
    encerrada || (votacao.resultado_parcial_visivel && !!meuVoto)

  // Cor da barra por opção (mint para a maior, navy para as demais)
  const maxVotos = Math.max(...opcoes.map((op) => contagemVotos[op] ?? 0))

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/votacoes"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--gray-100)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </Link>
          {/* Status badge no header */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-body)',
              background: encerrada ? 'var(--gray-100)' : 'var(--mint-pale)',
              color: encerrada ? 'var(--gray-500)' : 'var(--mint-dark)',
            }}
          >
            {encerrada ? <CheckCircle2 size={11} /> : <Vote size={11} />}
            {encerrada ? 'Encerrada' : 'Em andamento'}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Título e descrição */}
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.625rem',
              color: 'var(--navy)',
              lineHeight: 1.2,
              marginBottom: votacao.descricao ? '12px' : 0,
            }}
          >
            {votacao.titulo}
          </h2>
          {votacao.descricao && (
            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--gray-600)',
              lineHeight: 1.7,
              fontFamily: 'var(--font-body)',
            }}>
              {votacao.descricao}
            </p>
          )}
        </div>

        {/* Info cards (prazo + orçamento) */}
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-3 p-4"
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-100)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--navy-pale)' }}
            >
              <Clock size={16} style={{ color: 'var(--navy)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                {format(new Date(votacao.prazo), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                <Countdown prazo={votacao.prazo} />
              </p>
            </div>
          </div>

          {votacao.orcamento_estimado && (
            <div
              className="flex items-center gap-3 p-4"
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-100)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--mint-pale)' }}
              >
                <DollarSign size={16} style={{ color: 'var(--mint-dark)' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                  Orçamento estimado
                </p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                  {Number(votacao.orcamento_estimado).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Demandas vinculadas */}
        {vinculos && vinculos.length > 0 && (
          <div>
            <p
              className="uppercase tracking-wide mb-2 flex items-center gap-1.5"
              style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
            >
              <FileText size={11} />
              Demandas relacionadas
            </p>
            <div className="flex flex-col gap-2">
              {vinculos.map((v) => {
                const d = Array.isArray(v.demandas) ? v.demandas[0] : v.demandas
                if (!d) return null
                return (
                  <Link
                    key={v.demanda_id}
                    href={`/demanda/${d.id}`}
                    className="flex items-center justify-between p-3"
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gray-100)',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}
                       className="line-clamp-1">
                      {d.titulo}
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginLeft: '8px', flexShrink: 0 }}>
                      {d.total_apoios} apoios
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Seção de votação / resultado */}
        <div
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-100)',
            boxShadow: 'var(--shadow-card)',
            padding: '20px',
          }}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'var(--navy)',
              }}
            >
              {encerrada ? 'Resultado' : 'Votar'}
            </h3>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--gray-400)' }}>
              <Users size={13} />
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                {totalVotos} {totalVotos === 1 ? 'voto' : 'votos'}
              </span>
            </div>
          </div>

          {/* Resultado com barras */}
          {mostrarResultado ? (
            <div className="flex flex-col gap-4">
              {opcoes.map((opcao) => {
                const qtd = contagemVotos[opcao] ?? 0
                const pct = totalVotos > 0 ? Math.round((qtd / totalVotos) * 100) : 0
                const isWinner = qtd === maxVotos && qtd > 0

                return (
                  <div key={opcao}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: isWinner ? 700 : 500,
                        color: isWinner ? 'var(--navy)' : 'var(--gray-600)',
                        fontFamily: 'var(--font-body)',
                      }}>
                        {opcao}
                        {isWinner && encerrada && (
                          <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--mint-dark)' }}>
                            ✓ vencedor
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                        {pct}% · {qtd} {qtd === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>
                    <div
                      className="overflow-hidden"
                      style={{
                        height: '10px',
                        background: 'var(--gray-100)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 'var(--radius-full)',
                          background: isWinner
                            ? 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)'
                            : 'var(--gray-300)',
                          transition: 'width 0.6s var(--ease-spring)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Quórum */}
              <div
                className="flex items-center justify-between pt-3 mt-1"
                style={{ borderTop: '1px solid var(--gray-100)' }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  Quórum
                </span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  color: quorumAtingido ? 'var(--mint-dark)' : '#d97706',
                }}>
                  {quorumPct}% das unidades votaram
                  {quorumAtingido ? ' ✓' : ' (mín. 50%)'}
                </span>
              </div>
            </div>
          ) : !encerrada ? (
            <VotarButton
              votacaoId={id}
              userId={user.id}
              apartamento={profile?.apartamento ?? ''}
              opcoes={opcoes}
              jaVotou={meuVoto?.opcao_escolhida ?? null}
            />
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', padding: '12px 0', fontFamily: 'var(--font-body)' }}>
              Resultado não disponível
            </p>
          )}
        </div>
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
