import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  Shield,
  Palmtree,
  Paintbrush,
  Building,
  HelpCircle,
  User,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import ApoiarButton from '@/components/ApoiarButton'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  aberta:       { label: 'Aberta',       bg: '#dbeafe', color: '#1d4ed8' },
  em_votacao:   { label: 'Em votação',   bg: '#fef9c3', color: '#a16207' },
  aprovada:     { label: 'Aprovada',     bg: '#d1fae5', color: '#059669' },
  em_andamento: { label: 'Em andamento', bg: '#f3e8ff', color: '#7e22ce' },
  concluida:    { label: 'Concluída',    bg: '#f1f5f9', color: '#475569' },
  rejeitada:    { label: 'Rejeitada',    bg: '#fee2e2', color: '#b91c1c' },
}

const CATEGORIA_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; cssClass: string }
> = {
  manutencao: { label: 'Manutenção', Icon: Wrench,     cssClass: 'badge-manutencao' },
  seguranca:  { label: 'Segurança',  Icon: Shield,     cssClass: 'badge-seguranca'  },
  lazer:      { label: 'Lazer',      Icon: Palmtree,   cssClass: 'badge-lazer'      },
  estetica:   { label: 'Estética',   Icon: Paintbrush, cssClass: 'badge-estetica'   },
  estrutural: { label: 'Estrutural', Icon: Building,   cssClass: 'badge-estrutural' },
  outro:      { label: 'Outro',      Icon: HelpCircle, cssClass: 'badge-outro'      },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function DemandaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: demanda } = await supabase
    .from('demandas')
    .select(
      `id, titulo, descricao, categoria, status, total_apoios, foto_url, created_at,
       autor:profiles!autor_id(nome, apartamento)`
    )
    .eq('id', id)
    .single()

  if (!demanda) notFound()

  const { data: meuApoio } = await supabase
    .from('apoios')
    .select('id')
    .eq('demanda_id', id)
    .eq('morador_id', user.id)
    .maybeSingle()

  const autor = Array.isArray(demanda.autor) ? demanda.autor[0] : demanda.autor
  const cat = CATEGORIA_CONFIG[demanda.categoria]
  const statusCfg = STATUS_CONFIG[demanda.status] ?? STATUS_CONFIG.aberta
  const { Icon: CatIcon } = cat

  const dataFormatada = format(new Date(demanda.created_at), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  const tempoRelativo = formatDistanceToNow(new Date(demanda.created_at), {
    locale: ptBR,
    addSuffix: true,
  })

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/demandas"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--gray-100)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </Link>
          <span className={`badge ${cat.cssClass}`}>
            <CatIcon size={11} />
            {cat.label}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Foto de destaque */}
        {demanda.foto_url && (
          <div className="w-full h-56 relative">
            <Image
              src={demanda.foto_url}
              alt={demanda.titulo}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="px-4 py-6 flex flex-col gap-5">
          {/* Status badge */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: statusCfg.bg,
              color: statusCfg.color,
              fontFamily: 'var(--font-body)',
              width: 'fit-content',
            }}
          >
            {statusCfg.label}
          </span>

          {/* Título */}
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--navy)',
              lineHeight: 1.25,
            }}
          >
            {demanda.titulo}
          </h2>

          {/* Descrição */}
          {demanda.descricao && (
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--gray-600)',
                lineHeight: 1.7,
                fontFamily: 'var(--font-body)',
              }}
            >
              {demanda.descricao}
            </p>
          )}

          {/* Autor + data */}
          <div
            className="flex items-center justify-between p-4"
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-100)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--navy)' }}
              >
                {autor?.nome?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)', fontFamily: 'var(--font-body)' }}>
                  {autor?.nome}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                  Apto {autor?.apartamento}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end', color: 'var(--gray-400)' }}>
                <Clock size={12} />
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>{tempoRelativo}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-300)', fontFamily: 'var(--font-body)' }}>
                {dataFormatada}
              </p>
            </div>
          </div>

          {/* Botão de apoio */}
          <div className="flex flex-col items-center gap-3 py-2">
            <ApoiarButton
              demandaId={id}
              userId={user.id}
              apoiadoInicial={!!meuApoio}
              totalInicial={demanda.total_apoios}
            />
          </div>
        </div>
      </main>

      <BottomNav isSindico={profile?.role === 'sindico'} />
    </div>
  )
}
