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
  jaVotou: string | null
}

export default function VotarButton({ votacaoId, userId, apartamento, opcoes, jaVotou }: Props) {
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
      setErro(error.code === '23505'
        ? 'Já existe um voto registrado para o seu apartamento.'
        : 'Erro ao registrar voto. Tente novamente.')
      setVotando(false)
      return
    }

    setVotoRegistrado(selecionado)
    setVotando(false)
    router.refresh()
  }

  if (votoRegistrado) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
        borderRadius: '14px', background: 'var(--mint-pale)', border: '1px solid var(--mint)',
        fontFamily: 'var(--font-body)',
      }}>
        <CheckCircle2 size={22} style={{ color: 'var(--mint-dark)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--mint-dark)' }}>
          Você votou: <span style={{ fontWeight: 800 }}>{votoRegistrado}</span>
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {erro && (
        <p style={{ fontSize: '0.8rem', color: '#dc2626', fontFamily: 'var(--font-body)', padding: '4px 0' }}>
          {erro}
        </p>
      )}

      {opcoes.map((opcao) => {
        const ativo = selecionado === opcao
        return (
          <button
            key={opcao}
            onClick={() => setSelecionado(opcao)}
            disabled={votando}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: '16px',
              border: ativo ? '2px solid var(--navy)' : '2px solid var(--gray-200)',
              background: ativo ? 'rgba(30,58,95,0.04)' : '#fff',
              color: ativo ? 'var(--navy)' : 'var(--gray-600)',
              fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: ativo ? 700 : 500,
              textAlign: 'left', cursor: votando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s var(--ease-spring)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              if (!ativo && !votando) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-300)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'
              }
            }}
            onMouseLeave={(e) => {
              if (!ativo) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'
                ;(e.currentTarget as HTMLButtonElement).style.background = '#fff'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: ativo ? '6px solid var(--navy)' : '2px solid var(--gray-300)',
                transition: 'all 0.2s var(--ease-spring)',
              }} />
              {opcao}
            </div>
            {ativo && <CheckCircle2 size={18} style={{ color: 'var(--navy)', flexShrink: 0 }} />}
          </button>
        )
      })}

      <button
        onClick={votar}
        disabled={!selecionado || votando}
        style={{
          marginTop: '6px', width: '100%', padding: '16px', borderRadius: '14px',
          background: 'var(--navy)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
          cursor: !selecionado || votando ? 'not-allowed' : 'pointer',
          opacity: !selecionado ? 0.4 : votando ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'transform 0.15s var(--ease-spring), box-shadow 0.2s, opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          if (selecionado && !votando) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,58,95,0.3)'
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = ''
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = ''
        }}
      >
        {votando ? <><Loader2 size={16} className="animate-spin" /> Registrando...</> : 'Confirmar Voto'}
      </button>
    </div>
  )
}
