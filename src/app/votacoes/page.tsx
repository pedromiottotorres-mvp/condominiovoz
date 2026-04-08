import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Vote, Clock, CheckCircle2, DollarSign } from 'lucide-react'
import { formatDistanceToNow, isPast, format } from 'date-fns'
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
  if (total === 0) return <span className="text-xs text-gray-400">Sem votos</span>

  const [opcaoVencedora, qtdVencedora] = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  const pct = Math.round((qtdVencedora / total) * 100)

  return (
    <span className="text-xs text-gray-500">
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

  // Contagem de votos por votação
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
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold" style={{ color: '#1e3a5f' }}>
            Votações
          </h1>
          {isSindico && (
            <Link
              href="/dashboard/nova-votacao"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: '#10b981' }}
            >
              <Plus size={20} strokeWidth={2.5} />
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-6">
        {/* Abertas */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Abertas
          </h2>
          {abertas.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <Vote size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Nenhuma votação aberta</p>
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
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Encerradas
            </h2>
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
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 block hover:border-gray-200 transition-colors"
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            encerrada
              ? 'bg-gray-100 text-gray-500'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {encerrada ? (
            <CheckCircle2 size={11} />
          ) : (
            <Vote size={11} />
          )}
          {encerrada ? 'Encerrada' : 'Aberta'}
        </span>

        <span className="text-xs text-gray-400">
          {votacao._votos_count}{' '}
          {votacao._votos_count === 1 ? 'voto' : 'votos'}
        </span>
      </div>

      {/* Título */}
      <h3 className="text-sm font-semibold text-gray-800 leading-snug">
        {votacao.titulo}
      </h3>

      {/* Prazo */}
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
        <Clock size={11} />
        <span>{prazoTexto}</span>
      </div>

      {/* Orçamento */}
      {votacao.orcamento_estimado && (
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <DollarSign size={11} />
          <span>
            Orçamento:{' '}
            {votacao.orcamento_estimado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
      )}

      {/* Resultado resumido (encerrada) */}
      {encerrada && votacao.resultado && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <ResultadoResumo resultado={votacao.resultado} />
        </div>
      )}
    </Link>
  )
}
