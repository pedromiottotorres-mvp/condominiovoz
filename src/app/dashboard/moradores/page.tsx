import { redirect } from 'next/navigation'
import { Users, ShieldCheck, User, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import AprovarMoradorActions from '@/components/dashboard/AprovarMoradorActions'
import RemoverMoradorButton from '@/components/dashboard/RemoverMoradorButton'

const ROLE_LABEL: Record<string, string> = {
  morador: 'Morador',
  sindico: 'Síndico',
}

export default async function MoradoresPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condominio_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'sindico') redirect('/demandas')

  const condoId = profile.condominio_id

  const { data: todos } = await supabase
    .from('profiles')
    .select('id, nome, apartamento, role, status, criado_em, email')
    .eq('condominio_id', condoId)
    .order('criado_em', { ascending: true })

  const pendentes = (todos ?? []).filter((m) => m.status === 'pendente')
  const ativos = (todos ?? []).filter((m) => m.status === 'ativo')

  const cardStyle = {
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--gray-100)',
    boxShadow: 'var(--shadow-card)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--gray-100)', padding: '20px 24px' }}>
        <div className="flex items-center justify-between" style={{ maxWidth: '768px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)' }}>
              Moradores
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
              {ativos.length} {ativos.length === 1 ? 'morador ativo' : 'moradores ativos'}
              {pendentes.length > 0 && ` · ${pendentes.length} aguardando aprovação`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--mint-pale)' }}>
            <Users size={18} style={{ color: 'var(--mint-dark)' }} />
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-6 flex flex-col gap-5" style={{ maxWidth: '800px' }}>

        {/* ── Seção: Pendentes ── */}
        {pendentes.length > 0 && (
          <div
            style={{
              ...cardStyle,
              border: '1.5px solid var(--mint)',
              background: '#f0fdf9',
            }}
          >
            {/* Cabeçalho */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--mint-pale)' }}
              >
                <Clock size={15} style={{ color: 'var(--mint-dark)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--mint-dark)', fontFamily: 'var(--font-body)' }}>
                  Pendentes de Aprovação
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  {pendentes.length} {pendentes.length === 1 ? 'morador aguardando' : 'moradores aguardando'}
                </p>
              </div>
            </div>

            {/* Lista */}
            <div className="flex flex-col">
              {pendentes.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: idx < pendentes.length - 1 ? '1px solid rgba(16,185,129,0.10)' : 'none' }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--gray-300)' }}
                  >
                    {m.nome?.charAt(0).toUpperCase() ?? '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
                      {m.nome}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {m.apartamento && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                          Apto {m.apartamento}
                        </span>
                      )}
                      {m.email && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                          {m.email}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                        {m.criado_em
                          ? format(new Date(m.criado_em), "d 'de' MMM 'de' yyyy", { locale: ptBR })
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <AprovarMoradorActions moradorId={m.id} sindicoId={user.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Seção: Ativos ── */}
        {ativos.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={cardStyle}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--gray-100)' }}>
              <Users size={26} style={{ color: 'var(--gray-300)' }} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
              Nenhum morador ativo ainda.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', paddingLeft: '4px' }}>
              Moradores Ativos ({ativos.length})
            </p>

            {/* Tabela desktop */}
            <div className="hidden md:block overflow-hidden" style={cardStyle}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    {['Morador', 'Apto', 'Perfil', 'Cadastro', ''].map((col) => (
                      <th
                        key={col}
                        className="text-left px-5 py-3"
                        style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ativos.map((m, idx) => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: idx < ativos.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: m.role === 'sindico' ? 'var(--navy)' : 'var(--gray-300)' }}
                          >
                            {m.nome?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--gray-800)', fontFamily: 'var(--font-body)' }}>
                            {m.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
                        {m.apartamento}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            fontFamily: 'var(--font-body)',
                            background: m.role === 'sindico' ? 'var(--navy-pale)' : 'var(--gray-100)',
                            color: m.role === 'sindico' ? 'var(--navy)' : 'var(--gray-500)',
                          }}
                        >
                          {m.role === 'sindico' ? <ShieldCheck size={11} /> : <User size={11} />}
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--gray-400)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                        {m.criado_em
                          ? format(new Date(m.criado_em), 'd MMM yyyy', { locale: ptBR })
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {m.role !== 'sindico' && <RemoverMoradorButton moradorId={m.id} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="md:hidden flex flex-col gap-2">
              {ativos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-4"
                  style={cardStyle}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: m.role === 'sindico' ? 'var(--navy)' : 'var(--gray-300)' }}
                  >
                    {m.nome?.charAt(0).toUpperCase() ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
                      {m.nome}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                        Apto {m.apartamento}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          fontFamily: 'var(--font-body)',
                          background: m.role === 'sindico' ? 'var(--navy-pale)' : 'var(--gray-100)',
                          color: m.role === 'sindico' ? 'var(--navy)' : 'var(--gray-500)',
                        }}
                      >
                        {m.role === 'sindico' ? <ShieldCheck size={10} /> : <User size={10} />}
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                      {m.criado_em ? format(new Date(m.criado_em), 'd MMM yy', { locale: ptBR }) : '—'}
                    </p>
                    {m.role !== 'sindico' && <RemoverMoradorButton moradorId={m.id} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
