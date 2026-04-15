'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Loader2, Calendar, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  const [condominioId, setCondominioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('condominio_id')
        .eq('id', user.id)
        .single()

      if (!profile?.condominio_id) return
      setCondominioId(profile.condominio_id)

      const { data } = await supabase
        .from('demandas')
        .select('id, titulo, categoria, total_apoios')
        .eq('condominio_id', profile.condominio_id)
        .eq('status', 'aberta')
        .order('total_apoios', { ascending: false })

      setDemandasDisponiveis(data ?? [])
    }
    carregarDados()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function adicionarOpcao() {
    const val = novaOpcao.trim()
    if (!val || opcoes.includes(val)) return
    setOpcoes([...opcoes, val])
    setNovaOpcao('')
  }

  function removerOpcao(opcao: string) {
    if (opcoes.length <= 2) return
    setOpcoes(opcoes.filter((o) => o !== opcao))
  }

  function toggleDemanda(id: string) {
    setDemandasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const prazoMin = new Date(Date.now() + 3600_000).toISOString().slice(0, 16)

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
        condominio_id: condominioId,
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#fff',
    border: '2px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem',
    color: 'var(--gray-800)',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--gray-100)',
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--gray-100)', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--navy)' }}>
            Criar Votação
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {erro && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                color: '#c53030',
                fontFamily: 'var(--font-body)',
              }}
            >
              {erro}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="app-label">
              Título <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reforma da piscina"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="app-label">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhe a pauta da votação..."
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="app-label">
              Prazo de encerramento <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--gray-400)' }}
              />
              <input
                type="datetime-local"
                required
                min={prazoMin}
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '44px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
              />
            </div>
          </div>

          {/* Orçamento */}
          <div>
            <label className="app-label">Orçamento estimado (opcional)</label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--gray-400)' }}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
                placeholder="0,00"
                style={{ ...inputStyle, paddingLeft: '44px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
              />
            </div>
          </div>

          {/* Opções de voto */}
          <div>
            <label className="app-label">
              Opções de voto{' '}
              <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 400 }}>(mín. 2)</span>
            </label>

            {/* Pills das opções existentes */}
            <div className="flex flex-wrap gap-2 mb-3">
              {opcoes.map((opcao) => (
                <span
                  key={opcao}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{
                    background: 'var(--navy-pale)',
                    color: 'var(--navy)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {opcao}
                  {opcoes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removerOpcao(opcao)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)', opacity: 0.6, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Adicionar nova opção */}
            <div className="flex gap-2">
              <input
                type="text"
                value={novaOpcao}
                onChange={(e) => setNovaOpcao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarOpcao())}
                placeholder="Adicionar opção..."
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--navy)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)' }}
              />
              <button
                type="button"
                onClick={adicionarOpcao}
                disabled={!novaOpcao.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--mint)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: novaOpcao.trim() ? 'pointer' : 'not-allowed',
                  opacity: novaOpcao.trim() ? 1 : 0.4,
                  flexShrink: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Toggle resultado parcial */}
          <div
            className="flex items-center justify-between p-4"
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-100)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                Resultado parcial visível
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                Moradores veem os votos antes do encerramento
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResultadoParcialVisivel(!resultadoParcialVisivel)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: 'var(--radius-full)',
                background: resultadoParcialVisivel ? 'var(--mint)' : 'var(--gray-200)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s var(--ease-spring)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: resultadoParcialVisivel ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s var(--ease-spring)',
                }}
              />
            </button>
          </div>

          {/* Vincular demandas */}
          {demandasDisponiveis.length > 0 && (
            <div>
              <label className="app-label">
                Demandas relacionadas{' '}
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {demandasDisponiveis.map((d) => {
                  const selecionada = demandasSelecionadas.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDemanda(d.id)}
                      className="flex items-center justify-between px-4 py-3 text-left"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        border: selecionada ? '2px solid var(--navy)' : '1.5px solid var(--gray-200)',
                        background: selecionada ? 'var(--navy-pale)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s var(--ease-spring)',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}
                            className="line-clamp-1">
                        {d.titulo}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginLeft: '8px', flexShrink: 0 }}>
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
            className="btn-primary w-full"
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Criando...</>
            ) : (
              'Criar Votação'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
