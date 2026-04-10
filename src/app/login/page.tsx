'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2, Mail, Lock, User, Home, ChevronRight, Loader2,
  MapPin, Hash, ArrowLeft, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'entrar' | 'sindico' | 'morador'
type TipoCondominio = 'predio' | 'casas' | 'misto'

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="mb-5 p-3.5 rounded-xl text-sm"
      style={{
        background: '#fff5f5',
        border: '1px solid #fed7d7',
        color: '#c53030',
        fontFamily: 'var(--font-body)',
      }}
    >
      {message}
    </div>
  )
}

function SuccessScreen({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center text-center py-4 px-2">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'var(--mint-pale)', border: '3px solid var(--mint)' }}
      >
        <Check size={30} style={{ color: 'var(--mint-dark)' }} />
      </div>
      <h2
        className="text-2xl mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)' }}
      >
        {title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-body)' }}>
        {text}
      </p>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('entrar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')

  // Síndico — etapa
  const [sindicoStep, setSindicoStep] = useState<1 | 2>(1)
  const [sindicoNome, setSindicoNome] = useState('')
  const [sindicoEmail, setSindicoEmail] = useState('')
  const [sindicoSenha, setSindicoSenha] = useState('')
  const [condoNome, setCondoNome] = useState('')
  const [condoEndereco, setCondoEndereco] = useState('')
  const [condoCidade, setCondoCidade] = useState('')
  const [condoTipo, setCondoTipo] = useState<TipoCondominio>('predio')
  const [condoUnidades, setCondoUnidades] = useState('')

  // Morador
  const [moradorNome, setMoradorNome] = useState('')
  const [moradorEmail, setMoradorEmail] = useState('')
  const [moradorSenha, setMoradorSenha] = useState('')
  const [codigoConvite, setCodigoConvite] = useState('')
  const [moradorApartamento, setMoradorApartamento] = useState('')

  useEffect(() => {
    if (searchParams.get('erro') === 'acesso-negado') {
      setError('Seu acesso foi negado. Entre em contato com o administrador.')
    }
  }, [searchParams])

  function changeTab(t: Tab) {
    setTab(t)
    setError('')
    setSuccess(false)
    setSindicoStep(1)
  }

  // ─── Login ───────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginSenha,
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.')
      } else {
        setError('Erro ao entrar. Tente novamente.')
      }
      return
    }

    // Checar status do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user!.id)
      .single()

    setLoading(false)

    if (profile?.status === 'pendente') {
      router.push('/aguardando-aprovacao')
      return
    }
    if (profile?.status === 'rejeitado') {
      await supabase.auth.signOut()
      setError('Seu acesso foi negado. Entre em contato com o administrador.')
      return
    }

    router.push(profile?.role === 'sindico' ? '/dashboard' : '/demandas')
    router.refresh()
  }

  // ─── Síndico: etapa 1 ────────────────────────────────────────────────────
  function handleSindicoStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (sindicoSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSindicoStep(2)
  }

  // ─── Síndico: etapa 2 ────────────────────────────────────────────────────
  async function handleSindicoCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!condoUnidades || isNaN(Number(condoUnidades)) || Number(condoUnidades) < 1) {
      setError('Informe um número válido de unidades.')
      return
    }
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sindicoEmail,
      password: sindicoSenha,
      options: { data: { nome: sindicoNome } },
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('already registered')) {
        setError('Este email já está cadastrado.')
      } else if (authError.message.includes('Password')) {
        setError('A senha deve ter pelo menos 6 caracteres.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
      return
    }

    const userId = authData.user!.id

    // Criar condomínio
    const { data: condoData, error: condoError } = await supabase
      .from('condominios')
      .insert({
        nome: condoNome,
        endereco: condoEndereco,
        cidade: condoCidade,
        tipo: condoTipo,
        total_unidades: Number(condoUnidades),
        sindico_id: userId,
        status: 'pendente',
      })
      .select('id')
      .single()

    if (condoError) {
      setLoading(false)
      setError('Erro ao cadastrar condomínio. Tente novamente.')
      return
    }

    // Criar profile do síndico
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nome: sindicoNome,
        role: 'sindico',
        status: 'pendente',
        condominio_id: condoData.id,
      })

    setLoading(false)

    if (profileError) {
      setError('Erro ao criar perfil. Tente novamente.')
      return
    }

    setSuccess(true)
  }

  // ─── Morador ─────────────────────────────────────────────────────────────
  async function handleMoradorCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const codigo = codigoConvite.trim().toUpperCase()
    if (codigo.length !== 6) {
      setError('O código de convite deve ter 6 caracteres.')
      return
    }
    if (!moradorApartamento.trim()) {
      setError('Informe o número do apartamento.')
      return
    }

    setLoading(true)

    // Validar código de convite
    const { data: condo, error: condoError } = await supabase
      .from('condominios')
      .select('id, status')
      .eq('codigo_convite', codigo)
      .single()

    if (condoError || !condo) {
      setLoading(false)
      setError('Código de convite inválido. Verifique com o síndico do seu condomínio.')
      return
    }

    if (condo.status !== 'ativo') {
      setLoading(false)
      setError('Este condomínio ainda não está ativo. Tente mais tarde.')
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: moradorEmail,
      password: moradorSenha,
      options: { data: { nome: moradorNome } },
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('already registered')) {
        setError('Este email já está cadastrado.')
      } else if (authError.message.includes('Password')) {
        setError('A senha deve ter pelo menos 6 caracteres.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
      return
    }

    // Criar profile do morador
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        nome: moradorNome,
        role: 'morador',
        status: 'pendente',
        condominio_id: condo.id,
        apartamento: moradorApartamento.trim(),
      })

    setLoading(false)

    if (profileError) {
      setError('Erro ao criar perfil. Tente novamente.')
      return
    }

    setSuccess(true)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: 'entrar', label: 'Entrar' },
    { key: 'sindico', label: 'Sou Síndico' },
    { key: 'morador', label: 'Sou Morador' },
  ]

  const TIPOS: { key: TipoCondominio; label: string; emoji: string }[] = [
    { key: 'predio', label: 'Prédio', emoji: '🏢' },
    { key: 'casas', label: 'Casas', emoji: '🏡' },
    { key: 'misto', label: 'Misto', emoji: '🏘️' },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #f0f5ff 0%, #f8fafc 40%, #ffffff 100%)' }}
    >
      <div className="w-full max-w-[440px] animate-fadeUp">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
            style={{ background: 'var(--navy)', boxShadow: '0 8px 24px rgba(30,58,95,0.25)' }}
          >
            <Building2 size={30} color="white" />
          </div>
          <h1
            className="text-3xl text-center mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)' }}
          >
            CondomínioVoz
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--gray-500)' }}>
            A voz dos moradores, a decisão do síndico.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white overflow-hidden"
          style={{
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--gray-100)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {/* Tabs */}
          <div className="grid grid-cols-3" style={{ borderBottom: '1px solid var(--gray-100)' }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => changeTab(key)}
                className="py-4 text-xs font-semibold transition-colors"
                style={{
                  color: tab === key ? 'var(--navy)' : 'var(--gray-400)',
                  borderBottom: tab === key ? '2px solid var(--navy)' : '2px solid transparent',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-7">
            {/* Erro global */}
            {error && <ErrorBox message={error} />}

            {/* ── ENTRAR ── */}
            {tab === 'entrar' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div>
                  <label className="app-label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" className="app-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div>
                  <label className="app-label">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    <input type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} placeholder="••••••••" className="app-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : <><ChevronRight size={16} /> Entrar</>}
                </button>
              </form>
            )}

            {/* ── SOU SÍNDICO ── */}
            {tab === 'sindico' && !success && (
              <>
                {/* Indicador de etapas */}
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: sindicoStep >= step ? 'var(--navy)' : 'var(--gray-100)',
                          color: sindicoStep >= step ? '#fff' : 'var(--gray-400)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {sindicoStep > step ? <Check size={12} /> : step}
                      </div>
                      <span className="text-xs" style={{ color: sindicoStep >= step ? 'var(--navy)' : 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                        {step === 1 ? 'Seus dados' : 'Condomínio'}
                      </span>
                      {step < 2 && <div className="w-8 h-px" style={{ background: sindicoStep > step ? 'var(--navy)' : 'var(--gray-200)' }} />}
                    </div>
                  ))}
                </div>

                {sindicoStep === 1 ? (
                  <form onSubmit={handleSindicoStep1} className="flex flex-col gap-5">
                    <div>
                      <label className="app-label">Nome completo</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="text" required value={sindicoNome} onChange={(e) => setSindicoNome(e.target.value)} placeholder="Seu nome completo" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>
                    <div>
                      <label className="app-label">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="email" required value={sindicoEmail} onChange={(e) => setSindicoEmail(e.target.value)} placeholder="seu@email.com" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>
                    <div>
                      <label className="app-label">Senha</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="password" required minLength={6} value={sindicoSenha} onChange={(e) => setSindicoSenha(e.target.value)} placeholder="Mínimo 6 caracteres" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full mt-1">
                      <ChevronRight size={16} /> Continuar
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSindicoCadastro} className="flex flex-col gap-5">
                    <button
                      type="button"
                      onClick={() => { setSindicoStep(1); setError('') }}
                      className="flex items-center gap-1.5 text-sm self-start mb-1"
                      style={{ color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      <ArrowLeft size={14} /> Voltar
                    </button>

                    <div>
                      <label className="app-label">Nome do condomínio</label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="text" required value={condoNome} onChange={(e) => setCondoNome(e.target.value)} placeholder="Ex: Edifício Aurora" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>

                    <div>
                      <label className="app-label">Endereço completo</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="text" required value={condoEndereco} onChange={(e) => setCondoEndereco(e.target.value)} placeholder="Rua, número, bairro" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>

                    <div>
                      <label className="app-label">Cidade</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="text" required value={condoCidade} onChange={(e) => setCondoCidade(e.target.value)} placeholder="São Paulo" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>

                    <div>
                      <label className="app-label">Tipo de condomínio</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {TIPOS.map(({ key, label, emoji }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCondoTipo(key)}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              fontFamily: 'var(--font-body)',
                              background: condoTipo === key ? 'var(--navy-pale)' : 'var(--gray-50)',
                              border: condoTipo === key ? '2px solid var(--navy)' : '2px solid var(--gray-200)',
                              color: condoTipo === key ? 'var(--navy)' : 'var(--gray-500)',
                            }}
                          >
                            <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="app-label">Total de unidades</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                        <input type="number" required min={1} value={condoUnidades} onChange={(e) => setCondoUnidades(e.target.value)} placeholder="Ex: 48" className="app-input" style={{ paddingLeft: '44px' }} />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                      {loading
                        ? <><Loader2 size={16} className="animate-spin" /> Cadastrando...</>
                        : <><Check size={16} /> Cadastrar e Aguardar Aprovação</>}
                    </button>
                  </form>
                )}
              </>
            )}

            {tab === 'sindico' && success && (
              <SuccessScreen
                title="Cadastro recebido!"
                text="Você será notificado quando seu acesso for liberado. Em breve entraremos em contato para ativar seu condomínio no CondomínioVoz."
              />
            )}

            {/* ── SOU MORADOR ── */}
            {tab === 'morador' && !success && (
              <form onSubmit={handleMoradorCadastro} className="flex flex-col gap-5">
                <div>
                  <label className="app-label">Nome completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    <input type="text" required value={moradorNome} onChange={(e) => setMoradorNome(e.target.value)} placeholder="Seu nome completo" className="app-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>

                <div>
                  <label className="app-label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    <input type="email" required value={moradorEmail} onChange={(e) => setMoradorEmail(e.target.value)} placeholder="seu@email.com" className="app-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>

                <div>
                  <label className="app-label">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    <input type="password" required minLength={6} value={moradorSenha} onChange={(e) => setMoradorSenha(e.target.value)} placeholder="Mínimo 6 caracteres" className="app-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>

                {/* Código de convite em destaque */}
                <div>
                  <label className="app-label">
                    Código de convite
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--mint-dark)' }}>
                      (peça ao síndico)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={codigoConvite}
                    onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
                    placeholder="Ex: A3K9PX"
                    className="app-input text-center font-bold"
                    style={{
                      fontSize: '1.25rem',
                      letterSpacing: '0.25em',
                      border: '2px solid var(--mint)',
                      boxShadow: '0 0 0 4px rgba(16,185,129,0.08)',
                      paddingLeft: '16px',
                    }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--gray-400)', fontFamily: 'var(--font-body)' }}>
                    6 caracteres, letras e números. Você encontra esse código com o síndico.
                  </p>
                </div>

                <div>
                  <label className="app-label">Número do apartamento / casa</label>
                  <div className="relative">
                    <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    <input type="text" required value={moradorApartamento} onChange={(e) => setMoradorApartamento(e.target.value)} placeholder="Ex: 304" className="app-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Cadastrando...</>
                    : <><ChevronRight size={16} /> Cadastrar e Aguardar Aprovação</>}
                </button>
              </form>
            )}

            {tab === 'morador' && success && (
              <SuccessScreen
                title="Cadastro enviado!"
                text="O síndico do seu condomínio precisa aprovar seu acesso. Assim que for aprovado, entre novamente para acessar o app."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
