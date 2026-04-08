'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DemandaCard, { type DemandaCardData, type Categoria } from './DemandaCard'
import { createClient } from '@/lib/supabase/client'

const CATEGORIAS: { value: Categoria | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'estetica', label: 'Estética' },
  { value: 'estrutural', label: 'Estrutural' },
  { value: 'outro', label: 'Outro' },
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
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {CATEGORIAS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filtro === value
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-4 flex flex-col gap-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏘️</p>
            <p className="text-sm font-medium text-gray-600">
              Nenhuma demanda ainda.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Seja o primeiro a registrar uma!
            </p>
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
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Atualizando...' : '↻ Atualizar lista'}
          </button>
        </div>
      )}
    </div>
  )
}
