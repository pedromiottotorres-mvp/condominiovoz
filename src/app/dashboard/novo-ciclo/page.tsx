'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NovoCicloPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [prazoDemandas, setPrazoDemandas] = useState('')
  const [prazoVotacao, setPrazoVotacao] = useState('')
  const [minApoios, setMinApoios] = useState('3')
  const [maxPrioridades, setMaxPrioridades] = useState('5')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const minDate = new Date(Date.now() + 3600_000).toISOString().slice(0, 16)

  const inputBase: React.CSSProperties = {
    width: '100%', background: '#fff',
    border: '2px solid var(--gray-200)', borderRadius: '12px',
    padding: '14px 16px', fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem', color: 'var(--gray-800)', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--navy)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)'
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--gray-200)'
    e.currentTarget.style.boxShadow = 'none'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (prazoDemandas && prazoVotacao && new Date(prazoVotacao) <= new Date(prazoDemandas)) {
      setErro('O prazo de votação deve ser posterior ao prazo de demandas.')
      return
    }
    if (!orcamento || parseFloat(orcamento) <= 0) {
      setErro('Informe um orçamento válido.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('condominio_id').eq('id', user.id).single()

    if (!profile?.condominio_id) {
      setErro('Não foi possível identificar seu condomínio.')
      setLoading(false); return
    }

    const { error } = await supabase.from('ciclos').insert({
      condominio_id: profile.condominio_id,
      nome: nome.trim(),
      orcamento_disponivel: parseFloat(orcamento),
      prazo_demandas: new Date(prazoDemandas).toISOString(),
      prazo_votacao: new Date(prazoVotacao).toISOString(),
      min_apoios_para_votacao: parseInt(minApoios) || 3,
      max_prioridades_por_voto: parseInt(maxPrioridades) || 5,
      fase: 'demandas',
    })

    if (error) {
      setErro('Erro ao criar ciclo. Tente novamente.')
      setLoading(false); return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--navy)' }}>
            Novo Ciclo
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px 80px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {erro && (
            <div style={{
              padding: '14px 16px', borderRadius: '12px', fontSize: '0.875rem',
              background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626',
              fontFamily: 'var(--font-body)',
            }}>
              {erro}
            </div>
          )}

          {/* Nome do ciclo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
              Nome do ciclo <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text" required value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Ciclo Maio 2026"
              style={inputBase}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Orçamento */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
              Orçamento disponível <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-400)',
                fontFamily: 'var(--font-body)', pointerEvents: 'none',
              }}>
                R$
              </span>
              <input
                type="number" required min="1" step="0.01"
                value={orcamento} onChange={(e) => setOrcamento(e.target.value)}
                placeholder="0,00"
                style={{ ...inputBase, paddingLeft: '52px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Prazo demandas */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
              Prazo para demandas <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
              Até quando moradores podem registrar demandas?
            </p>
            <div style={{ position: 'relative' }}>
              <Calendar size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
              <input
                type="datetime-local" required min={minDate}
                value={prazoDemandas} onChange={(e) => setPrazoDemandas(e.target.value)}
                style={{ ...inputBase, paddingLeft: '44px' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Prazo votação */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
              Prazo para votação <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
              Até quando moradores podem votar?
            </p>
            <div style={{ position: 'relative' }}>
              <Calendar size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
              <input
                type="datetime-local" required min={prazoDemandas || minDate}
                value={prazoVotacao} onChange={(e) => setPrazoVotacao(e.target.value)}
                style={{ ...inputBase, paddingLeft: '44px' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Grid: min apoios + max prioridades */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
                Mínimo de apoios
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
                Para qualificar na votação
              </p>
              <input
                type="number" min="1" max="50"
                value={minApoios} onChange={(e) => setMinApoios(e.target.value)}
                style={{ ...inputBase, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
                Máx. prioridades
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
                Por apartamento no voto
              </p>
              <input
                type="number" min="1" max="20"
                value={maxPrioridades} onChange={(e) => setMaxPrioridades(e.target.value)}
                style={{ ...inputBase, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Info card */}
          <div style={{
            background: 'var(--navy-pale)', borderRadius: '14px',
            padding: '16px 20px', border: '1px solid rgba(30,58,95,0.1)',
          }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--navy)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              <strong>Como funciona:</strong> Moradores registram demandas na fase 1.
              Na fase 2, cada apartamento vota suas prioridades de forma anônima.
              O sistema calcula o ranking e aloca o orçamento automaticamente.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              background: 'var(--navy)', color: '#fff', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'transform 0.15s var(--ease-spring), box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)' } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar Ciclo'}
          </button>
        </form>
      </main>
    </div>
  )
}
