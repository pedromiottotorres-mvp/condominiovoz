'use client'

import Link from 'next/link'
import {
  Wrench, Shield, Palmtree, Paintbrush, Building, HelpCircle, ChevronUp,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type Categoria = 'manutencao' | 'seguranca' | 'lazer' | 'estetica' | 'estrutural' | 'outro'

export interface DemandaCardData {
  id: string
  titulo: string
  categoria: Categoria
  total_apoios: number
  created_at: string
  autor: { nome: string; apartamento: string }
  apoiado_por_mim?: boolean
  ciclo_id?: string | null
}

const CATEGORIA_CONFIG: Record<Categoria, {
  label: string; Icon: React.ElementType
  bg: string; color: string
}> = {
  manutencao: { label: 'Manutenção', Icon: Wrench,     bg: '#fef3c7', color: '#92400e' },
  seguranca:  { label: 'Segurança',  Icon: Shield,     bg: '#fee2e2', color: '#991b1b' },
  lazer:      { label: 'Lazer',      Icon: Palmtree,   bg: '#dbeafe', color: '#1e40af' },
  estetica:   { label: 'Estética',   Icon: Paintbrush, bg: '#f3e8ff', color: '#6b21a8' },
  estrutural: { label: 'Estrutural', Icon: Building,   bg: '#ffedd5', color: '#9a3412' },
  outro:      { label: 'Outro',      Icon: HelpCircle, bg: '#f1f5f9', color: '#475569' },
}

interface Props {
  demanda: DemandaCardData
  onApoiar?: (id: string, apoiado: boolean) => void
  apoiando?: boolean
  bloqueadoPorCiclo?: boolean
}

export default function DemandaCard({ demanda, onApoiar, apoiando, bloqueadoPorCiclo }: Props) {
  const config = CATEGORIA_CONFIG[demanda.categoria]
  const { Icon } = config
  const apoiado = !!demanda.apoiado_por_mim

  const tempoRelativo = formatDistanceToNow(new Date(demanda.created_at), {
    locale: ptBR, addSuffix: true,
  })

  const iniciais = demanda.autor?.nome
    ?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? '?'

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--gray-100)',
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
        overflow: 'hidden',
        transition: 'transform 0.25s var(--ease-spring), box-shadow 0.25s var(--ease-spring), border-color 0.25s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(15,36,64,0.12)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = ''
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(15,36,64,0.06)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-100)'
      }}
    >
      <Link href={`/demanda/${demanda.id}`} style={{ display: 'block', padding: '20px 20px 16px', textDecoration: 'none' }}>
        {/* Badge de categoria */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 12px', borderRadius: '50px',
          fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          background: config.bg, color: config.color,
          marginBottom: '12px',
        }}>
          <Icon size={11} />
          {config.label}
        </span>

        {/* Título */}
        <h3 style={{
          fontFamily: 'var(--font-body)', fontWeight: 700,
          fontSize: '1rem', color: 'var(--navy)',
          lineHeight: 1.45, marginBottom: '12px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {demanda.titulo}
        </h3>

        {/* Meta — avatar + nome + tempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--navy)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.55rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)',
          }}>
            {iniciais}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
            {demanda.autor?.nome?.split(' ')[0]}
            {demanda.autor?.apartamento && ` · Apto ${demanda.autor.apartamento}`}
            {' · '}{tempoRelativo}
          </p>
        </div>
      </Link>

      {/* Footer */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: '1px solid var(--gray-50)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
            {demanda.total_apoios} {demanda.total_apoios === 1 ? 'apoio' : 'apoios'}
          </span>

          <button
            onClick={(e) => { e.preventDefault(); if (!bloqueadoPorCiclo) onApoiar?.(demanda.id, apoiado) }}
            disabled={apoiando || bloqueadoPorCiclo}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 16px', borderRadius: '50px',
              fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: apoiando || bloqueadoPorCiclo ? 'not-allowed' : 'pointer',
              opacity: apoiando ? 0.5 : 1,
              transition: 'all 0.2s var(--ease-spring)',
              border: apoiado ? '2px solid var(--mint)' : '2px solid var(--gray-200)',
              background: apoiado ? 'var(--mint-pale)' : 'transparent',
              color: apoiado ? '#047857' : bloqueadoPorCiclo ? 'var(--gray-300)' : 'var(--gray-500)',
            }}
          >
            <ChevronUp size={13} strokeWidth={2.5} style={{ color: apoiado ? 'var(--mint)' : bloqueadoPorCiclo ? 'var(--gray-300)' : 'var(--gray-400)' }} />
            {apoiado ? 'Apoiado' : 'Apoiar'}
          </button>
        </div>
        {bloqueadoPorCiclo && (
          <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', textAlign: 'right', marginTop: '4px' }}>
            Você já apoiou uma demanda neste ciclo
          </p>
        )}
      </div>
    </div>
  )
}
