'use client'

import Link from 'next/link'
import {
  Wrench,
  Shield,
  Palmtree,
  Paintbrush,
  Building,
  HelpCircle,
  ChevronUp,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type Categoria =
  | 'manutencao'
  | 'seguranca'
  | 'lazer'
  | 'estetica'
  | 'estrutural'
  | 'outro'

export interface DemandaCardData {
  id: string
  titulo: string
  categoria: Categoria
  total_apoios: number
  created_at: string
  autor: {
    nome: string
    apartamento: string
  }
  apoiado_por_mim?: boolean
}

const CATEGORIA_CONFIG: Record<
  Categoria,
  { label: string; Icon: React.ElementType; cssClass: string }
> = {
  manutencao: { label: 'Manutenção', Icon: Wrench,      cssClass: 'badge-manutencao' },
  seguranca:  { label: 'Segurança',  Icon: Shield,      cssClass: 'badge-seguranca'  },
  lazer:      { label: 'Lazer',      Icon: Palmtree,    cssClass: 'badge-lazer'      },
  estetica:   { label: 'Estética',   Icon: Paintbrush,  cssClass: 'badge-estetica'   },
  estrutural: { label: 'Estrutural', Icon: Building,    cssClass: 'badge-estrutural' },
  outro:      { label: 'Outro',      Icon: HelpCircle,  cssClass: 'badge-outro'      },
}

interface Props {
  demanda: DemandaCardData
  onApoiar?: (id: string, apoiado: boolean) => void
  apoiando?: boolean
}

export default function DemandaCard({ demanda, onApoiar, apoiando }: Props) {
  const config = CATEGORIA_CONFIG[demanda.categoria]
  const { Icon } = config

  const tempoRelativo = formatDistanceToNow(new Date(demanda.created_at), {
    locale: ptBR,
    addSuffix: true,
  })

  const apoiado = !!demanda.apoiado_por_mim

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s var(--ease-spring), border-color 0.25s var(--ease-spring)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-hover)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-200)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-100)'
      }}
    >
      <Link href={`/demanda/${demanda.id}`} className="block p-5">
        {/* Badge de categoria */}
        <span className={`badge ${config.cssClass}`} style={{ marginBottom: '10px', display: 'inline-flex' }}>
          <Icon size={11} />
          {config.label}
        </span>

        {/* Título */}
        <h3
          className="line-clamp-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--navy)',
            lineHeight: 1.4,
            marginBottom: '8px',
          }}
        >
          {demanda.titulo}
        </h3>

        {/* Meta */}
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
          {demanda.autor.nome.split(' ')[0]} · Apto {demanda.autor.apartamento} · {tempoRelativo}
        </p>
      </Link>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 pb-4"
        style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px' }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
          {demanda.total_apoios} {demanda.total_apoios === 1 ? 'apoio' : 'apoios'}
        </span>

        <button
          onClick={() => onApoiar?.(demanda.id, apoiado)}
          disabled={apoiando}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            cursor: apoiando ? 'not-allowed' : 'pointer',
            opacity: apoiando ? 0.5 : 1,
            transition: 'all 0.2s var(--ease-spring)',
            border: apoiado ? '2px solid var(--mint)' : '2px solid var(--gray-200)',
            background: apoiado ? 'var(--mint-pale)' : 'transparent',
            color: apoiado ? 'var(--mint-dark)' : 'var(--gray-500)',
          }}
        >
          <ChevronUp
            size={13}
            strokeWidth={2.5}
            style={{ color: apoiado ? 'var(--mint)' : 'var(--gray-400)' }}
          />
          {apoiado ? 'Apoiado' : 'Apoiar'}
        </button>
      </div>
    </div>
  )
}
