'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Props {
  condominioId: string
}

export default function AdicionarMesAnteriorModal({ condominioId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - i)

  const [aberto, setAberto] = useState(false)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(anoAtual)
  const [receita, setReceita] = useState('')
  const [custos, setCustos] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  function resetForm() {
    setMes(new Date().getMonth() + 1)
    setAno(anoAtual)
    setReceita('')
    setCustos('')
    setObs('')
    setErro('')
    setSalvo(false)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const receitaNum = parseFloat(receita) || 0
    const custosNum = parseFloat(custos) || 0
    if (receitaNum < 0 || custosNum < 0) { setErro('Valores não podem ser negativos.'); return }

    setLoading(true)
    const { error } = await supabase.from('financeiro_mensal').upsert(
      {
        condominio_id: condominioId,
        mes,
        ano,
        receita_condominial: receitaNum,
        custos_fixos: custosNum,
        saldo_investimento: receitaNum - custosNum,
        observacoes: obs.trim() || null,
      },
      { onConflict: 'condominio_id,mes,ano' }
    )
    setLoading(false)
    if (error) { setErro('Erro ao salvar. Tente novamente.'); return }
    setSalvo(true)
    router.refresh()
    setTimeout(() => { setAberto(false); resetForm() }, 1500)
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '2px solid var(--gray-200)', background: '#fff',
    fontFamily: 'var(--font-body)', fontSize: '0.9rem',
    color: 'var(--gray-800)', outline: 'none', cursor: 'pointer',
    boxSizing: 'border-box',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '2px solid var(--gray-200)', fontFamily: 'var(--font-body)',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <>
      <button
        onClick={() => { resetForm(); setAberto(true) }}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '12px 20px', borderRadius: '14px', width: '100%', justifyContent: 'center',
          border: '1.5px dashed var(--gray-300)', background: 'transparent',
          color: 'var(--gray-500)', fontFamily: 'var(--font-body)',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.borderColor = 'var(--navy)'
          el.style.color = 'var(--navy)'
          el.style.background = 'var(--navy-pale)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.borderColor = 'var(--gray-300)'
          el.style.color = 'var(--gray-500)'
          el.style.background = 'transparent'
        }}
      >
        <Plus size={15} />
        Adicionar mês anterior
      </button>

      {aberto && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(15,32,64,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setAberto(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: '24px',
            padding: '32px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 64px rgba(15,32,64,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--navy)' }}>
                Adicionar Mês Anterior
              </h2>
              <button
                onClick={() => setAberto(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--gray-100)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} style={{ color: 'var(--gray-500)' }} />
              </button>
            </div>

            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                    Mês
                  </label>
                  <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={selectStyle}>
                    {MESES.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                    Ano
                  </label>
                  <select value={ano} onChange={(e) => setAno(Number(e.target.value))} style={selectStyle}>
                    {anos.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                  Receita (R$)
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={receita} onChange={(e) => setReceita(e.target.value)}
                  placeholder="0,00"
                  style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                  Custos (R$)
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={custos} onChange={(e) => setCustos(e.target.value)}
                  placeholder="0,00"
                  style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                  Observações <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(opcional)</span>
                </label>
                <textarea
                  value={obs} onChange={(e) => setObs(e.target.value)}
                  placeholder="Notas sobre este mês..."
                  rows={2}
                  style={{ ...inputStyle, fontSize: '0.9rem', color: 'var(--gray-700)', resize: 'none', lineHeight: 1.5 }}
                />
              </div>

              {erro && (
                <p style={{ fontSize: '0.85rem', color: '#dc2626', fontFamily: 'var(--font-body)', margin: 0 }}>{erro}</p>
              )}

              {salvo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mint-dark)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} />
                  Salvo com sucesso!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    background: 'var(--navy)', color: '#fff', border: 'none',
                    fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : 'Salvar mês'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
