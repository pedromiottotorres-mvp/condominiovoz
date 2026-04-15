import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Vote, Clock, CheckCircle2, Wallet } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'

interface Votacao {
  id: string
  titulo: string
  prazo: string
  status: 'aberta' | 'encerrada'
  orcamento_estimado: number | null
  resultado: Record<string, number> | null
  resultado_parcial_visivel: boolean
  _votos_count: number
  _total_unidades: number
}

function ResultadoResumo({ resultado }: { resultado: Record<string, number> }) {
  const entries = Object.entries(resultado).filter(([k]) => k !== 'quorum')
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Sem votos</span>
  const [opcao, qtd] = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  return (
    <span style={{ fontSize: '0.8rem', color: 'var(--mint-dark)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
      {opcao}: {Math.round((qtd / total) * 100)}%
    </span>
  )
}

export default async function VotacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, condominio_id').eq('id', user.id).single()

  const isSindico = profile?.role === 'sindico'

  const { data: condoData } = await supabase
    .from('condominios').select('nome, total_unidades').eq('id', profile?.condominio_id).single()

  const { data: rows } = await supabase
    .from('votacoes')
    .select('id, titulo, prazo, status, orcamento_estimado, resultado, resultado_parcial_visivel')
    .eq('condominio_id', profile?.condominio_id)
    .order('created_at', { ascending: false })

  const ids = (rows ?? []).map((v) => v.id)
  const { data: contagens } = ids.length
    ? await supabase.from('votos').select('votacao_id').in('votacao_id', ids)
    : { data: [] }

  const contagemMap: Record<string, number> = {}
  ;(contagens ?? []).forEach(({ votacao_id }) => {
    contagemMap[votacao_id] = (contagemMap[votacao_id] ?? 0) + 1
  })

  const votacoes: Votacao[] = (rows ?? []).map((v) => ({
    ...v,
    resultado: v.resultado as Record<string, number> | null,
    _votos_count: contagemMap[v.id] ?? 0,
    _total_unidades: condoData?.total_unidades ?? 50,
  }))

  const abertas = votacoes.filter((v) => v.status === 'aberta')
  const encerradas = votacoes.filter((v) => v.status === 'encerrada')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '96px' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '16px 20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)', lineHeight: 1.2 }}>
              Votações
            </h1>
            {condoData?.nome && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                {condoData.nome}
              </p>
            )}
          </div>
          {isSindico && (
            <Link href="/dashboard/nova-votacao" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--navy)', color: '#fff',
              padding: '10px 20px', borderRadius: '12px',
              fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              textDecoration: 'none', boxShadow: '0 2px 10px rgba(30,58,95,0.2)',
            }}>
              <Plus size={15} strokeWidth={2.5} />
              Nova
            </Link>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Abertas */}
        <section>
          <p style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            fontFamily: 'var(--font-body)', marginBottom: '12px', paddingLeft: '4px',
          }}>
            Em andamento
          </p>
          {abertas.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '48px 24px', textAlign: 'center',
              background: '#fff', borderRadius: '20px', border: '1px solid var(--gray-100)',
              boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'var(--gray-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              }}>
                <Vote size={26} style={{ color: 'var(--gray-300)' }} />
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                Nenhuma votação em andamento
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {abertas.map((v) => <VotacaoCard key={v.id} votacao={v} />)}
            </div>
          )}
        </section>

        {encerradas.length > 0 && (
          <section>
            <p style={{
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              fontFamily: 'var(--font-body)', marginBottom: '12px', paddingLeft: '4px',
            }}>
              Encerradas
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {encerradas.map((v) => <VotacaoCard key={v.id} votacao={v} />)}
            </div>
          </section>
        )}
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}

function VotacaoCard({ votacao }: { votacao: Votacao }) {
  const encerrada = votacao.status === 'encerrada'
  const prazoPassado = isPast(new Date(votacao.prazo))
  const participacaoPct = Math.min(100, Math.round((votacao._votos_count / votacao._total_unidades) * 100))

  const prazoTexto = encerrada || prazoPassado
    ? `Encerrada ${formatDistanceToNow(new Date(votacao.prazo), { locale: ptBR, addSuffix: true })}`
    : `Encerra ${formatDistanceToNow(new Date(votacao.prazo), { locale: ptBR, addSuffix: true })}`

  return (
    <Link
      href={`/votacao/${votacao.id}`}
      style={{
        display: 'block', textDecoration: 'none',
        background: '#fff', borderRadius: '20px',
        border: '1px solid var(--gray-100)',
        boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
        padding: '20px 24px',
        transition: 'transform 0.25s var(--ease-spring), box-shadow 0.25s, border-color 0.25s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px rgba(15,36,64,0.12)'
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = ''
        ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 12px rgba(15,36,64,0.06)'
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--gray-100)'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '50px',
          fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          background: encerrada ? 'var(--gray-100)' : 'var(--mint-pale)',
          color: encerrada ? 'var(--gray-500)' : 'var(--mint-dark)',
        }}>
          {encerrada ? <CheckCircle2 size={11} /> : <Vote size={11} />}
          {encerrada ? 'Encerrada' : 'Em andamento'}
        </span>
      </div>

      {/* Título */}
      <h3 style={{
        fontFamily: 'var(--font-body)', fontWeight: 700,
        fontSize: '1rem', color: 'var(--navy)',
        lineHeight: 1.4, marginBottom: '12px',
      }}>
        {votacao.titulo}
      </h3>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-400)' }}>
          <Clock size={13} />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>{prazoTexto}</span>
        </div>
        {votacao.orcamento_estimado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={13} style={{ color: 'var(--mint-dark)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--mint-dark)', fontFamily: 'var(--font-body)' }}>
              {Number(votacao.orcamento_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        )}
      </div>

      {/* Participação */}
      <div>
        <div style={{ height: '6px', background: 'var(--gray-100)', borderRadius: '50px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{
            height: '100%', width: `${participacaoPct}%`, borderRadius: '50px',
            background: 'linear-gradient(90deg, var(--mint) 0%, var(--mint-dark) 100%)',
            transition: 'width 0.6s var(--ease-spring)',
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
            {votacao._votos_count} de {votacao._total_unidades} aptos votaram
          </span>
          {encerrada && votacao.resultado && <ResultadoResumo resultado={votacao.resultado} />}
        </div>
      </div>
    </Link>
  )
}
