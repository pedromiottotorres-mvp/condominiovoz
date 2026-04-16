'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  condominioId: string
  mes: number
  ano: number
  inicial: {
    receita_condominial: number
    custos_fixos: number
    observacoes: string | null
  } | null
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FinanceiroForm({ condominioId, mes, ano, inicial }: Props) {
  const supabase = createClient()

  const [receita, setReceita] = useState(inicial?.receita_condominial ? String(inicial.receita_condominial) : '')
  const [custos, setCustos] = useState(inicial?.custos_fixos ? String(inicial.custos_fixos) : '')
  const [obs, setObs] = useState(inicial?.observacoes ?? '')
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  const receitaNum = parseFloat(receita) || 0
  const custosNum = parseFloat(custos) || 0
  const saldo = receitaNum - custosNum
  const saldoPositivo = saldo >= 0

  // Focus styles via inline state
  const [receitaFocus, setReceitaFocus] = useState(false)
  const [custosFocus, setCustosFocus] = useState(false)
  const [obsFocus, setObsFocus] = useState(false)

  useEffect(() => {
    if (salvo) {
      const t = setTimeout(() => setSalvo(false), 3000)
      return () => clearTimeout(t)
    }
  }, [salvo])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (receitaNum < 0) { setErro('Receita não pode ser negativa.'); return }
    if (custosNum < 0) { setErro('Custos não podem ser negativos.'); return }

    setLoading(true)

    const { error } = await supabase.from('financeiro_mensal').upsert(
      {
        condominio_id: condominioId,
        mes,
        ano,
        receita_condominial: receitaNum,
        custos_fixos: custosNum,
        saldo_investimento: saldo,
        observacoes: obs.trim() || null,
      },
      { onConflict: 'condominio_id,mes,ano' }
    )

    setLoading(false)

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
      return
    }

    setSalvo(true)
  }

  const inputBase: React.CSSProperties = {
    width: '100%', background: '#fff',
    border: '2px solid var(--gray-200)', borderRadius: '12px',
    padding: '14px 16px', fontFamily: 'var(--font-body)',
    fontSize: '0.9375rem', color: 'var(--gray-800)', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {erro && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', fontSize: '0.875rem',
          background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626',
          fontFamily: 'var(--font-body)',
        }}>
          {erro}
        </div>
      )}

      {/* Receita */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
          Receita condominial (R$)
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', fontWeight: 700, color: 'var(--gray-400)',
            fontFamily: 'var(--font-body)', pointerEvents: 'none',
          }}>R$</span>
          <input
            type="number" min="0" step="0.01"
            value={receita} onChange={(e) => setReceita(e.target.value)}
            placeholder="0,00"
            style={{
              ...inputBase, paddingLeft: '52px',
              fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)',
              borderColor: receitaFocus ? 'var(--navy)' : 'var(--gray-200)',
              boxShadow: receitaFocus ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
            }}
            onFocus={() => setReceitaFocus(true)}
            onBlur={() => setReceitaFocus(false)}
          />
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
          Total arrecadado com as taxas condominiais este mês
        </p>
      </div>

      {/* Custos */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
          Custos fixos (R$)
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', fontWeight: 700, color: 'var(--gray-400)',
            fontFamily: 'var(--font-body)', pointerEvents: 'none',
          }}>R$</span>
          <input
            type="number" min="0" step="0.01"
            value={custos} onChange={(e) => setCustos(e.target.value)}
            placeholder="0,00"
            style={{
              ...inputBase, paddingLeft: '52px',
              fontSize: '1.4rem', fontWeight: 800, color: '#dc2626',
              borderColor: custosFocus ? '#dc2626' : 'var(--gray-200)',
              boxShadow: custosFocus ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
            }}
            onFocus={() => setCustosFocus(true)}
            onBlur={() => setCustosFocus(false)}
          />
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
          Salários, manutenção preventiva, contas de consumo, seguro, etc.
        </p>
      </div>

      {/* Saldo calculado */}
      {(receitaNum > 0 || custosNum > 0) && (
        <div style={{
          padding: '18px 20px', borderRadius: '14px',
          background: saldoPositivo ? 'var(--mint-pale)' : '#fff5f5',
          border: `1.5px solid ${saldoPositivo ? 'var(--mint)' : '#fca5a5'}`,
        }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: saldoPositivo ? 'var(--mint-dark)' : '#dc2626', fontFamily: 'var(--font-body)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Saldo para investimento
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: saldoPositivo ? '#047857' : '#dc2626', lineHeight: 1.1 }}>
            {fmtBRL(saldo)}
          </p>
          <p style={{ fontSize: '0.75rem', color: saldoPositivo ? 'var(--mint-dark)' : '#dc2626', fontFamily: 'var(--font-body)', marginTop: '4px', opacity: 0.7 }}>
            {saldoPositivo ? 'Disponível para melhorias e investimentos' : 'Déficit. Os custos superam a receita.'}
          </p>
        </div>
      )}

      {/* Observações */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
          Observações <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(opcional)</span>
        </label>
        <textarea
          value={obs} onChange={(e) => setObs(e.target.value)}
          placeholder="Anote algo relevante sobre o mês financeiro..."
          rows={3}
          style={{
            ...inputBase, resize: 'none', lineHeight: 1.6,
            borderColor: obsFocus ? 'var(--navy)' : 'var(--gray-200)',
            boxShadow: obsFocus ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
          }}
          onFocus={() => setObsFocus(true)}
          onBlur={() => setObsFocus(false)}
        />
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '16px', borderRadius: '14px',
          background: 'var(--navy)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'transform 0.15s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)' } }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
      </button>

      {/* Toast */}
      {salvo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', borderRadius: '12px',
          background: 'var(--mint-pale)', border: '1px solid var(--mint)',
          fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          color: 'var(--mint-dark)', fontWeight: 600,
          animation: 'fadeIn 0.2s ease',
        }}>
          <CheckCircle2 size={16} />
          Dados financeiros salvos!
        </div>
      )}
    </form>
  )
}
