'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Wand2,
  Save,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Wrench,
  Shield,
  Palmtree,
  Paintbrush,
  Building,
  HelpCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DemandaRow {
  id: string
  titulo: string
  categoria: string
  status: string
  total_apoios: number
}

interface ItemSalvo {
  demanda_id: string
  custo_estimado: number
  aprovado: boolean
  prioridade: number
}

interface Props {
  condoId: string
  demandas: DemandaRow[]
  itensSalvos: ItemSalvo[]
}

interface ItemSimulador {
  demanda_id: string
  titulo: string
  categoria: string
  status: string
  total_apoios: number
  custo: string
  incluido: boolean
}

const CATEGORIA_CONFIG: Record<string, { label: string; Icon: React.ElementType; cssClass: string }> = {
  manutencao: { label: 'Manutenção', Icon: Wrench,     cssClass: 'badge-manutencao' },
  seguranca:  { label: 'Segurança',  Icon: Shield,     cssClass: 'badge-seguranca'  },
  lazer:      { label: 'Lazer',      Icon: Palmtree,   cssClass: 'badge-lazer'      },
  estetica:   { label: 'Estética',   Icon: Paintbrush, cssClass: 'badge-estetica'   },
  estrutural: { label: 'Estrutural', Icon: Building,   cssClass: 'badge-estrutural' },
  outro:      { label: 'Outro',      Icon: HelpCircle, cssClass: 'badge-outro'      },
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseCusto(s: string): number {
  const clean = s.replace(/[^\d,.-]/g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) || n < 0 ? 0 : n
}

function formatInputCusto(s: string): string {
  return s.replace(/[^\d,.]/, '')
}

const LS_KEY = (condoId: string) => `orcamento_total_${condoId}`

export default function SimuladorOrcamento({ condoId, demandas, itensSalvos }: Props) {
  const supabase = createClient()

  const [orcamentoStr, setOrcamentoStr] = useState('')
  const [itens, setItens] = useState<ItemSimulador[]>(() =>
    demandas.map((d) => {
      const salvo = itensSalvos.find((s) => s.demanda_id === d.id)
      return {
        demanda_id: d.id,
        titulo: d.titulo,
        categoria: d.categoria,
        status: d.status,
        total_apoios: d.total_apoios,
        custo: salvo ? String(salvo.custo_estimado) : '',
        incluido: salvo?.aprovado ?? false,
      }
    })
  )
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'erro' | null>(null)

  useEffect(() => {
    const salvo = localStorage.getItem(LS_KEY(condoId))
    if (salvo) setOrcamentoStr(salvo)
  }, [condoId])

  function handleOrcamentoChange(valor: string) {
    const clean = formatInputCusto(valor)
    setOrcamentoStr(clean)
    localStorage.setItem(LS_KEY(condoId), clean)
  }

  const orcamentoTotal = parseCusto(orcamentoStr)

  const totalAlocado = useMemo(
    () => itens.filter((i) => i.incluido).reduce((s, i) => s + parseCusto(i.custo), 0),
    [itens]
  )

  const totalRestante = orcamentoTotal - totalAlocado
  const percentual = orcamentoTotal > 0 ? Math.min(Math.round((totalAlocado / orcamentoTotal) * 100), 100) : 0
  const estourou = orcamentoTotal > 0 && totalAlocado > orcamentoTotal
  const selecionadas = itens.filter((i) => i.incluido).length

  function toggleItem(id: string) {
    setItens((prev) => prev.map((i) => i.demanda_id === id ? { ...i, incluido: !i.incluido } : i))
  }

  function setCusto(id: string, valor: string) {
    setItens((prev) => prev.map((i) => i.demanda_id === id ? { ...i, custo: formatInputCusto(valor) } : i))
  }

  function sugerirAlocacao() {
    if (orcamentoTotal <= 0) return
    let restante = orcamentoTotal
    setItens((prev) =>
      prev.map((item) => {
        const custo = parseCusto(item.custo)
        if (custo > 0 && custo <= restante) {
          restante -= custo
          return { ...item, incluido: true }
        }
        return { ...item, incluido: false }
      })
    )
  }

  async function salvarAlocacao() {
    setSalvando(true)
    setFeedback(null)

    await supabase.from('orcamento_itens').delete().eq('condominio_id', condoId)

    const novosItens = itens
      .filter((i) => parseCusto(i.custo) > 0)
      .map((i, idx) => ({
        condominio_id: condoId,
        demanda_id: i.demanda_id,
        descricao: i.titulo,
        custo_estimado: parseCusto(i.custo),
        prioridade: idx + 1,
        aprovado: i.incluido,
      }))

    if (novosItens.length > 0) {
      const { error } = await supabase.from('orcamento_itens').insert(novosItens)
      if (error) {
        setFeedback('erro')
        setSalvando(false)
        return
      }
    }

    setFeedback('ok')
    setSalvando(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--gray-100)',
    boxShadow: 'var(--shadow-card)',
    padding: '24px',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--gray-100)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div className="flex items-center justify-between" style={{ maxWidth: '768px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--navy)' }}>
              Simulador de Orçamento
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
              Planeje a alocação de recursos
            </p>
          </div>

          <div className="flex items-center gap-3">
            {feedback === 'ok' && (
              <span className="flex items-center gap-1.5" style={{ fontSize: '0.8rem', color: 'var(--mint-dark)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                <CheckCircle2 size={14} /> Salvo!
              </span>
            )}
            {feedback === 'erro' && (
              <span style={{ fontSize: '0.8rem', color: '#dc2626', fontFamily: 'var(--font-body)' }}>Erro ao salvar</span>
            )}
            <button
              onClick={salvarAlocacao}
              disabled={salvando}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.8375rem' }}
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-6 flex flex-col gap-5" style={{ maxWidth: '800px' }}>

        {/* Input de orçamento */}
        <div style={cardStyle}>
          <label className="app-label" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
            Orçamento disponível
          </label>
          <div className="relative mt-2">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
            >
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={orcamentoStr}
              onChange={(e) => handleOrcamentoChange(e.target.value)}
              placeholder="0,00"
              style={{
                width: '100%',
                paddingLeft: '52px',
                paddingRight: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: 'var(--font-body)',
                color: 'var(--navy)',
                background: 'var(--gray-50)',
                border: '2px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
            />
          </div>
          {orcamentoTotal > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
              {fmt(orcamentoTotal)}
            </p>
          )}
        </div>

        {/* Barra de progresso */}
        {orcamentoTotal > 0 && (
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
                Alocação
              </span>
              {estourou ? (
                <span className="flex items-center gap-1" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--font-body)' }}>
                  <AlertTriangle size={13} />
                  Orçamento excedido!
                </span>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <strong style={{ color: 'var(--navy)' }}>{percentual}%</strong> alocado
                </span>
              )}
            </div>

            {/* Barra */}
            <div style={{ height: '12px', background: 'var(--gray-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  background: estourou
                    ? '#ef4444'
                    : 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)',
                  width: `${orcamentoTotal > 0 ? Math.min((totalAlocado / orcamentoTotal) * 100, 100) : 0}%`,
                  transition: 'width 0.4s var(--ease-spring)',
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                <strong style={{ color: estourou ? '#dc2626' : 'var(--navy)' }}>{fmt(totalAlocado)}</strong> alocados
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                de <strong style={{ color: 'var(--gray-700)' }}>{fmt(orcamentoTotal)}</strong>
              </span>
            </div>

            {totalRestante > 0 && !estourou && (
              <p style={{ fontSize: '0.78rem', color: 'var(--mint-dark)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
                Sobra: {fmt(totalRestante)}
              </p>
            )}
            {estourou && (
              <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
                Excesso: {fmt(Math.abs(totalRestante))}
              </p>
            )}
          </div>
        )}

        {/* Lista de demandas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--navy)' }}>
              Demandas ({itens.length})
            </h2>
            <button
              onClick={sugerirAlocacao}
              disabled={orcamentoTotal <= 0}
              className="flex items-center gap-1.5"
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--mint)',
                background: 'transparent',
                color: 'var(--mint-dark)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: orcamentoTotal <= 0 ? 'not-allowed' : 'pointer',
                opacity: orcamentoTotal <= 0 ? 0.4 : 1,
                transition: 'background 0.2s',
              }}
            >
              <Wand2 size={13} />
              Sugerir alocação
            </button>
          </div>

          {itens.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              style={{ ...cardStyle, textAlign: 'center' }}
            >
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                Nenhuma demanda aberta ou aprovada encontrada.
              </p>
            </div>
          ) : (
            itens.map((item) => {
              const cat = CATEGORIA_CONFIG[item.categoria] ?? CATEGORIA_CONFIG.outro
              const { Icon } = cat
              const custoNum = parseCusto(item.custo)

              return (
                <div
                  key={item.demanda_id}
                  style={{
                    background: '#fff',
                    borderRadius: 'var(--radius-xl)',
                    border: item.incluido ? '1.5px solid var(--mint)' : '1px solid var(--gray-100)',
                    boxShadow: item.incluido ? '0 0 0 3px rgba(16,185,129,0.08)' : 'var(--shadow-card)',
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                >
                  <div className="p-4 flex gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item.demanda_id)}
                      style={{
                        flexShrink: 0,
                        marginTop: '2px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: item.incluido ? 'var(--mint)' : 'var(--gray-300)',
                        transition: 'color 0.2s',
                      }}
                    >
                      {item.incluido
                        ? <CheckSquare size={20} />
                        : <Square size={20} />
                      }
                    </button>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className={`badge ${cat.cssClass}`}>
                          <Icon size={10} />
                          {cat.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                          {item.total_apoios} apoios
                        </span>
                      </div>

                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
                        {item.titulo}
                      </p>

                      {/* Input de custo */}
                      <div className="flex items-center gap-2 mt-3">
                        <label style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                          Custo estimado
                        </label>
                        <div className="relative" style={{ maxWidth: '160px', flex: 1 }}>
                          <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}
                          >
                            R$
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.custo}
                            onChange={(e) => setCusto(item.demanda_id, e.target.value)}
                            placeholder="0,00"
                            style={{
                              width: '100%',
                              paddingLeft: '32px',
                              paddingRight: '8px',
                              paddingTop: '7px',
                              paddingBottom: '7px',
                              border: '1.5px solid var(--gray-200)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-body)',
                              color: 'var(--gray-700)',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
                          />
                        </div>
                        {custoNum > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                            {fmt(custoNum)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Resumo final */}
        <div
          style={{
            borderRadius: 'var(--radius-xl)',
            background: 'var(--navy)',
            padding: '24px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>
            Resumo da Alocação
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Selecionadas', value: `${selecionadas}`,     sub: 'demandas'           },
              { label: 'Alocado',      value: fmt(totalAlocado),     sub: orcamentoTotal > 0 ? `${percentual}% do total` : '—' },
              { label: totalRestante >= 0 ? 'Restante' : 'Excesso',
                value: fmt(Math.abs(totalRestante)),                  sub: orcamentoTotal > 0 ? 'disponível' : '—',
                alert: estourou },
            ].map(({ label, value, sub, alert }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  color: alert ? '#fca5a5' : '#fff',
                  lineHeight: 1,
                  marginBottom: '4px',
                }}>
                  {value}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}>{label}</p>
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={salvarAlocacao}
              disabled={salvando || selecionadas === 0}
              className="flex-1 flex items-center justify-center gap-2"
              style={{
                padding: '13px',
                borderRadius: 'var(--radius-md)',
                background: '#fff',
                color: 'var(--navy)',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                border: 'none',
                cursor: salvando || selecionadas === 0 ? 'not-allowed' : 'pointer',
                opacity: salvando || selecionadas === 0 ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Salvar Proposta de Orçamento
            </button>
            <button
              disabled
              title="Em breve"
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-body)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                cursor: 'not-allowed',
              }}
            >
              Incluir no relatório
            </button>
          </div>

          {estourou && (
            <div
              className="flex items-center gap-2 mt-3 p-3"
              style={{
                background: 'rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <AlertTriangle size={14} style={{ color: '#fca5a5', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: '#fca5a5', fontFamily: 'var(--font-body)' }}>
                O total alocado excede o orçamento disponível. Revise os custos ou desmarque demandas.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
