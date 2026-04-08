'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CONDOMINIO_ID = 'a0000000-0000-0000-0000-000000000001'

interface DemandaOpcao {
  id: string
  titulo: string
  categoria: string
  total_apoios: number
}

export default function NovaVotacaoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [opcoes, setOpcoes] = useState(['Sim', 'Não', 'Abstenção'])
  const [novaOpcao, setNovaOpcao] = useState('')
  const [resultadoParcialVisivel, setResultadoParcialVisivel] = useState(false)
  const [demandasSelecionadas, setDemandasSelecionadas] = useState<string[]>([])
  const [demandasDisponiveis, setDemandasDisponiveis] = useState<DemandaOpcao[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase
      .from('demandas')
      .select('id, titulo, categoria, total_apoios')
      .eq('condominio_id', CONDOMINIO_ID)
      .eq('status', 'aberta')
      .order('total_apoios', { ascending: false })
      .then(({ data }) => setDemandasDisponiveis(data ?? []))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function adicionarOpcao() {
    const val = novaOpcao.trim()
    if (!val || opcoes.includes(val)) return
    setOpcoes([...opcoes, val])
    setNovaOpcao('')
  }

  function removerOpcao(opcao: string) {
    if (opcoes.length <= 2) return // mínimo 2 opções
    setOpcoes(opcoes.filter((o) => o !== opcao))
  }

  function toggleDemanda(id: string) {
    setDemandasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  // Data mínima: agora + 1 hora
  const prazoMin = new Date(Date.now() + 3600_000)
    .toISOString()
    .slice(0, 16)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !prazo) return
    setErro('')
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: votacao, error: insertError } = await supabase
      .from('votacoes')
      .insert({
        condominio_id: CONDOMINIO_ID,
        criador_id: user.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prazo: new Date(prazo).toISOString(),
        orcamento_estimado: orcamento ? parseFloat(orcamento) : null,
        opcoes,
        resultado_parcial_visivel: resultadoParcialVisivel,
      })
      .select('id')
      .single()

    if (insertError || !votacao) {
      setErro('Erro ao criar votação. Tente novamente.')
      setLoading(false)
      return
    }

    // Vincular demandas selecionadas
    if (demandasSelecionadas.length > 0) {
      await supabase.from('votacao_demandas').insert(
        demandasSelecionadas.map((demanda_id) => ({
          votacao_id: votacao.id,
          demanda_id,
        }))
      )
    }

    router.push('/votacoes')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-base font-bold" style={{ color: '#1e3a5f' }}>
            Criar Votação
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {erro}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reforma da piscina"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhe a pauta da votação..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] resize-none"
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prazo de encerramento <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              required
              min={prazoMin}
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
            />
          </div>

          {/* Orçamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orçamento estimado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>
          </div>

          {/* Opções de voto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opções de voto{' '}
              <span className="text-xs text-gray-400">(mín. 2)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {opcoes.map((opcao) => (
                <span
                  key={opcao}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-full text-sm font-medium"
                >
                  {opcao}
                  {opcoes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removerOpcao(opcao)}
                      className="hover:opacity-70"
                    >
                      <X size={13} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaOpcao}
                onChange={(e) => setNovaOpcao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarOpcao())}
                placeholder="Adicionar opção..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
              <button
                type="button"
                onClick={adicionarOpcao}
                disabled={!novaOpcao.trim()}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40"
                style={{ backgroundColor: '#10b981' }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Resultado parcial */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Resultado parcial visível
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Moradores veem os votos antes do encerramento
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResultadoParcialVisivel(!resultadoParcialVisivel)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                resultadoParcialVisivel ? 'bg-[#10b981]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  resultadoParcialVisivel ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Vincular demandas */}
          {demandasDisponiveis.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demandas relacionadas{' '}
                <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {demandasDisponiveis.map((d) => {
                  const selecionada = demandasSelecionadas.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDemanda(d.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                        selecionada
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className="text-sm text-gray-700 line-clamp-1">
                        {d.titulo}
                      </span>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {d.total_apoios} apoios
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Botão criar */}
          <button
            type="submit"
            disabled={loading || !titulo.trim() || !prazo}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Votação'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
