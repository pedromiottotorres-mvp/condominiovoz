'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  votacaoId: string
  userId: string
  apartamento: string
  opcoes: string[]
  jaVotou: string | null // opção que o usuário já votou, ou null
}

export default function VotarButton({
  votacaoId,
  userId,
  apartamento,
  opcoes,
  jaVotou,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [votando, setVotando] = useState<string | null>(null)
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(jaVotou)
  const [erro, setErro] = useState('')

  async function votar(opcao: string) {
    if (votoRegistrado || votando) return
    setErro('')
    setVotando(opcao)

    const { error } = await supabase.from('votos').insert({
      votacao_id: votacaoId,
      morador_id: userId,
      apartamento,
      opcao_escolhida: opcao,
    })

    if (error) {
      // unique constraint = outro morador do mesmo apto já votou
      if (error.code === '23505') {
        setErro('Já existe um voto registrado para o seu apartamento.')
      } else {
        setErro('Erro ao registrar voto. Tente novamente.')
      }
      setVotando(null)
      return
    }

    setVotoRegistrado(opcao)
    setVotando(null)
    router.refresh()
  }

  if (votoRegistrado) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
        <p className="text-sm font-medium text-green-700">
          Você votou: <span className="font-bold">{votoRegistrado}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <p className="text-xs text-red-500 px-1">{erro}</p>
      )}
      {opcoes.map((opcao) => (
        <button
          key={opcao}
          onClick={() => votar(opcao)}
          disabled={!!votando}
          className="w-full py-3.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            borderColor: votando === opcao ? '#1e3a5f' : '#e5e7eb',
            backgroundColor: votando === opcao ? '#1e3a5f' : 'white',
            color: votando === opcao ? 'white' : '#374151',
          }}
        >
          {votando === opcao ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          {opcao}
        </button>
      ))}
    </div>
  )
}
