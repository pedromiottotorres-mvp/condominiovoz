import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import RelatorioCliente from './RelatorioCliente'

export default async function RelatorioPage() {
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
    { data: condo },
    { data: todasDemandas },
    { data: votacoes },
    { data: orcamentoItens },
    { count: totalMoradores },
  ] = await Promise.all([
    supabase
      .from('condominios')
      .select('nome, endereco, total_unidades')
      .eq('id', condoId)
      .single(),
    supabase
      .from('demandas')
      .select('id, titulo, categoria, status, total_apoios, created_at')
      .eq('condominio_id', condoId)
      .order('total_apoios', { ascending: false }),
    supabase
      .from('votacoes')
      .select('id, titulo, status, prazo, resultado, opcoes')
      .eq('condominio_id', condoId)
      .order('created_at', { ascending: false }),
    supabase
      .from('orcamento_itens')
      .select('descricao, custo_estimado, aprovado, prioridade')
      .eq('condominio_id', condoId)
      .eq('aprovado', true)
      .order('prioridade', { ascending: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('condominio_id', condoId),
  ])

  // Participação: votos na última votação encerrada
  const ultimaEncerrada = votacoes?.find((v) => v.status === 'encerrada')
  const { count: votosUltima } = ultimaEncerrada
    ? await supabase
        .from('votos')
        .select('id', { count: 'exact', head: true })
        .eq('votacao_id', ultimaEncerrada.id)
    : { count: 0 }

  const totalUnidades = condo?.total_unidades ?? 50
  const participacao = ultimaEncerrada
    ? Math.round(((votosUltima ?? 0) / totalUnidades) * 100)
    : null

  // Estatísticas de demandas
  const total = todasDemandas?.length ?? 0
  const abertas = todasDemandas?.filter((d) => d.status === 'aberta').length ?? 0
  const concluidas = todasDemandas?.filter((d) => d.status === 'concluida').length ?? 0
  const emAndamento = todasDemandas?.filter((d) => d.status === 'em_andamento').length ?? 0
  const top10 = (todasDemandas ?? []).slice(0, 10)

  // Votos por votação encerrada
  const votacoesComResultado = await Promise.all(
    (votacoes ?? [])
      .filter((v) => v.status === 'encerrada')
      .slice(0, 5)
      .map(async (v) => {
        const { data: votos } = await supabase
          .from('votos')
          .select('opcao_escolhida')
          .eq('votacao_id', v.id)

        const opcoes = v.opcoes as string[]
        const contagem: Record<string, number> = {}
        opcoes.forEach((op) => { contagem[op] = 0 })
        ;(votos ?? []).forEach(({ opcao_escolhida }) => {
          contagem[opcao_escolhida] = (contagem[opcao_escolhida] ?? 0) + 1
        })
        const totalVotos = votos?.length ?? 0

        return {
          titulo: v.titulo,
          prazo: v.prazo,
          totalVotos,
          opcoes: opcoes.map((op) => ({
            opcao: op,
            votos: contagem[op] ?? 0,
            pct: totalVotos > 0 ? Math.round(((contagem[op] ?? 0) / totalVotos) * 100) : 0,
          })),
          quorum: Math.round((totalVotos / totalUnidades) * 100),
        }
      })
  )

  const dataRelatorio = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <RelatorioCliente
      condo={{ nome: condo?.nome ?? '', endereco: condo?.endereco ?? '' }}
      dataRelatorio={dataRelatorio}
      resumo={{ total, abertas, concluidas, emAndamento, totalMoradores: totalMoradores ?? 0, votacoesTotal: votacoes?.length ?? 0, participacao }}
      top10={top10}
      votacoes={votacoesComResultado}
      orcamento={orcamentoItens ?? []}
    />
  )
}
