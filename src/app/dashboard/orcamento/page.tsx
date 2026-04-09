import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SimuladorOrcamento from './SimuladorOrcamento'

export default async function OrcamentoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condominio_id')
    .eq('id', user.id)
    .single()

  const condoId = profile?.condominio_id

  // Demandas aprovadas ou abertas, ordenadas por apoios
  const { data: demandas } = await supabase
    .from('demandas')
    .select('id, titulo, categoria, status, total_apoios')
    .eq('condominio_id', condoId)
    .in('status', ['aprovada', 'aberta'])
    .order('total_apoios', { ascending: false })

  // Itens de orçamento já salvos para pré-popular custos
  const { data: itensSalvos } = await supabase
    .from('orcamento_itens')
    .select('demanda_id, custo_estimado, aprovado, prioridade')
    .eq('condominio_id', condoId)

  return (
    <SimuladorOrcamento
      condoId={condoId}
      demandas={demandas ?? []}
      itensSalvos={itensSalvos ?? []}
    />
  )
}
