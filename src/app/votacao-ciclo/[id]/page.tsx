import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VotacaoCicloClient from './VotacaoCicloClient'

export default async function VotacaoCicloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, apartamento, condominio_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: ciclo } = await supabase
    .from('ciclos')
    .select('id, nome, fase, max_prioridades_por_voto, condominio_id, prazo_votacao')
    .eq('id', id)
    .single()

  if (!ciclo) notFound()
  if (ciclo.condominio_id !== profile.condominio_id) notFound()

  if (ciclo.fase !== 'votacao') {
    redirect('/demandas')
  }

  // Buscar demandas qualificadas para este ciclo
  const { data: demandasRows } = await supabase
    .from('demandas')
    .select('id, titulo, categoria, total_apoios, custo_estimado, descricao')
    .eq('ciclo_id', id)
    .eq('qualificada', true)
    .order('total_apoios', { ascending: false })

  const demandas = demandasRows ?? []

  // Verificar se este apartamento já votou
  const { data: votosExistentes } = await supabase
    .from('votos_prioridade')
    .select('demanda_id, posicao')
    .eq('ciclo_id', id)
    .eq('apartamento', profile.apartamento)
    .order('posicao', { ascending: true })

  const jaVotou = (votosExistentes ?? []).length > 0

  // Se já votou, buscar os títulos das demandas votadas
  let demandasVotadas: { id: string; titulo: string; categoria: string; posicao: number }[] = []
  if (jaVotou && votosExistentes && votosExistentes.length > 0) {
    const ids = votosExistentes.map((v) => v.demanda_id)
    const { data: rows } = await supabase
      .from('demandas')
      .select('id, titulo, categoria')
      .in('id', ids)
    const map = Object.fromEntries((rows ?? []).map((r) => [r.id, r]))
    demandasVotadas = votosExistentes.map((v) => ({
      ...map[v.demanda_id],
      posicao: v.posicao,
    }))
  }

  return (
    <VotacaoCicloClient
      ciclo={ciclo}
      demandas={demandas}
      apartamento={profile.apartamento ?? ''}
      jaVotou={jaVotou}
      demandasVotadas={demandasVotadas}
    />
  )
}
