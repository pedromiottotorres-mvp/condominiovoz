'use client'

import { Printer, Building2 } from 'lucide-react'

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção',
  seguranca: 'Segurança',
  lazer: 'Lazer',
  estetica: 'Estética',
  estrutural: 'Estrutural',
  outro: 'Outro',
}

interface OpcaoResultado {
  opcao: string
  votos: number
  pct: number
}

interface VotacaoResultado {
  titulo: string
  prazo: string
  totalVotos: number
  opcoes: OpcaoResultado[]
  quorum: number
}

interface DemandaRow {
  id: string
  titulo: string
  categoria: string
  total_apoios: number
}

interface OrcamentoItem {
  descricao: string
  custo_estimado: number
}

interface Props {
  condo: { nome: string; endereco: string }
  dataRelatorio: string
  resumo: {
    total: number
    abertas: number
    concluidas: number
    emAndamento: number
    totalMoradores: number
    votacoesTotal: number
    participacao: number | null
  }
  top10: DemandaRow[]
  votacoes: VotacaoResultado[]
  orcamento: OrcamentoItem[]
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function RelatorioCliente({
  condo,
  dataRelatorio,
  resumo,
  top10,
  votacoes,
  orcamento,
}: Props) {
  function imprimir() {
    window.print()
  }

  const totalOrcamento = orcamento.reduce((s, i) => s + Number(i.custo_estimado), 0)

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Barra de ação — oculta no print */}
      <header className="no-print bg-white border-b border-gray-100 px-4 md:px-8 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-3xl">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
              Relatório para Assembleia
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Preview do documento</p>
          </div>
          <button
            onClick={imprimir}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Printer size={15} />
            Baixar / Imprimir PDF
          </button>
        </div>
      </header>

      {/* Documento */}
      <main className="px-4 md:px-8 py-8 max-w-3xl">
        <div
          id="relatorio-documento"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-documento"
        >
          {/* ── Header do documento ── */}
          <div
            className="px-8 py-8"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={20} className="text-white/60" />
                  <span className="text-white/60 text-sm">CondomínioVoz</span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Relatório de Assembleia
                </h2>
                <p className="text-white/70 mt-1 text-sm">{condo.nome}</p>
                {condo.endereco && (
                  <p className="text-white/50 text-xs mt-0.5">{condo.endereco}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs">Gerado em</p>
                <p className="text-white font-semibold text-sm">{dataRelatorio}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8 flex flex-col gap-10">

            {/* ── Seção 1: Resumo ── */}
            <section>
              <SectionTitle numero="1" titulo="Resumo do Condomínio" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Total de demandas', value: resumo.total },
                  { label: 'Demandas abertas', value: resumo.abertas },
                  { label: 'Demandas concluídas', value: resumo.concluidas },
                  { label: 'Em andamento', value: resumo.emAndamento },
                  { label: 'Moradores cadastrados', value: resumo.totalMoradores },
                  { label: 'Votações realizadas', value: resumo.votacoesTotal },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                  >
                    <p className="text-2xl font-bold text-[#1e3a5f]">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Seção 2: Top 10 demandas ── */}
            <section>
              <SectionTitle numero="2" titulo="Top 10 Demandas por Apoios" />
              {top10.length === 0 ? (
                <p className="text-sm text-gray-400 mt-3">Nenhuma demanda cadastrada.</p>
              ) : (
                <table className="w-full mt-4 text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 rounded-tl-lg">
                        #
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                        Demanda
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                        Categoria
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 rounded-tr-lg">
                        Apoios
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {top10.map((d, i) => (
                      <tr key={d.id} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2.5 text-gray-400 text-xs font-mono">
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 font-medium">
                          {d.titulo}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">
                          {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-[#1e3a5f]">
                          {d.total_apoios}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* ── Seção 3: Resultados das votações ── */}
            <section>
              <SectionTitle numero="3" titulo="Resultados das Votações" />
              {votacoes.length === 0 ? (
                <p className="text-sm text-gray-400 mt-3">
                  Nenhuma votação encerrada.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-5">
                  {votacoes.map((v, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                          {v.titulo}
                        </p>
                        <span className="text-xs text-gray-400">
                          {v.totalVotos} votos · Quórum: {v.quorum}%
                          {v.quorum >= 50 ? ' ✓' : ' ✗'}
                        </span>
                      </div>
                      <div className="px-4 py-3 flex flex-col gap-2">
                        {v.opcoes.map(({ opcao, votos, pct }) => (
                          <div key={opcao}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700">{opcao}</span>
                              <span className="text-gray-500">
                                {pct}% ({votos} votos)
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#1e3a5f]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Seção 4: Orçamento ── */}
            <section>
              <SectionTitle numero="4" titulo="Proposta de Alocação de Orçamento" />
              {orcamento.length === 0 ? (
                <p className="text-sm text-gray-400 mt-3">
                  Nenhuma alocação salva. Acesse o{' '}
                  <span className="text-[#1e3a5f]">Simulador de Orçamento</span> para criar
                  uma proposta.
                </p>
              ) : (
                <>
                  <table className="w-full mt-4 text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 rounded-tl-lg">
                          Demanda
                        </th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 rounded-tr-lg">
                          Custo estimado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orcamento.map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                          <td className="px-3 py-2.5 text-gray-700">{item.descricao}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                            {fmt(Number(item.custo_estimado))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td className="px-3 py-2.5 text-sm font-bold text-gray-700">
                          Total
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-bold text-[#1e3a5f]">
                          {fmt(totalOrcamento)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
            </section>

            {/* ── Seção 5: Índice de participação ── */}
            <section>
              <SectionTitle numero="5" titulo="Índice de Participação" />
              <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-100">
                {resumo.participacao !== null ? (
                  <>
                    <div className="flex items-end gap-2 mb-3">
                      <p
                        className="text-4xl font-bold"
                        style={{ color: resumo.participacao >= 50 ? '#10b981' : '#f59e0b' }}
                      >
                        {resumo.participacao}%
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        de participação na última votação
                      </p>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${resumo.participacao}%`,
                          backgroundColor: resumo.participacao >= 50 ? '#10b981' : '#f59e0b',
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {resumo.participacao >= 50
                        ? '✓ Quórum atingido (mínimo 50%)'
                        : '✗ Quórum não atingido (mínimo 50%)'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    Sem votações encerradas para calcular participação.
                  </p>
                )}
              </div>
            </section>

          </div>

          {/* ── Footer do documento ── */}
          <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Gerado por{' '}
              <span className="font-semibold text-[#1e3a5f]">CondomínioVoz</span>
            </p>
            <p className="text-xs text-gray-400">{dataRelatorio}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionTitle({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        {numero}
      </span>
      <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}
