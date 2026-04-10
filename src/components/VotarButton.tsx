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
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [votando, setVotando] = useState(false)
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(jaVotou)
  const [erro, setErro] = useState('')

  async function votar() {
    if (!selecionado || votoRegistrado || votando) return
    setErro('')
    setVotando(true)

    const { error } = await supabase.from('votos').insert({
      votacao_id: votacaoId,
      morador_id: userId,
      apartamento,
      opcao_escolhida: selecionado,
    })

    if (error) {
      if (error.code === '23505') {
        setErro('Já existe um voto registrado para o seu apartamento.')
      } else {
        setErro('Erro ao registrar voto. Tente novamente.')
      }
      setVotando(false)
      return
    }

    setVotoRegistrado(selecionado)
    setVotando(false)
    router.refresh()
  }

  if (votoRegistrado) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-xl"
        style={{
          background: 'var(--mint-pale)',
          border: '1px solid var(--mint)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <CheckCircle2 size={20} style={{ color: 'var(--mint-dark)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--mint-dark)' }}>
          Você votou:{' '}
          <span style={{ fontWeight: 800 }}>{votoRegistrado}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <p style={{ fontSize: '0.8rem', color: '#c53030', fontFamily: 'var(--font-body)' }}>
          {erro}
        </p>
      )}

      {/* Opções como cards selecionáveis */}
      {opcoes.map((opcao) => {
        const ativo = selecionado === opcao
        return (
          <button
            key={opcao}
            onClick={() => setSelecionado(opcao)}
            disabled={votando}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: ativo ? '2px solid var(--navy)' : '2px solid var(--gray-200)',
              background: ativo ? 'var(--navy-pale)' : '#fff',
              color: ativo ? 'var(--navy)' : 'var(--gray-600)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              fontWeight: ativo ? 700 : 500,
              textAlign: 'left',
              cursor: votando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s var(--ease-spring)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: ativo ? '6px solid var(--navy)' : '2px solid var(--gray-300)',
                flexShrink: 0,
                transition: 'all 0.2s var(--ease-spring)',
              }}
            />
            {opcao}
          </button>
        )
      })}

      {/* Botão confirmar */}
      <button
        onClick={votar}
        disabled={!selecionado || votando}
        className="btn-primary w-full"
        style={{ marginTop: '4px' }}
      >
        {votando ? (
          <><Loader2 size={16} className="animate-spin" /> Registrando...</>
        ) : (
          'Confirmar Voto'
        )}
      </button>
    </div>
  )
}
