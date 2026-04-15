'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Building2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AguardandoAprovacaoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [role, setRole] = useState<'sindico' | 'morador' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (profile?.status === 'ativo') {
        router.push(profile.role === 'sindico' ? '/dashboard' : '/demandas')
        return
      }
      setRole(profile?.role ?? 'morador')
      setLoading(false)
    }
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #faf9f7 0%, #ffffff 60%)',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid var(--navy)', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const PASSOS_SINDICO = [
    'Analisamos os dados do seu condomínio',
    'Ativamos seu acesso na plataforma',
    'Você recebe o código de convite para os moradores',
  ]
  const PASSOS_MORADOR = [
    'O síndico recebe sua solicitação de acesso',
    'Ele confirma seus dados e apartamento',
    'Seu acesso é liberado automaticamente',
  ]
  const passos = role === 'sindico' ? PASSOS_SINDICO : PASSOS_MORADOR

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(160deg, #faf9f7 0%, #ffffff 60%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'fixed', top: '-80px', right: '-80px', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-120px', left: '-120px', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(30,58,95,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '520px', position: 'relative',
        animation: 'fadeUp 0.5s var(--ease-spring) both',
      }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 16px 48px rgba(15,36,64,0.12)',
          padding: '56px 48px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(30,58,95,0.25)',
            marginBottom: '28px',
          }}>
            <Building2 size={22} color="#fff" />
          </div>

          {/* Clock icon with pulse */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'var(--mint-pale)',
            border: '3px solid var(--mint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '28px',
            animation: 'pulseRing 3s ease-in-out infinite',
          }}>
            <Clock size={40} style={{ color: 'var(--mint-dark)' }} />
          </div>

          <style>{`
            @keyframes pulseRing {
              0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0.2); }
              50% { transform: scale(1.04); box-shadow: 0 0 0 10px rgba(16,185,129,0); }
            }
          `}</style>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.9rem',
            color: 'var(--navy)', marginBottom: '12px', lineHeight: 1.2,
          }}>
            Aguardando aprovação
          </h1>

          <p style={{
            color: 'var(--gray-500)', fontFamily: 'var(--font-body)',
            fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '380px', marginBottom: '32px',
          }}>
            {role === 'sindico'
              ? 'Seu cadastro foi recebido. Em breve validaremos os dados e ativaremos seu acesso ao CondomínioVoz.'
              : 'O síndico do seu condomínio precisa aprovar seu cadastro. Você terá acesso completo assim que for aprovado.'}
          </p>

          {/* Steps card */}
          <div style={{
            width: '100%', background: 'var(--gray-50)',
            borderRadius: '16px', padding: '24px',
            textAlign: 'left', marginBottom: '32px',
          }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem',
              color: 'var(--navy)', marginBottom: '16px',
            }}>
              O que acontece agora?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {passos.map((passo, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--navy)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)',
                  }}>
                    {i + 1}
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                    color: 'var(--gray-600)', lineHeight: 1.5, paddingTop: '4px',
                  }}>
                    {passo}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.875rem', color: 'var(--gray-400)',
              fontFamily: 'var(--font-body)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gray-600)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gray-400)')}
          >
            <LogOut size={15} />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
