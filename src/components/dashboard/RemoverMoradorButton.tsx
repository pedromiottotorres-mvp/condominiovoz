'use client'

import { useState } from 'react'
import { UserMinus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  moradorId: string
}

export default function RemoverMoradorButton({ moradorId }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function remover() {
    if (!confirmar) { setConfirmar(true); return }
    setLoading(true)
    await supabase
      .from('profiles')
      .update({ status: 'rejeitado' })
      .eq('id', moradorId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={remover}
      disabled={loading}
      className="flex items-center gap-1 text-xs transition-colors"
      style={{
        color: confirmar ? '#c53030' : 'var(--gray-400)',
        background: 'none',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: confirmar ? 700 : 400,
      }}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
      {confirmar ? 'Confirmar remoção' : 'Remover'}
    </button>
  )
}
