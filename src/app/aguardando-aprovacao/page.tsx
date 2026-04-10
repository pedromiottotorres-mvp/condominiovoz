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
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gray-50)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-navy border-t-transparent animate-spin" style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #f0f5ff 0%, #f8fafc 40%, #ffffff 100%)' }}
    >
      <div className="w-full max-w-[440px] animate-fadeUp flex flex-col items-center text-center">
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          style={{ background: 'var(--navy)', boxShadow: '0 8px 24px rgba(30,58,95,0.25)' }}
        >
          <Building2 size={26} color="white" />
        </div>

        {/* Ícone de relógio */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'var(--mint-pale)', border: '3px solid var(--mint)' }}
        >
          <Clock size={36} style={{ color: 'var(--mint-dark)' }} />
        </div>

        <h1
          className="text-3xl mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)' }}
        >
          Aguardando aprovação
        </h1>

        <p
          className="text-base mb-8 leading-relaxed"
          style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)', maxWidth: '360px' }}
        >
          {role === 'sindico'
            ? 'Seu cadastro foi recebido. Em breve entraremos em contato para validar e ativar seu acesso ao CondomínioVoz.'
            : 'Seu cadastro foi enviado para o síndico do seu condomínio. Assim que ele aprovar, você terá acesso completo ao feed de demandas e votações.'}
        </p>

        {/* Card informativo */}
        <div
          className="w-full mb-8 p-5 text-left"
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-100)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--navy)', fontFamily: 'var(--font-body)' }}
          >
            {role === 'sindico' ? 'O que acontece agora?' : 'Próximos passos'}
          </p>
          <ul className="flex flex-col gap-2">
            {role === 'sindico' ? (
              <>
                <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>1.</span>
                  Nossa equipe analisa os dados do seu condomínio.
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>2.</span>
                  Após validação, seu acesso é ativado automaticamente.
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>3.</span>
                  Você recebe o código de convite para compartilhar com os moradores.
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>1.</span>
                  O síndico do seu condomínio recebe sua solicitação de acesso.
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>2.</span>
                  Após a aprovação, você terá acesso ao app completo.
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>3.</span>
                  Entre novamente para acessar o feed de demandas e votações.
                </li>
              </>
            )}
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--gray-400)', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
