'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { value: 'pendente',    label: 'Pendente',    bg: 'var(--gray-100)', color: 'var(--gray-500)'  },
  { value: 'em_execucao', label: 'Em Execução', bg: '#dbeafe',         color: '#1d4ed8'          },
  { value: 'concluida',   label: 'Concluída',   bg: 'var(--mint-pale)', color: 'var(--mint-dark)' },
]

export default function StatusExecucaoSelect({
  demandaId,
  statusAtual,
}: {
  demandaId: string
  statusAtual: string | null
}) {
  const [status, setStatus] = useState(statusAtual ?? 'pendente')
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  async function handleChange(novoStatus: string) {
    if (novoStatus === status || updating) return
    setUpdating(true)
    setStatus(novoStatus)
    await supabase.from('demandas').update({ status_execucao: novoStatus }).eq('id', demandaId)
    setUpdating(false)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', opacity: updating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          disabled={updating}
          style={{
            padding: '5px 12px', borderRadius: '50px',
            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            border: status === s.value ? 'none' : '1.5px solid var(--gray-200)',
            background: status === s.value ? s.bg : 'transparent',
            color: status === s.value ? s.color : 'var(--gray-400)',
            cursor: updating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
