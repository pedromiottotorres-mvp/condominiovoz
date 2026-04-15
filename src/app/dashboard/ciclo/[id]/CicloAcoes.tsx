'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, BarChart3, Play, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Fase = 'demandas' | 'votacao' | 'resultado' | 'execucao' | 'encerrado'

interface Acao {
  label: string
  proximaFase: Fase
  Icon: React.FC<{ size?: number }>
  danger?: boolean
}

const ACOES: Record<string, Acao | null> = {
  demandas:  { label: 'Encerrar Demandas e Abrir Votação', proximaFase: 'votacao',   Icon: ArrowRight   },
  votacao:   { label: 'Encerrar Votação e Ver Resultado',  proximaFase: 'resultado', Icon: BarChart3     },
  resultado: { label: 'Confirmar e Iniciar Execução',      proximaFase: 'execucao',  Icon: Play         },
  execucao:  { label: 'Encerrar Ciclo',                    proximaFase: 'encerrado', Icon: CheckCircle2, danger: true },
  encerrado: null,
}

export default function CicloAcoes({
  cicloId,
  faseAtual,
  demandasSemCusto = 0,
}: {
  cicloId: string
  faseAtual: string
  demandasSemCusto?: number
}) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const acao = ACOES[faseAtual]
  if (!acao) return null

  // Bloquear avanço para votação se há demandas qualificadas sem custo
  if (faseAtual === 'demandas' && demandasSemCusto > 0) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem',
        background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c',
        fontFamily: 'var(--font-body)', lineHeight: 1.5,
      }}>
        Preencha o custo estimado de todas as demandas qualificadas antes de abrir a votação.
        <strong> ({demandasSemCusto} {demandasSemCusto === 1 ? 'faltando' : 'faltando'})</strong>
      </div>
    )
  }

  const { label, proximaFase, Icon, danger } = acao

  async function avancarFase() {
    setLoading(true)
    setErro('')

    // Ao avançar para resultado: calcular alocação primeiro
    if (proximaFase === 'resultado') {
      const { error: calcError } = await supabase.rpc('calcular_alocacao', { ciclo_id: cicloId })
      if (calcError) {
        setErro('Erro ao calcular alocação. Tente novamente.')
        setLoading(false)
        return
      }
    }

    const { error } = await supabase.from('ciclos').update({ fase: proximaFase }).eq('id', cicloId)
    if (error) {
      setErro('Erro ao avançar fase. Tente novamente.')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
    setConfirmar(false)
  }

  const btnBg = danger ? '#dc2626' : 'var(--navy)'

  return (
    <div>
      {erro && (
        <p style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '12px', fontFamily: 'var(--font-body)' }}>
          {erro}
        </p>
      )}
      {!confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '12px',
            background: btnBg, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 700,
            transition: 'transform 0.15s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px ${danger ? 'rgba(220,38,38,0.3)' : 'rgba(30,58,95,0.3)'}` }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
        >
          <Icon size={15} />
          {label}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Confirmar? Não pode ser desfeita.
          </p>
          <button
            onClick={avancarFase}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px',
              background: btnBg, color: '#fff', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Processando...</> : 'Confirmar'}
          </button>
          <button
            onClick={() => setConfirmar(false)}
            style={{
              padding: '10px 16px', borderRadius: '10px',
              background: 'var(--gray-100)', color: 'var(--gray-600)', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
