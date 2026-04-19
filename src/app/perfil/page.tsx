import { redirect } from 'next/navigation'
import { Mail, Home, Building2, ShieldCheck, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import InstallCard from '@/components/InstallCard'
import LogoutButton from './LogoutButton'

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('nome, apartamento, role, criado_em, condominio_id').eq('id', user.id).single()

  const { data: condo } = await supabase
    .from('condominios').select('nome').eq('id', profile?.condominio_id).single()

  const isSindico = profile?.role === 'sindico'

  const membroDesde = profile?.criado_em
    ? format(new Date(profile.criado_em), "MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  const iniciais = (profile?.nome ?? '?')
    .split(' ').slice(0, 2).map((p: string) => p[0].toUpperCase()).join('')

  const infoRows = [
    { Icon: Mail,      label: 'Email',       value: user.email ?? '—' },
    ...(profile?.apartamento ? [{ Icon: Home, label: 'Apartamento', value: `Apto ${profile.apartamento}` }] : []),
    { Icon: Building2, label: 'Condomínio',  value: condo?.nome ?? '—' },
    { Icon: isSindico ? ShieldCheck : User, label: 'Função', value: isSindico ? 'Síndico' : 'Morador' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #faf9f7 0%, var(--gray-50) 100%)', paddingBottom: '96px' }}>
      {/* Decorative */}
      <div style={{
        position: 'fixed', top: '-60px', right: '-60px', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, zIndex: 40, padding: '16px 20px',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--navy)' }}>
            Perfil
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Avatar card */}
        <div style={{
          background: '#fff', borderRadius: '24px',
          border: '1px solid var(--gray-100)',
          boxShadow: '0 4px 20px rgba(15,36,64,0.08)',
          padding: '40px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%',
            background: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff',
            boxShadow: '0 8px 24px rgba(30,58,95,0.3)',
          }}>
            {iniciais}
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--navy)', lineHeight: 1.2, marginTop: '4px', textAlign: 'center' }}>
            {profile?.nome}
          </h2>

          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontFamily: 'var(--font-body)', marginTop: '-4px' }}>
            Membro desde {membroDesde}
          </p>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 16px', borderRadius: '50px',
            fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
            background: isSindico ? 'var(--navy-pale)' : 'var(--mint-pale)',
            color: isSindico ? 'var(--navy)' : 'var(--mint-dark)',
          }}>
            {isSindico ? <ShieldCheck size={14} /> : <User size={14} />}
            {isSindico ? 'Síndico' : 'Morador'}
          </span>
        </div>

        {/* Info rows */}
        <div style={{
          background: '#fff', borderRadius: '20px',
          border: '1px solid var(--gray-100)',
          boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              Informações
            </p>
          </div>

          {infoRows.map(({ Icon, label, value }, idx) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
              borderBottom: idx < infoRows.length - 1 ? '1px solid var(--gray-100)' : 'none',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--gray-50)', border: '1px solid var(--gray-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} style={{ color: 'var(--gray-300)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>
                  {label}
                </p>
                <p style={{
                  fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-body)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Instalar PWA */}
        <InstallCard />

        {/* Logout */}
        <LogoutButton />
      </main>

      <BottomNav isSindico={isSindico} />
    </div>
  )
}
