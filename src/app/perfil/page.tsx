import { redirect } from 'next/navigation'
import { Mail, Home, Building2, ShieldCheck, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import LogoutButton from './LogoutButton'

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, apartamento, role, created_at, condominio_id')
    .eq('id', user.id)
    .single()

  const { data: condo } = await supabase
    .from('condominios')
    .select('nome')
    .eq('id', profile?.condominio_id)
    .single()

  const isSindico = profile?.role === 'sindico'

  const membroDesde = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  const iniciais = (profile?.nome ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p: string) => p[0].toUpperCase())
    .join('')

  const infoRows = [
    { Icon: Mail,      label: 'Email',         value: user.email ?? '—' },
    { Icon: Home,      label: 'Apartamento',   value: `Apto ${profile?.apartamento ?? '—'}` },
    { Icon: Building2, label: 'Condomínio',    value: condo?.nome ?? '—' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="max-w-lg mx-auto">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.375rem',
              color: 'var(--navy)',
            }}
          >
            Perfil
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Avatar + nome */}
        <div
          className="flex flex-col items-center gap-4 py-8"
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-100)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Avatar */}
          <div
            className="flex items-center justify-center text-white"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--navy)',
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 16px rgba(30,58,95,0.25)',
            }}
          >
            {iniciais}
          </div>

          {/* Nome */}
          <div className="text-center px-6">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                color: 'var(--navy)',
                lineHeight: 1.2,
              }}
            >
              {profile?.nome}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
              Membro desde {membroDesde}
            </p>
          </div>

          {/* Badge de role */}
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-body)',
              background: isSindico ? 'var(--navy-pale)' : 'var(--mint-pale)',
              color: isSindico ? 'var(--navy)' : 'var(--mint-dark)',
            }}
          >
            {isSindico ? <ShieldCheck size={14} /> : <User size={14} />}
            {isSindico ? 'Síndico' : 'Morador'}
          </span>
        </div>

        {/* Info rows */}
        <div
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-100)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          {/* Header da seção */}
          <div
            className="px-5 py-3"
            style={{ borderBottom: '1px solid var(--gray-100)' }}
          >
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              Informações
            </p>
          </div>

          {infoRows.map(({ Icon, label, value }, idx) => (
            <div
              key={label}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                borderBottom: idx < infoRows.length - 1 ? '1px solid var(--gray-100)' : 'none',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}
              >
                <Icon size={15} style={{ color: 'var(--gray-400)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                  {label}
                </p>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: 'var(--navy)',
                    fontFamily: 'var(--font-body)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <LogoutButton />
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
