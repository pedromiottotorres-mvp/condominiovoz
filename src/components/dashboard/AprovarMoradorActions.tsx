'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  moradorId: string
  sindicoId: string
}

export default function AprovarMoradorActions({ moradorId, sindicoId }: Props) {
  const [loading, setLoading] = useState<'aprovar' | 'rejeitar' | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function aprovar() {
    setLoading('aprovar')
    await supabase
      .from('profiles')
      .update({
        status: 'ativo',
        aprovado_em: new Date().toISOString(),
        aprovado_por: sindicoId,
      })
      .eq('id', moradorId)
    setLoading(null)
    router.refresh()
  }

  async function rejeitar() {
    setLoading('rejeitar')
    await supabase
      .from('profiles')
      .update({ status: 'rejeitado' })
      .eq('id', moradorId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={aprovar}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: 'var(--mint)',
          color: '#fff',
          border: 'none',
          cursor: loading !== null ? 'not-allowed' : 'pointer',
          opacity: loading !== null ? 0.6 : 1,
          fontFamily: 'var(--font-body)',
        }}
      >
        {loading === 'aprovar' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Aprovar
      </button>
      <button
        onClick={rejeitar}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: 'transparent',
          color: '#c53030',
          border: '1.5px solid #feb2b2',
          cursor: loading !== null ? 'not-allowed' : 'pointer',
          opacity: loading !== null ? 0.6 : 1,
          fontFamily: 'var(--font-body)',
        }}
      >
        {loading === 'rejeitar' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        Rejeitar
      </button>
    </div>
  )
}
