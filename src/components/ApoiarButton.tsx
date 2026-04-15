'use client'

import { useState } from 'react'
import { ChevronUp, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  demandaId: string
  userId: string
  apoiadoInicial: boolean
  totalInicial: number
}

export default function ApoiarButton({ demandaId, userId, apoiadoInicial, totalInicial }: Props) {
  const supabase = createClient()
  const [apoiado, setApoiado] = useState(apoiadoInicial)
  const [total, setTotal] = useState(totalInicial)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 200)

    const novoEstado = !apoiado
    setApoiado(novoEstado)
    setTotal((t) => (novoEstado ? t + 1 : t - 1))

    if (apoiado) {
      await supabase.from('apoios').delete().eq('demanda_id', demandaId).eq('morador_id', userId)
    } else {
      await supabase.from('apoios').insert({ demanda_id: demandaId, morador_id: userId })
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '12px',
        padding: '14px 32px', borderRadius: '50px',
        fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-body)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        border: apoiado ? '2px solid var(--mint)' : '2px solid var(--gray-200)',
        background: apoiado ? 'var(--mint-pale)' : 'var(--gray-100)',
        color: apoiado ? '#047857' : 'var(--gray-600)',
        transform: animating ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s var(--ease-spring), background 0.2s, border-color 0.2s, color 0.2s',
        boxShadow: apoiado ? '0 4px 16px rgba(16,185,129,0.2)' : 'none',
      }}
    >
      {loading
        ? <Loader2 size={18} className="animate-spin" />
        : <ChevronUp size={18} strokeWidth={2.5} style={{ color: apoiado ? 'var(--mint)' : 'var(--gray-400)' }} />
      }
      <span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{total}</span>
        {' '}{total === 1 ? 'apoio' : 'apoios'}
      </span>
    </button>
  )
}
