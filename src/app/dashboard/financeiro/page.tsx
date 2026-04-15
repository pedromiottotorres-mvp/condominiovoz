import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import FinanceiroForm from './FinanceiroForm'
import FinanceiroGrafico from './FinanceiroGrafico'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, condominio_id').eq('id', user.id).single()
  if (profile?.role !== 'sindico') redirect('/demandas')

  const condoId = profile.condominio_id

  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()

  const [condoResult, mesAtualResult, historicoResult] = await Promise.all([
    supabase.from('condominios').select('nome').eq('id', condoId).single(),
    supabase.from('financeiro_mensal')
      .select('*')
      .eq('condominio_id', condoId)
      .eq('mes', mesAtual)
      .eq('ano', anoAtual)
      .maybeSingle(),
    supabase.from('financeiro_mensal')
      .select('*')
      .eq('condominio_id', condoId)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(12),
  ])

  const condoNome = condoResult.data?.nome ?? 'Condomínio'
  const dadosMes = mesAtualResult.data
  const historico = historicoResult.data ?? []

  const receita = dadosMes?.receita_condominial ?? 0
  const custos = dadosMes?.custos_fixos ?? 0
  const saldo = dadosMes?.saldo_investimento ?? (receita - custos)
  const saldoPositivo = saldo >= 0

  const mesBadge = format(now, "MMMM yyyy", { locale: ptBR })
    .replace(/^\w/, (c) => c.toUpperCase())

  const cardStyle = {
    background: '#fff', borderRadius: '20px',
    border: '1px solid var(--gray-100)',
    boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
    padding: '32px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)' }}>
      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid var(--gray-100)', padding: '20px 32px',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)' }}>
          Gestão Financeira
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
          {condoNome}
        </p>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px 60px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ══ CARD RESUMO — gradient ══ */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy-dark) 0%, var(--navy-light) 100%)',
          borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(30,58,95,0.25)',
        }}>
          {/* Decorativo */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />

          {/* Badge mês */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <span style={{
              padding: '5px 14px', borderRadius: '50px',
              background: 'rgba(255,255,255,0.15)',
              fontSize: '0.78rem', fontWeight: 600, color: '#fff',
              fontFamily: 'var(--font-body)',
            }}>
              {mesBadge}
            </span>
          </div>

          {/* 3 valores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Receita do mês
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: '#fff', lineHeight: 1.1 }}>
                {fmtBRL(receita)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Custos fixos
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: '#fca5a5', lineHeight: 1.1 }}>
                {fmtBRL(custos)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Para investimento
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: saldoPositivo ? '#6ee7b7' : '#fca5a5', lineHeight: 1.1 }}>
                {fmtBRL(saldo)}
              </p>
            </div>
          </div>

          {!dadosMes && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', marginTop: '16px', fontStyle: 'italic' }}>
              Nenhum dado registrado para este mês ainda.
            </p>
          )}
        </div>

        {/* ══ FORMULÁRIO ══ */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '24px' }}>
            Atualizar mês atual
          </h2>
          <FinanceiroForm
            condominioId={condoId}
            mes={mesAtual}
            ano={anoAtual}
            inicial={dadosMes ?? null}
          />
        </div>

        {/* ══ HISTÓRICO ══ */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '16px' }}>
            Histórico Financeiro
          </h2>

          {historico.length === 0 ? (
            <div style={{
              ...cardStyle, padding: '48px 32px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                Nenhum registro financeiro ainda.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop: tabela */}
              <div style={{ display: 'none' }} className="md-table">
                <div style={{
                  background: '#fff', borderRadius: '20px',
                  border: '1px solid var(--gray-100)',
                  boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
                  overflow: 'hidden',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        {['Mês/Ano', 'Receita', 'Custos', 'Saldo', 'Observações'].map((h) => (
                          <th key={h} style={{
                            padding: '12px 20px', textAlign: 'left',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)',
                            fontFamily: 'var(--font-body)', textTransform: 'uppercase',
                            letterSpacing: '0.05em', borderBottom: '1px solid var(--gray-100)',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((row, i) => {
                        const s = row.saldo_investimento ?? (row.receita_condominial - row.custos_fixos)
                        const pos = s >= 0
                        return (
                          <tr key={`${row.mes}-${row.ano}`} style={{ background: i % 2 === 0 ? '#fff' : 'var(--gray-50)' }}>
                            <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                              {MESES[row.mes - 1]} {row.ano}
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
                              {fmtBRL(row.receita_condominial)}
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
                              {fmtBRL(row.custos_fixos)}
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '0.875rem', fontWeight: 600, color: pos ? 'var(--mint-dark)' : '#dc2626', fontFamily: 'var(--font-body)' }}>
                              {fmtBRL(s)}
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', maxWidth: '180px' }}>
                              {row.observacoes ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile + fallback: cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historico.map((row) => {
                  const s = row.saldo_investimento ?? (row.receita_condominial - row.custos_fixos)
                  const pos = s >= 0
                  const ehMesAtual = row.mes === mesAtual && row.ano === anoAtual
                  return (
                    <div key={`${row.mes}-${row.ano}`} style={{
                      background: '#fff', borderRadius: '16px',
                      border: `1px solid ${ehMesAtual ? 'var(--navy)' : 'var(--gray-100)'}`,
                      boxShadow: '0 2px 8px rgba(15,36,64,0.05)',
                      padding: '18px 20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>
                            {MESES[row.mes - 1]} {row.ano}
                          </span>
                          {ehMesAtual && (
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '50px',
                              background: 'var(--navy-pale)', color: 'var(--navy)', fontFamily: 'var(--font-body)',
                            }}>
                              atual
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, color: pos ? 'var(--mint-dark)' : '#dc2626' }}>
                          {fmtBRL(s)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginBottom: '2px' }}>Receita</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>{fmtBRL(row.receita_condominial)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginBottom: '2px' }}>Custos</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626', fontFamily: 'var(--font-body)' }}>{fmtBRL(row.custos_fixos)}</p>
                        </div>
                      </div>
                      {row.observacoes && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--gray-100)' }}>
                          {row.observacoes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ══ GRÁFICO ══ */}
        {historico.length > 1 && (
          <FinanceiroGrafico dados={historico} />
        )}

      </main>
    </div>
  )
}
