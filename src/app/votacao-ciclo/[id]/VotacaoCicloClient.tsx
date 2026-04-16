'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

const CATEGORIA_EMOJI: Record<string, string> = {
  manutencao: '🔧',
  seguranca: '🔒',
  lazer: '🎾',
  estetica: '🎨',
  estrutural: '🏗️',
  outro: '📋',
}

type Demanda = {
  id: string
  titulo: string
  categoria: string
  total_apoios: number
  custo_estimado: number | null
  descricao: string | null
}

type DemandaVotada = {
  id: string
  titulo: string
  categoria: string
  posicao: number
}

type Ciclo = {
  id: string
  nome: string
  fase: string
  max_prioridades_por_voto: number
  prazo_votacao: string | null
}

interface Props {
  ciclo: Ciclo
  demandas: Demanda[]
  apartamento: string
  jaVotou: boolean
  demandasVotadas: DemandaVotada[]
}

export default function VotacaoCicloClient({ ciclo, demandas, apartamento, jaVotou, demandasVotadas }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // IDs na ordem de prioridade selecionada
  const [prioridades, setPrioridades] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  const maxSel = ciclo.max_prioridades_por_voto
  const prazo = ciclo.prazo_votacao
    ? format(new Date(ciclo.prazo_votacao), "dd/MM 'às' HH:mm", { locale: ptBR })
    : null

  function toggleDemanda(id: string) {
    setPrioridades((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= maxSel) return prev
      return [...prev, id]
    })
  }

  function mover(index: number, direcao: 'up' | 'down') {
    setPrioridades((prev) => {
      const next = [...prev]
      const swapIdx = direcao === 'up' ? index - 1 : index + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
      return next
    })
  }

  async function handleVotar() {
    if (prioridades.length === 0) {
      setErro('Selecione ao menos uma demanda para votar.')
      return
    }
    setLoading(true)
    setErro('')

    const votos = prioridades.map((demanda_id, i) => ({
      ciclo_id: ciclo.id,
      demanda_id,
      apartamento,
      posicao: i + 1,
    }))

    const { error } = await supabase.from('votos_prioridade').insert(votos)

    if (error) {
      setErro('Erro ao registrar voto. Tente novamente.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
  }

  // ---- Estado: já votou ou acaba de votar ----
  if (enviado || jaVotou) {
    const lista = enviado
      ? prioridades.map((id, i) => {
          const d = demandas.find((d) => d.id === id)!
          return { id, titulo: d.titulo, categoria: d.categoria, posicao: i + 1 }
        })
      : demandasVotadas

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)' }}>
        <header style={{
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--gray-100)',
          position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.push('/demandas')}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
            </button>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--navy)' }}>
              Votação: {ciclo.nome}
            </h1>
          </div>
        </header>

        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--mint-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={36} style={{ color: 'var(--mint-dark)' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--navy)', marginBottom: '8px' }}>
              {enviado ? 'Voto registrado!' : 'Você já votou'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
              {enviado
                ? 'Suas prioridades foram registradas de forma anônima.'
                : 'Suas prioridades para este ciclo já foram registradas.'}
            </p>
          </div>

          {/* Lista das prioridades votadas */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-500)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suas prioridades
            </p>
            {lista.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#fff', borderRadius: '12px',
                  padding: '14px 16px', border: '1px solid var(--gray-100)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--navy-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-body)',
                }}>
                  {d.posicao}
                </div>
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-body)', color: 'var(--gray-700)', flex: 1 }}>
                  {CATEGORIA_EMOJI[d.categoria] ?? '📋'} {d.titulo}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/demandas')}
            style={{
              padding: '12px 28px', borderRadius: '12px',
              background: 'var(--navy)', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 700,
            }}
          >
            Voltar ao Feed
          </button>
        </main>
      </div>
    )
  }

  // ---- Estado: votação ----
  const demandasSelecionadas = prioridades.map((id) => demandas.find((d) => d.id === id)!)
  const demandasDisponiveis = demandas.filter((d) => !prioridades.includes(d.id))

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '100px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--navy)', lineHeight: 1.2 }}>
              {ciclo.nome}
            </h1>
            {prazo && (
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '1px' }}>
                Votação encerra {prazo}
              </p>
            )}
          </div>
          {/* Contador */}
          <div style={{
            padding: '6px 14px', borderRadius: '50px',
            background: prioridades.length > 0 ? 'var(--navy-pale)' : 'var(--gray-100)',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 700,
            color: prioridades.length > 0 ? 'var(--navy)' : 'var(--gray-400)',
            flexShrink: 0,
          }}>
            {prioridades.length}/{maxSel}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

        {/* Instrução */}
        <div style={{
          background: 'var(--navy-pale)', borderRadius: '14px',
          padding: '14px 18px', marginBottom: '24px',
          border: '1px solid rgba(30,58,95,0.1)',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--navy)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: 0 }}>
            Selecione até <strong>{maxSel} demandas</strong> em ordem de prioridade. A 1ª escolha tem mais peso. Seu voto é <strong>anônimo</strong>.
          </p>
        </div>

        {/* Seção: Suas prioridades (selecionadas, reordenáveis) */}
        {demandasSelecionadas.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Suas prioridades
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {demandasSelecionadas.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: '#fff', borderRadius: '14px',
                    padding: '12px 14px',
                    border: '2px solid var(--navy)',
                    boxShadow: '0 2px 8px rgba(30,58,95,0.08)',
                  }}
                >
                  {/* Posição */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-body)',
                  }}>
                    {i + 1}
                  </div>

                  {/* Texto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {CATEGORIA_EMOJI[d.categoria] ?? '📋'} {d.titulo}
                    </p>
                    {d.custo_estimado && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                        Estimado: R$ {d.custo_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Controles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                    <button
                      onClick={() => mover(i, 'up')}
                      disabled={i === 0}
                      style={{
                        width: '26px', height: '26px', borderRadius: '6px',
                        border: 'none', background: i === 0 ? 'transparent' : 'var(--gray-100)',
                        cursor: i === 0 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: i === 0 ? 0.2 : 1,
                      }}
                    >
                      <ArrowUp size={13} style={{ color: 'var(--gray-600)' }} />
                    </button>
                    <button
                      onClick={() => mover(i, 'down')}
                      disabled={i === demandasSelecionadas.length - 1}
                      style={{
                        width: '26px', height: '26px', borderRadius: '6px',
                        border: 'none', background: i === demandasSelecionadas.length - 1 ? 'transparent' : 'var(--gray-100)',
                        cursor: i === demandasSelecionadas.length - 1 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: i === demandasSelecionadas.length - 1 ? 0.2 : 1,
                      }}
                    >
                      <ArrowDown size={13} style={{ color: 'var(--gray-600)' }} />
                    </button>
                  </div>

                  {/* Remover */}
                  <button
                    onClick={() => toggleDemanda(d.id)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      border: 'none', background: '#fee2e2', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      fontSize: '0.85rem', color: '#dc2626', fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Seção: Demandas disponíveis */}
        {demandasDisponiveis.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {demandasSelecionadas.length > 0 ? 'Adicionar mais' : 'Demandas qualificadas'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {demandasDisponiveis.map((d) => {
                const disabled = prioridades.length >= maxSel
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDemanda(d.id)}
                    disabled={disabled}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: '#fff', borderRadius: '14px',
                      padding: '14px 16px', width: '100%', textAlign: 'left',
                      border: '1.5px solid var(--gray-200)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--navy)'
                        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(30,58,95,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-800)' }}>
                        {CATEGORIA_EMOJI[d.categoria] ?? '📋'} {d.titulo}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          👍 {d.total_apoios} apoios
                        </span>
                        {d.custo_estimado && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                            R$ {d.custo_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                      border: '2px solid var(--gray-300)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} />
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {demandas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🗳️</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
              Nenhuma demanda qualificada para votação.
            </p>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem',
            background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626',
            fontFamily: 'var(--font-body)', marginBottom: '16px',
          }}>
            {erro}
          </div>
        )}
      </main>

      {/* Botão fixo no bottom */}
      {demandas.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--gray-100)',
          padding: '16px 20px',
          zIndex: 50,
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button
              onClick={handleVotar}
              disabled={loading || prioridades.length === 0}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: 'var(--navy)', color: '#fff', border: 'none',
                fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
                cursor: loading || prioridades.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || prioridades.length === 0 ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.2s',
              }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Registrando...</>
                : `Votar com ${prioridades.length} prioridade${prioridades.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
