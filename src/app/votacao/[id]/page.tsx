import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Wallet, FileText, Users, CheckCircle2, Vote, Trophy } from 'lucide-react'
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, apartamento, condominio_id').eq('id', user.id).single()

  const { data: votacao } = await supabase
    .from('votacoes')
    .select('id, titulo, descricao, prazo, status, opcoes, orcamento_estimado, resultado, resultado_parcial_visivel')
    .eq('id', id).single()

  if (!votacao) notFound()

  const isSindico = profile?.role === 'sindico'
  const encerrada = votacao.status === 'encerrada' || isPast(new Date(votacao.prazo))
  const opcoes = votacao.opcoes as string[]

  const { data: vinculos } = await supabase
    .from('votacao_demandas')
    .select('demanda_id, demandas(id, titulo, categoria, total_apoios)')
    .eq('votacao_id', id)

  const { data: meuVoto } = await supabase
    .from('votos').select('opcao_escolhida')
    .eq('votacao_id', id).eq('apartamento', profile?.apartamento ?? '').maybeSingle()

  const { data: todosVotos } = await supabase
    .from('votos').select('opcao_escolhida').eq('votacao_id', id)

  const totalVotos = todosVotos?.length ?? 0
  const contagemVotos: Record<string, number> = {}
  opcoes.forEach((op) => { contagemVotos[op] = 0 })
  ;(todosVotos ?? []).forEach(({ opcao_escolhida }) => {
    contagemVotos[opcao_escolhida] = (contagemVotos[opcao_escolhida] ?? 0) + 1
  })

  const { data: condo } = await supabase
    .from('condominios').select('total_unidades').eq('id', profile?.condominio_id).single()

  const totalUnidades = condo?.total_unidades ?? 50
  const quorumPct = Math.round((totalVotos / totalUnidades) * 100)
  const quorumAtingido = quorumPct >= 50
  const mostrarResultado = encerrada || (votacao.resultado_parcial_visivel && !!meuVoto)
  const maxVotos = Math.max(...opcoes.map((op) => contagemVotos[op] ?? 0))

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '96px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/votacoes" style={{
            width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, textDecoration: 'none',
          }}>
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </Link>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 12px', borderRadius: '50px',
            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: encerrada ? 'var(--gray-100)' : 'var(--mint-pale)',
            color: encerrada ? 'var(--gray-500)' : 'var(--mint-dark)',
          }}>
            {encerrada ? <CheckCircle2 size={11} /> : <Vote size={11} />}
            {encerrada ? 'Encerrada' : 'Em andamento'}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Título e descrição */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.7rem',
            color: 'var(--navy)', lineHeight: 1.2, marginBottom: votacao.descricao ? '12px' : 0,
          }}>
            {votacao.titulo}
          </h2>
          {votacao.descricao && (
            <p style={{ fontSize: '1rem', color: 'var(--gray-600)', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              {votacao.descricao}
            </p>
          )}
        </div>

        {/* Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
            background: '#fff', borderRadius: '14px', border: '1px solid var(--gray-100)',
            boxShadow: '0 2px 8px rgba(15,36,64,0.05)',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--navy-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={16} style={{ color: 'var(--navy)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                {format(new Date(votacao.prazo), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                <Countdown prazo={votacao.prazo} />
              </p>
            </div>
          </div>

          {votacao.orcamento_estimado && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
              background: '#fff', borderRadius: '14px', border: '1px solid var(--gray-100)',
              boxShadow: '0 2px 8px rgba(15,36,64,0.05)',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--mint-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wallet size={16} style={{ color: 'var(--mint-dark)' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>Orçamento estimado</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                  {Number(votacao.orcamento_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Demandas vinculadas */}
        {vinculos && vinculos.length > 0 && (
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={11} /> Demandas relacionadas
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {vinculos.map((v) => {
                const d = Array.isArray(v.demandas) ? v.demandas[0] : v.demandas
                if (!d) return null
                return (
                  <Link key={v.demanda_id} href={`/demanda/${d.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-100)', textDecoration: 'none',
                  }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                      {d.titulo}
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', flexShrink: 0, marginLeft: '8px' }}>
                      {d.total_apoios} apoios
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Votar / Resultado */}
        <div style={{
          background: '#fff', borderRadius: '20px',
          border: '1px solid var(--gray-100)',
          boxShadow: '0 2px 12px rgba(15,36,64,0.06)', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--navy)' }}>
              {encerrada ? 'Resultado' : 'Seu voto'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-400)' }}>
              <Users size={14} />
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                {totalVotos} {totalVotos === 1 ? 'voto' : 'votos'}
              </span>
            </div>
          </div>

          {mostrarResultado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {opcoes.map((opcao) => {
                const qtd = contagemVotos[opcao] ?? 0
                const pct = totalVotos > 0 ? Math.round((qtd / totalVotos) * 100) : 0
                const isWinner = qtd === maxVotos && qtd > 0
                return (
                  <div key={opcao}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: isWinner ? 700 : 500, color: isWinner ? 'var(--navy)' : 'var(--gray-600)', fontFamily: 'var(--font-body)' }}>
                        {isWinner && encerrada && <Trophy size={14} style={{ color: 'var(--mint-dark)' }} />}
                        {opcao}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: isWinner ? 700 : 400, color: isWinner ? 'var(--navy)' : 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                        {pct}% · <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>{qtd} {qtd === 1 ? 'voto' : 'votos'}</span>
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '50px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: '50px',
                        background: isWinner
                          ? 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)'
                          : 'var(--gray-300)',
                        transition: 'width 0.6s var(--ease-spring)',
                      }} />
                    </div>
                  </div>
                )
              })}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--gray-100)', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>Quórum</span>
                <span style={{
                  fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                  color: quorumAtingido ? 'var(--mint-dark)' : '#d97706',
                }}>
                  {quorumPct}% das unidades{quorumAtingido ? ' ✓' : ' (mín. 50%)'}
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
