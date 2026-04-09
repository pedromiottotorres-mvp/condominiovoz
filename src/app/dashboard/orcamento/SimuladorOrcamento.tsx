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

// ─── Tipos ───────────────────────────────────────────────────────────────────

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
  custo: string   // string para controle do input
  incluido: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIA_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; cor: string }
> = {
  manutencao: { label: 'Manutenção', Icon: Wrench,      cor: '#eab308' },
  seguranca:  { label: 'Segurança',  Icon: Shield,      cor: '#ef4444' },
  lazer:      { label: 'Lazer',      Icon: Palmtree,    cor: '#22c55e' },
  estetica:   { label: 'Estética',   Icon: Paintbrush,  cor: '#a855f7' },
  estrutural: { label: 'Estrutural', Icon: Building,    cor: '#f97316' },
  outro:      { label: 'Outro',      Icon: HelpCircle,  cor: '#9ca3af' },
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  aberta:      { label: 'Aberta',   bg: 'bg-blue-100',  text: 'text-blue-700'  },
  aprovada:    { label: 'Aprovada', bg: 'bg-green-100', text: 'text-green-700' },
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
  // Permite apenas dígitos, vírgula e ponto
  return s.replace(/[^\d,.]/, '')
}

const LS_KEY = (condoId: string) => `orcamento_total_${condoId}`

// ─── Componente ──────────────────────────────────────────────────────────────

export default function SimuladorOrcamento({
  condoId,
  demandas,
  itensSalvos,
}: Props) {
  const supabase = createClient()

  // Hidratação do orçamento via localStorage
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

  // Carrega orçamento do localStorage depois do mount (evita hydration mismatch)
  useEffect(() => {
    const salvo = localStorage.getItem(LS_KEY(condoId))
    if (salvo) setOrcamentoStr(salvo)
  }, [condoId])

  // Persiste orçamento no localStorage
  function handleOrcamentoChange(valor: string) {
    const clean = formatInputCusto(valor)
    setOrcamentoStr(clean)
    localStorage.setItem(LS_KEY(condoId), clean)
  }

  const orcamentoTotal = parseCusto(orcamentoStr)

  // ─── Cálculos derivados ───────────────────────────────────────────────────

  const totalAlocado = useMemo(
    () =>
      itens
        .filter((i) => i.incluido)
        .reduce((s, i) => s + parseCusto(i.custo), 0),
    [itens]
  )

  const totalRestante = orcamentoTotal - totalAlocado
  const percentual =
    orcamentoTotal > 0
      ? Math.min(Math.round((totalAlocado / orcamentoTotal) * 100), 100)
      : 0
  const estourou = orcamentoTotal > 0 && totalAlocado > orcamentoTotal
  const selecionadas = itens.filter((i) => i.incluido).length

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function toggleItem(id: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.demanda_id === id ? { ...i, incluido: !i.incluido } : i
      )
    )
  }

  function setCusto(id: string, valor: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.demanda_id === id
          ? { ...i, custo: formatInputCusto(valor) }
          : i
      )
    )
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

    // 1. Apagar itens anteriores do condomínio
    await supabase
      .from('orcamento_itens')
      .delete()
      .eq('condominio_id', condoId)

    // 2. Inserir itens com custo definido
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
      const { error } = await supabase
        .from('orcamento_itens')
        .insert(novosItens)

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

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-3xl">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
              Simulador de Orçamento
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Planeje a alocação de recursos para as demandas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {feedback === 'ok' && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle2 size={14} /> Salvo!
              </span>
            )}
            {feedback === 'erro' && (
              <span className="text-xs text-red-500 font-medium">Erro ao salvar</span>
            )}
            <button
              onClick={salvarAlocacao}
              disabled={salvando}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {salvando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Salvar
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-3xl flex flex-col gap-6">

        {/* ── 1. Input de orçamento ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Orçamento disponível
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={orcamentoStr}
              onChange={(e) => handleOrcamentoChange(e.target.value)}
              placeholder="0,00"
              className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1e3a5f] transition-colors text-gray-800"
            />
          </div>
          {orcamentoTotal > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {fmt(orcamentoTotal)}
            </p>
          )}
        </div>

        {/* ── 2. Barra de progresso ── */}
        {orcamentoTotal > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Alocação
              </span>
              {estourou ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                  <AlertTriangle size={13} />
                  Orçamento excedido!
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  {percentual}% alocado
                </span>
              )}
            </div>

            {/* Barra */}
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  estourou ? 'bg-red-500' : 'bg-[#10b981]'
                }`}
                style={{
                  width: `${
                    orcamentoTotal > 0
                      ? Math.min((totalAlocado / orcamentoTotal) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Texto */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>
                <span className={`font-semibold ${estourou ? 'text-red-600' : 'text-gray-800'}`}>
                  {fmt(totalAlocado)}
                </span>{' '}
                alocados
              </span>
              <span>
                de{' '}
                <span className="font-semibold text-gray-800">
                  {fmt(orcamentoTotal)}
                </span>
              </span>
            </div>

            {totalRestante > 0 && !estourou && (
              <p className="text-xs text-gray-400 mt-1">
                Sobra: {fmt(totalRestante)}
              </p>
            )}
            {estourou && (
              <p className="text-xs text-red-400 mt-1">
                Excesso: {fmt(Math.abs(totalRestante))}
              </p>
            )}
          </div>
        )}

        {/* ── 3. Lista de demandas ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Demandas ({itens.length})
            </h2>
            <button
              onClick={sugerirAlocacao}
              disabled={orcamentoTotal <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: '#10b981',
                color: '#10b981',
              }}
            >
              <Wand2 size={13} />
              Sugerir alocação
            </button>
          </div>

          {itens.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-sm text-gray-400">
                Nenhuma demanda aberta ou aprovada encontrada.
              </p>
            </div>
          ) : (
            itens.map((item) => {
              const cat = CATEGORIA_CONFIG[item.categoria] ?? CATEGORIA_CONFIG.outro
              const { Icon } = cat
              const statusBadge = STATUS_BADGE[item.status] ?? STATUS_BADGE.aberta
              const custoNum = parseCusto(item.custo)

              return (
                <div
                  key={item.demanda_id}
                  className={`bg-white rounded-2xl border shadow-sm transition-all ${
                    item.incluido
                      ? 'border-[#10b981] ring-1 ring-[#10b981]/20'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="p-4 flex gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item.demanda_id)}
                      className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-[#10b981] transition-colors"
                    >
                      {item.incluido ? (
                        <CheckSquare size={20} className="text-[#10b981]" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: cat.cor + '20',
                            color: cat.cor,
                          }}
                        >
                          <Icon size={10} />
                          {cat.label}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.total_apoios} apoios
                        </span>
                      </div>

                      {/* Título */}
                      <p className="text-sm font-semibold text-gray-800 leading-snug">
                        {item.titulo}
                      </p>

                      {/* Input de custo */}
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-xs text-gray-400 flex-shrink-0">
                          Custo estimado
                        </label>
                        <div className="relative flex-1 max-w-[160px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            R$
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.custo}
                            onChange={(e) =>
                              setCusto(item.demanda_id, e.target.value)
                            }
                            placeholder="0,00"
                            className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20"
                          />
                        </div>
                        {custoNum > 0 && (
                          <span className="text-xs text-gray-500">
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

        {/* ── 4. Resumo final ── */}
        <div
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{
            backgroundColor: '#1e3a5f',
            borderColor: '#1e3a5f',
          }}
        >
          <h2 className="text-sm font-semibold text-white">Resumo da Alocação</h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Selecionadas',
                value: `${selecionadas}`,
                sub: 'demandas',
              },
              {
                label: 'Alocado',
                value: fmt(totalAlocado),
                sub: orcamentoTotal > 0 ? `${percentual}% do total` : '—',
              },
              {
                label: totalRestante >= 0 ? 'Restante' : 'Excesso',
                value: fmt(Math.abs(totalRestante)),
                sub: orcamentoTotal > 0 ? 'disponível' : '—',
                alert: estourou,
              },
            ].map(({ label, value, sub, alert }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <p
                  className={`text-base font-bold leading-tight ${
                    alert ? 'text-red-300' : 'text-white'
                  }`}
                >
                  {value}
                </p>
                <p className="text-xs text-white/60 mt-0.5">{label}</p>
                <p className="text-xs text-white/40">{sub}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={salvarAlocacao}
              disabled={salvando || selecionadas === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-white text-[#1e3a5f] disabled:opacity-50 transition-opacity"
            >
              {salvando ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Salvar alocação
            </button>

            <button
              disabled
              title="Em breve"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-white/30 text-white/50 cursor-not-allowed"
            >
              Incluir no relatório
            </button>
          </div>

          {estourou && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/20 rounded-xl">
              <AlertTriangle size={14} className="text-red-300 flex-shrink-0" />
              <p className="text-xs text-red-200">
                O total alocado excede o orçamento disponível. Revise os custos ou desmarque demandas.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
