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

  const filtradas = filtro === 'todas' ? demandas : demandas.filter((d) => d.categoria === filtro)

  // Mapa ciclo_id → id da demanda que o usuário já apoiou naquele ciclo
  const cicloApoiadoMap: Record<string, string> = {}
  demandas.forEach((d) => {
    if (d.ciclo_id && d.apoiado_por_mim) {
      cicloApoiadoMap[d.ciclo_id] = d.id
    }
  })

  async function handleApoiar(id: string, jaApoiou: boolean) {
    if (apoiando) return

    // Bloquear se já apoiou outra demanda do mesmo ciclo
    if (!jaApoiou) {
      const demandaAlvo = demandas.find((d) => d.id === id)
      if (demandaAlvo?.ciclo_id) {
        const jaApoiadaNoMesmoCiclo = cicloApoiadoMap[demandaAlvo.ciclo_id]
        if (jaApoiadaNoMesmoCiclo && jaApoiadaNoMesmoCiclo !== id) return
      }
    }

    setApoiando(id)

    setDemandas((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, apoiado_por_mim: !jaApoiou, total_apoios: jaApoiou ? d.total_apoios - 1 : d.total_apoios + 1 }
          : d
      )
    )

    if (jaApoiou) {
      await supabase.from('apoios').delete().eq('demanda_id', id).eq('morador_id', userId)
    } else {
      await supabase.from('apoios').insert({ demanda_id: id, morador_id: userId })
    }

    setApoiando(null)
  }

  function handleRefresh() {
    startRefresh(() => { router.refresh() })
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px',
        marginBottom: '20px', scrollbarWidth: 'none',
      }}>
        {CATEGORIAS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            style={{
              flexShrink: 0,
              padding: '7px 16px', borderRadius: '50px',
              fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s var(--ease-spring)',
              background: filtro === value ? 'var(--navy)' : '#fff',
              color: filtro === value ? '#fff' : 'var(--gray-500)',
              border: filtro === value ? '1.5px solid var(--navy)' : '1.5px solid var(--gray-200)',
              boxShadow: filtro === value ? '0 2px 10px rgba(30,58,95,0.2)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtradas.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 24px', textAlign: 'center',
            background: '#fff', borderRadius: '20px',
            border: '1px solid var(--gray-100)',
            boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--gray-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <MessageSquarePlus size={32} style={{ color: 'var(--gray-300)' }} />
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem',
              color: 'var(--gray-700)', marginBottom: '8px',
            }}>
              Nenhuma demanda ainda
            </h3>
            <p style={{
              fontSize: '0.9rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)',
              marginBottom: '24px', lineHeight: 1.6,
            }}>
              Seja o primeiro a registrar uma demanda para o seu condomínio.
            </p>
            <Link
              href="/nova-demanda"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--navy)', color: '#fff',
                padding: '12px 24px', borderRadius: '12px',
                fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                textDecoration: 'none',
              }}
            >
              Criar Primeira Demanda
            </Link>
          </div>
        ) : (
          filtradas.map((demanda) => (
            <DemandaCard
              key={demanda.id}
              demanda={demanda}
              onApoiar={handleApoiar}
              apoiando={apoiando === demanda.id}
              bloqueadoPorCiclo={
                !!demanda.ciclo_id &&
                !!cicloApoiadoMap[demanda.ciclo_id] &&
                cicloApoiadoMap[demanda.ciclo_id] !== demanda.id
              }
            />
          ))
        )}
      </div>

      {filtradas.length > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              fontSize: '0.8rem', color: 'var(--gray-400)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'color 0.2s',
            }}
          >
            {refreshing ? 'Atualizando...' : '↻ Atualizar lista'}
          </button>
        </div>
      )}
    </div>
  )
}
