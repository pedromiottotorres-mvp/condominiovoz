import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Vote, Clock, CheckCircle2, DollarSign, ChevronRight } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'

interface Votacao {
  id: string
  titulo: string
  prazo: string
  status: 'aberta' | 'encerrada'
  orcamento_estimado: number | null
  resultado: Record<string, number> | null
  resultado_parcial_visivel: boolean
  _votos_count: number
}

function ResultadoResumo({ resultado }: { resultado: Record<string, number> }) {
  const entries = Object.entries(resultado).filter(([k]) => k !== 'quorum')
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Sem votos</span>

  const [opcaoVencedora, qtdVencedora] = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  const pct = Math.round((qtdVencedora / total) * 100)

  return (
    <span style={{ fontSize: '0.8rem', color: 'var(--mint-dark)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
      {opcaoVencedora}: {pct}%
    </span>
  )
}

export default async function VotacoesPage() {
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

  const isSindico = profile?.role === 'sindico'

  const { data: rows } = await supabase
    .from('votacoes')
    .select('id, titulo, prazo, status, orcamento_estimado, resultado, resultado_parcial_visivel')
    .eq('condominio_id', profile?.condominio_id)
    .order('created_at', { ascending: false })

  const ids = (rows ?? []).map((v) => v.id)
  const { data: contagens } = ids.length
    ? await supabase
        .from('votos')
        .select('votacao_id')
        .in('votacao_id', ids)
    : { data: [] }

  const contagemMap: Record<string, number> = {}
  ;(contagens ?? []).forEach(({ votacao_id }) => {
    contagemMap[votacao_id] = (contagemMap[votacao_id] ?? 0) + 1
  })

  const votacoes: Votacao[] = (rows ?? []).map((v) => ({
    ...v,
    resultado: v.resultado as Record<string, number> | null,
    _votos_count: contagemMap[v.id] ?? 0,
  }))

  const abertas = votacoes.filter((v) => v.status === 'aberta')
  const encerradas = votacoes.filter((v) => v.status === 'encerrada')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.375rem',
              color: 'var(--navy)',
            }}
          >
            Votações
          </h1>
          {isSindico && (
            <Link
              href="/dashboard/nova-votacao"
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
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Nova
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-6">
        {/* Abertas */}
        <section>
          <p
            className="uppercase tracking-wide mb-3"
            style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
          >
            Em andamento
          </p>
          {abertas.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--gray-100)',
              }}
            >
              <Vote size={32} style={{ color: 'var(--gray-200)', marginBottom: '8px' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                Nenhuma votação aberta
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {abertas.map((v) => (
                <VotacaoCard key={v.id} votacao={v} />
              ))}
            </div>
          )}
        </section>

        {/* Encerradas */}
        {encerradas.length > 0 && (
          <section>
            <p
              className="uppercase tracking-wide mb-3"
              style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
            >
              Encerradas
            </p>
            <div className="flex flex-col gap-3">
              {encerradas.map((v) => (
                <VotacaoCard key={v.id} votacao={v} />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}

function VotacaoCard({ votacao }: { votacao: Votacao }) {
  const encerrada = votacao.status === 'encerrada'
  const prazoPassado = isPast(new Date(votacao.prazo))

  const prazoTexto = encerrada || prazoPassado
    ? `Encerrada ${formatDistanceToNow(new Date(votacao.prazo), { locale: ptBR, addSuffix: true })}`
    : `Encerra ${formatDistanceToNow(new Date(votacao.prazo), { locale: ptBR, addSuffix: true })}`

  return (
    <Link
      href={`/votacao/${votacao.id}`}
      style={{
        display: 'block',
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--gray-100)',
        boxShadow: 'var(--shadow-card)',
        padding: '18px 20px',
        textDecoration: 'none',
        transition: 'box-shadow 0.25s var(--ease-spring), border-color 0.25s var(--ease-spring)',
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            fontFamily: 'var(--font-body)',
            background: encerrada ? 'var(--gray-100)' : 'var(--mint-pale)',
            color: encerrada ? 'var(--gray-500)' : 'var(--mint-dark)',
          }}
        >
          {encerrada ? <CheckCircle2 size={11} /> : <Vote size={11} />}
          {encerrada ? 'Encerrada' : 'Aberta'}
        </span>
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--gray-400)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {votacao._votos_count} {votacao._votos_count === 1 ? 'voto' : 'votos'}
        </span>
      </div>

      {/* Título */}
      <h3
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: 'var(--navy)',
          lineHeight: 1.4,
          marginBottom: '10px',
        }}
      >
        {votacao.titulo}
      </h3>

      {/* Meta */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5" style={{ color: 'var(--gray-400)' }}>
          <Clock size={12} />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>{prazoTexto}</span>
        </div>

        {votacao.orcamento_estimado && (
          <div className="flex items-center gap-1.5" style={{ color: 'var(--gray-400)' }}>
            <DollarSign size={12} />
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
              {votacao.orcamento_estimado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Resultado resumido (encerrada) */}
      {encerrada && votacao.resultado && (
        <div
          className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: '1px solid var(--gray-100)' }}
        >
          <ResultadoResumo resultado={votacao.resultado} />
          <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
        </div>
      )}
    </Link>
  )
}
