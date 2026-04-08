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
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import ApoiarButton from '@/components/ApoiarButton'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  aberta: { label: 'Aberta', bg: 'bg-blue-100', text: 'text-blue-700' },
  em_votacao: { label: 'Em votação', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  aprovada: { label: 'Aprovada', bg: 'bg-green-100', text: 'text-green-700' },
  em_andamento: { label: 'Em andamento', bg: 'bg-purple-100', text: 'text-purple-700' },
  concluida: { label: 'Concluída', bg: 'bg-gray-100', text: 'text-gray-600' },
  rejeitada: { label: 'Rejeitada', bg: 'bg-red-100', text: 'text-red-700' },
}

const CATEGORIA_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; bg: string; text: string }
> = {
  manutencao: { label: 'Manutenção', Icon: Wrench, bg: 'bg-yellow-100', text: 'text-yellow-700' },
  seguranca: { label: 'Segurança', Icon: Shield, bg: 'bg-red-100', text: 'text-red-700' },
  lazer: { label: 'Lazer', Icon: Palmtree, bg: 'bg-green-100', text: 'text-green-700' },
  estetica: { label: 'Estética', Icon: Paintbrush, bg: 'bg-purple-100', text: 'text-purple-700' },
  estrutural: { label: 'Estrutural', Icon: Building, bg: 'bg-orange-100', text: 'text-orange-700' },
  outro: { label: 'Outro', Icon: HelpCircle, bg: 'bg-gray-100', text: 'text-gray-600' },
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
  const status = STATUS_CONFIG[demanda.status] ?? STATUS_CONFIG.aberta
  const { Icon: CatIcon } = cat

  const dataFormatada = format(new Date(demanda.created_at), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  const tempoRelativo = formatDistanceToNow(new Date(demanda.created_at), {
    locale: ptBR,
    addSuffix: true,
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-base font-bold truncate" style={{ color: '#1e3a5f' }}>
            Demanda
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Foto de destaque */}
        {demanda.foto_url && (
          <div className="w-full h-52 relative">
            <Image
              src={demanda.foto_url}
              alt={demanda.titulo}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="px-4 py-5 flex flex-col gap-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cat.bg} ${cat.text}`}
            >
              <CatIcon size={12} />
              {cat.label}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-gray-800 leading-snug">
            {demanda.titulo}
          </h2>

          {/* Descrição */}
          {demanda.descricao && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {demanda.descricao}
            </p>
          )}

          {/* Autor */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{autor?.nome}</p>
              <p className="text-xs text-gray-400">Apto {autor?.apartamento}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{dataFormatada}</p>
              <p className="text-xs text-gray-400">{tempoRelativo}</p>
            </div>
          </div>

          {/* Apoio */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold" style={{ color: '#1e3a5f' }}>
                {demanda.total_apoios}
              </p>
              <p className="text-xs text-gray-400">
                {demanda.total_apoios === 1 ? 'apoio' : 'apoios'}
              </p>
            </div>
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
