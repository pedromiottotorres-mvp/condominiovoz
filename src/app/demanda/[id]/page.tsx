import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Wrench, Shield, Palmtree, Paintbrush, Building, HelpCircle, Clock,
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

const CATEGORIA_CONFIG: Record<string, {
  label: string; Icon: React.ElementType; bg: string; color: string
}> = {
  manutencao: { label: 'Manutenção', Icon: Wrench,     bg: '#fef3c7', color: '#92400e' },
  seguranca:  { label: 'Segurança',  Icon: Shield,     bg: '#fee2e2', color: '#991b1b' },
  lazer:      { label: 'Lazer',      Icon: Palmtree,   bg: '#dbeafe', color: '#1e40af' },
  estetica:   { label: 'Estética',   Icon: Paintbrush, bg: '#f3e8ff', color: '#6b21a8' },
  estrutural: { label: 'Estrutural', Icon: Building,   bg: '#ffedd5', color: '#9a3412' },
  outro:      { label: 'Outro',      Icon: HelpCircle, bg: '#f1f5f9', color: '#475569' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function DemandaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { data: demanda } = await supabase
    .from('demandas')
    .select(`id, titulo, descricao, categoria, status, total_apoios, foto_url, created_at,
       autor:profiles!autor_id(nome, apartamento)`)
    .eq('id', id).single()

  if (!demanda) notFound()

  const { data: meuApoio } = await supabase
    .from('apoios').select('id').eq('demanda_id', id).eq('morador_id', user.id).maybeSingle()

  const autor = Array.isArray(demanda.autor) ? demanda.autor[0] : demanda.autor
  const cat = CATEGORIA_CONFIG[demanda.categoria]
  const statusCfg = STATUS_CONFIG[demanda.status] ?? STATUS_CONFIG.aberta
  const { Icon: CatIcon } = cat

  const iniciais = autor?.nome?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() ?? '?'
  const dataFormatada = format(new Date(demanda.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const tempoRelativo = formatDistanceToNow(new Date(demanda.created_at), { locale: ptBR, addSuffix: true })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '96px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/demandas" style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, textDecoration: 'none',
          }}>
            <ArrowLeft size={18} style={{ color: 'var(--gray-600)' }} />
          </Link>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 12px', borderRadius: '50px',
            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: cat.bg, color: cat.color,
          }}>
            <CatIcon size={11} />
            {cat.label}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Foto */}
        {demanda.foto_url && (
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            <Image src={demanda.foto_url} alt={demanda.titulo} fill style={{ objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px', borderRadius: '50px',
            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: statusCfg.bg, color: statusCfg.color, width: 'fit-content',
          }}>
            {statusCfg.label}
          </span>

          {/* Título */}
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.6rem',
            color: 'var(--navy)', lineHeight: 1.25,
          }}>
            {demanda.titulo}
          </h2>

          {/* Descrição */}
          {demanda.descricao && (
            <p style={{
              fontSize: '1rem', color: 'var(--gray-600)',
              lineHeight: 1.7, fontFamily: 'var(--font-body)',
            }}>
              {demanda.descricao}
            </p>
          )}

          {/* Info card */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: '14px',
            padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)',
              }}>
                {iniciais}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', fontFamily: 'var(--font-body)' }}>
                  {autor?.nome}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                  Apto {autor?.apartamento}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', color: 'var(--gray-400)' }}>
                <Clock size={12} />
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>{tempoRelativo}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--gray-300)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                {dataFormatada}
              </p>
            </div>
          </div>

          {/* Botão de apoio */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
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
