'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
import DemandaCard, { type DemandaCardData, type Categoria } from './DemandaCard'
import { createClient } from '@/lib/supabase/client'

const CATEGORIAS: { value: Categoria | 'todas'; label: string }[] = [
  { value: 'todas',      label: 'Todas' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'seguranca',  label: 'Segurança' },
  { value: 'lazer',      label: 'Lazer' },
  { value: 'estetica',   label: 'Estética' },
  { value: 'estrutural', label: 'Estrutural' },
  { value: 'outro',      label: 'Outro' },
]

interface Props {
  demandas: DemandaCardData[]
  userId: string
}

export default function DemandasList({ demandas: initial, userId }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Categoria | 'todas'>('todas')
  const [demandas, setDemandas] = useState<DemandaCardData[]>(initial)
  const [apoiando, setApoiando] = useState<string | null>(null)
  const [refreshing, startRefresh] = useTransition()
  const supabase = createClient()

  const filtradas =
    filtro === 'todas'
      ? demandas
      : demandas.filter((d) => d.categoria === filtro)

  async function handleApoiar(id: string, jaApoiou: boolean) {
    if (apoiando) return
    setApoiando(id)

    // Optimistic update
    setDemandas((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              apoiado_por_mim: !jaApoiou,
              total_apoios: jaApoiou
                ? d.total_apoios - 1
                : d.total_apoios + 1,
            }
          : d
      )
    )

    if (jaApoiou) {
      await supabase
        .from('apoios')
        .delete()
        .eq('demanda_id', id)
        .eq('morador_id', userId)
    } else {
      await supabase
        .from('apoios')
        .insert({ demanda_id: id, morador_id: userId })
    }

    setApoiando(null)
  }

  function handleRefresh() {
    startRefresh(() => {
      router.refresh()
    })
  }

  return (
    <div>
      {/* Chips de filtro */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4"
        style={{ marginBottom: '16px' }}
      >
        {CATEGORIAS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            style={{
              flexShrink: 0,
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s var(--ease-spring)',
              background: filtro === value ? 'var(--navy)' : '#ffffff',
              color: filtro === value ? '#ffffff' : 'var(--gray-500)',
              border: filtro === value ? '1.5px solid var(--navy)' : '1.5px solid var(--gray-200)',
              boxShadow: filtro === value ? '0 2px 8px rgba(30,58,95,0.2)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {filtradas.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--gray-100)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--navy-pale)' }}
            >
              <MessageSquarePlus size={28} style={{ color: 'var(--navy)' }} />
            </div>
            <p
              className="font-semibold mb-1"
              style={{ color: 'var(--navy)', fontFamily: 'var(--font-body)' }}
            >
              Nenhuma demanda ainda
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: '20px' }}>
              Seja o primeiro a registrar uma!
            </p>
            <Link
              href="/nova-demanda"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.875rem' }}
            >
              Nova Demanda
            </Link>
          </div>
        ) : (
          filtradas.map((demanda) => (
            <DemandaCard
              key={demanda.id}
              demanda={demanda}
              onApoiar={handleApoiar}
              apoiando={apoiando === demanda.id}
            />
          ))
        )}
      </div>

      {/* Botão refresh */}
      {filtradas.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              fontSize: '0.8rem',
              color: 'var(--gray-400)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'color 0.2s',
            }}
          >
            {refreshing ? 'Atualizando...' : '↻ Atualizar lista'}
          </button>
        </div>
      )}
    </div>
  )
}
