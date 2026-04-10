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
    <div className="min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Barra de ação — oculta no print */}
      <header
        className="no-print"
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--gray-100)',
          padding: '20px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div className="flex items-center justify-between" style={{ maxWidth: '768px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)' }}>
              Relatório para Assembleia
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
              Preview do documento
            </p>
          </div>
          <button
            onClick={imprimir}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Printer size={15} />
            Gerar PDF
          </button>
        </div>
      </header>

      {/* Documento */}
      <main className="px-4 md:px-8 py-8" style={{ maxWidth: '800px' }}>
        <div
          id="relatorio-documento"
          className="print-documento overflow-hidden"
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-100)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {/* Header do documento */}
          <div style={{ background: 'var(--navy)', padding: '32px' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                    CondomínioVoz
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: '#fff', lineHeight: 1.2 }}>
                  Relatório de Assembleia
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
                  {condo.nome}
                </p>
                {condo.endereco && (
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                    {condo.endereco}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontFamily: 'var(--font-body)' }}>Gerado em</p>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
                  {dataRelatorio}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Seção 1: Resumo */}
            <section>
              <SectionTitle numero="1" titulo="Resumo do Condomínio" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Total de demandas',     value: resumo.total          },
                  { label: 'Demandas abertas',       value: resumo.abertas        },
                  { label: 'Demandas concluídas',    value: resumo.concluidas     },
                  { label: 'Em andamento',           value: resumo.emAndamento    },
                  { label: 'Moradores cadastrados',  value: resumo.totalMoradores },
                  { label: 'Votações realizadas',    value: resumo.votacoesTotal  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--gray-100)',
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--navy)', lineHeight: 1 }}>
                      {value}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Seção 2: Top 10 demandas */}
            <section>
              <SectionTitle numero="2" titulo="Top 10 Demandas por Apoios" />
              {top10.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginTop: '12px', fontFamily: 'var(--font-body)' }}>
                  Nenhuma demanda cadastrada.
                </p>
              ) : (
                <table className="w-full mt-4 text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      {['#', 'Demanda', 'Categoria', 'Apoios'].map((col, i) => (
                        <th
                          key={col}
                          className={i === 3 ? 'text-right' : 'text-left'}
                          style={{
                            padding: '10px 12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--gray-400)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top10.map((d, i) => (
                      <tr
                        key={d.id}
                        style={{
                          borderBottom: '1px solid var(--gray-100)',
                          background: i % 2 !== 0 ? 'var(--gray-50)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--gray-400)', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--gray-700)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                          {d.titulo}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--gray-500)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                          {CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                          {d.total_apoios}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Seção 3: Resultados das votações */}
            <section>
              <SectionTitle numero="3" titulo="Resultados das Votações" />
              {votacoes.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginTop: '12px', fontFamily: 'var(--font-body)' }}>
                  Nenhuma votação encerrada.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  {votacoes.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid var(--gray-100)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}
                      >
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                          {v.titulo}
                        </p>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                          {v.totalVotos} votos · Quórum: {v.quorum}%{v.quorum >= 50 ? ' ✓' : ' ✗'}
                        </span>
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {v.opcoes.map(({ opcao, votos, pct }) => (
                          <div key={opcao}>
                            <div className="flex justify-between mb-1">
                              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
                                {opcao}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                                {pct}% ({votos} votos)
                              </span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  borderRadius: 'var(--radius-full)',
                                  background: 'linear-gradient(90deg, var(--navy) 0%, var(--navy-light) 100%)',
                                }}
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

            {/* Seção 4: Orçamento */}
            <section>
              <SectionTitle numero="4" titulo="Proposta de Alocação de Orçamento" />
              {orcamento.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginTop: '12px', fontFamily: 'var(--font-body)' }}>
                  Nenhuma alocação salva. Acesse o{' '}
                  <span style={{ color: 'var(--navy)', fontWeight: 600 }}>Simulador de Orçamento</span>{' '}
                  para criar uma proposta.
                </p>
              ) : (
                <table className="w-full mt-4 text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      {['Demanda', 'Custo estimado'].map((col, i) => (
                        <th
                          key={col}
                          className={i === 1 ? 'text-right' : 'text-left'}
                          style={{
                            padding: '10px 12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--gray-400)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orcamento.map((item, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid var(--gray-100)',
                          background: i % 2 !== 0 ? 'var(--gray-50)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
                          {item.descricao}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--gray-800)', fontFamily: 'var(--font-body)' }}>
                          {fmt(Number(item.custo_estimado))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--gray-200)' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
                        Total
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                        {fmt(totalOrcamento)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </section>

            {/* Seção 5: Índice de participação */}
            <section>
              <SectionTitle numero="5" titulo="Índice de Participação" />
              <div
                style={{
                  marginTop: '16px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-100)',
                  padding: '20px',
                }}
              >
                {resumo.participacao !== null ? (
                  <>
                    <div className="flex items-end gap-3 mb-4">
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '3rem',
                        lineHeight: 1,
                        color: resumo.participacao >= 50 ? 'var(--mint-dark)' : '#d97706',
                      }}>
                        {resumo.participacao}%
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
                        de participação na última votação
                      </p>
                    </div>
                    <div style={{ height: '12px', background: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${resumo.participacao}%`,
                          borderRadius: 'var(--radius-full)',
                          background: resumo.participacao >= 50
                            ? 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)'
                            : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
                      {resumo.participacao >= 50
                        ? '✓ Quórum atingido (mínimo 50%)'
                        : '✗ Quórum não atingido (mínimo 50%)'}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                    Sem votações encerradas para calcular participação.
                  </p>
                )}
              </div>
            </section>

          </div>

          {/* Footer do documento */}
          <div
            className="flex items-center justify-between px-8 py-4"
            style={{ borderTop: '1px solid var(--gray-100)' }}
          >
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
              Gerado por{' '}
              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>CondomínioVoz</span>
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
              {dataRelatorio}
            </p>
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
        className="flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--navy)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {numero}
      </span>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
        {titulo}
      </h3>
      <div style={{ flex: 1, height: '1px', background: 'var(--gray-100)' }} />
    </div>
  )
}
