import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, FileText, Users } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import Countdown from '@/components/Countdown'
import VotarButton from '@/components/VotarButton'

const COR_OPCAO: Record<string, { barra: string; texto: string }> = {
  Sim: { barra: 'bg-green-500', texto: 'text-green-700' },
  Não: { barra: 'bg-red-400', texto: 'text-red-700' },
  Abstenção: { barra: 'bg-gray-400', texto: 'text-gray-600' },
}

function corOpcao(opcao: string) {
  return COR_OPCAO[opcao] ?? { barra: 'bg-blue-400', texto: 'text-blue-700' }
}

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

  // Quórum: total de unidades do condomínio
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/votacoes"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-base font-bold truncate" style={{ color: '#1e3a5f' }}>
            Votação
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Badge de status */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              encerrada ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
            }`}
          >
            {encerrada ? 'Encerrada' : 'Aberta'}
          </span>
        </div>

        {/* Título e descrição */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 leading-snug">
            {votacao.titulo}
          </h2>
          {votacao.descricao && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {votacao.descricao}
            </p>
          )}
        </div>

        {/* Info cards */}
        <div className="flex flex-col gap-2">
          {/* Prazo */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
            <Clock size={16} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">
                {format(new Date(votacao.prazo), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p className="text-sm">
                <Countdown prazo={votacao.prazo} />
              </p>
            </div>
          </div>

          {/* Orçamento */}
          {votacao.orcamento_estimado && (
            <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <DollarSign size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Orçamento estimado</p>
                <p className="text-sm font-semibold text-gray-800">
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <FileText size={12} />
              Demandas relacionadas
            </h3>
            <div className="flex flex-col gap-2">
              {vinculos.map((v) => {
                const d = Array.isArray(v.demandas) ? v.demandas[0] : v.demandas
                if (!d) return null
                return (
                  <Link
                    key={v.demanda_id}
                    href={`/demanda/${d.id}`}
                    className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between"
                  >
                    <p className="text-sm text-gray-700 font-medium line-clamp-1">
                      {d.titulo}
                    </p>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {d.total_apoios} apoios
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Seção de votação / resultado */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
          {/* Cabeçalho contagem */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {encerrada ? 'Resultado' : 'Votar'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={12} />
              <span>{totalVotos} {totalVotos === 1 ? 'voto' : 'votos'}</span>
            </div>
          </div>

          {/* Resultado com barras */}
          {mostrarResultado ? (
            <div className="flex flex-col gap-3">
              {opcoes.map((opcao) => {
                const qtd = contagemVotos[opcao] ?? 0
                const pct = totalVotos > 0 ? Math.round((qtd / totalVotos) * 100) : 0
                const { barra, texto } = corOpcao(opcao)

                return (
                  <div key={opcao}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${texto}`}>{opcao}</span>
                      <span className="text-xs text-gray-500">
                        {pct}% ({qtd} {qtd === 1 ? 'voto' : 'votos'})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barra}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Quórum */}
              <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">Quórum</span>
                <span
                  className={`text-xs font-semibold ${
                    quorumAtingido ? 'text-green-600' : 'text-orange-500'
                  }`}
                >
                  {quorumPct}% das unidades votaram
                  {quorumAtingido ? ' ✓' : ' (mínimo 50%)'}
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
            <p className="text-sm text-gray-400 text-center py-2">
              Resultado não disponível
            </p>
          )}
        </div>
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
