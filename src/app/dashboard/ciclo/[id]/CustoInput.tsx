'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CustoInput({
  demandaId,
  custoInicial,
}: {
  demandaId: string
  custoInicial: number | null
}) {
  const [valor, setValor] = useState(custoInicial ? String(custoInicial) : '')
  const [saving, setSaving] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const supabase = createClient()

  async function salvar() {
    const num = parseFloat(valor)
    const custo = !isNaN(num) && num > 0 ? num : null
    // Não re-salvar se não mudou
    if (custo === custoInicial && salvo) return
    setSaving(true)
    await supabase.from('demandas').update({ custo_estimado: custo }).eq('id', demandaId)
    setSaving(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)',
          fontFamily: 'var(--font-body)', pointerEvents: 'none',
        }}>
          R$
        </span>
        <input
          type="number" min="0" step="0.01"
          value={valor}
          onChange={(e) => { setValor(e.target.value); setSalvo(false) }}
          onBlur={salvar}
          placeholder="0,00"
          style={{
            width: '110px', paddingLeft: '30px', paddingRight: '8px',
            height: '32px', borderRadius: '8px',
            border: `1.5px solid ${salvo ? 'var(--mint)' : 'var(--gray-200)'}`,
            background: salvo ? 'var(--mint-pale)' : '#fff',
            fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 600,
            color: 'var(--navy)', outline: 'none',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--navy)'; (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(30,58,95,0.1)' }}
        />
      </div>
      <div style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {saving && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--gray-400)' }} />}
        {salvo && !saving && <Check size={12} style={{ color: 'var(--mint-dark)' }} />}
      </div>
    </div>
  )
}
