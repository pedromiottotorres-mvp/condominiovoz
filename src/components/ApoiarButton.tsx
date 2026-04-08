'use client'

import { useState } from 'react'
import { ThumbsUp, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  demandaId: string
  userId: string
  apoiadoInicial: boolean
  totalInicial: number
}

export default function ApoiarButton({
  demandaId,
  userId,
  apoiadoInicial,
  totalInicial,
}: Props) {
  const supabase = createClient()
  const [apoiado, setApoiado] = useState(apoiadoInicial)
  const [total, setTotal] = useState(totalInicial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)

    // Optimistic update
    const novoEstado = !apoiado
    setApoiado(novoEstado)
    setTotal((t) => (novoEstado ? t + 1 : t - 1))

    if (apoiado) {
      await supabase
        .from('apoios')
        .delete()
        .eq('demanda_id', demandaId)
        .eq('morador_id', userId)
    } else {
      await supabase
        .from('apoios')
        .insert({ demanda_id: demandaId, morador_id: userId })
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60 ${
        apoiado
          ? 'bg-[#1e3a5f] text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <ThumbsUp
          size={16}
          strokeWidth={2.2}
          fill={apoiado ? 'currentColor' : 'none'}
        />
      )}
      {apoiado ? 'Apoiado' : 'Apoiar'}
    </button>
  )
}
