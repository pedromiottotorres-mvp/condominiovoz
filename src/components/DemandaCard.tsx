'use client'

import Link from 'next/link'
import {
  Wrench,
  Shield,
  Palmtree,
  Paintbrush,
  Building,
  HelpCircle,
  ThumbsUp,
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
  { label: string; Icon: React.ElementType; bg: string; text: string }
> = {
  manutencao: {
    label: 'Manutenção',
    Icon: Wrench,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  seguranca: {
    label: 'Segurança',
    Icon: Shield,
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
  lazer: {
    label: 'Lazer',
    Icon: Palmtree,
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  estetica: {
    label: 'Estética',
    Icon: Paintbrush,
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  estrutural: {
    label: 'Estrutural',
    Icon: Building,
    bg: 'bg-orange-100',
    text: 'text-orange-700',
  },
  outro: {
    label: 'Outro',
    Icon: HelpCircle,
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <Link href={`/demanda/${demanda.id}`} className="block p-4">
        {/* Badge de categoria */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
          >
            <Icon size={11} />
            {config.label}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
          {demanda.titulo}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <span>{demanda.autor.nome.split(' ')[0]}</span>
          <span>·</span>
          <span>Apto {demanda.autor.apartamento}</span>
          <span>·</span>
          <span>{tempoRelativo}</span>
        </div>
      </Link>

      {/* Footer: apoio */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {demanda.total_apoios}{' '}
          {demanda.total_apoios === 1 ? 'apoio' : 'apoios'}
        </span>

        <button
          onClick={() => onApoiar?.(demanda.id, !!demanda.apoiado_por_mim)}
          disabled={apoiando}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${
            demanda.apoiado_por_mim
              ? 'bg-[#1e3a5f] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ThumbsUp
            size={13}
            strokeWidth={2.2}
            fill={demanda.apoiado_por_mim ? 'currentColor' : 'none'}
          />
          {demanda.apoiado_por_mim ? 'Apoiado' : 'Apoiar'}
        </button>
      </div>
    </div>
  )
}
